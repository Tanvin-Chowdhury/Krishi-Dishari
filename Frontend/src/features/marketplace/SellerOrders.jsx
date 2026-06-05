import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { marketplaceApi } from '../../shared/services/marketplaceApi';
import PageContainer from '../../shared/ui/PageContainer';
import PageHeader from '../../shared/components/PageHeader';
import Card from '../../shared/design-system/Card';
import { OrderStatusBadge } from './MarketplaceShared';

const STATUS_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    marketplaceApi
      .getSellerOrders({ status: filter || undefined })
      .then((res) => setOrders(res.orders || []))
      .catch(() => toast.error('অর্ডার লোড করতে সমস্যা'))
      .finally(() => setLoading(false));
  }, [filter]);

  const advanceStatus = async (orderId, currentStatus) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    const next = STATUS_FLOW[idx + 1];
    if (!next) return toast.info('চূড়ান্ত স্ট্যাটাস');
    try {
      await marketplaceApi.updateOrderStatus(orderId, next);
      toast.success('স্ট্যাটাস আপডেট');
      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? { ...o, status: next } : o))
      );
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <PageContainer maxWidth="max-w-4xl">
      <PageHeader title="বিক্রেতা অর্ডার" subtitle="আগত অর্ডার ব্যবস্থাপনা" />
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-6 rounded-xl border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">সব স্ট্যাটাস</option>
        {STATUS_FLOW.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
      ) : orders.length === 0 ? (
        <Card className="py-12 text-center text-slate-500">কোনো অর্ডার নেই</Card>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <Card key={o.order_id} className="!p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">#{o.order_id} · {o.buyer_name}</p>
                  <p className="text-xs text-slate-500">{new Date(o.created_at).toLocaleString('bn-BD')}</p>
                </div>
                <OrderStatusBadge status={o.status} />
              </div>
              <p className="mt-2 font-bold text-emerald-600">
                ৳{Number(o.total_amount).toLocaleString('bn-BD')}
              </p>
              {o.status !== 'delivered' && o.status !== 'cancelled' && (
                <button
                  type="button"
                  onClick={() => advanceStatus(o.order_id, o.status)}
                  className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  পরবর্তী স্ট্যাটাস
                </button>
              )}
            </Card>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
