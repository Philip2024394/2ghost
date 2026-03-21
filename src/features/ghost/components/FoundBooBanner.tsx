import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fmtCountdown } from "../utils/ghostHelpers";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

// ── Found Boo Banner ────────────────────────────────────────────────────────
export default function FoundBooBanner({
  foundBoo,
  onReactivate,
}: {
  foundBoo: { matchProfileId: string; matchProfileImage: string; matchName: string; connectedAt: number; pausedUntil: number; canReactivateAt: number };
  onReactivate: () => void;
}) {
  const a = useGenderAccent();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  void tick;
  const canReactivate = Date.now() >= foundBoo.canReactivateAt;
  const remaining = foundBoo.pausedUntil - Date.now();

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -12, height: 0 }}
      style={{ margin: "10px 14px 0", overflow: "hidden" }}
    >
      <div style={{
        background: a.glow(0.05),
        border: `1px solid ${a.glow(0.3)}`,
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img
            src={foundBoo.matchProfileImage}
            alt={foundBoo.matchName}
            style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.5)}` }}
          />
          <img src={GHOST_LOGO} alt="ghost" style={{ position: "absolute", bottom: -4, right: -4, width: 54, height: 54, objectFit: "contain" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>Found Boo</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 6px", lineHeight: 1.4 }}>
            Your profile is paused — giving your new connection space
          </p>
          <p style={{ fontSize: 11, color: a.accent, fontWeight: 700, margin: 0 }}>
            Resumes in {fmtCountdown(remaining)}
          </p>
        </div>
        <button
          onClick={canReactivate ? onReactivate : undefined}
          style={{
            flexShrink: 0,
            height: 34, paddingInline: 12, borderRadius: 10, border: "none",
            background: canReactivate ? a.glow(0.2) : "rgba(255,255,255,0.06)",
            color: canReactivate ? `${a.accent}` : "rgba(255,255,255,0.2)",
            fontSize: 11, fontWeight: 800, cursor: canReactivate ? "pointer" : "default",
            whiteSpace: "nowrap",
          }}
        >
          {canReactivate ? "Reactivate" : "Early"}
        </button>
      </div>
    </motion.div>
  );
}
