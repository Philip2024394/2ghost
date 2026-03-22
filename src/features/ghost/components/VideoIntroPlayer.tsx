import { useState } from "react";
import { motion } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import {
  sendVideoRequest, getVideoRequestStatus, profileHasVideo, readCoins,
} from "../utils/featureGating";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId } from "../utils/ghostHelpers";

// Simulated approved video for demo — in production this would be a real URL
const DEMO_VIDEO = "";

type Props = {
  profile: GhostProfile;
  myGhostId: string;
  onClose: () => void;
};

export default function VideoIntroPlayer({ profile, myGhostId, onClose }: Props) {
  const a = useGenderAccent();
  const hasVideo = profileHasVideo(profile.id);
  const existing = getVideoRequestStatus(profile.id);
  const [status, setStatus] = useState<"idle" | "requesting" | "pending" | "approved" | "denied" | "no_video">(
    !hasVideo ? "no_video" : existing ? existing.status as "pending" | "approved" | "denied" : "idle"
  );
  const [requesting, setRequesting] = useState(false);

  const coins = readCoins();

  function handleRequest() {
    if (requesting) return;
    setRequesting(true);
    const ok = sendVideoRequest(profile.id, myGhostId);
    if (!ok) { setRequesting(false); return; }
    // Simulate: 30% instant approve (demo), rest stay pending
    setTimeout(() => {
      const autoApprove = Math.abs(profile.id.charCodeAt(0)) % 3 === 0;
      setStatus(autoApprove ? "approved" : "pending");
      setRequesting(false);
    }, 1800);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 650, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,10,0.99)", borderRadius: "24px 24px 0 0", border: `1px solid ${a.glow(0.2)}`, borderBottom: "none", overflow: "hidden" }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)` }} />
        <div style={{ padding: "18px 20px max(36px,env(safe-area-inset-bottom,36px))" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", margin: "0 auto 16px" }} />

          {/* Profile row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <img src={profile.image} alt="" style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.35)}` }}
              onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: a.accent, letterSpacing: "0.12em", textTransform: "uppercase" }}>Video Introduction</p>
              <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 900, color: "#fff" }}>{toGhostId(profile.id)}</p>
            </div>
          </div>

          {status === "no_video" && (
            <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🎬</div>
              <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>No video intro yet</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", lineHeight: 1.6 }}>
                {toGhostId(profile.id)} hasn't uploaded a video introduction.
              </p>
              <button onClick={onClose} style={{ height: 44, padding: "0 28px", borderRadius: 12, border: `1px solid ${a.glow(0.3)}`, background: a.glow(0.08), color: a.accent, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                Got it
              </button>
            </div>
          )}

          {status === "idle" && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              {/* Blurred thumbnail */}
              <div style={{ position: "relative", width: "100%", height: 180, borderRadius: 16, overflow: "hidden", marginBottom: 18, background: "rgba(255,255,255,0.04)", border: `1px solid ${a.glow(0.15)}` }}>
                <img src={profile.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(20px)", transform: "scale(1.1)" }} />
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 22 }}>▶️</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>Request to unlock</p>
                </div>
              </div>

              <div style={{ background: `${a.glow(0.05)}`, border: `1px solid ${a.glow(0.15)}`, borderRadius: 12, padding: "10px 14px", marginBottom: 18, display: "flex", gap: 9, alignItems: "flex-start", textAlign: "left" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>🔒</span>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>
                    Video intros are <strong style={{ color: "#fff" }}>vault-protected</strong>. Send a 5-coin request — if they approve, you'll be notified to watch in the Vault.
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 10, color: coins < 5 ? "#f87171" : a.accent }}>
                    🪙 {coins} coins available · costs 5 coins
                  </p>
                </div>
              </div>

              {coins < 5 ? (
                <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 12px" }}>Not enough coins to request. Visit the coin shop.</p>
              ) : null}

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleRequest} disabled={requesting || coins < 5}
                style={{ width: "100%", height: 52, borderRadius: 16, border: "none", background: coins >= 5 ? a.gradient : "rgba(255,255,255,0.06)", color: coins >= 5 ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 900, cursor: coins >= 5 ? "pointer" : "default", boxShadow: coins >= 5 ? `0 8px 24px ${a.glow(0.3)}` : "none", transition: "all 0.2s" }}
              >
                {requesting ? (
                  <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>Sending request…</motion.span>
                ) : "🎬 Request Video Intro — 5 Coins"}
              </motion.button>
            </div>
          )}

          {status === "pending" && (
            <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📬</div>
              <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>Request sent</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 20px", lineHeight: 1.6 }}>
                {toGhostId(profile.id)} will be notified. If they approve, you'll receive an alert to watch the video in your Vault.
              </p>
              <button onClick={onClose} style={{ height: 44, padding: "0 28px", borderRadius: 12, border: `1px solid ${a.glow(0.3)}`, background: a.glow(0.08), color: a.accent, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                Got it
              </button>
            </div>
          )}

          {status === "approved" && (
            <div style={{ padding: "8px 0" }}>
              <div style={{ width: "100%", height: 200, borderRadius: 16, overflow: "hidden", marginBottom: 16, background: "#000", border: `1px solid ${a.glow(0.25)}`, position: "relative" }}>
                {DEMO_VIDEO ? (
                  <video src={DEMO_VIDEO} controls autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ fontSize: 36 }}>🎬</span>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>Video plays here<br />(Vault protected)</p>
                  </div>
                )}
              </div>
              <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, padding: "8px 12px", marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 11, color: "#4ade80" }}>✓ Approved — watch in the Vault only. This video cannot be shared or saved.</p>
              </div>
              <button onClick={onClose} style={{ width: "100%", height: 48, borderRadius: 14, border: "none", background: a.gradient, color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                Close
              </button>
            </div>
          )}

          {status === "denied" && (
            <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
              <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>Request declined</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", lineHeight: 1.6 }}>
                {toGhostId(profile.id)} chose to keep their video private for now.
              </p>
              <button onClick={onClose} style={{ height: 44, padding: "0 28px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Close
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
