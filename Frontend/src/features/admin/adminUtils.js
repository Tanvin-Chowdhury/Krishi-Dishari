export const ROLES = {
  1: { label: 'কৃষক', color: 'bg-emerald-100 text-emerald-800' },
  2: { label: 'পাইকার', color: 'bg-blue-100 text-blue-800' },
  3: { label: 'পরামর্শদাতা', color: 'bg-violet-100 text-violet-800' },
  4: { label: 'শ্রমিক', color: 'bg-amber-100 text-amber-800' },
  5: { label: 'গুদাম মালিক', color: 'bg-cyan-100 text-cyan-800' },
  6: { label: 'অ্যাডমিন', color: 'bg-slate-800 text-white' },
};

export const AUCTION_STATUS = {
  1: { label: 'অপেক্ষমাণ', color: 'bg-amber-100 text-amber-800' },
  2: { label: 'সক্রিয়', color: 'bg-emerald-100 text-emerald-800' },
  3: { label: 'সম্পন্ন', color: 'bg-blue-100 text-blue-800' },
  4: { label: 'বাতিল', color: 'bg-red-100 text-red-800' },
};

export function bn(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('bn-BD');
}

export function bnDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const ADMIN_NAV = [
  { path: '/app/admin', label: 'ড্যাশবোর্ড', end: true },
  { path: '/app/admin/users', label: 'ব্যবহারকারী' },
  { path: '/app/admin/auctions', label: 'নিলাম' },
  { path: '/app/admin/marketplace', label: 'মার্কেটপ্লেস' },
  { path: '/app/admin/warehouses', label: 'গুদাম' },
  { path: '/app/admin/labor', label: 'শ্রম' },
  { path: '/app/admin/loans', label: 'ঋণ' },
  { path: '/app/admin/news', label: 'সংবাদ' },
  { path: '/app/admin/reports', label: 'মডারেশন' },
  { path: '/app/admin/settings', label: 'সেটিংস' },
];
