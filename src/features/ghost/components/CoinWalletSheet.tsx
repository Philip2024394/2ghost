import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useCoins, readTransactions } from "../hooks/useCoins";

// ── Coin pack definitions ─────────────────────────────────────────────────────
const PACKS = [
  {
    id: "starter",
    coins: 100,
    price: "$0.99",
    label: "Starter Stack",
    icon: "🪙",
    bonus: 0,
    color: "#c0c0c0",
    gradient: "linear-gradient(135deg, #707070, #c0c0c0)",
    popular: false,
    note: "Good for 1 gift send",
  },
  {
    id: "popular",
    coins: 500,
    price: "$3.99",
    label: "Popular Stack",
    icon: "💰",
    bonus: 50,
    color: "#d4af37",
    gradient: "linear-gradient(135deg, #92660a, #d4af37, #f5e88a)",
    popular: true,
    note: "Most popular · 50 bonus coins",
  },
  {
    id: "big",
    coins: 1200,
    price: "$7.99",
    label: "High Roller",
    icon: "💎",
    bonus: 200,
    color: "#a78bfa",
    gradient: "linear-gradient(135deg, #4c1d95, #7c3aed, #a78bfa)",
    popular: false,
    note: "200 bonus coins included",
  },
  {
    id: "whale",
    coins: 3000,
    price: "$14.99",
    label: "The Vault",
    icon: "🏦",
    bonus: 750,
    color: "#f87171",
    gradient: "linear-gradient(135deg, #991b1b, #dc2626, #f87171)",
    popular: false,
    note: "750 bonus coins · best value",
  },
];

// What coins buy — shown as context below the packs
const SPEND_GUIDE = [
  { icon: "🎁", label: "Send a gift",         cost: 10 },
  { icon: "🔓", label: "Unlock a match",      cost: 25 },
  { icon: "🏙️", label: "Penthouse tonight",  cost: 100 },
  { icon: "🍷", label: "The Cellar (24hr)",   cost: 150 },
  { icon: "⚡", label: "Profile boost (1hr)",  cost: 40 },
  { icon: "🌆", label: "Browse another city", cost: 50 },
];

type Tab = "buy" | "history";

export default function CoinWalletSheet({ onClose }: { onClose: () => void }) {
  const { balance, purchaseCoins } = useCoins();
  const [tab, setTab]         = useState<Tab>("buy");
  const [buying, setBuying]   = useState<string | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);
  const transactions = readTransactions();

  function handleBuy(pack: typeof PACKS[0]) {
    if (buying) return;
    setBuying(pack.id);
    // Simulate payment processing delay
    setTimeout(() => {
      purchaseCoins(pack.coins + pack.bonus, pack.label);
      setBuying(null);
      setJustBought(pack.id);
      setTimeout(() => setJustBought(null), 2500);
    }, 1200);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 800,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(6,6,10,0.99)", borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none",
          maxHeight: "92dvh", display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Gold top stripe */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #d4af37, transparent)", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24 }}>🪙</span>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>Coin Wallet</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Spend coins across the hotel</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Balance chip */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)",
                borderRadius: 20, padding: "6px 14px",
              }}>
                <span style={{ fontSize: 14 }}>🪙</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: "#d4af37" }}>
                  {balance.toLocaleString()}
                </span>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginTop: 14, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>
            {(["buy", "history"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, height: 34, borderRadius: 9, border: "none", cursor: "pointer",
                background: tab === t ? "rgba(212,175,55,0.18)" : "transparent",
                color: tab === t ? "#d4af37" : "rgba(255,255,255,0.35)",
                fontSize: 12, fontWeight: 800,
                transition: "all 0.15s",
              }}>
                {t === "buy" ? "🪙 Buy Coins" : "📋 History"}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px calc(env(safe-area-inset-bottom,0px)+24px)" }}>

          {tab === "buy" ? (
            <>
              {/* Packs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {PACKS.map(pack => {
                  const isActive  = buying === pack.id;
                  const isDone    = justBought === pack.id;
                  return (
                    <motion.button
                      key={pack.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleBuy(pack)}
                      disabled={!!buying}
                      style={{
                        width: "100%", borderRadius: 16, border: `1px solid ${pack.color}30`,
                        background: `${pack.color}08`, cursor: buying ? "default" : "pointer",
                        padding: "14px 16px", textAlign: "left", position: "relative", overflow: "hidden",
                        boxShadow: pack.popular ? `0 0 20px ${pack.color}20` : "none",
                        outline: pack.popular ? `1px solid ${pack.color}40` : "none",
                      }}
                    >
                      {/* Background shimmer for popular */}
                      {pack.popular && (
                        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${pack.color}06, transparent)`, pointerEvents: "none" }} />
                      )}

                      {pack.popular && (
                        <div style={{
                          position: "absolute", top: 10, right: 12,
                          fontSize: 8, fontWeight: 900, padding: "2px 8px", borderRadius: 10,
                          background: pack.gradient, color: "#0a0700", letterSpacing: "0.08em",
                        }}>MOST POPULAR</div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                          background: `${pack.color}18`, border: `1px solid ${pack.color}35`,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                        }}>
                          {isDone ? "✅" : pack.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: pack.color }}>{pack.label}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{pack.note}</p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>
                            🪙 {(pack.coins + pack.bonus).toLocaleString()}
                          </p>
                          {isDone ? (
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#4ade80" }}>Added! ✓</p>
                          ) : isActive ? (
                            <motion.p animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.7, repeat: Infinity }}
                              style={{ margin: 0, fontSize: 11, color: pack.color }}>Processing…</motion.p>
                          ) : (
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,0.6)" }}>{pack.price}</p>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* What coins buy */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 12px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  What coins unlock
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {SPEND_GUIDE.map(g => (
                    <div key={g.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 15 }}>{g.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.6)", lineHeight: 1.3 }}>{g.label}</p>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#d4af37" }}>🪙 {g.cost}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* History tab */
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {transactions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <p style={{ fontSize: 32, marginBottom: 10 }}>🪙</p>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: 0 }}>No transactions yet</p>
                </div>
              ) : transactions.map(tx => {
                const isCredit = tx.amount > 0;
                const typeIcon: Record<string, string> = {
                  purchase: "💳", win: "🎰", spend: "💸", bonus: "🎁", refund: "↩️",
                };
                return (
                  <div key={tx.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12, padding: "10px 14px",
                  }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{typeIcon[tx.type] || "🪙"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{tx.description}</p>
                      <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                        {new Date(tx.ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 900, color: isCredit ? "#4ade80" : "#f87171", flexShrink: 0 }}>
                      {isCredit ? "+" : ""}{tx.amount.toLocaleString()} 🪙
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
