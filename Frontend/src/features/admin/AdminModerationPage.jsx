import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../shared/services/adminApi';
import {
  AdminPageShell,
  Badge,
  TableShell,
} from './components/AdminPageShell';
import { bnDate } from './adminUtils';

export default function AdminModerationPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listReports({ status, limit: 50 });
      setReports(res.reports ?? res.data?.reports ?? []);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const resolve = async (id, action) => {
    try {
      await adminApi.resolveReport(id, { action, notes: action === 'dismiss' ? 'খারিজ' : 'সমাধান' });
      toast.success('রিপোর্ট আপডেট হয়েছে');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <AdminPageShell title="মডারেশন সেন্টার" subtitle="রিপোর্টকৃত কন্টেন্ট ও ব্যবহারকারী">
      <div className="mb-4 flex gap-2">
        {['pending', 'resolved', 'dismissed'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
              status === s ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {s === 'pending' ? 'অপেক্ষমাণ' : s === 'resolved' ? 'সমাধান' : 'খারিজ'}
          </button>
        ))}
      </div>

      <TableShell
        loading={loading}
        empty={!loading && reports.length === 0}
        headers={['ধরন', 'কারণ', 'রিপোর্টার', 'স্ট্যাটাস', 'তারিখ', '']}
      >
        {reports.map((r) => (
          <tr key={r.report_id} className="hover:bg-slate-50/50">
            <td className="px-4 py-3 text-xs font-medium">{r.target_type}</td>
            <td className="max-w-xs truncate px-4 py-3 text-xs text-slate-600">{r.reason}</td>
            <td className="px-4 py-3 text-xs">{r.reporter_name || '—'}</td>
            <td className="px-4 py-3">
              <Badge className="bg-slate-100 text-slate-700">{r.status}</Badge>
            </td>
            <td className="px-4 py-3 text-xs text-slate-500">{bnDate(r.created_at)}</td>
            <td className="px-4 py-3">
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => resolve(r.report_id, 'resolve')}
                    className="text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    সমাধান
                  </button>
                  <button
                    type="button"
                    onClick={() => resolve(r.report_id, 'dismiss')}
                    className="text-xs text-slate-400 hover:underline"
                  >
                    খারিজ
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </TableShell>
    </AdminPageShell>
  );
}
