import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FileText,
  Phone,
  Mail,
  CalendarDays,
  CreditCard,
  Clock3,
  CheckCircle2,
  XCircle,
  Eye,
  Download,
  X,
  MapPin,
  Sprout,
  IdCard,
  Banknote,
  TrendingUp,
  Image as ImageIcon,
  Inbox,
  Pencil,
  AlertTriangle,
  Percent,
  Wallet,
} from 'lucide-react';
import { loanApi } from '../../../shared/services/loanApi';
import { bn, bnDate, APP_STATUS } from '../loanUtils';
import { cn } from '../../../shared/lib/cn';
import { StatCard } from '../../admin/components/AdminPageShell';

const DOC_LABELS = {
  nid_front: 'এনআইডি (সামনে)',
  nid_back: 'এনআইডি (পিছনে)',
  land_document: 'জমির দলিল',
  other: 'অতিরিক্ত ডকুমেন্ট',
};

const FILTERS = [
  { key: '', label: 'সব', dot: 'bg-slate-400' },
  { key: 'pending', label: 'অপেক্ষমাণ', dot: 'bg-amber-500' },
  { key: 'under_review', label: 'পর্যালোচনাধীন', dot: 'bg-blue-500' },
  { key: 'approved', label: 'অনুমোদিত', dot: 'bg-emerald-500' },
  { key: 'rejected', label: 'প্রত্যাখ্যান', dot: 'bg-red-500' },
];

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

