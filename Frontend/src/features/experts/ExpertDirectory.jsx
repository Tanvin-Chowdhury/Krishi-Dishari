import { useCallback, useEffect, useState } from 'react';
import {
  Search, SlidersHorizontal, Users, X, Star, BadgeCheck,
  MessageCircle, ChevronRight, Filter, RefreshCw, CheckCircle,
  HelpCircle, Lightbulb,
} from 'lucide-react';
import { expertApi } from '../../shared/services/expertApi';
import { ApiError } from '../../shared/services/httpClient';
import ExpertCard from './components/ExpertCard';
import { toast } from 'react-toastify';

/* ─── Category chips ──────────────────────────────────────── */
const CATEGORIES = [
  { id: '',                           label: 'সব বিশেষজ্ঞ',    icon: '👥' },
  { id: 'ধান ও গম চাষ',              label: 'ফসল উৎপাদন',     icon: '🌾' },
  { id: 'সবজি ও ফল চাষ',            label: 'সবজি ও ফল',      icon: '🥬' },
  { id: 'মাটি ও সার ব্যবস্থাপনা',   label: 'মাটি ও সার',      icon: '🌱' },
  { id: 'ফসলের রোগ ও কীটপতঙ্গ',    label: 'রোগ ও পোকা',      icon: '🦠' },
  { id: 'সেচ ও জল ব্যবস্থাপনা',    label: 'সেচ',              icon: '💧' },
  { id: 'গবাদি পশু ও হাঁস-মুরগি',  label: 'পশুপালন',         icon: '🐄' },
];

const SORT_OPTIONS = [
  { value: 'rating',     label: 'জনপ্রিয়তা' },
  { value: 'experience', label: 'অভিজ্ঞতা' },
  { value: 'fee',        label: 'কম ফি' },
  { value: 'name',       label: 'নাম (ক-য)' },
];

/* ─── Skeleton card ───────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="h-48 bg-gray-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-6 bg-gray-100 rounded-lg w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-full mt-3" />
        <div className="h-9 bg-gray-100 rounded-xl w-full mt-2" />
      </div>
    </div>
  );
}

/* ─── KPI card ────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, from, to }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${from} ${to} p-3.5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-white/80">{label}</p>
          <p className="mt-0.5 text-xl font-extrabold text-white">{value}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/25">
          <Icon className="text-white" style={{ width: 15, height: 15 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Filter panel (sidebar + mobile drawer) ──────────────── */
