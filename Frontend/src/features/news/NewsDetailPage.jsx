import { useCallback, useEffect, useState, useContext } from "react";
import { Link, useParams } from "react-router";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MessageCircle,
  Share2,
  ThumbsUp,
  Clock,
  User,
} from "lucide-react";
import { newsApi } from "../../shared/services/newsApi";
import NewsCard from "./NewsCard";
import NewsCoverImage from "./NewsCoverImage";
import {
  CATEGORY_STYLES,
  formatNewsDate,
  shareNews,
} from "./newsUtils";
import { Skeleton } from "../../shared/design-system/Skeleton";
import { cn } from "../../shared/lib/cn";
import { AuthContext } from "../../core/auth/AuthContext";

export default function NewsDetailPage() {
  const { slug } = useParams();
  const { user } = useContext(AuthContext);
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await newsApi.getBySlug(slug);
      setArticle(res.article);
      setRelated(res.related || []);
      setComments(res.comments || []);
    } catch (e) {
      setError(e.message || "সংবাদ পাওয়া যায়নি");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const onBookmark = async () => {
    if (!user) return toast.info("লগইন করুন");
    try {
      const res = await newsApi.toggleBookmark(article.id);
      setArticle((a) => ({ ...a, is_bookmarked: res.bookmarked }));
      toast.success(res.bookmarked ? "সংরক্ষিত" : "সংরক্ষণ সরানো");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const onReact = async (type) => {
    if (!user) return toast.info("লগইন করুন");
    try {
      const res = await newsApi.react(article.id, type);
      setArticle((a) => ({
        ...a,
        user_reaction: res.reaction_type,
        reaction_count: res.reaction_count,
      }));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const onComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await newsApi.addComment(article.id, commentText.trim());
      setComments((c) => [res.comment, ...c]);
      setCommentText("");
      toast.success("মন্তব্য যোগ হয়েছে");
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="h-8 w-2/3 mb-4" />
        <Skeleton className="h-64 w-full mb-6 rounded-2xl" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          to="/app/news"
          className="text-emerald-700 font-semibold hover:underline"
        >
          সংবাদ পাতায় ফিরুন
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <Link
        to="/app/news"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline"
      >
        <ArrowLeft size={16} /> সব সংবাদ
      </Link>

      <span
        className={cn(
          'inline-block rounded-md px-2 py-0.5 text-xs font-bold ring-1 mb-3',
          CATEGORY_STYLES[article.category] || CATEGORY_STYLES.general
        )}
      >
        {article.category_label}
      </span>

      <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">
        {article.title}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <User size={16} /> {article.author_name}
        </span>
        <span>{formatNewsDate(article.published_at)}</span>
        <span className="inline-flex items-center gap-1">
          <Clock size={14} /> {article.reading_time} মিনিট পড়া
        </span>
        <span>{article.view_count} দর্শন</span>
        {article.source_name && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            উৎস: {article.source_name}
          </span>
        )}
      </div>

      {article.source_url && article.is_external && (
        <a
          href={article.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:underline"
        >
          মূল সংবাদ দেখুন →
        </a>
      )}

      <NewsCoverImage
        article={article}
        className="mt-6 w-full rounded-2xl object-cover max-h-[420px] shadow-md"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBookmark}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
            article.is_bookmarked
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-slate-200 text-slate-600 hover:bg-slate-50",
          )}
        >
          <Bookmark size={14} />{" "}
          {article.is_bookmarked ? "সংরক্ষিত" : "সংরক্ষণ"}
        </button>
        <button
          type="button"
          onClick={() => onReact("like")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <ThumbsUp size={14} /> {article.reaction_count || 0}
        </button>
        <button
          type="button"
          onClick={() => onReact("love")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Heart size={14} />
        </button>
        <button
          type="button"
          onClick={() => shareNews(article)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <Share2 size={14} /> শেয়ার
        </button>
      </div>

      <div className="prose prose-slate mt-8 max-w-none">
        <p className="text-lg text-slate-700 font-medium leading-relaxed">
          {article.summary}
        </p>
        <div className="mt-6 text-base text-slate-800 leading-loose whitespace-pre-wrap">
          {article.content}
        </div>
      </div>

      <section className="mt-12 border-t border-slate-200 pt-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-4">
          <MessageCircle size={20} /> মন্তব্য ({comments.length})
        </h2>
        {user && (
          <form onSubmit={onComment} className="mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder="আপনার মন্তব্য..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              className="mt-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              মন্তব্য পোস্ট করুন
            </button>
          </form>
        )}
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-700">
                {c.user_name}
              </p>
              <p className="mt-1 text-sm text-slate-600">{c.comment}</p>
            </li>
          ))}
        </ul>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            সম্পর্কিত সংবাদ
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {related.map((item) => (
              <NewsCard key={item.id} article={item} variant="compact" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
