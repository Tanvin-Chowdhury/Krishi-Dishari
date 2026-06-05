"use client";
import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  Gavel,
  Trophy,
  TrendingUp,
  DollarSign,
  XCircle,
  BarChart3,
  ArrowUpRight,
  Clock,
  Eye,
  ChevronRight,
  AlertTriangle,
  Star,
  History,
  Activity,
} from "lucide-react";
import { AuthContext } from "../../core/auth/AuthContext";
import { auctionApi } from "../../shared/services/auctionApi";
import { resolveMediaUrl } from "../../shared/lib/mediaUrl";
import PageContainer from "../../shared/ui/PageContainer";
import { CountdownTimer } from "./AuctionShared";

/* ─── helpers ────────────────────────────────────────────── */
const fmt = (n) => Number(n ?? 0).toLocaleString("bn-BD");
const fmtMon = (n) => `৳${fmt(Math.round(n ?? 0))}`;
const fmtAgo = (d) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "এইমাত্র";
  if (m < 60) return `${m} মিনিট আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ঘন্টা আগে`;
  return `${Math.floor(h / 24)} দিন আগে`;
};
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("bn-BD", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

/* ─── skeleton ───────────────────────────────────────────── */
function Sk({ cls = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-100 ${cls}`} />;
}
function PageSkeleton() {
  return (
    <div className="space-y-5">
      <Sk cls="h-28" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Sk key={i} cls="h-20" />
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Sk key={i} cls="h-64" />
        ))}
      </div>
    </div>
  );
}

/* ─── KPI card ───────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, from, to }) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${from} ${to} p-4 shadow-md`}
    >
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

/* ─── active bid card ────────────────────────────────────── */
function ActiveBidCard({ b }) {
  const navigate = useNavigate();
  const isWinning = b.is_winning;
  const diff = b.current_price - b.bid_amount;
  const isOutbid = !isWinning && diff > 0;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200
      ${isWinning ? "border-emerald-200 ring-1 ring-emerald-100" : isOutbid ? "border-amber-200 ring-1 ring-amber-50" : "border-gray-100"}`}
    >
      {/* Top image strip / status bar */}
      <div
        className={`relative h-2 w-full ${isWinning ? "bg-gradient-to-r from-emerald-400 to-teal-400" : isOutbid ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gray-200"}`}
      />

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div
            onClick={() => navigate(`/app/auctions/${b.auction_id}`)}
            className="cursor-pointer min-w-0"
          >
            <p className="font-bold text-gray-800 truncate hover:text-emerald-700 transition">
              {b.product_name}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              বিক্রেতা: {b.seller_name}
            </p>
          </div>
          {/* Status badge */}
          {isWinning ? (
            <span className="flex-shrink-0 flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              <Star className="h-3 w-3" /> সর্বোচ্চ
            </span>
          ) : (
            <span className="flex-shrink-0 flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              <AlertTriangle className="h-3 w-3" /> পিছিয়ে
            </span>
          )}
        </div>

        {/* Bid vs current */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-gray-50 p-2.5">
            <p className="text-[10px] text-gray-400 mb-0.5">আপনার বিড</p>
            <p className="text-lg font-extrabold text-gray-800">
              {fmtMon(b.bid_amount)}
            </p>
          </div>
          <div
            className={`rounded-xl p-2.5 ${isWinning ? "bg-emerald-50" : "bg-amber-50"}`}
          >
            <p className="text-[10px] text-gray-400 mb-0.5">সর্বোচ্চ বিড</p>
            <p
              className={`text-lg font-extrabold ${isWinning ? "text-emerald-700" : "text-amber-700"}`}
            >
              {fmtMon(b.current_price)}
            </p>
          </div>
        </div>

        {/* Outbid alert */}
        {isOutbid && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-amber-700 flex-1">
              আপনার বিড {fmtMon(diff)} পিছিয়ে
            </p>
            <Link
              to={`/app/auctions/${b.auction_id}`}
              className="flex-shrink-0 text-[10px] font-bold text-amber-700 underline"
            >
              বিড বাড়ান
            </Link>
          </div>
        )}

        {/* Countdown */}
        <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2">
          <Clock className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
          <CountdownTimer endTime={b.end_time} compact />
          <span className="ml-auto text-[10px] text-gray-400">
            {fmtDate(b.end_time)}
          </span>
        </div>

        {/* Bid time */}
        <p className="text-[10px] text-gray-400">
          বিড দেওয়া হয়েছে: {fmtAgo(b.created_at)}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-gray-50">
          <Link
            to={`/app/auctions/${b.auction_id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition"
          >
            <Eye className="h-3.5 w-3.5" /> নিলাম দেখুন
          </Link>
          {isOutbid && (
            <Link
              to={`/app/auctions/${b.auction_id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2 text-xs font-bold text-white hover:bg-amber-600 transition"
            >
              <ArrowUpRight className="h-3.5 w-3.5" /> বিড বৃদ্ধি
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── won auction card ───────────────────────────────────── */
function WonCard({ a }) {
  const img = resolveMediaUrl(a.primary_image);
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ring-1 ring-amber-50">
      {/* image strip */}
      <div className="relative h-36 bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden flex items-center justify-center">
        {img ? (
          <img
            src={img}
            alt={a.product_name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <Trophy className="h-12 w-12 text-amber-300" />
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-extrabold text-white shadow">
          <Trophy className="h-3 w-3" /> জয়ী
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-bold text-gray-800 truncate">{a.product_name}</h3>
        <p className="text-[11px] text-gray-400">বিক্রেতা: {a.seller_name}</p>
        <div className="rounded-xl bg-amber-50 p-2.5">
          <p className="text-[10px] text-amber-600 mb-0.5">বিজয়ী বিড</p>
          <p className="text-xl font-extrabold text-amber-700">
            {fmtMon(a.winning_bid || a.current_price)}
          </p>
        </div>
        <p className="text-[10px] text-gray-400">
          শেষ হয়েছে: {fmtDate(a.end_time)}
        </p>
        <Link
          to={`/app/auctions/${a.auction_id}`}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition"
        >
          <Eye className="h-3.5 w-3.5" /> বিস্তারিত দেখুন
        </Link>
      </div>
    </div>
  );
}

/* ─── bid history timeline ───────────────────────────────── */
function BidTimeline({ bids }) {
  const recent = bids.slice(0, 8);
  return (
    <div className="space-y-0">
      {recent.map((b, i) => {
        const isLast = i === recent.length - 1;
        const isWin = b.is_winning;
        return (
          <div key={b.bid_id} className="flex gap-3">
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${isWin ? "bg-emerald-500" : "bg-gray-200"}`}
              >
                <Gavel
                  className={`h-4 w-4 ${isWin ? "text-white" : "text-gray-500"}`}
                />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-gray-100 my-1 min-h-[12px]" />
              )}
            </div>
            <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-3"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {b.product_name}
                </p>
                <span
                  className={`flex-shrink-0 text-sm font-extrabold ${isWin ? "text-emerald-600" : "text-gray-700"}`}
                >
                  {fmtMon(b.bid_amount)}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {fmtAgo(b.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── analytics card ─────────────────────────────────────── */
function AnalyticsCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition">
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${bg}`}
      >
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400">{label}</p>
        <p className="text-base font-extrabold text-gray-800">{value}</p>
        {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── win rate ring ──────────────────────────────────────── */
function WinRateRing({ rate, size = 80 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (rate / 100) * circ;
  const color = rate >= 60 ? "#10b981" : rate >= 30 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="9"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text
          x={size / 2}
          y={size / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: 16,
            fontWeight: 800,
            fill: "#1f2937",
            fontFamily: "inherit",
          }}
        >
          {rate}%
        </text>
      </svg>
      <p className="text-[10px] text-gray-500">জয়ের হার</p>
    </div>
  );
}

/* ─── empty state ────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
        <Gavel className="h-10 w-10 text-indigo-300" />
      </div>
      <p className="text-lg font-bold text-gray-700">
        আপনি এখনো কোনো নিলামে অংশগ্রহণ করেননি
      </p>
      <p className="mt-1 text-sm text-gray-400">
        লাইভ নিলামে বিড করুন এবং সেরা পণ্য জিতুন
      </p>
      <Link
        to="/app/auctions"
        className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-600 transition shadow-sm"
      >
        <Gavel className="h-4 w-4" /> নিলাম ব্রাউজ করুন{" "}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

/* ─── section header ─────────────────────────────────────── */
function SectionHead({ icon: Icon, title, count, iconBg, iconColor }) {
  return (
    <div
      className={`mb-4 flex items-center justify-between rounded-2xl px-4 py-3 ${iconBg}`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={`h-5 w-5 ${iconColor}`} />
        <h2 className={`text-sm font-bold ${iconColor}`}>{title}</h2>
      </div>
      <span
        className={`rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-extrabold ${iconColor}`}
      >
        {count}
      </span>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────── */
export default function ActiveBids() {
  const { user } = useContext(AuthContext);
  const [bids, setBids] = useState([]);
  const [won, setWon] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([auctionApi.getMyBids(), auctionApi.getWon()])
      .then(([bRes, wRes]) => {
        setBids(bRes.bids || []);
        setWon(wRes.auctions || []);
      })
      .catch(() => toast.error("বিড ডেটা লোড করতে সমস্যা"))
      .finally(() => setLoading(false));
  }, [user]);

  /* ── derived ── */
  const activeBids = useMemo(
    () => bids.filter((b) => b.status_name === "active" || b.status_id === 2),
    [bids],
  );
  const endedBids = useMemo(
    () => bids.filter((b) => b.status_name === "ended" || b.status_id === 3),
    [bids],
  );
  const wonIds = useMemo(() => new Set(won.map((a) => a.auction_id)), [won]);
  const lostBids = useMemo(
    () => endedBids.filter((b) => !wonIds.has(b.auction_id)),
    [endedBids, wonIds],
  );

  const totalBidValue = bids.reduce(
    (s, b) => s + (parseFloat(b.bid_amount) || 0),
    0,
  );
  const maxBid = bids.length
    ? Math.max(...bids.map((b) => parseFloat(b.bid_amount) || 0))
    : 0;
  const winRate = endedBids.length
    ? Math.round((won.length / (won.length + lostBids.length)) * 100)
    : 0;
  const uniqueAuctions = new Set(bids.map((b) => b.auction_id)).size;

  if (loading)
    return (
      <PageContainer maxWidth="max-w-7xl">
        <PageSkeleton />
      </PageContainer>
    );

  if (bids.length === 0 && won.length === 0) {
    return (
      <PageContainer maxWidth="max-w-7xl">
        <EmptyState />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="max-w-7xl">
      <div className="space-y-5">
        {/* ═══════ HERO BANNER ═══════ */}
        <div className="flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500 px-6 py-5 shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="text-white">
            <div className="flex items-center gap-2">
              <Gavel className="h-6 w-6 opacity-80" />
              <h1 className="text-2xl font-extrabold">আমার বিড</h1>
            </div>
            <p className="mt-0.5 text-sm text-white/70">
              আপনার সক্রিয়, জয়ী এবং সম্পন্ন বিড ট্র্যাক করুন
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white">
            {[
              { label: "মোট বিড", val: fmt(bids.length) },
              { label: "সক্রিয়", val: fmt(activeBids.length) },
              { label: "জয়ী", val: fmt(won.length) },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-xl font-extrabold">{s.val}</p>
                <p className="text-[10px] opacity-70">{s.label}</p>
              </div>
            ))}
            <div className="hidden sm:block h-10 w-px bg-white/25" />
            <Link
              to="/app/auctions"
              className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/25 px-4 py-2 text-sm font-bold text-white transition"
            >
              <Gavel className="h-4 w-4" /> নিলাম দেখুন
            </Link>
          </div>
        </div>

        {/* ═══════ KPI STRIP ═══════ */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            icon={Gavel}
            label="মোট বিড"
            value={fmt(bids.length)}
            sub="সকল নিলামে"
            from="from-indigo-500"
            to="to-indigo-700"
          />
          <KpiCard
            icon={Activity}
            label="সক্রিয় বিড"
            value={fmt(activeBids.length)}
            sub="এখন চলমান"
            from="from-emerald-500"
            to="to-teal-600"
          />
          <KpiCard
            icon={Trophy}
            label="জয়ী নিলাম"
            value={fmt(won.length)}
            sub="সফলভাবে জিতেছেন"
            from="from-amber-500"
            to="to-orange-500"
          />
          <KpiCard
            icon={XCircle}
            label="হারানো নিলাম"
            value={fmt(lostBids.length)}
            sub="পরেরবার চেষ্টা করুন"
            from="from-rose-500"
            to="to-pink-600"
          />
          <KpiCard
            icon={DollarSign}
            label="মোট বিড মূল্য"
            value={fmtMon(totalBidValue)}
            sub="সকল বিডের সমষ্টি"
            from="from-violet-500"
            to="to-purple-700"
          />
          <KpiCard
            icon={TrendingUp}
            label="সর্বোচ্চ বিড"
            value={fmtMon(maxBid)}
            sub="একক বিড"
            from="from-sky-500"
            to="to-cyan-600"
          />
        </div>

        {/* ═══════ ACTIVE BIDS ═══════ */}
        {activeBids.length > 0 && (
          <div>
            <SectionHead
              icon={Gavel}
              title="সক্রিয় বিড"
              count={activeBids.length}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-700"
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeBids.map((b) => (
                <ActiveBidCard key={b.bid_id} b={b} />
              ))}
            </div>
          </div>
        )}

        {/* ═══════ WON AUCTIONS ═══════ */}
        {won.length > 0 && (
          <div>
            <SectionHead
              icon={Trophy}
              title="জয়ী নিলাম"
              count={won.length}
              iconBg="bg-amber-50"
              iconColor="text-amber-700"
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {won.map((a) => (
                <WonCard key={a.auction_id} a={a} />
              ))}
            </div>
          </div>
        )}

        {/* ═══════ BOTTOM: TIMELINE + ANALYTICS ═══════ */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Bid history timeline */}
          <div className="lg:col-span-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-500" />
                <h3 className="font-bold text-gray-800">বিড ইতিহাস</h3>
              </div>
              <Link
                to="/app/auctions"
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                নিলাম দেখুন <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {bids.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                কোনো বিড ইতিহাস নেই
              </p>
            ) : (
              <BidTimeline bids={bids} />
            )}
          </div>

          {/* Analytics */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-violet-500" />
              <h3 className="font-bold text-gray-800">বিড পরিসংখ্যান</h3>
            </div>
            <div className="flex flex-col items-center gap-4">
              <WinRateRing rate={winRate} size={96} />
              <div className="w-full grid grid-cols-1 gap-2.5">
                <AnalyticsCard
                  icon={Gavel}
                  label="মোট নিলামে অংশ"
                  value={fmt(uniqueAuctions)}
                  sub="অনন্য নিলাম"
                  color="text-indigo-600"
                  bg="bg-indigo-50"
                />
                <AnalyticsCard
                  icon={Trophy}
                  label="জয়ী নিলাম"
                  value={fmt(won.length)}
                  sub="সফল অংশগ্রহণ"
                  color="text-amber-600"
                  bg="bg-amber-50"
                />
                <AnalyticsCard
                  icon={XCircle}
                  label="হারানো নিলাম"
                  value={fmt(lostBids.length)}
                  sub="পুনরায় চেষ্টা করুন"
                  color="text-rose-500"
                  bg="bg-rose-50"
                />
                <AnalyticsCard
                  icon={Star}
                  label="গড় বিড মূল্য"
                  value={fmtMon(bids.length ? totalBidValue / bids.length : 0)}
                  sub="প্রতি বিড"
                  color="text-violet-600"
                  bg="bg-violet-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lost auctions section */}
        {lostBids.length > 0 && (
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-500" />
              <h3 className="font-bold text-gray-800">হারানো নিলাম</h3>
              <span className="ml-auto rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600">
                {lostBids.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {lostBids.slice(0, 6).map((b) => (
                <Link
                  key={b.bid_id}
                  to={`/app/auctions/${b.auction_id}`}
                  className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 hover:bg-rose-50 transition group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-rose-700">
                      {b.product_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      আপনার বিড: {fmtMon(b.bid_amount)}
                    </p>
                    <p className="text-xs text-gray-400">
                      বিজয়ী বিড: {fmtMon(b.current_price)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-rose-500 flex-shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
