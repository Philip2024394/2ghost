import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoins } from "../hooks/useCoins";
import CoinWalletSheet from "./CoinWalletSheet";

interface Props {
  /** If true, tapping opens the wallet sheet */
  tappable?: boolean;
  size?: "sm" | "md";
}

export default function CoinBalanceChip({ tappable = true, size = "md" }: Props) {
  const { balance } = useCoins();
  const [open, setOpen] = useState(false);

  const fontSize   = size === "sm" ? 11  : 14;
  const iconSize   = size === "sm" ? 12  : 16;
  const padH       = size === "sm" ? 10  : 14;
  const padV       = size === "sm" ? 4   : 6;

  return (
    <>
      <motion.button
        whileTap={tappable ? { scale: 0.93 } : {}}
        onClick={tappable ? () => setOpen(true) : undefined}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(212,175,55,0.12)",
          border: "1px solid rgba(212,175,55,0.32)",
          borderRadius: 20,
          padding: `${padV}px ${padH}px`,
          cursor: tappable ? "pointer" : "default",
        }}
      >
        <span style={{ fontSize: iconSize, lineHeight: 1 }}>🪙</span>
        <span style={{ fontSize, fontWeight: 900, color: "#d4af37", letterSpacing: "0.02em" }}>
          {balance.toLocaleString()}
        </span>
      </motion.button>

      <AnimatePresence>
        {open && <CoinWalletSheet onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
