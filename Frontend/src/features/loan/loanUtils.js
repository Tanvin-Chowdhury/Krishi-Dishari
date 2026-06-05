export const bn = (n) => Number(n ?? 0).toLocaleString('bn-BD');

export const bnDate = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const APP_STATUS = {
  pending: { label: 'অপেক্ষমাণ', color: 'bg-amber-100 text-amber-800' },
  under_review: { label: 'পর্যালোচনাধীন', color: 'bg-blue-100 text-blue-800' },
  approved: { label: 'অনুমোদিত', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'প্রত্যাখ্যান', color: 'bg-red-100 text-red-800' },
};

export const PAY_STATUS = {
  success: { label: 'সফল', color: 'text-emerald-700 bg-emerald-50' },
  processing: { label: 'প্রক্রিয়াধীন', color: 'text-amber-700 bg-amber-50' },
  failed: { label: 'ব্যর্থ', color: 'text-red-700 bg-red-50' },
};

export const INST_STATUS = {
  pending: { label: 'বাকি', color: 'bg-slate-100 text-slate-600' },
  paid: { label: 'পরিশোধিত', color: 'bg-emerald-100 text-emerald-700' },
  overdue: { label: 'বিলম্বিত', color: 'bg-red-100 text-red-700' },
};

export const LOAN_STATE = {
  active: { label: 'সক্রিয়', color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  due_soon: { label: 'শীঘ্রই দেয়', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  overdue: { label: 'বকেয়া', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  completed: { label: 'সম্পন্ন', color: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
};

export const ROLE_LABEL = {
  1: 'কৃষক',
  2: 'পাইকার',
  3: 'পরামর্শদাতা',
  4: 'শ্রমিক',
  5: 'গুদাম মালিক',
  6: 'অ্যাডমিন',
};

export const monthLabel = (ym) => {
  if (!ym) return '—';
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString('bn-BD', {
    month: 'short',
    year: 'numeric',
  });
};

export async function fileToDataUrl(file, maxKb = 800) {
  if (!file) return null;
  if (file.size > maxKb * 1024) {
    throw new Error(`ফাইল ${maxKb}KB এর ছোট হতে হবে`);
  }
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(file.type)) {
    throw new Error('JPEG, PNG, WebP বা PDF অনুমোদিত');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
