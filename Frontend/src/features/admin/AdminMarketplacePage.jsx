import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../shared/services/adminApi';
import {
  AdminPageShell,
  Badge,
  TableShell,
} from './components/AdminPageShell';
import { bn, bnDate } from './adminUtils';

const ORDER_STATUS_META = {
  pending: { label: 'অপেক্ষমাণ', color: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'নিশ্চিত', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'প্রস্তুত হচ্ছে', color: 'bg-indigo-100 text-indigo-800' },
  shipped: { label: 'পাঠানো হয়েছে', color: 'bg-cyan-100 text-cyan-800' },
  delivered: { label: 'ডেলিভারড', color: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'বাতিল', color: 'bg-red-100 text-red-800' },
};
const ORDER_STATUS_OPTIONS = Object.keys(ORDER_STATUS_META);

export default function AdminMarketplacePage() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'products') {
        const res = await adminApi.listProducts({ search: search || undefined, limit: 50 });
        setProducts(res.products ?? res.data?.products ?? []);
      } else {
        const res = await adminApi.listOrders({ limit: 50 });
        setOrders(res.orders ?? res.data?.orders ?? []);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleProduct = async (p) => {
    try {
      await adminApi.setProductStatus(p.product_id, !p.is_active);
      toast.success(p.is_active ? 'পণ্য প্রত্যাখ্যান' : 'পণ্য অনুমোদিত');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const changeOrderStatus = async (order, status) => {
    if (status === order.status) return;
    const prev = orders;
    setOrders((list) =>
      list.map((o) => (o.order_id === order.order_id ? { ...o, status } : o))
    );
    try {
      await adminApi.setOrderStatus(order.order_id, status);
      toast.success(`অর্ডার #${order.order_id} → ${ORDER_STATUS_META[status]?.label || status}`);
    } catch (e) {
      setOrders(prev);
      toast.error(e.message);
    }
  };

  return (
    <AdminPageShell title="মার্কেটপ্লেস পর্যবেক্ষণ" subtitle="পণ্য ও অর্ডার মনিটরিং">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('products')}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
            tab === 'products' ? 'bg-emerald-600 text-white' : 'bg-slate-100'
          }`}
        >
          পণ্য
        </button>
        <button
          type="button"
          onClick={() => setTab('orders')}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
            tab === 'orders' ? 'bg-emerald-600 text-white' : 'bg-slate-100'
          }`}
        >
          অর্ডার
        </button>
        {tab === 'products' && (
          <input
            type="search"
            placeholder="পণ্য খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ml-auto min-w-[180px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        )}
      </div>

      {tab === 'products' ? (
        <TableShell
          loading={loading}
          empty={!loading && products.length === 0}
          headers={['পণ্য', 'বিক্রেতা', 'দাম', 'স্টক', 'স্ট্যাটাস', '']}
        >
          {products.map((p) => (
            <tr key={p.product_id} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 font-medium">{p.product_name}</td>
              <td className="px-4 py-3 text-xs text-slate-500">{p.seller_name}</td>
              <td className="px-4 py-3">৳{bn(p.price)}</td>
              <td className="px-4 py-3 text-xs">{p.stock_qty}</td>
              <td className="px-4 py-3">
                <Badge className={p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
                  {p.is_active ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => toggleProduct(p)}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  {p.is_active ? 'প্রত্যাখ্যান' : 'অনুমোদন'}
                </button>
              </td>
            </tr>
          ))}
        </TableShell>
      ) : (
        <TableShell
          loading={loading}
          empty={!loading && orders.length === 0}
          headers={['অর্ডার', 'ক্রেতা', 'মোট', 'স্ট্যাটাস', 'পরিবর্তন', 'তারিখ']}
        >
          {orders.map((o) => {
            const meta = ORDER_STATUS_META[o.status] || {
              label: o.status,
              color: 'bg-slate-100 text-slate-700',
            };
            return (
              <tr key={o.order_id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium">#{o.order_id}</td>
                <td className="px-4 py-3 text-xs">{o.buyer_name}</td>
                <td className="px-4 py-3">৳{bn(o.total_amount)}</td>
                <td className="px-4 py-3">
                  <Badge className={meta.color}>{meta.label}</Badge>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={(e) => changeOrderStatus(o, e.target.value)}
                    disabled={o.status === 'delivered' || o.status === 'cancelled'}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    {ORDER_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_META[s].label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{bnDate(o.created_at)}</td>
              </tr>
            );
          })}
        </TableShell>
      )}
    </AdminPageShell>
  );
}
