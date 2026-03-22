import { useState } from "react";
import { motion } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import {
  getCurrentISOWeek, seededFloorGifts, getFloorGiftsThisWeek,
  hasClaimedWarsBonus, claimWarsBonus, getTier,
} from "../utils/featureGating";

const FLOORS = [
  { key: "penthouse", label: "Penthouse",    icon: "🏙️", color: "#e8e4d0", glow: "rgba(232,228,208,0.45)" },
  { key: "kings",     label: "Kings Room",   icon: "👑", color: "#d4af37", glow: "rgba(212,175,55,0.45)"  },
  { key: "suite",     label: "Suite",        icon: "🛎️", color: "#cd7f32", glow: "rgba(205,127,50,0.4)"   },
  { key: "garden",    label: "Garden Lodge", icon: "🌿", color: "#7a9e7e", glow: "rgba(122,158,126,0.4)"  },
  { key: "cellar",    label: "The Cellar",   icon: "🍷", color: "#9b1c1c", glow: "rgba(155,28,28,0.4)"    },
  { key: "standard",  label: "Standard",     icon: "🛏️", color: "#a8a8b0", glow: "rgba(168,168,176,0.3)"  },
];

function getWeekEndsIn(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const daysUntilSun = day === 0 ? 7 : 7 - day;
  const h = 23 - now.getHours();
  if (daysUntilSun === 7 && h < 2) return "< 2h";
  if (daysUntilSun === 1) return `${h}h`;
  return `${daysUntilSun}d`;
}

type Props = { onClose: () => void };

export default function FloorWarsBoard({ onClose }: Props) {
  const a = useGenderAccent();
  const myTier = getTier();
  const week   = getCurrentISOWeek();
  const realGifts = getFloorGiftsThisWeek();
  const [claimed, setClaimed] = useState(hasClaimedWarsBonus);

  // Build leaderboard
  const leaderboard = FLOORS.map(f => {
    const seeded = seededFloorGifts(f.key, week);
    const real   = realGifts[f.key] ?? 0;
    return { ...f, gifts: seeded + real };
  }).sort((a, b) => b.gifts - a.gifts);

  const max     = leaderboard[0]?.gifts ?? 1;
  const winner  = leaderboard[0];
  const myEntry = leaderboard.find(f => f.key === myTier);
  const myRank  = leaderboard.findIndex(f => f.key === myTier) + 1;
  const isWinner = myTier === winner.key;

  function handleClaim() {
    claimWarsBonus();
    setClaimed(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,10,0.99)", borderRadius: "24px 24px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", maxHeight: "93dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #92400e, #d4af37, #fbbf24, #d4af37, #92400e, transparent)" }} />

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px max(32px,env(safe-area-inset-bottom,32px))", scrollbarWidth: "none" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", margin: "0 auto 18px" }} />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <motion.span animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: 32 }}>⚔️</motion.span>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>Floor Wars</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Week {week} · Resets in {getWeekEndsIn()}</p>
            </div>
          </div>

          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: "0 0 20px" }}>
            The floor that sends the most gifts this week wins 🏆 bonus coins for all its members.
          </p>

          {/* Winner banner */}
          <motion.div
            animate={{ borderColor: ["rgba(212,175,55,0.3)", "rgba(212,175,55,0.7)", "rgba(212,175,55,0.3)"] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 14, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}
          >
            <span style={{ fontSize: 28 }}>🏆</span>
            <div>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "#d4af37", textTransform: "uppercase", letterSpacing: "0.1em" }}>Currently Leading</p>
              <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 900, color: "#fff" }}>{winner.icon} {winner.label}</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{winner.gifts.toLocaleString()} gifts this week</p>
            </div>
          </motion.div>

          {/* Leaderboard */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {leaderboard.map((f, i) => {
              const isMe = f.key === myTier;
              const pct  = Math.round((f.gifts / max) * 100);
              return (
                <motion.div
                  key={f.key}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    background: isMe ? `${f.glow.replace("0.4", "0.08")}` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isMe ? f.glow.replace("0.4", "0.35") : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 12, padding: "10px 12px",
                    boxShadow: isMe ? `0 0 16px ${f.glow.replace("0.4", "0.2")}` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: i === 0 ? "#d4af37" : "rgba(255,255,255,0.35)", minWidth: 18 }}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                    </span>
                    <span style={{ fontSize: 16 }}>{f.icon}</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: isMe ? 900 : 600, color: isMe ? "#fff" : "rgba(255,255,255,0.6)" }}>
                      {f.label}{isMe && <span style={{ fontSize: 9, color: f.color, marginLeft: 6, fontWeight: 800 }}>YOUR FLOOR</span>}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: f.color }}>{f.gifts.toLocaleString()} 🎁</span>
                  </div>
                  {/* Bar */}
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.06 + 0.2, duration: 0.6 }}
                      style={{ height: "100%", background: f.color, borderRadius: 2 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* My floor summary */}
          {myEntry && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
              <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Your floor this week</p>
              <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 900, color: "#fff" }}>{myEntry.icon} {myEntry.label} — #{myRank}</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                {isWinner ? "🏆 You're leading! Keep sending gifts to hold the top." : `${leaderboard[0].gifts - myEntry.gifts} gifts behind ${winner.label}.`}
              </p>
            </div>
          )}

          {/* Claim bonus */}
          {isWinner && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 14, padding: "14px 16px", marginBottom: 18, textAlign: "center" }}
            >
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 900, color: "#d4af37" }}>🏆 Your floor is winning this week!</p>
              <p style={{ margin: "0 0 14px", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Claim your 25 bonus coins — leaders earn</p>
              {claimed ? (
                <p style={{ fontSize: 12, color: "#4ade80", fontWeight: 800 }}>✓ Claimed — check back next week</p>
              ) : (
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleClaim}
                  style={{ height: 44, padding: "0 28px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #92400e, #d4af37)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
                >
                  Claim 25 Coins 🪙
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Send gift reminder */}
          <div style={{ background: `${a.glow(0.05)}`, border: `1px solid ${a.glow(0.18)}`, borderRadius: 12, padding: "10px 14px", display: "flex", gap: 9, alignItems: "flex-start" }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>🎁</span>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.55 }}>
              Every gift you send in floor chat counts toward your floor's total. Send a gift to help {myEntry?.label ?? "your floor"} climb the leaderboard.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
