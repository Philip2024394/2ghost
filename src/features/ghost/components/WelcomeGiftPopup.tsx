import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function readCoins(): number  { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } }
function writeCoins(n: number) { try { localStorage.setItem("ghost_coins", String(Math.max(0, n))); } catch {} }

const GIFT_KEY = "ghost_welcome_gift_given";
export function markWelcomeGiftGiven(tier: string): void {
  try { localStorage.setItem(`${GIFT_KEY}_${tier}`, "1"); } catch {}
}
export function shouldShowWelcomeGift(tier: string): boolean {
  try { return localStorage.getItem(`${GIFT_KEY}_${tier}`) !== "1"; } catch { return false; }
}

type Gift = { emoji: string; name: string; coins: number };

const ROOM_GIFTS: Record<string, { gifts: Gift[]; color: string; label: string; icon: string }> = {
  standard: {
    label: "Standard Room", icon: "🛏️", color: "#a8a8b0",
    gifts: [
      { emoji: "🍎", name: "Welcome Fruit Bowl",    coins: 8  },
      { emoji: "🧴", name: "Complimentary Toiletries", coins: 7 },
    ],
  },
  suite: {
    label: "Ensuite", icon: "🛎️", color: "#cd7f32",
    gifts: [
      { emoji: "🍷", name: "House Red Wine",         coins: 12 },
      { emoji: "🍎", name: "Seasonal Fruit Bowl",    coins: 8  },
      { emoji: "🛁", name: "Luxury Bath Salts",      coins: 10 },
    ],
  },
  kings: {
    label: "The Casino", icon: "🎰", color: "#d4af37",
    gifts: [
      { emoji: "🥂", name: "Champagne on Arrival",  coins: 20 },
      { emoji: "🍷", name: "Premium Wine Selection", coins: 15 },
      { emoji: "🛁", name: "Gold Bath Set",          coins: 15 },
    ],
  },
  penthouse: {
    label: "Penthouse", icon: "🏙️", color: "#e0ddd8",
    gifts: [
      { emoji: "🥂", name: "Dom Pérignon",           coins: 25 },
      { emoji: "👘", name: "Cashmere Bathrobe",      coins: 20 },
      { emoji: "🌹", name: "Fresh Rose Arrangement", coins: 20 },
      { emoji: "🍫", name: "Artisan Chocolates",     coins: 15 },
    ],
  },
  cellar: {
    label: "The Cellar", icon: "🕯️", color: "#9b1c1c",
    gifts: [
      { emoji: "🍷", name: "Aged Reserve Wine",      coins: 20 },
      { emoji: "🕯️", name: "Candlelit Welcome Set",  coins: 15 },
      { emoji: "🔐", name: "Vault Access Token",     coins: 25 },
    ],
  },
};

export default function WelcomeGiftPopup({
  tier, onCollect,
}: {
  tier: string;
  onCollect: () => void;
}) {
  const room = ROOM_GIFTS[tier] ?? ROOM_GIFTS.standard;
  const total = room.gifts.reduce((s, g) => s + g.coins, 0);
  const [collected, setCollected] = useState(false);
  const isDark = ["#d4af37", "#e0ddd8", "#a8a8b0"].includes(room.color);

  function handleCollect() {
    if (collected) return;
    setCollected(true);
    const next = readCoins() + total;
    writeCoins(next);
    markWelcomeGiftGiven(tier);
    setTimeout(onCollect, 900);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 620, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 18px" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        style={{ width: "100%", maxWidth: 380, background: "rgba(5,4,2,0.99)", borderRadius: 26, border: `1px solid ${room.color}30`, overflow: "hidden", boxShadow: `0 0 80px ${room.color}15, 0 28px 70px rgba(0,0,0,0.75)` }}
      >
        <div style={{ height: 4, background: `linear-gradient(90deg, transparent, ${room.color}cc, #fff8, ${room.color}cc, transparent)` }} />

        <div style={{ padding: "22px 22px 0", textAlign: "center" }}>
          <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 800, color: `${room.color}77`, letterSpacing: "0.22em", textTransform: "uppercase" }}>Ghost House · Welcome Gift</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "12px 0 8px" }}>
            <div style={{ height: 1, flex: 1, background: `linear-gradient(to right, transparent, ${room.color}35)` }} />
            <span style={{ fontSize: 28 }}>{room.icon}</span>
            <div style={{ height: 1, flex: 1, background: `linear-gradient(to left, transparent, ${room.color}35)` }} />
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 900, color: room.color }}>{room.label}</p>
          <p style={{ margin: "0 0 18px", fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
            We've prepared a few things for your room
          </p>
        </div>

        <div style={{ padding: "0 22px 20px" }}>
          {/* Gift items */}
          <div style={{ background: `${room.color}08`, border: `1px solid ${room.color}20`, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
            {room.gifts.map((gift, i) => (
              <motion.div
                key={gift.name}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.12, type: "spring", stiffness: 300, damping: 24 }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderBottom: i < room.gifts.length - 1 ? `1px solid ${room.color}15` : "none" }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{gift.emoji}</span>
                <p style={{ margin: 0, flex: 1, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{gift.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10 }}>🪙</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: "#ffd700" }}>+{gift.coins}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Total */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 + room.gifts.length * 0.12 + 0.1 }}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 12, marginBottom: 16 }}
          >
            <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>Total welcome coins</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 14 }}>🪙</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#ffd700" }}>+{total}</span>
            </div>
          </motion.div>

          {/* Collect button */}
          <AnimatePresence mode="wait">
            {!collected ? (
              <motion.button
                key="collect"
                whileTap={{ scale: 0.97 }}
                onClick={handleCollect}
                style={{ width: "100%", height: 50, borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${room.color}dd, ${room.color}99)`, color: isDark ? "#0a0700" : "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 22px ${room.color}35`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <span style={{ fontSize: 16 }}>🎁</span>
                Collect Your Welcome Gift
              </motion.button>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ width: "100%", height: 50, borderRadius: 14, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <span style={{ fontSize: 16 }}>✅</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#4ade80" }}>+{total} coins added to your account</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${room.color}25, transparent)` }} />
      </motion.div>
    </motion.div>
  );
}
