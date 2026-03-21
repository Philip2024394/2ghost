import type { CellarGiftRecord } from "../types/cellarTypes";

const KEY_SUB        = "ghost_cellar_subscribed";
const KEY_LIKED      = "ghost_cellar_liked_ids";
const KEY_GIFTS      = "ghost_cellar_gifts";
const KEY_DAILY      = "ghost_cellar_daily_gifts";
const KEY_EXTRA      = "ghost_cellar_extra_cities";
const KEY_AGE_GATE   = "ghost_cellar_age_verified";

export function isCellarSubscribed(): boolean {
  try { return localStorage.getItem(KEY_SUB) === "1"; } catch { return false; }
}
export function activateCellarSub(): void {
  try { localStorage.setItem(KEY_SUB, "1"); } catch {}
}
export function isCellarAgeVerified(): boolean {
  try { return localStorage.getItem(KEY_AGE_GATE) === "1"; } catch { return false; }
}
export function setCellarAgeVerified(): void {
  try { localStorage.setItem(KEY_AGE_GATE, "1"); } catch {}
}
export function getCellarLikedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY_LIKED) || "[]"); } catch { return []; }
}
export function addCellarLike(id: string): void {
  try {
    const ids = getCellarLikedIds();
    if (!ids.includes(id)) localStorage.setItem(KEY_LIKED, JSON.stringify([...ids, id]));
  } catch {}
}
export function getCellarDailyGiftsUsed(): number {
  try {
    const raw = localStorage.getItem(KEY_DAILY);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    if (date !== new Date().toDateString()) return 0;
    return count;
  } catch { return 0; }
}
export function incrementCellarDailyGifts(): void {
  try {
    const count = getCellarDailyGiftsUsed();
    localStorage.setItem(KEY_DAILY, JSON.stringify({ date: new Date().toDateString(), count: count + 1 }));
  } catch {}
}
export function addCellarGift(gift: CellarGiftRecord): void {
  try {
    const gifts: CellarGiftRecord[] = JSON.parse(localStorage.getItem(KEY_GIFTS) || "[]");
    localStorage.setItem(KEY_GIFTS, JSON.stringify([gift, ...gifts]));
  } catch {}
}
export function getCellarExtraCities(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY_EXTRA) || "[]"); } catch { return []; }
}
export function cellarActivityLabel(last_seen_at?: string): string {
  if (!last_seen_at) return "In the Cellar";
  const mins = (Date.now() - new Date(last_seen_at).getTime()) / 60000;
  if (mins < 5)    return "In the Cellar now";
  if (mins < 60)   return `${Math.floor(mins)}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return "Recently active";
}
