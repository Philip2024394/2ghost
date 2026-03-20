/**
 * 2Ghost — Lightweight client-side analytics tracker
 * Fires on every page navigation and tracks session duration.
 * Writes to Supabase; silently no-ops when not connected.
 */
import { ghostSupabase } from "../ghost/ghostSupabase";

const SESSION_KEY = "ghost_analytics_sid";
const GEO_CACHE   = "ghost_analytics_geo";

function isConnected(): boolean {
  const url = import.meta.env.VITE_GHOST_SUPABASE_URL as string | undefined;
  return !!url && !url.includes("placeholder");
}

// ── Session ID ─────────────────────────────────────────────────────────────

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// ── IP + Geo (cached per session) ─────────────────────────────────────────

interface GeoInfo {
  country: string;
  country_code: string;
  country_flag: string;
  city: string;
  ip: string;
  timezone: string;
}

const FLAG_MAP: Record<string, string> = {
  ID:"🇮🇩",PH:"🇵🇭",TH:"🇹🇭",SG:"🇸🇬",MY:"🇲🇾",VN:"🇻🇳",
  GB:"🇬🇧",AU:"🇦🇺",US:"🇺🇸",IE:"🇮🇪",FR:"🇫🇷",BE:"🇧🇪",
  DE:"🇩🇪",NL:"🇳🇱",CA:"🇨🇦",NZ:"🇳🇿",IN:"🇮🇳",JP:"🇯🇵",
  KR:"🇰🇷",HK:"🇭🇰",TW:"🇹🇼",CN:"🇨🇳",BR:"🇧🇷",MX:"🇲🇽",
};

async function getGeo(): Promise<GeoInfo> {
  const cached = sessionStorage.getItem(GEO_CACHE);
  if (cached) return JSON.parse(cached);

  try {
    const res  = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    const data = await res.json();
    const geo: GeoInfo = {
      country:      data.country_name || "Unknown",
      country_code: data.country_code || "XX",
      country_flag: FLAG_MAP[data.country_code] || "🌍",
      city:         data.city          || "Unknown",
      ip:           data.ip            || "0.0.0.0",
      timezone:     data.timezone      || "",
    };
    sessionStorage.setItem(GEO_CACHE, JSON.stringify(geo));
    return geo;
  } catch {
    return { country: "Unknown", country_code: "XX", country_flag: "🌍", city: "Unknown", ip: "0.0.0.0", timezone: "" };
  }
}

// ── Device / browser detection ─────────────────────────────────────────────

function getDevice(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Edg/"))     return "Edge";
  if (ua.includes("Chrome/"))  return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("OPR/"))     return "Opera";
  return "Other";
}

// ── Page view tracking ─────────────────────────────────────────────────────

let currentPageEntered = Date.now();
let currentPath        = "";
let currentPageId: string | null = null;

async function closeCurrentPage() {
  if (!currentPageId || !isConnected()) return;
  const duration = Math.round((Date.now() - currentPageEntered) / 1000);
  await ghostSupabase
    .from("ghost_analytics_pageviews")
    .update({ exited_at: new Date().toISOString(), duration_secs: duration })
    .eq("id", currentPageId)
    .catch(() => null);
}

function getPageLabel(path: string): string {
  const map: Record<string, string> = {
    "/ghost":            "Landing",
    "/ghost/auth":       "Sign Up / Login",
    "/ghost/gateway":    "Gateway",
    "/ghost/setup":      "Profile Setup",
    "/ghost/mode":       "Ghost Mode",
    "/ghost/mock":       "Browse Profiles",
    "/ghost/pricing":    "Pricing",
    "/ghost/block":      "Blocked",
    "/ghost/room":       "Ghost Room",
    "/ghost/map":        "Map",
    "/ghost/dashboard":  "Dashboard",
    "/ghost/butler":     "Butler",
  };
  return map[path] || path;
}

// ── Public API ─────────────────────────────────────────────────────────────

let sessionCreated = false;

export async function trackPageView(path: string) {
  if (!isConnected()) return;

  const sid = getSessionId();

  // Close the previous page timing
  await closeCurrentPage();

  currentPath        = path;
  currentPageEntered = Date.now();
  currentPageId      = null;

  try {
    const geo = await getGeo();

    // Create session row once per session
    if (!sessionCreated) {
      sessionCreated = true;
      const ghostId = (() => {
        try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}").id || null; } catch { return null; }
      })();
      await ghostSupabase.from("ghost_analytics_sessions").upsert({
        id:           sid,
        ghost_id:     ghostId,
        country:      geo.country,
        country_code: geo.country_code,
        country_flag: geo.country_flag,
        city:         geo.city,
        ip:           geo.ip,
        timezone:     geo.timezone,
        device:       getDevice(),
        browser:      getBrowser(),
        referrer:     document.referrer || null,
        started_at:   new Date().toISOString(),
        page_count:   0,
        duration_secs: 0,
      }, { onConflict: "id", ignoreDuplicates: true }).catch(() => null);
    }

    // Log page view
    const { data } = await ghostSupabase
      .from("ghost_analytics_pageviews")
      .insert({
        session_id:  sid,
        path,
        page_label:  getPageLabel(path),
        entered_at:  new Date().toISOString(),
        exited_at:   null,
        duration_secs: null,
      })
      .select("id")
      .single()
      .catch(() => ({ data: null })) as any;

    if (data?.id) currentPageId = data.id;

    // Increment session page count
    await ghostSupabase.rpc("increment_session_pages", { sid }).catch(() => null);

  } catch { /* silent */ }
}

// Close current page + update total session duration on tab close / navigate away
export function flushSession() {
  if (!isConnected() || !currentPageId) return;
  const sid = getSessionId();
  const duration = Math.round((Date.now() - currentPageEntered) / 1000);

  // Use sendBeacon for reliability on page unload
  const url   = import.meta.env.VITE_GHOST_SUPABASE_URL as string;
  const key   = import.meta.env.VITE_GHOST_SUPABASE_ANON_KEY as string;
  const table = `${url}/rest/v1/ghost_analytics_pageviews`;

  navigator.sendBeacon?.(
    `${table}?id=eq.${currentPageId}`,
    JSON.stringify({ exited_at: new Date().toISOString(), duration_secs: duration })
  );

  // Also update session total duration
  ghostSupabase
    .from("ghost_analytics_sessions")
    .update({ ended_at: new Date().toISOString(), duration_secs: Math.round((Date.now() - currentPageEntered) / 1000) })
    .eq("id", sid)
    .catch(() => null);
}

export { getSessionId };
