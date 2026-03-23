// ── Butler Excuse Popup ───────────────────────────────────────────────────────
// Shown when the agreed breakfast time passed and the other person didn't show.
// The butler delivers a graceful excuse on their behalf.

import { useState } from "react";
import { motion } from "framer-motion";
import { getRandomExcuse, markBreakfastMissed, formatInTimezone, tzCity, tzShortLabel } from "../utils/breakfastInviteService";
import type { BreakfastInvite } from "../utils/breakfastInviteService";
import { FLOOR_META } from "../utils/breakfastGiftService";

const BUTLER_IMG = "https://ik.imagekit.io/7grri5v7d/sdfasdfacxv-removebg-preview.png?updatedAt=1774185654860";

type Props = {
  invite:          BreakfastInvite;
  /** "host" = you sent the invite and they didn't show; "guest" = you were invited and didn't show */
  perspective:     "host" | "guest";
  onDismiss:       () => void;
  onReschedule?:   () => void;
};

export default function ButlerExcusePopup({ invite, perspective, onDismiss, onReschedule }: Props) {
  const [excuse] = useState(() => getRandomExcuse());

  const meta = FLOOR_META[invite.fromFloor] ?? FLOOR_META.standard;
  const r = parseInt(meta.color.slice(1,3),16);
  const g = parseInt(meta.color.slice(3,5),16);
  const b = parseInt(meta.color.slice(5,7),16);
  const glow = (o: number) => `rgba(${r},${g},${b},${o})`;

  // Time display
  const hostTz    = invite.senderTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hostCity  = tzCity(hostTz);
  const hostLabel = tzShortLabel(hostTz);
  const hostTime  = invite.proposedTime ? formatInTimezone(invite.proposedTime, hostTz) : null;

  const absentName = perspective === "host" ? invite.toUserName : invite.fromUserName;

  function handleDismiss() {
    markBreakfastMissed();
    onDismiss();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9800, background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,15,0.99)",
          borderRadius: "24px 24px 0 0", border: `1px solid ${glow(0.3)}`,
          borderBottom: "none", paddingBottom: "max(28px,env(safe-area-inset-bottom,28px))" }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }} />

        <div style={{ padding: "20px 20px 0" }}>
          {/* Butler header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <motion.img src={BUTLER_IMG} alt="Butler"
              animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
              style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover",
                border: `2px solid ${glow(0.4)}` }} />
            <div>
              <p style={{ margin: 0, fontSize: 11, color: meta.color, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.07em" }}>A word from your butler</p>
              <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 900, color: "#fff" }}>
                {absentName} didn't make it
              </p>
            </div>
          </div>

          {/* Agreed time reminder */}
          {hostTime && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⏰</span>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>
                  The agreed time was <span style={{ color: "#fff" }}>{hostTime}</span>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}> ({hostCity} · {hostLabel})</span>
                </p>
              </div>
            </div>
          )}

          {/* Butler excuse */}
          <div style={{ padding: "14px 16px", background: glow(0.06), border: `1px solid ${glow(0.18)}`,
            borderRadius: 16, marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, fontStyle: "italic" }}>
              "{excuse}"
            </p>
            <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              — Your butler, {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleDismiss}
              style={{ flex: 1, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)",
                fontSize: 13, cursor: "pointer" }}>
              Understood
            </button>
            {onReschedule && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={onReschedule}
                style={{ flex: 2, height: 48, borderRadius: 14,
                  background: `linear-gradient(135deg, ${meta.color}44, ${meta.color}22)`,
                  border: `1.5px solid ${glow(0.6)}`, color: meta.color,
                  fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                Try again tomorrow ☕
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
