import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Heart, X, MessageCircle, Settings, Navigation, Globe, Clock, Gift, Check, Eye, Moon, Zap, LogOut, SlidersHorizontal, LayoutDashboard } from "lucide-react";
import { PHONE_APPS, getUsernamePlatform } from "../data/connectPlatforms";
import { useNavigate } from "react-router-dom";

const SHIELD_LOGO = "https://ik.imagekit.io/7grri5v7d/Ghostly%20figure%20with%20a%20glowing%20shield.png";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";
import { generateIndonesianProfiles } from "@/data/indonesianProfiles";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { useGhostMode } from "../hooks/useGhostMode";
import { WORLD_COUNTRIES } from "../data/worldCountries";
import GhostInstallBanner from "../components/GhostInstallBanner";

type GhostProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  countryFlag: string;
  image: string;
  last_seen_at?: string | null;
  gender: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  lastActiveHoursAgo?: number; // 24h active window
  isVerified?: boolean;
  bio?: string | null;
  interests?: string[] | null;
  connectPhone?: string | null;
  connectAlt?: string | null;
  connectAltHandle?: string | null;
};

type GhostMatch = {
  id: string;
  profile: GhostProfile;
  matchedAt: number;
};

const MATCH_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

function loadMatches(): GhostMatch[] {
  try {
    const raw = localStorage.getItem("ghost_matches");
    if (!raw) return [];
    const all: GhostMatch[] = JSON.parse(raw);
    return all.filter((m) => Date.now() - m.matchedAt < MATCH_EXPIRY_MS);
  } catch { return []; }
}
function persistMatches(matches: GhostMatch[]) {
  try { localStorage.setItem("ghost_matches", JSON.stringify(matches)); } catch {}
}
function matchCountdown(matchedAt: number): string {
  const remaining = matchedAt + MATCH_EXPIRY_MS - Date.now();
  if (remaining <= 0) return "Expired";
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}
// Deterministic "hours since active" from profile id (0–28h range)
function activeHoursAgo(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
  return Math.abs(h) % 29; // ~83% within 24h
}

// Inbound like notification (simulated cross-country interest)
type InboundLike = {
  id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  countryFlag: string;
  image: string;
};

type GenderFilter = "all" | "Female" | "Male";
type KmFilter = 5 | 10 | 25 | 50 | 9999;

// Ghost House tier — deterministic from profile id
// ~5% Ghost Black (elite), ~12% Ghost House (member)
function profileHouseTier(id: string): "black" | "house" | null {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(53, h) + id.charCodeAt(i) | 0; }
  const n = Math.abs(h) % 100;
  if (n < 5)  return "black";
  if (n < 17) return "house";
  return null;
}

// Midnight timestamp for tonight mode expiry
function tonightMidnight(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
// ~30% of profiles deterministically show "Tonight" available
function isProfileTonight(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(47, h) + id.charCodeAt(i) | 0; }
  return Math.abs(h) % 10 < 3;
}
// ~20% of profiles are in Flash pool at any given time
function isFlashProfile(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(59, h) + id.charCodeAt(i) | 0; }
  return Math.abs(h) % 5 === 0;
}
// MM:SS countdown for Flash window
function fmtFlashTime(until: number): string {
  const ms = Math.max(0, until - Date.now());
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
// Format remaining time
function fmtRemaining(until: number): string {
  const ms = until - Date.now();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Flag / Report helpers ────────────────────────────────────────────────────
function getFlaggedProfiles(): Record<string, { reason: string; at: number }> {
  try { return JSON.parse(localStorage.getItem("ghost_flagged_profiles") || "{}"); } catch { return {}; }
}
function saveFlaggedProfiles(obj: Record<string, { reason: string; at: number }>) {
  try { localStorage.setItem("ghost_flagged_profiles", JSON.stringify(obj)); } catch {}
}

// ── International mock Ghost profiles ───────────────────────────────────────
const INTL_PROFILES: GhostProfile[] = [
  { id: "intl-1",  name: "Aoife",    age: 26, city: "Dublin",      country: "Ireland",        countryFlag: "🇮🇪", image: "https://i.pravatar.cc/400?img=47", gender: "Female", last_seen_at: null },
  { id: "intl-2",  name: "Callum",   age: 29, city: "London",      country: "United Kingdom", countryFlag: "🇬🇧", image: "https://i.pravatar.cc/400?img=12", gender: "Male",   last_seen_at: null },
  { id: "intl-3",  name: "Emma",     age: 24, city: "Amsterdam",   country: "Netherlands",    countryFlag: "🇳🇱", image: "https://i.pravatar.cc/400?img=48", gender: "Female", last_seen_at: null },
  { id: "intl-4",  name: "Liam",     age: 31, city: "Melbourne",   country: "Australia",      countryFlag: "🇦🇺", image: "https://i.pravatar.cc/400?img=15", gender: "Male",   last_seen_at: null },
  { id: "intl-5",  name: "Priya",    age: 27, city: "Singapore",   country: "Singapore",      countryFlag: "🇸🇬", image: "https://i.pravatar.cc/400?img=44", gender: "Female", last_seen_at: null },
  { id: "intl-6",  name: "Marcus",   age: 28, city: "Toronto",     country: "Canada",         countryFlag: "🇨🇦", image: "https://i.pravatar.cc/400?img=18", gender: "Male",   last_seen_at: null },
  { id: "intl-7",  name: "Yuki",     age: 25, city: "Tokyo",       country: "Japan",          countryFlag: "🇯🇵", image: "https://i.pravatar.cc/400?img=49", gender: "Female", last_seen_at: null },
  { id: "intl-8",  name: "Sofia",    age: 23, city: "Madrid",      country: "Spain",          countryFlag: "🇪🇸", image: "https://i.pravatar.cc/400?img=43", gender: "Female", last_seen_at: null },
  { id: "intl-9",  name: "Ahmed",    age: 30, city: "Dubai",       country: "United Arab Emirates", countryFlag: "🇦🇪", image: "https://i.pravatar.cc/400?img=13", gender: "Male", last_seen_at: null },
  { id: "intl-10", name: "Chloe",    age: 26, city: "Paris",       country: "France",         countryFlag: "🇫🇷", image: "https://i.pravatar.cc/400?img=46", gender: "Female", last_seen_at: null },
  { id: "intl-11", name: "Noah",     age: 27, city: "New York",    country: "United States",  countryFlag: "🇺🇸", image: "https://i.pravatar.cc/400?img=16", gender: "Male",   last_seen_at: null },
  { id: "intl-12", name: "Fatima",   age: 24, city: "Kuala Lumpur",country: "Malaysia",       countryFlag: "🇲🇾", image: "https://i.pravatar.cc/400?img=45", gender: "Female", last_seen_at: null },
  { id: "intl-13", name: "Lars",     age: 32, city: "Stockholm",   country: "Sweden",         countryFlag: "🇸🇪", image: "https://i.pravatar.cc/400?img=17", gender: "Male",   last_seen_at: null },
  { id: "intl-14", name: "Aisha",    age: 25, city: "Lagos",       country: "Nigeria",        countryFlag: "🇳🇬", image: "https://i.pravatar.cc/400?img=42", gender: "Female", last_seen_at: null },
  { id: "intl-15", name: "Daniel",   age: 29, city: "Berlin",      country: "Germany",        countryFlag: "🇩🇪", image: "https://i.pravatar.cc/400?img=14", gender: "Male",   last_seen_at: null },
  { id: "intl-16", name: "Mei",      age: 23, city: "Manila",      country: "Philippines",    countryFlag: "🇵🇭", image: "https://i.pravatar.cc/400?img=50", gender: "Female", last_seen_at: null },
  { id: "intl-17", name: "James",    age: 33, city: "Cape Town",   country: "South Africa",   countryFlag: "🇿🇦", image: "https://i.pravatar.cc/400?img=11", gender: "Male",   last_seen_at: null },
  { id: "intl-18", name: "Amara",    age: 26, city: "Accra",       country: "Ghana",          countryFlag: "🇬🇭", image: "https://i.pravatar.cc/400?img=41", gender: "Female", last_seen_at: null },
];

// Pool of demo inbound likes from random countries
const DEMO_INBOUND: InboundLike[] = [
  { id: "ib-1", name: "Connor",  age: 28, city: "Cork",       country: "Ireland",       countryFlag: "🇮🇪", image: "https://i.pravatar.cc/400?img=22" },
  { id: "ib-2", name: "Sophie",  age: 25, city: "London",     country: "United Kingdom",countryFlag: "🇬🇧", image: "https://i.pravatar.cc/400?img=39" },
  { id: "ib-3", name: "Jake",    age: 30, city: "Sydney",     country: "Australia",     countryFlag: "🇦🇺", image: "https://i.pravatar.cc/400?img=21" },
  { id: "ib-4", name: "Hana",    age: 24, city: "Osaka",      country: "Japan",         countryFlag: "🇯🇵", image: "https://i.pravatar.cc/400?img=38" },
  { id: "ib-5", name: "Carlos",  age: 27, city: "São Paulo",  country: "Brazil",        countryFlag: "🇧🇷", image: "https://i.pravatar.cc/400?img=20" },
];

// ── Haversine distance (km) ─────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Deterministic reveal data from profile id
function profileLikesCount(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(37, h) + id.charCodeAt(i) | 0; }
  return 5 + Math.abs(h) % 196; // 5–200
}
function profileActivity(id: string): { label: string; pct: number; color: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(41, h) + id.charCodeAt(i) | 0; }
  const lvl = Math.abs(h) % 4;
  return [
    { label: "Rarely",    pct: 18,  color: "#6b7280" },
    { label: "Sometimes", pct: 45,  color: "#f59e0b" },
    { label: "Often",     pct: 72,  color: "#22c55e" },
    { label: "Daily",     pct: 95,  color: "#4ade80" },
  ][lvl];
}

// Deterministic Ghost-XXXX code from profile id — same id always same code
function toGhostId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
  return `Ghost-${1000 + Math.abs(h) % 9000}`;
}

function fmtKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// ~65% of mock profiles are verified (deterministic by id)
function profileIsVerified(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(17, h) + id.charCodeAt(i) | 0; }
  return Math.abs(h) % 100 < 65;
}

// ── Floating ghost particles ────────────────────────────────────────────────
function GhostParticles() {
  const particles = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 4,
      duration: 5 + Math.random() * 4,
      size: 10 + Math.random() * 14,
    }))
  ).current;
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0, opacity: 0.12 }}>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: "105%", opacity: 0.6 }}
          animate={{ y: "-10%", opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut", repeat: Infinity, repeatDelay: Math.random() * 3 }}
          style={{ position: "absolute", left: `${p.left}%`, bottom: 0, display: "block" }}
        >
          <img src={GHOST_LOGO} alt="ghost" style={{ width: p.size * 3, height: p.size * 3, objectFit: "contain" }} />
        </motion.span>
      ))}
    </div>
  );
}

