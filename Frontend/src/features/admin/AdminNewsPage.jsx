import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, Star, Zap, RefreshCw, Check, X, Eye } from 'lucide-react';
import { adminApi } from '../../shared/services/adminApi';
import { newsApi } from '../../shared/services/newsApi';
import {
  AdminPageShell,
  Badge,
  ConfirmModal,
  TableShell,
} from '../admin/components/AdminPageShell';
import { bnDate } from '../admin/adminUtils';
import { STATUS_LABELS, CATEGORY_STYLES } from '../news/newsUtils';
import { cn } from '../../shared/lib/cn';

export default function AdminNewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [news, setNews] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const statusFilter = searchParams.get('status') || '';
  const [confirm, setConfirm] = useState(null);

  const loadPending = useCallback(async () => {
    try {
      const res = await adminApi.listNews({ status: 'pending_review', limit: 20 });
      setPendingQueue(res.news || []);
      setPendingCount(res.pending_count ?? res.pagination?.total ?? (res.news?.length || 0));
    } catch {
      setPendingQueue([]);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listNews({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      setNews(res.news || []);
      if (typeof res.pending_count === 'number') {
        setPendingCount(res.pending_count);
      }
      if (statusFilter !== 'pending_review') {
        await loadPending();
      } else {
        setPendingQueue(res.news || []);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, loadPending]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const setStatusFilter = (status) => {
    if (status) {
      setSearchParams({ status });
    } else {
      setSearchParams({});
    }
  };

  const setStatus = async (id, status) => {
    try {
      await adminApi.patchNewsStatus(id, status);
      toast.success(
        status === 'published'
          ? 'নিবন্ধ প্রকাশিত হয়েছে'
          : status === 'rejected'
            ? 'নিবন্ধ প্রত্যাখ্যাত হয়েছে'
            : 'স্ট্যাটাস আপডেট'
      );
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const toggleFeature = async (item) => {
    try {
      await adminApi.patchNewsFeature(item.id, !item.is_featured);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const toggleBreaking = async (item) => {
    try {
      await adminApi.patchNewsBreaking(item.id, !item.is_breaking);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const onDelete = async (id) => {
    try {
      await adminApi.deleteNews(id);
      toast.success('মুছে ফেলা হয়েছে');
      load();
    } catch (e) {
      toast.error(e.message);
    }
    setConfirm(null);
  };

  const onSync = async () => {
    try {
      const res = await newsApi.sync();
      toast.success(
        `সিঙ্ক সম্পন্ন — নতুন ${res.external?.inserted ?? 0}, সতর্কতা ${res.alerts?.inserted ?? 0}`
      );
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const showPendingPanel = statusFilter !== 'pending_review' && pendingQueue.length > 0;

  return (
    <AdminPageShell
      title="কৃষি সংবাদ ও নিবন্ধ পর্যালোচনা"
      subtitle="বিশেষজ্ঞের জমা দেওয়া নিবন্ধ অনুমোদন করুন, সংবাদ প্রকাশ ও সিঙ্ক পরিচালনা করুন"
      actions={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSync}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} aria-hidden /> সিঙ্ক
          </button>
          <Link
            to="/app/admin/news/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus size={16} aria-hidden /> নতুন সংবাদ
          </Link>
        </div>
      }
    >
      {pendingCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">
            {pendingCount}টি বিশেষজ্ঞ নিবন্ধ পর্যালোচনার অপেক্ষায়
          </p>
          <button
            type="button"
            onClick={() => setStatusFilter('pending_review')}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
          >
            পর্যালোচনা করুন
          </button>
        </div>
      )}

      {showPendingPanel && (
        <section className="mb-6 rounded-2xl border border-amber-200/80 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-amber-100 bg-amber-50/80 px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-amber-900">পর্যালোচনাধীন নিবন্ধ</h2>
            <button
              type="button"
              onClick={() => setStatusFilter('pending_review')}
              className="text-xs font-semibold text-amber-800 hover:underline"
            >
              সব দেখুন →
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {pendingQueue.map((item) => (
              <PendingRow key={item.id} item={item} onApprove={() => setStatus(item.id, 'published')} onReject={() => setStatus(item.id, 'rejected')} />
            ))}
          </ul>
        </section>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="শিরোনাম খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: '', label: 'সব' },
            { key: 'pending_review', label: 'পর্যালোচনাধীন' },
            { key: 'published', label: 'প্রকাশিত' },
            { key: 'draft', label: 'খসড়া' },
            { key: 'rejected', label: 'প্রত্যাখ্যাত' },
          ].map(({ key, label }) => (
            <button
              key={key || 'all'}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                statusFilter === key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {label}
              {key === 'pending_review' && pendingCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-400 px-1.5 text-[10px] text-amber-950">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <TableShell
        loading={loading}
        empty={!loading && news.length === 0}
        headers={['শিরোনাম', 'লেখক', 'বিভাগ', 'স্ট্যাটাস', 'তারিখ', 'কর্ম']}
      >
        {news.map((item) => {
          const st = STATUS_LABELS[item.status] || STATUS_LABELS.draft;
          return (
            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="px-3 py-3">
                <p className="font-semibold text-slate-900 text-sm line-clamp-1">{item.title}</p>
                {item.summary && (
                  <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{item.summary}</p>
                )}
                <div className="flex gap-1 mt-1">
                  {item.is_featured && <Badge className="bg-amber-100 text-amber-800">Featured</Badge>}
                  {item.is_breaking && <Badge className="bg-red-100 text-red-800">Breaking</Badge>}
                </div>
              </td>
              <td className="px-3 py-3 text-xs text-slate-700">{item.author_name || '—'}</td>
              <td className="px-3 py-3 text-xs">
                <span className={cn('rounded px-1.5 py-0.5 font-semibold', CATEGORY_STYLES[item.category])}>
                  {item.category_label}
                </span>
              </td>
              <td className="px-3 py-3">
                <Badge className={st.color}>{st.label}</Badge>
              </td>
              <td className="px-3 py-3 text-xs text-slate-500">
                {bnDate(item.published_at || item.created_at)}
              </td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1 items-center">
                  {item.status === 'pending_review' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setStatus(item.id, 'published')}
                        className="inline-flex items-center gap-0.5 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700"
                        title="প্রকাশ করুন"
                      >
                        <Check size={12} aria-hidden /> অনুমোদন
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(item.id, 'rejected')}
                        className="inline-flex items-center gap-0.5 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 hover:bg-red-100"
                        title="প্রত্যাখ্যান"
                      >
                        <X size={12} aria-hidden /> প্রত্যাখ্যান
                      </button>
                    </>
                  )}
                  <Link
                    to={`/app/admin/news/${item.id}/edit`}
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-white"
                    title="সম্পাদনা"
                  >
                    <Pencil size={14} aria-hidden />
                  </Link>
                  {item.status === 'published' && item.slug && (
                    <Link
                      to={`/app/news/${item.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-slate-200 p-1.5 text-sky-600 hover:bg-white"
                      title="প্রকাশিত দেখুন"
                    >
                      <Eye size={14} aria-hidden />
                    </Link>
                  )}
                  <button type="button" onClick={() => toggleFeature(item)} className="rounded-lg border p-1.5 text-amber-600" title="Featured">
                    <Star size={14} aria-hidden />
                  </button>
                  <button type="button" onClick={() => toggleBreaking(item)} className="rounded-lg border p-1.5 text-red-600" title="Breaking">
                    <Zap size={14} aria-hidden />
                  </button>
                  {item.status === 'published' ? (
                    <button type="button" onClick={() => setStatus(item.id, 'draft')} className="text-[10px] font-bold text-slate-600 px-1">
                      Unpub
                    </button>
                  ) : item.status !== 'pending_review' && (
                    <button type="button" onClick={() => setStatus(item.id, 'published')} className="text-[10px] font-bold text-emerald-700 px-1">
                      Pub
                    </button>
                  )}
                  <button type="button" onClick={() => setConfirm(item)} className="rounded-lg border p-1.5 text-red-600">
                    <Trash2 size={14} aria-hidden />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </TableShell>

      <ConfirmModal
        open={!!confirm}
        title="সংবাদ মুছবেন?"
        message={confirm?.title}
        onCancel={() => setConfirm(null)}
        onConfirm={() => onDelete(confirm.id)}
      />
    </AdminPageShell>
  );
}

function PendingRow({ item, onApprove, onReject }) {
  return (
    <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {item.author_name || 'বিশেষজ্ঞ'} · {bnDate(item.created_at)}
        </p>
        {item.summary && (
          <p className="mt-1 text-xs text-slate-600 line-clamp-2">{item.summary}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          to={`/app/admin/news/${item.id}/edit`}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Pencil size={12} aria-hidden /> সম্পাদনা
        </Link>
        <button
          type="button"
          onClick={onApprove}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
        >
          <Check size={12} aria-hidden /> অনুমোদন
        </button>
        <button
          type="button"
          onClick={onReject}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
        >
          <X size={12} aria-hidden /> প্রত্যাখ্যান
        </button>
      </div>
    </li>
  );
}
