import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Menu, X, LogOut, Edit2, ChevronDown, ChevronUp,
  Home, User, Coins, Shield, Info, ShoppingBag, Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PHONE_APPS, getUsernamePlatform } from "../data/connectPlatforms";
import { useLanguage } from "@/i18n/LanguageContext";
import { DATE_IDEAS } from "../data/dateIdeas";
import { saveProfileToSupabase } from "../ghostProfileService";
import { PROFILE_BADGES, BADGE_CATEGORIES } from "../data/profileBadges";
import GhostFaceVerify from "../components/GhostFaceVerify";
import GhostReferralSheet from "../components/GhostReferralSheet";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { readTransactions, CoinTransaction } from "../hooks/useCoins";

const GHOST_LOGO    = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";
const FOUND_BOO_STAMP = "https://ik.imagekit.io/7grri5v7d/Found%20Boo%20postage%20stamp%20design.png";

// ── Design tokens ──────────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: 16,
};

// ── Types ──────────────────────────────────────────────────────────────────────
type TabId = "home" | "profile" | "coins" | "safety" | "info";

type FoundBooData = {
  matchProfileId: string;
  matchProfileImage: string;
  matchName: string;
  connectedAt: number;
  pausedUntil: number;
  canReactivateAt: number;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtCountdown(ms: number): string {
  if (ms <= 0) return "0m";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtTxDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getLikesToday(): number {
  const k = `ghost_likes_today_${new Date().toISOString().slice(0, 10)}`;
  try { return parseInt(localStorage.getItem(k) ?? "0", 10) || 0; } catch { return 0; }
}
function getStreak(): number {
  try { return parseInt(localStorage.getItem("ghost_streak") ?? "0", 10) || 0; } catch { return 0; }
}
function toGhostIdDash(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i) | 0;
  return `Guest-${1000 + Math.abs(h) % 9000}`;
}

// ── Custom animated Dropdown ────────────────────────────────────────────────
type DropdownOption<K extends string = string> = {
  key: K;
  label: string;
  emoji?: string;
  header?: boolean;   // non-selectable group header
};

function Dropdown<K extends string>({
  value, options, onChange, placeholder, accent,
}: {
  value: K | "";
  options: DropdownOption<K>[];
  onChange: (key: K) => void;
  placeholder: string;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => !o.header && o.key === value);
  const accentColor = accent ?? "#fbbf24";

  return (
    <div style={{ position: "relative", userSelect: "none" }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", height: 48, borderRadius: 14, padding: "0 14px",
          background: value ? `${accentColor}0d` : "rgba(255,255,255,0.04)",
          border: `1px solid ${value ? accentColor + "44" : "rgba(255,255,255,0.1)"}`,
          color: value ? accentColor : "rgba(255,255,255,0.35)",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
          transition: "all 0.15s",
        }}
      >
        {selected?.emoji && <span style={{ fontSize: 16 }}>{selected.emoji}</span>}
        <span style={{ flex: 1, textAlign: "left" }}>{selected?.label ?? placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} style={{ display: "flex" }}>
          <ChevronDown size={15} style={{ color: open ? accentColor : "rgba(255,255,255,0.35)" }} />
        </motion.span>
      </button>

      {/* List */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 200,
              background: "#0d0d1c", border: `1px solid ${accentColor}30`,
              borderRadius: 14, overflow: "hidden",
              boxShadow: "0 16px 48px rgba(0,0,0,0.65)",
              maxHeight: 260, overflowY: "auto",
            }}
          >
            {options.map((opt) =>
              opt.header ? (
                <div
                  key={opt.key}
                  style={{
                    padding: "8px 14px 4px",
                    fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {opt.label}
                </div>
              ) : (
                <button
                  key={opt.key}
                  onClick={() => { onChange(opt.key as K); setOpen(false); }}
                  style={{
                    width: "100%", padding: "11px 14px",
                    background: opt.key === value ? `${accentColor}12` : "transparent",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                    borderLeft: opt.key === value ? `2px solid ${accentColor}` : "2px solid transparent",
                    transition: "all 0.1s",
                  }}
                >
                  {opt.emoji && <span style={{ fontSize: 15 }}>{opt.emoji}</span>}
                  <span style={{ flex: 1, fontSize: 13, fontWeight: opt.key === value ? 800 : 500, color: opt.key === value ? accentColor : "rgba(255,255,255,0.65)", textAlign: "left" }}>
                    {opt.label}
                  </span>
                  {opt.key === value && <Check size={12} style={{ color: accentColor, flexShrink: 0 }} />}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-outside dismiss */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 199 }}
        />
      )}
    </div>
  );
}

// ── Bottom tab config ──────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string; Icon: typeof Home }[] = [
  { id: "home",    label: "Home",    Icon: Home        },
  { id: "profile", label: "Profile", Icon: User        },
  { id: "coins",   label: "Coins",   Icon: Coins       },
  { id: "safety",  label: "Safety",  Icon: Shield      },
  { id: "info",    label: "Info",    Icon: Info        },
];

// ── Drawer app links ───────────────────────────────────────────────────────────
const DRAWER_LINKS = [
  { label: "Ghost Mode",       emoji: "👻", to: "/ghost/mode"            },
  { label: "Hotel Rooms",      emoji: "🏨", to: "/ghost/rooms"           },
  { label: "Ghost Map",        emoji: "🗺️",  to: "/ghost/map"            },
  { label: "Games Room",       emoji: "🎮", to: "/ghost/games"           },
  { label: "Breakfast Lounge", emoji: "🍳", to: "/ghost/breakfast-lounge"},
  { label: "Activities",       emoji: "✨", to: "/ghost/activities"      },
  { label: "Coin Shop",        emoji: "🪙", to: "/ghost/pricing"         },
  { label: "Edit Profile",     emoji: "✏️",  to: "/ghost/setup"          },
  { label: "Hotel Room Info",  emoji: "🛎️",  to: "/ghost/room"           },
];

