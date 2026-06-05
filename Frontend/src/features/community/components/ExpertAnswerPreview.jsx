import UserPhoto from '../../../shared/components/UserPhoto';
import { cn } from '../../../shared/lib/cn';

/** Facebook-style inline comment preview for expert answers on the feed */
export default function ExpertAnswerPreview({ answer }) {
  if (!answer?.comment_text) return null;

  return (
    <div className="mt-3 flex items-start gap-2">
      <UserPhoto
        src={answer.expert_photo}
        name={answer.expert_name}
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200/80"
        fallbackClassName="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="text-[13px] font-semibold text-slate-900 hover:underline cursor-default">
            {answer.expert_name}
          </span>
          <span
            className={cn(
              'rounded px-1.5 py-px text-[10px] font-semibold leading-none',
              'bg-emerald-600 text-white'
            )}
          >
            বিশেষজ্ঞ
          </span>
          {answer.is_highlighted && (
            <span className="text-[10px] font-medium text-amber-700">· বাছাইকৃত</span>
          )}
        </div>
        <div className="inline-block max-w-full rounded-2xl rounded-tl-none bg-slate-100 px-3 py-2">
          <p className="text-[15px] leading-snug text-slate-800 whitespace-pre-wrap">
            {answer.comment_text}
          </p>
        </div>
      </div>
    </div>
  );
}
