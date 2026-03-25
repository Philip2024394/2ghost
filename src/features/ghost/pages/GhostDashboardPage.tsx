import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, LogOut, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PHONE_APPS, getUsernamePlatform } from "../data/connectPlatforms";
import { useLanguage } from "@/i18n/LanguageContext";
import { DATE_IDEAS } from "../data/dateIdeas";
import { saveProfileToSupabase } from "../ghostProfileService";
import { PROFILE_BADGES, BADGE_CATEGORIES } from "../data/profileBadges";
import GhostFaceVerify from "../components/GhostFaceVerify";
import GhostReferralSheet from "../components/GhostReferralSheet";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";
const FOUND_BOO_STAMP = "https://ik.imagekit.io/7grri5v7d/Found%20Boo%20postage%20stamp%20design.png";

type FoundBooData = {
  matchProfileId: string;
  matchProfileImage: string;
  matchName: string;
  connectedAt: number;
  pausedUntil: number;
  canReactivateAt: number;
};

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "0m";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: 16,
};

const BADGE_STYLES: Record<string, React.CSSProperties> = {
  ACTIVE: { background: "rgba(74,222,128,0.12)", color: "#4ade80", border: `1px solid rgba(74,222,128,0.3)` },
  FREE: { background: "rgba(74,222,128,0.08)", color: "rgba(74,222,128,0.8)", border: `1px solid rgba(74,222,128,0.2)` },
  "PAY PER CONNECT": { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" },
  NEW: { background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" },
  PREMIUM: { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" },
  MEMBERSHIP: { background: "rgba(212,175,55,0.1)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)" },
  "ALWAYS ON": { background: "rgba(74,222,128,0.12)", color: "#4ade80", border: `1px solid rgba(74,222,128,0.3)` },
};

const FEATURES = [
  {
    icon: "👻",
    title: "Ghost Identity",
    desc: "You are invisible by default. Others only see your Guest ID, photo, age, and city — nothing personal until you both choose to connect. Zero data exposure.",
    badge: "ACTIVE",
  },
  {
    icon: "❤️",
    title: "Like & Match System",
    desc: "Browse every profile and like for free — no limits. When two ghosts like each other it becomes a mutual match. No one knows until it's mutual — no awkward one-sided alerts.",
    badge: "FREE",
  },
  {
    icon: "📱",
    title: "Connect on Match",
    desc: "After a mutual match, unlock their real contact with a single payment — WhatsApp, Telegram, WeChat, iMessage, Line, Instagram or any app you both use. You only pay when you genuinely connect.",
    badge: "PAY PER CONNECT",
  },
  {
    icon: "👻",
    title: "Found Boo",
    desc: "When you unlock a connection, your profile auto-pauses for 72 hours — giving your new connection space to breathe. No pressure, no distractions. Reactivate any time after 1 hour if it doesn't work out.",
    badge: "NEW",
  },
  {
    icon: "🚪",
    title: "Ghost Vault",
    desc: "Your private vault. Every match lives here with a 48-hour countdown — after that they fade unless you act. Upload images and videos securely. Share your room code only with people you trust.",
    badge: "ACTIVE",
  },
  {
    icon: "🌙",
    title: "Tonight Mode",
    desc: "Signal to the house that you're available tonight. Your profile gets a special glow and appears first in Tonight-filtered feeds. Active until midnight — simple, honest, no games.",
    badge: "FREE",
  },
  {
    icon: "🛡️",
    title: "Shield & Block",
    desc: "See someone giving bad energy? Block them instantly. They vanish from your feed and yours from theirs — permanently. The house self-cleanses. Your peace is protected.",
    badge: "FREE",
  },
  {
    icon: "🏠",
    title: "Ghost House Membership",
    desc: "Join the Ghost House to unlock your full ghost badge. Upgrade to Ghost Black for the rarest status in the house — gold border, elite visibility, no expiry. A mark of commitment to real connection.",
    badge: "MEMBERSHIP",
  },
  {
    icon: "🔒",
    title: "Total Privacy",
    desc: "No social sign-in required. No real name stored. No trail, no records. Your contact is only shared once — directly, privately, between two people who chose each other. 2Ghost stores nothing about your conversations.",
    badge: "ALWAYS ON",
  },
];

// ── Daily activity helpers ────────────────────────────────────────────────
const TODAY_KEY = () => `ghost_likes_today_${new Date().toISOString().slice(0, 10)}`;
function getLikesToday(): number {
  try { return parseInt(localStorage.getItem(TODAY_KEY()) ?? "0", 10) || 0; } catch { return 0; }
}
function getStreak(): number {
  try { return parseInt(localStorage.getItem("ghost_streak") ?? "0", 10) || 0; } catch { return 0; }
}

function toGhostIdDash(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i) | 0;
  return `Guest-${1000 + Math.abs(h) % 9000}`;
}

function BlockedProfilesSection() {
  const [blockedIds, setBlockedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("ghost_reported_ids") || "[]"); } catch { return []; }
  });

  const handleUnblock = (id: string) => {
    const next = blockedIds.filter(b => b !== id);
    setBlockedIds(next);
    try { localStorage.setItem("ghost_reported_ids", JSON.stringify(next)); } catch {}
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.176 }}>
      <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
        Blocked Profiles
      </p>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 16 }}>
        {blockedIds.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "4px 0" }}>No blocked profiles</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {blockedIds.map(id => (
              <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>🚩</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{toGhostIdDash(id)}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleUnblock(id)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}
                >
                  Unblock
                </motion.button>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function GhostDashboardPage() {
  const a = useGenderAccent();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [quickExit, setQuickExit] = useState(false);

  // First-entry welcome popup
  const [showDashWelcome, setShowDashWelcome] = useState(false);
  useEffect(() => {
    if (!sessionStorage.getItem("ghost_dash_welcome_seen")) {
      const t = setTimeout(() => {
        setShowDashWelcome(true);
        sessionStorage.setItem("ghost_dash_welcome_seen", "1");
      }, 600);
      return () => clearTimeout(t);
    }
  }, []);

  // Profile data for "How I Connect" section
  const profileData = (() => {
    try { const r = localStorage.getItem("ghost_profile"); return r ? JSON.parse(r) : null; } catch { return null; }
  })();
  const connectPhone: string | null = profileData?.connectPhone ?? null;
  const connectAlt: string | null = profileData?.connectAlt ?? null;
  const connectAltHandle: string | null = profileData?.connectAltHandle ?? null;
  const altPlatform = connectAlt ? getUsernamePlatform(connectAlt) : undefined;
  const [firstDateIdea, setFirstDateIdea] = useState<string>(profileData?.firstDateIdea ?? "");
  const dateIdeaObj = DATE_IDEAS.find((d) => d.key === firstDateIdea) ?? null;
  const [profileBadge, setProfileBadge] = useState<string>(profileData?.badge ?? "");
  const [religion, setReligion] = useState<string>(profileData?.religion ?? "");
  const badgeObj = PROFILE_BADGES.find((b) => b.key === profileBadge) ?? null;
  const [faceVerified, setFaceVerified] = useState<boolean>(() => {
    try { return localStorage.getItem("ghost_face_verified") === "1"; } catch { return false; }
  });
  const [showFaceVerify, setShowFaceVerify] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  // Butler gift delivery — recipient opts in, stores address privately for admin use only
  const [butlerAddress, setButlerAddress] = useState<string>(() => {
    try { return localStorage.getItem("ghost_butler_address") ?? ""; } catch { return ""; }
  });
  const [butlerOptIn, setButlerOptIn] = useState<boolean>(() => {
    try { return localStorage.getItem("ghost_butler_optin") === "1"; } catch { return false; }
  });
  const [butlerAddressEdit, setButlerAddressEdit] = useState(false);

  const [contactPref, setContactPref] = useState<"video" | "connect">(() => {
    try { return (localStorage.getItem("ghost_contact_pref") as "video" | "connect") || "connect"; } catch { return "connect"; }
  });

  const handleContactPrefChange = async (pref: "video" | "connect") => {
    setContactPref(pref);
    try { localStorage.setItem("ghost_contact_pref", pref); } catch {}
    await saveField("contactPref", pref);
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

  const saveField = async (field: string, value: string | null) => {
    try {
      const updated = { ...(profileData ?? {}), [field]: value || null };
      localStorage.setItem("ghost_profile", JSON.stringify(updated));
      const phone = localStorage.getItem("ghost_phone") ?? "";
      if (phone) await saveProfileToSupabase(phone, updated);
    } catch {}
  };

  const handleDateIdeaChange = async (key: string) => { setFirstDateIdea(key); await saveField("firstDateIdea", key); };
  const handleBadgeChange    = async (key: string) => { setProfileBadge(key); await saveField("badge", key); };
  const handleReligionChange = async (val: string) => { setReligion(val); await saveField("religion", val); };

  // Activity
  const [likesToday] = useState(getLikesToday);
  const [streak] = useState(getStreak);
  const savedMatchCount = (() => {
    try {
      const raw = localStorage.getItem("ghost_matches");
      if (!raw) return 0;
      const all = JSON.parse(raw);
      return all.filter((m: { matchedAt: number }) => Date.now() - m.matchedAt < 48 * 3600000).length;
    } catch { return 0; }
  })();

  const [foundBoo, setFoundBoo] = useState<FoundBooData | null>(() => {
    try {
      const raw = localStorage.getItem("ghost_found_boo");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const [tonightStatus, setTonightStatus] = useState<"available" | "busy">(() => {
    try { return (localStorage.getItem("ghost_tonight_status") as "available" | "busy") || "available"; } catch { return "available"; }
  });
  const isTonightActive = (() => {
    try { return Number(localStorage.getItem("ghost_tonight_until") || 0) > Date.now(); } catch { return false; }
  })();
  const toggleTonightStatus = () => {
    const next: "available" | "busy" = tonightStatus === "available" ? "busy" : "available";
    setTonightStatus(next);
    try { localStorage.setItem("ghost_tonight_status", next); } catch {}
  };

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  void tick;

  const isBooActive = foundBoo && foundBoo.pausedUntil > Date.now();
  const canReactivate = foundBoo ? Date.now() >= foundBoo.canReactivateAt : false;

  const handleReactivate = () => {
    try { localStorage.removeItem("ghost_found_boo"); } catch {}
    setFoundBoo(null);
  };

  const handlePauseProfile = () => {
    const data: FoundBooData = {
      matchProfileId: "manual",
      matchProfileImage: "https://i.pravatar.cc/200?img=1",
      matchName: "Guest-Manual",
      connectedAt: Date.now(),
      pausedUntil: Date.now() + 72 * 60 * 60 * 1000,
      canReactivateAt: Date.now() + 60 * 60 * 1000,
    };
    try { localStorage.setItem("ghost_found_boo", JSON.stringify(data)); } catch {}
    setFoundBoo(data);
  };

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
    <div style={{ minHeight: "100dvh", background: "#050508", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, minHeight: "100dvh", background: "#050508", color: "#fff", display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "sticky", top: 0, zIndex: 50,
            background: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            paddingTop: `max(12px, env(safe-area-inset-top, 12px))`,
            padding: `max(12px, env(safe-area-inset-top, 12px)) 16px 14px`,
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0,
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>{t("dash.title")}</h1>
            <p style={{ fontSize: 11, color: a.glow(0.7), margin: 0, fontWeight: 600 }}>2Ghost.com</p>
          </div>
          <img src={GHOST_LOGO} alt="ghost" style={{ width: 72, height: 72, objectFit: "contain" }} />
        </motion.div>

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 16, paddingBottom: `max(40px, env(safe-area-inset-bottom, 40px))` }}>

          {/* ── Section 1: Found Boo Status ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
              Found Boo Status
            </p>

            <AnimatePresence mode="wait">
              {isBooActive && foundBoo ? (
                <motion.div
                  key="active"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    ...CARD,
                    border: `1px solid ${a.glow(0.3)}`,
                    background: a.glow(0.05),
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img
                        src={foundBoo.matchProfileImage}
                        alt={foundBoo.matchName}
                        style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.5)}` }}
                      />
                      {/* Found Boo stamp on matched profile */}
                      <img src={FOUND_BOO_STAMP} alt="Found Boo" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", opacity: 0.9 }} />
                      <img src={GHOST_LOGO} alt="ghost" style={{ position: "absolute", bottom: -4, right: -4, width: 54, height: 54, objectFit: "contain" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 3px" }}>Found Boo <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle" }} /></p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 5px" }}>Connected with {foundBoo.matchName}</p>
                      <p style={{ fontSize: 12, color: a.accent, fontWeight: 700, margin: 0 }}>
                        Resumes in {fmtCountdown(foundBoo.pausedUntil - Date.now())}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={canReactivate ? handleReactivate : undefined}
                    style={{
                      width: "100%", height: 40, borderRadius: 10, border: "none",
                      background: canReactivate ? a.glow(0.2) : "rgba(255,255,255,0.05)",
                      color: canReactivate ? "#4ade80" : "rgba(255,255,255,0.2)",
                      fontSize: 13, fontWeight: 800, cursor: canReactivate ? "pointer" : "default",
                    }}
                  >
                    {canReactivate ? "Reactivate Early" : `Reactivate Early · available in ${fmtCountdown(foundBoo.canReactivateAt - Date.now())}`}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="inactive"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ ...CARD }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                      background: "rgba(255,255,255,0.06)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <img src={GHOST_LOGO} alt="ghost" style={{ width: 78, height: 78, objectFit: "contain" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>No active Boo yet</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.4 }}>
                        Your next connection will appear here
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handlePauseProfile}
                    style={{
                      width: "100%", height: 38, borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)",
                      background: "rgba(239,68,68,0.05)",
                      color: "rgba(239,68,68,0.6)",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    Pause My Profile
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Tonight Status ── */}
          {isTonightActive && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
                Tonight Status
              </p>
              <div style={{ ...CARD, display: "flex", alignItems: "center", gap: 14 }}>
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: tonightStatus === "available" ? 1.4 : 2.2, repeat: Infinity }}
                  style={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
                    background: tonightStatus === "available" ? "#22c55e" : "#f97316",
                    boxShadow: tonightStatus === "available" ? "0 0 10px rgba(34,197,94,0.8)" : "0 0 10px rgba(249,115,22,0.8)" }}
                />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>
                    {tonightStatus === "available" ? "Available Now" : "Busy"}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>
                    {tonightStatus === "available" ? "Showing as available in the Tonight lobby" : "Showing as busy — others can still see you"}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTonightStatus}
                  style={{ flexShrink: 0, height: 36, borderRadius: 10, border: "none", padding: "0 16px",
                    background: tonightStatus === "available" ? "rgba(249,115,22,0.15)" : "rgba(34,197,94,0.15)",
                    color: tonightStatus === "available" ? "#f97316" : "#22c55e",
                    fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                >
                  {tonightStatus === "available" ? "Set Busy" : "Set Available"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Section 2: Activity Today ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
              {t("dash.activityToday")}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: t("dash.likesToday"), value: likesToday, icon: "❤️", color: "#ec4899" },
                { label: t("dash.streak"), value: streak, icon: "🔥", color: "#f97316" },
                { label: t("dash.matches"), value: savedMatchCount, icon: "✨", color: a.accent },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{
                  flex: 1, ...CARD,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "14px 8px",
                }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color }}>{value}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Section 2b: My Stats ── */}
          {(() => {
            const ghostId = (() => {
              try {
                const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
                const id = p.id || "anon";
                let h = 0;
                for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
                return `Guest-${1000 + Math.abs(h) % 9000}`;
              } catch { return "Guest-0000"; }
            })();
            const tier = (() => { try { return localStorage.getItem("ghost_house_tier") || "standard"; } catch { return "standard"; } })();
            const ROOM_MAP: Record<string, { label: string; icon: string; color: string; members: number; active: number }> = {
              standard:  { label: "Standard Room", icon: "🛏️", color: "#a8a8b0", members: 1247, active: 89 },
              suite:     { label: "Ensuite",         icon: "🛎️", color: "#cd7f32", members: 428,  active: 34 },
              kings:     { label: "The Casino",     icon: "🎰", color: "#d4af37", members: 156,  active: 21 },
              penthouse: { label: "Penthouse",       icon: "🏙️", color: "#e0ddd8", members: 47,   active: 12 },
              cellar:    { label: "The Cellar",      icon: "🕯️", color: "#9b1c1c", members: 83,   active: 18 },
            };
            const room = ROOM_MAP[tier] ?? ROOM_MAP.standard;
            function seedStat(key: string, min: number, max: number): number {
              let h = 0; const s = ghostId + key;
              for (let i = 0; i < s.length; i++) { h = Math.imul(31, h) + s.charCodeAt(i) | 0; }
              return min + (Math.abs(h) % (max - min + 1));
            }
            const coins = (() => { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } })();
            const likesSent = (() => { try { return JSON.parse(localStorage.getItem("ghost_liked_ids") || "[]").length; } catch { return 0; } })();
            const vaultChats = (() => { try { return Object.keys(localStorage).filter(k => k.startsWith("ghost_vault_chat_")).length; } catch { return 0; } })();
            const giftsSent = (() => {
              try {
                let total = 0;
                Object.keys(localStorage).forEach(k => {
                  if (!k.startsWith("ghost_vault_chat_")) return;
                  const msgs = JSON.parse(localStorage.getItem(k) || "[]");
                  total += msgs.filter((m: { isGift?: boolean; isOwn?: boolean }) => m.isGift && m.isOwn).length;
                });
                return total;
              } catch { return 0; }
            })();
            const floorRank = seedStat("rank", 3, room.active);
            const STAT_ROWS = [
              { icon: "👁️", label: "Profile views",      value: seedStat("views", 48, 312), sub: "this month",   color: "#60a5fa" },
              { icon: "❤️", label: "Likes received",      value: seedStat("likes_recv", 12, 94), sub: "from members", color: "#f472b6" },
              { icon: "🤍", label: "Likes sent",          value: likesSent,                  sub: "by you",       color: "#a78bfa" },
              { icon: "🔐", label: "Vault chats",         value: vaultChats,                 sub: "opened",       color: "#fbbf24" },
              { icon: "🎁", label: "Gifts sent",          value: giftsSent,                  sub: "total",        color: "#34d399" },
              { icon: "🪙", label: "Coins balance",       value: coins,                      sub: "available",    color: "#ffd700" },
            ];
            return (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
                  My Stats
                </p>
                {/* Floor rank bar */}
                <div style={{ marginBottom: 10, padding: "10px 14px", background: `${room.color}0a`, border: `1px solid ${room.color}20`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: room.color }}>🏆 Floor Rank #{floorRank}</p>
                    <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Among {room.active} active tonight · {room.icon} {room.label}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{room.members.toLocaleString()} total</p>
                </div>
                {/* Stats grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {STAT_ROWS.map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 + i * 0.05 }}
                      style={{ background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: 14, padding: "12px 8px", textAlign: "center" }}>
                      <span style={{ fontSize: 18, display: "block", marginBottom: 4 }}>{s.icon}</span>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 9, color: "rgba(255,255,255,0.35)", lineHeight: 1.3 }}>{s.label}</p>
                      <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.2)" }}>{s.sub}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })()}

          {/* ── Section 2c: Trust Stars ── */}
          {(() => {
            function idHash(id: string): number {
              let h = 0;
              for (let i = 0; i < id.length; i++) h = Math.imul(37, h) + id.charCodeAt(i) | 0;
              return Math.abs(h);
            }
            const rawId = (() => { try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}").id || "anon"; } catch { return "anon"; } })();
            const months = idHash(rawId + "months") % 24;
            const stars  = Math.min(5, Math.floor(months / 2));
            const nextIn = 2 - (months % 2);
            return (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{ ...CARD, marginBottom: 0 }}>
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
                  Stay active and flag-free for <strong style={{ color: "#fff" }}>every 2 months</strong> and you earn a ★ on your profile.
                  Stars are visible to others — a quiet signal that you're genuine, consistent, and here for real.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { months: 2,  label: "2 months clean" },
                    { months: 4,  label: "4 months clean" },
                    { months: 6,  label: "6 months clean" },
                    { months: 8,  label: "8 months clean" },
                    { months: 10, label: "10 months clean" },
                  ].map((row, i) => {
                    const earned = months >= row.months;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", borderRadius: 10, background: earned ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${earned ? "rgba(212,175,55,0.22)" : "rgba(255,255,255,0.05)"}` }}>
                        <span style={{ fontSize: 14, color: earned ? "#d4af37" : "rgba(255,255,255,0.15)" }}>★</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: earned ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)", flex: 1 }}>{row.label}</span>
                        {earned
                          ? <span style={{ fontSize: 9, fontWeight: 800, color: "#d4af37" }}>Earned</span>
                          : i === stars ? <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>≈ {nextIn} month{nextIn > 1 ? "s" : ""} away</span>
                          : null}
                      </div>
                    );
                  })}
                </div>

                <p style={{ margin: "12px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.55 }}>
                  ⚠️ A verified complaint or flag resets your current star progress. Keep it respectful — it shows.
                </p>
              </motion.div>
            );
          })()}

          {/* ── Section 3: How I Connect ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
                {t("dash.howIConnect")}
              </p>
              <button
                onClick={() => navigate("/ghost/setup")}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: a.glow(0.7), fontSize: 11, fontWeight: 700, padding: 0 }}
              >
                <Edit2 size={11} /> Change
              </button>
            </div>
            <div style={{ ...CARD }}>
              {/* Phone number — works for 6 apps */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                  Phone Number
                </p>
                {connectPhone ? (
                  <>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 8px" }}>📞 {connectPhone}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {PHONE_APPS.map((app) => (
                        <span key={app.key} style={{
                          fontSize: 12, fontWeight: 700, padding: "4px 10px",
                          background: "rgba(255,255,255,0.04)", border: `1px solid ${app.color}30`,
                          borderRadius: 50, color: app.color,
                          display: "flex", alignItems: "center", gap: 5,
                        }}>
                          <span>{app.emoji}</span> {app.label}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "6px 0 0" }}>
                      Your match can reach you on any of these apps
                    </p>
                  </>
                ) : (
                  <p style={{ fontSize: 12, color: "rgba(255,165,0,0.7)", margin: 0 }}>
                    No phone number set —{" "}
                    <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => navigate("/ghost/setup")}>add one in Setup</span>
                  </p>
                )}
              </div>

              {/* Alt username platform */}
              {altPlatform && connectAltHandle && (
                <>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 12 }} />
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                    Also On
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{altPlatform.emoji}</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: altPlatform.color, margin: 0 }}>{altPlatform.label}</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{connectAltHandle}</p>
                    </div>
                  </div>
                </>
              )}

              <>
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "12px 0" }} />
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>
                  First Contact Preference
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 10px", lineHeight: 1.5 }}>
                  How do you prefer to connect with a match first?
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  {([
                    { key: "video",   emoji: "🎥", label: "Ghost Date",   sub: "Video call first" },
                    { key: "connect", emoji: "📱", label: "Phone / Chat", sub: "WhatsApp / app first" },
                  ] as const).map((opt) => (
                    <motion.button
                      key={opt.key}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleContactPrefChange(opt.key)}
                      style={{
                        flex: 1, borderRadius: 14, padding: "12px 8px",
                        border: contactPref === opt.key ? `1px solid ${opt.key === "video" ? "rgba(74,222,128,0.5)" : "rgba(251,191,36,0.4)"}` : "1px solid rgba(255,255,255,0.08)",
                        background: contactPref === opt.key ? (opt.key === "video" ? "rgba(74,222,128,0.08)" : "rgba(251,191,36,0.07)") : "rgba(255,255,255,0.02)",
                        cursor: "pointer", textAlign: "center",
                        boxShadow: contactPref === opt.key ? `0 0 14px ${opt.key === "video" ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)"}` : "none",
                        transition: "all 0.18s",
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 5 }}>{opt.emoji}</div>
                      <p style={{ fontSize: 12, fontWeight: 900, color: contactPref === opt.key ? "#fff" : "rgba(255,255,255,0.45)", margin: "0 0 2px" }}>{opt.label}</p>
                      <p style={{ fontSize: 9, color: contactPref === opt.key ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.25)", margin: 0 }}>{opt.sub}</p>
                    </motion.button>
                  ))}
                </div>
                {contactPref === "video" && (
                  <p style={{ fontSize: 10, color: "rgba(74,222,128,0.65)", margin: "8px 0 0", lineHeight: 1.5 }}>
                    🎥 Your matches will be invited for a Ghost Date video call first, in the Gallery Room.
                  </p>
                )}

                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "12px 0" }} />
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Take Me On A Date</p>
                <select
                  value={firstDateIdea}
                  onChange={(e) => handleDateIdeaChange(e.target.value)}
                  style={{
                    width: "100%", height: 44, borderRadius: 12, border: "1px solid rgba(251,191,36,0.25)",
                    background: "rgba(251,191,36,0.07)", color: firstDateIdea ? "rgba(251,191,36,0.9)" : "rgba(255,255,255,0.35)",
                    fontSize: 13, fontWeight: 700, padding: "0 12px", appearance: "none", WebkitAppearance: "none",
                    cursor: "pointer", marginBottom: dateIdeaObj ? 10 : 0,
                  }}
                >
                  <option value="" style={{ background: "#050508", color: "#fff" }}>— Choose a date idea —</option>
                  {DATE_IDEAS.map((d) => (
                    <option key={d.key} value={d.key} style={{ background: "#050508", color: "#fff" }}>
                      {d.emoji} {d.label}
                    </option>
                  ))}
                </select>
                {dateIdeaObj && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "10px 12px" }}>
                    {dateIdeaObj.image
                      ? <img src={dateIdeaObj.image} alt={dateIdeaObj.label} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      : <span style={{ fontSize: 24, flexShrink: 0 }}>{dateIdeaObj.emoji}</span>
                    }
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(251,191,36,0.9)", margin: 0 }}>{dateIdeaObj.label}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{dateIdeaObj.desc}</p>
                    </div>
                  </div>
                )}
              </>

              {/* ── My Badge ── */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "12px 0" }} />
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>My Badge</p>
              <select
                value={profileBadge}
                onChange={(e) => handleBadgeChange(e.target.value)}
                style={{
                  width: "100%", height: 44, borderRadius: 12,
                  border: "1px solid rgba(251,191,36,0.25)",
                  background: "rgba(251,191,36,0.07)",
                  color: profileBadge ? "#fbbf24" : "rgba(255,255,255,0.35)",
                  fontSize: 13, fontWeight: 700, padding: "0 12px",
                  appearance: "none", WebkitAppearance: "none", cursor: "pointer",
                }}
              >
                <option value="">— Choose a badge —</option>
                {BADGE_CATEGORIES.map((cat) => (
                  <optgroup key={cat.key} label={cat.label}>
                    {PROFILE_BADGES.filter((b) => b.category === cat.key).map((b) => (
                      <option key={b.key} value={b.key}>{b.emoji} {b.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {badgeObj && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, padding: "8px 12px", marginTop: 8 }}>
                  <span style={{ fontSize: 18 }}>{badgeObj.emoji}</span>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#fbbf24", margin: 0 }}>{badgeObj.label}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>Showing on your card</p>
                  </div>
                  <button onClick={() => handleBadgeChange("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 16, cursor: "pointer", padding: 0 }}>✕</button>
                </div>
              )}

              {/* ── Religion ── */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "12px 0" }} />
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Religion</p>
              <select
                value={religion}
                onChange={(e) => handleReligionChange(e.target.value)}
                style={{
                  width: "100%", height: 44, borderRadius: 12,
                  border: "1px solid rgba(168,85,247,0.25)",
                  background: "rgba(168,85,247,0.07)",
                  color: religion ? "rgba(168,85,247,0.9)" : "rgba(255,255,255,0.35)",
                  fontSize: 13, fontWeight: 700, padding: "0 12px",
                  appearance: "none", WebkitAppearance: "none", cursor: "pointer",
                }}
              >
                <option value="" style={{ background: "#050508", color: "#fff" }}>— Select religion —</option>
                {["Muslim 🌙","Christian ✝️","Catholic ✝️","Buddhist ☸️","Hindu 🕉️","Jewish ✡️","Spiritual 🌿","Not religious 🙂"].map((r) => (
                  <option key={r} value={r} style={{ background: "#050508", color: "#fff" }}>{r}</option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* ── Butler Gift Delivery opt-in ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
            <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 18, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 20 }}>🎩</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", margin: 0 }}>Ghost Butler</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Allow surprise gift deliveries</p>
                  </div>
                </div>
                {/* Toggle */}
                <div
                  onClick={() => handleButlerOptIn(!butlerOptIn)}
                  style={{
                    width: 48, height: 28, borderRadius: 14, cursor: "pointer",
                    background: butlerOptIn ? "#fbbf24" : "rgba(255,255,255,0.1)",
                    position: "relative", transition: "background 0.2s", flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: "absolute", top: 4, left: butlerOptIn ? 24 : 4,
                    width: 20, height: 20, borderRadius: "50%", background: "#fff",
                    transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }} />
                </div>
              </div>

              {butlerOptIn && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 8px", lineHeight: 1.5 }}>
                    Your address is stored privately and only released by Ghost admin to a verified service provider — never to the sender.
                  </p>
                  {!butlerAddressEdit && butlerAddress ? (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px" }}>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0 }}>📍 {butlerAddress}</p>
                      <button onClick={() => setButlerAddressEdit(true)} style={{ background: "none", border: "none", color: "#fbbf24", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Edit</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        defaultValue={butlerAddress}
                        placeholder="Your delivery address (private)"
                        onBlur={(e) => handleButlerAddressSave(e.target.value.trim())}
                        style={{
                          flex: 1, height: 40, borderRadius: 10, padding: "0 12px",
                          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,191,36,0.25)",
                          color: "#fff", fontSize: 12, outline: "none",
                        }}
                      />
                      <button
                        onClick={(e) => handleButlerAddressSave((e.currentTarget.previousElementSibling as HTMLInputElement)?.value ?? "")}
                        style={{ height: 40, padding: "0 14px", borderRadius: 10, border: "none", background: "#fbbf24", color: "#000", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Section 4: How 2Ghost Works ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
              How 2Ghost Works
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FEATURES.map((f, i) => {
                const badgeStyle = BADGE_STYLES[f.badge] ?? BADGE_STYLES["ACTIVE"];
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + i * 0.03 }}
                    style={{ ...CARD, display: "flex", gap: 12, alignItems: "flex-start" }}
                  >
                    <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1.2, marginTop: 1 }}>{f.icon === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle" }} /> : f.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>{f.title}</p>
                        <span style={{
                          fontSize: 8, fontWeight: 800, letterSpacing: "0.08em",
                          padding: "2px 7px", borderRadius: 6,
                          ...badgeStyle,
                        }}>
                          {f.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.55 }}>{f.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Section 5: Why 2Ghost? ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
              Why 2Ghost?
            </p>
            <div style={{
              borderRadius: 16,
              background: "linear-gradient(135deg, rgba(5,46,22,0.8) 0%, rgba(2,15,10,0.9) 100%)",
              border: `1px solid ${a.glow(0.15)}`,
              padding: "22px 18px",
            }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                "Tomorrow's dating app isn't louder — it's quieter."
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 16px", lineHeight: 1.65 }}>
                2Ghost was built for people tired of performative dating. No followers. No stories. No dopamine loops. Just two people, a mutual choice, and a private conversation on the app you already use. The future of dating is anonymous until it's real.
              </p>
              <p style={{ fontSize: 11, color: a.glow(0.6), margin: 0, fontWeight: 700 }}>— 2Ghost.com</p>
            </div>
          </motion.div>

          {/* ── Section 6: Verify & Invite ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {/* Face Verification */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowFaceVerify(true)}
              style={{
                flex: 1, borderRadius: 16, padding: "16px 12px", cursor: "pointer",
                background: faceVerified ? a.glow(0.07) : "rgba(255,255,255,0.04)",
                border: faceVerified ? `1px solid ${a.glow(0.3)}` : "1px solid rgba(255,255,255,0.1)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 26 }}>{faceVerified ? "✅" : "📷"}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: faceVerified ? "#4ade80" : "rgba(255,255,255,0.6)", textAlign: "center" }}>
                {faceVerified ? "Face Verified" : "Verify Face"}
              </span>
              {!faceVerified && (
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1.4 }}>
                  Adds a ✅ badge to your card
                </span>
              )}
            </motion.button>

            {/* Invite Friends / Referral */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowReferral(true)}
              style={{
                flex: 1, borderRadius: 16, padding: "16px 12px", cursor: "pointer",
                background: a.glow(0.05),
                border: `1px solid ${a.glow(0.15)}`,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 26 }}>👻</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.6)", textAlign: "center" }}>Invite Friends</span>
              <span style={{ fontSize: 9, color: a.glow(0.7), textAlign: "center", lineHeight: 1.4 }}>
                Earn Ghost Vault & Black rewards
              </span>
            </motion.button>
          </motion.div>

          {/* ── Room Reviews section ── */}
          {(() => {
            type RoomTier = "standard" | "suite" | "kings" | "penthouse";
            type UserReview = { id: string; tier: RoomTier; ghostId: string; city: string; stars: number; text: string; submittedAt: number };
            let reviews: UserReview[] = [];
            try { reviews = JSON.parse(localStorage.getItem("ghost_room_reviews") || "[]"); } catch {}
            const currentTier = localStorage.getItem("ghost_house_tier") as RoomTier | null;
            if (!currentTier && reviews.length === 0) return null;
            const tierColor: Record<RoomTier, string> = { standard: "#c0c0c0", suite: "#cd7f32", kings: "#d4af37", penthouse: "#e8e4d0" };
            const tierName:  Record<RoomTier, string> = { standard: "Standard Room", suite: "Ensuite", kings: "The Casino", penthouse: "Penthouse" };
            return (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
                    My Room Reviews
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/ghost/rooms")}
                    style={{ background: "none", border: "none", fontSize: 10, color: a.accent, cursor: "pointer", fontWeight: 700, padding: 0 }}
                  >
                    {currentTier && reviews.every(r => r.tier !== currentTier) ? "Rate your stay →" : "View rooms →"}
                  </motion.button>
                </div>

                {reviews.length === 0 ? (
                  <div style={{
                    borderRadius: 14, padding: "14px 16px",
                    background: currentTier ? `${tierColor[currentTier]}0a` : "rgba(255,255,255,0.03)",
                    border: currentTier ? `1px solid ${tierColor[currentTier]}25` : "1px solid rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 800, color: currentTier ? tierColor[currentTier] : "rgba(255,255,255,0.4)", margin: "0 0 3px" }}>
                        {currentTier ? `You're in ${tierName[currentTier]}` : "No active room"}
                      </p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                        {currentTier ? "Share your experience — help other members choose" : "Visit Ghost Rooms to pick your tier"}
                      </p>
                    </div>
                    {currentTier && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate("/ghost/rooms")}
                        style={{
                          flexShrink: 0, height: 34, borderRadius: 9,
                          border: `1px solid ${tierColor[currentTier]}44`,
                          background: `${tierColor[currentTier]}14`,
                          color: tierColor[currentTier],
                          fontSize: 11, fontWeight: 800, cursor: "pointer", padding: "0 14px",
                        }}
                      >
                        🌟 Rate
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{
                        borderRadius: 14, padding: "12px 14px",
                        background: `${tierColor[r.tier]}0a`,
                        border: `1px solid ${tierColor[r.tier]}2a`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 10, fontWeight: 900, color: tierColor[r.tier] }}>{tierName[r.tier]}</span>
                            <span style={{ fontSize: 8, color: tierColor[r.tier], background: `${tierColor[r.tier]}18`, borderRadius: 4, padding: "1px 5px", fontWeight: 800 }}>✓ VERIFIED</span>
                          </div>
                          <div style={{ display: "flex", gap: 1 }}>
                            {"★".repeat(r.stars).split("").map((_, i) => (
                              <span key={i} style={{ fontSize: 9, color: tierColor[r.tier] }}>★</span>
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "0 0 4px", lineHeight: 1.5, fontStyle: "italic" }}>"{r.text}"</p>
                        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", margin: 0 }}>{r.city} · {r.ghostId}</p>
                      </div>
                    ))}
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => navigate("/ghost/rooms")}
                      style={{
                        width: "100%", height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)",
                        fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      Edit or add a review in Ghost Rooms →
                    </motion.button>
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* ── Section 7a: Get Verified ── */}
          {(() => {
            const isVerified = (() => { try { return localStorage.getItem("ghost_face_verified") === "1"; } catch { return false; } })();
            const requested = (() => { try { return localStorage.getItem("ghost_verification_requested") === "1"; } catch { return false; } })();
            return (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.175 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
                  Get Verified ✅
                </p>
                <div style={{ ...CARD, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>✅</div>
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
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        try { localStorage.setItem("ghost_verification_requested", "1"); } catch {}
                        window.alert("Verification request sent! We'll review your selfie within 24 hours. 📸");
                      }}
                      style={{ flexShrink: 0, borderRadius: 10, padding: "8px 14px", border: "none", background: requested ? "rgba(74,222,128,0.1)" : "rgba(74,222,128,0.15)", color: requested ? "#4ade80" : "#4ade80", fontSize: 11, fontWeight: 800, cursor: "pointer", borderWidth: 1, borderStyle: "solid", borderColor: "rgba(74,222,128,0.35)" }}
                    >
                      {requested ? "Pending ⏳" : "Verify My Face 📸"}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })()}

          {/* ── Section 7b: Blocked Profiles ── */}
          <BlockedProfilesSection />

          {/* ── Section FAQ ── */}
          {(() => {
            const FAQ: { category: string; emoji: string; items: { q: string; a: string }[] }[] = [
              {
                category: "Getting Started",
                emoji: "👻",
                items: [
                  { q: "What is 2Ghost?", a: "2Ghost is an anonymous connection platform. You appear as a Ghost — no real name, no photo shown to the public. You connect through rooms, whispers, and vault chats once there's mutual interest." },
                  { q: "Is my real identity ever shown?", a: "Never automatically. Your real name, phone, and social links stay hidden until both people agree to exchange contact details inside a private Vault chat." },
                  { q: "How do I get started?", a: "Complete your profile in Setup, choose a room that matches your vibe, browse members, and send a Whisper to someone you're interested in." },
                ],
              },
              {
                category: "Rooms & Access",
                emoji: "🚪",
                items: [
                  { q: "What are Ghost Rooms?", a: "Rooms are themed spaces — Standard, Ensuite, Kings, Penthouse, and The Cellar. Each has a different crowd and entry level. You can visit any room but some require a membership tier to interact." },
                  { q: "What is The Vault?", a: "The Vault is your private space. Every mutual match opens a 48-hour Vault chat. You can share images, send gifts, and request video intros — all vault-protected and not visible to anyone else." },
                  { q: "What happens after 48 hours in the Vault?", a: "The connection fades unless you act — send a gift, exchange contact details, or both agree to extend. It's designed to keep things intentional." },
                  { q: "What is The Cellar?", a: "The Cellar is an age-verified room for mature members. Entry requires a one-time age check. Content and conversation in the Cellar is more adult in nature." },
                ],
              },
              {
                category: "Whispers & Connections",
                emoji: "💬",
                items: [
                  { q: "What is a Whisper?", a: "A Whisper is your opening message — one genuine question to break the ice. You pick from 3 curated questions matched to that profile, or write your own. Keep it real, not copy-paste." },
                  { q: "Can I send my phone number in a Whisper?", a: "No. Phone numbers, social handles, and links are blocked in Whispers. Contact details are only shared after both people unlock inside the Vault." },
                  { q: "What happens if I break the content rules?", a: "First violation: a warning strike. Second: your account is deactivated. The system is automatic — keep your messages respectful." },
                  { q: "What is an Introduction Video?", a: "Some members choose to upload a short personal intro video. It's vault-private — only released to someone who sends a coin request and gets approved. It's optional and never public." },
                ],
              },
              {
                category: "Privacy & Safety",
                emoji: "🔒",
                items: [
                  { q: "Can someone screenshot my profile or Vault?", a: "Technically possible on any device, but the platform never stores your real identity. Guest IDs are the only visible identifier. We encourage reporting anyone who misuses shared content." },
                  { q: "How do I report a profile?", a: "Open any profile card and tap the ⚠️ button in the bottom-right of the popup. Reports are reviewed by the team. A verified complaint affects that member's Ghost Star progress." },
                  { q: "Can I block someone?", a: "Yes. Blocked profiles are hidden from your feed and cannot contact you. Manage your blocked list from the dashboard." },
                  { q: "Is my location shared?", a: "Only your city and country flag are shown — never GPS coordinates. Distance shown (e.g. 4 km) is approximate and based on your general area." },
                ],
              },
              {
                category: "Coins & Membership",
                emoji: "🪙",
                items: [
                  { q: "What are coins used for?", a: "Coins unlock extras — requesting a video intro (5 coins), sending premium gifts in the Vault, and unlocking certain room features. You earn coins through activity and can buy more in the coin shop." },
                  { q: "What does membership unlock?", a: "Membership tiers (Standard → Ensuite → Kings → Penthouse) give you access to higher rooms, more visibility, and exclusive features. Some tiers are one-time entry; others are ongoing." },
                  { q: "Is there a free option?", a: "Yes. Standard Room and some features are free. The Loft and Rooms Guide are also free to browse. Paid tiers unlock deeper access and priority matching." },
                ],
              },
              {
                category: "Ghost Stars",
                emoji: "★",
                items: [
                  { q: "What are Ghost Stars?", a: "Stars are a trust signal earned automatically. Every 2 months you're active on the platform without any complaints or flags, you earn one star — up to 5 total. They appear on your profile." },
                  { q: "Do stars affect my visibility?", a: "Members with stars appear more trustworthy to others. Higher-star profiles tend to receive more whispers and likes — it's a quiet signal that you're consistent and genuine." },
                  { q: "What resets my star progress?", a: "A verified complaint or flag against your account resets your progress toward the next star. Existing earned stars are kept, but the 2-month clock restarts." },
                ],
              },
            ];

            const [openCat, setOpenCat] = useState<string | null>(null);
            const [openQ, setOpenQ]     = useState<string | null>(null);

            return (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
                  FAQ &amp; How It Works
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {FAQ.map(cat => {
                    const isOpen = openCat === cat.category;
                    return (
                      <div key={cat.category} style={{ ...CARD, padding: 0, overflow: "hidden" }}>
                        {/* Category header */}
                        <motion.button whileTap={{ scale: 0.99 }}
                          onClick={() => { setOpenCat(isOpen ? null : cat.category); setOpenQ(null); }}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{cat.emoji}</span>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 800, color: "#fff" }}>{cat.category}</span>
                          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}
                            style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", display: "block" }}>▼</motion.span>
                        </motion.button>

                        {/* Questions */}
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                              transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
                              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" }}>
                                {cat.items.map((item, i) => {
                                  const qKey = `${cat.category}-${i}`;
                                  const qOpen = openQ === qKey;
                                  return (
                                    <div key={qKey} style={{ borderBottom: i < cat.items.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                      <motion.button whileTap={{ scale: 0.99 }}
                                        onClick={() => setOpenQ(qOpen ? null : qKey)}
                                        style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 3, flexShrink: 0 }}>{qOpen ? "▾" : "▸"}</span>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: qOpen ? "#fff" : "rgba(255,255,255,0.65)", lineHeight: 1.45, flex: 1 }}>{item.q}</span>
                                      </motion.button>
                                      <AnimatePresence>
                                        {qOpen && (
                                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.18 }} style={{ overflow: "hidden" }}>
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
              </motion.div>
            );
          })()}

          {/* ── Section 7: Quick Actions ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
              Quick Actions
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Edit Profile", emoji: "✏️", to: "/ghost/setup" },
                { label: "My Room", emoji: "🚪", to: "/ghost/room" },
                { label: "Activities", emoji: "🏨", to: "/ghost/activities" },
                { label: "Back to Feed", emoji: "👻", to: "/ghost/mode" },
              ].map((action) => (
                <motion.button
                  key={action.label}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(action.to)}
                  style={{
                    flex: 1,
                    ...CARD,
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    cursor: "pointer",
                    padding: "14px 8px",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{action.emoji === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle" }} /> : action.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", textAlign: "center" }}>{action.label}</span>
                </motion.button>
              ))}
              {/* Quick Exit */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setQuickExit(true)}
                style={{
                  flex: 1, ...CARD,
                  border: "1px solid rgba(255,59,48,0.2)",
                  background: "rgba(255,59,48,0.06)",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  cursor: "pointer", padding: "14px 8px",
                }}
              >
                <LogOut size={22} color="rgba(255,99,88,0.8)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,99,88,0.8)", textAlign: "center" }}>Quick Exit</span>
              </motion.button>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ── First-entry welcome popup ── */}
      <AnimatePresence>
        {showDashWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDashWelcome(false)}
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
                border: `1px solid ${a.glow(0.2)}`, borderBottom: "none",
                padding: "0 22px max(36px, env(safe-area-inset-bottom, 36px))",
                boxShadow: "0 -24px 80px rgba(0,0,0,0.7)",
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, #15803d, ${a.accent}, #22c55e)`, marginLeft: -22, marginRight: -22 }} />
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 18px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.35 }}
                style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", margin: "0 0 6px" }}
              >
                Your Ghost Dashboard
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18, duration: 0.35 }}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "0 0 18px" }}
              >
                Everything about your 2Ghost life in one quiet place. No noise — just what matters.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.26, duration: 0.4 }}
                style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}
              >
                {[
                  { icon: "👻", text: "Guest Identity — your anonymous card, your Guest ID, your presence" },
                  { icon: "❤️", text: "Like & Match — browse free, pay only when you genuinely connect" },
                  { icon: "🚪", text: "Found Boo — when you connect, your profile auto-pauses so the relationship has space" },
                  { icon: "🌙", text: "Tonight Mode — tell the house you're available right now, resets at midnight" },
                  { icon: "🛡️", text: "Shield & Block — protect your peace, block numbers and entire countries" },
                  { icon: "🔒", text: "Total privacy — no social sign-in, no real name stored, no trail" },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.5 }}>{icon}</span>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.55 }}>{text}</p>
                  </div>
                ))}
              </motion.div>

              <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${a.glow(0.15)}, transparent)`, marginBottom: 18 }} />

              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowDashWelcome(false)}
                style={{
                  width: "100%", height: 52, borderRadius: 50, border: "none",
                  background: a.gradient,
                  color: "#fff", fontSize: 15, fontWeight: 900,
                  cursor: "pointer", letterSpacing: "0.03em",
                  boxShadow: `0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 24px ${a.glowMid(0.4)}`,
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
                Got it →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFaceVerify && (
          <GhostFaceVerify
            onVerified={() => setFaceVerified(true)}
            onClose={() => setShowFaceVerify(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReferral && (
          <GhostReferralSheet onClose={() => setShowReferral(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}
