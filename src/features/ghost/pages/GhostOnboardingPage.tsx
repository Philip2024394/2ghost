import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

const SLIDES = [
  {
    icon: "🔒",
    gradient: null, // gender-driven, set at render time
    border: null,   // gender-driven
    accent: null,   // gender-driven
    title: "Privacy From the first Second",
    subtitle: "Your real name is never exposed.",
    body: "2Ghost will never display your real name to anyone searching unless your connection is real. You control your privacy until you decide when to share. Total privacy from the first second.",
    detail: [
      "🔒 Hidden until you match",
      "📵 No social login required",
      "👻 Ghost ID protects your identity",
    ],
  },
  {
    icon: "🏨",
    gradient: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(180,140,20,0.05))",
    border: "rgba(212,175,55,0.2)",
    accent: "#d4af37",
    title: "Your Hotel Room",
    subtitle: "A private space just for you two.",
    body: "Every match gets a shared Room Vault — a secure private space to exchange photos, videos, and memory notes. Your moments, stored safely away from the world.",
    detail: [
      "🖼️ Share photos & videos privately",
      "💬 Leave memory notes",
      "🗑️ Auto-deletes — nothing permanent",
    ],
  },
  {
    icon: "⚡",
    gradient: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(217,119,6,0.05))",
    border: "rgba(251,191,36,0.2)",
    accent: "#fbbf24",
    title: "Hotel Lobby",
    subtitle: "Meet people free right now.",
    body: "Step into the Hotel Lobby when you're available to meet tonight. See who else is in the lobby at the same time. When two guests match — step out together.",
    detail: [
      "🏨 Real-time availability",
      "🔑 Room key for matched guests",
      "🌙 Tonight only — no lingering",
    ],
  },
  {
    icon: "🚪",
    gradient: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(185,28,28,0.04))",
    border: "rgba(239,68,68,0.18)",
    accent: "#f87171",
    title: "No Vacancy",
    subtitle: "You control who gets in.",
    body: "Not feeling it? Hang the No Vacancy sign. Block anyone from ever entering your space — they'll never know it's personal. You're the hotel manager.",
    detail: [
      "🚫 Silent block — no drama",
      "🏨 You decide every guest",
      "🔇 Blocked guests see a full hotel",
    ],
  },
  {
    icon: "💛",
    gradient: `linear-gradient(135deg, rgba(74,222,128,0.15), rgba(212,175,55,0.08))`,
    border: "rgba(74,222,128,0.2)",
    accent: "#4ade80",
    title: "Ghost Match",
    subtitle: "Real connections, zero pressure.",
    body: "When you're both ready, share your WhatsApp and step out of the hotel together. No algorithm, no swiping gallery — just two people choosing each other at the right moment.",
    detail: [
      "✅ Mutual grant before contact",
      "📱 WhatsApp connect when ready",
      "💜 2Ghost Soul Pack for close matches",
    ],
  },
];

const GHOST_IDS = ["Ghost#4821", "Ghost#7163", "Ghost#2094", "Ghost#5538", "Ghost#8847"];
const AVATARS = [
  "https://i.pravatar.cc/80?img=32",
  "https://i.pravatar.cc/80?img=47",
  "https://i.pravatar.cc/80?img=11",
];

