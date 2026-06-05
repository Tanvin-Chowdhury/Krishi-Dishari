import { useEffect, useState } from 'react';
import { cn } from '../../shared/lib/cn';
import { getNewsCoverImage, pickCategoryImage } from './newsUtils';

export default function NewsCoverImage({ article, className = '', alt = '', ...props }) {
  const primary = getNewsCoverImage(article);
  const fallback = pickCategoryImage(article);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setUseFallback(false);
  }, [primary]);

  return (
    <img
      {...props}
      src={useFallback ? fallback : primary}
      alt={alt}
      className={cn(className)}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setUseFallback(true)}
    />
  );
}
