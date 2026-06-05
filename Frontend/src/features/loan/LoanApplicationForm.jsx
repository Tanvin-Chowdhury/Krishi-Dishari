import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { loanApi } from '../../shared/services/loanApi';
import { fileToDataUrl, bn } from './loanUtils';

export default function LoanApplicationForm({ pkg, onClose, onSuccess, user }) {
  const isCustom = !pkg || pkg.package_code === 'custom';
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    nid_number: '',
    mobile_number: user?.phone || '',
    address: '',
    land_size_acre: '',
    farming_years: '',
    crop_types: '',
    purpose_note: '',
    requested_amount: isCustom ? 25000 : pkg?.amount,
    duration_months: isCustom ? 12 : pkg?.duration_months,
  });
  const [previewEmi, setPreviewEmi] = useState(pkg?.emi || 0);
  const [docs, setDocs] = useState({ nid_front: null, nid_back: null, land_document: null, other: null });

  useEffect(() => {
    if (!isCustom || !form.requested_amount) return;
    const t = setTimeout(async () => {
      try {
        const res = await loanApi.calculate(form.requested_amount, form.duration_months);
        setPreviewEmi(res.emi ?? res.data?.emi ?? 0);
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.requested_amount, form.duration_months, isCustom]);

  const handleFile = async (key, file) => {
    try {
      const url = await fileToDataUrl(file);
      setDocs((d) => ({ ...d, [key]: url }));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const documents = {
        nid_front: docs.nid_front,
        nid_back: docs.nid_back,
        land_document: docs.land_document,
      };
      if (docs.other) documents.other = docs.other;

      await loanApi.apply({
        loan_type: isCustom ? 'custom' : 'package',
        package_id: isCustom ? undefined : pkg.package_id,
        ...form,
        land_size_acre: form.land_size_acre ? +form.land_size_acre : null,
        farming_years: form.farming_years ? +form.farming_years : null,
        documents,
      });
      toast.success('ঋণের আবেদন জমা হয়েছে');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {isCustom ? 'কাস্টম ঋণ আবেদন' : pkg?.name}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-emerald-700">ব্যক্তিগত</legend>
            <input
              required
              placeholder="পূর্ণ নাম"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            <input
              required
              placeholder="এনআইডি নম্বর"
              value={form.nid_number}
              onChange={(e) => setForm({ ...form, nid_number: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            <input
              required
              placeholder="মোবাইল"
              value={form.mobile_number}
              onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
            <textarea
              required
              placeholder="ঠিকানা"
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-emerald-700">কৃষি তথ্য</legend>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="জমির পরিমাণ (একর)"
                type="number"
                step="0.01"
                value={form.land_size_acre}
                onChange={(e) => setForm({ ...form, land_size_acre: e.target.value })}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
              <input
                placeholder="অভিজ্ঞতা (বছর)"
                type="number"
                value={form.farming_years}
                onChange={(e) => setForm({ ...form, farming_years: e.target.value })}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
            </div>
            <input
              placeholder="ফসলের ধরন"
              value={form.crop_types}
              onChange={(e) => setForm({ ...form, crop_types: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            />
          </fieldset>

          {isCustom && (
            <fieldset className="space-y-3">
              <legend className="text-sm font-bold text-emerald-700">ঋণ তথ্য</legend>
              <input
                required
                type="number"
                placeholder="ঋণের পরিমাণ (৳)"
                value={form.requested_amount}
                onChange={(e) => setForm({ ...form, requested_amount: +e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
              <input
                type="number"
                placeholder="মেয়াদ (মাস)"
                value={form.duration_months}
                onChange={(e) => setForm({ ...form, duration_months: +e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />
              <p className="text-sm text-slate-600">
                মাসিক কিস্তি (আনুমানিক): <strong>৳{bn(previewEmi)}</strong>
              </p>
            </fieldset>
          )}

          {!isCustom && (
            <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              <p>পরিমাণ: ৳{bn(pkg.amount)} · {pkg.duration_months} মাস</p>
              <p>মাসিক কিস্তি: ৳{bn(pkg.emi)}</p>
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-bold text-emerald-700">ডকুমেন্ট</legend>
            {[
              ['nid_front', 'এনআইডি (সামনে)'],
              ['nid_back', 'এনআইডি (পিছনে)'],
              ['land_document', 'জমির দলিল'],
              ['other', 'অতিরিক্ত (ঐচ্ছিক)'],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-200 px-3 py-2.5 hover:border-emerald-400"
              >
                <Upload size={16} className="text-slate-400" />
                <span className="flex-1 text-sm text-slate-600">
                  {docs[key] ? '✓ ' : ''}{label}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(key, e.target.files?.[0])}
                />
              </label>
            ))}
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? 'জমা হচ্ছে...' : 'আবেদন জমা দিন'}
          </button>
        </form>
      </div>
    </div>
  );
}
