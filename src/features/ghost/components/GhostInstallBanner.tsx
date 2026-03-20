import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdf.png";
const MAX_DISMISSALS = 5;
const REPEAT_MS = 5 * 60 * 1000; // 5 minutes
const FIRST_SHOW_MS = 4000;       // 4s after page load

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

function getDismissCount(): number {
  try { return Number(localStorage.getItem("ghost_install_dismissals") || 0); } catch { return 0; }
}
function setDismissCount(n: number) {
  try { localStorage.setItem("ghost_install_dismissals", String(n)); } catch {}
}
function getLastDismissed(): number {
  try { return Number(localStorage.getItem("ghost_install_last_dismissed") || 0); } catch { return 0; }
}
function setLastDismissed() {
  try { localStorage.setItem("ghost_install_last_dismissed", String(Date.now())); } catch {}
}

export default function GhostInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const repeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleReshow = () => {
    if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);
    repeatTimerRef.current = setTimeout(() => {
      if (getDismissCount() < MAX_DISMISSALS && !isStandalone()) {
        setShow(true);
      }
    }, REPEAT_MS);
  };

  useEffect(() => {
    if (isStandalone()) return;
    if (getDismissCount() >= MAX_DISMISSALS) return;

    // How long since last dismissed?
    const sinceLastDismiss = Date.now() - getLastDismissed();
    const initialDelay = sinceLastDismiss < REPEAT_MS
      ? REPEAT_MS - sinceLastDismiss   // wait out the remaining cooldown
      : FIRST_SHOW_MS;                 // first time — show after 4s

    const firstTimer = setTimeout(() => {
      if (!isStandalone() && getDismissCount() < MAX_DISMISSALS) {
        setShow(true);
      }
    }, initialDelay);

    if (isIOS()) {
      return () => clearTimeout(firstTimer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setShow(false));

    return () => {
      clearTimeout(firstTimer);
      if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleLater = () => {
    setShow(false);
    setShowIOSGuide(false);
    const next = getDismissCount() + 1;
    setDismissCount(next);
    setLastDismissed();
    if (next < MAX_DISMISSALS) scheduleReshow();
  };

  const handleAdd = async () => {
    if (isIOS()) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) {
      // No native prompt available — show a guide
      setShowIOSGuide(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
      setDismissCount(MAX_DISMISSALS); // don't show again after install
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      {/* ── Main banner ── */}
      <AnimatePresence>
        {show && !showIOSGuide && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9990,
              display: "flex", justifyContent: "center",
              padding: "0 12px max(20px, env(safe-area-inset-bottom, 20px))",
              pointerEvents: "none",
            }}
          >
            <div style={{
              width: "100%", maxWidth: 480,
              background: "rgba(6,8,6,0.97)",
              border: "1px solid rgba(74,222,128,0.3)",
              borderRadius: 20,
              padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 -4px 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(74,222,128,0.06)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              pointerEvents: "all",
            }}>
              {/* Icon */}
              <div style={{
                width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                <img src={GHOST_LOGO} alt="2Ghost" style={{ width: 60, height: 60, objectFit: "contain" }} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: "0 0 2px", lineHeight: 1.2 }}>
                  Add 2Ghost to Home Screen
                </p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.4 }}>
                  You'll need your sign-in code to access the app
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAdd}
                  style={{
                    height: 30, borderRadius: 8, padding: "0 14px", border: "none",
                    background: "linear-gradient(135deg, #16a34a, #22c55e)",
                    color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Add Now
                </motion.button>
                <button
                  onClick={handleLater}
                  style={{
                    height: 28, borderRadius: 8, padding: "0 14px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  Later
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── iOS / manual install guide ── */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleLater}
            style={{
              position: "fixed", inset: 0, zIndex: 9995,
              background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(8,8,14,0.99)", borderRadius: "20px 20px 0 0",
                border: "1px solid rgba(74,222,128,0.2)", borderBottom: "none",
                padding: "20px 22px max(28px, env(safe-area-inset-bottom, 28px))",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={GHOST_LOGO} alt="ghost" style={{ width: 44, height: 44, objectFit: "contain" }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>Add to Home Screen</p>
                    <p style={{ fontSize: 10, color: "rgba(74,222,128,0.6)", margin: 0 }}>3 quick steps</p>
                  </div>
                </div>
                <button onClick={handleLater} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ✕
                </button>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "14px 0 18px" }} />

              {[
                { step: "1", icon: "⬆️", text: isIOS() ? "Tap the Share button at the bottom of Safari" : "Open this page in your browser's menu (⋮)" },
                { step: "2", icon: "📌", text: isIOS() ? 'Scroll down and tap "Add to Home Screen"' : 'Tap "Add to Home Screen" or "Install App"' },
                { step: "3", icon: "✅", text: 'Tap "Add" — 2Ghost opens full-screen, no browser bar' },
              ].map(({ step, icon, text }) => (
                <div key={step} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>
                    {icon}
                  </div>
                  <div style={{ paddingTop: 7 }}>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.5 }}>
                      <strong style={{ color: "rgba(74,222,128,0.9)" }}>Step {step}: </strong>{text}
                    </p>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 8, padding: "12px 14px", background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 12 }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 4px", fontWeight: 700 }}>🔑 Remember</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.5 }}>
                  When you open 2Ghost from your home screen, you'll need your sign-in verification code to access your account.
                </p>
              </div>

              <button
                onClick={handleLater}
                style={{
                  marginTop: 16, width: "100%", height: 44, borderRadius: 12,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
