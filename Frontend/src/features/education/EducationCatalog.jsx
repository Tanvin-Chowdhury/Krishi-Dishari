import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  GraduationCap, BookOpen, Play, Search, Award, ChevronRight,
  Clock, Filter, X, Flame, Trophy, CheckCircle, BarChart2,
  TrendingUp, Star, Zap, RefreshCw, Users,
} from 'lucide-react';
import { educationApi } from '../../shared/services/educationApi';
import { CATEGORIES } from './educationUtils';
import { AuthContext } from '../../core/auth/AuthContext';

/* ─── Learning paths (maps to CATEGORIES ids) ─────────────── */
const LEARNING_PATHS = [
  { id: 'rice',       icon: '🌾', title: 'ধান বিশেষজ্ঞ',    desc: 'ধান উৎপাদন ও রোগ ব্যবস্থাপনা',  from: 'from-emerald-500', to: 'to-teal-600' },
  { id: 'vegetables', icon: '🥬', title: 'সবজি বিশেষজ্ঞ',    desc: 'সবজি চাষ ও সংরক্ষণ পদ্ধতি',     from: 'from-green-500',   to: 'to-emerald-600' },
  { id: 'seed',       icon: '🌱', title: 'বীজ উৎপাদন',        desc: 'উন্নত বীজ প্রযুক্তি ও সংরক্ষণ',  from: 'from-lime-500',    to: 'to-green-600' },
  { id: 'irrigation', icon: '💧', title: 'সেচ ব্যবস্থাপনা',   desc: 'আধুনিক সেচ ও জল সাশ্রয়',       from: 'from-sky-500',     to: 'to-blue-600' },
  { id: 'fertilizer', icon: '🧪', title: 'সার ব্যবস্থাপনা',   desc: 'সুষম সার প্রয়োগ ও মাটি পরীক্ষা', from: 'from-amber-500',   to: 'to-orange-600' },
  { id: 'disease',    icon: '🦠', title: 'রোগ ব্যবস্থাপনা',   desc: 'ফসলের রোগ প্রতিরোধ ও নিয়ন্ত্রণ', from: 'from-rose-500',    to: 'to-red-600' },
];

const DIFFICULTY_BADGE = {
  'শুরু':  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'মধ্যম': 'bg-amber-100 text-amber-800 border-amber-200',
  'উন্নত': 'bg-orange-100 text-orange-800 border-orange-200',
};

/* ─── Progress ring ───────────────────────────────────────── */
function ProgressRing({ percent, size = 80 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (Math.min(100, percent) / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#d1fae5" strokeWidth={7} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#059669" strokeWidth={7}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
    </svg>
  );
}

/* ─── Course skeleton ─────────────────────────────────────── */
function CourseSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="h-44 bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="mt-3 h-2 bg-gray-100 rounded w-full" />
        <div className="h-2 bg-gray-100 rounded w-4/5" />
      </div>
    </div>
  );
}

