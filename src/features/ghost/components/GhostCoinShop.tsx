import { useState } from "react";
import { motion } from "framer-motion";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

const COIN_PACKS = [
  { coins: 50,   price: "$4.99",  label: "Starter",    badge: null,           popular: false },
  { coins: 150,  price: "$9.99",  label: "Popular",    badge: "MOST POPULAR", popular: true  },
  { coins: 400,  price: "$19.99", label: "Best Value", badge: "BEST VALUE",   popular: false },
  { coins: 1000, price: "$39.99", label: "Ghost Black", badge: "GHOST BLACK",  popular: false },
] as const;

const POWER_UPS = [
  {
    key: "boost",
    emoji: "🚀",
    name: "Ghost Boost",
    desc: "Your profile at the top of every feed in your city for 24h",
    coins: 30,
    cta: "Activate Boost",
    storeKey: "ghost_boost_until",
    duration: 86400000,
  },
  {
    key: "spotlight",
    emoji: "✨",
    name: "Ghost Spotlight",
    desc: "Featured in the Pulse row for 48h",
    coins: 50,
    cta: "Get Spotlight",
    storeKey: "ghost_spotlight_until",
    duration: 172800000,
  },
  {
    key: "reveal",
    emoji: "👁",
    name: "Reveal Token",
    desc: "See who liked you — one reveal",
    coins: 20,
    cta: "Buy Reveal",
    storeKey: null,
    duration: 0,
  },
] as const;

const WHAT_COINS_UNLOCK = [
  { emoji: "🌹", label: "Send a rose",                        coins: 5    },
  { emoji: "🥂", label: "Virtual drink for a lobby guest",    coins: 8    },
  { emoji: "🎁", label: "Send a surprise gift",               coins: 25   },
  { emoji: "🔓", label: "Connect with a match",               coins: 300  },
  { emoji: "🏨", label: "Ghost Suite room upgrade",           coins: 500  },
  { emoji: "🌍", label: "List in other countries",            coins: 800  },
  { emoji: "🎩", label: "Butler real-world gift pack",        coins: 800  },
  { emoji: "⚡", label: "24-hour profile boost",              coins: 30   },
];

