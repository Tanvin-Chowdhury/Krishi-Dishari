import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import {
  Briefcase, ArrowLeft, FileText, MapPin, Users, Phone,
  Banknote, Info, Lightbulb,
} from 'lucide-react';
import { AuthContext } from '../../../core/auth/AuthContext';
import { laborApi } from '../../../shared/services/laborApi';
import { WORK_TYPE_OPTIONS } from '../laborConstants';

function bn(n) {
  return Number(n || 0).toLocaleString('bn-BD');
}

const INPUT = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition';

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 flex-shrink-0">
          <Icon size={16} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="text-sm font-extrabold text-gray-900">{title}</h2>
          {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-extrabold text-gray-600">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function CostPreview({ duration, workers, wage, total }) {
  const d = parseInt(duration, 10) || 1;
  const w = parseInt(workers, 10) || 1;
  const r = parseFloat(wage) || 0;

  return (
    <div className="sticky top-4 space-y-4">
      {/* Cost card */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Banknote size={16} className="text-emerald-600" />
          <h3 className="text-sm font-extrabold text-emerald-800">আনুমানিক খরচ</h3>
        </div>
        <p className="text-3xl font-extrabold text-emerald-700">৳{bn(total)}</p>
        <p className="mt-1 text-xs text-emerald-600">মোট আনুমানিক ব্যয়</p>

        <div className="mt-4 rounded-xl bg-white/70 border border-emerald-100 p-3 space-y-1.5">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">হিসাব</p>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>মেয়াদ</span>
            <span className="font-bold">{bn(d)} দিন</span>
          </div>
          <div className="flex items-center justify-center text-gray-300 text-xs">×</div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>শ্রমিক</span>
            <span className="font-bold">{bn(w)} জন</span>
          </div>
          <div className="flex items-center justify-center text-gray-300 text-xs">×</div>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>দৈনিক মজুরি</span>
            <span className="font-bold">৳{bn(r)}</span>
          </div>
          <div className="border-t border-emerald-100 pt-2 flex items-center justify-between text-sm">
            <span className="font-extrabold text-emerald-700">মোট</span>
            <span className="font-extrabold text-emerald-700">৳{bn(total)}</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h3 className="flex items-center gap-2 mb-3 text-xs font-extrabold text-gray-700">
          <Lightbulb size={13} className="text-amber-500" /> সহায়ক পরামর্শ
        </h3>
        <ul className="space-y-2 text-[11px] text-gray-500 leading-relaxed">
          <li className="flex items-start gap-1.5">
            <Info size={11} className="mt-0.5 flex-shrink-0 text-emerald-400" />
            স্পষ্ট শিরোনাম ও বিবরণ দিলে দক্ষ শ্রমিক দ্রুত আবেদন করবে
          </li>
          <li className="flex items-start gap-1.5">
            <Info size={11} className="mt-0.5 flex-shrink-0 text-emerald-400" />
            বাজারমূল্যের কাছাকাছি মজুরি দিলে আরও বেশি আবেদন পাবেন
          </li>
          <li className="flex items-start gap-1.5">
            <Info size={11} className="mt-0.5 flex-shrink-0 text-emerald-400" />
            সঠিক স্থান ও তারিখ উল্লেখ করুন
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function JobPostForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    job_title: '',
    work_description: '',
    work_type: 'daily',
    location: '',
    start_date: '',
    duration_days: '1',
    required_workers: '1',
    wage_per_day: '',
    contact_phone: user?.phone || '',
  });

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await laborApi.getJob(id);
        const p = res.post;
        setForm({
          job_title: p.job_title || '',
          work_description: p.work_description || '',
          work_type: p.work_type || 'daily',
          location: p.location || '',
          start_date: p.start_date ? String(p.start_date).slice(0, 10) : '',
          duration_days: String(p.duration_days || 1),
          required_workers: String(p.required_workers || 1),
          wage_per_day: String(p.wage_per_day || ''),
          contact_phone: p.contact_phone || '',
        });
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [id, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const total =
    (parseFloat(form.wage_per_day) || 0) *
    (parseInt(form.duration_days, 10) || 1) *
    (parseInt(form.required_workers, 10) || 1);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const body = {
        ...form,
        duration_days: +form.duration_days,
        required_workers: +form.required_workers,
        wage_per_day: +form.wage_per_day,
      };
      if (isEdit) await laborApi.updateJob(id, body);
      else await laborApi.createJob(body);
      navigate('/app/labor/my-posts');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* ── Header ── */}
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-md mb-5">
          <Link to="/app/labor/my-posts"
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 mb-3">
            <ArrowLeft size={13} /> আমার কাজের পোস্ট
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm flex-shrink-0">
              <Briefcase size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">
                {isEdit ? 'কাজের পোস্ট সম্পাদনা' : 'নতুন কাজের পোস্ট'}
              </h1>
              <p className="text-xs text-gray-500">শ্রমিকরা আপনার পোস্ট দেখে আবেদন করতে পারবে</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Form layout ── */}
        <form onSubmit={submit}>
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">

            {/* Left: form sections */}
            <div className="space-y-4">

              {/* Section 1: Job info */}
              <SectionCard icon={FileText} title="কাজের তথ্য" subtitle="কাজের শিরোনাম ও বিবরণ">
                <Field label="কাজের শিরোনাম" required hint="যেমন: ধান কাটার কাজ — ৫ একর">
                  <input className={INPUT} value={form.job_title}
                    onChange={e => set('job_title', e.target.value)} required
                    placeholder="কাজের শিরোনাম লিখুন" />
                </Field>
                <Field label="কাজের বিবরণ" hint="কাজের ধরন, প্রয়োজনীয় দক্ষতা ও বিশেষ নির্দেশনা">
                  <textarea className={INPUT} rows={3} value={form.work_description}
                    onChange={e => set('work_description', e.target.value)}
                    placeholder="কাজ সম্পর্কে বিস্তারিত লিখুন..." />
                </Field>
                <Field label="কাজের ধরন">
                  <select className={INPUT} value={form.work_type}
                    onChange={e => set('work_type', e.target.value)}>
                    {WORK_TYPE_OPTIONS.map(w => (
                      <option key={w.code} value={w.code}>{w.label}</option>
                    ))}
                  </select>
                </Field>
              </SectionCard>

              {/* Section 2: Location & time */}
              <SectionCard icon={MapPin} title="স্থান ও সময়" subtitle="কাজের অবস্থান ও সময়কাল">
                <Field label="স্থান" hint="গ্রাম, উপজেলা, জেলা">
                  <input className={INPUT} placeholder="যেমন: রামপুর, বগুড়া"
                    value={form.location} onChange={e => set('location', e.target.value)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="শুরুর তারিখ">
                    <input type="date" className={INPUT} value={form.start_date}
                      onChange={e => set('start_date', e.target.value)} />
                  </Field>
                  <Field label="মেয়াদ (দিন)" required>
                    <input type="number" min={1} className={INPUT} value={form.duration_days}
                      onChange={e => set('duration_days', e.target.value)} required />
                  </Field>
                </div>
              </SectionCard>

              {/* Section 3: Workers & wage */}
              <SectionCard icon={Users} title="শ্রমিক ও মজুরি" subtitle="প্রয়োজনীয় শ্রমিক ও দৈনিক মজুরি">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="প্রয়োজনীয় শ্রমিক" required>
                    <input type="number" min={1} className={INPUT} value={form.required_workers}
                      onChange={e => set('required_workers', e.target.value)} required />
                  </Field>
                  <Field label="দৈনিক মজুরি (৳)" required hint="প্রতি শ্রমিকের দৈনিক মজুরি">
                    <input type="number" min={1} className={INPUT} value={form.wage_per_day}
                      onChange={e => set('wage_per_day', e.target.value)} required
                      placeholder="যেমন: ৬৫০" />
                  </Field>
                </div>
              </SectionCard>

              {/* Section 4: Contact */}
              <SectionCard icon={Phone} title="যোগাযোগ" subtitle="শ্রমিকরা যোগাযোগ করতে পারবে">
                <Field label="ফোন নম্বর" required hint="বাংলাদেশের মোবাইল নম্বর (01XXXXXXXXX)">
                  <input type="tel" className={INPUT} placeholder="01XXXXXXXXX"
                    value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} required />
                </Field>
              </SectionCard>

              {/* Mobile cost preview (hidden on desktop) */}
              <div className="lg:hidden">
                <CostPreview
                  duration={form.duration_days}
                  workers={form.required_workers}
                  wage={form.wage_per_day}
                  total={total}
                />
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white hover:bg-emerald-700 disabled:opacity-60 shadow-sm transition">
                <Briefcase size={16} />
                {loading ? 'সংরক্ষণ হচ্ছে...' : isEdit ? 'আপডেট করুন' : 'পোস্ট করুন'}
              </button>
            </div>

            {/* Right: sticky cost preview (desktop) */}
            <div className="hidden lg:block">
              <CostPreview
                duration={form.duration_days}
                workers={form.required_workers}
                wage={form.wage_per_day}
                total={total}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
