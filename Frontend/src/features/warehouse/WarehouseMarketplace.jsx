import { useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Search, Warehouse, SlidersHorizontal, X, RefreshCw,
  MapPin, Package, Thermometer, Droplets, Shield,
  Truck, BarChart2, Flame, ChevronRight, PackageX,
} from 'lucide-react';
import { warehouseApi }        from '../../shared/services/warehouseApi';
import WarehouseCard           from './components/WarehouseCard';
import BookingModal            from './components/BookingModal';
import { WAREHOUSE_TYPES, RENTER_ROLES } from './warehouseConstants';
import { useWarehouseSocket }  from './useWarehouseSocket';
import { AuthContext }         from '../../core/auth/AuthContext';

/* ─── helpers ─────────────────────────────────────────────── */
function bn(n) {
  if (n == null || n === '') return '—';
  return Number(n).toLocaleString('bn-BD');
}

/* ─── skeleton ───────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="h-48 bg-gray-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-gray-100 rounded w-2/3" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="flex gap-1 mt-1">
          {[1, 2, 3].map(i => <div key={i} className="h-5 w-16 bg-gray-100 rounded-lg" />)}
        </div>
        <div className="h-9 bg-gray-100 rounded-xl mt-2" />
      </div>
    </div>
  );
}

/* ─── sidebar: popular warehouses ────────────────────────── */
function SidebarPopular({ warehouses }) {
  const PLACEHOLDER = 'https://images.unsplash.com/photo-1759277700771-137173db0e5b?w=80&h=80&fit=crop';
  const items = warehouses.slice(0, 5);
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-gray-900">
        <Flame size={14} className="text-orange-500" /> জনপ্রিয় গুদাম
      </h3>
      <div className="space-y-2">
        {items.map(w => {
          const id = w.warehouse_id || w.id;
          const cap  = w.capacity || w.capacity_ton || 0;
          const avail = w.available_capacity ?? w.available_capacity_ton ?? cap;
          return (
            <Link key={id} to={`/app/warehouse/${id}`}
              className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-gray-50 transition group">
              <img src={w.photo_url || w.images?.[0] || PLACEHOLDER} alt=""
                className="h-10 w-10 rounded-xl object-cover flex-shrink-0"
                onError={e => { e.target.src = PLACEHOLDER; }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-extrabold text-gray-800 group-hover:text-emerald-700 transition">
                  {w.title || w.name}
                </p>
                <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <MapPin size={9} /> {w.district || w.location}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] font-extrabold text-emerald-600">
                  {avail > 0 ? `${bn(avail)} টন` : 'পূর্ণ'}
                </p>
                <p className="text-[9px] text-gray-400">খালি</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─── sidebar: district breakdown ────────────────────────── */
function SidebarDistricts({ warehouses }) {
  const counts = warehouses.reduce((acc, w) => {
    const d = w.district || (w.location || '').split(',')[0].trim();
    if (d) acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {});
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 6);
  if (!sorted.length) return null;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-gray-900">
        <MapPin size={14} className="text-blue-500" /> জেলা অনুযায়ী
      </h3>
      <div className="space-y-1.5">
        {sorted.map(([d, cnt]) => (
          <div key={d} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
            <span className="text-xs text-gray-600">{d}</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
              {bn(cnt)} গুদাম
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── sidebar: capacity by type ──────────────────────────── */
function SidebarCapacity({ warehouses }) {
  const byType = WAREHOUSE_TYPES.map(t => {
    const list = warehouses.filter(w => w.warehouse_type === t.code);
    const cap  = list.reduce((s, w) => s + (w.capacity || w.capacity_ton || 0), 0);
    const avail = list.reduce((s, w) => s + (w.available_capacity ?? w.available_capacity_ton ?? 0), 0);
    return { ...t, count: list.length, cap, avail };
  }).filter(t => t.count > 0);

  if (!byType.length) return null;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-gray-900">
        <BarChart2 size={14} className="text-violet-500" /> ধারণক্ষমতা বিভাজন
      </h3>
      <div className="space-y-2.5">
        {byType.map(t => {
          const pct = t.cap > 0 ? Math.round(((t.cap - t.avail) / t.cap) * 100) : 0;
          return (
            <div key={t.code}>
              <div className="flex items-center justify-between text-[11px] text-gray-600 mb-0.5">
                <span className="font-semibold">{t.label}</span>
                <span className="text-gray-400">{bn(t.avail)}/{bn(t.cap)} টন</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${100 - pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function WarehouseMarketplace() {
  const { user }           = useContext(AuthContext);
  const [search,    setSearch]    = useState('');
  const [district,  setDistrict]  = useState('');
  const [type,      setType]      = useState('');
  const [minPrice,  setMinPrice]  = useState('');
  const [maxPrice,  setMaxPrice]  = useState('');
  const [minCap,    setMinCap]    = useState('');
  const [coldOnly,  setColdOnly]  = useState(false);
  const [availOnly, setAvailOnly] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [total,      setTotal]    = useState(0);
  const [loading,    setLoading]  = useState(true);
  const [bookTarget, setBookTarget] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const isRenter = RENTER_ROLES.includes(user?.role_id);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await warehouseApi.search({
        search:          search    || undefined,
        district:        district  || undefined,
        warehouse_type:  type      || undefined,
        min_price:       minPrice  || undefined,
        max_price:       maxPrice  || undefined,
        min_capacity:    minCap    || undefined,
        available_only:  availOnly || undefined,
        limit: 30,
      });
      setWarehouses(res.warehouses || []);
      setTotal(res.pagination?.total ?? res.warehouses?.length ?? 0);
    } catch {
      setWarehouses([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, district, type, minPrice, maxPrice, minCap, availOnly]);

  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [load]);

  useWarehouseSocket(load);

  /* derived KPIs */
  const totalCap  = warehouses.reduce((s, w) => s + (w.capacity || w.capacity_ton || 0), 0);
  const totalAvail = warehouses.reduce((s, w) => s + (w.available_capacity ?? w.available_capacity_ton ?? 0), 0);
  const districts  = new Set(warehouses.map(w => w.district || (w.location || '').split(',')[0]).filter(Boolean)).size;
  const coldCount  = warehouses.filter(w => w.temperature_control).length;

  const filtered = coldOnly ? warehouses.filter(w => w.temperature_control) : warehouses;

  const hasFilters = search || district || type || minPrice || maxPrice || minCap || coldOnly || !availOnly;

  const resetFilters = () => {
    setSearch(''); setDistrict(''); setType('');
    setMinPrice(''); setMaxPrice(''); setMinCap('');
    setColdOnly(false); setAvailOnly(true);
  };

  const KPI_DATA = [
    { label: 'মোট গুদাম',       value: bn(total),       from: 'from-emerald-500', to: 'to-teal-600',   icon: Warehouse  },
    { label: 'মোট ধারণক্ষমতা',  value: `${bn(totalCap)} টন`, from: 'from-blue-500', to: 'to-indigo-600', icon: Package    },
    { label: 'খালি ধারণক্ষমতা', value: `${bn(totalAvail)} টন`, from: 'from-green-500', to: 'to-emerald-600', icon: Package },
    { label: 'সক্রিয় জেলা',     value: bn(districts),   from: 'from-violet-500', to: 'to-purple-600', icon: MapPin     },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HERO ══ */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-md">

          {/* Header row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm flex-shrink-0">
                <Warehouse size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">🏢 গুদাম ভাড়া</h1>
                <p className="text-xs text-gray-500">ফসল সংরক্ষণের জন্য নিরাপদ ও আধুনিক গুদাম খুঁজুন</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
              </button>
              {isRenter && (
                <Link to="/app/warehouse/bookings"
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
                  📦 আমার বুকিং
                </Link>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="জেলা, গুদামের নাম বা অবস্থান খুঁজুন..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-9 pr-4 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition" />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>
            <button onClick={() => setFilterOpen(o => !o)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                filterOpen || hasFilters
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}>
              <SlidersHorizontal size={15} /> ফিল্টার
              {hasFilters && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
            </button>
          </div>

          {/* Filter panel */}
          {filterOpen && (
            <div className="mt-3 grid gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">জেলা</label>
                <input value={district} onChange={e => setDistrict(e.target.value)} placeholder="যেমন: ঢাকা"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">ন্যূন. ভাড়া (৳)</label>
                <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="যেমন: ১০০"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">সর্বোচ্চ ভাড়া (৳)</label>
                <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="যেমন: ৫০০"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">ন্যূন. ক্ষমতা (টন)</label>
                <input type="number" value={minCap} onChange={e => setMinCap(e.target.value)} placeholder="যেমন: ১০০"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none" />
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <div onClick={() => setColdOnly(o => !o)}
                  className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition ${coldOnly ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                  {coldOnly && <span className="text-[9px] text-white font-extrabold">✓</span>}
                </div>
                <span className="text-sm font-semibold text-gray-700">❄️ শুধু কোল্ড স্টোরেজ</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <div onClick={() => setAvailOnly(o => !o)}
                  className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition ${availOnly ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                  {availOnly && <span className="text-[9px] text-white font-extrabold">✓</span>}
                </div>
                <span className="text-sm font-semibold text-gray-700">শুধু উপলব্ধ গুদাম</span>
              </label>

              <div className="flex gap-2 sm:col-span-2">
                <button onClick={resetFilters}
                  className="flex-1 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition">
                  রিসেট করুন
                </button>
                <button onClick={() => setFilterOpen(false)}
                  className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
                  ফলাফল দেখুন
                </button>
              </div>
            </div>
          )}

          {/* KPI strip */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {KPI_DATA.map(k => (
              <div key={k.label} className={`rounded-2xl bg-gradient-to-br ${k.from} ${k.to} p-3.5 shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-white/80">{k.label}</p>
                    <p className="mt-0.5 text-base font-extrabold text-white">{loading ? '…' : k.value}</p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/25 flex-shrink-0">
                    <k.icon size={13} className="text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="mx-auto max-w-7xl px-4 py-5">

        {/* Warehouse type chips */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setType('')}
            className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              !type ? 'bg-emerald-600 text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
            }`}>
            সকল ধরন
          </button>
          {WAREHOUSE_TYPES.map(t => (
            <button key={t.code} onClick={() => setType(type === t.code ? '' : t.code)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                type === t.code
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700'
              }`}>
              {t.label}
            </button>
          ))}
          {coldCount > 0 && (
            <button onClick={() => setColdOnly(o => !o)}
              className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                coldOnly
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}>
              ❄️ কোল্ড স্টোরেজ ({bn(coldCount)})
            </button>
          )}
        </div>

        {/* Result count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {loading ? 'খোঁজা হচ্ছে…' : `${bn(filtered.length)} টি গুদাম পাওয়া গেছে`}
          </p>
          {hasFilters && (
            <button onClick={resetFilters}
              className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100 transition">
              <X size={11} /> ফিল্টার মুছুন
            </button>
          )}
        </div>

        {/* 2-column layout */}
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">

          {/* ─── Main grid ─── */}
          <div>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center">
                <PackageX className="mb-4 text-gray-200" size={52} />
                <p className="font-extrabold text-gray-500">এখনও কোনো গুদাম পাওয়া যায়নি</p>
                <p className="mt-1 text-sm text-gray-400">ফিল্টার পরিবর্তন করুন অথবা পরে আবার চেষ্টা করুন</p>
                <button onClick={resetFilters}
                  className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
                  সব গুদাম দেখুন
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map(w => (
                  <WarehouseCard
                    key={w.warehouse_id || w.id}
                    warehouse={w}
                    onBook={setBookTarget}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ─── Sidebar ─── */}
          <div className="hidden lg:flex flex-col gap-4">

            {/* Popular warehouses */}
            <SidebarPopular warehouses={warehouses} />

            {/* District breakdown */}
            <SidebarDistricts warehouses={warehouses} />

            {/* Capacity by type */}
            <SidebarCapacity warehouses={warehouses} />

            {/* Feature stats */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="flex items-center gap-2 mb-3 text-sm font-extrabold text-gray-900">
                <BarChart2 size={14} className="text-blue-500" /> সুবিধা পরিসংখ্যান
              </h3>
              <div className="space-y-1.5">
                {[
                  { icon: Thermometer, label: 'কোল্ড স্টোরেজ', count: warehouses.filter(w => w.temperature_control).length, color: 'text-blue-600' },
                  { icon: Droplets,    label: 'আর্দ্রতা নিয়ন্ত্রণ', count: warehouses.filter(w => w.humidity_control).length, color: 'text-cyan-600' },
                  { icon: Shield,      label: 'নিরাপত্তা ব্যবস্থা', count: warehouses.filter(w => w.has_security).length, color: 'text-purple-600' },
                  { icon: Truck,       label: 'পরিবহন সুবিধা', count: warehouses.filter(w => w.transport_facility).length, color: 'text-orange-600' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                    <span className={`flex items-center gap-1.5 text-xs font-semibold ${s.color}`}>
                      <s.icon size={11} /> {s.label}
                    </span>
                    <span className="text-xs font-extrabold text-gray-700">{bn(s.count)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick booking CTA */}
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 text-center shadow-sm">
              <Warehouse className="mx-auto mb-2 text-emerald-600" size={26} />
              <p className="font-extrabold text-emerald-900 text-sm">আমার বুকিং</p>
              <p className="mt-1 text-[11px] text-emerald-700">আপনার বর্তমান ও পূর্ববর্তী গুদাম বুকিং দেখুন</p>
              {isRenter && (
                <Link to="/app/warehouse/bookings"
                  className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-emerald-600 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 transition">
                  বুকিং দেখুন <ChevronRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Booking modal */}
      {bookTarget && (
        <BookingModal warehouse={bookTarget} onClose={() => setBookTarget(null)} onSuccess={load} />
      )}
    </div>
  );
}