// ── TX badge color ─────────────────────────────────────────────────────────────
function txColor(tx: CoinTransaction): string {
  if (tx.amount > 0) return "#4ade80";
  return "#f87171";
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function GhostDashboardPage() {
  const a        = useGenderAccent();
  const navigate = useNavigate();
  const { t }    = useLanguage();

  // ── Nav state ──
  const [activeTab, setActiveTab]   = useState<TabId>("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickExit, setQuickExit]   = useState(false);

  // ── First-entry welcome ──
  const [showDashWelcome, setShowDashWelcome] = useState(false);
  useEffect(() => {
    if (!sessionStorage.getItem("ghost_dash_welcome_seen")) {
      const timer = setTimeout(() => {
        setShowDashWelcome(true);
        sessionStorage.setItem("ghost_dash_welcome_seen", "1");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  // ── Profile data ──
  const profileData = (() => {
    try { const r = localStorage.getItem("ghost_profile"); return r ? JSON.parse(r) : null; } catch { return null; }
  })();
  const connectPhone: string | null      = profileData?.connectPhone ?? null;
  const connectAlt: string | null        = profileData?.connectAlt ?? null;
  const connectAltHandle: string | null  = profileData?.connectAltHandle ?? null;
  const altPlatform = connectAlt ? getUsernamePlatform(connectAlt) : undefined;

  // Profile editable fields
  const [firstDateIdea, setFirstDateIdea] = useState<string>(profileData?.firstDateIdea ?? "");
  const [profileBadge,  setProfileBadge]  = useState<string>(profileData?.badge ?? "");
  const [religion,      setReligion]      = useState<string>(profileData?.religion ?? "");
  const [contactPref,   setContactPref]   = useState<"video" | "connect">(() => {
    try { return (localStorage.getItem("ghost_contact_pref") as "video" | "connect") || "connect"; } catch { return "connect"; }
  });
  const [butlerAddress,     setButlerAddress]     = useState<string>(() => {
    try { return localStorage.getItem("ghost_butler_address") ?? ""; } catch { return ""; }
  });
  const [butlerOptIn,       setButlerOptIn]       = useState<boolean>(() => {
    try { return localStorage.getItem("ghost_butler_optin") === "1"; } catch { return false; }
  });
  const [butlerAddressEdit, setButlerAddressEdit] = useState(false);
  const [profileSaved,      setProfileSaved]      = useState(false);

  // ── Face Verify / Referral modals ──
  const [faceVerified,   setFaceVerified]   = useState<boolean>(() => {
    try { return localStorage.getItem("ghost_face_verified") === "1"; } catch { return false; }
  });
  const [showFaceVerify, setShowFaceVerify] = useState(false);
  const [showReferral,   setShowReferral]   = useState(false);

  // ── Activity data ──
  const [likesToday] = useState(getLikesToday);
  const [streak]     = useState(getStreak);
  const savedMatchCount = (() => {
    try {
      const raw = localStorage.getItem("ghost_matches");
      if (!raw) return 0;
      const all = JSON.parse(raw);
      return all.filter((m: { matchedAt: number }) => Date.now() - m.matchedAt < 48 * 3600000).length;
    } catch { return 0; }
  })();

  // ── Found Boo ──
  const [foundBoo, setFoundBoo] = useState<FoundBooData | null>(() => {
    try { const r = localStorage.getItem("ghost_found_boo"); return r ? JSON.parse(r) : null; } catch { return null; }
  });
  const [tonightStatus, setTonightStatus] = useState<"available" | "busy">(() => {
    try { return (localStorage.getItem("ghost_tonight_status") as "available" | "busy") || "available"; } catch { return "available"; }
  });
  const isTonightActive = (() => {
    try { return Number(localStorage.getItem("ghost_tonight_until") || 0) > Date.now(); } catch { return false; }
  })();

  // ── Coins & transactions ──
  const coinBalance = (() => {
    try { return Math.max(0, parseInt(localStorage.getItem("ghost_coins") || "0", 10)); } catch { return 0; }
  })();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  useEffect(() => {
    if (activeTab === "coins") setTransactions(readTransactions());
  }, [activeTab]);

  // ── Blocked profiles ──
  const [blockedIds, setBlockedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("ghost_reported_ids") || "[]"); } catch { return []; }
  });
  const handleUnblock = (id: string) => {
    const next = blockedIds.filter((b) => b !== id);
    setBlockedIds(next);
    try { localStorage.setItem("ghost_reported_ids", JSON.stringify(next)); } catch {}
  };

  // ── Tick ──
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  void tick;

  const isBooActive   = foundBoo && foundBoo.pausedUntil > Date.now();
  const canReactivate = foundBoo ? Date.now() >= foundBoo.canReactivateAt : false;

  // ── Save profile ──
  const saveField = async (field: string, value: string | null) => {
    try {
      const updated = { ...(profileData ?? {}), [field]: value || null };
      localStorage.setItem("ghost_profile", JSON.stringify(updated));
      const phone = localStorage.getItem("ghost_phone") ?? "";
      if (phone) await saveProfileToSupabase(phone, updated);
    } catch {}
  };

  const handleSaveProfile = async () => {
    try {
      const updated = {
        ...(profileData ?? {}),
        firstDateIdea: firstDateIdea || null,
        badge:         profileBadge   || null,
        religion:      religion        || null,
        contactPref,
      };
      localStorage.setItem("ghost_profile", JSON.stringify(updated));
      const phone = localStorage.getItem("ghost_phone") ?? "";
      if (phone) await saveProfileToSupabase(phone, updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch {}
  };

  const handleContactPrefChange = (pref: "video" | "connect") => {
    setContactPref(pref);
    try { localStorage.setItem("ghost_contact_pref", pref); } catch {}
  };

  const handleButlerOptIn = (val: boolean) => {
    setButlerOptIn(val);
    try { localStorage.setItem("ghost_butler_optin", val ? "1" : "0"); } catch {}
  };
  const handleButlerAddressSave = (addr: string) => {
    setButlerAddress(addr);
    setButlerAddressEdit(false);
    try { localStorage.setItem("ghost_butler_address", addr); } catch {}
  };

  const toggleTonightStatus = () => {
    const next: "available" | "busy" = tonightStatus === "available" ? "busy" : "available";
    setTonightStatus(next);
    try { localStorage.setItem("ghost_tonight_status", next); } catch {}
  };

  // ── Dropdown option builders ──────────────────────────────────────────────────
  const dateIdeaOptions: DropdownOption<string>[] = DATE_IDEAS.map((d) => ({
    key: d.key, label: d.label, emoji: d.emoji,
  }));

  const badgeOptions: DropdownOption<string>[] = [];
  BADGE_CATEGORIES.forEach((cat) => {
    badgeOptions.push({ key: `__cat__${cat.key}`, label: cat.label, header: true });
    PROFILE_BADGES.filter((b) => b.category === cat.key).forEach((b) => {
      badgeOptions.push({ key: b.key, label: b.label, emoji: b.emoji });
    });
  });

  const religionOptions: DropdownOption<string>[] = [
    { key: "Muslim 🌙",       label: "Muslim",       emoji: "🌙" },
    { key: "Christian ✝️",    label: "Christian",    emoji: "✝️" },
    { key: "Catholic ✝️",     label: "Catholic",     emoji: "✝️" },
    { key: "Buddhist ☸️",     label: "Buddhist",     emoji: "☸️" },
    { key: "Hindu 🕉️",        label: "Hindu",        emoji: "🕉️" },
    { key: "Jewish ✡️",       label: "Jewish",       emoji: "✡️" },
    { key: "Spiritual 🌿",    label: "Spiritual",    emoji: "🌿" },
    { key: "Not religious 🙂",label: "Not religious",emoji: "🙂" },
  ];

  // ── Ghost stats helpers ───────────────────────────────────────────────────────
  const ghostId = (() => {
    try {
      const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
      const id = p.id || "anon";
      let h = 0;
      for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i) | 0;
      return `Guest-${1000 + Math.abs(h) % 9000}`;
    } catch { return "Guest-0000"; }
  })();

  const tier = (() => { try { return localStorage.getItem("ghost_house_tier") || "standard"; } catch { return "standard"; } })();
  const ROOM_MAP: Record<string, { label: string; icon: string; color: string; active: number; members: number }> = {
    standard:  { label: "Standard Room", icon: "🛏️", color: "#a8a8b0", active: 89,  members: 1247 },
    suite:     { label: "Ensuite",        icon: "🛎️", color: "#cd7f32", active: 34,  members: 428  },
    kings:     { label: "The Casino",    icon: "🎰", color: "#d4af37", active: 21,  members: 156  },
    penthouse: { label: "Penthouse",      icon: "🏙️", color: "#e0ddd8", active: 12,  members: 47   },
    cellar:    { label: "The Cellar",     icon: "🕯️", color: "#9b1c1c", active: 18,  members: 83   },
  };
  const room = ROOM_MAP[tier] ?? ROOM_MAP.standard;
  function seedStat(key: string, min: number, max: number): number {
    let h = 0; const s = ghostId + key;
    for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    return min + (Math.abs(h) % (max - min + 1));
  }
  const floorRank = seedStat("rank", 3, room.active);

  // Trust stars
  const rawId = (() => { try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}").id || "anon"; } catch { return "anon"; } })();
  function idHash(id: string): number {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = Math.imul(37, h) + id.charCodeAt(i) | 0;
    return Math.abs(h);
  }
  const months = idHash(rawId + "months") % 24;
  const stars   = Math.min(5, Math.floor(months / 2));
  const nextIn  = 2 - (months % 2);

  // ── Quick exit ────────────────────────────────────────────────────────────────
  if (quickExit) {
    return (
      <div
        style={{ position: "fixed", inset: 0, background: "#f2f2f7", zIndex: 99999, cursor: "pointer" }}
        onClick={() => setQuickExit(false)}
      >
        <div style={{ padding: "60px 20px 0", fontFamily: "system-ui,-apple-system,sans-serif" }}>
          <div style={{ height: 44, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", marginBottom: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#e5e5ea" }} />
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e5e5ea" }} />
          </div>
          <div style={{ background: "#fff", borderRadius: 12, height: 200, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }} />
        </div>
      </div>
    );
  }

  // ── Section: Home ──────────────────────────────────────────────────────────────
  function HomeSection() {
    return (
      <motion.div key="home" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
        style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 16 }}
      >

        {/* Found Boo */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Found Boo Status</p>
          <AnimatePresence mode="wait">
            {isBooActive && foundBoo ? (
              <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ ...CARD, border: `1px solid ${a.glow(0.3)}`, background: a.glow(0.05) }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={foundBoo.matchProfileImage} alt={foundBoo.matchName} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.5)}` }} />
                    <img src={FOUND_BOO_STAMP} alt="Found Boo" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", opacity: 0.9 }} />
                    <img src={GHOST_LOGO} alt="ghost" style={{ position: "absolute", bottom: -4, right: -4, width: 54, height: 54, objectFit: "contain" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 3px" }}>Found Boo</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 5px" }}>Connected with {foundBoo.matchName}</p>
                    <p style={{ fontSize: 12, color: a.accent, fontWeight: 700, margin: 0 }}>Resumes in {fmtCountdown(foundBoo.pausedUntil - Date.now())}</p>
                  </div>
                </div>
                <button onClick={canReactivate ? () => { try { localStorage.removeItem("ghost_found_boo"); } catch {} setFoundBoo(null); } : undefined}
                  style={{ width: "100%", height: 40, borderRadius: 10, border: "none", background: canReactivate ? a.glow(0.2) : "rgba(255,255,255,0.05)", color: canReactivate ? "#4ade80" : "rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 800, cursor: canReactivate ? "pointer" : "default" }}>
                  {canReactivate ? "Reactivate Early" : `Available in ${fmtCountdown(foundBoo.canReactivateAt - Date.now())}`}
                </button>
              </motion.div>
            ) : (
              <motion.div key="inactive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ ...CARD }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={GHOST_LOGO} alt="ghost" style={{ width: 78, height: 78, objectFit: "contain" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>No active Boo yet</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.4 }}>Your next connection will appear here</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const data: FoundBooData = { matchProfileId: "manual", matchProfileImage: "https://i.pravatar.cc/200?img=1", matchName: "Guest-Manual", connectedAt: Date.now(), pausedUntil: Date.now() + 72*60*60*1000, canReactivateAt: Date.now() + 60*60*1000 };
                    try { localStorage.setItem("ghost_found_boo", JSON.stringify(data)); } catch {}
                    setFoundBoo(data);
                  }}
                  style={{ width: "100%", height: 38, borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.05)", color: "rgba(239,68,68,0.6)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  Pause My Profile
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tonight Status */}
        {isTonightActive && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Tonight Status</p>
            <div style={{ ...CARD, display: "flex", alignItems: "center", gap: 14 }}>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: tonightStatus === "available" ? 1.4 : 2.2, repeat: Infinity }}
                style={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0, background: tonightStatus === "available" ? "#22c55e" : "#f97316", boxShadow: tonightStatus === "available" ? "0 0 10px rgba(34,197,94,0.8)" : "0 0 10px rgba(249,115,22,0.8)" }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>{tonightStatus === "available" ? "Available Now" : "Busy"}</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>{tonightStatus === "available" ? "Showing as available in Tonight lobby" : "Showing as busy"}</p>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={toggleTonightStatus}
                style={{ flexShrink: 0, height: 36, borderRadius: 10, border: "none", padding: "0 16px", background: tonightStatus === "available" ? "rgba(249,115,22,0.15)" : "rgba(34,197,94,0.15)", color: tonightStatus === "available" ? "#f97316" : "#22c55e", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                {tonightStatus === "available" ? "Set Busy" : "Set Available"}
              </motion.button>
            </div>
          </div>
        )}

        {/* Activity today */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>{t("dash.activityToday")}</p>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: t("dash.likesToday"), value: likesToday, icon: "❤️", color: "#ec4899" },
              { label: t("dash.streak"),     value: streak,     icon: "🔥", color: "#f97316" },
              { label: t("dash.matches"),    value: savedMatchCount, icon: "✨", color: a.accent },
            ].map(({ label, value, icon, color }) => (
              <div key={label} style={{ flex: 1, ...CARD, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "14px 8px" }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontSize: 22, fontWeight: 900, color }}>{value}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My Stats */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>My Stats</p>
          <div style={{ marginBottom: 10, padding: "10px 14px", background: `${room.color}0a`, border: `1px solid ${room.color}20`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: room.color }}>🏆 Floor Rank #{floorRank}</p>
              <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Among {room.active} active tonight · {room.icon} {room.label}</p>
            </div>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{room.members.toLocaleString()} total</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { icon: "👁️", label: "Profile views",  value: seedStat("views", 48, 312),      sub: "this month",   color: "#60a5fa" },
              { icon: "❤️", label: "Likes received",  value: seedStat("likes_recv", 12, 94),  sub: "from members", color: "#f472b6" },
              { icon: "🤍", label: "Likes sent",      value: (() => { try { return JSON.parse(localStorage.getItem("ghost_liked_ids")||"[]").length; } catch { return 0; } })(), sub: "by you", color: "#a78bfa" },
              { icon: "🔐", label: "Vault chats",     value: (() => { try { return Object.keys(localStorage).filter(k => k.startsWith("ghost_vault_chat_")).length; } catch { return 0; } })(), sub: "opened", color: "#fbbf24" },
              { icon: "🎁", label: "Gifts sent",      value: 0,                               sub: "total",        color: "#34d399" },
              { icon: "🪙", label: "Coins",           value: coinBalance,                     sub: "available",    color: "#ffd700" },
            ].map((s) => (
              <div key={s.label} style={{ background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: 14, padding: "12px 8px", textAlign: "center" }}>
                <span style={{ fontSize: 18, display: "block", marginBottom: 4 }}>{s.icon}</span>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</p>
                <p style={{ margin: "2px 0 0", fontSize: 9, color: "rgba(255,255,255,0.35)", lineHeight: 1.3 }}>{s.label}</p>
                <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.2)" }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Ghost Stars */}
        <div style={{ ...CARD }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Ghost Stars</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {stars > 0
                  ? <span style={{ fontSize: 20, letterSpacing: "0.08em", color: "#d4af37" }}>{"★".repeat(stars)}</span>
                  : <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>No stars yet</span>}
              </div>
            </div>
            <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 10, padding: "6px 12px", textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: "#d4af37" }}>{stars} / 5</p>
              <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>earned</p>
            </div>
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>
            Stay active and flag-free for <strong style={{ color: "#fff" }}>every 2 months</strong> and earn a ★ on your profile.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[2, 4, 6, 8, 10].map((m, i) => {
              const earned = months >= m;
              return (
                <div key={m} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 10, background: earned ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${earned ? "rgba(212,175,55,0.22)" : "rgba(255,255,255,0.05)"}` }}>
                  <span style={{ fontSize: 14, color: earned ? "#d4af37" : "rgba(255,255,255,0.15)" }}>★</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: earned ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)", flex: 1 }}>{m} months clean</span>
                  {earned
                    ? <span style={{ fontSize: 9, fontWeight: 800, color: "#d4af37" }}>Earned</span>
                    : i === stars ? <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>≈ {nextIn} month{nextIn > 1 ? "s" : ""} away</span>
                    : null}
                </div>
              );
            })}
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.55 }}>
            ⚠️ A verified complaint or flag resets your current star progress.
          </p>
        </div>

        {/* Quick actions */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Quick Actions</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Edit Profile", emoji: "✏️",  to: "/ghost/setup" },
              { label: "My Room",      emoji: "🚪", to: "/ghost/room"  },
              { label: "Activities",   emoji: "🏨", to: "/ghost/activities" },
              { label: "Back to Feed", emoji: "👻", to: "/ghost/mode"  },
            ].map((action) => (
              <motion.button key={action.label} whileTap={{ scale: 0.96 }} onClick={() => navigate(action.to)}
                style={{ flex: "1 0 calc(25% - 8px)", ...CARD, border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", padding: "14px 8px" }}>
                <span style={{ fontSize: action.emoji === "👻" ? 0 : 22 }}>
                  {action.emoji === "👻"
                    ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain" }} />
                    : action.emoji}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textAlign: "center" }}>{action.label}</span>
              </motion.button>
            ))}
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => setQuickExit(true)}
              style={{ flex: "1 0 calc(25% - 8px)", ...CARD, border: "1px solid rgba(255,59,48,0.2)", background: "rgba(255,59,48,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", padding: "14px 8px" }}>
              <LogOut size={22} color="rgba(255,99,88,0.8)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,99,88,0.8)", textAlign: "center" }}>Quick Exit</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Section: Profile ───────────────────────────────────────────────────────────
  function ProfileSection() {
    const dateIdeaObj = DATE_IDEAS.find((d) => d.key === firstDateIdea) ?? null;
    const badgeObj    = PROFILE_BADGES.find((b) => b.key === profileBadge) ?? null;

    return (
      <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
        style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 16 }}
      >

        {/* How I Connect */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>{t("dash.howIConnect")}</p>
            <button onClick={() => navigate("/ghost/setup")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: a.glow(0.7), fontSize: 11, fontWeight: 700, padding: 0 }}>
              <Edit2 size={11} /> Change
            </button>
          </div>
          <div style={{ ...CARD }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Phone Number</p>
            {connectPhone ? (
              <>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>📞 {connectPhone}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {PHONE_APPS.map((app) => (
                    <span key={app.key} style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", background: "rgba(255,255,255,0.04)", border: `1px solid ${app.color}30`, borderRadius: 50, color: app.color, display: "flex", alignItems: "center", gap: 5 }}>
                      <span>{app.emoji}</span> {app.label}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12, color: "rgba(255,165,0,0.7)", margin: 0 }}>No phone set — <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/ghost/setup")}>add one in Setup</span></p>
            )}

            {altPlatform && connectAltHandle && (
              <>
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "12px 0" }} />
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Also On</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{altPlatform.emoji}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: altPlatform.color, margin: 0 }}>{altPlatform.label}</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{connectAltHandle}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* First contact preference */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>First Contact Preference</p>
          <div style={{ display: "flex", gap: 8 }}>
            {([
              { key: "video",   emoji: "🎥", label: "Ghost Date",   sub: "Video call first" },
              { key: "connect", emoji: "📱", label: "Phone / Chat", sub: "WhatsApp / app first" },
            ] as const).map((opt) => (
              <motion.button key={opt.key} whileTap={{ scale: 0.97 }} onClick={() => handleContactPrefChange(opt.key)}
                style={{ flex: 1, borderRadius: 14, padding: "14px 8px", border: contactPref === opt.key ? `1px solid ${opt.key === "video" ? "rgba(74,222,128,0.5)" : "rgba(251,191,36,0.4)"}` : "1px solid rgba(255,255,255,0.08)", background: contactPref === opt.key ? (opt.key === "video" ? "rgba(74,222,128,0.08)" : "rgba(251,191,36,0.07)") : "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "center", transition: "all 0.18s" }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{opt.emoji}</div>
                <p style={{ fontSize: 12, fontWeight: 900, color: contactPref === opt.key ? "#fff" : "rgba(255,255,255,0.45)", margin: "0 0 2px" }}>{opt.label}</p>
                <p style={{ fontSize: 9, color: contactPref === opt.key ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)", margin: 0 }}>{opt.sub}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Date Idea dropdown */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Take Me On A Date</p>
          <Dropdown
            value={firstDateIdea}
            options={dateIdeaOptions}
            onChange={(key) => setFirstDateIdea(key)}
            placeholder="— Choose a date idea —"
            accent="#fbbf24"
          />
          {dateIdeaObj && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "10px 12px", marginTop: 8 }}>
              {dateIdeaObj.image
                ? <img src={dateIdeaObj.image} alt={dateIdeaObj.label} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                : <span style={{ fontSize: 24, flexShrink: 0 }}>{dateIdeaObj.emoji}</span>}
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(251,191,36,0.9)", margin: 0 }}>{dateIdeaObj.label}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{dateIdeaObj.desc}</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Badge dropdown */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>My Badge</p>
          <Dropdown
            value={profileBadge}
            options={badgeOptions}
            onChange={(key) => setProfileBadge(key)}
            placeholder="— Choose a badge —"
            accent="#fbbf24"
          />
          {badgeObj && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: "8px 12px", marginTop: 8 }}>
              <span style={{ fontSize: 18 }}>{badgeObj.emoji}</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#fbbf24", margin: 0 }}>{badgeObj.label}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>Showing on your card</p>
              </div>
              <button onClick={() => setProfileBadge("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 16, cursor: "pointer", padding: 0 }}>✕</button>
            </motion.div>
          )}
        </div>

        {/* Religion dropdown */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Religion</p>
          <Dropdown
            value={religion}
            options={religionOptions}
            onChange={(key) => setReligion(key)}
            placeholder="— Select religion —"
            accent="rgba(168,85,247,0.9)"
          />
        </div>

        {/* Butler Gift Delivery */}
        <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 18, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 20 }}>🎩</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", margin: 0 }}>Ghost Butler</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Allow surprise gift deliveries</p>
              </div>
            </div>
            <div onClick={() => handleButlerOptIn(!butlerOptIn)}
              style={{ width: 48, height: 28, borderRadius: 14, cursor: "pointer", background: butlerOptIn ? "#fbbf24" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 4, left: butlerOptIn ? 24 : 4, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
            </div>
          </div>
          {butlerOptIn && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 8px", lineHeight: 1.5 }}>Your address is stored privately and only released to a verified service provider.</p>
              {!butlerAddressEdit && butlerAddress ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>📍 {butlerAddress}</p>
                  <button onClick={() => setButlerAddressEdit(true)} style={{ background: "none", border: "none", color: "#fbbf24", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Edit</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <input defaultValue={butlerAddress} placeholder="Your delivery address (private)"
                    onBlur={(e) => handleButlerAddressSave(e.target.value.trim())}
                    style={{ flex: 1, height: 40, borderRadius: 10, padding: "0 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,191,36,0.25)", color: "#fff", fontSize: 12, outline: "none" }} />
                  <button onClick={(e) => handleButlerAddressSave((e.currentTarget.previousElementSibling as HTMLInputElement)?.value ?? "")}
                    style={{ height: 40, padding: "0 14px", borderRadius: 10, border: "none", background: "#fbbf24", color: "#000", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Save</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save profile button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSaveProfile}
          style={{
            width: "100%", height: 52, borderRadius: 50, border: "none",
            background: profileSaved ? "rgba(74,222,128,0.2)" : a.gradient,
            color: profileSaved ? "#4ade80" : "#fff",
            fontSize: 15, fontWeight: 900, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s",
            boxShadow: profileSaved ? "none" : `0 6px 24px ${a.glowMid(0.35)}`,
          }}
        >
          <AnimatePresence mode="wait">
            {profileSaved ? (
              <motion.span key="saved" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Check size={16} /> Saved!
              </motion.span>
            ) : (
              <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Save Profile
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    );
  }

  // ── Section: Coins ─────────────────────────────────────────────────────────────
  function CoinsSection() {
    const totalSpent = transactions.filter((tx) => tx.type === "purchase").reduce((s, tx) => s + tx.amount, 0);
    const totalEarned = transactions.filter((tx) => tx.amount > 0 && tx.type !== "purchase").reduce((s, tx) => s + tx.amount, 0);

    return (
      <motion.div key="coins" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
        style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 16 }}
      >

        {/* Balance hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(146,102,10,0.06) 100%)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, padding: "24px 20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(212,175,55,0.04)", pointerEvents: "none" }} />
          <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(212,175,55,0.6)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>Ghost Coins</p>
          <motion.p
            key={coinBalance}
            initial={{ scale: 1.15, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ fontSize: 56, fontWeight: 900, color: "#d4af37", margin: "0 0 4px", lineHeight: 1 }}>
            {coinBalance}
          </motion.p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>🪙 available balance</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/ghost/pricing")}
            style={{ marginTop: 16, height: 44, borderRadius: 50, border: "none", padding: "0 32px", background: "linear-gradient(135deg, #92660a, #d4af37)", color: "#000", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
            Buy More Coins
          </motion.button>
        </motion.div>

        {/* Summary stats */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: "Total Purchased", value: totalSpent,  icon: "💳", color: "#60a5fa" },
            { label: "Earned (Bonus)",  value: totalEarned, icon: "🎁", color: "#4ade80" },
            { label: "Transactions",    value: transactions.length, icon: "📋", color: "#fbbf24" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ flex: 1, ...CARD, textAlign: "center", padding: "14px 8px" }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <p style={{ fontSize: 18, fontWeight: 900, color, margin: "4px 0 0" }}>{value}</p>
              <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", margin: "2px 0 0", lineHeight: 1.3 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Transaction history */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>Transaction History</p>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>Last {transactions.length} records</span>
          </div>
          {transactions.length === 0 ? (
            <div style={{ ...CARD, textAlign: "center", padding: "28px 20px" }}>
              <p style={{ fontSize: 32, margin: "0 0 10px" }}>🪙</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>No transactions yet</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>Purchase coins or earn them through activity</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {transactions.map((tx) => (
                <motion.div key={tx.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...CARD, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                  {/* Type badge */}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: tx.amount > 0 ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${tx.amount > 0 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {tx.type === "purchase" ? "💳" : tx.type === "win" ? "🏆" : tx.type === "bonus" ? "🎁" : tx.type === "refund" ? "↩️" : "🛒"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.description}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{fmtTxDate(tx.ts)}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 900, color: txColor(tx), margin: 0 }}>{tx.amount > 0 ? "+" : ""}{tx.amount}</p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", margin: 0, textTransform: "capitalize" }}>{tx.type}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Coin shop CTA */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/ghost/pricing")}
          style={{ width: "100%", height: 52, borderRadius: 50, border: "1px solid rgba(212,175,55,0.35)", background: "rgba(212,175,55,0.08)", color: "#d4af37", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
          🪙 Visit Coin Shop
        </motion.button>
      </motion.div>
    );
  }

  // ── Section: Safety ────────────────────────────────────────────────────────────
  function SafetySection() {
    const isVerified = (() => { try { return localStorage.getItem("ghost_face_verified") === "1"; } catch { return false; } })();
    const requested  = (() => { try { return localStorage.getItem("ghost_verification_requested") === "1"; } catch { return false; } })();

    return (
      <motion.div key="safety" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
        style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 16 }}
      >

        {/* Verification */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Get Verified ✅</p>
          <div style={{ ...CARD, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>✅</div>
            <div style={{ flex: 1 }}>
              {isVerified ? (
                <>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#4ade80" }}>Face Verified ✓</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Your profile shows the verified badge</p>
                </>
              ) : (
                <>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>Verified profiles get 2× more matches</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Quick selfie check · takes 24h · free</p>
                </>
              )}
            </div>
            {!isVerified && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowFaceVerify(true)}
                style={{ flexShrink: 0, borderRadius: 10, padding: "8px 14px", border: "1px solid rgba(74,222,128,0.35)", background: requested ? "rgba(74,222,128,0.1)" : "rgba(74,222,128,0.15)", color: "#4ade80", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                {requested ? "Pending ⏳" : "Verify 📸"}
              </motion.button>
            )}
          </div>
        </div>

        {/* Face Verify + Invite */}
        <div style={{ display: "flex", gap: 10 }}>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowFaceVerify(true)}
            style={{ flex: 1, borderRadius: 16, padding: "16px 12px", cursor: "pointer", background: faceVerified ? a.glow(0.07) : "rgba(255,255,255,0.04)", border: faceVerified ? `1px solid ${a.glow(0.3)}` : "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 26 }}>{faceVerified ? "✅" : "📷"}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: faceVerified ? "#4ade80" : "rgba(255,255,255,0.6)", textAlign: "center" }}>{faceVerified ? "Face Verified" : "Verify Face"}</span>
            {!faceVerified && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1.4 }}>Adds a ✅ badge to your card</span>}
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowReferral(true)}
            style={{ flex: 1, borderRadius: 16, padding: "16px 12px", cursor: "pointer", background: a.glow(0.05), border: `1px solid ${a.glow(0.15)}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 26 }}>👻</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textAlign: "center" }}>Invite Friends</span>
            <span style={{ fontSize: 9, color: a.glow(0.7), textAlign: "center", lineHeight: 1.4 }}>Earn Ghost Vault & Black rewards</span>
          </motion.button>
        </div>

        {/* Blocked profiles */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Blocked Profiles</p>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16 }}>
            {blockedIds.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "4px 0" }}>No blocked profiles</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {blockedIds.map((id) => (
                  <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>🚩</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{toGhostIdDash(id)}</span>
                    </div>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleUnblock(id)}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                      Unblock
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Privacy info card */}
        <div style={{ ...CARD, background: "rgba(74,222,128,0.03)", border: "1px solid rgba(74,222,128,0.1)" }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#4ade80", margin: "0 0 8px" }}>🔒 Total Privacy</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.65 }}>
            No social sign-in required. No real name stored. Your contact is only shared once — directly, privately, between two people who chose each other.
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Section: Info ──────────────────────────────────────────────────────────────
  function InfoSection() {
    const FEATURES = [
      { icon: "❤️", title: "Like & Match System", desc: "Browse every profile and like for free. When two ghosts like each other it becomes a mutual match.", badge: "FREE" },
      { icon: "📱", title: "Connect on Match", desc: "After a mutual match, unlock their real contact — WhatsApp, Telegram, iMessage or any app you both use.", badge: "PAY PER CONNECT" },
      { icon: "🚪", title: "Ghost Vault", desc: "Every match lives here with a 48-hour countdown. Upload images and videos securely.", badge: "ACTIVE" },
      { icon: "🌙", title: "Tonight Mode", desc: "Signal that you're available tonight. Active until midnight — simple, no games.", badge: "FREE" },
      { icon: "🛡️", title: "Shield & Block", desc: "Block instantly. They vanish from your feed and yours from theirs — permanently.", badge: "FREE" },
    ];
    const BADGE_STYLES: Record<string, React.CSSProperties> = {
      ACTIVE:             { background: "rgba(74,222,128,0.12)",  color: "#4ade80",  border: "1px solid rgba(74,222,128,0.3)"  },
      FREE:               { background: "rgba(74,222,128,0.08)",  color: "rgba(74,222,128,0.8)", border: "1px solid rgba(74,222,128,0.2)" },
      "PAY PER CONNECT":  { background: "rgba(251,191,36,0.1)",   color: "#fbbf24",  border: "1px solid rgba(251,191,36,0.25)" },
    };
    const [openCat, setOpenCat] = useState<string | null>(null);
    const [openQ,   setOpenQ]   = useState<string | null>(null);

    const FAQ = [
      { category: "Getting Started", emoji: "👻", items: [
        { q: "What is 2Ghost?", a: "2Ghost is an anonymous connection platform. You appear as a Ghost — no real name, no photo shown to the public." },
        { q: "Is my real identity ever shown?", a: "Never automatically. Your real name, phone, and social links stay hidden until both people agree to exchange contact details inside a private Vault chat." },
      ]},
      { category: "Rooms & Access", emoji: "🚪", items: [
        { q: "What are Ghost Rooms?", a: "Rooms are themed spaces — Standard, Ensuite, Kings, Penthouse, and The Cellar. Each has a different crowd and entry level." },
        { q: "What is The Vault?", a: "The Vault is your private space. Every mutual match opens a 48-hour Vault chat with images, gifts, and video intros." },
      ]},
      { category: "Privacy & Safety", emoji: "🔒", items: [
        { q: "Can someone screenshot my Vault?", a: "Technically possible on any device, but the platform never stores your real identity. Guest IDs are the only visible identifier." },
        { q: "How do I report a profile?", a: "Open any profile card and tap the ⚠️ button. Reports are reviewed by the team." },
      ]},
      { category: "Coins & Membership", emoji: "🪙", items: [
        { q: "What are coins used for?", a: "Coins unlock extras — requesting a video intro (5 coins), sending premium gifts, and unlocking certain room features." },
        { q: "Is there a free option?", a: "Yes. Standard Room and some features are free. Paid tiers unlock deeper access and priority matching." },
      ]},
    ];

    return (
      <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
        style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 16 }}
      >
        {/* Why 2Ghost */}
        <div style={{ borderRadius: 16, background: "linear-gradient(135deg, rgba(5,46,22,0.8) 0%, rgba(2,15,10,0.9) 100%)", border: `1px solid ${a.glow(0.15)}`, padding: "22px 18px" }}>
          <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 12px", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
            "Tomorrow's dating app isn't louder — it's quieter."
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 12px", lineHeight: 1.65 }}>
            2Ghost was built for people tired of performative dating. No followers, no stories, no dopamine loops. Just two people, a mutual choice, and a private conversation on the app you already use.
          </p>
          <p style={{ fontSize: 11, color: a.glow(0.6), margin: 0, fontWeight: 700 }}>— 2Ghost.com</p>
        </div>

        {/* How it works */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>How 2Ghost Works</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FEATURES.map((f) => {
              const badgeStyle = BADGE_STYLES[f.badge] ?? BADGE_STYLES["ACTIVE"];
              return (
                <div key={f.title} style={{ ...CARD, display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.2, marginTop: 1 }}>{f.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>{f.title}</p>
                      <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 6, ...badgeStyle }}>{f.badge}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.55 }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>FAQ</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ.map((cat) => {
              const isOpen = openCat === cat.category;
              return (
                <div key={cat.category} style={{ ...CARD, padding: 0, overflow: "hidden" }}>
                  <motion.button whileTap={{ scale: 0.99 }} onClick={() => { setOpenCat(isOpen ? null : cat.category); setOpenQ(null); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{cat.emoji}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 800, color: "#fff" }}>{cat.category}</span>
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: "flex" }}>
                      <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.35)" }} />
                    </motion.span>
                  </motion.button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                          {cat.items.map((item, i) => {
                            const qKey = `${cat.category}-${i}`;
                            const qOpen = openQ === qKey;
                            return (
                              <div key={qKey} style={{ borderBottom: i < cat.items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                <motion.button whileTap={{ scale: 0.99 }} onClick={() => setOpenQ(qOpen ? null : qKey)}
                                  style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 3, flexShrink: 0 }}>{qOpen ? "▾" : "▸"}</span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: qOpen ? "#fff" : "rgba(255,255,255,0.65)", lineHeight: 1.45, flex: 1 }}>{item.q}</span>
                                </motion.button>
                                <AnimatePresence>
                                  {qOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: "hidden" }}>
                                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, padding: "0 16px 14px 26px" }}>{item.a}</p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: "#050508", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, minHeight: "100dvh", background: "#050508", color: "#fff", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "sticky", top: 0, zIndex: 50,
            background: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: `max(12px, env(safe-area-inset-top, 12px)) 16px 14px`,
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          {/* Hamburger */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setDrawerOpen(true)}
            style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}
          >
            <Menu size={16} />
          </motion.button>

          {/* Back */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}
          >
            <ArrowLeft size={16} />
          </motion.button>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>{t("dash.title")}</h1>
            <p style={{ fontSize: 11, color: a.glow(0.7), margin: 0, fontWeight: 600 }}>2Ghost.com</p>
          </div>

          {/* Coin chip in header */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 50, padding: "4px 10px", cursor: "pointer" }} onClick={() => setActiveTab("coins")}>
            <span style={{ fontSize: 13 }}>🪙</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#d4af37" }}>{coinBalance}</span>
          </div>

          <img src={GHOST_LOGO} alt="ghost" style={{ width: 52, height: 52, objectFit: "contain" }} />
        </motion.header>

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
          <AnimatePresence mode="wait">
            {activeTab === "home"    && <HomeSection    key="home"    />}
            {activeTab === "profile" && <ProfileSection key="profile" />}
            {activeTab === "coins"   && <CoinsSection   key="coins"   />}
            {activeTab === "safety"  && <SafetySection  key="safety"  />}
            {activeTab === "info"    && <InfoSection     key="info"    />}
          </AnimatePresence>
        </div>

        {/* ── Bottom tab bar ── */}
        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 480, zIndex: 50,
          background: "rgba(7,7,15,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          paddingBottom: `max(8px, env(safe-area-inset-bottom, 8px))`,
          display: "flex",
        }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(id)}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 3, padding: "10px 4px 4px",
                  background: "none", border: "none", cursor: "pointer",
                  color: active ? a.accent : "rgba(255,255,255,0.3)",
                  transition: "color 0.15s",
                  position: "relative",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, borderRadius: 1, background: a.gradient }}
                  />
                )}
                <Icon size={20} />
                <span style={{ fontSize: 9, fontWeight: active ? 800 : 600, letterSpacing: "0.02em" }}>{label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* ── Side Drawer ── */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setDrawerOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
              />

              {/* Drawer panel */}
              <motion.div
                key="drawer"
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                style={{
                  position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 101,
                  width: 280,
                  background: "#08081a",
                  borderRight: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", flexDirection: "column",
                  paddingTop: `max(16px, env(safe-area-inset-top, 16px))`,
                  paddingBottom: `max(24px, env(safe-area-inset-bottom, 24px))`,
                }}
              >
                {/* Drawer header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={GHOST_LOGO} alt="ghost" style={{ width: 36, height: 36, objectFit: "contain" }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: 0 }}>2Ghost</p>
                      <p style={{ fontSize: 10, color: a.glow(0.6), margin: 0, fontWeight: 700 }}>Navigate</p>
                    </div>
                  </div>
                  <button onClick={() => setDrawerOpen(false)}
                    style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
                    <X size={14} />
                  </button>
                </div>

                {/* Coin summary */}
                <div style={{ margin: "0 14px 12px", background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(146,102,10,0.06))", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>🪙</span>
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#d4af37", margin: 0 }}>{coinBalance}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Ghost Coins</p>
                  </div>
                  <button onClick={() => { setActiveTab("coins"); setDrawerOpen(false); }}
                    style={{ marginLeft: "auto", background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#d4af37", cursor: "pointer" }}>
                    History
                  </button>
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 14px 12px" }} />

                {/* Nav links */}
                <nav style={{ flex: 1, overflowY: "auto", padding: "0 8px" }}>
                  <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 10px", margin: "0 0 4px" }}>App Pages</p>
                  {DRAWER_LINKS.map((link) => (
                    <motion.button
                      key={link.to}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setDrawerOpen(false); navigate(link.to); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 12px", borderRadius: 12, border: "none",
                        background: "transparent", cursor: "pointer",
                        color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600,
                        textAlign: "left", transition: "all 0.12s",
                      }}
                    >
                      <span style={{ fontSize: 18, width: 26, textAlign: "center" }}>{link.emoji}</span>
                      <span>{link.label}</span>
                    </motion.button>
                  ))}

                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 4px" }} />
                  <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "4px 10px", margin: "0 0 4px" }}>Dashboard</p>

                  {TABS.map(({ id, label, Icon }) => (
                    <motion.button
                      key={id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setActiveTab(id); setDrawerOpen(false); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "11px 12px", borderRadius: 12, border: "none",
                        background: activeTab === id ? a.glow(0.08) : "transparent",
                        cursor: "pointer",
                        color: activeTab === id ? a.accent : "rgba(255,255,255,0.55)",
                        fontSize: 13, fontWeight: activeTab === id ? 800 : 600,
                        textAlign: "left", transition: "all 0.12s",
                      }}
                    >
                      <Icon size={16} />
                      <span>{label}</span>
                    </motion.button>
                  ))}
                </nav>

                {/* Drawer footer */}
                <div style={{ padding: "12px 14px 0" }}>
                  <button
                    onClick={() => setQuickExit(true)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.05)", color: "rgba(239,68,68,0.65)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    <LogOut size={14} /> Quick Exit
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── First-entry welcome popup ── */}
        <AnimatePresence>
          {showDashWelcome && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDashWelcome(false)}
              style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            >
              <motion.div
                initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                style={{ width: "100%", maxWidth: 480, background: "rgba(4,8,4,0.97)", borderRadius: "24px 24px 0 0", border: `1px solid ${a.glow(0.2)}`, borderBottom: "none", padding: "0 22px max(36px, env(safe-area-inset-bottom, 36px))", boxShadow: "0 -24px 80px rgba(0,0,0,0.7)" }}
              >
                <div style={{ height: 3, background: `linear-gradient(90deg, #15803d, ${a.accent}, #22c55e)`, marginLeft: -22, marginRight: -22 }} />
                <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 18px" }}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 6px" }}>Your Ghost Dashboard</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "0 0 18px" }}>Everything about your 2Ghost life in one quiet place — with tabs for Home, Profile, Coins, Safety and Info.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {[
                    { icon: "🏠", text: "Home — activity stats, Found Boo, floor rank, Ghost Stars" },
                    { icon: "👤", text: "Profile — connect settings, date ideas, badges with modern dropdowns" },
                    { icon: "🪙", text: "Coins — balance, transaction history, quick top-up" },
                    { icon: "🛡️", text: "Safety — face verify, referrals, blocked profiles" },
                    { icon: "☰", text: "Menu — quick access to every part of the app" },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.5 }}>{icon}</span>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.55 }}>{text}</p>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${a.glow(0.15)}, transparent)`, marginBottom: 18 }} />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowDashWelcome(false)}
                  style={{ width: "100%", height: 52, borderRadius: 50, border: "none", background: a.gradient, color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", letterSpacing: "0.03em", boxShadow: `0 6px 24px ${a.glowMid(0.4)}` }}
                >
                  Got it →
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Modals ── */}
        <AnimatePresence>
          {showFaceVerify && (
            <GhostFaceVerify onVerified={() => setFaceVerified(true)} onClose={() => setShowFaceVerify(false)} />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showReferral && (
            <GhostReferralSheet onClose={() => setShowReferral(false)} />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
