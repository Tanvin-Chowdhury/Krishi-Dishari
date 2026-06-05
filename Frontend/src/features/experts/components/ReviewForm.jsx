import { useState } from 'react';
import { Star } from 'lucide-react';
import { expertApi } from '../../../shared/services/expertApi';
import { toast } from 'react-toastify';

export default function ReviewForm({ consultantId, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await expertApi.addReview(consultantId, {
        rating,
        review_text: text.trim() || undefined,
      });
      toast.success('রিভিউ সংরক্ষিত হয়েছে');
      setText('');
      onSubmitted?.();
    } catch (err) {
      toast.error(err.message || 'রিভিউ দেওয়া যায়নি');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
      <h3 className="font-semibold text-slate-900">আপনার রিভিউ দিন</h3>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            className="rounded p-0.5 transition hover:scale-110"
            aria-label={`${i} তারকা`}
          >
            <Star
              size={28}
              className={
                i <= rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300'
              }
            />
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="আপনার অভিজ্ঞতা লিখুন (ঐচ্ছিক)"
        className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={submitting}
        className="mt-3 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {submitting ? 'পাঠানো হচ্ছে...' : 'রিভিউ জমা দিন'}
      </button>
    </form>
  );
}
