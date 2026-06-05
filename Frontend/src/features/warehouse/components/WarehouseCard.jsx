import { Link }       from 'react-router';
import {
  MapPin, Thermometer, Droplets, BadgeCheck,
  Package, ChevronRight, Shield, Truck, Clock,
} from 'lucide-react';
import { useContext } from 'react';
import { AuthContext }    from '../../../core/auth/AuthContext';
import { PLACEHOLDER, RENTER_ROLES } from '../warehouseConstants';

/* ─── occupancy color ─────────────────────────────────────── */
function occupancyColor(pct) {
  if (pct >= 80) return { bar: 'bg-red-500',    text: 'text-red-600',    badge: 'bg-red-100 text-red-700'    };
  if (pct >= 50) return { bar: 'bg-amber-500',  text: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700'};
  return               { bar: 'bg-emerald-500', text: 'text-emerald-600',badge: 'bg-emerald-100 text-emerald-700' };
}

/* ─── progress ring (SVG) ─────────────────────────────────── */
function CapRing({ pct }) {
  const r = 18; const circ = 2 * Math.PI * r;
  const { bar } = occupancyColor(pct);
  const colorClass = bar.replace('bg-', 'stroke-');
  return (
    <svg width="44" height="44" className="-rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="#f3f4f6" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4"
        className={colorClass}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" />
    </svg>
  );
}

export default function WarehouseCard({ warehouse, onBook }) {
  const { user } = useContext(AuthContext);
  const canBook  = RENTER_ROLES.includes(user?.role_id);
  const id       = warehouse.warehouse_id || warehouse.id;
  const photo    = warehouse.photo_url || warehouse.images?.[0] || PLACEHOLDER;
  const cap      = warehouse.capacity  || warehouse.capacity_ton  || 0;
  const avail    = warehouse.available_capacity ?? warehouse.available_capacity_ton ?? cap;
  const used     = Math.max(0, cap - avail);
  const pct      = cap > 0 ? Math.round((used / cap) * 100) : 0;
  const availPct = 100 - pct;
  const colors   = occupancyColor(pct);
  const isFull   = avail <= 0;

  const features = [
    warehouse.temperature_control && { icon: Thermometer, label: 'তাপমাত্রা', color: 'text-blue-600 bg-blue-50' },
    warehouse.humidity_control    && { icon: Droplets,    label: 'আর্দ্রতা',  color: 'text-cyan-600 bg-cyan-50'  },
    warehouse.has_security        && { icon: Shield,      label: 'নিরাপত্তা', color: 'text-purple-600 bg-purple-50' },
    warehouse.transport_facility  && { icon: Truck,       label: 'পরিবহন',   color: 'text-orange-600 bg-orange-50' },
    warehouse.hour24              && { icon: Clock,       label: '২৪/৭',      color: 'text-gray-600 bg-gray-50'   },
  ].filter(Boolean);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">

      {/* ── Photo ── */}
      <div className="relative h-48 flex-shrink-0 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
        <img src={photo} alt={warehouse.title || warehouse.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = PLACEHOLDER; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Type badge — top left */}
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur-sm">
          {warehouse.warehouse_type_label || warehouse.warehouse_type}
        </div>

        {/* Verified — top right */}
        {warehouse.verified && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
            <BadgeCheck size={11} /> যাচাইকৃত
          </div>
        )}

        {/* Feature mini badges — bottom left */}
        <div className="absolute bottom-2.5 left-3 flex gap-1.5">
          {warehouse.temperature_control && (
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-extrabold text-white shadow">
              ❄️ Cold Storage
            </span>
          )}
          {warehouse.humidity_control && (
            <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-[9px] font-extrabold text-white shadow">
              💧 আর্দ্রতা
            </span>
          )}
        </div>

        {/* Availability badge — bottom right */}
        <div className={`absolute bottom-2.5 right-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow ${
          isFull ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          {isFull ? 'পূর্ণ' : 'উপলব্ধ'}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col p-4">

        {/* Name + location */}
        <h3 className="font-extrabold text-gray-900 leading-tight group-hover:text-emerald-700 transition line-clamp-1">
          {warehouse.title || warehouse.name}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={11} className="flex-shrink-0 text-gray-400" />
          {[warehouse.location, warehouse.district].filter(Boolean).join(', ')}
        </p>

        {/* Capacity ring + bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <CapRing pct={pct} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[10px] font-extrabold ${colors.text}`}>{availPct}%</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
              <span>মোট ধারণক্ষমতা</span>
              <span className="font-semibold text-gray-700">{cap} টন</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div className={`h-full rounded-full transition-all ${colors.bar}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className="text-gray-400">ব্যবহৃত: {used} টন</span>
              <span className={`font-extrabold ${colors.text}`}>খালি: {avail} টন</span>
            </div>
          </div>
        </div>

        {/* Features */}
        {features.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {features.map((f, i) => (
              <span key={i} className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${f.color}`}>
                <f.icon size={10} /> {f.label}
              </span>
            ))}
          </div>
        )}

        {/* Price + actions */}
        <div className="mt-auto pt-3">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] text-gray-400">দৈনিক ভাড়া</p>
              <p className="text-lg font-extrabold text-emerald-600">
                ৳{Number(warehouse.price_per_day ?? warehouse.daily_rate ?? 0).toLocaleString('bn-BD')}
                <span className="text-[10px] font-normal text-gray-400 ml-0.5">/দিন</span>
              </p>
              {(warehouse.price_per_month ?? warehouse.monthly_rate) && (
                <p className="text-[10px] text-gray-400">
                  মাসিক: ৳{Number(warehouse.price_per_month ?? warehouse.monthly_rate).toLocaleString('bn-BD')}
                </p>
              )}
            </div>
            <Package size={24} className={`flex-shrink-0 ${colors.text} opacity-30`} />
          </div>

          <div className="flex gap-2">
            {canBook && (
              <button type="button" onClick={() => onBook?.(warehouse)} disabled={isFull}
                className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-extrabold transition shadow-sm active:scale-95 ${
                  isFull
                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}>
                📦 বুক করুন
              </button>
            )}
            <Link to={`/app/warehouse/${id}`}
              className="flex items-center justify-center gap-1 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition">
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
