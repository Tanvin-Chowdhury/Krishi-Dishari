import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { MessageCircle, Star } from 'lucide-react';
import { expertApi } from '../../shared/services/expertApi';
import { bnDate } from './expertUtils';
import { Skeleton } from '../../shared/design-system/Skeleton';
import EmptyState from '../../shared/design-system/EmptyState';
import UserPhoto from '../../shared/components/UserPhoto';

function Avatar({ name, photo }) {
  return (
    <UserPhoto
      src={photo}
      name={name}
      className="h-12 w-12 rounded-full object-cover"
      fallbackClassName="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white"
    />
  );
}

export default function MyConsultations() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await expertApi.getConsultationHistory();
        if (!cancelled) setHistory(res.history || []);
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">আমার পরামর্শ</h1>
        <p className="mt-1 text-sm text-slate-600">
          বিশেষজ্ঞ ও কৃষকের সাথে আপনার কথোপকথনের ইতিহাস
        </p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="কোনো পরামর্শ ইতিহাস নেই"
          description="বিশেষজ্ঞ ডিরেক্টরি থেকে একজনকে বেছে বার্তা পাঠালে এখানে দেখাবে।"
          actionLabel="বিশেষজ্ঞ খুঁজুন"
          actionHref="/app/experts"
        />
      ) : (
        <ul className="space-y-2">
          {history.map((row) => (
            <li key={row.conversation_id}>
              <Link
                to={`/app/chat?userId=${row.other_user_id}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="relative">
                  <Avatar name={row.other_name} photo={row.other_photo} />
                  {row.other_is_online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 truncate">{row.other_name}</p>
                  {row.professional_title && row.i_am_farmer && (
                    <p className="text-xs text-emerald-700">{row.professional_title}</p>
                  )}
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {row.last_message || 'কোনো বার্তা নেই'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-400">
                    {bnDate(row.last_message_at || row.created_at)}
                  </p>
                  {row.i_am_farmer && row.consultant_avg_rating > 0 && (
                    <p className="mt-1 inline-flex items-center gap-0.5 text-xs font-medium text-amber-700">
                      <Star size={12} className="fill-amber-400 text-amber-400" aria-hidden />
                      {Number(row.consultant_avg_rating).toFixed(1)}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
