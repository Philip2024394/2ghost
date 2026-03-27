/**
 * 2Ghost — Supabase Data Service
 * All async DB operations. localStorage is used as local cache for instant UI.
 * Pattern: write local first (instant), then sync to Supabase in background.
 */
import { ghostSupabase } from "./ghostSupabase";
import { getCurrentISOWeek } from "./utils/featureGating";

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getMyGhostId(): string {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    return p.phone || p.whatsapp || "";
  } catch { return ""; }
}

// ── Coins ─────────────────────────────────────────────────────────────────────

export async function syncCoinsToSupabase(ghostId: string, balance: number): Promise<void> {
  if (!ghostId) return;
  await ghostSupabase.from("ghost_coins").upsert(
    { ghost_id: ghostId, balance, updated_at: new Date().toISOString() },
    { onConflict: "ghost_id" }
  );
}

export async function loadCoinsFromSupabase(ghostId: string): Promise<number | null> {
  if (!ghostId) return null;
  const { data } = await ghostSupabase
    .from("ghost_coins")
    .select("balance")
    .eq("ghost_id", ghostId)
    .maybeSingle();
  return data?.balance ?? null;
}

// ── Tier ──────────────────────────────────────────────────────────────────────

export async function syncTierToSupabase(ghostId: string, tier: string): Promise<void> {
  if (!ghostId) return;
  await ghostSupabase.from("ghost_tiers").upsert(
    { ghost_id: ghostId, tier, updated_at: new Date().toISOString() },
    { onConflict: "ghost_id" }
  );
}

export async function loadTierFromSupabase(ghostId: string): Promise<string | null> {
  if (!ghostId) return null;
  const { data } = await ghostSupabase
    .from("ghost_tiers")
    .select("tier")
    .eq("ghost_id", ghostId)
    .maybeSingle();
  return data?.tier ?? null;
}

// ── Likes ─────────────────────────────────────────────────────────────────────

export async function recordLike(fromGhostId: string, toGhostId: string): Promise<void> {
  if (!fromGhostId || !toGhostId) return;
  await ghostSupabase.from("ghost_likes").upsert(
    { from_id: fromGhostId, to_id: toGhostId },
    { onConflict: "from_id,to_id" }
  );
  // Check for mutual like → create match
  const { data } = await ghostSupabase
    .from("ghost_likes")
    .select("id")
    .eq("from_id", toGhostId)
    .eq("to_id", fromGhostId)
    .maybeSingle();
  if (data) {
    const [a, b] = [fromGhostId, toGhostId].sort();
    const { data: newMatch } = await ghostSupabase.from("ghost_matches").upsert(
      { user_a: a, user_b: b },
      { onConflict: "user_a,user_b" }
    ).select("user_a").maybeSingle();

    // Notify both users via push (fire-and-forget, non-blocking)
    if (newMatch !== undefined) {
      const notify = (ghostId: string) =>
        ghostSupabase.functions.invoke("send-push", {
          body: {
            ghostId,
            title: "💘 You have a new match!",
            body: "Someone in the hotel likes you back. Go see who.",
            url: "/mode",
            type: "match",
          },
        }).then(null, () => null);
      notify(fromGhostId);
      notify(toGhostId);
    }
  }
}

export async function loadMyMatches(ghostId: string): Promise<{ matchedAt: string; partnerId: string }[]> {
  if (!ghostId) return [];
  const { data } = await ghostSupabase
    .from("ghost_matches")
    .select("user_a, user_b, matched_at")
    .or(`user_a.eq.${ghostId},user_b.eq.${ghostId}`)
    .order("matched_at", { ascending: false });
  if (!data) return [];
  return data.map(row => ({
    matchedAt: row.matched_at,
    partnerId: row.user_a === ghostId ? row.user_b : row.user_a,
  }));
}

// ── Floor Chat Messages ───────────────────────────────────────────────────────

export interface FloorMsgRow {
  id: string;
  floor: string;
  sender_id: string;
  sender_name: string;
  text: string;
  media_url: string | null;
  media_type: "image" | "video" | "audio" | null;
  is_gift: boolean;
  gift_emoji: string | null;
  gift_name: string | null;
  gift_coins: number | null;
  is_directed: boolean;
  directed_to: string | null;
  created_at: string;
}

export async function loadFloorMessages(floor: string, limit = 60): Promise<FloorMsgRow[]> {
  const { data } = await ghostSupabase
    .from("ghost_floor_msgs")
    .select("*")
    .eq("floor", floor)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!data) return [];
  return data.reverse();
}

