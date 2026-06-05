'use client';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import {
  Plus, Package, TrendingUp, ShoppingBag, DollarSign,
  Clock, AlertTriangle, Pencil, ChevronRight,
  ArrowUpRight, Star, Boxes, BarChart3,
  CheckCircle2, Store, Award, Activity,
} from 'lucide-react';
import { AuthContext } from '../../core/auth/AuthContext';
import { marketplaceApi } from '../../shared/services/marketplaceApi';
import { resolveMediaUrl } from '../../shared/lib/mediaUrl';
import PageContainer from '../../shared/ui/PageContainer';
import { OrderStatusBadge } from './MarketplaceShared';

/* ─────────────────────────── helpers ─────────────────────────── */
const fmt     = (n) => Number(n ?? 0).toLocaleString('bn-BD');
const fmtMon  = (n) => `৳${fmt(Math.round(n ?? 0))}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('bn-BD', { day: '2-digit', month: 'short' }) : '—';

/** Group orders into buckets for the last `n` days. */
function bucketDays(orders, n = 7) {
  const map = {};
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map[key] = {
      label: d.toLocaleDateString('bn-BD', { day: '2-digit', month: 'short' }),
      amount: 0,
      count: 0,
    };
  }
  (orders || []).forEach((o) => {
    const key = o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : null;
    if (key && map[key]) { map[key].amount += o.total_amount ?? 0; map[key].count += 1; }
  });
  return Object.values(map);
}

/** Cardinal-spline smooth SVG path through an array of {x,y} points. */
function smoothPath(pts) {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const cp1x = (p1.x + (p2.x - p0.x) / 6).toFixed(2);
    const cp1y = (p1.y + (p2.y - p0.y) / 6).toFixed(2);
    const cp2x = (p2.x - (p3.x - p1.x) / 6).toFixed(2);
    const cp2y = (p2.y - (p3.y - p1.y) / 6).toFixed(2);
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

/* ─────────────────────── SVG Revenue Line Chart ──────────────── */
function RevenueChart({ orders }) {
  const W = 480, H = 150;
  const PAD = { t: 12, r: 12, b: 28, l: 8 };
  const days = useMemo(() => bucketDays(orders, 7), [orders]);
  const maxAmt = Math.max(...days.map((d) => d.amount), 100);
  const sx = (i) => PAD.l + (i / (days.length - 1)) * (W - PAD.l - PAD.r);
  const sy = (v) => PAD.t + (1 - v / maxAmt) * (H - PAD.t - PAD.b);
  const pts = days.map((d, i) => ({ x: sx(i), y: sy(d.amount), ...d }));
  const line = smoothPath(pts);
  const area = pts.length
    ? `${line} L${pts[pts.length - 1].x},${H - PAD.b} L${pts[0].x},${H - PAD.b} Z`
    : '';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sdRevArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#10b981" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="sdRevLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#059669" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>
      {/* grid */}
      {[0.33, 0.66, 1].map((r) => (
        <line key={r} x1={PAD.l} x2={W - PAD.r}
          y1={sy(maxAmt * r)} y2={sy(maxAmt * r)}
          stroke="#f0fdf4" strokeWidth="1" />
      ))}
      {area && <path d={area} fill="url(#sdRevArea)" />}
      {line && <path d={line} fill="none" stroke="url(#sdRevLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4.5" fill="white" stroke="#10b981" strokeWidth="2.5" />
          {p.count > 0 && <circle cx={p.x} cy={p.y} r="2" fill="#10b981" />}
        </g>
      ))}
      {days.map((d, i) => (
        <text key={i} x={sx(i)} y={H - 6} textAnchor="middle"
          style={{ fontSize: 9, fontFamily: 'inherit', fill: '#9ca3af' }}>
          {d.label.slice(0, 5)}
        </text>
      ))}
    </svg>
  );
}

/* ─────────────────────── SVG Orders Bar Chart ─────────────────── */
function OrdersChart({ orders }) {
  const W = 480, H = 110;
  const PAD = { t: 8, r: 12, b: 28, l: 8 };
  const days = useMemo(() => bucketDays(orders, 7), [orders]);
  const maxCnt = Math.max(...days.map((d) => d.count), 1);
  const bw = (W - PAD.l - PAD.r) / days.length;
  const gap = bw * 0.35;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sdBarGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6366f1" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      {days.map((d, i) => {
        const h = Math.max((d.count / maxCnt) * (H - PAD.t - PAD.b), d.count ? 5 : 1.5);
        const x = PAD.l + i * bw + gap / 2;
        const y = H - PAD.b - h;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw - gap} height={h}
              rx="3" fill="url(#sdBarGrad)" opacity={d.count ? 1 : 0.18} />
            <text x={x + (bw - gap) / 2} y={H - 6} textAnchor="middle"
              style={{ fontSize: 9, fontFamily: 'inherit', fill: '#9ca3af' }}>
              {d.label.slice(0, 4)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ─────────────────────── Circular Score ──────────────────────── */
function ScoreRing({ score, size = 96 }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'চমৎকার' : score >= 40 ? 'ভালো' : 'উন্নয়ন';
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
        <text x={size / 2} y={size / 2 - 4} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 20, fontWeight: 800, fill: '#1f2937', fontFamily: 'inherit' }}>
          {score}
        </text>
        <text x={size / 2} y={size / 2 + 14} textAnchor="middle"
          style={{ fontSize: 8, fill: '#9ca3af', fontFamily: 'inherit' }}>
          / ১০০
        </text>
      </svg>
      <span className="text-xs font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

/* ─────────────────────── Inventory Donut ─────────────────────── */
function InventoryDonut({ segs }) {
  const total = segs.reduce((s, g) => s + g.count, 0) || 1;
  const r = 34; const CX = 44; const CY = 44; const SW = 11;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  const slices = segs.map((s) => {
    const dash = (s.count / total) * circ;
    const sl = { ...s, dash, off: -acc };
    acc += dash;
    return sl;
  });
  return (
    <div className="flex items-center gap-4">
      <svg width="88" height="88" viewBox="0 0 88 88" className="flex-shrink-0">
        <circle cx={CX} cy={CY} r={r} fill="none" stroke="#f3f4f6" strokeWidth={SW} />
        {slices.map((s, i) => (
          <circle key={i} cx={CX} cy={CY} r={r} fill="none"
            stroke={s.color} strokeWidth={SW}
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={s.off}
            transform={`rotate(-90 ${CX} ${CY})`} />
        ))}
        <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 14, fontWeight: 800, fill: '#1f2937', fontFamily: 'inherit' }}>
          {total}
        </text>
        <text x={CX} y={CY + 13} textAnchor="middle"
          style={{ fontSize: 8, fill: '#9ca3af', fontFamily: 'inherit' }}>পণ্য</text>
      </svg>
      <div className="space-y-2 flex-1">
        {segs.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 text-xs text-gray-500">{s.label}</span>
            <span className="text-xs font-bold text-gray-700">{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Product Mini Card ───────────────────── */
function ProductMiniCard({ p }) {
  const navigate = useNavigate();
  const img = resolveMediaUrl(p.photo_url);
  const isLow = p.quantity < 10 && p.is_active;
  return (
    <div
      onClick={() => navigate(`/app/market/products/${p.product_id}`)}
      className="group flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* image */}
      <div className="relative h-24 bg-gradient-to-br from-emerald-50 to-gray-50 flex items-center justify-center overflow-hidden">
        {img
          ? <img src={img} alt={p.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          : <Package className="h-8 w-8 text-emerald-200" />}
        {isLow && (
          <span className="absolute top-1.5 right-1.5 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
            কম স্টক
          </span>
        )}
        {!p.is_active && (
          <span className="absolute top-1.5 right-1.5 rounded-full bg-gray-400 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
            বন্ধ
          </span>
        )}
      </div>
      {/* info */}
      <div className="p-2.5 flex flex-col flex-1">
        <p className="text-[11px] font-bold text-gray-800 truncate leading-tight">{p.title}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{p.category}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs font-extrabold text-emerald-600">{fmtMon(p.price)}</span>
          <span className="text-[10px] text-gray-400">{fmt(p.quantity)}{p.unit}</span>
        </div>
      </div>
      {/* edit row */}
      <Link
        to={`/app/market/products/${p.product_id}/edit`}
        onClick={(e) => e.stopPropagation()}
        className="mx-2 mb-2 flex items-center justify-center gap-1 rounded-xl border border-gray-100 py-1.5 text-[10px] font-semibold text-gray-500 hover:border-emerald-300 hover:text-emerald-600 transition"
      >
        <Pencil className="h-2.5 w-2.5" /> সম্পাদনা
      </Link>
    </div>
  );
}

/* ─────────────────────── Order Timeline Item ─────────────────── */
function OrderTimeline({ orders }) {
  const statusColor = {
    pending: 'bg-amber-400', confirmed: 'bg-blue-400', processing: 'bg-indigo-400',
    shipped: 'bg-purple-400', delivered: 'bg-emerald-500', cancelled: 'bg-red-400',
  };
  return (
    <div className="space-y-0">
      {orders.map((o, i) => {
        const initials = (o.buyer_name || 'ক').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
        const isLast = i === orders.length - 1;
        return (
          <div key={o.order_id} className="flex gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white ${statusColor[o.status] || 'bg-gray-400'}`}>
                {initials}
              </div>
              {!isLast && <div className="w-px flex-1 bg-gray-100 my-1 min-h-[12px]" />}
            </div>
            <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-3'}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-800 truncate">{o.buyer_name}</span>
                <OrderStatusBadge status={o.status} />
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[10px] text-gray-400">#{o.order_id} · {fmtDate(o.created_at)}</span>
                <span className="text-sm font-extrabold text-gray-700">{fmtMon(o.total_amount)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────── Score Progress Bar ──────────────────── */
function ScoreBar({ label, val, color }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
        <span>{label}</span><span>{val}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${val}%` }} />
      </div>
    </div>
  );
}

/* ─────────────────────── KPI Gradient Card ───────────────────── */
function KpiCard({ icon: Icon, label, value, sub, from, to }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${from} ${to} p-4 shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-white/70">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-white/60">{sub}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 flex-shrink-0">
          <Icon className="text-white" style={{ width: 18, height: 18 }} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Quick Action ────────────────────────── */
function QAction({ icon: Icon, label, to, color, bg }) {
  return (
    <Link to={to}
      className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} group-hover:scale-110 transition-transform`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <span className="text-center text-[11px] font-semibold text-gray-700 leading-tight">{label}</span>
    </Link>
  );
}

