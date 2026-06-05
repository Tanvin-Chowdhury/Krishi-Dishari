import { useCallback, useContext, useEffect, useState } from 'react';
import { Link }         from 'react-router';
import {
  Search, Filter, Briefcase, Star, Calendar,
  Users, RefreshCw, X, ChevronRight, MapPin,
  Trophy, Flame, BarChart2, PlusCircle, SlidersHorizontal,
} from 'lucide-react';
import { AuthContext }    from '../../core/auth/AuthContext';
import { laborApi }       from '../../shared/services/laborApi';
import UserPhoto          from '../../shared/components/UserPhoto';
import LaborCard          from './components/LaborCard';
import HireRequestModal   from './components/HireRequestModal';
import { SKILL_OPTIONS, REQUESTER_ROLES } from './laborConstants';
import { useLaborSocket } from './useLaborSocket';

/* ─── helpers ─────────────────────────────────────────────── */
function bn(n) {
  if (n == null || n === '') return '—';
  return Number(n).toLocaleString('bn-BD');
}

/* ─── KPI card ────────────────────────────────────────────── */
function KpiCard({ label, value, icon, from, to, loading }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${from} ${to} p-3.5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-white/80">{label}</p>
          <p className="mt-0.5 text-xl font-extrabold text-white">{loading ? '…' : value}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/25">
          <icon.component className="text-white" style={{ width: 15, height: 15 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Card skeleton ───────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="h-44 bg-gray-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-full mt-2" />
        <div className="flex gap-1 mt-1">
          {[1,2,3].map(i => <div key={i} className="h-5 w-14 bg-gray-100 rounded-lg" />)}
        </div>
        <div className="h-9 bg-gray-100 rounded-xl mt-2" />
      </div>
    </div>
  );
}

/* ─── Sidebar — top workers ───────────────────────────────── */
function SidebarTopWorkers({ laborers }) {
  const top = [...laborers]
    .filter(w => (parseFloat(w.rating ?? w.avg_rating) || 0) > 0)
    .sort((a, b) => (parseFloat(b.rating ?? b.avg_rating) || 0) - (parseFloat(a.rating ?? a.avg_rating) || 0))
    .slice(0, 5);

  if (!top.length) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-gray-900">
        <Trophy size={14} className="text-amber-500" /> সেরা শ্রমিক
      </h3>
      <div className="space-y-2.5">
        {top.map((w, i) => {
          const rating = parseFloat(w.rating ?? w.avg_rating) || 0;
          return (
            <Link key={w.user_id || w.id} to={`/app/labor/${w.user_id || w.id}`}
              className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-gray-50 transition group">
              <div className="relative flex-shrink-0">
                <UserPhoto
                  src={w.photo_url || w.photo}
                  name={w.full_name}
                  className="h-9 w-9 rounded-full object-cover"
                  fallbackClassName="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-extrabold text-emerald-700"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-extrabold text-white shadow">
                  {i + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-extrabold text-gray-800 group-hover:text-emerald-700 transition">{w.full_name}</p>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={9} className={s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                  ))}
                  <span className="ml-0.5 text-[10px] font-semibold text-amber-600">{rating.toFixed(1)}</span>
                </div>
              </div>
              <ChevronRight size={11} className="text-gray-300 group-hover:text-emerald-500" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Sidebar — popular skills ────────────────────────────── */
function SidebarSkills({ laborers, onSkill, activeSkill }) {
  const counts = SKILL_OPTIONS.reduce((acc, s) => {
    acc[s.code] = laborers.filter(w => {
      const skills = w.skill_labels || w.skills || [];
      return skills.some(sk => typeof sk === 'string' ? sk.includes(s.label.slice(0, 4)) : sk.label?.includes(s.label.slice(0, 4)));
    }).length;
    return acc;
  }, {});

  const sorted = [...SKILL_OPTIONS].sort((a, b) => (counts[b.code] || 0) - (counts[a.code] || 0));

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-gray-900">
        <Flame size={14} className="text-orange-500" /> জনপ্রিয় দক্ষতা
      </h3>
      <div className="space-y-1.5">
        {sorted.map(s => (
          <button key={s.code} onClick={() => onSkill?.(activeSkill === s.code ? '' : s.code)}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
              activeSkill === s.code ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-gray-700 hover:bg-gray-50'
            }`}>
            <span>{s.label}</span>
            {counts[s.code] > 0 && (
              <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">{counts[s.code]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Sidebar — district breakdown ───────────────────────── */
function SidebarDistricts({ laborers }) {
  const counts = laborers.reduce((acc, w) => {
    const loc = (w.location || '').split(',')[0].trim();
    if (loc) acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(counts).sort(([,a],[,b]) => b - a).slice(0, 6);
  if (!sorted.length) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-gray-900">
        <MapPin size={14} className="text-blue-500" /> জেলা অনুযায়ী
      </h3>
      <div className="space-y-1.5">
        {sorted.map(([loc, cnt]) => (
          <div key={loc} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span className="text-xs text-gray-600">{loc}</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">{cn(cnt)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function cn(n) { return Number(n).toLocaleString('bn-BD'); }

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function LaborMarketplace() {
  const { user }                = useContext(AuthContext);
  const [search,    setSearch]  = useState('');
  const [skillCode, setSkillCode] = useState('');
  const [availOnly, setAvailOnly] = useState(false);
  const [minWage,   setMinWage]  = useState('');
  const [maxWage,   setMaxWage]  = useState('');
  const [minRating, setMinRating]= useState('');
  const [minExp,    setMinExp]   = useState('');
  const [laborers,  setLaborers] = useState([]);
  const [total,     setTotal]    = useState(0);
  const [loading,   setLoading]  = useState(true);
  const [hireTarget,setHireTarget] = useState(null);
  const [filterOpen,setFilterOpen] = useState(false);

  const isRequester = REQUESTER_ROLES.includes(user?.role_id);
  const isWorker    = user?.role_id === 4;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await laborApi.search({
        search:         search       || undefined,
        skill_code:     skillCode    || undefined,
        available:      availOnly    || undefined,
        min_wage:       minWage      || undefined,
        max_wage:       maxWage      || undefined,
        min_rating:     minRating    || undefined,
        min_experience: minExp       || undefined,
        limit: 30,
      });
      setLaborers(res.laborers || []);
      setTotal(res.pagination?.total ?? res.laborers?.length ?? 0);
    } catch {
      setLaborers([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, skillCode, availOnly, minWage, maxWage, minRating, minExp]);

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [load]);

  useLaborSocket(() => load());

  /* derived stats */
  const availCount = laborers.filter(w => w.available).length;
  const avgRating  = laborers.length
    ? (laborers.reduce((s, w) => s + (parseFloat(w.rating ?? w.avg_rating) || 0), 0) / laborers.length).toFixed(1)
    : '—';
  const avgWage = laborers.length
    ? Math.round(laborers.reduce((s, w) => s + (parseFloat(w.daily_wage) || 0), 0) / laborers.length)
    : null;

  const hasFilters = skillCode || availOnly || minWage || maxWage || minRating || minExp || search;

  const resetFilters = () => {
    setSearch(''); setSkillCode(''); setAvailOnly(false);
    setMinWage(''); setMaxWage(''); setMinRating(''); setMinExp('');
  };

  const KPI_DATA = [
    { label: 'মোট শ্রমিক',    value: bn(total),      icon: { component: Users },     from: 'from-emerald-500', to: 'to-teal-600'    },
    { label: 'গড় রেটিং',     value: avgRating,       icon: { component: Star },      from: 'from-amber-500',   to: 'to-orange-500'  },
    { label: 'উপলব্ধ এখন',   value: bn(availCount),  icon: { component: Calendar },  from: 'from-green-500',   to: 'to-emerald-600' },
    { label: 'গড় মজুরি (৳)', value: avgWage ? `৳${bn(avgWage)}` : '—', icon: { component: BarChart2 }, from: 'from-blue-500', to: 'to-indigo-500' },
  ];

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
                <h1 className="text-xl font-extrabold text-gray-900">কৃষি শ্রমিক বাজার</h1>
                <p className="text-xs text-gray-500">দক্ষ কৃষি শ্রমিক খুঁজুন, নিয়োগ করুন এবং উৎপাদনশীলতা বৃদ্ধি করুন</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
              </button>
              {isRequester && (
                <Link to="/app/labor/jobs/new"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
                  <PlusCircle size={14} /> শ্রমিক নিয়োগ পোস্ট
                </Link>
              )}
              {isWorker && (
                <Link to="/app/my-labor"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
                  শ্রমিক ড্যাশবোর্ড
                </Link>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="নাম, দক্ষতা, জেলা বা কাজের ধরন খুঁজুন..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-9 pr-4 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition" />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <button onClick={() => setFilterOpen(o => !o)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                filterOpen || hasFilters
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}>
              <SlidersHorizontal size={15} /> ফিল্টার
              {hasFilters && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
            </button>
          </div>

          {/* Filter panel */}
          {filterOpen && (
            <div className="mt-3 grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">ন্যূন. মজুরি (৳)</label>
                <input type="number" value={minWage} onChange={e => setMinWage(e.target.value)} placeholder="যেমন: ৫০০"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">সর্বোচ্চ মজুরি (৳)</label>
                <input type="number" value={maxWage} onChange={e => setMaxWage(e.target.value)} placeholder="যেমন: ১০০০"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">ন্যূন. রেটিং</label>
                <select value={minRating} onChange={e => setMinRating(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none appearance-none">
                  <option value="">যেকোনো</option>
                  <option value="3">৩+</option>
                  <option value="4">৪+</option>
                  <option value="4.5">৪.৫+</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">ন্যূন. অভিজ্ঞতা</label>
                <select value={minExp} onChange={e => setMinExp(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none appearance-none">
                  <option value="">যেকোনো</option>
                  <option value="1">১+ বছর</option>
                  <option value="3">৩+ বছর</option>
                  <option value="5">৫+ বছর</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 sm:col-span-2 lg:col-span-1">
                <div onClick={() => setAvailOnly(o => !o)}
                  className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition ${availOnly ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                  {availOnly && <span className="text-[9px] text-white font-extrabold">✓</span>}
                </div>
                <span className="text-sm font-semibold text-gray-700">শুধু উপলব্ধ শ্রমিক</span>
              </label>
              <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
                <button onClick={resetFilters}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">
                  রিসেট করুন
                </button>
                <button onClick={() => setFilterOpen(false)}
                  className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
                  ফলাফল দেখুন
                </button>
              </div>
            </div>
          )}

          {/* KPI strip */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPI_DATA.map(k => (
              <div key={k.label} className={`rounded-2xl bg-gradient-to-br ${k.from} ${k.to} p-3.5 shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-white/80">{k.label}</p>
                    <p className="mt-0.5 text-xl font-extrabold text-white">{loading ? '…' : k.value}</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/25">
                    <k.icon.component className="text-white" style={{ width: 15, height: 15 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="mx-auto max-w-7xl px-4 py-5">

        {/* Skill chips */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setSkillCode('')}
            className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              !skillCode ? 'bg-emerald-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
            }`}>
            সকল দক্ষতা
          </button>
          {SKILL_OPTIONS.map(s => (
            <button key={s.code} onClick={() => setSkillCode(skillCode === s.code ? '' : s.code)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                skillCode === s.code
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
              }`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Result count + filter clear */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? 'খোঁজা হচ্ছে…' : `${bn(laborers.length)} জন শ্রমিক পাওয়া গেছে`}
          </p>
          {hasFilters && (
            <button onClick={resetFilters}
              className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 transition">
              <X size={11} /> ফিল্টার মুছুন
            </button>
          )}
        </div>

        {/* 2-column layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

          {/* ─── Main cards ─── */}
          <div>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : laborers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center">
                <Users className="mb-4 text-gray-200" size={52} />
                <p className="font-extrabold text-gray-500">এই ফিল্টারে কোনো শ্রমিক পাওয়া যায়নি</p>
                <p className="mt-1 text-sm text-gray-400">অনুসন্ধান পরিবর্তন করুন অথবা ফিল্টার রিসেট করুন</p>
                <button onClick={resetFilters}
                  className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
                  ফিল্টার রিসেট করুন
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {laborers.map(w => (
                  <LaborCard key={w.user_id || w.id} laborer={w} onHire={setHireTarget} />
                ))}
              </div>
            )}
          </div>

          {/* ─── Sidebar ─── */}
          <div className="hidden lg:flex flex-col gap-4">

            {/* Top workers */}
            <SidebarTopWorkers laborers={laborers} />

            {/* Popular skills */}
            <SidebarSkills laborers={laborers} onSkill={setSkillCode} activeSkill={skillCode} />

            {/* District breakdown */}
            <SidebarDistricts laborers={laborers} />

            {/* Job posts CTA */}
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-center shadow-sm">
              <Briefcase className="mx-auto mb-2 text-emerald-600" size={26} />
              <p className="font-extrabold text-emerald-900 text-sm">কাজের পোস্ট</p>
              <p className="mt-1 text-[11px] text-emerald-700">বিজ্ঞপ্তি দিন এবং সরাসরি শ্রমিক খুঁজুন</p>
              <div className="mt-3 flex flex-col gap-2">
                <Link to="/app/labor/jobs"
                  className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 transition">
                  উপলব্ধ কাজ দেখুন <ChevronRight size={12} />
                </Link>
                {isRequester && (
                  <Link to="/app/labor/requests"
                    className="flex items-center justify-center gap-1 rounded-xl border border-emerald-200 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition">
                    আমার অনুরোধ
                  </Link>
                )}
              </div>
            </div>

            {/* Labor stats */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-gray-900">
                <BarChart2 size={14} className="text-blue-500" /> শ্রমিক পরিসংখ্যান
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'মোট শ্রমিক',   value: bn(total),       color: 'text-emerald-700' },
                  { label: 'উপলব্ধ এখন',  value: bn(availCount),  color: 'text-green-700'   },
                  { label: 'গড় রেটিং',    value: `${avgRating} ⭐`, color: 'text-amber-700'  },
                  { label: 'গড় মজুরি',    value: avgWage ? `৳${bn(avgWage)}` : '—', color: 'text-blue-700' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <span className="text-xs text-gray-500">{s.label}</span>
                    <span className={`text-sm font-extrabold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hire modal */}
      {hireTarget && (
        <HireRequestModal laborer={hireTarget} onClose={() => setHireTarget(null)} onSuccess={load} />
      )}

      <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}
