// import React, { useEffect, useState, useContext } from "react";
// import { useParams } from "react-router-dom";
// import { toast } from "react-toastify";
// import { AuthContext } from "../../Provider/AuthContext";
// import { useSocket } from "../../context/SocketContext";
// import api from "../../services/api";

// const AuctionDetail = () => {
//   const { id } = useParams();
//   const { user } = useContext(AuthContext);
//   const socket = useSocket();

//   const [auction, setAuction] = useState(null);
//   const [bids, setBids] = useState([]);
//   const [bidAmount, setBidAmount] = useState("");
//   const [loading, setLoading] = useState(true);

//   // Initial Data Load
//   useEffect(() => {
//     fetchAuction();
//     fetchBids();
//   }, [id]);

//   // Real-time Socket
//   useEffect(() => {
//     if (!socket || !id) return;

//     socket.emit("joinAuction", id);

//     socket.on("auction:bid", (data) => {
//       setAuction((prev) =>
//         prev ? { ...prev, current_price: data.current_price } : prev,
//       );
//       setBids((prev) => [data, ...prev]);
//       toast.info(data.message, { autoClose: 4000 });
//     });

//     return () => socket.off("auction:bid");
//   }, [socket, id]);

//   const fetchAuction = async () => {
//     try {
//       const data = await api.getAuction(id);
//       setAuction(data);
//     } catch (err) {
//       toast.error("নিলাম লোড করতে সমস্যা হয়েছে");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchBids = async () => {
//     try {
//       const data = await fetch(
//         `http://localhost:5000/api/auctions/${id}/bids`,
//       ).then((r) => r.json());
//       setBids(data);
//     } catch (err) {}
//   };

//   const handleBid = async () => {
//     if (!bidAmount) return toast.error("বিডের পরিমাণ দিন");

//     try {
//       await api.placeBid(id, Number(bidAmount));
//       setBidAmount("");
//       toast.success("বিড সফল হয়েছে!");
//     } catch (err) {
//       toast.error(err.message || "বিড দিতে ব্যর্থ");
//     }
//   };

//   if (loading)
//     return <div className="text-center py-20 text-xl">লোড হচ্ছে...</div>;

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
//         <div className="bg-emerald-700 text-white p-10">
//           <h1 className="text-4xl font-bold">{auction?.product_name}</h1>
//           <p className="mt-2 text-emerald-100">
//             বিক্রেতা: {auction?.seller_name}
//           </p>
//         </div>

//         <div className="p-10 grid md:grid-cols-2 gap-10">
//           <div>
//             <p className="text-gray-500 text-lg">বর্তমান দাম</p>
//             <p className="text-6xl font-bold text-emerald-600 my-4">
//               ৳{Number(auction?.current_price).toLocaleString("bn-BD")}
//             </p>

//             <input
//               type="number"
//               value={bidAmount}
//               onChange={(e) => setBidAmount(e.target.value)}
//               className="w-full p-6 text-2xl border border-gray-300 rounded-2xl focus:border-emerald-500"
//               placeholder="বিডের পরিমাণ লিখুন"
//             />
//             <button
//               onClick={handleBid}
//               className="mt-6 w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-2xl text-xl font-bold"
//             >
//               বিড করুন
//             </button>
//           </div>

//           <div>
//             <h3 className="font-bold text-2xl mb-4">বিডের ইতিহাস</h3>
//             <div className="space-y-4 max-h-96 overflow-y-auto">
//               {bids.length === 0 ? (
//                 <p>কোনো বিড নেই</p>
//               ) : (
//                 bids.map((b, i) => (
//                   <div
//                     key={i}
//                     className="bg-gray-50 p-5 rounded-2xl flex justify-between"
//                   >
//                     <div>
//                       <p>{b.bidder_name}</p>
//                       <small className="text-gray-500">
//                         {new Date(b.created_at).toLocaleTimeString("bn-BD")}
//                       </small>
//                     </div>
//                     <p className="font-bold text-xl text-emerald-600">
//                       ৳{Number(b.bid_amount).toLocaleString("bn-BD")}
//                     </p>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AuctionDetail;

