// MrButlasStaffPopup — shown when a user taps a profile that hasn't uploaded their portrait
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GhostProfile } from "../types/ghostTypes";
import { sendStaffNudge } from "../services/ghostStaffNudgeService";
import { toGhostId } from "../utils/ghostHelpers";

const BUTLAS_IMG = "https://ik.imagekit.io/7grri5v7d/ewrwerwerwer-removebg-preview.png?updatedAt=1774288645920";

interface Props {
  profile: GhostProfile;
  onClose: () => void;
}

function seededCountdown(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i) | 0;
  h = Math.abs(h);
  const hrs  = 1 + (h % 35);
  const mins = h % 59;
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export default function MrButlasStaffPopup({ profile, onClose }: Props) {
  const [requestSent, setRequestSent] = useState(false);
  const guestId   = toGhostId(profile.id);
  const countdown = useMemo(() => seededCountdown(profile.id), [profile.id]);

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
        background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
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
          borderTop: "1px solid rgba(212,175,55,0.25)",
          borderRadius: "24px 24px 0 0",
          padding: "8px 24px 44px",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(220,20,20,0.7)", margin: "12px auto 20px" }} />

        {/* Mr. Butlas header row */}
        {!requestSent && <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <img src={BUTLAS_IMG} alt="Mr. Butlas"
            style={{ width: 62, height: 62, objectFit: "contain", flexShrink: 0 }} />
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 900,
              color: "rgba(212,175,55,0.85)", letterSpacing: "0.14em" }}>MR. BUTLAS</p>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600,
              color: "rgba(255,255,255,0.3)", letterSpacing: "0.03em" }}>Profile Interaction</p>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: "rgba(220,20,20,0.65)", letterSpacing: "0.1em" }}>GUEST DEPARTURE</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#e01010", letterSpacing: "0.06em", fontFamily: "monospace", lineHeight: 1 }}>{countdown}</span>
          </div>
        </div>}

        {/* Letter */}
        {!requestSent && <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(212,175,55,0.18)",
          borderRadius: 16, padding: "18px 18px 16px", marginBottom: 20,
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, color: "#fff" }}>
            Dear Guest,
          </p>
          <p style={{ margin: "0 0 11px", fontSize: 12, color: "rgba(255,255,255,0.58)", lineHeight: 1.75 }}>
            You have recently shown interest in a profile within our hotel. However, I must inform you that the portrait you encountered does not belong to the guest themselves.
          </p>
          <p style={{ margin: "0 0 11px", fontSize: 12, color: "rgba(255,255,255,0.58)", lineHeight: 1.75 }}>
            In the absence of their profile image, I have temporarily assigned one of our hotel staff to stand in their place — ensuring that all profiles maintain a sense of presence at all times.
          </p>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.58)", lineHeight: 1.75 }}>
            The guest in question —{" "}
            <span style={{ color: "rgba(212,175,55,0.95)", fontWeight: 800 }}>{guestId}</span>
            {" "} — has been granted a limited time frame to present their true portrait. Until such time, their profile remains under this provisional representation.
          </p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800,
            color: "rgba(212,175,55,0.65)", fontStyle: "italic" }}>
            — Mr. Butlas
          </p>
        </div>}

        {/* Action buttons */}
        <AnimatePresence mode="wait">
          {!requestSent ? (
            <motion.div key="actions" initial={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                  color: "rgba(255,255,255,0.25)", fontSize: 13,
                  cursor: "pointer", paddingTop: 4 }}>
                Dismiss
              </button>
            </motion.div>
          ) : (
            <motion.div key="sent"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: "4px 0 12px" }}>
              {/* Header row — image + title */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <img
                  src="https://ik.imagekit.io/7grri5v7d/sdfasdfasdfrrrr-removebg-preview.png?updatedAt=1774275671975"
                  alt=""
                  style={{ width: 65, height: 65, objectFit: "contain", flexShrink: 0 }}
                />
                <div>
                  <p style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 900, color: "rgba(212,175,55,0.95)" }}>
                    Portrait Request Noted
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                    The profile owner has been notified.
                  </p>
                </div>
              </div>

              {/* Centred message */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#fff" }}>
                  Portrait Requested
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                  Mr. Butlas will formally notify them. If they do not comply, they will be asked to leave the house.
                </p>
              </div>

              <button onClick={onClose}
                style={{ width: "100%", background: "rgba(220,20,20,0.12)", border: "1px solid rgba(220,20,20,0.4)",
                  borderRadius: 12, padding: "13px 28px", color: "rgba(220,20,20,0.9)",
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
