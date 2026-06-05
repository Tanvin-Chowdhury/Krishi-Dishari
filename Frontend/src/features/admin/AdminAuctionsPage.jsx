import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../shared/services/adminApi';
import {
  AdminPageShell,
  Badge,
  ConfirmModal,
  TableShell,
} from './components/AdminPageShell';
import { AUCTION_STATUS, bn, bnDate } from './adminUtils';

export default function AdminAuctionsPage() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [bids, setBids] = useState([]);
  const [action, setAction] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listAuctions({
        status_id: statusFilter || undefined,
        limit: 50,
      });
      setAuctions(res.auctions ?? res.data?.auctions ?? []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id) => {
    try {
      const res = await adminApi.getAuction(id);
      setSelected(res.auction ?? res.data?.auction);
      setBids(res.bids ?? res.data?.bids ?? []);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const runAction = async () => {
    if (!action) return;
    try {
      if (action.type === 'cancel') await adminApi.cancelAuction(action.id);
      else await adminApi.closeAuction(action.id);
      toast.success('নিলাম আপডেট হয়েছে');
      setAction(null);
      setSelected(null);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <AdminPageShell title="নিলাম পর্যবেক্ষণ" subtitle="সকল নিলাম ও বিড ইতিহাস">
      <div className="mb-4 flex flex-wrap gap-2">
        {['', '1', '2', '3', '4'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              statusFilter === s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {s ? AUCTION_STATUS[+s]?.label : 'সব'}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TableShell
            loading={loading}
            empty={!loading && auctions.length === 0}
            headers={['পণ্য', 'বিক্রেতা', 'স্ট্যাটাস', 'বিড', '']}
          >
            {auctions.map((a) => {
              const st = AUCTION_STATUS[a.status_id] || AUCTION_STATUS[1];
              return (
                <tr key={a.auction_id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium">{a.product_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{a.seller_name}</td>
                  <td className="px-4 py-3">
                    <Badge className={st.color}>{st.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">{a.bid_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openDetail(a.auction_id)}
                      className="text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      বিস্তারিত
                    </button>
                  </td>
                </tr>
              );
            })}
          </TableShell>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            {!selected ? (
              <p className="py-8 text-center text-sm text-slate-400">নিলাম নির্বাচন করুন</p>
            ) : (
              <>
                <h3 className="font-bold text-slate-900">{selected.product_name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {selected.seller_name} · {bnDate(selected.start_time)}
                </p>
                <p className="mt-2 text-sm">
                  সর্বোচ্চ বিড: <strong>৳{bn(selected.highest_bid || selected.current_price)}</strong>
                </p>
                {selected.winner_name && (
                  <p className="text-sm text-emerald-700">বিজয়ী: {selected.winner_name}</p>
                )}

                <div className="mt-4 max-h-48 overflow-y-auto space-y-1">
                  {bids.length === 0 ? (
                    <p className="text-xs text-slate-400">কোনো বিড নেই</p>
                  ) : (
                    bids.map((b) => (
                      <div key={b.bid_id} className="flex justify-between rounded-lg bg-slate-50 px-2 py-1 text-xs">
                        <span>{b.bidder_name}</span>
                        <span className="font-semibold">৳{bn(b.bid_amount)}</span>
                      </div>
                    ))
                  )}
                </div>

                {[1, 2].includes(selected.status_id) && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAction({ type: 'close', id: selected.auction_id })}
                      className="flex-1 rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white"
                    >
                      বন্ধ করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setAction({ type: 'cancel', id: selected.auction_id })}
                      className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-semibold text-white"
                    >
                      বাতিল
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!action}
        title={action?.type === 'cancel' ? 'নিলাম বাতিল?' : 'নিলাম বন্ধ করুন?'}
        message="এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।"
        danger={action?.type === 'cancel'}
        onConfirm={runAction}
        onCancel={() => setAction(null)}
      />
    </AdminPageShell>
  );
}
