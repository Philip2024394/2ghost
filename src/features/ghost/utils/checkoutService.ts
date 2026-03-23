// ── Hotel Checkout Service ────────────────────────────────────────────────────
// Collects hotel stay stats and manages checkout / calling-card state.

export interface HotelStayStats {
  joinedAt: number;          // timestamp (ms) when user first registered
  floorsVisited: string[];   // e.g. ["suite","loft","cellar"]
  matchCount: number;
  breakfastInvitesSent: number;
  breakfastInvitesAccepted: number;
  ratingsGiven: number;
  socialInvitesSent: number;
}

export interface CallingCard {
  type: "text" | "voice";
  content: string;           // text message or voice note URL
  createdAt: number;
  expiresAt: number;         // createdAt + 30 days
  active: boolean;
}

export interface CheckoutState {
  checkedOut: boolean;
  checkoutAt: number;
  path: "with_match" | "without_match";
  callingCard?: CallingCard;
  hibernating: boolean;
  returnRoomHeld: boolean;
  returnNotifyAt?: number;   // 30 days after checkout for return nudge
}

const KEY_JOINED   = "ghost_joined_at";
const KEY_FLOORS   = "ghost_floors_visited";
const KEY_CHECKOUT = "ghost_checkout_state";
const KEY_CARD     = "ghost_calling_card";
const KEY_HIBERNATE = "ghost_hibernate";

// ── Join date ─────────────────────────────────────────────────────────────────

export function ensureJoinDate(): void {
  if (!localStorage.getItem(KEY_JOINED)) {
    localStorage.setItem(KEY_JOINED, String(Date.now()));
  }
}

export function getJoinDate(): number {
  const v = localStorage.getItem(KEY_JOINED);
  return v ? parseInt(v, 10) : Date.now();
}

// ── Floor visit tracking ──────────────────────────────────────────────────────

export function markFloorVisited(floor: string): void {
  const current = getVisitedFloors();
  if (!current.includes(floor)) {
    current.push(floor);
    localStorage.setItem(KEY_FLOORS, JSON.stringify(current));
  }
}

export function getVisitedFloors(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY_FLOORS) ?? "[]"); } catch { return []; }
}

// ── Stay stats ────────────────────────────────────────────────────────────────

export function getStayStats(): HotelStayStats {
  const floorsVisited = getVisitedFloors();

  // Matches
  let matchCount = 0;
  try {
    const raw = localStorage.getItem("ghost_my_matches") ?? localStorage.getItem("ghost_matches");
    if (raw) matchCount = (JSON.parse(raw) as unknown[]).length;
  } catch {}

  // Breakfast invites
  let breakfastInvitesSent = 0;
  let breakfastInvitesAccepted = 0;
  try {
    const raw = localStorage.getItem("ghost_breakfast_invite_sent");
    if (raw) {
      const inv = JSON.parse(raw);
      if (inv) {
        breakfastInvitesSent = 1;
        if (inv.status === "accepted") breakfastInvitesAccepted = 1;
      }
    }
  } catch {}

  // Ratings
  let ratingsGiven = 0;
  try {
    const raw = localStorage.getItem("ghost_breakfast_ratings");
    if (raw) ratingsGiven = (JSON.parse(raw) as unknown[]).length;
  } catch {}

  // Social invites
  let socialInvitesSent = 0;
  try {
    const raw = localStorage.getItem("ghost_social_invite_sent");
    if (raw && JSON.parse(raw)) socialInvitesSent = 1;
  } catch {}

  return {
    joinedAt: getJoinDate(),
    floorsVisited,
    matchCount,
    breakfastInvitesSent,
    breakfastInvitesAccepted,
    ratingsGiven,
    socialInvitesSent,
  };
}

// ── Checkout state ────────────────────────────────────────────────────────────

export function getCheckoutState(): CheckoutState | null {
  try {
    const raw = localStorage.getItem(KEY_CHECKOUT);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveCheckoutState(state: CheckoutState): void {
  localStorage.setItem(KEY_CHECKOUT, JSON.stringify(state));
}

export function performCheckout(path: "with_match" | "without_match"): CheckoutState {
  const state: CheckoutState = {
    checkedOut: true,
    checkoutAt: Date.now(),
    path,
    hibernating: path === "without_match",
    returnRoomHeld: path === "without_match",
    returnNotifyAt: path === "without_match" ? Date.now() + 30 * 24 * 60 * 60 * 1000 : undefined,
  };
  saveCheckoutState(state);
  if (path === "without_match") {
    localStorage.setItem(KEY_HIBERNATE, "1");
  }
  return state;
}

export function isHibernating(): boolean {
  return localStorage.getItem(KEY_HIBERNATE) === "1";
}

export function wakeFromHibernation(): void {
  localStorage.removeItem(KEY_HIBERNATE);
  const state = getCheckoutState();
  if (state) {
    saveCheckoutState({ ...state, checkedOut: false, hibernating: false });
  }
}

// ── Calling card ──────────────────────────────────────────────────────────────

export function saveCallingCard(type: "text" | "voice", content: string): CallingCard {
  const card: CallingCard = {
    type,
    content,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    active: true,
  };
  localStorage.setItem(KEY_CARD, JSON.stringify(card));
  return card;
}

export function getCallingCard(): CallingCard | null {
  try {
    const raw = localStorage.getItem(KEY_CARD);
    if (!raw) return null;
    const card: CallingCard = JSON.parse(raw);
    // Auto-expire
    if (Date.now() > card.expiresAt) {
      localStorage.removeItem(KEY_CARD);
      return null;
    }
    return card;
  } catch { return null; }
}

export function deleteCallingCard(): void {
  localStorage.removeItem(KEY_CARD);
}

// ── Format helpers ────────────────────────────────────────────────────────────

export function formatStayDuration(joinedAt: number): string {
  const ms = Date.now() - joinedAt;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return "Less than a day";
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  const weeks = Math.floor(days / 7);
  const rem = days % 7;
  if (rem === 0) return weeks === 1 ? "1 week" : `${weeks} weeks`;
  return `${weeks}w ${rem}d`;
}

export const FLOOR_DISPLAY_NAMES: Record<string, string> = {
  standard: "The Standard",
  suite: "The Suite",
  kings: "The Kings Room",
  penthouse: "Penthouse",
  loft: "The Loft",
  cellar: "The Cellar",
};
