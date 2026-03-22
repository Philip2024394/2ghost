// ── Feature gating & shared helpers ──────────────────────────────────────────
// NOTE: Async Supabase versions of floor gift recording and coin sync are in
// ghostDataService.ts (recordFloorGift, syncCoinsToSupabase). Call those in
// addition to the local helpers here for full backend persistence.

export function readCoins(): number {
  try { return Number(localStorage.getItem("ghost_coins") || "100"); } catch { return 100; }
}
export function writeCoins(n: number): void {
  try { localStorage.setItem("ghost_coins", String(Math.max(0, n))); } catch {}
}
export function spendCoins(amount: number): boolean {
  const bal = readCoins();
  if (bal < amount) return false;
  writeCoins(bal - amount);
  return true;
}

export function getTier(): string {
  try { return localStorage.getItem("ghost_house_tier") ?? ""; } catch { return ""; }
}
const TIER_RANK: Record<string, number> = {
  standard: 0, suite: 1, kings: 2, penthouse: 3, cellar: 2, garden: 0,
};
export function getTierRank(): number {
  return TIER_RANK[getTier()] ?? -1;
}
export function isKingsPlus(): boolean { return getTierRank() >= 2; }
export function isPenthouseOnly(): boolean { return getTier() === "penthouse"; }

// ── Ghost Clock ───────────────────────────────────────────────────────────────
const WINDOW_KEY = "ghost_window_until";
export function getWindowModeUntil(): number {
  try { return Number(localStorage.getItem(WINDOW_KEY) || "0"); } catch { return 0; }
}
export function hasActiveWindowMode(): boolean { return getWindowModeUntil() > Date.now(); }
export function startWindowMode(): void {
  try { localStorage.setItem(WINDOW_KEY, String(Date.now() + 2 * 60 * 60 * 1000)); } catch {}
}
export function stopWindowMode(): void {
  try { localStorage.setItem(WINDOW_KEY, "0"); } catch {}
}

// ~25% of profiles are deterministically "in window"
export function isProfileInWindow(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(61, h) + id.charCodeAt(i) | 0;
  return Math.abs(h) % 4 === 0;
}

// ── Ghost Score ───────────────────────────────────────────────────────────────
export type ScoreGiven = { targetProfileId: string; stars: number; tags: string[]; givenAt: number };

export function getScoresGiven(): ScoreGiven[] {
  try { return JSON.parse(localStorage.getItem("ghost_scores_given") || "[]"); } catch { return []; }
}
export function saveGhostRating(targetId: string, stars: number, tags: string[]): void {
  const all = getScoresGiven().filter(s => s.targetProfileId !== targetId);
  try { localStorage.setItem("ghost_scores_given", JSON.stringify([{ targetProfileId: targetId, stars, tags, givenAt: Date.now() }, ...all])); } catch {}
}
export function hasRatedProfile(profileId: string): boolean {
  return getScoresGiven().some(s => s.targetProfileId === profileId);
}

// Deterministic 3.0–5.0 score for any profile
export function getProfileScore(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(37, h) + id.charCodeAt(i) | 0;
  return 3.0 + (Math.abs(h) % 21) / 10; // 3.0 – 5.0
}

// ── The Whisper ───────────────────────────────────────────────────────────────
const WHISPER_AT_KEY = "ghost_whisper_sent_at";
const WHISPER_TARGET_KEY = "ghost_whisper_target_id";
const WHISPERS_RECEIVED_KEY = "ghost_whispers_received";

export type WhisperReceived = { id: string; message: string; receivedAt: number };

export function getWhisperSentAt(): number {
  try { return Number(localStorage.getItem(WHISPER_AT_KEY) || "0"); } catch { return 0; }
}
export function canSendWhisper(): boolean {
  return Date.now() - getWhisperSentAt() > 7 * 24 * 60 * 60 * 1000;
}
export function whisperCooldownDays(): number {
  const diff = 7 * 24 * 60 * 60 * 1000 - (Date.now() - getWhisperSentAt());
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}
export function saveWhisperSent(targetId: string): void {
  try {
    localStorage.setItem(WHISPER_AT_KEY, String(Date.now()));
    localStorage.setItem(WHISPER_TARGET_KEY, targetId);
  } catch {}
}
export function getWhispersReceived(): WhisperReceived[] {
  try { return JSON.parse(localStorage.getItem(WHISPERS_RECEIVED_KEY) || "[]"); } catch { return []; }
}

// 40% deterministic conversion chance per profile
export function whisperWillConvert(profileId: string): boolean {
  let h = 0;
  for (let i = 0; i < profileId.length; i++) h = Math.imul(43, h) + profileId.charCodeAt(i) | 0;
  return Math.abs(h) % 10 < 4;
}

// ── Floor Wars ────────────────────────────────────────────────────────────────
const WARS_WEEK_KEY    = "ghost_floor_wars_week";
const WARS_GIFTS_KEY   = "ghost_floor_wars_gifts";
const WARS_CLAIMED_KEY = "ghost_floor_wars_claimed";

export function getCurrentISOWeek(): string {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - day);
  const y = d.getFullYear();
  const startOfYear = new Date(y, 0, 1);
  const wk = Math.ceil((((d.getTime() - startOfYear.getTime()) / 86400000) + 1) / 7);
  return `${y}-W${String(wk).padStart(2, "0")}`;
}

