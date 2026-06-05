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

export function starsLabel(rating) {
  const r = parseFloat(rating) || 0;
  return r.toFixed(1);
}

export function feeLabel(fee) {
  const f = Number(fee);
  if (!f || f <= 0) return 'বিনামূল্যে';
  return `৳${bn(f)}`;
}
