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
  const safeId = ghostId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `${safeId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error } = await ghostSupabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

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
  const safeId = ghostId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `${safeId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  // Supabase JS v2 doesn't expose upload progress natively — simulate via size check
  if (onProgress) onProgress(0);

  const { error } = await ghostSupabase.storage
    .from(VIDEO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

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

// ── File upload ────────────────────────────────────────────────────────────

const FILE_BUCKET = 'ghost-files';

export async function uploadGhostFile(
  file: File,
  ghostId: string,
): Promise<{ path: string; publicUrl: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeId = ghostId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${safeId}/${Date.now()}-${safeName}`;

  const { error } = await ghostSupabase.storage
    .from(FILE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) throw new Error(`File upload failed: ${error.message}`);

  const { data } = ghostSupabase.storage.from(FILE_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function deleteGhostFile(url: string): Promise<void> {
  const path = extractPath(url, FILE_BUCKET);
  if (!path) return;
  await ghostSupabase.storage.from(FILE_BUCKET).remove([path]);
}

// ── Voice note upload ──────────────────────────────────────────────────────

const VOICE_BUCKET = 'ghost-voice';

export async function uploadGhostVoiceNote(
  audioBlob: Blob,
  ghostId: string,
): Promise<{ path: string; publicUrl: string }> {
  const safeId = ghostId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const path = `${safeId}/${Date.now()}-voice.webm`;

  const { error } = await ghostSupabase.storage
    .from(VOICE_BUCKET)
    .upload(path, audioBlob, { contentType: 'audio/webm', upsert: true });

  if (error) throw new Error(`Voice upload failed: ${error.message}`);

  const { data } = ghostSupabase.storage.from(VOICE_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function deleteGhostVoiceNote(url: string): Promise<void> {
  const path = extractPath(url, VOICE_BUCKET);
  if (!path) return;
  await ghostSupabase.storage.from(VOICE_BUCKET).remove([path]);
}
