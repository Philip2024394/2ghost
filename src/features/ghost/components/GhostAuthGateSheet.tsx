// ── Auth Gate Sheet ────────────────────────────────────────────────────────────
// Bottom sheet prompting unauthenticated users to create an account or sign in.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

type Props = { show: boolean; onClose: () => void };

export default function GhostAuthGateSheet({ show, onClose }: Props) {
  const a        = useGenderAccent();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 9100, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 480, background: "rgba(5,5,10,0.99)", borderRadius: "24px 24px 0 0", border: `1px solid ${a.glow(0.25)}`, borderBottom: "none", overflow: "hidden", paddingBottom: "max(28px, env(safe-area-inset-bottom, 28px))" }}
          >
            {/* Accent stripe */}
            <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)` }} />

            {/* Hero image + heading */}
            <div style={{ textAlign: "center", padding: "28px 24px 20px" }}>
              <img src="https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasdasdasd.png?updatedAt=1773971031454" alt="Ghost House" style={{ width: 120, height: 120, objectFit: "contain", marginBottom: 14, display: "block", margin: "0 auto 14px" }} />
              <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>Join the Ghost House</p>
              <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>
                Create a free account to like profiles,<br />connect with matches & unlock all features
              </p>
            </div>

            {/* Feature pills */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, padding: "0 24px 22px", flexWrap: "wrap" }}>
              {["❤️ Like for free", "✨ Ghost Match", "👻 Stay anonymous", "🌍 Global"].map(f => (
                <div key={f} style={{ background: a.glow(0.08), border: `1px solid ${a.glow(0.2)}`, borderRadius: 20, padding: "4px 12px" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{f}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { onClose(); navigate("/ghost/auth"); }}
                style={{ width: "100%", height: 52, borderRadius: 16, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${a.accentDark}, ${a.accent})`, fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em", boxShadow: `0 0 24px ${a.glow(0.35)}` }}
              >
                Create Free Account 👻
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { onClose(); navigate("/ghost/auth"); }}
                style={{ width: "100%", height: 46, borderRadius: 16, border: `1px solid rgba(255,255,255,0.15)`, cursor: "pointer", background: "rgba(255,255,255,0.05)", fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}
              >
                Sign In
              </motion.button>
              <button
                onClick={onClose}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 600, paddingTop: 4 }}
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
