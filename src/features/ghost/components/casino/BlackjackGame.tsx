import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoins } from "../../hooks/useCoins";

// ── Types ─────────────────────────────────────────────────────────────────────
type Suit  = "♠" | "♥" | "♦" | "♣";
type Rank  = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type Phase = "bet" | "dealing" | "player" | "dealer" | "result";

interface Card { suit: Suit; rank: Rank; faceDown: boolean; id: string }

interface Result {
  outcome: "blackjack" | "win" | "push" | "lose" | "bust" | "surrender";
  payout: number; // net coins (positive = won, negative = lost)
  label: string;
}

// ── Deck helpers ──────────────────────────────────────────────────────────────
const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];

function buildShoe(): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < 6; d++)
    for (const suit of SUITS)
      for (const rank of RANKS)
        shoe.push({ suit, rank, faceDown: false, id: `${d}-${suit}-${rank}-${Math.random()}` });
  return fisherYates(shoe);
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rankVal(rank: Rank): number {
  if (rank === "A")                        return 11;
  if (["J","Q","K"].includes(rank))        return 10;
  return parseInt(rank);
}

function handTotal(cards: Card[]): { value: number; soft: boolean } {
  let value = 0, aces = 0;
  for (const c of cards.filter(c => !c.faceDown)) {
    if (c.rank === "A") { aces++; value += 11; }
    else value += rankVal(c.rank);
  }
  let soft = aces > 0;
  while (value > 21 && aces > 0) { value -= 10; aces--; }
  soft = aces > 0;
  return { value, soft };
}

function isBlackjack(cards: Card[]) {
  return cards.length === 2 && handTotal(cards).value === 21;
}

function isBust(cards: Card[]) {
  return handTotal(cards.filter(c => !c.faceDown)).value > 21;
}

// ── Chip config ───────────────────────────────────────────────────────────────
const CHIPS = [
  { value: 10,  label: "10",  color: "#ef4444", border: "#991b1b" },
  { value: 25,  label: "25",  color: "#22c55e", border: "#15803d" },
  { value: 50,  label: "50",  color: "#3b82f6", border: "#1d4ed8" },
  { value: 100, label: "100", color: "#a855f7", border: "#7e22ce" },
  { value: 500, label: "500", color: "#d4af37", border: "#92660a" },
];

// ── Card visual ───────────────────────────────────────────────────────────────
function PlayingCard({ card, index = 0 }: { card: Card; index?: number }) {
  const isRed = card.suit === "♥" || card.suit === "♦";

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, rotateY: 90 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: index * 0.12 }}
      style={{
        width: 54, height: 78, borderRadius: 7, flexShrink: 0,
        boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
        position: "relative", overflow: "hidden",
        userSelect: "none",
      }}
    >
      {card.faceDown ? (
        <div style={{
          width: "100%", height: "100%",
          background: "linear-gradient(135deg, #1e1060, #2d1b8e, #1e1060)",
          border: "2px solid rgba(255,255,255,0.15)",
          borderRadius: 7,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 42, height: 66, borderRadius: 4,
            border: "1.5px solid rgba(255,255,255,0.2)",
            background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 7px)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 18, opacity: 0.4 }}>🂠</span>
          </div>
        </div>
      ) : (
        <div style={{
          width: "100%", height: "100%",
          background: "#fefdf8",
          border: "2px solid rgba(0,0,0,0.12)",
          borderRadius: 7,
          display: "flex", flexDirection: "column",
          padding: "3px 4px",
          color: isRed ? "#dc2626" : "#111827",
        }}>
          {/* Top-left rank + suit */}
          <div style={{ lineHeight: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 900 }}>{card.rank}</div>
            <div style={{ fontSize: 11 }}>{card.suit}</div>
          </div>
          {/* Center suit */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
            {card.suit}
          </div>
          {/* Bottom-right (rotated) */}
          <div style={{ lineHeight: 1, textAlign: "right", transform: "rotate(180deg)" }}>
            <div style={{ fontSize: 13, fontWeight: 900 }}>{card.rank}</div>
            <div style={{ fontSize: 11 }}>{card.suit}</div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Hand display ──────────────────────────────────────────────────────────────
function Hand({ cards, label, showTotal }: { cards: Card[]; label: string; showTotal: boolean }) {
  const { value, soft } = handTotal(cards);
  const bust = value > 21;
  const bj = isBlackjack(cards);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {cards.map((card, i) => <PlayingCard key={card.id} card={card} index={i} />)}
      </div>
      {showTotal && (
        <motion.div
          key={value}
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
          <span style={{
            fontSize: 15, fontWeight: 900,
            color: bust ? "#ef4444" : bj ? "#d4af37" : "#fff",
            padding: "2px 10px", borderRadius: 20,
            background: bust ? "rgba(239,68,68,0.15)" : bj ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.08)",
            border: `1px solid ${bust ? "rgba(239,68,68,0.4)" : bj ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.12)"}`,
          }}>
            {bj ? "Blackjack!" : bust ? "Bust" : `${soft && value < 21 ? "Soft " : ""}${value}`}
          </span>
        </motion.div>
      )}
    </div>
  );
}

