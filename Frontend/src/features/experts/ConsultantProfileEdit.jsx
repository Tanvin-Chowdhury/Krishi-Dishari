import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Save,
  Briefcase,
  GraduationCap,
  Clock,
  Sparkles,
  Banknote,
  Calendar,
  FileText,
  ExternalLink,
  Check,
  Loader2,
  Award,
  Zap,
} from 'lucide-react';
import { AuthContext } from '../../core/auth/AuthContext';
import { ROLE_META } from '../../config/NavConfig';
import { expertApi } from '../../shared/services/expertApi';
import UserPhoto from '../../shared/components/UserPhoto';
import { Skeleton } from '../../shared/design-system/Skeleton';
import { DEFAULT_SPECIALIZATIONS } from './consultantConstants';
import { cn } from '../../shared/lib/cn';
import { toast } from 'react-toastify';

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200/90 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 shadow-inner transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/15';

function SectionCard({ icon: Icon, title, subtitle, children, accent = 'emerald' }) {
  const accents = {
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-500',
    blue: 'from-blue-500 to-indigo-600',
    violet: 'from-violet-500 to-purple-600',
  };
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg',
            accents[accent]
          )}
        >
          <Icon size={20} aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function FieldLabel({ children, hint }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-800">{children}</span>
      {hint && <span className="mt-0.5 block text-xs font-normal text-slate-500">{hint}</span>}
    </label>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <Skeleton className="h-52 w-full rounded-3xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-56 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}

export default function ConsultantProfileEdit() {
  const { user } = useContext(AuthContext);
  const roleMeta = ROLE_META[3];
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [specOptions, setSpecOptions] = useState(DEFAULT_SPECIALIZATIONS);
  const [form, setForm] = useState({
    professional_title: 'কৃষি বিশেষজ্ঞ',
    experience_years: 0,
    consultation_fee: 0,
    bio: '',
    education: '',
    response_time_hint: '১ ঘণ্টা',
    is_available: true,
    specializations: [],
  });

  useEffect(() => {
    expertApi
      .getSpecializations()
      .then((res) => setSpecOptions(res.specializations || DEFAULT_SPECIALIZATIONS))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await expertApi.getMyProfile();
        const ex = res.expert;
        if (!cancelled && ex) {
          setForm({
            professional_title: ex.professional_title || 'কৃষি বিশেষজ্ঞ',
            experience_years: ex.experience_years ?? 0,
            consultation_fee: ex.consultation_fee ?? 0,
            bio: ex.bio || '',
            education: ex.education || '',
            response_time_hint: ex.response_time_hint || '১ ঘণ্টা',
            is_available: ex.is_available !== false,
            specializations: ex.specializations || [],
          });
        }
      } catch (e) {
        toast.error(e.message || 'প্রোফাইল লোড হয়নি');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completion = useMemo(() => {
    const checks = [
      form.professional_title?.trim(),
      form.education?.trim(),
      form.bio?.trim()?.length >= 20,
      form.specializations.length >= 2,
      form.experience_years > 0,
      form.response_time_hint?.trim(),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const toggleSpec = (s) => {
    setForm((f) => {
      const has = f.specializations.includes(s);
      return {
        ...f,
        specializations: has
          ? f.specializations.filter((x) => x !== s)
          : [...f.specializations, s],
      };
    });
  };

  const save = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try {
      await expertApi.updateMyProfile(form);
      toast.success('প্রোফাইল সংরক্ষিত হয়েছে');
    } catch (err) {
      toast.error(err.message || 'সংরক্ষণ ব্যর্থ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-6 md:pb-8">
      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-emerald-200/60 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.15),transparent_45%)]" />
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl" />

        <div className="relative px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
              <div className="relative">
                <div className="rounded-2xl bg-white/20 p-1 ring-4 ring-white/30 backdrop-blur-sm">
                  <UserPhoto
                    src={user?.photo_url}
                    name={user?.full_name}
                    className="h-24 w-24 rounded-xl object-cover sm:h-28 sm:w-28"
                    fallbackClassName="flex h-24 w-24 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-3xl font-bold text-white sm:h-28 sm:w-28"
                  />
                </div>
                {form.is_available && (
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-lg">
                    <Zap size={14} className="text-white" aria-hidden />
                  </span>
                )}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200/90">
                  বিশেষজ্ঞ প্রোফাইল
                </p>
                <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  {user?.full_name}
                </h1>
                <p className="mt-1 text-sm text-emerald-100/90">
                  {form.professional_title || 'কৃষি বিশেষজ্ঞ'}
                </p>
                <span
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: roleMeta.bgColor, color: roleMeta.color }}
                >
                  {roleMeta.icon} {roleMeta.label}
                </span>
              </div>
            </div>

            <Link
              to={`/app/experts/${user?.user_id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              <ExternalLink size={16} aria-hidden />
              পাবলিক প্রোফাইল
            </Link>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-emerald-100">
              <span className="flex items-center gap-1.5">
                <Award size={14} aria-hidden />
                প্রোফাইল সম্পূর্ণতা
              </span>
              <span className="font-bold text-white">{completion}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-200 transition-all duration-500 ease-out"
                style={{ width: `${completion}%` }}
              />
            </div>
            {completion < 100 && (
              <p className="mt-2 text-xs text-emerald-100/80">
                আরও {100 - completion}% — বায়ো, শিক্ষা ও কমপক্ষে ২টি বিশেষত্ব যোগ করুন
              </p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={save} className="space-y-6">
        <SectionCard
          icon={Briefcase}
          title="পেশাগত তথ্য"
          subtitle="কৃষকরা আপনাকে এভাবেই চিনবে"
          accent="emerald"
        >
          <FieldLabel hint="যেমন: কৃষি বিশেষজ্ঞ, হর্টিকালচার বিশেষজ্ঞ">
            পেশাগত শিরোনাম
          </FieldLabel>
          <input
            value={form.professional_title}
            onChange={(e) => setForm({ ...form, professional_title: e.target.value })}
            className={inputClass}
            placeholder="আপনার পদবি লিখুন"
          />

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <FieldLabel hint="মোট কত বছর অভিজ্ঞতা">অভিজ্ঞতা (বছর)</FieldLabel>
              <div className="relative">
                <Calendar
                  className="pointer-events-none absolute left-3.5 top-[2.65rem] text-slate-400"
                  size={18}
                  aria-hidden
                />
                <input
                  type="number"
                  min={0}
                  value={form.experience_years}
                  onChange={(e) =>
                    setForm({ ...form, experience_years: +e.target.value || 0 })
                  }
                  className={cn(inputClass, 'pl-11')}
                />
              </div>
            </div>
            <div>
              <FieldLabel hint="প্রতি সেশন বা ঘণ্টার হার">পরামর্শ ফি (৳)</FieldLabel>
              <div className="relative">
                <Banknote
                  className="pointer-events-none absolute left-3.5 top-[2.65rem] text-slate-400"
                  size={18}
                  aria-hidden
                />
                <input
                  type="number"
                  min={0}
                  value={form.consultation_fee}
                  onChange={(e) =>
                    setForm({ ...form, consultation_fee: +e.target.value || 0 })
                  }
                  className={cn(inputClass, 'pl-11')}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={GraduationCap}
          title="শিক্ষা ও যোগাযোগ"
          subtitle="বিশ্বাসযোগ্যতা বাড়ান"
          accent="blue"
        >
          <FieldLabel>শিক্ষাগত যোগ্যতা</FieldLabel>
          <input
            value={form.education}
            onChange={(e) => setForm({ ...form, education: e.target.value })}
            className={inputClass}
            placeholder="ডিগ্রি, বিশ্ববিদ্যালয়..."
          />

          <div className="mt-5">
            <FieldLabel hint="কৃষকরা কত দ্রুত উত্তর পাবেন">সাড়া দেওয়ার সময়</FieldLabel>
            <div className="relative">
              <Clock
                className="pointer-events-none absolute left-3.5 top-[2.65rem] text-slate-400"
                size={18}
                aria-hidden
              />
              <input
                value={form.response_time_hint}
                onChange={(e) => setForm({ ...form, response_time_hint: e.target.value })}
                className={cn(inputClass, 'pl-11')}
                placeholder="যেমন: ১ ঘণ্টা, ২৪ ঘণ্টার মধ্যে"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={FileText}
          title="পরিচিতি"
          subtitle="আপনার গল্প ও পরামর্শের ধরন"
          accent="violet"
        >
          <FieldLabel hint="কমপক্ষে ২–৩ বাক্য — কৃষকরা এটি পড়বে">
            বায়ো / পরিচিতি
          </FieldLabel>
          <textarea
            rows={5}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className={cn(inputClass, 'resize-y min-h-[120px]')}
            placeholder="আপনার অভিজ্ঞতা, কাজের ধরন ও কৃষকদের জন্য পরামর্শের বিষয় লিখুন..."
          />
          <p className="mt-2 text-right text-xs text-slate-400">
            {form.bio.length} অক্ষর
          </p>
        </SectionCard>

        <SectionCard
          icon={Sparkles}
          title="বিশেষত্ব"
          subtitle="কমপক্ষে ২টি নির্বাচন করুন — সার্চ ও ম্যাচিংয়ে সাহায্য করে"
          accent="amber"
        >
          <div className="flex flex-wrap gap-2.5">
            {specOptions.map((s) => {
              const on = form.specializations.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpec(s)}
                  className={cn(
                    'group relative inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all duration-200',
                    on
                      ? 'border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 scale-[1.02]'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/80 hover:text-emerald-900'
                  )}
                >
                  {on && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25">
                      <Check size={12} strokeWidth={3} aria-hidden />
                    </span>
                  )}
                  {s}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            নির্বাচিত:{' '}
            <span className="font-bold text-emerald-700">{form.specializations.length}</span>{' '}
            / {specOptions.length}
          </p>
        </SectionCard>

        <section
          className={cn(
            'overflow-hidden rounded-2xl border-2 p-5 transition-all sm:p-6',
            form.is_available
              ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 shadow-emerald-100/50 shadow-lg'
              : 'border-slate-200 bg-slate-50'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner',
                  form.is_available
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-300 text-slate-600'
                )}
              >
                <Zap size={26} aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">উপলব্ধতা</h2>
                <p className="text-sm text-slate-600">
                  {form.is_available
                    ? 'কৃষকরা এখন আপনার কাছ থেকে পরামর্শ নিতে পারবে'
                    : 'আপনি বর্তমানে নতুন পরামর্শ গ্রহণ করছেন না'}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={form.is_available}
              onClick={() => setForm((f) => ({ ...f, is_available: !f.is_available }))}
              className={cn(
                'relative h-11 w-[4.5rem] shrink-0 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30',
                form.is_available ? 'bg-emerald-500' : 'bg-slate-300'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 h-9 w-9 rounded-full bg-white shadow-md transition-transform duration-300',
                  form.is_available && 'translate-x-9'
                )}
              />
              <span className="sr-only">উপলব্ধতা টগল</span>
            </button>
          </div>
          <p
            className={cn(
              'mt-4 inline-flex rounded-full px-3 py-1 text-xs font-bold',
              form.is_available
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-200 text-slate-600'
            )}
          >
            {form.is_available ? '● উপলব্ধ' : '○ ব্যস্ত'}
          </p>
        </section>

        {/* Desktop save */}
        <button
          type="submit"
          disabled={saving}
          className="hidden w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-600/30 transition hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl disabled:opacity-60 md:flex"
        >
          {saving ? (
            <Loader2 size={20} className="animate-spin" aria-hidden />
          ) : (
            <Save size={20} aria-hidden />
          )}
          {saving ? 'সংরক্ষণ হচ্ছে...' : 'প্রোফাইল সংরক্ষণ করুন'}
        </button>
      </form>

      {/* Mobile sticky save */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200/90 bg-white/95 p-4 backdrop-blur-md md:hidden">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 font-bold text-white shadow-lg disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <Save size={18} aria-hidden />
          )}
          {saving ? 'সংরক্ষণ...' : 'সংরক্ষণ করুন'}
        </button>
      </div>
    </div>
  );
}
