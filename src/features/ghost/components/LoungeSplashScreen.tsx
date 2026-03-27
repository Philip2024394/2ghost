// ── Lounge Splash Screen ───────────────────────────────────────────────────────
// Full-screen 5-second transition shown to both users after accepting breakfast invite.
// Auto-advances to the breakfast chat window.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const LOUNGE_IMG = "https://ik.imagekit.io/7grri5v7d/mmmmmdfgdsfgdfg.png";

type Props = {
  floorLabel: string;
  floorColor: string;
  floorIcon:  string;
  guestName:  string;
  onDone:     () => void;
};

export default function LoungeSplashScreen({ floorLabel, floorColor, floorIcon, guestName, onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const r = parseInt(floorColor.slice(1,3),16);
  const g = parseInt(floorColor.slice(3,5),16);
  const b = parseInt(floorColor.slice(5,7),16);
  const glow = (o: number) => `rgba(${r},${g},${b},${o})`;

  useEffect(() => {
    const duration = 5000; // 5 seconds
    const interval = 50;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      setProgress(elapsed / duration);
      if (elapsed >= duration) {
        clearInterval(timer);
        onDone();
      }
    }, interval);
    return () => clearInterval(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{ position: "fixed", inset: 0, zIndex: 9800, background: "#000" }}
    >
      {/* Background lounge image */}
      <motion.img
        src={LOUNGE_IMG} alt="The Lounge"
        initial={{ scale: 1.08 }} animate={{ scale: 1 }}
        transition={{ duration: 5, ease: "easeOut" }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Dark gradient overlay */}
      <div style={{ position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.55) 60%, rgba(6,6,15,0.95) 100%)" }} />

      {/* Glow pulse */}
      <motion.div
        animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2.5, repeat: Infinity }}
        style={{ position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at center, ${glow(0.2)} 0%, transparent 70%)` }} />

      {/* Content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "0 28px" }}>

        {/* Top icon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ marginBottom: 16 }}>
          <img src="https://ik.imagekit.io/7grri5v7d/ghjfghjfgj-removebg-preview.png?updatedAt=1774267493743" alt="" style={{ width: 144, height: 144, objectFit: "contain" }} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          style={{ margin: "0 0 8px", fontSize: 11, color: floorColor, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {floorLabel} · The Lounge
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          style={{ margin: "0 0 10px", fontSize: 32, fontWeight: 900, color: "#fff",
            textAlign: "center", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          Good morning
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
          style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.55)",
            textAlign: "center", lineHeight: 1.6 }}>
          {guestName} is joining you at the table.<br />Your butler has everything prepared.
        </motion.p>

        {/* Animated dots */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
          style={{ display: "flex", gap: 6, marginTop: 32 }}>
          {[0,1,2].map(i => (
            <motion.div key={i}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: floorColor }} />
          ))}
        </motion.div>

        {/* Breakfast Lounge CTA */}
        <motion.button
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}
          onClick={() => navigate("/breakfast-lounge")}
          style={{
            marginTop: 28, padding: "13px 28px", borderRadius: 14, cursor: "pointer",
            background: `linear-gradient(135deg, ${floorColor}, ${glow(0.8)})`,
            border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
            letterSpacing: "0.02em", boxShadow: `0 0 24px ${glow(0.4)}`,
          }}>
          🍳 Enter Breakfast Lounge
        </motion.button>
      </div>

      {/* Progress bar at bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
        background: "rgba(255,255,255,0.1)" }}>
        <motion.div
          style={{ height: "100%", background: `linear-gradient(90deg, ${floorColor}, ${glow(0.5)})`,
            width: `${progress * 100}%`, transition: "width 50ms linear" }} />
      </div>
    </motion.div>
  );
}
