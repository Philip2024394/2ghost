/**
 * 2Ghost Admin — Supabase data layer
 * All admin queries go through here. Falls back to mock data when
 * Supabase is not connected (env vars missing / offline).
 */
import { ghostSupabase } from "../ghost/ghostSupabase";
import {
  COUNTRY_STATS,
  MONTHLY_REVENUE,
  RECENT_TRANSACTIONS,
  PACKAGE_BREAKDOWN,
  MOCK_REAL_USERS,
} from "./adminMockData";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AdminOverviewStats {
  total_users: number;
  premium_users: number;
  gold_users: number;
  suite_users: number;
  new_this_month: number;
  active_today: number;
  active_countries: number;
  mrr: number;
}

export interface RevenueRow {
  month: string;
  revenue: number;
  suite: number;
  gold: number;
}

export interface CountryStatRow {
  country: string;
  flag: string;
  code: string;
  users: number;
  premium: number;
  gold: number;
  suite: number;
  mrr: number;
}

export interface TransactionRow {
  id: string;
  user: string;
  country: string;
  pkg: string;
  amount: string;
  date: string;
  status: string;
}

export interface UserRow {
  id: string;
  ghostId: string;   // real ghost_id from ghost_profiles — use this for Supabase mutations
  name: string;
  phone: string;
  city: string;
  country: string;
  tier: string;
  joined: string;
  lastActive: string;
  gender: string;
  verificationStatus?: "none" | "pending" | "verified" | "rejected";
  verificationVideoUrl?: string;
}

