/**
 * matchScore.ts — Proprietary Ghost Match Compatibility Algorithm
 *
 * Produces a score 0–100 for each profile relative to the current user.
 * Higher score = shown earlier in the feed.
 *
 * Scoring breakdown (total 100 pts):
 *  - Distance proximity       0–20
 *  - Activity recency         0–20
 *  - Shared interests         0–20
 *  - Profile completeness     0–15
 *  - Age compatibility        0–10
 *  - Mutual like bonus        10 (flat)
 *  - Verified bonus            5
 */

import type { GhostProfile } from "../types/ghostTypes";

export interface UserPreferences {
  ageMin: number;
  ageMax: number;
  interests: string[];       // current user's interests
  age: number;               // current user's age
  likedIds: Set<string>;     // profiles current user has liked
  inboundLikeIds: Set<string>; // profiles that have liked the current user
}

// ── Distance score (0–20) ────────────────────────────────────────────────────
function distanceScore(km: number | undefined): number {
  if (km === undefined) return 8; // unknown → neutral mid-score
  if (km < 5)   return 20;
  if (km < 15)  return 18;
  if (km < 30)  return 15;
  if (km < 60)  return 12;
  if (km < 150) return 9;
  if (km < 500) return 6;
  return 3; // international
}

// ── Activity recency score (0–20) ────────────────────────────────────────────
function activityScore(hoursAgo: number | undefined): number {
  if (hoursAgo === undefined) return 10;
  if (hoursAgo <= 0)   return 20;  // online now
  if (hoursAgo <= 1)   return 18;
  if (hoursAgo <= 3)   return 15;
  if (hoursAgo <= 6)   return 12;
  if (hoursAgo <= 12)  return 9;
  if (hoursAgo <= 24)  return 6;
  return 2;
}

// ── Shared interests score (0–20) ────────────────────────────────────────────
function interestScore(profileInterests: string[] | null | undefined, userInterests: string[]): number {
  if (!profileInterests?.length || !userInterests.length) return 5;
  const pSet = new Set(profileInterests.map(i => i.toLowerCase().trim()));
  const shared = userInterests.filter(i => pSet.has(i.toLowerCase().trim())).length;
  return Math.min(20, shared * 5);
}

// ── Profile completeness score (0–15) ────────────────────────────────────────
function completenessScore(profile: GhostProfile): number {
  let score = 0;
  if (profile.image && !profile.image.includes("pravatar")) score += 5; // real photo
  if (profile.bio && profile.bio.length > 20)               score += 4;
  if (profile.interests && profile.interests.length >= 2)   score += 3;
  if (profile.firstDateIdea)                                 score += 2;
  if (profile.religion)                                      score += 1;
  return score;
}

// ── Age compatibility score (0–10) ───────────────────────────────────────────
function ageCompatScore(profileAge: number, userAge: number, ageMin: number, ageMax: number): number {
  // In preferred range → full score
  if (profileAge >= ageMin && profileAge <= ageMax) {
    // Closer in age = bonus
    const diff = Math.abs(profileAge - userAge);
    if (diff <= 2)  return 10;
    if (diff <= 5)  return 8;
    if (diff <= 10) return 6;
    return 4;
  }
  // Out of preferred range but close → partial
  const distFromRange = profileAge < ageMin ? ageMin - profileAge : profileAge - ageMax;
  if (distFromRange <= 3) return 2;
  return 0;
}

// ── Main scoring function ─────────────────────────────────────────────────────
export function computeMatchScore(profile: GhostProfile, prefs: UserPreferences): number {
  let score = 0;

  score += distanceScore(profile.distanceKm);
  score += activityScore(profile.lastActiveHoursAgo);
  score += interestScore(profile.interests, prefs.interests);
  score += completenessScore(profile);
  score += ageCompatScore(profile.age, prefs.age, prefs.ageMin, prefs.ageMax);

  // Mutual like bonus — if they liked me AND I liked them
  if (prefs.inboundLikeIds.has(profile.id)) score += 10;

  // Verified bonus
  if (profile.faceVerified || profile.isVerified) score += 5;

  return Math.min(100, Math.round(score));
}

// ── Score label for display ───────────────────────────────────────────────────
export function matchScoreLabel(score: number): string {
  if (score >= 85) return "Exceptional";
  if (score >= 70) return "Great Match";
  if (score >= 55) return "Good Match";
  if (score >= 40) return "Possible";
  return "New";
}

// ── Score colour ──────────────────────────────────────────────────────────────
export function matchScoreColor(score: number): string {
  if (score >= 85) return "#f0d060";   // gold
  if (score >= 70) return "#d4af37";   // deep gold
  if (score >= 55) return "#a8c89e";   // sage green
  if (score >= 40) return "#9ba8b5";   // slate
  return "#6b7280";                    // grey
}

// ── Sort comparator — online-first then match score ───────────────────────────
export function sortByMatchScore(
  a: GhostProfile,
  b: GhostProfile,
  aScore: number,
  bScore: number,
  isOnlineFn: (lastSeen: string | null | undefined) => boolean,
): number {
  const aOnline = isOnlineFn(a.last_seen_at) ? 1 : 0;
  const bOnline = isOnlineFn(b.last_seen_at) ? 1 : 0;
  if (aOnline !== bOnline) return bOnline - aOnline; // online first
  return bScore - aScore; // then higher score first
}
