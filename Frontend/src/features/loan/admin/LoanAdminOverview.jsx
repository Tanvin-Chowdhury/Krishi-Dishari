import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Banknote,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  CalendarClock,
  PiggyBank,
  CircleDollarSign,
} from 'lucide-react';
import { loanApi } from '../../../shared/services/loanApi';
import { bn, bnDate, monthLabel, LOAN_STATE } from '../loanUtils';
import { cn } from '../../../shared/lib/cn';

const CARDS = [
  { key: 'total_distributed', label: 'মোট বিতরণকৃত ঋণ', icon: Banknote, tone: 'emerald', money: true },
  { key: 'active_loans', label: 'সক্রিয় ঋণ', icon: TrendingUp, tone: 'blue' },
  { key: 'completed_loans', label: 'সম্পূর্ণ পরিশোধিত', icon: CheckCircle2, tone: 'teal' },
  { key: 'overdue_loans', label: 'বকেয়া ঋণ', icon: AlertTriangle, tone: 'red' },
  { key: 'total_outstanding', label: 'মোট বকেয়া পরিমাণ', icon: Wallet, tone: 'amber', money: true },
  { key: 'total_collected', label: 'মোট আদায়', icon: PiggyBank, tone: 'violet', money: true },
  { key: 'monthly_collected', label: 'এ মাসের আদায়', icon: CircleDollarSign, tone: 'emerald', money: true },
  { key: 'upcoming_due_amount', label: 'আসন্ন কিস্তি (৭ দিন)', icon: CalendarClock, tone: 'blue', money: true },
];

const TONE = {
  emerald: 'from-emerald-50 text-emerald-600 border-emerald-200',
  blue: 'from-blue-50 text-blue-600 border-blue-200',
  teal: 'from-teal-50 text-teal-600 border-teal-200',
  red: 'from-red-50 text-red-600 border-red-200',
  amber: 'from-amber-50 text-amber-600 border-amber-200',
  violet: 'from-violet-50 text-violet-600 border-violet-200',
};

export default function LoanAdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await loanApi.adminStats();
        setData(res.data ?? res);
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  const s = data?.stats || {};
  const chart = data?.collection_chart || [];
  const maxChart = Math.max(1, ...chart.map((c) => c.total));
  const borrowerDue = data?.borrower_due || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CARDS.map(({ key, label, icon: Icon, tone, money }) => (
          <div
            key={key}
            className={cn(
              'rounded-2xl border bg-gradient-to-br to-white p-4 shadow-sm transition hover:shadow-md',
              TONE[tone]
            )}
          >
            <div className="flex items-center justify-between">
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-white/70', TONE[tone])}>
                <Icon size={17} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
              {money ? `৳${bn(s[key] ?? 0)}` : bn(s[key] ?? 0)}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Wallet size={16} className="text-amber-600" /> ঋণগ্রহীতার বকেয়া তালিকা
          </h3>
          {borrowerDue.length > 0 && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              মোট বকেয়া: ৳{bn(s.total_outstanding ?? 0)}
            </span>
          )}
        </div>
        {borrowerDue.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">কোনো বকেয়া ঋণ নেই 🎉</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2 font-semibold">নাম</th>
                  <th className="px-3 py-2 text-right font-semibold">ঋণ</th>
                  <th className="px-3 py-2 text-right font-semibold">পরিশোধিত</th>
                  <th className="px-3 py-2 text-right font-semibold">বকেয়া</th>
                  <th className="px-3 py-2 text-center font-semibold">পরবর্তী কিস্তি</th>
                  <th className="px-3 py-2 text-center font-semibold">অবস্থা</th>
                </tr>
              </thead>
              <tbody>
                {borrowerDue.map((l) => {
                  const st = LOAN_STATE[l.state] || LOAN_STATE.active;
                  return (
                    <tr
                      key={l.loan_id}
                      className="border-b border-slate-50 transition hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-2.5 font-medium text-slate-800">{l.borrower_name}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                        ৳{bn(l.loan_amount)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-emerald-600">
                        ৳{bn(l.paid_amount)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-red-600">
                        ৳{bn(l.due_amount)}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-slate-500">
                        {l.next_emi_date ? bnDate(l.next_emi_date) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                            st.color
                          )}
                        >
                          <span className={cn('h-1.5 w-1.5 rounded-full', st.dot)} />
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold text-slate-800">মাসিক আদায় (৬ মাস)</h3>
          {chart.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">কোনো আদায় তথ্য নেই</p>
          ) : (
            <div className="flex h-48 items-end justify-between gap-2">
              {chart.map((c) => (
                <div key={c.month} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-semibold tabular-nums text-slate-500">
                    ৳{bn(c.total)}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-teal-400 transition-all"
                    style={{ height: `${Math.max(4, (c.total / maxChart) * 150)}px` }}
                  />
                  <span className="text-[10px] text-slate-400">{monthLabel(c.month)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-red-700">
            <AlertTriangle size={16} /> বকেয়া কিস্তি
          </h3>
          {(data?.overdue_emis || []).length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">কোনো বকেয়া নেই 🎉</p>
          ) : (
            <ul className="space-y-2">
              {data.overdue_emis.map((e) => (
                <li
                  key={e.installment_id}
                  className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
                >
                  <span className="truncate font-medium text-slate-700">{e.borrower_name}</span>
                  <span className="shrink-0 text-xs text-red-600">
                    ৳{bn(e.amount)} · {bnDate(e.due_date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
          <CalendarClock size={16} className="text-blue-600" /> আসন্ন কিস্তি (পরবর্তী ৭ দিন)
        </h3>
        {(data?.upcoming_emis || []).length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">আগামী ৭ দিনে কোনো কিস্তি নেই</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {data.upcoming_emis.map((e) => (
              <div
                key={e.installment_id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm"
              >
                <span className="truncate font-medium text-slate-700">{e.borrower_name}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  ৳{bn(e.amount)} · {bnDate(e.due_date)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
