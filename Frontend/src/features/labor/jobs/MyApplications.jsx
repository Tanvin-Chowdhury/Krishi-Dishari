import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Phone, Banknote, Clock, Briefcase } from 'lucide-react';
import { laborApi } from '../../../shared/services/laborApi';
import { APPLICATION_STATUS_META } from '../laborConstants';
import JobBadge from './JobBadge';

const bn = (n) => Number(n || 0).toLocaleString('bn-BD');

export default function MyApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await laborApi.myApplications();
      setApps(res.applications || []);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const withdraw = async (id) => {
    if (!window.confirm('আবেদন প্রত্যাহার করবেন?')) return;
    await laborApi.withdrawApplication(id);
    load();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">আমার আবেদনসমূহ</h1>
        <Link to="/app/labor/jobs" className="text-sm text-emerald-600 font-semibold">
          কাজ খুঁজুন →
        </Link>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">লোড হচ্ছে...</p>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">আপনি এখনও কোনো কাজে আবেদন করেননি</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <Link to={`/app/labor/jobs/${a.job_post_id}`} className="font-bold text-gray-800 hover:text-emerald-700">
                    {a.job_title}
                  </Link>
                  <div className="flex flex-wrap gap-2 text-xs mt-2">
                    <Pill icon={Banknote} text={`৳${bn(a.wage_per_day)}/দিন`} tone="emerald" />
                    <Pill icon={Clock} text={`${bn(a.duration_days)} দিন`} />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">পোস্টকারী: {a.poster_name}</p>
                </div>
                <JobBadge meta={APPLICATION_STATUS_META[a.status]} />
              </div>

              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                {a.contact_phone && (a.status === 'accepted') && (
                  <a href={`tel:${a.contact_phone}`} className="inline-flex items-center gap-1 text-sm text-emerald-700 font-semibold">
                    <Phone className="w-3.5 h-3.5" /> কল করুন
                  </a>
                )}
                {a.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => withdraw(a.id)}
                    className="text-sm text-red-600 font-semibold ml-auto"
                  >
                    আবেদন প্রত্যাহার
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Pill({ icon: Icon, text, tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold ${
        tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {text}
    </span>
  );
}
