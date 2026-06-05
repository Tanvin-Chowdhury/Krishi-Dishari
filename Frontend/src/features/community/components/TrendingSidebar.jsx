import { Link }  from 'react-router';
import {
  Flame, Hash, TrendingUp, Award, Newspaper,
  Trophy, Target, Sprout, ChevronRight, MessageSquare,
} from 'lucide-react';
import { postTypeMeta, tagLabel } from '../communityConstants';
import UserPhoto                  from '../../../shared/components/UserPhoto';

/* ─── community monthly challenge (static) ───────────────── */
const CHALLENGE = {
  title:    'সেরা ধান ক্ষেতের ছবি',
  deadline: '৩০ জুন পর্যন্ত',
  reward:   '৫০ পয়েন্ট',
  icon:     '📸',
};

/* ─── reputation badges ───────────────────────────────────── */
const REPUTATION = [
  { min: 0,   label: 'নতুন সদস্য',         emoji: '🥉', color: 'text-orange-600' },
  { min: 5,   label: 'সহায়ক কৃষক',        emoji: '🥈', color: 'text-gray-500'   },
  { min: 20,  label: 'বিশেষ অবদানকারী',    emoji: '🥇', color: 'text-amber-500'  },
  { min: 50,  label: 'কৃষি গুরু',           emoji: '🏆', color: 'text-yellow-600' },
];

function getReputation(answerCount) {
  const n = answerCount || 0;
  const r = [...REPUTATION].reverse().find(r => n >= r.min);
  return r || REPUTATION[0];
}

/* ─── section header ──────────────────────────────────────── */
function SectionHeader({ icon: Icon, label, color }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-extrabold text-gray-900">
      <Icon size={15} className={color} />
      {label}
    </h3>
  );
}

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export default function TrendingSidebar({
  trending,
  activeTag,
  activeType,
  onTag,
  onType,
  isConsultant,
}) {
  const tags           = trending?.tags          || [];
  const types          = trending?.post_types    || [];
  const hot            = trending?.hot_posts     || [];
  const topConsultants = trending?.top_consultants || [];
  const recentNews     = trending?.recent_news   || [];

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">

      {/* ── Trending tags ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <SectionHeader icon={Flame} label="ট্রেন্ডিং টপিক" color="text-orange-500" />
        <ul className="mt-3 space-y-1">
          {tags.length === 0 ? (
            <li className="text-xs text-gray-400 py-2 text-center">এখনো কোনো ডেটা নেই</li>
          ) : tags.map(t => (
            <li key={t.tag_id}>
              <button type="button"
                onClick={() => onTag?.(activeTag === t.tag_id ? '' : t.tag_id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                  activeTag === t.tag_id
                    ? 'bg-violet-50 font-extrabold text-violet-800'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}>
                <span className="flex items-center gap-1.5">
                  <Hash size={12} className="text-gray-400" />
                  {tagLabel(t.tag_name)}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                  {t.post_count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Popular discussions (hot posts) ── */}
      {hot.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <SectionHeader icon={TrendingUp} label="জনপ্রিয় আলোচনা" color="text-emerald-600" />
          <ul className="mt-3 space-y-2">
            {hot.map((p, i) => (
              <li key={p.post_id}>
                <Link to={`/app/community/${p.post_id}`}
                  className="group flex items-start gap-2.5 rounded-xl p-2 hover:bg-gray-50 transition">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-extrabold text-emerald-700">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold text-gray-800 group-hover:text-emerald-700 transition leading-snug">{p.title}</p>
                    <p className="mt-0.5 text-[10px] text-gray-400">{p.like_count} লাইক · {p.comment_count} মন্তব্য</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Top contributors ── */}
      {topConsultants.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <SectionHeader icon={Trophy} label="শীর্ষ অবদানকারী" color="text-amber-500" />
          <ul className="mt-3 space-y-2">
            {topConsultants.map((c, i) => {
              const rep = getReputation(c.answer_count);
              return (
                <li key={c.user_id}>
                  <Link to={`/app/experts/${c.user_id}`}
                    className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-gray-50 transition group">
                    <div className="relative flex-shrink-0">
                      <UserPhoto src={c.photo_url} name={c.full_name}
                        className="h-9 w-9 rounded-full object-cover"
                        fallbackClassName="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-extrabold text-white" />
                      <span className="absolute -bottom-0.5 -right-0.5 text-[10px] leading-none">{rep.emoji}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-gray-800 group-hover:text-emerald-700 transition">{c.full_name}</p>
                      <p className="text-[10px] text-gray-400">{c.professional_title || 'বিশেষজ্ঞ'} · {c.answer_count} উত্তর</p>
                    </div>
                    <span className="flex-shrink-0 text-[9px] font-extrabold text-amber-600">
                      #{i + 1}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link to="/app/experts"
            className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700 hover:underline">
            সব বিশেষজ্ঞ দেখুন <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* ── Post type filter ── */}
      {types.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <SectionHeader icon={MessageSquare} label="বিষয় অনুযায়ী" color="text-blue-500" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {types.map(t => {
              const meta = postTypeMeta(t.post_type);
              return (
                <button key={t.post_type} type="button"
                  onClick={() => onType?.(activeType === t.post_type ? '' : t.post_type)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                    activeType === t.post_type
                      ? meta.color + ' ring-2 ring-emerald-300/50'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-emerald-300'
                  }`}>
                  {meta.label} ({t.post_count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Monthly challenge ── */}
      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Target size={15} className="text-emerald-600" />
          <h3 className="text-sm font-extrabold text-emerald-900">এই মাসের চ্যালেঞ্জ</h3>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-white px-3 py-3">
          <p className="text-2xl mb-1">{CHALLENGE.icon}</p>
          <p className="text-sm font-extrabold text-gray-900">{CHALLENGE.title}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">{CHALLENGE.deadline}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-700">
              🎁 পুরস্কার: {CHALLENGE.reward}
            </span>
            <button type="button" onClick={() => {}}
              className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-extrabold text-white hover:bg-emerald-700 transition">
              অংশ নিন
            </button>
          </div>
        </div>
      </div>

      {/* ── Agriculture news ── */}
      {recentNews.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <SectionHeader icon={Newspaper} label="আজকের কৃষি সংবাদ" color="text-blue-500" />
          <ul className="mt-3 space-y-2">
            {recentNews.map(n => (
              <li key={n.news_id || n.id}>
                <Link to={`/app/news/${n.slug || n.news_id || n.id}`}
                  className="group block rounded-xl p-2 hover:bg-blue-50 transition">
                  <p className="line-clamp-2 text-xs font-semibold text-gray-700 group-hover:text-blue-700 leading-snug">{n.title}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/app/news"
            className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
            সব সংবাদ <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* ── Expert help CTA ── */}
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 text-center shadow-sm">
        <Sprout className="mx-auto mb-2 text-emerald-600" size={26} />
        <p className="font-extrabold text-gray-900 text-sm">বিশেষজ্ঞ পরামর্শ নিন</p>
        <p className="mt-1 text-[11px] text-gray-600">রোগ ও ফসল সমস্যায় সরাসরি বিশেষজ্ঞদের সাথে কথা বলুন</p>
        <Link to="/app/experts"
          className="mt-3 inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-sm transition">
          বিশেষজ্ঞ তালিকা <ChevronRight size={12} />
        </Link>
      </div>
    </aside>
  );
}
