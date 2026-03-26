// ButlerGameChallengeSheet
// Mr. Butlas randomly challenges a guest to a coin-earning game session.
// 3 goals to complete for coin rewards:
//   Goal 1: Play 1 game        → 🪙 10 coins
//   Goal 2: Win a game         → 🪙 25 coins
//   Goal 3: Complete 3 games   → 🪙 50 coins bonus
// Progress stored in localStorage under "butler_challenge_progress".

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCoins } from "../hooks/useCoins";

const BUTLER_IMG = "https://ik.imagekit.io/7grri5v7d/ewrwerwerwer-removebg-preview.png?updatedAt=1774288645920";
const CHALLENGE_KEY = "butler_challenge_progress";

// ── Mock player pool ──────────────────────────────────────────────────────────
const PLAYER_POOL = [
  { id: "p1",  ghostId: "GH-4821", age: 26, city: "Jakarta",   flag: "🇮🇩", seed: 1 },
  { id: "p2",  ghostId: "GH-7734", age: 29, city: "Bali",      flag: "🇮🇩", seed: 2 },
  { id: "p3",  ghostId: "GH-2291", age: 24, city: "Surabaya",  flag: "🇮🇩", seed: 3 },
  { id: "p4",  ghostId: "GH-5503", age: 31, city: "Bandung",   flag: "🇮🇩", seed: 4 },
  { id: "p5",  ghostId: "GH-8847", age: 27, city: "Singapore", flag: "🇸🇬", seed: 5 },
  { id: "p6",  ghostId: "GH-1162", age: 22, city: "KL",        flag: "🇲🇾", seed: 6 },
  { id: "p7",  ghostId: "GH-3390", age: 34, city: "Tokyo",     flag: "🇯🇵", seed: 7 },
  { id: "p8",  ghostId: "GH-6621", age: 28, city: "Sydney",    flag: "🇦🇺", seed: 8 },
  { id: "p9",  ghostId: "GH-9908", age: 25, city: "Dubai",     flag: "🇦🇪", seed: 9 },
  { id: "p10", ghostId: "GH-4455", age: 30, city: "London",    flag: "🇬🇧", seed: 10 },
  { id: "p11", ghostId: "GH-7712", age: 23, city: "Manila",    flag: "🇵🇭", seed: 11 },
  { id: "p12", ghostId: "GH-3381", age: 32, city: "Bangkok",   flag: "🇹🇭", seed: 12 },
];

