// ── Breakfast Rating Popup ─────────────────────────────────────────────────────
// Shown to both users after "End Breakfast" is tapped.
// Ratings 1-5 close quietly. Ratings 6-10 trigger the butler signal.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  floorColor:  string;
  floorLabel:  string;
  guestName:   string;
  onRated:     (rating: number) => void;
  onSkip:      () => void;
};

export default function BreakfastRatingPopup({ floorColor, floorLabel, guestName, onRated, onSkip }: Props) {
  const [hovered,  setHovered]  = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [sending,  setSending]  = useState(false);

  const r = parseInt(floorColor.slice(1,3),16);
  const g = parseInt(floorColor.slice(3,5),16);
  const b = parseInt(floorColor.slice(5,7),16);
  const glow = (o: number) => `rgba(${r},${g},${b},${o})`;

  const active = hovered ?? selected ?? 0;

  const label =
    active >= 9 ? "Absolutely wonderful ✨" :
    active >= 7 ? "Really enjoyable ☕" :
    active >= 6 ? "Quite positive 🌅" :
    active >= 4 ? "It was pleasant" :
    active >= 2 ? "A little quiet" :
    active === 1 ? "Not for me" : "";

  function handleConfirm() {
    if (!selected) return;
    setSending(true);
    setTimeout(() => onRated(selected), 600);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9900,
        background: `url(https://ik.imagekit.io/7grri5v7d/SADFASDFASDFASDFSdsfasdfsssswefwe.png?updatedAt=1774260507935) top/cover no-repeat, rgba(0,0,0,0.85)`,
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ width: "100%", maxWidth: 480,
          background: "rgba(6,6,15,0.97)",
          borderRadius: "24px 24px 0 0", border: `1px solid ${glow(0.3)}`,
          borderBottom: "none", overflow: "hidden",
          paddingBottom: "max(28px,env(safe-area-inset-bottom,28px))" }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${floorColor}, transparent)` }} />

        <div style={{ padding: "28px 24px 0" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 1, delay: 0.4 }}
              style={{ marginBottom: 10 }}>
              <img src="https://ik.imagekit.io/7grri5v7d/sdfasdfasdfrrrr-removebg-preview.png" alt="" style={{ width: 72, height: 72, objectFit: "contain" }} />
            </motion.div>
            <p style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 900, color: "#fff" }}>
              How was breakfast?
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.55 }}>
              Rate your morning with <span style={{ color: floorColor, fontWeight: 700 }}>{guestName}</span>
              <br />Your rating is private — only the butler takes note.
            </p>
          </div>

          {/* 1–10 rating grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 14 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
              const isActive = n <= active;
              return (
                <motion.button key={n} whileTap={{ scale: 0.92 }}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected(n)}
                  style={{ height: 52, borderRadius: 14, fontSize: 18, fontWeight: 900, cursor: "pointer",
                    background: isActive ? glow(0.18) : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${isActive ? glow(0.55) : "rgba(255,255,255,0.07)"}`,
                    color: isActive ? floorColor : "rgba(255,255,255,0.3)",
                    transition: "all 0.12s" }}>
                  {n}
                </motion.button>
              );
            })}
          </div>

          {/* Label */}
          <div style={{ textAlign: "center", height: 22, marginBottom: 22 }}>
            <AnimatePresence mode="wait">
              {label && (
                <motion.p key={label}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ margin: 0, fontSize: 13, color: floorColor, fontWeight: 700 }}>
                  {label}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onSkip}
              style={{ flex: 1, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)",
                fontSize: 14, cursor: "pointer" }}>
              Skip
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirm}
              disabled={!selected || sending}
              style={{ flex: 2, height: 48, borderRadius: 14,
                background: selected ? `linear-gradient(135deg, ${floorColor}44, ${floorColor}22)` : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${selected ? glow(0.6) : "rgba(255,255,255,0.08)"}`,
                color: selected ? floorColor : "rgba(255,255,255,0.25)",
                fontSize: 15, fontWeight: 900, cursor: selected ? "pointer" : "not-allowed" }}>
              {sending ? "Noted by the butler…" : selected ? `Submit — ${selected}/10` : "Select a rating"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