import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { toast } from "react-toastify";
import {
  Gavel,
  Clock,
  Users,
  MapPin,
  Trophy,
  ArrowLeft,
  TrendingUp,
  Package,
  Wifi,
  WifiOff,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { AuthContext } from "../../Provider/AuthContext";
import { useAuctionSocket } from "../../context/AuctionSocketContext";
import api from "../../services/api";
import { remainingMsUntilEnd } from '../../shared/lib/auctionDatetime';
import { resolveMediaUrl } from '../../shared/lib/mediaUrl';
import {
  StatusBadge,
  CountdownTimer,
  BidHistoryRow,
  EmptyState,
} from './AuctionShared';

/* ── Bid input panel ─────────────────────────────────────────── */
function BidPanel({ auction, onBid, loading }) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const minBid =
    parseFloat(auction.current_price) + parseFloat(auction.min_increment);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || submitting) return;
    if (!amount) return toast.error("বিডের পরিমাণ দিন");
    const value = parseFloat(amount);
    if (value < minBid)
      return toast.error(
        `সর্বনিম্ন বিড ৳${minBid.toLocaleString("bn-BD")} হতে হবে`,
      );
    setSubmitting(true);
    try {
      const ok = await onBid(value);
      if (ok !== false) setAmount("");
    } finally {
      setSubmitting(false);
    }
  };

  const quickAmounts = [
    minBid,
    minBid + parseFloat(auction.min_increment),
    minBid + parseFloat(auction.min_increment) * 2,
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Min bid hint */}
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-slate-500">সর্বনিম্ন বিড</span>
        <span className="font-bold text-emerald-700">
          ৳{minBid.toLocaleString("bn-BD")}
        </span>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2 flex-wrap">
        {quickAmounts.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAmount(String(q))}
            className={`flex-1 text-[12px] font-semibold py-2 px-3 rounded-xl border transition-all ${
              parseFloat(amount) === q
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700"
            }`}
          >
            ৳{q.toLocaleString("bn-BD")}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[16px]">
          ৳
        </span>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min={minBid}
          step={parseFloat(auction.min_increment)}
          placeholder={`${minBid} বা বেশি`}
          className="w-full pl-8 pr-4 py-3 text-[15px] font-semibold border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <button
        type="submit"
        disabled={loading || submitting || !amount}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-[15px] transition-all active:scale-98 shadow-md shadow-emerald-200"
      >
        {loading || submitting ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Gavel size={17} /> বিড করুন
          </>
        )}
      </button>
    </form>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function AuctionDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { socket, isConnected } = useAuctionSocket();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState(false);
  const [expired, setExpired] = useState(false);
  const [settlement, setSettlement] = useState(null);
  const bidInFlightRef = useRef(false);

  const isBidder = user?.role_id === 1 || user?.role_id === 2;
  const isFarmer = user?.role_id === 1;
  const creatorId = auction?.seller_id ?? auction?.farmer_id;
  const isOwnAuction =
    creatorId != null && user?.user_id != null && creatorId === user.user_id;
  const isActiveAuction =
    auction?.status_name === 'active' || auction?.status_id === 2;
  const canBid =
    isBidder && !isOwnAuction && isActiveAuction && !expired;
  const showOwnAuctionBidMessage =
    isBidder && isOwnAuction && isActiveAuction && !expired;

  /* ── Data fetch ─────────────────────────────────────────────── */
  const isActive = (a) => {
    if (!a) return false;
    if (a.status_id !== 2 && a.status_name !== 'active') return false;
    if (typeof a.remaining_ms === 'number') return a.remaining_ms > 0;
    return remainingMsUntilEnd(a.end_time) > 0;
  };

  const fetchAuction = useCallback(async () => {
    try {
      const data = await api.getAuction(id);
      if (!data.success) throw new Error(data.message);
      const a = data.auction;
      setAuction(a);
      setSettlement(a.settlement ?? null);
      setExpired(!isActive(a));
    } catch {
      toast.error('নিলাম লোড করতে সমস্যা হয়েছে');
      navigate('/app/auctions');
    }
  }, [id, navigate]);

  const fetchBids = useCallback(async () => {
    try {
      const data = await api.getAuctionBids(id);
      setBids(data.bids ?? data.data?.bids ?? []);
    } catch {
      setBids([]);
    }
  }, [id]);

  useEffect(() => {
    Promise.all([fetchAuction(), fetchBids()]).finally(() => setLoading(false));
  }, [id]);

  /* ── Socket events ──────────────────────────────────────────── */
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit("joinAuction", id);

    const applyBid = (data) => {
      if (parseInt(data.auction_id, 10) !== parseInt(id, 10)) return;

      setAuction((prev) =>
        prev
          ? {
              ...prev,
              current_price: data.current_price,
              bid_count: data.bid_count,
            }
          : prev
      );

      // Own bids: handleBid already synced history from API — avoid duplicate rows
      if (Number(data.bidder_id) === Number(user?.user_id)) return;

      setBids((prev) => {
        if (data.bid_id != null && prev.some((b) => b.bid_id == data.bid_id)) {
          return prev.map((b) => ({
            ...b,
            is_winning: b.bid_id == data.bid_id,
          }));
        }
        const entry = {
          bid_id: data.bid_id,
          bid_amount: data.bid_amount,
          bidder_id: data.bidder_id,
          bidder_name: data.bidder_name,
          is_winning: true,
          created_at: data.created_at ?? new Date().toISOString(),
        };
        return [entry, ...prev.map((b) => ({ ...b, is_winning: false }))];
      });

      if (data.bidder_id !== user?.user_id)
        toast.info(
          `নতুন বিড: ৳${Number(data.bid_amount).toLocaleString('bn-BD')}`,
          { autoClose: 3000 }
        );
    };

    socket.on('auction:joined', (state) => {
      setAuction((prev) => {
        const merged = prev ? { ...prev, ...state } : state;
        if (typeof state.remaining_ms === 'number') {
          setExpired(state.remaining_ms <= 0);
        }
        return merged;
      });
    });

    socket.on('auction:state', (state) => {
      setAuction((prev) => (prev ? { ...prev, ...state } : state));
    });

    socket.on('auction:bid_history', (history) => {
      setBids(history);
    });

    socket.off('bid:placed');
    socket.on('bid:placed', applyBid);

    const onBidUpdated = (data) => {
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              current_price: data.current_price ?? prev.current_price,
              bid_count: data.bid_count ?? prev.bid_count,
            }
          : prev
      );
    };
    socket.off('bid:updated');
    socket.on('bid:updated', onBidUpdated);

    const onClosed = (data) => {
      setExpired(true);
      if (data.settlement) setSettlement(data.settlement);
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              status_name: data.status === 'cancelled' ? 'cancelled' : 'ended',
              status_id: data.status === 'cancelled' ? 4 : 3,
              winner_id: data.winner_id,
              winner_name: data.winner_name,
              final_price: data.final_price,
              current_price: data.final_price ?? prev.current_price,
            }
          : prev
      );
      toast.info(
        data.status === 'cancelled' ? 'নিলাম বাতিল হয়েছে' : 'নিলাম শেষ হয়েছে!',
        { autoClose: 5000 }
      );
      fetchBids();
    };

    socket.on('auction:closed', onClosed);
    socket.on('auction:ended', onClosed);
    socket.on('auction:cancelled', () => onClosed({ status: 'cancelled' }));

    socket.on('auction:winner', (data) => {
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              winner_id: data.winner_id,
              winner_name: data.winner_name,
              final_price: data.winning_amount,
            }
          : prev
      );
    });

    return () => {
      socket.emit('leaveAuction', id);
      socket.off('bid:placed');
      socket.off('bid:updated', onBidUpdated);
      [
        'auction:joined',
        'auction:state',
        'auction:bid_history',
        'auction:closed',
        'auction:ended',
        'auction:cancelled',
        'auction:winner',
      ].forEach((ev) => socket.off(ev));
      socket.off('auction:closed', onClosed);
      socket.off('auction:ended', onClosed);
    };
  }, [socket, id, user?.user_id, fetchBids]);

  /* ── Bid handler ────────────────────────────────────────────── */
  const handleBid = async (amount) => {
    if (expired) {
      toast.error('নিলামের সময় শেষ');
      return false;
    }
    if (bidInFlightRef.current || bidding) return false;

    bidInFlightRef.current = true;
    setBidding(true);
    try {
      const res = await api.placeBid(id, amount);
      if (!res.success) throw new Error(res.message);
      toast.success(`বিড সফল — ৳${Number(amount).toLocaleString('bn-BD')}`);
      await fetchBids();
      return true;
    } catch (err) {
      toast.error(err.message || 'বিড দিতে ব্যর্থ হয়েছে');
      return false;
    } finally {
      bidInFlightRef.current = false;
      setBidding(false);
    }
  };

  /* ── Cancel handler ─────────────────────────────────────────── */
  const handleCancel = async () => {
    if (!confirm("নিলামটি বাতিল করতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না।"))
      return;
    try {
      await api.cancelAuction(id);
      toast.success("নিলাম বাতিল করা হয়েছে");
      navigate("/app/my-auctions");
    } catch (err) {
      toast.error(err.message || "বাতিল করতে ব্যর্থ হয়েছে");
    }
  };

  /* ── Loading ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-slate-100 rounded-2xl" />
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-48 bg-slate-100 rounded-2xl" />
            <div className="h-48 bg-slate-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!auction) return null;

  const winner =
    bids.find((b) => b.is_winning) ||
    (auction?.winner_id
      ? {
          bidder_id: auction.winner_id,
          bidder_name: auction.winner_name,
          bid_amount: auction.final_price ?? auction.current_price,
        }
      : null);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back */}
      <Link
        to="/app/auctions"
        className="inline-flex items-center gap-2 text-[13px] text-slate-500 hover:text-emerald-700 mb-5 transition-colors"
      >
        <ArrowLeft size={15} /> নিলাম তালিকায় ফিরুন
      </Link>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Left: auction info ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Hero card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Image/header */}
            {auction.images?.[0] ? (
              <img
                src={resolveMediaUrl(auction.images[0].url) || auction.images[0].url}
                alt={auction.product_name}
                className="w-full h-52 object-cover"
              />
            ) : (
              <div className="h-52 bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
                <Package size={64} className="text-emerald-200" />
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-[22px] font-black text-slate-800 leading-tight">
                  {auction.product_name}
                </h1>
                <StatusBadge status={auction.status_name} />
              </div>

              {/* Meta chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {auction.category_name && (
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg">
                    {auction.category_name}
                  </span>
                )}
                {auction.unit && (
                  <span className="text-[11px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-1 rounded-lg">
                    {auction.unit}
                  </span>
                )}
                {auction.quantity && (
                  <span className="text-[11px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-1 rounded-lg">
                    পরিমাণ: {auction.quantity}
                  </span>
                )}
                {auction.district_name && (
                  <span className="text-[11px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1">
                    <MapPin size={10} /> {auction.district_name}
                  </span>
                )}
              </div>

              {auction.description && (
                <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                  {auction.description}
                </p>
              )}

              {/* Seller */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-[13px]">
                  {auction.seller_name?.[0]}
                </div>
                <div>
                  <div className="text-[12px] text-slate-400">বিক্রেতা</div>
                  <div className="text-[14px] font-semibold text-slate-700">
                    {auction.seller_name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Auction stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "শুরুর মূল্য",
                value: `৳${Number(auction.starting_price).toLocaleString("bn-BD")}`,
                color: "text-slate-700",
              },
              {
                label: "মোট বিড",
                value: auction.bid_count ?? 0,
                color: "text-indigo-600",
              },
              {
                label: "বৃদ্ধির পরিমাণ",
                value: `৳${Number(auction.min_increment).toLocaleString("bn-BD")}`,
                color: "text-amber-600",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-3 text-center"
              >
                <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">
                  {label}
                </div>
                <div className={`text-[16px] font-black ${color}`}>{value}</div>
              </div>
            ))}
          </div>

          {settlement && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[13px] font-bold text-emerald-800">সরাসরি কৃষক পরিশোধ</p>
              <p className="mt-1 text-[12px] text-emerald-700 leading-relaxed">
                {settlement.note}
              </p>
              <p className="mt-2 text-[14px] font-black text-emerald-900">
                পরিশোধযোগ্য: ৳{Number(settlement.amount).toLocaleString('bn-BD')}
              </p>
            </div>
          )}

          {/* Ended: winner banner */}
          {auction.status_name === "ended" && (
            <div
              className={`rounded-2xl p-5 flex items-center gap-4 ${winner ? "bg-amber-50 border border-amber-200" : "bg-slate-50 border border-slate-200"}`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${winner ? "bg-amber-100" : "bg-slate-100"}`}
              >
                {winner ? (
                  <Trophy size={24} className="text-amber-600" />
                ) : (
                  <Package size={24} className="text-slate-400" />
                )}
              </div>
              <div>
                <div
                  className={`text-[15px] font-black ${winner ? "text-amber-800" : "text-slate-600"}`}
                >
                  {winner
                    ? `🎉 ${winner.bidder_name} জয়ী হয়েছেন`
                    : "কোনো বিড পাওয়া যায়নি"}
                </div>
                {winner && (
                  <div className="text-[13px] text-amber-700">
                    চূড়ান্ত মূল্য: ৳
                    {Number(winner.bid_amount).toLocaleString("bn-BD")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Farmer: manage own auction */}
          {isFarmer && isOwnAuction && ['active', 'scheduled'].includes(auction.status_name) && (
            <div className="flex gap-2">
              <Link
                to={`/app/auctions/${id}/edit`}
                className="flex-1 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 text-[13px] font-semibold hover:bg-emerald-50 transition-colors text-center"
              >
                সম্পাদনা
              </Link>
              {auction.status_name === 'active' && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-[13px] font-semibold hover:bg-red-50 transition-colors"
                >
                  বাতিল
                </button>
              )}
            </div>
          )}

          {/* Legacy cancel-only row removed — merged above */}
        </div>

        {/* ── Right: bid panel + history ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current price card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-slate-400 uppercase tracking-wide">
                বর্তমান মূল্য
              </span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`}
                />
                <span className="text-slate-400">
                  {isConnected ? 'লাইভ' : 'অফলাইন'}
                </span>
              </div>
            </div>
            <div className="text-[36px] font-black text-emerald-600 leading-none mb-2">
              ৳{Number(auction.current_price).toLocaleString("bn-BD")}
            </div>
            {auction.status_name === "active" && (
              <CountdownTimer
                endTime={auction.end_time}
                onExpire={() => setExpired(true)}
              />
            )}
          </div>

          {showOwnAuctionBidMessage && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
              <AlertTriangle
                size={20}
                className="mx-auto mb-2 text-amber-600"
                aria-hidden
              />
              <p className="text-[13px] font-medium text-amber-900">
                You cannot bid on your own auction.
              </p>
            </div>
          )}

          {/* Bid panel — other farmers & wholesalers on active auctions */}
          {canBid && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-bold text-[14px] text-slate-700 mb-4 flex items-center gap-2">
                  <Gavel size={15} className="text-emerald-600" /> বিড করুন
                </h3>
                <BidPanel
                  auction={auction}
                  onBid={handleBid}
                  loading={bidding}
                />
              </div>
            )}

          {expired && isBidder && !isOwnAuction && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-center">
              <AlertTriangle
                size={20}
                className="text-slate-400 mx-auto mb-2"
              />
              <p className="text-[13px] text-slate-500">
                এই নিলামে আর বিড করা যাবে না
              </p>
            </div>
          )}

          {/* Bid history */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-[14px] text-slate-700 mb-3 flex items-center gap-2">
              <TrendingUp size={15} className="text-indigo-500" />
              বিডের ইতিহাস
              {bids.length > 0 && (
                <span className="ml-auto text-[11px] font-semibold text-slate-400">
                  {bids.length} টি বিড
                </span>
              )}
            </h3>

            {bids.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Gavel size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-[13px]">এখনো কোনো বিড নেই</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {bids.map((b, i) => (
                  <BidHistoryRow
                    key={b.bid_id ?? i}
                    bid={b}
                    index={i}
                    currentUserId={user?.user_id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
