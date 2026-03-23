// ── Butler Unavailable Popup ────────────────────────────────────────────────────
// Bottom sheet shown when Ghost Butler is not yet available in the user's city.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";

type Props = {
  show: boolean;
  onClose: () => void;
};

export default function GhostButlerUnavailablePopup({ show, onClose }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 320, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "rgba(10,10,16,0.98)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
              borderRadius: "22px 22px 0 0", border: "1px solid rgba(251,191,36,0.15)",
              padding: "32px 24px max(28px, env(safe-area-inset-bottom, 28px))",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>🎩</div>
            <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 900, color: "#fbbf24" }}>
              The Butler Has Not Yet Arrived
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
              Our butler is not yet on service shift in your city. Please come back later — we're expanding our list of gift service providers soon.
            </p>
            <button
              onClick={onClose}
              style={{
                width: "100%", height: 48, borderRadius: 14,
                background: "rgba(251,191,36,0.12)", color: "#fbbf24",
                fontWeight: 800, fontSize: 14, cursor: "pointer",
                border: "1px solid rgba(251,191,36,0.25)",
              }}
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