export async function sendFloorMessage(msg: {
  floor: string;
  senderId: string;
  senderName: string;
  text: string;
  mediaUrl?: string;
  mediaType?: "image" | "video" | "audio";
  isGift?: boolean;
  giftEmoji?: string;
  giftName?: string;
  giftCoins?: number;
  isDirected?: boolean;
  directedTo?: string;
}): Promise<string | null> {
  const { data, error } = await ghostSupabase
    .from("ghost_floor_msgs")
    .insert({
      floor: msg.floor,
      sender_id: msg.senderId,
      sender_name: msg.senderName,
      text: msg.text,
      media_url: msg.mediaUrl ?? null,
      media_type: msg.mediaType ?? null,
      is_gift: msg.isGift ?? false,
      gift_emoji: msg.giftEmoji ?? null,
      gift_name: msg.giftName ?? null,
      gift_coins: msg.giftCoins ?? null,
      is_directed: msg.isDirected ?? false,
      directed_to: msg.directedTo ?? null,
    })
    .select("id")
    .single();
  if (error) { console.error("[2Ghost] floor msg insert:", error.message); return null; }
  return data?.id ?? null;
}

export function subscribeFloorMessages(
  floor: string,
  onMessage: (row: FloorMsgRow) => void
) {
  const channel = ghostSupabase
    .channel(`floor_chat_${floor}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "ghost_floor_msgs", filter: `floor=eq.${floor}` },
      payload => onMessage(payload.new as FloorMsgRow)
    )
    .subscribe();
  return () => { ghostSupabase.removeChannel(channel); };
}

// ── Vault Private Chat ────────────────────────────────────────────────────────

export interface VaultMsgRow {
  id: string;
  room_id: string;
  sender_id: string;
  text: string;
  coins_used: number;
  created_at: string;
}

export function getVaultRoomId(idA: string, idB: string): string {
  return [idA, idB].sort().join("__");
}

export async function loadVaultMessages(roomId: string, limit = 50): Promise<VaultMsgRow[]> {
  const { data } = await ghostSupabase
    .from("ghost_vault_msgs")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!data) return [];
  return data.reverse();
}

export async function sendVaultMessage(roomId: string, senderId: string, text: string, coinsUsed = 2): Promise<void> {
  await ghostSupabase.from("ghost_vault_msgs").insert({
    room_id: roomId,
    sender_id: senderId,
    text,
    coins_used: coinsUsed,
  });
}

export function subscribeVaultMessages(
  roomId: string,
  onMessage: (row: VaultMsgRow) => void
) {
  const channel = ghostSupabase
    .channel(`vault_${roomId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "ghost_vault_msgs", filter: `room_id=eq.${roomId}` },
      payload => onMessage(payload.new as VaultMsgRow)
    )
    .subscribe();
  return () => { ghostSupabase.removeChannel(channel); };
}

// ── Whispers ──────────────────────────────────────────────────────────────────

export async function recordWhisper(fromId: string, toId: string, message: string, willConvert: boolean): Promise<void> {
  if (!fromId || !toId) return;
  await ghostSupabase.from("ghost_whispers").upsert(
    { from_ghost_id: fromId, to_ghost_id: toId, message, will_convert: willConvert },
    { onConflict: "from_ghost_id,to_ghost_id" }
  );
}

// ── Video Intro ───────────────────────────────────────────────────────────────

export async function saveVideoIntroToSupabase(ghostId: string, videoUrl: string, isPrivate: boolean): Promise<void> {
  if (!ghostId) return;
  await ghostSupabase.from("ghost_video_intros").upsert(
    { ghost_id: ghostId, video_url: videoUrl, is_private: isPrivate, updated_at: new Date().toISOString() },
    { onConflict: "ghost_id" }
  );
}

export async function recordVideoRequest(fromId: string, toId: string, coinsSpent: number): Promise<void> {
  if (!fromId || !toId) return;
  await ghostSupabase.from("ghost_video_requests").upsert(
    { from_ghost_id: fromId, to_ghost_id: toId, coins_spent: coinsSpent, status: "pending" },
    { onConflict: "from_ghost_id,to_ghost_id" }
  );
}

export async function updateVideoRequestStatus(fromId: string, toId: string, status: "approved" | "denied"): Promise<void> {
  await ghostSupabase
    .from("ghost_video_requests")
    .update({ status })
    .eq("from_ghost_id", fromId)
    .eq("to_ghost_id", toId);
}

export async function loadVideoRequestsReceived(ghostId: string): Promise<{ fromGhostId: string; status: string; coinsSpent: number; requestedAt: string }[]> {
  if (!ghostId) return [];
  const { data } = await ghostSupabase
    .from("ghost_video_requests")
    .select("from_ghost_id, status, coins_spent, requested_at")
    .eq("to_ghost_id", ghostId)
    .order("requested_at", { ascending: false });
  if (!data) return [];
  return data.map(r => ({
    fromGhostId: r.from_ghost_id,
    status: r.status,
    coinsSpent: r.coins_spent,
    requestedAt: r.requested_at,
  }));
}

// ── Ghost Scores ──────────────────────────────────────────────────────────────