/* ─────────────────────── Business Insight ────────────────────── */
function BizCard({ icon: Icon, label, value, color, bg, to }) {
  const inner = (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm hover:shadow-md transition group">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-4.5 w-4.5 ${color}`} style={{ width: 18, height: 18 }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-gray-400">{label}</p>
        <p className="text-sm font-extrabold text-gray-800 truncate">{value}</p>
      </div>
      {to && <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-emerald-500 transition flex-shrink-0" />}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

/* ─────────────────────── Skeletons ───────────────────────────── */
function Sk({ cls = '' }) { return <div className={`animate-pulse rounded-2xl bg-gray-100 ${cls}`} />; }
function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <Sk cls="h-28" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <Sk key={i} cls="h-[88px]" />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Sk cls="h-60 lg:col-span-2" />
        <Sk cls="h-60" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Sk cls="h-60 lg:col-span-2" />
        <Sk cls="h-60" />
      </div>
    </div>
  );
}

/* ─────────────────────── MAIN COMPONENT ──────────────────────── */
export default function SellerDashboard() {
  const { user }  = useContext(AuthContext);
  const [stats, setStats]       = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      marketplaceApi.getSellerStats(),
      marketplaceApi.getMyProducts({ limit: 20 }),
    ])
      .then(([sRes, pRes]) => { setStats(sRes.stats); setProducts(pRes.products || []); })
      .catch(() => toast.error('ড্যাশবোর্ড লোড করতে সমস্যা'))
      .finally(() => setLoading(false));
  }, []);

  /* ── derived ── */
  const orders     = stats?.recent_orders ?? [];
  const pendingCnt = orders.filter((o) => o.status === 'pending').length;
  const revenue    = orders.reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const lowStock   = products.filter((p) => p.quantity < 10 && p.is_active);
  const bestProd   = products.slice().sort((a, b) => (b.total_sold ?? 0) - (a.total_sold ?? 0))[0];
  const totalValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
  const totalStock = products.reduce((s, p) => s + (p.quantity ?? 0), 0);
  const activeRate = stats ? Math.round((stats.active_products / Math.max(1, stats.total_products)) * 100) : 0;

  const score = Math.min(100, Math.round(
    activeRate * 0.3 +
    (stats?.total_sales > 0 ? 40 : 0) +
    (stats?.recent_orders_count > 0 ? 20 : 0) +
    (products.length > 0 ? 10 : 0),
  ));

  const invSegs = [
    { label: 'সক্রিয়',     count: products.filter((p) => p.is_active && p.quantity > 10).length, color: '#10b981' },
    { label: 'কম স্টক',    count: lowStock.length,                                                color: '#f59e0b' },
    { label: 'স্টক শেষ',   count: products.filter((p) => p.status === 'out-of-stock').length,    color: '#ef4444' },
    { label: 'নিষ্ক্রিয়', count: products.filter((p) => !p.is_active).length,                  color: '#d1d5db' },
  ];

  const today = new Date().toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <PageContainer maxWidth="max-w-7xl">
      {loading ? <LoadingSkeleton /> : (
        <div className="space-y-5">

          {/* ═══════════════ GREETING BANNER ═══════════════ */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-5 shadow-xl">
            <div className="text-white">
              <p className="text-[11px] font-medium opacity-70">{today}</p>
              <h1 className="mt-0.5 text-2xl font-extrabold">
                স্বাগতম, {user?.full_name?.split(' ')[0] || 'বিক্রেতা'} 👋
              </h1>
              <p className="text-xs opacity-70 mt-0.5">আপনার ব্যবসার আজকের সারসংক্ষেপ</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {[
                { label: 'মোট পণ্য',      val: fmt(stats?.total_products)        },
                { label: '৩০ দিনের অর্ডার', val: fmt(stats?.recent_orders_count) },
                { label: 'সাম্প্রতিক আয়', val: fmtMon(revenue)                  },
              ].map((s, i) => (
                <div key={i} className="text-center text-white">
                  <p className="text-xl font-extrabold">{s.val}</p>
                  <p className="text-[10px] opacity-70">{s.label}</p>
                </div>
              ))}
              <div className="hidden sm:block h-10 w-px bg-white/25" />
              <Link to="/app/market/sell"
                className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/25 px-4 py-2 text-sm font-bold text-white transition">
                <Plus className="h-4 w-4" /> নতুন পণ্য
              </Link>
            </div>
          </div>

          {/* ═══════════════ KPI STRIP ═══════════════ */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <KpiCard icon={Package}      label="মোট পণ্য"          value={fmt(stats?.total_products)}      sub="তালিকাভুক্ত"        from="from-blue-500"    to="to-blue-700"    />
            <KpiCard icon={CheckCircle2} label="সক্রিয় পণ্য"       value={fmt(stats?.active_products)}     sub={`${activeRate}% সক্রিয়`} from="from-emerald-500" to="to-teal-600"  />
            <KpiCard icon={TrendingUp}   label="মোট বিক্রয়"        value={fmt(stats?.total_sales)}         sub="ইউনিট বিক্রিত"      from="from-violet-500"  to="to-purple-700"  />
            <KpiCard icon={ShoppingBag}  label="৩০ দিনের অর্ডার"   value={fmt(stats?.recent_orders_count)} sub="গত মাসে"            from="from-sky-500"     to="to-cyan-600"    />
            <KpiCard icon={DollarSign}   label="ইনভেন্টরি মূল্যমান" value={fmtMon(totalValue)}              sub="আনুমানিক"           from="from-amber-500"   to="to-orange-600"  />
            <KpiCard icon={Clock}        label="অপেক্ষমান অর্ডার"   value={fmt(pendingCnt)}                 sub="অনুমোদন দরকার"      from="from-rose-500"    to="to-pink-600"    />
          </div>

          {/* ═══════════════ CHARTS ROW ═══════════════ */}
          <div className="grid gap-5 lg:grid-cols-3">

            {/* Revenue + Orders charts */}
            <div className="flex flex-col gap-5 lg:col-span-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800">আয়ের ট্রেন্ড</h3>
                    <p className="text-[11px] text-gray-400">গত ৭ দিনের আয় — সাম্প্রতিক অর্ডার থেকে</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {fmtMon(revenue)}
                  </span>
                </div>
                <div className="h-36"><RevenueChart orders={orders} /></div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800">অর্ডার ট্রেন্ড</h3>
                    <p className="text-[11px] text-gray-400">গত ৭ দিনের অর্ডার সংখ্যা</p>
                  </div>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                    {fmt(orders.length)} অর্ডার
                  </span>
                </div>
                <div className="h-28"><OrdersChart orders={orders} /></div>
              </div>
            </div>

            {/* Seller score + Inventory donut */}
            <div className="flex flex-col gap-5">
              <div className="flex-1 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-1">বিক্রেতা স্কোর</h3>
                <p className="text-[11px] text-gray-400 mb-4">কার্যক্ষমতার ভিত্তিতে</p>
                <div className="flex flex-col items-center gap-4">
                  <ScoreRing score={score} size={108} />
                  <div className="w-full space-y-2.5">
                    <ScoreBar label="সক্রিয়তার হার"       val={activeRate}                          color="bg-emerald-400" />
                    <ScoreBar label="বিক্রয় কার্যক্ষমতা" val={stats?.total_sales > 0 ? 100 : 0}  color="bg-blue-400"    />
                    <ScoreBar label="সাম্প্রতিক অর্ডার"   val={orders.length > 0 ? 100 : 0}        color="bg-violet-400"  />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4">ইনভেন্টরি স্বাস্থ্য</h3>
                <InventoryDonut segs={invSegs} />
              </div>
            </div>
          </div>

          {/* ═══════════════ PRODUCTS + ORDERS ═══════════════ */}
          <div className="grid gap-5 lg:grid-cols-5">

            {/* Product mini-cards */}
            <div className="lg:col-span-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">আমার পণ্য</h3>
                <Link to="/app/market/sell/list"
                  className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                  সব দেখুন <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <Package className="h-12 w-12 text-emerald-100 mb-3" />
                  <p className="text-sm font-semibold text-gray-600">আপনার কোনো পণ্য নেই</p>
                  <Link to="/app/market/sell"
                    className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition">
                    <Plus className="h-3.5 w-3.5" /> প্রথম পণ্য যোগ করুন
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                  {products.slice(0, 8).map((p) => <ProductMiniCard key={p.product_id} p={p} />)}
                </div>
              )}
            </div>

            {/* Recent activity timeline */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">সাম্প্রতিক কার্যক্রম</h3>
                <Link to="/app/market/seller-orders"
                  className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                  সব দেখুন <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <ShoppingBag className="h-12 w-12 text-blue-100 mb-3" />
                  <p className="text-sm font-semibold text-gray-600">এখনো কোনো অর্ডার নেই</p>
                  <p className="text-xs text-gray-400 mt-1">পণ্য যোগ করুন এবং অর্ডার পান</p>
                </div>
              ) : (
                <OrderTimeline orders={orders} />
              )}
            </div>
          </div>

          {/* ═══════════════ QUICK ACTIONS + INSIGHTS ═══════════════ */}
          <div className="grid gap-5 lg:grid-cols-2">

            {/* Quick Actions */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">দ্রুত কার্যক্রম</h3>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
                <QAction icon={Plus}           label="নতুন পণ্য"       to="/app/market/sell"          color="text-emerald-600" bg="bg-emerald-50" />
                <QAction icon={Package}        label="পণ্য তালিকা"     to="/app/market/sell/list"     color="text-blue-600"    bg="bg-blue-50"    />
                <QAction icon={ShoppingBag}    label="অর্ডার দেখুন"   to="/app/market/seller-orders" color="text-violet-600"  bg="bg-violet-50"  />
                <QAction icon={BarChart3}      label="বিক্রয় পরিসংখ্যান" to="/app/market/sell"       color="text-amber-600"   bg="bg-amber-50"   />
                <QAction icon={AlertTriangle}  label="কম স্টক"         to="/app/market/sell/list"     color="text-rose-500"    bg="bg-rose-50"    />
                <QAction icon={Store}          label="মার্কেটপ্লেস"    to="/app/market"               color="text-sky-600"     bg="bg-sky-50"     />
              </div>
            </div>

            {/* Business Insights */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">ব্যবসায়িক অন্তর্দৃষ্টি</h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <BizCard icon={Star}           label="সেরা পণ্য"           value={bestProd?.title || 'তথ্য নেই'}          color="text-amber-600"  bg="bg-amber-50"   to={bestProd ? `/app/market/products/${bestProd.product_id}` : undefined} />
                <BizCard icon={AlertTriangle}  label="কম স্টক পণ্য"        value={`${lowStock.length} টি`}                color="text-rose-500"   bg="bg-rose-50"    to="/app/market/sell/list" />
                <BizCard icon={DollarSign}     label="ইনভেন্টরি মূল্যমান"  value={fmtMon(totalValue)}                     color="text-violet-600" bg="bg-violet-50"  />
                <BizCard icon={Award}          label="বিক্রেতা স্কোর"       value={`${score} / ১০০`}                       color="text-emerald-600" bg="bg-emerald-50" />
                <BizCard icon={Activity}       label="অ্যাকটিভিটি হার"     value={`${activeRate}%`}                       color="text-sky-600"    bg="bg-sky-50"     />
                <BizCard icon={Boxes}          label="মোট স্টক"            value={`${fmt(totalStock)} ইউনিট`}             color="text-teal-600"   bg="bg-teal-50"    />
              </div>
            </div>
          </div>

        </div>
      )}
    </PageContainer>
  );
}
