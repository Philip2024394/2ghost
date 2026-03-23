// ── Breakfast Invite Service ───────────────────────────────────────────────────
import type { BreakfastGift } from "./breakfastGiftService";

export type InviteStatus = "pending" | "accepted" | "declined" | "expired";

export type BreakfastInvite = {
  id:            string;
  fromUserId:    string;
  fromUserName:  string;
  fromFloor:     string;
  toUserId:      string;
  toUserName:    string;
  toAvatar:      string;   // avatar seed number as string
  sentAt:        number;
  expiresAt:     number;   // sentAt + 6 hours
  status:        InviteStatus;
  selectedGifts: BreakfastGift[];  // kept private — revealed in chat
  declineReason?: string;
  // Host profile fields (shown to guest on invite)
  fromAvatar?:      string;  // dicebear seed
  fromPhoto?:       string;  // real photo URL if available
  fromAge?:         number;
  fromCity?:        string;
  fromCountryFlag?: string;
  // Timezone coordination
  proposedTime?:    number; // epoch ms of proposed breakfast time (today)
  senderTimezone?:  string; // IANA timezone e.g. "Asia/Jakarta"
  missedAt?:        number; // set when the proposed time passed without chat starting
};

export const INVITE_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours

const SENT_KEY     = "ghost_breakfast_invite_sent";
const RECEIVED_KEY = "ghost_breakfast_invite_received";
const FIRST_KEY    = (floor: string) => `ghost_floor_first_entry_${floor}`;

// ── Coin costs per floor ───────────────────────────────────────────────────────
export const MSG_COST: Record<string, number> = {
  standard: 1, suite: 1, kings: 2, penthouse: 2, loft: 1, cellar: 2,
};
export const PORTER_TIP: Record<string, number> = {
  standard: 3, suite: 5, kings: 8, penthouse: 10, loft: 5, cellar: 7,
};
export const CHAT_WINDOW_DAILY = 1; // coins/day, all floors

// ── First room entry ──────────────────────────────────────────────────────────
export function isFirstEntry(floor: string): boolean {
  try { return !localStorage.getItem(FIRST_KEY(floor)); } catch { return false; }
}
export function markFirstEntry(floor: string): void {
  try { localStorage.setItem(FIRST_KEY(floor), "1"); } catch {}
}

// ── Sent invite (user is the host) ────────────────────────────────────────────
export function getSentInvite(): BreakfastInvite | null {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    if (!raw) return null;
    const inv: BreakfastInvite = JSON.parse(raw);
    // Auto-expire
    if (Date.now() > inv.expiresAt && inv.status === "pending") {
      inv.status = "expired";
      localStorage.setItem(SENT_KEY, JSON.stringify(inv));
    }
    return inv;
  } catch { return null; }
}

// ── Timezone helpers ──────────────────────────────────────────────────────────

/** Format epoch ms in a given IANA timezone → "8:30 AM" */
export function formatInTimezone(epochMs: number, tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true,
    }).format(new Date(epochMs));
  } catch { return "—"; }
}

/** Short timezone label e.g. "WIB", "ICT", "SGT" */
export function tzShortLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, timeZoneName: "short",
    }).formatToParts(new Date());
    return parts.find(p => p.type === "timeZoneName")?.value ?? tz;
  } catch { return tz; }
}

/** City portion of IANA timezone e.g. "Asia/Jakarta" → "Jakarta" */
export function tzCity(tz: string): string {
  return tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
}

/** Detect user's local IANA timezone */
export function getLocalTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
}

/**
 * Build epoch ms for a proposed time today in the local timezone.
 * hhmm = "08:30"
 */
export function buildProposedTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  const now = new Date();
  now.setHours(h, m, 0, 0);
  return now.getTime();
}

// ── Missed breakfast check ─────────────────────────────────────────────────────

const MISS_GRACE_MS = 15 * 60 * 1000; // 15 min grace after proposed time

