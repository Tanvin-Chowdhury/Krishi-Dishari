import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  Loader2,
  VideoOff,
} from 'lucide-react';
import { educationApi } from '../../shared/services/educationApi';
import {
  getLessonVideoPlayback,
  parseLessonResponse,
} from './educationUtils';
import { Skeleton } from '../../shared/design-system/Skeleton';
import { toast } from 'react-toastify';
import { cn } from '../../shared/lib/cn';

function VideoLessonPlayer({ lesson, onPlaybackStateChange }) {
  const playback = getLessonVideoPlayback(lesson);
  const [loading, setLoading] = useState(Boolean(playback.valid));
  const [failed, setFailed] = useState(!playback.valid);

  useEffect(() => {
    const next = getLessonVideoPlayback(lesson);
    setLoading(Boolean(next.valid));
    setFailed(!next.valid);
  }, [lesson?.lesson_id, lesson?.video_url, lesson?.video_playback_url]);

  useEffect(() => {
    onPlaybackStateChange?.({ ready: !failed && !loading, failed });
  }, [failed, loading, onPlaybackStateChange]);

  if (failed || !playback.valid || !playback.src) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
        <VideoOff size={40} className="text-slate-400" aria-hidden />
        <p className="text-sm font-medium text-slate-700">
          ভিডিওটি বর্তমানে পাওয়া যাচ্ছে না
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-900/80 text-white">
          <Loader2 size={32} className="animate-spin" aria-hidden />
          <span className="text-sm">ভিডিও লোড হচ্ছে...</span>
        </div>
      )}

      {playback.type === 'mp4' ? (
        <video
          key={playback.src}
          src={playback.src}
          controls
          playsInline
          className="h-full w-full"
          onLoadedData={() => {
            setLoading(false);
            setFailed(false);
          }}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      ) : (
        <iframe
          key={playback.src}
          title={lesson.title}
          src={playback.src}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => {
            setLoading(false);
            setFailed(false);
          }}
        />
      )}
    </div>
  );
}

export default function LessonPlayer() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await educationApi.getLesson(courseId, lessonId);
      const parsed = parseLessonResponse(res);
      setLesson(parsed.lesson);
      setEnrollment(parsed.enrollment);
      if (parsed.lesson?.quiz?.questions) {
        setAnswers(parsed.lesson.quiz.questions.map(() => null));
      }
      const playback = getLessonVideoPlayback(parsed.lesson);
      setVideoFailed(parsed.lesson?.content_type === 'video' && !playback.valid);
    } catch (e) {
      toast.error(e.message);
      navigate(`/app/education/${courseId}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [courseId, lessonId]);

  const complete = async () => {
    if (!enrollment?.enrollment_id) {
      toast.error('প্রথমে কোর্সে এনরোল করুন');
      return;
    }
    setSubmitting(true);
    try {
      const res = await educationApi.completeLesson(
        enrollment.enrollment_id,
        lesson.lesson_id
      );
      toast.success('পাঠ সম্পন্ন!');
      if (res.certificate) {
        toast.success('অভিনন্দন! সনদপত্র প্রাপ্ত হয়েছে');
      }
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitQuiz = async () => {
    if (answers.some((a) => a === null)) {
      toast.error('সব প্রশ্নের উত্তর দিন');
      return;
    }
    setSubmitting(true);
    try {
      const res = await educationApi.submitQuiz(
        enrollment.enrollment_id,
        lesson.lesson_id,
        answers
      );
      setQuizResult(res);
      if (res.passed) {
        toast.success(`কুইজ পাস! স্কোর: ${res.score}%`);
        if (res.certificate) toast.success('সনদপত্র প্রাপ্ত!');
      } else {
        toast.error(`পাস হয়নি (${res.score}%) — আবার চেষ্টা করুন`);
      }
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !lesson) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
      </div>
    );
  }

  const done = lesson.progress?.is_completed;
  const isVideoLesson = lesson.content_type === 'video';
  const canMarkComplete =
    !isVideoLesson || (!videoFailed && enrollment?.enrollment_id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <Link
        to={`/app/education/${courseId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700"
      >
        <ArrowLeft size={16} aria-hidden />
        কোর্সে ফিরুন
      </Link>

      <h1 className="text-xl font-bold text-slate-900">{lesson.title}</h1>
      {lesson.description && (
        <p className="mt-1 text-sm text-slate-600">{lesson.description}</p>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        {isVideoLesson && (
          <VideoLessonPlayer
            lesson={lesson}
            onPlaybackStateChange={({ failed }) => setVideoFailed(failed)}
          />
        )}

        {lesson.content_type === 'text' && (
          <div
            className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: (lesson.text_content || '')
                .replace(/^## (.*)/gm, '<h2>$1</h2>')
                .replace(/^- (.*)/gm, '<li>$1</li>')
                .replace(/\n/g, '<br/>'),
            }}
          />
        )}

        {lesson.content_type === 'resource' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <FileText size={48} className="text-emerald-600" aria-hidden />
            <p className="text-slate-600">রিসোর্স ডাউনলোড করুন</p>
            <a
              href={lesson.resource_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white"
            >
              <Download size={18} aria-hidden />
              {lesson.resource_label || 'ডাউনলোড'}
            </a>
          </div>
        )}

        {lesson.content_type === 'quiz' && lesson.quiz && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              পাস মার্ক: {lesson.quiz.passing_percent}% ({lesson.quiz.questions?.length} প্রশ্ন)
            </p>
            {lesson.quiz.questions?.map((q, qi) => (
              <fieldset key={qi} className="rounded-xl border border-slate-200 p-4">
                <legend className="font-medium text-slate-900">
                  {qi + 1}. {q.question}
                </legend>
                <div className="mt-2 space-y-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        checked={answers[qi] === oi}
                        onChange={() => {
                          const next = [...answers];
                          next[qi] = oi;
                          setAnswers(next);
                        }}
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            {quizResult && (
              <p
                className={cn(
                  'text-sm font-semibold',
                  quizResult.passed ? 'text-emerald-700' : 'text-red-600'
                )}
              >
                স্কোর: {quizResult.score}% — {quizResult.passed ? 'পাস' : 'ফেল'}
              </p>
            )}
            {!done && (
              <button
                type="button"
                disabled={submitting}
                onClick={submitQuiz}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white disabled:opacity-60"
              >
                কুইজ জমা দিন
              </button>
            )}
          </div>
        )}

        {lesson.content_type !== 'quiz' && !done && canMarkComplete && (
          <button
            type="button"
            disabled={submitting}
            onClick={complete}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <CheckCircle size={18} aria-hidden />
            {submitting ? 'সংরক্ষণ...' : 'পাঠ সম্পন্ন করুন'}
          </button>
        )}

        {isVideoLesson && videoFailed && !done && (
          <p className="mt-4 text-sm text-amber-700">
            ভিডিও লোড না হওয়া পর্যন্ত পাঠ সম্পন্ন করা যাবে না।
          </p>
        )}

        {done && (
          <p className="mt-4 inline-flex items-center gap-2 text-emerald-700 font-medium">
            <CheckCircle size={18} aria-hidden />
            এই পাঠ সম্পন্ন হয়েছে
          </p>
        )}
      </div>
    </div>
  );
}
