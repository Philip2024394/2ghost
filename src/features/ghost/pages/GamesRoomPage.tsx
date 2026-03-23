// ── Games Room · Landing ───────────────────────────────────────────────────────

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const HERO_BG   = "https://ik.imagekit.io/7grri5v7d/Haunted%20room%20with%20Connect%20Four%20game.png";
const BUTLER_FLIP = "https://ik.imagekit.io/7grri5v7d/Skeleton%20in%20tuxedo%20flips%20Connect%204%20disc.png";

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

export default function GamesRoomPage() {
  const navigate      = useNavigate();
  const [imgLoaded,      setImgLoaded]      = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const champion = LEADERBOARD[0];
  const runnerUp = LEADERBOARD[1];

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#04040e",
      color: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center",
      overflowX: "hidden",
    }}>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── HERO ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        position: "relative", width: "100%", maxWidth: 480,
        minHeight: "100dvh",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* Background room image */}
        <img
          src={HERO_BG}
          alt=""
          onLoad={() => setImgLoaded(true)}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center top",
            opacity: imgLoaded ? 0.55 : 0,
            transition: "opacity 0.8s ease",
            zIndex: 0,
          }}
        />

        {/* Dark gradient overlay — heavy at bottom so text is readable */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "linear-gradient(180deg, rgba(4,4,14,0.55) 0%, rgba(4,4,14,0.3) 35%, rgba(4,4,14,0.72) 65%, rgba(4,4,14,0.98) 100%)",
        }} />

        {/* ── Header ── */}
        <div style={{
          position: "relative", zIndex: 2, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "max(env(safe-area-inset-top,16px),16px) 16px 12px",
        }}>
          <button onClick={() => navigate(-1)}
            style={{ width: 34, height: 34, borderRadius: 10,
              background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)",
              fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </button>
        </div>

        {/* ── Hero content ── */}
        <div style={{
          position: "relative", zIndex: 2,
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "flex-end",
          padding: "0 24px max(env(safe-area-inset-bottom,32px),32px)",
          textAlign: "center",
        }}>

          {/* Butler flipping coin — animated */}
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 2, -1, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ marginBottom: 24 }}>
            <motion.img
              src={BUTLER_FLIP}
              alt="butler"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ width: 200, height: 200, objectFit: "contain",
                filter: "drop-shadow(0 8px 32px rgba(250,204,21,0.38))" }}
            />
          </motion.div>

          {/* Title */}
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ margin: "0 0 10px", fontSize: 38, fontWeight: 900,
              letterSpacing: "-0.02em", lineHeight: 1,
              background: "linear-gradient(135deg, #fff 20%, #facc15 60%, #fef08a 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text" }}>
            Connect 4
          </motion.p>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            style={{ margin: "0 0 32px", fontSize: 15, fontWeight: 600, lineHeight: 1.5,
              color: "rgba(255,255,255,0.62)", maxWidth: 260 }}>
            The butler has never lost.
            <br />
            <span style={{ color: "rgba(255,255,255,0.88)", fontWeight: 800 }}>
              Will you be the first?
            </span>
          </motion.p>

          {/* Let's Connect CTA */}
          <motion.button
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/ghost/games/connect4")}
            style={{
              width: "100%", height: 60, borderRadius: 20, cursor: "pointer",
              background: "linear-gradient(135deg, #facc15, #f59e0b 55%, #d97706)",
              border: "none",
              color: "#1a0f00", fontSize: 18, fontWeight: 900, letterSpacing: "0.02em",
              boxShadow: "0 8px 32px rgba(250,204,21,0.45), 0 2px 0 rgba(255,255,255,0.18) inset",
            }}>
            Let's Connect
          </motion.button>

          {/* How it works link */}
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            onClick={() => setShowHowItWorks(true)}
            style={{ marginTop: 14, background: "none", border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.32)",
              letterSpacing: "0.06em", textDecoration: "underline", textUnderlineOffset: 3 }}>
            How it works
          </motion.button>

          {/* Scroll hint */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            style={{ margin: "12px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)",
              fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Scroll for champions & leaderboard ↓
          </motion.p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── BELOW FOLD ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        width: "100%", maxWidth: 480,
        padding: "0 14px",
        paddingBottom: "max(40px,env(safe-area-inset-bottom,40px))",
        display: "flex", flexDirection: "column", gap: 20,
      }}>

        {/* ── Monthly Champions ── */}
        <div>
          <p style={{ margin: "24px 0 10px", fontSize: 10, color: "rgba(255,255,255,0.28)",
            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            👑 Monthly Champions
          </p>
          <div style={{ display: "flex", gap: 8 }}>

            {/* Champion */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ flex: 3, borderRadius: 18, padding: "16px 14px",
                background: "linear-gradient(135deg,rgba(250,204,21,0.12),rgba(250,204,21,0.04))",
                border: "1px solid rgba(250,204,21,0.28)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13,
                  background: "rgba(250,204,21,0.12)", border: "1.5px solid rgba(250,204,21,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0 }}>
                  👑
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#facc15" }}>
                    {champion.name}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                    {champion.wins}W · {champion.losses}L · 🔥{champion.streak} streak
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 700,
                    color: "#facc1599" }}>
                    {champion.coins.toLocaleString()} 🪙
                  </p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/ghost/games/connect4")}
                style={{ width: "100%", height: 36, borderRadius: 11, cursor: "pointer",
                  background: "rgba(250,204,21,0.14)", border: "1px solid rgba(250,204,21,0.4)",
                  color: "#facc15", fontSize: 13, fontWeight: 900 }}>
                Challenge Champion
              </motion.button>
              <p style={{ margin: "7px 0 0", fontSize: 9, color: "rgba(255,255,255,0.22)",
                textAlign: "center" }}>
                Max 25🪙 wager · Best of 3
              </p>
            </motion.div>

            {/* Runner-up */}
            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.06 }}
              style={{ flex: 2, borderRadius: 18, padding: "16px 12px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                gap: 4, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>🥈</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 900,
                  color: "rgba(255,255,255,0.8)" }}>
                  {runnerUp.name}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  {runnerUp.wins}W · {runnerUp.losses}L
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/ghost/games/connect4")}
                style={{ width: "100%", height: 32, borderRadius: 10, cursor: "pointer",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 700 }}>
                Challenge
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* ── Leaderboard ── */}
        <div>
          <p style={{ margin: "0 0 10px", fontSize: 10, color: "rgba(255,255,255,0.28)",
            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            March 2026 Leaderboard
          </p>
          <div style={{ borderRadius: 18, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.07)" }}>
            {LEADERBOARD.map((p, i) => (
              <motion.div key={p.rank}
                initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px",
                  background: p.isChampion
                    ? "rgba(250,204,21,0.06)"
                    : p.isRunnerUp
                      ? "rgba(255,255,255,0.03)"
                      : "transparent",
                  borderBottom: i < LEADERBOARD.length - 1
                    ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}>
                <span style={{ width: 22, textAlign: "center",
                  fontSize: p.isChampion || p.isRunnerUp ? 14 : 12, fontWeight: 900,
                  color: p.isChampion ? "#facc15"
                    : p.isRunnerUp ? "rgba(255,255,255,0.5)"
                    : "rgba(255,255,255,0.2)" }}>
                  {p.isChampion ? "👑" : p.isRunnerUp ? "🥈" : p.rank}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800,
                    color: p.isChampion ? "#facc15" : "rgba(255,255,255,0.8)" }}>
                    {p.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                    {p.wins}W · {p.losses}L{p.streak > 0 ? ` · 🔥${p.streak}` : ""}
                  </p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 900,
                  color: p.isChampion ? "#facc15" : "rgba(255,255,255,0.38)" }}>
                  {p.coins.toLocaleString()}🪙
                </span>
              </motion.div>
            ))}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 9, color: "rgba(255,255,255,0.18)",
            textAlign: "center" }}>
            Resets 1st of every month · Top 2 earn Champion & Runner-up titles
          </p>
        </div>
      </div>

      {/* ── How It Works popup ── */}
      <AnimatePresence>
        {showHowItWorks && (
          <motion.div
            key="hiw-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9800,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "24px 20px" }}>

            <motion.div
              key="hiw-panel"
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              style={{ width: "100%", maxWidth: 360,
                background: "rgba(6,6,20,0.99)",
                borderRadius: 24,
                border: "1px solid rgba(250,204,21,0.18)",
                overflow: "hidden" }}>

              {/* Gold line */}
              <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #facc15, transparent)" }} />

              <div style={{ padding: "24px 22px 28px" }}>

                {/* Title */}
                <p style={{ margin: "0 0 3px", fontSize: 18, fontWeight: 900, color: "#fff" }}>Connect 4</p>
                <p style={{ margin: "0 0 22px", fontSize: 11, fontWeight: 700, color: "#facc15", letterSpacing: "0.05em" }}>
                  The Icebreaker
                </p>

                {/* Mini boards — 4 win directions */}
                {(() => {
                  const S = 10, G = 3, COLS4 = 4, ROWS4 = 4;
                  type Dir = { label: string; cells: [number,number][] };
                  const dirs: Dir[] = [
                    { label: "Horizontal →", cells: [[3,0],[3,1],[3,2],[3,3]] },
                    { label: "Vertical ↓",   cells: [[0,1],[1,1],[2,1],[3,1]] },
                    { label: "Diagonal ↘",   cells: [[0,0],[1,1],[2,2],[3,3]] },
                    { label: "Diagonal ↙",   cells: [[0,3],[1,2],[2,1],[3,0]] },
                  ];
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
                      {dirs.map(dir => {
                        const winSet = new Set(dir.cells.map(([r,c]) => `${r},${c}`));
                        return (
                          <div key={dir.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                            <div style={{ background: "#0b0d26", borderRadius: 10, padding: 8,
                              border: "1px solid rgba(255,255,255,0.06)" }}>
                              {Array.from({ length: ROWS4 }, (_, r) => (
                                <div key={r} style={{ display: "flex", gap: G, marginBottom: r < ROWS4-1 ? G : 0 }}>
                                  {Array.from({ length: COLS4 }, (_, c) => {
                                    const hit = winSet.has(`${r},${c}`);
                                    return (
                                      <div key={c} style={{ width: S, height: S, borderRadius: "50%", flexShrink: 0,
                                        background: hit
                                          ? "radial-gradient(circle at 35% 30%, #fef08a, #facc15 55%, #b45309)"
                                          : "rgba(255,255,255,0.07)",
                                        boxShadow: hit ? "0 0 6px rgba(250,204,21,0.65)" : "none" }} />
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.32)", fontWeight: 700,
                              textAlign: "center", letterSpacing: "0.03em" }}>
                              {dir.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Icebreaker text */}
                <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>
                  Drop a disc. Connect four. Break the ice.
                </p>
                <p style={{ margin: "0 0 22px", fontSize: 12.5, color: "rgba(255,255,255,0.42)", lineHeight: 1.8 }}>
                  Challenge a house ghost or invite that someone special. Take turns, think ahead, and let the game do what introductions never quite manage. Connect 4 isn't just a move — it's the start of a conversation.
                </p>

                {/* CTA — only way to close */}
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => setShowHowItWorks(false)}
                  style={{ width: "100%", height: 52, borderRadius: 16, cursor: "pointer",
                    background: "linear-gradient(135deg, #facc15, #f59e0b 55%, #d97706)",
                    border: "none",
                    color: "#1a0f00", fontSize: 15, fontWeight: 900,
                    boxShadow: "0 6px 24px rgba(250,204,21,0.35)" }}>
                  Got it — let's play
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
