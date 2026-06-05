'use strict';

const pool = require('../config/db');
const groq = require('./groq.service');
const notificationService = require('./notification.service');
const { NOTIFICATION_TYPES, REFERENCE_TYPES } = require('../constants/notification.constants');
const {
  DISEASE_SYSTEM_PROMPT,
  CHAT_SYSTEM_PROMPT,
  MAX_IMAGE_BYTES,
  ALLOWED_MIME,
} = require('../constants/ai.constants');

function parseConfidence(value) {
  if (value == null || value === '') return null;
  const n = parseFloat(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
}

function extractJson(text) {
  const trimmed = String(text).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) {
      throw Object.assign(new Error('AI উত্তর পার্স করা যায়নি'), { statusCode: 502 });
    }
    return JSON.parse(match[0]);
  }
}

function validateImageInput(base64, mimeType) {
  if (!base64 || !mimeType) {
    throw Object.assign(new Error('ছবি ও MIME টাইপ আবশ্যক'), { statusCode: 400 });
  }
  if (!ALLOWED_MIME.has(mimeType.toLowerCase())) {
    throw Object.assign(new Error('শুধু JPEG, PNG, WebP বা GIF অনুমোদিত'), { statusCode: 400 });
  }
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  const approxBytes = Math.ceil((raw.length * 3) / 4);
  if (approxBytes > MAX_IMAGE_BYTES) {
    throw Object.assign(new Error('ছবির সাইজ ৪MB এর কম হতে হবে'), { statusCode: 400 });
  }
  return raw;
}

function normalizePrediction(parsed) {
  return {
    disease: parsed.disease?.trim() || 'অজানা',
    confidence: parseConfidence(parsed.confidence),
    problem: parsed.problem?.trim() || '',
    cause: parsed.cause?.trim() || '',
    solution: parsed.solution?.trim() || '',
    prevention: parsed.prevention?.trim() || '',
    medicine: parsed.medicine?.trim() || '',
  };
}

async function analyzeImage(userId, { image, mime_type, prompt }, io = null) {
  const base64 = validateImageInput(image, mime_type);
  const userText =
    prompt?.trim() ||
    'এই ছবিতে ফসল বা গাছের কোনো রোগ বা সমস্যা আছে কিনা বিশ্লেষণ করুন।';

  const { content } = await groq.visionAnalyze(
    DISEASE_SYSTEM_PROMPT,
    userText,
    mime_type,
    base64
  );

  const parsed = normalizePrediction(extractJson(content));
  const imageStored = `data:${mime_type};base64,${base64}`;

  const saved = await savePrediction(userId, {
    image: imageStored,
    ...parsed,
    ai_response: { ...parsed, raw: content },
  });

  const notif = await notificationService.create({
    userId,
    type: NOTIFICATION_TYPES.AI_ANALYSIS_COMPLETE,
    title: 'AI বিশ্লেষণ সম্পন্ন',
    message: parsed.disease,
    referenceId: saved.id,
    referenceType: REFERENCE_TYPES.SYSTEM,
  });
  await notificationService.deliver(io, notif);

  return { prediction: saved, analysis: parsed };
}

async function savePrediction(userId, data) {
  const { rows } = await pool.query(
    `INSERT INTO disease_predictions (
       user_id, image, disease_name, confidence,
       problem, cause, solution, prevention, medicine, ai_response
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      userId,
      data.image ?? null,
      data.disease ?? data.disease_name ?? null,
      data.confidence ?? null,
      data.problem ?? null,
      data.cause ?? null,
      data.solution ?? null,
      data.prevention ?? null,
      data.medicine ?? null,
      data.ai_response ? JSON.stringify(data.ai_response) : null,
    ]
  );
  return formatPrediction(rows[0]);
}

async function getPredictionHistory(userId, { page = 1, limit = 20, search, from, to } = {}) {
  limit = Math.min(Math.max(+limit || 20, 1), 50);
  const offset = (page - 1) * limit;
  const conditions = ['user_id = $1'];
  const params = [userId];
  let pi = 2;

  if (search?.trim()) {
    conditions.push(`disease_name ILIKE $${pi++}`);
    params.push(`%${search.trim()}%`);
  }
  if (from) {
    conditions.push(`created_at >= $${pi++}::date`);
    params.push(from);
  }
  if (to) {
    conditions.push(`created_at < ($${pi++}::date + interval '1 day')`);
    params.push(to);
  }

  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT id, user_id, disease_name, confidence, problem, cause, solution,
            prevention, medicine, created_at,
            CASE WHEN length(image) > 200 THEN left(image, 80) || '...' ELSE image END AS image_thumb
       FROM disease_predictions
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${pi++} OFFSET $${pi}`,
    params
  );

  const countParams = params.slice(0, -2);
  const { rows: countRows } = await pool.query(
    `SELECT COUNT(*)::int AS total FROM disease_predictions WHERE ${conditions.join(' AND ')}`,
    countParams
  );

  return {
    predictions: rows.map(formatPrediction),
    pagination: { page, limit, total: countRows[0]?.total ?? 0 },
  };
}

async function getPredictionById(userId, id, { includeImage = true } = {}) {
  const { rows } = await pool.query(
    `SELECT * FROM disease_predictions WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  if (!rows[0]) {
    throw Object.assign(new Error('বিশ্লেষণ পাওয়া যায়নি'), { statusCode: 404 });
  }
  const row = formatPrediction(rows[0]);
  if (!includeImage) {
    delete row.image;
  }
  return row;
}

async function chat(userId, { messages, image, mime_type, prompt }) {
  if (!Array.isArray(messages)) {
    throw Object.assign(new Error('messages অ্যারে আবশ্যক'), { statusCode: 400 });
  }

  const history = messages
    .filter((m) => m.role && m.content)
    .slice(-12)
    .map((m) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

  const userText =
    prompt?.trim() ||
    (image ? 'এই ছবিতে কী সমস্যা দেখছেন? রোগ ও সমাধান বলুন।' : '');

  if (!userText && !image) {
    throw Object.assign(new Error('বার্তা বা ছবি আবশ্যক'), { statusCode: 400 });
  }

  let base64 = null;
  if (image) {
    base64 = validateImageInput(image, mime_type);
  }

  const { content } = await groq.visionChat(
    CHAT_SYSTEM_PROMPT,
    history,
    userText,
    mime_type,
    base64
  );

  return { reply: content };
}

function formatPrediction(row) {
  if (!row) return null;
  let ai_response = row.ai_response;
  if (typeof ai_response === 'string') {
    try {
      ai_response = JSON.parse(ai_response);
    } catch {
      ai_response = null;
    }
  }
  return {
    id: row.id,
    user_id: row.user_id,
    image: row.image,
    image_thumb: row.image_thumb,
    disease_name: row.disease_name,
    disease: row.disease_name,
    confidence: row.confidence != null ? parseFloat(row.confidence) : null,
    problem: row.problem,
    cause: row.cause,
    solution: row.solution,
    prevention: row.prevention,
    medicine: row.medicine,
    ai_response,
    created_at: row.created_at,
  };
}

module.exports = {
  analyzeImage,
  savePrediction,
  getPredictionHistory,
  getPredictionById,
  chat,
  validateImageInput,
  normalizePrediction,
};
