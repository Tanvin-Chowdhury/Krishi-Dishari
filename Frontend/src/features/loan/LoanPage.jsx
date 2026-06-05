import { useCallback, useContext, useEffect, useState } from 'react';
import {
  CreditCard, TrendingUp, Wallet, Calendar, ChevronRight,
  Banknote, Clock, CheckCircle, AlertTriangle, Zap, HelpCircle,
  BarChart2, ArrowRight, RefreshCw, Plus, Receipt, Activity,
  BadgeDollarSign, Shield,
} from 'lucide-react';
import { AuthContext } from '../../core/auth/AuthContext';
import { loanApi } from '../../shared/services/loanApi';
import { toast } from 'react-toastify';
import LoanApplicationForm from './LoanApplicationForm';
import LoanPaymentModal from './LoanPaymentModal';
import { bn, bnDate, APP_STATUS, PAY_STATUS, INST_STATUS } from './loanUtils';
import { cn } from '../../shared/lib/cn';

/* ─── SVG Progress Ring ───────────────────────────────────── */
function ProgressRing({ percent, size = 100, stroke = 9, color = '#ffffff', track = 'rgba(255,255,255,0.2)' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * (Math.min(100, Math.max(0, percent)) / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }} />
    </svg>
  );
}

/* ─── KPI Card ────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, sub, from, to }) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${from} ${to} p-4 shadow-sm hover:-translate-y-0.5 transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-white/80">{label}</p>
          <p className="mt-0.5 text-lg font-extrabold text-white leading-tight">{value}</p>
          {sub && <p className="mt-0.5 text-[10px] text-white/60">{sub}</p>}
        </div>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/25">
          <Icon className="text-white" style={{ width: 15, height: 15 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />)}
      </div>
    </div>
  );
}

/* ─── EMI status meta ─────────────────────────────────────── */
const INST_META = {
  pending: { label: 'বাকি',        cls: 'bg-sky-100 text-sky-700 border-sky-200'         },
  paid:    { label: 'পরিশোধিত',    cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  overdue: { label: 'বিলম্বিত',    cls: 'bg-red-100 text-red-700 border-red-200'          },
};

/* ─── Credit score color ──────────────────────────────────── */
function scoreColor(s) {
  if (s >= 80) return { bar: 'from-emerald-400 to-green-500', text: 'text-emerald-700', label: 'উত্তম',  bg: 'bg-emerald-50 border-emerald-100' };
  if (s >= 60) return { bar: 'from-teal-400 to-emerald-400',  text: 'text-teal-700',    label: 'ভালো',   bg: 'bg-teal-50 border-teal-100'       };
  if (s >= 40) return { bar: 'from-amber-400 to-yellow-400',  text: 'text-amber-700',   label: 'মধ্যম',  bg: 'bg-amber-50 border-amber-100'     };
  return             { bar: 'from-red-400 to-rose-500',       text: 'text-red-700',     label: 'কম',     bg: 'bg-red-50 border-red-100'         };
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function LoanPage() {
  const { user } = useContext(AuthContext);
  const [loading,      setLoading]      = useState(true);
  const [dashboard,    setDashboard]    = useState(null);
  const [packages,     setPackages]     = useState([]);
  const [applications, setApplications] = useState([]);
  const [payments,     setPayments]     = useState([]);
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [loanDetail,   setLoanDetail]   = useState(null);
  const [applyPkg,     setApplyPkg]     = useState(null);
  const [payLoan,      setPayLoan]      = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, pkgRes, appRes, payRes] = await Promise.all([
        loanApi.getDashboard(),
        loanApi.getPackages(),
        loanApi.getApplications(),
        loanApi.getPayments(),
      ]);
      setDashboard(dashRes.data ?? dashRes);
      setPackages(pkgRes.packages ?? pkgRes.data?.packages ?? []);
      setApplications(appRes.applications ?? appRes.data?.applications ?? []);
      setPayments(payRes.payments ?? payRes.data?.payments ?? []);
    } catch (e) {
      toast.error(e.message || 'ডেটা লোড করতে সমস্যা');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fetchLoanDetail = useCallback(async (loanId) => {
    const res = await loanApi.getActiveLoan(loanId);
    setLoanDetail(res.data ?? res);
  }, []);

  const expandLoan = async (loanId) => {
    if (expandedLoan === loanId) { setExpandedLoan(null); setLoanDetail(null); return; }
    setExpandedLoan(loanId);
    try { await fetchLoanDetail(loanId); } catch (e) { toast.error(e.message); }
  };

  const handlePaymentSuccess = useCallback(async () => {
    const loanId = payLoan?.loan_id;
    await load();
    if (loanId) {
      try { await fetchLoanDetail(loanId); } catch { /* best-effort */ }
    }
  }, [load, fetchLoanDetail, payLoan]);

  const elig       = dashboard?.eligibility;
  const summary    = dashboard?.summary;
  const activeLoans = dashboard?.active_loans ?? [];
  const primaryLoan = activeLoans[0] || null;

  /* derived totals */
  const totalBorrowed = activeLoans.reduce((s, l) => s + (l.principal_amount || 0), 0);
  const totalPaid     = activeLoans.reduce((s, l) => s + (l.paid_installments || 0) * (l.emi_amount || 0), 0);
  const totalDue      = activeLoans.reduce((s, l) => s + Math.max(0, (l.total_payable || 0) - (l.paid_installments || 0) * (l.emi_amount || 0)), 0);
  const repayRate     = totalBorrowed > 0 ? Math.round((totalPaid / (totalBorrowed * 1.05)) * 100) : 0;
  const primaryPct    = primaryLoan && primaryLoan.total_installments
    ? Math.round((primaryLoan.paid_installments / primaryLoan.total_installments) * 100) : 0;
  const scoreData     = scoreColor(elig?.eligibility_score ?? 0);
  const nextEmi       = summary?.next_installment;
  const daysLeft      = nextEmi?.due_date
    ? Math.max(0, Math.ceil((new Date(nextEmi.due_date) - Date.now()) / 86_400_000)) : null;

  if (loading && !dashboard) return <LoadingSkeleton />;

  return (
    <div className="mx-auto max-w-6xl space-y-5">

      {/* ══ HERO ══ */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-md">
        {/* Header row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm flex-shrink-0">
              <Banknote size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">কৃষি ক্ষুদ্র ঋণ</h1>
              <p className="text-xs text-gray-500">মাত্র ৫% বার্ষিক সুদে — সহজ কিস্তিতে কৃষি ঋণ</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={load}
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> রিফ্রেশ
            </button>
            <button onClick={() => setApplyPkg({ package_code: 'custom' })}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 transition shadow-sm">
              <Plus size={14} /> নতুন ঋণ আবেদন
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <KpiCard icon={Activity}     label="সক্রিয় ঋণ"    value={activeLoans.length}                                                         from="from-emerald-500" to="to-teal-600"    />
          <KpiCard icon={Banknote}     label="মোট ঋণ গ্রহণ" value={`৳${bn(totalBorrowed)}`}                                                    from="from-blue-500"    to="to-indigo-600"  />
          <KpiCard icon={CheckCircle}  label="পরিশোধিত"     value={`৳${bn(totalPaid)}`}                                                        from="from-green-500"   to="to-emerald-600" />
          <KpiCard icon={TrendingUp}   label="পরিশোধের হার" value={`${repayRate}%`}                                                             from="from-violet-500"  to="to-purple-600"  />
          <KpiCard icon={AlertTriangle}label="বকেয়া"        value={`৳${bn(totalDue)}`}                                                         from="from-rose-500"    to="to-red-600"     />
          <KpiCard icon={Calendar}     label="আগামী কিস্তি" value={nextEmi ? `৳${bn(nextEmi.amount)}` : '—'} sub={nextEmi ? bnDate(nextEmi.due_date) : null} from="from-amber-500" to="to-orange-500" />
        </div>
      </div>

      {/* ══ 2-COL LAYOUT ══ */}
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">

        {/* ─── LEFT ─── */}
        <div className="space-y-5">

          {/* Loan progress card */}
          {primaryLoan ? (
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-600 to-teal-600 p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-5">
                {/* Ring */}
                <div className="relative flex-shrink-0">
                  <ProgressRing percent={primaryPct} size={96} stroke={9} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-white">{primaryPct}%</span>
                    <span className="text-[10px] text-emerald-200">সম্পন্ন</span>
                  </div>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="font-extrabold text-white">{primaryLoan.package_name}</span>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white">ঋণ #{primaryLoan.loan_id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { l: 'মোট ঋণ',        v: `৳${bn(primaryLoan.principal_amount)}` },
                      { l: 'পরিশোধিত',      v: `৳${bn((primaryLoan.paid_installments||0)*primaryLoan.emi_amount)}` },
                      { l: 'বাকি',           v: `৳${bn(Math.max(0, primaryLoan.total_payable-(primaryLoan.paid_installments||0)*primaryLoan.emi_amount))}` },
                      { l: 'পরবর্তী কিস্তি', v: primaryLoan.next_payment_date ? bnDate(primaryLoan.next_payment_date) : '—' },
                    ].map(s => (
                      <div key={s.l} className="rounded-xl bg-white/15 px-3 py-2">
                        <p className="text-[10px] text-emerald-200">{s.l}</p>
                        <p className="text-xs font-extrabold text-white">{s.v}</p>
                      </div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                      <div className="h-2 rounded-full bg-white transition-all duration-700" style={{ width: `${primaryPct}%` }} />
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-emerald-200">
                      <span>{bn(primaryLoan.paid_installments)} কিস্তি পরিশোধিত</span>
                      <span>{bn(primaryLoan.total_installments - primaryLoan.paid_installments)} কিস্তি বাকি</span>
                    </div>
                  </div>
                  {/* Buttons */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => setPayLoan(primaryLoan)}
                      className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-50 transition shadow-sm">
                      <CreditCard size={13} /> কিস্তি পরিশোধ করুন
                    </button>
                    <button onClick={() => expandLoan(primaryLoan.loan_id)}
                      className="flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/30 transition">
                      <BarChart2 size={13} /> কিস্তি সূচি
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
              <div className="text-4xl mb-2">🌾</div>
              <p className="font-extrabold text-emerald-800">কোনো সক্রিয় ঋণ নেই</p>
              <p className="text-sm text-emerald-600 mt-1">একটি ঋণ প্যাকেজ বেছে নিয়ে আবেদন করুন</p>
              <button onClick={() => setApplyPkg({ package_code: 'custom' })}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 transition shadow-sm">
                <Plus size={15} /> ঋণের আবেদন করুন
              </button>
            </div>
          )}

          {/* Active loans */}
          {activeLoans.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 mb-4 font-extrabold text-gray-900">
                <CreditCard className="text-emerald-600" size={18} /> সক্রিয় ঋণসমূহ
              </h2>
              <div className="space-y-3">
                {activeLoans.map((loan) => {
                  const paidAmt = Math.min(loan.total_payable, (loan.paid_installments || 0) * loan.emi_amount);
                  const dueAmt  = Math.max(0, loan.total_payable - paidAmt);
                  const pct     = loan.total_installments ? Math.round((loan.paid_installments / loan.total_installments) * 100) : 0;
                  const isExp   = expandedLoan === loan.loan_id;
                  return (
                    <div key={loan.loan_id} className="overflow-hidden rounded-2xl border border-gray-100 hover:border-emerald-200 transition">
                      {/* Header */}
                      <button type="button" onClick={() => expandLoan(loan.loan_id)}
                        className="flex w-full items-center gap-4 p-4 text-left hover:bg-gray-50 transition">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                          {loan.icon || '💰'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-extrabold text-gray-900 text-sm">{loan.package_name}</p>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">সক্রিয়</span>
                          </div>
                          <p className="text-xs text-gray-500">৳{bn(loan.principal_amount)} · কিস্তি ৳{bn(loan.emi_amount)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-extrabold text-emerald-700">{pct}%</p>
                          <p className="text-[10px] text-gray-400">{bn(loan.paid_installments)}/{bn(loan.total_installments)}</p>
                        </div>
                        <ChevronRight size={16} className={`text-gray-300 flex-shrink-0 transition-transform ${isExp ? 'rotate-90' : ''}`} />
                      </button>
                      {/* Progress */}
                      <div className="px-4 pb-4">
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
                            style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {[
                            { l: 'মোট ঋণ',    v: `৳${bn(loan.principal_amount)}`, c: 'text-gray-800'    },
                            { l: 'পরিশোধিত',  v: `৳${bn(paidAmt)}`,               c: 'text-emerald-700' },
                            { l: 'বকেয়া',     v: `৳${bn(dueAmt)}`,                c: 'text-amber-700'   },
                            { l: 'পরবর্তী কিস্তি', v: loan.next_payment_date ? bnDate(loan.next_payment_date) : '—', c: 'text-gray-700' },
                          ].map(s => (
                            <div key={s.l} className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                              <p className="text-[10px] text-gray-400">{s.l}</p>
                              <p className={`text-xs font-extrabold ${s.c}`}>{s.v}</p>
                            </div>
                          ))}
                        </div>
                        {loan.status === 'active' && (
                          <button type="button" onClick={() => setPayLoan(loan)}
                            className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 transition shadow-sm">
                            <CreditCard size={13} /> কিস্তি দিন
                          </button>
                        )}
                      </div>

                      {/* EMI Schedule (expanded) */}
                      {isExp && loanDetail?.loan?.loan_id === loan.loan_id && (
                        <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-4">
                          <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-gray-400">কিস্তি সূচি</p>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {loanDetail.installments?.map((inst) => {
                              const m = INST_META[inst.status] || INST_META.pending;
                              return (
                                <div key={inst.installment_id}
                                  className={`flex-shrink-0 rounded-2xl border p-3 text-center min-w-[90px] bg-white ${m.cls}`}>
                                  <p className="text-[10px] font-bold">{bn(inst.installment_no)}ম কিস্তি</p>
                                  <p className="text-sm font-extrabold mt-0.5">৳{bn(loan.emi_amount)}</p>
                                  <p className="text-[10px] mt-1">{bnDate(inst.due_date)}</p>
                                  <span className={cn('mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[9px] font-extrabold', m.cls)}>
                                    {m.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loan packages */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 font-extrabold text-gray-900">
                <Wallet className="text-emerald-600" size={18} /> ঋণ প্যাকেজ
              </h2>
              <button onClick={() => setApplyPkg({ package_code: 'custom' })}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
                কাস্টম আবেদন <ArrowRight size={13} />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {packages.map((pkg) => (
                <div key={pkg.package_id}
                  className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 hover:border-emerald-300 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-2xl group-hover:bg-emerald-100 transition">
                      {pkg.icon || '💰'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-gray-900 text-sm leading-snug">{pkg.name}</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{pkg.purpose}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-base font-extrabold text-emerald-700">৳{bn(pkg.amount)}</span>
                        <span className="text-[10px] text-gray-400">{pkg.duration_months} মাস</span>
                        <span className="text-[10px] text-gray-400">কিস্তি ৳{bn(pkg.emi)}</span>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setApplyPkg(pkg)}
                    className="mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2 text-xs font-extrabold text-white hover:from-emerald-700 hover:to-teal-700 transition shadow-sm">
                    আবেদন করুন
                  </button>
                </div>
              ))}
              {packages.length === 0 && (
                <div className="col-span-2 rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
                  কোনো প্যাকেজ পাওয়া যায়নি
                </div>
              )}
            </div>
          </div>

          {/* Applications */}
          {applications.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 mb-4 font-extrabold text-gray-900">
                <Receipt className="text-emerald-600" size={18} /> আমার আবেদনসমূহ
              </h2>
              <div className="space-y-3">
                {applications.map((app) => {
                  const st = APP_STATUS[app.status] || APP_STATUS.pending;
                  return (
                    <div key={app.application_id}
                      className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4 hover:bg-white hover:border-gray-200 transition">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-extrabold text-gray-900 text-sm">{app.package_name || 'কাস্টম ঋণ'}</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <span>৳{bn(app.requested_amount)}</span>
                            <span>·</span>
                            <span>{bnDate(app.applied_at)}</span>
                          </div>
                        </div>
                        <span className={cn('rounded-full px-3 py-1.5 text-xs font-extrabold border', st.color)}>
                          {st.label}
                        </span>
                      </div>
                      {app.timeline && (
                        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
                          {app.timeline.map((step) => (
                            <div key={step.key}
                              className={cn('flex-shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold',
                                step.done ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'
                              )}>
                              {step.done ? '✓ ' : ''}{step.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment History */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 mb-4 font-extrabold text-gray-900">
              <Clock className="text-emerald-600" size={18} /> পেমেন্ট ইতিহাস
            </h2>
            {payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-16 text-center">
                <div className="text-4xl mb-3">💳</div>
                <p className="font-extrabold text-gray-500">কোনো পেমেন্ট নেই</p>
                <p className="text-xs text-gray-400 mt-1">কিস্তি পরিশোধ করলে এখানে দেখাবে</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500">
                      <th className="px-4 py-3 font-semibold">তারিখ</th>
                      <th className="px-4 py-3 font-semibold">পরিমাণ</th>
                      <th className="px-4 py-3 font-semibold hidden sm:table-cell">পদ্ধতি</th>
                      <th className="px-4 py-3 font-semibold hidden md:table-cell">ট্রানজেকশন</th>
                      <th className="px-4 py-3 font-semibold">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments.map((p) => {
                      const ps = PAY_STATUS[p.status] || PAY_STATUS.success;
                      return (
                        <tr key={p.payment_id} className="hover:bg-gray-50/50 transition">
                          <td className="px-4 py-3 text-xs text-gray-700">{bnDate(p.paid_at)}</td>
                          <td className="px-4 py-3 font-extrabold text-emerald-700">৳{bn(p.amount)}</td>
                          <td className="px-4 py-3 text-xs text-gray-600 hidden sm:table-cell">{p.payment_method}</td>
                          <td className="max-w-[100px] truncate px-4 py-3 text-[11px] text-gray-400 hidden md:table-cell">{p.transaction_ref}</td>
                          <td className="px-4 py-3">
                            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-extrabold', ps.color)}>{ps.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT SIDEBAR ─── */}
        <div className="space-y-4">

          {/* Credit Score */}
          {elig && (
            <div className={cn('rounded-2xl border p-4 shadow-sm', scoreData.bg)}>
              <div className="flex items-center gap-2 mb-3">
                <Shield className={`${scoreData.text}`} size={16} />
                <h3 className={`font-extrabold text-sm ${scoreData.text}`}>কৃষক ক্রেডিট স্কোর</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <ProgressRing percent={elig.eligibility_score} size={72} stroke={7}
                    color={elig.eligibility_score >= 60 ? '#059669' : elig.eligibility_score >= 40 ? '#d97706' : '#dc2626'}
                    track="#e5e7eb" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-lg font-extrabold ${scoreData.text}`}>{elig.eligibility_score}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 mb-1.5 ${scoreData.bg}`}>
                    <span className={`text-xs font-extrabold ${scoreData.text}`}>{scoreData.label}</span>
                  </div>
                  {/* Color scale */}
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full">
                    {[
                      { w: '25%', cls: 'bg-red-400' }, { w: '25%', cls: 'bg-amber-400' },
                      { w: '25%', cls: 'bg-teal-400' }, { w: '25%', cls: 'bg-emerald-500' },
                    ].map((s, i) => <div key={i} style={{ width: s.w }} className={s.cls} />)}
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-400 mt-0.5">
                    <span>কম</span><span>মধ্যম</span><span>ভালো</span><span>উত্তম</span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-gray-600">নিয়মিত EMI পরিশোধ করলে স্কোর বাড়বে</p>
              <div className="mt-2 text-[10px] text-gray-500">
                সুপারিশকৃত ঋণ: <span className="font-extrabold text-emerald-700">৳{bn(elig.recommended_amount)}</span> · {elig.approval_probability}% অনুমোদন সম্ভাবনা
              </div>
            </div>
          )}

          {/* Upcoming EMI */}
          {nextEmi && (
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="text-amber-600" size={16} />
                <h3 className="font-extrabold text-amber-900 text-sm">আগামী কিস্তি</h3>
              </div>
              <div className="text-2xl font-extrabold text-amber-700">৳{bn(nextEmi.amount)}</div>
              <p className="text-xs text-amber-700 mt-0.5">{bnDate(nextEmi.due_date)}</p>
              {daysLeft !== null && (
                <div className={cn(
                  'mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold',
                  daysLeft <= 3 ? 'bg-red-100 text-red-700' : daysLeft <= 7 ? 'bg-amber-200 text-amber-800' : 'bg-amber-100 text-amber-700'
                )}>
                  <Clock size={10} />
                  {daysLeft === 0 ? 'আজ শেষ দিন!' : `${daysLeft} দিন বাকি`}
                </div>
              )}
              {primaryLoan && (
                <button onClick={() => setPayLoan(primaryLoan)}
                  className="mt-3 w-full rounded-xl bg-amber-500 py-2.5 text-xs font-extrabold text-white hover:bg-amber-600 transition shadow-sm">
                  এখনই পরিশোধ করুন
                </button>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 mb-3 font-extrabold text-gray-900 text-sm">
              <Zap className="text-emerald-500" size={15} /> দ্রুত অ্যাকশন
            </h3>
            <div className="space-y-1.5">
              {[
                { icon: Plus,       label: 'নতুন ঋণ আবেদন',       action: () => setApplyPkg({ package_code: 'custom' }), color: 'text-emerald-600' },
                { icon: CreditCard, label: 'কিস্তি পরিশোধ করুন',  action: primaryLoan ? () => setPayLoan(primaryLoan) : null, color: 'text-blue-600' },
                { icon: BarChart2,  label: 'কিস্তি সূচি দেখুন',   action: primaryLoan ? () => expandLoan(primaryLoan.loan_id) : null, color: 'text-purple-600' },
                { icon: Receipt,    label: 'পেমেন্ট হিস্ট্রি',    action: null, color: 'text-amber-600' },
                { icon: HelpCircle, label: 'সহায়তা কেন্দ্র',      action: null, color: 'text-gray-500' },
              ].map(a => (
                <button key={a.label} disabled={!a.action} onClick={a.action}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition disabled:opacity-40 disabled:cursor-not-allowed">
                  <a.icon className={`${a.color} flex-shrink-0`} size={15} />
                  <span className="text-gray-700 font-medium">{a.label}</span>
                  <ChevronRight size={13} className="ml-auto text-gray-300" />
                </button>
              ))}
            </div>
          </div>

          {/* Loan Insights */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="flex items-center gap-2 mb-3 font-extrabold text-gray-900 text-sm">
              <BarChart2 className="text-emerald-500" size={15} /> ঋণ অন্তর্দৃষ্টি
            </h3>
            <div className="space-y-3">
              {[
                { label: 'মোট ঋণ গ্রহণ',   value: `৳${bn(totalBorrowed)}`, color: 'bg-blue-500',    w: '100%' },
                { label: 'মোট পরিশোধিত',   value: `৳${bn(totalPaid)}`,     color: 'bg-emerald-500', w: `${Math.min(100, totalBorrowed ? Math.round(totalPaid/totalBorrowed*100) : 0)}%` },
                { label: 'বকেয়া পরিমাণ',  value: `৳${bn(totalDue)}`,      color: 'bg-amber-500',   w: `${Math.min(100, totalBorrowed ? Math.round(totalDue/totalBorrowed*100) : 0)}%` },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">{s.label}</span>
                    <span className="font-extrabold text-gray-800">{s.value}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-1.5 rounded-full ${s.color} transition-all`} style={{ width: s.w }} />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 mt-1">
                <span className="text-xs text-emerald-700 font-semibold">পরিশোধের হার</span>
                <span className="text-sm font-extrabold text-emerald-700">{repayRate}%</span>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm text-center">
            <HelpCircle className="mx-auto mb-2 text-blue-500" size={28} />
            <p className="font-extrabold text-blue-900 text-sm">সহায়তা প্রয়োজন?</p>
            <p className="text-[11px] text-blue-700 mt-0.5">ঋণ সংক্রান্ত যেকোনো প্রশ্নের জন্য আমাদের দলের সাথে যোগাযোগ করুন।</p>
            <button className="mt-3 w-full rounded-xl bg-blue-600 py-2 text-xs font-extrabold text-white hover:bg-blue-700 transition">
              সহায়তা কেন্দ্র
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {applyPkg && (
        <LoanApplicationForm
          pkg={applyPkg.package_code === 'custom' ? null : applyPkg}
          user={user}
          onClose={() => setApplyPkg(null)}
          onSuccess={load}
        />
      )}
      {payLoan && (
        <LoanPaymentModal
          loan={payLoan}
          onClose={() => setPayLoan(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
