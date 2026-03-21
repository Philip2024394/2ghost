import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const ONBOARDING_KEY = "ghost_onboarding_v1_done";

export function hasSeenOnboarding(): boolean {
  try { return !!localStorage.getItem(ONBOARDING_KEY); } catch { return false; }
}

function markOnboardingDone() {
  try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
}

// ── Visual mockups ─────────────────────────────────────────────────────────────

function VisualGhostMode() {
  const a = useGenderAccent();
  return (
    <div style={{ position: "relative", width: 220, height: 220, margin: "0 auto" }}>
      {/* Profile cards stacked */}
      {[
        { rotate: -8, y: 10, x: -14, blur: true, z: 1 },
        { rotate: 4,  y: 4,  x: 12,  blur: true, z: 2 },
        { rotate: 0,  y: 0,  x: 0,   blur: false, z: 3 },
      ].map((card, i) => (
        <div key={i} style={{
          position: "absolute", top: "50%", left: "50%",
          transform: `translate(-50%, -50%) translate(${card.x}px, ${card.y}px) rotate(${card.rotate}deg)`,
          width: 120, height: 155, borderRadius: 18,
          background: card.blur
            ? "rgba(255,255,255,0.04)"
            : `linear-gradient(160deg, ${a.glow(0.12)}, ${a.glowMid(0.06)})`,
          border: card.blur
            ? "1px solid rgba(255,255,255,0.07)"
            : `1px solid ${a.glow(0.3)}`,
          zIndex: card.z,
          backdropFilter: card.blur ? "blur(6px)" : "none",
          overflow: "hidden",
          boxShadow: card.blur ? "none" : "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {/* Blurred face */}
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            width: 52, height: 52, borderRadius: "50%",
            background: card.blur
              ? "rgba(255,255,255,0.08)"
              : `linear-gradient(135deg, ${a.glow(0.3)}, ${a.glowMid(0.15)})`,
            filter: card.blur ? "blur(4px)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {!card.blur && <span style={{ fontSize: 22 }}>👻</span>}
          </div>
          {/* Name bar */}
          <div style={{
            position: "absolute", bottom: 16, left: 10, right: 10,
          }}>
            <div style={{
              height: 8, borderRadius: 4, marginBottom: 5,
              background: card.blur ? "rgba(255,255,255,0.06)" : a.glow(0.4),
              filter: card.blur ? "blur(3px)" : "none",
              width: card.blur ? "70%" : "85%",
            }} />
            <div style={{
              height: 6, borderRadius: 3, width: "50%",
              background: card.blur ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.2)",
              filter: card.blur ? "blur(3px)" : "none",
            }} />
          </div>
        </div>
      ))}
      {/* Ghost badge */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        style={{
          position: "absolute", bottom: 14, right: 14, zIndex: 10,
          width: 36, height: 36, borderRadius: "50%",
          background: a.glow(0.15),
          border: `1px solid ${a.glow(0.4)}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
        }}
      >👻</motion.div>
    </div>
  );
}

function VisualGhostRoom() {
  const a = useGenderAccent();
  return (
    <div style={{ position: "relative", width: 220, height: 220, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Phone frame */}
      <div style={{
        width: 110, height: 190, borderRadius: 22,
        background: "rgba(8,8,14,0.95)",
        border: "2px solid rgba(255,255,255,0.12)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        overflow: "hidden", position: "relative", flexShrink: 0,
      }}>
        {/* Status bar */}
        <div style={{ height: 14, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 28, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>
        {/* Lock icon header */}
        <div style={{ padding: "8px 10px 6px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: 11 }}>🔑</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#d4af37" }}>Gold Room</span>
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: a.accent }}
          />
        </div>
        {/* Photo grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, padding: 6 }}>
          {[
            a.glow(0.15),
            "rgba(212,175,55,0.15)",
            a.glow(0.1),
            "rgba(168,85,247,0.12)",
          ].map((bg, i) => (
            <div key={i} style={{
              height: 38, borderRadius: 8, background: bg,
              border: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>
              {["🌸", "📸", "🎬", "✨"][i]}
            </div>
          ))}
        </div>
        {/* Delete strip */}
        <div style={{ margin: "4px 6px 0", padding: "5px 8px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 9 }}>🗑</span>
          <span style={{ fontSize: 8, color: "rgba(239,68,68,0.7)", fontWeight: 700 }}>Auto-delete on</span>
        </div>
      </div>
      {/* Lock overlay badge */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={{
          position: "absolute", top: 18, right: 18,
          width: 40, height: 40, borderRadius: "50%",
          background: "rgba(212,175,55,0.15)",
          border: "1.5px solid rgba(212,175,55,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}
      >🔒</motion.div>
    </div>
  );
}

function VisualButler() {
  const a = useGenderAccent();
  return (
    <div style={{ position: "relative", width: 220, height: 220, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* Arrow path */}
      <svg width="200" height="80" style={{ position: "absolute", top: 40 }} viewBox="0 0 200 80">
        <motion.path
          d="M 30 60 Q 100 10 170 60"
          stroke={a.glow(0.3)}
          strokeWidth="1.5"
          strokeDasharray="6 4"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1 }}
        />
        <motion.polygon
          points="164,55 174,60 164,65"
          fill={a.glow(0.5)}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1, times: [0, 0.7, 0.9, 1] }}
        />
      </svg>

      {/* Person A (sender) */}
      <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: `linear-gradient(135deg, ${a.glow(0.2)}, ${a.glowMid(0.1)})`,
          border: `1.5px solid ${a.glow(0.3)}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4,
        }}>👻</div>
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>You</span>
      </div>

      {/* Gift box floating in the middle */}
      <motion.div
        animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        style={{
          width: 44, height: 44, borderRadius: 12,
          background: "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))",
          border: "1.5px solid rgba(212,175,55,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, zIndex: 2,
          boxShadow: "0 4px 20px rgba(212,175,55,0.2)",
        }}
      >🎁</motion.div>

      {/* Person B (receiver) */}
      <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", textAlign: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(168,85,247,0.2), rgba(139,92,246,0.1))",
          border: "1.5px solid rgba(168,85,247,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4,
          filter: "blur(1.5px)",
        }}>😊</div>
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>Her</span>
      </div>

      {/* No address label */}
      <div style={{
        position: "absolute", bottom: 18,
        background: a.glow(0.08), border: `1px solid ${a.glow(0.2)}`,
        borderRadius: 20, padding: "4px 10px",
        display: "flex", alignItems: "center", gap: 5,
      }}>
        <span style={{ fontSize: 9 }}>🚫</span>
        <span style={{ fontSize: 9, color: a.glow(0.8), fontWeight: 700 }}>No address needed</span>
      </div>
    </div>
  );
}

