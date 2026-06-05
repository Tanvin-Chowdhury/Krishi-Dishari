import { useContext, useState } from 'react';
import { Send, Pin } from 'lucide-react';
import { AuthContext } from '../../../core/auth/AuthContext';
import { communityApi } from '../../../shared/services/communityApi';
import { timeAgo } from '../communityConstants';
import UserPhoto from '../../../shared/components/UserPhoto';
import { cn } from '../../../shared/lib/cn';
import { toast } from 'react-toastify';

function CommentComposer({
  value,
  onChange,
  onSubmit,
  submitting,
  placeholder = 'মন্তব্য লিখুন...',
  avatarSrc,
  avatarName,
  compact = false,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex items-start gap-2">
      <UserPhoto
        src={avatarSrc}
        name={avatarName}
        className={cn(
          'shrink-0 rounded-full object-cover ring-1 ring-slate-200/80',
          compact ? 'h-7 w-7' : 'h-8 w-8'
        )}
        fallbackClassName={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600',
          compact ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs'
        )}
      />
      <div className="flex min-w-0 flex-1 items-end gap-1.5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          className={cn(
            'max-h-28 min-h-[36px] flex-1 resize-none rounded-2xl bg-slate-100 px-3 py-2 text-[15px] leading-snug text-slate-800',
            'placeholder:text-slate-400 focus:bg-slate-200/80 focus:outline-none',
            compact && 'min-h-[32px] text-sm'
          )}
        />
        <button
          type="button"
          disabled={submitting || !value.trim()}
          onClick={onSubmit}
          aria-label="মন্তব্য পাঠান"
          className={cn(
            'mb-0.5 flex shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white',
            'hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600',
            compact ? 'h-7 w-7' : 'h-8 w-8'
          )}
        >
          <Send size={compact ? 14 : 16} className={compact ? '' : 'ml-0.5'} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function CommentBubble({ comment }) {
  const isConsultant = comment.is_consultant;

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span className="text-[13px] font-semibold text-slate-900">
          {comment.commenter_name}
        </span>
        {isConsultant && (
          <span className="rounded bg-emerald-600 px-1.5 py-px text-[10px] font-semibold leading-none text-white">
            বিশেষজ্ঞ
          </span>
        )}
        {comment.is_highlighted && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700">
            <Pin size={9} aria-hidden />
            বাছাইকৃত
          </span>
        )}
      </div>
      <div
        className={cn(
          'inline-block max-w-full rounded-2xl rounded-tl-none px-3 py-2',
          comment.is_highlighted ? 'bg-amber-50 ring-1 ring-amber-100' : 'bg-slate-100'
        )}
      >
        <p className="whitespace-pre-wrap text-[15px] leading-snug text-slate-800">
          {comment.comment_text}
        </p>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  postId,
  postAuthorId,
  onRefresh,
  depth = 0,
}) {
  const { user } = useContext(AuthContext);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isConsultant = comment.is_consultant;
  const canHighlight = user?.user_id === postAuthorId || user?.role_id === 6;
  const canDelete =
    user?.user_id === comment.commenter_id || user?.role_id === 6;

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await communityApi.addComment(postId, {
        comment_text: replyText.trim(),
        parent_comment_id: comment.comment_id,
      });
      setReplyText('');
      setReplyOpen(false);
      onRefresh?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const highlight = async () => {
    try {
      await communityApi.highlightComment(postId, comment.comment_id);
      toast.success('উত্তর হাইলাইট করা হয়েছে');
      onRefresh?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    if (!window.confirm('মন্তব্য মুছবেন?')) return;
    try {
      await communityApi.deleteComment(postId, comment.comment_id);
      onRefresh?.();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className={cn(depth > 0 && 'mt-2')}>
      <div className="flex items-start gap-2">
        <UserPhoto
          src={comment.commenter_photo}
          name={comment.commenter_name}
          className={cn(
            'shrink-0 rounded-full object-cover ring-1 ring-slate-200/80',
            depth > 0 ? 'h-7 w-7' : 'h-8 w-8'
          )}
          fallbackClassName={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600',
            depth > 0 ? 'h-7 w-7 text-[10px]' : 'h-8 w-8 text-xs'
          )}
        />
        <div className="min-w-0 flex-1">
          <CommentBubble comment={comment} />
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-1">
            <span className="text-xs font-semibold text-slate-500">
              {timeAgo(comment.created_at)}
            </span>
            {depth < 2 && (
              <button
                type="button"
                onClick={() => setReplyOpen((o) => !o)}
                className="text-xs font-semibold text-slate-600 hover:underline"
              >
                উত্তর
              </button>
            )}
            {canHighlight && isConsultant && !comment.is_highlighted && (
              <button
                type="button"
                onClick={highlight}
                className="text-xs font-semibold text-amber-700 hover:underline"
              >
                হাইলাইট
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={remove}
                className="text-xs font-semibold text-slate-500 hover:text-red-600 hover:underline"
              >
                মুছুন
              </button>
            )}
          </div>
        </div>
      </div>

      {replyOpen && (
        <div className={cn('mt-2', depth > 0 ? 'ml-9' : 'ml-10')}>
          <CommentComposer
            value={replyText}
            onChange={setReplyText}
            onSubmit={submitReply}
            submitting={submitting}
            placeholder={`${comment.commenter_name}-কে উত্তর দিন...`}
            avatarSrc={user?.photo_url}
            avatarName={user?.full_name}
            compact
          />
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div className={cn('space-y-2', depth > 0 ? 'ml-9 mt-2' : 'ml-10 mt-2')}>
          {comment.replies.map((r) => (
            <CommentItem
              key={r.comment_id}
              comment={r}
              postId={postId}
              postAuthorId={postAuthorId}
              onRefresh={onRefresh}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentThread({ postId, postAuthorId, comments, onRefresh }) {
  const { user } = useContext(AuthContext);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await communityApi.addComment(postId, { comment_text: text.trim() });
      setText('');
      onRefresh?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalCount = comments.reduce(
    (n, c) => n + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <div className="space-y-4">
      {totalCount > 0 && (
        <p className="text-sm font-semibold text-slate-700">
          {totalCount}টি মন্তব্য
        </p>
      )}

      <CommentComposer
        value={text}
        onChange={setText}
        onSubmit={submit}
        submitting={submitting}
        placeholder="মন্তব্য লিখুন..."
        avatarSrc={user?.photo_url}
        avatarName={user?.full_name}
      />

      {comments.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">
          প্রথম মন্তব্য করুন
        </p>
      ) : (
        <div className="space-y-4 border-t border-slate-100 pt-4">
          {comments.map((c) => (
            <CommentItem
              key={c.comment_id}
              comment={c}
              postId={postId}
              postAuthorId={postAuthorId}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
