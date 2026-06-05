export const CATEGORIES = [
  { id: 'all', name: 'সব', icon: '📚' },
  { id: 'rice', name: 'ধান চাষ', icon: '🌾' },
  { id: 'vegetables', name: 'সবজি', icon: '🥬' },
  { id: 'seed', name: 'বীজ', icon: '🌱' },
  { id: 'irrigation', name: 'সেচ', icon: '💧' },
  { id: 'fertilizer', name: 'সার', icon: '🧪' },
];

export const DIFFICULTY_STYLES = {
  শুরু: 'bg-emerald-100 text-emerald-800',
  মধ্যম: 'bg-amber-100 text-amber-800',
  উন্নত: 'bg-orange-100 text-orange-800',
};

export function lessonIcon(type) {
  if (type === 'video') return '🎬';
  if (type === 'text') return '📖';
  if (type === 'resource') return '📎';
  if (type === 'quiz') return '✅';
  return '📄';
}

export function normalizeVideoUrl(raw) {
  const url = typeof raw === 'string' ? raw.trim() : '';
  if (!url) {
    return { src: null, type: null, valid: false };
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url) || /gtv-videos-bucket|storage\.googleapis\.com/i.test(url)) {
    return { src: url, type: 'mp4', valid: true };
  }

  let videoId = null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').replace(/^m\./, '');

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v');
      } else {
        const embedMatch = parsed.pathname.match(/^\/embed\/([^/?&]+)/);
        if (embedMatch) videoId = embedMatch[1];
        const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/?&]+)/);
        if (shortsMatch) videoId = shortsMatch[1];
        const vMatch = parsed.pathname.match(/^\/v\/([^/?&]+)/);
        if (vMatch) videoId = vMatch[1];
      }
    } else if (host === 'youtu.be') {
      videoId = parsed.pathname.slice(1).split(/[/?&]/)[0] || null;
    }
  } catch {
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) videoId = watchMatch[1];
    const embedMatch = url.match(/youtube(?:-nocookie)?\.com\/embed\/([^/?&]+)/);
    if (embedMatch) videoId = embedMatch[1];
    const shortMatch = url.match(/youtu\.be\/([^/?&]+)/);
    if (shortMatch) videoId = shortMatch[1];
    const shortsMatch = url.match(/youtube\.com\/shorts\/([^/?&]+)/);
    if (shortsMatch) videoId = shortsMatch[1];
  }

  if (videoId && /^[\w-]{11}$/.test(videoId)) {
    return {
      src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      type: 'youtube',
      valid: true,
      videoId,
    };
  }

  return { src: null, type: null, valid: false };
}

/** @deprecated use normalizeVideoUrl().src */
export function embedVideoUrl(url) {
  return normalizeVideoUrl(url).src;
}

/** Normalize course detail API payload (top-level or nested under data). */
export function parseCourseDetailResponse(res) {
  const payload = res?.course ? res : res?.data || {};
  return {
    course: payload.course || null,
    lessons: payload.lessons || [],
    enrollment: payload.enrollment || payload.course?.enrollment || null,
    certificate: payload.certificate || payload.course?.certificate || null,
  };
}

export function getEnrollmentStatus(enrollment) {
  if (!enrollment) return null;
  if (enrollment.status) return enrollment.status;
  if (enrollment.is_completed) return 'completed';
  return enrollment.enrollment_id ? 'active' : null;
}

export function canAccessCourseLessons(enrollment) {
  if (!enrollment?.enrollment_id) return false;
  const status = getEnrollmentStatus(enrollment);
  return status === 'active' || status === 'completed';
}

export function isLessonLocked(enrollment, lesson) {
  const canAccessLessons = canAccessCourseLessons(enrollment);
  const isPreview = lesson?.is_preview === true;
  return !canAccessLessons && !isPreview;
}

export function parseLessonResponse(res) {
  const payload = res?.lesson ? res : res?.data || {};
  return {
    lesson: payload.lesson || null,
    enrollment: payload.enrollment || null,
  };
}

export function getLessonVideoPlayback(lesson) {
  if (!lesson) return normalizeVideoUrl(null);
  if (lesson.video_playback_url && lesson.video_type) {
    return {
      src: lesson.video_playback_url,
      type: lesson.video_type,
      valid: Boolean(lesson.video_playback_url),
    };
  }
  return normalizeVideoUrl(lesson.video_url);
}
