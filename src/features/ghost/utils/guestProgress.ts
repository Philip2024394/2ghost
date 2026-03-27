// ── Guest Progress & Unlock System ────────────────────────────────────────────
// Tracks user actions and determines which hotel features are unlocked.

const KEY = "ghost_guest_progress";

export type ProgressData = {
  signupTs: number;
  likesSent: number;
  photoUploaded: boolean;
  chatInvitesSent: number;
  chatInvitesAccepted: number;
  firstPurchaseMade: boolean;
  loungeVisits: number;
  tonightUsed: boolean;
  gamesPlayed: number;
  introShown: boolean;
};

const DEFAULT: ProgressData = {
  signupTs: Date.now(),
  likesSent: 0,
  photoUploaded: false,
  chatInvitesSent: 0,
  chatInvitesAccepted: 0,
  firstPurchaseMade: false,
  loungeVisits: 0,
  tonightUsed: false,
  gamesPlayed: 0,
  introShown: false,
};

export function getProgress(): ProgressData {
  try {
    const stored: Partial<ProgressData> = JSON.parse(localStorage.getItem(KEY) || "{}");

    // Infer from existing localStorage keys so progress is never lost
    const profile  = (() => { try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}"); } catch { return {}; } })();
    const invites: { fromProfileId?: string; status?: string }[] =
      (() => { try { return JSON.parse(localStorage.getItem("ghost_chat_invites") || "[]"); } catch { return []; } })();
    const txns: { type?: string }[] =
      (() => { try { return JSON.parse(localStorage.getItem("ghost_coin_transactions") || "[]"); } catch { return []; } })();

    const myId = profile.id ?? "";

    return {
      ...DEFAULT,
      ...stored,
      signupTs: stored.signupTs ?? DEFAULT.signupTs,
      photoUploaded: stored.photoUploaded
        || (!!profile.image && !profile.image.includes("placeholder")),
      chatInvitesSent: Math.max(
        stored.chatInvitesSent ?? 0,
        invites.filter(i => i.fromProfileId === myId).length,
      ),
      chatInvitesAccepted: Math.max(
        stored.chatInvitesAccepted ?? 0,
        invites.filter(i => i.fromProfileId === myId && i.status === "accepted").length,
      ),
      firstPurchaseMade: stored.firstPurchaseMade
        || txns.some(t => t.type === "purchase"),
      tonightUsed: stored.tonightUsed
        || !!localStorage.getItem("ghost_tonight_until"),
    };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveProgress(p: ProgressData) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export type ProgressAction =
  | "like_sent"
  | "chat_invite_sent"
  | "chat_invite_accepted"
  | "lounge_visit"
  | "game_played"
  | "tonight_used"
  | "purchase_made"
  | "photo_uploaded"
  | "intro_shown";

export function trackAction(action: ProgressAction) {
  const p = getProgress();
  switch (action) {
    case "like_sent":             p.likesSent++;              break;
    case "chat_invite_sent":      p.chatInvitesSent++;        break;
    case "chat_invite_accepted":  p.chatInvitesAccepted++;    break;
    case "lounge_visit":          p.loungeVisits++;           break;
    case "game_played":           p.gamesPlayed++;            break;
    case "tonight_used":          p.tonightUsed = true;       break;
    case "purchase_made":         p.firstPurchaseMade = true; break;
    case "photo_uploaded":        p.photoUploaded = true;     break;
    case "intro_shown":           p.introShown = true;        break;
  }
  saveProgress(p);
}

// ── Unlock Tiers ──────────────────────────────────────────────────────────────

export type FeatureItem = {
  icon: string;
  name: string;
  description: string;
  route?: string;
};

export type UnlockTier = {
  id: number;
  hotelTitle: string;
  subtitle: string;
  requirementText: string;
  requirementShort: string;
  isUnlocked: (p: ProgressData) => boolean;
  progressValue: (p: ProgressData) => number;   // 0–100
  features: FeatureItem[];
};

export const UNLOCK_TIERS: UnlockTier[] = [
  {
    id: 0,
    hotelTitle: "Checked In",
    subtitle: "Welcome to Heartsway Hotel",
    requirementText: "Available from the moment you arrive",
    requirementShort: "Day 1 — always open",
    isUnlocked: () => true,
    progressValue: () => 100,
    features: [
      { icon: "👤", name: "Browse Profiles",      description: "View and like guest profiles in the feed",         route: "/mode" },
      { icon: "🌙", name: "Tonight Mode",          description: "Signal you are available to meet tonight",         route: "/mode" },
      { icon: "🪙", name: "Coin Wallet",           description: "Earn and spend Hotel coins",                       route: "/dashboard" },
      { icon: "🕵️", name: "Mr. Butlas Report",    description: "Request a guest background check · 🪙 20",        route: "/mode" },
    ],
  },
  {
    id: 1,
    hotelTitle: "Room Assigned",
    subtitle: "Your portrait confirms your stay",
    requirementText: "Upload your profile photo to unlock",
    requirementShort: "Upload profile photo",
    isUnlocked: (p) => p.photoUploaded,
    progressValue: (p) => p.photoUploaded ? 100 : 0,
    features: [
      { icon: "👁️", name: "Who Viewed Me",        description: "See every guest who visited your profile",         route: "/mode" },
      { icon: "🎩", name: "Send Chat Invite",      description: "Invite guests to open a conversation",             route: "/mode" },
      { icon: "🌙", name: "Tonight Slider",        description: "Browse all guests available to meet tonight",      route: "/mode" },
    ],
  },
  {
    id: 2,
    hotelTitle: "Regular Guest",
    subtitle: "You are becoming part of the Hotel",
    requirementText: "Send 3 likes to other guests",
    requirementShort: "Send 3 likes",
    isUnlocked: (p) => p.likesSent >= 3,
    progressValue: (p) => Math.min(100, Math.round((p.likesSent / 3) * 100)),
    features: [
      { icon: "☕", name: "Breakfast Lounge",      description: "Join the social lounge and meet fellow guests",    route: "/breakfast-lounge" },
      { icon: "💬", name: "Floor Chat",            description: "Open conversation on your hotel floor",            route: "/mode" },
      { icon: "🎁", name: "Send Gifts",            description: "Send virtual gifts to guests you admire",          route: "/mode" },
    ],
  },
  {
    id: 3,
    hotelTitle: "Known Guest",
    subtitle: "The Hotel recognises your presence",
    requirementText: "Get a chat invite accepted by another guest",
    requirementShort: "1 chat invite accepted",
    isUnlocked: (p) => p.chatInvitesAccepted >= 1,
    progressValue: (p) => p.chatInvitesAccepted >= 1 ? 100 : Math.min(80, p.chatInvitesSent * 25),
    features: [
      { icon: "🎮", name: "Games Room",            description: "Challenge guests to Connect 4 and memory games",   route: "/games" },
      { icon: "❤️", name: "Who Liked Me",          description: "See every guest who liked your profile",           route: "/mode" },
      { icon: "🏆", name: "Leaderboard",           description: "See the most admired guests in the Hotel",         route: "/mode" },
    ],
  },
  {
    id: 4,
    hotelTitle: "Valued Guest",
    subtitle: "The finest rooms are now open to you",
    requirementText: "Make your first coin purchase in the Hotel",
    requirementShort: "First coin purchase",
    isUnlocked: (p) => p.firstPurchaseMade,
    progressValue: (p) => p.firstPurchaseMade ? 100 : 0,
    features: [
      { icon: "👑", name: "Kings Room",            description: "Access the exclusive Kings floor",                 route: "/floor/kings" },
      { icon: "🔐", name: "Vault Private Chat",    description: "Private encrypted chat with your matches",         route: "/room" },
      { icon: "⚡", name: "Profile Boost",         description: "Place your profile at the top of every feed",      route: "/dashboard" },
    ],
  },
  {
    id: 5,
    hotelTitle: "Hotel Member",
    subtitle: "The highest honour in Heartsway Hotel",
    requirementText: "Activate Ghost Black membership",
    requirementShort: "Ghost Black membership",
    isUnlocked: (p) => p.firstPurchaseMade && p.likesSent >= 10 && p.chatInvitesAccepted >= 1,
    progressValue: (p) => {
      let score = 0;
      if (p.firstPurchaseMade) score += 40;
      if (p.likesSent >= 10)   score += 30;
      if (p.chatInvitesAccepted >= 1) score += 30;
      return score;
    },
    features: [
      { icon: "🏨", name: "Penthouse Access",      description: "The most exclusive floor in the Hotel",            route: "/penthouse" },
      { icon: "🌍", name: "Global Listing",        description: "Be visible to guests in other countries",           route: "/dashboard" },
      { icon: "🎩", name: "Butler Gift Pack",       description: "Real-world gift delivery through Mr. Butlas",      route: "/dashboard" },
    ],
  },
];

export function getCurrentTier(p: ProgressData): UnlockTier {
  // Return the highest unlocked tier
  for (let i = UNLOCK_TIERS.length - 1; i >= 0; i--) {
    if (UNLOCK_TIERS[i].isUnlocked(p)) return UNLOCK_TIERS[i];
  }
  return UNLOCK_TIERS[0];
}

export function getNextTier(p: ProgressData): UnlockTier | null {
  for (let i = 0; i < UNLOCK_TIERS.length; i++) {
    if (!UNLOCK_TIERS[i].isUnlocked(p)) return UNLOCK_TIERS[i];
  }
  return null;
}
