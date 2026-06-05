import { HelpCircle, Bug, Users, MessageSquare } from 'lucide-react';
import { Skeleton } from '../../../shared/design-system/Skeleton';

const STATS = [
  { key: 'questions_today', label: 'আজকের প্রশ্ন', icon: HelpCircle, color: 'text-blue-600 bg-blue-50' },
  { key: 'disease_today', label: 'রোগ রিপোর্ট', icon: Bug, color: 'text-red-600 bg-red-50' },
  { key: 'active_consultants', label: 'সক্রিয় বিশেষজ্ঞ', icon: Users, color: 'text-amber-700 bg-amber-50' },
  { key: 'posts_today', label: 'কমিউনিটি পোস্ট', icon: MessageSquare, color: 'text-emerald-700 bg-emerald-50' },
];

export default function FeedStatsBar({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STATS.map(({ key, label, icon: Icon, color }) => (
        <div
          key={key}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <div className={`mb-2 inline-flex rounded-lg p-2 ${color}`}>
            <Icon size={18} aria-hidden />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.[key] ?? 0}</p>
          <p className="text-xs font-medium text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  );
}
