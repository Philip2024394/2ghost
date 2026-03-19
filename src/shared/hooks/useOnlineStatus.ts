/**
 * Returns true if last_seen_at is within the last 5 minutes.
 * A null/undefined value means the profile has never been seen — treated as offline.
 */
export function isOnline(last_seen_at: string | null | undefined): boolean {
  if (!last_seen_at) return false;
  const seen = new Date(last_seen_at).getTime();
  if (isNaN(seen)) return false;
  return Date.now() - seen < 5 * 60 * 1000;
}
