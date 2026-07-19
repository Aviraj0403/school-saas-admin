import { api } from '@/services/api';

export const MAX_PHOTO_BYTES = 100 * 1024; // server rejects anything larger (413)

/**
 * Resolves a server-relative media path (e.g. /api/uploads/…) against the API
 * origin so <img>/next-image can load it. Absolute URLs pass through.
 */
export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = api.defaults.baseURL || '';
  const origin = base.split('/api/')[0];
  return origin + (path.startsWith('/') ? path : `/${path}`);
}

/**
 * Downscales the image to ≤512px and re-encodes as JPEG, lowering quality
 * until it fits the server's 100 KB profile-photo cap. Returns null if the
 * file is not a decodable image or cannot fit.
 */
export async function compressImageForProfile(file: File, maxDimension = 512): Promise<Blob | null> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (let quality = 0.9; quality >= 0.3; quality -= 0.1) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (blob && blob.size <= MAX_PHOTO_BYTES) return blob;
  }
  return null;
}
