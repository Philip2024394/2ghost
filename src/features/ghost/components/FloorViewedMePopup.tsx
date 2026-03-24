// ── Floor Viewed Me Popup ─────────────────────────────────────────────────────
// Shows who viewed the user from within this floor and from other floors.
// Viewers are seeded deterministically from the floor's profile list.

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GhostProfile } from "../types/ghostTypes";
import { getProfileFloor, FLOOR_LABELS } from "./FloorInviteSheet";

const FLOOR_ICONS: Record<string, string> = {
  standard: "🏠", suite: "🛎️", kings: "🎰", penthouse: "🏙️", cellar: "🍷", garden: "🌿",
};

const VIEW_COUNTS = [4, 3, 2, 2, 2, 1, 3, 1, 2, 1, 1, 2, 1, 1, 1];

type Props = {
  floorKey:   string;
  floorLabel: string;
  floorColor: string;
  profiles:   GhostProfile[];
  onClose:    () => void;
};

export default function FloorViewedMePopup({ floorKey, floorLabel, floorColor, profiles, onClose }: Props) {
  const r = parseInt(floorColor.slice(1, 3), 16);
  const g = parseInt(floorColor.slice(3, 5), 16);
  const b = parseInt(floorColor.slice(5, 7), 16);
  const glow = (o: number) => `rgba(${r},${g},${b},${o})`;

  const viewedList = useMemo(() => {
    if (!profiles.length) return [];
    try {
      const gid = (() => { try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}").id || "anon"; } catch { return "anon"; } })();
      const seed = gid.split("").reduce((h: number, c: string) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0);
      const arr = [...profiles];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.abs(Math.sin(i * 71 + seed * 137)) * (i + 1) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr.slice(0, 15)
        .map((p, i) => ({ ...p, viewCount: VIEW_COUNTS[i] ?? 1, viewerFloor: getProfileFloor(p.id) }))
        .sort((a, b) => b.viewCount - a.viewCount);
    } catch { return []; }
  }, [profiles]);

  // Split: same floor first, then cross-floor
  const sameFloor  = viewedList.filter(p => p.viewerFloor === floorKey);
  const otherFloor = viewedList.filter(p => p.viewerFloor !== floorKey);
  const allSorted  = [...sameFloor, ...otherFloor];

  const keenCount = viewedList.filter(p => p.viewCount >= 3).length;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 520, background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, height: "88dvh",
          background: "rgba(6,6,10,0.99)", borderRadius: "22px 22px 0 0",
          border: `1px solid ${glow(0.2)}`, borderBottom: "none",
          display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Accent stripe */}
        <div style={{ height: 3, flexShrink: 0, background: `linear-gradient(90deg, transparent, ${floorColor}, transparent)` }} />

        {/* Header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 12px",
          borderBottom: `1px solid ${glow(0.1)}`, background: glow(0.04) }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: glow(0.14),
            border: `1.5px solid ${glow(0.38)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 19 }}>👁️</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: floorColor }}>Who Viewed Me</p>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
              {viewedList.length} profiles · {sameFloor.length} from {floorLabel} · {otherFloor.length} from other floors
            </p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>✕</span>
          </button>
        </div>

        {/* Keen viewers callout */}
        {keenCount > 0 && (
          <div style={{ flexShrink: 0, margin: "10px 14px 0", padding: "10px 14px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12,
            display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>
              {keenCount} {keenCount === 1 ? "person has" : "people have"} viewed your profile 3+ times — they&apos;re interested.
            </p>
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px max(20px,env(safe-area-inset-bottom,20px))" }}>

          {/* Same-floor section */}
          {sameFloor.length > 0 && (
            <p style={{ margin: "4px 0 8px", fontSize: 10, fontWeight: 800, color: floorColor,
              letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {FLOOR_ICONS[floorKey]} {floorLabel} members
            </p>
          )}

          {allSorted.map((p, i) => {
            const isSectionBreak = i === sameFloor.length && otherFloor.length > 0;
            const isKeen   = p.viewCount >= 3;
            const isWarm   = p.viewCount === 2;
            const cardBg   = isKeen ? "rgba(239,68,68,0.07)" : isWarm ? glow(0.07) : "rgba(255,255,255,0.03)";
            const cardBdr  = isKeen ? "1px solid rgba(239,68,68,0.25)" : isWarm ? `1px solid ${glow(0.22)}` : "1px solid rgba(255,255,255,0.07)";
            const badgeBg  = isKeen ? "rgba(239,68,68,0.18)" : isWarm ? glow(0.15) : "rgba(255,255,255,0.07)";
            const badgeCol = isKeen ? "#f87171" : isWarm ? floorColor : "rgba(255,255,255,0.35)";
            const badgeTxt = isKeen ? `🔥 Viewed ${p.viewCount}×` : isWarm ? "👀 Viewed twice" : "Viewed once";
            const floorLbl = FLOOR_LABELS[p.viewerFloor] ?? p.viewerFloor;
            const floorIco = FLOOR_ICONS[p.viewerFloor] ?? "🏠";
            const crossFloor = p.viewerFloor !== floorKey;

            return (
              <div key={p.id}>
                {isSectionBreak && (
                  <p style={{ margin: "14px 0 8px", fontSize: 10, fontWeight: 800,
                    color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    🏨 From other floors
                  </p>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  style={{ marginBottom: 8, borderRadius: 16, background: cardBg, border: cardBdr, overflow: "hidden" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", cursor: "pointer" }}>
                    {/* Avatar */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img src={p.image} alt={p.name}
                        style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover",
                          border: isKeen ? "2px solid rgba(239,68,68,0.5)" : isWarm ? `2px solid ${glow(0.5)}` : "2px solid rgba(255,255,255,0.12)",
                          display: "block" }}
                        onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                      />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.name}{p.age ? `, ${p.age}` : ""}
                        </p>
                        <span style={{ fontSize: 9, fontWeight: 800, color: badgeCol, background: badgeBg,
                          borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>
                          {badgeTxt}
                        </span>
                      </div>
                      {p.city && <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>📍 {p.city}</p>}

                      {/* Floor badge — always shown, highlighted for cross-floor */}
                      <p style={{ margin: "3px 0 0", fontSize: 9, fontWeight: crossFloor ? 800 : 600,
                        color: crossFloor ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)" }}>
                        {floorIco} {floorLbl}
                      </p>

                      {isKeen && <p style={{ margin: "3px 0 0", fontSize: 10, fontWeight: 700, color: "#f87171" }}>Keeps coming back — make a move</p>}
                      {isWarm && !isKeen && <p style={{ margin: "3px 0 0", fontSize: 10, fontWeight: 700, color: floorColor }}>Viewed you twice — like back?</p>}
                    </div>

                    {/* Like button */}
                    <motion.button whileTap={{ scale: 0.92 }}
                      style={{ width: 36, height: 36, borderRadius: 10, border: "none",
                        background: isKeen ? "rgba(239,68,68,0.2)" : glow(0.12),
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                      <span style={{ fontSize: 16 }}>❤️</span>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