export interface PendingVerificationRow {
  ghostId: string;
  name: string;
  country: string;
  videoUrl: string;
  submittedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isConnected(): boolean {
  const url = import.meta.env.VITE_GHOST_SUPABASE_URL as string | undefined;
  return !!url && !url.includes("placeholder");
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Overview ──────────────────────────────────────────────────────────────────

export async function fetchOverviewStats(): Promise<AdminOverviewStats> {
  if (!isConnected()) {
    const total   = COUNTRY_STATS.reduce((s, c) => s + c.users, 0);
    const premium = COUNTRY_STATS.reduce((s, c) => s + c.premium, 0);
    const gold    = COUNTRY_STATS.reduce((s, c) => s + c.gold, 0);
    const suite   = COUNTRY_STATS.reduce((s, c) => s + c.suite, 0);
    const mrr     = COUNTRY_STATS.reduce((s, c) => s + c.mrr, 0);
    return { total_users: total, premium_users: premium, gold_users: gold, suite_users: suite, new_this_month: 87, active_today: 142, active_countries: 12, mrr };
  }
  const { data } = await ghostSupabase.from("ghost_admin_overview").select("*").maybeSingle();
  const { data: pay } = await ghostSupabase.from("ghost_payments")
    .select("amount_usd")
    .eq("status", "paid")
    .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
  const mrr = (pay || []).reduce((s: number, r: any) => s + Number(r.amount_usd), 0);
  if (!data) return { total_users: 0, premium_users: 0, gold_users: 0, suite_users: 0, new_this_month: 0, active_today: 0, active_countries: 0, mrr };
  return { ...data, mrr };
}

export async function fetchMonthlyRevenue(): Promise<RevenueRow[]> {
  if (!isConnected()) return MONTHLY_REVENUE;
  const { data } = await ghostSupabase.from("ghost_revenue_by_month").select("*");
  if (!data || data.length === 0) return MONTHLY_REVENUE;
  return data.map((r: any) => ({ month: r.month, revenue: Number(r.revenue) || 0, suite: Number(r.suite) || 0, gold: Number(r.gold) || 0 }));
}

export async function fetchCountryStats(): Promise<CountryStatRow[]> {
  if (!isConnected()) return COUNTRY_STATS.map((c) => ({ country: c.country, flag: c.flag, code: c.code, users: c.users, premium: c.premium, gold: c.gold, suite: c.suite, mrr: c.mrr }));
  const { data } = await ghostSupabase.from("ghost_country_stats").select("*");
  if (!data || data.length === 0) return COUNTRY_STATS.map((c) => ({ country: c.country, flag: c.flag, code: c.code, users: c.users, premium: c.premium, gold: c.gold, suite: c.suite, mrr: c.mrr }));
  return data.map((r: any) => ({ country: r.country, flag: r.flag || "🌍", code: "", users: Number(r.users) || 0, premium: Number(r.premium) || 0, gold: Number(r.gold) || 0, suite: Number(r.suite) || 0, mrr: Number(r.mrr) || 0 }));
}

export async function fetchRecentTransactions(): Promise<TransactionRow[]> {
  if (!isConnected()) return RECENT_TRANSACTIONS;
  const { data } = await ghostSupabase
    .from("ghost_payments")
    .select("id, ghost_id, package, amount_usd, status, created_at, country, ghost_profiles(display_name, country_flag)")
    .order("created_at", { ascending: false })
    .limit(20);
  if (!data || data.length === 0) return RECENT_TRANSACTIONS;
  return data.map((r: any) => ({
    id: `TXN-${r.id.slice(0, 6).toUpperCase()}`,
    user: r.ghost_profiles?.display_name || "Unknown",
    country: r.ghost_profiles?.country_flag || "🌍",
    pkg: r.package === "gold" ? "Gold Room" : "Ghost Suite",
    amount: `$${Number(r.amount_usd).toFixed(2)}`,
    date: fmtDate(r.created_at),
    status: r.status,
  }));
}

export async function fetchPackageBreakdown() {
  if (!isConnected()) return PACKAGE_BREAKDOWN;
  const { data } = await ghostSupabase
    .from("ghost_profiles")
    .select("house_tier")
    .not("is_blocked", "eq", true);
  if (!data) return PACKAGE_BREAKDOWN;
  const free  = data.filter((r: any) => !r.house_tier || r.house_tier === "free").length;
  const suite = data.filter((r: any) => r.house_tier === "suite").length;
  const gold  = data.filter((r: any) => r.house_tier === "gold").length;
  return [
    { name: "Seller Room", value: free,  color: "rgba(255,255,255,0.35)" },
    { name: "Ghost Suite",  value: suite, color: "#4ade80"               },
    { name: "Gold Room",    value: gold,  color: "#d4af37"               },
  ];
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<UserRow[]> {
  if (!isConnected()) return MOCK_REAL_USERS;
  const { data } = await ghostSupabase
    .from("ghost_profiles")
    .select("ghost_id, display_name, connect_phone, city, country, country_flag, house_tier, joined_at, last_seen_at, gender, verification_status, verification_video_url")
    .order("joined_at", { ascending: false })
    .limit(200);
  if (!data || data.length === 0) return MOCK_REAL_USERS;
  return data.map((r: any, i: number) => ({
    id: `USR-${String(i + 1).padStart(3, "0")}`,
    ghostId: r.ghost_id || "",
    name: r.display_name || "Unknown",
    phone: r.connect_phone ? r.connect_phone.replace(/(\d{3})\d+(\d{3})/, "$1 *** $2") : "—",
    city: r.city || "—",
    country: r.country_flag || "🌍",
    tier: r.house_tier || "free",
    joined: r.joined_at ? fmtDate(r.joined_at) : "—",
    lastActive: r.last_seen_at ? timeAgo(r.last_seen_at) : "—",
    gender: r.gender || "—",
    verificationStatus: r.verification_status || "none",
    verificationVideoUrl: r.verification_video_url || undefined,
  }));
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function fetchAllPayments(): Promise<TransactionRow[]> {
  if (!isConnected()) return RECENT_TRANSACTIONS;
  const { data } = await ghostSupabase
    .from("ghost_payments")
    .select("id, ghost_id, package, amount_usd, status, created_at, ghost_profiles(display_name, country_flag)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!data) return RECENT_TRANSACTIONS;
  return data.map((r: any) => ({
    id: `TXN-${r.id.slice(0, 6).toUpperCase()}`,
    user: r.ghost_profiles?.display_name || "Unknown",
    country: r.ghost_profiles?.country_flag || "🌍",
    pkg: r.package === "gold" ? "Gold Room" : "Ghost Suite",
    amount: `$${Number(r.amount_usd).toFixed(2)}`,
    date: fmtDate(r.created_at),
    status: r.status,
  }));
}

// ── Mock profile overrides ────────────────────────────────────────────────────

export async function fetchMockOverrides(): Promise<Record<string, any>> {
  if (!isConnected()) {
    try { return JSON.parse(localStorage.getItem("admin_profile_overrides") || "{}"); } catch { return {}; }
  }
  const { data } = await ghostSupabase.from("ghost_mock_overrides").select("*");
  if (!data) return {};
  return Object.fromEntries(data.map((r: any) => [r.profile_id, { id: r.profile_id, name: r.name, age: r.age, city: r.city, image: r.image_url, isVip: r.is_vip }]));
}

export async function saveMockOverride(override: { id: string; name?: string; age?: number; city?: string; image?: string; isVip?: boolean }) {
  // Always save to localStorage as fallback
  try {
    const all = JSON.parse(localStorage.getItem("admin_profile_overrides") || "{}");
    all[override.id] = override;
    localStorage.setItem("admin_profile_overrides", JSON.stringify(all));
  } catch {}

  if (!isConnected()) return;
  await ghostSupabase.from("ghost_mock_overrides").upsert({
    profile_id: override.id,
    name:       override.name,
    age:        override.age,
    city:       override.city,
    image_url:  override.image,
    is_vip:     override.isVip ?? false,
    updated_at: new Date().toISOString(),
  }, { onConflict: "profile_id" });
}

export async function deleteMockOverride(profileId: string) {
  try {
    const all = JSON.parse(localStorage.getItem("admin_profile_overrides") || "{}");
    delete all[profileId];
    localStorage.setItem("admin_profile_overrides", JSON.stringify(all));
  } catch {}
  if (!isConnected()) return;
  await ghostSupabase.from("ghost_mock_overrides").delete().eq("profile_id", profileId);
}

// ── Butler providers ──────────────────────────────────────────────────────────

export async function fetchButlerProviders() {
  if (!isConnected()) return null; // caller uses hardcoded data
  const { data } = await ghostSupabase
    .from("ghost_butler_providers")
    .select("*")
    .eq("is_active", true)
    .order("city")
    .order("category");
  return data;
}

export async function saveButlerProvider(provider: any) {
  if (!isConnected()) return;
  await ghostSupabase.from("ghost_butler_providers").upsert({
    ...provider,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
}

export async function deleteButlerProvider(id: string) {
  if (!isConnected()) return;
  // Soft delete
  await ghostSupabase.from("ghost_butler_providers").update({ is_active: false }).eq("id", id);
}

// ── Service requests (Butler bookings logged from the app) ────────────────────

export interface ServiceRequestRow {
  id: string;
  type: "service";
  status: "pending" | "done";
  createdAt: string;
  serviceCategory: string;
  serviceEmoji: string;
  providerName: string;
  providerWhatsapp: string;
  userName: string;
  userId: string;
  userWhatsapp?: string;
  userCountry: string;
  note: string;
}

const MOCK_SERVICE_REQUESTS: ServiceRequestRow[] = [
  { id: "t-svc-1", type: "service", status: "pending", createdAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),  serviceCategory: "Flowers",     serviceEmoji: "🌸", providerName: "Sari Bunga Jakarta",   providerWhatsapp: "628123456789",  userName: "Rina W.",   userId: "USR-042", userWhatsapp: "628987654321",  userCountry: "🇮🇩", note: "Delivery address: Jl. Sudirman No. 12, Jakarta. Requested afternoon slot." },
  { id: "t-svc-2", type: "service", status: "pending", createdAt: new Date(Date.now() - 1000 * 60 * 38).toISOString(),  serviceCategory: "Spa & Massage", serviceEmoji: "💆", providerName: "Serenity Spa Bali",  providerWhatsapp: "628765432100",  userName: "David L.",  userId: "USR-019", userWhatsapp: "6287654321987", userCountry: "🇸🇬", note: "In-room massage at Kuta. Confirm date/time with guest." },
  { id: "t-svc-3", type: "service", status: "done",    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), serviceCategory: "Jewellery",    serviceEmoji: "💍", providerName: "Gems Bali",            providerWhatsapp: "628112233445",  userName: "Emma S.",   userId: "USR-007", userWhatsapp: "6281122334455",  userCountry: "🇬🇧", note: "Custom ring engraving — confirmed and completed." },
];

const MOCK_FLAG_REPORTS = [
  { id: "t-rep-1", type: "report" as const, status: "pending" as const, createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),  userName: "Anonymous", userId: "USR-088", userCountry: "🇵🇭", note: "Profile reported for inappropriate photos. Review and action required." },
  { id: "t-rep-2", type: "report" as const, status: "pending" as const, createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(), userName: "Anonymous", userId: "USR-131", userCountry: "🇹🇭", note: "Spam messages reported by 3 users. Check message logs." },
];

const MOCK_FAILED_PAYMENTS = [
  { id: "t-pay-1", type: "payment" as const, status: "pending" as const, createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(), userName: "Marco B.",  userId: "USR-057", userWhatsapp: "393334455667", userCountry: "🇮🇩", amount: "$9.99", note: "Gold Room payment failed — card declined. Follow up to retry." },
  { id: "t-pay-2", type: "payment" as const, status: "pending" as const, createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), userName: "Aisha T.",  userId: "USR-093", userWhatsapp: "601112233445", userCountry: "🇲🇾", amount: "$4.99", note: "Ghost Suite payment failed — insufficient funds. Send reminder." },
];

export async function fetchServiceRequests() {
  if (!isConnected()) return MOCK_SERVICE_REQUESTS;
  const { data } = await ghostSupabase
    .from("ghost_service_requests")
    .select("*, ghost_profiles(display_name, connect_phone, country_flag)")
    .in("status", ["pending", "open"])
    .order("created_at", { ascending: false })
    .limit(100);
  if (!data || data.length === 0) return MOCK_SERVICE_REQUESTS;
  return data.map((r: any) => ({
    id: `svc-${r.id}`, type: "service" as const,
    status: (r.status === "done" ? "done" : "pending") as "pending" | "done",
    createdAt: r.created_at,
    serviceCategory: r.category || "",
    serviceEmoji: r.emoji || "🎁",
    providerName: r.provider_name || "",
    providerWhatsapp: r.provider_whatsapp || "",
    userName: r.ghost_profiles?.display_name || "Unknown",
    userId: r.ghost_id,
    userWhatsapp: r.ghost_profiles?.connect_phone,
    userCountry: r.ghost_profiles?.country_flag || "🌍",
    note: r.notes || "",
  }));
}

export async function resolveServiceRequest(id: string) {
  if (!isConnected()) return;
  const rawId = id.replace("svc-", "");
  await ghostSupabase.from("ghost_service_requests").update({ status: "done" }).eq("id", rawId);
}

export async function fetchFlagReports() {
  if (!isConnected()) return MOCK_FLAG_REPORTS;
  const { data } = await ghostSupabase
    .from("ghost_reports")
    .select("*, ghost_profiles!ghost_reports_reported_id_fkey(display_name, country_flag)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!data || data.length === 0) return MOCK_FLAG_REPORTS;
  return data.map((r: any) => ({
    id: `rep-${r.id}`, type: "report" as const, status: "pending" as const,
    createdAt: r.created_at,
    userName: r.ghost_profiles?.display_name || "Unknown",
    userId: r.reported_id,
    userCountry: r.ghost_profiles?.country_flag || "🌍",
    note: r.reason || r.description || "",
  }));
}

export async function fetchFailedPayments() {
  if (!isConnected()) return MOCK_FAILED_PAYMENTS;
  const { data } = await ghostSupabase
    .from("ghost_payments")
    .select("*, ghost_profiles(display_name, connect_phone, country_flag)")
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(50);
  if (!data || data.length === 0) return MOCK_FAILED_PAYMENTS;
  return data.map((r: any) => ({
    id: `pay-${r.id}`, type: "payment" as const, status: "pending" as const,
    createdAt: r.created_at,
    userName: r.ghost_profiles?.display_name || "Unknown",
    userId: r.ghost_id,
    userWhatsapp: r.ghost_profiles?.connect_phone,
    userCountry: r.ghost_profiles?.country_flag || "🌍",
    amount: `$${Number(r.amount_usd).toFixed(2)}`,
    note: `${r.package === "gold" ? "Gold Room" : "Ghost Suite"} payment failed — ${r.failure_reason || "card declined"}.`,
  }));
}

export async function logServiceRequest(req: {
  ghostId: string; providerId: string; providerName: string;
  providerWhatsapp: string; category: string; emoji: string; city: string; notes?: string;
}) {
  if (!isConnected()) return;
  await ghostSupabase.from("ghost_service_requests").insert({
    ghost_id:           req.ghostId,
    provider_id:        req.providerId,
    provider_name:      req.providerName,
    provider_whatsapp:  req.providerWhatsapp,
    category:           req.category,
    emoji:              req.emoji,
    city:               req.city,
    notes:              req.notes || "",
    status:             "pending",
    created_at:         new Date().toISOString(),
  });
}

// ── Realtime subscription helper ──────────────────────────────────────────────

export function subscribeToPayments(callback: (payload: any) => void) {
  if (!isConnected()) return () => {};
  const channel = ghostSupabase
    .channel("admin_payments")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "ghost_payments" }, callback)
    .subscribe();
  return () => ghostSupabase.removeChannel(channel);
}

export function subscribeToNewUsers(callback: (payload: any) => void) {
  if (!isConnected()) return () => {};
  const channel = ghostSupabase
    .channel("admin_new_users")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "ghost_profiles" }, callback)
    .subscribe();
  return () => ghostSupabase.removeChannel(channel);
}

