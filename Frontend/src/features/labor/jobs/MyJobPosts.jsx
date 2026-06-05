import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Plus, Users, Clock, Banknote, Briefcase, Pencil, XCircle,
  MapPin, Calendar, RefreshCw, ChevronRight, FileText, CheckCircle2,
} from 'lucide-react';
import { laborApi } from '../../../shared/services/laborApi';
import { JOB_POST_STATUS_META, WORK_TYPE_LABEL } from '../laborConstants';
import JobBadge from './JobBadge';

function bn(n) {
  return Number(n || 0).toLocaleString('bn-BD');
}

function taka(n) {
  return `৳${bn(n)}`;
}

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="h-5 bg-gray-100 rounded w-1/2 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/3 mb-4" />
      <div className="flex gap-2 mb-4">
        {[1, 2, 3].map(i => <div key={i} className="h-6 w-20 bg-gray-100 rounded-full" />)}
      </div>
      <div className="h-9 bg-gray-100 rounded-xl" />
    </div>
  );
}

function JobPostCard({ post, onClose }) {
  const total = post.total_estimated_cost
    || (post.wage_per_day * post.duration_days * post.required_workers);
  const meta = JOB_POST_STATUS_META[post.status];
  const canEdit = post.status !== 'closed';

  return (
    <article className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200">

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {post.work_type && (
              <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
                {WORK_TYPE_LABEL[post.work_type] || post.work_type}
              </span>
            )}
            <JobBadge meta={meta} />
          </div>
          <Link to={`/app/labor/jobs/${post.id}`}
            className="block font-extrabold text-gray-900 text-base leading-tight group-hover:text-emerald-700 transition line-clamp-2">
            {post.job_title}
          </Link>
          {post.location && (
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MapPin size={11} className="flex-shrink-0 text-gray-400" />
              {post.location}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 px-3 py-2 text-center border border-emerald-100">
          <p className="text-[10px] font-semibold text-emerald-600">আবেদন</p>
          <p className="text-xl font-extrabold text-emerald-700">{bn(post.application_count)}</p>
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { icon: Calendar, label: 'শুরু', value: post.start_date ? String(post.start_date).slice(0, 10) : '—' },
          { icon: Clock,    label: 'মেয়াদ', value: `${bn(post.duration_days)} দিন` },
          { icon: Users,    label: 'শ্রমিক', value: `${bn(post.required_workers)} জন` },
          { icon: Banknote, label: 'মজুরি/দিন', value: taka(post.wage_per_day), highlight: true },
        ].map(item => (
          <div key={item.label} className="rounded-xl bg-gray-50 px-3 py-2">
            <p className="flex items-center gap-1 text-[10px] text-gray-400 uppercase tracking-wider">
              <item.icon size={10} /> {item.label}
            </p>
            <p className={`text-sm font-extrabold ${item.highlight ? 'text-emerald-600' : 'text-gray-800'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Cost + accepted */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2">
        <div>
          <p className="text-[10px] text-emerald-600 font-semibold">আনুমানিক মোট খরচ</p>
          <p className="text-base font-extrabold text-emerald-700">{taka(total)}</p>
        </div>
        {post.accepted_count > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold text-blue-700 border border-blue-100">
            <CheckCircle2 size={11} /> গৃহীত {bn(post.accepted_count)} জন
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
        <Link to={`/app/labor/jobs/${post.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
          <Users size={12} /> আবেদনকারী দেখুন
        </Link>
        {canEdit && (
          <>
            <Link to={`/app/labor/jobs/${post.id}/edit`}
              className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition">
              <Pencil size={12} /> সম্পাদনা
            </Link>
            <button type="button" onClick={() => onClose(post.id)}
              className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-extrabold text-red-600 hover:bg-red-100 transition">
              <XCircle size={12} /> বন্ধ করুন
            </button>
          </>
        )}
        {!canEdit && (
          <Link to={`/app/labor/jobs/${post.id}`}
            className="flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
            বিস্তারিত <ChevronRight size={12} />
          </Link>
        )}
      </div>
    </article>
  );
}

export default function MyJobPosts() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [closeId, setCloseId] = useState(null);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await laborApi.myJobs();
      setPosts(res.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    total:       posts.length,
    active:      posts.filter(p => p.status === 'open').length,
    applicants:  posts.reduce((s, p) => s + (p.application_count || 0), 0),
    completed:   posts.filter(p => p.status === 'closed' || p.status === 'filled').length,
  }), [posts]);

  const doClose = async () => {
    setClosing(true);
    try {
      await laborApi.closeJob(closeId);
      setCloseId(null);
      load();
    } finally {
      setClosing(false);
    }
  };

  const KPI_DATA = [
    { label: 'মোট পোস্ট',    value: bn(stats.total),      from: 'from-emerald-500', to: 'to-teal-600',   icon: FileText },
    { label: 'সক্রিয় পোস্ট', value: bn(stats.active),     from: 'from-green-500',   to: 'to-emerald-600', icon: Briefcase },
    { label: 'আবেদনকারী',    value: bn(stats.applicants), from: 'from-blue-500',    to: 'to-indigo-600',  icon: Users },
    { label: 'সম্পন্ন কাজ',  value: bn(stats.completed),  from: 'from-violet-500',  to: 'to-purple-600',  icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* ── Hero header ── */}
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-md mb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm flex-shrink-0">
                <Briefcase size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">আমার কাজের পোস্ট</h1>
                <p className="text-xs text-gray-500">পোস্ট করা কাজ ও আবেদনকারী পরিচালনা করুন</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
              </button>
              <Link to="/app/labor/jobs/new"
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
                <Plus size={14} /> নতুন পোস্ট
              </Link>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPI_DATA.map(k => (
              <div key={k.label} className={`rounded-2xl bg-gradient-to-br ${k.from} ${k.to} p-3.5 shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-white/80">{k.label}</p>
                    <p className="mt-0.5 text-xl font-extrabold text-white">{loading ? '…' : k.value}</p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/25 flex-shrink-0">
                    <k.icon size={13} className="text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Posts list ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center">
            <Briefcase className="mb-4 text-gray-200" size={52} />
            <p className="font-extrabold text-gray-500">আপনি এখনও কোনো কাজ পোস্ট করেননি</p>
            <p className="mt-1 text-sm text-gray-400">শ্রমিক খুঁজতে প্রথম কাজের পোস্ট তৈরি করুন</p>
            <Link to="/app/labor/jobs/new"
              className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
              প্রথম পোস্ট তৈরি করুন
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(p => (
              <JobPostCard key={p.id} post={p} onClose={setCloseId} />
            ))}
          </div>
        )}
      </div>

      {/* Close confirm modal */}
      {closeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
              <XCircle size={22} className="text-red-600" />
            </div>
            <h3 className="font-extrabold text-lg text-gray-900 mb-1">পোস্ট বন্ধ করবেন?</h3>
            <p className="text-sm text-gray-500 mb-5">
              বন্ধ করার পর আর নতুন আবেদন গ্রহণ করা যাবে না। অপেক্ষমাণ আবেদনকারীদের জানানো হবে।
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCloseId(null)} disabled={closing}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                না, রাখুন
              </button>
              <button onClick={doClose} disabled={closing}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-extrabold text-white hover:bg-red-700 disabled:opacity-60 transition">
                {closing ? 'বন্ধ হচ্ছে...' : 'হ্যাঁ, বন্ধ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
