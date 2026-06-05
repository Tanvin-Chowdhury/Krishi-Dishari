import {
  useEffect,
  useState,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";
import {
  Gavel,
  Plus,
  RefreshCw,
  Search,
  X,
  Heart,
  Flame,
  Zap,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  User,
  ChevronRight,
  Trophy,
  Activity,
  Package,
  BarChart2,
  SlidersHorizontal,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import { auctionApi } from "../../shared/services/auctionApi";
import { AuthContext } from "../../Provider/AuthContext";
import { useAuctionSocket } from "../../context/AuctionSocketContext";
import { parseAuctionEndTime } from "../../shared/lib/auctionDatetime";
import { resolveMediaUrl } from "../../shared/lib/mediaUrl";
import PageContainer from "../../shared/ui/PageContainer";

/* ─── helpers ─────────────────────────────────────────────── */
const fmt = (n) => Number(n ?? 0).toLocaleString("bn-BD");
const fmtMon = (n) => `৳${fmt(Math.round(n ?? 0))}`;
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s} সে. আগে`;
  if (s < 3600) return `${Math.floor(s / 60)} মি. আগে`;
  return `${Math.floor(s / 3600)} ঘ. আগে`;
};
const hoursLeft = (endTime) => {
  const end = parseAuctionEndTime(endTime);
  if (!end || isNaN(end)) return Infinity;
  return (end - Date.now()) / 3600000;
};
const isLive = (a) =>
  a.status_id === 2 || a.status_name === "active" || !a.status_id;
const isEndingSoon = (a, h = 24) =>
  hoursLeft(a.end_time) < h && hoursLeft(a.end_time) > 0;

/* ─── Loading skeletons ───────────────────────────────────── */
function CardSk() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm animate-pulse">
      <div className="aspect-[4/3] bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-7 bg-gray-100 rounded w-2/3" />
        <div className="h-8 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

/* ─── KPI Card ────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, from, to, pulse }) {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${from} ${to} p-4 shadow-sm hover:-translate-y-0.5 transition-transform`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-white/90">{label}</p>
          <p className="mt-1 text-xl font-extrabold text-white drop-shadow-sm">
            {value}
          </p>
          {sub && <p className="mt-0.5 text-[10px] text-white/75">{sub}</p>}
        </div>
        <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/30 shadow-inner">
          <Icon
            className="text-white drop-shadow-sm"
            style={{ width: 17, height: 17 }}
          />
          {pulse && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-white/40 animate-ping" />
          )}
          {pulse && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-white/40" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Live countdown (block style) ───────────────────────── */
function TimeBlock({ val, label }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-emerald-600 px-1.5 py-1 min-w-[30px]">
      <span className="font-black text-white text-sm leading-tight tabular-nums">
        {String(val).padStart(2, "0")}
      </span>
      <span className="text-[7px] text-emerald-200 mt-0.5 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

function AuctionCountdown({ endTime, compact = false }) {
  const [parts, setParts] = useState({
    d: 0,
    h: 0,
    m: 0,
    s: 0,
    expired: false,
  });
  const timerRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      const end = parseAuctionEndTime(endTime);
      if (!end || isNaN(end.getTime())) {
        setParts((p) => ({ ...p, expired: true }));
        return;
      }
      const diff = end - Date.now();
      if (diff <= 0) {
        setParts({ d: 0, h: 0, m: 0, s: 0, expired: true });
        return;
      }
      setParts({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [endTime]);

  if (parts.expired) {
    return (
      <div className="flex items-center gap-1 text-red-500 text-xs font-bold">
        <Clock className="h-3 w-3" /> সময় শেষ
      </div>
    );
  }

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1 text-xs font-bold tabular-nums
        ${hoursLeft(endTime) < 2 ? "text-red-500" : hoursLeft(endTime) < 6 ? "text-orange-500" : "text-slate-600"}`}
      >
        <Clock className="h-3 w-3 flex-shrink-0" />
        {parts.d > 0 ? `${parts.d}দ ` : ""}
        {parts.h}ঘ {parts.m}ম {parts.s}স
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {parts.d > 0 && (
        <>
          <TimeBlock val={parts.d} label="দিন" />
          <span className="text-gray-500 font-bold">:</span>
        </>
      )}
      <TimeBlock val={parts.h} label="ঘন্টা" />
      <span className="text-gray-500 font-bold text-xs">:</span>
      <TimeBlock val={parts.m} label="মিনিট" />
      <span className="text-gray-500 font-bold text-xs">:</span>
      <TimeBlock val={parts.s} label="সেকেন্ড" />
    </div>
  );
}

/* ─── Quick bid buttons ───────────────────────────────────── */
function QuickBidButtons({ auction, user, onBidPlaced }) {
  const [busy, setBusy] = useState(null);
  const base = parseFloat(auction.current_price || auction.starting_price || 0);

  const place = async (step) => {
    if (!user) {
      toast.error("বিড করতে প্রথমে লগইন করুন");
      return;
    }
    const amount = base + step;
    setBusy(step);
    try {
      await auctionApi.placeBid(auction.auction_id, amount);
      toast.success(`${fmtMon(amount)} বিড সফল হয়েছে!`);
      onBidPlaced?.(auction.auction_id, amount);
    } catch (err) {
      toast.error(err.message || "বিড ব্যর্থ হয়েছে");
    } finally {
      setBusy(null);
    }
  };

  const STEPS = [
    { val: 50, label: "+৫০" },
    { val: 100, label: "+১০০" },
    { val: 150, label: "+১৫০" },
  ];

  return (
    <div className="flex gap-1.5">
      {STEPS.map(({ val: s, label }) => (
        <button
          key={s}
          disabled={!!busy}
          onClick={(e) => {
            e.preventDefault();
            place(s);
          }}
          className="flex-1 rounded-lg border border-orange-200 bg-orange-50 py-1 text-[11px] font-bold text-orange-600
            hover:bg-orange-100 disabled:opacity-50 transition active:scale-95"
        >
          {busy === s ? "…" : label}
        </button>
      ))}
    </div>
  );
}

/* ─── Auction Card ────────────────────────────────────────── */
function AuctionCard({ auction, user, watchlist, onToggleWatch, onBidPlaced }) {
  const rawImg = auction.primary_image || auction.images?.[0]?.url;
  const img = rawImg ? resolveMediaUrl(rawImg) || rawImg : null;
  const live = isLive(auction);
  const soon = isEndingSoon(auction, 6);
  const hot = (auction.bid_count || 0) >= 5;
  const watched = watchlist.includes(auction.auction_id);
  const priceGain = auction.starting_price
    ? ((parseFloat(auction.current_price) -
        parseFloat(auction.starting_price)) /
        parseFloat(auction.starting_price)) *
      100
    : 0;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm
      hover:shadow-xl hover:-translate-y-1 transition-all duration-200
      ${soon ? "border-orange-200" : hot ? "border-amber-100" : "border-gray-100"}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50">
        {img ? (
          <img
            src={img}
            alt={auction.product_name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-16 w-16 text-gray-200" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {live && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              <span className="text-[11px] font-extrabold tracking-widest text-white">
                LIVE
              </span>
            </div>
          )}
          {soon && (
            <div className="flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5">
              <Zap className="h-2.5 w-2.5 text-white" />
              <span className="text-[10px] font-extrabold text-white">
                ENDING SOON
              </span>
            </div>
          )}
          {hot && (
            <div className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5">
              <Flame className="h-2.5 w-2.5 text-white" />
              <span className="text-[10px] font-extrabold text-white">
                HOT BID
              </span>
            </div>
          )}
        </div>

        {/* Watchlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleWatch(auction.auction_id);
          }}
          className={`absolute top-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition
            ${watched ? "bg-red-500 text-white" : "bg-white/90 text-gray-400 hover:text-red-500"}`}
        >
          <Heart className={`h-3.5 w-3.5 ${watched ? "fill-current" : ""}`} />
        </button>

        {/* Bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 backdrop-blur-sm">
            <Gavel className="h-3 w-3 text-white" />
            <span className="text-[11px] font-bold text-white">
              {fmt(auction.bid_count || 0)} বিড
            </span>
          </div>
          {priceGain > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 backdrop-blur-sm">
              <TrendingUp className="h-3 w-3 text-white" />
              <span className="text-[10px] font-bold text-white">
                +{priceGain.toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5">
        {/* Product name */}
        <h3 className="line-clamp-1 font-extrabold text-gray-900 group-hover:text-emerald-700 transition">
          {auction.product_name}
        </h3>

        {/* Seller + quantity */}
        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[100px]">
              {auction.seller_name || "বিক্রেতা"}
            </span>
          </div>
          {auction.quantity && (
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>
                {fmt(auction.quantity)} {auction.unit || "কেজি"}
              </span>
            </div>
          )}
        </div>

        {/* Price section */}
        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">
              বর্তমান বিড
            </p>
            <p className="text-2xl font-black leading-tight text-emerald-600">
              {fmtMon(auction.current_price || auction.starting_price)}
            </p>
            {auction.starting_price &&
              parseFloat(auction.current_price) >
                parseFloat(auction.starting_price) && (
                <p className="text-[10px] text-gray-400 line-through">
                  শুরু: {fmtMon(auction.starting_price)}
                </p>
              )}
          </div>
          {auction.highest_bidder_name && (
            <div className="flex flex-col items-end">
              <p className="text-[9px] text-gray-400">সর্বোচ্চ বিডার</p>
              <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5">
                <Trophy className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-700 max-w-[70px] truncate">
                  {auction.highest_bidder_name}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Countdown */}
        <div className="mt-2.5 flex items-center justify-between">
          <p className="text-[10px] text-gray-400 font-medium">সময় বাকি</p>
          <AuctionCountdown endTime={auction.end_time} />
        </div>

        {/* Price progress bar */}
        {auction.starting_price && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(3, priceGain * 2))}%` }}
            />
          </div>
        )}

        {/* Quick bid */}
        <div className="mt-3">
          <p className="mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
            দ্রুত বিড করুন
          </p>
          <QuickBidButtons
            auction={auction}
            user={user}
            onBidPlaced={onBidPlaced}
          />
        </div>

        {/* Main CTA */}
        <Link
          to={`/app/auctions/${auction.auction_id}`}
          className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500
            text-sm font-bold text-white shadow-sm shadow-orange-200 hover:from-orange-600 hover:to-rose-600 transition active:scale-[0.98]"
        >
          <Gavel className="h-4 w-4" /> বিড করুন
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

