import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, LogOut, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PHONE_APPS, getUsernamePlatform } from "../data/connectPlatforms";
import { useLanguage } from "@/i18n/LanguageContext";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

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
  ACTIVE: { background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" },
  FREE: { background: "rgba(74,222,128,0.08)", color: "rgba(74,222,128,0.8)", border: "1px solid rgba(74,222,128,0.2)" },
  "PAY PER CONNECT": { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" },
  NEW: { background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" },
  PREMIUM: { background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" },
  MEMBERSHIP: { background: "rgba(212,175,55,0.1)", color: "#d4af37", border: "1px solid rgba(212,175,55,0.3)" },
  "ALWAYS ON": { background: "rgba(74,222,128,0.12)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)" },
};

const FEATURES = [
  {
    icon: "👻",
    title: "Ghost Identity",
    desc: "You are invisible by default. Others only see your Ghost ID, photo, age, and city — nothing personal until you both choose to connect. Zero data exposure.",
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
    title: "Ghost Room",
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

export default function GhostDashboardPage() {
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
  const firstDateIdea: string | null = profileData?.firstDateIdea ?? null;
  const FIRST_DATE_IDEAS = [
    { key: "french_restaurant", emoji: "🍷", label: "French Restaurant",  desc: "Candlelit dinner, good wine" },
    { key: "beach_walk",        emoji: "🏖️", label: "Beach Shore Walk",   desc: "Sunset stroll, barefoot vibes" },
    { key: "cinema_night",      emoji: "🎬", label: "Cinema Night",        desc: "Pick a film, share popcorn" },
    { key: "coffee_date",       emoji: "☕", label: "Coffee & Cake",        desc: "Slow morning, easy conversation" },
    { key: "night_market",      emoji: "🏮", label: "Night Market",         desc: "Street food, good energy" },
    { key: "picnic",            emoji: "🌿", label: "Picnic in the Park",   desc: "Blanket, snacks, fresh air" },
    { key: "live_music",        emoji: "🎶", label: "Live Music Night",     desc: "Jazz bar, concert, or rooftop" },
    { key: "sushi",             emoji: "🍣", label: "Sushi Date",           desc: "Good food, clean vibes" },
    { key: "city_explore",      emoji: "🚶", label: "City Explore",         desc: "Walk, discover, see where it leads" },
    { key: "rooftop",           emoji: "🌆", label: "Rooftop Bar",          desc: "City views, cocktails, golden hour" },
    { key: "bowling",           emoji: "🎳", label: "Bowling Night",        desc: "Playful, competitive, fun" },
    { key: "boat_trip",         emoji: "⛵", label: "Boat Trip",            desc: "Open water, coastal adventure" },
  ];
  const dateIdeaObj = FIRST_DATE_IDEAS.find((d) => d.key === firstDateIdea) ?? null;

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
      matchName: "Ghost-Manual",
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
            <p style={{ fontSize: 11, color: "rgba(74,222,128,0.7)", margin: 0, fontWeight: 600 }}>2Ghost.com</p>
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
                    border: "1px solid rgba(74,222,128,0.3)",
                    background: "rgba(74,222,128,0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img
                        src={foundBoo.matchProfileImage}
                        alt={foundBoo.matchName}
                        style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(74,222,128,0.5)" }}
                      />
                      <img src={GHOST_LOGO} alt="ghost" style={{ position: "absolute", bottom: -4, right: -4, width: 54, height: 54, objectFit: "contain" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 3px" }}>Found Boo <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle" }} /></p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 5px" }}>Connected with {foundBoo.matchName}</p>
                      <p style={{ fontSize: 12, color: "#4ade80", fontWeight: 700, margin: 0 }}>
                        Resumes in {fmtCountdown(foundBoo.pausedUntil - Date.now())}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={canReactivate ? handleReactivate : undefined}
                    style={{
                      width: "100%", height: 40, borderRadius: 10, border: "none",
                      background: canReactivate ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.05)",
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

          {/* ── Section 2: Activity Today ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
              {t("dash.activityToday")}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: t("dash.likesToday"), value: likesToday, icon: "❤️", color: "#ec4899" },
                { label: t("dash.streak"), value: streak, icon: "🔥", color: "#f97316" },
                { label: t("dash.matches"), value: savedMatchCount, icon: "✨", color: "#4ade80" },
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

          {/* ── Section 3: How I Connect ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
                {t("dash.howIConnect")}
              </p>
              <button
                onClick={() => navigate("/ghost/setup")}
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "rgba(74,222,128,0.7)", fontSize: 11, fontWeight: 700, padding: 0 }}
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

              {dateIdeaObj && (
                <>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "12px 0" }} />
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Dream First Date</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "10px 12px" }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{dateIdeaObj.emoji}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(251,191,36,0.9)", margin: 0 }}>{dateIdeaObj.label}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{dateIdeaObj.desc}</p>
                    </div>
                  </div>
                </>
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
              border: "1px solid rgba(74,222,128,0.15)",
              padding: "22px 18px",
            }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                "Tomorrow's dating app isn't louder — it's quieter."
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 16px", lineHeight: 1.65 }}>
                2Ghost was built for people tired of performative dating. No followers. No stories. No dopamine loops. Just two people, a mutual choice, and a private conversation on the app you already use. The future of dating is anonymous until it's real.
              </p>
              <p style={{ fontSize: 11, color: "rgba(74,222,128,0.6)", margin: 0, fontWeight: 700 }}>— 2Ghost.com</p>
            </div>
          </motion.div>

          {/* ── Section 6: Quick Actions ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
              Quick Actions
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "Edit Profile", emoji: "✏️", to: "/ghost/setup" },
                { label: "My Room", emoji: "🚪", to: "/ghost/room" },
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
                  { icon: "👻", text: "Ghost Identity — your anonymous card, your Ghost ID, your presence" },
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

              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.15), transparent)", marginBottom: 18 }} />

              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowDashWelcome(false)}
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
                Got it →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
