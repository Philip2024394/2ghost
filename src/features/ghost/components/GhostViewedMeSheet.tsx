// ── Viewed Me Sheet ────────────────────────────────────────────────────────────
// Bottom sheet listing profiles who viewed the current user's profile.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import type { GhostProfile } from "../types/ghostTypes";
import { getProfileFloor, FLOOR_LABELS, isProfileInvited } from "./FloorInviteSheet";
import MrButlasReportSheet from "./MrButlasReportSheet";

// ── Chat Invite helpers ──────────────────────────────────────────────────────
const INVITES_KEY = "ghost_chat_invites";

export type ChatInvite = {
  id: string;
  fromProfileId: string;
  toProfileId: string;
  status: "pending" | "accepted" | "refused";
  sentAt: number;
};

export function getInvites(): ChatInvite[] {
  try { return JSON.parse(localStorage.getItem(INVITES_KEY) || "[]"); } catch { return []; }
}
export function saveInvite(fromProfileId: string, toProfileId: string): void {
  const invites = getInvites().filter(i => !(i.fromProfileId === fromProfileId && i.toProfileId === toProfileId));
  invites.push({ id: `${fromProfileId}_${toProfileId}`, fromProfileId, toProfileId, status: "pending", sentAt: Date.now() });
  try { localStorage.setItem(INVITES_KEY, JSON.stringify(invites)); } catch {}
}
export function respondToInvite(fromProfileId: string, toProfileId: string, status: "accepted" | "refused"): void {
  const invites = getInvites().map(i =>
    i.fromProfileId === fromProfileId && i.toProfileId === toProfileId ? { ...i, status } : i
  );
  try { localStorage.setItem(INVITES_KEY, JSON.stringify(invites)); } catch {}
}
export function getInvite(fromProfileId: string, toProfileId: string): ChatInvite | null {
  return getInvites().find(i => i.fromProfileId === fromProfileId && i.toProfileId === toProfileId) ?? null;
}

export type ViewedProfile = GhostProfile & { viewCount: number };

type Props = {
  show: boolean;
  viewedMeList: ViewedProfile[];
  myProfileId: string | null;
  userRoomTier: string | null;
  likedIds: Set<string>;
  onClose: () => void;
  onLike: (p: GhostProfile) => void;
  onMatchAction: (p: GhostProfile) => void;
  onFloorInvite: (p: GhostProfile, mode: "invite" | "request", target: string) => void;
  onStartChat: (p: GhostProfile) => void;
};

export default function GhostViewedMeSheet({ show, viewedMeList, myProfileId, userRoomTier: _userRoomTier, likedIds, onClose, onLike, onMatchAction, onFloorInvite: _onFloorInvite, onStartChat }: Props) {
  const a = useGenderAccent();
  const [refreshKey, setRefreshKey] = useState(0);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [reportProfile, setReportProfile] = useState<GhostProfile | null>(null);
  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const handleAccept = (p: GhostProfile) => {
    if (!myProfileId) return;
    respondToInvite(p.id, myProfileId, "accepted");
    refresh();
  };

  const handleRefuse = (p: GhostProfile) => {
    if (!myProfileId) return;
    respondToInvite(p.id, myProfileId, "refused");
    setRemovingIds(prev => new Set([...prev, p.id]));
    setTimeout(() => {
      setRemovingIds(prev => { const n = new Set(prev); n.delete(p.id); return n; });
      refresh();
    }, 1800);
  };

  void refreshKey; // triggers re-read of localStorage on state change

  return (
    <>
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          style={{ position: "fixed", inset: 0, zIndex: 520, background: "rgba(6,6,10,0.99)", display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <motion.div
            style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
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
                const invited   = isProfileInvited(p.id);

                const sentInvite     = myProfileId ? getInvite(myProfileId, p.id) : null;
                const receivedInvite = myProfileId ? getInvite(p.id, myProfileId) : null;
                const isRemoving     = removingIds.has(p.id);

                if (sentInvite?.status === "refused" || (receivedInvite?.status === "refused" && !isRemoving)) return null;

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: isRemoving ? 0 : 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: isRemoving ? 0.4 : 0.3 }}
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

                    {/* Chat invite strip */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "8px 12px", display: "flex", flexDirection: "column", gap: 6 }}>

                      {/* User A sent invite — show status */}
                      {sentInvite ? (
                        <div style={{ height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          background: sentInvite.status === "accepted" ? "rgba(74,222,128,0.12)" : "rgba(220,20,20,0.08)",
                          border: `1px solid ${sentInvite.status === "accepted" ? "rgba(74,222,128,0.35)" : "rgba(220,20,20,0.5)"}`,
                        }}>
                          <span style={{ fontSize: 14 }}>{sentInvite.status === "accepted" ? "✓" : "✉️"}</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: sentInvite.status === "accepted" ? "#4ade80" : "rgba(212,175,55,0.8)" }}>
                            {sentInvite.status === "accepted" ? "Invitation Accepted" : "Chat Invitation Sent"}
                          </span>
                        </div>
                      ) : receivedInvite?.status === "pending" ? (
                        /* User B — received invite, show Accept/Refuse */
                        <>
                          <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.45)", textAlign: "center" }}>
                            This guest has sent you a chat invitation
                          </p>
                          <div style={{ display: "flex", gap: 6 }}>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={e => { e.stopPropagation(); handleAccept(p); }}
                              style={{ flex: 1, height: 34, borderRadius: 10, border: "none", background: "rgba(74,222,128,0.15)", color: "#4ade80", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                              ✓ Accept
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={e => { e.stopPropagation(); handleRefuse(p); }}
                              style={{ flex: 1, height: 34, borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                              ✕ Decline
                            </motion.button>
                          </div>
                          <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.25)", textAlign: "center", lineHeight: 1.5 }}>
                            Declining will remove this guest from future contact.
                          </p>
                        </>
                      ) : (
                        /* Default — no invite yet: both buttons side by side */
                        <div style={{ display: "flex", gap: 6 }}>
                          <motion.button whileTap={{ scale: 0.97 }} onClick={e => { e.stopPropagation(); onStartChat(p); }}
                            style={{ flex: 1, height: 34, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #b8922a, #d4af37)", color: "#000", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>
                            🎩 Send Chat Invite
                          </motion.button>
                          <motion.button whileTap={{ scale: 0.97 }} onClick={e => { e.stopPropagation(); setReportProfile(p); }}
                            style={{ flex: 1, height: 34, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #b8922a, #d4af37)", color: "#000", fontSize: 10, fontWeight: 900, cursor: "pointer" }}>
                            🕵️ Check Profile · 🪙 20
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    <MrButlasReportSheet
      show={reportProfile !== null}
      profile={reportProfile}
      onClose={() => setReportProfile(null)}
    />
    </>
  );
}