export function getFloorGiftsThisWeek(): Record<string, number> {
  try {
    const stored = localStorage.getItem(WARS_GIFTS_KEY);
    if (!stored) return {};
    const week = localStorage.getItem(WARS_WEEK_KEY);
    if (week !== getCurrentISOWeek()) {
      localStorage.setItem(WARS_WEEK_KEY, getCurrentISOWeek());
      localStorage.removeItem(WARS_GIFTS_KEY);
      localStorage.removeItem(WARS_CLAIMED_KEY);
      return {};
    }
    return JSON.parse(stored);
  } catch { return {}; }
}
export function incrementFloorGift(floor: string): void {
  const week = getCurrentISOWeek();
  try {
    const storedWeek = localStorage.getItem(WARS_WEEK_KEY);
    if (storedWeek !== week) {
      localStorage.setItem(WARS_WEEK_KEY, week);
      localStorage.setItem(WARS_GIFTS_KEY, JSON.stringify({ [floor]: 1 }));
      localStorage.setItem(WARS_CLAIMED_KEY, "false");
      return;
    }
    const gifts = getFloorGiftsThisWeek();
    gifts[floor] = (gifts[floor] || 0) + 1;
    localStorage.setItem(WARS_GIFTS_KEY, JSON.stringify(gifts));
  } catch {}
}
export function hasClaimedWarsBonus(): boolean {
  try { return localStorage.getItem(WARS_CLAIMED_KEY) === "true"; } catch { return false; }
}
export function claimWarsBonus(): void {
  writeCoins(readCoins() + 25);
  try { localStorage.setItem(WARS_CLAIMED_KEY, "true"); } catch {}
}

// Seeded base gift count per floor per week (so there's always existing activity)
export function seededFloorGifts(floor: string, week: string): number {
  let h = 0;
  const s = floor + week;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  const bases: Record<string, number> = { standard: 180, suite: 120, kings: 95, penthouse: 60, cellar: 45, garden: 55 };
  const base = bases[floor] ?? 80;
  return base + (Math.abs(h) % 80);
}

// ── Date Concierge ────────────────────────────────────────────────────────────
const CONCIERGE_KEY = "ghost_concierge_shown";
export function getConciergeShown(): string[] {
  try { return JSON.parse(localStorage.getItem(CONCIERGE_KEY) || "[]"); } catch { return []; }
}
export function markConciergeShown(matchId: string): void {
  const all = getConciergeShown();
  if (!all.includes(matchId)) {
    try { localStorage.setItem(CONCIERGE_KEY, JSON.stringify([...all, matchId])); } catch {}
  }
}
export function getDaysConnected(matchedAt: number): number {
  return Math.floor((Date.now() - matchedAt) / (24 * 60 * 60 * 1000));
}

// ── Video Intro ───────────────────────────────────────────────────────────────
const VIDEO_KEY         = "ghost_video_intro_url";
const VIDEO_PRIVATE_KEY = "ghost_video_intro_private";
const VIDEO_REQ_SENT    = "ghost_video_requests_sent";
const VIDEO_REQ_RECV    = "ghost_video_requests_received";

export type VideoRequest = {
  id: string; fromGhostId: string; toProfileId: string;
  status: "pending" | "approved" | "denied"; requestedAt: number; coinsSpent: number;
};

export function hasVideoIntro(): boolean {
  try { return !!localStorage.getItem(VIDEO_KEY); } catch { return false; }
}
export function getVideoIntroUrl(): string | null {
  try { return localStorage.getItem(VIDEO_KEY); } catch { return null; }
}
export function setVideoIntroUrl(url: string): void {
  try { localStorage.setItem(VIDEO_KEY, url); } catch {}
}
export function isVideoPrivate(): boolean {
  try { return localStorage.getItem(VIDEO_PRIVATE_KEY) !== "false"; } catch { return true; }
}
export function setVideoPrivate(v: boolean): void {
  try { localStorage.setItem(VIDEO_PRIVATE_KEY, v ? "true" : "false"); } catch {}
}
export function getVideoRequestsSent(): VideoRequest[] {
  try { return JSON.parse(localStorage.getItem(VIDEO_REQ_SENT) || "[]"); } catch { return []; }
}
export function getVideoRequestsReceived(): VideoRequest[] {
  try { return JSON.parse(localStorage.getItem(VIDEO_REQ_RECV) || "[]"); } catch { return []; }
}
export function sendVideoRequest(toProfileId: string, ghostId: string): boolean {
  if (!spendCoins(5)) return false;
  const req: VideoRequest = {
    id: `vr-${Date.now()}`, fromGhostId: ghostId, toProfileId,
    status: "pending", requestedAt: Date.now(), coinsSpent: 5,
  };
  const all = getVideoRequestsSent().filter(r => r.toProfileId !== toProfileId);
  try { localStorage.setItem(VIDEO_REQ_SENT, JSON.stringify([req, ...all])); } catch {}
  return true;
}
export function getVideoRequestStatus(profileId: string): VideoRequest | null {
  return getVideoRequestsSent().find(r => r.toProfileId === profileId) ?? null;
}
// ~20% of profiles have a video intro
export function profileHasVideo(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(71, h) + id.charCodeAt(i) | 0;
  return Math.abs(h) % 5 === 0;
}
