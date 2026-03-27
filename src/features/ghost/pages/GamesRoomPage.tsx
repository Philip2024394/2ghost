// ── Games Room ─────────────────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SendGameChallengeSheet from "../components/SendGameChallengeSheet";
import type { GameType } from "../utils/gameInviteService";

const HERO_BG = "https://ik.imagekit.io/7grri5v7d/asddsasddSDFASDFASDFSASDFdsfsdfdsdfsdfdsfsdsdxxxxdsfsd.png";

// ── 3 game tiles ──────────────────────────────────────────────────────────────
const GAMES: { type: GameType | "soon"; emoji?: string; img?: string; label: string; route?: string }[] = [
  { type: "connect4", img: "https://ik.imagekit.io/7grri5v7d/asddsasddSDFASDFASDFSASDFdsfsdfdsdfsdfdsfsd.png", label: "Connect 4",    route: "/games/connect4" },
  { type: "memory",   img: "https://ik.imagekit.io/7grri5v7d/asddsasddSDFASDFASDFSASDFdsfsdfdsdfsdfdsfsdsd.png", label: "Memory Match", route: "/games/memory"   },
  { type: "wordduel", img: "https://ik.imagekit.io/7grri5v7d/asddsasddSDFASDFASDFSASDFdsfsdfdsdfsdfdsfsdsdxxxx.png", label: "Word Duel", route: "/games/wordduel" },
];

const LEADERBOARD = [
  { rank: 1, name: "Aria K.",   wins: 47, losses: 8,  streak: 9,  coins: 2840, isChampion: true,  isRunnerUp: false },
  { rank: 2, name: "Marcus T.", wins: 31, losses: 12, streak: 4,  coins: 1920, isChampion: false, isRunnerUp: true  },
  { rank: 3, name: "Yuki M.",   wins: 28, losses: 15, streak: 3,  coins: 1540, isChampion: false, isRunnerUp: false },
  { rank: 4, name: "Dev S.",    wins: 24, losses: 18, streak: 1,  coins: 1280, isChampion: false, isRunnerUp: false },
  { rank: 5, name: "Sofia R.",  wins: 19, losses: 11, streak: 2,  coins: 980,  isChampion: false, isRunnerUp: false },
  { rank: 6, name: "Lena P.",   wins: 17, losses: 14, streak: 0,  coins: 820,  isChampion: false, isRunnerUp: false },
  { rank: 7, name: "Jin W.",    wins: 15, losses: 16, streak: 1,  coins: 740,  isChampion: false, isRunnerUp: false },
  { rank: 8, name: "Mia C.",    wins: 12, losses: 13, streak: 0,  coins: 560,  isChampion: false, isRunnerUp: false },
];

