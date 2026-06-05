import { useState, useContext } from 'react';
import { Briefcase, X } from 'lucide-react';
import { AuthContext } from '../../../core/auth/AuthContext';
import { laborApi } from '../../../shared/services/laborApi';
import UserPhoto from '../../../shared/components/UserPhoto';

export default function HireRequestModal({ laborer, onClose, onSuccess }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    work_title: '',
    work_description: '',
    start_date: '',
    duration_days: '1',
    location: '',
    payment_amount: laborer?.daily_wage || '',
    contact_phone: user?.phone || '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const desc = form.location
        ? `স্থান: ${form.location}\n${form.work_description || ''}`.trim()
        : form.work_description;
      await laborApi.createBooking({
        labour_id: laborer.user_id || laborer.id,
        work_title: form.work_title,
        work_description: desc,
        start_date: form.start_date,
        duration_days: +form.duration_days,
        payment_amount: form.payment_amount,
        contact_phone: form.contact_phone,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const name = laborer?.full_name || laborer?.name;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-xl animate-in fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">শ্রমিক নিয়োগ</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4 pb-4 border-b">
          <UserPhoto
            src={laborer?.photo_url || laborer?.photo}
            name={name}
            className="w-14 h-14 rounded-full object-cover"
            fallbackClassName="flex w-14 h-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-extrabold text-emerald-700"
          />
          <div>
            <p className="font-bold text-gray-800">{name}</p>
            <p className="text-sm text-emerald-600">
              ৳{laborer?.daily_wage ?? laborer?.daily_rate}/দিন
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>
        )}

        <form onSubmit={submit} className="space-y-3">
          <Field label="কাজের শিরোনাম *" required>
            <input
              className="input-field"
              value={form.work_title}
              onChange={(e) => set('work_title', e.target.value)}
              required
            />
          </Field>
          <Field label="কাজের বিবরণ">
            <textarea
              className="input-field"
              rows={2}
              value={form.work_description}
              onChange={(e) => set('work_description', e.target.value)}
            />
          </Field>
          <Field label="শুরুর তারিখ *" required>
            <input
              type="date"
              className="input-field"
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
              required
            />
          </Field>
          <Field label="মেয়াদ (দিন) *" required>
            <input
              type="number"
              min={1}
              className="input-field"
              value={form.duration_days}
              onChange={(e) => set('duration_days', e.target.value)}
              required
            />
          </Field>
          <Field label="কাজের স্থান *" required>
            <input
              className="input-field"
              placeholder="গ্রাম, উপজেলা, জেলা"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              required
            />
          </Field>
          <Field label="প্রস্তাবিত মজুরি (৳/দিন)">
            <input
              type="number"
              className="input-field"
              value={form.payment_amount}
              onChange={(e) => set('payment_amount', e.target.value)}
            />
          </Field>
          <Field label="যোগাযোগ নম্বর *" required>
            <input
              type="tel"
              className="input-field"
              placeholder="01XXXXXXXXX"
              value={form.contact_phone}
              onChange={(e) => set('contact_phone', e.target.value)}
              required
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-100 font-semibold text-gray-800"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Briefcase className="w-4 h-4" />
              {loading ? 'পাঠানো হচ্ছে...' : 'অনুরোধ পাঠান'}
            </button>
          </div>
        </form>
      </div>
      <style>{`.input-field{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.625rem 0.75rem;font-size:0.875rem}`}</style>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
    </div>
  );
}
