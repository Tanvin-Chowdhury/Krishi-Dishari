import { AlertTriangle } from 'lucide-react';
import { Skeleton } from '../../../shared/design-system/Skeleton';
import PostCard from './PostCard';
import { HELP_FILTERS } from '../communityConstants';
import { cn } from '../../../shared/lib/cn';

export default function FarmerHelpSection({
  posts,
  loading,
  activeFilter,
  onFilter,
  showSection,
}) {
  if (!showSection) return null;

  return (
    <section className="mb-6 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/60 to-orange-50/40 p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <AlertTriangle size={18} aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">কৃষকের সাহায্য দরকার</h2>
            <p className="text-xs text-slate-600">জরুরি প্রশ্ন ও রোগ সমস্যা — দ্রুত উত্তর দিন</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {HELP_FILTERS.map((f) => (
            <button
              key={f.value || 'all'}
              type="button"
              onClick={() => onFilter?.(f.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition',
                activeFilter === f.value
                  ? 'bg-red-600 text-white'
                  : 'bg-white/80 text-slate-600 hover:bg-white'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : posts.length === 0 ? (
        <p className="rounded-xl bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
          এই মুহূর্তে জরুরি পোস্ট নেই — ভালো খবর!
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <PostCard key={`help-${p.post_id}`} post={p} compact highlightUrgent />
          ))}
        </div>
      )}
    </section>
  );
}
