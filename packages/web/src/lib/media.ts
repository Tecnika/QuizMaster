import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Медиатека на Firestore (тариф Spark, без Cloud Storage).
 * Файлы хранятся как data URL в отдельной коллекции `media`,
 * поэтому документ вопроса остаётся маленьким.
 */

/** Лимит документа Firestore — 1 МиБ; держим запас. */
const MAX_DATA_URL_LENGTH = 850_000;
/** Сырой файл до base64-кодирования. */
const MAX_RAW_BYTES = 620_000;
const MAX_IMAGE_DIMENSION = 1400;

export type MediaKind = 'image' | 'audio';

const cache = new Map<string, string>();

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.readAsDataURL(file);
  });
}

async function loadBitmap(file: File): Promise<{ width: number; height: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }> {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
    };
  }
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Не удалось открыть картинку'));
      img.src = url;
    });
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      draw: (ctx, w, h) => ctx.drawImage(image, 0, 0, w, h),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Уменьшает картинку и сжимает в JPEG, чтобы влезть в документ Firestore. */
export async function compressImage(file: File): Promise<string> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Браузер не поддерживает обработку картинок');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  bitmap.draw(ctx, width, height);

  let quality = 0.86;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > MAX_DATA_URL_LENGTH && quality > 0.45) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new Error('Картинка слишком большая даже после сжатия. Попробуйте файл поменьше.');
  }
  return dataUrl;
}

function readAudio(file: File): Promise<string> {
  if (file.size > MAX_RAW_BYTES) {
    throw new Error(
      'Аудио больше 600 КБ. Для викторины хватит фрагмента 20–30 секунд: '
      + 'обрежьте мелодию или сохраните MP3 в 96–128 кбит/с.',
    );
  }
  return fileToDataUrl(file);
}

export interface UploadedMedia {
  id: string;
  dataUrl: string;
}

/** Загружает файл в медиатеку и возвращает id документа. */
export async function uploadMedia(file: File, kind: MediaKind, authorId: string): Promise<UploadedMedia> {
  const dataUrl = kind === 'image' ? await compressImage(file) : await readAudio(file);
  if (dataUrl.length > MAX_DATA_URL_LENGTH) {
    throw new Error('Файл слишком большой. Уменьшите картинку или обрежьте аудио.');
  }
  const ref = await addDoc(collection(db, 'media'), {
    authorId,
    kind,
    name: file.name,
    mime: file.type || (kind === 'image' ? 'image/jpeg' : 'audio/mpeg'),
    size: file.size,
    dataUrl,
    createdAt: new Date().toISOString(),
  });
  cache.set(ref.id, dataUrl);
  return { id: ref.id, dataUrl };
}

/** Читает медиа из кеша или Firestore. */
export async function getMediaDataUrl(mediaId: string): Promise<string> {
  const cached = cache.get(mediaId);
  if (cached) return cached;
  const snap = await getDoc(doc(db, 'media', mediaId));
  const dataUrl = snap.exists() ? String(snap.data().dataUrl || '') : '';
  if (dataUrl) cache.set(mediaId, dataUrl);
  return dataUrl;
}

export function mediaHint(kind: MediaKind): string {
  return kind === 'image'
    ? 'JPG/PNG до 5 МБ — сожмём автоматически до 1400 px.'
    : 'MP3/OGG/M4A до 600 КБ, лучше фрагмент 20–30 секунд.';
}