function GhostIDVisual({ accent, glow }: { accent: string; glow: (o: number) => string }) {
  const [nameIdx, setNameIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cycle = () => {
      setVisible(false);
      setTimeout(() => {
        setNameIdx((i) => (i + 1) % GHOST_IDS.length);
        setVisible(true);
      }, 350);
    };
    const id = setInterval(cycle, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, padding: "14px 16px", background: "rgba(0,0,0,0.3)", borderRadius: 16, border: `1px solid ${glow(0.15)}` }}>
      {/* Avatar — blurred to suggest hidden identity */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <img
          src={AVATARS[nameIdx % AVATARS.length]}
          alt=""
          style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", filter: "blur(5px)", border: `2px solid ${glow(0.3)}` }}
        />
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>👻</div>
      </div>

      {/* Name block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 4px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Identity hidden
        </p>
        <motion.p
          animate={{ opacity: visible ? 1 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ fontSize: 15, fontWeight: 900, color: accent, margin: 0, letterSpacing: "0.04em", fontFamily: "monospace" }}
        >
          {GHOST_IDS[nameIdx]}
        </motion.p>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "3px 0 0" }}>
          Real name · · · · · · ·
        </p>
      </div>

      {/* Lock badge */}
      <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: glow(0.15), border: `1px solid ${glow(0.3)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
        🔒
      </div>
    </div>
  );
}

export default function GhostOnboardingPage() {
  const a = useGenderAccent();
  const navigate  = useNavigate();
  const [slide, setSlide]   = useState(0);
  const [dir, setDir]       = useState(1);
  const isLast = slide === SLIDES.length - 1;

  const go = (next: number) => {
    setDir(next > slide ? 1 : -1);
    setSlide(next);
  };

  const finish = () => {
    try { localStorage.setItem("ghost_onboarded", "1"); } catch {}
    navigate("/ghost/mode", { replace: true });
  };

  const _s = SLIDES[slide];
  const s = {
    ..._s,
    gradient: _s.gradient ?? a.gradientSubtle,
    border:   _s.border   ?? a.glow(0.25),
    accent:   _s.accent   ?? a.accent,
  };

  return (
    <div style={{
      minHeight: "100dvh", width: "100%",
      background: "#050508",
      display: "flex", flexDirection: "column",
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden",
    }}>

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "max(18px, env(safe-area-inset-top, 18px)) 20px 12px",
      }}>
        <img src={LOGO} alt="2Ghost" style={{ width: 32, height: 32, objectFit: "contain" }} />
        <button
          onClick={finish}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
        >
          Skip
        </button>
      </div>

      {/* Slide */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 22px", overflow: "hidden" }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 40 }),
              center: { opacity: 1, x: 0 },
              exit:  (d: number) => ({ opacity: 0, x: d * -40 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Feature card */}
            <div style={{
              background: s.gradient,
              border: `1px solid ${s.border}`,
              borderRadius: 24, padding: "28px 22px",
              marginBottom: 24,
            }}>
              {/* Ghost ID visual — only for slide 0 */}
              {slide === 0 && <GhostIDVisual accent={s.accent} glow={a.glow} />}
              <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>{s.icon}</div>
              <p style={{ fontSize: 11, fontWeight: 800, color: s.accent, letterSpacing: 1.5, margin: "0 0 8px", textTransform: "uppercase" }}>
                {s.subtitle}
              </p>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.2 }}>
                {s.title}
              </h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 20px", lineHeight: 1.75 }}>
                {s.body}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {s.detail.map((d) => (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{d.slice(0, 2)}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{d.slice(2).trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div style={{
        padding: "0 22px max(32px, env(safe-area-inset-bottom, 32px))",
      }}>
        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              style={{
                width: i === slide ? 20 : 6,
                height: 6, borderRadius: 3,
                background: i === slide ? s.accent : "rgba(255,255,255,0.15)",
                border: "none", cursor: "pointer", padding: 0,
                transition: "all 0.25s",
              }}
            />
          ))}
        </div>

        {/* CTA */}
        {isLast ? (
          <motion.button
            initial={{ scale: 0.97, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 }}
            onClick={finish}
            style={{
              width: "100%", border: "none", borderRadius: 16, padding: "16px 0",
              background: `linear-gradient(135deg,#16a34a,${a.accent})`,
              fontSize: 16, fontWeight: 900, color: "#000", cursor: "pointer",
              boxShadow: `0 0 32px ${a.glow(0.25)}`,
            }}
          >
            Enter Ghost Hotel →
          </motion.button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            {slide > 0 && (
              <button
                onClick={() => go(slide - 1)}
                style={{
                  flex: "0 0 52px", height: 52, borderRadius: 14,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)", fontSize: 18, cursor: "pointer",
                }}
              >←</button>
            )}
            <button
              onClick={() => go(slide + 1)}
              style={{
                flex: 1, height: 52, borderRadius: 14, border: "none",
                background: `${s.accent}18`,
                outline: `1px solid ${s.border}`,
                color: s.accent, fontSize: 14, fontWeight: 800, cursor: "pointer",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
