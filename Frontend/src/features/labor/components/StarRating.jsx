import { Star } from 'lucide-react';

export default function StarRating({ value = 0, size = 16, showValue = true }) {
  const v = Math.min(5, Math.max(0, parseFloat(value) || 0));
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.round(v)
              ? 'text-yellow-500 fill-yellow-500'
              : 'text-gray-300'
          }
        />
      ))}
      {showValue && (
        <span className="text-sm font-semibold text-gray-800 ml-1">
          {v ? v.toFixed(1) : '—'}
        </span>
      )}
    </div>
  );
}
