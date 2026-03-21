import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { useGhostMode } from "../hooks/useGhostMode";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

interface GhostModeSlideUpProps {
  onClose: () => void;
  onEnterGhost: () => void;
}

const GHOST_PERKS = [
  "Photo · Name · Age · City — nothing else shown",
  "Hidden from the live map completely",
  "Mutual like required before any contact",
  "Instant WhatsApp connect on match",
  "Invisible to regular 2dateme stack",
];

const BUNDLE_EXTRAS = [
  "Everything in Ghost Mode",
  "7 WhatsApp unlocks per month",
  "5 Super Likes per month",
  "VIP badge on your profile",
  "Save $5/mo vs buying separately",
];

export default function GhostModeSlideUp({ onClose, onEnterGhost }: GhostModeSlideUpProps) {
  const a = useGenderAccent();
  const { activate } = useGhostMode();

  const handleSubscribe = (plan: "ghost" | "bundle") => {
    activate(plan);
    onEnterGhost();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 9100,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 480,
            background: "rgba(8,8,12,0.96)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            borderRadius: "22px 22px 0 0",
            border: "1px solid rgba(255,255,255,0.08)",
            borderBottom: "none",
            overflow: "hidden",
          }}
        >
          {/* Top accent */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${a.accentMid}, ${a.accent}, #22c55e)` }} />

          <div style={{ padding: "20px 20px 32px" }}>
            {/* Close */}
            <button
              onClick={onClose}
              style={{
                position: "absolute", top: 16, right: 16,
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.5)",
              }}
            >
              <X size={14} />
            </button>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ lineHeight: 1, marginBottom: 8 }}><img src={GHOST_LOGO} alt="ghost" style={{ width: 132, height: 132, objectFit: "contain" }} /></div>
              <p style={{ fontSize: 10, fontWeight: 700, color: a.glow(0.8), letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 6px" }}>
                Introducing
              </p>
              <h2 style={{
                fontSize: 22, fontWeight: 900, margin: "0 0 6px",
                background: `linear-gradient(135deg, ${a.accent}, ${a.accentMid}, #86efac)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                2dateme Ghost Mode
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>
                Date privately. No bio. No trace. Match on instinct.
              </p>
            </div>

            {/* Plan cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Ghost Mode solo */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${a.glow(0.25)}`,
                borderRadius: 16, padding: "14px 16px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}><img src={GHOST_LOGO} alt="" style={{ width: 48, height: 48, objectFit: "contain", verticalAlign: "middle", marginRight: 6 }} /> Ghost Mode</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>Private dating — photo + name + age + city only</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: a.accent, margin: 0 }}>🪙 1,000</p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: 0 }}>coins/month</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                  {GHOST_PERKS.map((perk) => (
                    <div key={perk} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Check size={11} style={{ color: a.accent, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{perk}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleSubscribe("ghost")}
                  style={{
                    width: "100%", height: 42, borderRadius: 12, border: "none",
                    background: `linear-gradient(135deg, ${a.accentDark}, ${a.accentMid})`,
                    color: "#fff", fontWeight: 800, fontSize: 13,
                    cursor: "pointer",
                    boxShadow: `0 4px 20px ${a.glowMid(0.35)}`,
                  }}
                >
                  Start Ghost Mode — 🪙 1,000/mo
                </button>
              </div>

              {/* Bundle */}
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(236,72,153,0.35)",
                borderRadius: 16, padding: "14px 16px",
                position: "relative", overflow: "hidden",
              }}>
                {/* Best value badge */}
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  background: "rgba(236,72,153,0.9)", borderRadius: 6,
                  padding: "2px 7px", fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: "0.06em",
                }}>
                  BEST VALUE
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}><img src={GHOST_LOGO} alt="" style={{ width: 48, height: 48, objectFit: "contain", verticalAlign: "middle", marginRight: 6 }} /> Ghost + VIP</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>Everything — save 🪙 500/mo</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#f472b6", margin: 0 }}>🪙 1,500</p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: 0 }}>coins/month</p>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                  {BUNDLE_EXTRAS.map((perk) => (
                    <div key={perk} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Check size={11} style={{ color: "#f472b6", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{perk}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleSubscribe("bundle")}
                  style={{
                    width: "100%", height: 42, borderRadius: 12, border: "none",
                    background: "linear-gradient(135deg, #ec4899, #f472b6)",
                    color: "#fff", fontWeight: 800, fontSize: 13,
                    cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(236,72,153,0.35)",
                  }}
                >
                  Ghost + VIP Bundle — 🪙 1,500/mo
                </button>
              </div>
            </div>

            {/* Dismiss */}
            <button
              onClick={onClose}
              style={{
                display: "block", margin: "14px auto 0",
                background: "none", border: "none",
                color: "rgba(255,255,255,0.3)", fontSize: 12,
                cursor: "pointer",
              }}
            >
              Maybe later →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