/* ─── Course card ─────────────────────────────────────────── */
function CourseCard({ course }) {
  const badgeCls = DIFFICULTY_BADGE[course.difficulty] || DIFFICULTY_BADGE['শুরু'];
  const progress = course.progress_percent ?? 0;
  const isEnrolled = progress > 0 || course.is_enrolled;
  const isCompleted = progress >= 100;

  return (
    <Link to={`/app/education/${course.course_id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* Cover image */}
      <div className="relative h-44 flex-shrink-0 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl opacity-50">🌾</div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
            <Play className="text-emerald-600 ml-0.5" size={20} />
          </div>
        </div>
        {/* Difficulty badge */}
        <div className={`absolute right-2 top-2 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${badgeCls}`}>
          {course.difficulty || 'শুরু'}
        </div>
        {/* Progress badge */}
        {isCompleted ? (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
            <CheckCircle size={10} /> সম্পন্ন
          </div>
        ) : isEnrolled ? (
          <div className="absolute left-2 top-2 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-extrabold text-white">
            {progress}%
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-extrabold text-gray-900 line-clamp-2 group-hover:text-emerald-700 transition leading-snug">
          {course.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500 line-clamp-1">{course.instructor_name}</p>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><BookOpen size={12} />{course.lesson_count || 0} পাঠ</span>
          {course.duration && <span className="flex items-center gap-1"><Clock size={12} />{course.duration}</span>}
          <span className="flex items-center gap-1 ml-auto"><Star size={11} className="fill-amber-400 text-amber-400" />4.8</span>
        </div>

        {/* Progress bar */}
        {isEnrolled && (
          <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-1.5 rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-amber-400'}`}
              style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-3">
          <span className={`inline-flex items-center gap-1.5 text-sm font-extrabold ${
            isCompleted ? 'text-emerald-600' : isEnrolled ? 'text-amber-600' : 'text-emerald-700'
          }`}>
            {isCompleted ? <><CheckCircle size={14} /> পুনরায় দেখুন</>
              : isEnrolled ? <><Play size={14} /> চালিয়ে যান</>
              : <>শুরু করুন <ChevronRight size={14} /></>}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function EducationCatalog() {
  const { user } = useContext(AuthContext) ?? {};

  const [courses,          setCourses]          = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [search,           setSearch]           = useState('');
  const [searchDebounced,  setSearchDebounced]  = useState('');
  const [category,         setCategory]         = useState('all');
  const [difficulty,       setDifficulty]       = useState('');

  const [enrollments,      setEnrollments]      = useState([]);
  const [certificates,     setCertificates]     = useState([]);
  const [personalLoading,  setPersonalLoading]  = useState(false);

  /* debounce */
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  /* load courses */
  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await educationApi.listCourses({
        search:     searchDebounced || undefined,
        category:   category !== 'all' ? category : undefined,
        difficulty: difficulty || undefined,
        limit:      40,
      });
      setCourses(res.courses || []);
    } catch { setCourses([]); }
    finally { setLoading(false); }
  }, [searchDebounced, category, difficulty]);

  useEffect(() => { loadCourses(); }, [loadCourses]);

  /* load personal data */
  useEffect(() => {
    if (!user) return;
    setPersonalLoading(true);
    Promise.all([
      educationApi.myEnrollments().then(r => setEnrollments(r.enrollments || [])).catch(() => setEnrollments([])),
      educationApi.myCertificates().then(r => setCertificates(r.certificates || [])).catch(() => setCertificates([])),
    ]).finally(() => setPersonalLoading(false));
  }, [user]);

  /* derived stats */
  const completed  = useMemo(() => enrollments.filter(e => e.status === 'completed' || e.is_completed || (e.progress_percent ?? 0) >= 100), [enrollments]);
  const inProgress = useMemo(() => enrollments.filter(e => !completed.includes(e)), [enrollments, completed]);
  const avgProgress = useMemo(() => {
    if (!enrollments.length) return 0;
    return Math.round(enrollments.reduce((s, e) => s + (e.progress_percent || 0), 0) / enrollments.length);
  }, [enrollments]);
  const latestEnrollment = inProgress[0] || enrollments[0] || null;

  const clearFilters = () => { setSearch(''); setCategory('all'); setDifficulty(''); };
  const hasFilters = search || category !== 'all' || difficulty;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HERO ══ */}
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm flex-shrink-0">
                <GraduationCap size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">কৃষি একাডেমি</h1>
                <p className="text-xs text-gray-500">ভিডিও, কোর্স, সার্টিফিকেট ও বিশেষজ্ঞ প্রশিক্ষণ</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/app/education/certificates"
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                <Award size={14} className="text-amber-500" /> আমার সনদ
              </Link>
              <button onClick={loadCourses}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
              </button>
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: BookOpen, label: 'মোট কোর্স',         value: courses.length || 0, from: 'from-emerald-500', to: 'to-teal-600'   },
              { icon: Users,    label: 'আমার এনরোলমেন্ট',  value: enrollments.length,  from: 'from-blue-500',   to: 'to-indigo-500' },
              { icon: Award,    label: 'সার্টিফিকেট',      value: certificates.length, from: 'from-amber-500',  to: 'to-orange-500' },
              { icon: Star,     label: 'গড় রেটিং',         value: '4.8',               from: 'from-purple-500', to: 'to-pink-500'   },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.from} ${s.to} p-3.5 shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-white/80">{s.label}</p>
                    <p className="mt-0.5 text-xl font-extrabold text-white">{s.value}</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/25">
                    <s.icon className="text-white" style={{ width: 15, height: 15 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search + category pills */}
        <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="relative border-b border-gray-100">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="কোর্স, বিষয় বা প্রশিক্ষকের নাম খুঁজুন…"
              className="w-full border-0 py-3 pl-10 pr-4 text-sm text-gray-900 focus:outline-none focus:ring-0 bg-transparent" />
        </div>
          <div className="flex gap-2 overflow-x-auto px-4 py-2.5">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                category === cat.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700 bg-white'
                }`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

          {/* ─── LEFT ─── */}
          <div className="space-y-6">

            {/* My Learning Progress */}
            {user && (personalLoading || enrollments.length > 0) && (
              <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="text-emerald-600" size={18} />
                  <h2 className="font-extrabold text-gray-900">আমার শেখার অগ্রগতি</h2>
                </div>
                {personalLoading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-emerald-100" />)}
          </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-5">
                    {/* Ring */}
                    <div className="relative flex-shrink-0">
                      <ProgressRing percent={avgProgress} size={84} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-extrabold text-emerald-700">{avgProgress}%</span>
                        <span className="text-[10px] text-gray-400">গড় অগ্রগতি</span>
                      </div>
                    </div>
                    {/* KPI cards */}
                    <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 min-w-0">
                      {[
                        { label: 'মোট এনরোলমেন্ট', value: enrollments.length, color: 'text-blue-600',   bg: 'bg-blue-50',   icon: BookOpen   },
                        { label: 'চলমান',            value: inProgress.length, color: 'text-amber-600',  bg: 'bg-amber-50',  icon: Play       },
                        { label: 'সম্পন্ন',          value: completed.length,  color: 'text-emerald-600',bg: 'bg-emerald-50',icon: CheckCircle},
                        { label: 'সার্টিফিকেট',     value: certificates.length,color:'text-purple-600', bg: 'bg-purple-50', icon: Award      },
                      ].map(s => (
                        <div key={s.label} className={`rounded-xl border border-gray-100 ${s.bg} p-3 text-center`}>
                          <s.icon className={`mx-auto mb-1 ${s.color}`} size={18} />
                          <div className="text-xl font-extrabold text-gray-900">{s.value}</div>
                          <div className="text-[10px] text-gray-500 leading-tight">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Continue button */}
                    {latestEnrollment && (
                      <Link to={`/app/education/${latestEnrollment.course_id || latestEnrollment.id}`}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 transition shadow-sm flex-shrink-0">
                        <Play size={14} /> শেখা চালিয়ে যান
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Learning Paths */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="text-emerald-600" size={18} />
                <h2 className="font-extrabold text-gray-900">শেখার পথ</h2>
                <span className="ml-1 text-xs text-gray-400">বিশেষজ্ঞ হওয়ার রোডম্যাপ</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {LEARNING_PATHS.map(path => (
                  <button key={path.id} onClick={() => setCategory(path.id)}
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${path.from} ${path.to} p-4 text-left text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
                    <div className="text-2xl mb-2">{path.icon}</div>
                    <div className="font-extrabold text-sm leading-tight">{path.title}</div>
                    <div className="text-[11px] text-white/70 mt-0.5 line-clamp-1">{path.desc}</div>
                    <ChevronRight size={14} className="absolute bottom-3 right-3 text-white/50 group-hover:text-white/90 transition" />
                  </button>
                ))}
              </div>
            </div>

            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-sm font-semibold text-gray-600">
                <Filter size={14} /> কঠিনতা:
                  </span>
              {[
                { val: '',       label: 'সব স্তর' },
                { val: 'শুরু',   label: '🟢 শুরু' },
                { val: 'মধ্যম',  label: '🟡 মধ্যম' },
                { val: 'উন্নত',  label: '🔴 উন্নত' },
              ].map(d => (
                <button key={d.val} onClick={() => setDifficulty(d.val)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    difficulty === d.val
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 text-gray-600 hover:border-emerald-300 bg-white'
                  }`}>
                  {d.label}
                </button>
              ))}
              {hasFilters && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 transition">
                  <X size={12} /> ফিল্টার মুছুন
                </button>
              )}
              <span className="ml-auto text-xs text-gray-400">{courses.length} কোর্স</span>
            </div>

            {/* Course grid */}
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => <CourseSkeleton key={i} />)}
              </div>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center">
                <BookOpen className="mb-3 text-gray-200" size={52} />
                <p className="font-extrabold text-gray-500">কোনো কোর্স পাওয়া যায়নি</p>
                <p className="text-sm text-gray-400 mt-1">অন্য বিভাগ বা সার্চ চেষ্টা করুন</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-4 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white">
                    ফিল্টার মুছুন
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {courses.map(c => <CourseCard key={c.course_id} course={c} />)}
              </div>
                  )}
                </div>

          {/* ─── RIGHT SIDEBAR ─── */}
          <div className="hidden lg:flex flex-col gap-4">

            {/* Achievements */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-gray-900">
                <Trophy className="text-amber-500" size={16} /> অর্জনসমূহ
                  </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '🌾', label: 'ধান বিশেষজ্ঞ',  need: 1 },
                  { icon: '🥬', label: 'সবজি বিশেষজ্ঞ', need: 2 },
                  { icon: '💧', label: 'সেচ মাস্টার',   need: 3 },
                  { icon: '🦠', label: 'রোগ বিশেষজ্ঞ',  need: 4 },
                ].map(a => {
                  const unlocked = completed.length >= a.need;
                  return (
                    <div key={a.label}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition ${
                        unlocked ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50 opacity-50'
                      }`}>
                      <span className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>{a.icon}</span>
                      <span className="text-[10px] font-bold text-gray-700 leading-tight">{a.label}</span>
                      {!unlocked && <span className="text-[9px] text-gray-400">🔒 লক</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Learning streak */}
            <div className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="text-orange-500" size={20} />
                <span className="font-extrabold text-orange-800 text-sm">লার্নিং স্ট্রিক</span>
              </div>
              <div className="text-4xl font-extrabold text-orange-600">
                {enrollments.length > 0 ? `${Math.min(7, enrollments.length)} দিন` : '০ দিন'}
              </div>
              <p className="text-xs text-orange-700 mt-1">প্রতিদিন শিখুন, দক্ষতা বাড়ান!</p>
              <div className="mt-3 flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                  <div key={d} className={`flex-1 rounded-full h-2 ${d <= Math.min(7, enrollments.length) ? 'bg-orange-400' : 'bg-orange-200'}`} />
                ))}
              </div>
                  </div>

            {/* Certificate CTA */}
            {certificates.length > 0 ? (
              <Link to="/app/education/certificates"
                className="group flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 shadow-sm hover:shadow-md transition">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400 shadow text-lg">🏆</div>
                <div className="flex-1">
                  <p className="font-extrabold text-amber-800 text-sm">{certificates.length}টি সার্টিফিকেট অর্জিত</p>
                  <p className="text-[11px] text-amber-700">দেখুন ও ডাউনলোড করুন</p>
                </div>
                <ChevronRight className="text-amber-400 group-hover:text-amber-600 transition" size={16} />
              </Link>
            ) : (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-center">
                <div className="text-3xl mb-2">🏆</div>
                <p className="text-sm font-bold text-amber-800">এখনো সার্টিফিকেট নেই</p>
                <p className="text-[11px] text-amber-600 mt-0.5">কোর্স সম্পন্ন করে সার্টিফিকেট অর্জন করুন</p>
              </div>
            )}

            {/* Top Categories */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-gray-900">
                <BookOpen className="text-emerald-500" size={16} /> বিভাগসমূহ
              </h3>
              <div className="space-y-1.5">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-left transition ${
                      category === cat.id ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`}>
                    <span className="text-base">{cat.icon}</span>
                    <span className="flex-1">{cat.name}</span>
                    {category === cat.id && <ChevronRight size={14} className="text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-gray-900">
                <Zap className="text-emerald-500" size={16} /> শেখার টিপস
              </h3>
              <div className="space-y-2 text-xs text-gray-600">
                {['📺 প্রতিদিন ১টি ভিডিও পাঠ দেখুন', '✏️ নোট নিন এবং অনুশীলন করুন', '🤝 কমিউনিটিতে প্রশ্ন করুন', '🎯 কোর্স শেষ করে সার্টিফিকেট নিন'].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">{t}</div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
