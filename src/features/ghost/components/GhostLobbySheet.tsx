// ── Ghost Lobby Sheet ──────────────────────────────────────────────────────────
// Bottom sheet showing hotel lobby / room member grid.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import type { GhostProfile } from "../types/ghostTypes";

type Props = {
  show: boolean;
  profiles: GhostProfile[];
  onClose: () => void;
  onSelectProfile: (p: GhostProfile) => void;
};

export default function GhostLobbySheet({ show, profiles, onClose, onSelectProfile }: Props) {
  const a = useGenderAccent();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 520, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 480, height: "88dvh", background: "rgba(6,6,10,0.99)", borderRadius: "22px 22px 0 0", border: `1px solid ${a.glow(0.2)}`, borderBottom: "none", display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Top stripe */}
            <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)`, flexShrink: 0 }} />

            {/* Header */}
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 12px", borderBottom: `1px solid ${a.glow(0.1)}`, background: a.gradientSubtle }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: a.glow(0.14), border: `1.5px solid ${a.glow(0.38)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 19 }}>🏨</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: a.accent }}>Hotel Lobby</p>
                <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                  {profiles.filter(p => isOnline(p.last_seen_at)).length} online · {profiles.length} guests available to meet tonight
                </p>
              </div>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block", flexShrink: 0 }} />
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>✕</span>
              </button>
            </div>

            {/* Profile grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px max(20px,env(safe-area-inset-bottom,20px))" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {profiles.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 24 }}
                    onClick={() => { onClose(); onSelectProfile(p); }}
                    style={{ borderRadius: 16, overflow: "hidden", position: "relative", cursor: "pointer", border: `1px solid ${a.glow(0.15)}` }}
                  >
                    <div style={{ paddingBottom: "130%", position: "relative" }}>
                      <img
                        src={p.image} alt={p.name}
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                      />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 55%)" }} />
                      {isOnline(p.last_seen_at) && (
                        <motion.div
                          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                          style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", border: "1.5px solid rgba(6,6,10,0.8)" }}
                        />
                      )}
                      <div style={{ position: "absolute", bottom: 6, left: 7, right: 7 }}>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#fff", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}{p.age ? `, ${p.age}` : ""}
                        </p>
                        {p.city && <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.city}</p>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              {profiles.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 24px" }}>
                  <span style={{ fontSize: 36 }}>🏨</span>
                  <p style={{ margin: "12px 0 0", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>The lobby is quiet right now.<br />Check back tonight.</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
