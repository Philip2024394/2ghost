// ── Breakfast Rating & Social Activity Service ────────────────────────────────
import { ghostSupabase } from "../ghostSupabase";

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

// ── Supabase sync ─────────────────────────────────────────────────────────────

/** Save a breakfast rating to Supabase (non-blocking) */
export async function saveRatingDB(rating: BreakfastRating, raterGhostId: string): Promise<void> {
  try {
    await ghostSupabase.from("ghost_breakfast_ratings").upsert({
      invite_id:         rating.inviteId,
      rater_ghost_id:    raterGhostId,
      rater_role:        rating.raterRole,
      rating:            rating.rating,
      rated_at:          rating.ratedAt,
      selected_activity: rating.selectedActivity ?? null,
    }, { onConflict: "invite_id,rater_ghost_id" });
  } catch {}
}

/** Load activities from Supabase; falls back to localStorage defaults */
export async function loadActivitiesFromDB(): Promise<SocialActivity[]> {
  try {
    const { data } = await ghostSupabase
      .from("ghost_social_activities")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data?.length) {
      const list: SocialActivity[] = data.map(r => ({
        id:          r.id as string,
        name:        r.name as string,
        description: (r.description ?? "") as string,
        imageUrl:    (r.image_url ?? "") as string,
        icon:        (r.icon ?? "") as string,
      }));
      saveActivities(list);
      return list;
    }
  } catch {}
  return loadActivities();
}

/** Upsert a social invite to Supabase (non-blocking) */
export async function upsertSocialInviteDB(inv: SocialInvite): Promise<void> {
  try {
    await ghostSupabase.from("ghost_social_invites").upsert({
      id:             inv.id,
      invite_id:      inv.inviteId,
      from_ghost_id:  inv.fromUserId,
      from_user_name: inv.fromUserName,
      to_ghost_id:    inv.toUserId,
      to_user_name:   inv.toUserName,
      floor:          inv.floor,
      activity:       inv.activity,
      host_rating:    inv.hostRating,
      guest_rating:   inv.guestRating,
      sent_at:        inv.sentAt,
      deliver_at:     inv.deliverAt,
      status:         inv.status,
      decline_reason: inv.declineReason ?? null,
      updated_at:     new Date().toISOString(),
    }, { onConflict: "id" });
  } catch {}
}

/** Load social invite from Supabase for a user */
export async function loadSocialInviteFromDB(myGhostId: string): Promise<{ sent: SocialInvite | null; received: SocialInvite | null }> {
  try {
    const { data } = await ghostSupabase
      .from("ghost_social_invites")
      .select("*")
      .or(`from_ghost_id.eq.${myGhostId},to_ghost_id.eq.${myGhostId}`)
      .order("sent_at", { ascending: false })
      .limit(10);

    if (!data?.length) return { sent: null, received: null };

    const toInv = (r: Record<string, unknown>): SocialInvite => ({
      id:            r.id as string,
      inviteId:      r.invite_id as string,
      fromUserId:    r.from_ghost_id as string,
      fromUserName:  r.from_user_name as string,
      toUserId:      r.to_ghost_id as string,
      toUserName:    r.to_user_name as string,
      floor:         r.floor as string,
      activity:      r.activity as SocialActivity,
      hostRating:    (r.host_rating ?? 0) as number,
      guestRating:   (r.guest_rating ?? 0) as number,
      sentAt:        r.sent_at as number,
      deliverAt:     r.deliver_at as number,
      status:        r.status as SocialInvite["status"],
      declineReason: r.decline_reason as string | undefined,
    });

    const sent     = data.find(r => r.from_ghost_id === myGhostId) ?? null;
    const received = data.find(r => r.to_ghost_id   === myGhostId) ?? null;
    return { sent: sent ? toInv(sent) : null, received: received ? toInv(received) : null };
  } catch {
    return { sent: null, received: null };
  }
}
