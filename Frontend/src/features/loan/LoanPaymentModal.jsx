import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { loanApi } from '../../shared/services/loanApi';
import { bn } from './loanUtils';

const METHODS = ['bKash', 'Nagad', 'Bank Transfer'];

export default function LoanPaymentModal({ loan, onClose, onSuccess }) {
  const [method, setMethod] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!method) {
      toast.error('পেমেন্ট পদ্ধতি নির্বাচন করুন');
      return;
    }
    setLoading(true);
    try {
      await loanApi.pay(loan.loan_id, {
        payment_method: method,
        mobile_number: mobile || undefined,
      });
      toast.success('কিস্তি পরিশোধ সফল');
      onSuccess?.();
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">কিস্তি পরিশোধ</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          {loan.package_name} — কিস্তি ৳{bn(loan.emi_amount)}
        </p>
        <div className="mb-4 space-y-2">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                method === m
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {(method === 'bKash' || method === 'Nagad') && (
          <input
            placeholder="মোবাইল নম্বর"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="mb-4 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        )}
        <button
          type="button"
          disabled={!method || loading}
          onClick={submit}
          className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'প্রক্রিয়াধীন...' : 'নিশ্চিত করুন'}
        </button>
      </div>
    </div>
  );
}
