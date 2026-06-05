import { useContext, useEffect, useState } from 'react';
import { X, Package, Calendar, Phone, FileText, Warehouse } from 'lucide-react';
import { warehouseApi } from '../../../shared/services/warehouseApi';
import { AuthContext }  from '../../../core/auth/AuthContext';

function Field({ label, icon: Icon, required, children }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-xs font-extrabold text-gray-600">
        {Icon && <Icon size={12} className="text-gray-400" />}
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition';

export default function BookingModal({ warehouse, onClose, onSuccess }) {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    start_date:   '',
    end_date:     '',
    quantity_ton: '',
    product_type: '',
    renter_phone: user?.phone || '',
    notes:        '',
  });
  const [estimate, setEstimate] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const id = warehouse?.warehouse_id || warehouse?.id;

  useEffect(() => {
    if (!form.start_date || !form.end_date || !id) return;
    warehouseApi
      .estimate(id, form.start_date, form.end_date)
      .then(setEstimate)
      .catch(() => setEstimate(null));
  }, [form.start_date, form.end_date, id]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await warehouseApi.book(id, { ...form, quantity_ton: +form.quantity_ton });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'বুকিং ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const cap   = warehouse?.capacity || warehouse?.capacity_ton || 0;
  const avail = warehouse?.available_capacity ?? warehouse?.available_capacity_ton ?? cap;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
              <Warehouse size={16} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900">গুদাম বুকিং</h2>
              <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{warehouse?.title || warehouse?.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-xl border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-100 transition">
            <X size={16} />
          </button>
        </div>

        {/* Availability info */}
        <div className="mx-6 mt-4 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold text-emerald-600">মোট ধারণক্ষমতা</p>
            <p className="text-sm font-extrabold text-emerald-800">{Number(cap).toLocaleString('bn-BD')} টন</p>
          </div>
          <div className="h-8 w-px bg-emerald-200" />
          <div>
            <p className="text-[10px] font-semibold text-emerald-600">উপলব্ধ</p>
            <p className="text-sm font-extrabold text-emerald-800">{Number(avail).toLocaleString('bn-BD')} টন</p>
          </div>
          <div className="h-8 w-px bg-emerald-200" />
          <div>
            <p className="text-[10px] font-semibold text-emerald-600">দৈনিক ভাড়া</p>
            <p className="text-sm font-extrabold text-emerald-800">
              ৳{Number(warehouse?.price_per_day ?? warehouse?.daily_rate ?? 0).toLocaleString('bn-BD')}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="শুরুর তারিখ" icon={Calendar} required>
              <input type="date" className={INPUT} required value={form.start_date}
                onChange={set('start_date')} />
            </Field>
            <Field label="শেষ তারিখ" icon={Calendar} required>
              <input type="date" className={INPUT} required value={form.end_date}
                onChange={set('end_date')} />
            </Field>
          </div>

          <Field label="পরিমাণ (টন)" icon={Package} required>
            <input type="number" min="0.1" step="0.1" max={avail || undefined}
              className={INPUT} required value={form.quantity_ton}
              onChange={set('quantity_ton')} placeholder={`সর্বোচ্চ ${Number(avail).toLocaleString('bn-BD')} টন`} />
          </Field>

          <Field label="পণ্যের ধরন" icon={Package}>
            <input className={INPUT} value={form.product_type}
              onChange={set('product_type')} placeholder="যেমন: ধান, গম, আলু..." />
          </Field>

          <Field label="যোগাযোগ নম্বর" icon={Phone} required>
            <input type="tel" className={INPUT} required value={form.renter_phone}
              onChange={set('renter_phone')} placeholder="০১XXXXXXXXX" />
          </Field>

          <Field label="বিশেষ নির্দেশনা" icon={FileText}>
            <textarea className={INPUT} rows={2} value={form.notes}
              onChange={set('notes')} placeholder="কোনো বিশেষ প্রয়োজনীয়তা..." />
          </Field>

          {/* Cost estimate */}
          {estimate && (
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
              <p className="text-xs font-extrabold text-emerald-700 mb-2">আনুমানিক খরচ</p>
              <div className="flex items-center justify-between text-sm text-emerald-700">
                <span>মেয়াদ: {estimate.days} দিন</span>
                <span className="text-xl font-extrabold text-emerald-800">
                  ৳{Number(estimate.total_cost).toLocaleString('bn-BD')}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              বাতিল
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60 shadow-sm transition">
              {loading ? 'পাঠানো হচ্ছে...' : '📦 অনুরোধ পাঠান'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
