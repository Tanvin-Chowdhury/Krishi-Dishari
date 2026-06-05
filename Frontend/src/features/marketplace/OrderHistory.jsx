'use client';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'react-toastify';
import {
  ShoppingBag, Package, CheckCircle2, XCircle, DollarSign,
  TrendingUp, Search, X, SlidersHorizontal, Eye, CreditCard,
  AlertTriangle, Truck, Clock, ChevronRight, Receipt, Store,
  RotateCcw,
} from 'lucide-react';
import { marketplaceApi, PAYMENT_STATUS_LABELS } from '../../shared/services/marketplaceApi';
import PageContainer from '../../shared/ui/PageContainer';

/* ─── helpers ────────────────────────────────────────────── */
const fmt    = (n) => Number(n ?? 0).toLocaleString('bn-BD');
const fmtMon = (n) => `৳${fmt(Math.round(n ?? 0))}`;
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : '';

const STATUS_META = {
  pending:    { label: 'অপেক্ষমান',   color: 'bg-amber-100 text-amber-800',    bar: 'bg-amber-400',   dot: 'bg-amber-400'   },
  confirmed:  { label: 'নিশ্চিত',     color: 'bg-blue-100 text-blue-800',      bar: 'bg-blue-400',    dot: 'bg-blue-400'    },
  processing: { label: 'প্রক্রিয়াধীন', color: 'bg-indigo-100 text-indigo-800', bar: 'bg-indigo-400',  dot: 'bg-indigo-400'  },
  shipped:    { label: 'প্রেরিত',      color: 'bg-purple-100 text-purple-800',  bar: 'bg-purple-400',  dot: 'bg-purple-400'  },
  delivered:  { label: 'ডেলিভার্ড',   color: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-400', dot: 'bg-emerald-500' },
  cancelled:  { label: 'বাতিল',       color: 'bg-red-100 text-red-700',        bar: 'bg-red-400',     dot: 'bg-red-400'     },
};

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STEP_LABELS  = ['অর্ডার', 'নিশ্চিত', 'প্যাকেজিং', 'প্রেরিত', 'ডেলিভারি'];

const PAYMENT_BADGE = {
  paid:    'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100  text-amber-700',
  failed:  'bg-red-100    text-red-700',
};

/* ─── skeleton ───────────────────────────────────────────── */
function Sk({ cls = '' }) { return <div className={`animate-pulse rounded-2xl bg-gray-100 ${cls}`} />; }
function PageSkeleton() {
  return (
    <div className="space-y-5">
      <Sk cls="h-24" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"><Sk cls="h-20" /><Sk cls="h-20" /><Sk cls="h-20" /><Sk cls="h-20" /><Sk cls="h-20" /><Sk cls="h-20" /></div>
      <div className="space-y-3">{[1,2,3].map(i => <Sk key={i} cls="h-36" />)}</div>
    </div>
  );
}

/* ─── KPI card ───────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, from, to }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${from} ${to} p-4 shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-white/70">{label}</p>
          <p className="mt-1 text-xl font-extrabold text-white">{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-white/60">{sub}</p>}
        </div>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Icon className="text-white" style={{ width: 17, height: 17 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── progress tracker ───────────────────────────────────── */
function StatusProgress({ status }) {
  if (status === 'cancelled') return null;
  const cur = STATUS_STEPS.indexOf(status);
  return (
    <div className="mt-3 px-1">
      <div className="flex items-center justify-between relative">
        {/* connecting line */}
        <div className="absolute left-0 right-0 top-3 h-0.5 bg-gray-100 mx-3 z-0" />
        <div
          className="absolute left-0 top-3 h-0.5 bg-emerald-400 mx-3 z-0 transition-all duration-700"
          style={{ width: `${cur > 0 ? (cur / (STATUS_STEPS.length - 1)) * 100 : 0}%` }}
        />
        {STATUS_STEPS.map((s, i) => {
          const done  = i <= cur;
          const active = i === cur;
          return (
            <div key={s} className="relative z-10 flex flex-col items-center gap-1">
              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all
                ${done ? 'border-emerald-400 bg-emerald-400' : 'border-gray-200 bg-white'}
                ${active ? 'ring-2 ring-emerald-200' : ''}`}>
                {done && <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
              </div>
              <span className={`text-[9px] font-semibold ${done ? 'text-emerald-600' : 'text-gray-400'}`}>
                {STEP_LABELS[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── cancel modal ───────────────────────────────────────── */
function CancelModal({ order, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mx-auto">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="text-center text-lg font-bold text-gray-800">অর্ডার বাতিল করবেন?</h3>
        <p className="mt-2 text-center text-sm text-gray-500">
          অর্ডার <span className="font-bold text-gray-700">#{order?.order_id}</span> বাতিল হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            না, রাখুন
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition">
            {loading ? 'বাতিল হচ্ছে…' : 'হ্যাঁ, বাতিল করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── spending mini chart ────────────────────────────────── */
function SpendingChart({ orders }) {
  const months = useMemo(() => {
    const map = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}`;
      map[key] = { label: d.toLocaleDateString('bn-BD', { month: 'short' }), amount: 0 };
    }
    orders.forEach((o) => {
      if (o.status === 'cancelled') return;
      const key = o.created_at
        ? `${new Date(o.created_at).getFullYear()}-${String(new Date(o.created_at).getMonth() + 1).padStart(2,'0')}`
        : null;
      if (key && map[key]) map[key].amount += parseFloat(o.total_amount) || 0;
    });
    return Object.values(map);
  }, [orders]);

  const max = Math.max(...months.map(m => m.amount), 1);

  return (
    <div className="flex h-24 items-end gap-2">
      {months.map((m, i) => (
        <div key={i} className="group relative flex flex-1 flex-col items-center gap-1">
          <div className="w-full rounded-t-lg bg-emerald-400 hover:bg-emerald-500 transition-all duration-500"
            style={{ height: `${Math.max((m.amount / max) * 100, m.amount ? 8 : 3)}%` }} />
          {m.amount > 0 && (
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {fmtMon(m.amount)}
            </div>
          )}
          <span className="text-[9px] text-gray-400">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── order card ─────────────────────────────────────────── */
function OrderCard({ o, onCancel }) {
  const meta    = STATUS_META[o.status] ?? STATUS_META.pending;
  const canPay  = o.payment_status !== 'paid' && o.status !== 'cancelled';
  const canCancel = ['pending', 'confirmed'].includes(o.status);

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
      ${o.status === 'delivered' ? 'border-emerald-200' : o.status === 'cancelled' ? 'border-red-100 opacity-80' : 'border-gray-100'}`}>

      {/* top status bar */}
      <div className={`h-1.5 w-full ${meta.bar}`} />

      <div className="p-4">
        {/* header row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400">অর্ডার</span>
              <span className="font-extrabold text-gray-800">#{o.order_id}</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {fmtDate(o.created_at)} · {fmtTime(o.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 justify-end">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.color}`}>
              {meta.label}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PAYMENT_BADGE[o.payment_status] || 'bg-gray-100 text-gray-500'}`}>
              {PAYMENT_STATUS_LABELS[o.payment_status] || o.payment_status}
            </span>
          </div>
        </div>

        {/* amount + items */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-gray-400">মোট পরিমাণ</p>
            <p className="text-2xl font-extrabold text-emerald-600">{fmtMon(o.total_amount)}</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-1.5">
              <Package className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">{o.item_count} আইটেম</span>
            </div>
            {o.payment_method && (
              <span className="mt-1 text-[10px] text-gray-400">
                {o.payment_method === 'cod' ? 'ক্যাশ অন ডেলিভারি' : 'অনলাইন পেমেন্ট'}
              </span>
            )}
          </div>
        </div>

        {/* progress tracker */}
        <StatusProgress status={o.status} />

        {/* actions */}
        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-gray-50">
          <Link to={`/app/market/orders/${o.order_id}`}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition">
            <Eye className="h-3.5 w-3.5" /> বিস্তারিত
          </Link>
          {canPay && (
            <Link to={`/app/market/orders/${o.order_id}/pay`}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition">
              <CreditCard className="h-3.5 w-3.5" /> পরিশোধ করুন
            </Link>
          )}
          {o.status === 'shipped' && (
            <Link to={`/app/market/orders/${o.order_id}`}
              className="flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition">
              <Truck className="h-3.5 w-3.5" /> ট্র্যাক করুন
            </Link>
          )}
          {canCancel && (
            <button onClick={() => onCancel(o)}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-red-500 hover:border-red-300 hover:bg-red-50 transition">
              <XCircle className="h-3.5 w-3.5" /> বাতিল
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── empty state ─────────────────────────────────────────── */
function EmptyState({ filtered, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
        <ShoppingBag className="h-10 w-10 text-emerald-300" />
      </div>
      {filtered ? (
        <>
          <p className="text-lg font-bold text-gray-700">কোনো অর্ডার পাওয়া যায়নি</p>
          <p className="mt-1 text-sm text-gray-400">ফিল্টার পরিবর্তন করুন</p>
          <button onClick={onClear}
            className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
            <RotateCcw className="h-3.5 w-3.5" /> ফিল্টার মুছুন
          </button>
        </>
      ) : (
        <>
          <p className="text-lg font-bold text-gray-700">আপনি এখনো কোনো অর্ডার করেননি</p>
          <p className="mt-1 text-sm text-gray-400">মার্কেটপ্লেস থেকে পণ্য কিনুন</p>
          <Link to="/app/market"
            className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition shadow-sm">
            <Store className="h-4 w-4" /> মার্কেটপ্লেস ব্রাউজ করুন <ChevronRight className="h-4 w-4" />
          </Link>
        </>
      )}
    </div>
  );
}

/* ─── quick action ───────────────────────────────────────── */
function QAction({ icon: Icon, label, to, color, bg }) {
  return (
    <Link to={to}
      className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-4.5 w-4.5 ${color}`} style={{ width: 18, height: 18 }} />
      </div>
      <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">{label}</span>
      <ChevronRight className="ml-auto h-3.5 w-3.5 text-gray-300 group-hover:text-emerald-500 transition" />
    </Link>
  );
}

/* ─── main component ─────────────────────────────────────── */
export default function OrderHistory() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [sortBy, setSortBy]       = useState('newest');
  const [toCancel, setToCancel]   = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    marketplaceApi
      .getMyOrders()
      .then((res) => setOrders(res.orders || []))
      .catch(() => toast.error('অর্ডার লোড করতে সমস্যা'))
      .finally(() => setLoading(false));
  }, []);

  /* ── derived KPIs ── */
  const kpi = useMemo(() => {
    const active    = orders.filter(o => ['pending','confirmed','processing','shipped'].includes(o.status));
    const delivered = orders.filter(o => o.status === 'delivered');
    const cancelled = orders.filter(o => o.status === 'cancelled');
    const now       = new Date();
    const thisMonth = orders.filter(o => {
      if (!o.created_at || o.status === 'cancelled') return false;
      const d = new Date(o.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totalSpent  = delivered.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const monthSpent  = thisMonth.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    return { total: orders.length, active: active.length, delivered: delivered.length,
             cancelled: cancelled.length, totalSpent, monthSpent };
  }, [orders]);

  /* ── filtered + sorted ── */
  const visible = useMemo(() => {
    let arr = [...orders];
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(o => String(o.order_id).includes(q) || o.status?.includes(q));
    }
    if (statusFilter) arr = arr.filter(o => o.status === statusFilter);
    if (sortBy === 'newest')  arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === 'oldest')  arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === 'highest') arr.sort((a, b) => b.total_amount - a.total_amount);
    return arr;
  }, [orders, search, statusFilter, sortBy]);

  const isFiltered = !!(search.trim() || statusFilter);
  const clearFilters = () => { setSearch(''); setStatus(''); };

  /* ── cancel handler ── */
  const handleCancel = async () => {
    if (!toCancel) return;
    setCancelling(true);
    try {
      await marketplaceApi.cancelOrder(toCancel.order_id);
      toast.success('অর্ডার বাতিল হয়েছে');
      setOrders(prev => prev.map(o => o.order_id === toCancel.order_id ? { ...o, status: 'cancelled' } : o));
      setToCancel(null);
    } catch (err) {
      toast.error(err.message || 'বাতিল করতে সমস্যা');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <PageContainer maxWidth="max-w-6xl"><PageSkeleton /></PageContainer>;

  return (
    <PageContainer maxWidth="max-w-6xl">
      <div className="space-y-5">

        {/* ═══════ HERO BANNER ═══════ */}
        <div className="flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-5 shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="text-white">
            <div className="flex items-center gap-2">
              <Receipt className="h-6 w-6 opacity-80" />
              <h1 className="text-2xl font-extrabold">আমার অর্ডার</h1>
            </div>
            <p className="mt-0.5 text-sm text-white/70">আপনার সকল ক্রয়কৃত পণ্য ও অর্ডারের অবস্থা দেখুন</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white">
            {[
              { label: 'মোট অর্ডার', val: fmt(kpi.total) },
              { label: 'চলমান',      val: fmt(kpi.active) },
              { label: 'মোট ব্যয়',  val: fmtMon(kpi.totalSpent) },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-xl font-extrabold">{s.val}</p>
                <p className="text-[10px] opacity-70">{s.label}</p>
              </div>
            ))}
            <div className="hidden sm:block h-10 w-px bg-white/25" />
            <Link to="/app/market"
              className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/25 px-4 py-2 text-sm font-bold text-white transition flex-shrink-0">
              <Store className="h-4 w-4" /> কেনাকাটা করুন
            </Link>
          </div>
        </div>

        {/* ═══════ KPI STRIP ═══════ */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <KpiCard icon={ShoppingBag}  label="মোট অর্ডার"       value={fmt(kpi.total)}      sub="সর্বমোট"             from="from-blue-500"    to="to-blue-700"    />
          <KpiCard icon={Clock}        label="চলমান অর্ডার"      value={fmt(kpi.active)}     sub="প্রক্রিয়াধীন"       from="from-amber-500"   to="to-orange-500"  />
          <KpiCard icon={CheckCircle2} label="সম্পন্ন অর্ডার"    value={fmt(kpi.delivered)}  sub="ডেলিভার হয়েছে"     from="from-emerald-500" to="to-teal-600"    />
          <KpiCard icon={XCircle}      label="বাতিল অর্ডার"      value={fmt(kpi.cancelled)}  sub="বাতিল হয়েছে"       from="from-rose-500"    to="to-pink-600"    />
          <KpiCard icon={DollarSign}   label="মোট ব্যয়"          value={fmtMon(kpi.totalSpent)} sub="ডেলিভার্ড অর্ডার" from="from-violet-500" to="to-purple-700"  />
          <KpiCard icon={TrendingUp}   label="এই মাসের ক্রয়"     value={fmtMon(kpi.monthSpent)} sub="চলতি মাস"        from="from-sky-500"     to="to-cyan-600"    />
        </div>

        {/* ═══════ MAIN LAYOUT ═══════ */}
        <div className="grid gap-5 lg:grid-cols-4">

          {/* ─── Orders list (left, 3/4) ─── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Search + Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="অর্ডার নম্বর খুঁজুন…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
                {search && (
                  <button onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <SlidersHorizontal className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-8 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer">
                    <option value="">সব স্ট্যাটাস</option>
                    <option value="pending">অপেক্ষমান</option>
                    <option value="confirmed">নিশ্চিত</option>
                    <option value="processing">প্রক্রিয়াধীন</option>
                    <option value="shipped">প্রেরিত</option>
                    <option value="delivered">ডেলিভার্ড</option>
                    <option value="cancelled">বাতিল</option>
                  </select>
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer">
                  <option value="newest">নতুন আগে</option>
                  <option value="oldest">পুরনো আগে</option>
                  <option value="highest">সর্বোচ্চ মূল্য</option>
                </select>
              </div>
            </div>

            {/* Result count */}
            {orders.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {visible.length} টি অর্ডার{orders.length !== visible.length ? ` (মোট ${orders.length} থেকে)` : ''}
                </p>
                {isFiltered && (
                  <button onClick={clearFilters}
                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700">
                    <X className="h-3.5 w-3.5" /> ফিল্টার মুছুন
                  </button>
                )}
              </div>
            )}

            {/* Order cards */}
            {visible.length === 0 ? (
              <EmptyState filtered={isFiltered} onClear={clearFilters} />
            ) : (
              <div className="space-y-3">
                {visible.map((o) => (
                  <OrderCard key={o.order_id} o={o} onCancel={setToCancel} />
                ))}
              </div>
            )}
          </div>

          {/* ─── Right sidebar (1/4) ─── */}
          <div className="space-y-4">
            {/* Spending chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <h3 className="font-bold text-gray-800 text-sm">মাসিক ব্যয়</h3>
              </div>
              <SpendingChart orders={orders} />
            </div>

            {/* Order summary */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 text-sm mb-3">অর্ডার সারসংক্ষেপ</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'মোট অর্ডার',     value: fmt(kpi.total),           color: 'text-blue-600'   },
                  { label: 'সম্পন্ন',         value: fmt(kpi.delivered),       color: 'text-emerald-600' },
                  { label: 'চলমান',           value: fmt(kpi.active),          color: 'text-amber-600'  },
                  { label: 'বাতিল',           value: fmt(kpi.cancelled),       color: 'text-red-500'    },
                  { label: 'মোট ব্যয়',        value: fmtMon(kpi.totalSpent),   color: 'text-violet-600'  },
                  { label: 'এই মাস',          value: fmtMon(kpi.monthSpent),   color: 'text-sky-600'    },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{s.label}</span>
                    <span className={`text-xs font-bold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 text-sm mb-3">দ্রুত কার্যক্রম</h3>
              <div className="space-y-2">
                <QAction icon={Package}    label="সব অর্ডার ট্র্যাক"   to="/app/market/orders" color="text-indigo-600" bg="bg-indigo-50"  />
                <QAction icon={Store}      label="মার্কেটপ্লেস"         to="/app/market"        color="text-emerald-600" bg="bg-emerald-50" />
                <QAction icon={ShoppingBag} label="কার্ট দেখুন"         to="/app/market/cart"   color="text-blue-600"  bg="bg-blue-50"   />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ Cancel Modal ═══════ */}
      {toCancel && (
        <CancelModal
          order={toCancel}
          loading={cancelling}
          onConfirm={handleCancel}
          onCancel={() => !cancelling && setToCancel(null)}
        />
      )}
    </PageContainer>
  );
}
