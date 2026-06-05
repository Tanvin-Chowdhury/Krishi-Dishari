import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Briefcase,
  Bell,
  CheckCircle2,
  X,
  Play,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { laborApi } from '../../shared/services/laborApi';
import StatusBadge from './components/StatusBadge';
import { SKILL_OPTIONS } from './laborConstants';
import { useLaborSocket } from './useLaborSocket';

const TABS = [
  { id: 'requests', label: 'আগত অনুরোধ' },
  { id: 'active', label: 'চলমান কাজ' },
  { id: 'history', label: 'ইতিহাস' },
  { id: 'profile', label: 'প্রোফাইল' },
];

export default function MyLaborDashboard() {
  const [tab, setTab] = useState('requests');
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({});
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, reqRes, asgRes, histRes, profRes] = await Promise.all([
        laborApi.workerSummary(),
        laborApi.workerRequests({ limit: 30 }),
        laborApi.workerAssigned(),
        laborApi.workerHistory(),
        laborApi.workerProfile(),
      ]);
      setSummary(sumRes.summary);
      setRequests(reqRes.requests || []);
      setAssigned(asgRes.assignments || []);
      setHistory(histRes.history || []);
      const p = profRes.profile;
      setProfile(p);
      setProfileForm({
        daily_rate: p?.daily_rate ?? '',
        experience_years: p?.experience_years ?? '',
        bio: p?.bio ?? '',
        skills: Array.isArray(p?.skills) ? p.skills : [],
      });
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useLaborSocket(refresh);

  const toggleAvailability = async () => {
    const next = !summary?.available_status;
    await laborApi.setAvailability(next);
    refresh();
  };

  const respond = async (id, action) => {
    await laborApi.respondRequest(id, action);
    refresh();
  };

  const startJob = async (id) => {
    await laborApi.startJob(id);
    refresh();
  };

  const completeJob = async (id) => {
    await laborApi.completeJob(id);
    refresh();
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await laborApi.updateProfile({
        daily_rate: +profileForm.daily_rate || null,
        experience_years: +profileForm.experience_years || null,
        bio: profileForm.bio,
        skills: profileForm.skills,
      });
      await refresh();
      setTab('requests');
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (code) => {
    setProfileForm((f) => ({
      ...f,
      skills: f.skills.includes(code)
        ? f.skills.filter((c) => c !== code)
        : [...f.skills, code],
    }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">শ্রমিক ড্যাশবোর্ড</h1>
          <Link to="/app/labor" className="text-sm text-emerald-600">
            বাজার দেখুন
          </Link>
        </div>
        <button
          type="button"
          onClick={toggleAvailability}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold"
        >
          {summary?.available_status ? (
            <ToggleRight className="text-emerald-600" />
          ) : (
            <ToggleLeft className="text-gray-400" />
          )}
          {summary?.available_status ? 'উপলব্ধ' : 'ব্যস্ত'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MiniStat label="অপেক্ষমাণ" value={summary?.pending_count ?? 0} />
        <MiniStat label="চলমান" value={summary?.active_count ?? 0} />
        <MiniStat label="সম্পন্ন" value={summary?.completed_count ?? 0} />
        <MiniStat label="আয় (৳)" value={summary?.total_earned ?? 0} />
      </div>

      <div className="flex gap-2 overflow-x-auto mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
              tab === t.id ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-8">লোড হচ্ছে...</p>
      ) : (
        <>
          {tab === 'requests' && (
            <List
              empty="কোনো অনুরোধ নেই"
              items={requests.filter((r) => r.status_id === 1)}
              render={(r) => (
                <JobRow key={r.booking_id} title={r.work_title} sub={r.farmer_name} meta={r.payment_amount}>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => respond(r.booking_id, 'accept')}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 size={14} /> গ্রহণ
                    </button>
                    <button
                      type="button"
                      onClick={() => respond(r.booking_id, 'reject')}
                      className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                    >
                      <X size={14} /> প্রত্যাখ্যান
                    </button>
                  </div>
                </JobRow>
              )}
            />
          )}

          {tab === 'active' && (
            <List
              empty="চলমান কাজ নেই"
              items={assigned}
              render={(r) => (
                <JobRow
                  key={r.booking_id}
                  title={r.work_title}
                  sub={r.farmer_name}
                  badge={<StatusBadge status={r.status_id === 2 ? 'ACCEPTED' : 'ACTIVE'} />}
                >
                  <div className="flex gap-2 mt-2">
                    {r.status_id === 2 && (
                      <button
                        type="button"
                        onClick={() => startJob(r.booking_id)}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                      >
                        <Play size={14} /> শুরু করুন
                      </button>
                    )}
                    {r.status_id === 3 && (
                      <button
                        type="button"
                        onClick={() => completeJob(r.booking_id)}
                        className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold"
                      >
                        সম্পন্ন করুন
                      </button>
                    )}
                  </div>
                </JobRow>
              )}
            />
          )}

          {tab === 'history' && (
            <List
              empty="ইতিহাস খালি"
              items={history}
              render={(r) => (
                <JobRow
                  key={r.booking_id}
                  title={r.work_title}
                  sub={r.farmer_name}
                  badge={<StatusBadge status={r.status_id === 4 ? 'COMPLETED' : 'CANCELLED'} />}
                />
              )}
            />
          )}

          {tab === 'profile' && (
            <form onSubmit={saveProfile} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-gray-800">প্রোফাইল সম্পাদনা</h2>
              <Field label="দৈনিক মজুরি (৳)">
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={profileForm.daily_rate}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, daily_rate: e.target.value }))
                  }
                />
              </Field>
              <Field label="অভিজ্ঞতা (বছর)">
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={profileForm.experience_years}
                  onChange={(e) =>
                    setProfileForm((f) => ({ ...f, experience_years: e.target.value }))
                  }
                />
              </Field>
              <Field label="বায়ো">
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))}
                />
              </Field>
              <Field label="দক্ষতা">
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((s) => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => toggleSkill(s.code)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        profileForm.skills?.includes(s.code)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </Field>
              {profile && (
                <p className="text-xs text-gray-500">
                  রেটিং: {profile.avg_rating} · {profile.total_reviews} রিভিউ
                </p>
              )}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-60"
              >
                {saving ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="text-xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function List({ items, empty, render }) {
  if (!items?.length) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-gray-500 text-sm">{empty}</div>
    );
  }
  return <div className="space-y-3">{items.map(render)}</div>;
}

function JobRow({ title, sub, meta, badge, children }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-start gap-2">
        <div>
          <p className="font-bold text-gray-800">{title}</p>
          <p className="text-sm text-gray-600">{sub}</p>
          {meta != null && (
            <p className="text-sm text-emerald-600 mt-1">৳{meta}/দিন</p>
          )}
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
