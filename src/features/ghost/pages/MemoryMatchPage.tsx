// ── Memory Match · Best of 3 ───────────────────────────────────────────────────
// Human vs Mr. Butlas. First to win 2 rounds wins the match.
// Rounds 2 & 3 get a shuffle countdown before cards are dealt.
// Mr. Butlas plays with human-like memory — he only knows what he's seen.

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { useCoins } from "../hooks/useCoins";

const BUTLER_IMG  = "https://ik.imagekit.io/7grri5v7d/werwerwer-removebg-preview.png";
const CARD_BACK   = "https://ik.imagekit.io/7grri5v7d/asddsasddSDFASDFASDFSASDFdsfsdf-removebg-preview.png";
const CARD_EMOJIS = ["🌹", "💎", "🌙", "🔥", "🎭", "👑", "🦋", "🌺"];
const TURN_TIME   = 30;
const MATCH_WIN_COINS = 50; // coins awarded for winning the match

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function makeDeck(): string[] { return shuffle([...CARD_EMOJIS, ...CARD_EMOJIS]); }

// ── Floating coin rain ────────────────────────────────────────────────────────
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

// ── Demo card (flip animation in How-It-Works) ────────────────────────────────
function DemoCard({ emoji, flipped, delay }: { emoji: string; flipped: boolean; delay: number }) {
  return (
    <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.45, delay }}
      style={{ width: 48, height: 64, borderRadius: 10, position: "relative", transformStyle: "preserve-3d", perspective: 400 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 10, overflow: "hidden", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "#0a0608" }}>
        <img src={CARD_BACK} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      </div>
      <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "rgba(6,4,4,0.95)", border: "1px solid rgba(212,175,55,0.4)", display: "flex", alignItems: "center", justifyContent: "center", backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
      </div>
    </motion.div>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorks({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 4), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,4,4,0.99)", borderRadius: "22px 22px 0 0", paddingBottom: "max(32px,env(safe-area-inset-bottom,32px))", overflow: "hidden" }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,transparent,#d4af37,transparent)" }} />
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>
        <div style={{ padding: "10px 24px 0" }}>
          <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#fff", textAlign: "center" }}>Memory Match</p>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Best of 3 · Win coins</p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 24 }}>
            <DemoCard emoji="🌹" flipped={step >= 1} delay={0} />
            <DemoCard emoji="💎" flipped={step >= 1} delay={0.1} />
            <DemoCard emoji="🌹" flipped={step >= 2} delay={0.05} />
            <DemoCard emoji="💎" flipped={step >= 3} delay={0} />
          </div>
          {[
            { icon: "👆", title: "Tap any card to flip it",      desc: "All 16 cards start face-down" },
            { icon: "🔄", title: "Tap a second card",            desc: "Try to find its matching pair from memory" },
            { icon: "✅", title: "Match = keep them + go again", desc: "No match = cards flip back, butler's turn" },
            { icon: "🏆", title: "Best of 3 rounds",             desc: "Win 2 rounds to win the match and earn coins" },
          ].map(s => (
            <div key={s.icon} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff" }}>{s.title}</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{s.desc}</p>
              </div>
            </div>
          ))}
          <motion.button whileTap={{ scale: 0.97 }} onClick={onClose} style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#92660a,#d4af37)", color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer", marginTop: 10 }}>
            Got it — let's play
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ emoji, isFlipped, isMatched, onClick, disabled }: {
  emoji: string; isFlipped: boolean; isMatched: boolean; onClick: () => void; disabled: boolean;
}) {
  return (
    <motion.div whileTap={disabled || isFlipped ? {} : { scale: 0.9 }}
      onClick={() => !disabled && !isFlipped && onClick()}
      style={{ width: "100%", height: "100%", cursor: disabled || isFlipped ? "default" : "pointer", perspective: 600 }}>
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: isFlipped || isMatched ? 180 : 0 }}
        transition={{ duration: 0.32, type: "spring", stiffness: 280, damping: 24 }}
        style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}>
        {/* Back */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 11, overflow: "hidden", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.5)", background: "#0a0608" }}>
          <img src={CARD_BACK} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        </div>
        {/* Front */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 11, background: isMatched ? "linear-gradient(135deg,rgba(212,175,55,0.16),rgba(180,140,30,0.1))" : "rgba(8,4,4,0.97)", border: isMatched ? "1.5px solid rgba(212,175,55,0.5)" : "1px solid rgba(255,255,255,0.1)", boxShadow: isMatched ? "0 0 14px rgba(212,175,55,0.22)" : "none", display: "flex", alignItems: "center", justifyContent: "center", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <span style={{ fontSize: 24 }}>{emoji}</span>
          {isMatched && <span style={{ position: "absolute", bottom: 5, right: 6, fontSize: 9, color: "#d4af37" }}>✓</span>}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main game ─────────────────────────────────────────────────────────────────
export default function MemoryMatchPage() {
  const navigate = useNavigate();
  const a        = useGenderAccent();
  const { balance, addCoins } = useCoins();

  // ── Round state ──
  const [roundNum,          setRoundNum]          = useState(1);
  const [playerRoundWins,   setPlayerRoundWins]   = useState(0);
  const [butlerRoundWins,   setButlerRoundWins]   = useState(0);
  const [shuffleCountdown,  setShuffleCountdown]  = useState<number | null>(null);

  // ── Per-round game state ──
  const [deck,         setDeck]         = useState<string[]>(makeDeck);
  const [flipped,      setFlipped]      = useState<number[]>([]);
  const [matched,      setMatched]      = useState<Set<number>>(new Set());
  const [turn,         setTurn]         = useState<"player" | "butler">("player");
  const [playerScore,  setPlayerScore]  = useState(0);
  const [butlerScore,  setButlerScore]  = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(TURN_TIME);
  const [busy,         setBusy]         = useState(false);
  const [forfeit,      setForfeit]      = useState(false);

  // ── Match result state ──
  const [showRoundResult,   setShowRoundResult]   = useState(false);
  const [showMatchResult,   setShowMatchResult]   = useState(false);
  const [roundResultWinner, setRoundResultWinner] = useState<"player" | "butler" | "draw">("draw");
  const [showCoinRain,      setShowCoinRain]      = useState(false);
  const [displayCoins,      setDisplayCoins]      = useState(balance);

  // ── UI state ──
  const [showHow,      setShowHow]      = useState(false);
  const [chatOpen,     setChatOpen]     = useState(false);
  const [chatUnlocked, setChatUnlocked] = useState(false);
  const [messages,     setMessages]     = useState<{ from: "you"|"butler"; text: string }[]>([
    { from: "butler", text: "Good evening. The cards are shuffled. You go first — impress me." },
  ]);
  const [msgInput, setMsgInput] = useState("");

  // Refs for butler AI — avoid stale closures
  const butlerMem   = useRef<Map<number, string>>(new Map());
  const matchedRef  = useRef<Set<number>>(new Set());
  const deckRef     = useRef<string[]>(deck);
  const butlerBusy  = useRef(false);

  useEffect(() => { deckRef.current = deck; }, [deck]);
  useEffect(() => { matchedRef.current = matched; }, [matched]);

  const isRoundOver = matched.size === 16 || forfeit;

  const matchWinner: "player" | "butler" | "pending" =
    playerRoundWins >= 2 ? "player" :
    butlerRoundWins >= 2 ? "butler" : "pending";

  const addMsg = useCallback((from: "you"|"butler", text: string) => {
    setMessages(m => [...m, { from, text }]);
  }, []);

  // ── Coin increment animation after win ────────────────────────────────────
  useEffect(() => {
    if (!showCoinRain) return;
    const target = balance; // balance is already updated by addCoins
    let current = displayCoins;
    if (current >= target) return;
    const interval = setInterval(() => {
      current += 1;
      setDisplayCoins(current);
      if (current >= target) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCoinRain]);

  // ── Player turn timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isRoundOver || busy || turn !== "player" || shuffleCountdown !== null) {
      setTimeLeft(TURN_TIME);
      return;
    }
    if (timeLeft <= 0) {
      setForfeit(true);
      addMsg("butler", "Time expired. The butler claims the round.");
      return;
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [turn, isRoundOver, busy, timeLeft, shuffleCountdown, addMsg]);

  // ── Round end detection ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isRoundOver || showRoundResult || showMatchResult) return;

    const roundWinner: "player" | "butler" | "draw" =
      playerScore > butlerScore ? "player" :
      butlerScore > playerScore ? "butler" : "draw";

    setRoundResultWinner(roundWinner);

    const newPlayerWins = playerRoundWins + (roundWinner === "player" ? 1 : 0);
    const newButlerWins = butlerRoundWins + (roundWinner === "butler" ? 1 : 0);

    setPlayerRoundWins(newPlayerWins);
    setButlerRoundWins(newButlerWins);

    // Check match decided
    if (newPlayerWins >= 2 || newButlerWins >= 2 || roundNum >= 3) {
      // Show round result briefly then match result
      setShowRoundResult(true);
      setTimeout(() => {
        setShowRoundResult(false);
        if (newPlayerWins >= 2) {
          // Player wins match — award coins
          addCoins(MATCH_WIN_COINS, "Memory Match — match victory 🏆", "bonus");
          setShowCoinRain(true);
          setTimeout(() => setShowCoinRain(false), 3500);
        }
        if (!chatUnlocked) setChatUnlocked(true);
        setShowMatchResult(true);
      }, 2000);
    } else {
      // More rounds needed — show round result, then countdown, then next round
      setShowRoundResult(true);
      setTimeout(() => {
        setShowRoundResult(false);
        startShuffleCountdown(roundNum + 1, newPlayerWins, newButlerWins);
      }, 2000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRoundOver]);

  // ── Shuffle countdown ─────────────────────────────────────────────────────
  function startShuffleCountdown(nextRound: number, pwins: number, bwins: number) {
    setShuffleCountdown(3);
    let count = 3;
    const tick = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(tick);
        setShuffleCountdown(null);
        startNextRound(nextRound, pwins, bwins);
      } else {
        setShuffleCountdown(count);
      }
    }, 1000);
  }

  function startNextRound(nextRound: number, pwins: number, bwins: number) {
    const newDeck = makeDeck();
    setDeck(newDeck);
    deckRef.current = newDeck;
    setFlipped([]); setMatched(new Set()); matchedRef.current = new Set();
    setTurn("player"); setPlayerScore(0); setButlerScore(0);
    setTimeLeft(TURN_TIME); setBusy(false); setForfeit(false);
    setShowRoundResult(false); butlerMem.current = new Map(); butlerBusy.current = false;
    setRoundNum(nextRound);
    setPlayerRoundWins(pwins);
    setButlerRoundWins(bwins);
    addMsg("butler", nextRound === 2
      ? "Round 2. The cards are dealt fresh. Pay attention this time."
      : "Round 3. This decides it. May the better memory win.");
  }

  // ── Butler AI — human-like: only memorizes after SEEING a card ────────────
  const runButlerTurn = useCallback(() => {
    if (butlerBusy.current) return;
    butlerBusy.current = true;

    const mem           = butlerMem.current;
    const currentDeck   = deckRef.current;
    const currentMatched = matchedRef.current;
    const unmatched     = Array.from({ length: 16 }, (_, i) => i).filter(i => !currentMatched.has(i));

    if (unmatched.length < 2) { butlerBusy.current = false; return; }

    // Natural think time: 500–1100ms before picking first card
    const thinkTime = 500 + Math.random() * 600;

    // Step 1: look in memory for a known matching pair
    let knownPick1 = -1, knownPick2 = -1;
    outer: for (const [i, v] of mem.entries()) {
      if (currentMatched.has(i)) continue;
      for (const [j, w] of mem.entries()) {
        if (j !== i && w === v && !currentMatched.has(j)) {
          knownPick1 = i; knownPick2 = j; break outer;
        }
      }
    }

    setTimeout(() => {
      if (knownPick1 !== -1) {
        // ── Confident play: butler remembered a pair ──
        setFlipped([knownPick1]);
        setTimeout(() => {
          setFlipped([knownPick1, knownPick2]);
          setTimeout(() => {
            const isMatch = currentDeck[knownPick1] === currentDeck[knownPick2];
            setFlipped([]);
            if (isMatch) {
              setMatched(m => { const nm = new Set(m); nm.add(knownPick1); nm.add(knownPick2); return nm; });
              setButlerScore(s => {
                const quips = ["The butler never forgets.", "I do enjoy this game.", "An impeccable memory.", "Did you think I'd miss that?"];
                addMsg("butler", quips[(s + 1) % quips.length]);
                return s + 1;
              });
              butlerBusy.current = false;
              setTimeout(() => runButlerTurn(), 650);
            } else {
              // Shouldn't happen, but handle gracefully
              butlerBusy.current = false;
              setTurn("player");
              setTimeLeft(TURN_TIME);
            }
          }, 1100);
        }, 650);

      } else {
        // ── Exploratory play: pick an unknown card, see it, then decide ──
        const unknown = unmatched.filter(i => !mem.has(i));
        const p1pool  = unknown.length > 0 ? unknown : unmatched;
        const pick1   = p1pool[Math.floor(Math.random() * p1pool.length)];

        // Flip pick1
        setFlipped([pick1]);

        // After 700ms butler "sees" pick1 and memorizes it
        setTimeout(() => {
          const val1 = currentDeck[pick1];
          // 78% retention — sometimes forgets
          if (Math.random() < 0.78) mem.set(pick1, val1);

          // Check if memory now has a match for val1
          let pick2 = -1;
          for (const [j, w] of mem.entries()) {
            if (j !== pick1 && w === val1 && !currentMatched.has(j)) { pick2 = j; break; }
          }

          // If no known match, pick a random unseen card
          if (pick2 === -1) {
            const p2pool = unmatched.filter(i => i !== pick1 && !mem.has(i));
            const pool   = p2pool.length > 0 ? p2pool : unmatched.filter(i => i !== pick1);
            pick2        = pool[Math.floor(Math.random() * pool.length)] ?? -1;
          }

          if (pick2 === -1) {
            butlerBusy.current = false;
            setFlipped([]);
            setTurn("player");
            setTimeLeft(TURN_TIME);
            return;
          }

          // Brief pause — butler is "deciding" (150–400ms)
          setTimeout(() => {
            setFlipped([pick1, pick2]);

            setTimeout(() => {
              // Butler sees pick2 and memorizes it
              if (Math.random() < 0.78) mem.set(pick2, currentDeck[pick2]);

              const isMatch = currentDeck[pick1] === currentDeck[pick2];
              setFlipped([]);

              if (isMatch) {
                setMatched(m => { const nm = new Set(m); nm.add(pick1); nm.add(pick2); return nm; });
                setButlerScore(s => {
                  const quips = ["Fortune favours the patient.", "A lucky match? Perhaps.", "Now I remember.", "The cards reveal themselves."];
                  addMsg("butler", quips[(s + 1) % quips.length]);
                  return s + 1;
                });
                butlerBusy.current = false;
                setTimeout(() => runButlerTurn(), 650);
              } else {
                // Missed — pass to player
                butlerBusy.current = false;
                setTurn("player");
                setTimeLeft(TURN_TIME);
                if (Math.random() < 0.4) {
                  const misses = ["Hmm. Not quite.", "The cards have other ideas.", "I'll remember that."];
                  addMsg("butler", misses[Math.floor(Math.random() * misses.length)]);
                }
              }
            }, 1000);
          }, 150 + Math.random() * 250);

        }, 700);
      }
    }, thinkTime);
  }, [addMsg]);

  // ── Player card tap ───────────────────────────────────────────────────────
  const handleCardTap = (idx: number) => {
    if (busy || turn !== "player" || isRoundOver || shuffleCountdown !== null) return;
    if (flipped.includes(idx) || matched.has(idx)) return;

    // Butler watches this flip with 72% retention
    if (Math.random() < 0.72) butlerMem.current.set(idx, deck[idx]);

    const next = [...flipped, idx];
    setFlipped(next);

    if (next.length === 2) {
      setBusy(true);
      setTimeLeft(TURN_TIME);
      const [cardA, cardB] = next;
      if (deck[cardA] === deck[cardB]) {
        setTimeout(() => {
          setMatched(m => { const nm = new Set(m); nm.add(cardA); nm.add(cardB); return nm; });
          setPlayerScore(s => {
            const quips = ["Well played.", "Not bad.", "You remembered.", "A match. Interesting.", "You're paying attention."];
            addMsg("butler", quips[s % quips.length]);
            return s + 1;
          });
          setFlipped([]);
          setBusy(false);
        }, 550);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
          setTurn("butler");
          setTimeout(() => runButlerTurn(), 500);
        }, 880);
      }
    }
  };

  // ── Full reset (start a new match) ────────────────────────────────────────
  const resetMatch = () => {
    const newDeck = makeDeck();
    setDeck(newDeck); deckRef.current = newDeck;
    setFlipped([]); setMatched(new Set()); matchedRef.current = new Set();
    setTurn("player"); setPlayerScore(0); setButlerScore(0);
    setTimeLeft(TURN_TIME); setBusy(false); setForfeit(false);
    setShowRoundResult(false); setShowMatchResult(false); setShowCoinRain(false);
    setShuffleCountdown(null);
    setRoundNum(1); setPlayerRoundWins(0); setButlerRoundWins(0);
    butlerMem.current = new Map(); butlerBusy.current = false;
    setDisplayCoins(balance);
    setMessages([{ from: "butler", text: "Rematch. Cards reshuffled. Your move." }]);
  };

  const timerColor = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#fb923c" : "rgba(255,255,255,0.45)";

  return (
    <div style={{ height: "100dvh", background: "#050305", color: "#fff", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, padding: "max(env(safe-area-inset-top,16px),16px) 16px 10px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>Memory Match</p>
          <p style={{ margin: 0, fontSize: 9, color: "rgba(212,175,55,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Best of 3 · The Butler</p>
        </div>
        {/* Live coin balance */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 10, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
          <span style={{ fontSize: 13 }}>🪙</span>
          <motion.span
            key={displayCoins}
            initial={{ scale: 1.3, color: "#facc15" }}
            animate={{ scale: 1, color: "#d4af37" }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: 13, fontWeight: 900 }}>
            {displayCoins}
          </motion.span>
        </div>
        <button onClick={() => setShowHow(true)} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>How to play</button>
      </div>

      {/* ── Round tracker ── */}
      <div style={{ flexShrink: 0, padding: "8px 16px 4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        {[1, 2, 3].map(r => (
          <div key={r} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", fontSize: 11, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: r < roundNum
                ? (r <= playerRoundWins + butlerRoundWins && playerRoundWins > butlerRoundWins - (r === roundNum - 1 ? 0 : 0) ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.08)")
                : r === roundNum ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
              border: r === roundNum ? "1.5px solid rgba(212,175,55,0.5)" : "1px solid rgba(255,255,255,0.08)",
              color: r === roundNum ? "#d4af37" : r < roundNum ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
              transition: "all 0.3s",
            }}>
              {r < roundNum
                ? (r === 1
                  ? (playerRoundWins >= 1 && butlerRoundWins === 0 ? "✓" : butlerRoundWins >= 1 && playerRoundWins === 0 ? "✗" : "—")
                  : "·"
                )
                : r}
            </div>
            <span style={{ fontSize: 7, fontWeight: 700, color: r === roundNum ? "rgba(212,175,55,0.6)" : "rgba(255,255,255,0.18)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              R{r}
            </span>
          </div>
        ))}
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
        {/* Wins tally */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: a.accent }}>{playerRoundWins}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>–</span>
          <span style={{ fontSize: 11, fontWeight: 900, color: "#d4af37" }}>{butlerRoundWins}</span>
        </div>
      </div>

      {/* ── Scoreboard ── */}
      <div style={{ display: "flex", alignItems: "center", padding: "6px 14px", gap: 10, flexShrink: 0 }}>
        {/* Player */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 12, background: turn === "player" && !isRoundOver ? a.glow(0.12) : "rgba(255,255,255,0.04)", border: `1px solid ${turn === "player" && !isRoundOver ? a.glow(0.35) : "rgba(255,255,255,0.08)"}`, transition: "all 0.3s" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: a.glow(0.18), border: `2px solid ${a.glow(0.45)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>👤</div>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#fff" }}>You</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: a.accent }}>{playerScore}</p>
          </div>
          {turn === "player" && !isRoundOver && <motion.div animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 0.9, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: "50%", background: a.accent, marginLeft: "auto", flexShrink: 0 }} />}
        </div>

        {/* Timer / VS */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 44 }}>
          {!isRoundOver && turn === "player" && shuffleCountdown === null ? (
            <motion.p animate={{ opacity: timeLeft <= 5 ? [1,0.3,1] : 1 }} transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
              style={{ margin: 0, fontSize: 24, fontWeight: 900, color: timerColor, lineHeight: 1, textShadow: timeLeft <= 5 ? `0 0 12px ${timerColor}` : "none" }}>
              {timeLeft}
            </motion.p>
          ) : (
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.2)" }}>VS</p>
          )}
          {!isRoundOver && turn === "player" && shuffleCountdown === null && <p style={{ margin: 0, fontSize: 7, color: "rgba(255,255,255,0.2)", fontWeight: 700, textTransform: "uppercase" }}>secs</p>}
        </div>

        {/* Butler */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 12, background: turn === "butler" && !isRoundOver ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${turn === "butler" && !isRoundOver ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`, transition: "all 0.3s", flexDirection: "row-reverse" }}>
          <img src={BUTLER_IMG} alt="" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#fff" }}>Butler</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#d4af37" }}>{butlerScore}</p>
          </div>
          {turn === "butler" && !isRoundOver && <motion.div animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 0.9, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: "50%", background: "#d4af37", marginRight: "auto", flexShrink: 0 }} />}
        </div>
      </div>

      {/* ── Turn label / Shuffle countdown ── */}
      <div style={{ flexShrink: 0, minHeight: 28, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
        <AnimatePresence mode="wait">
          {shuffleCountdown !== null ? (
            <motion.div key={`cd-${shuffleCountdown}`}
              initial={{ opacity: 0, scale: 1.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.35 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: "#facc15", lineHeight: 1,
                textShadow: "0 0 20px rgba(250,204,21,0.7)" }}>
                {shuffleCountdown}
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(212,175,55,0.6)",
                textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 2 }}>
                Reshuffling…
              </span>
            </motion.div>
          ) : (
            <motion.p key={turn + String(isRoundOver)}
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ margin: 0, fontSize: 10, fontWeight: 700,
                color: isRoundOver ? "rgba(255,255,255,0.3)" : turn === "player" ? a.glow(0.8) : "rgba(212,175,55,0.7)",
                textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {isRoundOver ? "Round over" : turn === "player" ? "Your turn — flip two cards" : "The butler is thinking…"}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Card grid ── */}
      <div style={{ flex: 1, minHeight: 0, padding: "0 14px 8px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(4, 1fr)", gap: 10,
        opacity: shuffleCountdown !== null ? 0.3 : 1, transition: "opacity 0.3s" }}>
        {deck.map((emoji, idx) => (
          <Card key={idx} emoji={emoji}
            isFlipped={flipped.includes(idx)} isMatched={matched.has(idx)}
            onClick={() => handleCardTap(idx)}
            disabled={busy || turn !== "player" || isRoundOver || matched.has(idx) || shuffleCountdown !== null} />
        ))}
      </div>

      {/* ── Butler chat strip ── */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(4,2,2,0.98)" }}>
        <div style={{ padding: "8px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <img src={BUTLER_IMG} alt="" style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)", fontStyle: "italic", lineHeight: 1.5, flex: 1 }}>
            {messages.filter(m => m.from === "butler").at(-1)?.text}
          </p>
          <button onClick={() => {
            if (!chatUnlocked) { setChatUnlocked(true); }
            setChatOpen(v => !v);
          }} style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
            {chatOpen ? "Close" : "Chat"}
          </button>
        </div>
        <AnimatePresence>
          {chatOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 176 }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
              <div style={{ height: 136, overflowY: "auto", scrollbarWidth: "none", padding: "6px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.from === "you" ? "flex-end" : "flex-start" }}>
                    <p style={{ margin: 0, fontSize: 11, lineHeight: 1.4, padding: "5px 10px", borderRadius: 10, maxWidth: "76%", color: m.from === "you" ? "#fff" : "rgba(212,175,55,0.9)", background: m.from === "you" ? "rgba(255,255,255,0.08)" : "rgba(212,175,55,0.08)" }}>{m.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: "0 10px 8px", display: "flex", gap: 6 }}>
                <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && msgInput.trim()) {
                      addMsg("you", msgInput.trim()); setMsgInput("");
                      setTimeout(() => addMsg("butler", "The butler notes your message with discretion."), 800);
                    }
                  }}
                  placeholder="Say something…"
                  style={{ flex: 1, height: 32, borderRadius: 10, padding: "0 10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, outline: "none" }} />
                <button onClick={() => {
                  if (!msgInput.trim()) return;
                  addMsg("you", msgInput.trim()); setMsgInput("");
                  setTimeout(() => addMsg("butler", "The butler notes your message with discretion."), 800);
                }} style={{ width: 32, height: 32, borderRadius: 10, background: a.glow(0.15), border: `1px solid ${a.glow(0.3)}`, color: a.accent, cursor: "pointer", fontSize: 14 }}>→</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div style={{ paddingBottom: "max(10px,env(safe-area-inset-bottom,10px))" }} />
      </div>

      {/* ── How It Works ── */}
      <AnimatePresence>{showHow && <HowItWorks onClose={() => setShowHow(false)} />}</AnimatePresence>

      {/* ── Coin rain overlay ── */}
      <AnimatePresence>
        {showCoinRain && <CoinRain />}
      </AnimatePresence>

      {/* ── Round result flash ── */}
      <AnimatePresence>
        {showRoundResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: "fixed", inset: 0, zIndex: 400,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ textAlign: "center", padding: "0 24px" }}>
              <motion.div
                initial={{ y: 20 }} animate={{ y: 0 }}
                style={{ fontSize: 52, marginBottom: 12 }}>
                {roundResultWinner === "player" ? "🏆" : roundResultWinner === "butler" ? "🎩" : "🤝"}
              </motion.div>
              <p style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900,
                color: roundResultWinner === "player" ? "#facc15" : roundResultWinner === "butler" ? "#e01010" : "#fff" }}>
                {roundResultWinner === "player" ? `Round ${roundNum} — You Win!`
                  : roundResultWinner === "butler" ? `Round ${roundNum} — Butler Wins`
                  : `Round ${roundNum} — Draw`}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                {playerScore} – {butlerScore} pairs
              </p>
              {roundNum < 3 && matchWinner === "pending" && (
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(212,175,55,0.6)", fontWeight: 700 }}>
                  Reshuffling for Round {roundNum + 1}…
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Match result sheet ── */}
      <AnimatePresence>
        {showMatchResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(14px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{ width: "100%", maxWidth: 480, background: "rgba(6,4,4,0.99)", borderRadius: "22px 22px 0 0", paddingBottom: "max(32px,env(safe-area-inset-bottom,32px))", overflow: "hidden" }}>
              <div style={{ height: 3, background: matchWinner === "player" ? "linear-gradient(90deg,transparent,#d4af37,transparent)" : "linear-gradient(90deg,transparent,#e01010,transparent)" }} />
              <div style={{ padding: "24px 22px 0", textAlign: "center" }}>

                <motion.div initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 340, damping: 18 }}
                  style={{ fontSize: 60, marginBottom: 12 }}>
                  {matchWinner === "player" ? "🏆" : matchWinner === "butler" ? "🎩" : "🤝"}
                </motion.div>

                <p style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900,
                  color: matchWinner === "player" ? "#d4af37" : matchWinner === "butler" ? "#e01010" : "#fff" }}>
                  {matchWinner === "player" ? "You Win the Match!" : matchWinner === "butler" ? "The Butler Wins" : "A Draw"}
                </p>
                <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                  {playerRoundWins} – {butlerRoundWins} rounds
                </p>
                <p style={{ margin: "0 0 22px", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                  {matchWinner === "player"
                    ? "An impressive memory. The butler tips his hat."
                    : matchWinner === "butler"
                    ? "The butler never forgets. A good match — try again."
                    : "Honours even. The hotel calls it a gentlemanly draw."}
                </p>

                {/* Coin reward */}
                {matchWinner === "player" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    style={{ marginBottom: 16, padding: "14px 18px", borderRadius: 16,
                      background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)",
                      display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: 32 }}>🪙</span>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 900, color: "#facc15" }}>
                        +{MATCH_WIN_COINS} coins earned!
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                        Added to your coin balance · New total: {balance} 🪙
                      </p>
                    </div>
                  </motion.div>
                )}

                <motion.button whileTap={{ scale: 0.97 }} onClick={resetMatch}
                  style={{ width: "100%", height: 52, borderRadius: 14, border: "none",
                    background: "linear-gradient(135deg,#92400e,#d4af37,#f0d060)",
                    color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(212,175,55,0.3)", marginBottom: 10 }}>
                  🔄 Play Again
                </motion.button>
                <button onClick={() => navigate(-1)} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}>
                  Back to Games Room
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
