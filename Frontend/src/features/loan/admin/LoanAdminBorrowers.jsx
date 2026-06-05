import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Search, X, Phone, MapPin, Mail, CalendarDays, Inbox } from 'lucide-react';
import { loanApi } from '../../../shared/services/loanApi';
import { bn, bnDate, LOAN_STATE, INST_STATUS, ROLE_LABEL } from '../loanUtils';
import { cn } from '../../../shared/lib/cn';

const STATE_FILTERS = [
  { key: '', label: 'সব' },
  { key: 'active', label: 'সক্রিয়' },
  { key: 'due_soon', label: 'শীঘ্রই দেয়' },
  { key: 'overdue', label: 'বকেয়া' },
  { key: 'completed', label: 'সম্পন্ন' },
];

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

export default function LoanAdminBorrowers() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await loanApi.adminLoans();
        setLoans(res.loans ?? res.data?.loans ?? []);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = loans;
    if (state) list = list.filter((l) => l.state === state);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (l) =>
          l.borrower_name?.toLowerCase().includes(q) ||
          l.phone?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [loans, search, state]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম বা ফোন খুঁজুন..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATE_FILTERS.map((f) => (
            <button
              key={f.key || 'all'}
              type="button"
              onClick={() => setState(f.key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                state === f.key
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">গ্রহীতা</th>
                <th className="px-3 py-3">ভূমিকা</th>
                <th className="px-3 py-3">ফোন</th>
                <th className="px-3 py-3">এলাকা</th>
                <th className="px-3 py-3 text-right">ঋণ</th>
                <th className="px-3 py-3 text-right">সুদ%</th>
                <th className="px-3 py-3 text-right">পরিশোধ্য</th>
                <th className="px-3 py-3 text-right">কিস্তি</th>
                <th className="px-3 py-3 text-right">পরিশোধিত</th>
                <th className="px-3 py-3 text-right">বকেয়া</th>
                <th className="px-3 py-3 text-right">বাকি কিস্তি</th>
                <th className="px-3 py-3">পরবর্তী তারিখ</th>
                <th className="px-3 py-3">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={13} className="px-4 py-3">
                      <div className="h-6 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-16 text-center">
                    <Inbox className="mx-auto mb-2 h-9 w-9 text-slate-300" />
                    <p className="text-sm text-slate-400">কোনো ঋণ গ্রহীতা নেই</p>
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const st = LOAN_STATE[l.state] || LOAN_STATE.active;
                  return (
                    <tr
                      key={l.loan_id}
                      onClick={() => setDetailId(l.loan_id)}
                      className="cursor-pointer transition hover:bg-emerald-50/40"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[11px] font-bold text-white">
                            {initials(l.borrower_name)}
                          </span>
                          <span className="font-medium text-slate-800">{l.borrower_name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{ROLE_LABEL[l.role_id] || '—'}</td>
                      <td className="px-3 py-3 text-slate-600">{l.phone || '—'}</td>
                      <td className="max-w-[160px] truncate px-3 py-3 text-slate-500">{l.location || '—'}</td>
                      <td className="px-3 py-3 text-right font-medium tabular-nums">৳{bn(l.loan_amount)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-slate-500">{bn(l.interest_rate ?? 5)}%</td>
                      <td className="px-3 py-3 text-right tabular-nums">৳{bn(l.total_payable)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">৳{bn(l.emi_amount)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-emerald-700">৳{bn(l.paid_amount)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-amber-700">৳{bn(l.due_amount)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{bn(l.remaining_emi)}</td>
                      <td className="px-3 py-3 text-slate-500">{l.next_emi_date ? bnDate(l.next_emi_date) : '—'}</td>
                      <td className="px-3 py-3">
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', st.color)}>
                          <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailId && <BorrowerDetailModal loanId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

function BorrowerDetailModal({ loanId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await loanApi.adminLoanDetail(loanId);
        setData(res.data ?? res);
      } catch (e) {
        toast.error(e.message);
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [loanId, onClose]);

  const loan = data?.loan;
  const borrower = data?.borrower;
  const progress =
    loan && loan.total_payable > 0
      ? Math.min(100, Math.round((loan.paid_amount / loan.total_payable) * 100))
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {loading || !loan ? (
          <div className="space-y-4 p-6">
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
            <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : (
          <>
            <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 px-5 py-5 text-white">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-white/80 hover:bg-white/15"
                aria-label="বন্ধ"
              >
                <X size={18} />
              </button>
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-lg font-bold backdrop-blur">
                  {borrower?.photo_url ? (
                    <img src={borrower.photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(loan.borrower_name)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-emerald-100">ঋণ #{loan.loan_id} · {loan.package_name || 'কাস্টম'}</p>
                  <h2 className="truncate text-lg font-bold">{loan.borrower_name}</h2>
                  <span className="mt-1 inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-semibold">
                    {(LOAN_STATE[loan.state] || LOAN_STATE.active).label}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-emerald-50">
                {borrower?.phone && <span className="inline-flex items-center gap-1.5"><Phone size={13} /> {borrower.phone}</span>}
                {borrower?.email && <span className="inline-flex items-center gap-1.5"><Mail size={13} /> {borrower.email}</span>}
                {borrower?.location && <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {borrower.location}</span>}
                {borrower?.member_since && <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> সদস্য {bnDate(borrower.member_since)}</span>}
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-auto p-5">
              {/* Loan summary */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">ঋণ সারাংশ</h3>
                  <span className="text-xs font-semibold text-emerald-700">{bn(progress)}% পরিশোধিত</span>
                </div>
                <div className="mb-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  <Summary label="ঋণ পরিমাণ" value={`৳${bn(loan.loan_amount)}`} />
                  <Summary label="সুদ" value={`৳${bn(loan.interest)}`} />
                  <Summary label="মোট পরিশোধ্য" value={`৳${bn(loan.total_payable)}`} />
                  <Summary label="মোট পরিশোধিত" value={`৳${bn(loan.paid_amount)}`} tone="emerald" />
                  <Summary label="বকেয়া" value={`৳${bn(loan.due_amount)}`} tone="amber" />
                  <Summary label="বাকি কিস্তি" value={`${bn(loan.remaining_emi)} টি`} />
                </div>
              </div>

              {/* EMI schedule */}
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">কিস্তি সূচি</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.installments.map((i) => {
                    const meta = INST_STATUS[i.status] || INST_STATUS.pending;
                    return (
                      <div key={i.installment_id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm">
                        <span className="font-medium text-slate-700">কিস্তি #{bn(i.installment_no)}</span>
                        <span className="text-xs text-slate-500">{bnDate(i.due_date)}</span>
                        <span className="tabular-nums text-slate-600">৳{bn(i.amount)}</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', meta.color)}>{meta.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment history */}
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">পেমেন্ট ইতিহাস</h3>
                {data.payments.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-sm text-slate-400">কোনো পেমেন্ট নেই</p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-100">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-left text-[11px] text-slate-500">
                        <tr>
                          <th className="px-3 py-2">তারিখ</th>
                          <th className="px-3 py-2 text-right">পরিমাণ</th>
                          <th className="px-3 py-2">পদ্ধতি</th>
                          <th className="px-3 py-2">ট্রানজেকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.payments.map((p) => (
                          <tr key={p.payment_id}>
                            <td className="px-3 py-2 text-slate-600">{bnDate(p.paid_at)}</td>
                            <td className="px-3 py-2 text-right font-medium tabular-nums">৳{bn(p.amount)}</td>
                            <td className="px-3 py-2 text-slate-600">{p.payment_method}</td>
                            <td className="max-w-[140px] truncate px-3 py-2 text-xs text-slate-400">{p.transaction_ref}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Summary({ label, value, tone }) {
  const toneCls =
    tone === 'emerald' ? 'text-emerald-700' : tone === 'amber' ? 'text-amber-700' : 'text-slate-800';
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className={cn('mt-0.5 text-base font-bold tabular-nums', toneCls)}>{value}</p>
    </div>
  );
}