// ── Butler Admin Messaging ─────────────────────────────────────────────────────
// Requires Supabase table (run once in SQL editor):
//   create table ghost_admin_messages (
//     id uuid primary key default gen_random_uuid(),
//     to_user_id text,          -- null = broadcast to all users
//     message text not null,
//     type text default 'dm',   -- 'dm' | 'broadcast'
//     active boolean default true,
//     created_at timestamptz default now(),
//     expires_at timestamptz
//   );

export interface AdminButlerMessage {
  id: string;
  to_user_id: string | null;
  message: string;
  type: "dm" | "broadcast";
  active: boolean;
  created_at: string;
  expires_at: string;
}

/** Send a Mr. Butlas message to one user (DM) or all users (broadcast, toUserId = null) */
export async function sendButlerMessage(
  toUserId: string | null,
  message: string,
  expiresInHours = 48,
): Promise<void> {
  const payload: Omit<AdminButlerMessage, "id"> = {
    to_user_id: toUserId,
    message,
    type: toUserId ? "dm" : "broadcast",
    active: true,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + expiresInHours * 3_600_000).toISOString(),
  };

  // Always write to localStorage so it works even without Supabase
  if (toUserId) {
    const key = `admin_butler_dm_${toUserId}`;
    try {
      const existing: AdminButlerMessage[] = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push({ ...payload, id: `local_${Date.now()}` });
      localStorage.setItem(key, JSON.stringify(existing.slice(-30)));
    } catch {}
  } else {
    try {
      localStorage.setItem(
        "admin_butler_broadcast",
        JSON.stringify({ ...payload, id: `bc_${Date.now()}` }),
      );
    } catch {}
  }

  if (!isConnected()) return;
  await ghostSupabase.from("ghost_admin_messages").insert(payload);
}

