// ── Viewed Me Sheet ────────────────────────────────────────────────────────────
// Bottom sheet listing profiles who viewed the current user's profile.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import type { GhostProfile } from "../types/ghostTypes";
import { getProfileFloor, floorRank, FLOOR_LABELS, isProfileInvited } from "./FloorInviteSheet";

export type ViewedProfile = GhostProfile & { viewCount: number };

type Props = {
  show: boolean;
  viewedMeList: ViewedProfile[];
  userRoomTier: string | null;
  likedIds: Set<string>;
  onClose: () => void;
  onLike: (p: GhostProfile) => void;
  onMatchAction: (p: GhostProfile) => void;
  onFloorInvite: (p: GhostProfile, mode: "invite" | "request", target: string) => void;
};

export default function GhostViewedMeSheet({ show, viewedMeList, userRoomTier, likedIds, onClose, onLike, onMatchAction, onFloorInvite }: Props) {
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
                <span style={{ fontSize: 19 }}>👁️</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: a.accent }}>Who Viewed Me</p>
                <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                  {viewedMeList.length} profiles · {viewedMeList.filter(p => p.viewCount >= 2).length} viewed you more than once
                </p>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>✕</span>
              </button>
            </div>

            {/* Keen viewers callout */}
            {viewedMeList.some(p => p.viewCount >= 3) && (
              <div style={{ flexShrink: 0, margin: "10px 14px 0", padding: "10px 14px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>🔥</span>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>
                  {viewedMeList.filter(p => p.viewCount >= 3).length} {viewedMeList.filter(p => p.viewCount >= 3).length === 1 ? "person has" : "people have"} viewed your profile 3+ times — they're interested.
                </p>
              </div>
            )}

            {/* Profile list */}
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px max(20px,env(safe-area-inset-bottom,20px))" }}>
              {viewedMeList.map((p, i) => {
                const isKeen    = p.viewCount >= 3;
                const isWarm    = p.viewCount === 2;
                const cardBg    = isKeen ? "rgba(239,68,68,0.07)" : isWarm ? a.glow(0.07) : "rgba(255,255,255,0.03)";
                const cardBdr   = isKeen ? "1px solid rgba(239,68,68,0.25)" : isWarm ? `1px solid ${a.glow(0.22)}` : "1px solid rgba(255,255,255,0.07)";
                const badgeBg   = isKeen ? "rgba(239,68,68,0.18)" : isWarm ? a.glow(0.15) : "rgba(255,255,255,0.07)";
                const badgeCol  = isKeen ? "#f87171" : isWarm ? a.accent : "rgba(255,255,255,0.35)";
                const badgeTxt  = isKeen ? `🔥 Viewed ${p.viewCount}×` : isWarm ? `👀 Viewed twice` : "Viewed once";
                const pFloor    = getProfileFloor(p.id);
                const myFloor   = userRoomTier ?? "standard";
                const diffFloor = pFloor !== myFloor;
                const theirHigher = floorRank(pFloor) > floorRank(myFloor);
                const invited   = isProfileInvited(p.id);

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ marginBottom: 8, borderRadius: 16, background: cardBg, border: cardBdr, overflow: "hidden" }}
                  >
                    {/* Main row */}
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", cursor: "pointer" }}
                      onClick={() => { onClose(); onMatchAction(p); }}
                    >
                      {/* Photo */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img
                          src={p.image} alt={p.name}
                          style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", border: isKeen ? "2px solid rgba(239,68,68,0.5)" : isWarm ? `2px solid ${a.glow(0.5)}` : "2px solid rgba(255,255,255,0.12)", display: "block" }}
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                        {isOnline(p.last_seen_at) && (
                          <div style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: "#4ade80", border: "2px solid rgba(6,6,10,1)" }} />
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.name}{p.age ? `, ${p.age}` : ""}
                          </p>
                          <span style={{ fontSize: 9, fontWeight: 800, color: badgeCol, background: badgeBg, borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>{badgeTxt}</span>
                        </div>
                        {p.city && <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>📍 {p.city}</p>}
                        <p style={{ margin: "2px 0 0", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>
                          {FLOOR_LABELS[pFloor] ?? pFloor}
                        </p>
                        {invited && (
                          <p style={{ margin: "3px 0 0", fontSize: 9, fontWeight: 800, color: a.accent }}>✓ Invited by {invited.invitedByName}</p>
                        )}
                        {isKeen && !invited && <p style={{ margin: "3px 0 0", fontSize: 10, fontWeight: 700, color: "#f87171" }}>Keeps coming back — make a move</p>}
                        {isWarm && !isKeen && !invited && <p style={{ margin: "3px 0 0", fontSize: 10, fontWeight: 700, color: a.accent }}>Viewed you twice — like back?</p>}
                      </div>

                      {/* CTA buttons */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          onClick={e => { e.stopPropagation(); if (!likedIds.has(p.id)) onLike(p); }}
                          style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: likedIds.has(p.id) ? a.glow(0.25) : isKeen ? "rgba(239,68,68,0.2)" : a.glow(0.12), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                        >
                          <span style={{ fontSize: 16 }}>{likedIds.has(p.id) ? "💚" : "❤️"}</span>
                        </motion.button>
                        {(isKeen || isWarm) && (
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={e => { e.stopPropagation(); onClose(); onMatchAction(p); }}
                            style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: isKeen ? "rgba(239,68,68,0.2)" : a.glow(0.12), display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          >
                            <span style={{ fontSize: 15 }}>👁️</span>
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* Floor invite strip */}
                    {diffFloor && !invited && userRoomTier && (
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "8px 12px", display: "flex", gap: 8 }}>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={e => { e.stopPropagation(); onFloorInvite(p, "invite", myFloor); }}
                          style={{ flex: 1, height: 32, borderRadius: 10, border: "none", background: a.glow(0.14), color: a.accent, fontSize: 10, fontWeight: 800, cursor: "pointer" }}
                        >
                          ✉️ Invite to My Floor
                        </motion.button>
                        {theirHigher && (
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={e => { e.stopPropagation(); onFloorInvite(p, "request", pFloor); }}
                            style={{ flex: 1, height: 32, borderRadius: 10, border: `1px solid ${a.glow(0.25)}`, background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 800, cursor: "pointer" }}
                          >
                            ⬆️ Invite Me Up
                          </motion.button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
