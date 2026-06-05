import { Link, useNavigate } from 'react-router';
import { Star, MapPin, Clock, MessageCircle, BadgeCheck, ChevronRight } from 'lucide-react';
import UserPhoto from '../../../shared/components/UserPhoto';
import { starsLabel, feeLabel } from '../expertUtils';

export default function ExpertCard({ expert }) {
  const navigate = useNavigate();
  const specs    = expert.specializations || [];
  const primary  = expert.primary_specialization || specs[0] || 'কৃষি পরামর্শ';
  const rating   = parseFloat(expert.avg_rating) || 0;
  const isPopular = (expert.review_count >= 5) || rating >= 4.5;
  const responseHint = expert.response_time_hint || '';
  const isFast   = responseHint && (responseHint.includes('মিনিট') || (responseHint.includes('ঘণ্টা') && parseInt(responseHint) <= 1));

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

      {/* ── Cover image ── */}
      <div className="relative h-48 flex-shrink-0 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
        <UserPhoto
          src={expert.photo_url}
          name={expert.full_name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          fallbackClassName="flex h-full w-full items-center justify-center text-5xl font-extrabold text-emerald-300"
        />
        {/* bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Status badge — top right */}
        <div className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold shadow ${
          expert.is_available ? 'bg-emerald-500 text-white' : 'bg-gray-600/80 text-white backdrop-blur-sm'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${expert.is_available ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
          {expert.is_available ? 'উপলব্ধ' : 'ব্যস্ত'}
        </div>

        {/* Verified badge — top left */}
        {expert.is_verified && (
          <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 shadow-md">
            <BadgeCheck size={15} className="text-white" />
          </div>
        )}

        {/* bottom badges */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          {isPopular && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 shadow">জনপ্রিয়</span>
          )}
          {isFast && (
            <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">দ্রুত সাড়া</span>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-extrabold text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition">
          {expert.full_name}
        </h3>
        <p className="mt-0.5 text-xs text-emerald-700 font-semibold line-clamp-1">
          {expert.professional_title || 'কৃষি বিশেষজ্ঞ'}
        </p>

        {/* Specialization chips */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 line-clamp-1 max-w-full truncate">
            {primary}
          </span>
          {specs[1] && specs[1] !== primary && (
            <span className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1 text-[11px] text-gray-600 truncate max-w-[100px]">
              {specs[1]}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="mt-3">
          {rating > 0 ? (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={12}
                    className={s <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                ))}
              </div>
              <span className="text-xs font-extrabold text-amber-700">{starsLabel(rating)}</span>
              <span className="text-[11px] text-gray-400">({expert.review_count} রিভিউ)</span>
            </div>
          ) : (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              ✨ নতুন বিশেষজ্ঞ
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[11px] text-gray-500">
          {expert.experience_years > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-gray-400" />
              {expert.experience_years} বছর
            </span>
          )}
          {expert.location && (
            <span className="flex items-center gap-1 truncate max-w-[100px]">
              <MapPin size={11} className="text-gray-400 flex-shrink-0" />
              <span className="truncate">{expert.location}</span>
            </span>
          )}
        </div>

        {/* Fee + response */}
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-sm font-extrabold text-emerald-700">{feeLabel(expert.consultation_fee)}</span>
          {responseHint && (
            <span className="text-[10px] text-gray-400">{responseHint} সাড়া</span>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={!expert.is_available}
            onClick={() => navigate(`/app/chat?userId=${expert.user_id}`)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold transition shadow-sm ${
              expert.is_available
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                : 'cursor-not-allowed bg-gray-100 text-gray-400'
            }`}
          >
            <MessageCircle size={13} /> চ্যাট করুন
          </button>
          <Link
            to={`/app/experts/${expert.user_id}`}
            className="flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition"
          >
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
