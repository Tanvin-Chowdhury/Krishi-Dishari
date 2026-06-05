import { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  ArrowLeft, MapPin, Thermometer, Droplets,
  Shield, Truck, Clock, Package, BadgeCheck,
  Calendar, Phone, ChevronRight,
} from 'lucide-react';
import { warehouseApi }  from '../../shared/services/warehouseApi';
import BookingModal      from './components/BookingModal';
import { PLACEHOLDER, RENTER_ROLES } from './warehouseConstants';
import { AuthContext }   from '../../core/auth/AuthContext';

function bn(n) { return Number(n || 0).toLocaleString('bn-BD'); }

/* ─── occupancy ring ──────────────────────────────────────── */
function OccupancyRing({ pct }) {
  const r = 52; const circ = 2 * Math.PI * r;
  const used = 100 - pct;
  const color = pct < 30 ? '#ef4444' : pct < 60 ? '#f59e0b' : '#10b981';
  return (
    <svg width="128" height="128" className="-rotate-90 drop-shadow">
      <circle cx="64" cy="64" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
      <circle cx="64" cy="64" r={r} fill="none" strokeWidth="10"
        stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={circ * (used / 100)}
        strokeLinecap="round" />
    </svg>
  );
}

/* ─── info tile ───────────────────────────────────────────── */
function InfoTile({ label, value, icon: Icon, color = 'text-gray-700' }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-3.5">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={13} className="text-gray-400" />}
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      </div>
      <p className={`font-extrabold text-base ${color}`}>{value}</p>
    </div>
  );
}

