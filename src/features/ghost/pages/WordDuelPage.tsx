// ── Word Duel · Best of 3 ──────────────────────────────────────────────────────
// Human vs Mr. Butlas. Unscramble the word before Mr. Butlas does.
// Best of 3 rounds — first to win 2 rounds wins the match.
// Difficulty increases each round: Easy → Medium → Hard.

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { useCoins } from "../hooks/useCoins";

const BUTLER_IMG      = "https://ik.imagekit.io/7grri5v7d/werwerwer-removebg-preview.png";
const MATCH_WIN_COINS = 50;
const ROUND_TIME      = 30; // seconds per round

// ── Word pools ─────────────────────────────────────────────────────────────────
const WORDS = {
  easy:   ["HOTEL", "GHOST", "ROYAL", "CHARM", "DANCE", "COINS", "BRAVE", "MATCH", "GRAND", "NIGHT"],
  medium: ["BUTLER", "CASTLE", "LOUNGE", "WINNER", "RIDDLE", "PALACE", "HUNTER", "MIRROR", "MYSTIC"],
  hard:   ["MYSTERY", "FORTUNE", "GLAMOUR", "TRIUMPH", "PHANTOM", "KINGDOM", "SILENCE", "DESTINY"],
};

type Diff = "easy" | "medium" | "hard";
type Phase = "playing" | "round_result" | "shuffle_countdown" | "match_result";

function getDiff(round: number): Diff {
  if (round === 1) return "easy";
  if (round === 2) return "medium";
  return "hard";
}

function getButlasMs(diff: Diff): number {
  if (diff === "easy")   return 9000  + Math.random() * 7000;   // 9–16 s
  if (diff === "medium") return 13000 + Math.random() * 9000;   // 13–22 s
  return 17000 + Math.random() * 12000;                          // 17–29 s
}

function pickWord(diff: Diff, exclude: string): string {
  const pool = WORDS[diff].filter(w => w !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

function scrambleWord(word: string): string[] {
  const arr = word.split("");
  let attempts = 0;
  while (attempts < 30) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (arr.join("") !== word) break;
    attempts++;
  }
  return arr;
}

// ── Coin rain ─────────────────────────────────────────────────────────────────
function CoinRain() {
  const coins = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: 3 + Math.random() * 94,
    delay: Math.random() * 1.2,
    duration: 1.8 + Math.random() * 1.4,
    size: 20 + Math.random() * 14,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, pointerEvents: "none", overflow: "hidden" }}>
      {coins.map(c => (
        <motion.div key={c.id}
          initial={{ y: -60, opacity: 1 }}
          animate={{ y: "110vh", opacity: 0 }}
          transition={{ duration: c.duration, delay: c.delay, ease: "easeIn" }}
          style={{ position: "absolute", left: `${c.left}%`, top: 0, fontSize: c.size }}>
          🪙
        </motion.div>
      ))}
    </div>
  );
}

interface Tile { letter: string; id: number; used: boolean; }
interface Slot  { letter: string; tileId: number; }

