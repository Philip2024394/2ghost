import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    title: "WhatsApp Connect",
    desc: "After a mutual match, unlock their real WhatsApp number with a single payment. No monthly subscription needed — you only pay when you genuinely connect. Real connections, not endless swiping.",
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
    icon: "🚀",
    title: "Boost",
    desc: "Push your profile to the top of every feed for 24 hours. More visibility, more likes, more chances. One-time purchase per boost — no subscription.",
    badge: "PREMIUM",
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
    desc: "No social sign-in required. No real name stored. No trail, no records. Your WhatsApp is only shared once — directly, privately, between two people who chose each other. 2Ghost stores nothing about your conversations.",
    badge: "ALWAYS ON",
  },
];

export default function GhostDashboardPage() {
  const navigate = useNavigate();
  const [quickExit, setQuickExit] = useState(false);

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
            <h1 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>My Dashboard</h1>
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

          {/* ── Section 2: How 2Ghost Works ── */}
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

          {/* ── Section 3: Why 2Ghost? ── */}
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
                2Ghost was built for people tired of performative dating. No followers. No stories. No dopamine loops. Just two people, a mutual choice, and a private WhatsApp chat. The future of dating is anonymous until it's real.
              </p>
              <p style={{ fontSize: 11, color: "rgba(74,222,128,0.6)", margin: 0, fontWeight: 700 }}>— 2Ghost.com</p>
            </div>
          </motion.div>

          {/* ── Section 4: Quick Actions ── */}
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
    </div>
  );
}
