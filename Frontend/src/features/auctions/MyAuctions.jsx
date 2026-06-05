"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  Plus,
  RefreshCw,
  Gavel,
  TrendingUp,
  CheckCircle2,
  Clock,
  DollarSign,
  BarChart3,
  Search,
  SlidersHorizontal,
  Eye,
  Pencil,
  Trophy,
  X,
  ChevronRight,
  Flame,
} from "lucide-react";
import { auctionApi } from "../../shared/services/auctionApi";
import { resolveMediaUrl } from "../../shared/lib/mediaUrl";
import PageContainer from "../../shared/ui/PageContainer";
import { CountdownTimer, StatusBadge } from "./AuctionShared";

/* ─── helpers ────────────────────────────────────────────── */
const fmt = (n) => Number(n ?? 0).toLocaleString("bn-BD");
const fmtMon = (n) => `৳${fmt(Math.round(n ?? 0))}`;
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
function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        >
          <Sk cls="h-44 rounded-none" />
          <div className="p-4 space-y-3">
            <Sk cls="h-4 w-3/4" />
            <Sk cls="h-8 w-1/2" />
            <div className="flex gap-2">
              <Sk cls="h-5 w-20" />
              <Sk cls="h-5 w-16" />
            </div>
            <div className="flex gap-2 pt-1">
              <Sk cls="h-8 flex-1" />
              <Sk cls="h-8 w-8" />
            </div>
          </div>
        </div>
      ))}
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

/* ─── live pulse badge ───────────────────────────────────── */
function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-lg">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
      </span>
      LIVE
    </span>
  );
}