export default function WarehouseDetail() {
  const { id }     = useParams();
  const { user }   = useContext(AuthContext);
  const [warehouse, setWarehouse] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [bookOpen,  setBookOpen]  = useState(false);
  const [imgIdx,    setImgIdx]    = useState(0);

  useEffect(() => {
    warehouseApi.getWarehouse(id)
      .then(r => setWarehouse(r.warehouse))
      .catch(() => setWarehouse(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-4 animate-pulse">
        <div className="h-72 rounded-2xl bg-gray-100" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl bg-gray-100" />)}
        </div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Package className="mb-4 text-gray-200" size={52} />
        <p className="font-extrabold text-gray-500">গুদাম পাওয়া যায়নি</p>
        <Link to="/app/warehouse" className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 transition">
          ফিরে যান
        </Link>
      </div>
    );
  }

  const images  = (warehouse.images?.length ? warehouse.images : [warehouse.photo_url || PLACEHOLDER]).filter(Boolean);
  const cap     = warehouse.capacity  || warehouse.capacity_ton  || 0;
  const avail   = warehouse.available_capacity ?? warehouse.available_capacity_ton ?? cap;
  const used    = Math.max(0, cap - avail);
  const availPct = cap > 0 ? Math.round((avail / cap) * 100) : 0;
  const usedPct  = 100 - availPct;

  const features = [
    warehouse.temperature_control && { icon: Thermometer, label: 'তাপমাত্রা নিয়ন্ত্রণ', color: 'text-blue-600 bg-blue-50'   },
    warehouse.humidity_control    && { icon: Droplets,    label: 'আর্দ্রতা নিয়ন্ত্রণ', color: 'text-cyan-600 bg-cyan-50'     },
    warehouse.has_security        && { icon: Shield,      label: 'নিরাপত্তা ব্যবস্থা',  color: 'text-purple-600 bg-purple-50' },
    warehouse.transport_facility  && { icon: Truck,       label: 'পরিবহন সুবিধা',      color: 'text-orange-600 bg-orange-50' },
    warehouse.hour24              && { icon: Clock,       label: '২৪/৭ মনিটরিং',       color: 'text-gray-600 bg-gray-100'    },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* Back link */}
        <Link to="/app/warehouse"
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-emerald-300 hover:text-emerald-700 shadow-sm transition mb-5">
          <ArrowLeft size={14} /> গুদাম বাজার
        </Link>

        {/* ── Image gallery ── */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md mb-5">
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img src={images[imgIdx]} alt=""
              className="w-full h-full object-cover"
              onError={e => { e.target.src = PLACEHOLDER; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Badges */}
            <div className="absolute left-4 top-4 flex gap-2">
              <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-extrabold text-white backdrop-blur-sm">
                {warehouse.warehouse_type_label}
              </span>
              {warehouse.verified && (
                <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
                  <BadgeCheck size={12} /> যাচাইকৃত
                </span>
              )}
            </div>

            {/* Availability */}
            <div className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-extrabold shadow ${
              avail > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {avail > 0 ? '✓ উপলব্ধ' : '✗ পূর্ণ'}
            </div>

            {/* Title overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <h1 className="text-2xl font-extrabold text-white drop-shadow">
                {warehouse.title || warehouse.name}
              </h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
                <MapPin size={13} /> {[warehouse.location, warehouse.district].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3">
              {images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)}
                  className={`flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    i === imgIdx ? 'border-emerald-500' : 'border-transparent'
                  }`}>
                  <img src={img} alt="" className="h-14 w-20 object-cover"
                    onError={e => { e.target.src = PLACEHOLDER; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Main 2-col ── */}
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">

          {/* Left: Details */}
          <div className="space-y-5">

            {/* Description */}
            {warehouse.description && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-2 font-extrabold text-gray-900">বিবরণ</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{warehouse.description}</p>
              </div>
            )}

            {/* Key info grid */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-extrabold text-gray-900">গুদামের তথ্য</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <InfoTile label="মোট ক্ষমতা" value={`${bn(cap)} টন`} icon={Package} color="text-gray-900" />
                <InfoTile label="উপলব্ধ" value={`${bn(avail)} টন`} icon={Package} color="text-emerald-600" />
                <InfoTile label="ব্যবহৃত" value={`${bn(used)} টন`} icon={Package} color="text-amber-600" />
                <InfoTile label="দৈনিক ভাড়া" value={`৳${bn(warehouse.price_per_day ?? warehouse.daily_rate)}`} icon={Calendar} color="text-emerald-700" />
                {(warehouse.price_per_month ?? warehouse.monthly_rate) && (
                  <InfoTile label="মাসিক ভাড়া" value={`৳${bn(warehouse.price_per_month ?? warehouse.monthly_rate)}`} icon={Calendar} color="text-blue-700" />
                )}
                {warehouse.contact_phone && (
                  <InfoTile label="যোগাযোগ" value={warehouse.contact_phone} icon={Phone} color="text-gray-700" />
                )}
              </div>
            </div>

            {/* Occupancy visual */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-extrabold text-gray-900">ধারণক্ষমতা বিভাজন</h2>
              <div className="flex items-center gap-6">
                <div className="relative flex-shrink-0">
                  <OccupancyRing pct={availPct} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-gray-900">{availPct}%</span>
                    <span className="text-[10px] text-gray-400">খালি</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="font-semibold">🟢 খালি স্থান</span>
                      <span>{bn(avail)} টন</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${availPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span className="font-semibold">🟠 ব্যবহৃত স্থান</span>
                      <span>{bn(used)} টন</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${usedPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 font-extrabold text-gray-900">সুবিধাসমূহ</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {features.map((f, i) => (
                    <div key={i} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${f.color}`}>
                      <f.icon size={15} /> {f.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking card */}
          <div className="space-y-4">
            <div className="sticky top-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-md">
              <h2 className="font-extrabold text-gray-900 text-lg mb-1">ভাড়ার হার</h2>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-end justify-between rounded-xl bg-emerald-50 px-4 py-3">
                  <div>
                    <p className="text-[10px] text-emerald-600 font-semibold">দৈনিক ভাড়া</p>
                    <p className="text-2xl font-extrabold text-emerald-700">
                      ৳{bn(warehouse.price_per_day ?? warehouse.daily_rate)}
                    </p>
                  </div>
                  <span className="text-xs text-emerald-500">/দিন</span>
                </div>
                {(warehouse.price_per_month ?? warehouse.monthly_rate) && (
                  <div className="flex items-end justify-between rounded-xl bg-blue-50 px-4 py-3">
                    <div>
                      <p className="text-[10px] text-blue-600 font-semibold">মাসিক ভাড়া</p>
                      <p className="text-2xl font-extrabold text-blue-700">
                        ৳{bn(warehouse.price_per_month ?? warehouse.monthly_rate)}
                      </p>
                    </div>
                    <span className="text-xs text-blue-500">/মাস</span>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>মোট ক্ষমতা</span><span className="font-bold">{bn(cap)} টন</span>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-600">
                  <span>এখন উপলব্ধ</span>
                  <span className={`font-extrabold ${avail > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {bn(avail)} টন
                  </span>
                </div>
              </div>

              {RENTER_ROLES.includes(user?.role_id) ? (
                <button type="button" onClick={() => setBookOpen(true)} disabled={avail <= 0}
                  className="mt-4 w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm transition">
                  📦 বুক করুন
                </button>
              ) : (
                <p className="mt-4 text-center text-xs text-gray-400">বুকিং করতে লগইন করুন</p>
              )}

              <Link to="/app/warehouse/bookings"
                className="mt-2 flex items-center justify-center gap-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition">
                আমার বুকিং দেখুন <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {bookOpen && (
        <BookingModal warehouse={warehouse} onClose={() => setBookOpen(false)} onSuccess={() => setBookOpen(false)} />
      )}
    </div>
  );
}
