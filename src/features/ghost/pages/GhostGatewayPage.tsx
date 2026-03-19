import { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import GhostMockFeedPage from "./GhostMockFeedPage";

const GhostModePage = lazy(() => import("./GhostModePage"));
const GhostSetupPage = lazy(() => import("./GhostSetupPage"));

const RULES = [
  { icon: "🤝", title: "Respect Every Ghost", desc: "No harassment, hate, or disrespect. Every person here deserves dignity — no exceptions." },
  { icon: "🔒", title: "Privacy is Sacred", desc: "Never share another member's identity, photos, or location outside the House." },
  { icon: "🚫", title: "No Bad Energy", desc: "No spam, scams, or fake profiles. Genuine connections only — the House self-cleanses." },
  { icon: "👻", title: "Stay Anonymous Until Ready", desc: "Your Ghost ID protects you. Only reveal yourself when you're truly comfortable." },
  { icon: "💚", title: "Good Vibes Only", desc: "Bring curiosity, openness, and warmth. The energy you put in is the energy you get back." },
];

const HOW_IT_WORKS = [
  { icon: "❤️", title: "Like for Free", desc: "Browse every profile and like as many as you want — completely free, no subscription needed." },
  { icon: "✨", title: "Ghost Match", desc: "When two ghosts like each other it becomes a mutual match. You'll get notified instantly." },
  { icon: "📱", title: "WhatsApp on Match", desc: "After a mutual match, pay once to unlock their real WhatsApp number. Real connection only." },
  { icon: "🚪", title: "Ghost Room", desc: "Your private vault. All your matches live here with a 48-hour countdown. Don't let them fade." },
  { icon: "🌍", title: "Global House", desc: "Members from Indonesia, UK, Ireland, Japan, Australia and growing — your next match could be anywhere." },
  { icon: "👁️", title: "You're Invisible", desc: "Others only see your Ghost ID, photo, age, and city — nothing else — until you both connect." },
];

function WelcomeModal({ onAccept }: { onAccept: () => void }) {
  return (
    <div
      style={{
        position: "absolute", inset: 0, zIndex: 10,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 480,
          backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdfasdASD.png)",
          backgroundSize: "cover", backgroundPosition: "center top",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(74,222,128,0.12)",
          borderBottom: "none",
          maxHeight: "92dvh", overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        {/* Top accent */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e, #4ade80, #16a34a)" }} />

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>

        <div style={{ padding: "20px 22px max(36px, env(safe-area-inset-bottom, 36px))" }}>

          {/* Ghost hero */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 72, lineHeight: 1, display: "inline-block", marginBottom: 16 }}>
              👻
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Welcome to{" "}
              <span style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                My House
              </span>
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.7, maxWidth: 320, marginInline: "auto" }}>
              Before you settle in, we have some{" "}
              <span style={{ color: "rgba(74,222,128,0.85)", fontWeight: 700 }}>house rules</span>{" "}
              that we must all abide by — to keep our house free from bad energies entering.
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.2), transparent)", marginBottom: 22 }} />

          {/* House Rules */}
          <div style={{ marginBottom: 26 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(74,222,128,0.6)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 14px" }}>
              🏠 The House Rules
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {RULES.map((rule) => (
                <div key={rule.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.08)", borderRadius: 14, padding: "12px 14px" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                    {rule.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>{rule.title}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", margin: 0, lineHeight: 1.5 }}>{rule.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.2), transparent)", marginBottom: 22 }} />

          {/* How it works */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(74,222,128,0.6)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 14px" }}>
              ⚙️ How the House Works
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {HOW_IT_WORKS.map((item) => (
                <div key={item.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {item.icon}
                  </div>
                  <div style={{ paddingTop: 2 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{item.title}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -2 }}
            onClick={onAccept}
            style={{
              width: "100%", height: 54, borderRadius: 50, border: "none",
              background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
              color: "#fff", fontSize: 15, fontWeight: 900,
              cursor: "pointer", letterSpacing: "0.03em",
              boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 32px rgba(34,197,94,0.5)",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
            👻 I accept 2Ghost Rules
          </motion.button>

          <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "12px 0 0", lineHeight: 1.6 }}>
            By entering you agree to the house rules above and our{" "}
            <span style={{ color: "rgba(255,255,255,0.35)" }}>Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Stacks the real feed behind the mock feed.
 * On first visit: welcome modal shows over the mock feed.
 * On accept: 3-second pause → mock slides left → live page revealed.
 */
export default function GhostGatewayPage() {
  const navigate = useNavigate();
  const [unlocking, setUnlocking] = useState(false);
  const [done, setDone] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [countdown, setCountdown] = useState(false);

  // Delay welcome modal by 3 seconds so user can see the mock feed first
  useEffect(() => {
    try { if (localStorage.getItem("ghost_house_welcomed")) return; } catch {}
    const t = setTimeout(() => setShowWelcome(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const hasProfile = (() => {
    try { return !!localStorage.getItem("ghost_profile"); } catch { return false; }
  })();

  const handleAccept = () => {
    try { localStorage.setItem("ghost_house_welcomed", "1"); } catch {}
    setShowWelcome(false);
    setCountdown(true);
  };

  // After welcome is accepted: wait 3s then slide
  useEffect(() => {
    if (!countdown) return;
    const timer = setTimeout(() => handleUnlock(), 3000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // After slide animation finishes, navigate to real page
  useEffect(() => {
    if (!done) return;
    navigate(hasProfile ? "/ghost/mode" : "/ghost/setup", { replace: true });
  }, [done, hasProfile, navigate]);

  const handleUnlock = () => {
    setUnlocking(true);
    setTimeout(() => setDone(true), 1400);
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100dvh", overflow: "hidden", background: "#050508" }}>

      {/* ── Real page sits underneath — loads in background ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <Suspense fallback={
          <div style={{ width: "100%", height: "100%", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 40 }}>👻</span>
          </div>
        }>
          {hasProfile ? <GhostModePage /> : <GhostSetupPage />}
        </Suspense>
      </div>

      {/* ── Mock feed slides left on top, revealing the real page ── */}
      <motion.div
        animate={{ x: unlocking ? "-100vw" : 0 }}
        transition={{ type: "tween", ease: "easeInOut", duration: 1.3 }}
        style={{
          position: "absolute", inset: 0, zIndex: 2,
          willChange: "transform",
          overflowY: "auto",
          boxShadow: unlocking ? "-16px 0 48px rgba(0,0,0,0.7)" : "none",
        }}
      >
        <GhostMockFeedPage />

        {/* ── Welcome modal sits above the mock feed ── */}
        <AnimatePresence>
          {showWelcome && <WelcomeModal onAccept={handleAccept} />}
        </AnimatePresence>

        {/* ── 3-second countdown overlay after acceptance ── */}
        <AnimatePresence>
          {countdown && !unlocking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute", inset: 0, zIndex: 9,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 12,
                pointerEvents: "none",
              }}
            >
              <motion.div
                animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ fontSize: 52 }}
              >
                👻
              </motion.div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "rgba(74,222,128,0.9)", letterSpacing: "0.08em", margin: 0 }}>
                Entering Ghost Mode...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

    </div>
  );
}
