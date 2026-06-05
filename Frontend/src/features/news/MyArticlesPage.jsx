import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { newsApi } from '../../shared/services/newsApi';
import { STATUS_LABELS, CATEGORY_STYLES, formatNewsDate } from './newsUtils';
import NewsCoverImage from './NewsCoverImage';
import { Skeleton } from '../../shared/design-system/Skeleton';
import EmptyState from '../../shared/design-system/EmptyState';
import { cn } from '../../shared/lib/cn';

export default function MyArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'expert_advice',
    cover_image_url: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await newsApi.myArticles({ limit: 30 });
      setArticles(res.news || res.data?.news || []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await newsApi.submitArticle(form);
      toast.success('নিবন্ধ পর্যালোচনার জন্য জমা হয়েছে');
      setShowForm(false);
      setForm({ title: '', summary: '', content: '', category: 'expert_advice', cover_image_url: '' });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        to="/app/news"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
      >
        <ArrowLeft size={16} aria-hidden /> কৃষি সংবাদ
      </Link>

      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <FileText size={22} className="text-violet-600" aria-hidden />
          আমার প্রতিবেদন
        </h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700"
        >
          <Plus size={14} aria-hidden />
          {showForm ? 'বাতিল' : 'নতুন নিবন্ধ'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mb-8 space-y-3 rounded-2xl border border-violet-100 bg-violet-50/50 p-5"
        >
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="শিরোনাম"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            required
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            placeholder="সারসংক্ষেপ"
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <textarea
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="সম্পূর্ণ নিবন্ধ"
            rows={8}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            value={form.cover_image_url}
            onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
            placeholder="কভার ইমেজ URL (ঐচ্ছিক)"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            পর্যালোচনার জন্য জমা দিন
          </button>
        </form>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      )}

      {!loading && articles.length === 0 && (
        <EmptyState
          title="কোনো নিবন্ধ নেই"
          description="নতুন নিবন্ধ লিখে পর্যালোচনার জন্য জমা দিন। অ্যাডমিন অনুমোদনের পর কৃষি সংবাদে প্রকাশিত হবে।"
          actionLabel="নতুন নিবন্ধ"
          onAction={() => setShowForm(true)}
        />
      )}

      {!loading && articles.length > 0 && (
        <ul className="space-y-4">
          {articles.map((a) => {
            const st = STATUS_LABELS[a.status] || STATUS_LABELS.draft;
            const articleId = a.id ?? a.news_id;
            return (
              <li
                key={articleId}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
              >
                <div className="relative h-36 overflow-hidden bg-slate-100">
                  <NewsCoverImage
                    article={a}
                    className="h-full w-full object-cover"
                  />
                  <span
                    className={cn(
                      'absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-bold ring-1',
                      CATEGORY_STYLES[a.category] || CATEGORY_STYLES.general
                    )}
                  >
                    {a.category_label || a.category}
                  </span>
                  <span
                    className={cn(
                      'absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                      st.color
                    )}
                  >
                    {st.label}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 leading-snug">{a.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{formatNewsDate(a.created_at)}</p>
                  {a.summary && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">{a.summary}</p>
                  )}
                  {a.status === 'published' && a.slug && (
                    <Link
                      to={`/app/news/${a.slug}`}
                      className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
                    >
                      প্রকাশিত নিবন্ধ দেখুন →
                    </Link>
                  )}
                  {a.status === 'pending_review' && (
                    <p className="mt-2 text-xs text-amber-700">
                      অ্যাডমিন পর্যালোচনা করলে কৃষি সংবাদে প্রকাশিত হবে।
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
