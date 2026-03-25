// ── Leaderboard Sheet ───────────────────────────────────────────────────────────
// Bottom sheet showing top-liked profiles in the user's city/country.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import type { GhostProfile } from "../types/ghostTypes";

type Props = {
  show: boolean;
  profiles: GhostProfile[];
  userCity: string;
  homeFlag: string;
  likedIds: Set<string>;
  onClose: () => void;
  onLike: (p: GhostProfile) => void;
  onView: (p: GhostProfile) => void;
};

function plc(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(37, h) + id.charCodeAt(i) | 0;
  return 50 + (Math.abs(h) % 950);
}

export default function GhostLeaderboardSheet({ show, profiles, userCity, homeFlag, likedIds, onClose, onLike, onView }: Props) {
  const cityProfiles = profiles
    .filter(p => p.city === userCity || p.countryFlag === homeFlag)
    .map(p => ({ p, likes: plc(p.id) }))
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 20);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 480, background: "rgba(5,5,10,0.99)", borderRadius: "22px 22px 0 0", border: "1px solid rgba(220,20,20,0.25)", borderBottom: "none", maxHeight: "88dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Gold top stripe */}
            <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #e01010, #ff3333, #e01010, transparent)", flexShrink: 0 }} />

            {/* Header */}
            <div style={{ flexShrink: 0, padding: "14px 18px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>🏆</span>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Top in {userCity}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Most liked · last 24 hours</p>
                </div>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>

            {/* Profile list */}
            <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "10px 14px max(24px,env(safe-area-inset-bottom,24px))" }}>
              {cityProfiles.map(({ p, likes }, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < cityProfiles.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                >
                  {/* Rank */}
                  <div style={{ width: 24, flexShrink: 0, textAlign: "center" }}>
                    {i === 0 ? <span style={{ fontSize: 16 }}>🥇</span>
                      : i === 1 ? <span style={{ fontSize: 16 }}>🥈</span>
                      : i === 2 ? <span style={{ fontSize: 16 }}>🥉</span>
                      : <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.3)" }}>#{i + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={p.image} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: i < 3 ? "2px solid #e01010" : "2px solid rgba(255,255,255,0.12)", display: "block" }}
                      onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                    {isOnline(p.last_seen_at) && (
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                        style={{ position: "absolute", bottom: 1, right: 1, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 5px rgba(74,222,128,0.9)", border: "1.5px solid rgba(5,5,10,1)" }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name}</p>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>{p.age}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                      <span style={{ fontSize: 10 }}>{p.countryFlag}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{p.city}</span>
                      <span style={{ fontSize: 9, color: "#ec4899", fontWeight: 700, marginLeft: 4 }}>❤ {likes}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <motion.button whileTap={{ scale: 0.88 }}
                      onClick={() => { onClose(); onView(p); }}
                      style={{ height: 32, padding: "0 10px", borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      View
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.88 }}
                      onClick={() => onLike(p)}
                      style={{ height: 32, padding: "0 10px", borderRadius: 9, background: likedIds.has(p.id) ? "rgba(236,72,153,0.18)" : "rgba(255,255,255,0.06)", border: likedIds.has(p.id) ? "1px solid rgba(236,72,153,0.5)" : "1px solid rgba(255,255,255,0.14)", color: likedIds.has(p.id) ? "#ec4899" : "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                      {likedIds.has(p.id) ? "❤️" : "♡"}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
              {cityProfiles.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <span style={{ fontSize: 40 }}>👻</span>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 12 }}>No profiles in {userCity} yet</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
