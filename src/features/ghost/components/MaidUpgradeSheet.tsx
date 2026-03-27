// MaidUpgradeSheet — full-screen layout matching JokerInviteSheet
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const MAID_IMG = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasddsds.png";

interface Props {
  onClose: () => void;
}

export default function MaidUpgradeSheet({ onClose }: Props) {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);

  function accept() {
    if (confirmed) return;
    try { localStorage.setItem("rooms_unlocked", "true"); } catch {}
    setConfirmed(true);
    setTimeout(() => {
      onClose();
      navigate("/rooms");
    }, 1800);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 950,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Full-bleed character image */}
      <img
        src={MAID_IMG}
        alt=""
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center top",
          pointerEvents: "none",
        }}
      />

      {/* Dark vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(4,2,8,0.45) 0%, rgba(4,2,8,0.3) 40%, rgba(4,2,8,0.85) 75%, rgba(4,2,8,0.97) 100%)",
      }} />

      {/* Bottom content card */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          position: "relative", zIndex: 20,
          width: "100%", maxWidth: 480,
          padding: "0 22px max(44px,env(safe-area-inset-bottom,44px))",
          textAlign: "center",
        }}
      >
        {/* Character label */}
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.85)", letterSpacing: "0.22em", textTransform: "uppercase" }}
        >
          🧹 Maid Eloise
        </motion.p>

        {/* Main content */}
        <AnimatePresence mode="wait">
          {!confirmed ? (
            <motion.div key="pre" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
                Your Room Is Ready
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                Room Upgrade Available
              </p>
              <p style={{ margin: "0 0 22px", fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
                Maid Eloise would be honoured to escort you to your next room — a finer floor awaits with more matches, more access, and more of the hotel.
              </p>
            </motion.div>
          ) : (
            <motion.div key="post" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: 44, fontWeight: 900, color: "#d4af37", lineHeight: 1 }}>✓</p>
              <p style={{ margin: "0 0 22px", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Opening your room…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={accept}
          disabled={confirmed}
          style={{
            width: "100%", height: 56, borderRadius: 18, border: "none",
            background: confirmed
              ? "rgba(212,175,55,0.15)"
              : "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
            color: confirmed ? "rgba(212,175,55,0.5)" : "#000",
            fontSize: 16, fontWeight: 900, cursor: confirmed ? "default" : "pointer",
            boxShadow: confirmed ? "none" : "0 4px 32px rgba(212,175,55,0.4)",
            letterSpacing: "0.04em", marginBottom: 12,
            transition: "all 0.3s",
          }}
        >
          {confirmed ? "Opening your room…" : "View Room Upgrade →"}
        </motion.button>

        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer" }}
        >
          Not now
        </button>
      </motion.div>
    </motion.div>
  );
}
