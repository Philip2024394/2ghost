// ── Ghost Room — pure utility functions and constants ─────────────────────────

import type { GhostMatch, InboxItem, RoomTier, ShareAccessType } from "./ghostRoomTypes";
import { VAULT_EXPIRY_MS } from "./ghostRoomTypes";

const SESSION_KEY   = "ghost_room_session_until";
const SESSION_TTL   = 24 * 60 * 60 * 1000; // 24 hours
const ROOM_SUB_KEY  = "ghost_room_sub_until";

export function hasRoomSub(): boolean {
  try { return Number(localStorage.getItem(ROOM_SUB_KEY) || 0) > Date.now(); } catch { return false; }
}
export function activateRoomSub() {
  try { localStorage.setItem(ROOM_SUB_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000)); } catch {}
}

export function isSessionValid(): boolean {
  try { return Number(localStorage.getItem(SESSION_KEY) || 0) > Date.now(); } catch { return false; }
}
export function startSession() {
  try { localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_TTL)); } catch {}
}
export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

// ── Mock OTP sender — replace with real WhatsApp API call in production ───────
export function mockSendOtp(phone: string): string {
  // In production: POST /api/ghost-room/send-otp { phone }
  // For dev: deterministic 6-digit code from phone number
  let h = 0;
  const seed = phone + String(Math.floor(Date.now() / 60000)); // changes every minute
  for (let i = 0; i < seed.length; i++) { h = Math.imul(31, h) + seed.charCodeAt(i) | 0; }
  return String(100000 + Math.abs(h) % 900000);
}

// ── Vault Auth Gate — 3-attempt lockout + email security alert ───────────────
export const VAULT_PIN_ATTEMPTS_KEY = "ghost_vault_pin_attempts";
export const VAULT_PW_ATTEMPTS_KEY  = "ghost_vault_pw_attempts";
export const VAULT_LOCKED_KEY       = "ghost_vault_locked";
export const VAULT_ALERT_KEY        = "ghost_vault_alert_sent";
export const MAX_VAULT_ATTEMPTS     = 3;

export function sendVaultSecurityAlert(email: string) {
  const time = new Date().toLocaleString();
  // Production: POST /api/vault/security-alert { email, timestamp }
  console.warn(`[Room Vault Security] Unauthorised access attempt → ${email} at ${time}`);
  try {
    localStorage.setItem(VAULT_ALERT_KEY, "true");
    localStorage.setItem("ghost_vault_alert_time", time);
  } catch {}
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration); };
    v.onerror = () => resolve(0);
    v.src = URL.createObjectURL(file);
  });
}

// ── Storage helpers ───────────────────────────────────────────────────────────
export const KEYS = {
  code:       "ghost_room_code",
  images:     "ghost_room_images",
  videoUrls:  "ghost_room_video_urls",
  requests:   "ghost_room_requests",
  granted:    "ghost_room_granted",
  accessed:   "ghost_room_accessed",
  expiry:     "ghost_room_expiry",
  tier:       "ghost_room_tier",
  imgShare:   "ghost_room_share_img_code",
  vidShare:   "ghost_room_share_vid_code",
  bothShare:  "ghost_room_share_both_code",
};

// Helper to publish a share grant so another user can look it up by code
export function publishShareGrant(code: string, ownerGhostId: string, accessType: ShareAccessType, images: string[], videoUrls: string[]) {
  try {
    localStorage.setItem(`ghost_room_share_${code}`, JSON.stringify({
      ownerGhostId, accessType,
      images: accessType !== "video" ? images : [],
      videoUrls: accessType !== "image" ? videoUrls : [],
      createdAt: Date.now(),
    }));
  } catch {}
}

export function genCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function getMyGhostId(): string {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    if (p.name) {
      let h = 0;
      const id = p.name + p.age + p.city;
      for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
      return `Guest-${1000 + Math.abs(h) % 9000}`;
    }
  } catch {}
  return "Guest-????";
}

export function loadJson<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

export function saveJson(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function readCoins(): number { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } }
export function writeCoins(n: number) { try { localStorage.setItem("ghost_coins", String(Math.max(0, n))); } catch {} }

// ── Vault feature coin costs ──────────────────────────────────────────────────
export const VAULT_COSTS = {
  imageUpload:  50,   // per image after FREE_IMAGES free uploads
  videoUpload:  150,  // per video after FREE_VIDEOS free uploads
  voiceNote:    30,   // per voice note recording
  fileUpload:   75,   // per file uploaded
  memoryNote:   15,   // per memory note saved
  sharedVault:  200,  // one-time shared vault post
  chatMessage:  5,    // per vault chat message sent
} as const;
export const FREE_IMAGES = 3;
export const FREE_VIDEOS = 1;

export function loadMatches(): GhostMatch[] {
  try {
    const raw = localStorage.getItem("ghost_matches");
    if (!raw) return [];
    const all: GhostMatch[] = JSON.parse(raw);
    const EXPIRY = 48 * 60 * 60 * 1000;
    return all.filter((m) => Date.now() - m.matchedAt < EXPIRY);
  } catch { return []; }
}

export function fmtAgo(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export function inboxKey(ghostId: string) { return `ghost_room_inbox_${ghostId}`; }
export function loadInbox(ghostId: string): InboxItem[] { return loadJson(inboxKey(ghostId), []); }
export function saveInbox(ghostId: string, items: InboxItem[]) { saveJson(inboxKey(ghostId), items); }

// Returns days remaining for a free-tier user, null if Gold (no expiry)
export function getItemDaysLeft(item: InboxItem, tier: RoomTier): number | null {
  if (tier === "gold") return null;
  const from = item.acceptedAt || item.sentAt;
  const msLeft = (from + VAULT_EXPIRY_MS) - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}
