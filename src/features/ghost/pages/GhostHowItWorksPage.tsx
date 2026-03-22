import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const SEEN_KEY = "ghost_how_it_works_seen";
export function markHowItWorksSeen() {
  try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
}
export function hasSeenHowItWorks(): boolean {
  try { return localStorage.getItem(SEEN_KEY) === "1"; } catch { return false; }
}

const SLIDES = [
  {
    emoji: "🏨",
    accent: "#d4af37",
    grad: "linear-gradient(135deg, #92660a 0%, #d4af37 60%, #f5e88a 100%)",
    bg: "linear-gradient(180deg, #0a0800 0%, #1a1200 100%)",
    border: "rgba(212,175,55,0.35)",
    glow: "rgba(212,175,55,0.25)",
    title: "Welcome to the Ghost House",
    subtitle: "Not just another dating app.",
    body: "Ghost is built like a hotel. You check into a Room that matches where you are in life — and everyone inside knows the vibe. No noise. No mismatches. Just the right people at the right level.",
    bullets: [
      "🏨 Four room tiers — Standard to Penthouse",
      "🎭 Anonymous Ghost ID — real name never shown",
      "🌍 City-based matching — your floor, your city",
    ],
  },
  {
    emoji: "🗝️",
    accent: "#c0c0c0",
    grad: "linear-gradient(135deg, #505050 0%, #c0c0c0 50%, #e8e8e8 100%)",
    bg: "linear-gradient(180deg, #080808 0%, #141414 100%)",
    border: "rgba(192,192,192,0.3)",
    glow: "rgba(192,192,192,0.15)",
    title: "Your Room = Your Level",
    subtitle: "One payment. In forever.",
    body: "Every room is a one-time entry — not a subscription. Pay once, stay as long as you want. Higher rooms unlock more power: more matches, more visibility, better tools. Your room shows on your profile card so others instantly know your level.",
    bullets: [
      "🛏️ Standard  — $4.99  · 2 match unlocks",
      "🏨 Suite      — $9.99  · 5 unlocks + boosts",
      "👑 Kings      — $11.99 · unlimited unlocks",
      "🏙️ Penthouse — $19.99 · everything, globally",
    ],
  },
  {
    emoji: "👻",
    accent: "#4ade80",
    grad: "linear-gradient(135deg, #14532d 0%, #22c55e 60%, #4ade80 100%)",
    bg: "linear-gradient(180deg, #020d05 0%, #051a08 100%)",
    border: "rgba(74,222,128,0.3)",
    glow: "rgba(74,222,128,0.2)",
    title: "Your Ghost ID Protects You",
    subtitle: "Be real — without being exposed.",
    body: "You are Ghost-XXXX. Your real name, phone, and social accounts are never shown to anyone. You decide when to reveal yourself. Until then, your Ghost ID is all anyone sees — and that's exactly how it should be.",
    bullets: [
      "🔒 Real name hidden from everyone",
      "📵 No Facebook or Google login needed",
      "✅ Reveal yourself only when you're ready",
      "🌐 Same ID across all floors and rooms",
    ],
  },
  {
    emoji: "🎁",
    accent: "#f472b6",
    grad: "linear-gradient(135deg, #831843 0%, #ec4899 60%, #f472b6 100%)",
    bg: "linear-gradient(180deg, #0d0208 0%, #1a0510 100%)",
    border: "rgba(244,114,182,0.3)",
    glow: "rgba(244,114,182,0.2)",
    title: "Gifts Speak Louder Than Swipes",
    subtitle: "Effort filters the right people in.",
    body: "Forget swiping into silence. On Ghost you send a gift with a personal opener note. It costs coins — which means every approach is intentional. No bots. No mass-messaging. Just real people making real effort.",
    bullets: [
      "🍸 Start with a free daily gift",
      "✍️ Every gift needs a personal note",
      "💎 Bigger gifts unlock faster attention",
      "💗 Mutual like → private Vault chat opens",
    ],
  },
  {
    emoji: "🪟",
    accent: "#d4af37",
    grad: "linear-gradient(135deg, #92660a 0%, #d4af37 60%, #f5e88a 100%)",
    bg: "linear-gradient(180deg, #0a0800 0%, #1a1200 100%)",
    border: "rgba(212,175,55,0.3)",
    glow: "rgba(212,175,55,0.2)",
    title: "Three Exclusive Floors",
    subtitle: "Find exactly what you're looking for.",
    body: "Beyond the main rooms, Ghost has three premium floors for people who want something more specific. Each floor is its own world — curated, anonymous, and safe.",
    bullets: [
      "🏙️ Penthouse Floor — elite curated women only",
      "🪟 The Loft — LGBTQ+ safe space, $11.99",
      "🔥 The Cellar — adults only · bold connections, $11.99",
      "🌆 Browse any city floor for $4.99 extra",
    ],
  },
  {
    emoji: "🚀",
    accent: "#4ade80",
    grad: "linear-gradient(135deg, #14532d 0%, #22c55e 60%, #4ade80 100%)",
    bg: "linear-gradient(180deg, #020d05 0%, #051a08 100%)",
    border: "rgba(74,222,128,0.3)",
    glow: "rgba(74,222,128,0.2)",
    title: "You're Ready",
    subtitle: "Pick your room and check in.",
    body: "You understand the Ghost House. Now go find your room. Start with Standard if you're exploring — upgrade anytime. Your Ghost ID is waiting. The right people are already inside.",
    bullets: [
      "✅ One-time entry — never pay again",
      "🔄 Upgrade your room anytime",
      "🎭 Stay anonymous until you choose not to",
      "💬 Your Vault chat never expires",
    ],
  },
];