/** Fetch the most recent active broadcast (for all users to poll) */
export async function fetchActiveButlerBroadcast(): Promise<AdminButlerMessage | null> {
  // localStorage first
  try {
    const raw = localStorage.getItem("admin_butler_broadcast");
    if (raw) {
      const local: AdminButlerMessage = JSON.parse(raw);
      if (local.active && new Date(local.expires_at) > new Date()) return local;
    }
  } catch {}

  if (!isConnected()) return null;
  const { data } = await ghostSupabase
    .from("ghost_admin_messages")
    .select("*")
    .eq("type", "broadcast")
    .eq("active", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** Fetch DMs sent to a specific user by admin (userId = UserRow.id or ghost_id) */
export async function fetchButlerDMsForUser(userId: string): Promise<AdminButlerMessage[]> {
  // localStorage first
  try {
    const raw = localStorage.getItem(`admin_butler_dm_${userId}`);
    if (raw) {
      const local: AdminButlerMessage[] = JSON.parse(raw);
      const now = new Date();
      return local.filter((m) => m.active && new Date(m.expires_at) > now);
    }
  } catch {}

  if (!isConnected()) return [];
  const { data } = await ghostSupabase
    .from("ghost_admin_messages")
    .select("*")
    .eq("to_user_id", userId)
    .eq("type", "dm")
    .eq("active", true)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

/** Mark a broadcast as dismissed (per-device) */
export function dismissButlerBroadcast(id: string): void {
  try {
    const dismissed: string[] = JSON.parse(localStorage.getItem("admin_butler_dismissed") || "[]");
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem("admin_butler_dismissed", JSON.stringify(dismissed.slice(-50)));
    }
  } catch {}
}

export function isButlerBroadcastDismissed(id: string): boolean {
  try {
    const dismissed: string[] = JSON.parse(localStorage.getItem("admin_butler_dismissed") || "[]");
    return dismissed.includes(id);
  } catch { return false; }
}

// ── Admin: User control (Supabase-persisted) ───────────────────────────────────

/** Ban or unban a ghost user. Sets is_blocked on ghost_profiles. */
export async function banGhostUser(ghostId: string, ban: boolean): Promise<void> {
  if (!ghostId || !isConnected()) return;
  await ghostSupabase
    .from("ghost_profiles")
    .update({ is_blocked: ban, updated_at: new Date().toISOString() })
    .eq("ghost_id", ghostId);
}

/** Set coin balance directly (admin override). */
export async function setGhostCoins(ghostId: string, coins: number): Promise<void> {
  if (!ghostId || !isConnected()) return;
  await ghostSupabase
    .from("ghost_profiles")
    .update({ coin_balance: coins, updated_at: new Date().toISOString() })
    .eq("ghost_id", ghostId);
}

/** Override subscription tier (house_tier). */
export async function setGhostTier(ghostId: string, tier: string): Promise<void> {
  if (!ghostId || !isConnected()) return;
  await ghostSupabase
    .from("ghost_profiles")
    .update({ house_tier: tier, updated_at: new Date().toISOString() })
    .eq("ghost_id", ghostId);
}

/** Update display name and/or city (admin edit). */
export async function updateGhostProfile(
  ghostId: string,
  updates: { display_name?: string; city?: string },
): Promise<void> {
  if (!ghostId || !isConnected()) return;
  await ghostSupabase
    .from("ghost_profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("ghost_id", ghostId);
}

/** Approve a video verification — marks user as face_verified and sets status = verified. */
export async function approveGhostVerification(ghostId: string): Promise<void> {
  if (!ghostId || !isConnected()) return;
  await ghostSupabase
    .from("ghost_profiles")
    .update({ verification_status: "verified", face_verified: true, updated_at: new Date().toISOString() })
    .eq("ghost_id", ghostId);
  // Delete the verification video from storage to save space
  try {
    const { data: profile } = await ghostSupabase
      .from("ghost_profiles")
      .select("verification_video_url")
      .eq("ghost_id", ghostId)
      .maybeSingle();
    if (profile?.verification_video_url) {
      const path = profile.verification_video_url.split("/ghost-videos/").pop();
      if (path) await ghostSupabase.storage.from("ghost-videos").remove([path]);
    }
  } catch {}
}

/** Reject a video verification — marks status = rejected. */
export async function rejectGhostVerification(ghostId: string): Promise<void> {
  if (!ghostId || !isConnected()) return;
  await ghostSupabase
    .from("ghost_profiles")
    .update({ verification_status: "rejected", verification_video_url: null, updated_at: new Date().toISOString() })
    .eq("ghost_id", ghostId);
}

/** Fetch all profiles with verification_status = pending (for admin review queue). */
export async function fetchPendingVerifications(): Promise<PendingVerificationRow[]> {
  if (!isConnected()) return [];
  const { data } = await ghostSupabase
    .from("ghost_profiles")
    .select("ghost_id, display_name, country_flag, verification_video_url, updated_at")
    .eq("verification_status", "pending")
    .order("updated_at", { ascending: true })
    .limit(50);
  if (!data) return [];
  return data.map((r: any) => ({
    ghostId: r.ghost_id,
    name: r.display_name || "Unknown",
    country: r.country_flag || "🌍",
    videoUrl: r.verification_video_url || "",
    submittedAt: r.updated_at || "",
  }));
}

// ── Admin: Stripe / Payments ───────────────────────────────────────────────────

export interface StripeRevenueStats {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  totalTransactions: number;
  failedCount: number;
  refundedCount: number;
  goldCount: number;
  suiteCount: number;
  arpu: number;
}

export async function fetchStripeStats(): Promise<StripeRevenueStats> {
  if (!isConnected()) {
    return {
      totalRevenue: 4872.50, thisMonthRevenue: 1243.80, lastMonthRevenue: 987.40,
      totalTransactions: 318, failedCount: 12, refundedCount: 4,
      goldCount: 187, suiteCount: 131, arpu: 8.42,
    };
  }
  const now      = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [allPaid, thisMonth, lastMonth, failed, refunded] = await Promise.all([
    ghostSupabase.from("ghost_payments").select("amount_usd, package").eq("status", "paid"),
    ghostSupabase.from("ghost_payments").select("amount_usd").eq("status", "paid").gte("created_at", thisMonthStart),
    ghostSupabase.from("ghost_payments").select("amount_usd").eq("status", "paid").gte("created_at", lastMonthStart).lt("created_at", thisMonthStart),
    ghostSupabase.from("ghost_payments").select("id", { count: "exact" }).eq("status", "failed"),
    ghostSupabase.from("ghost_payments").select("id", { count: "exact" }).eq("status", "refunded"),
  ]);

  const paidRows   = allPaid.data || [];
  const totalRev   = paidRows.reduce((s: number, r: any) => s + Number(r.amount_usd), 0);
  const thisMRev   = (thisMonth.data || []).reduce((s: number, r: any) => s + Number(r.amount_usd), 0);
  const lastMRev   = (lastMonth.data || []).reduce((s: number, r: any) => s + Number(r.amount_usd), 0);
  const goldCount  = paidRows.filter((r: any) => r.package === "gold").length;
  const suiteCount = paidRows.filter((r: any) => r.package === "suite").length;
  const totalTxn   = paidRows.length;

  return {
    totalRevenue:      totalRev,
    thisMonthRevenue:  thisMRev,
    lastMonthRevenue:  lastMRev,
    totalTransactions: totalTxn,
    failedCount:       failed.count ?? 0,
    refundedCount:     refunded.count ?? 0,
    goldCount,
    suiteCount,
    arpu:              totalTxn > 0 ? Number((totalRev / totalTxn).toFixed(2)) : 0,
  };
}
