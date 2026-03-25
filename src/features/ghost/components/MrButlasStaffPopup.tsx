// MrButlasStaffPopup — shown when a user taps a profile that hasn't uploaded their portrait
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GhostProfile } from "../types/ghostTypes";
import { sendStaffNudge } from "../services/ghostStaffNudgeService";

const BUTLAS_IMG = "https://ik.imagekit.io/7grri5v7d/werwerwer-removebg-preview.png";

interface Props {
  profile: GhostProfile;
  onClose: () => void;
}

export default function MrButlasStaffPopup({ profile, onClose }: Props) {
  const [nudgeSent,    setNudgeSent]    = useState(false);
  const [requestSent,  setRequestSent]  = useState(false);

  function sendNudge() {
    sendStaffNudge(profile.id, "nudge").catch(() => {});
    setNudgeSent(true);
  }

  function requestPortrait() {
    sendStaffNudge(profile.id, "portrait_request").catch(() => {});
    setRequestSent(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9200,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "linear-gradient(180deg, #0c0608 0%, #060304 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderTop: "1px solid rgba(212,175,55,0.2)",
          borderRadius: "24px 24px 0 0",
          padding: "8px 24px 44px",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "12px auto 22px" }} />

        {/* Mr. Butlas header */}
        <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "flex-start" }}>
          <img src={BUTLAS_IMG} alt="Mr. Butlas"
            style={{ width: 48, height: 48, objectFit: "contain", flexShrink: 0 }} />
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 900,
              color: "rgba(212,175,55,0.85)", letterSpacing: "0.12em" }}>MR. BUTLAS</p>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
              I regret to inform you that{" "}
              <span style={{ color: "#fff", fontWeight: 800 }}>{profile.name}</span>{" "}
              has not yet confirmed their identity with the house.
            </p>
          </div>
        </div>

        {/* Profile preview — blurred / staff */}
        <div style={{
          display: "flex", gap: 14, alignItems: "center",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "12px 16px", marginBottom: 16,
        }}>
          <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
            <img src={profile.image} alt=""
              style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover",
                filter: "blur(9px) brightness(0.45)" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 20 }}>🔑</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(212,175,55,0.8)",
                letterSpacing: "0.1em", background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.25)", borderRadius: 6,
                padding: "2px 7px" }}>HOTEL STAFF</span>
            </div>
            <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.55)" }}>
              {profile.name}, {profile.age}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              {profile.city} {profile.countryFlag}
            </p>
          </div>
        </div>

        {/* Hotel rule notice */}
        <div style={{
          background: "rgba(212,175,55,0.06)",
          border: "1px solid rgba(212,175,55,0.18)",
          borderRadius: 12, padding: "10px 14px", marginBottom: 20,
        }}>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(212,175,55,0.75)", lineHeight: 1.65 }}>
            <span style={{ fontWeight: 900 }}>Hotel Rule §3 — </span>
            Staff members may not be courted until they have presented their portrait and been formally welcomed as a guest of the house.
          </p>
        </div>

        {/* Action buttons */}
        <AnimatePresence mode="wait">
          {!nudgeSent && !requestSent ? (
            <motion.div key="actions" initial={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={sendNudge}
                style={{ width: "100%", height: 52, borderRadius: 14,
                  background: "rgba(212,175,55,0.08)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  color: "rgba(212,175,55,0.9)", fontSize: 14, fontWeight: 800,
                  cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8 }}>
                <span>👋</span> Send a Nudge
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={requestPortrait}
                style={{ width: "100%", height: 52, borderRadius: 14, border: "none",
                  background: "linear-gradient(135deg, #b80000, #e01010)",
                  color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 4px 18px rgba(220,20,20,0.3)" }}>
                <span>📸</span> Request Their Portrait
              </motion.button>
              <button onClick={onClose}
                style={{ background: "none", border: "none",
                  color: "rgba(255,255,255,0.28)", fontSize: 13,
                  cursor: "pointer", paddingTop: 4 }}>
                Dismiss
              </button>
            </motion.div>
          ) : (
            <motion.div key="sent"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", padding: "8px 0 12px" }}>
              <p style={{ fontSize: 22, marginBottom: 10 }}>
                {requestSent ? "📸" : "👋"}
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 800, color: "#fff" }}>
                {requestSent ? "Portrait Requested" : "Nudge Sent"}
              </p>
              <p style={{ margin: "0 0 22px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                {requestSent
                  ? "Mr. Butlas will formally notify them. If they do not comply, they will be asked to leave the house."
                  : "Mr. Butlas has passed your message along. They will be informed that a guest is waiting."}
              </p>
              <button onClick={onClose}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12, padding: "10px 28px", color: "rgba(255,255,255,0.6)",
                  fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
