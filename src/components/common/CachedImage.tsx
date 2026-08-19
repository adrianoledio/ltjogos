import React, { useState, useEffect, memo } from 'react';
import { getCachedImageUrl } from '../../lib/assetCache';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  fallbackSrc?: string;
  fallbackIcon?: React.ReactNode;
}

export const CachedImage = memo(function CachedImage({
  src,
  fallbackSrc,
  fallbackIcon,
  alt = '',
  className = '',
  onError,
  ...props
}: CachedImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (!src) {
      setCurrentSrc(undefined);
      return;
    }

    // Attempt to load from persistent IndexedDB cache
    getCachedImageUrl(src)
      .then((cachedUrl) => {
        if (isMounted) {
          setCurrentSrc(cachedUrl || src);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCurrentSrc(src);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
    if (onError) {
      onError(e);
    }
  };

  if (hasError || !currentSrc) {
    if (fallbackIcon) {
      return <>{fallbackIcon}</>;
    }
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      {...props}
    />
  );
});
