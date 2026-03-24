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
    bgImage: "https://ik.imagekit.io/7grri5v7d/fgsdfgsdfgdfgsd.png?updatedAt=1774006241624",
    accent: "#d4af37",
    grad: "linear-gradient(135deg, #92660a 0%, #d4af37 60%, #f5e88a 100%)",
    border: "rgba(212,175,55,0.35)",
    glow: "rgba(212,175,55,0.25)",
    title: "Welcome to the Ghost House",
    subtitle: "Not just another dating app.",
    body: "Ghost is built like a hotel. You check into a Room that matches where you are in life — and everyone inside knows the vibe. No noise. No mismatches. Just the right people at the right level.",
    bullets: [
      "🏨 Six rooms — from The Cellar to the Penthouse",
      "🎭 Anonymous Ghost ID — real name never shown",
      "🌍 City-based matching — your floor, your city",
    ],
  },
  {
    bgImage: "https://ik.imagekit.io/7grri5v7d/cccccccccsfsfsdfadsfasdfasdasd.png",
    accent: "#c0c0c0",
    grad: "linear-gradient(135deg, #505050 0%, #c0c0c0 50%, #e8e8e8 100%)",
    border: "rgba(192,192,192,0.3)",
    glow: "rgba(192,192,192,0.15)",
    title: "Your Room = Your Level",
    subtitle: "Free to join. Coins to play.",
    body: "Standard Room is free — no card, no commitment. Every action inside costs coins: sending a gift, unlocking a match, boosting your profile. The higher your room, the more you get included. Upgrade anytime. Your room badge shows on your card so others instantly know your level.",
    bullets: [
      "🛏️ Standard    — Free · coins to send gifts & unlock matches",
      "🌿 Garden Lodge — Free · 40+ guests · calm, intentional",
      "🏨 Ensuite      — $9.99 · 5 unlocks + boosts included",
      "🎰 The Casino   — $14.99 · unlimited unlocks",
      "🏙️ Penthouse   — $24.99 · everything, globally",
      "🍷 The Cellar / 🎨 The Loft — free for qualifying guests",
    ],
  },
  {
    bgImage: "https://ik.imagekit.io/7grri5v7d/cccccccccsfsfsdfadsfasdfasdasddsfasdf.png",
    accent: "#4ade80",
    grad: "linear-gradient(135deg, #14532d 0%, #22c55e 60%, #4ade80 100%)",
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
    bgImage: "https://ik.imagekit.io/7grri5v7d/cccccccccsfsfsdfadsfasdfasdasddsfasdfffsdfsd.png",
    accent: "#f472b6",
    grad: "linear-gradient(135deg, #831843 0%, #ec4899 60%, #f472b6 100%)",
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
    bgImage: "https://ik.imagekit.io/7grri5v7d/cccccccccsfsfsdfadsfasdfasdasddsfasdfffsdfsdewrwe.png",
    accent: "#d4af37",
    grad: "linear-gradient(135deg, #92660a 0%, #d4af37 60%, #f5e88a 100%)",
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
    bgImage: "https://ik.imagekit.io/7grri5v7d/cccccccccsfsfsdfadsfasdfasdasddsfasdfffsdfsdewrweewrwer.png",
    accent: "#4ade80",
    grad: "linear-gradient(135deg, #14532d 0%, #22c55e 60%, #4ade80 100%)",
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
      minHeight: "100dvh", position: "relative",
      display: "flex", flexDirection: "column",
      fontFamily: "system-ui, sans-serif", color: "#fff",
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
      {/* Background image with dark overlay */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${slide}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            position: "fixed", inset: 0, zIndex: 0,
            backgroundImage: `url(${current.bgImage})`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        />
      </AnimatePresence>
      {/* Dark scrim so text stays readable */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "rgba(0,0,0,0.62)" }} />

      {/* Skip */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 20px 0", position: "relative", zIndex: 2 }}>
        <button
          onClick={finish}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "4px 8px" }}
        >
          Skip →
        </button>
      </div>

      {/* Slide content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 24px", position: "relative", zIndex: 2 }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
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
      <div style={{ padding: "20px 24px 40px", position: "relative", zIndex: 2 }}>
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
