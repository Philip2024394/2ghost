// ── Butler Match Signal Popup ──────────────────────────────────────────────────
// Shown when user rates 6+.
// Step 1: Butler shows the rating signal + other person's rating (if available).
// Step 2: Activity picker — user selects a social gathering.
// Step 3: Butler confirmation — "I'll reach out in 24 hours."

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { loadActivities, createSocialInvite, SOCIAL_BUTLER_TIP, type SocialActivity } from "../utils/breakfastRatingService";
import type { BreakfastInvite } from "../utils/breakfastInviteService";

const BUTLER_IMG = "https://ik.imagekit.io/7grri5v7d/sdfasdfacxv-removebg-preview.png?updatedAt=1774185654860";

type Props = {
  invite:      BreakfastInvite;
  myRating:    number;
  otherRating: number | null;   // null if other hasn't rated yet
  floor:       string;
  floorColor:  string;
  floorLabel:  string;
  onClose:     () => void;
};

function StarRow({ rating, color }: { rating: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {Array.from({ length: 10 }, (_, i) => (
        <motion.div key={i}
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 15 }}
          style={{ width: 18, height: 18, borderRadius: 4,
            background: i < rating ? color : "rgba(255,255,255,0.07)",
            border: `1px solid ${i < rating ? color + "aa" : "rgba(255,255,255,0.08)"}` }} />
      ))}
      <span style={{ marginLeft: 6, fontSize: 13, fontWeight: 800, color }}>{rating}/10</span>
    </div>
  );
}

