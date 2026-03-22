import { useState } from "react";
import { motion } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { canSendWhisper, whisperCooldownDays, saveWhisperSent, whisperWillConvert, readCoins } from "../utils/featureGating";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId } from "../utils/ghostHelpers";

type Props = {
  profile: GhostProfile;
  onClose: () => void;
  onWhisperSent: (profile: GhostProfile, willConvert: boolean) => void;
};

export default function WhisperSheet({ profile, onClose, onWhisperSent }: Props) {
  const a = useGenderAccent();
  const [text,  setText]  = useState("");
  const [phase, setPhase] = useState<"compose" | "sent" | "cooldown">(canSendWhisper() ? "compose" : "cooldown");

  const MAX = 160;
  const canSend = text.trim().length >= 8 && text.trim().length <= MAX;
  const willConvert = whisperWillConvert(profile.id);
  const daysLeft = whisperCooldownDays();

  function handleSend() {
    if (!canSend) return;
    saveWhisperSent(profile.id);
    setPhase("sent");
    // Schedule potential match conversion
    if (willConvert) {
      const delay = (90 + Math.floor(Math.random() * 120)) * 1000; // 90–210 seconds
      onWhisperSent(profile, true);
      setTimeout(() => {}, delay); // parent handles conversion
    } else {
      onWhisperSent(profile, false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,10,0.99)", borderRadius: "24px 24px 0 0", border: "1px solid rgba(139,92,246,0.25)", borderBottom: "none", overflow: "hidden" }}
      >
        {/* Purple whisper stripe */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #7c3aed, #a78bfa, #7c3aed, transparent)" }} />
        <div style={{ padding: "20px 22px max(36px,env(safe-area-inset-bottom,36px))" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", margin: "0 auto 18px" }} />

          {phase === "cooldown" && (
            <div style={{ textAlign: "center", padding: "8px 0 12px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🤫</div>
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "#fff" }}>Whisper already sent</p>
              <p style={{ margin: "0 0 20px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                You can send one whisper per week.<br />
                Next whisper available in <strong style={{ color: "#a78bfa" }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>.
              </p>
              <button onClick={onClose} style={{ height: 44, padding: "0 28px", borderRadius: 12, border: "1px solid rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.1)", color: "#a78bfa", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                Got it
              </button>
            </div>
          )}

          {phase === "sent" && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: "center", padding: "8px 0 12px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💨</div>
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "#fff" }}>Whisper delivered</p>
              <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                <strong style={{ color: "#a78bfa" }}>{toGhostId(profile.id)}</strong> will see your whisper with no sender attached.
              </p>
              <p style={{ margin: "0 0 24px", fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
                If they like you back, it becomes a match. Check your vault.
              </p>
              <button onClick={onClose} style={{ height: 44, padding: "0 28px", borderRadius: 12, border: "1px solid rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.1)", color: "#a78bfa", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                Close
              </button>
            </motion.div>
          )}

          {phase === "compose" && (
            <>
              {/* Profile preview */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ position: "relative" }}>
                  <img src={profile.image} alt="" style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(139,92,246,0.4)" }}
                    onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                  <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "1px solid rgba(139,92,246,0.2)", pointerEvents: "none" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#a78bfa", letterSpacing: "0.12em", textTransform: "uppercase" }}>The Whisper</p>
                  <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 900, color: "#fff" }}>To {toGhostId(profile.id)}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>They haven't liked you yet — this is your one shot</p>
                </div>
              </div>

              {/* Info box */}
              <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.18)", borderRadius: 12, padding: "10px 14px", marginBottom: 18, display: "flex", gap: 9, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>💌</span>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
                  They'll receive: <em style={{ color: "#c4b5fd" }}>"A ghost in the house left you a whisper…"</em> — no name, no face. If they like you after reading it, it becomes a match.
                </p>
              </div>

              {/* Textarea */}
              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>Your whisper</p>
              <textarea
                value={text}
                onChange={e => setText(e.target.value.slice(0, MAX))}
                placeholder="Say something honest. Something only you would say…"
                autoFocus
                style={{
                  width: "100%", minHeight: 90, background: "rgba(139,92,246,0.06)",
                  border: `1px solid ${text.trim().length >= 8 ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 14, padding: "12px 14px", color: "#fff", fontSize: 13,
                  resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.55,
                  boxSizing: "border-box", marginBottom: 6, transition: "border-color 0.2s",
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Min. 8 characters</span>
                <span style={{ fontSize: 9, color: text.length > MAX - 20 ? "#f87171" : "rgba(255,255,255,0.25)" }}>{text.length}/{MAX}</span>
              </div>

              {/* Coins notice */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
                <span style={{ fontSize: 12 }}>🪙</span>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                  Free to send · 1 whisper per week · You have <strong style={{ color: "#fbbf24" }}>{readCoins()} coins</strong>
                </p>
              </div>

              {/* Send */}
              <motion.button
                whileTap={{ scale: 0.97 }} onClick={handleSend} disabled={!canSend}
                style={{
                  width: "100%", height: 52, borderRadius: 16, border: "none",
                  background: canSend ? "linear-gradient(135deg, #4c1d95, #7c3aed, #a78bfa)" : "rgba(255,255,255,0.06)",
                  color: canSend ? "#fff" : "rgba(255,255,255,0.2)",
                  fontSize: 15, fontWeight: 900, cursor: canSend ? "pointer" : "default",
                  boxShadow: canSend ? "0 8px 24px rgba(124,58,237,0.4)" : "none", transition: "all 0.2s",
                }}
              >
                Send the Whisper 💨
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
