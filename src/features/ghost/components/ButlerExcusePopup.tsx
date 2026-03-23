// ── Butler Excuse Popup ───────────────────────────────────────────────────────
// Shown when the agreed connection time passed and the other person didn't show.
// perspective="host" → you sent the invite and they ghosted you
// perspective="guest" → you were the one who didn't show (account warning shown)

import { useEffect } from "react";
import { motion } from "framer-motion";
import { formatInTimezone, tzCity, tzShortLabel, markBreakfastMissed } from "../utils/breakfastInviteService";
import type { BreakfastInvite } from "../utils/breakfastInviteService";
import { FLOOR_META } from "../utils/breakfastGiftService";
import { recordNoShow, BREAKFAST_BILL } from "../utils/reputationService";

const BUTLER_IMG  = "https://ik.imagekit.io/7grri5v7d/ewrwerwerwer-removebg-preview.png";
const CLOCK_IMG   = "https://ik.imagekit.io/7grri5v7d/Untitledsfsdfs-removebg-preview.png?updatedAt=1774267234482";
const BACK_IMG    = "https://ik.imagekit.io/7grri5v7d/sdfasdfdddsaasdf.png?updatedAt=1774270395199";

// Butler's upset messages — shown to the host (User A) who was stood up
const BUTLER_UPSET = [
  "I extend my sincerest apologies. This is not the standard I maintain in my hotel. I have placed a caution notice on their profile — other guests will be made aware.",
  "I am deeply displeased. A commitment was made, an agreement was honoured by you, and yet they failed to appear. I have noted this formally on their guest record.",
  "This is unacceptable conduct within these walls. I do not tolerate disrespect toward my guests. Their profile has been marked accordingly. You deserved better.",
  "My sincerest regrets. I run a house of courtesy and mutual respect — this behaviour falls far beneath that standard. A caution has been placed on their account.",
  "I must confess, I am rather cross. You set aside your time, you showed up — they did not. I have formally recorded this and their standing in the hotel has been noted.",
];

function getUpsetMessage() {
  return BUTLER_UPSET[Math.floor(Math.random() * BUTLER_UPSET.length)];
}

type Props = {
  invite:          BreakfastInvite;
  /** "host" = you sent the invite and they didn't show; "guest" = you are the one who didn't show */
  perspective:     "host" | "guest";
  onDismiss:       () => void;
  onReschedule?:   () => void;
};