export function isBreakfastMissed(invite: BreakfastInvite): boolean {
  if (!invite.proposedTime) return false;
  if (invite.status !== "accepted") return false;
  if (invite.missedAt) return true;
  return Date.now() > invite.proposedTime + MISS_GRACE_MS;
}

export function markBreakfastMissed(): void {
  try {
    const raw = localStorage.getItem(RECEIVED_KEY);
    if (!raw) return;
    const inv: BreakfastInvite = JSON.parse(raw);
    if (!inv.missedAt) {
      inv.missedAt = Date.now();
      localStorage.setItem(RECEIVED_KEY, JSON.stringify(inv));
      localStorage.setItem(SENT_KEY, JSON.stringify(inv));
    }
  } catch {}
}

// ── Butler excuses for no-show ─────────────────────────────────────────────────

export const BUTLER_NOSHOW_EXCUSES = [
  "They appear to have overslept — a morning light too gentle to resist, perhaps.",
  "A sudden craving for room service may have held them up. It happens to the best.",
  "The sunrise from their room was exceptional this morning — they may have lost track of time.",
  "I believe their alarm and they had a disagreement. These things happen.",
  "A warm pillow and a cool morning — I suspect they'll surface by noon.",
  "They may have started breakfast without us. Some ghosts prefer solitude at dawn.",
];

export function getRandomExcuse(): string {
  return BUTLER_NOSHOW_EXCUSES[Math.floor(Math.random() * BUTLER_NOSHOW_EXCUSES.length)];
}

export function sendInvite(invite: Omit<BreakfastInvite, "id" | "sentAt" | "expiresAt" | "status">): BreakfastInvite {
  const full: BreakfastInvite = {
    ...invite,
    id:        `binv-${Date.now()}`,
    sentAt:    Date.now(),
    expiresAt: Date.now() + INVITE_EXPIRY_MS,
    status:    "pending",
  };
  localStorage.setItem(SENT_KEY, JSON.stringify(full));
  // Simulate: also place as received for the other user (same device demo)
  localStorage.setItem(RECEIVED_KEY, JSON.stringify(full));
  return full;
}

export function clearSentInvite(): void {
  try { localStorage.removeItem(SENT_KEY); } catch {}
}

// ── Received invite (user is the guest) ───────────────────────────────────────
export function getReceivedInvite(): BreakfastInvite | null {
  try {
    const raw = localStorage.getItem(RECEIVED_KEY);
    if (!raw) return null;
    const inv: BreakfastInvite = JSON.parse(raw);
    if (Date.now() > inv.expiresAt && inv.status === "pending") {
      inv.status = "expired";
      localStorage.setItem(RECEIVED_KEY, JSON.stringify(inv));
    }
    return inv;
  } catch { return null; }
}

export function acceptInvite(): void {
  try {
    const inv = getReceivedInvite();
    if (!inv) return;
    inv.status = "accepted";
    localStorage.setItem(RECEIVED_KEY, JSON.stringify(inv));
    localStorage.setItem(SENT_KEY, JSON.stringify(inv));
  } catch {}
}

export function declineInvite(reason: string): void {
  try {
    const inv = getReceivedInvite();
    if (!inv) return;
    inv.status = "declined";
    inv.declineReason = reason;
    localStorage.setItem(RECEIVED_KEY, JSON.stringify(inv));
    localStorage.setItem(SENT_KEY, JSON.stringify(inv));
  } catch {}
}

export function clearReceivedInvite(): void {
  try { localStorage.removeItem(RECEIVED_KEY); } catch {}
}

// ── Decline excuses ───────────────────────────────────────────────────────────
export const DECLINE_REASONS = [
  "Sorry, I'd like to sleep in a little 😴",
  "Not feeling my best this morning 🤒",
  "I have an early hike planned 🥾",
  "Got a work call first thing ☕",
  "Maybe another time — enjoy! 🌅",
  "I have a prior commitment 🗓️",
];

// ── Time remaining ─────────────────────────────────────────────────────────────
export function timeRemainingLabel(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}
