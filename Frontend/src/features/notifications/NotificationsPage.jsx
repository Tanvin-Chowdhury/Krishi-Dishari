import { useCallback, useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  Bell, Search, Trash2, CheckCheck, RefreshCw,
  Settings, X, AlertTriangle, LayoutDashboard,
  MessageCircle, Gavel, ShoppingBag, Banknote,
  CloudRain, GraduationCap, Newspaper, Shield,
  ChevronRight, Pin, Archive,
} from 'lucide-react';
import { notificationApi } from '../../shared/services/notificationApi';
import {
  CATEGORIES, getNotificationLink, fmtNotifTime, TYPE_META,
} from './notificationUtils';
import { useNotifications } from './NotificationContext';
import { cn } from '../../shared/lib/cn';

/* ─── category meta ──────────────────────────────────────── */
const CAT_STYLE = {
  auction:     { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-l-orange-400', badge: 'bg-orange-100 text-orange-700'   },
  messages:    { bg: 'bg-blue-100',   text: 'text-blue-600',   border: 'border-l-blue-400',   badge: 'bg-blue-100 text-blue-700'     },
  marketplace: { bg: 'bg-emerald-100',text: 'text-emerald-600',border: 'border-l-emerald-500',badge: 'bg-emerald-100 text-emerald-700'},
  loan:        { bg: 'bg-green-100',  text: 'text-green-600',  border: 'border-l-green-400',  badge: 'bg-green-100 text-green-700'   },
  labor:       { bg: 'bg-teal-100',   text: 'text-teal-600',   border: 'border-l-teal-400',   badge: 'bg-teal-100 text-teal-700'     },
  warehouse:   { bg: 'bg-amber-100',  text: 'text-amber-600',  border: 'border-l-amber-400',  badge: 'bg-amber-100 text-amber-700'   },
  community:   { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-l-indigo-400', badge: 'bg-indigo-100 text-indigo-700' },
  education:   { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-l-purple-400', badge: 'bg-purple-100 text-purple-700' },
  weather:     { bg: 'bg-cyan-100',   text: 'text-cyan-600',   border: 'border-l-cyan-400',   badge: 'bg-cyan-100 text-cyan-700'     },
  news:        { bg: 'bg-red-100',    text: 'text-red-600',    border: 'border-l-red-400',    badge: 'bg-red-100 text-red-700'       },
  system:      { bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-l-gray-300',   badge: 'bg-gray-100 text-gray-600'    },
};

const CRITICAL_TYPES = new Set([
  'LOAN_INSTALLMENT_OVERDUE', 'LOAN_INSTALLMENT_DUE',
  'WEATHER_HEAVY_RAIN', 'WEATHER_HIGH_WIND',
  'NEWS_BREAKING', 'NEWS_DISEASE_ALERT',
  'AUCTION_WON', 'OUTBID', 'auction_won', 'outbid',
]);

const SIDEBAR_LINKS = [
  { icon: ShoppingBag, label: 'মার্কেটপ্লেস', to: '/app/marketplace',  cat: 'marketplace' },
  { icon: MessageCircle, label: 'বার্তা',      to: '/app/chat',         cat: 'messages'    },
  { icon: Gavel,       label: 'নিলাম',         to: '/app/auctions',     cat: 'auction'     },
  { icon: Banknote,    label: 'ঋণ',            to: '/app/loan',         cat: 'loan'        },
  { icon: CloudRain,   label: 'আবহাওয়া',       to: '/app/weather',      cat: 'weather'     },
  { icon: GraduationCap,label: 'ই-লার্নিং',    to: '/app/education',    cat: 'education'   },
  { icon: Newspaper,   label: 'সংবাদ',         to: '/app/news',         cat: 'news'        },
];

/* ─── helpers ─────────────────────────────────────────────── */
function deriveCategory(type) {
  if (!type) return 'system';
  const t = type.toUpperCase();
  if (t.includes('AUCTION') || t.includes('BID'))  return 'auction';
  if (t.includes('MESSAGE') || t.includes('CHAT')) return 'messages';
  if (t.includes('ORDER'))                         return 'marketplace';
  if (t.includes('LOAN') || t.includes('INSTALLMENT')) return 'loan';
  if (t.includes('LABOR'))                         return 'labor';
  if (t.includes('WAREHOUSE'))                     return 'warehouse';
  if (t.includes('COMMUNITY'))                     return 'community';
  if (t.includes('EDUCATION') || t.includes('CERTIFICATE')) return 'education';
  if (t.includes('WEATHER'))                       return 'weather';
  if (t.includes('NEWS'))                          return 'news';
  return 'system';
}

function getTimeGroup(ts) {
  const d    = new Date(ts);
  const now  = new Date();
  const todayStart     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart - 86400000);
  const weekStart      = new Date(todayStart - 6 * 86400000);
  if (d >= todayStart)     return 'আজ';
  if (d >= yesterdayStart) return 'গতকাল';
  if (d >= weekStart)      return 'এই সপ্তাহ';
  return 'পুরোনো';
}

/* ─── sub-components ──────────────────────────────────────── */
function KpiCard({ label, value, from, to }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${from} ${to} p-3.5 shadow-sm`}>
      <p className="text-[10px] font-semibold text-white/80">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold text-white">{value}</p>
    </div>
  );
}

function NotifSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-4">
          <div className="h-10 w-10 rounded-2xl bg-gray-100 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-2 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupHeader({ label, count }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-extrabold text-gray-500">{label}</span>
      {count > 0 && <span className="text-[11px] text-gray-400">{count}টি</span>}
      <div className="flex-1 border-t border-gray-100" />
    </div>
  );
}

function NotifCard({ n, onOpen, onMarkRead, onDelete }) {
  const id       = n.notification_id ?? n.id;
  const meta     = TYPE_META[n.type] || TYPE_META.SYSTEM_ALERT;
  const cat      = deriveCategory(n.type);
  const style    = CAT_STYLE[cat] || CAT_STYLE.system;
  const critical = CRITICAL_TYPES.has(n.type);

  return (
    <div className={cn(
      'group relative flex gap-3 rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5',
      !n.is_read
        ? `border-l-[3px] ${style.border} border-t-gray-100 border-r-gray-100 border-b-gray-100`
        : 'border-gray-100',
      critical && !n.is_read && 'bg-red-50/30'
    )}>

      {/* Icon */}
      <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-xl', style.bg)}>
        <span>{meta.icon}</span>
      </div>

      {/* Body */}
      <button type="button" onClick={() => onOpen(n)} className="min-w-0 flex-1 text-left">
        <div className="flex items-start gap-2 flex-wrap">
          <p className={cn('text-sm text-gray-900 leading-snug', !n.is_read ? 'font-extrabold' : 'font-semibold')}>
            {n.title}
          </p>
          {critical && !n.is_read && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-extrabold text-red-600 uppercase">
              <AlertTriangle size={8} /> জরুরি
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.message || n.body}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', style.badge)}>
            {meta.label}
          </span>
          <span className="text-[11px] text-gray-400">{fmtNotifTime(n.created_at)}</span>
        </div>
      </button>

      {/* Actions */}
      <div className="flex flex-col items-center gap-1.5">
        {!n.is_read && (
          <button type="button" onClick={() => onMarkRead(id)} title="পঠিত চিহ্নিত করুন"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50 transition opacity-0 group-hover:opacity-100">
            <CheckCheck size={14} />
          </button>
        )}
        <button type="button" onClick={() => onDelete(id)} title="মুছুন"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
          <Trash2 size={13} />
        </button>
        {!n.is_read && (
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mt-0.5" />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const { markRead, markAllRead, remove, unreadCount } = useNotifications();

  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [category,   setCategory]   = useState('');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState({ pages: 1, total: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationApi.list({
        page, limit: 20,
        category: category || undefined,
        search:   search.trim() || undefined,
      });
      setItems(res.notifications || res.data?.notifications || []);
      setPagination(res.pagination || res.data?.pagination || { pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, category, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const handleOpen = async (n) => {
    const id = n.notification_id ?? n.id;
    if (!n.is_read) await markRead(id);
    navigate(getNotificationLink(n));
  };

  const handleDelete = async (id) => {
    await remove(id);
    setItems(prev => prev.filter(x => (x.notification_id ?? x.id) !== id));
  };

  const handleMarkRead = async (id) => {
    await markRead(id);
    setItems(prev => prev.map(x => (x.notification_id ?? x.id) === id ? { ...x, is_read: true } : x));
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setItems(prev => prev.map(x => ({ ...x, is_read: true })));
  };

  /* derived stats */
  const todayCount     = items.filter(n => getTimeGroup(n.created_at) === 'আজ').length;
  const criticalCount  = items.filter(n => CRITICAL_TYPES.has(n.type) && !n.is_read).length;

  /* pinned important */
  const pinned  = items.filter(n => CRITICAL_TYPES.has(n.type) && !n.is_read);
  const regular = items.filter(n => !CRITICAL_TYPES.has(n.type) || n.is_read);

  /* time-grouped regular */
  const GROUP_ORDER = ['আজ', 'গতকাল', 'এই সপ্তাহ', 'পুরোনো'];
  const grouped = GROUP_ORDER.reduce((acc, g) => {
    const list = regular.filter(n => getTimeGroup(n.created_at) === g);
    if (list.length) acc[g] = list;
    return acc;
  }, {});

  /* category counters for sidebar */
  const catCounts = items.reduce((acc, n) => {
    const c = deriveCategory(n.type);
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HERO ══ */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm flex-shrink-0">
                <Bell size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">বিজ্ঞপ্তি কেন্দ্র</h1>
                <p className="text-xs text-gray-500">আপনার সকল কার্যক্রম, আপডেট এবং গুরুত্বপূর্ণ সতর্কতা</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
              </button>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 transition shadow-sm">
                  <CheckCheck size={13} /> সব পঠিত চিহ্নিত
                </button>
              )}
            </div>
          </div>

          {/* KPI strip */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="মোট বিজ্ঞপ্তি"  value={pagination.total}  from="from-emerald-500" to="to-teal-600"    />
            <KpiCard label="অপঠিত"           value={unreadCount}      from="from-blue-500"    to="to-indigo-500"  />
            <KpiCard label="আজকের"           value={todayCount}       from="from-amber-500"   to="to-orange-500"  />
            <KpiCard label="জরুরি"           value={criticalCount}    from="from-red-500"     to="to-rose-500"    />
          </div>
        </div>
      </div>

      {/* ══ SEARCH + FILTERS ══ */}
      <div className="mx-auto max-w-7xl px-4 pt-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="বিজ্ঞপ্তি খুঁজুন..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition" />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 hover:bg-gray-200 text-gray-400">
                <X size={12} />
              </button>
            )}
          </div>
          {/* Filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => { setCategory(c.id); setPage(1); }}
                className={cn(
                  'flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  category === c.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
                )}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="grid gap-5 lg:grid-cols-[1fr_270px]">

          {/* ─── Main feed ─── */}
          <div className="space-y-4">
            {loading ? (
              <NotifSkeleton />
            ) : items.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-100">
                  <Bell size={36} className="text-gray-300" />
                </div>
                <p className="mt-4 font-extrabold text-gray-500">কোনো বিজ্ঞপ্তি নেই</p>
                <p className="mt-1 text-sm text-gray-400">নতুন কার্যক্রম হলে এখানে দেখা যাবে</p>
                <Link to="/app/home"
                  className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
                  <LayoutDashboard size={14} /> ড্যাশবোর্ডে যান
                </Link>
              </div>
            ) : (
              <>
                {/* Pinned important */}
                {pinned.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1">
                        <AlertTriangle size={12} className="text-red-500" />
                        <span className="text-[11px] font-extrabold text-red-600 uppercase tracking-wide">গুরুত্বপূর্ণ বিজ্ঞপ্তি</span>
                      </div>
                      <div className="flex-1 border-t border-red-100" />
                    </div>
                    <div className="space-y-2">
                      {pinned.map(n => (
                        <NotifCard key={n.notification_id ?? n.id} n={n}
                          onOpen={handleOpen} onMarkRead={handleMarkRead} onDelete={handleDelete} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Time-grouped regular */}
                {GROUP_ORDER.filter(g => grouped[g]).map(g => (
                  <div key={g}>
                    <GroupHeader label={g} count={grouped[g].length} />
                    <div className="space-y-2">
                      {grouped[g].map(n => (
                        <NotifCard key={n.notification_id ?? n.id} n={n}
                          onOpen={handleOpen} onMarkRead={handleMarkRead} onDelete={handleDelete} />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition shadow-sm">
                  ← আগের
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pg = Math.max(1, Math.min(pagination.pages - 4, page - 2)) + i;
                    return (
                      <button key={pg} onClick={() => setPage(pg)}
                        className={cn('h-9 w-9 rounded-xl text-sm font-semibold transition', pg === page
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50')}>
                        {pg}
                      </button>
                    );
                  })}
                </div>
                <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition shadow-sm">
                  পরের →
                </button>
              </div>
            )}
          </div>

          {/* ─── Right sidebar ─── */}
          <div className="hidden lg:flex flex-col gap-4">

            {/* Quick actions */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-extrabold text-gray-900">দ্রুত কার্যক্রম</h3>
              <div className="space-y-2">
                <button onClick={handleMarkAllRead} disabled={unreadCount === 0}
                  className="flex w-full items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-40 transition">
                  <CheckCheck size={14} className="text-emerald-500" /> সব পঠিত হিসেবে চিহ্নিত
                </button>
                <Link to="/app/notifications" className="flex w-full items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                  <Archive size={14} className="text-gray-400" /> আর্কাইভ দেখুন
                </Link>
                <Link to="/app/profile" className="flex w-full items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
                  <Settings size={14} className="text-gray-400" /> বিজ্ঞপ্তি সেটিংস
                </Link>
              </div>
            </div>

            {/* Today's activity */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-extrabold text-gray-900">আজকের কার্যক্রম</h3>
              <div className="space-y-2">
                {SIDEBAR_LINKS.map(link => {
                  const count = catCounts[link.cat] || 0;
                  const s     = CAT_STYLE[link.cat] || CAT_STYLE.system;
                  return (
                    <Link key={link.to} to={link.to}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 hover:border-emerald-200 hover:bg-emerald-50 transition group">
                      <div className="flex items-center gap-2">
                        <div className={cn('flex h-7 w-7 items-center justify-center rounded-xl', s.bg)}>
                          <link.icon size={13} className={s.text} />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 group-hover:text-emerald-700">{link.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {count > 0 && (
                          <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-extrabold', s.badge)}>{count}</span>
                        )}
                        <ChevronRight size={12} className="text-gray-300 group-hover:text-emerald-500" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Category counters */}
            {Object.keys(catCounts).length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-extrabold text-gray-900">বিভাগ অনুযায়ী</h3>
                <div className="space-y-1.5">
                  {Object.entries(catCounts).sort(([,a],[,b]) => b - a).map(([cat, cnt]) => {
                    const s = CAT_STYLE[cat] || CAT_STYLE.system;
                    const label = CATEGORIES.find(c => c.id === cat)?.label || cat;
                    return (
                      <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
                        className="flex w-full items-center justify-between rounded-xl border border-gray-100 px-3 py-2 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-2 w-2 rounded-full', s.bg.replace('bg-', 'bg-').replace('-100', '-400'))} />
                          <span className="text-xs text-gray-600">{label}</span>
                        </div>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-extrabold', s.badge)}>{cnt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Info card */}
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-center shadow-sm">
              <Shield className="mx-auto mb-2 text-emerald-600" size={24} />
              <p className="font-extrabold text-emerald-900 text-sm">নিরাপদ বিজ্ঞপ্তি</p>
              <p className="mt-1 text-[11px] text-emerald-700 leading-relaxed">
                আপনার সকল বিজ্ঞপ্তি এনক্রিপ্টেড এবং সুরক্ষিত।
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
