import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoins } from "../../hooks/useCoins";

// ── Deck ──────────────────────────────────────────────────────────────────────
type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"10"|"J"|"Q"|"K"|"A";

interface Card { suit: Suit; rank: Rank; value: number }

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
// Value: 2=2, ... 10=10, J=11, Q=12, K=13, A=14
const RANK_VALUE: Record<Rank, number> = {
  "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,
  "J":11,"Q":12,"K":13,"A":14,
};

function buildDeck(): Card[] {
  return SUITS.flatMap(suit =>
    RANKS.map(rank => ({ suit, rank, value: RANK_VALUE[rank] }))
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Dynamic odds ──────────────────────────────────────────────────────────────
// Given current card value and remaining deck, calculate fair probability
// then apply 5% house edge to payout multiplier.

function calcOdds(currentValue: number, remaining: Card[]): {
  higherP: number; lowerP: number; higherMult: number; lowerMult: number;
} {
  const total = remaining.length;
  if (total === 0) return { higherP: 0.5, lowerP: 0.5, higherMult: 1.9, lowerMult: 1.9 };

  const higherCount = remaining.filter(c => c.value > currentValue).length;
  const lowerCount  = remaining.filter(c => c.value < currentValue).length;
  // Ties are a push (bet returned) so not counted as win/loss here
  // Probability of strictly higher/lower
  const higherP = higherCount / total;
  const lowerP  = lowerCount  / total;

  // Fair payout = 1 / probability, capped at 10x, with 5% house edge
  const houseEdge = 0.95;
  const higherMult = higherP > 0 ? Math.min(10, (1 / higherP) * houseEdge) : 10;
  const lowerMult  = lowerP  > 0 ? Math.min(10, (1 / lowerP)  * houseEdge) : 10;

  return { higherP, lowerP, higherMult: Math.round(higherMult * 10) / 10, lowerMult: Math.round(lowerMult * 10) / 10 };
}

const BET_OPTIONS = [10, 25, 50, 100];

function CardFace({ card, revealed = true }: { card: Card | null; revealed?: boolean }) {
  const isRed = card ? (card.suit === "♥" || card.suit === "♦") : false;

  return (
    <motion.div
      key={card ? `${card.rank}-${card.suit}` : "empty"}
      initial={{ rotateY: 90, scale: 0.8 }}
      animate={{ rotateY: 0,  scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      style={{
        width: 80, height: 114, borderRadius: 10,
        background: !card ? "rgba(255,255,255,0.04)" : revealed ? "#fefdf8" : "linear-gradient(135deg, #1e1060, #2d1b8e)",
        border: card && revealed ? "2px solid rgba(0,0,0,0.12)" : "2px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        display: "flex", flexDirection: "column",
        padding: card && revealed ? "5px 6px" : "0",
        color: isRed ? "#dc2626" : "#111827",
        position: "relative", overflow: "hidden",
      }}
    >
      {!card ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 28, opacity: 0.15 }}>🂠</span>
        </div>
      ) : !revealed ? (
        <div style={{
          flex: 1, margin: 6, borderRadius: 6,
          border: "1.5px solid rgba(255,255,255,0.15)",
          background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 24, opacity: 0.3 }}>👻</span>
        </div>
      ) : (
        <>
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{card.rank}</div>
            <div style={{ fontSize: 14 }}>{card.suit}</div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }}>
            {card.suit}
          </div>
          <div style={{ lineHeight: 1, textAlign: "right", transform: "rotate(180deg)" }}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{card.rank}</div>
            <div style={{ fontSize: 14 }}>{card.suit}</div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function ProbBar({ label, probability, multiplier, color, onClick, disabled }: {
  label: string; probability: number; multiplier: number;
  color: string; onClick: () => void; disabled: boolean;
}) {
  const pct = Math.round(probability * 100);
  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.96 } : {}}
      onClick={!disabled ? onClick : undefined}
      style={{
        flex: 1, borderRadius: 14, border: `2px solid ${color}40`,
        background: `${color}10`, padding: "12px 10px",
        cursor: disabled ? "default" : "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        opacity: disabled ? 0.5 : 1, transition: "opacity 0.2s",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Probability bar fill */}
      <div style={{
        position: "absolute", bottom: 0, left: 0,
        height: `${pct}%`, width: "100%",
        background: `${color}15`,
        transition: "height 0.4s ease",
        pointerEvents: "none",
      }} />
      <span style={{ fontSize: 22, position: "relative", zIndex: 1 }}>{label === "Higher" ? "📈" : "📉"}</span>
      <span style={{ fontSize: 14, fontWeight: 900, color, position: "relative", zIndex: 1 }}>{label}</span>
      <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{pct}% chance</p>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color }}>×{multiplier.toFixed(1)}</p>
      </div>
    </motion.button>
  );
}

