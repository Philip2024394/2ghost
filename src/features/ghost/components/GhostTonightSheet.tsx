// ── Tonight Sheet ───────────────────────────────────────────────────────────────
// Bottom sheet showing lobby members ready to meet tonight.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import type { GhostProfile } from "../types/ghostTypes";

type Props = {
  show: boolean;
  lobbyList: GhostProfile[];
  likedIds: Set<string>;
  onClose: () => void;
  onSelectProfile: (p: GhostProfile) => void;
  onLike: (p: GhostProfile) => void;
};

export default function GhostTonightSheet({ show, lobbyList, likedIds, onClose, onSelectProfile, onLike }: Props) {
  const a = useGenderAccent();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 480, background: "rgba(4,8,12,0.99)", borderRadius: "22px 22px 0 0", border: `1px solid ${a.glow(0.2)}`, borderBottom: "none", maxHeight: "90dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Accent top stripe */}
            <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, ${a.accentMid}, ${a.accent}, transparent)`, flexShrink: 0 }} />

            {/* Header */}
            <div style={{ flexShrink: 0, padding: "14px 18px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <motion.img src="https://ik.imagekit.io/7grri5v7d/SADFASDFASDFASDFSdsfasdf.png?updatedAt=1774213829792" alt="" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Ready to Meet Tonight</p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
                    {lobbyList.length > 0 ? `${lobbyList.length} ghost${lobbyList.length !== 1 ? "s" : ""} available now` : "No one in the lobby yet"}
                  </p>
                </div>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Profile grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 24px", scrollbarWidth: "none" } as React.CSSProperties}>
              {lobbyList.length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 48 }}>
                  <p style={{ fontSize: 48, margin: "0 0 12px" }}>🌙</p>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#fff" }}>Lobby is quiet</p>
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Check back later tonight</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  {lobbyList.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { onClose(); onSelectProfile(p); }}
                      style={{ cursor: "pointer" }}
                    >
                      <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", aspectRatio: "3/4", border: `1.5px solid ${a.glow(0.3)}`, boxShadow: `0 0 10px ${a.glow(0.12)}` }}>
                        <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)" }} />

                        {/* Tonight badge */}
                        <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "2px 6px" }}>
                          <span style={{ fontSize: 7, fontWeight: 900, color: a.accent, letterSpacing: "0.04em" }}>🌙 TONIGHT</span>
                        </div>

                        {/* Online pulse */}
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
                          style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: a.accent, boxShadow: `0 0 6px ${a.glow(0.9)}` }}
                        />

                        {/* Info */}
                        <div style={{ position: "absolute", bottom: 6, left: 7, right: 7 }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name.split(" ")[0]}</p>
                          <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{p.age} · {p.city}</p>
                        </div>
                      </div>

                      {/* Like button */}
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={e => { e.stopPropagation(); onLike(p); }}
                        style={{ width: "100%", marginTop: 5, height: 28, borderRadius: 8, border: likedIds.has(p.id) ? `1.5px solid ${a.glow(0.6)}` : "1px solid rgba(255,255,255,0.1)", background: likedIds.has(p.id) ? a.glow(0.15) : "rgba(255,255,255,0.04)", color: likedIds.has(p.id) ? a.accent : "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}
                      >
                        {likedIds.has(p.id) ? "❤️ Liked" : "♡ Like"}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
