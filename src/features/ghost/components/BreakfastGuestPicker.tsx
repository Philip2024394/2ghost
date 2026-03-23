// ── Breakfast Guest Picker ─────────────────────────────────────────────────────
// Step 1 — pick a guest
// Step 2 — propose a breakfast time (with timezone shown)
// Step 3 — confirm gifts & send

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Clock } from "lucide-react";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import type { GhostProfile } from "../types/ghostTypes";
import { selectArrivalGifts, FLOOR_META } from "../utils/breakfastGiftService";
import {
  sendInvite, getSentInvite, PORTER_TIP,
  buildProposedTime, getLocalTimezone, formatInTimezone, tzCity, tzShortLabel,
} from "../utils/breakfastInviteService";
import type { BreakfastInvite } from "../utils/breakfastInviteService";

const AVATAR_BASE = "https://api.dicebear.com/7.x/thumbs/svg?seed=";

type Step = "pick" | "time" | "confirm";

type Props = {
  floor:      string;
  profiles:   GhostProfile[];
  onClose:    () => void;
  onSent:     (invite: BreakfastInvite) => void;
};

export default function BreakfastGuestPicker({ floor, profiles, onClose, onSent }: Props) {
  const [step,      setStep]     = useState<Step>("pick");
  const [selected,  setSelected] = useState<GhostProfile | null>(null);
  const [timeHHMM,  setTimeHHMM] = useState<string>("");   // "08:30" or ""
  const [sending,   setSending]  = useState(false);
  const [sent,      setSent]     = useState(false);

  const myTz    = getLocalTimezone();
  const myCity  = tzCity(myTz);
  const myLabel = tzShortLabel(myTz);

  const meta  = FLOOR_META[floor] ?? FLOOR_META.standard;
  const tip   = PORTER_TIP[floor] ?? 3;
  const gifts = selected ? selectArrivalGifts(floor, 3) : [];

  const existingInvite = getSentInvite();
  const hasPending = existingInvite?.status === "pending";

  const r = parseInt(meta.color.slice(1,3),16);
  const g = parseInt(meta.color.slice(3,5),16);
  const b = parseInt(meta.color.slice(5,7),16);
  const glow = (o: number) => `rgba(${r},${g},${b},${o})`;

  // Preview of proposed time in sender's tz
  const proposedEpoch = timeHHMM ? buildProposedTime(timeHHMM) : null;
  const proposedDisplay = proposedEpoch ? formatInTimezone(proposedEpoch, myTz) : null;

  function handleSend() {
    if (!selected || hasPending) return;
    setSending(true);

    // Grab sender's own profile for the card shown to guest
    let myProfile: Record<string, unknown> = {};
    try { myProfile = JSON.parse(localStorage.getItem("ghost_profile") ?? "{}"); } catch {}

    setTimeout(() => {
      const invite = sendInvite({
        fromUserId:       "me",
        fromUserName:     (myProfile.name as string) || "Your host",
        fromFloor:        floor,
        toUserId:         selected.id,
        toUserName:       selected.name,
        toAvatar:         String(selected.id).replace(/\D/g, "").slice(0,3) || "42",
        selectedGifts:    gifts,
        proposedTime:     proposedEpoch ?? undefined,
        senderTimezone:   myTz,
        fromAvatar:       String(myProfile.id ?? "").replace(/\D/g, "").slice(0,3) || "77",
        fromPhoto:        (myProfile.photo as string) || undefined,
        fromAge:          (myProfile.age as number) || undefined,
        fromCity:         (myProfile.city as string) || undefined,
        fromCountryFlag:  (myProfile.countryFlag as string) || undefined,
      });
      setSending(false);
      setSent(true);
      setTimeout(() => {
        onSent(invite);
        onClose();
      }, 1800);
    }, 900);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9600, background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,15,0.99)",
          borderRadius: "24px 24px 0 0", border: `1px solid ${glow(0.3)}`,
          borderBottom: "none", maxHeight: "90dvh", display: "flex", flexDirection: "column",
          paddingBottom: "max(20px,env(safe-area-inset-bottom,20px))" }}
      >
        {/* Accent bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`, flexShrink: 0 }} />

        {/* Header */}
        <div style={{ flexShrink: 0, padding: "16px 18px 12px", borderBottom: `1px solid ${glow(0.12)}`,
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff" }}>
              {step === "pick" ? "Invite to Breakfast ☕" : step === "time" ? "Propose a time ⏰" : "Confirm & send"}
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
              {meta.icon} {meta.label} · <img src="https://ik.imagekit.io/7grri5v7d/butlers%20tray.png?updatedAt=1774031638819" alt="" style={{ width: 14, height: 14, objectFit: "contain", verticalAlign: "middle", marginRight: 3 }} />Butler tip: 🪙 {tip} coins
            </p>
          </div>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
              fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} />
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ flexShrink: 0, display: "flex", gap: 6, padding: "10px 18px 0" }}>
          {(["pick", "time", "confirm"] as Step[]).map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2,
              background: step === s ? meta.color : i < (["pick","time","confirm"] as Step[]).indexOf(step) ? glow(0.4) : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>

        {hasPending && (
          <div style={{ flexShrink: 0, margin: "12px 18px 0", padding: "10px 14px",
            background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#fbbf24", fontWeight: 700 }}>
              ⏳ You have a pending invite — wait for a response before sending another.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step 1: Pick guest ── */}
          {step === "pick" && (
            <motion.div key="pick"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
              {profiles.slice(0, 20).map(profile => {
                const online = isOnline(profile.last_seen_at);
                const isSelected = selected?.id === profile.id;
                return (
                  <motion.button key={profile.id} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelected(isSelected ? null : profile)}
                    disabled={hasPending}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 14px", marginBottom: 8, borderRadius: 14,
                      background: isSelected ? glow(0.15) : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isSelected ? glow(0.5) : "rgba(255,255,255,0.07)"}`,
                      cursor: hasPending ? "not-allowed" : "pointer", textAlign: "left",
                      opacity: hasPending ? 0.5 : 1 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img src={`${AVATAR_BASE}${profile.id}`} alt=""
                        style={{ width: 46, height: 46, borderRadius: 12, objectFit: "cover",
                          border: `1.5px solid ${isSelected ? meta.color : "rgba(255,255,255,0.1)"}` }} />
                      {online && (
                        <div style={{ position: "absolute", bottom: 2, right: 2, width: 10, height: 10,
                          borderRadius: "50%", background: "#22c55e", border: "1.5px solid #06060f" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff" }}>{profile.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
                        {online ? "🟢 Online now" : "🌙 Offline — butler will leave note"}
                        {profile.countryFlag ? ` · ${profile.countryFlag} ${profile.city ?? ""}` : ""}
                      </p>
                    </div>
                    {isSelected && (
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: meta.color,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check size={13} color="#fff" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {/* ── Step 2: Pick time ── */}
          {step === "time" && (
            <motion.div key="time"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              style={{ flex: 1, overflowY: "auto", padding: "20px 18px 0" }}>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: glow(0.12),
                  border: `1px solid ${glow(0.3)}`, display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0 }}>
                  <Clock size={22} color={meta.color} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>When will you be at the lounge?</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    This helps {selected?.name} know when to join — especially across timezones.
                  </p>
                </div>
              </div>

              {/* Time input */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Your local time · {myCity} ({myLabel})
                </p>
                <input
                  type="time"
                  value={timeHHMM}
                  onChange={e => setTimeHHMM(e.target.value)}
                  style={{
                    width: "100%", boxSizing: "border-box", height: 56,
                    background: "rgba(255,255,255,0.05)", border: `1.5px solid ${timeHHMM ? glow(0.5) : "rgba(255,255,255,0.12)"}`,
                    borderRadius: 14, padding: "0 18px",
                    color: timeHHMM ? "#fff" : "rgba(255,255,255,0.35)",
                    fontSize: 22, fontWeight: 800, outline: "none",
                    colorScheme: "dark",
                  }}
                />
              </div>

              {/* Live preview: your time */}
              {proposedDisplay && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, padding: "12px 14px", background: glow(0.08),
                    border: `1px solid ${glow(0.25)}`, borderRadius: 14, textAlign: "center" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 10, color: "rgba(255,255,255,0.4)",
                      textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                      Your time · {myCity}
                    </p>
                    <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: meta.color }}>{proposedDisplay}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{myLabel}</p>
                  </div>
                  <div style={{ flex: 1, padding: "12px 14px", background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, textAlign: "center",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ margin: "0 0 4px", fontSize: 10, color: "rgba(255,255,255,0.3)",
                      textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                      {selected?.name}'s time
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
                      Shown to them when they open the invite
                    </p>
                  </div>
                </motion.div>
              )}

              <p style={{ margin: "0 0 20px", fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
                If you're from different countries, {selected?.name} will see both your time and theirs side by side. If either of you doesn't show, your butler will explain.
              </p>
            </motion.div>
          )}

          {/* ── Step 3: Confirm & send ── */}
          {step === "confirm" && selected && (
            <motion.div key="confirm"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              style={{ flex: 1, overflowY: "auto", padding: "16px 18px 0" }}>

              {/* Time summary (if set) */}
              {proposedDisplay && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  background: glow(0.07), border: `1px solid ${glow(0.2)}`, borderRadius: 12, marginBottom: 14 }}>
                  <Clock size={16} color={meta.color} style={{ flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff" }}>
                      Proposed: {proposedDisplay} your time ({myLabel})
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                      {selected.name} will see this converted to their local time
                    </p>
                  </div>
                </div>
              )}

              {/* Gifts */}
              <p style={{ margin: "0 0 10px", fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Gifts placed at table for {selected.name}
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {gifts.map(gift => (
                  <div key={gift.id} style={{ flex: 1, padding: "10px 8px", background: glow(0.08),
                    border: `1px solid ${glow(0.2)}`, borderRadius: 12, textAlign: "center" }}>
                    <img src="https://ik.imagekit.io/7grri5v7d/ghjfghjfgj-removebg-preview.png?updatedAt=1774267493743" alt="Gift" style={{ width: 36, height: 36, objectFit: "contain", marginBottom: 4 }} />
                    <p style={{ margin: 0, fontSize: 10, color: meta.color, fontWeight: 800 }}>{gift.name}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── Footer actions ── */}
        <div style={{ flexShrink: 0, padding: "14px 18px 0", borderTop: `1px solid ${glow(0.10)}` }}>
          {step === "pick" && (
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => selected && !hasPending && setStep("time")}
              disabled={!selected || hasPending}
              style={{ width: "100%", height: 50, borderRadius: 14,
                background: selected && !hasPending ? `linear-gradient(135deg, ${meta.color}55, ${meta.color}33)` : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${selected && !hasPending ? glow(0.7) : "rgba(255,255,255,0.1)"}`,
                color: selected && !hasPending ? meta.color : "rgba(255,255,255,0.3)",
                fontSize: 15, fontWeight: 900, cursor: selected && !hasPending ? "pointer" : "not-allowed" }}>
              {selected ? `Next — pick a time for ${selected.name} →` : "Select a guest to invite"}
            </motion.button>
          )}

          {step === "time" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("pick")}
                style={{ flex: 1, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)",
                  fontSize: 13, cursor: "pointer" }}>
                ← Back
              </button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("confirm")}
                style={{ flex: 2, height: 48, borderRadius: 14,
                  background: `linear-gradient(135deg, ${meta.color}55, ${meta.color}33)`,
                  border: `1.5px solid ${glow(0.7)}`, color: meta.color,
                  fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                {timeHHMM ? "Confirm time →" : "Skip — no specific time →"}
              </motion.button>
            </div>
          )}

          {step === "confirm" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep("time")}
                style={{ flex: 1, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)",
                  fontSize: 13, cursor: "pointer" }}>
                ← Back
              </button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSend}
                disabled={sending || sent}
                style={{ flex: 2, height: 48, borderRadius: 14,
                  background: sent ? "rgba(52,211,153,0.15)" : `linear-gradient(135deg, ${meta.color}55, ${meta.color}33)`,
                  border: `1.5px solid ${sent ? "rgba(52,211,153,0.5)" : glow(0.7)}`,
                  color: sent ? "#34d399" : meta.color, fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                {sent ? "✓ Butler is on the way" : sending ? "Preparing…" : `Send to ${selected?.name} ☕`}
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