const AVATAR_COLORS = [
  "#7c3aed","#0891b2","#b45309","#15803d","#be123c","#1d4ed8","#7e22ce","#0f766e",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getProgress(): { played: number; won: number; goal1Claimed: boolean; goal2Claimed: boolean; goal3Claimed: boolean } {
  try {
    return JSON.parse(localStorage.getItem(CHALLENGE_KEY) || "{}");
  } catch { return { played: 0, won: 0, goal1Claimed: false, goal2Claimed: false, goal3Claimed: false }; }
}

function saveProgress(p: ReturnType<typeof getProgress>) {
  try { localStorage.setItem(CHALLENGE_KEY, JSON.stringify(p)); } catch {}
}

function avatarColor(seed: number) {
  return AVATAR_COLORS[seed % AVATAR_COLORS.length];
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

export default function ButlerGameChallengeSheet({ onClose }: Props) {
  const navigate = useNavigate();
  const { addCoins } = useCoins();

  const progress = useMemo(() => getProgress(), []);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"pick" | "goals">("pick");
  const [localProgress, setLocalProgress] = useState(progress);

  const MAX_PLAYERS = 5;

  const goals = [
    {
      id: "g1",
      icon: "🎮",
      label: "Play your first game",
      sub: "Step into the Games Room and play once",
      reward: "+10 🪙",
      coins: 10,
      done: localProgress.played >= 1,
      claimed: localProgress.goal1Claimed,
      canClaim: localProgress.played >= 1 && !localProgress.goal1Claimed,
    },
    {
      id: "g2",
      icon: "🏆",
      label: "Win a game",
      sub: "Beat your opponent to earn the bonus",
      reward: "+25 🪙",
      coins: 25,
      done: localProgress.won >= 1,
      claimed: localProgress.goal2Claimed,
      canClaim: localProgress.won >= 1 && !localProgress.goal2Claimed,
    },
    {
      id: "g3",
      icon: "⚡",
      label: "Complete 3 games",
      sub: "Reach 3 total plays for the bonus",
      reward: "+50 🪙",
      coins: 50,
      done: localProgress.played >= 3,
      claimed: localProgress.goal3Claimed,
      canClaim: localProgress.played >= 3 && !localProgress.goal3Claimed,
    },
  ];

  function togglePlayer(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= MAX_PLAYERS) return prev;
      next.add(id);
      return next;
    });
  }

  function claimGoal(goalId: string) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    addCoins(goal.coins, `Butler Challenge — ${goal.label} 🎩`, "bonus");
    const key = goalId === "g1" ? "goal1Claimed" : goalId === "g2" ? "goal2Claimed" : "goal3Claimed";
    const next = { ...localProgress, [key]: true };
    saveProgress(next);
    setLocalProgress(next);
  }

  function goToGames() {
    onClose();
    navigate("/ghost/games");
  }

  // ── STEP: pick players ──────────────────────────────────────────────────────
  if (step === "pick") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 900,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 480,
            background: "rgba(5,3,10,0.99)",
            borderRadius: "24px 24px 0 0",
            border: "1px solid rgba(212,175,55,0.15)", borderBottom: "none",
            maxHeight: "88dvh", display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Gold accent */}
          <div style={{ height: 3, background: "linear-gradient(90deg, #92400e, #d4af37, #f0d060)", flexShrink: 0 }} />

          <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px max(32px,env(safe-area-inset-bottom,32px))" }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 18px" }} />

            {/* Butler intro row */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 18 }}>
              <img src={BUTLER_IMG} alt="Mr. Butlas" style={{ width: 70, height: 70, objectFit: "contain", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 3px", fontSize: 10, color: "rgba(212,175,55,0.85)", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  Game Challenge
                </p>
                <p style={{ margin: "0 0 5px", fontSize: 16, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>
                  Mr. Butlas invites you to play
                </p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                  Select 5 guests to join your table
                </p>
              </div>
            </div>

            {/* Formal note */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(212,175,55,0.15)",
              borderRadius: 14, padding: "12px 14px", marginBottom: 18,
            }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
                Dear Guest — a game table has been arranged in your honour. Complete three challenges and earn coins to spend in the hotel.
              </p>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: "rgba(212,175,55,0.7)", letterSpacing: "0.12em", textAlign: "right" }}>
                — MR. BUTLAS
              </p>
            </div>

            {/* Coin rewards preview */}
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              {["+10 🪙", "+25 🪙", "+50 🪙"].map((r, i) => (
                <div key={i} style={{
                  flex: 1, background: "rgba(212,175,55,0.06)",
                  border: "1px solid rgba(212,175,55,0.18)",
                  borderRadius: 10, padding: "8px 4px", textAlign: "center",
                }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: "rgba(212,175,55,0.85)" }}>{r}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 8, color: "rgba(255,255,255,0.3)" }}>Goal {i + 1}</p>
                </div>
              ))}
            </div>

            {/* Player picker */}
            <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "rgba(212,175,55,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Choose your table ({selected.size}/{MAX_PLAYERS})
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
              {PLAYER_POOL.map(p => {
                const isSelected = selected.has(p.id);
                return (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => togglePlayer(p.id)}
                    style={{
                      background: isSelected ? "rgba(212,175,55,0.14)" : "rgba(255,255,255,0.03)",
                      border: isSelected ? "1.5px solid rgba(212,175,55,0.55)" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14, padding: "10px 8px",
                      cursor: selected.size >= MAX_PLAYERS && !isSelected ? "default" : "pointer",
                      opacity: selected.size >= MAX_PLAYERS && !isSelected ? 0.4 : 1,
                      textAlign: "center",
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: avatarColor(p.seed),
                      margin: "0 auto 6px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 900, color: "#fff",
                      boxShadow: isSelected ? `0 0 12px ${avatarColor(p.seed)}80` : "none",
                      transition: "box-shadow 0.2s",
                    }}>
                      {p.ghostId.slice(-2)}
                    </div>
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: isSelected ? "#d4af37" : "rgba(255,255,255,0.6)" }}>
                      {p.flag} {p.city}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 8, color: "rgba(255,255,255,0.3)" }}>
                      {p.age} · {p.ghostId}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep("goals")}
              disabled={selected.size < MAX_PLAYERS}
              style={{
                width: "100%", height: 54, borderRadius: 16, border: "none",
                background: selected.size >= MAX_PLAYERS
                  ? "linear-gradient(135deg, #92400e, #d4af37, #f0d060)"
                  : "rgba(255,255,255,0.06)",
                color: selected.size >= MAX_PLAYERS ? "#000" : "rgba(255,255,255,0.2)",
                fontSize: 15, fontWeight: 900,
                cursor: selected.size >= MAX_PLAYERS ? "pointer" : "default",
                boxShadow: selected.size >= MAX_PLAYERS ? "0 4px 20px rgba(212,175,55,0.3)" : "none",
                marginBottom: 10, transition: "all 0.3s",
              }}
            >
              {selected.size < MAX_PLAYERS
                ? `Select ${MAX_PLAYERS - selected.size} more guest${MAX_PLAYERS - selected.size !== 1 ? "s" : ""}`
                : "Accept the Challenge"}
            </motion.button>
            <button
              onClick={onClose}
              style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}
            >
              Not this evening
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // ── STEP: goals ─────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 900,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(5,3,10,0.99)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(212,175,55,0.15)", borderBottom: "none",
          maxHeight: "88dvh", display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #92400e, #d4af37, #f0d060)", flexShrink: 0 }} />

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 20px max(32px,env(safe-area-inset-bottom,32px))" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 18px" }} />

          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.8)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            🎮 Challenge Active
          </p>
          <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: "#fff" }}>
            3 goals · earn up to 85 🪙
          </p>
          <p style={{ margin: "0 0 20px", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
            Challenge any guest to a Best of 3 match or play solo to complete these goals.
          </p>

          {/* Selected players preview */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {Array.from(selected).map(id => {
              const p = PLAYER_POOL.find(pl => pl.id === id)!;
              return (
                <div key={id} style={{
                  flex: 1, textAlign: "center",
                  background: "rgba(212,175,55,0.06)",
                  border: "1px solid rgba(212,175,55,0.15)",
                  borderRadius: 12, padding: "8px 4px",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: avatarColor(p.seed),
                    margin: "0 auto 4px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 900, color: "#fff",
                  }}>{p.ghostId.slice(-2)}</div>
                  <p style={{ margin: 0, fontSize: 7, color: "rgba(255,255,255,0.4)" }}>{p.flag} {p.city}</p>
                </div>
              );
            })}
          </div>

          {/* Goals */}
          <div style={{ marginBottom: 20 }}>
            {goals.map((g) => (
              <div key={g.id} style={{
                background: g.done ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.03)",
                border: g.done ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 16, padding: "14px 16px", marginBottom: 10,
                display: "flex", alignItems: "center", gap: 14,
                transition: "border-color 0.3s",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: g.done ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)",
                  border: g.done ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>
                  {g.claimed ? "✓" : g.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 900, color: g.done ? "#d4af37" : "#fff" }}>
                    {g.label}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{g.sub}</p>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  {g.claimed ? (
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.6)" }}>Claimed ✓</p>
                  ) : g.canClaim ? (
                    <motion.button
                      whileTap={{ scale: 0.93 }}
                      onClick={() => claimGoal(g.id)}
                      style={{
                        height: 30, padding: "0 12px", borderRadius: 10, border: "none",
                        background: "linear-gradient(135deg, #92400e, #d4af37)",
                        color: "#000", fontSize: 11, fontWeight: 900, cursor: "pointer",
                      }}
                    >
                      Claim
                    </motion.button>
                  ) : (
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(212,175,55,0.5)" }}>{g.reward}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Go play */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={goToGames}
            style={{
              width: "100%", height: 54, borderRadius: 16, border: "none",
              background: "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
              color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(212,175,55,0.3)",
              marginBottom: 10,
            }}
          >
            Go to the Games Room 🎮
          </motion.button>
          <button
            onClick={onClose}
            style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}
          >
            Come back later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
