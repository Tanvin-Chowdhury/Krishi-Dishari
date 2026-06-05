import { useCallback, useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Calendar,
  GraduationCap,
  MapPin,
  MessageCircle,
  Star,
  Users,
  Building2,
  ThumbsUp,
  ChevronRight,
} from 'lucide-react';
import { AuthContext } from '../../core/auth/AuthContext';
import { expertApi } from '../../shared/services/expertApi';
import { chatApi } from '../../shared/services/chatApi';
import StarRating from '../labor/components/StarRating';
import ReviewForm from './components/ReviewForm';
import ExpertContactPanel from './components/ExpertContactPanel';
import { bn, bnDate, feeLabel, starsLabel } from './expertUtils';
import { Skeleton, SkeletonCard } from '../../shared/design-system/Skeleton';
import { cn } from '../../shared/lib/cn';
import UserPhoto from '../../shared/components/UserPhoto';
import EmptyState from '../../shared/design-system/EmptyState';

function StatCard({ label, value, sub, accent = 'emerald' }) {
  const accents = {
    emerald: 'from-emerald-50 to-white border-emerald-100',
    blue: 'from-blue-50 to-white border-blue-100',
    amber: 'from-amber-50 to-white border-amber-100',
    purple: 'from-purple-50 to-white border-purple-100',
  };
  return (
    <div
      className={cn(
        'rounded-2xl border bg-gradient-to-br p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        accents[accent] || accents.emerald
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function SectionBlock({ title, description, children, className = '' }) {
  return (
    <section className={cn('rounded-2xl border border-slate-200/80 bg-white shadow-sm', className)}>
      <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-72 w-full rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

export default function ExpertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [expert, setExpert] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [articles, setArticles] = useState([]);
  const [communityAnswers, setCommunityAnswers] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  const loadExpert = useCallback(async () => {
    setLoading(true);
    try {
      const res = await expertApi.getExpert(id);
      setExpert(res.expert);
      setConversationId(res.existing_conversation_id ?? null);
      setProfileStats(res.stats ?? null);
      setArticles(res.articles || []);
      setCommunityAnswers(res.community_answers || []);
    } catch {
      setExpert(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await expertApi.getReviews(id, { limit: 20 });
      setReviews(res.reviews || []);
      setReviewStats(res.stats);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadExpert();
    loadReviews();
  }, [loadExpert, loadReviews]);

  const isSelf = user?.user_id === +id;
  const isFarmer = user?.role_id === 1;
  const canInteract = user && !isSelf;

  const startChat = async () => {
    if (!canInteract || !expert?.is_available) return;
    setChatLoading(true);
    try {
      if (conversationId) {
        navigate(`/app/chat?conversationId=${conversationId}`);
        return;
      }
      const res = await chatApi.createConversation(+id);
      const cid = res.conversation_id ?? res.conversation?.conversation_id;
      if (cid) {
        setConversationId(cid);
        navigate(`/app/chat?conversationId=${cid}`);
      } else {
        navigate(`/app/chat?userId=${id}`);
      }
    } catch {
      navigate(`/app/chat?userId=${id}`);
    } finally {
      setChatLoading(false);
    }
  };

  const requestConsultation = () => {
    if (!canInteract) return;
    startChat();
  };

  if (loading) return <ProfileSkeleton />;

  if (!expert) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          emoji="👨‍🌾"
          title="বিশেষজ্ঞ পাওয়া যায়নি"
          description="এই প্রোফাইলটি সরানো হয়েছে বা আর উপলব্ধ নেই।"
          actionLabel="বিশেষজ্ঞ তালিকা"
          actionHref="/app/experts"
        />
      </div>
    );
  }

  const specs = expert.specializations || [];
  const stats = profileStats || {};
  const displayStats = {
    consultations: stats.total_consultations ?? expert.consultation_count ?? 0,
    answered: stats.answered_questions ?? 0,
    contributions: stats.community_contributions ?? 0,
    successRate: stats.success_rate,
    avgRating: stats.avg_rating ?? expert.avg_rating ?? 0,
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto max-w-6xl px-4 py-6 pb-12">
        <Link
          to="/app/experts"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:underline"
        >
          <ArrowLeft size={16} />
          বিশেষজ্ঞ তালিকা
        </Link>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <div className="min-w-0 space-y-8">
            {/* Section 1: Hero */}
            <section className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-xl shadow-emerald-900/5">
              <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-6 pb-8 pt-8 sm:px-10">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end">
                  <div className="relative shrink-0">
                    <div className="h-28 w-28 overflow-hidden rounded-2xl border-4 border-white/30 shadow-2xl sm:h-36 sm:w-36">
                      <UserPhoto
                        src={expert.photo_url}
                        name={expert.full_name}
                        className="h-full w-full object-cover"
                        fallbackClassName="flex h-full w-full items-center justify-center bg-emerald-800/50 text-5xl font-bold text-white/80"
                      />
                    </div>
                    {expert.is_online && expert.is_available && (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400">
                        <span className="sr-only">অনলাইন</span>
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-white">
                    <div className="flex flex-wrap items-center gap-2">
                      {expert.is_verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-bold backdrop-blur">
                          <BadgeCheck size={12} /> যাচাইকৃত
                        </span>
                      )}
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                          expert.is_available ? 'bg-emerald-400/40' : 'bg-white/20'
                        )}
                      >
                        {expert.is_available ? 'উপলব্ধ' : 'ব্যস্ত'}
                      </span>
                    </div>
                    <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {expert.full_name}
                    </h1>
                    <p className="mt-1 text-lg text-emerald-50">{expert.professional_title}</p>
                    {expert.location && (
                      <p className="mt-2 flex items-center gap-1 text-sm text-white/80">
                        <MapPin size={14} />
                        {expert.location}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                      <span className="inline-flex items-center gap-1 font-semibold">
                        <Star className="fill-amber-300 text-amber-300" size={16} />
                        {starsLabel(expert.avg_rating)} ({expert.review_count} রিভিউ)
                      </span>
                      <span className="inline-flex items-center gap-1 text-white/90">
                        <Users size={14} />
                        {bn(displayStats.consultations)} পরামর্শ
                      </span>
                      <span className="text-white/80">
                        {expert.experience_years || 0} বছর অভিজ্ঞতা
                      </span>
                      <span className="text-white/80">সাড়া: {expert.response_time_hint}</span>
                    </div>
                  </div>
                </div>
                {canInteract && (
                  <div className="relative mt-6 flex flex-wrap gap-3 lg:hidden">
                    <button
                      type="button"
                      onClick={startChat}
                      disabled={!expert.is_available || chatLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-800 shadow disabled:opacity-50"
                    >
                      <MessageCircle size={18} />
                      {conversationId ? 'চ্যাট চালিয়ে যান' : 'এখনই বার্তা'}
                    </button>
                    <span className="inline-flex items-center rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur">
                      ফি: {feeLabel(expert.consultation_fee)}
                    </span>
                  </div>
                )}
                {isSelf && (
                  <Link
                    to="/app/expert-profile"
                    className="relative mt-6 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-800"
                  >
                    প্রোফাইল সম্পাদনা
                  </Link>
                )}
              </div>
            </section>

            {/* Section 4: Statistics */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="মোট পরামর্শ"
                value={bn(displayStats.consultations)}
                sub="সম্পন্ন সেশন"
                accent="emerald"
              />
              <StatCard
                label="উত্তর দেওয়া প্রশ্ন"
                value={bn(displayStats.answered)}
                sub="কমিউনিটি মন্তব্য"
                accent="blue"
              />
              <StatCard
                label="কমিউনিটি অবদান"
                value={bn(displayStats.contributions)}
                sub="পোস্ট + উত্তর"
                accent="amber"
              />
              <StatCard
                label="সন্তুষ্টি হার"
                value={displayStats.successRate != null ? `${displayStats.successRate}%` : '—'}
                sub={
                  displayStats.successRate != null
                    ? '৪–৫ তারা রিভিউ ভিত্তিতে'
                    : 'এখনো পর্যাপ্ত রিভিউ নেই'
                }
                accent="purple"
              />
            </div>

            {/* Section 2: About */}
            <SectionBlock title="বিশেষজ্ঞ সম্পর্কে" description="শিক্ষা, অভিজ্ঞতা ও পেশাগত পরিচয়">
              <div className="space-y-5">
                {expert.bio ? (
                  <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{expert.bio}</p>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">
                    বিশেষজ্ঞ এখনো বিস্তারিত পরিচিতি যোগ করেননি।
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {expert.education && (
                    <div className="flex gap-3 rounded-xl bg-emerald-50/80 p-4">
                      <GraduationCap className="shrink-0 text-emerald-600" size={22} />
                      <div>
                        <p className="text-xs font-semibold uppercase text-emerald-800">শিক্ষা</p>
                        <p className="mt-1 text-sm font-medium text-slate-800">{expert.education}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 rounded-xl bg-slate-50 p-4">
                    <Briefcase className="shrink-0 text-slate-600" size={22} />
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-600">অভিজ্ঞতা</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {expert.experience_years || 0} বছর কৃষি পরামর্শ
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 rounded-xl bg-slate-50 p-4 sm:col-span-2">
                    <Building2 className="shrink-0 text-slate-400" size={22} />
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">প্রতিষ্ঠান / সার্টিফিকেট</p>
                      <p className="mt-1 text-sm text-slate-500">
                        প্রোফাইলে এখনো প্রতিষ্ঠান বা সার্টিফিকেট যোগ করা হয়নি। সম্পাদনা পেজ থেকে আপডেট করা যাবে।
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SectionBlock>

            {/* Section 3: Specializations */}
            <SectionBlock title="বিশেষত্ব ও দক্ষতা" description="যে বিষয়ে পরামর্শ দেন">
              {specs.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {specs.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500 py-6">কোনো বিশেষত্ব তালিকাভুক্ত নেই</p>
              )}
            </SectionBlock>

            {/* Section 5: Articles */}
            <SectionBlock
              title="সাম্প্রতিক নিবন্ধ"
              description="বিশেষজ্ঞের প্রকাশিত কৃষি সংবাদ ও নিবন্ধ"
            >
              {articles.length === 0 ? (
                <EmptyState
                  size="sm"
                  emoji="📰"
                  title="কোনো নিবন্ধ নেই"
                  description="এই বিশেষজ্ঞ এখনো কৃষি সংবাদে নিবন্ধ প্রকাশ করেননি।"
                  actionLabel="কৃষি সংবাদ"
                  actionHref="/app/news"
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {articles.map((a) => (
                    <li key={a.news_id}>
                      <Link
                        to={`/app/news/${a.slug || a.news_id}`}
                        className="flex items-start justify-between gap-4 py-4 transition hover:bg-slate-50/80 -mx-2 px-2 rounded-xl"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 line-clamp-2">{a.title}</p>
                          {a.summary && (
                            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{a.summary}</p>
                          )}
                          <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                            <Calendar size={12} />
                            {bnDate(a.published_at)}
                            {a.view_count > 0 && <> · {bn(a.view_count)} দর্শন</>}
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          পড়ুন <ChevronRight size={14} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionBlock>

            {/* Section 6: Community answers */}
            <SectionBlock title="কমিউনিটি উত্তর" description="কৃষকদের প্রশ্নের সাম্প্রতিক উত্তর">
              {communityAnswers.length === 0 ? (
                <EmptyState
                  size="sm"
                  emoji="💬"
                  title="কোনো উত্তর নেই"
                  description="এখনো কমিউনিটিতে উত্তর দেওয়া হয়নি।"
                  actionLabel="কমিউনিটি"
                  actionHref="/app/community"
                />
              ) : (
                <ul className="space-y-4">
                  {communityAnswers.map((c) => (
                    <li
                      key={c.comment_id}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                    >
                      <Link
                        to={`/app/community/${c.post_id}`}
                        className="text-xs font-bold text-emerald-700 hover:underline line-clamp-1"
                      >
                        {c.post_title || 'কমিউনিটি পোস্ট'}
                      </Link>
                      <p className="mt-2 text-sm text-slate-700 line-clamp-3">{c.comment_text}</p>
                      <p className="mt-2 text-[11px] text-slate-400">{bnDate(c.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionBlock>

            {/* Section 7: Reviews */}
            <SectionBlock title="রেটিং ও রিভিউ" description="কৃষকদের মূল্যায়ন">
              <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl bg-amber-50/80 p-4">
                <div className="text-center">
                  <p className="text-4xl font-extrabold text-amber-800">
                    {starsLabel(reviewStats?.avg_rating ?? expert.avg_rating)}
                  </p>
                  <StarRating value={reviewStats?.avg_rating ?? expert.avg_rating} />
                  <p className="mt-1 text-xs text-amber-700">
                    {reviewStats?.total ?? expert.review_count ?? 0} রিভিউ
                  </p>
                </div>
                {reviewStats?.five_star != null && reviewStats.total > 0 && (
                  <p className="text-sm text-slate-600">
                    <ThumbsUp size={14} className="inline mr-1 text-emerald-600" />
                    {bn(reviewStats.five_star)} জন ৫ তারা দিয়েছেন
                  </p>
                )}
              </div>

              {isFarmer && !isSelf && (
                <div className="mb-6">
                  <ReviewForm consultantId={+id} onSubmitted={loadReviews} />
                </div>
              )}

              {reviewsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                  এখনো কোনো রিভিউ নেই — প্রথম রিভিউ দিন
                </p>
              ) : (
                <ul className="space-y-3">
                  {reviews.map((r) => (
                    <li
                      key={r.review_id}
                      className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800">{r.farmer_name}</span>
                        <span className="flex items-center gap-0.5 text-sm font-bold text-amber-700">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          {r.rating}
                        </span>
                      </div>
                      {r.review_text && (
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{r.review_text}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">{bnDate(r.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionBlock>
          </div>

          {/* Section 8: Sticky contact panel (desktop) */}
          <div className="hidden lg:block">
            <ExpertContactPanel
              expert={expert}
              conversationId={conversationId}
              onStartChat={startChat}
              onRequestConsultation={requestConsultation}
              chatLoading={chatLoading}
            />
          </div>
        </div>

        {/* Mobile contact panel */}
        <div className="mt-8 lg:hidden">
          <ExpertContactPanel
            expert={expert}
            conversationId={conversationId}
            onStartChat={startChat}
            onRequestConsultation={requestConsultation}
            chatLoading={chatLoading}
          />
        </div>
      </div>
    </div>
  );
}
