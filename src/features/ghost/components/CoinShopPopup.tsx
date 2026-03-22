import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function readCoins(): number  { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } }
function writeCoins(n: number) { try { localStorage.setItem("ghost_coins", String(Math.max(0, n))); } catch {} }

const PACKS = [
  { id: "starter", emoji: "🪙", label: "Starter",    coins: 50,  price: "$0.99",  popular: false, bonus: "" },
  { id: "popular", emoji: "💰", label: "Popular",    coins: 150, price: "$2.49",  popular: true,  bonus: "+20 bonus" },
  { id: "value",   emoji: "💎", label: "Best Value", coins: 350, price: "$4.99",  popular: false, bonus: "+75 bonus" },
  { id: "high",    emoji: "👑", label: "High Roller",coins: 750, price: "$9.99",  popular: false, bonus: "+200 bonus" },
];

export default function CoinShopPopup({ onClose }: { onClose: () => void }) {
  const [coins,    setCoins]    = useState(readCoins);
  const [buying,   setBuying]   = useState<string | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);

  function handleBuy(pack: typeof PACKS[number]) {
    if (buying) return;
    setBuying(pack.id);
    setTimeout(() => {
      const next = readCoins() + pack.coins;
      writeCoins(next);
      setCoins(next);
      setBuying(null);
      setJustBought(pack.id);
      setTimeout(() => setJustBought(null), 2200);
    }, 1300);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(5,4,2,0.99)", borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,215,0,0.2)", borderBottom: "none", overflow: "hidden", boxShadow: "0 -8px 60px rgba(255,215,0,0.1)" }}
      >
        {/* Stripe */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #ffd700, #fff8, #ffd700, transparent)" }} />

        <div style={{ padding: "20px 20px max(24px,env(safe-area-inset-bottom,24px))" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#fff" }}>🪙 Ghost Coin Shop</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Use coins for Vault messages, gifts &amp; room service</p>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>✕</span>
            </button>
          </div>

          {/* Balance */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <motion.div
              animate={{ scale: justBought ? [1, 1.12, 1] : 1 }}
              transition={{ duration: 0.4 }}
              style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.25)", borderRadius: 20, padding: "6px 16px", display: "flex", alignItems: "center", gap: 6 }}
            >
              <span style={{ fontSize: 14 }}>🪙</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#ffd700" }}>{coins} coins</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>your balance</span>
            </motion.div>
          </div>

          {/* Packs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {PACKS.map(pack => {
              const isBuying   = buying === pack.id;
              const isBought   = justBought === pack.id;
              return (
                <motion.button
                  key={pack.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleBuy(pack)}
                  style={{ position: "relative", padding: "16px 12px", borderRadius: 16, border: `1.5px solid ${pack.popular ? "rgba(255,215,0,0.5)" : "rgba(255,255,255,0.1)"}`, background: pack.popular ? "rgba(255,215,0,0.08)" : "rgba(255,255,255,0.04)", cursor: buying ? "default" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, overflow: "hidden" }}
                >
                  {pack.popular && (
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, #ffd700, #ffed4a)", padding: "3px 0", textAlign: "center" }}>
                      <span style={{ fontSize: 8, fontWeight: 900, color: "#0a0700", letterSpacing: "0.1em" }}>MOST POPULAR</span>
                    </div>
                  )}
                  <span style={{ fontSize: 28, marginTop: pack.popular ? 10 : 0 }}>{isBought ? "✅" : pack.emoji}</span>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>{pack.coins} coins</p>
                  {pack.bonus && <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "#ffd700" }}>{pack.bonus}</p>}
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{pack.label}</p>
                  <motion.div
                    animate={isBuying ? { opacity: [1, 0.5, 1] } : {}}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    style={{ width: "100%", padding: "6px 0", borderRadius: 10, background: isBought ? "rgba(74,222,128,0.2)" : pack.popular ? "linear-gradient(135deg, #ffd700, #ffb300)" : "rgba(255,255,255,0.1)", textAlign: "center" }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 900, color: isBought ? "#4ade80" : pack.popular ? "#0a0700" : "#fff" }}>
                      {isBought ? "Added!" : isBuying ? "Processing…" : pack.price}
                    </span>
                  </motion.div>
                </motion.button>
              );
            })}
          </div>

          <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
            Coins never expire · Used for Vault chats, gifts &amp; room service
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
