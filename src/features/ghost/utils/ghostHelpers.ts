// ── Ghost utility / helper functions ─────────────────────────────────────────
import {
  GhostMatch,
  MATCH_EXPIRY_MS,
  INTL_GHOST_KEY,
  INTL_GHOST_COUNTRIES_KEY,
} from "../types/ghostTypes";

export function loadMatches(): GhostMatch[] {
  try {
    const raw = localStorage.getItem("ghost_matches");
    if (!raw) return [];
    const all: GhostMatch[] = JSON.parse(raw);
    return all.filter((m) => Date.now() - m.matchedAt < MATCH_EXPIRY_MS);
  } catch { return []; }
}

export function persistMatches(matches: GhostMatch[]) {
  try { localStorage.setItem("ghost_matches", JSON.stringify(matches)); } catch {}
}

export function matchCountdown(matchedAt: number): string {
  const remaining = matchedAt + MATCH_EXPIRY_MS - Date.now();
  if (remaining <= 0) return "Expired";
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

// Deterministic "hours since active" from profile id (0–28h range)
export function activeHoursAgo(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
  return Math.abs(h) % 29; // ~83% within 24h
}

// Ghost Rooms tier — deterministic from profile id
// ~5% Gold Room (elite), ~12% Ghost Suite (member)
export function profileHouseTier(id: string): "gold" | "suite" | null {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(53, h) + id.charCodeAt(i) | 0; }
  const n = Math.abs(h) % 100;
  if (n < 5)  return "gold";
  if (n < 17) return "suite";
  return null;
}

// Midnight timestamp for tonight mode expiry
export function tonightMidnight(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

// ~30% of profiles deterministically show "Tonight" available
export function isProfileTonight(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(47, h) + id.charCodeAt(i) | 0; }
  return Math.abs(h) % 10 < 3;
}

// ~20% of profiles are in Flash pool at any given time
export function isFlashProfile(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(59, h) + id.charCodeAt(i) | 0; }
  return Math.abs(h) % 5 === 0;
}

// MM:SS countdown for Flash window
export function fmtFlashTime(until: number): string {
  const ms = Math.max(0, until - Date.now());
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Format remaining time
export function fmtRemaining(until: number): string {
  const ms = until - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Flag / Report helpers ────────────────────────────────────────────────────
export function getFlaggedProfiles(): Record<string, { reason: string; at: number }> {
  try { return JSON.parse(localStorage.getItem("ghost_flagged_profiles") || "{}"); } catch { return {}; }
}

export function saveFlaggedProfiles(obj: Record<string, { reason: string; at: number }>) {
  try { localStorage.setItem("ghost_flagged_profiles", JSON.stringify(obj)); } catch {}
}

// ── International Ghost ───────────────────────────────────────────────────────
export function hasIntlGhost(): boolean {
  try { return Number(localStorage.getItem(INTL_GHOST_KEY) || 0) > Date.now(); } catch { return false; }
}

export function activateIntlGhost() {
  try { localStorage.setItem(INTL_GHOST_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000)); } catch {}
}

export function getIntlCountries(): string[] {
  try { return JSON.parse(localStorage.getItem(INTL_GHOST_COUNTRIES_KEY) || "[]"); } catch { return []; }
}

export function saveIntlCountries(codes: string[]) {
  try { localStorage.setItem(INTL_GHOST_COUNTRIES_KEY, JSON.stringify(codes)); } catch {}
}

// ── Haversine distance (km) ─────────────────────────────────────────────────
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Deterministic reveal data from profile id
export function profileLikesCount(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(37, h) + id.charCodeAt(i) | 0; }
  return 5 + Math.abs(h) % 196; // 5–200
}

export function profileActivity(id: string): { label: string; pct: number; color: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(41, h) + id.charCodeAt(i) | 0; }
  const lvl = Math.abs(h) % 4;
  return [
    { label: "Rarely",    pct: 18,  color: "#6b7280" },
    { label: "Sometimes", pct: 45,  color: "#f59e0b" },
    { label: "Often",     pct: 72,  color: "#22c55e" },
    { label: "Daily",     pct: 95,  color: "#4ade80" },
  ][lvl];
}

// Deterministic Ghost-XXXX code from profile id — same id always same code
export function toGhostId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
  return `Guest-${1000 + Math.abs(h) % 9000}`;
}

export function fmtKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// ── Interest / gender preference filter ──────────────────────────────────────

/**
 * Returns the gender the current user wants to see, based on ghost_interest.
 * "Women" → "Female", "Men" → "Male", "Both" / "" / null → null (show all).
 */
export function getWantedGender(): "Female" | "Male" | null {
  try {
    const interest = localStorage.getItem("ghost_interest");
    if (interest === "Women") return "Female";
    if (interest === "Men")   return "Male";
    return null; // "Both" or not set — show everyone
  } catch { return null; }
}

/**
 * Lounge variant — returns "f" | "m" | null.
 */
export function getWantedGenderLounge(): "f" | "m" | null {
  const g = getWantedGender();
  if (g === "Female") return "f";
  if (g === "Male")   return "m";
  return null;
}

// ── Staff placeholder images (shown when user has no uploaded photo) ──────────
export const STAFF_IMG_FEMALE = "https://ik.imagekit.io/7grri5v7d/Untitledasdasdasdasdasdsdfsdf.png";
export const STAFF_IMG_MALE   = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasd.png";

/** Returns the staff placeholder image for a given gender, or null if male placeholder not set */
export function getStaffPlaceholder(gender: string): string | null {
  if (gender === "Female") return STAFF_IMG_FEMALE;
  return STAFF_IMG_MALE || null;
}

// ~65% of mock profiles are verified (deterministic by id)
export function profileIsVerified(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(17, h) + id.charCodeAt(i) | 0; }
  return Math.abs(h) % 100 < 65;
}

// ── Mock one-line bios (deterministic per profile id) ────────────────────────
export const MOCK_BIOS = [
  "Here for a real conversation, not a highlight reel.",
  "Quiet person looking for someone louder than me.",
  "Cafés, late nights, and zero small talk.",
  "Still figuring it out — maybe you can help.",
  "Serious about the right person. Casual about everything else.",
  "I'll tell you my name when it feels right.",
  "Looking for someone to get lost with.",
  "Bad at bios. Good at showing up.",
  "Not here to swipe. Here to actually meet.",
  "More interesting in person than on paper.",
  "Fluent in silence and sarcasm.",
  "Tired of apps. Giving this one last try.",
  "Looking for low drama, high chemistry.",
  "Let's skip the small talk — ask me anything.",
  "Simple life. Deep conversations.",
  "I make good coffee. That's a start.",
  "Looking for my person, not my audience.",
  "Will match, then probably overthink it.",
];

export function mockBio(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(61, h) + id.charCodeAt(i) | 0; }
  return MOCK_BIOS[Math.abs(h) % MOCK_BIOS.length];
}

export function fmtCountdown(ms: number): string {
  if (ms <= 0) return "0m";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
