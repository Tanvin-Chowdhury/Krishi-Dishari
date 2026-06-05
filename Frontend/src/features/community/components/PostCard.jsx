import { Link }        from 'react-router';
import {
  Heart, MessageCircle, MoreHorizontal, BadgeCheck,
  Sparkles, Flag, Trash2, Share2, Bookmark, AlertCircle,
  MapPin, ThumbsUp,
} from 'lucide-react';
import { useContext, useState } from 'react';
import { AuthContext }          from '../../../core/auth/AuthContext';
import { communityApi }         from '../../../shared/services/communityApi';
import { postTypeMeta, timeAgo, roleBadge, tagLabel } from '../communityConstants';
import ExpertAnswerPreview      from './ExpertAnswerPreview';
import UserPhoto                from '../../../shared/components/UserPhoto';
import { resolveMediaUrl }      from '../../../shared/lib/mediaUrl';
import { cn }                   from '../../../shared/lib/cn';
import { toast }                from 'react-toastify';

const TYPE_ACCENT = {
  question:      { border: 'border-l-blue-400',    dot: 'bg-blue-400'    },
  disease_issue: { border: 'border-l-red-400',     dot: 'bg-red-400'     },
  success_story: { border: 'border-l-emerald-500', dot: 'bg-emerald-500' },
  discussion:    { border: 'border-l-gray-300',    dot: 'bg-gray-400'    },
};