export default function GhostHowItWorksPage() {
  const navigate  = useNavigate();
  const [slide,   setSlide]   = useState(0);
  const [dir,     setDir]     = useState(1);
  const touchStartX = useRef<number | null>(null);

  const current = SLIDES[slide];
  const isLast  = slide === SLIDES.length - 1;

  function goTo(idx: number) {
    setDir(idx > slide ? 1 : -1);
    setSlide(idx);
  }
  function next() { if (!isLast) goTo(slide + 1); }
  function prev() { if (slide > 0) goTo(slide - 1); }

  function finish() {
    markHowItWorksSeen();
    navigate("/ghost/rooms");
  }

  return (
    <div style={{
      minHeight: "100dvh", background: current.bg,
      display: "flex", flexDirection: "column",
      fontFamily: "system-ui, sans-serif", color: "#fff",
      transition: "background 0.5s ease",
      overflowX: "hidden",
    }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (dx < -50) next();
        else if (dx > 50) prev();
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: -100, left: "50%", transform: "translateX(-50%)",
        width: 320, height: 320, borderRadius: "50%",
        background: current.glow, filter: "blur(80px)",
        pointerEvents: "none", transition: "background 0.5s ease",
      }} />

      {/* Skip */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 20px 0", position: "relative", zIndex: 1 }}>
        <button
          onClick={finish}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "4px 8px" }}
        >
          Skip →
        </button>
      </div>

      {/* Slide content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px", position: "relative", zIndex: 1 }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Emoji icon */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
              style={{
                width: 80, height: 80, borderRadius: 24,
                background: `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
                border: `1px solid ${current.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 38, marginBottom: 24,
                boxShadow: `0 0 40px ${current.glow}`,
              }}
            >
              {current.emoji}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{
                fontSize: 26, fontWeight: 900, color: "#fff",
                margin: "0 0 6px", letterSpacing: "-0.03em", lineHeight: 1.2,
              }}
            >
              {current.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              style={{
                fontSize: 14, fontWeight: 700,
                color: current.accent,
                margin: "0 0 16px",
              }}
            >
              {current.subtitle}
            </motion.p>

            {/* Body */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.22 }}
              style={{
                fontSize: 14, color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7, margin: "0 0 24px",
              }}
            >
              {current.body}
            </motion.p>

            {/* Bullets */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.27 }}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${current.border}`,
                borderRadius: 16, padding: "14px 16px",
                display: "flex", flexDirection: "column", gap: 10,
              }}
            >
              {current.bullets.map((b, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.75)" }}>{b}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div style={{ padding: "20px 24px 40px", position: "relative", zIndex: 1 }}>
        {/* Dot indicators */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {SLIDES.map((_, i) => (
            <motion.div
              key={i}
              onClick={() => goTo(i)}
              animate={{ width: i === slide ? 20 : 6, opacity: i === slide ? 1 : 0.3 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                height: 6, borderRadius: 3, cursor: "pointer",
                background: i === slide ? current.accent : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          {slide > 0 && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={prev}
              style={{
                width: 52, height: 52, borderRadius: 14, border: `1px solid rgba(255,255,255,0.12)`,
                background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)",
                fontSize: 20, cursor: "pointer", flexShrink: 0,
              }}
            >
              ←
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={isLast ? finish : next}
            style={{
              flex: 1, height: 52, borderRadius: 14, border: "none",
              background: current.grad,
              color: slide === 1 ? "#0a0700" : "#fff",
              fontSize: 15, fontWeight: 900, cursor: "pointer",
              boxShadow: `0 4px 24px ${current.glow}`,
              letterSpacing: "0.02em",
            }}
          >
            {isLast ? "Pick My Room →" : "Next →"}
          </motion.button>
        </div>

        {/* Reassurance */}
        <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "14px 0 0", fontWeight: 600 }}>
          {slide === 1 ? "One-time only · Not a subscription · Never charged again" : `${slide + 1} of ${SLIDES.length}`}
        </p>
      </div>
    </div>
  );
}
