import { motion, AnimatePresence } from "framer-motion";

// ── Helpers ───────────────────────────────────────────────────────────────────
const SHOWN_KEY = "ghost_checkout_reminder_shown_date";
const DAYS_BEFORE = 3; // show popup when ≤ 3 days remain

export function shouldShowCheckout(): boolean {
  try {
    const until = Number(localStorage.getItem("ghost_mode_until") || 0);
    if (!until) return false;
    const msLeft = until - Date.now();
    if (msLeft <= 0) return false; // already expired
    const daysLeft = msLeft / (1000 * 60 * 60 * 24);
    if (daysLeft > DAYS_BEFORE) return false;
    // Only show once per calendar day
    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(SHOWN_KEY);
    return lastShown !== today;
  } catch { return false; }
}

export function markCheckoutShown(): void {
  try { localStorage.setItem(SHOWN_KEY, new Date().toDateString()); } catch {}
}

// ── Format checkout time ───────────────────────────────────────────────────────
function formatCheckout(until: number): { day: string; date: string; time: string; daysLeft: number } {
  const d = new Date(until);
  // Set to 12:00 noon on checkout day
  const checkout = new Date(d);
  checkout.setHours(12, 0, 0, 0);

  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const daysLeft = Math.ceil((checkout.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return {
    day:  days[checkout.getDay()],
    date: `${checkout.getDate()} ${months[checkout.getMonth()]} ${checkout.getFullYear()}`,
    time: "12:00 noon",
    daysLeft: Math.max(1, daysLeft),
  };
}

// ── Room name helper ───────────────────────────────────────────────────────────
function getRoomLabel(): { label: string; icon: string; color: string } {
  try {
    const tier = localStorage.getItem("ghost_house_tier");
    const map: Record<string, { label: string; icon: string; color: string }> = {
      standard:  { label: "Standard Room",  icon: "🛏️", color: "#a8a8b0" },
      suite:     { label: "Suite",          icon: "🛎️", color: "#cd7f32" },
      kings:     { label: "Kings Room",     icon: "👑", color: "#d4af37" },
      penthouse: { label: "Penthouse",      icon: "🏙️", color: "#e0ddd8" },
    };
    return tier && map[tier] ? map[tier] : { label: "Your Room", icon: "🏨", color: "#d4af37" };
  } catch { return { label: "Your Room", icon: "🏨", color: "#d4af37" }; }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CheckoutReminderPopup({
  onExtend,
  onDismiss,
}: {
  onExtend: () => void;
  onDismiss: () => void;
}) {
  const until = (() => { try { return Number(localStorage.getItem("ghost_mode_until") || 0); } catch { return 0; } })();
  const { day, date, time, daysLeft } = formatCheckout(until);
  const { label: roomLabel, icon: roomIcon, color: roomColor } = getRoomLabel();

  const urgency = daysLeft === 1 ? "Tomorrow" : `${daysLeft} days`;
  const urgencyColor = daysLeft === 1 ? "#ef4444" : daysLeft === 2 ? "#f97316" : "#d4af37";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 480,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 20px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 380,
          background: "rgba(6,5,3,0.99)",
          borderRadius: 24,
          border: `1px solid ${roomColor}35`,
          overflow: "hidden",
          boxShadow: `0 0 80px ${roomColor}15, 0 24px 60px rgba(0,0,0,0.7)`,
        }}
      >
        {/* Top gold stripe */}
        <div style={{ height: 4, background: `linear-gradient(90deg, transparent 0%, ${roomColor} 35%, #fff8 55%, ${roomColor} 75%, transparent 100%)` }} />

        {/* Hotel letterhead */}
        <div style={{ padding: "22px 22px 0", textAlign: "center" }}>
          <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 800, color: `${roomColor}88`, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Ghost House · Member Notice
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "10px 0 6px" }}>
            <div style={{ height: 1, flex: 1, background: `linear-gradient(to right, transparent, ${roomColor}40)` }} />
            <span style={{ fontSize: 22 }}>🏨</span>
            <div style={{ height: 1, flex: 1, background: `linear-gradient(to left, transparent, ${roomColor}40)` }} />
          </div>
        </div>

        {/* Checkout slip body */}
        <div style={{ padding: "4px 22px 20px" }}>

          {/* Urgency badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ background: `${urgencyColor}18`, border: `1.5px solid ${urgencyColor}55`, borderRadius: 20, padding: "4px 14px", display: "flex", alignItems: "center", gap: 6 }}
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: urgencyColor, display: "inline-block" }}
              />
              <span style={{ fontSize: 11, fontWeight: 900, color: urgencyColor, letterSpacing: "0.04em" }}>
                Check-out in {urgency}
              </span>
            </motion.div>
          </div>

          {/* Room info */}
          <div style={{ background: `${roomColor}08`, border: `1px solid ${roomColor}20`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{roomIcon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: roomColor }}>{roomLabel}</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Current room · Ghost House</p>
              </div>
            </div>

            {/* Checkout details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Check-out day",  value: day },
                { label: "Check-out date", value: date },
                { label: "Check-out time", value: time },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 800 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `${roomColor}20`, margin: "12px 0" }} />

            {/* Limited availability notice */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>⚠️</span>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                <strong style={{ color: roomColor }}>Limited rooms available.</strong> To ensure your room is held, please confirm your extension before check-out time. Rooms are released to the waiting list at 12:00 noon.
              </p>
            </div>
          </div>

          {/* Extend CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onExtend}
            style={{
              width: "100%", height: 52, borderRadius: 14, border: "none",
              background: `linear-gradient(135deg, ${roomColor}dd, ${roomColor}99)`,
              color: ["#d4af37","#e0ddd8","#a8a8b0"].includes(roomColor) ? "#0a0700" : "#fff",
              fontSize: 14, fontWeight: 900, cursor: "pointer",
              boxShadow: `0 4px 24px ${roomColor}35`,
              marginBottom: 10,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>🔑</span>
            Extend My Stay
          </motion.button>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            style={{ width: "100%", padding: "10px", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Remind me tomorrow
          </button>
        </div>

        {/* Bottom stripe */}
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${roomColor}30, transparent)` }} />
      </motion.div>
    </motion.div>
  );
}