// ── Slides ─────────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    visual:   <VisualGhostMode />,
    emoji:    "👻",
    tag:      "Ghost Mode",
    heading:  "Privacy From\nthe first Second",
    body:     "2Ghost will never display your real name to anyone searching unless your connection is real. You control your privacy until you decide when to share. Total privacy from the first second.",
    accent:   "#4ade80",
    accentBg: "rgba(74,222,128,0.1)",
    accentBorder: "rgba(74,222,128,0.25)",
  },
  {
    visual:   <VisualGhostRoom />,
    emoji:    "🔑",
    tag:      "Ghost Room",
    heading:  "Your Private\nMedia Vault",
    body:     "Share photos and videos inside a locked room. Auto-delete keeps everything off their camera roll. Only your match can enter.",
    accent:   "#d4af37",
    accentBg: "rgba(212,175,55,0.1)",
    accentBorder: "rgba(212,175,55,0.3)",
  },
  {
    visual:   <VisualButler />,
    emoji:    "🎁",
    tag:      "Ghost Butler",
    heading:  "Send a Surprise\nWithout Sharing",
    body:     "Order a gift, flowers, or food to someone you like — without exchanging addresses or phone numbers. Real magic.",
    accent:   "#a78bfa",
    accentBg: "rgba(167,139,250,0.1)",
    accentBorder: "rgba(167,139,250,0.25)",
  },
];

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  onDone: () => void;
}

export default function GhostOnboarding({ onDone }: Props) {
  const a = useGenderAccent();
  const [slide, setSlide] = useState(0);
  const [dir,   setDir]   = useState(1); // 1 = forward, -1 = back

  const _current = SLIDES[slide];
  const current = slide === 0
    ? { ..._current, accent: a.accent, accentBg: a.glow(0.1), accentBorder: a.glow(0.25) }
    : _current;
  const isLast  = slide === SLIDES.length - 1;

  const go = (next: number) => {
    setDir(next > slide ? 1 : -1);
    setSlide(next);
  };

  const finish = () => {
    markOnboardingDone();
    onDone();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "#050508",
        display: "flex", flexDirection: "column",
        alignItems: "center",
        padding: "0 24px max(40px, env(safe-area-inset-bottom, 40px))",
        paddingTop: "max(20px, env(safe-area-inset-top, 20px))",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div style={{ width: "100%", maxWidth: 420, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === slide ? 22 : 6, background: i === slide ? current.accent : "rgba(255,255,255,0.15)" }}
              transition={{ duration: 0.3 }}
              style={{ height: 6, borderRadius: 3 }}
            />
          ))}
        </div>
        <button
          onClick={finish}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "4px 0" }}
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div style={{ flex: 1, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide}
            custom={dir}
            initial={{ opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -60 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 0 }}
          >
            {/* Visual */}
            <div style={{ marginBottom: 28 }}>
              {current.visual}
            </div>

            {/* Tag pill */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: current.accentBg,
              border: `1px solid ${current.accentBorder}`,
              borderRadius: 20, padding: "5px 14px", marginBottom: 16,
            }}>
              <span style={{ fontSize: 13 }}>{current.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: current.accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>{current.tag}</span>
            </div>

            {/* Heading */}
            <h2 style={{
              fontSize: 30, fontWeight: 900, color: "#fff",
              lineHeight: 1.1, letterSpacing: "-0.02em",
              margin: "0 0 14px", whiteSpace: "pre-line",
            }}>
              {current.heading}
            </h2>

            {/* Body */}
            <p style={{
              fontSize: 14, color: "rgba(255,255,255,0.5)",
              lineHeight: 1.65, margin: 0, maxWidth: 320,
            }}>
              {current.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 10 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => isLast ? finish() : go(slide + 1)}
          style={{
            width: "100%", height: 52, borderRadius: 50, border: "none",
            background: `linear-gradient(135deg, ${current.accent}, ${current.accent}bb)`,
            color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer",
            boxShadow: `0 8px 28px ${current.accentBg}`,
            transition: "background 0.3s",
          }}
        >
          {isLast ? "Get Started →" : "Next →"}
        </motion.button>

        {/* Back dot */}
        {slide > 0 && (
          <button
            onClick={() => go(slide - 1)}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, cursor: "pointer", padding: "2px 0", fontWeight: 600 }}
          >
            ← Back
          </button>
        )}
      </div>
    </motion.div>
  );
}
