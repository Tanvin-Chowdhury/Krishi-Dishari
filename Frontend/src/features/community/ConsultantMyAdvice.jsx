import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { MessageSquare, Star, RefreshCw } from 'lucide-react';
import { communityApi } from '../../shared/services/communityApi';
import PageContainer from '../../shared/ui/PageContainer';
import PageHeader from '../../shared/ui/PageHeader';
import { Skeleton } from '../../shared/design-system/Skeleton';
import EmptyState from '../../shared/design-system/EmptyState';
import { timeAgo } from '../../shared/dashboard/dashboardFormatters';

export default function ConsultantMyAdvice() {
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await communityApi.myAdvice({ page, limit: 20 });
      setComments(res.comments || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setError(e.message || 'উত্তর লোড হয়নি');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <PageContainer>
      <PageHeader
        icon={MessageSquare}
        title="আমার পরামর্শ"
        subtitle="কমিউনিটিতে আপনার দেওয়া উত্তর ও মন্তব্য"
      />

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-700 mb-3">{error}</p>
          <button
            type="button"
            onClick={() => load(1)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm text-red-700"
          >
            <RefreshCw size={14} /> আবার চেষ্টা
          </button>
        </div>
      )}

      {!loading && !error && comments.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="এখনো কোনো উত্তর নেই"
          description="কমিউনিটি পোস্টে উত্তর দিলে সেগুলো এখানে দেখা যাবে।"
          actionLabel="কমিউনিটি ফিড"
          actionHref="/app/community"
        />
      )}

      {!loading && !error && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((c) => (
            <article
              key={c.comment_id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <Link
                    to={`/app/community/${c.post_id}`}
                    className="text-sm font-bold text-emerald-800 hover:underline"
                  >
                    {c.post_title || 'কমিউনিটি পোস্ট'}
                  </Link>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {c.farmer_name ? `${c.farmer_name} · ` : ''}
                    {timeAgo(c.created_at)}
                  </p>
                </div>
                {c.is_highlighted && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    <Star size={10} fill="currentColor" /> হাইলাইট
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {c.comment_text}
              </p>
            </article>
          ))}

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => load(pagination.page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                আগের
              </button>
              <span className="text-sm text-slate-500 self-center">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => load(pagination.page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                পরের
              </button>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
