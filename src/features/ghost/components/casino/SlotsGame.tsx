import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoins } from "../../hooks/useCoins";

// ── Symbol config ─────────────────────────────────────────────────────────────
// Virtual reel strip — 32 stops per reel
// Weights determine probability. Lower weight = rarer = higher payout.
const STRIP: string[] = [
  "🍒","🍒","🍒","🍒","🍒","🍒","🍒","🍒", // 8 — most common
  "🍋","🍋","🍋","🍋","🍋","🍋",             // 6
  "🍊","🍊","🍊","🍊","🍊",                   // 5
  "🍇","🍇","🍇","🍇",                         // 4
  "🔔","🔔","🔔","🔔",                         // 4
  "⭐","⭐","⭐",                               // 3
  "💎",                                          // 1 — rare
  "👻",                                          // 1 — jackpot (Ghost!)
]; // total = 32

// Pay table: [3-of-a-kind multiplier]
const PAY_TABLE: Record<string, { mult: number; label: string }> = {
  "👻": { mult: 500,  label: "GHOST JACKPOT!" },
  "💎": { mult: 100,  label: "Diamond Win!"   },
  "⭐": { mult: 50,   label: "Star Win!"       },
  "🔔": { mult: 25,   label: "Bell Win!"       },
  "🍇": { mult: 15,   label: "Grapes Win!"     },
  "🍊": { mult: 10,   label: "Orange Win!"     },
  "🍋": { mult: 7,    label: "Lemon Win!"      },
  "🍒": { mult: 5,    label: "Cherry Win!"     },
};

// Partial cherry pays
// 🍒🍒_ = 2x,  🍒__ = 1x (only on reel 1)

function pickSymbol(): string {
  return STRIP[Math.floor(Math.random() * STRIP.length)];
}

function spinResult(): [string, string, string] {
  return [pickSymbol(), pickSymbol(), pickSymbol()];
}

function calcPayout(bet: number, r1: string, r2: string, r3: string): { coins: number; label: string } {
  // Three of a kind
  if (r1 === r2 && r2 === r3) {
    const p = PAY_TABLE[r1];
    return { coins: bet * p.mult, label: p.label };
  }
  // Two cherries anywhere on first two reels
  if (r1 === "🍒" && r2 === "🍒") return { coins: bet * 2, label: "Two Cherries" };
  // One cherry on reel 1
  if (r1 === "🍒")                return { coins: bet * 1, label: "Cherry" };
  return { coins: 0, label: "" };
}

// ── Spin animation config ─────────────────────────────────────────────────────
const REEL_COUNT = 3;
const VISIBLE_ROWS = 3; // 3 rows visible per reel, middle is payline

type SpinState = "idle" | "spinning" | "stopping" | "done";

// Each reel shows 3 symbols. We cycle through STRIP symbols.
// On spin: rapidly increment index. On stop: snap to result symbol.

function getStripSlice(finalSymbol: string, spinning: boolean, tickIndex: number): string[] {
  if (spinning) {
    // Random 3 symbols during spin
    return Array.from({ length: VISIBLE_ROWS }, (_, i) =>
      STRIP[(tickIndex + i) % STRIP.length]
    );
  }
  // Static: show final symbol in middle (index 1)
  const idx = STRIP.indexOf(finalSymbol);
  const safeIdx = idx === -1 ? 0 : idx;
  return [
    STRIP[(safeIdx - 1 + STRIP.length) % STRIP.length],
    finalSymbol,
    STRIP[(safeIdx + 1) % STRIP.length],
  ];
}

const BET_OPTIONS = [10, 25, 50, 100];

// ── Jackpot counter — simulated progressive ───────────────────────────────────
let jackpotBase = 15000;

