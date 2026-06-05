import { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Award, BookOpen, CheckCircle2, Lock, Play,
  Clock, Users, Star, GraduationCap, ChevronRight,
  FileText, Volume2, HelpCircle, Paperclip, BarChart2,
  Shield, Download,
} from 'lucide-react';
import { educationApi } from '../../shared/services/educationApi';
import {
  canAccessCourseLessons,
  isLessonLocked,
  lessonIcon,
  parseCourseDetailResponse,
} from './educationUtils';
import { Skeleton } from '../../shared/design-system/Skeleton';
import { toast } from 'react-toastify';
import { cn } from '../../shared/lib/cn';
import { AuthContext } from '../../core/auth/AuthContext';

const DIFFICULTY_META = {
  'শুরু':  { label: 'শুরু',   cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  'মধ্যম': { label: 'মধ্যম', cls: 'bg-amber-100   text-amber-800   border-amber-200'   },
  'উন্নত': { label: 'উন্নত', cls: 'bg-orange-100  text-orange-800  border-orange-200'  },
};

const CONTENT_TYPE_ICON = {
  video:    { Icon: Play,      label: 'ভিডিও',    color: 'text-blue-500'   },
  text:     { Icon: FileText,  label: 'পাঠ',       color: 'text-purple-500' },
  audio:    { Icon: Volume2,   label: 'অডিও',     color: 'text-teal-500'   },
  quiz:     { Icon: HelpCircle,label: 'কুইজ',     color: 'text-orange-500' },
  resource: { Icon: Paperclip, label: 'রিসোর্স',   color: 'text-pink-500'   },
};

function LessonTypeMeta(type) {
  return CONTENT_TYPE_ICON[type] || { Icon: FileText, label: 'পাঠ', color: 'text-gray-400' };
}

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) ?? {};

  const [course,           setCourse]           = useState(null);
  const [lessons,          setLessons]          = useState([]);
  const [enrollment,       setEnrollment]       = useState(null);
  const [certificate,      setCertificate]      = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [enrollmentLoading,setEnrollmentLoading]= useState(true);
  const [enrolling,        setEnrolling]        = useState(false);

  const applyCourseData = useCallback((parsed) => {
    setCourse(parsed.course);
    setLessons(parsed.lessons);
    setEnrollment(parsed.enrollment);
    setCertificate(parsed.certificate);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setEnrollmentLoading(true);
    try {
      const res = await educationApi.getCourse(courseId);
      applyCourseData(parseCourseDetailResponse(res));
    } catch (e) {
      toast.error(e.message);
      applyCourseData({ course: null, lessons: [], enrollment: null, certificate: null });
    } finally {
      setLoading(false);
      setEnrollmentLoading(false);
    }
  }, [applyCourseData, courseId]);

  useEffect(() => { load(); }, [load]);

  const enroll = async () => {
    setEnrolling(true);
    try {
      const res = await educationApi.enroll(courseId);
      const next = res.enrollment || res.data?.enrollment;
      if (next) setEnrollment(next);
      toast.success('কোর্সে এনরোল হয়েছে');
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEnrolling(false);
    }
  };

  /* ── loading skeleton ── */
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4">
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-20 text-center">
        <GraduationCap size={48} className="mx-auto text-gray-200 mb-4" />
        <p className="font-bold text-gray-500">কোর্স পাওয়া যায়নি</p>
        <Link to="/app/education" className="mt-3 inline-block text-sm text-emerald-700 font-semibold">
          ← কোর্স তালিকায় ফিরুন
        </Link>
      </div>
    );
  }

  const canAccess = canAccessCourseLessons(enrollment);
  const progress  = enrollment?.progress_percent ?? 0;
  const diffMeta  = DIFFICULTY_META[course.difficulty] || DIFFICULTY_META['শুরু'];
  const completedCount = lessons.filter(l => l.progress?.is_completed).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">

      {/* ══ HERO ══ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-800 to-teal-700">
        {/* Cover image as background */}
        {course.thumbnail_url && (
          <img src={course.thumbnail_url} alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-20" />
        )}
        <div className="relative mx-auto max-w-5xl px-4 py-8">
          <Link to="/app/education"
            className="mb-4 inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/30 transition">
            <ArrowLeft size={15} /> কোর্স তালিকা
          </Link>
          <div className="mt-2 flex flex-wrap items-start gap-6">
            {/* Course cover thumbnail */}
            {course.thumbnail_url && (
              <div className="hidden sm:block w-40 flex-shrink-0 overflow-hidden rounded-2xl shadow-2xl">
                <img src={course.thumbnail_url} alt="" className="h-28 w-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${diffMeta.cls}`}>
                  {course.difficulty || 'শুরু'}
                </span>
                {certificate && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-900">
                    <Award size={11} /> সনদ অর্জিত
                  </span>
                )}
              </div>
              <h1 className="text-xl font-extrabold text-white md:text-2xl leading-snug">
                {course.title}
              </h1>
              <p className="mt-1 text-sm text-emerald-200 font-semibold">
                👨‍🏫 {course.instructor_name}
              </p>
              <p className="mt-2 text-sm text-emerald-100 line-clamp-2">{course.description}</p>
              {/* Stats */}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-emerald-200">
                <span className="flex items-center gap-1"><BookOpen size={13} />{lessons.length} পাঠ</span>
                {course.duration && <span className="flex items-center gap-1"><Clock size={13} />{course.duration}</span>}
                <span className="flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" />4.8 রেটিং</span>
                <span className="flex items-center gap-1"><Users size={13} />শিক্ষার্থীরা</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* ─── LEFT ─── */}
          <div className="space-y-5">

            {/* About */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-2 font-extrabold text-gray-900 flex items-center gap-2">
                <BookOpen className="text-emerald-600" size={18} /> কোর্স সম্পর্কে
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">{course.description}</p>

              {/* Progress bar */}
              {canAccess && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <span className="font-semibold text-gray-700">অগ্রগতি</span>
                    <span className="font-extrabold text-emerald-700">{progress}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-2.5 rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                      style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">{completedCount}/{lessons.length} পাঠ সম্পন্ন</p>
                </div>
              )}
            </div>

            {/* What you'll learn */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
              <h2 className="mb-3 font-extrabold text-emerald-900 flex items-center gap-2">
                <GraduationCap className="text-emerald-600" size={18} /> আপনি কী শিখবেন
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  'কৃষি বিজ্ঞানের মূল ধারণাসমূহ',
                  'ব্যবহারিক খামার ব্যবস্থাপনা',
                  'রোগ সনাক্তকরণ ও প্রতিরোধ',
                  'আধুনিক প্রযুক্তির ব্যবহার',
                  'বাজার ব্যবস্থাপনা ও বিপণন',
                  'সার্টিফিকেট অর্জনের সুযোগ',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-emerald-800">
                    <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructor card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-extrabold text-gray-900 flex items-center gap-2">
                <Users className="text-emerald-600" size={18} /> প্রশিক্ষক
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl shadow">
                  👨‍🏫
                </div>
                <div>
                  <p className="font-extrabold text-gray-900">{course.instructor_name}</p>
                  <p className="text-sm text-gray-500">কৃষি বিশেষজ্ঞ ও প্রশিক্ষক</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Star size={11} className="fill-amber-400 text-amber-400" />4.9</span>
                    <span className="flex items-center gap-1"><BookOpen size={11} />বিশেষজ্ঞ কোর্স</span>
                    <span className="flex items-center gap-1"><Users size={11} />অনেক শিক্ষার্থী</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Curriculum */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-extrabold text-gray-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart2 className="text-emerald-600" size={18} />
                  পাঠ্যক্রম
                </span>
                <span className="text-sm font-normal text-gray-400">
                  {completedCount}/{lessons.length} সম্পন্ন
                </span>
              </h2>

              {enrollmentLoading && user ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : (
                <ul className="space-y-2">
                  {lessons.map((lesson, idx) => {
                    const done   = lesson.progress?.is_completed;
                    const locked = isLessonLocked(enrollment, lesson);
                    const meta   = LessonTypeMeta(lesson.content_type);
                    return (
                      <li key={lesson.lesson_id}>
                        <button type="button" disabled={locked}
                          onClick={() => !locked && navigate(`/app/education/${courseId}/lesson/${lesson.lesson_id}`)}
                          className={cn(
                            'group flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all',
                            locked  ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60' : 'border-gray-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-sm',
                            done    && 'border-emerald-100 bg-emerald-50/50',
                          )}>
                          {/* Lesson number / status */}
                          <div className={cn(
                            'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold',
                            done   ? 'bg-emerald-100 text-emerald-700'
                            :locked ? 'bg-gray-100 text-gray-400'
                            :         'bg-gray-100 text-gray-600 group-hover:bg-emerald-100 group-hover:text-emerald-700',
                          )}>
                            {done ? <CheckCircle2 size={16} className="text-emerald-600" /> : idx + 1}
                          </div>
                          {/* Type icon */}
                          <div className={cn('flex-shrink-0', meta.color)}>
                            <meta.Icon size={16} />
                          </div>
                          {/* Title */}
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-semibold', done ? 'text-emerald-800' : 'text-gray-900', 'truncate')}>
                              {lesson.title}
                            </p>
                            <p className="text-[11px] text-gray-400 capitalize">{meta.label}</p>
                          </div>
                          {/* Right icon */}
                          {locked
                            ? <Lock size={15} className="text-gray-300 flex-shrink-0" />
                            : done
                            ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                            : <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 flex-shrink-0 transition" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Certificate info */}
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 p-5 shadow-sm">
              <h2 className="mb-3 font-extrabold text-amber-900 flex items-center gap-2">
                <Award className="text-amber-600" size={18} /> সার্টিফিকেট তথ্য
              </h2>
              <div className="flex items-start gap-3">
                <div className="text-4xl">🏆</div>
                <div>
                  <p className="font-bold text-amber-800">কোর্স সম্পন্ন সনদ</p>
                  <p className="text-sm text-amber-700 mt-1">এই কোর্সের সব পাঠ শেষ করলে স্বয়ংক্রিয়ভাবে একটি ডিজিটাল সার্টিফিকেট তৈরি হবে।</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { icon: Shield,   label: 'যাচাইযোগ্য সনদ' },
                      { icon: Download, label: 'PDF ডাউনলোড' },
                    ].map(f => (
                      <span key={f.label} className="flex items-center gap-1.5 rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                        <f.icon size={12} /> {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT (sticky enrollment card) ─── */}
          <div>
            <div className="sticky top-4 space-y-4">

              {/* Enrollment / Progress card */}
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg">
                {/* Course thumbnail in card */}
                {course.thumbnail_url ? (
                  <div className="relative h-36 overflow-hidden">
                    <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl">
                        <Play className="text-emerald-600 ml-1" size={22} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 text-6xl opacity-60">🌾</div>
                )}

                <div className="p-5">
                  {/* Progress */}
                  {canAccess && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-600">অগ্রগতি</span>
                        <span className="text-sm font-extrabold text-emerald-700">{progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-2 rounded-full transition-all ${progress >= 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                          style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* CTA buttons */}
                  {enrollmentLoading && user ? (
                    <div className="h-11 animate-pulse rounded-xl bg-gray-100" />
                  ) : !canAccess ? (
                    <button type="button" disabled={enrolling || !user} onClick={enroll}
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-extrabold text-white hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 shadow-sm transition">
                      {enrolling ? 'এনরোল হচ্ছে…' : '🎓 কোর্সে যোগ দিন — বিনামূল্যে'}
                    </button>
                  ) : (
                    <button type="button" onClick={() => {
                      const next = lessons.find(l => !l.progress?.is_completed) || lessons[0];
                      if (next) navigate(`/app/education/${courseId}/lesson/${next.lesson_id}`);
                    }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-extrabold text-white hover:from-emerald-700 hover:to-teal-700 shadow-sm transition">
                      <Play size={18} />
                      {progress >= 100 ? 'পুনরায় দেখুন' : 'শেখা চালিয়ে যান'}
                    </button>
                  )}

                  {/* Certificate button */}
                  {certificate && (
                    <Link to="/app/education/certificates"
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-sm font-extrabold text-amber-800 hover:bg-amber-100 transition">
                      <Award size={16} /> সনদ দেখুন
                    </Link>
                  )}

                  {/* Course stats */}
                  <div className="mt-4 space-y-2">
                    {[
                      { icon: BookOpen,     label: 'মোট পাঠ',    val: `${lessons.length} টি` },
                      { icon: Clock,        label: 'সময়কাল',    val: course.duration || '—' },
                      { icon: BarChart2,    label: 'কঠিনতা',    val: course.difficulty || 'শুরু' },
                      { icon: Award,        label: 'সার্টিফিকেট', val: 'অন্তর্ভুক্ত' },
                    ].map(s => (
                      <div key={s.label} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-600">
                          <s.icon size={14} className="text-gray-400" /> {s.label}
                        </span>
                        <span className="font-semibold text-gray-800">{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                <div className="text-2xl mb-1">🔒</div>
                <p className="text-xs text-emerald-800 font-semibold">বিনামূল্যে এনরোল করুন</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">সব কোর্স বিনামূল্যে পাওয়া যাচ্ছে</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
