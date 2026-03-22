import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { hasActiveWindowMode, getWindowModeUntil, startWindowMode, stopWindowMode } from "../utils/featureGating";

type Props = { onClose: () => void };

function fmt(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function GhostClockSheet({ onClose }: Props) {
  const a = useGenderAccent();
  const [active, setActive]   = useState(hasActiveWindowMode);
  const [remaining, setRemaining] = useState(() => Math.max(0, getWindowModeUntil() - Date.now()));

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const r = Math.max(0, getWindowModeUntil() - Date.now());
      setRemaining(r);
      if (r === 0) { setActive(false); }
    }, 1000);
    return () => clearInterval(id);
  }, [active]);

  function toggle() {
    if (active) {
      stopWindowMode();
      setActive(false);
      setRemaining(0);
    } else {
      startWindowMode();
      setActive(true);
      setRemaining(2 * 60 * 60 * 1000);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.86)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,10,0.99)", borderRadius: "24px 24px 0 0", border: `1px solid ${active ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`, borderBottom: "none", overflow: "hidden", transition: "border-color 0.3s" }}
      >
        <div style={{ height: 3, background: active ? "linear-gradient(90deg, transparent, #4ade80, transparent)" : `linear-gradient(90deg, transparent, ${a.accent}, transparent)`, transition: "background 0.3s" }} />
        <div style={{ padding: "20px 22px max(36px,env(safe-area-inset-bottom,36px))" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", margin: "0 auto 20px" }} />

          {/* Clock visual */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <motion.div
              animate={active ? { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: 52, marginBottom: 8 }}
            >
              🕐
            </motion.div>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: active ? "#4ade80" : "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              {active ? "Window Active" : "Ghost Clock"}
            </p>
            {active ? (
              <motion.p
                key={remaining}
                initial={{ scale: 1.05 }} animate={{ scale: 1 }}
                style={{ margin: 0, fontSize: 32, fontWeight: 900, color: "#4ade80", letterSpacing: "0.04em" }}
              >
                {fmt(remaining)}
              </motion.p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Open your window for 2 hours</p>
            )}
          </div>

          {/* Explanation */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 22, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🟢</span>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>
                When your window is open you appear with a <strong style={{ color: "#4ade80" }}>live pulse ring</strong> to other ghosts who are also in their window.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>⏱️</span>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>
                Your window lasts <strong style={{ color: "#fff" }}>2 hours</strong> then closes automatically. Open it when you're genuinely available right now.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>🔍</span>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>
                Use the <strong style={{ color: "#fff" }}>Window Only</strong> filter on the home screen to see only ghosts who are live right now.
              </p>
            </div>
          </div>

          {/* Toggle */}
          <motion.button
            whileTap={{ scale: 0.97 }} onClick={toggle}
            style={{
              width: "100%", height: 54, borderRadius: 16, border: "none", cursor: "pointer",
              background: active
                ? "linear-gradient(135deg, #065f46, #4ade80)"
                : a.gradient,
              color: "#fff", fontSize: 15, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: active ? "0 8px 24px rgba(74,222,128,0.35)" : `0 8px 24px ${a.glow(0.3)}`,
              transition: "all 0.3s",
            }}
          >
            {active ? (
              <><span style={{ fontSize: 18 }}>🔴</span> Close My Window</>
            ) : (
              <><span style={{ fontSize: 18 }}>🟢</span> Open My Window — 2 Hours</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
