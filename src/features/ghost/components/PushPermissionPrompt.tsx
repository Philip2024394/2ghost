// ── Push Permission Prompt ────────────────────────────────────────────────────
// Bottom sheet asking user to enable push notifications.
// Shows once after user is checked in. Red theme.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  subscribeToPush,
  markPromptDismissed,
  hasDismissedPrompt,
  isSubscribed,
  isPushSupported,
  getPushPermission,
} from "../services/pushNotificationService";

export function shouldShowPushPrompt(): boolean {
  if (!isPushSupported()) return false;
  if (isSubscribed()) return false;
  if (hasDismissedPrompt()) return false;
  if (getPushPermission() === "denied") return false;
  return true;
}

type Props = { onDone: () => void };

export default function PushPermissionPrompt({ onDone }: Props) {
  const [loading,  setLoading]  = useState(false);
  const [accepted, setAccepted] = useState(false);

  async function handleAllow() {
    setLoading(true);
    const ok = await subscribeToPush();
    setLoading(false);
    if (ok) {
      setAccepted(true);
      setTimeout(onDone, 1400);
    } else {
      markPromptDismissed();
      onDone();
    }
  }

  function handleDismiss() {
    markPromptDismissed();
    onDone();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{
          position: "fixed", inset: 0, zIndex: 480,
          background: "rgba(8,4,4,0.99)",
          display: "flex", flexDirection: "column",
          maxWidth: 480, margin: "0 auto",
          overflowY: "auto", scrollbarWidth: "none",
        }}
      >
        {/* Top stripe */}
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
          style={{ height: 3, background: "linear-gradient(90deg, transparent, #e01010, #ff4444, #e01010, transparent)", flexShrink: 0 }}
        />

        {/* Safe-area top padding */}
        <div style={{ paddingTop: "max(48px, env(safe-area-inset-top, 48px))" }} />

        {/* Main content — fills remaining height */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 22px", justifyContent: "center" }}>

          {!accepted ? (
            <>
              {/* Icon + headline */}
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(220,20,20,0.1)", border: "1px solid rgba(220,20,20,0.3)", borderTop: "1px solid rgba(220,20,20,0.55)", boxShadow: "inset 0 1px 0 rgba(220,20,20,0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                  <span style={{ fontSize: 36 }}>🔔</span>
                </div>
                <p style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
                  Stay in the loop
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                  Hearts Way Hotel · Push Notifications
                </p>
              </div>

              {/* Notification types */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                {[
                  { icon: "💘", label: "New match",        desc: "Know instantly when someone likes you back" },
                  { icon: "💬", label: "New messages",     desc: "Never miss a message from the floor chat" },
                  { icon: "🔐", label: "Secret messages",  desc: "Vault alerts when your match sends something private" },
                  { icon: "🎁", label: "Gifts received",   desc: "Get notified when someone sends you a gift" },
                  { icon: "🎩", label: "Mr Butlas alerts", desc: "Your butler will notify you of curated matches" },
                ].map(item => (
                  <div key={item.icon} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", background: "rgba(220,20,20,0.06)", border: "1px solid rgba(220,20,20,0.15)", borderTop: "1px solid rgba(220,20,20,0.28)", boxShadow: "inset 0 1px 0 rgba(220,20,20,0.1)", borderRadius: 14 }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{item.label}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Allow button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAllow}
                disabled={loading}
                style={{
                  width: "100%", height: 56, borderRadius: 16, border: "none",
                  background: loading ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #e01010, #a00000)",
                  color: loading ? "rgba(255,255,255,0.3)" : "#fff",
                  fontSize: 16, fontWeight: 900, cursor: loading ? "default" : "pointer",
                  boxShadow: loading ? "none" : "0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 22px rgba(220,20,20,0.4)",
                  marginBottom: 12, position: "relative", overflow: "hidden",
                }}
              >
                {!loading && <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />}
                {loading ? "Requesting permission…" : "🔔 Allow Notifications"}
              </motion.button>

              <button
                onClick={handleDismiss}
                style={{ width: "100%", padding: "12px", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Not now
              </button>
            </>
          ) : (
            /* Success state */
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center" }}
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}
                style={{ fontSize: 64, display: "block", marginBottom: 18 }}
              >🔔</motion.span>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>You're all set</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>
                Mr Butlas will keep you informed of every match, message, and gift.
              </p>
            </motion.div>
          )}
        </div>

        {/* Bottom safe area */}
        <div style={{ paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))" }} />
      </motion.div>
    </AnimatePresence>
  );
}
