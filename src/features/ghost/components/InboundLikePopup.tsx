import { motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import type { InboundLike } from "../types/ghostTypes";
import { toGhostId } from "../utils/ghostHelpers";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

// ── Inbound like notification popup ─────────────────────────────────────────
export default function InboundLikePopup({
  like, onLikeBack, onPass,
}: {
  like: InboundLike;
  onLikeBack: () => void;
  onPass: () => void;
}) {
  const a = useGenderAccent();
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px",
      }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        style={{
          width: "100%", maxWidth: 360,
          background: "rgba(6,6,10,0.95)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 22, border: `1px solid ${a.glow(0.25)}`,
          overflow: "hidden",
          boxShadow: `0 24px 80px rgba(0,0,0,0.7), 0 0 40px ${a.glow(0.1)}`,
        }}
      >
        {/* Top accent */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${a.accentMid}, ${a.accent}, #22c55e)` }} />

        <div style={{ padding: "22px 20px 20px" }}>
          {/* Flag + country badge */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div style={{
              background: a.glow(0.1), border: `1px solid ${a.glow(0.25)}`,
              borderRadius: 20, padding: "4px 14px",
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 12, fontWeight: 700, color: a.glow(0.9),
            }}>
              <span style={{ fontSize: 20 }}>{like.countryFlag}</span>
              Someone from {like.country} is interested
            </div>
          </div>

          {/* Anonymous blurred photo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div style={{
              width: 90, height: 90, borderRadius: "50%", overflow: "hidden",
              border: `3px solid ${a.glow(0.4)}`,
              boxShadow: `0 0 24px ${a.glow(0.2)}`,
              position: "relative",
            }}>
              <img
                src={like.image} alt="Anonymous"
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(10px) brightness(0.7)" }}
              />
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              }}><img src={GHOST_LOGO} alt="ghost" style={{ width: 96, height: 96, objectFit: "contain" }} /></div>
            </div>
          </div>

          {/* Info */}
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: a.glow(0.85), margin: "0 0 4px", letterSpacing: "0.05em" }}>
              <span>{toGhostId(like.id)}</span>
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 6px" }}>
              <span>{like.age} · {like.city}, {like.country} {like.countryFlag}</span>
            </p>
            <h3 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: "0 0 10px" }}>
              <span>A Ghost Has Appeared — and liked you</span>
            </h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>
              <span>Like back to reveal their real name and connect — or pass.</span>
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onPass}
              style={{
                flex: 1, height: 48, borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <X size={15} /> Pass
            </button>
            <button
              onClick={onLikeBack}
              style={{
                flex: 2, height: 48, borderRadius: 14, border: "none",
                background: `linear-gradient(135deg, ${a.accentDark}, ${a.accentMid})`,
                color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: `0 4px 20px ${a.glowMid(0.4)}`,
              }}
            >
              <Heart size={15} fill="currentColor" /> Like Back
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