// ── Filter bar ──────────────────────────────────────────────────────────────
function FilterBar({
  gender, setGender,
  ageMin, ageMax, setAgeMin, setAgeMax,
  maxKm, setMaxKm,
  locationLoading, hasLocation, onRequestLocation,
  filterCountry, setFilterCountry,
  onlineOnly, setOnlineOnly,
  lookingFor, setLookingFor,
}: {
  gender: GenderFilter; setGender: (g: GenderFilter) => void;
  ageMin: number; ageMax: number;
  setAgeMin: (v: number) => void; setAgeMax: (v: number) => void;
  maxKm: KmFilter; setMaxKm: (v: KmFilter) => void;
  locationLoading: boolean; hasLocation: boolean;
  onRequestLocation: () => void;
  filterCountry: string; setFilterCountry: (c: string) => void;
  onlineOnly: boolean; setOnlineOnly: (v: boolean) => void;
  lookingFor: string; setLookingFor: (v: string) => void;
}) {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const filteredCountries = WORLD_COUNTRIES.filter((c) =>
    countryQuery.length === 0 || c.name.toLowerCase().includes(countryQuery.toLowerCase())
  );
  const KM_OPTIONS: { label: string; value: KmFilter }[] = [
    { label: "5 km", value: 5 },
    { label: "10 km", value: 10 },
    { label: "25 km", value: 25 },
    { label: "50 km", value: 50 },
    { label: "Any", value: 9999 },
  ];

  const S = {
    label: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "0 0 8px" },
    divider: { height: 1, background: "rgba(255,255,255,0.05)", margin: "16px 0" },
    chip: (active: boolean): React.CSSProperties => ({
      flex: 1, height: 34, borderRadius: 10, border: "none",
      background: active ? "linear-gradient(135deg, #16a34a, #22c55e)" : "rgba(255,255,255,0.06)",
      color: active ? "#fff" : "rgba(255,255,255,0.45)",
      fontSize: 12, fontWeight: 700, cursor: "pointer",
    }),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* ── Gender ── */}
      <p style={S.label}>Show me</p>
      <div style={{ display: "flex", gap: 6 }}>
        {(["all", "Female", "Male"] as GenderFilter[]).map((g) => (
          <button key={g} onClick={() => setGender(g)} style={S.chip(gender === g)}>
            {g === "all" ? "Everyone" : g === "Female" ? "👩 Women" : "👨 Men"}
          </button>
        ))}
      </div>

      <div style={S.divider} />

      {/* ── Age range ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ ...S.label, margin: 0 }}>Age range</p>
        <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(74,222,128,0.9)" }}>{ageMin} – {ageMax} yrs</span>
      </div>
      <div style={{ position: "relative", height: 24, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }} />
        <div style={{ position: "absolute", left: `${((ageMin - 18) / (60 - 18)) * 100}%`, right: `${100 - ((ageMax - 18) / (60 - 18)) * 100}%`, height: 4, background: "linear-gradient(90deg, #16a34a, #4ade80)", borderRadius: 2 }} />
        <input type="range" min={18} max={60} value={ageMin} onChange={(e) => { const v = parseInt(e.target.value); if (v < ageMax - 1) setAgeMin(v); }} style={{ position: "absolute", width: "100%", opacity: 0, cursor: "pointer", height: 24, zIndex: 2 }} />
        <input type="range" min={18} max={60} value={ageMax} onChange={(e) => { const v = parseInt(e.target.value); if (v > ageMin + 1) setAgeMax(v); }} style={{ position: "absolute", width: "100%", opacity: 0, cursor: "pointer", height: 24, zIndex: 3 }} />
        <div style={{ position: "absolute", left: `calc(${((ageMin - 18) / (60 - 18)) * 100}% - 9px)`, width: 18, height: 18, borderRadius: "50%", background: "#22c55e", border: "2px solid #050508", boxShadow: "0 0 10px rgba(34,197,94,0.5)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: `calc(${((ageMax - 18) / (60 - 18)) * 100}% - 9px)`, width: 18, height: 18, borderRadius: "50%", background: "#22c55e", border: "2px solid #050508", boxShadow: "0 0 10px rgba(34,197,94,0.5)", pointerEvents: "none" }} />
      </div>

      <div style={S.divider} />

      {/* ── Distance ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={{ ...S.label, margin: 0 }}>Distance</p>
        <button onClick={onRequestLocation} style={{ height: 26, paddingInline: 10, borderRadius: 8, border: hasLocation ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.1)", background: hasLocation ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)", color: hasLocation ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Navigation size={10} /> {locationLoading ? "..." : hasLocation ? "📍 GPS On" : "Enable GPS"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {KM_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setMaxKm(opt.value)} style={{ flex: 1, height: 32, borderRadius: 9, border: maxKm === opt.value ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.07)", background: maxKm === opt.value ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)", color: maxKm === opt.value ? "rgba(74,222,128,0.95)" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {opt.label}
          </button>
        ))}
      </div>

      <div style={S.divider} />

      {/* ── Country ── */}
      <p style={S.label}>Country</p>
      <div style={{ position: "relative" }}>
        <button onClick={() => setShowCountryPicker(!showCountryPicker)} style={{ width: "100%", height: 38, borderRadius: 10, cursor: "pointer", background: filterCountry ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)", border: filterCountry ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.08)", color: filterCountry ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={13} />
            <span>{filterCountry ? `${WORLD_COUNTRIES.find(c => c.name === filterCountry)?.flag} ${filterCountry}` : "All Countries"}</span>
          </div>
          <span style={{ fontSize: 10, opacity: 0.4 }}>{showCountryPicker ? "▲" : "▼"}</span>
        </button>
        {showCountryPicker && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100, background: "rgba(8,8,14,0.99)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <input autoFocus placeholder="Search country..." value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} style={{ width: "100%", height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 12, padding: "0 10px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ maxHeight: 180, overflowY: "auto" }}>
              <button onClick={() => { setFilterCountry(""); setShowCountryPicker(false); setCountryQuery(""); }} style={{ width: "100%", padding: "9px 12px", background: !filterCountry ? "rgba(74,222,128,0.1)" : "none", border: "none", color: !filterCountry ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.5)", fontSize: 12, textAlign: "left", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 8 }}>
                <Globe size={13} /> All Countries
              </button>
              {filteredCountries.map((c) => (
                <button key={c.code} onClick={() => { setFilterCountry(c.name); setShowCountryPicker(false); setCountryQuery(""); }} style={{ width: "100%", padding: "9px 12px", background: filterCountry === c.name ? "rgba(74,222,128,0.1)" : "none", border: "none", color: filterCountry === c.name ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.65)", fontSize: 12, textAlign: "left", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{c.flag}</span> {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={S.divider} />

      {/* ── Online status ── */}
      <p style={S.label}>Availability</p>
      <div style={{ display: "flex", gap: 6 }}>
        {[{ val: false, label: "🌐 All Members" }, { val: true, label: "🟢 Online Now" }].map(({ val, label }) => (
          <button key={String(val)} onClick={() => setOnlineOnly(val)} style={S.chip(onlineOnly === val)}>
            {label}
          </button>
        ))}
      </div>

      <div style={S.divider} />

      {/* ── Looking for ── */}
      <p style={S.label}>Looking for</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { val: "all",         label: "✨ Open to all"    },
          { val: "relationship",label: "💍 Relationship"   },
          { val: "casual",      label: "🌊 Casual dating"  },
          { val: "friends",     label: "🤝 Just friends"   },
          { val: "tonight",     label: "🌙 Free tonight"   },
          { val: "travel",      label: "✈️ Travel partner" },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setLookingFor(val)} style={{ ...S.chip(lookingFor === val), height: 38, fontSize: 11 }}>
            {label}
          </button>
        ))}
      </div>

    </div>
  );
}

