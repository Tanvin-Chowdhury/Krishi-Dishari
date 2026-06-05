import { STATUS_VARIANT } from '../laborConstants';

const styles = {
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-blue-100 text-blue-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-700',
};

const labels = {
  PENDING: 'অপেক্ষমাণ',
  ACCEPTED: 'গৃহীত',
  ACTIVE: 'চলমান',
  COMPLETED: 'সম্পন্ন',
  CANCELLED: 'বাতিল',
  REJECTED: 'প্রত্যাখ্যান',
};

export default function StatusBadge({ status }) {
  const key = (status || '').toUpperCase();
  const variant = STATUS_VARIANT[key] || 'gray';
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[variant]}`}
    >
      {labels[key] || status}
    </span>
  );
}