export default function LoanAdminApplications() {
  const [all, setAll] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [preview, setPreview] = useState(null);
  const [review, setReview] = useState({
    status: 'approved',
    admin_notes: '',
    rejection_reason: '',
    approved_amount: '',
    duration_months: '',
    interest_rate: '',
    emi_amount: '',
    next_emi_date: '',
  });

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loanApi.adminList({ limit: 200 });
      setAll(res.applications ?? res.data?.applications ?? []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const counts = useMemo(() => {
    const c = { '': all.length, pending: 0, under_review: 0, approved: 0, rejected: 0 };
    for (const a of all) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [all]);

  const list = useMemo(
    () => (statusFilter ? all.filter((a) => a.status === statusFilter) : all),
    [all, statusFilter]
  );

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelected({ application: { application_id: id } });
    try {
      const res = await loanApi.adminGet(id);
      const data = res.data ?? res;
      setSelected(data);
      const a = data.application || {};
      const decided = ['approved', 'rejected'].includes(a.status);
      setReview({
        status: decided || a.status === 'under_review' ? a.status : 'approved',
        admin_notes: a.admin_notes || '',
        rejection_reason: a.rejection_reason || '',
        approved_amount: a.approved_amount || a.requested_amount || '',
        duration_months: a.duration_months || 12,
        interest_rate: '',
        emi_amount: a.monthly_installment || '',
        next_emi_date: '',
      });
    } catch (e) {
      toast.error(e.message);
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const submitReview = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await loanApi.adminReview(selected.application.application_id, {
        status: review.status,
        admin_notes: review.admin_notes,
        rejection_reason: review.rejection_reason,
        approved_amount: review.approved_amount ? +review.approved_amount : undefined,
        duration_months: review.duration_months ? +review.duration_months : undefined,
        interest_rate: review.interest_rate !== '' ? +review.interest_rate : undefined,
        emi_amount: review.emi_amount ? +review.emi_amount : undefined,
        next_emi_date: review.next_emi_date || undefined,
      });
      toast.success('আবেদন আপডেট হয়েছে');
      setSelected(null);
      loadList();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="মোট আবেদন" value={bn(counts[''])} accent="slate" />
        <StatCard label="অপেক্ষমাণ" value={bn(counts.pending)} accent="amber" />
        <StatCard label="অনুমোদিত" value={bn(counts.approved)} accent="emerald" />
        <StatCard label="প্রত্যাখ্যান" value={bn(counts.rejected)} accent="violet" />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key || 'all'}
            type="button"
            onClick={() => setStatusFilter(f.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
              statusFilter === f.key
                ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', statusFilter === f.key ? 'bg-white' : f.dot)} />
            {f.label}
            <span
              className={cn(
                'rounded-full px-1.5 text-[10px] font-bold tabular-nums',
                statusFilter === f.key ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              )}
            >
              {bn(counts[f.key] || 0)}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="space-y-px">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                      <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                <Inbox className="h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-400">কোনো আবেদন নেই</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {list.map((app) => {
                  const st = APP_STATUS[app.status] || APP_STATUS.pending;
                  const active = selected?.application?.application_id === app.application_id;
                  return (
                    <li key={app.application_id}>
                      <button
                        type="button"
                        onClick={() => openDetail(app.application_id)}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3.5 text-left transition',
                          active ? 'bg-emerald-50/80 ring-1 ring-inset ring-emerald-200' : 'hover:bg-slate-50'
                        )}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white">
                          {initials(app.applicant_name || app.full_name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-800">
                            {app.applicant_name || app.full_name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <Banknote size={13} className="text-emerald-500" />
                            ৳{bn(app.requested_amount)}
                            <span className="text-slate-300">·</span>
                            {bnDate(app.applied_at)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold',
                            st.color
                          )}
                        >
                          {st.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          {!selected ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                <FileText className="h-7 w-7 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-slate-500">
                বিস্তারিত দেখতে একটি আবেদন নির্বাচন করুন
              </p>
            </div>
          ) : detailLoading ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
            </div>
          ) : (
            <DetailPanel
              key={selected.application?.application_id}
              data={selected}
              review={review}
              setReview={setReview}
              saving={saving}
              onSubmit={submitReview}
              onClose={() => setSelected(null)}
              onPreview={setPreview}
            />
          )}
        </div>
      </div>

      {preview && (
        <DocumentPreview
          title={preview.title}
          url={preview.url}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

function DetailPanel({ data, review, setReview, saving, onSubmit, onClose, onPreview }) {
  const app = data.application || {};
  const el = data.eligibility || {};
  const st = APP_STATUS[app.status] || APP_STATUS.pending;
  const docs = app.documents || {};
  const docEntries = Object.entries(docs).filter(([, url]) => url);

  const alreadyDecided = ['approved', 'rejected'].includes(app.status);
  const [editing, setEditing] = useState(!alreadyDecided);
  const [confirm, setConfirm] = useState(false);
  const locked = alreadyDecided && !editing;
  const set = (patch) => setReview({ ...review, ...patch });

  const handleSave = () => {
    if (alreadyDecided) setConfirm(true);
    else onSubmit();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 px-5 py-5 text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
          aria-label="বন্ধ"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold backdrop-blur">
            {initials(app.applicant_name)}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-100">
              আবেদন #{app.application_id}
            </p>
            <h2 className="truncate text-lg font-bold">{app.applicant_name}</h2>
            <span className="mt-1 inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold">
              {st.label}
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-emerald-50">
          {app.phone && (
            <span className="inline-flex items-center gap-1.5">
              <Phone size={13} /> {app.phone}
            </span>
          )}
          {app.email && (
            <span className="inline-flex items-center gap-1.5">
              <Mail size={13} /> {app.email}
            </span>
          )}
          {app.member_since && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} /> সদস্য {bnDate(app.member_since)}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-[auto,1fr]">
          <EligibilityRing score={el.eligibility_score ?? 0} />
          <div className="grid grid-cols-2 gap-2.5">
            <MiniStat
              icon={TrendingUp}
              label="অনুমোদন সম্ভাবনা"
              value={`${bn(el.approval_probability ?? 0)}%`}
              tone="blue"
            />
            <MiniStat
              icon={Banknote}
              label="প্রস্তাবিত পরিমাণ"
              value={`৳${bn(el.recommended_amount ?? 0)}`}
              tone="emerald"
            />
            <MiniStat
              icon={CreditCard}
              label="অনুরোধকৃত"
              value={`৳${bn(app.requested_amount)}`}
              tone="violet"
            />
            <MiniStat
              icon={Clock3}
              label="মেয়াদ"
              value={`${bn(app.duration_months)} মাস`}
              tone="amber"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            আবেদনের তথ্য
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <InfoRow icon={IdCard} label="এনআইডি" value={app.nid_number} />
            <InfoRow icon={FileText} label="প্যাকেজ" value={app.package_name || 'কাস্টম'} />
            <InfoRow icon={MapPin} label="জমি" value={app.land_size_acre ? `${bn(app.land_size_acre)} একর` : '—'} />
            <InfoRow icon={Sprout} label="অভিজ্ঞতা" value={app.farming_years ? `${bn(app.farming_years)} বছর` : '—'} />
            {app.crop_types && <InfoRow icon={Sprout} label="ফসল" value={app.crop_types} />}
            {app.mobile_number && <InfoRow icon={Phone} label="মোবাইল" value={app.mobile_number} />}
          </dl>
          {app.address && (
            <p className="mt-3 flex items-start gap-2 border-t border-slate-200/70 pt-3 text-sm text-slate-600">
              <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
              {app.address}
            </p>
          )}
          {app.purpose_note && (
            <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm italic text-slate-600">
              “{app.purpose_note}”
            </p>
          )}
        </div>

        {docEntries.length > 0 && (
          <div>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              ডকুমেন্ট ({bn(docEntries.length)})
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {docEntries.map(([k, url]) => (
                <DocCard
                  key={k}
                  label={DOC_LABELS[k] || k}
                  url={url}
                  onClick={() => onPreview({ title: DOC_LABELS[k] || k, url })}
                />
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              পর্যালোচনা সিদ্ধান্ত
            </h3>
            {alreadyDecided && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                <Pencil size={13} /> সিদ্ধান্ত সম্পাদনা
              </button>
            )}
          </div>

          {alreadyDecided && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm">
              <span className="text-slate-500">বর্তমান সিদ্ধান্ত:</span>
              <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', st.color)}>
                {st.label}
              </span>
              {app.status === 'approved' && app.approved_amount != null && (
                <span className="ml-auto text-xs font-semibold tabular-nums text-slate-600">
                  ৳{bn(app.approved_amount)}
                </span>
              )}
            </div>
          )}

          <fieldset disabled={locked || saving} className="space-y-3 disabled:opacity-70">
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'under_review', label: 'পর্যালোচনা', icon: Clock3, on: 'border-blue-500 bg-blue-500 text-white', off: 'border-slate-200 bg-white text-slate-600 hover:border-blue-300' },
                { v: 'approved', label: 'অনুমোদন', icon: CheckCircle2, on: 'border-emerald-600 bg-emerald-600 text-white', off: 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300' },
                { v: 'rejected', label: 'প্রত্যাখ্যান', icon: XCircle, on: 'border-red-500 bg-red-500 text-white', off: 'border-slate-200 bg-white text-slate-600 hover:border-red-300' },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = review.status === opt.v;
                return (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => set({ status: opt.v })}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed',
                      active ? opt.on : opt.off
                    )}
                  >
                    <Icon size={16} />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {review.status !== 'rejected' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="অনুমোদিত পরিমাণ (৳)" icon={Banknote}>
                    <input
                      type="number"
                      value={review.approved_amount}
                      onChange={(e) => set({ approved_amount: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </Field>
                  <Field label="মেয়াদ (মাস)" icon={Clock3}>
                    <input
                      type="number"
                      value={review.duration_months}
                      onChange={(e) => set({ duration_months: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </Field>
                  <Field label="সুদের হার (%)" icon={Percent}>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="৫"
                      value={review.interest_rate}
                      onChange={(e) => set({ interest_rate: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </Field>
                  <Field label="কিস্তি (৳/মাস)" icon={Wallet}>
                    <input
                      type="number"
                      placeholder="স্বয়ংক্রিয়"
                      value={review.emi_amount}
                      onChange={(e) => set({ emi_amount: e.target.value })}
                      className={INPUT_CLS}
                    />
                  </Field>
                </div>
                <Field label="পরবর্তী কিস্তির তারিখ" icon={CalendarDays}>
                  <input
                    type="date"
                    value={review.next_emi_date}
                    onChange={(e) => set({ next_emi_date: e.target.value })}
                    className={INPUT_CLS}
                  />
                </Field>
              </>
            )}

            {review.status === 'rejected' && (
              <Field label="প্রত্যাখ্যানের কারণ">
                <textarea
                  rows={2}
                  placeholder="কারণ লিখুন..."
                  value={review.rejection_reason}
                  onChange={(e) => set({ rejection_reason: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </Field>
            )}

            <Field label="অ্যাডমিন নোট">
              <textarea
                rows={2}
                placeholder="অভ্যন্তরীণ নোট (ঐচ্ছিক)"
                value={review.admin_notes}
                onChange={(e) => set({ admin_notes: e.target.value })}
                className={INPUT_CLS}
              />
            </Field>
          </fieldset>

          {!locked && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving
                ? 'সংরক্ষণ হচ্ছে...'
                : alreadyDecided
                ? 'পরিবর্তন সংরক্ষণ করুন'
                : 'সিদ্ধান্ত সংরক্ষণ করুন'}
            </button>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            setConfirm(false);
            onSubmit();
          }}
          saving={saving}
        />
      )}
    </div>
  );
}

const INPUT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500';

function ConfirmModal({ onCancel, onConfirm, saving }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3 px-6 pt-6 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <AlertTriangle size={24} />
          </span>
          <h3 className="text-base font-bold text-slate-800">সিদ্ধান্ত পরিবর্তন নিশ্চিত করুন</h3>
          <p className="text-sm leading-relaxed text-slate-500">
            এই ঋণ ইতিমধ্যে অনুমোদিত। সিদ্ধান্ত পরিবর্তন করলে ঋণের হিসাব পরিবর্তিত হতে পারে। আপনি কি
            নিশ্চিত?
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            বাতিল
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'নিশ্চিত করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EligibilityRing({ score }) {
  const pct = Math.max(0, Math.min(100, score));
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const color = pct >= 70 ? '#059669' : pct >= 40 ? '#d97706' : '#dc2626';
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-3">
      <div className="relative h-[88px] w-[88px]">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold tabular-nums text-slate-800">{bn(pct)}</span>
          <span className="text-[9px] font-medium text-slate-400">/ ১০০</span>
        </div>
      </div>
      <p className="mt-1 text-[11px] font-semibold text-slate-500">যোগ্যতা স্কোর</p>
    </div>
  );
}

const TONES = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  amber: 'bg-amber-50 text-amber-600',
};

function MiniStat({ icon: Icon, label, value, tone = 'emerald' }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-white p-2.5">
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', TONES[tone])}>
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] text-slate-400">{label}</p>
        <p className="truncate text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={15} className="mt-0.5 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <dt className="text-[11px] text-slate-400">{label}</dt>
        <dd className="truncate font-medium text-slate-700">{value || '—'}</dd>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-500">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label}
      </span>
      {children}
    </label>
  );
}

function isImageUrl(url) {
  return /^data:image\//i.test(url) || /\.(png|jpe?g|webp|gif)($|\?)/i.test(url);
}

function isPdfUrl(url) {
  return /^data:application\/pdf/i.test(url) || /\.pdf($|\?)/i.test(url);
}

function DocCard({ label, url, onClick }) {
  const img = isImageUrl(url);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left transition hover:border-emerald-400 hover:shadow-md"
    >
      <div className="relative flex h-24 items-center justify-center overflow-hidden bg-slate-50">
        {img ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : isPdfUrl(url) ? (
          <FileText className="h-9 w-9 text-rose-400" />
        ) : (
          <ImageIcon className="h-9 w-9 text-slate-300" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 opacity-0 transition group-hover:bg-slate-900/40 group-hover:opacity-100">
          <Eye className="h-5 w-5 text-white" />
        </span>
      </div>
      <span className="truncate px-2.5 py-2 text-xs font-medium text-slate-600">{label}</span>
    </button>
  );
}

function DocumentPreview({ title, url, onClose }) {
  const pdf = isPdfUrl(url);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <FileText size={16} className="text-emerald-600" />
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <a
              href={url}
              download={title}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              <Download size={14} /> ডাউনলোড
            </a>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50"
              aria-label="বন্ধ"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100 p-3">
          {pdf ? (
            <iframe title={title} src={url} className="h-[72vh] w-full rounded-lg bg-white" />
          ) : (
            <img src={url} alt={title} className="mx-auto max-h-[78vh] w-auto rounded-lg shadow-sm" />
          )}
        </div>
      </div>
    </div>
  );
}
