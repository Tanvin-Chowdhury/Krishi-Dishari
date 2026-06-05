import { useCallback, useEffect, useState, useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { Search, Users2, Sprout, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import { AuthContext }     from '../../core/auth/AuthContext';
import { ROLES }           from '../../config/NavConfig';
import { communityApi }    from '../../shared/services/communityApi';
import { Skeleton }        from '../../shared/design-system/Skeleton';
import EmptyState          from '../../shared/design-system/EmptyState';
import PostCard            from './components/PostCard';
import CreatePostModal     from './components/CreatePostModal';
import TrendingSidebar     from './components/TrendingSidebar';
import FarmerHelpSection   from './components/FarmerHelpSection';
import FeedComposer        from './components/FeedComposer';
import { tagLabel }        from './communityConstants';
import { toast }           from 'react-toastify';

const CAN_POST = [1, 2, 3, 4];

/* ─── helpers ─────────────────────────────────────────────── */
function bn(n) {
  if (n == null || n === '') return '—';
  return Number(n).toLocaleString('bn-BD');
}

function KpiCard({ label, value, icon, from, to, loading }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${from} ${to} p-3.5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-white/80">{label}</p>
          <p className="mt-0.5 text-xl font-extrabold text-white">
            {loading ? '…' : bn(value)}
          </p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/25">
          <span className="text-base leading-none">{icon}</span>
        </div>
      </div>
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        <div className="h-11 w-11 rounded-full bg-gray-100 flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-1/5" />
        </div>
      </div>
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
      <div className="flex gap-4 pt-2">
        <div className="h-7 w-16 rounded-lg bg-gray-100" />
        <div className="h-7 w-16 rounded-lg bg-gray-100" />
        <div className="h-7 w-16 rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function CommunityFeed() {
  const { user }                       = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts,         setPosts]       = useState([]);
  const [helpPosts,     setHelpPosts]   = useState([]);
  const [pagination,    setPagination]  = useState({ page: 1, pages: 1, total: 0 });
  const [trending,      setTrending]    = useState(null);
  const [feedStats,     setFeedStats]   = useState(null);
  const [loading,       setLoading]     = useState(true);
  const [helpLoading,   setHelpLoading] = useState(false);
  const [statsLoading,  setStatsLoading]= useState(true);
  const [modalOpen,     setModalOpen]   = useState(false);
  const [composerType,  setComposerType]= useState('discussion');
  const [feedTags,      setFeedTags]    = useState([]);

  const search     = searchParams.get('q')      || '';
  const tagId      = searchParams.get('tag')     || '';
  const postType   = searchParams.get('type')    || '';
  const sort       = searchParams.get('sort')    || 'recent';
  const page       = +(searchParams.get('page')  || 1);
  const helpFilter = searchParams.get('filter')  || 'needs_expert';
  const aiPredictionId = searchParams.get('aiPredictionId');

  const [searchInput, setSearchInput] = useState(search);
  const isConsultant = user?.role_id === ROLES.CONSULTANT;
  const canPost      = CAN_POST.includes(user?.role_id);

  useEffect(() => { if (aiPredictionId) setModalOpen(true); }, [aiPredictionId]);

  /* ── load meta once ── */
  useEffect(() => {
    setStatsLoading(true);
    communityApi.getFeedStats()
      .then(setFeedStats).catch(() => setFeedStats(null))
      .finally(() => setStatsLoading(false));
    communityApi.getTrending().then(setTrending).catch(() => {});
    communityApi.getTags().then(r => setFeedTags(r.tags || [])).catch(() => setFeedTags([]));
  }, []);

  /* ── load help posts (consultant only) ── */
  const loadHelp = useCallback(async () => {
    if (!isConsultant) return;
    setHelpLoading(true);
    try {
      const res = await communityApi.list({ page: 1, limit: 5, filter: helpFilter || 'needs_expert', sort: 'recent' });
      setHelpPosts(res.posts || []);
    } catch { setHelpPosts([]); }
    finally  { setHelpLoading(false); }
  }, [helpFilter, isConsultant]);

  /* ── load feed ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await communityApi.list({ page, limit: 15, search: search || undefined, tag_id: tagId || undefined, post_type: postType || undefined, sort });
      setPosts(res.posts || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setPosts([]);
      toast.error(e.message || 'ফিড লোড হয়নি');
    } finally { setLoading(false); }
  }, [page, search, tagId, postType, sort]);

  useEffect(() => { load();     }, [load]);
  useEffect(() => { loadHelp(); }, [loadHelp]);

  /* ── filter helpers ── */
  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const selectTag = (id) => {
    const next = new URLSearchParams(searchParams);
    id ? next.set('tag', String(id)) : next.delete('tag');
    next.delete('type'); next.delete('page');
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('tag'); next.delete('type'); next.delete('page');
    setSearchParams(next);
  };

  const onSearch = (e) => { e.preventDefault(); setFilter('q', searchInput.trim()); };
  const openComposer = (type) => { setComposerType(type || 'discussion'); setModalOpen(true); };
  const activeTagId  = tagId ? +tagId : null;
  const hasFilter    = activeTagId || postType || sort !== 'recent' || search;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HERO ══ */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-md">
          {/* Header row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm flex-shrink-0">
                <Sprout size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">কৃষি কমিউনিটি</h1>
                <p className="text-xs text-gray-500">কৃষক, বিশেষজ্ঞ, শ্রমিক ও ব্যবসায়ীদের জ্ঞান বিনিময়ের প্ল্যাটফর্ম</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { load(); loadHelp(); }}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
              </button>
              {canPost && (
                <button onClick={() => openComposer('discussion')}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
                  + নতুন পোস্ট
                </button>
              )}
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="মোট পোস্ট"       value={pagination.total}             icon="📝" from="from-emerald-500" to="to-teal-600"     loading={statsLoading} />
            <KpiCard label="আজকের প্রশ্ন"    value={feedStats?.questions_today}   icon="❓" from="from-blue-500"    to="to-indigo-500"   loading={statsLoading} />
            <KpiCard label="রোগ রিপোর্ট"      value={feedStats?.disease_today}     icon="🦠" from="from-red-500"     to="to-rose-500"     loading={statsLoading} />
            <KpiCard label="সক্রিয় বিশেষজ্ঞ" value={feedStats?.active_consultants}icon="🎓" from="from-amber-500"   to="to-orange-500"   loading={statsLoading} />
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">

          {/* ─── Main feed ─── */}
          <div className="min-w-0 space-y-4">

            {/* Compose box */}
            {canPost && <FeedComposer onOpen={openComposer} initialType={composerType} />}

            {/* Consultant help section */}
            <FarmerHelpSection showSection={isConsultant} posts={helpPosts}
              loading={helpLoading} activeFilter={helpFilter}
              onFilter={v => setFilter('filter', v)} />

            {/* Search + sort row */}
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <form onSubmit={onSearch} className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  placeholder="পোস্ট, প্রশ্ন বা সদস্য খুঁজুন..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 shadow-sm transition" />
                {searchInput && (
                  <button type="button" onClick={() => { setSearchInput(''); setFilter('q', ''); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={13} />
                  </button>
                )}
              </form>
              <select value={sort} onChange={e => setFilter('sort', e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer">
                <option value="recent">সাম্প্রতিক</option>
                <option value="trending">ট্রেন্ডিং</option>
                <option value="popular">জনপ্রিয়</option>
              </select>
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={clearAllFilters}
                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  !activeTagId && !postType ? 'bg-emerald-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
                }`}>
                সব
              </button>
              {feedTags.map(t => (
                <button key={t.tag_id} type="button" onClick={() => selectTag(activeTagId === t.tag_id ? '' : t.tag_id)}
                  className={`flex-shrink-0 flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeTagId === t.tag_id
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-violet-300 hover:text-violet-700'
                  }`}>
                  #{tagLabel(t.tag_name)}
                  {t.post_count > 0 && <span className="opacity-70">({t.post_count})</span>}
                </button>
              ))}
              {hasFilter && (
                <button type="button" onClick={clearAllFilters}
                  className="flex-shrink-0 flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 transition">
                  <X size={11} /> ফিল্টার মুছুন
                </button>
              )}
            </div>

            {/* Feed */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
                <Users2 className="mb-4 text-gray-200" size={52} />
                <p className="font-extrabold text-gray-500">কোনো পোস্ট নেই</p>
                <p className="mt-1 text-sm text-gray-400">প্রথম পোস্ট করুন বা ফিল্টার বদলান</p>
                {canPost && (
                  <button onClick={() => openComposer()}
                    className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
                    প্রথম পোস্ট করুন
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(p => (
                  <PostCard key={p.post_id} post={p}
                    onDelete={id => setPosts(list => list.filter(x => x.post_id !== id))} />
                ))}

                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button disabled={page <= 1} onClick={() => setFilter('page', String(page - 1))}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 shadow-sm transition">
                      ← পূর্ববর্তী
                    </button>
                    <span className="text-sm text-gray-500">{page} / {pagination.pages}</span>
                    <button disabled={page >= pagination.pages} onClick={() => setFilter('page', String(page + 1))}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 shadow-sm transition">
                      পরবর্তী →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Sidebar ─── */}
          <TrendingSidebar trending={trending}
            activeTag={tagId ? +tagId : ''} activeType={postType}
            onTag={id => setFilter('tag', id ? String(id) : '')}
            onType={t => setFilter('type', t)}
            isConsultant={isConsultant} />
        </div>
      </div>

      {/* Create post modal */}
      <CreatePostModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          if (aiPredictionId) {
            const next = new URLSearchParams(searchParams);
            next.delete('aiPredictionId');
            setSearchParams(next);
          }
        }}
        onCreated={() => { load(); loadHelp(); }}
        aiPredictionId={aiPredictionId}
        initialPostType={composerType}
      />
    </div>
  );
}
