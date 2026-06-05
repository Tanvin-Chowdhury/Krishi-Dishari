import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FileSpreadsheet, FileText, Inbox } from 'lucide-react';
import { loanApi } from '../../../shared/services/loanApi';
import { bn, bnDate, monthLabel } from '../loanUtils';
import { cn } from '../../../shared/lib/cn';

const REPORT_TYPES = [
  { key: 'monthly_distribution', label: 'মাসিক ঋণ বিতরণ' },
  { key: 'monthly_collection', label: 'মাসিক আদায়' },
  { key: 'overdue', label: 'বকেয়া রিপোর্ট' },
  { key: 'completed', label: 'সম্পন্ন ঋণ' },
  { key: 'borrower_wise', label: 'গ্রহীতা-ভিত্তিক' },
];

const MONEY_KEYS = new Set([
  'amount', 'due_amount', 'loan_amount', 'total_payable', 'total_principal', 'total_paid', 'total_due',
]);

function renderCell(key, value) {
  if (value == null || value === '') return '—';
  if (key === 'month') return monthLabel(value);
  if (/_at$|_date$/.test(key)) return bnDate(value);
  if (MONEY_KEYS.has(key)) return `৳${bn(value)}`;
  if (typeof value === 'number') return bn(value);
  return String(value);
}

export default function LoanAdminReports() {
  const [type, setType] = useState('monthly_distribution');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await loanApi.adminReport(type);
      setReport(res.report ?? res.data?.report ?? null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  const doExport = async (format) => {
    setExporting(format);
    try {
      await loanApi.adminReportExport(type, format);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {REPORT_TYPES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setType(r.key)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition',
                type === r.key
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={exporting !== '' || !report?.rows?.length}
            onClick={() => doExport('csv')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            <FileSpreadsheet size={15} /> {exporting === 'csv' ? '...' : 'Excel'}
          </button>
          <button
            type="button"
            disabled={exporting !== '' || !report?.rows?.length}
            onClick={() => doExport('pdf')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
          >
            <FileText size={15} /> {exporting === 'pdf' ? '...' : 'PDF'}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-px p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-slate-100" />
            ))}
          </div>
        ) : !report || report.rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Inbox className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-400">এই রিপোর্টে কোনো তথ্য নেই</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {report.columns.map((c) => (
                    <th key={c.key} className="px-4 py-3">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    {report.columns.map((c) => (
                      <td key={c.key} className="px-4 py-2.5 tabular-nums text-slate-700">
                        {renderCell(c.key, row[c.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
