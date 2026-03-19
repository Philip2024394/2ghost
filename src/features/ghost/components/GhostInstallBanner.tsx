import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

// Detects iOS Safari
function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

// Detects if already running as standalone (installed PWA)
function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
}

export default function GhostInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isStandalone()) return;

    // Don't show if user dismissed in last 7 days
    try {
      const dismissed = Number(localStorage.getItem("ghost_install_dismissed") || 0);
      if (Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) return;
    } catch {}

    if (isIOS()) {
      // iOS: no beforeinstallprompt — show manual guide after 3s
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShow(false);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    setShowIOSGuide(false);
    try { localStorage.setItem("ghost_install_dismissed", String(Date.now())); } catch {}
  };

  const handleInstall = async () => {
    if (isIOS()) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      {/* ── Main install banner ── */}
      <AnimatePresence>
        {show && !showIOSGuide && !installed && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9990,
              padding: "0 12px max(16px, env(safe-area-inset-bottom, 16px))",
              pointerEvents: "none",
            }}
          >
            <div style={{
              background: "rgba(8,8,14,0.97)", border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: 20, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 14,
              boxShadow: "0 -4px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(74,222,128,0.08)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              pointerEvents: "all",
            }}>
              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <img src={GHOST_LOGO} alt="ghost" style={{ width: 78, height: 78, objectFit: "contain" }} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>
                  Install 2Ghost
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.4 }}>
                  Full-screen · No browser bar · Works offline
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={dismiss}
                  style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.4)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <X size={14} />
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInstall}
                  style={{
                    height: 32, borderRadius: 10, padding: "0 16px", border: "none",
                    background: "linear-gradient(135deg, #16a34a, #22c55e)",
                    color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
                  }}
                >
                  {isIOS() ? "How to Install" : "Install"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── iOS step-by-step guide ── */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={dismiss}
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
                padding: "20px 20px max(24px, env(safe-area-inset-bottom, 24px))",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={GHOST_LOGO} alt="ghost" style={{ width: 72, height: 72, objectFit: "contain" }} />
                  <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>Install 2Ghost on iPhone</p>
                </div>
                <button onClick={dismiss} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={14} />
                </button>
              </div>

              {[
                { step: "1", icon: "⬆️", text: 'Tap the Share button at the bottom of Safari' },
                { step: "2", icon: "📌", text: 'Scroll down and tap "Add to Home Screen"' },
                { step: "3", icon: "✅", text: 'Tap "Add" — 2Ghost opens full-screen, no browser bar' },
              ].map(({ step, icon, text }) => (
                <div key={step} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18,
                  }}>
                    {icon}
                  </div>
                  <div style={{ paddingTop: 8 }}>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.5 }}>
                      <strong style={{ color: "rgba(74,222,128,0.9)" }}>Step {step}:</strong> {text}
                    </p>
                  </div>
                </div>
              ))}

              <div style={{
                marginTop: 8, padding: "10px 14px",
                background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)",
                borderRadius: 12,
              }}>
                <p style={{ fontSize: 11, color: "rgba(74,222,128,0.7)", margin: 0 }}>
                  Once installed, 2Ghost opens like a native app — full screen, no address bar, no back button clutter.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
