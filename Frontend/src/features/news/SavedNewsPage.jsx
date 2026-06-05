import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { newsApi } from '../../shared/services/newsApi';
import NewsCard from './NewsCard';
import { Skeleton } from '../../shared/design-system/Skeleton';
import EmptyState from '../../shared/design-system/EmptyState';

export default function SavedNewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await newsApi.listBookmarks({ limit: 30 });
      setNews(res.news || []);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <Link
        to="/app/news"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
      >
        <ArrowLeft size={16} /> সংবাদ
      </Link>
      <h1 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Bookmark size={22} className="text-emerald-600" /> সংরক্ষিত সংবাদ
      </h1>
      {loading && <Skeleton className="h-48 w-full rounded-2xl" />}
      {!loading && news.length === 0 && (
        <EmptyState emoji="🔖" title="কোনো সংরক্ষিত সংবাদ নেই" />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((item) => (
          <NewsCard key={item.id} article={item} />
        ))}
      </div>
    </div>
  );
}
