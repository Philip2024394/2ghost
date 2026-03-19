/**
 * Ghost Room — Supabase Storage helpers
 * Buckets: ghost-images (10 MB) · ghost-videos (500 MB)
 */
import { ghostSupabase } from './ghostSupabase';

const IMAGE_BUCKET = 'ghost-images';
const VIDEO_BUCKET = 'ghost-videos';

// ── Image upload ────────────────────────────────────────────────────────────

export async function uploadGhostImage(
  file: File,
  ghostId: string,
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${ghostId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

  const { error } = await ghostSupabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = ghostSupabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteGhostImage(url: string): Promise<void> {
  const path = extractPath(url, IMAGE_BUCKET);
  if (!path) return;
  await ghostSupabase.storage.from(IMAGE_BUCKET).remove([path]);
}

// ── Video upload ────────────────────────────────────────────────────────────

export async function uploadGhostVideo(
  file: File,
  ghostId: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const path = `${ghostId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

  // Supabase JS v2 doesn't expose upload progress natively — simulate via size check
  if (onProgress) onProgress(0);

  const { error } = await ghostSupabase.storage
    .from(VIDEO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Video upload failed: ${error.message}`);

  if (onProgress) onProgress(100);

  const { data } = ghostSupabase.storage.from(VIDEO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteGhostVideo(url: string): Promise<void> {
  const path = extractPath(url, VIDEO_BUCKET);
  if (!path) return;
  await ghostSupabase.storage.from(VIDEO_BUCKET).remove([path]);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Returns true if the URL is a Supabase Storage URL for this project */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('czlfqasujfdfumelzjbp.supabase.co/storage');
}

function extractPath(publicUrl: string, bucket: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(publicUrl.slice(idx + marker.length));
  } catch {
    return null;
  }
}
