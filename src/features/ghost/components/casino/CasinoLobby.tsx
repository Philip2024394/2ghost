import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCoins } from "../../hooks/useCoins";
import BlackjackGame from "./BlackjackGame";
import SlotsGame     from "./SlotsGame";
import HighLowGame   from "./HighLowGame";
import CoinBalanceChip from "../CoinBalanceChip";

type GameId = "blackjack" | "slots" | "highlow";

const GAMES = [
  {
    id: "blackjack" as GameId,
    name: "Blackjack",
    emoji: "🃏",
    tagline: "Beat the dealer · Blackjack pays 3:2",
    sub: "Skill + luck · House edge ~0.5%",
    color: "#4ade80",
    gradient: "linear-gradient(135deg, #14532d, #22c55e, #4ade80)",
    minBet: 10,
    hot: false,
  },
  {
    id: "slots" as GameId,
    name: "Ghost Slots",
    emoji: "🎰",
    tagline: "Spin for the 👻 jackpot",
    sub: "Progressive jackpot · RTP ~88%",
    color: "#d4af37",
    gradient: "linear-gradient(135deg, #92660a, #d4af37, #f0d060)",
    minBet: 10,
    hot: true,
  },
  {
    id: "highlow" as GameId,
    name: "High / Low",
    emoji: "🎲",
    tagline: "Higher or lower? Dynamic live odds",
    sub: "Streak bonuses · Deck tracking",
    color: "#f87171",
    gradient: "linear-gradient(135deg, #991b1b, #dc2626, #f87171)",
    minBet: 10,
    hot: false,
  },
];

// Simulated live feed
const LIVE_WINS = [
  "Guest-4821 won 🪙 2,500 on Blackjack",
  "Guest-7734 hit the Ghost Jackpot 👻 🪙 32,000!",
  "Guest-2093 won 🪙 800 on High/Low × 5 streak",
  "Guest-9901 doubled down — won 🪙 1,000",
  "Guest-5588 won 🪙 500 on Slots 💎",
];

export default function CasinoLobby() {
  const navigate = useNavigate();
  const { balance } = useCoins();
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [feedIdx,    setFeedIdx]    = useState(0);

  // Rotate live feed
  useState(() => {
    const t = setInterval(() => setFeedIdx(i => (i + 1) % LIVE_WINS.length), 4000);
    return () => clearInterval(t);
  });

  const game = GAMES.find(g => g.id === activeGame);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#06060a",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
      position: "relative",
      overflowX: "hidden",
    }}>

      {/* Background glow */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 60%)",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top,16px) + 16px) 16px 14px",
          borderBottom: "1px solid rgba(212,175,55,0.1)",
          background: "rgba(6,6,10,0.9)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {activeGame ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setActiveGame(null)}
                style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >←</motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => navigate(-1)}
                style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >←</motion.button>
            )}
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#d4af37" }}>
                {activeGame ? `${game?.emoji} ${game?.name}` : "🎰 The Casino"}
              </p>
              <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
                {activeGame ? game?.sub : "Win coins · Spend anywhere in the hotel"}
              </p>
            </div>
          </div>
          <CoinBalanceChip size="md" />
        </div>

        {/* Live wins ticker */}
        {!activeGame && (
          <div style={{
            background: "rgba(212,175,55,0.06)", borderBottom: "1px solid rgba(212,175,55,0.1)",
            padding: "7px 16px", overflow: "hidden",
          }}>
            <AnimatePresence mode="wait">
              <motion.p
                key={feedIdx}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                style={{ margin: 0, fontSize: 11, color: "#d4af37", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              >
                🔴 LIVE — {LIVE_WINS[feedIdx]}
              </motion.p>
            </AnimatePresence>
          </div>
        )}

        {/* ── LOBBY ── */}
        <AnimatePresence mode="wait">
          {!activeGame ? (
            <motion.div key="lobby"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "16px 14px calc(env(safe-area-inset-bottom,0px) + 24px)" }}
            >
              {/* Balance summary card */}
              <div style={{
                background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)",
                borderRadius: 16, padding: "14px 16px", marginBottom: 16,
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <span style={{ fontSize: 28 }}>🪙</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Your chip stack</p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#d4af37" }}>{balance.toLocaleString()} coins</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Min bet</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>🪙 10</p>
                </div>
              </div>

              {/* Game cards */}
              <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Choose your game
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {GAMES.map((g, i) => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 280, damping: 24 }}
                    onClick={() => setActiveGame(g.id)}
                    style={{
                      borderRadius: 18, overflow: "hidden", cursor: "pointer",
                      background: `${g.color}08`, border: `1px solid ${g.color}25`,
                      boxShadow: g.hot ? `0 0 20px ${g.color}18` : "none",
                      position: "relative",
                    }}
                  >
                    {/* Top accent stripe */}
                    <div style={{ height: 3, background: g.gradient }} />

                    <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                        background: `${g.color}18`, border: `1px solid ${g.color}35`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                      }}>
                        {g.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: g.color }}>{g.name}</p>
                          {g.hot && (
                            <span style={{
                              fontSize: 8, fontWeight: 900, padding: "2px 7px", borderRadius: 10,
                              background: g.gradient, color: "#0a0700", letterSpacing: "0.06em",
                            }}>HOT 🔥</span>
                          )}
                        </div>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{g.tagline}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{g.sub}</p>
                      </div>
                      <span style={{ fontSize: 20, color: "rgba(255,255,255,0.2)", flexShrink: 0 }}>›</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Responsible gaming note */}
              <p style={{ marginTop: 20, textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.15)", lineHeight: 1.6 }}>
                Games use coins only — not real money.<br />
                Win coins to spend on hotel features. Play responsibly.
              </p>
            </motion.div>
          ) : (
            /* ── ACTIVE GAME ── */
            <motion.div key={activeGame}
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              style={{ padding: "12px 10px calc(env(safe-area-inset-bottom,0px) + 24px)" }}
            >
              {activeGame === "blackjack" && <BlackjackGame />}
              {activeGame === "slots"     && <SlotsGame />}
              {activeGame === "highlow"   && <HighLowGame />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
