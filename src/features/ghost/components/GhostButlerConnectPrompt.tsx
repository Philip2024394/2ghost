// ── Butler Connect Prompt ───────────────────────────────────────────────────────
// Bottom sheet shown before opening WhatsApp when the user's city is butler-served.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";
import type { GhostProfile } from "../types/ghostTypes";

type Props = {
  profile: GhostProfile | null;
  onConnectNow: () => void;
  onOpenButler: () => void;
};

export default function GhostButlerConnectPrompt({ profile, onConnectNow, onOpenButler }: Props) {
  return (
    <AnimatePresence>
      {profile && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: "fixed", inset: 0, zIndex: 320, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={onConnectNow}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "rgba(10,10,16,0.98)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
              borderRadius: "22px 22px 0 0", border: "1px solid rgba(220,20,20,0.2)",
              padding: "20px 20px max(20px, env(safe-area-inset-bottom, 20px))",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 32, lineHeight: 1 }}>🎩</span>
              <p style={{ margin: "8px 0 4px", fontSize: 15, fontWeight: 800, color: "#e01010" }}>
                Send a Surprise First?
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                Impress {profile.name.split(" ")[0]} with flowers, jewellery or a spa gift — delivered right to her door.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={onOpenButler}
                style={{
                  width: "100%", height: 48, borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #e01010, #a00000)",
                  color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                🎩 Open Mr Butlas
              </button>
              <button
                onClick={onConnectNow}
                style={{
                  width: "100%", height: 44, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)",
                  fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                No thanks, connect now
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
