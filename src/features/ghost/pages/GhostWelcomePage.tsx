import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const MR_BUTLAS_IMG = "https://ik.imagekit.io/7grri5v7d/sfsadfasdf.png?updatedAt=1774389915762";

const JUST_JOINED = [
  { id: "j1",  name: "Sari",      flag: "🇮🇩", img: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&q=80" },
  { id: "j2",  name: "Léa",       flag: "🇫🇷", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&q=80" },
  { id: "j3",  name: "Kenji",     flag: "🇯🇵", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80" },
  { id: "j4",  name: "Zara",      flag: "🇺🇸", img: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=80&q=80" },
  { id: "j5",  name: "Arjun",     flag: "🇮🇳", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&q=80" },
  { id: "j6",  name: "Mia",       flag: "🇸🇬", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&q=80" },
  { id: "j7",  name: "Liam",      flag: "🇬🇧", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&q=80" },
  { id: "j8",  name: "Layla",     flag: "🇦🇪", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&q=80" },
  { id: "j9",  name: "Sofia",     flag: "🇦🇺", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80" },
  { id: "j10", name: "Carlos",    flag: "🇧🇷", img: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=80&q=80" },
  { id: "j11", name: "Nadia",     flag: "🇩🇪", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80" },
  { id: "j12", name: "Min-Ji",    flag: "🇰🇷", img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=80&q=80" },
];

export default function GhostWelcomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showRefBanner, setShowRefBanner] = useState(false);

  // Capture referral code from URL and persist for signup
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      try { localStorage.setItem("ghost_referral_code", ref); } catch {}
      setShowRefBanner(true);
      // Auto-hide banner after 4s
      const t = setTimeout(() => setShowRefBanner(false), 4000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#000",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
      fontFamily: "'Georgia', serif",
    }}>
      {/* Referral welcome banner */}
      <AnimatePresence>
        {showRefBanner && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            style={{
              position: "absolute", top: 16, left: 16, right: 16, zIndex: 50,
              background: "rgba(212,175,55,0.14)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(212,175,55,0.4)", borderRadius: 14,
              padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>🎁</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#d4af37" }}>You've been invited!</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Sign up now to claim your 25 free Ghost Coins</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen background image */}
      <img
        src={MR_BUTLAS_IMG}
        alt="Mr. Butlas"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          display: "block",
        }}
      />

      {/* Dark gradient overlay — light at top, clear in middle (name visible), strong at bottom */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.10) 35%, rgba(0,0,0,0.08) 55%, rgba(0,0,0,0.78) 78%, rgba(0,0,0,0.96) 100%)",
        pointerEvents: "none",
      }} />

      {/* Top-left headline */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          position: "absolute",
          top: "max(44px, env(safe-area-inset-top, 44px))",
          left: 24,
          zIndex: 10,
        }}
      >
        <p style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "0.01em",
          lineHeight: 1.15,
          textShadow: "0 2px 24px rgba(0,0,0,0.9)",
          fontFamily: "'Georgia', serif",
        }}>
          Find Your
        </p>
        <p style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "0.01em",
          lineHeight: 1.15,
          textShadow: "0 2px 24px rgba(0,0,0,0.9)",
          fontFamily: "'Georgia', serif",
        }}>
          Perfect Match
        </p>
      </motion.div>

      {/* Top-right — affiliate pill */}
      <motion.a
        href="/affiliate/join"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        style={{
          position: "absolute",
          top: "max(44px, env(safe-area-inset-top, 44px))",
          right: 20,
          zIndex: 10,
          display: "flex", alignItems: "center", gap: 5,
          padding: "7px 13px",
          borderRadius: 50,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "rgba(255,255,255,0.65)",
          fontSize: 11,
          fontWeight: 700,
          textDecoration: "none",
          letterSpacing: "0.04em",
          fontFamily: "'Georgia', serif",
        }}
      >
        <span style={{ fontSize: 13 }}>💼</span> Earn
      </motion.a>

      {/* "with..." centered */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          position: "absolute",
          top: "calc(max(44px, env(safe-area-inset-top, 44px)) + 68px)",
          left: 0, right: 0,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <p style={{
          margin: 0,
          fontSize: 34,
          fontWeight: 400,
          fontStyle: "italic",
          color: "#fff",
          textShadow: "0 0 10px rgba(220,30,30,0.9), 0 0 24px rgba(200,0,0,0.6), 0 0 40px rgba(180,0,0,0.35)",
          fontFamily: "'Georgia', serif",
          letterSpacing: "0.02em",
        }}>
          with...
        </p>
      </motion.div>

      {/* Bottom CTA area — stays in bottom 22% so it never reaches Mr. Butlas's name */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          position: "absolute",
          bottom: "max(40px, env(safe-area-inset-bottom, 40px))",
          left: 24, right: 24,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        {/* Just joined row */}
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.9)" }}
              />
              <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.75)", letterSpacing: "0.04em" }}>
                Just joined
              </span>
            </div>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
              {JUST_JOINED.length} countries today
            </span>
          </div>

          {/* Overlapping avatars */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {JUST_JOINED.slice(0, 9).map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.04 }}
                style={{ position: "relative", marginLeft: i === 0 ? 0 : -9, zIndex: JUST_JOINED.length - i }}
              >
                <img
                  src={g.img}
                  alt={g.name}
                  title={`${g.flag} ${g.name}`}
                  style={{
                    width: 34, height: 34,
                    borderRadius: "50%",
                    objectFit: "cover", objectPosition: "top",
                    border: "2px solid rgba(0,0,0,0.75)",
                    display: "block",
                  }}
                />
                <span style={{ position: "absolute", bottom: -1, right: -2, fontSize: 9, lineHeight: 1 }}>{g.flag}</span>
              </motion.div>
            ))}
            {JUST_JOINED.length > 9 && (
              <div style={{
                marginLeft: -9, zIndex: 0,
                width: 34, height: 34, borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                border: "2px solid rgba(255,255,255,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: "#fff" }}>+{JUST_JOINED.length - 9}</span>
              </div>
            )}
            <div style={{ marginLeft: 11, display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{JUST_JOINED.length} new today</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>join them now</span>
            </div>
          </div>
        </div>

        {/* Find Now button */}
        <button
          onClick={() => navigate("/ghost")}
          style={{
            width: "100%",
            maxWidth: 400,
            height: 58,
            borderRadius: 50,
            border: "none",
            background: "linear-gradient(to bottom, #ff3b3b 0%, #e01010 40%, #b80000 100%)",
            color: "#fff",
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: "0.06em",
            cursor: "pointer",
            textTransform: "uppercase",
            boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 32px rgba(220,20,20,0.55), 0 2px 8px rgba(0,0,0,0.5)",
            fontFamily: "'Georgia', serif",
          }}
        >
          Find Now
        </button>
      </motion.div>
    </div>
  );
}
