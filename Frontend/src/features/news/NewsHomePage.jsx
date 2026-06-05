import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  Newspaper, Search, TrendingUp, Bookmark, Zap, CloudRain,
  AlertTriangle, Building2, Sprout, Clock, User, Eye, X,
  ChevronRight, Flame, Star, BarChart2, ArrowUp, ArrowDown,
  Minus, RefreshCw, BookOpen, Award,
} from 'lucide-react';
import { newsApi } from '../../shared/services/newsApi';
import { CATEGORY_STYLES, formatNewsDate, getNewsCoverImage } from './newsUtils';
import NewsCoverImage from './NewsCoverImage';
import { cn } from '../../shared/lib/cn';

/* ─── Category meta ──────────────────────────────────────── */
const CAT_META = {
  farming_news:     { label: 'কৃষি সংবাদ',    color: 'bg-emerald-500',  text: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  crop_disease:     { label: 'রোগ সতর্কতা',   color: 'bg-red-500',      text: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200'     },
  weather_alert:    { label: 'আবহাওয়া',        color: 'bg-sky-500',      text: 'text-sky-700',     bg: 'bg-sky-50',      border: 'border-sky-200'     },
  market_price:     { label: 'বাজারদর',        color: 'bg-amber-500',    text: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200'   },
  government_notice:{ label: 'সরকারি বিজ্ঞপ্তি', color: 'bg-blue-600', text: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200'    },
  technology:       { label: 'প্রযুক্তি',      color: 'bg-violet-500',   text: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-200'  },
  training:         { label: 'প্রশিক্ষণ',      color: 'bg-orange-500',   text: 'text-orange-700',  bg: 'bg-orange-50',   border: 'border-orange-200'  },
  success_story:    { label: 'সাফল্যের গল্প',  color: 'bg-teal-500',     text: 'text-teal-700',    bg: 'bg-teal-50',     border: 'border-teal-200'    },
  expert_advice:    { label: 'বিশেষজ্ঞ পরামর্শ', color: 'bg-indigo-500', text: 'text-indigo-700',  bg: 'bg-indigo-50',   border: 'border-indigo-200'  },
  general:          { label: 'সাধারণ',         color: 'bg-slate-500',    text: 'text-slate-700',   bg: 'bg-slate-100',   border: 'border-slate-200'   },
};
const catMeta = (c) => CAT_META[c] || CAT_META.general;

/* ─── Helpers ────────────────────────────────────────────── */
const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)   return 'এইমাত্র';
  if (s < 3600) return `${Math.floor(s/60)} মিনিট আগে`;
  if (s < 86400) return `${Math.floor(s/3600)} ঘন্টা আগে`;
  return formatNewsDate(d);
};

/* ─── Skeleton ───────────────────────────────────────────── */
function Sk({ cls = '' }) { return <div className={`animate-pulse rounded-2xl bg-gray-100 ${cls}`} />; }
function PageSkeleton() {
  return (
    <div className="space-y-5 mt-4">
      <Sk cls="h-10 w-full" />
      <div className="grid grid-cols-5 gap-3"><Sk cls="h-16" /><Sk cls="h-16" /><Sk cls="h-16" /><Sk cls="h-16" /><Sk cls="h-16" /></div>
      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div className="space-y-4">
          <Sk cls="h-72" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <Sk key={i} cls="h-56" />)}
          </div>
        </div>
        <div className="space-y-4"><Sk cls="h-48" /><Sk cls="h-48" /></div>
      </div>
    </div>
  );
}

/* ─── Breaking ticker ────────────────────────────────────── */
function BreakingTicker({ items }) {
  if (!items?.length) return null;
  const doubled = [...items, ...items];
  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-red-200 bg-red-600 h-9">
      <div className="flex-shrink-0 flex items-center gap-2 bg-red-800 px-3 h-full">
        <Zap className="h-3.5 w-3.5 text-white animate-pulse" />
        <span className="text-[11px] font-extrabold tracking-widest text-white">ব্রেকিং</span>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-track flex gap-12 whitespace-nowrap px-4">
          {doubled.map((item, i) => (
            <Link key={i} to={`/app/news/${item.slug}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-red-200 transition flex-shrink-0">
              <span className="text-red-300">🚨</span> {item.title}
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        .ticker-track { animation: ticker 40s linear infinite; }
        .ticker-track:hover { animation-play-state: paused; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}

/* ─── Stat chip ──────────────────────────────────────────── */
function StatChip({ icon: Icon, label, value, iconCls, bg }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-2xl border border-white/60 ${bg} px-4 py-3 shadow-sm`}>
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/70`}>
        <Icon className={`h-4 w-4 ${iconCls}`} />
      </div>
      <div>
        <p className="text-[10px] text-gray-500">{label}</p>
        <p className="text-base font-extrabold text-gray-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}

/* ─── Cat badge ──────────────────────────────────────────── */
function CatBadge({ category, label, size = 'sm' }) {
  const m = catMeta(category);
  const cls = size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5';
  return (
    <span className={`rounded-md font-bold ring-1 ${cls} ${CATEGORY_STYLES[category] || CATEGORY_STYLES.general}`}>
      {label || catMeta(category).label}
    </span>
  );
}

/* ─── Hero featured card ─────────────────────────────────── */
function HeroCard({ article }) {
  if (!article) return null;
  const img = getNewsCoverImage(article);
  const m   = catMeta(article.category);
  return (
    <Link to={`/app/news/${article.slug}`}
      className="group relative overflow-hidden rounded-2xl shadow-xl block">
      <div className="relative h-72 md:h-80 overflow-hidden">
        <img src={img} alt={article.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={e => { e.target.style.display='none'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        {article.is_breaking && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 shadow-lg">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-white" /></span>
            <span className="text-[11px] font-extrabold tracking-wider text-white">BREAKING</span>
          </div>
        )}
        <span className={`absolute top-4 ${article.is_breaking ? 'left-36' : 'left-4'} rounded-lg ${m.color} px-2 py-0.5 text-[11px] font-bold text-white shadow`}>
          {article.category_label || m.label}
        </span>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="text-xl font-extrabold text-white leading-snug line-clamp-2 group-hover:text-emerald-300 transition md:text-2xl">
            {article.title}
          </h2>
          {article.summary && (
            <p className="mt-1.5 text-sm text-white/70 line-clamp-2 hidden md:block">{article.summary}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/60">
            {article.author_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{article.author_name}</span>}
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(article.published_at)}</span>
            {article.reading_time && <span>{article.reading_time} মি. পড়া</span>}
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-400 transition shadow">
            পড়ুন <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Premium news card ──────────────────────────────────── */
function PremiumCard({ article, variant = 'default' }) {
  if (!article) return null;
  const img = getNewsCoverImage(article);
  const isCompact = variant === 'compact';
  return (
    <Link to={`/app/news/${article.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
        catMeta(article.category).border,
      )}>
      <div className={`relative overflow-hidden ${isCompact ? 'h-32' : 'h-44'}`}>
        <img src={img} alt={article.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={e => { e.target.style.display='none'; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {article.is_breaking && (
          <span className="absolute top-2 left-2 rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">BREAKING</span>
        )}
        <span className={`absolute bottom-2 left-2 rounded-md ${catMeta(article.category).color} px-1.5 py-0.5 text-[9px] font-bold text-white`}>
          {article.category_label || catMeta(article.category).label}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className={cn(
          'font-bold text-gray-900 leading-snug group-hover:text-emerald-700 transition line-clamp-2',
          isCompact ? 'text-sm' : 'text-[15px]'
        )}>
          {article.title}
        </h3>
        {!isCompact && article.summary && (
          <p className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2">{article.summary}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2 text-[10px] text-gray-400">
          <div className="flex items-center gap-2">
            {article.author_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{article.author_name}</span>}
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(article.published_at)}</span>
          </div>
          {article.reading_time && <span className="flex-shrink-0">{article.reading_time} মি.</span>}
        </div>
      </div>
    </Link>
  );
}

/* ─── Compact list item ──────────────────────────────────── */
function CompactItem({ article, rank }) {
  const img = getNewsCoverImage(article);
  return (
    <Link to={`/app/news/${article.slug}`}
      className="flex gap-3 rounded-xl p-2 hover:bg-gray-50 transition group">
      {rank != null && (
        <div className={cn('flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold mt-0.5',
          rank === 1 ? 'bg-yellow-400 text-white' : rank === 2 ? 'bg-gray-300 text-white' : rank === 3 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500')}>
          {rank}
        </div>
      )}
      <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl">
        <img src={img} alt={article.title} className="h-full w-full object-cover group-hover:scale-105 transition" onError={e => { e.target.style.display='none'; }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-emerald-700 transition">{article.title}</p>
        <p className="mt-0.5 text-[10px] text-gray-400">{timeAgo(article.published_at)}</p>
      </div>
    </Link>
  );
}

/* ─── Expert article card ────────────────────────────────── */
function ExpertCard({ article }) {
  if (!article) return null;
  const img = getNewsCoverImage(article);
  return (
    <Link to={`/app/news/${article.slug}`}
      className="group flex gap-4 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm hover:shadow-md transition hover:-translate-y-0.5">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-indigo-50">
        <img src={img} alt={article.title} className="h-full w-full object-cover group-hover:scale-105 transition" onError={e => { e.target.style.display='none'; }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <Award className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">বিশেষজ্ঞ</span>
        </div>
        <h4 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-indigo-700 transition">{article.title}</h4>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-gray-400">
          {article.author_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{article.author_name}</span>}
          {article.reading_time && <span>{article.reading_time} মি.</span>}
        </div>
      </div>
    </Link>
  );
}

/* ─── Market widget ──────────────────────────────────────── */
const MARKET_ITEMS = [
  { name: 'ধান',    price: '৳১,২৫০', unit: '/কুইন্টাল', trend: 'up'   },
  { name: 'গম',     price: '৳১,৬০০', unit: '/কুইন্টাল', trend: 'down' },
  { name: 'টমেটো', price: '৳৪৫',   unit: '/কেজি',     trend: 'up'   },
  { name: 'আলু',   price: '৳৩০',   unit: '/কেজি',     trend: 'same' },
  { name: 'বেগুন', price: '৳৬০',   unit: '/কেজি',     trend: 'up'   },
  { name: 'মরিচ',  price: '৳১২০',  unit: '/কেজি',     trend: 'down' },
];
function MarketWidget() {
  return (
    <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-amber-500" />
          <h3 className="font-bold text-gray-800 text-sm">আজকের বাজারদর</h3>
        </div>
        <span className="text-[10px] text-gray-400">আনুমানিক মূল্য</span>
      </div>
      <div className="space-y-1.5">
        {MARKET_ITEMS.map(item => (
          <div key={item.name} className="flex items-center justify-between rounded-xl bg-gray-50/80 px-3 py-2">
            <span className="text-sm font-semibold text-gray-700">{item.name}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-gray-900">{item.price}</span>
              <span className="text-[10px] text-gray-400">{item.unit}</span>
              {item.trend === 'up'   && <ArrowUp   className="h-3.5 w-3.5 text-emerald-500" />}
              {item.trend === 'down' && <ArrowDown  className="h-3.5 w-3.5 text-red-500"     />}
              {item.trend === 'same' && <Minus      className="h-3.5 w-3.5 text-gray-400"    />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Alert item ─────────────────────────────────────────── */
function AlertItem({ article }) {
  const m = catMeta(article.category);
  return (
    <Link to={`/app/news/${article.slug}`}
      className={`flex items-start gap-2.5 rounded-xl border ${m.border} ${m.bg} p-2.5 hover:opacity-90 transition group`}>
      <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${m.text}`} />
      <div className="min-w-0">
        <p className={`text-xs font-bold line-clamp-2 ${m.text} group-hover:underline`}>{article.title}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(article.published_at)}</p>
      </div>
    </Link>
  );
}

/* ─── Quick filter pills ─────────────────────────────────── */
const QUICK_FILTERS = [
  { key: '', label: 'সব' },
  { key: 'weather_alert',    label: '🌧 আবহাওয়া'  },
  { key: 'market_price',     label: '📈 বাজার'     },
  { key: 'crop_disease',     label: '🦠 রোগ'       },
  { key: 'technology',       label: '⚡ প্রযুক্তি' },
  { key: 'government_notice',label: '🏛 সরকার'     },
  { key: 'training',         label: '🎓 প্রশিক্ষণ' },
  { key: 'expert_advice',    label: '👨‍💼 বিশেষজ্ঞ'  },
];

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function NewsHomePage() {
  const [feed,       setFeed]       = useState(null);
  const [categories, setCategories] = useState([]);
  const [category,   setCategory]   = useState('');
  const [search,     setSearch]     = useState('');
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const searchRef = useRef(null);

  const loadFeed = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [feedRes, cats] = await Promise.all([
        newsApi.getHomeFeed(),
        newsApi.getCategories(),
      ]);
      setFeed(feedRes);
      setCategories(cats.categories || []);
    } catch (e) {
      setError(e.message || 'সংবাদ লোড হয়নি');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  useEffect(() => {
    if (!category && !search.trim()) { setFiltered([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await newsApi.list({ limit: 12, category: category || undefined, search: search.trim() || undefined });
        setFiltered(res.news || []);
      } catch { setFiltered([]); }
    }, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [category, search]);

  const showFiltered = !!(category || search.trim());
  const latest       = showFiltered ? filtered : feed?.latest || [];
  const hero         = (feed?.featured?.[0]) || (feed?.breaking?.[0]) || latest[0];
  const gridNews     = showFiltered ? latest : (latest.filter(a => a.id !== hero?.id).slice(0, 9));
  const allAlerts    = [...(feed?.weather_alerts || []), ...(feed?.disease_alerts || [])];

  /* derived stats */
  const todayCount  = (feed?.latest?.length || 0) + (feed?.breaking?.length || 0);
  const alertCount  = allAlerts.length;
  const expertCount = feed?.expert_articles?.length || 0;
  const govCount    = feed?.government?.length || 0;
  const mktCount    = (feed?.latest || []).filter(a => ['market_price','crop_price','market'].includes(a.category)).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 space-y-5">

      {/* ══ MASTHEAD ══ */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">বাংলাদেশ কৃষি সংবাদ পোর্টাল</p>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2 mt-0.5">
            <Newspaper className="h-6 w-6 text-emerald-600" /> কৃষি সংবাদ
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadFeed} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ
          </button>
          <Link to="/app/news/saved"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
            <Bookmark className="h-3.5 w-3.5 text-emerald-600" /> সংরক্ষিত
          </Link>
        </div>
      </div>

      {/* ══ BREAKING TICKER ══ */}
      {!loading && feed?.breaking?.length > 0 && (
        <BreakingTicker items={feed.breaking} />
      )}

      {/* ══ SEARCH BAR ══ */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input ref={searchRef} type="search" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="কৃষি সংবাদ খুঁজুন…"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-10 text-sm shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition" />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ══ QUICK FILTERS ══ */}
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map(f => (
          <button key={f.key} onClick={() => setCategory(f.key)}
            className={cn('rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
              category === f.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-300 hover:text-emerald-700')}>
            {f.label}
          </button>
        ))}
        {categories.filter(c => !QUICK_FILTERS.some(q => q.key === c.key)).map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={cn('rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
              category === c.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-emerald-300')}>
            {c.label}
          </button>
        ))}
      </div>

      {loading && <PageSkeleton />}
      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 py-12 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-400 mb-3" />
          <p className="font-bold text-red-700 mb-3">{error}</p>
          <button onClick={loadFeed} className="rounded-xl bg-red-500 px-5 py-2 text-sm font-bold text-white hover:bg-red-600 transition">
            আবার চেষ্টা করুন
          </button>
        </div>
      )}

      {!loading && feed && (
        <div className="space-y-5">

          {/* ══ STATS BAR ══ */}
          {!showFiltered && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatChip icon={Newspaper}     label="আজকের সংবাদ"   value={todayCount || '—'}   iconCls="text-emerald-600" bg="bg-emerald-50" />
              <StatChip icon={AlertTriangle} label="সক্রিয় সতর্কতা" value={alertCount || '—'}   iconCls="text-red-600"     bg="bg-red-50"    />
              <StatChip icon={CloudRain}     label="আবহাওয়া সতর্কতা" value={feed.weather_alerts?.length || '—'} iconCls="text-sky-600" bg="bg-sky-50" />
              <StatChip icon={BarChart2}     label="বাজার আপডেট"   value={mktCount || '—'}     iconCls="text-amber-600"   bg="bg-amber-50"  />
              <StatChip icon={BookOpen}      label="বিশেষজ্ঞ নিবন্ধ" value={expertCount || '—'} iconCls="text-indigo-600"  bg="bg-indigo-50" />
            </div>
          )}

          {/* ══ MAIN GRID ══ */}
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

            {/* ─── LEFT COL ─── */}
            <div className="space-y-8">

              {/* Hero article */}
              {!showFiltered && hero && <HeroCard article={hero} />}

              {/* Alert cards */}
              {!showFiltered && allAlerts.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="flex items-center gap-2 text-base font-extrabold text-gray-900">
                      <AlertTriangle className="h-5 w-5 text-red-500" /> সতর্কতা বার্তা
                    </h2>
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">{allAlerts.length}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {allAlerts.slice(0, 4).map(a => <AlertItem key={a.id} article={a} />)}
                  </div>
                </section>
              )}

              {/* Government notices */}
              {!showFiltered && feed.government?.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-gray-900">
                    <Building2 className="h-5 w-5 text-blue-600" /> সরকারি বিজ্ঞপ্তি
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {feed.government.slice(0, 4).map(a => (
                      <Link key={a.id} to={`/app/news/${a.slug}`}
                        className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 hover:bg-blue-50 transition group">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100">
                          <Building2 className="h-4.5 w-4.5 text-blue-600" style={{width:18,height:18}} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-blue-900 line-clamp-2 group-hover:underline">{a.title}</p>
                          <p className="mt-0.5 text-[10px] text-blue-500">{timeAgo(a.published_at)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Featured news grid */}
              {!showFiltered && feed.featured?.length > 1 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-gray-900">
                    <Star className="h-5 w-5 text-amber-500" /> বিশেষ সংবাদ
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {feed.featured.slice(1, 5).map(a => <PremiumCard key={a.id} article={a} />)}
                  </div>
                </section>
              )}

              {/* Latest news */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-extrabold text-gray-900">
                    <Zap className="h-5 w-5 text-emerald-500" />
                    {showFiltered ? 'অনুসন্ধানের ফলাফল' : 'সর্বশেষ কৃষি সংবাদ'}
                  </h2>
                  {showFiltered && (
                    <button onClick={() => { setCategory(''); setSearch(''); }}
                      className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                      <X className="h-3.5 w-3.5" /> ফিল্টার মুছুন
                    </button>
                  )}
                </div>
                {gridNews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
                    <Newspaper className="h-12 w-12 text-gray-200 mb-4" />
                    <p className="font-bold text-gray-500">কোনো সংবাদ পাওয়া যায়নি</p>
                    <p className="text-sm text-gray-400 mt-1">ভিন্ন ফিল্টার বা সার্চ শব্দ চেষ্টা করুন</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {gridNews.map(a => <PremiumCard key={a.id} article={a} />)}
                  </div>
                )}
              </section>

              {/* Expert articles */}
              {!showFiltered && feed.expert_articles?.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold text-gray-900">
                    <Award className="h-5 w-5 text-indigo-600" /> বিশেষজ্ঞ নিবন্ধ
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {feed.expert_articles.map(a => <ExpertCard key={a.id} article={a} />)}
                  </div>
                </section>
              )}
            </div>

            {/* ─── RIGHT SIDEBAR ─── */}
            <aside className="space-y-5">

              {/* Trending */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <h3 className="font-extrabold text-gray-800 text-sm">ট্রেন্ডিং সংবাদ</h3>
                  </div>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="space-y-0.5">
                  {(feed.trending || []).slice(0, 7).map((a, i) => (
                    <CompactItem key={a.id} article={a} rank={i + 1} />
                  ))}
                  {!feed.trending?.length && <p className="text-center text-xs text-gray-400 py-4">কোনো ট্রেন্ডিং সংবাদ নেই</p>}
                </div>
              </div>

              {/* Market widget */}
              <MarketWidget />

              {/* Weather + disease alerts */}
              {allAlerts.length > 0 && (
                <div className="rounded-2xl border border-red-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h3 className="font-extrabold text-gray-800 text-sm">সতর্কতা</h3>
                  </div>
                  <div className="space-y-2">
                    {allAlerts.slice(0, 5).map(a => (
                      <Link key={a.id} to={`/app/news/${a.slug}`}
                        className="flex items-start gap-2 rounded-xl p-2 hover:bg-red-50 transition group">
                        <span className="text-sm">⚠️</span>
                        <p className="text-xs font-semibold text-red-800 line-clamp-2 group-hover:underline">{a.title}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Editor's pick / featured */}
              {feed.featured?.length > 0 && (
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 text-amber-500" />
                    <h3 className="font-extrabold text-gray-800 text-sm">সম্পাদকের পছন্দ</h3>
                  </div>
                  <div className="space-y-0.5">
                    {feed.featured.slice(0, 4).map(a => <CompactItem key={a.id} article={a} />)}
                  </div>
                </div>
              )}

              {/* Breaking list */}
              {feed.breaking?.length > 0 && (
                <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-red-600" />
                    <h3 className="font-extrabold text-red-800 text-sm">ব্রেকিং নিউজ</h3>
                  </div>
                  <ul className="space-y-2">
                    {feed.breaking.slice(0, 5).map(a => (
                      <li key={a.id}>
                        <Link to={`/app/news/${a.slug}`}
                          className="text-xs font-bold text-red-900 hover:underline line-clamp-2 flex items-start gap-1.5">
                          <span className="text-red-500 mt-0.5">•</span> {a.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Agri insights */}
              <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sprout className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-extrabold text-emerald-900 text-sm">কৃষি পরামর্শ</h3>
                </div>
                <div className="space-y-2.5 text-xs text-emerald-800">
                  {[
                    { icon: '🌾', text: 'বোরো ধান কাটার মৌসুম শুরু — সঠিক সময়ে কর্তন করুন' },
                    { icon: '💧', text: 'গরমে সেচ ব্যবস্থাপনায় সতর্ক থাকুন' },
                    { icon: '🦠', text: 'ব্লাস্ট রোগের প্রাদুর্ভাব — প্রতিরোধমূলক স্প্রে করুন' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-xl bg-white/70 p-2.5">
                      <span>{t.icon}</span>
                      <span className="leading-relaxed">{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
