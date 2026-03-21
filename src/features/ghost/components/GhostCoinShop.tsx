import { useState } from "react";
import { motion } from "framer-motion";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const COIN_PACKS = [
  { coins: 200,  bonus: 0,   price: "$1.99",  label: "Starter",  popular: false },
  { coins: 500,  bonus: 50,  price: "$3.99",  label: "Popular",  popular: true  },
  { coins: 1200, bonus: 200, price: "$7.99",  label: "Ghost Pro",popular: false },
  { coins: 3000, bonus: 600, price: "$17.99", label: "Elite",    popular: false },
] as const;

const WHAT_COINS_UNLOCK = [
  { emoji: "🥂", label: "Virtual drink for a lobby guest",    coins: 5    },
  { emoji: "🌹", label: "Send a rose",                        coins: 15   },
  { emoji: "🎁", label: "Send a surprise gift",               coins: 25   },
  { emoji: "🔓", label: "Connect with a match",               coins: 300  },
  { emoji: "🏨", label: "Ghost Suite room upgrade",           coins: 500  },
  { emoji: "🌍", label: "List in other countries",            coins: 800  },
  { emoji: "🎩", label: "Butler real-world gift pack",        coins: 800  },
  { emoji: "⚡", label: "24-hour profile boost",              coins: 100  },
];

export default function GhostCoinShop({
  coinBalance, onClose, onAddCoins,
}: {
  coinBalance: number;
  onClose: () => void;
  onAddCoins: (amount: number) => void;
}) {
  const a = useGenderAccent();
  const [buying, setBuying]       = useState<number | null>(null);
  const [justBought, setJustBought] = useState<number | null>(null);

  const handleBuy = (pack: typeof COIN_PACKS[number]) => {
    if (buying !== null) return;
    setBuying(pack.coins);
    setTimeout(() => {
      onAddCoins(pack.coins + pack.bonus);
      setBuying(null);
      setJustBought(pack.coins);
      setTimeout(() => setJustBought(null), 2500);
    }, 1600);
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
                const isBuying   = buying === pack.coins;
                const boughtThis = justBought === pack.coins;
                return (
                  <motion.button
                    key={pack.coins}
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
                    {pack.popular && (
                      <div style={{ position: "absolute", top: 9, right: 9, background: "#d4af37", borderRadius: 5, padding: "2px 7px", fontSize: 8, fontWeight: 900, color: "#000", letterSpacing: "0.08em" }}>POPULAR</div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🪙</div>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>
                          {(pack.coins + pack.bonus).toLocaleString()} coins
                        </p>
                        {pack.bonus > 0 && (
                          <p style={{ fontSize: 10, color: "#d4af37", margin: "1px 0 0", fontWeight: 700 }}>
                            {pack.coins.toLocaleString()} + {pack.bonus} bonus free
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
