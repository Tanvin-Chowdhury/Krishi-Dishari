/** Shared chat helpers — ID normalization and message de-duplication. */

/** Normalize API conversation shape (other_photo / other_user_avatar). */
export function normalizeConversation(conv) {
  if (!conv) return conv;
  const photo = conv.other_photo ?? conv.other_user_avatar ?? null;
  return {
    ...conv,
    other_id: conv.other_id ?? conv.other_user_id,
    other_name: conv.other_name ?? conv.other_user_name,
    other_photo: photo,
    other_user_id: conv.other_user_id ?? conv.other_id,
    other_user_name: conv.other_user_name ?? conv.other_name,
    other_user_avatar: photo,
  };
}

export function sameId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

export function messageId(msg) {
  return msg?.message_id ?? msg?.id;
}

export function upsertMessage(prev, incoming) {
  const id = messageId(incoming);
  if (id && prev.some((m) => sameId(messageId(m), id))) return prev;

  const content = incoming.content || incoming.message;
  const optIdx = prev.findIndex(
    (m) =>
      m._optimistic &&
      sameId(m.sender_id, incoming.sender_id) &&
      (m.content || m.message) === content
  );
  if (optIdx >= 0) {
    const next = [...prev];
    next[optIdx] = incoming;
    return next;
  }

  return [...prev, incoming];
}

export function mergeConversation(prev, incoming) {
  const conv = normalizeConversation(incoming);
  const convId = conv?.conversation_id;
  if (!convId) return prev;

  const idx = prev.findIndex((c) => sameId(c.conversation_id, convId));
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = { ...next[idx], ...conv };
    return next.sort(
      (a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
    );
  }

  return [conv, ...prev].sort(
    (a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0)
  );
}
