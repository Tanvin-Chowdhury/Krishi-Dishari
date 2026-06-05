import { useCallback, useContext, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import {
  ArrowLeft, MapPin, Users, Clock, Banknote, Phone, Calendar,
  Briefcase, CheckCircle2, XCircle, Star, BadgeCheck,
} from 'lucide-react';
import { AuthContext } from '../../../core/auth/AuthContext';
import { laborApi } from '../../../shared/services/laborApi';
import {
  JOB_POST_STATUS_META, APPLICATION_STATUS_META, WORK_TYPE_LABEL,
  LABOR_ROLE, PLACEHOLDER_AVATAR,
} from '../laborConstants';
import JobBadge from './JobBadge';

const bn = (n) => Number(n || 0).toLocaleString('bn-BD');

export default function JobPostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const role = user?.role_id ?? 0;

  const [post, setPost] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await laborApi.getJob(id);
      setPost(res.post);
      if (res.post?.is_owner) {
        const a = await laborApi.jobApplications(id);
        setApplicants(a.applications || []);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const apply = async () => {
    setBusy(true);
    setError('');
    try {
      await laborApi.applyJob(id, message);
      setShowApply(false);
      setMessage('');
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async (appId) => {
    if (!window.confirm('আবেদন প্রত্যাহার করবেন?')) return;
    await laborApi.withdrawApplication(appId);
    load();
  };

  const respond = async (appId, action) => {
    if (action === 'accept') await laborApi.acceptApplication(appId);
    else await laborApi.rejectApplication(appId);
    load();
  };

  const closePost = async () => {
    if (!window.confirm('পোস্ট বন্ধ করবেন?')) return;
    await laborApi.closeJob(id);
    load();
  };

  if (loading) return <p className="text-center text-gray-500 py-16">লোড হচ্ছে...</p>;
  if (!post) return <p className="text-center text-gray-500 py-16">{error || 'পাওয়া যায়নি'}</p>;

  const isLabor = role === LABOR_ROLE;
  const isOwner = post.is_owner;
  const myApp = post.my_application;
  const canApply = isLabor && !isOwner && post.status === 'open' &&
    (!myApp || myApp.status === 'withdrawn');

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> ফিরে যান
      </button>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-start gap-3 mb-3">
          <h1 className="text-2xl font-bold text-gray-800">{post.job_title}</h1>
          <JobBadge meta={JOB_POST_STATUS_META[post.status]} />
        </div>
        {post.work_description && <p className="text-gray-600 mb-4">{post.work_description}</p>}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <Info icon={Banknote} label="দৈনিক মজুরি" value={`৳${bn(post.wage_per_day)}`} />
          <Info icon={Clock} label="মেয়াদ" value={`${bn(post.duration_days)} দিন`} />
          <Info icon={Users} label="শ্রমিক প্রয়োজন" value={`${bn(post.required_workers)} জন`} />
          <Info icon={Briefcase} label="ধরন" value={WORK_TYPE_LABEL[post.work_type] || post.work_type || '—'} />
          <Info icon={Calendar} label="শুরু" value={post.start_date ? String(post.start_date).slice(0, 10) : '—'} />
          <Info icon={MapPin} label="স্থান" value={post.location || '—'} />
        </div>

        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-emerald-800">আনুমানিক মোট খরচ</span>
          <span className="text-lg font-extrabold text-emerald-700">৳{bn(post.total_estimated_cost)}</span>
        </div>

        <p className="text-xs text-gray-400 mt-4">পোস্টকারী: {post.poster_name}</p>
      </div>

      {/* Labor actions */}
      {isLabor && !isOwner && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mt-4">
          {myApp && myApp.status !== 'withdrawn' ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                আপনার আবেদন: <JobBadge meta={APPLICATION_STATUS_META[myApp.status]} />
              </div>
              <div className="flex items-center gap-3">
                {post.contact_phone && myApp.status === 'accepted' && (
                  <a href={`tel:${post.contact_phone}`} className="inline-flex items-center gap-1 text-sm text-emerald-700 font-semibold">
                    <Phone className="w-4 h-4" /> কল করুন
                  </a>
                )}
                {myApp.status === 'pending' && (
                  <button onClick={() => withdraw(myApp.application_id)} className="text-sm text-red-600 font-semibold">
                    প্রত্যাহার
                  </button>
                )}
              </div>
            </div>
          ) : canApply ? (
            <button
              onClick={() => setShowApply(true)}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold"
            >
              এই কাজে আবেদন করুন
            </button>
          ) : (
            <p className="text-sm text-center text-gray-500">এই পোস্টে আর আবেদন করা যাচ্ছে না</p>
          )}
        </div>
      )}

      {/* Owner: applicants */}
      {isOwner && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800">আবেদনকারী ({bn(applicants.length)})</h2>
            <div className="flex items-center gap-3">
              {post.status !== 'closed' && (
                <>
                  <Link to={`/app/labor/jobs/${id}/edit`} className="text-sm text-gray-500">সম্পাদনা</Link>
                  <button onClick={closePost} className="text-sm text-red-600 font-semibold">বন্ধ করুন</button>
                </>
              )}
            </div>
          </div>

          {applicants.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-gray-500 text-sm">
              এখনও কোনো আবেদন আসেনি
            </div>
          ) : (
            <div className="space-y-3">
              {applicants.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <img src={a.labour_photo || PLACEHOLDER_AVATAR} alt="" className="w-12 h-12 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-gray-800">{a.labour_name}</p>
                        {a.verified && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400" /> {a.rating?.toFixed?.(1) ?? a.rating}
                        </span>
                        <span>{bn(a.experience_years || 0)} বছর অভিজ্ঞতা</span>
                        {a.daily_rate && <span>৳{bn(a.daily_rate)}/দিন</span>}
                      </div>
                      {a.message && <p className="text-sm text-gray-600 mt-1.5">“{a.message}”</p>}
                    </div>
                    <JobBadge meta={APPLICATION_STATUS_META[a.status]} />
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                    {a.labour_phone && (
                      <a href={`tel:${a.labour_phone}`} className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5" /> {a.labour_phone}
                      </a>
                    )}
                    {a.status === 'pending' && (
                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          onClick={() => respond(a.id, 'reject')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-semibold"
                        >
                          <XCircle className="w-4 h-4" /> প্রত্যাখ্যান
                        </button>
                        <button
                          onClick={() => respond(a.id, 'accept')}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
                        >
                          <CheckCircle2 className="w-4 h-4" /> গ্রহণ করুন
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showApply && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-lg mb-1">কাজে আবেদন</h3>
            <p className="text-sm text-gray-500 mb-3">{post.job_title}</p>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
            <textarea
              className="w-full border rounded-lg p-2.5 text-sm mb-4"
              rows={4}
              placeholder="পোস্টকারীকে বার্তা লিখুন (ঐচ্ছিক)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowApply(false)} className="flex-1 py-2.5 bg-gray-100 rounded-lg font-semibold">
                বাতিল
              </button>
              <button onClick={apply} disabled={busy} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-60">
                {busy ? 'পাঠানো হচ্ছে...' : 'আবেদন করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-emerald-500 mt-0.5" />
      <div>
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