export default function GhostCoinShop({
  coinBalance, onClose, onAddCoins,
}: {
  coinBalance: number;
  onClose: () => void;
  onAddCoins: (amount: number) => void;
}) {
  const a = useGenderAccent();
  const [buying, setBuying] = useState<string | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);
  const [powerUpStates, setPowerUpStates] = useState<Record<string, "idle" | "buying" | "done">>({});

  const isFirstBuyer = (() => {
    try { return !localStorage.getItem("ghost_first_purchase_done"); } catch { return true; }
  })();

  const handleBuy = (pack: typeof COIN_PACKS[number]) => {
    if (buying !== null) return;
    setBuying(pack.label);
    setTimeout(() => {
      const bonus = isFirstBuyer ? pack.coins : 0;
      if (isFirstBuyer) {
        try { localStorage.setItem("ghost_first_purchase_done", "1"); } catch {}
      }
      onAddCoins(pack.coins + bonus);
      setBuying(null);
      setJustBought(pack.label);
      setTimeout(() => setJustBought(null), 2500);
    }, 1600);
  };

  const handlePowerUp = (pu: typeof POWER_UPS[number]) => {
    if ((powerUpStates[pu.key] ?? "idle") !== "idle") return;
    const current = (() => { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } })();
    if (current < pu.coins) return;
    setPowerUpStates(prev => ({ ...prev, [pu.key]: "buying" }));
    setTimeout(() => {
      const next = current - pu.coins;
      try { localStorage.setItem("ghost_coins", String(next)); } catch {}
      if (pu.storeKey) {
        try { localStorage.setItem(pu.storeKey, String(Date.now() + pu.duration)); } catch {}
      }
      onAddCoins(-pu.coins);
      setPowerUpStates(prev => ({ ...prev, [pu.key]: "done" }));
      setTimeout(() => setPowerUpStates(prev => ({ ...prev, [pu.key]: "idle" })), 2500);
    }, 1400);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(6,5,2,0.99)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(212,175,55,0.25)", borderBottom: "none",
          maxHeight: "92dvh", display: "flex", flexDirection: "column",
          boxShadow: "0 -12px 48px rgba(212,175,55,0.08)",
        }}
      >
        {/* Gold top bar */}
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2.5, repeat: Infinity }}
          style={{ height: 3, background: "linear-gradient(90deg, #92660a, #d4af37, #f0d060, #d4af37, #92660a)", borderRadius: "3px 3px 0 0", flexShrink: 0 }}
        />

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "none" } as React.CSSProperties}>
          <div style={{ padding: "18px 20px max(32px,env(safe-area-inset-bottom,32px))" }}>

            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(212,175,55,0.2)", margin: "0 auto 20px" }} />

            {/* Header row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 21, fontWeight: 900, color: "#d4af37", margin: 0 }}>🪙 Ghost Coins</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>Hotel credits · spend anywhere in the app</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 12, padding: "7px 12px" }}>
                <span style={{ fontSize: 16 }}>🪙</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: "#d4af37", fontVariantNumeric: "tabular-nums" }}>{coinBalance}</span>
              </div>
            </div>

            {/* First-time buyer bonus */}
            {isFirstBuyer && (
              <div style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 14, padding: "11px 15px", marginBottom: 18 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#4ade80", margin: "0 0 3px" }}>🎁 First purchase? You get DOUBLE coins</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>
                  Your first top-up is automatically doubled — one time only.
                </p>
              </div>
            )}

            {/* Free welcome callout */}
            <div style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 14, padding: "13px 15px", marginBottom: 22 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#d4af37", margin: "0 0 5px" }}>🎁 Welcome gift — 100 free coins</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.55 }}>
                We added <strong style={{ color: "#d4af37" }}>100 free coins</strong> to your account. Send 2 virtual gifts to lobby guests, or put them towards your first room upgrade.
              </p>
            </div>

            {/* Coin packs */}
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.25)", margin: "0 0 10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Top up coins</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
              {COIN_PACKS.map((pack) => {
                const isBuying = buying === pack.label;
                const boughtThis = justBought === pack.label;
                const showBonus = isFirstBuyer;
                return (
                  <motion.button
                    key={pack.label}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleBuy(pack)}
                    disabled={buying !== null}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: pack.popular ? "rgba(212,175,55,0.09)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${pack.popular ? "rgba(212,175,55,0.45)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 14, padding: "13px 15px", cursor: "pointer",
                      position: "relative", overflow: "hidden", textAlign: "left",
                    }}
                  >
                    {pack.badge && (
                      <div style={{ position: "absolute", top: 9, right: 9, background: pack.popular ? "#d4af37" : pack.badge === "GHOST BLACK" ? "#111" : "rgba(255,255,255,0.15)", borderRadius: 5, padding: "2px 7px", fontSize: 8, fontWeight: 900, color: pack.popular ? "#000" : pack.badge === "GHOST BLACK" ? "#d4af37" : "#fff", letterSpacing: "0.08em", border: pack.badge === "GHOST BLACK" ? "1px solid rgba(212,175,55,0.4)" : "none" }}>
                        {pack.badge}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🪙</div>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>
                          {showBonus ? (pack.coins * 2).toLocaleString() : pack.coins.toLocaleString()} coins
                          {showBonus && <span style={{ fontSize: 10, color: "#4ade80", marginLeft: 6, fontWeight: 700 }}>×2 🎁</span>}
                        </p>
                        {showBonus && (
                          <p style={{ fontSize: 10, color: "#d4af37", margin: "1px 0 0", fontWeight: 700 }}>
                            {pack.coins.toLocaleString()} + {pack.coins.toLocaleString()} bonus free
                          </p>
                        )}
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{pack.label}</p>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, marginLeft: 8 }}>
                      {boughtThis ? (
                        <span style={{ fontSize: 22, color: a.accent }}>✓</span>
                      ) : (
                        <div style={{
                          background: isBuying ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #92660a, #d4af37)",
                          borderRadius: 10, padding: "8px 14px",
                          minWidth: 58, textAlign: "center",
                        }}>
                          <p style={{ fontSize: 13, fontWeight: 900, color: isBuying ? "rgba(255,255,255,0.4)" : "#000", margin: 0 }}>
                            {isBuying ? "…" : pack.price}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Power-Ups section */}
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.25)", margin: "0 0 10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Power-Ups</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
              {POWER_UPS.map(pu => {
                const state = powerUpStates[pu.key] ?? "idle";
                const canAfford = coinBalance >= pu.coins;
                return (
                  <div key={pu.key} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "13px 15px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{pu.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>{pu.name}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "2px 0 0", lineHeight: 1.4 }}>{pu.desc}</p>
                      <p style={{ fontSize: 10, fontWeight: 800, color: "#d4af37", margin: "3px 0 0" }}>🪙 {pu.coins} coins</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handlePowerUp(pu)}
                      disabled={state !== "idle" || !canAfford}
                      style={{
                        flexShrink: 0, borderRadius: 10, padding: "8px 12px", border: "none", cursor: canAfford && state === "idle" ? "pointer" : "not-allowed",
                        background: state === "done" ? "rgba(74,222,128,0.15)" : canAfford ? "linear-gradient(135deg,#92660a,#d4af37)" : "rgba(255,255,255,0.06)",
                        fontSize: 10, fontWeight: 900, color: state === "done" ? "#4ade80" : canAfford ? "#000" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {state === "buying" ? "…" : state === "done" ? "Active ✓" : pu.cta}
                    </motion.button>
                  </div>
                );
              })}
            </div>

            {/* What coins unlock */}
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.25)", margin: "0 0 12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>What coins unlock</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
              {WHAT_COINS_UNLOCK.map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span style={{ fontSize: 16 }}>{item.emoji}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(212,175,55,0.75)", flexShrink: 0, marginLeft: 8 }}>🪙 {item.coins}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