export default function ButlerMatchSignalPopup({ invite, myRating, otherRating, floor, floorColor, floorLabel, onClose }: Props) {
  const [step, setStep] = useState<"signal" | "activities" | "confirmed">("signal");
  const [selectedActivity, setSelectedActivity] = useState<SocialActivity | null>(null);
  const [confirming, setConfirming] = useState(false);

  const activities = loadActivities();
  const tip = SOCIAL_BUTLER_TIP[floor] ?? 10;
  const guestName = invite.toUserName !== "You" ? invite.toUserName : invite.fromUserName;

  const r = parseInt(floorColor.slice(1,3),16);
  const g = parseInt(floorColor.slice(3,5),16);
  const b = parseInt(floorColor.slice(5,7),16);
  const glow = (o: number) => `rgba(${r},${g},${b},${o})`;

  function handleArrangeActivity() {
    if (!selectedActivity) return;
    setConfirming(true);
    setTimeout(() => {
      createSocialInvite({
        inviteId:     invite.id,
        fromUserId:   "me",
        fromUserName: "You",
        toUserId:     invite.toUserId,
        toUserName:   guestName,
        floor,
        activity:     selectedActivity,
        hostRating:   myRating,
        guestRating:  otherRating ?? 0,
      });
      setConfirming(false);
      setStep("confirmed");
    }, 900);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9950, background: "rgba(0,0,0,0.92)",
        backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,15,0.99)",
          borderRadius: "24px 24px 0 0", border: `1px solid ${glow(0.35)}`,
          borderBottom: "none", maxHeight: "92dvh", display: "flex", flexDirection: "column",
          paddingBottom: "max(24px,env(safe-area-inset-bottom,24px))" }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${floorColor}, transparent)`, flexShrink: 0 }} />

        <AnimatePresence mode="wait">

          {/* ── Step 1: Match Signal ── */}
          {step === "signal" && (
            <motion.div key="signal"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ padding: "24px 22px 0", overflowY: "auto" }}>

              {/* Butler header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
                <img src={BUTLER_IMG} alt="Butler"
                  style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover",
                    border: `2px solid ${glow(0.5)}`, boxShadow: `0 0 18px ${glow(0.25)}` }} />
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: floorColor, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em" }}>Butler's Observation</p>
                  <p style={{ margin: "3px 0 0", fontSize: 15, fontWeight: 900, color: "#fff" }}>A promising connection</p>
                </div>
              </div>

              {/* Butler message */}
              <div style={{ padding: "14px 16px", background: glow(0.07), border: `1px solid ${glow(0.2)}`,
                borderRadius: 16, marginBottom: 22 }}>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, fontStyle: "italic" }}>
                  "Your breakfast introduction showed a genuine connection — something the butler rarely misses.
                  The chemistry here does not go unnoticed. We may be witnessing the early signs of a real match."
                </p>
              </div>

              {/* Ratings */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ margin: "0 0 12px", fontSize: 11, color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                  Breakfast ratings
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Your rating</p>
                    <StarRow rating={myRating} color={floorColor} />
                  </div>
                  {otherRating !== null && otherRating >= 6 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      style={{ padding: "12px 14px", background: glow(0.06),
                        border: `1px solid ${glow(0.2)}`, borderRadius: 12 }}>
                      <p style={{ margin: "0 0 8px", fontSize: 11, color: floorColor, fontWeight: 700 }}>
                        {guestName}'s rating · <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Mutual interest confirmed</span>
                      </p>
                      <StarRow rating={otherRating} color={floorColor} />
                    </motion.div>
                  )}
                  {otherRating === null && (
                    <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                        ⏳ Waiting for {guestName} to rate — butler will confirm once both responses are in.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={onClose}
                  style={{ flex: 1, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)",
                    fontSize: 14, cursor: "pointer" }}>
                  Maybe later
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("activities")}
                  style={{ flex: 2, height: 48, borderRadius: 14,
                    background: `linear-gradient(135deg, ${floorColor}44, ${floorColor}22)`,
                    border: `1.5px solid ${glow(0.65)}`, color: floorColor,
                    fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                  Arrange a social gathering →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Activity Picker ── */}
          {step === "activities" && (
            <motion.div key="activities"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

              <div style={{ flexShrink: 0, padding: "18px 20px 12px",
                borderBottom: `1px solid ${glow(0.12)}`,
                display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff" }}>Choose a Social Gathering</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                    Butler tip: 🪙 {tip} coins · Invite delivered in 24 hours
                  </p>
                </div>
                <button onClick={() => setStep("signal")}
                  style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
                {activities.map(a => {
                  const isSel = selectedActivity?.id === a.id;
                  return (
                    <motion.button key={a.id} whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedActivity(isSel ? null : a)}
                      style={{ width: "100%", display: "flex", gap: 12, padding: 0, marginBottom: 10,
                        borderRadius: 14, overflow: "hidden", cursor: "pointer", textAlign: "left",
                        border: `1.5px solid ${isSel ? glow(0.6) : "rgba(255,255,255,0.07)"}`,
                        background: isSel ? glow(0.1) : "rgba(255,255,255,0.02)" }}>
                      {/* Image / icon */}
                      <div style={{ width: 80, height: 80, flexShrink: 0, background: "rgba(255,255,255,0.05)",
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {a.imageUrl
                          ? <img src={a.imageUrl} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <span style={{ fontSize: 38 }}>{a.icon}</span>
                        }
                      </div>
                      <div style={{ flex: 1, padding: "12px 12px 12px 0", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{a.icon}</span>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800,
                            color: isSel ? floorColor : "#fff" }}>{a.name}</p>
                        </div>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{a.description}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div style={{ flexShrink: 0, padding: "12px 18px 0" }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleArrangeActivity}
                  disabled={!selectedActivity || confirming}
                  style={{ width: "100%", height: 50, borderRadius: 14,
                    background: selectedActivity ? `linear-gradient(135deg, ${floorColor}44, ${floorColor}22)` : "rgba(255,255,255,0.04)",
                    border: `1.5px solid ${selectedActivity ? glow(0.65) : "rgba(255,255,255,0.07)"}`,
                    color: selectedActivity ? floorColor : "rgba(255,255,255,0.25)",
                    fontSize: 15, fontWeight: 900, cursor: selectedActivity ? "pointer" : "not-allowed" }}>
                  {confirming ? "Butler is arranging…" : selectedActivity ? `Arrange — ${selectedActivity.name}` : "Select an activity"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Confirmed ── */}
          {step === "confirmed" && (
            <motion.div key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "40px 24px 0", textAlign: "center" }}>
              <motion.div
                animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8 }}
                style={{ fontSize: 52, marginBottom: 16 }}>
                🛎️
              </motion.div>
              <p style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 900, color: "#fff" }}>
                Butler has been briefed
              </p>
              <div style={{ padding: "16px 18px", background: glow(0.07), border: `1px solid ${glow(0.22)}`,
                borderRadius: 16, marginBottom: 24, textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, fontStyle: "italic" }}>
                  "Noted. I will personally reach out to <span style={{ color: floorColor, fontWeight: 800 }}>{guestName}</span> within 24 hours, once the moment feels right. These things deserve a little time to breathe. I will confirm with you both."
                </p>
              </div>
              <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: 22, textAlign: "left" }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>Arranged activity</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 24 }}>{selectedActivity?.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: floorColor }}>{selectedActivity?.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{selectedActivity?.description}</p>
                  </div>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                style={{ width: "100%", height: 50, borderRadius: 14,
                  background: `linear-gradient(135deg, ${floorColor}44, ${floorColor}22)`,
                  border: `1.5px solid ${glow(0.6)}`, color: floorColor,
                  fontSize: 15, fontWeight: 900, cursor: "pointer" }}>
                Perfect — thank you, butler
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
