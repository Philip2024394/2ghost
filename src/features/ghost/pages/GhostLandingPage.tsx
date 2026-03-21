import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCachedIpCountry } from "@/shared/hooks/useIpCountry";
import GhostOnboarding, { hasSeenOnboarding } from "../components/GhostOnboarding";

const GHOST_HERO = "https://ik.imagekit.io/7grri5v7d/find%20meddddd.png";

// Seeded RNG — deterministic per day so number is consistent within the day
function seededInt(seed: number, lo: number, hi: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return lo + Math.floor((x - Math.floor(x)) * (hi - lo + 1));
}

// Daily target: seed from YYYYMMDD integer → 280–520 new profiles that day
function getDailyTarget(): number {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return seededInt(seed, 280, 520);
}

// How many profiles have "joined" so far today (grows 0 → target across midnight–midnight)
function getNewProfilesToday(): number {
  const now = new Date();
  const minuteOfDay = now.getHours() * 60 + now.getMinutes();
  const fraction = minuteOfDay / 1440; // 0.0 at 00:00 → ~1.0 at 23:59
  return Math.max(1, Math.floor(getDailyTarget() * fraction));
}

const AVATARS = Array.from({ length: 6 }, (_, i) => `https://i.pravatar.cc/80?img=${i + 1}`);

