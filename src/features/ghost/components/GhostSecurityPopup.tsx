// ── Security Popup ──────────────────────────────────────────────────────────────
// Center popup shown when user tries to interact before accepting house rules.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdf.png";

type Props = {
  show: boolean;
  onClose: () => void;
  onShowRules: () => void;
};

export default function GhostSecurityPopup({ show, onClose, onShowRules }: Props) {
  const a = useGenderAccent();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 24px",
          }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 340,
              background: "rgba(8,10,8,0.98)",
              border: `1px solid ${a.glow(0.18)}`,
              borderRadius: 20,
              padding: "28px 24px 22px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
              textAlign: "center",
            }}
          >
            <img src={GHOST_LOGO} alt="ghost" style={{ width: 56, height: 56, objectFit: "contain", marginBottom: 14 }} />
            <p style={{ fontSize: 11, fontWeight: 800, color: a.glow(0.7), textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>
              🔒 Security Notice
            </p>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: "0 0 10px", lineHeight: 1.3 }}>
              Account Required
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 20px", lineHeight: 1.6 }}>
              For security reasons, all users must agree to our house rules before viewing our house guests.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => { onClose(); onShowRules(); }}
              style={{
                width: "100%", height: 46, borderRadius: 50, border: "none",
                background: a.gradient,
                color: "#fff", fontSize: 14, fontWeight: 900,
                cursor: "pointer",
                boxShadow: `0 4px 20px ${a.glowMid(0.4)}`,
              }}
            >
              View House Rules
            </motion.button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", marginTop: 12, padding: "4px 0" }}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