export async function saveScoreToSupabase(fromId: string, toId: string, stars: number, tags: string[]): Promise<void> {
  if (!fromId || !toId) return;
  await ghostSupabase.from("ghost_scores").upsert(
    { from_ghost_id: fromId, to_ghost_id: toId, stars, tags },
    { onConflict: "from_ghost_id,to_ghost_id" }
  );
}

export async function loadProfileRating(toId: string): Promise<number | null> {
  const { data } = await ghostSupabase
    .from("ghost_scores")
    .select("stars")
    .eq("to_ghost_id", toId);
  if (!data || data.length === 0) return null;
  const avg = data.reduce((s, r) => s + r.stars, 0) / data.length;
  return Math.round(avg * 10) / 10;
}

// ── Floor Wars / Gifts ────────────────────────────────────────────────────────

export async function recordFloorGift(ghostId: string, floor: string): Promise<void> {
  if (!ghostId) return;
  await ghostSupabase.from("ghost_floor_gifts").insert({
    ghost_id: ghostId,
    floor,
    iso_week: getCurrentISOWeek(),
  });
}

export async function loadFloorGiftsThisWeek(): Promise<Record<string, number>> {
  const week = getCurrentISOWeek();
  const { data } = await ghostSupabase
    .from("ghost_floor_gifts")
    .select("floor")
    .eq("iso_week", week);
  if (!data) return {};
  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.floor] = (counts[row.floor] ?? 0) + 1;
  }
  return counts;
}

// ── Message Likes ─────────────────────────────────────────────────────────────

export async function recordMsgLike(msgId: string, ghostId: string, floor: string): Promise<void> {
  if (!ghostId) return;
  await ghostSupabase.from("ghost_msg_likes").upsert(
    { msg_id: msgId, ghost_id: ghostId, floor },
    { onConflict: "msg_id,ghost_id" }
  );
}

export async function loadMsgLikes(floor: string): Promise<Record<string, number>> {
  const { data } = await ghostSupabase
    .from("ghost_msg_likes")
    .select("msg_id")
    .eq("floor", floor);
  if (!data) return {};
  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.msg_id] = (counts[row.msg_id] ?? 0) + 1;
  }
  return counts;
}

// ── Real Profiles ─────────────────────────────────────────────────────────────

export interface RealProfileRow {
  id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  country_flag: string;
  gender: string;
  photo_url?: string | null;
  bio?: string | null;
  interests?: string[] | null;
  first_date_idea?: string | null;
  religion?: string | null;
  connect_phone?: string | null;
  connect_alt?: string | null;
  connect_alt_handle?: string | null;
  is_verified?: boolean;
  face_verified?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export async function loadGhostProfiles(): Promise<RealProfileRow[]> {
  const { data } = await ghostSupabase
    .from("ghost_profiles")
    .select("ghost_id, display_name, age, city, country, country_flag, gender, photo_url, bio, interests, religion, connect_phone, connect_alt, connect_alt_handle, is_verified, face_verified, latitude, longitude, last_seen_at, contact_pref")
    .eq("is_blocked", false)
    .not("display_name", "is", null)
    .order("last_seen_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((r: any) => ({
    id:                 r.ghost_id,
    name:               r.display_name,
    age:                r.age,
    city:               r.city,
    country:            r.country,
    country_flag:       r.country_flag,
    gender:             r.gender,
    photo_url:          r.photo_url,
    bio:                r.bio,
    interests:          r.interests,
    first_date_idea:    null,
    religion:           r.religion,
    connect_phone:      r.connect_phone,
    connect_alt:        r.connect_alt,
    connect_alt_handle: r.connect_alt_handle,
    is_verified:        r.is_verified,
    face_verified:      r.face_verified,
    latitude:           r.latitude,
    longitude:          r.longitude,
  }));
}

// ── Ghost Clock / Window Mode ─────────────────────────────────────────────────

export async function syncWindowModeToSupabase(ghostId: string, untilTs: number): Promise<void> {
  if (!ghostId) return;
  await ghostSupabase.from("ghost_window_mode").upsert(
    { ghost_id: ghostId, until_ts: untilTs, updated_at: new Date().toISOString() },
    { onConflict: "ghost_id" }
  );
}

export async function loadWindowModeFromSupabase(ghostId: string): Promise<number | null> {
  if (!ghostId) return null;
  const { data } = await ghostSupabase
    .from("ghost_window_mode")
    .select("until_ts")
    .eq("ghost_id", ghostId)
    .maybeSingle();
  return data?.until_ts ?? null;
}

// ── Contact Preference ─────────────────────────────────────────────────────────

export async function saveContactPref(ghostId: string, pref: "video" | "connect"): Promise<void> {
  if (!ghostId) return;
  await ghostSupabase
    .from("ghost_profiles")
    .update({ contact_pref: pref })
    .eq("id", ghostId);
}