export default function ButlerExcusePopup({ invite, perspective, onDismiss, onReschedule }: Props) {
  const meta = FLOOR_META[invite.fromFloor] ?? FLOOR_META.standard;
  const r = parseInt(meta.color.slice(1,3),16);
  const g = parseInt(meta.color.slice(3,5),16);
  const b = parseInt(meta.color.slice(5,7),16);
  const glow = (o: number) => `rgba(${r},${g},${b},${o})`;

  const hostTz    = invite.senderTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const hostCity  = tzCity(hostTz);
  const hostLabel = tzShortLabel(hostTz);
  const hostTime  = invite.proposedTime ? formatInTimezone(invite.proposedTime, hostTz) : null;

  const absentName = perspective === "host" ? invite.toUserName : invite.fromUserName;
  const absentId   = perspective === "host" ? invite.toUserId   : invite.fromUserId;

  // Record no-show and mark missed on mount
  useEffect(() => {
    if (perspective === "host") {
      recordNoShow(absentId);
      markBreakfastMissed();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDismiss() {
    onDismiss();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9800, background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        style={{ width: "100%", maxWidth: 480,
          borderRadius: "24px 24px 0 0", border: `1px solid ${glow(0.3)}`,
          borderBottom: "none", paddingBottom: "max(28px,env(safe-area-inset-bottom,28px))",
          position: "relative", overflow: "hidden" }}
      >
        {/* Back panel image */}
        <img src={BACK_IMG} alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center top", opacity: 0.12, zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(6,6,15,0.93)", zIndex: 0 }} />

        {/* Colour stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${perspective === "guest" ? "#ef4444" : meta.color}, transparent)`, position: "relative", zIndex: 1 }} />

        <div style={{ padding: "20px 20px 0", position: "relative", zIndex: 1 }}>

          {/* ── Butler header ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <motion.img src={BUTLER_IMG} alt="Butler"
              animate={{ rotate: perspective === "host" ? [-2, 2, -1, 0] : [0,0] }}
              transition={{ duration: 0.6, delay: 0.4 }}
              style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover",
                border: `2px solid ${perspective === "guest" ? "rgba(239,68,68,0.5)" : glow(0.4)}` }} />
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.07em",
                color: perspective === "guest" ? "#f87171" : meta.color }}>
                Butler Update
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 900, color: "#fff" }}>
                {perspective === "host"
                  ? `${absentName} did not appear`
                  : "You missed your connection"}
              </p>
            </div>
          </div>

          {/* ── Agreed time ── */}
          {hostTime && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12, marginBottom: 16 }}>
              <img src={CLOCK_IMG} alt="clock"
                style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.6)" }}>
                The agreed time was <span style={{ color: "#fff" }}>{hostTime}</span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}> ({hostCity} · {hostLabel})</span>
              </p>
            </div>
          )}

          {/* ── HOST VIEW: Butler upset message + caution notice ── */}
          {perspective === "host" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ padding: "14px 16px", background: "rgba(251,146,60,0.07)",
                  border: "1px solid rgba(251,146,60,0.22)", borderRadius: 16, marginBottom: 14 }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700,
                  color: "rgba(251,146,60,0.8)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  🎩 Your Butler
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.78)",
                  lineHeight: 1.8, fontStyle: "italic" }}>
                  "{getUpsetMessage()}"
                </p>
                <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  — Your butler, {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                </p>
              </motion.div>

              {/* Justice served — billing notice */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ borderRadius: 14, marginBottom: 14, overflow: "hidden",
                  border: "1px solid rgba(250,204,21,0.25)" }}>
                <div style={{ padding: "10px 14px", background: "rgba(250,204,21,0.08)",
                  borderBottom: "1px solid rgba(250,204,21,0.15)",
                  display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>⚖️</span>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "rgba(250,204,21,0.85)",
                    textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Justice Has Been Served
                  </p>
                </div>
                <div style={{ padding: "12px 14px", background: "rgba(250,204,21,0.04)" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                    <strong style={{ color: "#facc15" }}>{absentName}</strong> has been billed{" "}
                    <strong style={{ color: "#f87171" }}>{BREAKFAST_BILL[invite.fromFloor] ?? 20}🪙</strong>{" "}
                    — the full cost of both covers — directly from their account.
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                    If they lacked sufficient coins their balance has gone into red debt.
                    A caution notice has been placed on their profile, visible to all guests.
                  </p>
                </div>
              </motion.div>
            </>
          )}

          {/* ── GUEST VIEW: Account warning shown to the person who no-showed ── */}
          {perspective === "guest" && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ padding: "14px 16px", background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.25)", borderRadius: 16, marginBottom: 14 }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700,
                  color: "rgba(239,68,68,0.8)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  🎩 A Message From Your Butler
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.78)",
                  lineHeight: 1.8, fontStyle: "italic" }}>
                  "You accepted an invitation and did not honour it. The other guest set aside their time
                  for you. This falls below the standard expected of every person in this hotel.
                  I have noted this on your guest record."
                </p>
                <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  — Your butler
                </p>
              </motion.div>

              {/* Account consequence warning */}
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
                  background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.28)",
                  borderRadius: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>🚫</span>
                <div>
                  <p style={{ margin: "0 0 5px", fontSize: 12, fontWeight: 800, color: "#f87171" }}>
                    Your profile has been marked with a caution notice.
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(248,113,113,0.7)", lineHeight: 1.6 }}>
                    Other guests can now see your attendance record. Repeated no-shows will escalate
                    this to an <strong>Unreliable Guest</strong> flag and may result in your account
                    being reviewed or suspended.
                  </p>
                </div>
              </motion.div>

              {/* False accusation / dispute warning */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>
                  ⚖️ <strong style={{ color: "rgba(255,255,255,0.45)" }}>Important:</strong> Raising
                  false disputes or false accusations regarding attendance records is a serious violation
                  of hotel policy. Accounts found to be doing so will be permanently blocked without appeal.
                </p>
              </motion.div>
            </>
          )}

          {/* ── Actions ── */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleDismiss}
              style={{ flex: 1, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)",
                fontSize: 13, cursor: "pointer" }}>
              Understood
            </button>
            {onReschedule && perspective === "host" && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={onReschedule}
                style={{ flex: 2, height: 48, borderRadius: 14,
                  background: `linear-gradient(135deg, ${meta.color}44, ${meta.color}22)`,
                  border: `1.5px solid ${glow(0.6)}`, color: meta.color,
                  fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                Try again tomorrow
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
