import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowLeft, MapPin, Package, PackageX, Clock, CheckCircle2,
  XCircle, AlertTriangle, Info, BarChart2, Calendar, Warehouse,
} from 'lucide-react';
import { warehouseApi }         from '../../shared/services/warehouseApi';
import { STATUS_LABELS }        from './warehouseConstants';
import { useWarehouseSocket }   from './useWarehouseSocket';

const TABS = [
  { id: 'pending',   label: 'অপেক্ষমাণ',  icon: Clock         },
  { id: 'active',    label: 'চলমান',       icon: CheckCircle2  },
  { id: 'completed', label: 'সম্পন্ন',     icon: Package       },
  { id: 'cancelled', label: 'বাতিল',       icon: XCircle       },
];

const STATUS_META = {
  pending:   { cls: 'bg-amber-100 text-amber-700 border border-amber-200',   icon: Clock,         label: 'অপেক্ষমাণ'  },
  approved:  { cls: 'bg-blue-100 text-blue-700 border border-blue-200',      icon: CheckCircle2,  label: 'অনুমোদিত'   },
  active:    { cls: 'bg-emerald-100 text-emerald-700 border border-emerald-200', icon: CheckCircle2, label: 'চলমান'    },
  completed: { cls: 'bg-slate-100 text-slate-600 border border-slate-200',   icon: Package,       label: 'সম্পন্ন'    },
  rejected:  { cls: 'bg-red-100 text-red-700 border border-red-200',         icon: XCircle,       label: 'প্রত্যাখ্যাত'},
  cancelled: { cls: 'bg-slate-100 text-slate-500 border border-slate-200',   icon: XCircle,       label: 'বাতিল'      },
  confirmed: { cls: 'bg-blue-100 text-blue-700 border border-blue-200',      icon: CheckCircle2,  label: 'নিশ্চিত'    },
};

function bn(n) { return Number(n || 0).toLocaleString('bn-BD'); }
function taka(n) { return `৳${Number(n || 0).toLocaleString('bn-BD')}`; }

/* ─── Skeleton ───────────────────────────────────────────── */
function BookingSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex justify-between mb-3">
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-1/3 mb-3" />
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  );
}

