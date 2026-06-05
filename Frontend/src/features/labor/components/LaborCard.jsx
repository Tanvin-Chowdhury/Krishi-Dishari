import { Link }       from 'react-router';
import {
  MapPin, Briefcase, Clock, BadgeCheck,
  Award, Star, ChevronRight, UserCheck,
} from 'lucide-react';
import { useContext }      from 'react';
import { AuthContext }     from '../../../core/auth/AuthContext';
import UserPhoto           from '../../../shared/components/UserPhoto';
import { REQUESTER_ROLES } from '../laborConstants';

/* ─── Availability badge ──────────────────────────────────── */
function AvailBadge({ available }) {
  return (
    <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow ${
      available ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${available ? 'bg-white animate-pulse' : 'bg-orange-200'}`} />
      {available ? 'উপলব্ধ' : 'ব্যস্ত'}
    </div>
  );
}

/* ─── Star row ────────────────────────────────────────────── */
function Stars({ value }) {
  const v = Math.min(5, Math.max(0, parseFloat(value) || 0));
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11} className={i <= Math.round(v) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
      ))}
      <span className="ml-1 text-xs font-extrabold text-amber-700">
        {v > 0 ? v.toFixed(1) : '—'}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CARD
═══════════════════════════════════════════════════════════ */
export default function LaborCard({ laborer, onHire }) {
  const { user }  = useContext(AuthContext);
  const canHire   = REQUESTER_ROLES.includes(user?.role_id);
  const id        = laborer.user_id || laborer.id;
  const rating    = parseFloat(laborer.rating ?? laborer.avg_rating) || 0;
  const jobs      = laborer.completed_jobs ?? laborer.completed_jobs_count ?? 0;
  const expYears  = laborer.experience_years ?? 0;
  const wage      = laborer.daily_wage ?? laborer.daily_rate;
  const skills    = laborer.skill_labels || laborer.skills || [];
  const isTopPerf = rating >= 4.5 && jobs >= 20;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

      {/* ── Photo area ── */}
      <div className="relative h-44 flex-shrink-0 overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100">
        <UserPhoto
          src={laborer.photo_url || laborer.photo}
          name={laborer.full_name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          fallbackClassName="flex h-full w-full items-center justify-center text-5xl font-extrabold text-emerald-300 bg-gradient-to-br from-emerald-100 to-teal-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Availability — top right */}
        <div className="absolute right-3 top-3">
          <AvailBadge available={laborer.available} />
        </div>

        {/* Verified — top left */}
        {laborer.verified && (
          <div className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 shadow">
            <BadgeCheck size={14} className="text-white" />
          </div>
        )}

        {/* Bottom badges */}
        <div className="absolute bottom-2.5 left-3 flex gap-1.5">
          {isTopPerf && (
            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 shadow">
              🏅 শীর্ষ পারফর্মার
            </span>
          )}
          {expYears >= 5 && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
              🌾 অভিজ্ঞ
            </span>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 flex-col p-4">

        {/* Name + location */}
        <h3 className="font-extrabold text-gray-900 leading-tight group-hover:text-emerald-700 transition">
          {laborer.full_name}
        </h3>
        {laborer.location && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={11} className="flex-shrink-0" /> {laborer.location}
          </p>
        )}

        {/* Rating */}
        <div className="mt-2">
          {rating > 0 ? (
            <Stars value={rating} />
          ) : (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              নতুন শ্রমিক
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <UserCheck size={11} className="text-emerald-500" />{jobs} কাজ সম্পন্ন
          </span>
          {expYears > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-blue-400" />{expYears} বছর অভিজ্ঞতা
            </span>
          )}
        </div>

        {/* Bio */}
        {laborer.bio && (
          <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">{laborer.bio}</p>
        )}

        {/* Skills chips */}
        {skills.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {skills.slice(0, 4).map((s, i) => (
              <span key={i} className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                {typeof s === 'string' ? s : s.label}
              </span>
            ))}
            {skills.length > 4 && (
              <span className="rounded-lg border border-gray-100 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-500">
                +{skills.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Wage + actions */}
        <div className="mt-auto pt-3">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] text-gray-400">দৈনিক মজুরি</p>
              <p className="text-lg font-extrabold text-emerald-600">
                {wage ? `৳${Number(wage).toLocaleString('bn-BD')}` : '—'}
                <span className="text-[10px] font-normal text-gray-400 ml-0.5">/দিন</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {canHire && (
              <button type="button" onClick={() => onHire?.(laborer)} disabled={!laborer.available}
                className={`flex flex-1 items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-extrabold transition shadow-sm active:scale-95 ${
                  laborer.available
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'cursor-not-allowed bg-gray-100 text-gray-400'
                }`}>
                <Briefcase size={12} /> নিয়োগ করুন
              </button>
            )}
            <Link to={`/app/labor/${id}`}
              className="flex items-center justify-center gap-1 rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition">
              <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
