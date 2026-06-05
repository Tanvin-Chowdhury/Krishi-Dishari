import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { toast } from 'react-toastify';
import { ShieldCheck, Lock, CreditCard, Loader2 } from 'lucide-react';
import { marketplaceApi } from '../../shared/services/marketplaceApi';
import PageContainer from '../../shared/ui/PageContainer';
import Card from '../../shared/design-system/Card';

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' });

  useEffect(() => {
    marketplaceApi
      .getOrder(id)
      .then((res) => {
        const o = res.order;
        if (o.payment_status === 'paid') {
          toast.info('এই অর্ডার ইতিমধ্যে পরিশোধিত');
          navigate(`/app/market/orders/${id}`, { replace: true });
          return;
        }
        if (o.status === 'cancelled') {
          toast.error('বাতিল অর্ডার পরিশোধ করা যাবে না');
          navigate(`/app/market/orders/${id}`, { replace: true });
          return;
        }
        setOrder(o);
      })
      .catch(() => toast.error('অর্ডার লোড করতে সমস্যা'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const pay = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      await marketplaceApi.payOrder(id, { payment_method: 'online' });
      toast.success('পেমেন্ট সফল হয়েছে!');
      navigate(`/app/market/orders/${id}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'পেমেন্ট ব্যর্থ হয়েছে');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="max-w-md">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </PageContainer>
    );
  }
  if (!order) return null;

  const amountBn = Number(order.total_amount).toLocaleString('bn-BD');

  return (
    <PageContainer maxWidth="max-w-md">
      <Card className="overflow-hidden !p-0">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-6 text-white">
          <div className="flex items-center gap-2 text-emerald-50">
            <ShieldCheck size={18} />
            <span className="text-xs font-semibold uppercase tracking-wide">নিরাপদ পেমেন্ট</span>
          </div>
          <p className="mt-3 text-sm text-emerald-50">অর্ডার #{order.order_id} এর জন্য পরিশোধ</p>
          <p className="mt-1 text-3xl font-bold">৳{amountBn}</p>
        </div>

        <form onSubmit={pay} className="space-y-4 p-6">
          <div>
            <label className="text-xs font-semibold text-slate-500">কার্ড নম্বর</label>
            <div className="relative">
              <input
                required
                inputMode="numeric"
                maxLength={19}
                placeholder="4242 4242 4242 4242"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: e.target.value })}
                className={`${inputClass} pr-10`}
              />
              <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">কার্ডধারীর নাম</label>
            <input
              required
              placeholder="MD KARIM"
              value={card.name}
              onChange={(e) => setCard({ ...card, name: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500">মেয়াদ</label>
              <input
                required
                placeholder="MM/YY"
                maxLength={5}
                value={card.expiry}
                onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500">CVC</label>
              <input
                required
                inputMode="numeric"
                maxLength={4}
                placeholder="123"
                value={card.cvc}
                onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={paying}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {paying ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
            {paying ? 'প্রসেস হচ্ছে...' : `৳${amountBn} পরিশোধ করুন`}
          </button>

          <p className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <Lock size={11} /> এটি একটি সিমুলেটেড ডেমো পেমেন্ট গেটওয়ে
          </p>
          <Link
            to={`/app/market/orders/${order.order_id}`}
            className="block text-center text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            পরে পরিশোধ করব
          </Link>
        </form>
      </Card>
    </PageContainer>
  );
}