export default function PostCard({
  post,
  onLike,
  onDelete,
  compact,
  variant = 'feed',
  highlightUrgent,
  showExpertAnswer = true,
}) {
  const isDetail = variant === 'detail';
  const { user }  = useContext(AuthContext);
  const [liked,      setLiked]      = useState(post.viewer_liked);
  const [likeCount,  setLikeCount]  = useState(post.like_count || 0);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [liking,     setLiking]     = useState(false);
  const [saved,      setSaved]      = useState(false);

  const meta       = postTypeMeta(post.post_type);
  const badge      = roleBadge(post.author_role_id);
  const accent     = TYPE_ACCENT[post.post_type] || TYPE_ACCENT.discussion;
  const isOwner    = user?.user_id === post.author_id;
  const isConsultant = user?.role_id === 3;
  const showUrgent = highlightUrgent
    || (post.is_urgent && post.needs_expert)
    || (post.post_type === 'disease_issue' && post.needs_expert);

  const handleLike = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (liking) return;
    setLiking(true);
    try {
      const res = await communityApi.toggleLike(post.post_id);
      setLiked(res.liked); setLikeCount(res.like_count);
      onLike?.(post.post_id, res);
    } catch (err) { toast.error(err.message); }
    finally { setLiking(false); }
  };

  const handleReport = async () => {
    const reason = window.prompt('রিপোর্টের কারণ লিখুন:');
    if (!reason?.trim()) return;
    try { await communityApi.reportPost(post.post_id, reason.trim()); toast.success('রিপোর্ট জমা হয়েছে'); }
    catch (err) { toast.error(err.message); }
    setMenuOpen(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('পোস্ট মুছে ফেলবেন?')) return;
    try { await communityApi.deletePost(post.post_id); toast.success('পোস্ট মুছে ফেলা হয়েছে'); onDelete?.(post.post_id); }
    catch (err) { toast.error(err.message); }
    setMenuOpen(false);
  };

  return (
    <article className={cn(
      'group rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5',
      !isDetail && `border-l-[3px] ${accent.border} border-t-gray-100 border-r-gray-100 border-b-gray-100`,
      isDetail && 'border-gray-100',
      showUrgent && 'border-l-red-400 bg-red-50/20',
      compact ? 'p-4' : 'p-5'
    )}>

      {/* Urgent banner */}
      {showUrgent && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <span className="text-xs font-extrabold text-red-700">
            {post.post_type === 'disease_issue' ? '🚨 জরুরি রোগ সমস্যা' : '🚨 জরুরি প্রশ্ন — বিশেষজ্ঞ সাহায্য দরকার'}
          </span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <UserPhoto
          src={post.author_photo}
          name={post.author_name}
          className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
          fallbackClassName="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-extrabold text-white ring-2 ring-white shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold text-gray-900 text-sm">{post.author_name}</span>
            <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-extrabold', badge.className)}>
              {badge.emoji} {badge.label}
            </span>
            {post.author_verified && (
              <BadgeCheck size={13} className="text-blue-500" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
            <span>{timeAgo(post.created_at)}</span>
            {post.author_location && (
              <span className="flex items-center gap-0.5">
                <MapPin size={10} /> {post.author_location}
              </span>
            )}
          </div>
        </div>

        {/* More menu */}
        <div className="relative flex-shrink-0">
          <button type="button" onClick={() => setMenuOpen(o => !o)}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
            <MoreHorizontal size={17} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 min-w-[150px] rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl">
                {!isOwner && (
                  <button type="button" onClick={handleReport}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Flag size={14} className="text-gray-400" /> রিপোর্ট করুন
                  </button>
                )}
                {(isOwner || user?.role_id === 6) && (
                  <button type="button" onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <Trash2 size={14} /> মুছে ফেলুন
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Meta badges ── */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-extrabold', meta.color)}>
          {meta.label}
        </span>
        {post.tag_name && (
          <span className="rounded-full bg-violet-50 border border-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
            #{tagLabel(post.tag_name)}
          </span>
        )}
        {post.ai_prediction_id && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
            <Sparkles size={10} /> AI রিপোর্ট
          </span>
        )}
      </div>

      {/* ── Content ── */}
      <div className="mt-2.5">
        {!isDetail ? (
          <Link to={`/app/community/${post.post_id}`} className="group/link block">
            <h3 className="font-extrabold text-gray-900 leading-snug group-hover/link:text-emerald-700 transition line-clamp-2">
              {post.title}
            </h3>
            <p className="mt-1.5 text-sm text-gray-600 leading-relaxed line-clamp-3">
              {post.content}
            </p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 group-hover/link:underline">
              বিস্তারিত দেখুন →
            </span>
          </Link>
        ) : (
          <>
            <h1 className="text-xl font-extrabold text-gray-900 sm:text-2xl">{post.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-gray-700">{post.content}</p>
          </>
        )}

        {post.ai_disease_name && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            <Sparkles size={10} /> AI: {post.ai_disease_name}
            {post.ai_confidence ? ` (${post.ai_confidence}%)` : ''}
          </p>
        )}

        {/* Images */}
        {post.images?.length > 0 && (
          <div className={cn(
            'mt-3 grid gap-2 overflow-hidden rounded-2xl',
            post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
          )}>
            {post.images.slice(0, 4).map((src, i) => (
              <div key={i} className="relative overflow-hidden rounded-xl">
                <img src={resolveMediaUrl(src)} alt=""
                  className={cn('w-full object-cover hover:scale-105 transition-transform duration-300', isDetail ? 'max-h-96' : 'max-h-48')} />
                {i === 3 && post.images.length > 4 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xl font-extrabold text-white rounded-xl">
                    +{post.images.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expert answer preview */}
      {!isDetail && showExpertAnswer && post.expert_answer && (
        <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <BadgeCheck size={13} className="text-emerald-600" />
            <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wide">বিশেষজ্ঞ উত্তর</span>
          </div>
          <ExpertAnswerPreview answer={post.expert_answer} />
        </div>
      )}

      {/* ── Engagement bar ── */}
      <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-gray-100 pt-3">
        {/* Like */}
        <button type="button" onClick={handleLike} disabled={liking}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition active:scale-95',
            liked ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'text-gray-500 hover:bg-gray-100 hover:text-rose-600'
          )}>
          <Heart size={16} className={liked ? 'fill-current' : ''} />
          {likeCount > 0 && <span>{likeCount}</span>}
          <span className="hidden sm:inline text-xs">পছন্দ</span>
        </button>

        {/* Helpful (same as like but different icon) */}
        <button type="button" onClick={handleLike} disabled={liking}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition">
          <ThumbsUp size={15} />
          <span className="hidden sm:inline text-xs">সহায়ক</span>
        </button>

        {/* Comments */}
        <Link to={`/app/community/${post.post_id}#comments`}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 transition">
          <MessageCircle size={16} />
          {post.comment_count > 0 && <span>{post.comment_count}</span>}
          <span className="hidden sm:inline text-xs">মন্তব্য</span>
        </Link>

        {/* Share */}
        <button type="button"
          onClick={e => {
            e.preventDefault();
            navigator.clipboard?.writeText(`${window.location.origin}/app/community/${post.post_id}`);
            toast.success('লিংক কপি হয়েছে');
          }}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition">
          <Share2 size={15} />
          <span className="hidden sm:inline text-xs">শেয়ার</span>
        </button>

        {/* Save */}
        <button type="button"
          onClick={e => { e.preventDefault(); setSaved(s => !s); toast.info(saved ? 'সেভ সরানো' : 'পোস্ট সেভ করা হয়েছে'); }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition',
            saved ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500 hover:bg-gray-100'
          )}>
          <Bookmark size={15} className={saved ? 'fill-current' : ''} />
          <span className="hidden sm:inline text-xs">সংরক্ষণ</span>
        </button>

        {/* Consultant answer CTA */}
        {isConsultant && post.needs_expert && (
          <Link to={`/app/community/${post.post_id}#comments`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
            ✍️ উত্তর দিন
          </Link>
        )}
      </div>
    </article>
  );
}
