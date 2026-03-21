import { useRef } from "react";
import { motion } from "framer-motion";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

// ── Floating ghost particles ────────────────────────────────────────────────
export default function GhostParticles() {
  const particles = useRef(
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      left: 5 + Math.random() * 90,
      delay: Math.random() * 4,
      duration: 5 + Math.random() * 4,
      size: 10 + Math.random() * 14,
    }))
  ).current;
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0, opacity: 0.12 }}>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: "105%", opacity: 0.6 }}
          animate={{ y: "-10%", opacity: 0 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut", repeat: Infinity, repeatDelay: Math.random() * 3 }}
          style={{ position: "absolute", left: "${p.left}%", bottom: 0, display: "block" }}
        >
          <img src={GHOST_LOGO} alt="ghost" style={{ width: p.size * 3, height: p.size * 3, objectFit: "contain" }} />
        </motion.span>
      ))}
    </div>
  );
}
