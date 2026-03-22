import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GhostProfile } from "../types/ghostTypes";
import { filterContent, addStrike, getStrikes, isAccountDeactivated } from "../utils/contentFilter";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdf.png";

const PRESET_QUESTIONS = [
  "What does your ideal evening look like?",
  "What's the last thing that genuinely made you laugh?",
  "If you could be anywhere right now, where would it be?",
  "What's something most people don't know about you?",
  "What are you most excited about lately?",
];

type Props = {
  profile: GhostProfile;
  onClose: () => void;
};

type Screen = "question" | "strike1" | "deactivated" | "sent";

export default function GhostIcebreakerPopup({ profile, onClose }: Props) {
  const a = useGenderAccent();
  const [selected, setSelected]     = useState<string | null>(null);
  const [custom, setCustom]         = useState("");
  const [useCustom, setUseCustom]   = useState(false);
  const [screen, setScreen]         = useState<Screen>("question");
  const [filterReason, setFilterReason] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentStrikes = getStrikes();

  const handleSend = () => {
    const text = useCustom ? custom.trim() : selected ?? "";
    if (!text) return;

    const result = filterContent(text);
    if (result.blocked) {
      const newStrikes = addStrike();
      setFilterReason(result.reason ?? "policy violation");
      if (newStrikes >= 2 || isAccountDeactivated()) {
        setScreen("deactivated");
      } else {
        setScreen("strike1");
      }
      return;
    }

    // All clear — question "sent" (persisted to localStorage per match)
    try {
      const key = `ghost_icebreaker_${profile.id}`;
      localStorage.setItem(key, JSON.stringify({ question: text, sentAt: Date.now() }));
    } catch {}
    setScreen("sent");
  };

  const handleCustomChange = (val: string) => {
    // Real-time block — don't let them type blocked content beyond 5 chars past trigger
    setCustom(val);
  };

  const isCustomBlocked = useCustom && filterContent(custom.trim()).blocked;
  const canSend = !isCustomBlocked && (useCustom ? custom.trim().length >= 5 : !!selected);

  // ── Deactivated screen ────────────────────────────────────────────────────
  if (screen === "deactivated") {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      >
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            width: "100%", maxWidth: 480, background: "#0d0d0f",
            borderRadius: "24px 24px 0 0", padding: "32px 24px 48px",
            border: "1px solid rgba(239,68,68,0.3)", borderBottom: "none",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#ef4444", margin: "0 0 8px" }}>Account Deactivated</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>
              You attempted to share <strong style={{ color: "rgba(255,255,255,0.8)" }}>{filterReason}</strong> twice against Ghost House policy.
              Your account has been deactivated.
            </p>
          </div>

          <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: "0 0 6px" }}>Why we do this</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>
              Ghost exists to protect your privacy and the integrity of real connections.
              Sharing contact details before a mutual unlock breaks that trust.
              Contact info is shared only after both parties agree — that's the deal.
            </p>
          </div>

          <button
            style={{
              width: "100%", height: 50, borderRadius: 50, border: "1px solid rgba(239,68,68,0.4)",
              background: "rgba(239,68,68,0.1)", color: "#ef4444",
              fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 12,
            }}
          >
            Reinstate Account — Pay Fee
          </button>
          <button
            onClick={onClose}
            style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "8px 0" }}
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Strike 1 warning screen ───────────────────────────────────────────────
  if (screen === "strike1") {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      >
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            width: "100%", maxWidth: 480, background: "#0d0d0f",
            borderRadius: "24px 24px 0 0", padding: "32px 24px 48px",
            border: "1px solid rgba(251,146,60,0.3)", borderBottom: "none",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fb923c", margin: "0 0 6px" }}>Policy Violation — Strike 1 of 2</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>
              We detected a <strong style={{ color: "#fb923c" }}>{filterReason}</strong> in your question.
            </p>
          </div>

          <div style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: "0 0 8px" }}>Ghost House Rule</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.65 }}>
              Phone numbers, links, social handles, and app names cannot be shared here.
              Contact details are exchanged only after both of you unlock the connection.
              One more violation will result in <strong style={{ color: "#ef4444" }}>permanent account deactivation</strong> and a reinstatement fee to return.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2].map((n) => (
              <div key={n} style={{
                flex: 1, height: 6, borderRadius: 3,
                background: n <= currentStrikes ? "#ef4444" : "rgba(255,255,255,0.08)",
              }} />
            ))}
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "right", margin: "4px 0 20px", fontWeight: 700 }}>
            {currentStrikes}/2 strikes used
          </p>

          <button
            onClick={() => { setCustom(""); setSelected(null); setUseCustom(false); setScreen("question"); }}
            style={{
              width: "100%", height: 50, borderRadius: 50, border: "none",
              background: "linear-gradient(135deg,#fb923c,#ef4444)",
              color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 10,
            }}
          >
            I Understand — Edit My Question
          </button>
          <button
            onClick={onClose}
            style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "8px 0" }}
          >
            Skip for now
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Sent confirmation ──────────────────────────────────────────────────────
  if (screen === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      >
        <motion.div
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            width: "100%", maxWidth: 480, background: "#0d0d0f",
            borderRadius: "24px 24px 0 0", padding: "36px 24px 52px", textAlign: "center",
            border: `1px solid ${a.glow(0.15)}`, borderBottom: "none",
          }}
        >
          <img src={profile.image} alt={profile.name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${a.glow(0.5)}`, marginBottom: 14, boxShadow: `0 0 18px ${a.glow(0.3)}` }} />
          <p style={{ fontSize: 20, fontWeight: 800, color: a.accent, margin: "0 0 8px" }}>Question Sent 👻</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 28px", lineHeight: 1.5 }}>
            {profile.name} will see it when they open the match.
            If they reply, you'll both unlock the conversation naturally — no rush.
          </p>
          <button
            onClick={onClose}
            style={{
              width: "100%", height: 50, borderRadius: 50, border: "none",
              background: `linear-gradient(135deg,${a.accent},${a.accentMid})`,
              color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer",
            }}
          >
            Back to Feed
          </button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Main question screen ───────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, background: "#0d0d0f",
          borderRadius: "24px 24px 0 0", padding: "28px 20px 44px",
          border: "1px solid rgba(255,255,255,0.06)", borderBottom: "none",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <img src={profile.image} alt={profile.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.4)}` }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: 0 }}>It's a Match with {profile.name}! 👻</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Send one opening question — keep it genuine</p>
          </div>
        </div>

        {/* Policy notice */}
        <div style={{ background: a.glow(0.04), border: `1px solid ${a.glow(0.12)}`, borderRadius: 10, padding: "10px 14px", marginBottom: 18, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🔒</span>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.55 }}>
            No phone numbers, links, or social handles. Contact details are shared only after a mutual unlock. Violations earn strikes — 2 strikes = account deactivated.
          </p>
        </div>

        {/* Preset questions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => { setSelected(q); setUseCustom(false); }}
              style={{
                textAlign: "left", padding: "12px 14px", borderRadius: 12,
                background: selected === q && !useCustom ? a.glow(0.12) : "rgba(255,255,255,0.04)",
                border: selected === q && !useCustom ? `1px solid ${a.glow(0.4)}` : "1px solid rgba(255,255,255,0.07)",
                color: selected === q && !useCustom ? `${a.accent}` : "rgba(255,255,255,0.65)",
                fontSize: 13, fontWeight: selected === q && !useCustom ? 700 : 500,
                cursor: "pointer", lineHeight: 1.4,
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Custom question toggle */}
        <button
          onClick={() => { setUseCustom(true); setSelected(null); setTimeout(() => inputRef.current?.focus(), 50); }}
          style={{
            width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: 12,
            background: useCustom ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.03)",
            border: useCustom ? "1px solid rgba(168,85,247,0.35)" : "1px solid rgba(255,255,255,0.06)",
            color: useCustom ? "rgba(168,85,247,0.9)" : "rgba(255,255,255,0.3)",
            fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: useCustom ? 8 : 16,
          }}
        >
          ✏️ Write my own question
        </button>

        <AnimatePresence>
          {useCustom && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginBottom: 16 }}>
              <textarea
                ref={inputRef}
                value={custom}
                onChange={(e) => handleCustomChange(e.target.value)}
                maxLength={160}
                placeholder="Type a genuine question…"
                rows={3}
                style={{
                  width: "100%", borderRadius: 12, padding: "12px 14px", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13,
                  border: isCustomBlocked ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                  outline: "none", resize: "none", lineHeight: 1.5,
                }}
              />
              {isCustomBlocked && (
                <p style={{ fontSize: 11, color: "#ef4444", margin: "4px 0 0 4px", fontWeight: 700 }}>
                  ⚠️ {filterContent(custom.trim()).reason} detected — remove it before sending
                </p>
              )}
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "4px 0 0", textAlign: "right" }}>
                {custom.length}/160
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            width: "100%", height: 50, borderRadius: 50, border: "none",
            background: canSend ? `linear-gradient(135deg,${a.accent},${a.accentMid})` : "rgba(255,255,255,0.06)",
            color: canSend ? "#000" : "rgba(255,255,255,0.2)",
            fontSize: 15, fontWeight: 800, cursor: canSend ? "pointer" : "default",
            transition: "all 0.2s",
          }}
        >
          Send Question
        </button>

        <button
          onClick={onClose}
          style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "12px 0 0" }}
        >
          Skip — connect after unlock
        </button>
      </motion.div>
    </motion.div>
  );
}