export default function MyWarehouseBookings() {
  const [tab,      setTab]      = useState('pending');
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await warehouseApi.myBookings(tab);
      setBookings(res.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);
  useWarehouseSocket(load);

  const cancel = async (id) => {
    if (!window.confirm('বুকিং বাতিল করবেন?')) return;
    await warehouseApi.cancelBooking(id);
    load();
  };

  /* KPIs — derived from all bookings across tabs (won't reflect cross-tab accurately without all-tab fetch, but shows current tab counts nicely) */
  const totalCost = bookings.reduce((s, b) => s + Number(b.total_cost || 0), 0);
  const totalTon  = bookings.reduce((s, b) => s + Number(b.quantity_ton || 0), 0);

  /* expiry alerts */
  const expiringItems = bookings.filter(b => {
    if (b.status !== 'active' || !b.end_date) return false;
    const days = Math.ceil((new Date(b.end_date) - new Date()) / 86400000);
    return days >= 0 && days <= 7;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* ── Header card ── */}
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-md mb-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm flex-shrink-0">
                <Package size={22} className="text-white" />
              </div>
              <div>
                <Link to="/app/warehouse"
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 mb-0.5">
                  <ArrowLeft size={11} /> গুদাম বাজার
                </Link>
                <h1 className="text-xl font-extrabold text-gray-900">📦 আমার গুদাম বুকিং</h1>
                <p className="text-xs text-gray-500">আপনার সকল গুদাম বুকিং ও স্টোরেজ অনুরোধ</p>
              </div>
            </div>
            <Link to="/app/warehouse"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 px-4 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-50 transition">
              <Warehouse size={13} /> নতুন গুদাম খুঁজুন
            </Link>
          </div>

          {/* Quick KPIs */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: 'এই ট্যাবে বুকিং', value: bn(bookings.length), from: 'from-emerald-500', to: 'to-teal-600', icon: Package },
              { label: 'মোট পরিমাণ (টন)', value: bn(totalTon),        from: 'from-blue-500',    to: 'to-indigo-600', icon: BarChart2 },
              { label: 'মোট খরচ',         value: taka(totalCost),     from: 'from-violet-500',  to: 'to-purple-600', icon: Calendar  },
            ].map(k => (
              <div key={k.label} className={`rounded-2xl bg-gradient-to-br ${k.from} ${k.to} p-3 shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-white/80">{k.label}</p>
                    <p className="mt-0.5 text-lg font-extrabold text-white">{loading ? '…' : k.value}</p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/25 flex-shrink-0">
                    <k.icon size={13} className="text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Expiry alerts ── */}
        {expiringItems.length > 0 && (
          <div className="mb-4 space-y-2">
            {expiringItems.map(b => {
              const days = Math.ceil((new Date(b.end_date) - new Date()) / 86400000);
              return (
                <div key={b.booking_id || b.id}
                  className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
                  <AlertTriangle className="flex-shrink-0 text-amber-500" size={18} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-amber-800">
                      ⚠ স্টোরেজ মেয়াদ সতর্কতা — {b.warehouse_name}
                    </p>
                    <p className="text-xs text-amber-600">
                      {days === 0 ? 'আজ মেয়াদ শেষ হচ্ছে!' : `মেয়াদ শেষ হতে ${bn(days)} দিন বাকি`}
                    </p>
                  </div>
                  <Link to="/app/warehouse"
                    className="flex-shrink-0 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-amber-600 transition">
                    নবায়ন করুন
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  tab === t.id ? 'bg-emerald-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}>
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ── List ── */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <BookingSkeleton key={i} />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center">
            <PackageX className="mb-4 text-gray-200" size={52} />
            <p className="font-extrabold text-gray-500">এই অবস্থায় কোনো বুকিং নেই</p>
            <p className="mt-1 text-sm text-gray-400">নতুন গুদাম বুকিং করতে নিচের বোতামে ক্লিক করুন</p>
            <Link to="/app/warehouse"
              className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
              গুদাম খুঁজুন
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map(b => {
              const meta = STATUS_META[b.status] || { cls: 'bg-gray-100 text-gray-600', icon: Package, label: b.status };
              const StatusIcon = meta.icon;
              return (
                <div key={b.booking_id || b.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-extrabold text-gray-900 text-base">
                        {b.warehouse_name}
                      </p>
                      {(b.location || b.district) && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={11} />
                          {[b.location, b.district].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    <span className={`flex-shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${meta.cls}`}>
                      <StatusIcon size={11} /> {STATUS_LABELS[b.status] || b.status}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: 'সময়কাল', value: `${b.start_date} → ${b.end_date}` },
                      { label: 'পরিমাণ', value: `${bn(b.quantity_ton)} টন` },
                      { label: 'পণ্যের ধরন', value: b.product_type || '—' },
                      { label: 'মোট খরচ', value: taka(b.total_cost), highlight: true },
                    ].map(info => (
                      <div key={info.label} className="rounded-xl bg-gray-50 px-3 py-2">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{info.label}</p>
                        <p className={`text-sm font-extrabold ${info.highlight ? 'text-emerald-600' : 'text-gray-800'}`}>
                          {info.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Admin note */}
                  {b.admin_note && (
                    <p className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
                      <Info size={13} className="mt-0.5 flex-shrink-0 text-blue-400" />
                      <span><span className="font-bold">অ্যাডমিন নোট:</span> {b.admin_note}</span>
                    </p>
                  )}

                  {/* Actions */}
                  {b.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => cancel(b.booking_id || b.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-extrabold text-red-600 hover:bg-red-100 transition">
                        <XCircle size={13} /> বাতিল করুন
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
