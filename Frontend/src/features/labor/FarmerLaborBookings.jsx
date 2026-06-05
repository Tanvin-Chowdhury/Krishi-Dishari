import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { laborApi } from '../../shared/services/laborApi';
import StatusBadge from './components/StatusBadge';
import { useLaborSocket } from './useLaborSocket';
import { PAYMENT_STATUS_META } from './laborConstants';

const PAY_BADGE = {
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
};

const TABS = [
  { id: 'pending', label: 'পাঠানো' },
  { id: 'active', label: 'চলমান' },
  { id: 'completed', label: 'সম্পন্ন' },
];

export default function FarmerLaborBookings() {
  const [tab, setTab] = useState('pending');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewId, setReviewId] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await laborApi.myBookings(tab);
      setBookings(res.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  useLaborSocket(load);

  const cancel = async (id) => {
    if (!window.confirm('অনুরোধ বাতিল করবেন?')) return;
    await laborApi.cancelBooking(id);
    load();
  };

  const setPayment = async (id, payment_status) => {
    await laborApi.setBookingPayment(id, payment_status);
    load();
  };

  const submitReview = async (e) => {
    e.preventDefault();
    await laborApi.reviewBooking(reviewId, { rating, review: reviewText });
    setReviewId(null);
    setReviewText('');
    load();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">আমার নিয়োগ অনুরোধ</h1>
          <Link to="/app/labor" className="text-sm text-emerald-600">
            শ্রমিক বাজার
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              tab === t.id ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">লোড হচ্ছে...</p>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500 text-sm">
          কোনো অনুরোধ নেই
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.booking_id || b.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-800">{b.work_title}</p>
                  <p className="text-sm text-gray-600">{b.labor_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {b.start_date} · {b.duration_days || '—'} দিন · ৳{b.payment_amount}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={b.status} />
                  {tab !== 'pending' && (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        PAY_BADGE[PAYMENT_STATUS_META[b.payment_status]?.variant] || PAY_BADGE.red
                      }`}
                    >
                      {PAYMENT_STATUS_META[b.payment_status]?.label || 'অপরিশোধিত'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {tab === 'pending' && (
                  <button
                    type="button"
                    onClick={() => cancel(b.booking_id || b.id)}
                    className="text-sm text-red-600 font-semibold"
                  >
                    বাতিল
                  </button>
                )}
                {tab !== 'pending' && (
                  <label className="flex items-center gap-1.5 text-xs text-gray-500">
                    পেমেন্ট:
                    <select
                      value={b.payment_status || 'unpaid'}
                      onChange={(e) => setPayment(b.booking_id || b.id, e.target.value)}
                      className="border rounded-lg px-2 py-1 text-xs font-semibold"
                    >
                      <option value="unpaid">অপরিশোধিত</option>
                      <option value="partial">আংশিক</option>
                      <option value="paid">পরিশোধিত</option>
                    </select>
                  </label>
                )}
                {tab === 'completed' && (
                  <button
                    type="button"
                    onClick={() => setReviewId(b.booking_id || b.id)}
                    className="text-sm text-emerald-700 font-semibold ml-auto"
                  >
                    রিভিউ দিন
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={submitReview}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <h3 className="font-bold text-lg mb-3">রিভিউ দিন</h3>
            <div className="mb-3">
              <label className="text-sm font-semibold">রেটিং</label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`w-8 h-8 rounded-full text-sm font-bold ${
                      n <= rating ? 'bg-yellow-400' : 'bg-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              className="w-full border rounded-lg p-2 text-sm mb-3"
              rows={3}
              placeholder="মতামত..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReviewId(null)}
                className="flex-1 py-2 bg-gray-100 rounded-lg font-semibold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-semibold"
              >
                জমা দিন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
