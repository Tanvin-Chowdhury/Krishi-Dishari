import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { useNotifications } from './NotificationContext';
import { getNotificationLink, fmtNotifTime, TYPE_META } from './notificationUtils';
import { cn } from '../../shared/lib/cn';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
  } = useNotifications();

  const handleClick = (n) => {
    const id = n.notification_id ?? n.id;
    if (!n.is_read) markRead(id);
    setOpen(false);
    navigate(getNotificationLink(n));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
        aria-label="বিজ্ঞপ্তি"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-12 z-50 w-[min(100vw-2rem,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-emerald-50/50 px-4 py-3">
              <div>
                <p className="text-sm font-bold text-slate-900">বিজ্ঞপ্তি</p>
                {unreadCount > 0 && (
                  <p className="text-[11px] text-emerald-600">{unreadCount}টি নতুন</p>
                )}
              </div>
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    <CheckCheck size={14} />
                    সব পড়া
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate('/app/notifications');
                  }}
                  className="rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100"
                >
                  সব দেখুন
                </button>
              </div>
            </div>

            <div className="max-h-[min(70vh,420px)] overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Bell className="mx-auto mb-2 text-slate-300" size={32} />
                  <p className="text-sm text-slate-500">কোনো বিজ্ঞপ্তি নেই</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const meta = TYPE_META[n.type] || TYPE_META.SYSTEM_ALERT;
                  return (
                    <button
                      key={n.notification_id ?? n.id}
                      type="button"
                      onClick={() => handleClick(n)}
                      className={cn(
                        'flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50',
                        !n.is_read && 'bg-emerald-50/40'
                      )}
                    >
                      <span className="mt-0.5 text-lg">{meta.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {n.title}
                        </p>
                        <p className="line-clamp-2 text-xs text-slate-500">
                          {n.message || n.body}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {fmtNotifTime(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-100 p-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  navigate('/app/notifications');
                }}
                className="flex w-full items-center justify-center gap-1 rounded-xl py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <ExternalLink size={14} />
                বিজ্ঞপ্তি কেন্দ্র
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
