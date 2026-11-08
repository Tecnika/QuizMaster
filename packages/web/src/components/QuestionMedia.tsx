import { useEffect, useState } from 'react';
import { getMediaDataUrl } from '../lib/media';

/** Подставляет data URL из медиатеки либо обычную ссылку. */
export function useMediaUrl(mediaId?: string | null, fallback?: string): string {
  const [url, setUrl] = useState(fallback || '');

  useEffect(() => {
    if (!mediaId) {
      setUrl(fallback || '');
      return;
    }
    let alive = true;
    getMediaDataUrl(mediaId)
      .then((dataUrl) => {
        if (alive) setUrl(dataUrl || fallback || '');
      })
      .catch(() => {
        if (alive) setUrl(fallback || '');
      });
    return () => { alive = false; };
  }, [mediaId, fallback]);

  return url;
}

export function QuestionImage({
  mediaId,
  src,
  className,
  alt = '',
}: {
  mediaId?: string | null;
  src?: string | null;
  className?: string;
  alt?: string;
}) {
  const url = useMediaUrl(mediaId, src || '');
  if (!url) return null;
  return <img className={className} src={url} alt={alt} />;
}

export function QuestionAudio({
  mediaId,
  src,
  className,
  autoPlay = false,
}: {
  mediaId?: string | null;
  src?: string | null;
  className?: string;
  autoPlay?: boolean;
}) {
  const url = useMediaUrl(mediaId, src || '');
  if (!url) return null;
  return <audio className={className} controls autoPlay={autoPlay} src={url} />;
}
