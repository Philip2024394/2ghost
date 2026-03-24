// ── LoungeAvatar ──────────────────────────────────────────────────────────────
// Animated circular avatar with online status dot.
// Extracted from BreakfastLoungePage to be shared across lounge components.

import { motion } from "framer-motion";
import { LoungeProfile, avCol } from "./loungeData";

interface Props {
  p: LoungeProfile;
  size?: number;
  border?: string;
  status?: "available" | "at-table";
}

export default function LoungeAvatar({ p, size = 48, border, status }: Props) {
  const ringColor = status === "at-table" ? "#f97316" : status === "available" ? "#22c55e" : avCol(p.seed);
  const dotSize   = Math.max(8, size * 0.18);
  return (
    <div style={{ width: size, height: size, flexShrink: 0, position: "relative" }}>
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden",
        border: border ?? `2px solid ${ringColor}`, boxSizing: "border-box" }}>
        <img src={p.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      {status && (
        <motion.div
          animate={{ opacity: [1, 0.25, 1], scale: [1, 1.2, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", bottom: 1, right: 1, width: dotSize, height: dotSize,
            borderRadius: "50%", background: ringColor,
            border: `${Math.max(1.5, size * 0.03)}px solid #08080e` }}
        />
      )}
    </div>
  );
}