function buildTiles(word: string): Tile[] {
  return scrambleWord(word).map((letter, i) => ({ letter, id: i, used: false }));
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WordDuelPage() {
  const navigate    = useNavigate();
  const { balance, addCoins } = useCoins();
  useGenderAccent(); // accent hook (games room uses gold theme throughout)

  // ── Stable refs (avoid stale closures in timers) ──────────────────────────
  const phaseRef       = useRef<Phase>("playing");
  const playerWinsRef  = useRef(0);
  const butlerWinsRef  = useRef(0);
  const roundNumRef    = useRef(1);
  const addCoinsRef    = useRef(addCoins);
  addCoinsRef.current  = addCoins;

  const butlasIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const roundIntervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const shuffleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [roundNum,       setRoundNum]       = useState(1);
  const [playerWins,     setPlayerWins]     = useState(0);
  const [butlerWins,     setButlerWins]     = useState(0);
  const [phase,          setPhase]          = useState<Phase>("playing");
  const [roundWinner,    setRoundWinner]    = useState<"player" | "butler" | null>(null);
  const [matchWinner,    setMatchWinner]    = useState<"player" | "butler" | null>(null);
  const [shuffleCount,   setShuffleCount]   = useState(3);
  const [showCoinRain,   setShowCoinRain]   = useState(false);
  const [displayCoins,   setDisplayCoins]   = useState(balance);

  // ── Round state ───────────────────────────────────────────────────────────
  const [word,           setWord]           = useState(() => pickWord("easy", ""));
  const [tiles,          setTiles]          = useState<Tile[]>(() => buildTiles(pickWord("easy", "")));
  const [answer,         setAnswer]         = useState<Slot[]>([]);
  const [roundTimer,     setRoundTimer]     = useState(ROUND_TIME);
  const [butlasProgress, setButlasProgress] = useState(0);
  const [showHint,       setShowHint]       = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function stopAllTimers() {
    if (butlasIntervalRef.current)  { clearInterval(butlasIntervalRef.current);  butlasIntervalRef.current  = null; }
    if (roundIntervalRef.current)   { clearInterval(roundIntervalRef.current);   roundIntervalRef.current   = null; }
    if (shuffleIntervalRef.current) { clearInterval(shuffleIntervalRef.current); shuffleIntervalRef.current = null; }
  }

  function startRound(w: string, diff: Diff) {
    stopAllTimers();
    phaseRef.current = "playing";
    setPhase("playing");
    setWord(w);
    setTiles(buildTiles(w));
    setAnswer([]);
    setRoundTimer(ROUND_TIME);
    setButlasProgress(0);
    setShowHint(false);

    const butlasTotal = getButlasMs(diff);
    let butlasElapsed = 0;
    const TICK = 100;

    // Butlas starts thinking after 1.5 s
    setTimeout(() => {
      if (phaseRef.current !== "playing") return;
      butlasIntervalRef.current = setInterval(() => {
        butlasElapsed += TICK;
        const pct = Math.min(100, (butlasElapsed / butlasTotal) * 100);
        setButlasProgress(pct);
        if (butlasElapsed >= butlasTotal) {
          clearInterval(butlasIntervalRef.current!);
          butlasIntervalRef.current = null;
          if (phaseRef.current === "playing") endRound("butler");
        }
      }, TICK);
    }, 1500);

    // Round countdown
    let timeLeft = ROUND_TIME;
    roundIntervalRef.current = setInterval(() => {
      timeLeft--;
      setRoundTimer(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(roundIntervalRef.current!);
        roundIntervalRef.current = null;
        if (phaseRef.current === "playing") endRound("butler");
      }
    }, 1000);
  }

  function endRound(winner: "player" | "butler") {
    if (phaseRef.current !== "playing") return;
    stopAllTimers();
    phaseRef.current = "round_result";
    setPhase("round_result");
    setRoundWinner(winner);

    if (winner === "player") { playerWinsRef.current++; setPlayerWins(playerWinsRef.current); }
    else                     { butlerWinsRef.current++; setButlerWins(butlerWinsRef.current); }

    const newP = playerWinsRef.current;
    const newB = butlerWinsRef.current;
    const curRound = roundNumRef.current;

    setTimeout(() => {
      if (newP >= 2 || newB >= 2) {
        const mw: "player" | "butler" = newP >= 2 ? "player" : "butler";
        setMatchWinner(mw);
        phaseRef.current = "match_result";
        setPhase("match_result");
        if (mw === "player") {
          setShowCoinRain(true);
          addCoinsRef.current(MATCH_WIN_COINS, "Word Duel — match victory 🏆", "bonus");
        }
      } else {
        const next = curRound + 1;
        roundNumRef.current = next;
        setRoundNum(next);
        startShuffleCountdown(next);
      }
    }, 2200);
  }

  function startShuffleCountdown(nextRound: number) {
    phaseRef.current = "shuffle_countdown";
    setPhase("shuffle_countdown");
    setShuffleCount(3);
    let count = 3;
    shuffleIntervalRef.current = setInterval(() => {
      count--;
      setShuffleCount(count);
      if (count <= 0) {
        clearInterval(shuffleIntervalRef.current!);
        shuffleIntervalRef.current = null;
        const diff = getDiff(nextRound);
        const w = pickWord(diff, "");
        startRound(w, diff);
      }
    }, 1000);
  }

  function playAgain() {
    stopAllTimers();
    playerWinsRef.current = 0;
    butlerWinsRef.current = 0;
    roundNumRef.current   = 1;
    setRoundNum(1);
    setPlayerWins(0);
    setButlerWins(0);
    setMatchWinner(null);
    setRoundWinner(null);
    setShowCoinRain(false);
    const w = pickWord("easy", "");
    startRound(w, "easy");
  }

  // ── Init on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    const w = pickWord("easy", "");
    startRound(w, "easy");
    return () => stopAllTimers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-check answer when all slots filled ───────────────────────────────
  useEffect(() => {
    if (phaseRef.current !== "playing") return;
    if (answer.length > 0 && answer.length === word.length) {
      const spelled = answer.map(s => s.letter).join("");
      if (spelled === word) endRound("player");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer]);

  // ── Coin counter animation ────────────────────────────────────────────────
  useEffect(() => {
    if (!showCoinRain) return;
    const target = balance;
    const iv = setInterval(() => {
      setDisplayCoins(c => { if (c >= target) { clearInterval(iv); return target; } return c + 1; });
    }, 60);
    return () => clearInterval(iv);
  }, [showCoinRain, balance]);

  // ── Tile interaction ──────────────────────────────────────────────────────
  function tapTile(tile: Tile) {
    if (tile.used || phaseRef.current !== "playing") return;
    setTiles(ts => ts.map(t => t.id === tile.id ? { ...t, used: true } : t));
    setAnswer(a => [...a, { letter: tile.letter, tileId: tile.id }]);
  }

  function tapAnswerSlot(idx: number) {
    if (phaseRef.current !== "playing") return;
    const slot = answer[idx];
    setTiles(ts => ts.map(t => t.id === slot.tileId ? { ...t, used: false } : t));
    setAnswer(a => a.filter((_, i) => i !== idx));
  }

  function clearAnswer() {
    setTiles(ts => ts.map(t => ({ ...t, used: false })));
    setAnswer([]);
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const diff        = getDiff(roundNum);
  const timerColor  = roundTimer <= 5 ? "#ef4444" : roundTimer <= 10 ? "#fb923c" : "#d4af37";
  const slotSize    = Math.min(52, Math.floor(300 / Math.max(word.length, 1)) - 6);
  const diffColor   = diff === "easy" ? "#22c55e" : diff === "medium" ? "#fb923c" : "#ef4444";
  const diffLabel   = diff === "easy" ? "Easy" : diff === "medium" ? "Medium" : "Hard";

  const butlasQuips = ["Hmm…", "Let me think…", "Almost there…", "I sense a pattern…"];
  const butlasQuip  = butlasQuips[roundNum % butlasQuips.length];

  return (
    <div style={{ minHeight: "100dvh", background: "#04030a", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", minHeight: "100dvh" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "max(env(safe-area-inset-top,16px),16px) 18px 0" }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </motion.button>

          {/* Round tracker */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {[1, 2, 3].map(r => (
              <div key={r} style={{
                width: r === roundNum ? 22 : 8, height: 8, borderRadius: 4, transition: "all 0.3s",
                background: r < roundNum ? "#d4af37" : r === roundNum ? "#facc15" : "rgba(255,255,255,0.15)",
              }} />
            ))}
          </div>

          {/* Coin badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 10, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
            <motion.span key={displayCoins} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
              style={{ fontSize: 13, fontWeight: 900, color: "#facc15" }}>
              {displayCoins}
            </motion.span>
            <span>🪙</span>
          </div>
        </div>

        {/* ── Scoreboard ── */}
        <div style={{ display: "flex", gap: 10, padding: "16px 18px 0" }}>
          <div style={{ flex: 1, borderRadius: 14, padding: "12px 14px", background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)", textAlign: "center" }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>You</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
              {[0, 1].map(i => (
                <div key={i} style={{ width: 13, height: 13, borderRadius: "50%", transition: "background 0.3s", background: i < playerWins ? "#facc15" : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, minWidth: 48 }}>
            <motion.span
              animate={{ opacity: roundTimer <= 5 ? [1, 0.3, 1] : 1 }}
              transition={{ duration: 0.5, repeat: roundTimer <= 5 ? Infinity : 0 }}
              style={{ fontSize: 28, fontWeight: 900, color: timerColor, lineHeight: 1 }}>
              {roundTimer}
            </motion.span>
            <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>secs</span>
          </div>

          <div style={{ flex: 1, borderRadius: 14, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Mr. Butlas</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
              {[0, 1].map(i => (
                <div key={i} style={{ width: 13, height: 13, borderRadius: "50%", transition: "background 0.3s", background: i < butlerWins ? "#ef4444" : "rgba(255,255,255,0.1)" }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Round + difficulty badge ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 18px 0" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: diffColor, letterSpacing: "0.1em", textTransform: "uppercase" }}>{diffLabel}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>Round {roundNum} of 3</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{word.length} letters</span>
        </div>

        {/* ── Answer slots ── */}
        <div style={{ padding: "22px 18px 0" }}>
          <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" }}>
            Unscramble the word
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 5, flexWrap: "wrap" }}>
            {Array.from({ length: word.length }).map((_, idx) => {
              const filled = answer[idx];
              return (
                <motion.div key={idx}
                  whileTap={filled ? { scale: 0.88 } : {}}
                  onClick={() => filled && tapAnswerSlot(idx)}
                  style={{
                    width: slotSize, height: slotSize + 6, borderRadius: 10,
                    border: filled
                      ? "1.5px solid rgba(212,175,55,0.6)"
                      : "1.5px dashed rgba(255,255,255,0.15)",
                    background: filled ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: filled ? "pointer" : "default",
                    transition: "all 0.15s",
                    position: "relative",
                  }}>
                  {filled && (
                    <motion.span
                      initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      style={{ fontSize: Math.min(22, slotSize - 10), fontWeight: 900, color: "#fff" }}>
                      {filled.letter}
                    </motion.span>
                  )}
                  {/* Hint — show correct letter if enabled */}
                  {showHint && !filled && (
                    <span style={{ fontSize: 10, color: "rgba(212,175,55,0.3)", fontWeight: 700 }}>
                      {word[idx]}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Clear + hint row */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10 }}>
            {answer.length > 0 && (
              <motion.button whileTap={{ scale: 0.92 }} onClick={clearAnswer}
                style={{ padding: "5px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Clear
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowHint(h => !h)}
              style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${showHint ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)"}`, background: showHint ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)", color: showHint ? "#d4af37" : "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {showHint ? "Hide hint" : "Show hint"}
            </motion.button>
          </div>
        </div>

        {/* ── Scrambled letter tiles ── */}
        <div style={{ padding: "22px 18px 0", flex: 1 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {tiles.map(tile => (
              <motion.button key={tile.id}
                whileTap={tile.used ? {} : { scale: 0.85 }}
                onClick={() => tapTile(tile)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: tile.id * 0.05 }}
                style={{
                  width: 54, height: 58, borderRadius: 13,
                  border: tile.used ? "1.5px solid rgba(255,255,255,0.06)" : "1.5px solid rgba(212,175,55,0.45)",
                  background: tile.used ? "rgba(255,255,255,0.02)" : "rgba(212,175,55,0.09)",
                  color: tile.used ? "rgba(255,255,255,0.12)" : "#fff",
                  fontSize: 24, fontWeight: 900, cursor: tile.used ? "default" : "pointer",
                  boxShadow: tile.used ? "none" : "0 2px 14px rgba(212,175,55,0.15)",
                  transition: "all 0.15s",
                }}>
                {tile.letter}
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Mr. Butlas thinking bar ── */}
        <div style={{ padding: "24px 18px max(32px,env(safe-area-inset-bottom,32px))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <img src={BUTLER_IMG} alt="Mr. Butlas"
              style={{ width: 30, height: 30, borderRadius: 9, objectFit: "cover", objectPosition: "top", border: "1px solid rgba(255,255,255,0.1)" }} />
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
              {butlasQuip}
            </p>
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: butlasProgress > 80 ? "#ef4444" : "rgba(255,255,255,0.2)" }}>
              {Math.round(butlasProgress)}%
            </span>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${butlasProgress}%` }}
              transition={{ duration: 0.1 }}
              style={{
                height: "100%", borderRadius: 4,
                background: butlasProgress > 80 ? "#ef4444" : butlasProgress > 50 ? "#fb923c" : "#d4af37",
              }} />
          </div>
        </div>
      </div>

      {/* ── Round result overlay ── */}
      <AnimatePresence>
        {phase === "round_result" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(18px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ textAlign: "center" }}>
              <p style={{ fontSize: 64, margin: "0 0 14px" }}>{roundWinner === "player" ? "🎉" : "😤"}</p>
              <p style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900, color: roundWinner === "player" ? "#facc15" : "#ef4444" }}>
                {roundWinner === "player" ? "You got it!" : "Mr. Butlas wins it"}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                The word was <strong style={{ color: "#fff", fontSize: 16 }}>{word}</strong>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shuffle countdown ── */}
      <AnimatePresence>
        {phase === "shuffle_countdown" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Next Round — {getDiff(roundNum) === "easy" ? "Medium" : "Hard"} word incoming
            </p>
            <AnimatePresence mode="wait">
              <motion.p key={shuffleCount}
                initial={{ scale: 1.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.35 }}
                style={{ margin: 0, fontSize: 90, fontWeight: 900, color: "#facc15", lineHeight: 1 }}>
                {shuffleCount}
              </motion.p>
            </AnimatePresence>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.28)" }}>Get ready…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Match result sheet ── */}
      <AnimatePresence>
        {phase === "match_result" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.82)", backdropFilter: "blur(18px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ width: "100%", maxWidth: 480, background: "rgba(5,3,10,0.99)", borderRadius: "26px 26px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", overflow: "hidden" }}>
              <div style={{ height: 3, background: "linear-gradient(90deg,transparent,#d4af37,transparent)" }} />
              <div style={{ padding: "26px 22px max(44px,env(safe-area-inset-bottom,44px))" }}>

                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 52 }}>{matchWinner === "player" ? "🏆" : "🎩"}</p>
                  <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: matchWinner === "player" ? "#facc15" : "rgba(255,255,255,0.7)" }}>
                    {matchWinner === "player" ? "You won the match!" : "Mr. Butlas wins"}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                    {playerWins} – {butlerWins} · Best of 3
                  </p>
                </div>

                {matchWinner === "player" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 16, background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.22)", marginBottom: 18 }}>
                    <span style={{ fontSize: 26 }}>🪙</span>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 900, color: "#facc15" }}>+{MATCH_WIN_COINS} coins earned</p>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Added to your balance</p>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate(-1)}
                    style={{ flex: 1, height: 52, borderRadius: 15, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    Leave
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={playAgain}
                    style={{ flex: 2, height: 52, borderRadius: 15, border: "none", background: "linear-gradient(135deg,#92400e,#d4af37,#f0d060)", color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 22px rgba(212,175,55,0.3)" }}>
                    Play Again
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showCoinRain && <CoinRain />}
    </div>
  );
}
