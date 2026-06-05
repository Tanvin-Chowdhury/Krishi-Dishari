import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { toast } from 'react-toastify';
import { CreditCard } from 'lucide-react';
import {
  marketplaceApi,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../../shared/services/marketplaceApi';
import PageContainer from '../../shared/ui/PageContainer';
import Card from '../../shared/design-system/Card';
import { OrderStatusBadge } from './MarketplaceShared';

const PAYMENT_BADGE = {
  paid: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-red-100 text-red-700',
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceApi
      .getOrder(id)
      .then((res) => setOrder(res.order))
      .catch(() => toast.error('অর্ডার লোড করতে সমস্যা'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
      </PageContainer>
    );
  }

  if (!order) return null;

  return (
    <PageContainer maxWidth="max-w-2xl">
      <Link to="/app/market/orders" className="text-sm text-emerald-600 hover:underline">
        ← অর্ডার তালিকা
      </Link>
      <Card className="mt-4 !p-6">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold">অর্ডার #{order.order_id}</h1>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <OrderStatusBadge status={order.status} />
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_BADGE[order.payment_status] || 'bg-slate-100 text-slate-600'}`}>
              {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {new Date(order.created_at).toLocaleString('bn-BD')}
          {order.payment_method && ` · ${PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}`}
        </p>

        {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
          <Link
            to={`/app/market/orders/${order.order_id}/pay`}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <CreditCard size={16} /> এখনই পরিশোধ করুন
          </Link>
        )}

        {order.payment_status === 'paid' && order.transaction_id && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            ট্রানজেকশন আইডি: {order.transaction_id}
          </p>
        )}
        {order.delivery_address && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
            <p className="font-semibold">{order.delivery_name}</p>
            <p>{order.delivery_phone}</p>
            <p className="mt-1 text-slate-600">{order.delivery_address}</p>
          </div>
        )}
        <ul className="mt-6 space-y-3 border-t pt-4">
          {(order.items || []).map((item) => (
            <li key={item.item_id} className="flex justify-between text-sm">
              <span>
                {item.product_name} × {item.quantity}
              </span>
              <span className="font-semibold">
                ৳{Number(item.subtotal).toLocaleString('bn-BD')}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-right text-xl font-bold text-emerald-600">
          মোট: ৳{Number(order.total_amount).toLocaleString('bn-BD')}
        </p>
      </Card>
    </PageContainer>
  );
}
