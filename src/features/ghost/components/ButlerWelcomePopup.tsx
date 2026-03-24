import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ── Helpers ───────────────────────────────────────────────────────────────────
const GREETED_KEY = "ghost_butler_greeted";

export function shouldShowButlerWelcome(): boolean {
  try {
    const welcomed = localStorage.getItem("ghost_house_welcomed");
    const greeted  = localStorage.getItem(GREETED_KEY);
    return welcomed === "1" && greeted !== "1";
  } catch { return false; }
}

export function markButlerGreeted(): void {
  try { localStorage.setItem(GREETED_KEY, "1"); } catch {}
}

// ── Room data ─────────────────────────────────────────────────────────────────
const ROOM_MAP: Record<string, { label: string; icon: string; color: string }> = {
  standard:  { label: "Standard Room",  icon: "🛏️",  color: "#a8a8b0" },
  suite:     { label: "Ensuite",         icon: "🛎️",  color: "#cd7f32" },
  kings:     { label: "The Casino",     icon: "🎰",  color: "#d4af37" },
  penthouse: { label: "Penthouse",      icon: "🏙️", color: "#e0ddd8" },
};

function getRoomInfo() {
  try {
    const tier = localStorage.getItem("ghost_house_tier") || "standard";
    return ROOM_MAP[tier] ?? ROOM_MAP.standard;
  } catch { return ROOM_MAP.standard; }
}

function getGhostId(): string {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    const id = p.id || "anon";
    let h = 0;
    for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
    return `Ghost-${1000 + Math.abs(h) % 9000}`;
  } catch { return "Ghost-0000"; }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ButlerWelcomePopup({ onDismiss }: { onDismiss: () => void }) {
  const navigate  = useNavigate();
  const room      = getRoomInfo();
  const ghostId   = getGhostId();
  const gold      = "#d4af37";

  function handleRooms() {
    markButlerGreeted();
    onDismiss();
    navigate("/ghost/rooms");
  }

  function handleDismiss() {
    markButlerGreeted();
    onDismiss();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 490,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 20px",
      }}
    >
      {/* Full-screen background image */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/sdfasdfdddsaasdf.png?updatedAt=1774270395199)", backgroundSize: "cover", backgroundPosition: "center top", zIndex: 0 }} />
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 0 }} />
      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.93 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 390,
          background: "rgba(5,4,2,0.88)",
          borderRadius: 26,
          border: `1px solid ${gold}30`,
          overflow: "hidden",
          boxShadow: `0 0 90px ${gold}12, 0 28px 70px rgba(0,0,0,0.75)`,
          position: "relative", zIndex: 1,
        }}
      >
        {/* Top shimmer stripe */}
        <div style={{ height: 4, background: `linear-gradient(90deg, transparent, ${gold}cc, #fff8, ${gold}cc, transparent)` }} />

        {/* Letterhead */}
        <div style={{ padding: "22px 22px 0", textAlign: "center" }}>
          <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 800, color: `${gold}77`, letterSpacing: "0.22em", textTransform: "uppercase" }}>
            Ghost House · Butler Service
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "12px 0 6px" }}>
            <div style={{ height: 1, flex: 1, background: `linear-gradient(to right, transparent, ${gold}35)` }} />
            <motion.span
              animate={{ rotate: [0, -4, 4, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ fontSize: 28 }}
            >
              🎩
            </motion.span>
            <div style={{ height: 1, flex: 1, background: `linear-gradient(to left, transparent, ${gold}35)` }} />
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "8px 22px 20px" }}>

          {/* Greeting */}
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, textAlign: "center", fontStyle: "italic" }}>
            Good evening, and welcome to Ghost House. Your luggage has been attended to — your room is ready.
          </p>

          {/* Room & Key card */}
          <div style={{ background: `${gold}09`, border: `1px solid ${gold}22`, borderRadius: 16, padding: "16px", marginBottom: 16 }}>

            {/* Floor */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Your Floor</span>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 14 }}>{room.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: room.color }}>{room.label}</span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `${gold}18`, marginBottom: 12 }} />

            {/* Room key */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Room Key</span>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 13 }}>🗝️</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: gold, letterSpacing: "0.04em" }}>{ghostId}</span>
              </div>
            </div>

            <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
              <p style={{ margin: 0, fontSize: 9.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                Please keep note of your floor and room key. Should you wish to upgrade to a higher floor at any time, visit <strong style={{ color: `${gold}99` }}>Rooms</strong> on the home page.
              </p>
            </div>
          </div>

          {/* Welcome gift — 15 complimentary coins */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 300, damping: 24 }}
            style={{ background: "linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.05))", border: "1px solid rgba(255,215,0,0.28)", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <motion.span
                animate={{ rotate: [0, -12, 12, -6, 0] }}
                transition={{ delay: 0.7, duration: 0.6 }}
                style={{ fontSize: 22 }}
              >
                🪙
              </motion.span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#ffd700" }}>15 Complimentary Coins</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,215,0,0.5)" }}>A welcome gift from Ghost House · Already in your account</p>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
              Use them to open a <strong style={{ color: "rgba(255,255,255,0.6)" }}>Vault conversation</strong> (1 coin per message) or send a <strong style={{ color: "rgba(255,255,255,0.6)" }}>gift</strong> to someone you like. No purchase needed to get started.
            </p>
          </motion.div>

          {/* Butler note */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔔</span>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
              I am at your disposal <strong style={{ color: "rgba(255,255,255,0.65)" }}>24 hours a day</strong>. Whenever you need assistance, select <strong style={{ color: "rgba(255,255,255,0.65)" }}>Butler Service</strong> on the home page.
            </p>
          </div>

          {/* Sign-off */}
          <p style={{ margin: "0 0 18px", fontSize: 12, color: `${gold}88`, textAlign: "center", fontStyle: "italic", fontWeight: 600 }}>
            Enjoy your stay, and happy haunting 👻
          </p>

          {/* View Rooms CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleRooms}
            style={{
              width: "100%", height: 50, borderRadius: 14, border: "none",
              background: `linear-gradient(135deg, ${gold}cc, ${gold}88)`,
              color: "#0a0700", fontSize: 13, fontWeight: 900,
              cursor: "pointer", marginBottom: 8,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: `0 4px 22px ${gold}30`,
            }}
          >
            <span style={{ fontSize: 15 }}>🏨</span>
            View Rooms & Upgrades
          </motion.button>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            style={{ width: "100%", padding: "10px", background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Thank you, carry on
          </button>
        </div>

        {/* Bottom stripe */}
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${gold}25, transparent)` }} />
      </motion.div>
    </motion.div>
  );
}
