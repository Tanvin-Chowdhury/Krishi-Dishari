import { useCallback, useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router';
import {
  CloudSun, Search, MapPin, RefreshCw, Droplets, Wind,
  ThermometerSun, CloudRain, ArrowLeft, Sprout, Leaf,
  Sun, Sunset, Eye, AlertTriangle, CheckCircle2, XCircle,
  ChevronDown, Thermometer, BarChart2, Activity, Shield,
  Bug, Wheat, Clock, Zap,
} from 'lucide-react';
import { weatherApi } from '../../shared/services/weatherApi';
import {
  formatDayLabel, weatherEmoji, getSavedLocation,
  saveLocation, SUGGESTED_LOCATIONS,
} from './weatherUtils';

/* ─── helpers ─────────────────────────────────────────────── */
const fmt1 = (n) => n != null ? Number(n).toFixed(1) : '—';
const pct  = (n) => n != null ? `${Math.round(n)}%` : '—';

/* ─── derived agri intelligence ─────────────────────────────
   All computed client-side from the raw weather data          */
function deriveFarmingScore(cur) {
  if (!cur) return 50;
  let score = 70;
  const temp = parseFloat(cur.temperature) || 25;
  const hum  = parseFloat(cur.humidity)    || 60;
  const rain = parseFloat(cur.rainChance)  || 0;
  const wind = parseFloat(cur.windSpeed)   || 10;
  if (temp >= 20 && temp <= 30) score += 15;
  else if (temp < 10 || temp > 38) score -= 20;
  else score -= 5;
  if (hum >= 50 && hum <= 70) score += 8;
  else if (hum > 88) score -= 12;
  if (rain > 70) score -= 18;
  else if (rain > 40) score -= 6;
  if (wind > 30) score -= 10;
  else if (wind > 20) score -= 3;
  return Math.max(10, Math.min(100, Math.round(score)));
}

function deriveFieldOps(cur) {
  const temp  = parseFloat(cur?.temperature) || 25;
  const rain  = parseFloat(cur?.rainChance)  || 0;
  const wind  = parseFloat(cur?.windSpeed)   || 10;
  const hum   = parseFloat(cur?.humidity)    || 60;
  return {
    irrigation:   rain < 30 && temp > 15,
    fertilizer:   rain < 20 && wind < 20,
    harvest:      rain < 15 && temp >= 18 && temp <= 35,
    pesticide:    rain < 10 && wind < 15 && hum < 80,
    planting:     rain < 40 && temp >= 18 && temp <= 32,
    spraying:     rain < 10 && wind < 12,
  };
}

function deriveDiseaseRisk(cur) {
  const temp = parseFloat(cur?.temperature) || 25;
  const hum  = parseFloat(cur?.humidity)    || 60;
  const rain = parseFloat(cur?.rainChance)  || 0;
  const blastScore    = (temp > 25 ? 40 : 0) + (hum > 80 ? 40 : hum > 70 ? 20 : 0) + (rain > 50 ? 20 : 0);
  const blightScore   = (temp > 18 && temp < 28 ? 30 : 0) + (hum > 75 ? 40 : 0) + (rain > 40 ? 30 : 0);
  const leafSpotScore = (hum > 70 ? 40 : 0) + (rain > 30 ? 30 : 0) + (temp > 22 ? 30 : 0);
  const lvl = (s) => s >= 70 ? 'HIGH' : s >= 40 ? 'MEDIUM' : 'LOW';
  const clr = (s) => s >= 70 ? { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500' }
                   : s >= 40 ? { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-400' }
                   :           { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-400' };
  return [
    { label: 'ব্লাস্ট রোগ',     score: blastScore,    level: lvl(blastScore),    ...clr(blastScore)    },
    { label: 'লেট ব্লাইট',      score: blightScore,   level: lvl(blightScore),   ...clr(blightScore)   },
    { label: 'লিফ স্পট',       score: leafSpotScore, level: lvl(leafSpotScore), ...clr(leafSpotScore) },
  ];
}

const CROP_DB = {
  rice:     { icon: '🌾', name: 'ধান',    optTempMin: 20, optTempMax: 30, humMax: 80, rainMax: 50 },
  wheat:    { icon: '🌿', name: 'গম',     optTempMin: 15, optTempMax: 25, humMax: 70, rainMax: 40 },
  tomato:   { icon: '🍅', name: 'টমেটো',  optTempMin: 18, optTempMax: 28, humMax: 70, rainMax: 30 },
  potato:   { icon: '🥔', name: 'আলু',    optTempMin: 15, optTempMax: 25, humMax: 75, rainMax: 40 },
  eggplant: { icon: '🍆', name: 'বেগুন',  optTempMin: 22, optTempMax: 32, humMax: 75, rainMax: 35 },
  chili:    { icon: '🌶', name: 'মরিচ',   optTempMin: 20, optTempMax: 30, humMax: 70, rainMax: 30 },
};

function deriveCropInsight(crop, cur) {
  const c   = CROP_DB[crop];
  const temp = parseFloat(cur?.temperature) || 25;
  const hum  = parseFloat(cur?.humidity)    || 60;
  const rain = parseFloat(cur?.rainChance)  || 0;
  const tips = [];
  if (temp >= c.optTempMin && temp <= c.optTempMax)
    tips.push({ good: true,  text: `তাপমাত্রা ${c.name} চাষের জন্য উপযুক্ত (${temp}°C)` });
  else if (temp < c.optTempMin)
    tips.push({ good: false, text: `তাপমাত্রা কম — ${c.name}র বৃদ্ধি ধীর হতে পারে` });
  else
    tips.push({ good: false, text: `তাপমাত্রা বেশি — ${c.name}র জন্য সতর্ক থাকুন` });
  if (hum > c.humMax)
    tips.push({ good: false, text: `উচ্চ আর্দ্রতা (${hum}%) — ছত্রাক রোগের ঝুঁকি` });
  else
    tips.push({ good: true,  text: `আর্দ্রতা স্বাভাবিক সীমায় (${hum}%)` });
  if (rain > c.rainMax)
    tips.push({ good: false, text: `বৃষ্টির সম্ভাবনা বেশি — মাঠের কাজ সীমিত করুন` });
  else if (rain < 15)
    tips.push({ good: true,  text: 'আজ সেচ দেওয়ার উপযুক্ত সময়' });
  return tips;
}

function bestFarmingWindow(cur) {
  const rain = parseFloat(cur?.rainChance) || 0;
  const temp = parseFloat(cur?.temperature) || 25;
  if (rain > 60) return { window: '—', note: 'আজ মাঠের কাজের পরিস্থিতি অনুকূল নয়', good: false };
  if (temp >= 18 && temp <= 30 && rain < 30)
    return { window: '৬:০০ AM – ১০:০০ AM', note: 'সেচ ও মাঠের কাজের সর্বোত্তম সময়', good: true };
  return { window: '৪:০০ PM – ৬:০০ PM', note: 'বিকেলে কাজ করুন, সকালে বৃষ্টির সম্ভাবনা', good: true };
}

/* ─── Mini SVG temp chart ─────────────────────────────────── */
function TempChart({ forecast }) {
  if (!forecast?.length) return null;
  const max = Math.max(...forecast.map(d => d.maxTemp));
  const min = Math.min(...forecast.map(d => d.minTemp));
  const range = max - min || 1;
  const W = 100, H = 50, pad = 4;
  const xStep = (W - pad * 2) / (forecast.length - 1);
  const yOf = (t) => pad + ((max - t) / range) * (H - pad * 2);
  const maxPts = forecast.map((d, i) => [pad + i * xStep, yOf(d.maxTemp)]);
  const minPts = forecast.map((d, i) => [pad + i * xStep, yOf(d.minTemp)]);
  const toPath = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16">
      <defs>
        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${toPath(maxPts)} L ${maxPts[maxPts.length-1][0]} ${H} L ${maxPts[0][0]} ${H} Z`}
        fill="url(#tempGrad)" />
      <path d={toPath(maxPts)} fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={toPath(minPts)} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" />
    </svg>
  );
}

/* ─── Skeleton ────────────────────────────────────────────── */
function Sk({ cls = '' }) { return <div className={`animate-pulse rounded-2xl bg-sky-50 ${cls}`} />; }
function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Sk cls="h-48" />
      <div className="grid grid-cols-3 gap-4">
        <Sk cls="h-64" /><Sk cls="h-64" /><Sk cls="h-64" />
      </div>
    </div>
  );
}

/* ─── Score ring ──────────────────────────────────────────── */
function ScoreRing({ score }) {
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="88" height="88" viewBox="0 0 88 88">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round" strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 44 44)" strokeDashoffset="0"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
      <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
        fontSize="16" fontWeight="900" fill={color}>{score}</text>
    </svg>
  );
}

/* ─── Alert banner ────────────────────────────────────────── */
function AlertBanner({ cur, forecast }) {
  const rain  = parseFloat(cur?.rainChance)  || 0;
  const temp  = parseFloat(cur?.temperature) || 25;
  const wind  = parseFloat(cur?.windSpeed)   || 10;
  const alerts = [];
  if (rain > 70) alerts.push({ text: 'ভারী বৃষ্টির সম্ভাবনা', color: 'bg-blue-600', border: 'border-blue-300' });
  if (temp > 38) alerts.push({ text: 'অতিরিক্ত তাপমাত্রা সতর্কতা', color: 'bg-red-600', border: 'border-red-300' });
  if (temp < 10) alerts.push({ text: 'শৈত্যপ্রবাহের সম্ভাবনা', color: 'bg-indigo-600', border: 'border-indigo-300' });
  if (wind > 40) alerts.push({ text: 'ঝড়ো হাওয়ার সতর্কতা', color: 'bg-amber-600', border: 'border-amber-300' });
  if (forecast?.some(d => d.rainChance > 80))
    alerts.push({ text: 'সপ্তাহে ভারী বৃষ্টির পূর্বাভাস', color: 'bg-sky-700', border: 'border-sky-300' });
  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} className={`flex items-center gap-3 rounded-2xl border ${a.border} ${a.color} px-4 py-3`}>
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-white" />
          <span className="text-sm font-bold text-white">⚠ {a.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Stat pill ───────────────────────────────────────────── */
function StatPill({ icon: Icon, label, value, iconCls }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/50 bg-white/40 px-3 py-2.5 text-center backdrop-blur-sm">
      <Icon className={`h-4 w-4 ${iconCls}`} />
      <p className="text-lg font-extrabold text-slate-900 leading-tight">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

/* ─── Field operation row ─────────────────────────────────── */
function OpRow({ label, ok, icon }) {
  return (
    <div className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm
      ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-100 bg-red-50/60'}`}>
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className={`font-medium ${ok ? 'text-emerald-800' : 'text-red-700'}`}>{label}</span>
      </div>
      {ok
        ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        : <XCircle className="h-4 w-4 text-red-400" />}
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────── */
export default function WeatherPage() {
  const [locationInput, setLocationInput] = useState(() => getSavedLocation());
  const [activeLocation, setActiveLocation] = useState(() => getSavedLocation());
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCrop, setCrop]       = useState('rice');

  const load = useCallback(async (loc = activeLocation) => {
    setLoading(true); setError('');
    try {
      const res = await weatherApi.getWeather({ location: loc || undefined, notify: 'true' });
      setData(res);
      if (loc) saveLocation(loc);
    } catch (e) {
      setError(e.message || 'আবহাওয়া লোড হয়নি');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [activeLocation]);

  useEffect(() => { load(activeLocation); }, [activeLocation, load]);

  useEffect(() => {
    if (!locationInput.trim() || locationInput.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(() => {
      weatherApi.searchLocations(locationInput.trim())
        .then((res) => setSuggestions(res.locations || []))
        .catch(() => setSuggestions([]));
    }, 350);
    return () => clearTimeout(t);
  }, [locationInput]);

  const onSearch = (e) => { e.preventDefault(); setActiveLocation(locationInput.trim()); };
  const pickLocation = (name) => { setLocationInput(name); setActiveLocation(name); setSuggestions([]); };

  const current  = data?.current;
  const forecast = data?.forecast || [];
  const advice   = data?.advice   || [];

  const farmScore  = useMemo(() => deriveFarmingScore(current),           [current]);
  const fieldOps   = useMemo(() => deriveFieldOps(current),               [current]);
  const diseases   = useMemo(() => deriveDiseaseRisk(current),            [current]);
  const cropTips   = useMemo(() => deriveCropInsight(selectedCrop, current), [selectedCrop, current]);
  const bestWindow = useMemo(() => bestFarmingWindow(current),             [current]);
  const scoreLabel = farmScore >= 75 ? 'চমৎকার' : farmScore >= 55 ? 'মোটামুটি' : 'প্রতিকূল';
  const scoreClr   = farmScore >= 75 ? 'text-emerald-600' : farmScore >= 55 ? 'text-amber-600' : 'text-red-500';

  /* sky condition class for hero */
  const rain = parseFloat(current?.rainChance) || 0;
  const heroGrad = rain > 60
    ? 'from-slate-700 via-slate-600 to-blue-800'
    : rain > 30
    ? 'from-slate-500 via-sky-600 to-blue-700'
    : 'from-sky-400 via-sky-500 to-blue-600';

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 space-y-5">
      <Link to="/app/home"
        className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline">
        <ArrowLeft size={16} /> ড্যাশবোর্ড
      </Link>

      {/* ══════════ SEARCH BAR ══════════ */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={onSearch} className="relative flex flex-1 gap-2">
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="search" value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
              placeholder="অবস্থান খুঁজুন (যেমন: ঢাকা, রাজশাহী)"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200" />
            {suggestions.length > 0 && (
              <ul className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                {suggestions.map(s => (
                  <li key={s.label || s.name}>
                    <button type="button" onClick={() => pickLocation(s.name)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-sky-50 flex items-center gap-2">
                      <MapPin size={12} className="text-slate-400" /> {s.label || s.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="submit"
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-700 transition shadow-sm">
            <Search size={16} /> খুঁজুন
          </button>
          <button type="button" onClick={() => load(activeLocation)} disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_LOCATIONS.map(loc => (
            <button key={loc} type="button" onClick={() => pickLocation(loc)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition
                ${activeLocation === loc ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sky-50'}`}>
              {loc}
            </button>
          ))}
        </div>
      </div>

      {loading && !data && <PageSkeleton />}

      {error && !data && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-400 mb-3" />
          <p className="font-bold text-red-700 mb-3">{error}</p>
          <button onClick={() => load(activeLocation)}
            className="rounded-xl bg-red-500 px-5 py-2 text-sm font-bold text-white hover:bg-red-600 transition">
            আবার চেষ্টা করুন
          </button>
        </div>
      )}

      {!loading && data && (
        <div className="space-y-5">

          {/* ══════════ ALERTS ══════════ */}
          <AlertBanner cur={current} forecast={forecast} />

          {/* ══════════ HERO CURRENT WEATHER ══════════ */}
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${heroGrad} p-5 shadow-xl text-white`}>
            {/* cloud pattern bg */}
            <div className="pointer-events-none absolute inset-0 opacity-10 text-[120px] flex items-center justify-end pr-6 select-none">
              {weatherEmoji(current?.condition, rain)}
            </div>
            <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Main temp */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 text-white/70 text-sm mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="font-semibold">{data.location}</span>
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <span className="text-6xl font-black leading-none">{current?.temperature}°</span>
                    <span className="ml-2 text-xl text-white/70">C</span>
                  </div>
                  <div className="pb-1">
                    <p className="text-lg font-bold">{current?.condition}</p>
                    {current?.feelsLike && (
                      <p className="text-sm text-white/70">অনুভূত: {current.feelsLike}°C</p>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                  <Clock className="h-3.5 w-3.5" />
                  সর্বশেষ আপডেট:{' '}
                  {data.updatedAt
                    ? new Date(data.updatedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
                    : new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:col-span-1 lg:col-span-2">
                <StatPill icon={Droplets}       label="আর্দ্রতা"   value={pct(current?.humidity)}          iconCls="text-sky-300"    />
                <StatPill icon={Wind}            label="বাতাস"     value={`${current?.windSpeed||0}km/h`}  iconCls="text-teal-300"   />
                <StatPill icon={CloudRain}       label="বৃষ্টি"    value={pct(current?.rainChance)}         iconCls="text-blue-300"   />
                <StatPill icon={ThermometerSun}  label="UV ইনডেক্স" value={current?.uvIndex ?? '৩'}       iconCls="text-yellow-300" />
                <StatPill icon={Eye}             label="দৃশ্যমানতা" value={current?.visibility ?? '১০km'} iconCls="text-white/70"   />
                <StatPill icon={Sun}             label="আবহাওয়া"   value={weatherEmoji(current?.condition, rain)} iconCls="text-amber-300" />
              </div>
            </div>
            {/* sunrise/sunset if available */}
            {(current?.sunrise || current?.sunset) && (
              <div className="relative mt-3 flex gap-4 text-sm text-white/70">
                {current?.sunrise && <span className="flex items-center gap-1"><Sun className="h-3.5 w-3.5 text-yellow-300" /> {current.sunrise}</span>}
                {current?.sunset  && <span className="flex items-center gap-1"><Sunset className="h-3.5 w-3.5 text-orange-300" /> {current.sunset}</span>}
              </div>
            )}
            {data.source && (
              <p className="relative mt-2 text-[10px] text-white/40">
                উৎস: {data.source === 'fallback' ? 'অস্থায়ী ডেটা' : 'Open-Meteo'}
              </p>
            )}
          </div>

          {/* ══════════ 3-COLUMN GRID ══════════ */}
          <div className="grid gap-5 lg:grid-cols-[260px_1fr_260px]">

            {/* ─── LEFT COL ─── */}
            <div className="space-y-4">

              {/* Farming Score */}
              <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="h-4 w-4 text-emerald-500" />
                  <h3 className="font-bold text-gray-800 text-sm">কৃষি অবস্থার স্কোর</h3>
                </div>
                <div className="flex items-center gap-4">
                  <ScoreRing score={farmScore} />
                  <div>
                    <p className={`text-2xl font-extrabold ${scoreClr}`}>{farmScore}/১০০</p>
                    <p className={`text-sm font-bold ${scoreClr}`}>{scoreLabel}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">উপযুক্ত কার্যক্রম</p>
                  {fieldOps.irrigation && <div className="flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> সেচ দেওয়া</div>}
                  {fieldOps.fertilizer && <div className="flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> সার প্রয়োগ</div>}
                  {fieldOps.harvest    && <div className="flex items-center gap-2 text-xs text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> ফসল কাটা</div>}
                  {!fieldOps.pesticide && <div className="flex items-center gap-2 text-xs text-red-600"><XCircle className="h-3.5 w-3.5 text-red-400" /> কীটনাশক স্প্রে নয়</div>}
                  {!fieldOps.spraying  && <div className="flex items-center gap-2 text-xs text-red-600"><XCircle className="h-3.5 w-3.5 text-red-400" /> স্প্রে করবেন না</div>}
                </div>
              </div>

              {/* Best Farming Time */}
              <div className={`rounded-2xl border p-4 shadow-sm ${bestWindow.good ? 'border-emerald-200 bg-emerald-50' : 'border-red-100 bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-bold text-gray-800 text-sm">আজকের সেরা সময়</h3>
                </div>
                <p className="text-lg font-extrabold text-emerald-700">🌱 {bestWindow.window}</p>
                <p className="mt-1 text-xs text-gray-600">{bestWindow.note}</p>
              </div>

              {/* Field Operations */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Sprout className="h-4 w-4 text-emerald-500" />
                  <h3 className="font-bold text-gray-800 text-sm">মাঠের কার্যক্রম</h3>
                </div>
                <div className="space-y-2">
                  <OpRow label="সেচ"          ok={fieldOps.irrigation} icon="💧" />
                  <OpRow label="সার প্রয়োগ"  ok={fieldOps.fertilizer} icon="🌿" />
                  <OpRow label="ফসল কাটা"    ok={fieldOps.harvest}    icon="🌾" />
                  <OpRow label="কীটনাশক"     ok={fieldOps.pesticide}  icon="🧪" />
                  <OpRow label="চারা লাগানো"  ok={fieldOps.planting}   icon="🌱" />
                </div>
              </div>

              {/* Disease Risk */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-violet-500" />
                  <h3 className="font-bold text-gray-800 text-sm">রোগের ঝুঁকি বিশ্লেষণ</h3>
                </div>
                <div className="space-y-3">
                  {diseases.map(d => (
                    <div key={d.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">{d.label}</span>
                        <span className={`text-[10px] font-extrabold rounded-full px-2 py-0.5 ${d.bg} ${d.text}`}>
                          {d.level === 'HIGH' ? 'উচ্চ' : d.level === 'MEDIUM' ? 'মধ্যম' : 'কম'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100">
                        <div className={`h-1.5 rounded-full ${d.bar} transition-all duration-700`}
                          style={{ width: `${Math.min(100, d.score)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── CENTER COL ─── */}
            <div className="space-y-4">

              {/* Agricultural Advice */}
              {advice.length > 0 && (
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sprout className="h-4 w-4 text-emerald-600" />
                    <h3 className="font-bold text-emerald-900 text-sm">আজকের কৃষি পরামর্শ</h3>
                  </div>
                  <div className="space-y-2">
                    {advice.map((line, i) => (
                      <div key={i} className="flex gap-2.5 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-emerald-100">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                          {i + 1}
                        </span>
                        <p className="text-sm text-emerald-900 leading-relaxed">{line}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7-day forecast */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-sky-500" />
                    <h3 className="font-bold text-gray-800 text-sm">৭ দিনের পূর্বাভাস</h3>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-orange-400 inline-block" /> সর্বোচ্চ</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-blue-300 inline-block border-dashed border border-blue-400" /> সর্বনিম্ন</span>
                  </div>
                </div>

                {/* Temp chart */}
                <div className="mb-4 rounded-xl bg-gray-50 px-3 pt-2 pb-1">
                  <TempChart forecast={forecast} />
                  <div className="flex justify-between px-1 pb-1">
                    {forecast.map(d => (
                      <span key={d.date} className="text-[9px] text-gray-400 text-center flex-1">{formatDayLabel(d.date)}</span>
                    ))}
                  </div>
                </div>

                {/* Day cards */}
                <div className="grid grid-cols-7 gap-1.5">
                  {forecast.map((day, i) => {
                    const isToday = i === 0;
                    return (
                      <div key={day.date}
                        className={`flex flex-col items-center rounded-xl border p-2 text-center transition
                          ${isToday ? 'border-sky-300 bg-sky-50 shadow-sm' : 'border-gray-100 hover:border-sky-200 hover:bg-sky-50/50'}`}>
                        <span className={`text-[10px] font-bold ${isToday ? 'text-sky-700' : 'text-gray-500'}`}>
                          {formatDayLabel(day.date)}
                        </span>
                        <span className="text-xl my-1.5">{weatherEmoji(day.condition, day.rainChance)}</span>
                        <span className="text-xs font-extrabold text-orange-500">{day.maxTemp}°</span>
                        <span className="text-[10px] text-blue-400">{day.minTemp}°</span>
                        <div className="mt-1.5 flex items-center gap-0.5">
                          <CloudRain className="h-2.5 w-2.5 text-blue-400" />
                          <span className="text-[9px] font-bold text-blue-600">{day.rainChance}%</span>
                        </div>
                        {day.humidity != null && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <Droplets className="h-2.5 w-2.5 text-sky-400" />
                            <span className="text-[9px] text-sky-600">{day.humidity}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rain probability bars */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CloudRain className="h-4 w-4 text-blue-500" />
                  <h3 className="font-bold text-gray-800 text-sm">বৃষ্টির পূর্বাভাস</h3>
                </div>
                <div className="space-y-2.5">
                  {forecast.map(day => {
                    const p = Math.min(100, Math.max(0, day.rainChance || 0));
                    const barCls = p > 60 ? 'from-blue-500 to-indigo-600' : p > 30 ? 'from-sky-400 to-blue-500' : 'from-sky-300 to-sky-400';
                    return (
                      <div key={day.date} className="flex items-center gap-3">
                        <span className="w-14 text-xs font-semibold text-gray-500 text-right">{formatDayLabel(day.date)}</span>
                        <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${barCls} transition-all duration-700`}
                            style={{ width: `${p}%` }} />
                        </div>
                        <span className="w-8 text-xs font-bold text-sky-700 text-right">{p}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Humidity trend */}
              {forecast.some(d => d.humidity != null) && (
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Droplets className="h-4 w-4 text-cyan-500" />
                    <h3 className="font-bold text-gray-800 text-sm">আর্দ্রতার প্রবণতা</h3>
                  </div>
                  <div className="flex items-end gap-2 h-16">
                    {forecast.map((day, i) => {
                      const h = day.humidity || 60;
                      return (
                        <div key={i} className="group relative flex flex-1 flex-col items-center gap-1">
                          <div className="w-full rounded-t-lg bg-cyan-300 hover:bg-cyan-400 transition-all"
                            style={{ height: `${(h / 100) * 100}%` }} />
                          <span className="text-[9px] text-gray-400">{formatDayLabel(day.date)}</span>
                          <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-lg bg-gray-800 px-1.5 py-0.5 text-[9px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap">
                            {h}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ─── RIGHT COL ─── */}
            <div className="space-y-4">

              {/* Crop selector */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Wheat className="h-4 w-4 text-amber-500" />
                  <h3 className="font-bold text-gray-800 text-sm">ফসল-ভিত্তিক পূর্বাভাস</h3>
                </div>
                <div className="relative">
                  <select value={selectedCrop} onChange={e => setCrop(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-3 pr-8 text-sm font-semibold text-gray-700 focus:border-emerald-400 focus:outline-none cursor-pointer">
                    {Object.entries(CROP_DB).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <div className="mt-3 space-y-2">
                  {cropTips.map((t, i) => (
                    <div key={i} className={`flex items-start gap-2 rounded-xl border p-2.5 text-xs
                      ${t.good ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
                      {t.good
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                      <span>{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pest risk */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Bug className="h-4 w-4 text-rose-500" />
                  <h3 className="font-bold text-gray-800 text-sm">কীটপতঙ্গের ঝুঁকি</h3>
                </div>
                {(() => {
                  const hum  = parseFloat(current?.humidity) || 60;
                  const temp = parseFloat(current?.temperature) || 25;
                  const pestRisk = hum > 75 && temp > 22 ? 'উচ্চ' : hum > 60 ? 'মধ্যম' : 'কম';
                  const pestClr  = hum > 75 && temp > 22 ? 'text-red-600 bg-red-50 border-red-200'
                                 : hum > 60 ? 'text-amber-600 bg-amber-50 border-amber-200'
                                 : 'text-emerald-600 bg-emerald-50 border-emerald-200';
                  return (
                    <div className={`rounded-xl border p-3 ${pestClr}`}>
                      <p className="text-sm font-extrabold">{pestRisk} ঝুঁকি</p>
                      <p className="text-xs mt-1 opacity-80">
                        {hum > 75 ? 'উচ্চ আর্দ্রতায় পোকামাকড় সক্রিয় থাকে' : 'বর্তমানে কীটপতঙ্গের ঝুঁকি কম'}
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Irrigation recommendation */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Droplets className="h-4 w-4 text-sky-600" />
                  <h3 className="font-bold text-sky-900 text-sm">সেচ পরামর্শ</h3>
                </div>
                {(() => {
                  const r = parseFloat(current?.rainChance) || 0;
                  const rec = r > 60 ? { icon: '🚫', text: 'আজ সেচ দেওয়ার প্রয়োজন নেই — বৃষ্টির সম্ভাবনা আছে', clr: 'text-blue-700' }
                            : r > 30 ? { icon: '⚠️', text: 'হালকা সেচ দিন — বৃষ্টি হতে পারে', clr: 'text-amber-700' }
                            :          { icon: '✅', text: 'আজ সেচ দেওয়ার উপযুক্ত সময়। সকাল ৬-১০টার মধ্যে দিন।', clr: 'text-emerald-700' };
                  return <div className={`rounded-xl bg-white p-3 shadow-sm text-xs ${rec.clr}`}>{rec.icon} {rec.text}</div>;
                })()}
              </div>

              {/* Soil moisture estimate */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-green-600" />
                  <h3 className="font-bold text-gray-800 text-sm">মাটির আর্দ্রতা অনুমান</h3>
                </div>
                {(() => {
                  const r   = parseFloat(current?.rainChance) || 0;
                  const hum = parseFloat(current?.humidity)   || 60;
                  const soil = Math.min(100, Math.round((r * 0.4) + (hum * 0.6)));
                  const soilLbl = soil > 70 ? 'ভেজা' : soil > 40 ? 'স্বাভাবিক' : 'শুষ্ক';
                  const soilClr = soil > 70 ? 'bg-blue-500' : soil > 40 ? 'bg-emerald-400' : 'bg-amber-400';
                  return (
                    <>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-gray-700">{soilLbl} — {soil}%</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-gray-100">
                        <div className={`h-3 rounded-full ${soilClr} transition-all duration-700`}
                          style={{ width: `${soil}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {soil > 70 ? 'মাটি যথেষ্ট ভেজা — সেচ দেওয়ার প্রয়োজন নেই'
                          : soil > 40 ? 'মাটির আর্দ্রতা স্বাভাবিক সীমায়'
                          : 'মাটি শুকনো — সেচ প্রয়োজন'}
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* Crop health indicator */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-emerald-500" />
                  <h3 className="font-bold text-gray-800 text-sm">ফসলের স্বাস্থ্য সূচক</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'বৃদ্ধির অবস্থা',  pct: farmScore,          clr: 'bg-emerald-400' },
                    { label: 'রোগ প্রতিরোধ',    pct: 100 - diseases[0].score, clr: 'bg-sky-400'   },
                    { label: 'সেচের প্রয়োজন',   pct: 100 - (parseFloat(current?.rainChance)||0), clr: 'bg-blue-400' },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{s.label}</span>
                        <span className="font-bold text-gray-700">{Math.max(0, Math.min(100, Math.round(s.pct)))}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className={`h-2 rounded-full ${s.clr} transition-all duration-700`}
                          style={{ width: `${Math.max(0, Math.min(100, Math.round(s.pct)))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
