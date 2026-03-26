// ── Breakfast Invite Received Popup ───────────────────────────────────────────
// Shown to User B when they receive a breakfast invite.
// If online → must accept or decline (no dismiss).
// If returning from offline → shown on next login.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import {
  DECLINE_REASONS, acceptInvite, declineInvite,
  formatInTimezone, tzCity, tzShortLabel, getLocalTimezone,
} from "../utils/breakfastInviteService";
import { BREAKFAST_BILL } from "../utils/reputationService";
import type { BreakfastInvite } from "../utils/breakfastInviteService";
import { FLOOR_META } from "../utils/breakfastGiftService";

const LOUNGE_IMG    = "https://ik.imagekit.io/7grri5v7d/SADFASDFASDFASDFSdsfasdfsssswefwe.png";
const BREAKFAST_IMG = "https://ik.imagekit.io/7grri5v7d/sdfsdfsss-removebg-preview.png";

type Props = {
  invite:    BreakfastInvite;
  onAccept:  () => void; // triggers lounge splash
  onDecline: () => void;
};

export default function BreakfastInviteReceived({ invite, onAccept, onDecline }: Props) {
  const [step,          setStep]         = useState<"main" | "decline">("main");
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [confirming,    setConfirming]   = useState(false);

  const meta = FLOOR_META[invite.fromFloor] ?? FLOOR_META.standard;
  const r = parseInt(meta.color.slice(1,3),16);
  const g = parseInt(meta.color.slice(3,5),16);
  const b = parseInt(meta.color.slice(5,7),16);
  const glow = (o: number) => `rgba(${r},${g},${b},${o})`;

  // Timezone coordination
  const myTz       = getLocalTimezone();
  const hostTz     = invite.senderTimezone ?? myTz;
  const hostCity   = tzCity(hostTz);
  const hostLabel  = tzShortLabel(hostTz);
  const myCity     = tzCity(myTz);
  const myLabel    = tzShortLabel(myTz);
  const isSameTz   = hostLabel === myLabel;
  const hostTime   = invite.proposedTime ? formatInTimezone(invite.proposedTime, hostTz) : null;
  const myTime     = invite.proposedTime ? formatInTimezone(invite.proposedTime, myTz) : null;
  const hasTime    = !!invite.proposedTime;

  function handleAccept() {
    setConfirming(true);
    acceptInvite();
    setTimeout(() => onAccept(), 600);
  }

  function handleDecline() {
    if (!selectedReason) return;
    declineInvite(selectedReason);
    onDecline();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9700, background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,15,0.99)",
          borderRadius: "24px 24px 0 0", border: `1px solid ${glow(0.35)}`,
          borderBottom: "none", overflow: "hidden",
          paddingBottom: "max(28px,env(safe-area-inset-bottom,28px))" }}
      >
        {/* Accent */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }} />

        <AnimatePresence mode="wait">
          {step === "main" ? (
            <motion.div key="main"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

              {/* Lounge preview image */}
              <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                <img src={LOUNGE_IMG} alt="The Lounge"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0,
                  background: "linear-gradient(to bottom, transparent 30%, rgba(6,6,15,0.95) 100%)" }} />
                <div style={{ position: "absolute", bottom: 14, left: 18 }}>
                  <p style={{ margin: 0, fontSize: 11, color: meta.color, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                    {meta.icon} The Lounge · {meta.label}
                  </p>
                </div>
              </div>

              <div style={{ padding: "0 20px 0" }}>
                {/* Breakfast image — top of content, centred above title */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: -48, marginBottom: 8, position: "relative", zIndex: 2 }}>
                  <img src={BREAKFAST_IMG} alt=""
                    style={{ height: 110, objectFit: "contain", pointerEvents: "none",
                      filter: "drop-shadow(0 4px 24px rgba(0,0,0,0.8))" }} />
                </div>

                {/* Title */}
                <p style={{ margin: "0 0 16px", fontSize: 11, color: meta.color, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "center" }}>
                  Breakfast Invitation
                </p>

                {/* ── Host profile card ── */}
                {(() => {
                  const avatarSeed = invite.fromAvatar ?? (String(invite.fromUserId).replace(/\D/g,"").slice(0,3) || "77");
                  const avatarUrl  = invite.fromPhoto
                    ? invite.fromPhoto
                    : `https://api.dicebear.com/7.x/thumbs/svg?seed=${avatarSeed}`;
                  const ghostId    = `Guest-${String(invite.fromUserId).replace(/\D/g,"").slice(0,5).padStart(4,"0")}`;
                  return (
                    <div style={{ display: "flex", gap: 14, alignItems: "center",
                      background: glow(0.07), border: `1px solid ${glow(0.22)}`,
                      borderRadius: 18, padding: "14px 16px", marginBottom: 16 }}>
                      {/* Photo */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img src={avatarUrl} alt={invite.fromUserName}
                          style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover",
                            border: `2px solid ${glow(0.5)}` }} />
                        {/* Online dot */}
                        <div style={{ position: "absolute", bottom: 3, right: 3, width: 12, height: 12,
                          borderRadius: "50%", background: "#22c55e", border: "2px solid #06060f" }} />
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {invite.fromUserName}
                          {invite.fromAge ? <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>, {invite.fromAge}</span> : null}
                        </p>
                        <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
                          {invite.fromCountryFlag ?? ""}{invite.fromCity ? ` ${invite.fromCity}` : ""}
                        </p>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6,
                          background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "3px 8px" }}>
                          <span style={{ fontSize: 10, color: meta.color, fontWeight: 800, fontFamily: "monospace" }}>
                            {ghostId}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Invite message */}
                <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
                  <span style={{ color: meta.color, fontWeight: 800 }}>{invite.fromUserName}</span> has reserved a private table for two and is inviting you to share breakfast together.
                </p>

                {/* Connection opportunity note */}
                <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, marginBottom: 16 }}>
                  <p style={{ margin: "0 0 7px", fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
                    This could be the start of something real.
                  </p>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.7 }}>
                    A shared breakfast is one of the most natural ways to build a genuine connection — no pressure, no rush. Just two people getting to know each other over a quiet moment in the lounge.
                  </p>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 0 10px" }} />
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
                    <span style={{ color: meta.color, fontWeight: 700 }}>Before you decide —</span> take a moment to review their profile. Check their guest reputation and attendance record. Your time is valuable, and a good connection starts with making an informed choice.
                  </p>
                </div>

                {/* Gift teaser — mystery */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>🎁</span>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                    A surprise is waiting for you at your seat. Accept to discover it.
                  </p>
                </div>

                {/* ── Timezone time card ── */}
                {hasTime && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Clock size={12} color={meta.color} />
                      <p style={{ margin: 0, fontSize: 11, color: meta.color, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Proposed breakfast time
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1, padding: "10px 12px", background: glow(0.08),
                        border: `1px solid ${glow(0.25)}`, borderRadius: 14, textAlign: "center" }}>
                        <p style={{ margin: "0 0 2px", fontSize: 10, color: "rgba(255,255,255,0.4)",
                          fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {invite.fromUserName} · {hostCity}
                        </p>
                        <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: meta.color }}>{hostTime}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{hostLabel}</p>
                      </div>
                      {!isSameTz && (
                        <div style={{ display: "flex", alignItems: "center", color: "rgba(255,255,255,0.2)", fontSize: 16 }}>→</div>
                      )}
                      {!isSameTz && (
                        <div style={{ flex: 1, padding: "10px 12px", background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, textAlign: "center" }}>
                          <p style={{ margin: "0 0 2px", fontSize: 10, color: "rgba(255,255,255,0.4)",
                            fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Your time · {myCity}
                          </p>
                          <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff" }}>{myTime}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{myLabel}</p>
                        </div>
                      )}
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
                      Be at the lounge around this time. If you can't make it, your butler will send a kind word.
                    </p>
                  </div>
                )}

                {/* Butler commitment warning with penalty amount */}
                <div style={{ borderRadius: 14, marginBottom: 14, overflow: "hidden",
                  border: "1px solid rgba(239,68,68,0.28)" }}>
                  <div style={{ padding: "9px 14px", background: "rgba(239,68,68,0.1)",
                    borderBottom: "1px solid rgba(239,68,68,0.15)",
                    display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 13 }}>🎩</span>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#f87171",
                      textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      Butler Policy · Binding Commitment
                    </p>
                  </div>
                  <div style={{ padding: "11px 14px", background: "rgba(239,68,68,0.05)" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}>
                      Accepting this invitation is a <strong style={{ color: "#fff" }}>binding commitment</strong>.
                      If you do not appear at the agreed time, your account will be automatically charged:
                    </p>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px",
                      background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: 8, marginBottom: 7 }}>
                      <span style={{ fontSize: 16 }}>🔴</span>
                      <span style={{ fontSize: 15, fontWeight: 900, color: "#f87171" }}>
                        {BREAKFAST_BILL[invite.fromFloor] ?? 20}🪙 no-show penalty
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(248,113,113,0.6)", lineHeight: 1.6 }}>
                      This covers both covers at the reserved table. Insufficient coins will result in a red debt balance and suspended invite privileges.
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => setStep("decline")}
                    style={{ flex: 1, height: 50, borderRadius: 14, background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)",
                      fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    Decline
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleAccept}
                    disabled={confirming}
                    style={{ flex: 2, height: 50, borderRadius: 14,
                      background: confirming ? glow(0.2) : `linear-gradient(135deg, ${meta.color}55, ${meta.color}33)`,
                      border: `1.5px solid ${glow(0.7)}`, color: meta.color,
                      fontSize: 15, fontWeight: 900, cursor: "pointer" }}>
                    {confirming ? "Heading to the lounge…" : "Yes, I'd love to join ☕"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="decline"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ padding: "20px 20px 0" }}>

              <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 900, color: "#fff" }}>Send your apologies</p>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Choose a reason to send to {invite.fromUserName}</p>

              {DECLINE_REASONS.map(reason => (
                <motion.button key={reason} whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedReason(reason)}
                  style={{ width: "100%", display: "block", padding: "13px 16px", marginBottom: 8,
                    borderRadius: 14, textAlign: "left", cursor: "pointer",
                    background: selectedReason === reason ? glow(0.1) : "rgba(255,255,255,0.03)",
                    border: `1px solid ${selectedReason === reason ? glow(0.4) : "rgba(255,255,255,0.07)"}`,
                    color: selectedReason === reason ? "#fff" : "rgba(255,255,255,0.6)",
                    fontSize: 14, fontWeight: selectedReason === reason ? 700 : 500 }}>
                  {reason}
                </motion.button>
              ))}

              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={() => setStep("main")}
                  style={{ flex: 1, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)",
                    fontSize: 13, cursor: "pointer" }}>
                  Back
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleDecline}
                  disabled={!selectedReason}
                  style={{ flex: 2, height: 46, borderRadius: 12,
                    background: selectedReason ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${selectedReason ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.08)"}`,
                    color: selectedReason ? "#ef4444" : "rgba(255,255,255,0.25)",
                    fontSize: 14, fontWeight: 700, cursor: selectedReason ? "pointer" : "not-allowed" }}>
                  Send apologies
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
