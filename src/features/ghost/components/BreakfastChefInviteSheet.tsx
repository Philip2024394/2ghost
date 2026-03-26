// BreakfastChefInviteSheet — appears when a user taps an unverified male (chef) profile
// Mr. Butlas extends a personal invitation to the Breakfast Lounge on the chef's behalf
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const CHEF_IMG   = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasd.png";
const BUTLAS_IMG = "https://ik.imagekit.io/7grri5v7d/ewrwerwerwer-removebg-preview.png?updatedAt=1774288645920";

const OFFERINGS = [
  { icon: "☕", label: "Morning Coffee" },
  { icon: "💬", label: "Casual Chat"    },
  { icon: "🥐", label: "Breakfast Table" },
];

interface Props {
  onClose: () => void;
}

export default function BreakfastChefInviteSheet({ onClose }: Props) {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);

  function accept() {
    setConfirmed(true);
    setTimeout(() => {
      onClose();
      navigate("/ghost/breakfast-lounge", { state: { arrivedFromInvite: true } });
    }, 1800);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9200,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "linear-gradient(180deg, #0e0608 0%, #060304 100%)",
          borderTop: "1px solid rgba(212,175,55,0.3)",
          borderRadius: "26px 26px 0 0",
          padding: "8px 22px 48px",
          overflow: "hidden",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(212,175,55,0.4)", margin: "12px auto 0" }} />

        {/* Chef image — hero */}
        <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 14px", position: "relative" }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <img
            src={CHEF_IMG}
            alt="Chef"
            style={{ width: 130, height: 130, objectFit: "contain", filter: "drop-shadow(0 0 28px rgba(212,175,55,0.25))" }}
          />
        </div>

        {/* Mr. Butlas byline */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <img src={BUTLAS_IMG} alt="Mr. Butlas" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
          <div>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: "rgba(212,175,55,0.8)", letterSpacing: "0.14em" }}>MR. BUTLAS</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>An Invitation from the House</p>
          </div>
        </div>

        {/* Message */}
        <div style={{
          background: "rgba(212,175,55,0.04)",
          border: "1px solid rgba(212,175,55,0.15)",
          borderRadius: 16, padding: "16px 16px 14px", marginBottom: 18,
        }}>
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 800, color: "#fff" }}>
            Dear Guest,
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.75 }}>
            Our chef has noticed you browsing the gallery this evening. On behalf of the house, he extends a personal invitation to join the{" "}
            <span style={{ color: "rgba(212,175,55,0.9)", fontWeight: 800 }}>Breakfast Lounge</span>{" "}
            — where guests gather, share coffee, and connect over a morning table.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.75 }}>
            A table has been prepared. The morning is yours.
          </p>
        </div>

        {/* Offerings */}
        <div style={{ display: "flex", gap: 8, marginBottom: 22, justifyContent: "center" }}>
          {OFFERINGS.map(o => (
            <div key={o.label} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.18)",
              borderRadius: 14, padding: "10px 6px",
            }}>
              <span style={{ fontSize: 20 }}>{o.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.3 }}>{o.label}</span>
            </div>
          ))}
        </div>

        {/* Confirmation flash */}
        <AnimatePresence>
          {confirmed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: "center", marginBottom: 14,
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.3)",
                borderRadius: 14, padding: "12px 16px",
              }}
            >
              <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 900, color: "rgba(212,175,55,0.95)" }}>
                ✓ Added to your side menu
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                Find the Breakfast Lounge anytime in the drawer
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={accept}
          disabled={confirmed}
          style={{
            width: "100%", height: 54, borderRadius: 16, border: "none",
            background: confirmed
              ? "rgba(212,175,55,0.2)"
              : "linear-gradient(135deg, rgba(212,175,55,0.9), rgba(180,140,30,0.95))",
            color: confirmed ? "rgba(212,175,55,0.6)" : "#0a0608",
            fontSize: 15, fontWeight: 900, cursor: confirmed ? "default" : "pointer",
            letterSpacing: "0.02em",
            boxShadow: confirmed ? "none" : "0 4px 24px rgba(212,175,55,0.3)",
            marginBottom: 12, transition: "all 0.3s",
          }}
        >
          {confirmed ? "Opening Breakfast Lounge…" : "Accept the Invitation"}
        </motion.button>

        {!confirmed && (
          <button
            onClick={onClose}
            style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 13, cursor: "pointer", paddingTop: 2 }}
          >
            Maybe another time
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}
