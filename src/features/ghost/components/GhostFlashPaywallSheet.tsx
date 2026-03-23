// ── Ghost Flash Paywall Sheet ──────────────────────────────────────────────────
// Bottom sheet that gates entry into the 60-minute Ghost Flash live pool.
// Extracted from GhostModePage to reduce file size.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

type Props = {
  show: boolean;
  onClose: () => void;
  onEnterFlash: () => void;
};

export default function GhostFlashPaywallSheet({ show, onClose, onEnterFlash }: Props) {
  const a = useGenderAccent();
  const [paying, setPaying] = useState(false);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => { if (!paying) onClose(); }}
          style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 480, background: "rgb(5,5,10)", borderRadius: "22px 22px 0 0", border: `1px solid ${a.glow(0.2)}`, borderBottom: "none", padding: "24px 24px max(28px, env(safe-area-inset-bottom, 28px))" }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "0 auto 20px" }} />

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 22 }}>
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1, repeat: Infinity }}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, background: a.glow(0.12), border: `1px solid ${a.glow(0.35)}`, borderRadius: 50, padding: "6px 16px", marginBottom: 14 }}>
                <span style={{ fontSize: 16 }}>⚡</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: a.glow(0.95), letterSpacing: "0.1em" }}>GHOST FLASH</span>
              </motion.div>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>Go Live for 60 Minutes</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
                Enter the live Flash pool and connect with active Ghosts right now. Up to 3 instant WhatsApp connections.
              </p>
            </div>

            {/* Features */}
            <div style={{ background: a.glow(0.05), border: `1px solid ${a.glow(0.12)}`, borderRadius: 14, padding: "14px 16px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["⚡", "60-minute live session in the Flash pool"],
                ["💚", "Up to 3 instant WhatsApp connections"],
                ["👻", "Only live, active Ghosts shown"],
                ["🔄", "Rejoin anytime — each session is $2.99"],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Pay button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={paying}
              onClick={() => {
                setPaying(true);
                setTimeout(() => {
                  onEnterFlash();
                  setPaying(false);
                  onClose();
                }, 1600);
              }}
              style={{
                width: "100%", height: 54, borderRadius: 50, border: "none",
                background: paying ? "rgba(255,255,255,0.07)" : `linear-gradient(135deg, ${a.accent}, #16a34a)`,
                color: paying ? "rgba(255,255,255,0.3)" : "#000",
                fontSize: 16, fontWeight: 900, cursor: paying ? "default" : "pointer",
                marginBottom: 10,
                boxShadow: paying ? "none" : `0 4px 24px ${a.glow(0.3)}`,
              }}
            >
              {paying ? "Processing…" : "⚡ Join Flash — $2.99"}
            </motion.button>
            <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 13, cursor: "pointer", padding: "6px 0" }}>
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
