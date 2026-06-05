import { Link } from 'react-router';
import { Clock, User, Bookmark, Eye, ChevronRight } from 'lucide-react';
import { cn } from '../../shared/lib/cn';
import { CATEGORY_STYLES, formatNewsDate, getNewsCoverImage } from './newsUtils';

const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60)    return 'এইমাত্র';
  if (s < 3600)  return `${Math.floor(s / 60)} মি. আগে`;
  if (s < 86400) return `${Math.floor(s / 3600)} ঘ. আগে`;
  return formatNewsDate(d);
};

/* ─── Main card (default / hero / compact) ──────────────── */
export default function NewsCard({ article, variant = 'default', className = '' }) {
  if (!article) return null;
  const isHero    = variant === 'hero';
  const isCompact = variant === 'compact';
  const img       = getNewsCoverImage(article);

  return (
    <Link
      to={`/app/news/${article.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        isHero && 'md:col-span-2',
        className
      )}
    >
      {/* Image */}
      <div className={cn('relative overflow-hidden', isHero ? 'h-56 md:h-72' : isCompact ? 'h-28' : 'h-44')}>
        <img
          src={img}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {article.is_breaking && (
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-extrabold tracking-wider text-white shadow">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            BREAKING
          </span>
        )}

        <span className={cn(
          'absolute bottom-3 left-3 rounded-md px-1.5 py-0.5 text-[9px] font-bold ring-1',
          CATEGORY_STYLES[article.category] || CATEGORY_STYLES.general
        )}>
          {article.category_label || article.category}
        </span>

        {isHero && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition">
            পড়ুন <ChevronRight className="h-3.5 w-3.5" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn('flex flex-1 flex-col', isCompact ? 'p-3' : 'p-4')}>
        <h3 className={cn(
          'font-bold text-slate-900 leading-snug group-hover:text-emerald-800 transition line-clamp-2',
          isHero ? 'text-xl md:text-2xl' : isCompact ? 'text-sm' : 'text-[15px]'
        )}>
          {article.title}
        </h3>

        {!isCompact && article.summary && (
          <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-2">{article.summary}</p>
        )}

        <div className="mt-auto pt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
          {article.author_name && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" /> {article.author_name}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {timeAgo(article.published_at)}
          </span>
          {article.reading_time && (
            <span>{article.reading_time} মি.</span>
          )}
          {article.source_name && (
            <span className="font-medium text-emerald-600">{article.source_name}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─── Compact horizontal list item ─────────────────────── */
export function NewsListItem({ article }) {
  if (!article) return null;
  const img = getNewsCoverImage(article);
  return (
    <Link
      to={`/app/news/${article.slug}`}
      className="group flex gap-3 rounded-2xl border border-slate-100 p-3 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all"
    >
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
        <img
          src={img}
          alt={article.title}
          className="h-full w-full object-cover group-hover:scale-105 transition"
          onError={e => { e.target.style.display = 'none'; }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <span className={cn(
          'inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold ring-1 mb-1',
          CATEGORY_STYLES[article.category] || CATEGORY_STYLES.general
        )}>
          {article.category_label}
        </span>
        <p className="text-xs font-bold text-slate-900 line-clamp-2 group-hover:text-emerald-800 transition">
          {article.title}
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">{timeAgo(article.published_at)}</p>
      </div>
    </Link>
  );
}
