import type { LoftGiftRecord } from "../types/loftTypes";

const KEY_SUB   = "ghost_loft_subscribed";
const KEY_LIKED = "ghost_loft_liked_ids";
const KEY_GIFTS = "ghost_loft_gifts";
const KEY_DAILY = "ghost_loft_daily_gifts";
const KEY_EXTRA = "ghost_loft_extra_cities";

export function isLoftSubscribed(): boolean {
  try { return localStorage.getItem(KEY_SUB) === "1"; } catch { return false; }
}
export function activateLoftSub(): void {
  try { localStorage.setItem(KEY_SUB, "1"); } catch {}
}
export function getLoftLikedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY_LIKED) || "[]"); } catch { return []; }
}
export function addLoftLike(id: string): void {
  try {
    const ids = getLoftLikedIds();
    if (!ids.includes(id)) localStorage.setItem(KEY_LIKED, JSON.stringify([...ids, id]));
  } catch {}
}
export function getLoftDailyGiftsUsed(): number {
  try {
    const raw = localStorage.getItem(KEY_DAILY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    if (date !== new Date().toDateString()) return 0;
    return count;
  } catch { return 0; }
}
export function incrementLoftDailyGifts(): void {
  try {
    const count = getLoftDailyGiftsUsed();
    localStorage.setItem(KEY_DAILY, JSON.stringify({ date: new Date().toDateString(), count: count + 1 }));
  } catch {}
}
export function addLoftGift(gift: LoftGiftRecord): void {
  try {
    const gifts: LoftGiftRecord[] = JSON.parse(localStorage.getItem(KEY_GIFTS) || "[]");
    localStorage.setItem(KEY_GIFTS, JSON.stringify([gift, ...gifts]));
  } catch {}
}
export function getLoftExtraCities(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY_EXTRA) || "[]"); } catch { return []; }
}

export function loftActivityLabel(last_seen_at?: string): string {
  if (!last_seen_at) return "In the Loft";
  const mins = (Date.now() - new Date(last_seen_at).getTime()) / 60000;
  if (mins < 5)   return "In the Loft now";
  if (mins < 60)  return `${Math.floor(mins)}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return "Recently active";
}
