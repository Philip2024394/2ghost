// ── Affiliate system — data model + localStorage persistence ─────────────────
// All data lives in localStorage for now. Swap save*/load* fns with Supabase
// calls when ready — nothing else needs to change.

export type AffiliateStatus = "pending" | "active" | "paused";

export type Affiliate = {
  id: string;               // unique ref code, e.g. "BUDI123"
  name: string;
  email: string;
  whatsapp: string;
  status: AffiliateStatus;
  createdAt: number;
  commissionRate: number;   // percentage, default 25
};

export type ConversionType = "signup" | "suite" | "gold";

export type Conversion = {
  id: string;
  affiliateId: string;
  type: ConversionType;
  amountIdr: number;        // commission owed in IDR
  paidOut: boolean;
  createdAt: number;
};

export type Click = {
  id: string;
  affiliateId: string;
  createdAt: number;
};

export type Banner = {
  id: string;
  name: string;
  imageUrl: string;
  size: string;             // e.g. "1080×1080"
  addedAt: number;
};

// ── IDR commission amounts per conversion ─────────────────────────────────────
// Suite $9.99 ≈ 162,000 IDR · 25% = 40,500 IDR
// Gold  $9.99 ≈ 162,000 IDR · 25% = 40,500 IDR
export const COMMISSION: Record<ConversionType, number> = {
  signup: 0,
  suite:  40_500,
  gold:   40_500,
};

// ── Storage keys ──────────────────────────────────────────────────────────────
const KEYS = {
  affiliates:   "affiliate_list",
  conversions:  "affiliate_conversions",
  clicks:       "affiliate_clicks",
  banners:      "affiliate_banners",
  adminAuth:    "affiliate_admin_auth",
  capturedRef:  "ghost_affiliate_ref",
};

function loadJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") ?? fallback; } catch { return fallback; }
}
function saveJson<T>(key: string, val: T) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Affiliates ─────────────────────────────────────────────────────────────────
export function loadAffiliates(): Affiliate[] { return loadJson(KEYS.affiliates, []); }
export function saveAffiliates(list: Affiliate[]) { saveJson(KEYS.affiliates, list); }
export function getAffiliate(id: string): Affiliate | null {
  return loadAffiliates().find((a) => a.id === id) ?? null;
}
export function upsertAffiliate(a: Affiliate) {
  const list = loadAffiliates();
  const idx = list.findIndex((x) => x.id === a.id);
  if (idx >= 0) list[idx] = a; else list.push(a);
  saveAffiliates(list);
}

// ── Conversions ───────────────────────────────────────────────────────────────
export function loadConversions(): Conversion[] { return loadJson(KEYS.conversions, []); }
export function saveConversions(list: Conversion[]) { saveJson(KEYS.conversions, list); }
export function addConversion(c: Conversion) {
  saveConversions([...loadConversions(), c]);
}

// ── Clicks ────────────────────────────────────────────────────────────────────
export function loadClicks(): Click[] { return loadJson(KEYS.clicks, []); }
export function recordClick(affiliateId: string) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
  saveJson(KEYS.clicks, [...loadClicks(), { id, affiliateId, createdAt: Date.now() }]);
}

// ── Banners ───────────────────────────────────────────────────────────────────
export function loadBanners(): Banner[] { return loadJson(KEYS.banners, []); }
export function saveBanners(list: Banner[]) { saveJson(KEYS.banners, list); }

// ── Per-affiliate stats ───────────────────────────────────────────────────────
export function getAffiliateStats(id: string) {
  const convs   = loadConversions().filter((c) => c.affiliateId === id);
  const clicks  = loadClicks().filter((c) => c.affiliateId === id);
  const earned  = convs.reduce((s, c) => s + c.amountIdr, 0);
  const paid    = convs.filter((c) => c.paidOut).reduce((s, c) => s + c.amountIdr, 0);
  return {
    clicks:      clicks.length,
    signups:     convs.filter((c) => c.type === "signup").length,
    conversions: convs.filter((c) => c.type === "suite" || c.type === "gold").length,
    earned,
    paid,
    owed:        earned - paid,
  };
}

// ── Admin auth ────────────────────────────────────────────────────────────────
const ADMIN_PW = "ghost2025admin";
export function isAdminAuthed(): boolean {
  return localStorage.getItem(KEYS.adminAuth) === "yes";
}
export function adminLogin(pw: string): boolean {
  if (pw === ADMIN_PW) { localStorage.setItem(KEYS.adminAuth, "yes"); return true; }
  return false;
}
export function adminLogout() { localStorage.removeItem(KEYS.adminAuth); }

// ── Ref capture — store incoming ?ref= param across navigation ────────────────
export function captureRef(code: string) {
  const upper = code.toUpperCase();
  try { localStorage.setItem(KEYS.capturedRef, upper); } catch {}
  recordClick(upper);
}
export function getStoredRef(): string | null {
  try { return localStorage.getItem(KEYS.capturedRef); } catch { return null; }
}
export function clearStoredRef() {
  try { localStorage.removeItem(KEYS.capturedRef); } catch {}
}

// ── Code generator from name ───────────────────────────────────────────────────
export function generateCode(name: string): string {
  const base = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5) || "GHOST";
  const num  = String(Math.floor(Math.random() * 900) + 100);
  return base + num;
}

// ── Record a paid conversion (called from payment success page) ───────────────
export function recordConversion(type: ConversionType) {
  const ref = getStoredRef();
  if (!ref) return;
  const affiliate = getAffiliate(ref);
  if (!affiliate || affiliate.status !== "active") return;
  const rate = (affiliate.commissionRate ?? 25) / 100;
  const amountIdr = Math.round(COMMISSION[type] * rate / 25 * affiliate.commissionRate);
  addConversion({
    id:          `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    affiliateId: ref,
    type,
    amountIdr,
    paidOut:     false,
    createdAt:   Date.now(),
  });
}
