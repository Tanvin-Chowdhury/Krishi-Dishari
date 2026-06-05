const VARIANT = {
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
};

export default function JobBadge({ meta, label, variant = 'gray' }) {
  const m = meta || { label, variant };
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
        VARIANT[m.variant] || VARIANT.gray
      }`}
    >
      {m.label}
    </span>
  );
}
