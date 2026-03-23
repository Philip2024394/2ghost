// ── Social Activity Invite Popup ───────────────────────────────────────────────
// Shown to User B after the 24-hour delay when the butler delivers the invite.
// Appears as a popup when they return to their floor room.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { acceptSocialInvite, declineSocialInvite, SOCIAL_DECLINE_REASONS } from "../utils/breakfastRatingService";
import type { SocialInvite } from "../utils/breakfastRatingService";
import { FLOOR_META } from "../utils/breakfastGiftService";

const BUTLER_IMG = "https://ik.imagekit.io/7grri5v7d/sdfasdfacxv-removebg-preview.png?updatedAt=1774185654860";

type Props = {
  invite:    SocialInvite;
  onAccept:  () => void;
  onDecline: () => void;
};

function StarRow({ rating, color }: { rating: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ width: 16, height: 16, borderRadius: 3,
          background: i < rating ? color : "rgba(255,255,255,0.07)",
          border: `1px solid ${i < rating ? color + "aa" : "rgba(255,255,255,0.06)"}` }} />
      ))}
      <span style={{ marginLeft: 6, fontSize: 12, fontWeight: 800, color }}>{rating}/10</span>
    </div>
  );
}

export default function SocialActivityInvitePopup({ invite, onAccept, onDecline }: Props) {
  const [step,           setStep]          = useState<"main" | "decline">("main");
  const [selectedReason, setSelectedReason]= useState<string | null>(null);
  const [accepting,      setAccepting]     = useState(false);

  const meta = FLOOR_META[invite.floor] ?? FLOOR_META.standard;
  const r = parseInt(meta.color.slice(1,3),16);
  const g = parseInt(meta.color.slice(3,5),16);
  const b = parseInt(meta.color.slice(5,7),16);
  const glow = (o: number) => `rgba(${r},${g},${b},${o})`;

  function handleAccept() {
    setAccepting(true);
    acceptSocialInvite();
    setTimeout(() => onAccept(), 700);
  }
  function handleDecline() {
    if (!selectedReason) return;
    declineSocialInvite(selectedReason);
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
          borderBottom: "none", maxHeight: "90dvh", display: "flex", flexDirection: "column",
          paddingBottom: "max(28px,env(safe-area-inset-bottom,28px))" }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`, flexShrink: 0 }} />

        <AnimatePresence mode="wait">
          {step === "main" ? (
            <motion.div key="main"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ overflowY: "auto", padding: "20px 20px 0" }}>

              {/* Butler header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <img src={BUTLER_IMG} alt="Butler"
                  style={{ width: 52, height: 52, borderRadius: 13, objectFit: "cover",
                    border: `2px solid ${glow(0.5)}` }} />
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: meta.color, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em" }}>A message from your butler</p>
                  <p style={{ margin: "2px 0 0", fontSize: 15, fontWeight: 900, color: "#fff" }}>
                    A social invitation awaits
                  </p>
                </div>
              </div>

              {/* Butler message */}
              <div style={{ padding: "13px 15px", background: glow(0.07), border: `1px solid ${glow(0.2)}`,
                borderRadius: 14, marginBottom: 18 }}>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, fontStyle: "italic" }}>
                  "Good day. <span style={{ color: meta.color, fontWeight: 800, fontStyle: "normal" }}>{invite.fromUserName}</span> has requested the pleasure of your company for a social outing. I took the liberty of allowing a day to pass — these matters deserve consideration. You are under no obligation."
                </p>
              </div>

              {/* Activity card */}
              <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${glow(0.25)}`, marginBottom: 16 }}>
                {invite.activity.imageUrl ? (
                  <div style={{ position: "relative", height: 120 }}>
                    <img src={invite.activity.imageUrl} alt={invite.activity.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0,
                      background: "linear-gradient(to bottom, transparent 20%, rgba(6,6,15,0.9) 100%)" }} />
                    <div style={{ position: "absolute", bottom: 12, left: 14, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 22 }}>{invite.activity.icon}</span>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff" }}>{invite.activity.name}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: "18px 16px", background: glow(0.08), display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 38 }}>{invite.activity.icon}</span>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: meta.color }}>{invite.activity.name}</p>
                  </div>
                )}
                <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)" }}>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{invite.activity.description}</p>
                </div>
              </div>

              {/* Ratings */}
              {(invite.hostRating >= 6 || invite.guestRating >= 6) && (
                <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 18 }}>
                  <p style={{ margin: "0 0 10px", fontSize: 11, color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                    Breakfast connection signals
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {invite.hostRating >= 6 && (
                      <div>
                        <p style={{ margin: "0 0 5px", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{invite.fromUserName}</p>
                        <StarRow rating={invite.hostRating} color={meta.color} />
                      </div>
                    )}
                    {invite.guestRating >= 6 && (
                      <div>
                        <p style={{ margin: "0 0 5px", fontSize: 10, color: meta.color, fontWeight: 700 }}>Your rating · Mutual interest</p>
                        <StarRow rating={invite.guestRating} color={meta.color} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setStep("decline")}
                  style={{ flex: 1, height: 50, borderRadius: 14, background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)",
                    fontSize: 14, cursor: "pointer" }}>
                  Decline
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleAccept} disabled={accepting}
                  style={{ flex: 2, height: 50, borderRadius: 14,
                    background: accepting ? glow(0.2) : `linear-gradient(135deg, ${meta.color}44, ${meta.color}22)`,
                    border: `1.5px solid ${glow(0.65)}`, color: meta.color,
                    fontSize: 15, fontWeight: 900, cursor: "pointer" }}>
                  {accepting ? "Confirmed with butler…" : "I'd love to join ✨"}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="decline"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ padding: "20px 20px 0" }}>
              <p style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 900, color: "#fff" }}>Send your apologies</p>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
                The butler will pass your message to {invite.fromUserName}.
              </p>
              {SOCIAL_DECLINE_REASONS.map(reason => (
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
                    fontSize: 13, cursor: "pointer" }}>Back</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleDecline} disabled={!selectedReason}
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
