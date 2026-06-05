import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'react-toastify';
import { ArrowLeft } from 'lucide-react';
import { adminApi } from '../../shared/services/adminApi';
import { AdminPageShell } from './components/AdminPageShell';

const CATEGORIES = [
  { key: 'farming_news', label: 'কৃষি সংবাদ' },
  { key: 'crop_disease', label: 'ফসল রোগ সতর্কতা' },
  { key: 'weather_alert', label: 'আবহাওয়া সতর্কতা' },
  { key: 'market_price', label: 'বাজার দাম' },
  { key: 'government_notice', label: 'সরকারি বিজ্ঞপ্তি' },
  { key: 'fertilizer_seed', label: 'সার ও বীজ' },
  { key: 'technology', label: 'কৃষি প্রযুক্তি' },
  { key: 'expert_advice', label: 'বিশেষজ্ঞ পরামর্শ' },
  { key: 'success_story', label: 'সাফল্যের গল্প' },
  { key: 'training', label: 'প্রশিক্ষণ' },
];

const emptyForm = {
  title: '',
  summary: '',
  content: '',
  category: 'farming_news',
  cover_image_url: '',
  source_url: '',
  status: 'draft',
  is_featured: false,
  is_breaking: false,
};

export default function AdminNewsEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const res = await adminApi.getNews(id);
      const a = res.article;
      setForm({
        title: a.title || '',
        summary: a.summary || '',
        content: a.content || '',
        category: a.category || 'farming_news',
        cover_image_url: a.cover_image_url || '',
        source_url: a.source_url || '',
        status: a.status || 'draft',
        is_featured: !!a.is_featured,
        is_breaking: !!a.is_breaking,
      });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await adminApi.updateNews(id, form);
        if (form.status === 'published') {
          await adminApi.patchNewsStatus(id, 'published');
        }
        toast.success('আপডেট হয়েছে');
      } else {
        await adminApi.createNews(form);
        toast.success('সংবাদ তৈরি হয়েছে');
      }
      navigate('/app/admin/news');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  if (loading) {
    return (
      <AdminPageShell title="লোড হচ্ছে...">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title={isEdit ? 'সংবাদ সম্পাদনা' : 'নতুন সংবাদ'}
      actions={
        <Link to="/app/admin/news" className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline">
          <ArrowLeft size={16} /> তালিকায় ফিরুন
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="text-xs font-semibold text-slate-600">শিরোনাম</label>
          <input
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">সারসংক্ষেপ</label>
          <textarea
            required
            rows={2}
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">সম্পূর্ণ নিবন্ধ</label>
          <textarea
            required
            rows={12}
            value={form.content}
            onChange={(e) => set('content', e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal leading-relaxed"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-600">বিভাগ</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">স্ট্যাটাস</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="draft">খসড়া</option>
              <option value="published">প্রকাশিত</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">কভার ইমেজ URL</label>
          <input
            value={form.cover_image_url}
            onChange={(e) => set('cover_image_url', e.target.value)}
            placeholder="https://..."
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_breaking} onChange={(e) => set('is_breaking', e.target.checked)} />
            Breaking
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? 'সংরক্ষণ...' : isEdit ? 'আপডেট করুন' : 'সংবাদ তৈরি করুন'}
        </button>
      </form>
    </AdminPageShell>
  );
}
