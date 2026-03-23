// ── Game Invite Popup ──────────────────────────────────────────────────────────
// Butler delivers a Connect 4 game invite. Player can accept or decline
// (with a reason). Butler warns that declining lowers ranking position.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameInvite } from "../utils/gameInviteService";
import { DECLINE_REASONS } from "../utils/gameInviteService";

const BUTLER_IMG = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdfccc-removebg-preview.png";
const GAMES_IMG  = "https://ik.imagekit.io/7grri5v7d/Skeleton%20in%20tuxedo%20flips%20Connect%204%20disc.png";

type Props = {
  invite: GameInvite;
  onAccept:  () => void;
  onDecline: (reason: string) => void;
};

export default function GameInvitePopup({ invite, onAccept, onDecline }: Props) {
  const [showReasons, setShowReasons] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  function handleDeclineConfirm() {
    if (!selectedReason) return;
    onDecline(selectedReason);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9700,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 0",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(6,6,20,0.99)",
          borderRadius: "26px 26px 0 0",
          border: "1px solid rgba(250,204,21,0.18)",
          borderBottom: "none",
          paddingBottom: "max(32px,env(safe-area-inset-bottom,32px))",
          overflow: "hidden",
        }}
      >
        {/* Gold line */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #facc15, transparent)" }} />

        <div style={{ padding: "22px 20px 0" }}>

          {/* Butler messenger header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <img src={BUTLER_IMG} alt="Butler"
              style={{ width: 40, height: 40, objectFit: "cover", objectPosition: "top",
                borderRadius: 12, border: "1px solid rgba(250,204,21,0.2)" }} />
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700,
                color: "rgba(250,204,21,0.7)", letterSpacing: "0.06em" }}>
                THE BUTLER
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                A challenge has arrived at your door
              </p>
            </div>
          </div>

          {/* Invite card */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
            borderRadius: 16, background: "rgba(250,204,21,0.06)",
            border: "1px solid rgba(250,204,21,0.2)", marginBottom: 16 }}>
            {invite.from_image ? (
              <img src={invite.from_image} alt={invite.from_name}
                style={{ width: 52, height: 52, borderRadius: 14,
                  objectFit: "cover", border: "1.5px solid rgba(250,204,21,0.35)" }} />
            ) : (
              <div style={{ width: 52, height: 52, borderRadius: 14,
                background: "rgba(250,204,21,0.1)", border: "1.5px solid rgba(250,204,21,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                👤
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 900, color: "#fff" }}>
                {invite.from_name}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                has invited you to play
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 5,
                padding: "3px 10px", borderRadius: 8,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <img src={GAMES_IMG} alt="Connect 4"
                  style={{ width: 16, height: 16, objectFit: "contain" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                  Connect 4
                </span>
              </div>
            </div>
          </div>

          {/* Butler ranking warning */}
          <motion.div
            animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity }}
            style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px",
              borderRadius: 12, background: "rgba(251,146,60,0.07)",
              border: "1px solid rgba(251,146,60,0.2)", marginBottom: 20 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>🎩</span>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(251,146,60,0.85)", lineHeight: 1.6 }}>
              The butler notes: declining challenges may affect your position on the leaderboard and
              could cost you your country title.
            </p>
          </motion.div>

          {/* Actions */}
          <AnimatePresence mode="wait">
            {!showReasons ? (
              <motion.div key="btns"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", gap: 10 }}>
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={() => setShowReasons(true)}
                  style={{ flex: 1, height: 52, borderRadius: 16, cursor: "pointer",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.45)", fontSize: 14, fontWeight: 700 }}>
                  Decline
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={onAccept}
                  style={{ flex: 2, height: 52, borderRadius: 16, cursor: "pointer",
                    background: "linear-gradient(135deg, #facc15, #f59e0b 55%, #d97706)",
                    border: "none", color: "#1a0f00", fontSize: 15, fontWeight: 900,
                    boxShadow: "0 6px 24px rgba(250,204,21,0.35)" }}>
                  🎮 Accept Challenge
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="reasons"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700,
                  color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>
                  Choose a reason:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {DECLINE_REASONS.map(r => (
                    <button key={r} onClick={() => setSelectedReason(r)}
                      style={{ height: 40, borderRadius: 11, cursor: "pointer",
                        background: selectedReason === r ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
                        border: selectedReason === r ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.07)",
                        color: selectedReason === r ? "#fca5a5" : "rgba(255,255,255,0.5)",
                        fontSize: 12, fontWeight: 600, textAlign: "left", padding: "0 14px" }}>
                      {r}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowReasons(false)}
                    style={{ height: 44, padding: "0 18px", borderRadius: 12, cursor: "pointer",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
                    Back
                  </button>
                  <motion.button whileTap={{ scale: 0.96 }}
                    onClick={handleDeclineConfirm} disabled={!selectedReason}
                    style={{ flex: 1, height: 44, borderRadius: 12, cursor: selectedReason ? "pointer" : "default",
                      background: selectedReason ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
                      border: selectedReason ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(255,255,255,0.07)",
                      color: selectedReason ? "#fca5a5" : "rgba(255,255,255,0.25)",
                      fontSize: 13, fontWeight: 700 }}>
                    Confirm Decline
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