// ── Game invite confirmation popup ───────────────────────────────────────────
function GameOptionsSheet({ game, onClose, onPlay, onInvite }: {
  game: typeof GAMES[0];
  onClose: () => void;
  onPlay: () => void;
  onInvite: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(14px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(5,3,10,0.99)", borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", overflow: "hidden" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#92400e,#d4af37,#f0d060)" }} />
        <div style={{ padding: "18px 22px max(36px,env(safe-area-inset-bottom,36px))" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 18px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(212,175,55,0.12)", border: "1.5px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, overflow: "hidden" }}>
              {game.img
                ? <img src={game.img} alt={game.label} style={{ width: "80%", height: "80%", objectFit: "contain" }} />
                : game.emoji}
            </div>
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 19, fontWeight: 900, color: "#fff" }}>{game.label}</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(212,175,55,0.6)", fontWeight: 700 }}>Best of 3 · Win coins</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={onPlay}
              style={{ width: "100%", height: 54, borderRadius: 16, border: "none", background: "linear-gradient(135deg,#92400e,#d4af37,#f0d060)", color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 20px rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span>🎩</span> Play vs Mr. Butlas
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={onInvite}
              style={{ width: "100%", height: 50, borderRadius: 16, border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.07)", color: "#d4af37", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span>💌</span> Invite a Guest
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GamesRoomPage() {
  const navigate = useNavigate();
  const [imgLoaded,       setImgLoaded]       = useState(false);
  const [activeGame,      setActiveGame]       = useState<typeof GAMES[0] | null>(null);
  const [challengeSheet,  setChallengeSheet]   = useState(false);
  const [showLeaderboard, setShowLeaderboard]  = useState(false);

  function handleGameTap(g: typeof GAMES[0]) {
    if (g.type === "soon") return;
    setActiveGame(g);
  }

  function handlePlay() {
    if (!activeGame?.route) return;
    setActiveGame(null);
    navigate(activeGame.route);
  }

  function handleInvite() {
    setActiveGame(null);
    setChallengeSheet(true);
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#05030a", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", overflowX: "hidden" }}>
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column" }}>

        {/* ── Hero image ── */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "9/7" }}>
          <img
            src={HERO_BG}
            alt=""
            onLoad={() => setImgLoaded(true)}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center center",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.9s ease",
            }}
          />
          {/* Bottom fade into page bg */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to top, #05030a, transparent)", zIndex: 1 }} />

          {/* Header nav */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "max(env(safe-area-inset-top,16px),16px) 16px 0" }}>
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => navigate("/games")}
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ←
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/mode")}
              style={{ height: 32, padding: "0 12px", borderRadius: 10, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13 }}>🏠</span> Home
            </motion.button>
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowLeaderboard(v => !v)}
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              👑
            </motion.button>
          </div>
        </div>

        {/* ── Slogan + game buttons ── */}
        <div style={{ padding: "18px 20px 0", background: "#05030a" }}>
          {/* Slogan */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ marginBottom: 18 }}>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: "rgba(212,175,55,0.6)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Heartsway Hotel
            </p>
            <p style={{ margin: "0 0 2px", fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.01em" }}>
              Play. Win. Collect.
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
              Challenge Mr. Butlas or invite a guest — coins on the line.
            </p>
          </motion.div>

          {/* ── 3 square game buttons in a row ── */}
          <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
            {GAMES.map((g, i) => {
              const isSoon = g.type === "soon";
              return (
                <div key={g.type} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                  <motion.button
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.38 }}
                    whileTap={isSoon ? {} : { scale: 0.92 }}
                    onClick={() => handleGameTap(g)}
                    style={{
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderRadius: 16,
                      border: isSoon
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "1.5px solid rgba(212,175,55,0.45)",
                      background: isSoon ? "rgba(10,8,14,0.6)" : "rgba(10,6,2,0.9)",
                      cursor: isSoon ? "default" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: isSoon ? "none" : "0 4px 24px rgba(212,175,55,0.2), inset 0 1px 0 rgba(212,175,55,0.1)",
                      opacity: isSoon ? 0.45 : 1,
                      padding: 0, overflow: "hidden",
                    }}
                  >
                    {g.img ? (
                      <img src={g.img} alt={g.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 22, lineHeight: 1 }}>{g.emoji}</span>
                    )}
                  </motion.button>
                  <span style={{
                    fontSize: 10, fontWeight: 900, letterSpacing: "0.03em", textAlign: "center",
                    color: isSoon ? "rgba(255,255,255,0.2)" : "rgba(212,175,55,0.9)",
                    lineHeight: 1.2,
                  }}>
                    {g.label}{isSoon ? " · Soon" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>


        {/* ── Leaderboard (collapsible) ── */}
        <AnimatePresence>
          {showLeaderboard && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden", padding: "0 18px", background: "#05030a" }}
            >
              <p style={{ margin: "0 0 10px", fontSize: 10, color: "rgba(255,255,255,0.28)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                👑 March 2026 Leaderboard
              </p>
              <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 24 }}>
                {LEADERBOARD.map((p, i) => (
                  <div key={p.rank} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    background: p.isChampion ? "rgba(250,204,21,0.06)" : p.isRunnerUp ? "rgba(255,255,255,0.03)" : "transparent",
                    borderBottom: i < LEADERBOARD.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}>
                    <span style={{ width: 22, textAlign: "center", fontSize: p.isChampion || p.isRunnerUp ? 14 : 12, fontWeight: 900, color: p.isChampion ? "#facc15" : p.isRunnerUp ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}>
                      {p.isChampion ? "👑" : p.isRunnerUp ? "🥈" : p.rank}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: p.isChampion ? "#facc15" : "rgba(255,255,255,0.8)" }}>{p.name}</p>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{p.wins}W · {p.losses}L{p.streak > 0 ? ` · 🔥${p.streak}` : ""}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 900, color: p.isChampion ? "#facc15" : "rgba(255,255,255,0.38)" }}>
                      {p.coins.toLocaleString()}🪙
                    </span>
                  </div>
                ))}
              </div>
              <p style={{ margin: "0 0 20px", fontSize: 9, color: "rgba(255,255,255,0.18)", textAlign: "center" }}>
                Resets 1st of every month · Top 2 earn Champion titles
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ paddingBottom: "max(32px,env(safe-area-inset-bottom,32px))" }} />
      </div>

      {/* ── Game options sheet ── */}
      <AnimatePresence>
        {activeGame && (
          <GameOptionsSheet
            game={activeGame}
            onClose={() => setActiveGame(null)}
            onPlay={handlePlay}
            onInvite={handleInvite}
          />
        )}
      </AnimatePresence>

      {/* ── Invite / challenge sheet ── */}
      <AnimatePresence>
        {challengeSheet && (
          <SendGameChallengeSheet onClose={() => setChallengeSheet(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
