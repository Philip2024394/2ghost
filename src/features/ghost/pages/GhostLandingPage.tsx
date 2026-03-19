import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const GHOST_HERO = "https://ik.imagekit.io/7grri5v7d/find%20meddddd.png";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

const AVATARS = Array.from({ length: 6 }, (_, i) => `https://i.pravatar.cc/80?img=${i + 1}`);

function getDeadline(): number {
  try {
    const stored = localStorage.getItem("ghost_beta_deadline");
    if (stored) return Number(stored);
    const d = Date.now() + 72 * 60 * 60 * 1000;
    localStorage.setItem("ghost_beta_deadline", String(d));
    return d;
  } catch {
    return Date.now() + 72 * 60 * 60 * 1000;
  }
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function GhostLandingPage() {
  const navigate = useNavigate();
  const [showManifesto, setShowManifesto] = useState(false);
  const [countdown, setCountdown] = useState(() => Math.max(0, getDeadline() - Date.now()));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem("ghost_phone")) {
        navigate("/ghost/gateway", { replace: true });
      }
    } catch {}
  }, [navigate]);

  // Fire popup after 3 seconds (once per session)
  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("ghost_manifesto_seen");
    if (alreadySeen) return;
    const t = setTimeout(() => {
      setShowManifesto(true);
      sessionStorage.setItem("ghost_manifesto_seen", "1");
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  // Countdown tick
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(Math.max(0, getDeadline() - Date.now()));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div style={{ minHeight: "100dvh", position: "relative", overflow: "hidden", background: "#050508" }}>

      {/* Background image */}
      <img
        src={GHOST_HERO}
        alt="2Ghost"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "top center",
        }}
      />

      {/* Gradient overlay fading to black at bottom */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, transparent 30%, rgba(5,5,8,0.6) 55%, rgba(5,5,8,0.92) 72%, #050508 90%)",
        pointerEvents: "none",
      }} />

      {/* Bottom-anchored content */}
      <div style={{
        position: "relative", zIndex: 10,
        minHeight: "100dvh",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: "0 22px max(36px, env(safe-area-inset-bottom, 36px))",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          style={{ width: "100%", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}
        >

          {/* Small label */}
          <p style={{
            margin: 0,
            fontSize: 11, fontWeight: 800,
            color: "#4ade80",
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
          }}>
            <img src={GHOST_LOGO} alt="" style={{ width: 48, height: 48, objectFit: "contain", verticalAlign: "middle", marginRight: 6 }} /> 2Ghost
          </p>

          {/* Main heading */}
          <h1 style={{
            margin: 0,
            fontSize: 32, fontWeight: 900,
            color: "#fff",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}>
            Find Your Ghost
          </h1>

          {/* Subtext */}
          <p style={{
            margin: 0,
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.6,
          }}>
            Anonymous connections. Real chemistry. WhatsApp when you match.
          </p>

          {/* Avatar row */}
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {AVATARS.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #050508",
                  marginLeft: i === 0 ? 0 : -9,
                  zIndex: AVATARS.length - i,
                  position: "relative",
                }}
              />
            ))}
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: "rgba(255,255,255,0.45)",
              marginLeft: 10,
            }}>
              +120 inside
            </span>
          </div>

          {/* CTA button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            onClick={() => navigate("/ghost/auth")}
            style={{
              width: "100%", height: 52, borderRadius: 50, border: "none",
              background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
              color: "#fff", fontSize: 16, fontWeight: 900,
              cursor: "pointer", letterSpacing: "0.03em",
              boxShadow: "0 1px 0 rgba(255,255,255,0.28) inset, 0 6px 24px rgba(34,197,94,0.45)",
              position: "relative", overflow: "hidden",
              textShadow: "0 1px 2px rgba(0,0,0,0.25)",
              marginTop: 4,
            }}
          >
            <div style={{
              position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)",
              borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
            }} />
            Enter the Ghost House →
          </motion.button>

          {/* Privacy note */}
          <p style={{
            textAlign: "center", margin: 0,
            fontSize: 11, color: "rgba(255,255,255,0.22)",
            lineHeight: 1.6,
          }}>
            Anonymous until you match. No social sign-in required.
          </p>

        </motion.div>
      </div>

      {/* ── Manifesto popup — fires after 3s ── */}
      <AnimatePresence>
        {showManifesto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowManifesto(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(4,6,4,0.97)",
                borderRadius: "24px 24px 0 0",
                border: "1px solid rgba(74,222,128,0.2)", borderBottom: "none",
                padding: "0 22px max(36px, env(safe-area-inset-bottom, 36px))",
                boxShadow: "0 -24px 80px rgba(0,0,0,0.7)",
                overflow: "hidden",
              }}
            >
              {/* Top green accent bar */}
              <div style={{
                height: 3,
                background: "linear-gradient(90deg, #15803d, #4ade80, #22c55e)",
                marginLeft: -22, marginRight: -22, marginBottom: 0,
              }} />

              {/* Drag handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 20px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
              </div>

              {/* Tagline */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                style={{
                  fontSize: 22, fontWeight: 900, color: "#fff",
                  lineHeight: 1.2, letterSpacing: "-0.02em",
                  margin: "0 0 18px",
                }}
              >
                Tomorrow's dating app<br />
                isn't louder —<br />
                <span style={{ color: "#4ade80" }}>it's quieter.</span>
              </motion.h2>

              {/* Manifesto body */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28, duration: 0.45 }}
                style={{
                  fontSize: 13, color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.75, margin: "0 0 6px",
                }}
              >
                2Ghost was built for people tired of performative dating. No followers. No stories. No dopamine loops. Just two people, a mutual choice, and a private WhatsApp chat.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.45 }}
                style={{
                  fontSize: 13, color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.75, margin: "0 0 18px",
                }}
              >
                The future of dating is anonymous until it's real.
              </motion.p>

              {/* Credit */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                style={{
                  fontSize: 12, color: "rgba(74,222,128,0.5)",
                  fontWeight: 700, margin: "0 0 22px", letterSpacing: "0.04em",
                }}
              >
                — 2Ghost.com
              </motion.p>

              {/* Divider */}
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.18), transparent)", marginBottom: 20 }} />

              {/* Countdown */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}
              >
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#4ade80",
                    boxShadow: "0 0 8px rgba(74,222,128,0.8)",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 2px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Free membership closes in
                  </p>
                  <p style={{
                    fontSize: 24, fontWeight: 900, color: "#4ade80",
                    margin: 0, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums",
                  }}>
                    {formatCountdown(countdown)}
                  </p>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.35 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setShowManifesto(false); navigate("/ghost/auth"); }}
                style={{
                  width: "100%", height: 54, borderRadius: 50, border: "none",
                  background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
                  color: "#fff", fontSize: 16, fontWeight: 900,
                  cursor: "pointer", letterSpacing: "0.03em",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 28px rgba(34,197,94,0.45)",
                  position: "relative", overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                <div style={{
                  position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)",
                  borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
                }} />
                Join Free Now →
              </motion.button>

              {/* Dismiss */}
              <button
                onClick={() => setShowManifesto(false)}
                style={{
                  width: "100%", background: "none", border: "none",
                  color: "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 600,
                  cursor: "pointer", padding: "4px 0",
                }}
              >
                Maybe another time
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