function FilterPanel({ specializations, specialization, setSpecialization, availableOnly, setAvailableOnly, minRating, setMinRating, sort, setSort, onReset, onApply }) {
  return (
    <div className="space-y-4">
      {/* Specialization */}
      <div>
        <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">বিশেষজ্ঞতা</label>
        <select value={specialization} onChange={e => setSpecialization(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer">
          <option value="">সব বিষয়</option>
          {specializations.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">সাজান</label>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Min rating */}
      <div>
        <label className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">সর্বনিম্ন রেটিং</label>
        <div className="mt-1.5 flex gap-2">
          {[
            { v: '',    l: 'সব' },
            { v: '3',   l: '৩+' },
            { v: '4',   l: '৪+' },
            { v: '4.5', l: '৪.৫+' },
          ].map(r => (
            <button key={r.v} onClick={() => setMinRating(r.v)}
              className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
                minRating === r.v ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-emerald-300'
              }`}>
              {r.l}
            </button>
          ))}
        </div>
      </div>

      {/* Available only */}
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 hover:border-emerald-200 transition">
        <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${
          availableOnly ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
        }`}>
          {availableOnly && <CheckCircle size={12} className="text-white" />}
        </div>
        <input type="checkbox" className="sr-only" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} />
        <span className="text-sm font-semibold text-gray-700">শুধু উপলব্ধ বিশেষজ্ঞ</span>
      </label>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button onClick={onReset}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition">
          রিসেট করুন
        </button>
        <button onClick={onApply}
          className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 transition shadow-sm">
          ফলাফল দেখুন
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function ExpertDirectory() {
  const [experts,         setExperts]         = useState([]);
  const [pagination,      setPagination]      = useState({ page: 1, pages: 1, total: 0 });
  const [specializations, setSpecializations] = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [filterDrawer,    setFilterDrawer]    = useState(false);

  const [search,          setSearch]          = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [specialization,  setSpecialization]  = useState('');
  const [availableOnly,   setAvailableOnly]   = useState(false);
  const [minRating,       setMinRating]       = useState('');
  const [sort,            setSort]            = useState('rating');
  const [page,            setPage]            = useState(1);

  /* debounce */
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  /* load specializations once */
  useEffect(() => {
    expertApi.getSpecializations()
      .then(r => setSpecializations(r.specializations || []))
      .catch(() => {});
  }, []);

  /* load experts */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expertApi.list({
        page, limit: 12,
        search:         searchDebounced  || undefined,
        specialization: specialization   || undefined,
        available_only: availableOnly    || undefined,
        min_rating:     minRating        || undefined,
        sort,
      });
      setExperts(res.experts || []);
      setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
    } catch (e) {
      setExperts([]);
      if (!(e instanceof ApiError && e.status === 0))
        toast.error(e.message || 'বিশেষজ্ঞ তালিকা লোড হয়নি');
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced, specialization, availableOnly, minRating, sort]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [searchDebounced, specialization, availableOnly, minRating, sort]);

  const clearFilters = () => {
    setSearch(''); setSpecialization(''); setAvailableOnly(false); setMinRating(''); setSort('rating'); setPage(1);
  };
  const hasFilters = searchDebounced || specialization || availableOnly || minRating || sort !== 'rating';

  /* derived stats */
  const availableCount = experts.filter(e => e.is_available).length;
  const verifiedCount  = experts.filter(e => e.is_verified).length;
  const avgRating      = experts.length
    ? (experts.reduce((s, e) => s + (parseFloat(e.avg_rating) || 0), 0) / experts.length).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HERO ══ */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-md">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm flex-shrink-0">
                <Users size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">বিশেষজ্ঞ ডিরেক্টরি</h1>
                <p className="text-xs text-gray-500">যাচাইকৃত কৃষি বিশেষজ্ঞদের সাথে কথা বলুন এবং সঠিক পরামর্শ পান</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
              </button>
              {/* Mobile filter toggle */}
              <button onClick={() => setFilterDrawer(o => !o)}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition lg:hidden">
                <SlidersHorizontal size={13} /> ফিল্টার
                {hasFilters && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="নাম, বিশেষজ্ঞতা বা বিষয় লিখুন..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition" />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-gray-200 text-gray-400 transition">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setSpecialization(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  specialization === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
                }`}>
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>

          {/* KPI strip */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard icon={Users}       label="মোট বিশেষজ্ঞ"    value={pagination.total || 0}  from="from-emerald-500" to="to-teal-600"    />
            <KpiCard icon={CheckCircle} label="উপলব্ধ এখন"       value={availableCount}         from="from-green-500"   to="to-emerald-600" />
            <KpiCard icon={BadgeCheck}  label="যাচাইকৃত"         value={verifiedCount}          from="from-blue-500"    to="to-indigo-500"  />
            <KpiCard icon={Star}        label="গড় রেটিং"         value={avgRating}              from="from-amber-500"   to="to-orange-500"  />
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="mx-auto max-w-7xl px-4 py-5">

        {/* Result count + sort strip */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            {loading ? 'লোড হচ্ছে…' : `${pagination.total} জন বিশেষজ্ঞ${searchDebounced ? ` — "${searchDebounced}"` : ''}`}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:block">সাজান:</span>
            {SORT_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setSort(o.value)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  sort === o.value ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600 hover:border-emerald-300 bg-white'
                }`}>
                {o.label}
              </button>
            ))}
            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 transition">
                <X size={12} /> ফিল্টার মুছুন
              </button>
            )}
          </div>
        </div>

        {/* 2-column layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

          {/* ─── Main content ─── */}
          <div>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : experts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center">
                <Users className="mb-4 text-gray-200" size={52} />
                <p className="font-extrabold text-gray-500">কোনো বিশেষজ্ঞ পাওয়া যায়নি</p>
                <p className="mt-1 text-sm text-gray-400">ফিল্টার বদলান বা পরে আবার চেষ্টা করুন</p>
                {hasFilters && (
                  <button onClick={clearFilters}
                    className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 transition shadow-sm">
                    ফিল্টার রিসেট করুন
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {experts.map(ex => <ExpertCard key={ex.user_id} expert={ex} />)}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition shadow-sm">
                      ← পূর্ববর্তী
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const pg = Math.max(1, Math.min(pagination.pages - 4, page - 2)) + i;
                        return (
                          <button key={pg} onClick={() => setPage(pg)}
                            className={`h-9 w-9 rounded-xl text-sm font-semibold transition ${
                              pg === page ? 'bg-emerald-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                            }`}>
                            {pg}
                          </button>
                        );
                      })}
                    </div>
                    <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition shadow-sm">
                      পরবর্তী →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ─── Right Sidebar ─── */}
          <div className="hidden lg:flex flex-col gap-4">

            {/* Advanced filter panel */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-2 mb-4 text-sm font-extrabold text-gray-900">
                <Filter className="text-emerald-500" size={15} /> উন্নত ফিল্টার
              </h3>
              <FilterPanel
                specializations={specializations}
                specialization={specialization} setSpecialization={setSpecialization}
                availableOnly={availableOnly} setAvailableOnly={setAvailableOnly}
                minRating={minRating} setMinRating={setMinRating}
                sort={sort} setSort={setSort}
                onReset={clearFilters} onApply={load}
              />
            </div>

            {/* Consultation stats */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-gray-900">
                <Star className="text-amber-500" size={15} /> পরামর্শ পরিসংখ্যান
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'মোট বিশেষজ্ঞ',    value: pagination.total || 0,   color: 'text-emerald-700' },
                  { label: 'উপলব্ধ এখন',        value: availableCount,          color: 'text-green-700'   },
                  { label: 'যাচাইকৃত বিশেষজ্ঞ', value: verifiedCount,           color: 'text-blue-700'    },
                  { label: 'গড় রেটিং',          value: `${avgRating} ⭐`,        color: 'text-amber-700'   },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <span className="text-xs text-gray-500">{s.label}</span>
                    <span className={`text-sm font-extrabold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
              <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-emerald-900">
                <Lightbulb className="text-emerald-600" size={15} /> কিভাবে পরামর্শ নেবেন?
              </h3>
              <div className="space-y-2.5">
                {[
                  { n: '১', label: 'বিশেষজ্ঞ নির্বাচন করুন' },
                  { n: '২', label: 'চ্যাট করুন বা কল করুন' },
                  { n: '৩', label: 'সমস্যা বিস্তারিত জানান' },
                  { n: '৪', label: 'সমাধান গ্রহণ করুন' },
                ].map(s => (
                  <div key={s.n} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-extrabold text-white">
                      {s.n}
                    </div>
                    <span className="text-xs text-emerald-800 font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Help card */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 text-center shadow-sm">
              <HelpCircle className="mx-auto mb-2 text-blue-500" size={26} />
              <p className="font-extrabold text-blue-900 text-sm">সহায়তা প্রয়োজন?</p>
              <p className="mt-1 text-[11px] text-blue-700">কোন বিশেষজ্ঞ বেছে নেবেন বুঝতে পারছেন না?</p>
              <button className="mt-3 w-full rounded-xl bg-blue-600 py-2 text-xs font-extrabold text-white hover:bg-blue-700 transition">
                সহায়তা কেন্দ্র
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ Mobile filter drawer ══ */}
      {filterDrawer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden" onClick={e => e.target === e.currentTarget && setFilterDrawer(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setFilterDrawer(false)} />
          <div className="relative w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-gray-900">ফিল্টার</h3>
              <button onClick={() => setFilterDrawer(false)}
                className="rounded-xl border border-gray-200 p-1.5 hover:bg-gray-50">
                <X size={16} />
              </button>
            </div>
            <FilterPanel
              specializations={specializations}
              specialization={specialization} setSpecialization={setSpecialization}
              availableOnly={availableOnly} setAvailableOnly={setAvailableOnly}
              minRating={minRating} setMinRating={setMinRating}
              sort={sort} setSort={setSort}
              onReset={clearFilters}
              onApply={() => { load(); setFilterDrawer(false); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