type RoundResult = "higher_correct" | "lower_correct" | "wrong" | "tie" | null;

export default function HighLowGame() {
  const { balance, deductCoins, addCoins } = useCoins();

  const [deck,         setDeck]         = useState<Card[]>(() => shuffle(buildDeck()));
  const [currentCard,  setCurrentCard]  = useState<Card | null>(null);
  const [nextCard,     setNextCard]      = useState<Card | null>(null);
  const [bet,          setBet]          = useState(25);
  const [roundResult,  setRoundResult]  = useState<RoundResult>(null);
  const [phase,        setPhase]        = useState<"bet" | "reveal" | "result">("bet");
  const [streak,       setStreak]       = useState(0);
  const [stats, setStats] = useState({ rounds: 0, wins: 0, losses: 0, ties: 0, totalWon: 0 });
  const [winAmount,    setWinAmount]    = useState(0);

  // Reshuffle when deck runs low
  function ensureDeck(d: Card[]): Card[] {
    return d.length < 10 ? shuffle(buildDeck()) : d;
  }

  function startRound() {
    if (!deductCoins(bet, `High/Low bet — ${bet} coins`)) return;

    let d = ensureDeck([...deck]);
    const card = d[0];
    d = d.slice(1);
    setCurrentCard(card);
    setNextCard(null);
    setRoundResult(null);
    setDeck(d);
    setPhase("reveal");
  }

  function guess(direction: "higher" | "lower") {
    if (!currentCard || phase !== "reveal") return;

    let d = ensureDeck([...deck]);
    const next = d[0];
    d = d.slice(1);
    setDeck(d);
    setNextCard(next);

    const { higherMult, lowerMult } = calcOdds(currentCard.value, d);

    let result: RoundResult;
    if (next.value === currentCard.value) {
      result = "tie";
    } else if (direction === "higher" && next.value > currentCard.value) {
      result = "higher_correct";
    } else if (direction === "lower" && next.value < currentCard.value) {
      result = "lower_correct";
    } else {
      result = "wrong";
    }

    setRoundResult(result);
    setPhase("result");

    const mult = direction === "higher" ? higherMult : lowerMult;

    if (result === "tie") {
      // Push — return bet
      addCoins(bet, "High/Low tie — bet returned", "refund");
      setWinAmount(0);
      setStreak(0);
      setStats(p => ({ ...p, rounds: p.rounds + 1, ties: p.ties + 1 }));
    } else if (result === "higher_correct" || result === "lower_correct") {
      // Streak bonus: +0.1x multiplier per consecutive win, max +0.5x
      const streakBonus = Math.min(streak * 0.1, 0.5);
      const finalMult = mult + streakBonus;
      const won = Math.floor(bet * finalMult);
      addCoins(bet + won, `High/Low win ×${finalMult.toFixed(1)}`, "win");
      setWinAmount(won);
      setStreak(s => s + 1);
      setStats(p => ({ ...p, rounds: p.rounds + 1, wins: p.wins + 1, totalWon: p.totalWon + won }));
    } else {
      setWinAmount(-bet);
      setStreak(0);
      setStats(p => ({ ...p, rounds: p.rounds + 1, losses: p.losses + 1 }));
    }
  }

  const remaining = deck.length;
  const odds = currentCard ? calcOdds(currentCard.value, deck) : null;

  const resultColors: Record<NonNullable<RoundResult>, string> = {
    higher_correct: "#4ade80",
    lower_correct:  "#4ade80",
    wrong:          "#ef4444",
    tie:            "#94a3b8",
  };

  const resultLabels: Record<NonNullable<RoundResult>, string> = {
    higher_correct: "Correct! Higher",
    lower_correct:  "Correct! Lower",
    wrong:          "Wrong guess",
    tie:            "Same card — Push",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontFamily: "system-ui, sans-serif", color: "#fff", userSelect: "none" }}>

      {/* Header stats */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { label: "Rounds", val: stats.rounds },
            { label: "Wins",   val: stats.wins,   color: "#4ade80" },
            { label: "Streak", val: streak,        color: streak >= 3 ? "#d4af37" : undefined },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: (s as any).color || "#fff" }}>
                {s.val}{s.label === "Streak" && streak >= 3 ? "🔥" : ""}
              </p>
              <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, padding: "4px 12px" }}>
            <span style={{ fontSize: 13 }}>🪙</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#d4af37" }}>{balance.toLocaleString()}</span>
          </div>
          <p style={{ margin: "2px 0 0", fontSize: 8, color: "rgba(255,255,255,0.3)", textAlign: "right" }}>
            {remaining} cards left
          </p>
        </div>
      </div>

      {/* Card display */}
      <div style={{
        background: "radial-gradient(ellipse at 50% 40%, #0d3a4a 0%, #081e28 60%, #04080f 100%)",
        border: "2px solid rgba(255,255,255,0.07)", borderRadius: 18,
        padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        position: "relative", overflow: "hidden",
        boxShadow: "inset 0 0 40px rgba(0,0,0,0.4)",
      }}>

        {/* Felt texture */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.006) 0, rgba(255,255,255,0.006) 1px, transparent 1px, transparent 4px)",
        }} />

        {/* Cards side by side */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <CardFace card={currentCard} />
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {phase === "bet" ? "Next Card" : "Current"}
            </p>
          </div>

          {/* VS arrow */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <motion.div
              animate={phase === "reveal" ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ fontSize: 24, color: "rgba(255,255,255,0.3)" }}
            >
              {roundResult === "higher_correct" || roundResult === "lower_correct" ? "✅" :
               roundResult === "wrong" ? "❌" :
               roundResult === "tie" ? "🤝" : "❓"}
            </motion.div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <CardFace card={nextCard} revealed={nextCard !== null} />
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {nextCard ? "Next Card" : "?"}
            </p>
          </div>
        </div>

        {/* Result flash */}
        <AnimatePresence>
          {phase === "result" && roundResult && (
            <motion.div
              key="res"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ position: "relative", zIndex: 1, textAlign: "center" }}
            >
              <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 900, color: resultColors[roundResult] }}>
                {resultLabels[roundResult]}
              </p>
              {winAmount > 0 && (
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#4ade80" }}>
                  +🪙 {winAmount.toLocaleString()}
                  {streak >= 2 && <span style={{ color: "#d4af37", marginLeft: 6 }}>🔥×{streak} streak</span>}
                </p>
              )}
              {winAmount < 0 && (
                <p style={{ margin: 0, fontSize: 13, color: "#ef4444" }}>−🪙 {Math.abs(winAmount).toLocaleString()}</p>
              )}
              {winAmount === 0 && roundResult === "tie" && (
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Bet returned</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Odds display — shown during guessing phase */}
        {phase === "reveal" && odds && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: "relative", zIndex: 1, width: "100%", textAlign: "center" }}
          >
            <p style={{ margin: "0 0 4px", fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Remaining deck odds
            </p>
            {/* Probability bar */}
            <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "rgba(255,255,255,0.08)" }}>
              <motion.div
                initial={{ width: "50%" }}
                animate={{ width: `${Math.round(odds.higherP * 100)}%` }}
                transition={{ duration: 0.6, type: "spring" }}
                style={{ background: "#4ade80", borderRadius: "4px 0 0 4px" }}
              />
              <div style={{ flex: 1, background: "#ef4444", borderRadius: "0 4px 4px 0" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
              <span style={{ fontSize: 9, color: "#4ade80" }}>Higher {Math.round(odds.higherP * 100)}%</span>
              <span style={{ fontSize: 9, color: "#ef4444" }}>Lower {Math.round(odds.lowerP * 100)}%</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Action area */}
      <AnimatePresence mode="wait">
        {phase === "bet" && (
          <motion.div key="bet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {/* Bet chips */}
            <div style={{ display: "flex", gap: 6 }}>
              {BET_OPTIONS.map(b => (
                <motion.button key={b} whileTap={{ scale: 0.92 }} onClick={() => setBet(b)}
                  style={{
                    flex: 1, height: 38, borderRadius: 10, border: "none", cursor: "pointer",
                    background: bet === b ? "linear-gradient(135deg, #92660a, #d4af37)" : "rgba(255,255,255,0.06)",
                    color: bet === b ? "#0a0700" : "rgba(255,255,255,0.5)",
                    fontSize: 12, fontWeight: 900, transition: "all 0.15s",
                  }}
                >
                  🪙{b}
                </motion.button>
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }} onClick={startRound}
              disabled={balance < bet}
              style={{
                width: "100%", height: 52, borderRadius: 14, border: "none",
                background: balance >= bet ? "linear-gradient(135deg, #92660a, #d4af37, #f0d060)" : "rgba(255,255,255,0.06)",
                color: balance >= bet ? "#0a0700" : "rgba(255,255,255,0.2)",
                fontSize: 14, fontWeight: 900, cursor: "pointer",
                boxShadow: balance >= bet ? "0 4px 20px rgba(212,175,55,0.4)" : "none",
              }}
            >
              Draw Card — 🪙 {bet}
            </motion.button>
          </motion.div>
        )}

        {phase === "reveal" && odds && (
          <motion.div key="guess" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", gap: 10 }}
          >
            <ProbBar label="Higher" probability={odds.higherP} multiplier={odds.higherMult}
              color="#4ade80" onClick={() => guess("higher")} disabled={false} />
            <ProbBar label="Lower" probability={odds.lowerP} multiplier={odds.lowerMult}
              color="#ef4444" onClick={() => guess("lower")} disabled={false} />
          </motion.div>
        )}

        {phase === "result" && (
          <motion.div key="next" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: "flex", gap: 8 }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                // Continue with the next card as current (let it ride feel)
                if (nextCard && (roundResult === "higher_correct" || roundResult === "lower_correct")) {
                  setCurrentCard(nextCard);
                  setNextCard(null);
                  setRoundResult(null);
                  setPhase("reveal");
                  if (!deductCoins(bet, `High/Low bet — ${bet} coins`)) {
                    setPhase("bet");
                  }
                } else {
                  setCurrentCard(null);
                  setNextCard(null);
                  setRoundResult(null);
                  setPhase("bet");
                }
              }}
              style={{
                flex: 1, height: 52, borderRadius: 14, border: "none",
                background: (roundResult === "higher_correct" || roundResult === "lower_correct")
                  ? "linear-gradient(135deg, #14532d, #4ade80)" : "rgba(255,255,255,0.07)",
                color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer",
                boxShadow: (roundResult === "higher_correct" || roundResult === "lower_correct") ? "0 4px 16px rgba(74,222,128,0.35)" : "none",
              }}
            >
              {roundResult === "higher_correct" || roundResult === "lower_correct"
                ? `🔥 Go Again — 🪙${bet}`
                : "↩️ New Round"}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setCurrentCard(null); setNextCard(null); setRoundResult(null); setPhase("bet"); }}
              style={{
                width: 52, height: 52, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
                fontSize: 18, cursor: "pointer",
              }}
            >
              ⏸
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak bonus info */}
      {streak >= 2 && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{
            background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)",
            borderRadius: 12, padding: "8px 14px", textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 11, color: "#d4af37", fontWeight: 800 }}>
            🔥 {streak}-win streak — +{Math.min(streak * 0.1, 0.5).toFixed(1)}x bonus multiplier active
          </p>
        </motion.div>
      )}

      {/* Stats footer */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        {[
          { label: "Win Rate", val: stats.rounds ? `${Math.round((stats.wins / stats.rounds) * 100)}%` : "—" },
          { label: "Total Won", val: `🪙${stats.totalWon.toLocaleString()}` },
          { label: "Rounds", val: stats.rounds },
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
