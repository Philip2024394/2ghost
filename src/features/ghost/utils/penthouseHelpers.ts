// ── Penthouse helpers ─────────────────────────────────────────────────────────
import type { PenthouseGift, PenthouseMatch, PenthouseVaultMessage, PenthouseProfile } from "../types/penthouseTypes";

const KEY_SUB          = "penthouse_sub_until";
const KEY_EXTRA_CITIES = "penthouse_extra_cities";
const KEY_DAILY_GIFTS  = "penthouse_daily_gifts";
const KEY_DAILY_DATE   = "penthouse_daily_gifts_date";
const KEY_GIFTS        = "penthouse_gifts";
const KEY_MATCHES      = "penthouse_matches";
const KEY_VAULT        = "penthouse_vault";
const KEY_WOMAN_COINS  = "penthouse_woman_coins";
const KEY_APPLY        = "penthouse_application";
const KEY_LIKED_IDS    = "penthouse_liked_ids";

// ── Subscription ─────────────────────────────────────────────────────────────
export function isPenthouseSubscribed(): boolean {
  try { return Number(localStorage.getItem(KEY_SUB) || "0") > Date.now(); }
  catch { return false; }
}

export function activatePenthouseSub(): void {
  try { localStorage.setItem(KEY_SUB, String(Date.now() + 30 * 86400000)); } catch {}
}

export function getPenthouseExtraCities(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY_EXTRA_CITIES) || "[]"); } catch { return []; }
}

export function addExtraCity(code: string): void {
  try {
    const cities = getPenthouseExtraCities();
    if (!cities.includes(code)) {
      cities.push(code);
      localStorage.setItem(KEY_EXTRA_CITIES, JSON.stringify(cities));
    }
  } catch {}
}

// ── Daily gift allowance ──────────────────────────────────────────────────────
export function getDailyGiftsUsed(): number {
  try {
    const today = new Date().toDateString();
    if (localStorage.getItem(KEY_DAILY_DATE) !== today) {
      localStorage.setItem(KEY_DAILY_DATE, today);
      localStorage.setItem(KEY_DAILY_GIFTS, "0");
      return 0;
    }
    return Number(localStorage.getItem(KEY_DAILY_GIFTS) || "0");
  } catch { return 0; }
}

export function incrementDailyGifts(): void {
  try {
    const today = new Date().toDateString();
    localStorage.setItem(KEY_DAILY_DATE, today);
    localStorage.setItem(KEY_DAILY_GIFTS, String(getDailyGiftsUsed() + 1));
  } catch {}
}

// ── Gifts ─────────────────────────────────────────────────────────────────────
export function loadPenthouseGifts(): PenthouseGift[] {
  try { return JSON.parse(localStorage.getItem(KEY_GIFTS) || "[]"); } catch { return []; }
}

export function savePenthouseGifts(gifts: PenthouseGift[]): void {
  try { localStorage.setItem(KEY_GIFTS, JSON.stringify(gifts)); } catch {}
}

export function addPenthouseGift(gift: PenthouseGift): void {
  const gifts = loadPenthouseGifts();
  gifts.unshift(gift);
  savePenthouseGifts(gifts);
}

// ── Likes ─────────────────────────────────────────────────────────────────────
export function getPenthouseLikedIds(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY_LIKED_IDS) || "[]"); } catch { return []; }
}

export function addPenthouseLike(profileId: string): void {
  try {
    const ids = getPenthouseLikedIds();
    if (!ids.includes(profileId)) {
      ids.push(profileId);
      localStorage.setItem(KEY_LIKED_IDS, JSON.stringify(ids));
    }
  } catch {}
}

// ── Matches ───────────────────────────────────────────────────────────────────
export function loadPenthouseMatches(): PenthouseMatch[] {
  try { return JSON.parse(localStorage.getItem(KEY_MATCHES) || "[]"); } catch { return []; }
}

export function savePenthouseMatches(matches: PenthouseMatch[]): void {
  try { localStorage.setItem(KEY_MATCHES, JSON.stringify(matches)); } catch {}
}

export function addPenthouseMatch(match: PenthouseMatch): void {
  const matches = loadPenthouseMatches();
  matches.unshift(match);
  savePenthouseMatches(matches);
}

// ── Vault ─────────────────────────────────────────────────────────────────────
export function loadVaultMessages(matchId: string): PenthouseVaultMessage[] {
  try {
    const all: Record<string, PenthouseVaultMessage[]> = JSON.parse(localStorage.getItem(KEY_VAULT) || "{}");
    return all[matchId] || [];
  } catch { return []; }
}

export function saveVaultMessage(matchId: string, msg: PenthouseVaultMessage): void {
  try {
    const all: Record<string, PenthouseVaultMessage[]> = JSON.parse(localStorage.getItem(KEY_VAULT) || "{}");
    if (!all[matchId]) all[matchId] = [];
    all[matchId].push(msg);
    localStorage.setItem(KEY_VAULT, JSON.stringify(all));
  } catch {}
}

export function isVaultArchived(match: PenthouseMatch): boolean {
  return Date.now() - match.lastActivityAt > 30 * 86400000;
}

// ── Woman coin balance ────────────────────────────────────────────────────────
export function getWomanCoinBalance(): number {
  try { return Number(localStorage.getItem(KEY_WOMAN_COINS) || "0"); } catch { return 0; }
}

export function addWomanCoins(amount: number): void {
  try { localStorage.setItem(KEY_WOMAN_COINS, String(getWomanCoinBalance() + amount)); } catch {}
}

// ── Application ───────────────────────────────────────────────────────────────
export function hasApplied(): boolean {
  try { return !!localStorage.getItem(KEY_APPLY); } catch { return false; }
}

export function saveApplication(data: object): void {
  try { localStorage.setItem(KEY_APPLY, JSON.stringify({ ...data, appliedAt: Date.now() })); } catch {}
}

// ── Responsive badge ──────────────────────────────────────────────────────────
export function isResponsive(profile: PenthouseProfile): boolean {
  if (profile.totalGiftsReceived < 3) return false;
  return profile.totalReplied / profile.totalGiftsReceived >= 0.7;
}

// ── Activity label ────────────────────────────────────────────────────────────
export function penthouseActivityLabel(lastSeenAt: number): string {
  const mins = Math.floor((Date.now() - lastSeenAt) / 60000);
  if (mins < 30)  return "On the floor now";
  if (mins < 360) return "Active today";
  return "Active this week";
}
