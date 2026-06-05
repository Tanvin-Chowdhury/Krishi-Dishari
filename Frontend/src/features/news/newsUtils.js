/** Shared news display helpers */

export const CATEGORY_STYLES = {
  farming_news: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  crop_disease: 'bg-red-50 text-red-700 ring-red-200/80',
  weather_alert: 'bg-sky-50 text-sky-800 ring-sky-200/80',
  market_price: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  government_notice: 'bg-blue-50 text-blue-800 ring-blue-200/80',
  fertilizer_seed: 'bg-lime-50 text-lime-800 ring-lime-200/80',
  technology: 'bg-violet-50 text-violet-800 ring-violet-200/80',
  expert_advice: 'bg-indigo-50 text-indigo-800 ring-indigo-200/80',
  success_story: 'bg-teal-50 text-teal-800 ring-teal-200/80',
  training: 'bg-orange-50 text-orange-800 ring-orange-200/80',
  crop_price: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  pest: 'bg-red-50 text-red-700 ring-red-200/80',
  fertilizer: 'bg-lime-50 text-lime-800 ring-lime-200/80',
  government: 'bg-blue-50 text-blue-800 ring-blue-200/80',
  market: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  general: 'bg-slate-100 text-slate-700 ring-slate-200/80',
};

export const STATUS_LABELS = {
  draft: { label: 'খসড়া', color: 'bg-slate-100 text-slate-700' },
  pending_review: { label: 'পর্যালোচনাধীন', color: 'bg-amber-100 text-amber-800' },
  published: { label: 'প্রকাশিত', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'প্রত্যাখ্যাত', color: 'bg-red-100 text-red-800' },
};

export function formatNewsDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function shareNews(article) {
  const url = `${window.location.origin}/app/news/${article.slug}`;
  if (navigator.share) {
    navigator.share({ title: article.title, text: article.summary, url }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url);
  }
}

/** Category pools — kept in sync with Backend/utils/newsImages.js */
const CATEGORY_IMAGES = {
  farming_news: [
    'https://picsum.photos/seed/kd-farm-1/800/450',
    'https://picsum.photos/seed/kd-farm-2/800/450',
    'https://picsum.photos/seed/kd-farm-3/800/450',
    'https://picsum.photos/seed/kd-rice-1/800/450',
    'https://picsum.photos/seed/kd-field-1/800/450',
  ],
  crop_disease: [
    'https://picsum.photos/seed/kd-crop-disease-1/800/450',
    'https://picsum.photos/seed/kd-crop-disease-2/800/450',
    'https://picsum.photos/seed/kd-plant-leaf-1/800/450',
  ],
  pest: [
    'https://picsum.photos/seed/kd-pest-1/800/450',
    'https://picsum.photos/seed/kd-pest-2/800/450',
  ],
  weather_alert: [
    'https://picsum.photos/seed/kd-rain-1/800/450',
    'https://picsum.photos/seed/kd-storm-1/800/450',
    'https://picsum.photos/seed/kd-cloud-1/800/450',
  ],
  market_price: [
    'https://picsum.photos/seed/kd-market-1/800/450',
    'https://picsum.photos/seed/kd-vegetable-1/800/450',
  ],
  crop_price: [
    'https://picsum.photos/seed/kd-price-1/800/450',
    'https://picsum.photos/seed/kd-harvest-1/800/450',
  ],
  market: [
    'https://picsum.photos/seed/kd-bazaar-1/800/450',
    'https://picsum.photos/seed/kd-market-2/800/450',
  ],
  government_notice: [
    'https://picsum.photos/seed/kd-gov-1/800/450',
    'https://picsum.photos/seed/kd-office-1/800/450',
  ],
  government: ['https://picsum.photos/seed/kd-gov-2/800/450'],
  fertilizer_seed: [
    'https://picsum.photos/seed/kd-seed-1/800/450',
    'https://picsum.photos/seed/kd-fertilizer-1/800/450',
  ],
  fertilizer: ['https://picsum.photos/seed/kd-fertilizer-2/800/450'],
  technology: [
    'https://picsum.photos/seed/kd-tech-1/800/450',
    'https://picsum.photos/seed/kd-drone-1/800/450',
  ],
  expert_advice: [
    'https://picsum.photos/seed/kd-expert-1/800/450',
    'https://picsum.photos/seed/kd-farmer-1/800/450',
  ],
  success_story: [
    'https://picsum.photos/seed/kd-success-1/800/450',
    'https://picsum.photos/seed/kd-harvest-2/800/450',
  ],
  training: ['https://picsum.photos/seed/kd-training-1/800/450'],
  general: [
    'https://picsum.photos/seed/kd-news-1/800/450',
    'https://picsum.photos/seed/kd-news-2/800/450',
  ],
};

function hashSeed(str) {
  const s = String(str ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function isUsableExternalUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const u = url.trim();
  if (!/^https?:\/\/.+/i.test(u)) return false;
  if (u.includes('picsum.photos/seed/kd-')) return true;
  if (u.includes('images.unsplash.com') && !u.includes('ixlib=')) return false;
  return true;
}

function pickCategoryImage(article) {
  const pool = CATEGORY_IMAGES[article?.category] || CATEGORY_IMAGES.farming_news;
  const seed = article?.id ?? article?.news_id ?? article?.slug ?? article?.title ?? 'news';
  return pool[hashSeed(seed) % pool.length];
}

/** Stable varied cover per article (category + id/slug). */
export function getNewsCoverImage(article) {
  if (!article) return CATEGORY_IMAGES.farming_news[0];
  const raw = article.cover_image_url?.trim();
  if (raw && isUsableExternalUrl(raw)) return raw;
  return pickCategoryImage(article);
}

/** @deprecated use getNewsCoverImage */
export const PLACEHOLDER_IMAGE = CATEGORY_IMAGES.farming_news[0];

export { pickCategoryImage };
