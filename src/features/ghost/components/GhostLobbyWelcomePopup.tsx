// ── Lobby Welcome Popup ─────────────────────────────────────────────────────────
// Bottom sheet shown when user enters the Lobby tab for the first time.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

type Props = {
  show: boolean;
  onDismiss: () => void;
};

export default function GhostLobbyWelcomePopup({ show, onDismiss }: Props) {
  const a = useGenderAccent();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onDismiss}
          style={{ position: "fixed", inset: 0, zIndex: 490, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "rgba(8,8,12,0.98)",
              borderRadius: "24px 24px 0 0",
              border: `1px solid ${a.glow(0.2)}`,
              borderBottom: "none",
              overflow: "hidden",
            }}
          >
            {/* Accent bar */}
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
              style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)` }}
            />

            <div style={{ padding: "24px 22px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <motion.span
                  animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                  style={{ fontSize: 32, display: "block", flexShrink: 0 }}
                >🏨</motion.span>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 4px", lineHeight: 1.2 }}>
                    The Lobby is Open — <span style={{ color: a.accent }}>Right Now</span>
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600 }}>
                    Real Ghost members. Live. Tonight.
                  </p>
                </div>
              </div>

              {/* Body copy */}
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", margin: 0, lineHeight: 1.65 }}>
                Ghost members are in the Lobby <strong style={{ color: a.accent }}>at this very moment</strong> — anonymous, available, and searching for exactly what you are. No bios, no small talk. <strong style={{ color: "#fff" }}>Lobby Guests Are Ready Right Now To Date.</strong>
              </p>

              {/* 3 action tiles */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { icon: "❤️", title: "Like a profile", desc: "Tap any profile below and like them — if they like you back it's an instant match." },
                  { icon: "🎁", title: "Send a gift first", desc: "Stand out before they even know your name. Gifts get noticed." },
                  { icon: "🚀", title: "Join the 60-min session", desc: "Step fully into the Lobby and let tonight bring someone straight to you." },
                ].map(item => (
                  <div key={item.icon} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", borderRadius: 12, background: a.glow(0.05), border: `1px solid ${a.glow(0.1)}` }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{item.title}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.45 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Urgency note */}
              <p style={{ fontSize: 10, color: a.glow(0.5), textAlign: "center", margin: 0, fontWeight: 700, letterSpacing: "0.04em" }}>
                ⚡ The Lobby resets every hour — don't miss this window
              </p>

              {/* CTA */}
              <button
                onClick={onDismiss}
                style={{
                  width: "100%", height: 52, borderRadius: 16, border: "none",
                  background: a.gradient,
                  color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
                  boxShadow: `0 4px 20px ${a.glow(0.4)}`,
                  letterSpacing: "0.03em",
                }}
              >
                Browse the Lobby →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
