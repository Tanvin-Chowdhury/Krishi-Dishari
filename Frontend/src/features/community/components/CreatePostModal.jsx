import { useEffect, useState } from 'react';
import { X, ImagePlus, Sparkles, Loader2 } from 'lucide-react';
import { communityApi } from '../../../shared/services/communityApi';
import { aiApi } from '../../../shared/services/aiApi';
import { POST_TYPES, tagLabel, tagIdForPostType } from '../communityConstants';
import { toast } from 'react-toastify';

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

export default function CreatePostModal({
  open,
  onClose,
  onCreated,
  aiPredictionId,
  initialPostType,
}) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    post_type: 'discussion',
    tag_id: '',
    images: [],
  });

  useEffect(() => {
    if (!open) return;
    communityApi.getTags().then((r) => setTags(r.tags || [])).catch(() => {});
    if (initialPostType) {
      setForm((f) => ({ ...f, post_type: initialPostType }));
    }
  }, [open, initialPostType]);

  useEffect(() => {
    if (!open || !aiPredictionId) return;
    setAiLoading(true);
    aiApi
      .getPrediction(aiPredictionId)
      .then((res) => {
        const p = res.prediction;
        if (!p) return;
        setForm((f) => ({
          ...f,
          post_type: 'disease_issue',
          title: p.disease_name
            ? `রোগ সমস্যা: ${p.disease_name}`
            : 'AI রোগ বিশ্লেষণ',
          content: [
            p.problem && `সমস্যা: ${p.problem}`,
            p.cause && `কারণ: ${p.cause}`,
            p.solution && `সমাধান: ${p.solution}`,
            p.prevention && `প্রতিরোধ: ${p.prevention}`,
          ]
            .filter(Boolean)
            .join('\n\n'),
          images: p.image ? [p.image] : f.images,
        }));
      })
      .catch(() => {})
      .finally(() => setAiLoading(false));
  }, [open, aiPredictionId]);

  const onFiles = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setForm((f) => ({
          ...f,
          images: [...f.images, reader.result].slice(0, 4),
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await communityApi.createPost({
        title: form.title,
        content: form.content,
        post_type: form.post_type,
        tag_id: form.tag_id ? +form.tag_id : null,
        images: form.images,
        ai_prediction_id: aiPredictionId ? +aiPredictionId : null,
      });
      toast.success('পোস্ট প্রকাশিত');
      onCreated?.(res.post);
      onClose();
      setForm({
        title: '',
        content: '',
        post_type: 'discussion',
        tag_id: '',
        images: [],
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">নতুন পোস্ট</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        {aiLoading && (
          <p className="flex items-center gap-2 px-5 py-2 text-sm text-amber-700">
            <Loader2 size={16} className="animate-spin" aria-hidden />
            AI রিপোর্ট লোড হচ্ছে...
          </p>
        )}

        <form onSubmit={submit} className="space-y-4 p-5">
          <div>
            <label className="text-xs font-medium text-slate-600">পোস্ট ধরন</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {POST_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      post_type: t.value,
                      tag_id: tagIdForPostType(tags, t.value) || f.tag_id,
                    }))
                  }
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    form.post_type === t.value
                      ? t.color + ' ring-2 ring-emerald-500/30'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">শিরোনাম</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
              maxLength={200}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">বিবরণ</label>
            <textarea
              required
              rows={5}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">ট্যাগ</label>
            <select
              value={form.tag_id}
              onChange={(e) => setForm((f) => ({ ...f, tag_id: e.target.value }))}
              className={inputClass}
            >
              <option value="">ট্যাগ বেছে নিন (ঐচ্ছিক)</option>
              {tags.map((t) => (
                <option key={t.tag_id} value={t.tag_id}>
                  {tagLabel(t.tag_name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-emerald-700">
              <ImagePlus size={18} aria-hidden />
              ছবি যোগ করুন
              <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
            </label>
            {form.images.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {form.images.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="h-24 w-full rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          images: f.images.filter((_, j) => j !== i),
                        }))
                      }
                      className="absolute right-1 top-1 rounded bg-black/50 px-1.5 text-xs text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {aiPredictionId && (
            <p className="flex items-center gap-1 text-xs text-amber-700">
              <Sparkles size={12} aria-hidden />
              AI রিপোর্ট এই পোস্টের সাথে লিঙ্ক করা হবে
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? 'প্রকাশ হচ্ছে...' : 'প্রকাশ করুন'}
          </button>
        </form>
      </div>
    </div>
  );
}
