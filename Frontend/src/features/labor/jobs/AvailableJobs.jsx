import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Search, MapPin, Users, Clock, Banknote, Briefcase } from 'lucide-react';
import { laborApi } from '../../../shared/services/laborApi';
import { WORK_TYPE_OPTIONS, WORK_TYPE_LABEL, JOB_POST_STATUS_META } from '../laborConstants';
import JobBadge from './JobBadge';

const bn = (n) => Number(n || 0).toLocaleString('bn-BD');

export default function AvailableJobs() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [workType, setWorkType] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await laborApi.listJobs({ search, work_type: workType, status: 'open' });
      setPosts(res.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [search, workType]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">কাজ খুঁজুন</h1>
        <p className="text-sm text-gray-500">কৃষক ও পাইকারদের পোস্ট করা কাজে আবেদন করুন</p>
        <Link to="/app/labor/my-applications" className="text-sm text-emerald-600 font-semibold">
          আমার আবেদনসমূহ →
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            placeholder="কাজ, স্থান খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
        >
          <option value="">সব ধরন</option>
          {WORK_TYPE_OPTIONS.map((w) => (
            <option key={w.code} value={w.code}>{w.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">লোড হচ্ছে...</p>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">এই মুহূর্তে কোনো খোলা কাজ নেই</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {posts.map((p) => (
            <Link
              key={p.id}
              to={`/app/labor/jobs/${p.id}`}
              className="block bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-bold text-gray-800 leading-snug">{p.job_title}</h3>
                <JobBadge meta={JOB_POST_STATUS_META[p.status]} />
              </div>
              {p.work_description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.work_description}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                <Pill icon={Banknote} text={`৳${bn(p.wage_per_day)}/দিন`} tone="emerald" />
                <Pill icon={Clock} text={`${bn(p.duration_days)} দিন`} />
                <Pill icon={Users} text={`${bn(p.required_workers)} জন`} />
                {p.work_type && <Pill icon={Briefcase} text={WORK_TYPE_LABEL[p.work_type] || p.work_type} />}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5" /> {p.location || '—'}
                </span>
                <span className="text-xs text-gray-400">{p.poster_name}</span>
              </div>
            </Link>
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
