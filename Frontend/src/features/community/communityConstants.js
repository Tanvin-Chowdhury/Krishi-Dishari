export const POST_TYPES = [
  { value: 'question', label: 'প্রশ্ন', color: 'bg-blue-100 text-blue-800' },
  { value: 'disease_issue', label: 'রোগ সমস্যা', color: 'bg-red-100 text-red-800' },
  { value: 'success_story', label: 'সাফল্যের গল্প', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'discussion', label: 'আলোচনা', color: 'bg-slate-100 text-slate-700' },
];

/** Composer shortcuts for consultants */
export const COMPOSER_TYPES = [
  { value: 'discussion', label: 'পরামর্শ', icon: '💡' },
  { value: 'disease_issue', label: 'রোগ সমাধান', icon: '🩺' },
  { value: 'success_story', label: 'কৃষি টিপস', icon: '🌱' },
  { value: 'discussion', label: 'আলোচনা', icon: '💬', key: 'discussion-alt' },
];

export const ROLE_BADGES = {
  1: { label: 'কৃষক', emoji: '🌱', className: 'bg-emerald-50 text-emerald-800' },
  2: { label: 'পাইকার', emoji: '🏪', className: 'bg-blue-50 text-blue-800' },
  3: { label: 'বিশেষজ্ঞ', emoji: '🎓', className: 'bg-amber-50 text-amber-900' },
  4: { label: 'শ্রমিক', emoji: '👷', className: 'bg-orange-50 text-orange-900' },
  5: { label: 'গুদাম', emoji: '🏭', className: 'bg-violet-50 text-violet-800' },
  6: { label: 'অ্যাডমিন', emoji: '⚙️', className: 'bg-slate-100 text-slate-700' },
};

export function roleBadge(roleId) {
  return ROLE_BADGES[roleId] || ROLE_BADGES[1];
}

export const HELP_FILTERS = [
  { value: '', label: 'সব' },
  { value: 'needs_expert', label: 'বিশেষজ্ঞ দরকার' },
  { value: 'unanswered', label: 'উত্তরহীন' },
  { value: 'urgent', label: 'জরুরি' },
];

export function postTypeMeta(type) {
  return POST_TYPES.find((t) => t.value === type) || POST_TYPES[3];
}

/** Default DB tag name per post_type (must match post_tags.tag_name) */
export const POST_TYPE_TAG_NAMES = {
  question: 'প্রশ্ন',
  disease_issue: 'কীট ও রোগ',
  success_story: 'সাফল্যের গল্প',
  discussion: 'আলোচনা',
};

export function tagIdForPostType(tags, postType) {
  const name = POST_TYPE_TAG_NAMES[postType];
  if (!name || !tags?.length) return '';
  const found = tags.find((t) => t.tag_name === name);
  return found ? String(found.tag_id) : '';
}

/** Legacy English tag names → Bengali (until DB migration applied) */
const TAG_LABELS = {
  'Crop Tips': 'কৃষি টিপস',
  Question: 'প্রশ্ন',
  'Market Insight': 'বাজার বিশ্লেষণ',
  'Pest & Disease': 'কীট ও রোগ',
  Weather: 'আবহাওয়া',
  Financing: 'অর্থায়ন',
  General: 'সাধারণ',
};

export function tagLabel(name) {
  if (!name) return '';
  return TAG_LABELS[name] || name;
}

export function bnDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'এখন';
  if (m < 60) return `${m} মি আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ঘণ্টা আগে`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} দিন আগে`;
  return bnDate(d);
}
