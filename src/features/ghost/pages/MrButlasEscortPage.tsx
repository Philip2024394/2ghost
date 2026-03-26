// MrButlasEscortPage — shown when a user's portrait deadline expires
// Mr. Butlas formally asks them to leave. They may return and upload immediately.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { clearStaffDeadline } from "../hooks/useMrButlasCountdown";

const BG_IMG = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdas.png";

export default function MrButlasEscortPage() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  // Scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function leaveAndReturn() {
    setLeaving(true);
    try {
      clearStaffDeadline();
      // Remove from admin dismiss list so they can re-enter once portrait is uploaded
      const profileId = JSON.parse(localStorage.getItem("ghost_profile") || "{}").id;
      if (profileId) {
        const dismissed = JSON.parse(localStorage.getItem("admin_portrait_dismissed") || "{}");
        delete dismissed[profileId];
        localStorage.setItem("admin_portrait_dismissed", JSON.stringify(dismissed));
      }
      localStorage.removeItem("ghost_profile");
      localStorage.removeItem("ghost_profile_setup_done");
      localStorage.removeItem("ghost_onboarded");
      localStorage.removeItem("staff_nudges_received");
    } catch {}
    setTimeout(() => navigate("/ghost/welcome", { replace: true }), 600);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      backgroundImage: `url(${BG_IMG})`,
      backgroundSize: "cover", backgroundPosition: "center top",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-end", padding: "0 0 48px",
      textAlign: "center", overflow: "hidden",
    }}>

      {/* Subtle bottom fade so text stays readable over the image */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, transparent 40%, rgba(4,1,2,0.55) 70%, rgba(4,1,2,0.92) 100%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        style={{ maxWidth: 380, width: "100%", padding: "0 28px", position: "relative" }}
      >
        <p style={{ fontSize: 21, fontWeight: 900, color: "#fff",
          margin: "0 0 14px", lineHeight: 1.35 }}>
          It has been a pleasure having you in the Hotel.
        </p>

        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)",
          lineHeight: 1.75, margin: "0 0 14px" }}>
          However, I cannot in good conscience allow unconfirmed guests to remain among our Hotel members.
        </p>

        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)",
          lineHeight: 1.75, margin: "0 0 22px" }}>
          For the safety and comfort of all our guests, I must ask that you step outside — until you are ready to be properly introduced.
        </p>

        {/* Notice */}
        <div style={{
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, padding: "13px 18px", marginBottom: 28,
        }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
            The doors of Heartsway Hotel are always open to verified guests.
            Return at any time with your portrait and you will be welcomed back with honour.
          </p>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: "rgba(212,175,55,0.9)", letterSpacing: "0.12em", textAlign: "right" }}>
            — MR. BUTLAS
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={leaveAndReturn}
          animate={leaving ? { opacity: 0, scale: 0.95 } : {}}
          style={{
            width: "100%", height: 56, borderRadius: 16, border: "none",
            background: "linear-gradient(135deg, #b80000, #e01010)",
            color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
            boxShadow: "0 4px 24px rgba(220,20,20,0.4)",
          }}
        >
          Leave &amp; Return When Ready
        </motion.button>
      </motion.div>
    </div>
  );
}
