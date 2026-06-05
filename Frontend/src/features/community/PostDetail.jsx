import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { communityApi } from '../../shared/services/communityApi';
import PostCard from './components/PostCard';
import CommentThread from './components/CommentThread';
import { Skeleton } from '../../shared/design-system/Skeleton';

export default function PostDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadComments = useCallback(async () => {
    try {
      const res = await communityApi.getComments(postId);
      setComments(res.comments || []);
    } catch {
      setComments([]);
    }
  }, [postId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await communityApi.getPost(postId);
        if (!cancelled) {
          setPost(res.post ?? res.data?.post ?? null);
          await loadComments();
        }
      } catch {
        if (!cancelled) setPost(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, loadComments]);

  useEffect(() => {
    if (!loading && post && window.location.hash === '#comments') {
      document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading, post]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-600">পোস্ট পাওয়া যায়নি</p>
        <Link to="/app/community" className="mt-4 inline-block text-emerald-700">
          ফিডে ফিরুন
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        to="/app/community"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-emerald-700"
      >
        <ArrowLeft size={16} aria-hidden />
        কমিউনিটি ফিড
      </Link>

      <PostCard post={post} variant="detail" showExpertAnswer={false} />

      <section id="comments" className="mt-6 scroll-mt-24 border-t border-slate-100 pt-5">
        <h2 className="mb-3 text-base font-bold text-slate-900">মন্তব্য</h2>
        <CommentThread
          postId={+postId}
          postAuthorId={post.author_id}
          comments={comments}
          onRefresh={loadComments}
        />
      </section>
    </div>
  );
}
