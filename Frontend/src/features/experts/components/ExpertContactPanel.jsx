import { Link } from 'react-router';
import {
  MessageCircle,
  HelpCircle,
  Calendar,
  Phone,
  BadgeCheck,
  Clock,
} from 'lucide-react';
import { cn } from '../../../shared/lib/cn';
import { feeLabel } from '../expertUtils';

export default function ExpertContactPanel({
  expert,
  conversationId,
  onStartChat,
  onRequestConsultation,
  chatLoading = false,
  className = '',
}) {
  const availableToday = expert.is_available;
  const online = expert.is_online && expert.is_available;

  return (
    <aside
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-emerald-500/5',
        'lg:sticky lg:top-24',
        className
      )}
    >
      <h3 className="text-sm font-bold text-slate-900">যোগাযোগ ও পরামর্শ</h3>
      <p className="mt-1 text-xs text-slate-500">উপলব্ধতা দেখে বার্তা বা পরামর্শ শুরু করুন</p>

      <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">অবস্থা</span>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold',
              online ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', online ? 'bg-emerald-500' : 'bg-slate-400')} />
            {online ? 'অনলাইন' : expert.is_available ? 'অফলাইন' : 'ব্যস্ত'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">আজ উপলব্ধ</span>
          <span className={cn('font-semibold', availableToday ? 'text-emerald-700' : 'text-slate-500')}>
            {availableToday ? 'হ্যাঁ' : 'না'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">সাড়া দেওয়ার সময়</span>
          <span className="inline-flex items-center gap-1 font-medium text-slate-800">
            <Clock size={13} /> {expert.response_time_hint || '১ ঘণ্টা'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm border-t border-slate-200/80 pt-2 mt-2">
          <span className="text-slate-600">পরামর্শ ফি</span>
          <span className="font-bold text-emerald-700">{feeLabel(expert.consultation_fee)}</span>
        </div>
      </div>

      {expert.is_verified && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-blue-700">
          <BadgeCheck size={14} /> যাচাইকৃত কৃষি বিশেষজ্ঞ
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onStartChat}
          disabled={!expert.is_available || chatLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <MessageCircle size={18} />
          {chatLoading ? 'সংযোগ হচ্ছে…' : conversationId ? 'চ্যাট চালিয়ে যান' : 'চ্যাট শুরু করুন'}
        </button>
        <button
          type="button"
          onClick={onRequestConsultation}
          disabled={!expert.is_available}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-3 text-sm font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
        >
          <Calendar size={18} />
          পরামর্শের অনুরোধ
        </button>
        <Link
          to="/app/community"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <HelpCircle size={18} />
          কমিউনিটিতে প্রশ্ন করুন
        </Link>
        {expert.phone && (
          <a
            href={`tel:${expert.phone}`}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Phone size={18} />
            কল করুন
          </a>
        )}
      </div>
    </aside>
  );
}