/* ─── auction card ───────────────────────────────────────── */
function AuctionCard({ a, onRefresh }) {
  const navigate = useNavigate();
  const img = resolveMediaUrl(a.primary_image);
  const isActive = a.status_name === "active";
  const isEnded = a.status_name === "ended";
  const isSched = a.status_name === "scheduled";
  const isCancelled = a.status_name === "cancelled";
  const canEdit = isActive || isSched;

  const priceDiff = a.current_price - a.starting_price;
  const priceGain =
    a.starting_price > 0 ? Math.round((priceDiff / a.starting_price) * 100) : 0;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5
      ${isActive ? "border-emerald-200 ring-1 ring-emerald-100" : isCancelled ? "border-red-100 opacity-75" : "border-gray-100"}`}
    >
      {/* ── Image ── */}
      <div
        className="relative h-44 cursor-pointer overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-gray-100 flex items-center justify-center"
        onClick={() => navigate(`/app/auctions/${a.auction_id}`)}
      >
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
          <Gavel className="h-14 w-14 text-emerald-200" />
        )}

        {/* Live badge top-left */}
        <div className="absolute top-2 left-2">
          {isActive ? (
            <LiveBadge />
          ) : (
            <StatusBadge status={a.status_name} compact />
          )}
        </div>

        {/* Bid count pill bottom-right */}
        {(a.bid_count ?? 0) > 0 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-gray-700 shadow">
            <Gavel className="h-3 w-3 text-emerald-500" />
            {fmt(a.bid_count)} বিড
          </div>
        )}

        {/* Price gain badge */}
        {priceGain > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow">
            <TrendingUp className="h-3 w-3" />+{priceGain}%
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col p-4 gap-2">
        {/* Product name */}
        <h3
          onClick={() => navigate(`/app/auctions/${a.auction_id}`)}
          className="cursor-pointer text-sm font-bold text-gray-800 line-clamp-1 hover:text-emerald-700 transition"
        >
          {a.product_name}
        </h3>

        {/* Current bid price */}
        <div>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            বর্তমান বিড
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 leading-tight">
            {fmtMon(a.current_price)}
          </p>
          <p className="text-[10px] text-gray-400">
            শুরুর মূল্য {fmtMon(a.starting_price)} / {a.unit}
          </p>
        </div>

        {/* Info pills */}
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-600">
            📅 {fmtDate(a.end_time)}
          </span>
          {a.min_increment > 0 && (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-700">
              +{fmtMon(a.min_increment)} বৃদ্ধি
            </span>
          )}
        </div>

        {/* Countdown or winner */}
        {isActive && (
          <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
            <CountdownTimer endTime={a.end_time} compact onExpire={onRefresh} />
          </div>
        )}
        {isEnded && a.winner_name && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
            <Trophy className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-amber-700 truncate">
              বিজয়ী: {a.winner_name}
            </p>
          </div>
        )}
        {isEnded && !a.winner_name && (
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">কোনো বিজয়ী নেই</p>
          </div>
        )}
        {isSched && (
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-blue-700">
              শুরু: {fmtDate(a.start_time)}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-auto flex gap-2 pt-2 border-t border-gray-50">
          <Link
            to={`/app/auctions/${a.auction_id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition"
          >
            <Eye className="h-3.5 w-3.5" /> বিস্তারিত
          </Link>
          {canEdit ? (
            <Link
              to={`/app/auctions/${a.auction_id}/edit`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
            >
              <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
            </Link>
          ) : (
            <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-50 py-2 text-xs font-medium text-gray-400">
              {isEnded ? "সম্পন্ন" : "বাতিল"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── empty state ─────────────────────────────────────────── */
function EmptyState({ isFiltered, onClear }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
        <Gavel className="h-10 w-10 text-emerald-300" />
      </div>
      {isFiltered ? (
        <>
          <p className="text-lg font-bold text-gray-700">
            কোনো নিলাম পাওয়া যায়নি
          </p>
          <p className="mt-1 text-sm text-gray-400">
            ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন
          </p>
          <button
            onClick={onClear}
            className="mt-4 flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <X className="h-3.5 w-3.5" /> ফিল্টার মুছুন
          </button>
        </>
      ) : (
        <>
          <p className="text-lg font-bold text-gray-700">
            এখনো কোনো নিলাম তৈরি করা হয়নি
          </p>
          <p className="mt-1 text-sm text-gray-400">
            আপনার প্রথম কৃষি নিলাম চালু করুন
          </p>
          <Link
            to="/app/auctions/create"
            className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition shadow-sm"
          >
            <Plus className="h-4 w-4" /> প্রথম নিলাম তৈরি করুন
          </Link>
        </>
      )}
    </div>
  );
}

/* ─── main component ─────────────────────────────────────── */
export default function MyAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    auctionApi
      .getMy()
      .then((res) => setAuctions(res.auctions || []))
      .catch(() => toast.error("নিলাম লোড করতে সমস্যা"))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ── derived KPIs ── */
  const kpi = useMemo(() => {
    const active = auctions.filter((a) => a.status_name === "active");
    const ended = auctions.filter((a) => a.status_name === "ended");
    const totalBids = auctions.reduce(
      (s, a) => s + (Number(a.bid_count) || 0),
      0,
    );
    const maxPrice = ended.length
      ? Math.max(...ended.map((a) => parseFloat(a.current_price) || 0))
      : 0;
    const revenue = ended.reduce(
      (s, a) => s + (parseFloat(a.current_price) || 0),
      0,
    );
    return {
      total: auctions.length,
      active: active.length,
      ended: ended.length,
      totalBids,
      maxPrice,
      revenue,
    };
  }, [auctions]);

  /* ── filtered & sorted ── */
  const visible = useMemo(() => {
    let arr = [...auctions];
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((a) => a.product_name?.toLowerCase().includes(q));
    }
    if (statusFilter) arr = arr.filter((a) => a.status_name === statusFilter);

    if (sortBy === "newest")
      arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === "oldest")
      arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (sortBy === "highest")
      arr.sort((a, b) => b.current_price - a.current_price);
    if (sortBy === "ending")
      arr.sort((a, b) => new Date(a.end_time) - new Date(b.end_time));
    return arr;
  }, [auctions, search, statusFilter, sortBy]);

  const isFiltered = !!(search.trim() || statusFilter);
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
  };

  return (
    <PageContainer maxWidth="max-w-7xl">
      {/* ═══════════ HERO HEADER ═══════════ */}
      <div className="mb-6 flex flex-col gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-6 shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="text-white">
          <div className="flex items-center gap-2">
            <Gavel className="h-6 w-6 opacity-80" />
            <h1 className="text-2xl font-extrabold">আমার নিলাম</h1>
            {kpi.active > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-bold">
                <Flame className="h-3 w-3" /> {kpi.active} LIVE
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-white/70">
            আপনার সকল সক্রিয় ও সম্পন্ন নিলাম পরিচালনা করুন
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/25 px-3.5 py-2 text-sm font-semibold text-white transition disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            রিফ্রেশ
          </button>
          <Link
            to="/app/auctions/create"
            className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow hover:bg-emerald-50 transition"
          >
            <Plus className="h-4 w-4" /> নতুন নিলাম
          </Link>
        </div>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : (
        <div className="space-y-5">
          {/* ═══════════ KPI STRIP ═══════════ */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              icon={Gavel}
              label="মোট নিলাম"
              value={fmt(kpi.total)}
              sub="সর্বমোট তৈরি"
              from="from-blue-500"
              to="to-blue-700"
            />
            <KpiCard
              icon={Flame}
              label="সক্রিয় নিলাম"
              value={fmt(kpi.active)}
              sub="এখন চলমান"
              from="from-emerald-500"
              to="to-teal-600"
            />
            <KpiCard
              icon={CheckCircle2}
              label="সম্পন্ন নিলাম"
              value={fmt(kpi.ended)}
              sub="শেষ হয়েছে"
              from="from-violet-500"
              to="to-purple-700"
            />
            <KpiCard
              icon={BarChart3}
              label="মোট বিড"
              value={fmt(kpi.totalBids)}
              sub="সকল নিলাম মিলিয়ে"
              from="from-sky-500"
              to="to-cyan-600"
            />
            <KpiCard
              icon={TrendingUp}
              label="সর্বোচ্চ বিক্রয়"
              value={fmtMon(kpi.maxPrice)}
              sub="একক নিলাম"
              from="from-amber-500"
              to="to-orange-600"
            />
            <KpiCard
              icon={DollarSign}
              label="মোট আয়"
              value={fmtMon(kpi.revenue)}
              sub="সম্পন্ন নিলাম থেকে"
              from="from-rose-500"
              to="to-pink-600"
            />
          </div>

          {/* ═══════════ FILTER BAR ═══════════ */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="নিলাম খুঁজুন…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Status filter */}
              <div className="relative">
                <SlidersHorizontal className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white py-2.5 pl-8 pr-8 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">সব নিলাম</option>
                  <option value="active">সক্রিয়</option>
                  <option value="scheduled">নির্ধারিত</option>
                  <option value="ended">সম্পন্ন</option>
                  <option value="cancelled">বাতিল</option>
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-400 focus:outline-none appearance-none cursor-pointer"
              >
                <option value="newest">নতুন আগে</option>
                <option value="oldest">পুরনো আগে</option>
                <option value="highest">সর্বোচ্চ বিড</option>
                <option value="ending">শেষ হচ্ছে আগে</option>
              </select>
            </div>
          </div>

          {/* ── Result count ── */}
          {auctions.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {visible.length} টি নিলাম
                {auctions.length !== visible.length
                  ? ` (মোট ${auctions.length} টি থেকে)`
                  : ""}
              </p>
              {isFiltered && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  <X className="h-3.5 w-3.5" /> ফিল্টার মুছুন
                </button>
              )}
            </div>
          )}

          {/* ═══════════ AUCTION GRID ═══════════ */}
          {visible.length === 0 ? (
            <EmptyState isFiltered={isFiltered} onClear={clearFilters} />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((a) => (
                <AuctionCard
                  key={a.auction_id}
                  a={a}
                  onRefresh={() => load(true)}
                />
              ))}
            </div>
          )}

          {/* ═══════════ CTA FOOTER ═══════════ */}
          {visible.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-bold text-emerald-800">
                  আরো নিলাম তৈরি করুন
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  আপনার কৃষি পণ্যের ন্যায্য মূল্য নিশ্চিত করুন
                </p>
              </div>
              <Link
                to="/app/auctions/create"
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition shadow-sm flex-shrink-0"
              >
                <Plus className="h-4 w-4" /> নতুন নিলাম তৈরি করুন
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
