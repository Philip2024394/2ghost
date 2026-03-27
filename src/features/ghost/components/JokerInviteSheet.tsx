// JokerInviteSheet — The Joker appears randomly in the feed and rewards coins.
// First encounter: 20 coins flat.
// Subsequent: 8% cashback on total coins ever spent (min 5, max 100).
// Timing: min 6h between appearances, returns sooner when balance runs low.
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoins } from "../hooks/useCoins";
import { readTransactions } from "../hooks/useCoins";

const JOKER_IMG       = "https://ik.imagekit.io/7grri5v7d/Untitleddsfsdfsdf.png";
const JOKER_VIDEO_URL = "https://ik.imagekit.io/7grri5v7d/joker%20woman.mp4";
const JOKER_LAST_KEY = "joker_last_shown";

// ── Coin reward helpers ──────────────────────────────────────────────────────

function getTotalSpent(): number {
  try {
    return readTransactions()
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  } catch { return 0; }
}

export function calcJokerReward(): { coins: number; isFirst: boolean } {
  const lastShown = parseInt(localStorage.getItem(JOKER_LAST_KEY) || "0");
  const isFirst = lastShown === 0;
  if (isFirst) return { coins: 20, isFirst: true };
  const totalSpent = getTotalSpent();
  const cashback = Math.round(totalSpent * 0.08);
  return { coins: Math.max(5, Math.min(100, cashback)), isFirst: false };
}

export function markJokerShown() {
  try { localStorage.setItem(JOKER_LAST_KEY, String(Date.now())); } catch {}
}

export function shouldShowJoker(profileId: string, balance: number): boolean {
  try {
    const lastShown = parseInt(localStorage.getItem(JOKER_LAST_KEY) || "0");
    const hoursSince = (Date.now() - lastShown) / 3_600_000;
    if (lastShown > 0 && hoursSince < 1) return false; // absolute minimum gap (1h)

    // Seeded per-profile — not every female unverified card is the Joker
    let h = 0;
    for (let i = 0; i < profileId.length; i++) h = Math.imul(37, h) + profileId.charCodeAt(i) | 0;
    const hash = Math.abs(h);

    if (lastShown === 0) return hash % 2 === 0;        // first ever: 50% of eligible
    if (balance < 15 && hoursSince >= 1) return hash % 2 === 0;  // running low: 50%
    if (hoursSince >= 6) return hash % 3 === 0;        // normal return: ~33%
    return false;
  } catch { return false; }
}

// ── Floating coin particle ───────────────────────────────────────────────────

interface CoinParticle { id: number; x: number; delay: number; dur: number; size: number }

function generateCoins(count: number): CoinParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 5 + (i * 6.5) % 90,         // spread across width
    delay: (i * 0.12),               // stagger
    dur: 1.8 + (i % 4) * 0.3,       // varying speeds
    size: 16 + (i % 3) * 8,         // 16, 24, 32px
  }));
}

interface Props {
  onClose: () => void;
}

export default function JokerInviteSheet({ onClose }: Props) {
  const { addCoins } = useCoins();
  const { coins, isFirst } = useMemo(() => calcJokerReward(), []);
  const [collected, setCollected] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const particles = useMemo(() => generateCoins(18), []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  // Start coin rain after a short entrance delay
  useEffect(() => {
    const t = setTimeout(() => setShowCoins(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Play video — if already buffered (preloaded), start immediately; otherwise wait for canplay
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const onReady = () => { setVideoReady(true); vid.play().catch(() => {}); };
    if (vid.readyState >= 3) {
      // Already buffered from background preload — play right away
      onReady();
    } else {
      vid.addEventListener("canplay", onReady, { once: true });
      vid.load();
    }
    return () => vid.removeEventListener("canplay", onReady);
  }, []);

  function collect() {
    if (collected) return;
    setCollected(true);
    addCoins(coins, isFirst ? "Joker's Welcome Gift 🃏" : "Joker's Cashback Reward 🃏", "bonus");
    markJokerShown();
    // Signal CoinBalanceChip to flash + count up
    window.dispatchEvent(new CustomEvent("joker_coins_awarded", { detail: { amount: coins } }));
    setTimeout(onClose, 1800);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 950,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Fallback image — visible instantly while video loads */}
      <img
        src={JOKER_IMG}
        alt=""
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center top",
          opacity: videoReady ? 0 : 1, transition: "opacity 0.8s",
          pointerEvents: "none",
        }}
      />

      {/* Background video — fades in once first frame is ready */}
      <video
        ref={videoRef}
        src={JOKER_VIDEO_URL}
        muted loop playsInline preload="auto"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center top",
          opacity: videoReady ? 1 : 0, transition: "opacity 0.8s",
          pointerEvents: "none",
        }}
      />
      {/* Dark vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(4,2,8,0.45) 0%, rgba(4,2,8,0.3) 40%, rgba(4,2,8,0.85) 75%, rgba(4,2,8,0.97) 100%)",
      }} />

      {/* Floating coin rain */}
      <AnimatePresence>
        {showCoins && particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ y: -60, opacity: 0, x: `${p.x}vw` }}
            animate={{ y: "110vh", opacity: [0, 1, 1, 0], x: `${p.x}vw` }}
            transition={{ duration: p.dur, delay: p.delay, ease: "easeIn" }}
            style={{
              position: "absolute", top: 0,
              fontSize: p.size, pointerEvents: "none", zIndex: 10,
              filter: "drop-shadow(0 0 8px rgba(212,175,55,0.8))",
            }}
          >
            🪙
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Bottom content card */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          position: "relative", zIndex: 20,
          width: "100%", maxWidth: 480,
          padding: "0 22px max(44px,env(safe-area-inset-bottom,44px))",
          textAlign: "center",
        }}
      >
        {/* Joker label */}
        <motion.p
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.85)", letterSpacing: "0.22em", textTransform: "uppercase" }}
        >
          🃏 The Joker
        </motion.p>

        {/* Coin amount */}
        <AnimatePresence mode="wait">
          {!collected ? (
            <motion.div key="pre" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: 44, fontWeight: 900, color: "#d4af37", lineHeight: 1, textShadow: "0 0 40px rgba(212,175,55,0.6)" }}>
                +{coins}
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                {coins} <span style={{ color: "#d4af37" }}>🪙</span> {isFirst ? "Welcome Gift" : "Cashback Reward"}
              </p>
              <p style={{ margin: "0 0 22px", fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
                {isFirst
                  ? "The Joker deals you 20 coins to start the game."
                  : `8% back on your activity — the house always rewards its players.`}
              </p>
            </motion.div>
          ) : (
            <motion.div key="post" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: 44, fontWeight: 900, color: "#d4af37", lineHeight: 1 }}>✓</p>
              <p style={{ margin: "0 0 22px", fontSize: 14, color: "rgba(255,255,255,0.6)" }}>Coins added to your wallet</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collect button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={collect}
          disabled={collected}
          style={{
            width: "100%", height: 56, borderRadius: 18, border: "none",
            background: collected
              ? "rgba(212,175,55,0.15)"
              : "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
            color: collected ? "rgba(212,175,55,0.5)" : "#000",
            fontSize: 16, fontWeight: 900, cursor: collected ? "default" : "pointer",
            boxShadow: collected ? "none" : "0 4px 32px rgba(212,175,55,0.4)",
            letterSpacing: "0.04em", marginBottom: 12,
            transition: "all 0.3s",
          }}
        >
          {collected ? "Coins Collected 🃏" : `Collect ${coins} Coins`}
        </motion.button>

        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer" }}
        >
          Leave this one
        </button>
      </motion.div>
    </motion.div>
  );
}
