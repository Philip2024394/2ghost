// ── Guest Reputation Service ──────────────────────────────────────────────────
// Tracks show-ups, no-shows, billing, and coin debt per profile.

const REP_KEY  = (id: string) => `ghost_rep_${id}`;
const DEBT_KEY = "ghost_coins_debt";

// ── Breakfast no-show bill per floor ─────────────────────────────────────────
// Billed for TWO covers — the table was reserved for both guests
export const BREAKFAST_BILL: Record<string, number> = {
  standard:  20,
  loft:      30,
  suite:     36,
  kings:     44,
  penthouse: 60,
  cellar:    40,
};

// ── Debt functions (current user's own debt) ──────────────────────────────────
export function getDebt(): number {
  try { return Math.max(0, Number(localStorage.getItem(DEBT_KEY) || "0")); } catch { return 0; }
}

export function hasDebt(): boolean { return getDebt() > 0; }

/** Deduct the bill from the current user's coins. Overflow goes to red debt. */
export function billCurrentUser(floor: string): number {
  const amount  = BREAKFAST_BILL[floor] ?? 10;
  try {
    const coins = Math.max(0, Number(localStorage.getItem("ghost_coins") || "0"));
    const remaining = coins - amount;
    if (remaining >= 0) {
      localStorage.setItem("ghost_coins", String(remaining));
    } else {
      localStorage.setItem("ghost_coins", "0");
      const prevDebt = getDebt();
      localStorage.setItem(DEBT_KEY, String(prevDebt + Math.abs(remaining)));
    }
  } catch {}
  return amount;
}

/** Pay off debt with coins — used when user tops up. */
export function settleDebt(coinsAvailable: number): { paid: number; remaining: number } {
  const debt = getDebt();
  if (debt === 0) return { paid: 0, remaining: coinsAvailable };
  const paid = Math.min(debt, coinsAvailable);
  const newDebt = debt - paid;
  try { localStorage.setItem(DEBT_KEY, String(newDebt)); } catch {}
  return { paid, remaining: coinsAvailable - paid };
}

export type Reputation = {
  showUps:  number;
  noShows:  number;
};

export type ReputationBadge = "reliable" | "caution" | "flagged" | null;

export function getReputation(profileId: string): Reputation {
  try {
    const raw = localStorage.getItem(REP_KEY(profileId));
    if (!raw) return { showUps: 0, noShows: 0 };
    return JSON.parse(raw) as Reputation;
  } catch { return { showUps: 0, noShows: 0 }; }
}

export function recordShowUp(profileId: string): void {
  try {
    const rep = getReputation(profileId);
    rep.showUps += 1;
    localStorage.setItem(REP_KEY(profileId), JSON.stringify(rep));
  } catch {}
}

export function recordNoShow(profileId: string): void {
  try {
    const rep = getReputation(profileId);
    rep.noShows += 1;
    localStorage.setItem(REP_KEY(profileId), JSON.stringify(rep));
  } catch {}
}

export function getShowRate(rep: Reputation): number {
  const total = rep.showUps + rep.noShows;
  if (total === 0) return 100;
  return Math.round((rep.showUps / total) * 100);
}

/** Returns a badge only when there are at least 2 interactions on record. */
export function getReputationBadge(rep: Reputation): ReputationBadge {
  const total = rep.showUps + rep.noShows;
  if (total < 2) return null;
  const rate = getShowRate(rep);
  if (rate >= 90) return "reliable";
  if (rate >= 60) return null;
  if (rate >= 40) return "caution";
  return "flagged";
}

export const BADGE_META: Record<NonNullable<ReputationBadge>, {
  label: string; icon: string; color: string; bg: string; border: string;
}> = {
  reliable: {
    label: "Reliable Guest",
    icon:  "🎖️",
    color: "#facc15",
    bg:    "rgba(250,204,21,0.1)",
    border:"rgba(250,204,21,0.3)",
  },
  caution: {
    label: "Caution",
    icon:  "⚠️",
    color: "#fb923c",
    bg:    "rgba(251,146,60,0.1)",
    border:"rgba(251,146,60,0.35)",
  },
  flagged: {
    label: "Unreliable Guest",
    icon:  "🚫",
    color: "#f87171",
    bg:    "rgba(248,113,113,0.1)",
    border:"rgba(248,113,113,0.35)",
  },
};