// ── Floating hearts + gender icons ────────────────────────────────────────────
const HEARTS = [
  { delay: 0,    x:  "8%",  size: 14, dur: 3.8, drift:  10, icon: "👨" },
  { delay: 0.4,  x: "18%",  size: 16, dur: 3.2, drift:  14, icon: "❤️" },
  { delay: 0.8,  x: "28%",  size: 12, dur: 4.1, drift: -12, icon: "👩" },
  { delay: 1.2,  x: "38%",  size: 18, dur: 3.5, drift:   8, icon: "💗" },
  { delay: 1.6,  x: "48%",  size: 20, dur: 2.9, drift: -16, icon: "👨" },
  { delay: 2.0,  x: "58%",  size: 13, dur: 3.9, drift:  18, icon: "❤️" },
  { delay: 2.4,  x: "68%",  size: 16, dur: 3.3, drift:  -8, icon: "👩" },
  { delay: 2.8,  x: "78%",  size: 11, dur: 4.2, drift:  12, icon: "❤️" },
  { delay: 3.2,  x: "88%",  size: 15, dur: 3.6, drift: -14, icon: "👨" },
  { delay: 3.6,  x: "13%",  size: 22, dur: 2.8, drift:   6, icon: "💗" },
  { delay: 4.0,  x: "73%",  size: 18, dur: 3.4, drift: -10, icon: "👩" },
  { delay: 4.4,  x: "43%",  size: 14, dur: 4.0, drift:  16, icon: "❤️" },
];

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
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding());
  const [showManifesto, setShowManifesto] = useState(false);
  const [showA2HS, setShowA2HS]           = useState(false);
  const [a2hsDismissed, setA2HSDismissed] = useState(() => {
    try { return !!localStorage.getItem("ghost_a2hs_dismissed"); } catch { return false; }
  });
  const deferredPromptRef = useRef<any>(null);
  const [countdown, setCountdown] = useState(() => Math.max(0, getDeadline() - Date.now()));
  const [newProfiles, setNewProfiles] = useState(getNewProfilesToday);
  const [countryName] = useState(() => getCachedIpCountry()?.countryName ?? "Indonesia");
  const [countryFlag] = useState(() => {
    const code = getCachedIpCountry()?.countryCode ?? "ID";
    return [...code.toUpperCase()].map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("");
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleEnter = () => {
    try {
      const hasPhone = !!localStorage.getItem("ghost_phone");
      const hasProfile = !!localStorage.getItem("ghost_profile");
      if (hasPhone && hasProfile) {
        navigate("/ghost/mode", { replace: true });
      } else if (hasPhone) {
        navigate("/ghost/gateway", { replace: true });
      } else {
        navigate("/ghost/auth", { replace: true });
      }
    } catch {
      navigate("/ghost/auth", { replace: true });
    }
  };

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

  // A2HS — capture install prompt + show banner after 10 minutes
  useEffect(() => {
    if (a2hsDismissed) return;

    // Record first visit timestamp
    try {
      if (!localStorage.getItem("ghost_first_visit")) {
        localStorage.setItem("ghost_first_visit", String(Date.now()));
      }
    } catch {}

    // Capture deferred prompt on Android/Chrome
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Calculate how long until 10 minutes from first visit
    const firstVisit = (() => { try { return Number(localStorage.getItem("ghost_first_visit")) || Date.now(); } catch { return Date.now(); } })();
    const delay = Math.max(0, firstVisit + 10 * 60 * 1000 - Date.now());

    const t = setTimeout(() => setShowA2HS(true), delay);

    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, [a2hsDismissed]);

  const handleA2HSInstall = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      await deferredPromptRef.current.userChoice;
      deferredPromptRef.current = null;
    }
    dismissA2HS();
  };

  const dismissA2HS = () => {
    setShowA2HS(false);
    setA2HSDismissed(true);
    try { localStorage.setItem("ghost_a2hs_dismissed", "1"); } catch {}
  };

  // Detect iOS Safari (no beforeinstallprompt support)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
  const isInStandaloneMode = ("standalone" in window.navigator) && (window.navigator as any).standalone;

  // Tick both countdown and new-profiles counter (every minute is enough for profiles)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(Math.max(0, getDeadline() - Date.now()));
      setNewProfiles(getNewProfilesToday());
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div style={{ minHeight: "100dvh", position: "relative", overflow: "hidden", background: "#050508" }}>
      <AnimatePresence>
        {showOnboarding && (
          <GhostOnboarding onDone={() => setShowOnboarding(false)} />
        )}
      </AnimatePresence>

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
          {/* Main heading */}
          <h1 style={{
            margin: 0,
            fontSize: 32, fontWeight: 900,
            color: "#fff",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}>
            Find Your Boo
          </h1>

          {/* Subtext */}
          <p style={{
            margin: 0,
            fontSize: 13,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.6,
          }}>
            Anonymous connections. Real chemistry. Connect your way when you match.
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
              {newProfiles.toLocaleString()} New Profiles Today · {countryFlag} {countryName}
            </span>
          </div>

          {/* Floating hearts */}
          <div style={{ position: "relative", height: 0 }}>
            <style>{`
              @keyframes floatHeart {
                0%   { transform: translateY(0) translateX(0) scale(0.6); opacity: 0; }
                15%  { opacity: 1; }
                80%  { opacity: 0.6; }
                100% { transform: translateY(-110px) translateX(var(--drift)) scale(1); opacity: 0; }
              }
            `}</style>
            {HEARTS.map((h, i) => (
              <span
                key={i}
                style={{
                  position: "absolute",
                  left: h.x,
                  bottom: 0,
                  fontSize: h.size,
                  pointerEvents: "none",
                  animation: `floatHeart ${h.dur}s ease-out ${h.delay}s infinite`,
                  ["--drift" as any]: `${h.drift}px`,
                  willChange: "transform, opacity",
                  filter: h.icon === "👨" || h.icon === "👩"
                    ? "drop-shadow(0 0 3px rgba(255,255,255,0.15))"
                    : "drop-shadow(0 0 5px rgba(239,68,68,0.45))",
                }}
              >{h.icon}</span>
            ))}
          </div>

          {/* CTA button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -1 }}
            onClick={handleEnter}
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
            Ghost Hotel — Enter Free →
          </motion.button>

          {/* Privacy note */}
          <p style={{
            textAlign: "center", margin: 0,
            fontSize: 11, color: "rgba(255,255,255,0.22)",
            lineHeight: 1.6,
          }}>
            Anonymous until you match. No social sign-in required.
          </p>

          {/* Footer links */}
          <p style={{ textAlign: "center", margin: "14px 0 0", fontSize: 10, lineHeight: 1.8 }}>
            <a href="/affiliate/join" style={{ color: "rgba(74,222,128,0.4)", textDecoration: "none" }}>Become an Affiliate</a>
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 18px", gap: 12 }}
              >
                <h2 style={{
                  fontSize: 22, fontWeight: 900, color: "#fff",
                  lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0, flex: 1,
                }}>
                  Dating without<br />
                  the noise —<br />
                  <span style={{ color: "#4ade80" }}>finally.</span>
                </h2>
                <img
                  src="https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasdasdasd.png"
                  alt=""
                  style={{ width: "auto", height: 250, objectFit: "contain", flexShrink: 0 }}
                />
              </motion.div>

              {/* Manifesto body */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.28, duration: 0.45 }}
                style={{
                  fontSize: 13, color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.75, margin: "0 0 14px",
                }}
              >
                2Ghost is for people done with performative dating.{"\n"}No followers. No profiles to perfect. No endless swiping.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.32, duration: 0.45 }}
                style={{
                  fontSize: 13, color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.75, margin: "0 0 14px",
                }}
              >
                Just two people who choose each other — and start talking.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.36, duration: 0.45 }}
                style={{
                  fontSize: 13, color: "rgba(255,255,255,0.7)",
                  lineHeight: 1.75, margin: "0 0 14px", fontStyle: "italic",
                }}
              >
                Stay anonymous until it actually means something.{"\n"}Then move the conversation to the apps you already use.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.40, duration: 0.45 }}
                style={{
                  fontSize: 13, color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.75, margin: "0 0 18px",
                }}
              >
                This is dating without the noise.
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

              <p style={{ margin: "0 0 18px", fontSize: 13, fontWeight: 900, color: "#ef4444", textAlign: "center", letterSpacing: "0.02em" }}>
                After this closes, it's paid membership only
              </p>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.35 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setShowManifesto(false); handleEnter(); }}
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

      {/* ── Add to Home Screen banner ── */}
      <AnimatePresence>
        {showA2HS && !isInStandaloneMode && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{
              position: "fixed",
              bottom: 0, left: 0, right: 0,
              zIndex: 9999,
              padding: "0 12px max(20px, env(safe-area-inset-bottom, 20px))",
            }}
          >
            <div style={{
              background: "rgba(4,6,4,0.97)",
              border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: 20,
              padding: "16px 16px 14px",
              backdropFilter: "blur(20px)",
              boxShadow: "0 -4px 40px rgba(74,222,128,0.12)",
            }}>
              {/* Green top bar */}
              <div style={{ height: 3, background: "linear-gradient(90deg,#16a34a,#4ade80)", borderRadius: "3px 3px 0 0", margin: "-16px -16px 14px" }} />

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg,#16a34a,#4ade80)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, boxShadow: "0 0 16px rgba(74,222,128,0.3)",
                }}>👻</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>Add 2Ghost to your Home Screen</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                    One tap to open — always ready when you are
                  </p>
                </div>
                <button onClick={dismissA2HS} style={{
                  background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                  fontSize: 18, cursor: "pointer", padding: "4px", lineHeight: 1, flexShrink: 0,
                }}>✕</button>
              </div>

              {isIOS ? (
                /* iOS manual instruction */
                <div>
                  <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
                    {[
                      ["1", "Tap the", "Share button", "⬆️", "at the bottom of Safari"],
                      ["2", "Scroll down and tap", "Add to Home Screen", "➕", ""],
                      ["3", "Tap", "Add", "✓", "— done!"],
                    ].map(([num, pre, bold, icon, post]) => (
                      <div key={num} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: "#4ade80", background: "rgba(74,222,128,0.12)", borderRadius: 4, padding: "1px 5px", flexShrink: 0, marginTop: 1 }}>{num}</span>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>
                          {pre} <strong style={{ color: "#fff" }}>{bold}</strong> {icon} {post}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button onClick={dismissA2HS} style={{
                    width: "100%", background: "none", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "9px 0",
                    fontSize: 12, color: "rgba(255,255,255,0.35)", cursor: "pointer", fontWeight: 600,
                  }}>Already added — close</button>
                </div>
              ) : (
                /* Android/Chrome — trigger install prompt */
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={dismissA2HS} style={{
                    flex: "0 0 auto", background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
                    padding: "11px 16px", fontSize: 12, fontWeight: 700,
                    color: "rgba(255,255,255,0.4)", cursor: "pointer",
                  }}>Not now</button>
                  <button onClick={handleA2HSInstall} style={{
                    flex: 1, background: "linear-gradient(135deg,#16a34a,#4ade80)",
                    border: "none", borderRadius: 12, padding: "11px 0",
                    fontSize: 13, fontWeight: 900, color: "#000", cursor: "pointer",
                  }}>Add to Home Screen →</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
