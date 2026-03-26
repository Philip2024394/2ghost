import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoins } from "../hooks/useCoins";
import CoinWalletSheet from "./CoinWalletSheet";

interface Props {
  tappable?: boolean;
  size?: "sm" | "md";
}

export default function CoinBalanceChip({ tappable = true, size = "md" }: Props) {
  const { balance } = useCoins();
  const [open, setOpen] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [flashing, setFlashing] = useState(false);
  const [awardAmount, setAwardAmount] = useState<number | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fontSize = size === "sm" ? 11  : 14;
  const iconSize = size === "sm" ? 12  : 16;
  const padH     = size === "sm" ? 10  : 14;
  const padV     = size === "sm" ? 4   : 6;

  // Keep display in sync normally
  useEffect(() => {
    if (!flashing) setDisplayBalance(balance);
  }, [balance, flashing]);

  // Listen for Joker coin award event — triggers count-up + flash
  useEffect(() => {
    function handleJokerAward(e: Event) {
      const amount = (e as CustomEvent<{ amount: number }>).detail.amount;
      setAwardAmount(amount);
      setFlashing(true);

      const start = balance;
      const end   = balance + amount;
      const steps = Math.min(amount, 30); // count up in steps
      const stepSize = Math.ceil(amount / steps);
      let current = start;

      if (countRef.current) clearInterval(countRef.current);
      countRef.current = setInterval(() => {
        current = Math.min(current + stepSize, end);
        setDisplayBalance(current);
        if (current >= end) {
          if (countRef.current) clearInterval(countRef.current);
          setTimeout(() => {
            setFlashing(false);
            setAwardAmount(null);
          }, 1200);
        }
      }, 50);
    }

    window.addEventListener("joker_coins_awarded", handleJokerAward);
    return () => {
      window.removeEventListener("joker_coins_awarded", handleJokerAward);
      if (countRef.current) clearInterval(countRef.current);
    };
  }, [balance]);

  return (
    <>
      <motion.button
        whileTap={tappable ? { scale: 0.93 } : {}}
        onClick={tappable ? () => setOpen(true) : undefined}
        animate={flashing ? {
          scale: [1, 1.18, 1, 1.14, 1],
          boxShadow: [
            "0 0 0px rgba(212,175,55,0)",
            "0 0 22px rgba(212,175,55,0.9)",
            "0 0 8px rgba(212,175,55,0.5)",
            "0 0 20px rgba(212,175,55,0.8)",
            "0 0 6px rgba(212,175,55,0.3)",
          ],
        } : {}}
        transition={{ duration: 0.6, repeat: flashing ? Infinity : 0, repeatType: "loop" }}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: flashing ? "rgba(212,175,55,0.22)" : "rgba(212,175,55,0.12)",
          border: flashing ? "1px solid rgba(212,175,55,0.7)" : "1px solid rgba(212,175,55,0.32)",
          borderRadius: 20,
          padding: `${padV}px ${padH}px`,
          cursor: tappable ? "pointer" : "default",
          transition: "background 0.2s, border-color 0.2s",
          position: "relative",
        }}
      >
        <motion.span
          animate={flashing ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: flashing ? Infinity : 0, repeatDelay: 0.3 }}
          style={{ fontSize: iconSize, lineHeight: 1 }}
        >
          🪙
        </motion.span>
        <span style={{ fontSize, fontWeight: 900, color: flashing ? "#f0d060" : "#d4af37", letterSpacing: "0.02em", transition: "color 0.2s" }}>
          {displayBalance.toLocaleString()}
        </span>

        {/* +N popup above chip */}
        <AnimatePresence>
          {awardAmount && (
            <motion.span
              key="award"
              initial={{ opacity: 0, y: 0, scale: 0.7 }}
              animate={{ opacity: 1, y: -28, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                fontSize: 12, fontWeight: 900, color: "#f0d060",
                background: "rgba(0,0,0,0.85)", borderRadius: 10,
                padding: "2px 8px", whiteSpace: "nowrap",
                pointerEvents: "none",
                textShadow: "0 0 10px rgba(212,175,55,0.8)",
              }}
            >
              +{awardAmount} 🃏
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && <CoinWalletSheet onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