export default function SlotsGame() {
  const { balance, deductCoins, addCoins } = useCoins();

  const [bet,       setBet]       = useState(25);
  const [reels,     setReels]     = useState<string[]>(["🎰","🎰","🎰"]);
  const [spinState, setSpinState] = useState<SpinState>("idle");
  const [result,    setResult]    = useState<{ coins: number; label: string } | null>(null);
  const [jackpot,   setJackpot]   = useState(jackpotBase);
  const [stats, setStats] = useState({ spins: 0, totalWon: 0, biggestWin: 0 });
  const [lastWins, setLastWins] = useState<string[]>([]);

  // Tick refs for animation
  const tickRefs    = useRef<number[]>([0, 0, 0]);
  const intervals   = useRef<ReturnType<typeof setInterval>[]>([]);
  const finalResult = useRef<[string, string, string] | null>(null);

  // Jackpot grows over time
  useEffect(() => {
    const t = setInterval(() => {
      setJackpot(j => j + Math.floor(Math.random() * 3 + 1));
    }, 800);
    return () => clearInterval(t);
  }, []);

  // Reel tick displays
  const [tickDisplays, setTickDisplays] = useState<[string[], string[], string[]]>([
    ["🍒","🎰","🍋"], ["🔔","🎰","⭐"], ["🍊","🎰","🍇"]
  ]);

  const spin = useCallback(() => {
    if (spinState !== "idle") return;
    if (!deductCoins(bet, `Slots spin — ${bet} coins`)) return;

    const result3 = spinResult();
    finalResult.current = result3;

    setResult(null);
    setSpinState("spinning");

    // Start each reel ticking rapidly
    const newIntervals: ReturnType<typeof setInterval>[] = [];
    for (let r = 0; r < REEL_COUNT; r++) {
      tickRefs.current[r] = 0;
      const iv = setInterval(() => {
        tickRefs.current[r]++;
        setTickDisplays(prev => {
          const next = [...prev] as [string[], string[], string[]];
          next[r] = Array.from({ length: VISIBLE_ROWS }, (_, i) =>
            STRIP[(tickRefs.current[r] + i) % STRIP.length]
          );
          return next;
        });
      }, 60);
      newIntervals.push(iv);
    }
    intervals.current = newIntervals;

    // Stop reels one by one with staggered delays (realistic slot feel)
    [900, 1400, 1900].forEach((delay, r) => {
      setTimeout(() => {
        clearInterval(intervals.current[r]);
        const sym = finalResult.current![r];
        // Snap to final symbol
        setTickDisplays(prev => {
          const next = [...prev] as [string[], string[], string[]];
          const idx = STRIP.indexOf(sym);
          const safe = idx === -1 ? 0 : idx;
          next[r] = [
            STRIP[(safe - 1 + STRIP.length) % STRIP.length],
            sym,
            STRIP[(safe + 1) % STRIP.length],
          ];
          return next;
        });

        if (r === REEL_COUNT - 1) {
          // All reels stopped — calculate result
          setTimeout(() => {
            const [r1, r2, r3] = finalResult.current!;
            const payout = calcPayout(bet, r1, r2, r3);
            if (payout.coins > 0) {
              addCoins(payout.coins, `Slots: ${payout.label} — won ${payout.coins} coins`, "win");
              setStats(p => ({
                spins: p.spins + 1,
                totalWon: p.totalWon + payout.coins,
                biggestWin: Math.max(p.biggestWin, payout.coins),
              }));
              if (payout.label) {
                setLastWins(prev => [payout.label, ...prev].slice(0, 5));
              }
            } else {
              setStats(p => ({ ...p, spins: p.spins + 1 }));
            }
            setReels([r1, r2, r3]);
            setResult(payout);
            setSpinState("done");
            setTimeout(() => setSpinState("idle"), payout.coins >= bet * 25 ? 3000 : 1200);
          }, 300);
        }
      }, delay);
    });
  }, [spinState, bet, balance, deductCoins, addCoins]);

  const isJackpot = result?.label.includes("JACKPOT");
  const isBigWin  = result !== null && result.coins >= bet * 25;
  const isWin     = result !== null && result.coins > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif", color: "#fff", userSelect: "none" }}>

      {/* Header: Jackpot counter */}
      <div style={{
        background: "linear-gradient(135deg, #0a0700, #1a1000)",
        border: "1px solid rgba(212,175,55,0.3)",
        borderRadius: 16, padding: "10px 16px", marginBottom: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 8, fontWeight: 800, color: "rgba(212,175,55,0.6)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Progressive Jackpot</p>
          <motion.p
            key={jackpot}
            initial={{ scale: 1.05 }} animate={{ scale: 1 }}
            style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#d4af37", letterSpacing: "0.04em" }}
          >
            🪙 {jackpot.toLocaleString()}
          </motion.p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Your balance</p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>🪙 {balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Slot machine body */}
      <div style={{
        background: "linear-gradient(180deg, #1a0a00 0%, #2a1400 50%, #1a0a00 100%)",
        border: "3px solid #d4af37",
        borderRadius: 20, padding: "12px",
        boxShadow: "0 0 40px rgba(212,175,55,0.2), inset 0 0 30px rgba(0,0,0,0.5)",
        position: "relative", overflow: "hidden",
      }}>

        {/* Top LED strip */}
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 10 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.div
              key={i}
              animate={spinState === "spinning" ? { opacity: [1, 0.2, 1], background: ["#d4af37", "#ef4444", "#d4af37"] } : { opacity: 0.3 }}
              transition={{ duration: 0.3, repeat: spinState === "spinning" ? Infinity : 0, delay: i * 0.05 }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#d4af37" }}
            />
          ))}
        </div>

        {/* Reels container */}
        <div style={{
          display: "flex", gap: 6,
          background: "rgba(0,0,0,0.6)", borderRadius: 12,
          padding: "8px", border: "2px solid rgba(212,175,55,0.2)",
          position: "relative",
        }}>
          {/* Payline indicator */}
          <div style={{
            position: "absolute", left: 0, right: 0,
            top: "50%", transform: "translateY(-50%)",
            height: 58, pointerEvents: "none", zIndex: 2,
            border: `2px solid ${isWin ? "#d4af37" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 6,
            boxShadow: isWin ? "0 0 20px rgba(212,175,55,0.5)" : "none",
            transition: "box-shadow 0.3s, border-color 0.3s",
          }} />

          {[0,1,2].map(r => (
            <div key={r} style={{
              flex: 1, display: "flex", flexDirection: "column",
              background: "rgba(0,0,0,0.5)", borderRadius: 8,
              overflow: "hidden", height: 174, // 3 rows × 58px
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              {tickDisplays[r].map((sym, row) => (
                <div key={`${r}-${row}-${sym}`} style={{
                  height: 58, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32,
                  background: row === 1 ? "rgba(255,255,255,0.03)" : "transparent",
                  filter: row !== 1 ? "brightness(0.4)" : "none",
                }}>
                  {sym}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Win celebration */}
        <AnimatePresence>
          {isWin && result && spinState === "done" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{
                position: "absolute", inset: 0, borderRadius: 18,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(4px)",
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.4, repeat: isBigWin ? 4 : 1 }}
              >
                <p style={{ margin: "0 0 4px", fontSize: isJackpot ? 48 : isBigWin ? 40 : 32 }}>
                  {isJackpot ? "👻" : isBigWin ? "💎" : "✨"}
                </p>
              </motion.div>
              <p style={{ margin: "0 0 2px", fontSize: isJackpot ? 22 : 18, fontWeight: 900, color: "#d4af37" }}>
                {result.label}
              </p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>
                +🪙 {result.coins.toLocaleString()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom LED strip */}
        <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 10 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.div
              key={i}
              animate={isWin && spinState === "done" ? { opacity: [0.3, 1, 0.3], background: ["#d4af37", "#4ade80", "#d4af37"] } : { opacity: 0.3 }}
              transition={{ duration: 0.4, repeat: isWin ? Infinity : 0, delay: i * 0.05 }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#d4af37" }}
            />
          ))}
        </div>
      </div>

      {/* Bet selector */}
      <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "center" }}>
        {BET_OPTIONS.map(b => (
          <motion.button
            key={b}
            whileTap={{ scale: 0.92 }}
            onClick={() => setBet(b)}
            disabled={spinState !== "idle"}
            style={{
              flex: 1, height: 38, borderRadius: 10, border: "none", cursor: "pointer",
              background: bet === b ? "linear-gradient(135deg, #92660a, #d4af37)" : "rgba(255,255,255,0.06)",
              color: bet === b ? "#0a0700" : "rgba(255,255,255,0.5)",
              fontSize: 12, fontWeight: 900,
              transition: "all 0.15s",
            }}
          >
            🪙{b}
          </motion.button>
        ))}
      </div>

      {/* SPIN button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={spin}
        disabled={spinState !== "idle" || balance < bet}
        style={{
          width: "100%", height: 56, borderRadius: 16, border: "none",
          background: spinState !== "idle" || balance < bet
            ? "rgba(255,255,255,0.07)"
            : "linear-gradient(135deg, #92660a, #d4af37, #f0d060)",
          color: spinState !== "idle" || balance < bet ? "rgba(255,255,255,0.25)" : "#0a0700",
          fontSize: 16, fontWeight: 900, cursor: "pointer",
          marginTop: 8,
          boxShadow: spinState === "idle" && balance >= bet ? "0 6px 24px rgba(212,175,55,0.4)" : "none",
          letterSpacing: "0.06em", transition: "all 0.2s",
        }}
      >
        {spinState === "spinning" ? (
          <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>
            SPINNING…
          </motion.span>
        ) : spinState === "done" ? "🎰 SPIN AGAIN" : "🎰 SPIN"}
      </motion.button>

      {/* Pay table */}
      <div style={{ marginTop: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "10px 14px" }}>
        <p style={{ margin: "0 0 8px", fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Pay Table — bet × multiplier</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
          {Object.entries(PAY_TABLE).reverse().map(([sym, { mult, label }]) => (
            <div key={sym} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12 }}>{sym}{sym}{sym}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: mult >= 100 ? "#d4af37" : mult >= 25 ? "#a78bfa" : "rgba(255,255,255,0.5)" }}>×{mult}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12 }}>🍒🍒</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>×2</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12 }}>🍒</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>×1</span>
          </div>
        </div>
      </div>

      {/* Recent wins feed */}
      {lastWins.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {lastWins.map((w, i) => (
            <span key={i} style={{
              fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 10,
              background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)",
              color: "#d4af37",
            }}>✨ {w}</span>
          ))}
        </div>
      )}

      {/* Session stats */}
      <div style={{ marginTop: 8, display: "flex", gap: 12, justifyContent: "center" }}>
        {[
          { label: "Spins",      val: stats.spins },
          { label: "Total Won",  val: `🪙${stats.totalWon.toLocaleString()}` },
          { label: "Best Win",   val: `🪙${stats.biggestWin.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>{s.val}</p>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
