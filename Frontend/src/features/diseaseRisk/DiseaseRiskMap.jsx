import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'react-toastify';
import {
  AlertTriangle, Shield, MapPin, Search, X, RefreshCw,
  Droplets, Thermometer, CloudRain, ChevronRight, ChevronDown,
  Leaf, Activity, BarChart2, Bug, Sprout, Info, Eye,
  TrendingUp, Filter,
} from 'lucide-react';
import { diseaseRiskApi } from '../../shared/services/diseaseRiskApi';
import PageContainer from '../../shared/ui/PageContainer';

/* ─── Constants ──────────────────────────────────────────── */
const RISK_META = {
  LOW:      { label: 'কম',     color: 'bg-emerald-500', light: 'bg-emerald-50',  border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  MEDIUM:   { label: 'মধ্যম',  color: 'bg-yellow-400',  light: 'bg-yellow-50',   border: 'border-yellow-200',  text: 'text-yellow-700',  dot: 'bg-yellow-400'  },
  HIGH:     { label: 'বেশি',   color: 'bg-orange-500',  light: 'bg-orange-50',   border: 'border-orange-200',  text: 'text-orange-700',  dot: 'bg-orange-400'  },
  CRITICAL: { label: 'জরুরি',  color: 'bg-red-600',     light: 'bg-red-50',      border: 'border-red-200',     text: 'text-red-700',     dot: 'bg-red-500'     },
};
const rm = (lvl) => RISK_META[lvl] || RISK_META.LOW;

const DIVISIONS = ['Dhaka','Chittagong','Rajshahi','Rangpur','Khulna','Barisal','Sylhet','Mymensingh'];
const DIV_BN = {
  Dhaka:'ঢাকা', Chittagong:'চট্টগ্রাম', Rajshahi:'রাজশাহী',
  Rangpur:'রংপুর', Khulna:'খুলনা', Barisal:'বরিশাল',
  Sylhet:'সিলেট', Mymensingh:'ময়মনসিংহ',
};

/* ─── Skeleton ───────────────────────────────────────────── */
function Sk({ cls = '' }) { return <div className={`animate-pulse rounded-2xl bg-gray-100 ${cls}`} />; }

/* ─── KPI strip card ─────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, from, to, sub }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${from} ${to} p-4 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-white/80">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-white">{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-white/60">{sub}</p>}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/25">
          <Icon className="text-white" style={{ width: 18, height: 18 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── District card ──────────────────────────────────────── */
function DistrictCard({ d, onClick }) {
  const m = rm(d.riskLevel);
  return (
    <button onClick={() => onClick(d)}
      className={`group w-full text-left overflow-hidden rounded-2xl border ${m.border} bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
      {/* top risk bar */}
      <div className={`h-1.5 w-full ${m.color}`} />
      <div className="p-4">
        {/* header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              <span className="font-extrabold text-gray-900">{d.district}</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">{DIV_BN[d.division] || d.division} বিভাগ</p>
          </div>
          <div className={`flex items-center gap-1.5 rounded-xl border ${m.border} ${m.light} px-2.5 py-1`}>
            <span className={`h-2 w-2 rounded-full ${m.dot} ${d.riskLevel === 'CRITICAL' || d.riskLevel === 'HIGH' ? 'animate-pulse' : ''}`} />
            <span className={`text-[11px] font-extrabold ${m.text}`}>{m.label}</span>
          </div>
        </div>

        {/* crop + disease */}
        <div className="mt-3 flex items-center gap-2">
          <Leaf className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-gray-700">{d.cropName}</span>
          <span className="text-gray-300">·</span>
          <Bug className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
          <span className="text-xs text-gray-600 line-clamp-1">{d.diseaseName}</span>
        </div>

        {/* score bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-400">ঝুঁকি স্কোর</span>
            <span className={`text-[11px] font-extrabold ${m.text}`}>{Math.round(d.riskScore)}/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div className={`h-1.5 rounded-full ${m.color} transition-all duration-700`}
              style={{ width: `${Math.min(100, d.riskScore)}%` }} />
          </div>
        </div>

        {/* weather chips */}
        <div className="mt-3 flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-0.5 text-[10px] text-sky-700">
            <Droplets className="h-2.5 w-2.5" />{Math.round(d.weatherSummary?.humidity || 0)}%
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">
            <CloudRain className="h-2.5 w-2.5" />{Math.round(d.weatherSummary?.rainChance || 0)}%
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-0.5 text-[10px] text-orange-700">
            <Thermometer className="h-2.5 w-2.5" />{Math.round(d.weatherSummary?.temperature || 0)}°C
          </span>
        </div>

        {/* report count + view */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-50">
          <span className="text-[10px] text-gray-400">
            {d.reportCount} AI রিপোর্ট · {d.communityCount} কৃষক রিপোর্ট
          </span>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition" />
        </div>
      </div>
    </button>
  );
}

/* ─── District detail modal ──────────────────────────────── */
function DistrictModal({ district, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    diseaseRiskApi.getDistrict(district)
      .then(res => setDetail(res))
      .catch(() => toast.error('জেলার বিবরণ লোড হয়নি'))
      .finally(() => setLoading(false));
  }, [district]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-500" />
            <h2 className="font-extrabold text-gray-900">{district}</h2>
          </div>
          <button onClick={onClose} className="rounded-xl border border-gray-200 p-1.5 hover:bg-gray-50 transition">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-3"><Sk cls="h-24" /><Sk cls="h-20" /><Sk cls="h-20" /></div>
          ) : !detail ? (
            <p className="text-center text-gray-500 py-8">তথ্য পাওয়া যায়নি</p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                সর্বশেষ আপডেট: {detail.calculatedAt ? new Date(detail.calculatedAt).toLocaleString('bn-BD') : '—'}
              </p>
              {detail.crops?.map((c, i) => {
                const m = rm(c.riskLevel);
                return (
                  <div key={i} className={`rounded-2xl border ${m.border} ${m.light} p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-emerald-500" />
                        <span className="font-extrabold text-gray-800">{c.cropName}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 rounded-xl border ${m.border} bg-white px-2.5 py-1`}>
                        <span className={`h-2 w-2 rounded-full ${m.dot}`} />
                        <span className={`text-[11px] font-extrabold ${m.text}`}>{m.label} ঝুঁকি</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-700">
                      <Bug className="h-3.5 w-3.5" />
                      <span className="font-semibold">{c.diseaseName}</span>
                    </div>
                    <div className="mt-3">
                      <div className="h-2 w-full rounded-full bg-white overflow-hidden">
                        <div className={`h-2 rounded-full ${m.color}`} style={{ width: `${Math.min(100,c.riskScore)}%` }} />
                      </div>
                      <p className={`mt-0.5 text-[10px] font-bold ${m.text}`}>স্কোর: {Math.round(c.riskScore)}/100</p>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        { icon: Droplets,    label: 'আর্দ্রতা',  val: `${Math.round(c.weatherSummary.humidity)}%`,    cls:'text-sky-600'    },
                        { icon: CloudRain,   label: 'বৃষ্টি',    val: `${Math.round(c.weatherSummary.rainChance)}%`,  cls:'text-blue-600'   },
                        { icon: Thermometer, label: 'তাপমাত্রা', val: `${Math.round(c.weatherSummary.temperature)}°`, cls:'text-orange-600' },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl bg-white/70 p-2 text-center">
                          <s.icon className={`h-4 w-4 mx-auto ${s.cls}`} />
                          <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                          <p className={`text-sm font-extrabold ${s.cls}`}>{s.val}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-xl bg-white/80 px-3 py-2.5 text-xs text-gray-700 leading-relaxed">
                      {c.recommendation}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
                      <span>{c.reportCount} AI রিপোর্ট</span>
                      <span>{c.communityCount} কৃষক রিপোর্ট</span>
                      {c.avgConfidence > 0 && <span>গড় নিশ্চয়তা: {c.avgConfidence.toFixed(0)}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="sticky bottom-0 border-t border-gray-100 bg-gray-50 px-5 py-3 rounded-b-2xl">
          <div className="flex items-start gap-2 text-[10px] text-gray-500 leading-relaxed">
            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
            <span>এই ঝুঁকি AI রিপোর্ট, আবহাওয়া ও কৃষক রিপোর্টের ভিত্তিতে অনুমান করা হয়েছে। নিশ্চিত রোগ নির্ণয়ের জন্য বিশেষজ্ঞের পরামর্শ নিন।</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Division group ─────────────────────────────────────── */
function DivisionGroup({ name, districts, onClick }) {
  const [open, setOpen] = useState(true);
  const maxRisk = districts.reduce((m, d) => {
    const order = { CRITICAL:4, HIGH:3, MEDIUM:2, LOW:1 };
    return (order[d.riskLevel] || 1) > (order[m] || 0) ? d.riskLevel : m;
  }, 'LOW');
  const m = rm(maxRisk);
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${m.color}`} />
          <span className="font-extrabold text-gray-900">{DIV_BN[name] || name} বিভাগ</span>
          <span className="text-xs text-gray-400">({districts.length} জেলা)</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-gray-50 p-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {districts.map(d => <DistrictCard key={d.district} d={d} onClick={onClick} />)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function DiseaseRiskMap() {
  const [districts,   setDistricts]   = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterDiv,   setFilterDiv]   = useState('');
  const [activeDistrict, setActiveDistrict] = useState(null);
  const [recalcLoading, setRecalcLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [distRes, sumRes] = await Promise.all([
        diseaseRiskApi.getDistricts(),
        diseaseRiskApi.getSummary(),
      ]);
      setDistricts(distRes.districts || []);
      setSummary(sumRes);
    } catch (e) {
      toast.error('ডেটা লোড করতে সমস্যা');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRecalculate = async () => {
    setRecalcLoading(true);
    try {
      await diseaseRiskApi.recalculate();
      toast.success('ঝুঁকি স্কোর পুনরায় গণনা হয়েছে');
      loadData();
    } catch {
      toast.error('পুনরায় গণনা ব্যর্থ');
    } finally {
      setRecalcLoading(false);
    }
  };

  /* ── filtered list ── */
  const visible = useMemo(() => {
    let arr = [...districts];
    if (search.trim()) arr = arr.filter(d => d.district.toLowerCase().includes(search.toLowerCase()) || d.diseaseName?.includes(search) || d.cropName?.includes(search));
    if (filterLevel)   arr = arr.filter(d => d.riskLevel === filterLevel);
    if (filterDiv)     arr = arr.filter(d => d.division === filterDiv);
    return arr;
  }, [districts, search, filterLevel, filterDiv]);

  /* group by division */
  const byDivision = useMemo(() => {
    const map = {};
    for (const d of visible) {
      const div = d.division || 'Other';
      if (!map[div]) map[div] = [];
      map[div].push(d);
    }
    return map;
  }, [visible]);

  /* KPI counts */
  const kpi = useMemo(() => ({
    critical: districts.filter(d => d.riskLevel === 'CRITICAL').length,
    high:     districts.filter(d => d.riskLevel === 'HIGH').length,
    medium:   districts.filter(d => d.riskLevel === 'MEDIUM').length,
    low:      districts.filter(d => d.riskLevel === 'LOW').length,
  }), [districts]);

  const highRisk = useMemo(() =>
    [...districts].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5)
  , [districts]);

  return (
    <PageContainer maxWidth="max-w-7xl">
      <div className="space-y-5">

        {/* ══ HERO ══ */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-md">
          <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-emerald-100 opacity-40 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-gray-900">জেলা ভিত্তিক রোগ ঝুঁকি মানচিত্র</h1>
                  <p className="text-xs text-gray-500">AI রিপোর্ট, আবহাওয়া ও কৃষক রিপোর্টের ভিত্তিতে ঝুঁকি অনুমান</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={loadData} disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ
              </button>
              <button onClick={handleRecalculate} disabled={recalcLoading}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 transition disabled:opacity-50 shadow-sm">
                <Activity className={`h-3.5 w-3.5 ${recalcLoading ? 'animate-spin' : ''}`} />
                {recalcLoading ? 'গণনা হচ্ছে…' : 'পুনরায় গণনা'}
              </button>
              <Link to="/app/ai"
                className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition">
                <Sprout className="h-3.5 w-3.5" /> AI রোগ নির্ণয়
              </Link>
            </div>
          </div>

          {/* KPI strip */}
          {!loading && (
            <div className="relative mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard icon={AlertTriangle} label="জরুরি জেলা"  value={kpi.critical} sub="CRITICAL" from="from-red-500"    to="to-rose-600"    />
              <KpiCard icon={TrendingUp}    label="বেশি ঝুঁকি"  value={kpi.high}     sub="HIGH"     from="from-orange-500" to="to-amber-500"   />
              <KpiCard icon={BarChart2}     label="মধ্যম ঝুঁকি" value={kpi.medium}   sub="MEDIUM"   from="from-yellow-400" to="to-orange-400"  />
              <KpiCard icon={Shield}        label="কম ঝুঁকি"    value={kpi.low}      sub="LOW"      from="from-emerald-500" to="to-teal-500"   />
            </div>
          )}
        </div>

        {/* ══ SEARCH + FILTER ══ */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="জেলা, ফসল বা রোগের নাম খুঁজুন…"
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-11 pr-9 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>}
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-7 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer">
                <option value="">সব ঝুঁকি</option>
                <option value="CRITICAL">জরুরি</option>
                <option value="HIGH">বেশি</option>
                <option value="MEDIUM">মধ্যম</option>
                <option value="LOW">কম</option>
              </select>
            </div>
            <select value={filterDiv} onChange={e => setFilterDiv(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer">
              <option value="">সব বিভাগ</option>
              {DIVISIONS.map(d => <option key={d} value={d}>{DIV_BN[d]}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => <Sk key={i} cls="h-52" />)}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">

            {/* ─── Left: District cards ─── */}
            <div className="space-y-4">
              {/* Result count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{visible.length} টি জেলা{districts.length !== visible.length ? ` (মোট ${districts.length} থেকে)` : ''}</p>
                {(search || filterLevel || filterDiv) && (
                  <button onClick={() => { setSearch(''); setFilterLevel(''); setFilterDiv(''); }}
                    className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-700">
                    <X className="h-3.5 w-3.5" /> ফিল্টার মুছুন
                  </button>
                )}
              </div>

              {visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
                  <MapPin className="h-12 w-12 text-gray-200 mb-4" />
                  <p className="font-bold text-gray-500">কোনো জেলা পাওয়া যায়নি</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {DIVISIONS.filter(d => byDivision[d]?.length > 0).map(div => (
                    <DivisionGroup key={div} name={div} districts={byDivision[div] || []} onClick={d => setActiveDistrict(d.district)} />
                  ))}
                </div>
              )}
            </div>

            {/* ─── Right sidebar ─── */}
            <div className="space-y-4">

              {/* Top risky districts */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <h3 className="font-extrabold text-gray-800 text-sm">সর্বোচ্চ ঝুঁকিপ্রবণ জেলা</h3>
                </div>
                <div className="space-y-2">
                  {highRisk.map((d, i) => {
                    const m = rm(d.riskLevel);
                    return (
                      <button key={d.district} onClick={() => setActiveDistrict(d.district)}
                        className="w-full flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50 transition group text-left">
                        <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white ${i===0?'bg-red-500':i===1?'bg-orange-500':i===2?'bg-amber-500':'bg-gray-300'}`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 group-hover:text-red-700 transition">{d.district}</p>
                          <p className="text-[10px] text-gray-400 truncate">{d.diseaseName}</p>
                        </div>
                        <div className={`flex items-center gap-1 rounded-lg border ${m.border} ${m.light} px-2 py-0.5`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
                          <span className={`text-[10px] font-extrabold ${m.text}`}>{m.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Risk level legend */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <h3 className="font-extrabold text-gray-800 text-sm">ঝুঁকি মাত্রা</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { level: 'CRITICAL', range: '৮১–১০০', desc: 'জরুরি পদক্ষেপ প্রয়োজন' },
                    { level: 'HIGH',     range: '৬১–৮০',  desc: 'দ্রুত ব্যবস্থা নিন' },
                    { level: 'MEDIUM',   range: '৩১–৬০',  desc: 'সতর্কতার সাথে পর্যবেক্ষণ' },
                    { level: 'LOW',      range: '০–৩০',   desc: 'নিয়মিত পর্যবেক্ষণ যথেষ্ট' },
                  ].map(r => {
                    const m = rm(r.level);
                    return (
                      <div key={r.level} className={`flex items-center gap-3 rounded-xl border ${m.border} ${m.light} p-2.5`}>
                        <div className={`h-4 w-4 flex-shrink-0 rounded-full ${m.color}`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-extrabold ${m.text}`}>{m.label} ({r.range})</p>
                          <p className="text-[10px] text-gray-500">{r.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Season info */}
              {summary?.currentSeason && (
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Leaf className="h-4 w-4 text-emerald-600" />
                    <h3 className="font-extrabold text-emerald-800 text-sm">বর্তমান ঋতু</h3>
                  </div>
                  <p className="text-lg font-extrabold text-emerald-700">{summary.currentSeason}</p>
                  <p className="text-xs text-emerald-600 mt-1">এই ঋতুতে ছত্রাকজনিত রোগের ঝুঁকি তুলনামূলকভাবে বেশি।</p>
                </div>
              )}

              {/* Prevention tips */}
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-indigo-500" />
                  <h3 className="font-extrabold text-gray-800 text-sm">সাধারণ প্রতিরোধ পরামর্শ</h3>
                </div>
                <div className="space-y-2 text-xs text-gray-700">
                  {[
                    '🌱 নিয়মিত ক্ষেত পর্যবেক্ষণ করুন',
                    '💧 অতিরিক্ত সেচ পরিহার করুন',
                    '🌿 রোগাক্রান্ত পাতা অপসারণ করুন',
                    '🔬 বীজ শোধন করে রোপণ করুন',
                    '👨‍🌾 বিশেষজ্ঞের পরামর্শ নিন',
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2">{t}</div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    এই ঝুঁকি AI রিপোর্ট, আবহাওয়া ও কৃষক রিপোর্টের ভিত্তিতে অনুমান করা হয়েছে। নিশ্চিত রোগ নির্ণয়ের জন্য বিশেষজ্ঞের পরামর্শ নিন।
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* District detail modal */}
      {activeDistrict && (
        <DistrictModal district={activeDistrict} onClose={() => setActiveDistrict(null)} />
      )}
    </PageContainer>
  );
}
