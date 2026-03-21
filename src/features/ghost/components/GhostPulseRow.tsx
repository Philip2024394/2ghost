import { motion } from "framer-motion";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId, isProfileTonight } from "../utils/ghostHelpers";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
// ── Ghost Pulse row ──────────────────────────────────────────────────────────
export default function GhostPulseRow({ profiles, onSelect }: { profiles: GhostProfile[]; onSelect: (p: GhostProfile) => void }) {
  const a = useGenderAccent();
  const pulse = profiles.filter((p) => (p.lastActiveHoursAgo ?? 99) <= 1).slice(0, 8);
  if (pulse.length === 0) return null;
  return (
    <div style={{ margin: "10px 14px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <motion.span
          animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          style={{ width: 7, height: 7, borderRadius: "50%", background: a.accent, display: "block", boxShadow: `0 0 8px ${a.glow(0.9)}`, flexShrink: 0 }}
        />
        <span style={{ fontSize: 10, fontWeight: 800, color: a.glow(0.85), letterSpacing: "0.1em", textTransform: "uppercase" }}>Ghost Pulse</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>· {pulse.length} live now</span>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
        {pulse.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelect(p)}
            style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
          >
            <div style={{ position: "relative", width: 54, height: 54 }}>
              <motion.div
                animate={{ scale: [1, 1.22, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: Math.random() * 1.2 }}
                style={{
                  position: "absolute", inset: -5, borderRadius: "50%",
                  border: `2px solid ${a.glow(0.7)}`,
                  pointerEvents: "none",
                }}
              />
              <img
                src={p.image} alt=""
                style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", border: "2px solid ${a.glow(0.55)}", display: "block" }}
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              {isProfileTonight(p.id) && (
                <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 12, lineHeight: 1 }}>🌙</span>
              )}
            </div>
            <p style={{ fontSize: 8, color: a.glow(0.8), fontWeight: 700, margin: 0, letterSpacing: "0.04em" }}>
              <span>{toGhostId(p.id).replace("Ghost-", "")}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
