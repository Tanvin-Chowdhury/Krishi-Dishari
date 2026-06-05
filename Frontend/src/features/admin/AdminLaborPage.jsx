import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { adminApi } from '../../shared/services/adminApi';
import {
  AdminPageShell,
  Badge,
  TableShell,
} from './components/AdminPageShell';
import { bn, bnDate } from './adminUtils';

export default function AdminLaborPage() {
  const [tab, setTab] = useState('profiles');
  const [labors, setLabors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [jobPosts, setJobPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'profiles') {
        const res = await adminApi.listLabors({ limit: 50 });
        setLabors(res.labour ?? res.labors ?? res.data?.labour ?? []);
      } else if (tab === 'requests') {
        const res = await adminApi.listLaborRequests({ limit: 50 });
        setRequests(res.requests ?? res.data?.requests ?? []);
      } else {
        const res = await adminApi.listLaborJobs({ limit: 50 });
        setJobPosts(res.posts ?? res.data?.posts ?? []);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const verify = async (userId, is_verified) => {
    try {
      await adminApi.verifyLabor(userId, { is_verified });
      toast.success(is_verified ? 'যাচাই সম্পন্ন' : 'যাচাই প্রত্যাখ্যান');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const removeJob = async (id) => {
    if (!window.confirm('এই কাজের পোস্টটি মুছে ফেলবেন?')) return;
    try {
      await adminApi.removeLaborJob(id);
      toast.success('পোস্ট মুছে ফেলা হয়েছে');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const JOB_STATUS_LABEL = { open: 'খোলা', filled: 'পূর্ণ', closed: 'বন্ধ' };

  return (
    <AdminPageShell title="শ্রম ব্যবস্থাপনা" subtitle="প্রোফাইল যাচাই ও হায়ার অনুরোধ">
      <div className="mb-4 flex gap-2">
        {[
          { id: 'profiles', label: 'প্রোফাইল' },
          { id: 'requests', label: 'অনুরোধ' },
          { id: 'jobs', label: 'কাজ পোস্ট' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
              tab === t.id ? 'bg-emerald-600 text-white' : 'bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'jobs' ? (
        <TableShell
          loading={loading}
          empty={!loading && jobPosts.length === 0}
          headers={['কাজ', 'পোস্টকারী', 'মজুরি/দিন', 'আবেদন', 'স্ট্যাটাস', '']}
        >
          {jobPosts.map((p) => (
            <tr key={p.job_post_id} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 font-medium">{p.job_title}</td>
              <td className="px-4 py-3 text-xs">{p.poster_name}</td>
              <td className="px-4 py-3">৳{bn(p.wage_per_day)}</td>
              <td className="px-4 py-3 text-xs">{bn(p.application_count)} ({bn(p.accepted_count)} গৃহীত)</td>
              <td className="px-4 py-3">
                <Badge className="bg-slate-100 text-slate-700">
                  {JOB_STATUS_LABEL[p.status] || p.status}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => removeJob(p.job_post_id)}
                  className="text-xs font-semibold text-red-600 hover:underline"
                >
                  মুছুন
                </button>
              </td>
            </tr>
          ))}
        </TableShell>
      ) : tab === 'profiles' ? (
        <TableShell
          loading={loading}
          empty={!loading && labors.length === 0}
          headers={['নাম', 'দক্ষতা', 'দৈনিক ভাড়া', 'যাচাই', '']}
        >
          {labors.map((l) => (
            <tr key={l.user_id} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 font-medium">{l.full_name}</td>
              <td className="px-4 py-3 text-xs">{l.skill_type_name || '—'}</td>
              <td className="px-4 py-3">৳{bn(l.daily_rate)}</td>
              <td className="px-4 py-3">
                <Badge className={l.is_verified ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
                  {l.is_verified ? 'যাচাইকৃত' : 'অপেক্ষমাণ'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                {!l.is_verified ? (
                  <button
                    type="button"
                    onClick={() => verify(l.user_id, true)}
                    className="text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    যাচাই করুন
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => verify(l.user_id, false)}
                    className="text-xs text-slate-400 hover:underline"
                  >
                    প্রত্যাখ্যান
                  </button>
                )}
              </td>
            </tr>
          ))}
        </TableShell>
      ) : (
        <TableShell
          loading={loading}
          empty={!loading && requests.length === 0}
          headers={['কাজ', 'অনুরোধকারী', 'শ্রমিক', 'পেমেন্ট', 'স্ট্যাটাস', 'তারিখ']}
        >
          {requests.map((r) => (
            <tr key={r.booking_id} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 font-medium">{r.work_title}</td>
              <td className="px-4 py-3 text-xs">{r.requester_name}</td>
              <td className="px-4 py-3 text-xs">{r.labor_name}</td>
              <td className="px-4 py-3">৳{bn(r.payment_amount)}</td>
              <td className="px-4 py-3">
                <Badge className="bg-slate-100 text-slate-700">{r.status_name}</Badge>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{bnDate(r.created_at)}</td>
            </tr>
          ))}
        </TableShell>
      )}
    </AdminPageShell>
  );
}
