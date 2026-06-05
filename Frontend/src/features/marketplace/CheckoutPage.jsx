import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import { Banknote, CreditCard } from 'lucide-react';
import { marketplaceApi } from '../../shared/services/marketplaceApi';
import PageContainer from '../../shared/ui/PageContainer';
import PageHeader from '../../shared/components/PageHeader';
import Button from '../../shared/design-system/Button';
import { Label } from '../../shared/design-system/Form';

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

const PAYMENT_OPTIONS = [
  {
    id: 'cod',
    label: 'ক্যাশ অন ডেলিভারি',
    desc: 'পণ্য হাতে পেয়ে টাকা পরিশোধ করুন',
    icon: Banknote,
  },
  {
    id: 'online',
    label: 'অনলাইন পেমেন্ট',
    desc: 'কার্ড / মোবাইল ব্যাংকিং দিয়ে এখনই পরিশোধ করুন',
    icon: CreditCard,
  },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [form, setForm] = useState({
    delivery_name: '',
    delivery_phone: '',
    delivery_address: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await marketplaceApi.checkout({ ...form, payment_method: paymentMethod });
      const orderId = res.order.order_id;
      if (paymentMethod === 'online') {
        toast.success('অর্ডার তৈরি হয়েছে — পেমেন্ট সম্পন্ন করুন');
        navigate(`/app/market/orders/${orderId}/pay`);
      } else {
        toast.success('অর্ডার সফল! ডেলিভারিতে পরিশোধ করুন');
        navigate(`/app/market/orders/${orderId}`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer maxWidth="max-w-xl">
      <PageHeader title="চেকআউট" subtitle="ডেলিভারি ও পেমেন্ট তথ্য দিন" />
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm">
        <div>
          <Label required>নাম</Label>
          <input required value={form.delivery_name} onChange={(e) => setForm({ ...form, delivery_name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <Label required>ফোন</Label>
          <input required value={form.delivery_phone} onChange={(e) => setForm({ ...form, delivery_phone: e.target.value })} className={inputClass} />
        </div>
        <div>
          <Label required>ঠিকানা</Label>
          <textarea required rows={3} value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} className={inputClass} />
        </div>

        <div>
          <Label>পেমেন্ট পদ্ধতি</Label>
          <div className="mt-2 grid gap-3">
            {PAYMENT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = paymentMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                    active
                      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-slate-800">{opt.label}</span>
                    <span className="block text-xs text-slate-500">{opt.desc}</span>
                  </span>
                  <span className={`ml-auto h-4 w-4 shrink-0 rounded-full border-2 ${active ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`} />
                </button>
              );
            })}
          </div>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          {paymentMethod === 'online' ? 'পেমেন্টে যান' : 'অর্ডার নিশ্চিত করুন'}
        </Button>
      </form>
    </PageContainer>
  );
}
