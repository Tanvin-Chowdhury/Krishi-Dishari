import { useContext, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, MapPin, BadgeCheck, Briefcase } from 'lucide-react';
import { laborApi } from '../../shared/services/laborApi';
import StarRating from './components/StarRating';
import HireRequestModal from './components/HireRequestModal';
import UserPhoto from '../../shared/components/UserPhoto';
import { REQUESTER_ROLES } from './laborConstants';
import { AuthContext } from '../../core/auth/AuthContext';

export default function LaborDetail() {
  const { userId } = useParams();
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hireOpen, setHireOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await laborApi.getLaborer(userId);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return <p className="text-center py-16 text-gray-500">লোড হচ্ছে...</p>;
  }

  const laborer = data?.laborer;
  if (!laborer) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <p className="text-gray-600">শ্রমিক পাওয়া যায়নি</p>
        <Link to="/app/labor" className="text-emerald-600 mt-4 inline-block">
          বাজারে ফিরুন
        </Link>
      </div>
    );
  }

  const reviews = data.reviews || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Link
        to="/app/labor"
        className="inline-flex items-center gap-1 text-sm text-emerald-700 mb-4"
      >
        <ArrowLeft size={16} /> বাজার
      </Link>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="md:flex">
          <UserPhoto
            src={laborer.photo_url || laborer.photo}
            name={laborer.full_name}
            className="w-full md:w-72 h-64 md:h-auto object-cover"
            fallbackClassName="flex w-full md:w-72 h-64 md:min-h-[16rem] items-center justify-center text-6xl font-extrabold text-emerald-300 bg-gradient-to-br from-emerald-100 to-teal-100"
          />
          <div className="p-6 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{laborer.full_name}</h1>
                <p className="flex items-center gap-1 text-gray-600 text-sm mt-1">
                  <MapPin size={14} /> {laborer.location}
                </p>
                <div className="mt-2">
                  <StarRating value={laborer.rating} />
                  <span className="text-xs text-gray-500 ml-2">
                    ({laborer.total_reviews || 0} রিভিউ)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-600">
                  ৳{laborer.daily_wage}
                </p>
                <p className="text-xs text-gray-500">/দিন</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {laborer.verified && (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-full">
                  <BadgeCheck size={12} /> যাচাইকৃত
                </span>
              )}
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  laborer.available ? 'bg-emerald-500 text-white' : 'bg-orange-100 text-orange-800'
                }`}
              >
                {laborer.available ? 'উপলব্ধ' : 'ব্যস্ত'}
              </span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {laborer.experience_years} বছর অভিজ্ঞতা
              </span>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {laborer.completed_jobs} কাজ সম্পন্ন
              </span>
            </div>

            {laborer.bio && (
              <p className="text-sm text-gray-700 mt-4">{laborer.bio}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {(laborer.skill_labels || []).map((s) => (
                <span
                  key={s}
                  className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>

            {REQUESTER_ROLES.includes(user?.role_id) && (
              <button
                type="button"
                onClick={() => setHireOpen(true)}
                className="mt-6 w-full md:w-auto px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700"
              >
                <Briefcase size={18} /> নিয়োগ করুন
              </button>
            )}
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-gray-800 mb-4">রিভিউ</h2>
          <ul className="space-y-4">
            {reviews.map((r, i) => (
              <li key={i} className="border-b pb-3 last:border-0">
                <div className="flex justify-between">
                  <span className="font-semibold text-sm">{r.reviewer_name}</span>
                  <StarRating value={r.rating} size={12} showValue={false} />
                </div>
                {r.review_text && (
                  <p className="text-sm text-gray-600 mt-1">{r.review_text}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hireOpen && (
        <HireRequestModal laborer={laborer} onClose={() => setHireOpen(false)} />
      )}
    </div>
  );
}