// ── Profile popup overlay ───────────────────────────────────────────────────
function GhostProfilePopup({
  profile, liked, onLike, onClose, onPass,
}: {
  profile: GhostProfile; liked: boolean; onLike: () => void; onClose: () => void; onPass: () => void;
}) {
  const online = isOnline(profile.last_seen_at);
  const ghostId = toGhostId(profile.id);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 320,
          background: "rgba(8,8,12,0.92)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 22, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #16a34a)" }} />
        <div style={{ position: "relative" }}>
          <img
            src={profile.image} alt={ghostId}
            style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", display: "block" }}
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)" }} />

          {/* Ghost badge */}
          <div style={{
            position: "absolute", top: 12, left: 12,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            borderRadius: 20, padding: "4px 10px",
            border: "1px solid rgba(74,222,128,0.3)",
            fontSize: 10, fontWeight: 700, color: "rgba(74,222,128,0.9)", letterSpacing: "0.1em",
          }}><img src={GHOST_LOGO} alt="" style={{ width: 30, height: 30, objectFit: "contain", verticalAlign: "middle", marginRight: 6 }} /> GHOST</div>

          {/* Online */}
          {online && (
            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.8)", display: "block" }} />
              <span style={{ fontSize: 10, color: "rgba(74,222,128,0.9)", fontWeight: 600 }}>Online</span>
            </div>
          )}

          {/* Ghost ID / age / city */}
          <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "rgba(74,222,128,0.9)", margin: 0, letterSpacing: "0.06em" }}>
                <span>{ghostId}</span>
              </p>
              {profile.isVerified && (
                <span style={{
                  fontSize: 10, fontWeight: 800, background: "rgba(74,222,128,0.2)",
                  border: "1px solid rgba(74,222,128,0.5)", borderRadius: 5,
                  padding: "1px 6px", color: "rgba(74,222,128,0.95)",
                }}>✅ Verified</span>
              )}
            </div>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 4px", textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
              <span>{profile.age} · {profile.gender === "Female" ? "Woman" : "Man"}</span>
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 13 }}>{profile.countryFlag}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{profile.city}</span>
              </div>
              {profile.distanceKm !== undefined ? (
                <span style={{
                  background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)",
                  borderRadius: 6, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                  color: "rgba(74,222,128,0.9)",
                }}>
                  📍 {fmtKm(profile.distanceKm)}
                </span>
              ) : (
                <span style={{
                  background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "1px 6px",
                  fontSize: 10, color: "rgba(255,255,255,0.45)",
                }}>
                  {profile.country}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: "10px 16px 6px", textAlign: "center" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: "0.05em" }}>
            No bio · No details · Match on instinct
          </p>
        </div>

        <div style={{ padding: "10px 20px 20px", display: "flex", gap: 12 }}>
          <button
            onClick={onPass}
            style={{
              flex: 1, height: 48, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <X size={16} /> Pass
          </button>
          <button
            onClick={onLike} disabled={liked}
            style={{
              flex: 2, height: 48, borderRadius: 14, border: "none",
              background: liked ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #16a34a, #22c55e)",
              color: liked ? "#4ade80" : "#fff",
              fontSize: 13, fontWeight: 800, cursor: liked ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: liked ? "none" : "0 4px 18px rgba(34,197,94,0.4)", transition: "all 0.2s",
            }}
          >
            <Heart size={16} fill={liked ? "currentColor" : "none"} />
            {liked ? "Liked ✓" : "Like"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Match popup ─────────────────────────────────────────────────────────────
function GhostMatchPopup({ profile, onClose, isSubscribed, onConnectWhatsApp }: {
  profile: GhostProfile;
  onClose: () => void;
  isSubscribed: boolean;
  onConnectWhatsApp: () => void;
}) {
  const firstName = profile.name.split(" ")[0];
  const ghostId = toGhostId(profile.id);
  const altPlatform = profile.connectAlt ? getUsernamePlatform(profile.connectAlt) : undefined;
  const hasPhone = !!profile.connectPhone;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px",
      }}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{
          width: "100%", maxWidth: 340, textAlign: "center",
          background: "rgba(8,8,12,0.95)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 22, border: "1px solid rgba(74,222,128,0.2)", overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #16a34a)" }} />
        <div style={{ padding: "28px 24px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", border: "2px solid rgba(74,222,128,0.5)", overflow: "hidden", zIndex: 2, boxShadow: "0 0 20px rgba(74,222,128,0.3)" }}>
              <img src={profile.image} alt={firstName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ width: 40, height: 40, borderRadius: "50%", zIndex: 3, marginLeft: -12, background: "linear-gradient(135deg, #16a34a, #22c55e)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(34,197,94,0.5)" }}>
              <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain" }} />
            </div>
          </div>

          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 2px", letterSpacing: "0.05em" }}>
            <span>{ghostId} is revealed as</span>
          </p>
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(74,222,128,0.8)", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 4px" }}>Ghost Match</p>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px", background: "linear-gradient(135deg, #4ade80, #22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            <span>{firstName}! 🎉</span>
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>
            <span>{profile.age} · {profile.city} {profile.countryFlag}</span>
          </p>

          {/* Interests */}
          {profile.interests && profile.interests.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 4, margin: "8px 0 12px" }}>
              {profile.interests.map((tag) => (
                <span key={tag} style={{ fontSize: 10, fontWeight: 700, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 50, padding: "2px 8px", color: "rgba(74,222,128,0.8)" }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {isSubscribed ? (
            <>
              {/* ── SUBSCRIBER: show all available connect options ── */}
              <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "12px 0 10px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Reach {firstName} on
              </p>

              {hasPhone && (
                <>
                  {/* Phone-based apps — all work from one number */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 10 }}>
                    {PHONE_APPS.map((app) => (
                      <motion.button
                        key={app.key}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => {
                          const link = app.getLink(profile.connectPhone!);
                          window.open(link, "_blank");
                          onConnectWhatsApp();
                        }}
                        style={{
                          height: 44, borderRadius: 12, padding: "0 14px",
                          background: "rgba(255,255,255,0.05)", border: `1px solid ${app.color}30`,
                          color: app.color, fontWeight: 800, fontSize: 13, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{app.emoji}</span>
                        <span>{app.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </>
              )}

              {/* Username-based alt platform */}
              {altPlatform && profile.connectAltHandle && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (altPlatform.getLink) {
                      window.open(altPlatform.getLink(profile.connectAltHandle!), "_blank");
                    } else {
                      navigator.clipboard?.writeText(profile.connectAltHandle!);
                    }
                    onConnectWhatsApp();
                  }}
                  style={{
                    width: "100%", height: 46, borderRadius: 12, border: `1px solid ${altPlatform.color}40`,
                    background: "rgba(255,255,255,0.04)", color: altPlatform.color,
                    fontWeight: 800, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{altPlatform.emoji}</span>
                  <span>{altPlatform.label} · {profile.connectAltHandle}</span>
                  {!altPlatform.getLink && <span style={{ fontSize: 10, opacity: 0.6 }}>tap to copy</span>}
                </motion.button>
              )}

              {!hasPhone && !altPlatform && (
                <button
                  onClick={onConnectWhatsApp}
                  style={{ width: "100%", height: 48, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 24px rgba(34,197,94,0.4)" }}
                >
                  <MessageCircle size={18} /> Connect Now
                </button>
              )}
            </>
          ) : (
            <>
              {/* ── FREE USER: show which apps this person uses, paywall to unlock ── */}
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "12px 0 10px", lineHeight: 1.5 }}>
                Unlock to connect. {firstName} is reachable on:
              </p>
              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {hasPhone && PHONE_APPS.map((app) => (
                  <span key={app.key} style={{ fontSize: 18, padding: 4, background: "rgba(255,255,255,0.04)", borderRadius: 8, border: `1px solid ${app.color}25` }} title={app.label}>
                    {app.emoji}
                  </span>
                ))}
                {altPlatform && (
                  <span style={{ fontSize: 18, padding: 4, background: "rgba(255,255,255,0.04)", borderRadius: 8, border: `1px solid ${altPlatform.color}25` }} title={altPlatform.label}>
                    {altPlatform.emoji}
                  </span>
                )}
              </div>
              <button
                onClick={onConnectWhatsApp}
                style={{ width: "100%", height: 48, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 24px rgba(34,197,94,0.4)" }}
              >
                <MessageCircle size={18} /> Unlock to Connect
              </button>
            </>
          )}

          <button onClick={onClose} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer" }}>
            Keep browsing
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Inbound like notification popup ─────────────────────────────────────────
function InboundLikePopup({
  like, onLikeBack, onPass,
}: {
  like: InboundLike;
  onLikeBack: () => void;
  onPass: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px",
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        style={{
          width: "100%", maxWidth: 360,
          background: "rgba(6,6,10,0.95)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 22, border: "1px solid rgba(74,222,128,0.25)",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(74,222,128,0.1)",
        }}
      >
        {/* Top accent */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #22c55e, #4ade80, #22c55e)" }} />

        <div style={{ padding: "22px 20px 20px" }}>
          {/* Flag + country badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{
              background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: 20, padding: "4px 14px",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, fontWeight: 700, color: "rgba(74,222,128,0.9)",
            }}>
              <span style={{ fontSize: 20 }}>{like.countryFlag}</span>
              Someone from {like.country} is interested
            </div>
          </div>

          {/* Anonymous blurred photo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div style={{
              width: 90, height: 90, borderRadius: "50%", overflow: "hidden",
              border: "3px solid rgba(74,222,128,0.4)",
              boxShadow: "0 0 24px rgba(74,222,128,0.2)",
              position: "relative",
            }}>
              <img
                src={like.image} alt="Anonymous"
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(10px) brightness(0.7)" }}
              />
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              }}><img src={GHOST_LOGO} alt="ghost" style={{ width: 96, height: 96, objectFit: "contain" }} /></div>
            </div>
          </div>

          {/* Info */}
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(74,222,128,0.85)", margin: "0 0 4px", letterSpacing: "0.05em" }}>
              <span>{toGhostId(like.id)}</span>
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 6px" }}>
              <span>{like.age} · {like.city}, {like.country} {like.countryFlag}</span>
            </p>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: "0 0 10px" }}>
              <span>A Ghost Has Appeared — and liked you</span>
            </h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>
              <span>Like back to reveal their real name and connect — or pass.</span>
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onPass}
              style={{
                flex: 1, height: 48, borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <X size={15} /> Pass
            </button>
            <button
              onClick={onLikeBack}
              style={{
                flex: 2, height: 48, borderRadius: 14, border: "none",
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: "0 4px 20px rgba(34,197,94,0.4)",
              }}
            >
              <Heart size={15} fill="currentColor" /> Like Back
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Mock one-line bios (deterministic per profile id) ────────────────────────
const MOCK_BIOS = [
  "Here for a real conversation, not a highlight reel.",
  "Quiet person looking for someone louder than me.",
  "Cafés, late nights, and zero small talk.",
  "Still figuring it out — maybe you can help.",
  "Serious about the right person. Casual about everything else.",
  "I'll tell you my name when it feels right.",
  "Looking for someone to get lost with.",
  "Bad at bios. Good at showing up.",
  "Not here to swipe. Here to actually meet.",
  "More interesting in person than on paper.",
  "Fluent in silence and sarcasm.",
  "Tired of apps. Giving this one last try.",
  "Looking for low drama, high chemistry.",
  "Let's skip the small talk — ask me anything.",
  "Simple life. Deep conversations.",
  "I make good coffee. That's a start.",
  "Looking for my person, not my audience.",
  "Will match, then probably overthink it.",
];
function mockBio(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(61, h) + id.charCodeAt(i) | 0; }
  return MOCK_BIOS[Math.abs(h) % MOCK_BIOS.length];
}

// ── Profile mini card ───────────────────────────────────────────────────────
function GhostCard({
  profile, liked, onClick, isRevealed, onReveal, canReveal, isTonight, houseTier,
  isFlagged, onFlagOpen,
}: {
  profile: GhostProfile; liked: boolean; onClick: () => void;
  isRevealed: boolean; onReveal: () => void; canReveal: boolean;
  isTonight?: boolean; houseTier?: "black" | "house" | null;
  isFlagged?: boolean; onFlagOpen?: () => void;
}) {
  const online = isOnline(profile.last_seen_at);
  const ghostId = toGhostId(profile.id);
  const [flipped, setFlipped] = useState(false);

  // When revealed externally, flip the card
  const handleRevealClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canReveal && !isRevealed) return;
    onReveal();
    setFlipped(true);
  };

  const activity = profileActivity(profile.id);
  const likesCount = profileLikesCount(profile.id);

  // Read outcome from mock ghost_profile (for demo, vary by id hash)
  const OUTCOME_TAGS = ["Serious", "Casual", "Discreet", "Open", "Friendship", "Adventurous", "Exploring", "Free Spirit"];
  const OUTCOME_ICONS = ["💍", "🤝", "🤫", "🔓", "🌱", "🔥", "🌀", "🕊️"];
  let oh = 0;
  for (let i = 0; i < profile.id.length; i++) { oh = Math.imul(43, oh) + profile.id.charCodeAt(i) | 0; }
  const outcomeIdx = Math.abs(oh) % OUTCOME_TAGS.length;
  const outcomeTag = OUTCOME_TAGS[outcomeIdx];
  const outcomeIcon = OUTCOME_ICONS[outcomeIdx];

  return (
    <div style={{ borderRadius: 16, position: "relative", perspective: 800, aspectRatio: "3/4" }}>
      {/* Tonight pulsing ring behind card */}
      {isTonight && !flipped && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: "absolute", inset: -3, borderRadius: 18,
            border: "2px solid rgba(74,222,128,0.6)",
            boxShadow: "0 0 12px rgba(74,222,128,0.4)",
            pointerEvents: "none", zIndex: 10,
          }}
        />
      )}

      {/* ── Front face ── */}
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          borderRadius: 16, overflow: "hidden", cursor: "pointer",
          border: isTonight ? "1.5px solid rgba(74,222,128,0.5)" : liked ? "1.5px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.07)",
          boxShadow: isTonight ? "0 0 16px rgba(74,222,128,0.25)" : liked ? "0 0 14px rgba(74,222,128,0.2)" : undefined,
          background: "rgba(255,255,255,0.03)",
        }}
        onClick={flipped ? undefined : onClick}
        whileTap={flipped ? undefined : { scale: 0.97 }}
      >
        <img
          src={profile.image} alt={ghostId}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 55%)" }} />

        {/* Ghost badge */}
        <div style={{ position: "absolute", top: 7, left: 7, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "3px 7px", fontSize: 8, fontWeight: 700, color: "rgba(74,222,128,0.85)" }}>
          {isTonight ? "🌙 Tonight" : <img src={GHOST_LOGO} alt="ghost" style={{ width: 42, height: 42, objectFit: "contain" }} />}
        </div>

        {/* Online dot */}
        {online && (
          <span style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.8)", display: "block" }} />
        )}

        {/* Liked heart */}
        {liked && (
          <div style={{ position: "absolute", bottom: 38, right: 8, background: "rgba(34,197,94,0.2)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart size={13} style={{ color: "#4ade80" }} fill="currentColor" />
          </div>
        )}

        {/* Ghost House / Ghost Black badge */}
        {houseTier && (
          <div style={{
            position: "absolute", top: 7, left: isTonight ? 70 : 30,
            width: 22, height: 22, borderRadius: "50%",
            background: houseTier === "black" ? "#080808" : "rgba(5,5,8,0.85)",
            border: houseTier === "black" ? "1.5px solid #d4af37" : "1.5px solid rgba(74,222,128,0.7)",
            boxShadow: houseTier === "black" ? "0 0 8px rgba(212,175,55,0.6)" : "0 0 6px rgba(74,222,128,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, backdropFilter: "blur(4px)",
          }}>
            {houseTier === "black" ? "🖤" : "🏠"}
          </div>
        )}

        {/* Ghost ID / age */}
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(74,222,128,0.9)", margin: 0, lineHeight: 1, letterSpacing: "0.04em" }}>
              <span>{ghostId}</span>
            </p>
            {profile.isVerified && (
              <span title="Verified" style={{
                fontSize: 9, fontWeight: 800, background: "rgba(74,222,128,0.2)",
                border: "1px solid rgba(74,222,128,0.4)", borderRadius: 4,
                padding: "1px 4px", color: "rgba(74,222,128,0.95)", lineHeight: 1,
              }}>✅ ID</span>
            )}
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: "0 0 2px", lineHeight: 1 }}>
            <span>{profile.age} · {profile.gender === "Female" ? "Woman" : "Man"}</span>
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 10 }}>{profile.countryFlag}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{profile.city}</span>
            </div>
            {profile.distanceKm !== undefined ? (
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(74,222,128,0.8)" }}>{fmtKm(profile.distanceKm)}</span>
            ) : (
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{profile.country}</span>
            )}
          </div>
        </div>

        {/* Reveal button */}
        {!flipped && (
          <button
            onClick={handleRevealClick}
            title={canReveal || isRevealed ? "Reveal" : "Subscribers only"}
            style={{
              position: "absolute", top: 7, right: online ? 22 : 7,
              width: 24, height: 24, borderRadius: 8,
              background: isRevealed ? "rgba(74,222,128,0.25)" : canReveal ? "rgba(74,222,128,0.15)" : "rgba(0,0,0,0.4)",
              border: isRevealed ? "1px solid rgba(74,222,128,0.6)" : "1px solid rgba(74,222,128,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: canReveal || isRevealed ? "pointer" : "not-allowed",
              backdropFilter: "blur(6px)",
            }}
          >
            <Eye size={11} color={canReveal || isRevealed ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.3)"} />
          </button>
        )}

        {/* Flag button */}
        {onFlagOpen && (
          <button
            onClick={(e) => { e.stopPropagation(); onFlagOpen(); }}
            style={{
              position: "absolute", bottom: 8, right: 8,
              width: 24, height: 24, borderRadius: 6,
              background: isFlagged ? "rgba(239,68,68,0.3)" : "rgba(0,0,0,0.45)",
              border: isFlagged ? "1px solid rgba(239,68,68,0.6)" : "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", backdropFilter: "blur(4px)",
              fontSize: 11,
            }}
            title="Report this profile"
          >
            🚩
          </button>
        )}

        {/* Under Investigation overlay */}
        {isFlagged && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(239,68,68,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 5,
          }}>
            <div style={{
              background: "rgba(0,0,0,0.75)", borderRadius: 8, padding: "6px 10px",
              border: "1px solid rgba(239,68,68,0.4)", textAlign: "center",
            }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#f87171", margin: 0 }}>🔍 Under Investigation</p>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>Cannot interact</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Back face (reveal) ── */}
      <motion.div
        animate={{ rotateY: flipped ? 0 : -180 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          borderRadius: 16, overflow: "hidden",
          background: "rgba(10,8,20,0.97)",
          border: "1px solid rgba(74,222,128,0.2)",
          boxShadow: "0 0 24px rgba(74,222,128,0.1)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "14px 12px", gap: 12,
          cursor: "pointer",
        }}
        onClick={() => setFlipped(false)}
      >
        {/* Blurred photo bg */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 16 }}>
          <img src={profile.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(14px) brightness(0.25)", transform: "scale(1.1)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {/* Purple accent */}
          <div style={{ width: 32, height: 3, borderRadius: 2, background: "linear-gradient(90deg, #16a34a, #4ade80)" }} />

          {/* Outcome */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>
              <span>Looking for</span>
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>{outcomeIcon}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(74,222,128,0.95)" }}>{outcomeTag}</span>
            </div>
          </div>

          {/* Bio */}
          {(() => {
            const bioText = profile.bio || mockBio(profile.id);
            return (
              <div style={{
                width: "100%", background: "rgba(74,222,128,0.06)",
                border: "1px solid rgba(74,222,128,0.15)",
                borderRadius: 10, padding: "8px 10px", textAlign: "center",
              }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                  "{bioText}"
                </p>
              </div>
            );
          })()}

          {/* Interest tags */}
          {profile.interests && profile.interests.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 5 }}>
              {profile.interests.map((tag) => (
                <span key={tag} style={{
                  fontSize: 10, fontWeight: 700,
                  background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
                  borderRadius: 50, padding: "2px 8px", color: "rgba(74,222,128,0.75)",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Activity */}
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Activity</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: activity.color }}>{activity.label}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
              <div style={{ height: "100%", width: `${activity.pct}%`, borderRadius: 2, background: activity.color, boxShadow: `0 0 6px ${activity.color}` }} />
            </div>
          </div>

          {/* Likes */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Heart size={11} fill="#ec4899" color="#ec4899" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
              <span>{likesCount} likes received</span>
            </span>
          </div>

          {/* Tap to flip back hint */}
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", margin: 0 }}>
            <span>Tap to flip back</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Match paywall — pay to unlock WhatsApp on mutual match ───────────────────
function MatchPaywallModal({
  profile, onPay, onClose,
}: {
  profile: GhostProfile;
  onPay: (plan: string) => void;
  onClose: () => void;
}) {
  const PLANS = [
    { key: "founding", emoji: "🔥", name: "Founding Ghost", idr: "49,000", usd: "~$3", period: "3 months · locks forever", color: "#f97316", gradient: "linear-gradient(to bottom, #fb923c, #f97316, #ea580c)", glow: "rgba(249,115,22,0.45)", border: "rgba(251,146,60,0.4)" },
    { key: "monthly",  emoji: "👻", name: "Ghost Monthly",  idr: "69,000", usd: "~$4.50", period: "per month · cancel anytime", color: "#22c55e", gradient: "linear-gradient(to bottom, #4ade80, #22c55e, #16a34a)", glow: "rgba(34,197,94,0.45)",  border: "rgba(74,222,128,0.4)" },
    { key: "bundle",   emoji: "⭐", name: "Ghost + VIP",    idr: "99,000", usd: "~$6.50", period: "per month · best value",     color: "#a855f7", gradient: "linear-gradient(to bottom, #c084fc, #a855f7, #9333ea)", glow: "rgba(168,85,247,0.45)", border: "rgba(168,85,247,0.4)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(6,6,10,0.97)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none", overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)" }} />

        <div style={{ padding: "20px 18px 32px", position: "relative" }}>
          {/* Close */}
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            width: 28, height: 28, borderRadius: 8,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.5)",
          }}><X size={13} /></button>

          {/* Matched person teaser */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={profile.image} alt={profile.name}
                style={{
                  width: 60, height: 60, borderRadius: "50%", objectFit: "cover",
                  border: "2px solid rgba(74,222,128,0.5)",
                  filter: "blur(6px)",
                }}
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>❤️</div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(74,222,128,0.9)", margin: "0 0 4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                <span><img src={GHOST_LOGO} alt="" style={{ width: 48, height: 48, objectFit: "contain", verticalAlign: "middle", marginRight: 6 }} /> Ghost Match!</span>
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>
                <span>{profile.name}, {profile.age}</span>
              </h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                <span>{profile.countryFlag} {profile.city}, {profile.country}</span>
              </p>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 16px", lineHeight: 1.5 }}>
            <span>You both liked each other. Liking is free — pay once to unlock their contact and connect for real.</span>
          </p>

          {/* Plans */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {PLANS.map((p) => (
              <motion.button
                key={p.key}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPay(p.key)}
                style={{
                  width: "100%", borderRadius: 14, padding: "11px 16px",
                  background: `rgba(255,255,255,0.04)`,
                  border: `1px solid ${p.border}`,
                  cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 1px" }}>
                    <span>{p.emoji === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} /> : p.emoji} {p.name}</span>
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}><span>{p.period}</span></p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 15, fontWeight: 900, color: p.color, margin: 0 }}><span>{p.idr} IDR</span></p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0 }}><span>{p.usd}</span></p>
                  </div>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: p.gradient,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 12px ${p.glow}`,
                  }}>
                    <ArrowRight size={14} color="#fff" strokeWidth={2.5} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 12, marginBottom: 0 }}>
            <span>🔒 Private · No public profile · contact shared on match only</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Ghost House Welcome Modal (kept for reference — rendered in GhostGatewayPage) ──
function GhostHouseWelcomeModal({ onAccept }: { onAccept: () => void }) {
  const RULES = [
    { icon: "🤝", title: "Respect Every Ghost", desc: "No harassment, hate, or disrespect. Every person here deserves dignity — no exceptions." },
    { icon: "🔒", title: "Privacy is Sacred", desc: "Never share another member's identity, photos, or location outside the House." },
    { icon: "🚫", title: "No Bad Energy", desc: "No spam, scams, or fake profiles. Genuine connections only — the House self-cleanses." },
    { icon: "👻", title: "Stay Anonymous Until Ready", desc: "Your Ghost ID protects you. Only reveal yourself when you're truly comfortable." },
    { icon: "💚", title: "Good Vibes Only", desc: "Bring curiosity, openness, and warmth. The energy you put in is the energy you get back." },
  ];

  const HOW_IT_WORKS = [
    { icon: "❤️", title: "Like for Free", desc: "Browse every profile and like as many as you want — completely free, no subscription needed." },
    { icon: "✨", title: "Ghost Match", desc: "When two ghosts like each other it becomes a mutual match. You'll get notified instantly." },
    { icon: "📱", title: "Connect on Match", desc: "After a mutual match, pay once to unlock their contact — WhatsApp, Telegram, WeChat, iMessage, any app they use. No in-app chat — real connection only." },
    { icon: "🚪", title: "Ghost Room", desc: "Your private vault. All your matches live here with a 48-hour countdown. Don't let them fade." },
    { icon: "🌍", title: "Global House", desc: "Members from Indonesia, UK, Ireland, Japan, Australia and growing — your next match could be anywhere." },
    { icon: "👁️", title: "You're Invisible", desc: "Others only see your Ghost ID, photo, age, and city — nothing else — until you both connect." },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        overflowY: "auto",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        style={{
          width: "100%", maxWidth: 480,
          background: "linear-gradient(180deg, rgba(5,8,5,0.99) 0%, rgba(8,12,8,0.99) 100%)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(74,222,128,0.12)",
          borderBottom: "none",
          maxHeight: "94dvh", overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e, #4ade80, #16a34a)" }} />

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>

        <div style={{ padding: "20px 22px max(36px, env(safe-area-inset-bottom, 36px))" }}>

          {/* Ghost hero */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <motion.div
              animate={{
                y: [0, -12, 0],
                filter: [
                  "drop-shadow(0 0 16px rgba(74,222,128,0.4))",
                  "drop-shadow(0 0 32px rgba(74,222,128,0.8))",
                  "drop-shadow(0 0 16px rgba(74,222,128,0.4))",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ lineHeight: 1, display: "inline-block", marginBottom: 16 }}
            >
              <img src={GHOST_LOGO} alt="ghost" style={{ width: 216, height: 216, objectFit: "contain" }} />
            </motion.div>
            <h1 style={{
              fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 10px",
              letterSpacing: "-0.02em", lineHeight: 1.2,
            }}>
              Welcome to{" "}
              <span style={{
                background: "linear-gradient(135deg, #4ade80, #22c55e)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                My House
              </span>
            </h1>
            <p style={{
              fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.7,
              maxWidth: 320, marginInline: "auto",
            }}>
              Before you settle in, we have some{" "}
              <span style={{ color: "rgba(74,222,128,0.85)", fontWeight: 700 }}>house rules</span>{" "}
              that we must all abide by — to keep our house free from bad energies entering.
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.2), transparent)", marginBottom: 22 }} />

          {/* House Rules */}
          <div style={{ marginBottom: 26 }}>
            <p style={{
              fontSize: 10, fontWeight: 800, color: "rgba(74,222,128,0.6)",
              textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 14px",
            }}>🏠 The House Rules</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {RULES.map((rule) => (
                <div
                  key={rule.title}
                  style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.08)",
                    borderRadius: 14, padding: "12px 14px",
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>
                    {rule.icon === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle" }} /> : rule.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>
                      {rule.title}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", margin: 0, lineHeight: 1.5 }}>
                      {rule.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.2), transparent)", marginBottom: 22 }} />

          {/* How it works */}
          <div style={{ marginBottom: 28 }}>
            <p style={{
              fontSize: 10, fontWeight: 800, color: "rgba(74,222,128,0.6)",
              textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 14px",
            }}>⚙️ How the House Works</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {HOW_IT_WORKS.map((item) => (
                <div key={item.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ paddingTop: 2 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -2 }}
            onClick={onAccept}
            style={{
              width: "100%", height: 54, borderRadius: 50, border: "none",
              background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
              color: "#fff", fontSize: 15, fontWeight: 900,
              cursor: "pointer", letterSpacing: "0.03em",
              boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 32px rgba(34,197,94,0.5)",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)",
              borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
            }} />
            <img src={GHOST_LOGO} alt="" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle", marginRight: 6 }} /> I Accept the House Rules — Enter Ghost Mode
          </motion.button>

          <p style={{
            textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)",
            margin: "12px 0 0", lineHeight: 1.6,
          }}>
            By entering you agree to the house rules above and our{" "}
            <span style={{ color: "rgba(255,255,255,0.35)" }}>Privacy Policy</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Dev Panel ────────────────────────────────────────────────────────────────
function DevPanel({
  isTonightMode, toggleTonight,
  isFlashActive, enterFlash, exitFlash,
  houseTier, setHouseTier,
  activate, deactivate,
  onTriggerFlashMatch, onTriggerMatch, onTriggerInbound,
}: {
  isTonightMode: boolean; toggleTonight: () => void;
  isFlashActive: boolean; enterFlash: () => void; exitFlash: () => void;
  houseTier: "black" | "house" | null; setHouseTier: (t: "black" | "house" | null) => void;
  activate: (p: "ghost" | "bundle") => void; deactivate: () => void;
  onTriggerFlashMatch: () => void; onTriggerMatch: () => void; onTriggerInbound: () => void;
}) {
  const [open, setOpen] = useState(false);

  const DEMO_PROFILE = {
    photo: "https://i.pravatar.cc/400?img=33",
    name: "Dev Admin", age: 28, city: "Jakarta", country: "Indonesia",
    countryFlag: "🇮🇩", countryCode: "ID", gender: "Male",
    vibe: { key: "tonight", icon: "🌙", label: "Tonight" },
    outcome: { key: "casual", icon: "🤝", label: "Casual Connection", tag: "Casual" },
  };

  const setGender = (g: "Male" | "Female") => {
    try {
      localStorage.setItem("ghost_gender", g);
      localStorage.setItem("ghost_phone", "+628123456789");
      const profile = { ...DEMO_PROFILE, gender: g, name: g === "Female" ? "Devi Admin" : "Dev Admin" };
      localStorage.setItem("ghost_profile", JSON.stringify(profile));
    } catch {}
  };

  const grantAccess = (plan: "ghost" | "bundle") => {
    const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem("ghost_mode_until", String(until));
      localStorage.setItem("ghost_mode_plan", plan);
      localStorage.setItem("ghost_phone", "+628123456789");
      if (!localStorage.getItem("ghost_profile")) {
        localStorage.setItem("ghost_profile", JSON.stringify(DEMO_PROFILE));
      }
    } catch {}
    activate(plan);
  };

  const setHouseAndPersist = (tier: "black" | "house" | null) => {
    try {
      if (tier) localStorage.setItem("ghost_house_tier", tier);
      else localStorage.removeItem("ghost_house_tier");
    } catch {}
    setHouseTier(tier);
  };

  const resetAll = () => {
    const keys = ["ghost_mode_until","ghost_mode_plan","ghost_profile","ghost_gender","ghost_phone",
      "ghost_passed_ids","ghost_matches","ghost_tonight_until","ghost_flash_until",
      "ghost_boost_until","ghost_house_tier","ghost_blocked_numbers","ghost_block_package","ghost_block_until"];
    keys.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
    deactivate();
    window.location.reload();
  };

  const btnBase: React.CSSProperties = {
    flex: 1, minWidth: 0, height: 34, borderRadius: 9, border: "none",
    fontSize: 11, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
    transition: "all 0.15s",
  };
  const btn = (active: boolean): React.CSSProperties => ({
    ...btnBase,
    background: active ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)",
    color: active ? "#4ade80" : "rgba(255,255,255,0.6)",
    border: active ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.08)",
  });
  const actionBtn: React.CSSProperties = {
    ...btnBase,
    background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(255,255,255,0.1)",
  };
  const dangerBtn: React.CSSProperties = {
    ...btnBase,
    background: "rgba(239,68,68,0.12)", color: "rgba(248,113,113,0.9)",
    border: "1px solid rgba(239,68,68,0.2)",
  };
  const label: React.CSSProperties = {
    fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)",
    letterSpacing: "0.1em", textTransform: "uppercase",
    marginBottom: 5, display: "block",
  };

  return (
    <>
      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.94 }}
        style={{
          position: "fixed", bottom: 90, right: 14, zIndex: 9000,
          width: 48, height: 28, borderRadius: 8,
          background: open ? "rgba(74,222,128,0.2)" : "rgba(0,0,0,0.75)",
          border: open ? "1px solid rgba(74,222,128,0.5)" : "1px solid rgba(255,255,255,0.15)",
          color: open ? "#4ade80" : "rgba(255,255,255,0.5)",
          fontSize: 10, fontWeight: 900, cursor: "pointer",
          backdropFilter: "blur(12px)", letterSpacing: "0.06em",
        }}
      >
        DEV
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            style={{
              position: "fixed", bottom: 126, right: 14, zIndex: 8999,
              width: 280,
              background: "rgba(6,6,12,0.97)", backdropFilter: "blur(30px)",
              borderRadius: 16, border: "1px solid rgba(74,222,128,0.2)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
              overflow: "hidden",
            }}
          >
            <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80)" }} />
            <div style={{ padding: "12px 12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: "#4ade80" }}>🛠 Dev Panel</span>
                <button onClick={resetAll} style={{ ...dangerBtn, flex: "none", width: "auto", padding: "0 10px", fontSize: 10 }}>
                  Reset All
                </button>
              </div>

              {/* Gender / Profile */}
              <div>
                <span style={label}>Profile Setup</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={actionBtn} onClick={() => { setGender("Male"); grantAccess("ghost"); }}>👨 Male</button>
                  <button style={actionBtn} onClick={() => { setGender("Female"); grantAccess("ghost"); }}>👩 Female</button>
                </div>
              </div>

              {/* Access */}
              <div>
                <span style={label}>Access Level</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={actionBtn} onClick={() => grantAccess("ghost")}><img src={GHOST_LOGO} alt="" style={{ width: 36, height: 36, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} /> Ghost</button>
                  <button style={actionBtn} onClick={() => grantAccess("bundle")}>⭐ Bundle</button>
                  <button style={dangerBtn} onClick={() => deactivate()}>Revoke</button>
                </div>
              </div>

              {/* Modes */}
              <div>
                <span style={label}>Modes</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={btn(isTonightMode)} onClick={toggleTonight}>🌙 Tonight</button>
                  <button style={btn(isFlashActive)} onClick={isFlashActive ? exitFlash : enterFlash}>⚡ Flash</button>
                </div>
              </div>

              {/* Ghost House */}
              <div>
                <span style={label}>Ghost House Badge</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={btn(houseTier === "house")} onClick={() => setHouseAndPersist("house")}>🏠 House</button>
                  <button style={btn(houseTier === "black")} onClick={() => setHouseAndPersist("black")}>🖤 Black</button>
                  <button style={btn(!houseTier)} onClick={() => setHouseAndPersist(null)}>None</button>
                </div>
              </div>

              {/* Popup triggers */}
              <div>
                <span style={label}>Trigger Popups</span>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <button style={actionBtn} onClick={onTriggerFlashMatch}>⚡ Flash Match</button>
                  <button style={actionBtn} onClick={onTriggerMatch}>💚 Match</button>
                  <button style={actionBtn} onClick={onTriggerInbound}>👋 Inbound Like</button>
                </div>
              </div>

              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", margin: 0, textAlign: "center" }}>
                Dev panel — not visible in production
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Ghost House purchase modal ───────────────────────────────────────────────
function GhostHouseModal({
  currentTier, onClose, onPurchase,
}: {
  currentTier: "black" | "house" | null;
  onClose: () => void;
  onPurchase: (tier: "black" | "house") => void;
}) {
  const TIERS = [
    {
      key: "house" as const,
      icon: "🏠",
      name: "Ghost House",
      badge: "GH",
      idr: "150,000",
      usd: "~$9",
      period: "per month",
      desc: "Glowing house badge on your profile. Members know you're invested.",
      border: "rgba(74,222,128,0.35)",
      bg: "rgba(74,222,128,0.07)",
      glow: "rgba(74,222,128,0.4)",
      color: "#4ade80",
      gradient: "linear-gradient(135deg, #16a34a, #22c55e)",
    },
    {
      key: "black" as const,
      icon: "🖤",
      name: "Ghost Black",
      badge: "GB",
      idr: "500,000",
      usd: "~$30",
      period: "one-time · permanent",
      desc: "Black badge. Gold border. No expiry. The rarest status in the Ghost House.",
      border: "rgba(212,175,55,0.45)",
      bg: "rgba(212,175,55,0.06)",
      glow: "rgba(212,175,55,0.5)",
      color: "#d4af37",
      gradient: "linear-gradient(135deg, #92400e, #d4af37)",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(5,5,8,0.99)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
          overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #d4af37)" }} />
        <div style={{ padding: "22px 20px 36px", position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 18, right: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
            <X size={13} />
          </button>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 38, lineHeight: 1, marginBottom: 8 }}>🏠</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>
              <span>Ghost House Membership</span>
            </h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.55 }}>
              <span>A badge that says everything without saying a word. Members notice. Women filter for it.</span>
            </p>
          </div>

          {/* Tier cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {TIERS.map((t) => {
              const owned = currentTier === t.key || (t.key === "house" && currentTier === "black");
              return (
                <motion.button
                  key={t.key}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !owned && onPurchase(t.key)}
                  style={{
                    width: "100%", borderRadius: 16, padding: "14px 16px",
                    background: t.bg,
                    border: `1px solid ${t.border}`,
                    cursor: owned ? "default" : "pointer",
                    display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                    boxShadow: owned ? `0 0 20px ${t.glow}` : "none",
                  }}
                >
                  {/* Badge preview */}
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                    background: t.key === "black" ? "#0a0a0a" : "rgba(5,5,8,0.8)",
                    border: `2px solid ${t.color}`,
                    boxShadow: `0 0 14px ${t.glow}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>
                    {t.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}><span>{t.name}</span></p>
                      {owned && (
                        <span style={{ fontSize: 9, fontWeight: 800, color: t.color, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 5, padding: "1px 6px", letterSpacing: "0.08em" }}>ACTIVE</span>
                      )}
                    </div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}><span>{t.period}</span></p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.45 }}><span>{t.desc}</span></p>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 17, fontWeight: 900, color: t.color, margin: 0 }}><span>{t.idr}</span></p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}><span>IDR {t.usd}</span></p>
                    {!owned && (
                      <div style={{ marginTop: 6, height: 28, paddingInline: 10, borderRadius: 8, background: t.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>Join</span>
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.18)", margin: 0 }}>
            <span>🔒 Badge shows on your Ghost profile only · visible to Ghost members</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Ghost Flash match popup ──────────────────────────────────────────────────
function GhostFlashMatchPopup({ profile, onClose }: { profile: GhostProfile; onClose: () => void }) {
  const firstName = profile.name.split(" ")[0];
  const ghostId = toGhostId(profile.id);
  const [secs, setSecs] = useState(30);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => { if (s <= 1) { onClose(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px",
      }}
    >
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        style={{
          width: "100%", maxWidth: 340, textAlign: "center",
          background: "rgba(5,5,8,0.98)", backdropFilter: "blur(40px)",
          borderRadius: 24, border: "1px solid rgba(74,222,128,0.35)",
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(74,222,128,0.2), 0 24px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Pulsing top bar */}
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
          style={{ height: 4, background: "linear-gradient(90deg, #16a34a, #4ade80, #16a34a)" }}
        />

        <div style={{ padding: "28px 24px 26px" }}>
          {/* Flash badge */}
          <motion.div
            animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1, repeat: Infinity }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)",
              borderRadius: 20, padding: "5px 14px", marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 14 }}>⚡</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: "rgba(74,222,128,0.95)", letterSpacing: "0.12em" }}>FLASH MATCH</span>
          </motion.div>

          {/* Photo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div style={{ position: "relative" }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "2px solid rgba(74,222,128,0.6)" }}
              />
              <img
                src={profile.image} alt={firstName}
                style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(74,222,128,0.6)", display: "block" }}
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
            </div>
          </div>

          {/* Ghost ID reveal */}
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 2px" }}>
            <span>{ghostId} is revealed as</span>
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 4px", background: "linear-gradient(135deg, #4ade80, #22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            <span>{firstName}!</span>
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 6px" }}>
            <span>{profile.age} · {profile.city} {profile.countryFlag}</span>
          </p>
          <p style={{ fontSize: 12, color: "rgba(74,222,128,0.7)", fontWeight: 700, margin: "0 0 22px" }}>
            <span>You're both live right now. WhatsApp opens instantly.</span>
          </p>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            animate={{ boxShadow: ["0 4px 24px rgba(34,197,94,0.35)", "0 4px 32px rgba(34,197,94,0.6)", "0 4px 24px rgba(34,197,94,0.35)"] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{
              width: "100%", height: 52, borderRadius: 16, border: "none",
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <MessageCircle size={18} />
            <span>Open WhatsApp Now</span>
          </motion.button>

          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 12, marginBottom: 0 }}>
            <span>Auto-closing in {secs}s</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Ghost Flash section (entry + active) ─────────────────────────────────────
function GhostFlashSection({
  isActive, flashUntil, flashTick, flashProfiles, onEnter, onExit, onSelectProfile,
  contactsUsed, contactLimit,
}: {
  isActive: boolean; flashUntil: number; flashTick: number;
  flashProfiles: GhostProfile[]; onEnter: () => void; onExit: () => void;
  onSelectProfile: (p: GhostProfile) => void;
  contactsUsed: number; contactLimit: number;
}) {
  const liveCount = 8 + (Math.floor(Date.now() / 300000) % 17);
  void flashTick; // triggers re-render for countdown

  // Auto-scroll: slowly left → then back right, pause at each end
  const scrollRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef<1 | -1>(1); // 1 = scrolling left, -1 = scrolling right
  const pauseRef = useRef(false);
  const userScrollRef = useRef(false);
  const userScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isActive) return;
    const el = scrollRef.current;
    if (!el) return;

    const onUserScroll = () => {
      userScrollRef.current = true;
      if (userScrollTimer.current) clearTimeout(userScrollTimer.current);
      userScrollTimer.current = setTimeout(() => { userScrollRef.current = false; }, 2000);
    };
    el.addEventListener("scroll", onUserScroll, { passive: true });

    let raf: number;
    const step = () => {
      if (!userScrollRef.current && !pauseRef.current && el) {
        el.scrollLeft += dirRef.current * 0.6;
        const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
        const atStart = el.scrollLeft <= 2;
        if (atEnd && dirRef.current === 1) { dirRef.current = -1; pauseRef.current = true; setTimeout(() => { pauseRef.current = false; }, 800); }
        else if (atStart && dirRef.current === -1) { dirRef.current = 1; pauseRef.current = true; setTimeout(() => { pauseRef.current = false; }, 800); }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("scroll", onUserScroll); };
  }, [isActive]);

  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{
          margin: "10px 14px 0",
          background: "rgba(5,5,8,0.6)",
          border: "1px solid rgba(74,222,128,0.25)",
          borderRadius: 16, overflow: "hidden",
        }}
      >
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ height: 2, background: "linear-gradient(90deg, #16a34a, #4ade80, #16a34a)" }}
        />
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "block", boxShadow: "0 0 8px rgba(74,222,128,0.9)", flexShrink: 0 }}
                />
                <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "0.05em" }}>⚡ Ghost Flash</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                <span>60-min live pool · instant WhatsApp on like</span>
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#4ade80", margin: 0 }}>{liveCount}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0 }}>live now</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {["Enter Flash → you're visible to live members only", "Like someone in Flash → WhatsApp opens instantly", "Pool resets every 60 minutes — no dead profiles"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: "rgba(74,222,128,0.7)", fontSize: 11, flexShrink: 0, marginTop: 1 }}>⚡</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{t}</span>
              </div>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onEnter}
            animate={{ boxShadow: ["0 4px 16px rgba(34,197,94,0.3)", "0 4px 24px rgba(34,197,94,0.55)", "0 4px 16px rgba(34,197,94,0.3)"] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{
              width: "100%", height: 48, borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>⚡</span>
            <span>Enter Ghost Flash — Free</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Active Flash state
  return (
    <div style={{ margin: "10px 14px 0", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 16, overflow: "hidden", background: "rgba(5,5,8,0.5)" }}>
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 0.8, repeat: Infinity }}
        style={{ height: 2, background: "linear-gradient(90deg, #16a34a, #4ade80, #16a34a)" }}
      />
      <div style={{ padding: "10px 14px 12px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 10px rgba(74,222,128,1)", display: "block", flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, lineHeight: 1 }}>⚡</span>
            <span style={{ fontSize: 14, lineHeight: 1 }}>🕰️</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#4ade80", letterSpacing: "0.04em" }}>Ghosting</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>· {liveCount} live now</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Contact limit pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: contactsUsed >= contactLimit ? "rgba(239,68,68,0.15)" : "rgba(74,222,128,0.1)",
              border: `1px solid ${contactsUsed >= contactLimit ? "rgba(239,68,68,0.3)" : "rgba(74,222,128,0.25)"}`,
              borderRadius: 8, padding: "2px 8px",
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: contactsUsed >= contactLimit ? "#f87171" : "rgba(74,222,128,0.9)", letterSpacing: "0.04em" }}>
                {contactsUsed >= contactLimit ? "LIMIT REACHED" : `${contactLimit - contactsUsed} left`}
              </span>
            </div>
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}
              style={{ fontSize: 16, fontWeight: 900, color: "#4ade80", fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}
            >
              {fmtFlashTime(flashUntil)}
            </motion.span>
          </div>
        </div>

        {/* Flash profiles horizontal scroll */}
        {flashProfiles.length > 0 ? (
          <div ref={scrollRef} className="ghost-flash-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
            {flashProfiles.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProfile(p)}
                style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
              >
                <div style={{ position: "relative", width: 60, height: 60 }}>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid rgba(74,222,128,0.8)", pointerEvents: "none" }}
                  />
                  <img
                    src={p.image} alt=""
                    style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(74,222,128,0.6)", display: "block" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: "50%", background: "#050508", border: "1.5px solid rgba(74,222,128,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>⚡</div>
                </div>
                <p style={{ fontSize: 8, color: "rgba(74,222,128,0.85)", fontWeight: 800, margin: 0 }}>
                  <span>{p.age}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, textAlign: "center", padding: "6px 0" }}>
            <span>Waiting for others to enter Flash...</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ── Ghost Pulse row ──────────────────────────────────────────────────────────
function GhostPulseRow({ profiles, onSelect }: { profiles: GhostProfile[]; onSelect: (p: GhostProfile) => void }) {
  const pulse = profiles.filter((p) => (p.lastActiveHoursAgo ?? 99) <= 1).slice(0, 8);
  if (pulse.length === 0) return null;
  return (
    <div style={{ margin: "10px 14px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <motion.span
          animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "block", boxShadow: "0 0 8px rgba(74,222,128,0.9)", flexShrink: 0 }}
        />
        <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(74,222,128,0.85)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Ghost Pulse</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>· {pulse.length} live now</span>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
        {pulse.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelect(p)}
            style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
          >
            <div style={{ position: "relative", width: 54, height: 54 }}>
              <motion.div
                animate={{ scale: [1, 1.22, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: Math.random() * 1.2 }}
                style={{
                  position: "absolute", inset: -5, borderRadius: "50%",
                  border: "2px solid rgba(74,222,128,0.7)",
                  pointerEvents: "none",
                }}
              />
              <img
                src={p.image} alt=""
                style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(74,222,128,0.55)", display: "block" }}
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              {isProfileTonight(p.id) && (
                <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 12, lineHeight: 1 }}>🌙</span>
              )}
            </div>
            <p style={{ fontSize: 8, color: "rgba(74,222,128,0.8)", fontWeight: 700, margin: 0, letterSpacing: "0.04em" }}>
              <span>{toGhostId(p.id).replace("Ghost-", "")}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ghost Boost modal ────────────────────────────────────────────────────────
function BoostModal({ onClose, onBoost }: { onClose: () => void; onBoost: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(6,6,10,0.98)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
          overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)" }} />
        <div style={{ padding: "22px 20px 36px" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 18, right: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
            <X size={13} />
          </button>

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 10 }}>⚡</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>
              <span>Ghost Boost</span>
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.55 }}>
              <span>Your profile jumps to the top of every member's feed for 24 hours. More eyes, more matches.</span>
            </p>
          </div>

          {/* What you get */}
          <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 14, padding: "12px 14px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "⚡ Top of feed for all members",
              "👁 Up to 10× more profile views",
              "💚 Higher chance of likes & matches",
              "🕐 Active for exactly 24 hours",
            ].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>{t.slice(0, 2)}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{t.slice(2)}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}><span>24-hour Boost</span></p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}><span>One time · no subscription</span></p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#4ade80", margin: 0 }}><span>15,000 IDR</span></p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0 }}><span>~$1</span></p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onBoost}
            style={{
              width: "100%", height: 52, borderRadius: 16, border: "none",
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer",
              boxShadow: "0 6px 28px rgba(34,197,94,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Zap size={18} fill="currentColor" />
            <span>Boost Now — 15,000 IDR</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Found Boo Banner ────────────────────────────────────────────────────────
function fmtCountdown(ms: number): string {
  if (ms <= 0) return "0m";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function FoundBooBanner({
  foundBoo,
  onReactivate,
}: {
  foundBoo: { matchProfileId: string; matchProfileImage: string; matchName: string; connectedAt: number; pausedUntil: number; canReactivateAt: number };
  onReactivate: () => void;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  void tick;
  const canReactivate = Date.now() >= foundBoo.canReactivateAt;
  const remaining = foundBoo.pausedUntil - Date.now();

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -12, height: 0 }}
      style={{ margin: "10px 14px 0", overflow: "hidden" }}
    >
      <div style={{
        background: "rgba(74,222,128,0.05)",
        border: "1px solid rgba(74,222,128,0.3)",
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img
            src={foundBoo.matchProfileImage}
            alt={foundBoo.matchName}
            style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(74,222,128,0.5)" }}
          />
          <img src={GHOST_LOGO} alt="ghost" style={{ position: "absolute", bottom: -4, right: -4, width: 54, height: 54, objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>Found Boo</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 6px", lineHeight: 1.4 }}>
            Your profile is paused — giving your new connection space
          </p>
          <p style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, margin: 0 }}>
            Resumes in {fmtCountdown(remaining)}
          </p>
        </div>
        <button
          onClick={canReactivate ? onReactivate : undefined}
          style={{
            flexShrink: 0,
            height: 34, paddingInline: 12, borderRadius: 10, border: "none",
            background: canReactivate ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)",
            color: canReactivate ? "#4ade80" : "rgba(255,255,255,0.2)",
            fontSize: 11, fontWeight: 800, cursor: canReactivate ? "pointer" : "default",
            whiteSpace: "nowrap",
          }}
        >
          {canReactivate ? "Reactivate" : "Early"}
        </button>
      </div>
    </motion.div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function GhostModePage() {
  const navigate = useNavigate();
  const { isGhost, plan, activate, deactivate } = useGhostMode();

  const hasGhostProfile = (() => {
    try { return !!localStorage.getItem("ghost_profile"); } catch { return false; }
  })();

  // Women browse free — paywall only fires at the moment of first WhatsApp connection
  const isFemale = (() => {
    try { return localStorage.getItem("ghost_gender") === "Female"; } catch { return false; }
  })();

  // Found Boo state
  const [foundBoo, setFoundBoo] = useState<{
    matchProfileId: string;
    matchProfileImage: string;
    matchName: string;
    connectedAt: number;
    pausedUntil: number;
    canReactivateAt: number;
  } | null>(() => {
    try {
      const raw = localStorage.getItem("ghost_found_boo");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const isProfilePaused = foundBoo && foundBoo.pausedUntil > Date.now();

  const handleFoundBoo = (profile: GhostProfile) => {
    const data = {
      matchProfileId: profile.id,
      matchProfileImage: profile.image,
      matchName: profile.name,
      connectedAt: Date.now(),
      pausedUntil: Date.now() + 72 * 60 * 60 * 1000,
      canReactivateAt: Date.now() + 60 * 60 * 1000,
    };
    try { localStorage.setItem("ghost_found_boo", JSON.stringify(data)); } catch {}
    setFoundBoo(data);
    // Open WhatsApp by default (subscriber path — they chose the app in the popup)
    // The popup handles per-app navigation, so no auto-open here
  };

  // Flag / Report state
  const [flaggedProfiles, setFlaggedProfiles] = useState<Record<string, { reason: string; at: number }>>(getFlaggedProfiles);
  const [flagSheet, setFlagSheet] = useState<{ profileId: string; ghostId: string } | null>(null);
  const [flagReason, setFlagReason] = useState("");

  const handleFlag = () => {
    if (!flagSheet || !flagReason) return;
    const next = { ...flaggedProfiles, [flagSheet.profileId]: { reason: flagReason, at: Date.now() } };
    setFlaggedProfiles(next);
    saveFlaggedProfiles(next);
    setFlagSheet(null);
    setFlagReason("");
  };

  const [selectedProfile, setSelectedProfile] = useState<GhostProfile | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [matchProfile, setMatchProfile] = useState<GhostProfile | null>(null);
  // For unsubscribed women: holds the matched profile until they pay
  const [matchPaywallProfile, setMatchPaywallProfile] = useState<GhostProfile | null>(null);
  // Active matches (48h expiry)
  const [savedMatches, setSavedMatches] = useState<GhostMatch[]>(loadMatches);
  // Countdown tick
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  // Referral copy state
  const [referralCopied, setReferralCopied] = useState(false);
  // Revealed profile IDs (flip) — subscribers get unlimited
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Tonight Mode — auto-expires at midnight
  const [tonightUntil, setTonightUntil] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("ghost_tonight_until") || 0); return v > Date.now() ? v : 0; } catch { return 0; }
  });
  const isTonightMode = tonightUntil > Date.now();

  // Tonight active toggle — user-facing live indicator
  const [tonightActive, setTonightActive] = useState(() => {
    try { return localStorage.getItem("ghost_tonight_active") === "1"; } catch { return false; }
  });
  const toggleTonightActive = () => {
    const next = !tonightActive;
    setTonightActive(next);
    try { localStorage.setItem("ghost_tonight_active", next ? "1" : "0"); } catch {}
  };

  const toggleTonight = () => {
    if (isTonightMode) {
      try { localStorage.removeItem("ghost_tonight_until"); } catch {}
      setTonightUntil(0);
      setTonightActive(false);
      try { localStorage.setItem("ghost_tonight_active", "0"); } catch {}
    } else {
      const until = tonightMidnight();
      try { localStorage.setItem("ghost_tonight_until", String(until)); } catch {}
      setTonightUntil(until);
      setTonightActive(true);
      try { localStorage.setItem("ghost_tonight_active", "1"); } catch {}
    }
  };
  void toggleTonightActive; // kept for external use


  // Quick Exit — renders a blank screen instantly
  const [quickExit, setQuickExit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  // First-entry welcome popup — fires once per session
  const [showModeWelcome, setShowModeWelcome] = useState(false);
  useEffect(() => {
    if (!sessionStorage.getItem("ghost_mode_welcome_seen")) {
      const t = setTimeout(() => {
        setShowModeWelcome(true);
        sessionStorage.setItem("ghost_mode_welcome_seen", "1");
      }, 800);
      return () => clearTimeout(t);
    }
  }, []);

  // Filter button randomly cycling glow
  const FILTER_GLOWS = [
    "rgba(74,222,128,0.8)",   // green
    "rgba(168,85,247,0.8)",   // purple
    "rgba(251,191,36,0.8)",   // gold
    "rgba(96,165,250,0.8)",   // blue
    "rgba(251,113,133,0.8)",  // pink
    "rgba(251,146,60,0.8)",   // orange
  ];
  const [filterGlowIdx, setFilterGlowIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setFilterGlowIdx(i => {
        let next = i;
        while (next === i) next = Math.floor(Math.random() * FILTER_GLOWS.length);
        return next;
      });
    }, 1800);
    return () => clearInterval(t);
  }, []);
  const [settingsGateFeature, setSettingsGateFeature] = useState<string | null>(null);


  // Ghost Flash — 60-minute live pool
  const FLASH_CONTACT_LIMIT = 3;
  const [flashUntil, setFlashUntil] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("ghost_flash_until") || 0); return v > Date.now() ? v : 0; } catch { return 0; }
  });
  const isFlashActive = flashUntil > Date.now();
  const [flashTick, setFlashTick] = useState(0);
  const [flashMatchProfile, setFlashMatchProfile] = useState<GhostProfile | null>(null);
  const [flashContactsUsed, setFlashContactsUsed] = useState<number>(() => {
    try {
      const until = Number(localStorage.getItem("ghost_flash_until") || 0);
      if (until > Date.now()) return Number(localStorage.getItem("ghost_flash_contacts_used") || 0);
      return 0;
    } catch { return 0; }
  });
  const [showFlashLimitToast, setShowFlashLimitToast] = useState(false);

  // ── Shield blocked-attempt alert ──────────────────────────────────────────
  const [showBlockedAlert, setShowBlockedAlert] = useState(false);
  useEffect(() => {
    // Only trigger if shield is active and blocked numbers exist
    const pkg = Number(localStorage.getItem("ghost_block_package") || 0);
    if (pkg === 0) return;
    let blocked: string[] = [];
    try { blocked = JSON.parse(localStorage.getItem("ghost_blocked_numbers") || "[]"); } catch {}
    if (blocked.length === 0) return;

    // Show first alert after 90s, then randomly every 4–10 min
    const LAST_KEY = "ghost_blocked_alert_last";
    const last = Number(localStorage.getItem(LAST_KEY) || 0);
    const minGap = 4 * 60 * 1000;
    const now = Date.now();
    const initialDelay = last === 0 ? 90000 : Math.max(0, minGap - (now - last));

    const fire = () => {
      try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch {}
      setShowBlockedAlert(true);
      // Schedule next random alert 4–10 min later
      const next = (4 + Math.floor(Math.random() * 6)) * 60 * 1000;
      setTimeout(fire, next);
    };
    const t = setTimeout(fire, initialDelay);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!isFlashActive) return;
    const t = setInterval(() => setFlashTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [isFlashActive]);
  const enterFlash = () => {
    const until = Date.now() + 60 * 60 * 1000;
    try {
      localStorage.setItem("ghost_flash_until", String(until));
      localStorage.setItem("ghost_flash_contacts_used", "0");
    } catch {}
    setFlashUntil(until);
    setFlashContactsUsed(0);
  };
  const exitFlash = () => {
    try {
      localStorage.removeItem("ghost_flash_until");
      localStorage.removeItem("ghost_flash_contacts_used");
    } catch {}
    setFlashUntil(0);
    setFlashContactsUsed(0);
  };

  // Ghost House membership
  const [houseTier, setHouseTier] = useState<"black" | "house" | null>(() => {
    try { return (localStorage.getItem("ghost_house_tier") as "black" | "house" | null) ?? null; } catch { return null; }
  });
  const [showHouseModal, setShowHouseModal] = useState(false);
  const handleHousePurchase = (tier: "black" | "house") => {
    // Black upgrades over house; house doesn't downgrade black
    const next = tier === "black" || houseTier !== "black" ? tier : houseTier;
    try { localStorage.setItem("ghost_house_tier", next); } catch {}
    setHouseTier(next);
    setShowHouseModal(false);
  };
  const handleReveal = (id: string) => {
    setRevealedIds((prev) => new Set([...prev, id]));
  };

  // Passed (refused) profiles — persisted so they never reappear
  const [passedIds, setPassedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("ghost_passed_ids");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const handlePass = (profileId: string) => {
    const next = new Set(passedIds);
    next.add(profileId);
    setPassedIds(next);
    try { localStorage.setItem("ghost_passed_ids", JSON.stringify([...next])); } catch {}
    setSelectedProfile(null);
  };

  // Filters — default gender filter from user's stored interest preference
  const [gender, setGender] = useState<GenderFilter>(() => {
    try {
      const interest = localStorage.getItem("ghost_interest");
      if (interest === "Women") return "Female";
      if (interest === "Men") return "Male";
      return "all"; // "Both" or unset → show all
    } catch { return "all"; }
  });
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(45);
  const [maxKm, setMaxKm] = useState<KmFilter>(9999);
  const [filterCountry, setFilterCountry] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [lookingFor, setLookingFor] = useState<string>("all");

  // Inbound like notification (simulated cross-country interest)
  const [inboundLike, setInboundLike] = useState<InboundLike | null>(null);
  const inboundShownRef = useRef(false);

  // Geolocation
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLon(pos.coords.longitude);
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { timeout: 8000 }
    );
  }, []);

  // Auto-request location on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Redirect to setup if no ghost profile — must browse/like, but need a profile first
  useEffect(() => {
    if (!hasGhostProfile) {
      navigate("/ghost/setup");
    }
  }, [hasGhostProfile, navigate]);

  // Simulate an inbound international like after 18s (demo — fires once per session)
  useEffect(() => {
    if (inboundShownRef.current || !hasGhostProfile) return;
    const t = setTimeout(() => {
      if (inboundShownRef.current) return;
      inboundShownRef.current = true;
      const pick = DEMO_INBOUND[Math.floor(Math.random() * DEMO_INBOUND.length)];
      setInboundLike(pick);
    }, 18000);
    return () => clearTimeout(t);
  }, [isGhost]);

  // Base profiles with distance injected (Indonesian + international)
  const allProfiles = useMemo<GhostProfile[]>(() => {
    const raw = generateIndonesianProfiles();
    const indonesian: GhostProfile[] = raw.slice(0, 60).map((p) => {
      const lat = (p as any).latitude ?? undefined;
      const lng = (p as any).longitude ?? undefined;
      const distanceKm =
        userLat !== null && userLon !== null && lat !== undefined && lng !== undefined
          ? haversineKm(userLat, userLon, lat, lng)
          : undefined;
      return {
        id: p.id,
        name: p.name,
        age: p.age,
        city: p.city,
        country: "Indonesia",
        countryFlag: "🇮🇩",
        image: (p as any).image || (p as any).avatar_url || "/placeholder.svg",
        last_seen_at: (p as any).last_seen_at ?? null,
        gender: p.gender || "Female",
        latitude: lat,
        longitude: lng,
        distanceKm,
        lastActiveHoursAgo: activeHoursAgo(p.id),
        isVerified: profileIsVerified(p.id),
      };
    });
    // Merge international profiles (no GPS distance for these)
    const intl = INTL_PROFILES.map((p) => ({ ...p, lastActiveHoursAgo: activeHoursAgo(p.id), isVerified: profileIsVerified(p.id) }));
    return [...indonesian, ...intl];
  }, [userLat, userLon]);

  // Filtered + sorted profiles (excludes passed/refused)
  const profiles = useMemo(() => {
    return allProfiles
      .filter((p) => {
        if (passedIds.has(p.id)) return false;
        if (p.lastActiveHoursAgo !== undefined && p.lastActiveHoursAgo > 24) return false;
        if (gender !== "all" && p.gender !== gender) return false;
        if (p.age < ageMin || p.age > ageMax) return false;
        if (maxKm !== 9999 && p.distanceKm !== undefined && p.distanceKm > maxKm) return false;
        if (filterCountry && p.country !== filterCountry) return false;
        if (onlineOnly && !isOnline(p.last_seen_at)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
        return 0;
      });
  }, [allProfiles, gender, ageMin, ageMax, maxKm, filterCountry, onlineOnly, passedIds]);

  const saveMatch = (profile: GhostProfile) => {
    const next = [
      ...savedMatches.filter((m) => m.id !== profile.id && Date.now() - m.matchedAt < MATCH_EXPIRY_MS),
      { id: profile.id, profile, matchedAt: Date.now() },
    ];
    setSavedMatches(next);
    persistMatches(next);
  };

  const handleLike = (profile: GhostProfile) => {
    const newLiked = new Set(likedIds);
    newLiked.add(profile.id);
    setLikedIds(newLiked);
    // Track daily likes for dashboard
    try {
      const key = `ghost_likes_today_${new Date().toISOString().slice(0, 10)}`;
      localStorage.setItem(key, String((parseInt(localStorage.getItem(key) ?? "0") || 0) + 1));
      // Bump streak if first like today
      const streakKey = "ghost_streak";
      const lastKey = "ghost_streak_last_day";
      const today = new Date().toISOString().slice(0, 10);
      const last = localStorage.getItem(lastKey);
      if (last !== today) {
        const streak = parseInt(localStorage.getItem(streakKey) ?? "0") || 0;
        localStorage.setItem(streakKey, String(last === new Date(Date.now() - 86400000).toISOString().slice(0, 10) ? streak + 1 : 1));
        localStorage.setItem(lastKey, today);
      }
    } catch {}

    // ⚡ Flash: user is live + profile is Flash-active → instant WhatsApp, no waiting
    if (isFlashActive && isFlashProfile(profile.id)) {
      if (flashContactsUsed >= FLASH_CONTACT_LIMIT) {
        // Cap reached — show toast, no match
        setShowFlashLimitToast(true);
        setTimeout(() => setShowFlashLimitToast(false), 3500);
        setTimeout(() => setSelectedProfile(null), 300);
        return;
      }
      const nextCount = flashContactsUsed + 1;
      setFlashContactsUsed(nextCount);
      try { localStorage.setItem("ghost_flash_contacts_used", String(nextCount)); } catch {}
      setTimeout(() => {
        setSelectedProfile(null);
        saveMatch(profile);
        setFlashMatchProfile(profile);
      }, 300);
      return;
    }

    const likeCount = newLiked.size;
    if (likeCount % 3 === 0) {
      setTimeout(() => {
        setSelectedProfile(null);
        saveMatch(profile);
        // Everyone sees the match celebration — paywall only triggers on "Connect WhatsApp"
        setMatchProfile(profile);
      }, 600);
    } else {
      setTimeout(() => setSelectedProfile(null), 400);
    }
  };

  // ── Quick Exit ───────────────────────────────────────────────────────────
  if (quickExit) {
    return (
      <div
        style={{ position: "fixed", inset: 0, background: "#f2f2f7", zIndex: 99999, cursor: "pointer" }}
        onClick={() => setQuickExit(false)}
      >
        <div style={{ padding: "60px 20px 0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          <div style={{ height: 44, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", marginBottom: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#e5e5ea" }} />
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e5e5ea" }} />
          </div>
          <div style={{ background: "#fff", borderRadius: 12, height: 200, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }} />
        </div>
      </div>
    );
  }

  return (
    /* Desktop: centred column, max 480px, fills viewport height */
    <div translate="no" style={{ minHeight: "100dvh", background: "#050508", display: "flex", justifyContent: "center" }}>
    <div style={{ width: "100%", maxWidth: 480, minHeight: "100dvh", background: "#050508", color: "#fff", display: "flex", flexDirection: "column", position: "relative" }}>
      <GhostParticles />
      <GhostInstallBanner />

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingTop: `max(12px, env(safe-area-inset-top, 12px))`,
      }}>
        {/* Top row: title + primary actions */}
        <div style={{ padding: "0 16px 10px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
            <img src="https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasd.png" alt="2Ghost" style={{ width: 78, height: 78, objectFit: "contain" }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h1 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>
                  <span style={{ color: "#4ade80", fontWeight: 900 }}>2</span>Ghost
                </h1>
                <span style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 6, padding: "1px 6px", fontSize: 9, fontWeight: 700, color: "rgba(74,222,128,0.9)", letterSpacing: "0.08em" }}>
                  {plan === "bundle" ? "GHOST + VIP" : "ACTIVE"}
                </span>
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", margin: 0 }}>Invisible · Photo · Name · Age · City only</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => navigate("/ghost/dashboard")}
              title="Dashboard"
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(74,222,128,0.7)",
              }}
            >
              <LayoutDashboard size={15} />
            </button>
            <button
              onClick={() => { setSettingsGateFeature(null); setShowSettingsSheet(true); }}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.3)",
              }}
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* Feature strip — bare icon + label, no container */}
        <div style={{ padding: "0 10px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>

          {/* Room */}
          <button onClick={() => navigate("/ghost/room")}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
          >
            <span style={{ fontSize: 24, lineHeight: 1 }}>🚪</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Room</span>
          </button>

          {/* House */}
          <button onClick={() => setShowHouseModal(true)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
          >
            <span style={{ fontSize: 24, lineHeight: 1 }}>{houseTier === "black" ? "🖤" : "🏠"}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: houseTier === "black" ? "rgba(212,175,55,0.9)" : houseTier === "house" ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.5)" }}>
              {houseTier === "black" ? "Black" : "House"}
            </span>
          </button>

          {/* Tonight */}
          <button onClick={toggleTonight}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 4px", position: "relative" }}
          >
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Moon size={22} color={isTonightMode ? "#4ade80" : "rgba(255,255,255,0.55)"} fill={isTonightMode ? "rgba(74,222,128,0.35)" : "none"} />
              {isTonightMode && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{
                    position: "absolute", top: -3, right: -3,
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#4ade80", display: "block",
                    boxShadow: "0 0 6px rgba(74,222,128,0.9)",
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: isTonightMode ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.5)" }}>
              {isTonightMode ? "LIVE" : "Tonight"}
            </span>
          </button>

          {/* Shield */}
          <button onClick={() => navigate("/ghost/block")}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
          >
            <img src={SHIELD_LOGO} alt="shield" style={{ width: 26, height: 26, objectFit: "contain" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Shield</span>
          </button>

          {/* Filter — colour-cycling round button, no glow */}
          <button
            onClick={() => setShowFilters(true)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: FILTER_GLOWS[filterGlowIdx].replace("0.8", "0.12"),
              border: `1.5px solid ${FILTER_GLOWS[filterGlowIdx].replace("0.8", "0.6")}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.6s, border-color 0.6s",
            }}>
              <SlidersHorizontal size={14} color={FILTER_GLOWS[filterGlowIdx].replace("0.8", "1")} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: FILTER_GLOWS[filterGlowIdx].replace("0.8", "0.9"), transition: "color 0.6s" }}>Filter</span>
          </button>

        </div>
      </div>

      {/* Filter slide-up sheet */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFilters(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="ghost-flash-scroll"
              style={{
                position: "fixed", bottom: 0,
                left: "50%", transform: "translateX(-50%)",
                width: "100%", maxWidth: 480,
                background: "rgba(8,8,14,0.98)", backdropFilter: "blur(30px)",
                borderRadius: "22px 22px 0 0",
                border: "1px solid rgba(255,255,255,0.08)",
                paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
                maxHeight: "85dvh", overflowY: "auto",
                scrollbarWidth: "none",
              }}
            >
              {/* Handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
              </div>
              {/* Sheet header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SlidersHorizontal size={16} color="rgba(74,222,128,0.9)" />
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Filters</span>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 16, fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>
              <div style={{ padding: "0 18px" }}>
                <FilterBar
                  gender={gender} setGender={setGender}
                  ageMin={ageMin} ageMax={ageMax} setAgeMin={setAgeMin} setAgeMax={setAgeMax}
                  maxKm={maxKm} setMaxKm={setMaxKm}
                  locationLoading={locationLoading} hasLocation={userLat !== null}
                  onRequestLocation={requestLocation}
                  filterCountry={filterCountry} setFilterCountry={setFilterCountry}
                  onlineOnly={onlineOnly} setOnlineOnly={setOnlineOnly}
                  lookingFor={lookingFor} setLookingFor={setLookingFor}
                />
              </div>
              <div style={{ padding: "14px 18px 0" }}>
                <button
                  onClick={() => setShowFilters(false)}
                  style={{
                    width: "100%", height: 44, borderRadius: 12, border: "none",
                    background: "linear-gradient(to bottom, #4ade80, #22c55e)",
                    color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ghost banner */}
      <div style={{ margin: "10px 14px 0", background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <img src={GHOST_LOGO} alt="ghost" style={{ width: 42, height: 42, objectFit: "contain" }} />
        <p style={{ fontSize: 11, color: "rgba(74,222,128,0.8)", margin: 0, fontWeight: 600 }}>
          You are invisible. Others only see your photo, name, age & city.
        </p>
      </div>

      {/* Tonight Mode banner */}
      <AnimatePresence>
        {isTonightMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ margin: "8px 14px 0", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}
          >
            <Moon size={12} color="rgba(74,222,128,0.9)" fill="rgba(74,222,128,0.3)" />
            <p style={{ fontSize: 11, color: "rgba(74,222,128,0.9)", margin: 0, fontWeight: 700 }}>
              <span>Tonight Mode is ON · resets at midnight</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px 0" }}>
        {[
          { label: "Liked", value: likedIds.size },
          { label: "Active now", value: profiles.filter((p) => isOnline(p.last_seen_at)).length },
          { label: "Showing", value: profiles.length },
        ].map(({ label, value }) => (
          <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: "8px 0", textAlign: "center" }}>
            <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>{value}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Ghost Flash ── */}
      <GhostFlashSection
        isActive={isFlashActive}
        flashUntil={flashUntil}
        flashTick={flashTick}
        flashProfiles={profiles.filter((p) => isFlashProfile(p.id)).slice(0, 10)}
        onEnter={enterFlash}
        onExit={exitFlash}
        onSelectProfile={(p) => setSelectedProfile(p)}
        contactsUsed={flashContactsUsed}
        contactLimit={FLASH_CONTACT_LIMIT}
      />

      {/* ── Ghost Pulse row — hidden when Flash is active ── */}
      {!isFlashActive && <GhostPulseRow profiles={profiles} onSelect={(p) => setSelectedProfile(p)} />}

      {/* ── Active today banner ── */}
      <div style={{ margin: "10px 14px 0", background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
        <Clock size={11} color="rgba(74,222,128,0.7)" />
        <p style={{ fontSize: 10, color: "rgba(74,222,128,0.7)", margin: 0, fontWeight: 600 }}>
          <span>Profiles refresh daily — <strong>{profiles.length}</strong> active today</span>
        </p>
      </div>

      {/* ── Active matches row (48h expiry) ── */}
      {savedMatches.filter((m) => Date.now() - m.matchedAt < MATCH_EXPIRY_MS).length > 0 && (
        <div style={{ margin: "10px 14px 0" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", margin: "0 0 6px", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            <span>Matches · expires in</span>
          </p>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {savedMatches
              .filter((m) => Date.now() - m.matchedAt < MATCH_EXPIRY_MS)
              .map((m) => (
                <div
                  key={m.id}
                  onClick={() => setMatchProfile(m.profile)}
                  style={{
                    flexShrink: 0, width: 70, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}
                >
                  <div style={{ position: "relative", width: 54, height: 54 }}>
                    <img
                      src={m.profile.image} alt=""
                      style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(74,222,128,0.5)" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: "conic-gradient(rgba(74,222,128,0.6) 0%, transparent 0%)",
                      opacity: 0.4,
                    }} />
                  </div>
                  <p style={{ fontSize: 8, color: "rgba(255,183,0,0.85)", margin: 0, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                    <span>{matchCountdown(m.matchedAt)}</span>
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Referral banner (women only) ── */}
      {isFemale && (
        <div style={{
          margin: "10px 14px 0",
          background: "linear-gradient(135deg, rgba(236,72,153,0.08), rgba(168,85,247,0.08))",
          border: "1px solid rgba(236,72,153,0.2)",
          borderRadius: 12, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🎁</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(244,114,182,0.9)", margin: "0 0 2px" }}>
              <span>Invite a friend · she gets free access</span>
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>
              <span>You get 2 weeks free when she joins</span>
            </p>
          </div>
          <button
            onClick={() => {
              const ghostId = (() => { try { const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}"); return toGhostId(p.id || "anon"); } catch { return toGhostId("anon"); } })();
              const url = `${window.location.origin}/ghost/auth?ref=${ghostId}`;
              if (navigator.share) {
                navigator.share({ title: "Join Ghost House", text: "I'm on Ghost — join me, it's free for women 👻", url });
              } else {
                navigator.clipboard.writeText(url).then(() => {
                  setReferralCopied(true);
                  setTimeout(() => setReferralCopied(false), 2500);
                });
              }
            }}
            style={{
              flexShrink: 0, height: 32, paddingInline: 12, borderRadius: 9,
              background: "linear-gradient(135deg, #be185d, #ec4899)",
              border: "none", color: "#fff", fontSize: 11, fontWeight: 800,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}
          >
            {referralCopied ? <><Check size={11} /><span>Copied!</span></> : <><Gift size={11} /><span>Invite</span></>}
          </button>
        </div>
      )}

      {/* ── Found Boo banner ── */}
      <AnimatePresence>
        {isProfilePaused && foundBoo && (
          <FoundBooBanner
            foundBoo={foundBoo}
            onReactivate={() => {
              try { localStorage.removeItem("ghost_found_boo"); } catch {}
              setFoundBoo(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Profile grid */}
      {profiles.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: 0.5 }}>
          <img src={GHOST_LOGO} alt="ghost" style={{ width: 120, height: 120, objectFit: "contain" }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>No profiles match your filters.<br />Try widening your search.</p>
        </div>
      ) : (
        <div style={{ flex: 1, padding: "12px 14px 24px", paddingBottom: `max(24px, env(safe-area-inset-bottom, 24px))`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {profiles.map((profile) => (
            <GhostCard
              key={profile.id}
              profile={profile}
              liked={likedIds.has(profile.id)}
              onClick={() => setSelectedProfile(profile)}
              isRevealed={revealedIds.has(profile.id)}
              onReveal={() => handleReveal(profile.id)}
              canReveal={isGhost || isFemale}
              isTonight={isProfileTonight(profile.id)}
              houseTier={profileHouseTier(profile.id)}
              isFlagged={!!flaggedProfiles[profile.id]}
              onFlagOpen={() => { const gId = toGhostId(profile.id); setFlagSheet({ profileId: profile.id, ghostId: gId }); }}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedProfile && (
          <GhostProfilePopup profile={selectedProfile} liked={likedIds.has(selectedProfile.id)} onLike={() => handleLike(selectedProfile)} onClose={() => setSelectedProfile(null)} onPass={() => handlePass(selectedProfile.id)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {matchProfile && (
          <GhostMatchPopup
            profile={matchProfile}
            isSubscribed={isGhost}
            onClose={() => setMatchProfile(null)}
            onConnectWhatsApp={() => {
              if (isGhost) {
                // Subscriber — open WhatsApp directly
                if (matchProfile) handleFoundBoo(matchProfile);
                setMatchProfile(null);
              } else {
                // Free user — show subscription plans
                setMatchPaywallProfile(matchProfile);
                setMatchProfile(null);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Subscription plans — shown when free user taps "Connect on WhatsApp" ── */}
      <AnimatePresence>
        {matchPaywallProfile && (
          <MatchPaywallModal
            profile={matchPaywallProfile}
            onPay={(planKey) => {
              try {
                localStorage.setItem("ghost_mode_until", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
                localStorage.setItem("ghost_mode_plan", planKey);
              } catch {}
              activate(planKey as "ghost" | "bundle");
              if (matchPaywallProfile) handleFoundBoo(matchPaywallProfile);
              setMatchPaywallProfile(null);
            }}
            onClose={() => setMatchPaywallProfile(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Flash match popup ── */}
      <AnimatePresence>
        {flashMatchProfile && (
          <GhostFlashMatchPopup
            profile={flashMatchProfile}
            onClose={() => setFlashMatchProfile(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Flash contact limit toast ── */}
      <AnimatePresence>
        {showFlashLimitToast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            style={{
              position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
              zIndex: 9999, background: "rgba(15,15,20,0.96)", border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 14, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 18 }}>⚡</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#f87171", margin: 0 }}>Flash limit reached</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                {FLASH_CONTACT_LIMIT} contacts per session — enter a new Flash window to reset
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shield blocked-attempt alert ── */}
      <AnimatePresence>
        {showBlockedAlert && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBlockedAlert(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9990, backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: "calc(100% - 40px)", maxWidth: 340,
                zIndex: 9991,
                background: "rgba(6,10,6,0.97)",
                border: "1px solid rgba(74,222,128,0.35)",
                borderRadius: 22,
                padding: "26px 22px 20px",
                boxShadow: "0 0 60px rgba(74,222,128,0.1), 0 24px 48px rgba(0,0,0,0.7)",
                backdropFilter: "blur(24px)",
                textAlign: "center",
              }}
            >
              {/* Top accent */}
              <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)", borderRadius: "4px 4px 0 0", position: "absolute", top: 0, left: 0, right: 0 }} />

              {/* Shield logo */}
              <motion.div
                animate={{ scale: [1, 1.07, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}
              >
                <img src={SHIELD_LOGO} alt="shield" style={{ width: 64, height: 64, objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(74,222,128,0.5))" }} />
              </motion.div>

              <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(74,222,128,0.8)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>
                🛡️ Alert Ghost
              </p>
              <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 10px", lineHeight: 1.35 }}>
                1 of your Shield numbers has tried to gain access to the Ghost House
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 22px", lineHeight: 1.6 }}>
                Don't stress — we guarded the gates as requested.
              </p>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowBlockedAlert(false)}
                style={{
                  width: "100%", height: 46, borderRadius: 50, border: "none",
                  background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
                  color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 20px rgba(34,197,94,0.4)",
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
                Thanks 2Ghost
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Ghost House modal ── */}
      <AnimatePresence>
        {showHouseModal && (
          <GhostHouseModal
            currentTier={houseTier}
            onClose={() => setShowHouseModal(false)}
            onPurchase={handleHousePurchase}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {inboundLike && (
          <InboundLikePopup
            like={inboundLike}
            onLikeBack={() => {
              const matched: GhostProfile = {
                id: inboundLike.id, name: inboundLike.name, age: inboundLike.age,
                city: inboundLike.city, country: inboundLike.country, countryFlag: inboundLike.countryFlag,
                image: inboundLike.image, gender: "Female",
              };
              saveMatch(matched);
              setInboundLike(null);
              // Everyone sees the match celebration — paywall only triggers on "Connect WhatsApp"
              setMatchProfile(matched);
            }}
            onPass={() => setInboundLike(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Settings Sheet ── */}
      <AnimatePresence>
        {showSettingsSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSettingsSheet(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9000, backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              style={{
                position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
                width: "100%", maxWidth: 480, zIndex: 9001,
                background: "rgba(10,12,16,0.98)", borderTop: "1px solid rgba(74,222,128,0.18)",
                borderRadius: "24px 24px 0 0", padding: "20px 20px 36px",
              }}
            >
              {/* Handle */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />

              <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.9)", margin: "0 0 6px", letterSpacing: 0.3 }}>
                Ghost Settings
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>
                Manage what you share in Ghost Mode
              </p>

              {settingsGateFeature ? (
                /* Ghost Room gate message */
                <div style={{
                  background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)",
                  borderRadius: 16, padding: "20px 18px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🚪</div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "rgba(74,222,128,0.9)", margin: "0 0 6px" }}>
                    Ghost Room Required
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 18px", lineHeight: 1.5 }}>
                    You need to create your Ghost Room before sharing {settingsGateFeature.toLowerCase()}. Your room is the private link ghosts use to access your content.
                  </p>
                  <button
                    onClick={() => { setShowSettingsSheet(false); navigate("/ghost/room"); }}
                    style={{
                      height: 40, paddingInline: 24, borderRadius: 12,
                      background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.35)",
                      color: "rgba(74,222,128,0.9)", fontSize: 13, fontWeight: 800, cursor: "pointer",
                    }}
                  >
                    Set Up Ghost Room
                  </button>
                  <button
                    onClick={() => setSettingsGateFeature(null)}
                    style={{
                      display: "block", margin: "12px auto 0", background: "none", border: "none",
                      color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer",
                    }}
                  >
                    ← Back
                  </button>
                </div>
              ) : (
                /* 2×2 feature grid */
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { icon: "🎥", label: "Video", desc: "Share video clips" },
                    { icon: "🖼️", label: "Images", desc: "Share photo gallery" },
                    { icon: "👥", label: "Contacts", desc: "Share contact list" },
                    { icon: null, label: "Shield", desc: "Block unwanted ghosts", isShield: true },
                  ].map(({ icon, label, desc, isShield }) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (isShield) {
                          setShowSettingsSheet(false);
                          navigate("/ghost/block");
                        } else {
                          const hasRoom = !!localStorage.getItem("ghost_room_code");
                          if (!hasRoom) {
                            setSettingsGateFeature(label);
                          } else {
                            setShowSettingsSheet(false);
                            navigate("/ghost/room");
                          }
                        }
                      }}
                      style={{
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 16, padding: "18px 14px", textAlign: "left", cursor: "pointer",
                        display: "flex", flexDirection: "column", gap: 8,
                      }}
                    >
                      {isShield
                        ? <img src={SHIELD_LOGO} alt="shield" style={{ width: 72, height: 72, objectFit: "contain" }} />
                        : <span style={{ fontSize: 28 }}>{icon}</span>
                      }
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.85)", margin: 0 }}>{label}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Flag / Report sheet ── */}
      <AnimatePresence>
        {flagSheet && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setFlagSheet(null); setFlagReason(""); }}
            style={{
              position: "fixed", inset: 0, zIndex: 500,
              background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(8,6,6,0.98)",
                borderRadius: "20px 20px 0 0",
                border: "1px solid rgba(239,68,68,0.2)", borderBottom: "none",
                padding: "0 18px max(28px, env(safe-area-inset-bottom, 28px))",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, #ef4444, #f87171)", borderRadius: "4px 4px 0 0" }} />
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 16px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Report {flagSheet.ghostId}</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>
                Select a reason. This profile will be flagged for admin review and frozen until investigated.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[
                  { key: "spam", label: "Spam or repeated harassment", icon: "🚫" },
                  { key: "fake", label: "Fake profile or catfishing", icon: "🎭" },
                  { key: "inappropriate", label: "Inappropriate content", icon: "⚠️" },
                  { key: "threatening", label: "Threatening or abusive behaviour", icon: "🛑" },
                  { key: "underage", label: "Appears to be underage", icon: "🔞" },
                ].map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setFlagReason(r.key)}
                    style={{
                      width: "100%", height: 46, borderRadius: 12, padding: "0 14px",
                      background: flagReason === r.key ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
                      border: flagReason === r.key ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      color: flagReason === r.key ? "#f87171" : "rgba(255,255,255,0.7)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                    }}
                  >
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleFlag}
                disabled={!flagReason}
                style={{
                  width: "100%", height: 48, borderRadius: 50, border: "none",
                  background: flagReason ? "linear-gradient(to bottom, #f87171, #ef4444)" : "rgba(255,255,255,0.07)",
                  color: flagReason ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: 14, fontWeight: 900, cursor: flagReason ? "pointer" : "default",
                  boxShadow: flagReason ? "0 4px 16px rgba(239,68,68,0.4)" : "none",
                  marginBottom: 10,
                }}
              >
                Submit Report
              </motion.button>
              <button
                onClick={() => { setFlagSheet(null); setFlagReason(""); }}
                style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "4px 0" }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── First-entry welcome popup ── */}
      <AnimatePresence>
        {showModeWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModeWelcome(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(4,8,4,0.97)",
                borderRadius: "24px 24px 0 0",
                border: "1px solid rgba(74,222,128,0.2)", borderBottom: "none",
                padding: "0 22px max(36px, env(safe-area-inset-bottom, 36px))",
                boxShadow: "0 -24px 80px rgba(0,0,0,0.7)",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, #15803d, #4ade80, #22c55e)", marginLeft: -22, marginRight: -22 }} />
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 18px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.35 }}
                style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 6px" }}
              >
                You're in the Ghost House.
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "0 0 18px" }}
              >
                Anonymous until you match. Real people. Real chemistry. No followers, no stories — just connection.
              </motion.p>

              {/* Feature bullets */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28, duration: 0.4 }}
                style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}
              >
                {[
                  { icon: "👆", text: "Tap a card to flip it — reveal their bio, activity, and intentions" },
                  { icon: "❤️", text: "Like freely. When they like back it's a mutual match — no one-sided alerts" },
                  { icon: "🌙", text: "Tonight Mode — signal you're available right now until midnight" },
                  { icon: "🛡️", text: "Shield blocks unwanted numbers and entire countries from reaching you" },
                  { icon: "🚩", text: "Flag any profile — our team investigates quietly within 24 hours" },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.5 }}>{icon}</span>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.55 }}>{text}</p>
                  </div>
                ))}
              </motion.div>

              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.15), transparent)", marginBottom: 18 }} />

              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowModeWelcome(false)}
                style={{
                  width: "100%", height: 52, borderRadius: 50, border: "none",
                  background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
                  color: "#fff", fontSize: 15, fontWeight: 900,
                  cursor: "pointer", letterSpacing: "0.03em",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 24px rgba(34,197,94,0.4)",
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
                Enter Ghost Mode →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dev Panel ── */}
      <DevPanel
        isTonightMode={isTonightMode}
        toggleTonight={toggleTonight}
        isFlashActive={isFlashActive}
        enterFlash={enterFlash}
        exitFlash={exitFlash}
        houseTier={houseTier}
        setHouseTier={setHouseTier}
        activate={activate}
        deactivate={deactivate}
        onTriggerFlashMatch={() => {
          const pick = profiles.filter((p) => isFlashProfile(p.id))[0] ?? profiles[0];
          if (pick) setFlashMatchProfile(pick);
        }}
        onTriggerMatch={() => {
          const pick = profiles[Math.floor(Math.random() * Math.min(profiles.length, 10))];
          if (pick) { saveMatch(pick); setMatchProfile(pick); }
        }}
        onTriggerInbound={() => {
          const pick = DEMO_INBOUND[Math.floor(Math.random() * DEMO_INBOUND.length)];
          setInboundLike(pick);
        }}
      />

    </div>
    </div>
  );
}
