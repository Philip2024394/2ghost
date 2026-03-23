// ── Flag / Report Sheet ─────────────────────────────────────────────────────────
// Bottom sheet for reporting a profile.
// Extracted from GhostModePage to reduce file size.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type FlagTarget = { profileId: string; ghostId: string };

type Props = {
  flagSheet: FlagTarget | null;
  onSubmit: (profileId: string, reason: string) => void;
  onClose: () => void;
};

export default function GhostFlagSheet({ flagSheet, onSubmit, onClose }: Props) {
  const [flagReason, setFlagReason] = useState("");

  const handleSubmit = () => {
    if (!flagSheet || !flagReason) return;
    onSubmit(flagSheet.profileId, flagReason);
    setFlagReason("");
  };

  const handleClose = () => {
    setFlagReason("");
    onClose();
  };

  return (
    <AnimatePresence>
      {flagSheet && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "rgba(8,6,6,0.98)",
              borderRadius: "20px 20px 0 0",
              border: "1px solid rgba(239,68,68,0.2)", borderBottom: "none",
              padding: "0 18px max(28px, env(safe-area-inset-bottom, 28px))",
            }}
          >
            <div style={{ height: 3, background: "linear-gradient(90deg, #ef4444, #f87171)", borderRadius: "4px 4px 0 0" }} />
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 16px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Report {flagSheet.ghostId}</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>
              Select a reason. This profile will be flagged for admin review and frozen until investigated.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {[
                { key: "spam", label: "Spam or repeated harassment", icon: "🚫" },
                { key: "fake", label: "Fake profile or catfishing", icon: "🎭" },
                { key: "inappropriate", label: "Inappropriate content", icon: "⚠️" },
                { key: "threatening", label: "Threatening or abusive behaviour", icon: "🛑" },
                { key: "underage", label: "Appears to be underage", icon: "🔞" },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => setFlagReason(r.key)}
                  style={{
                    width: "100%", height: 46, borderRadius: 12, padding: "0 14px",
                    background: flagReason === r.key ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
                    border: flagReason === r.key ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    color: flagReason === r.key ? "#f87171" : "rgba(255,255,255,0.7)",
                    fontSize: 13, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                  }}
                >
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!flagReason}
              style={{
                width: "100%", height: 48, borderRadius: 50, border: "none",
                background: flagReason ? "linear-gradient(to bottom, #f87171, #ef4444)" : "rgba(255,255,255,0.07)",
                color: flagReason ? "#fff" : "rgba(255,255,255,0.3)",
                fontSize: 14, fontWeight: 900, cursor: flagReason ? "pointer" : "default",
                boxShadow: flagReason ? "0 4px 16px rgba(239,68,68,0.4)" : "none",
                marginBottom: 10,
              }}
            >
              Submit Report
            </motion.button>
            <button
              onClick={handleClose}
              style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "4px 0" }}
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
