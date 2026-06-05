// src/components/Auctions/AuctionShared.jsx
import React from "react";
import { Link } from "react-router";
import { Clock, User, TrendingUp, Gavel } from "lucide-react";
import { parseAuctionEndTime } from "../../shared/lib/auctionDatetime";
import { resolveMediaUrl } from "../../shared/lib/mediaUrl";

// ====================== STATUS BADGE ======================
export const StatusBadge = ({ status, compact = false }) => {
  let label = "সক্রিয়";
  let color = "bg-emerald-100 text-emerald-700";

  if (status === 1 || status === "scheduled") {
    label = "নির্ধারিত";
    color = "bg-blue-100 text-blue-700";
  } else if (status === 3 || status === "ended") {
    label = "শেষ হয়েছে";
    color = "bg-gray-100 text-gray-600";
  } else if (status === 4 || status === "cancelled") {
    label = "বাতিল";
    color = "bg-red-100 text-red-600";
  }

  return (
    <span
      className={`font-semibold rounded-full ${color} ${
        compact ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1"
      }`}
    >
      {label}
    </span>
  );
};

// ====================== COUNTDOWN TIMER ======================
export const CountdownTimer = ({ endTime, onExpire, compact = false }) => {
  const [timeLeft, setTimeLeft] = React.useState("");
  const expiredRef = React.useRef(false);

  React.useEffect(() => {
    expiredRef.current = false;

    const tick = () => {
      const end = parseAuctionEndTime(endTime);
      if (!end || Number.isNaN(end.getTime())) {
        setTimeLeft("—");
        return;
      }

      const diff = end.getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft("সময় শেষ");
        if (!expiredRef.current) {
          expiredRef.current = true;
          onExpire?.();
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}ঘ ${minutes}ম ${seconds}স`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  const isExpired = timeLeft === "সময় শেষ";

  return (
    <div
      className={`flex items-center font-medium shrink-0 ${
        compact ? "gap-1 text-[11px]" : "gap-1.5 text-sm"
      } ${isExpired ? "text-red-600" : "text-orange-600"}`}
    >
      <Clock size={compact ? 13 : 16} />
      <span className="tabular-nums">{timeLeft || "—"}</span>
    </div>
  );
};

// ====================== BID HISTORY ROW ======================
export const BidHistoryRow = ({ bid, index = 0, currentUserId }) => {
  const isMine = currentUserId && bid.bidder_id === currentUserId;
  const isTop = index === 0 || bid.is_winning;

  return (
    <div
      className={`flex justify-between items-center p-4 rounded-2xl transition ${
        isTop
          ? "bg-emerald-50 border border-emerald-200 ring-1 ring-emerald-100"
          : isMine
            ? "bg-amber-50 border border-amber-100"
            : "bg-gray-50 hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isTop
              ? "bg-emerald-600 text-white"
              : "bg-emerald-100 text-emerald-600"
          }`}
        >
          <User size={16} />
        </div>
        <div>
          <p className="font-medium text-gray-800">
            {bid.bidder_name}
            {isMine && (
              <span className="ml-1.5 text-[10px] font-bold text-amber-600">
                (আপনি)
              </span>
            )}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(bid.created_at).toLocaleString("bn-BD")}
          </p>
        </div>
      </div>
      <p
        className={`font-bold text-lg ${isTop ? "text-emerald-700" : "text-emerald-600"}`}
      >
        ৳{Number(bid.bid_amount).toLocaleString("bn-BD")}
      </p>
    </div>
  );
};

// ====================== EMPTY STATE ======================
export const EmptyState = ({ message = "কোনো নিলাম পাওয়া যায়নি" }) => (
  <div className="text-center py-20">
    <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
      <Gavel size={40} className="text-gray-300" />
    </div>
    <p className="text-xl text-gray-500">{message}</p>
    <p className="text-gray-400 mt-2">
      পরে আবার চেক করুন অথবা নতুন নিলাম তৈরি করুন
    </p>
  </div>
);

// ====================== MAIN AUCTION CARD ======================
const AuctionShared = ({ auction, showBidButton = true }) => {
  const rawImg = auction.primary_image || auction.images?.[0]?.url;
  const img = rawImg ? resolveMediaUrl(rawImg) || rawImg : null;
  const description =
    auction.description?.trim() || auction.product_description?.trim() || "";

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:border-emerald-200/70 hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {img ? (
          <img
            src={img}
            alt={auction.product_name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : null}
        <div className="absolute top-2 right-2">
          <StatusBadge
            status={auction.status_id || auction.status_name}
            compact
          />
        </div>
        {(auction.bid_count ?? 0) > 0 && (
          <div className="absolute bottom-2 left-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm">
            {auction.bid_count} বিড
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800 transition group-hover:text-emerald-700">
          {auction.product_name}
        </h3>

        {description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        ) : null}

        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
          <User size={13} className="shrink-0 text-slate-400" />
          <span className="truncate">
            {auction.seller_name || "অজানা বিক্রেতা"}
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
              বর্তমান দাম
            </p>
            <p className="text-xl font-black leading-tight text-emerald-600">
              ৳
              {Number(
                auction.current_price || auction.starting_price,
              ).toLocaleString("bn-BD")}
            </p>
          </div>
          <CountdownTimer endTime={auction.end_time} compact />
        </div>

        {showBidButton && (
          <Link
            to={`/app/auctions/${auction.auction_id}`}
            className="mt-3 flex h-10 w-full items-center justify-center rounded-xl bg-orange-600 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 active:scale-[0.98]"
          >
            বিড করুন
          </Link>
        )}
      </div>
    </div>
  );
};

export default AuctionShared;