/* ─── Ending soon row (horizontal scroll section) ─────────── */
function EndingSoonSection({
  auctions,
  user,
  watchlist,
  onToggleWatch,
  onBidPlaced,
}) {
  const items = auctions.filter((a) => isEndingSoon(a, 6)).slice(0, 5);
  if (!items.length) return null;
  return (
    <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-rose-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-5 w-5 text-orange-500" />
        <h2 className="font-extrabold text-orange-800">শেষ হতে চলেছে</h2>
        <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
          {items.length}
        </span>
        <span className="ml-auto text-xs text-orange-600">
          ৬ ঘন্টার মধ্যে শেষ
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {items.map((a) => {
          const rawImg = a.primary_image || a.images?.[0]?.url;
          const img = rawImg ? resolveMediaUrl(rawImg) || rawImg : null;
          return (
            <Link
              key={a.auction_id}
              to={`/app/auctions/${a.auction_id}`}
              className="flex-shrink-0 w-44 overflow-hidden rounded-xl border border-orange-200 bg-white shadow-sm hover:shadow-md transition group"
            >
              <div className="relative h-24 overflow-hidden bg-orange-50">
                {img ? (
                  <img
                    src={img}
                    alt={a.product_name}
                    className="h-full w-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-8 w-8 text-orange-200" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-orange-500 px-1.5 py-0.5">
                  <Zap className="h-2.5 w-2.5 text-white" />
                  <AuctionCountdown endTime={a.end_time} compact />
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-xs font-bold text-gray-800 line-clamp-1">
                  {a.product_name}
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-orange-600">
                  {fmtMon(a.current_price || a.starting_price)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Most competitive section ────────────────────────────── */
function MostCompetitiveSection({ auctions }) {
  const top = [...auctions]
    .sort((a, b) => (b.bid_count || 0) - (a.bid_count || 0))
    .slice(0, 5);
  if (!top.length) return null;
  return (
    <div className="rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Flame className="h-5 w-5 text-amber-500" />
        <h2 className="font-extrabold text-amber-800">সবচেয়ে বেশি বিড</h2>
      </div>
      <div className="space-y-2">
        {top.map((a, i) => {
          const rawImg = a.primary_image || a.images?.[0]?.url;
          const img = rawImg ? resolveMediaUrl(rawImg) || rawImg : null;
          return (
            <Link
              key={a.auction_id}
              to={`/app/auctions/${a.auction_id}`}
              className="flex items-center gap-3 rounded-xl bg-white p-2.5 shadow-sm hover:shadow-md transition group"
            >
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-extrabold text-sm
                ${i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-gray-300 text-white" : "bg-orange-200 text-orange-700"}`}
              >
                {i + 1}
              </div>
              <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-amber-50">
                {img ? (
                  <img
                    src={img}
                    alt={a.product_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-full w-full p-2 text-amber-200" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-amber-700 transition">
                  {a.product_name}
                </p>
                <p className="text-[10px] text-gray-400">{a.seller_name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-extrabold text-emerald-600">
                  {fmtMon(a.current_price)}
                </p>
                <div className="flex items-center justify-end gap-1">
                  <Gavel className="h-3 w-3 text-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600">
                    {a.bid_count} বিড
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Live feed item ──────────────────────────────────────── */
function FeedItem({ item }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 mt-0.5">
        <Gavel className="h-3.5 w-3.5 text-orange-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-gray-800 line-clamp-1">
          {item.bidderName}
        </p>
        <p className="text-[10px] text-gray-500 line-clamp-1">
          {item.productName}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <p className="text-xs font-extrabold text-emerald-600">
          {fmtMon(item.amount)}
        </p>
        <p className="text-[9px] text-gray-400">{timeAgo(item.time)}</p>
      </div>
    </div>
  );
}

/* ─── Right sidebar ───────────────────────────────────────── */
function RightSidebar({ auctions, liveFeed }) {
  const trending = useMemo(
    () =>
      [...auctions]
        .sort((a, b) => (b.bid_count || 0) - (a.bid_count || 0))
        .slice(0, 4),
    [auctions],
  );
  const endingToday = useMemo(
    () => auctions.filter((a) => isEndingSoon(a, 24)).slice(0, 4),
    [auctions],
  );
  const highestBid = useMemo(
    () => Math.max(0, ...auctions.map((a) => parseFloat(a.current_price || 0))),
    [auctions],
  );
  const totalBids = useMemo(
    () => auctions.reduce((s, a) => s + (a.bid_count || 0), 0),
    [auctions],
  );

  return (
    <div className="space-y-4">
      {/* Today's Stats */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="h-4 w-4 text-emerald-500" />
          <h3 className="font-bold text-gray-800 text-sm">আজকের পরিসংখ্যান</h3>
        </div>
        <div className="space-y-2.5">
          {[
            {
              label: "মোট নিলাম",
              val: fmt(auctions.length),
              color: "text-blue-600",
            },
            { label: "মোট বিড", val: fmt(totalBids), color: "text-amber-600" },
            {
              label: "সর্বোচ্চ বিড",
              val: fmtMon(highestBid),
              color: "text-emerald-600",
            },
            {
              label: "শেষ হচ্ছে আজ",
              val: fmt(endingToday.length),
              color: "text-orange-600",
            },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-xs text-gray-500">{s.label}</span>
              <span className={`text-xs font-extrabold ${s.color}`}>
                {s.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-red-500" />
          <h3 className="font-bold text-gray-800 text-sm">লাইভ বিড ফিড</h3>
          <span className="relative flex h-2 w-2 ml-auto">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        </div>
        {liveFeed.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-4">
            নতুন বিডের অপেক্ষায়…
          </p>
        ) : (
          <div>
            {liveFeed.slice(0, 8).map((f) => (
              <FeedItem key={f.id} item={f} />
            ))}
          </div>
        )}
      </div>

      {/* Trending Auctions */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-violet-500" />
          <h3 className="font-bold text-gray-800 text-sm">ট্রেন্ডিং নিলাম</h3>
        </div>
        {trending.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-2">
            কোনো নিলাম নেই
          </p>
        ) : (
          <div className="space-y-2">
            {trending.map((a) => (
              <Link
                key={a.auction_id}
                to={`/app/auctions/${a.auction_id}`}
                className="flex items-center gap-2.5 rounded-xl hover:bg-gray-50 p-1.5 transition group"
              >
                <div className="h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-violet-50">
                  {(() => {
                    const rawImg = a.primary_image || a.images?.[0]?.url;
                    const img = rawImg
                      ? resolveMediaUrl(rawImg) || rawImg
                      : null;
                    return img ? (
                      <img
                        src={img}
                        alt={a.product_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package className="h-full w-full p-2 text-violet-200" />
                    );
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-violet-700 transition">
                    {a.product_name}
                  </p>
                  <div className="flex items-center gap-1">
                    <Gavel className="h-2.5 w-2.5 text-amber-400" />
                    <span className="text-[10px] text-gray-400">
                      {a.bid_count || 0} বিড
                    </span>
                  </div>
                </div>
                <p className="text-xs font-extrabold text-emerald-600 flex-shrink-0">
                  {fmtMon(a.current_price)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Ending Today */}
      {endingToday.length > 0 && (
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-orange-500" />
            <h3 className="font-bold text-orange-800 text-sm">আজ শেষ হচ্ছে</h3>
          </div>
          <div className="space-y-2">
            {endingToday.map((a) => (
              <Link
                key={a.auction_id}
                to={`/app/auctions/${a.auction_id}`}
                className="flex items-center justify-between rounded-xl bg-white p-2 shadow-sm hover:shadow-md transition group"
              >
                <span className="text-xs font-bold text-gray-700 group-hover:text-orange-700 transition line-clamp-1 flex-1 mr-2">
                  {a.product_name}
                </span>
                <AuctionCountdown endTime={a.end_time} compact />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Empty state ─────────────────────────────────────────── */
function EmptyAuctions({ isFarmer, onRefresh }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-24 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
        <Gavel className="h-10 w-10 text-emerald-300" />
      </div>
      <p className="text-xl font-bold text-gray-700">
        বর্তমানে কোনো লাইভ নিলাম নেই
      </p>
      <p className="mt-1 text-sm text-gray-400">
        নতুন নিলাম শুরু হলে এখানে দেখা যাবে
      </p>
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          <RefreshCw className="h-4 w-4" /> রিফ্রেশ
        </button>
        {isFarmer && (
          <Link
            to="/app/auctions/create"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition shadow-sm"
          >
            <Plus className="h-4 w-4" /> নতুন নিলাম তৈরি করুন
          </Link>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────── */
const AuctionList = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useAuctionSocket();
  const isFarmer = user?.role_id === 1;

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [catFilter, setCatFilter] = useState("");
  const [liveFeed, setLiveFeed] = useState([]);

  const [watchlist, setWatchlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("auction_watchlist") || "[]");
    } catch {
      return [];
    }
  });

  const toggleWatch = useCallback((id) => {
    setWatchlist((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      localStorage.setItem("auction_watchlist", JSON.stringify(next));
      toast.success(
        next.includes(id)
          ? "ওয়াচলিস্টে যুক্ত"
          : "ওয়াচলিস্ট থেকে সরানো হয়েছে",
      );
      return next;
    });
  }, []);

  /* ── fetch ── */
  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAuctions();
      const list = data.success
        ? data.auctions || []
        : Array.isArray(data)
          ? data
          : [];
      setAuctions(list);
    } catch {
      setError("নিলাম লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  /* ── socket ── */
  useEffect(() => {
    if (!socket) return;
    const onNew = (auction) => {
      setAuctions((prev) =>
        prev.some((a) => a.auction_id === auction.auction_id)
          ? prev
          : [auction, ...prev],
      );
    };
    const onBid = (payload) => {
      setAuctions((prev) =>
        prev.map((a) =>
          a.auction_id === payload.auction_id
            ? {
                ...a,
                current_price: payload.current_price,
                bid_count: payload.bid_count ?? (a.bid_count || 0) + 1,
                highest_bidder_name:
                  payload.bidder_name || a.highest_bidder_name,
              }
            : a,
        ),
      );
      // Add to live feed
      const auc = auctions.find((a) => a.auction_id === payload.auction_id);
      setLiveFeed((prev) =>
        [
          {
            id: Date.now() + Math.random(),
            auctionId: payload.auction_id,
            bidderName: payload.bidder_name || "বিডার",
            productName: auc?.product_name || "নিলাম পণ্য",
            amount: payload.current_price,
            time: new Date(),
          },
          ...prev,
        ].slice(0, 12),
      );
    };
    const onClosed = (payload) => {
      setAuctions((prev) =>
        prev.filter((a) => a.auction_id !== payload.auction_id),
      );
    };
    socket.on("auction:new", onNew);
    socket.on("auction:bid", onBid);
    socket.on("bid:updated", onBid);
    socket.on("auction:closed", onClosed);
    return () => {
      socket.off("auction:new", onNew);
      socket.off("auction:bid", onBid);
      socket.off("bid:updated", onBid);
      socket.off("auction:closed", onClosed);
    };
  }, [socket, auctions]);

  const handleBidPlaced = useCallback((auctionId, amount) => {
    setAuctions((prev) =>
      prev.map((a) =>
        a.auction_id === auctionId
          ? { ...a, current_price: amount, bid_count: (a.bid_count || 0) + 1 }
          : a,
      ),
    );
  }, []);

  /* ── KPIs ── */
  const kpi = useMemo(
    () => ({
      active: auctions.length,
      totalBids: auctions.reduce((s, a) => s + (a.bid_count || 0), 0),
      highestBid: Math.max(
        0,
        ...auctions.map((a) => parseFloat(a.current_price || 0)),
      ),
      endingSoon: auctions.filter((a) => isEndingSoon(a, 6)).length,
    }),
    [auctions],
  );

  /* ── filtered list ── */
  const visible = useMemo(() => {
    let arr = [...auctions];
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (a) =>
          a.product_name?.toLowerCase().includes(q) ||
          a.seller_name?.toLowerCase().includes(q),
      );
    }
    if (catFilter)
      arr = arr.filter(
        (a) => (a.category || "").toLowerCase() === catFilter.toLowerCase(),
      );
    if (sortBy === "newest")
      arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (sortBy === "price")
      arr.sort((a, b) => b.current_price - a.current_price);
    if (sortBy === "bids")
      arr.sort((a, b) => (b.bid_count || 0) - (a.bid_count || 0));
    if (sortBy === "ending")
      arr.sort((a, b) => hoursLeft(a.end_time) - hoursLeft(b.end_time));
    if (sortBy === "watchlist")
      arr = arr.filter((a) => watchlist.includes(a.auction_id));
    return arr;
  }, [auctions, search, catFilter, sortBy, watchlist]);

  /* ─── render ─── */
  return (
    <PageContainer maxWidth="max-w-[1400px]">
      <div className="space-y-5">
        {/* ═══ HERO BANNER ═══ */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-6 shadow-md">
          {/* subtle dot pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #10b981 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          {/* emerald glow top-right */}
          <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-emerald-100 opacity-60 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-red-500 px-3 py-1 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  <span className="text-[11px] font-extrabold tracking-widest text-white">
                    LIVE
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900">
                  কৃষি নিলাম বাজার
                </h1>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                সরাসরি কৃষকের পণ্যে বিড করুন — রিয়েল-টাইম আপডেট
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchAuctions}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />{" "}
                রিফ্রেশ
              </button>
              {isFarmer && (
                <Link
                  to="/app/auctions/create"
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition shadow-sm"
                >
                  <Plus className="h-4 w-4" /> নতুন নিলাম
                </Link>
              )}
              {watchlist.length > 0 && (
                <button
                  onClick={() => setSortBy("watchlist")}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-100 transition"
                >
                  <Heart className="h-4 w-4 fill-current" /> {watchlist.length}
                </button>
              )}
            </div>
          </div>

          {/* KPI strip */}
          <div className="relative mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              icon={Sparkles}
              label="সক্রিয় নিলাম"
              value={fmt(kpi.active)}
              sub="এখন লাইভ"
              from="from-blue-400"
              to="to-indigo-400"
              pulse
            />
            <KpiCard
              icon={Gavel}
              label="মোট বিড"
              value={fmt(kpi.totalBids)}
              sub="সকল নিলাম"
              from="from-amber-400"
              to="to-orange-400"
            />
            <KpiCard
              icon={DollarSign}
              label="সর্বোচ্চ বিড"
              value={fmtMon(kpi.highestBid)}
              sub="আজকের সর্বোচ্চ"
              from="from-emerald-400"
              to="to-teal-400"
            />
            <KpiCard
              icon={Zap}
              label="শেষ হচ্ছে শীঘ্রই"
              value={fmt(kpi.endingSoon)}
              sub="৬ ঘন্টার মধ্যে"
              from="from-rose-400"
              to="to-pink-400"
            />
          </div>
        </div>

        {/* ═══ SEARCH + FILTER ═══ */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="নিলাম বা বিক্রেতা খুঁজুন…"
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
            {[
              { val: "newest", label: "নতুন আগে" },
              { val: "ending", label: "শেষ হচ্ছে" },
              { val: "price", label: "সর্বোচ্চ মূল্য" },
              { val: "bids", label: "সবচেয়ে বেশি বিড" },
              { val: "watchlist", label: `❤ ওয়াচলিস্ট` },
            ].map((s) => (
              <button
                key={s.val}
                onClick={() => setSortBy(s.val)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition
                  ${
                    sortBy === s.val
                      ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-emerald-300 hover:text-emerald-700"
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ SPECIAL SECTIONS ═══ */}
        {!loading && !error && auctions.length > 0 && (
          <>
            <EndingSoonSection
              auctions={auctions}
              user={user}
              watchlist={watchlist}
              onToggleWatch={toggleWatch}
              onBidPlaced={handleBidPlaced}
            />
            <MostCompetitiveSection auctions={auctions} />
          </>
        )}

        {/* ═══ MAIN LAYOUT ═══ */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <CardSk key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 py-16 text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
            <p className="font-bold text-red-700">{error}</p>
            <button
              onClick={fetchAuctions}
              className="mt-4 rounded-xl bg-red-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-red-600 transition"
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-4">
            {/* Cards grid */}
            <div className="lg:col-span-3">
              {visible.length === 0 ? (
                <EmptyAuctions isFarmer={isFarmer} onRefresh={fetchAuctions} />
              ) : (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {visible.length} টি নিলাম
                      {auctions.length !== visible.length
                        ? ` (মোট ${auctions.length} থেকে)`
                        : ""}
                    </p>
                    {(search || catFilter) && (
                      <button
                        onClick={() => {
                          setSearch("");
                          setCatFilter("");
                        }}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        <X className="h-3.5 w-3.5" /> ফিল্টার মুছুন
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    {visible.map((auction) => (
                      <AuctionCard
                        key={auction.auction_id}
                        auction={auction}
                        user={user}
                        watchlist={watchlist}
                        onToggleWatch={toggleWatch}
                        onBidPlaced={handleBidPlaced}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right sidebar */}
            <div className="lg:col-span-1">
              <RightSidebar auctions={auctions} liveFeed={liveFeed} />
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default AuctionList;