// ── Main game ─────────────────────────────────────────────────────────────────
export default function BlackjackGame() {
  const { balance, deductCoins, addCoins } = useCoins();

  const [shoe,        setShoe]       = useState<Card[]>(() => buildShoe());
  const [phase,       setPhase]      = useState<Phase>("bet");
  const [bet,         setBet]        = useState(0);
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [result,      setResult]     = useState<Result | null>(null);
  const [stats, setStats] = useState({ hands: 0, won: 0, lost: 0, pushed: 0 });

  // ── Shoe management ──────────────────────────────────────────────────────────
  const drawCard = useCallback((currentShoe: Card[], faceDown = false): [Card, Card[]] => {
    let s = currentShoe.length < 52 ? buildShoe() : currentShoe;
    const [card, ...rest] = s;
    return [{ ...card, faceDown, id: card.id + Date.now() }, rest];
  }, []);

  // ── Chip betting ──────────────────────────────────────────────────────────────
  function addChip(value: number) {
    if (bet + value > balance) return;
    setBet(prev => prev + value);
  }
  function clearBet() { setBet(0); }

  // ── Deal ──────────────────────────────────────────────────────────────────────
  function deal() {
    if (bet <= 0 || bet > balance) return;
    if (!deductCoins(bet, `Blackjack bet — ${bet} coins`)) return;

    setPhase("dealing");

    let s = [...shoe];
    let [p1, s1] = drawCard(s);              s = s1;
    let [d1, s2] = drawCard(s);              s = s2;
    let [p2, s3] = drawCard(s);              s = s3;
    let [d2, s4] = drawCard(s, true);        s = s4; // dealer hole card

    setShoe(s);
    setPlayerCards([p1, p2]);
    setDealerCards([d1, d2]);
    setResult(null);

    // Check immediate BJ
    const playerBJ = isBlackjack([p1, p2]);
    const dealerBJ = isBlackjack([d1, { ...d2, faceDown: false }]);

    setTimeout(() => {
      if (playerBJ || dealerBJ) {
        // Reveal dealer hole card
        setDealerCards([d1, { ...d2, faceDown: false }]);
        setTimeout(() => settle([p1, p2], [d1, { ...d2, faceDown: false }], bet, "result"), 600);
      } else {
        setPhase("player");
      }
    }, 700);
  }

  // ── Player actions ────────────────────────────────────────────────────────────
  function hit() {
    let s = [...shoe];
    const [card, rest] = drawCard(s);
    s = rest;
    setShoe(s);
    const newHand = [...playerCards, card];
    setPlayerCards(newHand);
    if (handTotal(newHand).value >= 21) {
      stand(newHand);
    }
  }

  function stand(hand = playerCards) {
    setPhase("dealer");
    revealAndDraw(hand);
  }

  function doubleDown() {
    if (!deductCoins(bet, `Blackjack double — ${bet} coins`)) return;
    let s = [...shoe];
    const [card, rest] = drawCard(s);
    s = rest;
    setShoe(s);
    const newHand = [...playerCards, card];
    setPlayerCards(newHand);
    setPhase("dealer");
    // short delay then reveal dealer
    setTimeout(() => revealAndDraw(newHand, bet * 2), 400);
  }

  function surrender() {
    const refund = Math.floor(bet / 2);
    addCoins(refund, "Blackjack surrender — half bet returned", "refund");
    setResult({ outcome: "surrender", payout: -refund, label: "Surrender — half bet back" });
    setPhase("result");
    setStats(p => ({ ...p, hands: p.hands + 1, lost: p.lost + 1 }));
  }

  // ── Dealer plays ──────────────────────────────────────────────────────────────
  function revealAndDraw(pHand: Card[], finalBet = bet) {
    // Flip hole card
    const revealed = dealerCards.map(c => ({ ...c, faceDown: false }));
    setDealerCards(revealed);

    drawDealerCards(revealed, pHand, finalBet);
  }

  function drawDealerCards(dHand: Card[], pHand: Card[], finalBet: number) {
    const { value, soft } = handTotal(dHand);
    // Dealer hits soft 17 (H17 rule)
    const shouldHit = value < 17 || (value === 17 && soft);

    if (shouldHit) {
      setTimeout(() => {
        let s = [...shoe];
        const [card, rest] = drawCard(s);
        s = rest;
        setShoe(s);
        const newDHand = [...dHand, card];
        setDealerCards(newDHand);
        drawDealerCards(newDHand, pHand, finalBet);
      }, 600);
    } else {
      setTimeout(() => settle(pHand, dHand, finalBet, "result"), 400);
    }
  }

  // ── Settle ────────────────────────────────────────────────────────────────────
  function settle(pHand: Card[], dHand: Card[], finalBet: number, _phase: Phase) {
    const pTotal = handTotal(pHand).value;
    const dTotal = handTotal(dHand).value;
    const pBJ    = isBlackjack(pHand);
    const dBJ    = isBlackjack(dHand);
    const pBust  = pTotal > 21;
    const dBust  = dTotal > 21;

    let outcome: Result["outcome"];
    let payout = 0;

    if (pBJ && dBJ)        { outcome = "push";      payout = 0; }
    else if (pBJ)          { outcome = "blackjack"; payout = Math.floor(finalBet * 1.5); } // 3:2
    else if (dBJ)          { outcome = "lose";      payout = -finalBet; }
    else if (pBust)        { outcome = "bust";      payout = -finalBet; }
    else if (dBust)        { outcome = "win";       payout = finalBet; }
    else if (pTotal > dTotal) { outcome = "win";    payout = finalBet; }
    else if (pTotal < dTotal) { outcome = "lose";   payout = -finalBet; }
    else                   { outcome = "push";      payout = 0; }

    const labels: Record<Result["outcome"], string> = {
      blackjack: `Blackjack! +${Math.floor(finalBet * 1.5)} coins`,
      win:       `You win! +${finalBet} coins`,
      push:      "Push — bet returned",
      lose:      `Dealer wins — −${finalBet} coins`,
      bust:      `Bust — −${finalBet} coins`,
      surrender: "Surrender",
    };

    if (payout > 0)        addCoins(finalBet + payout, `Blackjack ${outcome}`, "win");
    else if (payout === 0) addCoins(finalBet, "Blackjack push — bet returned", "refund");

    setResult({ outcome, payout, label: labels[outcome] });
    setPhase("result");
    setStats(p => ({
      hands: p.hands + 1,
      won:   p.won   + (payout > 0 ? 1 : 0),
      lost:  p.lost  + (payout < 0 ? 1 : 0),
      pushed: p.pushed + (payout === 0 ? 1 : 0),
    }));
  }

  // ── Derived state ─────────────────────────────────────────────────────────────
  const pTotal    = handTotal(playerCards).value;
  const canDouble = phase === "player" && playerCards.length === 2 && balance >= bet;
  const canSurr   = phase === "player" && playerCards.length === 2;

  // Outcome colors
  const resultColor: Record<string, string> = {
    blackjack: "#d4af37", win: "#4ade80", push: "#94a3b8",
    lose: "#ef4444", bust: "#ef4444", surrender: "#f59e0b",
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: "100%", background: "transparent",
      fontFamily: "system-ui, sans-serif", color: "#fff",
      userSelect: "none",
    }}>

      {/* Table felt */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        background: "radial-gradient(ellipse at 50% 40%, #0d4a1e 0%, #082e12 60%, #050f08 100%)",
        borderRadius: 20, margin: "0 4px",
        padding: "16px 12px 12px", gap: 12, position: "relative",
        border: "2px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 0 60px rgba(0,0,0,0.4)",
        overflow: "hidden",
      }}>

        {/* Felt texture overlay */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 18, pointerEvents: "none",
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.008) 0, rgba(255,255,255,0.008) 1px, transparent 1px, transparent 3px), repeating-linear-gradient(90deg, rgba(255,255,255,0.008) 0, rgba(255,255,255,0.008) 1px, transparent 1px, transparent 3px)",
        }} />

        {/* Casino logo watermark */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.04, fontSize: 80, pointerEvents: "none" }}>
          🃏
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[
              { label: "Hands", val: stats.hands },
              { label: "Won",   val: stats.won,  color: "#4ade80" },
              { label: "Lost",  val: stats.lost, color: "#ef4444" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: (s as any).color || "#fff" }}>{s.val}</p>
                <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 20, padding: "4px 12px",
          }}>
            <span style={{ fontSize: 13 }}>🪙</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#d4af37" }}>{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* ── DEALER AREA ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minHeight: 110, justifyContent: "center", position: "relative", zIndex: 1 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Dealer
          </p>
          {dealerCards.length > 0
            ? <Hand cards={dealerCards} label="Dealer" showTotal={phase !== "player"} />
            : <div style={{ height: 78, display: "flex", alignItems: "center" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Waiting for deal…</p>
              </div>
          }
        </div>

        {/* ── CENTER DIVIDER ── */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 20px", position: "relative", zIndex: 1 }}>
          <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", background: "#0d4a1e", padding: "0 10px" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 800, letterSpacing: "0.1em" }}>BLACKJACK PAYS 3:2</span>
          </div>
        </div>

        {/* ── PLAYER AREA ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minHeight: 110, justifyContent: "center", position: "relative", zIndex: 1 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Your Hand
          </p>
          {playerCards.length > 0
            ? <Hand cards={playerCards} label="Player" showTotal />
            : <div style={{ height: 78, display: "flex", alignItems: "center" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.15)" }}>Place your bet to deal</p>
              </div>
          }
        </div>

        {/* ── RESULT BANNER ── */}
        <AnimatePresence>
          {phase === "result" && result && (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 24 }}
              style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                zIndex: 10, textAlign: "center",
                background: "rgba(5,10,8,0.92)",
                border: `2px solid ${resultColor[result.outcome]}`,
                borderRadius: 18, padding: "18px 28px",
                boxShadow: `0 0 40px ${resultColor[result.outcome]}50`,
              }}
            >
              <p style={{ margin: "0 0 4px", fontSize: 28 }}>
                {result.outcome === "blackjack" ? "🃏" : result.outcome === "win" ? "✨" : result.outcome === "push" ? "🤝" : result.outcome === "surrender" ? "🏳️" : "💀"}
              </p>
              <p style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 900, color: resultColor[result.outcome] }}>
                {result.outcome === "blackjack" ? "BLACKJACK!" : result.outcome === "win" ? "YOU WIN" : result.outcome === "push" ? "PUSH" : result.outcome === "surrender" ? "SURRENDER" : "BUST"}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{result.label}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div style={{ padding: "10px 8px 6px", display: "flex", flexDirection: "column", gap: 8 }}>

        {/* Player action buttons */}
        <AnimatePresence mode="wait">
          {phase === "player" && (
            <motion.div key="actions"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              style={{ display: "flex", gap: 8 }}
            >
              {[
                { label: "Hit",     emoji: "👆", action: hit,       always: true,     color: "#4ade80" },
                { label: "Stand",   emoji: "✋", action: () => stand(), always: true, color: "#f59e0b" },
                { label: "Double",  emoji: "×2", action: doubleDown, show: canDouble,  color: "#a78bfa" },
                { label: "Surrender", emoji: "🏳️", action: surrender, show: canSurr,  color: "#94a3b8" },
              ].filter(b => b.always || b.show).map(b => (
                <motion.button
                  key={b.label}
                  whileTap={{ scale: 0.92 }}
                  onClick={b.action}
                  style={{
                    flex: 1, height: 52, borderRadius: 13, border: "none", cursor: "pointer",
                    background: `${b.color}20`, border: `1.5px solid ${b.color}50`,
                    color: b.color, fontSize: 11, fontWeight: 900, letterSpacing: "0.04em",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{b.emoji}</span>
                  {b.label}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Dealing animation feedback */}
          {phase === "dealing" && (
            <motion.div key="dealing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <motion.p animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.7, repeat: Infinity }}
                style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
                Dealing…
              </motion.p>
            </motion.div>
          )}

          {/* Dealer drawing */}
          {phase === "dealer" && (
            <motion.div key="dealer"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <motion.p animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
                style={{ margin: 0, fontSize: 13, color: "#f59e0b", fontWeight: 700 }}>
                Dealer drawing…
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BETTING UI ── */}
        {(phase === "bet" || phase === "result") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Bet display */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 12, padding: "10px 14px",
            }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>Your bet</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: bet > 0 ? "#d4af37" : "rgba(255,255,255,0.3)" }}>
                  🪙 {bet.toLocaleString()}
                </span>
                {bet > 0 && (
                  <button onClick={clearBet} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</button>
                )}
              </div>
            </div>

            {/* Chip row */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              {CHIPS.map(chip => (
                <motion.button
                  key={chip.value}
                  whileTap={{ scale: 0.88, y: -4 }}
                  onClick={() => addChip(chip.value)}
                  disabled={bet + chip.value > balance}
                  style={{
                    width: 50, height: 50, borderRadius: "50%", border: `3px solid ${chip.border}`,
                    background: `radial-gradient(circle at 35% 35%, ${chip.color}dd, ${chip.border})`,
                    color: "#fff", fontSize: 10, fontWeight: 900, cursor: "pointer",
                    boxShadow: `0 4px 12px ${chip.color}55, inset 0 1px 0 rgba(255,255,255,0.3)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: bet + chip.value > balance ? 0.35 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {chip.label}
                </motion.button>
              ))}
            </div>

            {/* Deal / Play Again */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={phase === "result" ? () => { setPhase("bet"); setBet(0); setPlayerCards([]); setDealerCards([]); setResult(null); } : deal}
              disabled={phase === "bet" && (bet <= 0 || bet > balance)}
              style={{
                width: "100%", height: 52, borderRadius: 14, border: "none",
                background: phase === "result" ? "linear-gradient(135deg, #374151, #4b5563)" :
                  bet > 0 && bet <= balance ? "linear-gradient(135deg, #92660a, #d4af37, #f0d060)" : "rgba(255,255,255,0.06)",
                color: phase === "result" ? "#fff" : bet > 0 ? "#0a0700" : "rgba(255,255,255,0.25)",
                fontSize: 14, fontWeight: 900, cursor: "pointer",
                boxShadow: bet > 0 && phase === "bet" ? "0 4px 20px rgba(212,175,55,0.4)" : "none",
                letterSpacing: "0.04em",
                transition: "all 0.2s",
              }}
            >
              {phase === "result" ? "🃏 New Hand" : bet > 0 ? `Deal — 🪙 ${bet}` : "Place a bet to deal"}
            </motion.button>
          </div>
        )}
      </div>

      {/* House rules note */}
      <p style={{ textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.15)", margin: "4px 0 8px", letterSpacing: "0.06em" }}>
        6 DECKS · DEALER HITS SOFT 17 · BLACKJACK PAYS 3:2
      </p>
    </div>
  );
}
