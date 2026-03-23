// ── Breakfast Rating & Social Activity Service ────────────────────────────────

export type SocialActivity = {
  id:          string;
  name:        string;
  description: string;
  imageUrl:    string;
  icon:        string;
};

export type BreakfastRating = {
  inviteId:      string;
  raterRole:     "host" | "guest";
  rating:        number;         // 1–10
  ratedAt:       number;
  selectedActivity?: SocialActivity;
};

export type SocialInvite = {
  id:           string;
  inviteId:     string;          // original breakfast invite id
  fromUserId:   string;
  fromUserName: string;
  toUserId:     string;
  toUserName:   string;
  floor:        string;
  activity:     SocialActivity;
  hostRating:   number;
  guestRating:  number;
  sentAt:       number;          // when 24h timer started
  deliverAt:    number;          // sentAt + 24h
  status:       "pending" | "accepted" | "declined" | "delivered";
  declineReason?: string;
};

// ── Coin costs ────────────────────────────────────────────────────────────────
export const SOCIAL_BUTLER_TIP: Record<string, number> = {
  standard: 8, suite: 15, kings: 20, penthouse: 30, loft: 15, cellar: 18,
};

export const SOCIAL_INVITE_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours

const RATING_KEY          = (inviteId: string, role: string) => `ghost_bfast_rating_${inviteId}_${role}`;
const SOCIAL_SENT_KEY     = "ghost_social_invite_sent";
const SOCIAL_RECEIVED_KEY = "ghost_social_invite_received";
const ACTIVITIES_KEY      = "ghost_social_activities";

// ── Default activities ────────────────────────────────────────────────────────
const DEFAULT_ACTIVITIES: SocialActivity[] = [
  { id: "act-1", icon: "🌅", name: "Sunset Rooftop Drinks",  description: "Watch the city glow from above with curated cocktails",    imageUrl: "" },
  { id: "act-2", icon: "🖼️", name: "Gallery & Coffee Walk",  description: "Explore local art then settle into a quiet café together", imageUrl: "" },
  { id: "act-3", icon: "🍽️", name: "Private Dinner",         description: "An intimate table for two at a restaurant of your choice", imageUrl: "" },
  { id: "act-4", icon: "🧺", name: "Park Picnic",            description: "A blanket, great food, and even better company",           imageUrl: "" },
  { id: "act-5", icon: "🚗", name: "Day Trip",               description: "Pick a direction and just drive — no plan needed",        imageUrl: "" },
  { id: "act-6", icon: "👨‍🍳", name: "Cook Together",         description: "Pick a recipe, shop together, cook something memorable",  imageUrl: "" },
  { id: "act-7", icon: "🍷", name: "Wine & Film Evening",    description: "Good wine, a great film, no interruptions",               imageUrl: "" },
  { id: "act-8", icon: "🥾", name: "Morning Hike",           description: "Fresh air, early start, and real conversation on the trail",imageUrl: "" },
];

// ── Activities CRUD ───────────────────────────────────────────────────────────
export function loadActivities(): SocialActivity[] {
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_ACTIVITIES;
}
export function saveActivities(list: SocialActivity[]): void {
  try { localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(list)); } catch {}
}
export function addActivity(a: Omit<SocialActivity, "id">): SocialActivity {
  const list = loadActivities();
  const item = { ...a, id: `act-${Date.now()}` };
  saveActivities([...list, item]);
  return item;
}
export function updateActivity(a: SocialActivity): void {
  saveActivities(loadActivities().map(x => x.id === a.id ? a : x));
}
export function deleteActivity(id: string): void {
  saveActivities(loadActivities().filter(a => a.id !== id));
}
export function resetActivities(): void {
  saveActivities(DEFAULT_ACTIVITIES);
}

// ── Ratings ───────────────────────────────────────────────────────────────────
export function saveRating(rating: BreakfastRating): void {
  try { localStorage.setItem(RATING_KEY(rating.inviteId, rating.raterRole), JSON.stringify(rating)); } catch {}
}
export function getRating(inviteId: string, role: "host" | "guest"): BreakfastRating | null {
  try {
    const raw = localStorage.getItem(RATING_KEY(inviteId, role));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Social invite ─────────────────────────────────────────────────────────────
export function createSocialInvite(data: Omit<SocialInvite, "id" | "sentAt" | "deliverAt" | "status">): SocialInvite {
  const inv: SocialInvite = {
    ...data,
    id:        `sinv-${Date.now()}`,
    sentAt:    Date.now(),
    deliverAt: Date.now() + SOCIAL_INVITE_DELAY_MS,
    status:    "pending",
  };
  localStorage.setItem(SOCIAL_SENT_KEY, JSON.stringify(inv));
  localStorage.setItem(SOCIAL_RECEIVED_KEY, JSON.stringify(inv));
  return inv;
}
export function getSentSocialInvite(): SocialInvite | null {
  try { return JSON.parse(localStorage.getItem(SOCIAL_SENT_KEY) || "null"); } catch { return null; }
}
export function getReceivedSocialInvite(): SocialInvite | null {
  try {
    const inv: SocialInvite | null = JSON.parse(localStorage.getItem(SOCIAL_RECEIVED_KEY) || "null");
    if (!inv) return null;
    // Mark as delivered if 24h has passed
    if (inv.status === "pending" && Date.now() >= inv.deliverAt) {
      inv.status = "delivered";
      localStorage.setItem(SOCIAL_RECEIVED_KEY, JSON.stringify(inv));
    }
    return inv;
  } catch { return null; }
}
export function acceptSocialInvite(): void {
  try {
    const inv = getReceivedSocialInvite();
    if (!inv) return;
    inv.status = "accepted";
    localStorage.setItem(SOCIAL_RECEIVED_KEY, JSON.stringify(inv));
    localStorage.setItem(SOCIAL_SENT_KEY, JSON.stringify(inv));
  } catch {}
}
export function declineSocialInvite(reason: string): void {
  try {
    const inv = getReceivedSocialInvite();
    if (!inv) return;
    inv.status = "declined";
    inv.declineReason = reason;
    localStorage.setItem(SOCIAL_RECEIVED_KEY, JSON.stringify(inv));
    localStorage.setItem(SOCIAL_SENT_KEY, JSON.stringify(inv));
  } catch {}
}
export function clearSocialInvites(): void {
  localStorage.removeItem(SOCIAL_SENT_KEY);
  localStorage.removeItem(SOCIAL_RECEIVED_KEY);
}

export const SOCIAL_DECLINE_REASONS = [
  "Thank you, but I need a little more time 🙏",
  "I'm not quite ready for that step yet 😊",
  "Perhaps another occasion — I enjoyed breakfast 🌅",
  "Timing isn't right for me right now ⏳",
  "I'd rather keep things casual for now ☕",
];
