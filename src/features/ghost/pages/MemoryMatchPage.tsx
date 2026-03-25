// ── Memory Match · Hotel Game ─────────────────────────────────────────────────
// Weekly Butler challenge game. Flip cards, find pairs, win to unlock contact.

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { readCoins, spendCoins } from "../utils/featureGating";

const BUTLER_IMG  = "https://ik.imagekit.io/7grri5v7d/werwerwer-removebg-preview.png";
const CARD_EMOJIS = ["🌹", "💎", "🌙", "🔥", "🎭", "👑", "🦋", "🌺"];
const TURN_TIME   = 30;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function makeDeck(): string[] { return shuffle([...CARD_EMOJIS, ...CARD_EMOJIS]); }

// ── Demo card (flip animation) ────────────────────────────────────────────────
function DemoCard({ emoji, flipped, delay }: { emoji: string; flipped: boolean; delay: number }) {
  return (
    <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.45, delay }}
      style={{ width: 48, height: 64, borderRadius: 10, position: "relative", transformStyle: "preserve-3d", perspective: 400 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 10, background: "linear-gradient(135deg,rgba(220,20,20,0.25),rgba(100,10,10,0.4))", border: "1px solid rgba(220,20,20,0.35)", display: "flex", alignItems: "center", justifyContent: "center", backfaceVisibility: "hidden" }}>
        <span style={{ fontSize: 18, opacity: 0.6 }}>🂠</span>
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
          <p style={{ margin: "0 0 20px", fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>Flip. Match. Win her contact.</p>
          {/* Animated demo */}
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
            { icon: "🏆", title: "Most pairs wins",              desc: "Win to unlock the option to purchase her contact" },
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
      <motion.div animate={{ rotateY: isFlipped || isMatched ? 180 : 0 }}
        transition={{ duration: 0.32, type: "spring", stiffness: 280, damping: 24 }}
        style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}>
        {/* Back */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 11, background: "linear-gradient(135deg,rgba(28,8,8,0.96),rgba(55,14,14,0.92))", border: "1px solid rgba(220,20,20,0.3)", borderTop: "1px solid rgba(220,20,20,0.5)", boxShadow: "inset 0 1px 0 rgba(220,20,20,0.12)", display: "flex", alignItems: "center", justifyContent: "center", backfaceVisibility: "hidden" }}>
          <span style={{ fontSize: 20, opacity: 0.45 }}>🂠</span>
        </div>
        {/* Front */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 11, background: isMatched ? "linear-gradient(135deg,rgba(212,175,55,0.16),rgba(180,140,30,0.1))" : "rgba(8,4,4,0.97)", border: isMatched ? "1.5px solid rgba(212,175,55,0.5)" : "1px solid rgba(255,255,255,0.1)", boxShadow: isMatched ? "0 0 14px rgba(212,175,55,0.22)" : "none", display: "flex", alignItems: "center", justifyContent: "center", backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
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

  const [deck,         setDeck]         = useState<string[]>(makeDeck);
  const [flipped,      setFlipped]      = useState<number[]>([]);
  const [matched,      setMatched]      = useState<Set<number>>(new Set());
  const [turn,         setTurn]         = useState<"player" | "butler">("player");
  const [playerScore,  setPlayerScore]  = useState(0);
  const [butlerScore,  setButlerScore]  = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(TURN_TIME);
  const [busy,         setBusy]         = useState(false);
  const [forfeit,      setForfeit]      = useState(false);
  const [showResult,   setShowResult]   = useState(false);
  const [showHow,      setShowHow]      = useState(false);
  const [chatOpen,     setChatOpen]     = useState(false);
  const [chatUnlocked, setChatUnlocked] = useState(false);
  const [messages,     setMessages]     = useState<{ from: "you"|"butler"; text: string }[]>([
    { from: "butler", text: "Good evening. The cards are shuffled. You go first — impress me." },
  ]);
  const [msgInput,    setMsgInput]    = useState("");
  const [connecting,  setConnecting]  = useState(false);

  // Refs for butler AI (avoid stale closures)
  const butlerMem   = useRef<Map<number, string>>(new Map());
  const matchedRef  = useRef<Set<number>>(new Set());
  const deckRef     = useRef<string[]>(deck);
  const butlerBusy  = useRef(false);

  useEffect(() => { deckRef.current = deck; }, [deck]);
  useEffect(() => { matchedRef.current = matched; }, [matched]);

  const isOver = matched.size === 16 || forfeit;
  const winner: "player" | "butler" | "draw" =
    playerScore > butlerScore ? "player" :
    butlerScore > playerScore ? "butler" : "draw";

  const addMsg = useCallback((from: "you"|"butler", text: string) => {
    setMessages(m => [...m, { from, text }]);
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOver || busy || turn !== "player") { setTimeLeft(TURN_TIME); return; }
    if (timeLeft <= 0) {
      setForfeit(true);
      addMsg("butler", "Time expired. The butler claims victory by default.");
      setTimeout(() => setShowResult(true), 1200);
      if (!chatUnlocked) setChatUnlocked(true);
      return;
    }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [turn, isOver, busy, timeLeft, chatUnlocked, addMsg]);

  // ── Check for game end ────────────────────────────────────────────────────
  useEffect(() => {
    if (matched.size === 16 && !showResult) {
      setTimeout(() => setShowResult(true), 700);
    }
  }, [matched.size, showResult]);

  // ── Butler AI ─────────────────────────────────────────────────────────────
  const runButlerTurn = useCallback(() => {
    if (butlerBusy.current) return;
    butlerBusy.current = true;

    const mem = butlerMem.current;
    const currentDeck = deckRef.current;
    const currentMatched = matchedRef.current;
    const unmatched = Array.from({ length: 16 }, (_, i) => i).filter(i => !currentMatched.has(i));

    if (unmatched.length < 2) { butlerBusy.current = false; return; }

    // Try to find a known pair
    let pick1 = -1, pick2 = -1;
    outer: for (const [i, v] of mem.entries()) {
      if (currentMatched.has(i)) continue;
      for (const [j, w] of mem.entries()) {
        if (j !== i && w === v && !currentMatched.has(j)) { pick1 = i; pick2 = j; break outer; }
      }
    }

    if (pick1 === -1) {
      // Pick a random unknown card
      const unknown = unmatched.filter(i => !mem.has(i));
      const p1pool  = unknown.length > 0 ? unknown : unmatched;
      pick1 = p1pool[Math.floor(Math.random() * p1pool.length)];
      if (Math.random() < 0.65) mem.set(pick1, currentDeck[pick1]);

      // Check memory for a match
      const val1 = currentDeck[pick1];
      let found = -1;
      for (const [j, w] of mem.entries()) {
        if (j !== pick1 && w === val1 && !currentMatched.has(j)) { found = j; break; }
      }
      if (found !== -1) {
        pick2 = found;
      } else {
        const p2pool = unmatched.filter(i => i !== pick1 && !mem.has(i));
        const p2     = p2pool.length > 0 ? p2pool : unmatched.filter(i => i !== pick1);
        pick2 = p2[Math.floor(Math.random() * p2.length)] ?? -1;
        if (pick2 !== -1 && Math.random() < 0.65) mem.set(pick2, currentDeck[pick2]);
      }
    }

    if (pick1 === -1 || pick2 === -1) { butlerBusy.current = false; setTurn("player"); setTimeLeft(TURN_TIME); return; }

    // Animate flips
    setTimeout(() => setFlipped([pick1]), 280);
    setTimeout(() => setFlipped([pick1, pick2]), 860);
    setTimeout(() => {
      const isMatch = currentDeck[pick1] === currentDeck[pick2];
      setFlipped([]);
      if (isMatch) {
        setMatched(m => { const nm = new Set(m); nm.add(pick1); nm.add(pick2); return nm; });
        setButlerScore(s => {
          const ns = s + 1;
          const quips = ["The butler never forgets.", "I do enjoy this game.", "An impeccable memory.", "Did you think I'd miss that?", "That pair was always mine."];
          addMsg("butler", quips[ns % quips.length]);
          return ns;
        });
        butlerBusy.current = false;
        // Butler gets another turn
        setTimeout(() => runButlerTurn(), 600);
      } else {
        butlerBusy.current = false;
        setTurn("player");
        setTimeLeft(TURN_TIME);
      }
    }, 1500);
  }, [addMsg]);

  // ── Player card tap ───────────────────────────────────────────────────────
  const handleCardTap = (idx: number) => {
    if (busy || turn !== "player" || isOver) return;
    if (flipped.includes(idx) || matched.has(idx)) return;

    // Butler observes this flip
    if (Math.random() < 0.65) butlerMem.current.set(idx, deck[idx]);

    const next = [...flipped, idx];
    setFlipped(next);

    if (next.length === 2) {
      setBusy(true);
      setTimeLeft(TURN_TIME);
      const [a2, b] = next;
      if (deck[a2] === deck[b]) {
        setTimeout(() => {
          setMatched(m => { const nm = new Set(m); nm.add(a2); nm.add(b); return nm; });
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

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetGame = () => {
    const newDeck = makeDeck();
    setDeck(newDeck);
    deckRef.current = newDeck;
    setFlipped([]); setMatched(new Set()); matchedRef.current = new Set();
    setTurn("player"); setPlayerScore(0); setButlerScore(0);
    setTimeLeft(TURN_TIME); setBusy(false); setForfeit(false);
    setShowResult(false); butlerMem.current = new Map(); butlerBusy.current = false;
    setMessages([{ from: "butler", text: "Rematch. Cards reshuffled. Your move." }]);
  };

  const timerColor = timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#fb923c" : "rgba(255,255,255,0.45)";

  return (
    <div style={{ height: "100dvh", background: "#050305", color: "#fff", display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: "max(env(safe-area-inset-top,16px),16px) 16px 10px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>Memory Match</p>
          <p style={{ margin: 0, fontSize: 9, color: "rgba(212,175,55,0.7)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>This Week's Game · The Butler</p>
        </div>
        <button onClick={() => setShowHow(true)} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>How to play</button>
      </div>

      {/* Scoreboard */}
      <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, flexShrink: 0 }}>
        {/* Player */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 12, background: turn === "player" && !isOver ? a.glow(0.12) : "rgba(255,255,255,0.04)", border: `1px solid ${turn === "player" && !isOver ? a.glow(0.35) : "rgba(255,255,255,0.08)"}`, transition: "all 0.3s" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: a.glow(0.18), border: `2px solid ${a.glow(0.45)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>👤</div>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#fff" }}>You</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: a.accent }}>{playerScore}</p>
          </div>
          {turn === "player" && !isOver && <motion.div animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 0.9, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: "50%", background: a.accent, marginLeft: "auto", flexShrink: 0 }} />}
        </div>

        {/* Timer / VS */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 44 }}>
          {!isOver && turn === "player" ? (
            <motion.p animate={{ opacity: timeLeft <= 5 ? [1,0.3,1] : 1 }} transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
              style={{ margin: 0, fontSize: 24, fontWeight: 900, color: timerColor, lineHeight: 1, textShadow: timeLeft <= 5 ? `0 0 12px ${timerColor}` : "none" }}>
              {timeLeft}
            </motion.p>
          ) : (
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.2)" }}>VS</p>
          )}
          {!isOver && turn === "player" && <p style={{ margin: 0, fontSize: 7, color: "rgba(255,255,255,0.2)", fontWeight: 700, textTransform: "uppercase" }}>secs</p>}
        </div>

        {/* Butler */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 12, background: turn === "butler" && !isOver ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${turn === "butler" && !isOver ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`, transition: "all 0.3s", flexDirection: "row-reverse" }}>
          <img src={BUTLER_IMG} alt="" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#fff" }}>Butler</p>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#d4af37" }}>{butlerScore}</p>
          </div>
          {turn === "butler" && !isOver && <motion.div animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 0.9, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: "50%", background: "#d4af37", marginRight: "auto", flexShrink: 0 }} />}
        </div>
      </div>

      {/* Turn label */}
      <AnimatePresence mode="wait">
        <motion.p key={turn + String(isOver)} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: isOver ? "rgba(255,255,255,0.3)" : turn === "player" ? a.glow(0.8) : "rgba(212,175,55,0.7)", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.12em" }}>
          {isOver ? "Game over" : turn === "player" ? "Your turn — flip two cards" : "The butler is thinking…"}
        </motion.p>
      </AnimatePresence>

      {/* Card grid */}
      <div style={{ flex: 1, minHeight: 0, padding: "0 12px 6px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(4, 1fr)", gap: 6 }}>
        {deck.map((emoji, idx) => (
          <Card key={idx} emoji={emoji}
            isFlipped={flipped.includes(idx)} isMatched={matched.has(idx)}
            onClick={() => handleCardTap(idx)}
            disabled={busy || turn !== "player" || isOver || matched.has(idx)} />
        ))}
      </div>

      {/* Chat strip */}
      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(4,2,2,0.98)" }}>
        <div style={{ padding: "8px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
          <img src={BUTLER_IMG} alt="" style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)", fontStyle: "italic", lineHeight: 1.5, flex: 1 }}>
            {messages.filter(m => m.from === "butler").at(-1)?.text}
          </p>
          <button onClick={() => {
            if (!chatUnlocked) { if (!spendCoins(1)) return; setChatUnlocked(true); }
            setChatOpen(v => !v);
          }} style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, color: chatUnlocked ? "rgba(255,255,255,0.35)" : "#d4af37", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
            {chatOpen ? "Close" : chatUnlocked ? "Chat" : "Unlock · 🪙1"}
          </button>
        </div>
        <AnimatePresence>
          {chatOpen && chatUnlocked && (
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
                  onKeyDown={e => e.key === "Enter" && (() => { if (!msgInput.trim()) return; addMsg("you", msgInput.trim()); setMsgInput(""); setTimeout(() => addMsg("butler", "The butler notes your message with discretion."), 800); })()}
                  placeholder="Say something…"
                  style={{ flex: 1, height: 32, borderRadius: 10, padding: "0 10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, outline: "none" }} />
                <button onClick={() => { if (!msgInput.trim()) return; addMsg("you", msgInput.trim()); setMsgInput(""); setTimeout(() => addMsg("butler", "The butler notes your message with discretion."), 800); }}
                  style={{ width: 32, height: 32, borderRadius: 10, background: a.glow(0.15), border: `1px solid ${a.glow(0.3)}`, color: a.accent, cursor: "pointer", fontSize: 14 }}>→</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div style={{ paddingBottom: "max(10px,env(safe-area-inset-bottom,10px))" }} />
      </div>

      {/* How It Works */}
      <AnimatePresence>{showHow && <HowItWorks onClose={() => setShowHow(false)} />}</AnimatePresence>

      {/* Result sheet */}
      <AnimatePresence>
        {showResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(14px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              style={{ width: "100%", maxWidth: 480, background: "rgba(6,4,4,0.99)", borderRadius: "22px 22px 0 0", paddingBottom: "max(32px,env(safe-area-inset-bottom,32px))", overflow: "hidden" }}>
              <div style={{ height: 3, background: winner === "player" ? "linear-gradient(90deg,transparent,#d4af37,transparent)" : "linear-gradient(90deg,transparent,#e01010,transparent)" }} />
              <div style={{ padding: "24px 22px 0", textAlign: "center" }}>
                <motion.div initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 340, damping: 18 }} style={{ fontSize: 56, marginBottom: 10 }}>
                  {winner === "player" ? "🏆" : winner === "butler" ? "🎩" : "🤝"}
                </motion.div>
                <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: winner === "player" ? "#d4af37" : winner === "butler" ? "#e01010" : "#fff" }}>
                  {winner === "player" ? "You Win!" : winner === "butler" ? "The Butler Wins" : "A Draw"}
                </p>
                <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{playerScore} – {butlerScore} · 8 pairs total</p>
                <p style={{ margin: "0 0 22px", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                  {winner === "player" ? "An impressive memory. The butler is mildly impressed. Your reward awaits."
                    : winner === "butler" ? "The butler never forgets. A good game — try again next week."
                    : "Honours even. The hotel calls it a gentlemanly draw."}
                </p>

                {winner === "player" && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 14, background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)", textAlign: "left", marginBottom: 14 }}>
                      <img src={BUTLER_IMG} alt="" style={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
                        <span style={{ color: "#d4af37", fontWeight: 800 }}>The Butler — </span>
                        You've earned the right to purchase this guest's contact details. A one-time fee applies. She will be notified.
                      </p>
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }}
                      disabled={connecting || readCoins() < 50}
                      onClick={() => { if (!spendCoins(50)) return; setConnecting(true); setTimeout(() => { setConnecting(false); navigate(-1); }, 1800); }}
                      animate={{ boxShadow: connecting || readCoins() < 50 ? undefined : ["0 4px 20px rgba(212,175,55,0.2)","0 4px 32px rgba(212,175,55,0.5)","0 4px 20px rgba(212,175,55,0.2)"] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: connecting || readCoins() < 50 ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#92660a,#d4af37)", color: connecting || readCoins() < 50 ? "rgba(255,255,255,0.25)" : "#000", fontSize: 14, fontWeight: 900, cursor: connecting || readCoins() < 50 ? "default" : "pointer", marginBottom: 10 }}>
                      {connecting ? <motion.span animate={{ opacity: [1,0.3,1] }} transition={{ duration: 0.8, repeat: Infinity }}>Purchasing…</motion.span> : "🔑 Purchase Her Contact · 🪙50"}
                    </motion.button>
                    {readCoins() < 50 && <p style={{ fontSize: 10, color: "rgba(239,68,68,0.7)", margin: "0 0 10px", fontWeight: 700 }}>You need 🪙50 — visit the Coin Shop</p>}
                  </div>
                )}

                <motion.button whileTap={{ scale: 0.97 }} onClick={resetGame}
                  style={{ width: "100%", height: 48, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 10 }}>
                  🔄 Rematch
                </motion.button>
                <button onClick={() => navigate(-1)} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}>Back to Games Room</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
