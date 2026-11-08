import { useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { mediaHint, uploadMedia, type MediaKind } from '../lib/media';
import { QuestionAudio, QuestionImage } from './QuestionMedia';

export interface MediaValue {
  mediaId: string;
  url: string;
}

/**
 * Поле медиа: загрузка файла в медиатеку Firestore или внешняя ссылка.
 * Возвращает либо id загруженного файла, либо URL.
 */
export default function MediaField({
  kind,
  label,
  mediaId,
  url,
  onChange,
}: {
  kind: MediaKind;
  label: string;
  mediaId?: string;
  url?: string;
  onChange: (value: MediaValue) => void;
}) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (file: File | undefined) => {
    if (!file || !user) return;
    setError('');
    setBusy(true);
    try {
      const uploaded = await uploadMedia(file, kind, user.uid);
      onChange({ mediaId: uploaded.id, url: '' });
    } catch (e: any) {
      setError(e?.message || 'Не удалось загрузить файл');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const hasMedia = Boolean(mediaId || url);

  return (
    <div className="qm-field">
      <label className="qm-label">{label}</label>
      <div className="qm-media-row">
        <button
          type="button"
          className="qm-btn qm-btn-ghost qm-btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Загружаем…' : hasMedia ? 'Заменить файл' : 'Загрузить файл'}
        </button>
        {hasMedia && (
          <button
            type="button"
            className="qm-btn qm-btn-danger qm-btn-sm"
            onClick={() => {
              onChange({ mediaId: '', url: '' });
              setError('');
            }}
          >
            Убрать
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={kind === 'image' ? 'image/*' : 'audio/*'}
          style={{ display: 'none' }}
          onChange={(e) => void pick(e.target.files?.[0])}
        />
      </div>
      <p className="qm-small qm-media-hint">{mediaHint(kind)}</p>

      <input
        className="qm-input"
        value={url}
        onChange={(e) => onChange({ mediaId: '', url: e.target.value })}
        placeholder={kind === 'image' ? '…или ссылка https://…/image.jpg' : '…или ссылка https://…/audio.mp3'}
      />

      {error && <p className="qm-danger-text">{error}</p>}

      {kind === 'image' ? (
        <QuestionImage className="qm-media-preview" mediaId={mediaId} src={url} />
      ) : (
        <QuestionAudio className="qm-audio-preview" mediaId={mediaId} src={url} />
      )}
    </div>
  );
}
