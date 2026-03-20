import { motion } from "framer-motion";
import { X, Zap } from "lucide-react";

// ── Ghost Boost modal ────────────────────────────────────────────────────────
export default function BoostModal({ onClose, onBoost }: { onClose: () => void; onBoost: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(6,6,10,0.98)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
          overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)" }} />
        <div style={{ padding: "22px 20px 36px" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 18, right: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
            <X size={13} />
          </button>

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 40, lineHeight: 1, marginBottom: 10 }}>⚡</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>
              <span>Ghost Boost</span>
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.55 }}>
              <span>Your profile jumps to the top of every member's feed for 24 hours. More eyes, more matches.</span>
            </p>
          </div>

          {/* What you get */}
          <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 14, padding: "12px 14px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "⚡ Top of feed for all members",
              "👁 Up to 10× more profile views",
              "💚 Higher chance of likes & matches",
              "🕐 Active for exactly 24 hours",
            ].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>{t.slice(0, 2)}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{t.slice(2)}</span>
              </div>
            ))}
          </div>

          {/* Price */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}><span>24-hour Boost</span></p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}><span>One time · no subscription</span></p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#4ade80", margin: 0 }}><span>15,000 IDR</span></p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0 }}><span>~$1</span></p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onBoost}
            style={{
              width: "100%", height: 52, borderRadius: 16, border: "none",
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer",
              boxShadow: "0 6px 28px rgba(34,197,94,0.45)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Zap size={18} fill="currentColor" />
            <span>Boost Now — 15,000 IDR</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
