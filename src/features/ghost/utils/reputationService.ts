// ── Guest Reputation Service ──────────────────────────────────────────────────
// Tracks show-ups and no-shows for each profile.
// Stored in localStorage per profile ID.
// Badges are computed from the show rate and displayed on profile popups.

const REP_KEY = (id: string) => `ghost_rep_${id}`;

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
