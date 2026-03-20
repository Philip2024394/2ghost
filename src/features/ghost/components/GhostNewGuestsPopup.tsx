import { motion } from "framer-motion";
import type { GhostProfile } from "../types/ghostTypes";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

export default function GhostNewGuestsPopup({
  newGuests,
  onEnterLobby,
  onDismiss,
}: {
  newGuests: GhostProfile[];
  onEnterLobby: () => void;
  onDismiss: () => void;
}) {
  const previews = newGuests.slice(0, 3);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        style={{
          position: "fixed", inset: 0, zIndex: 290,
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ scale: 0.82, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "calc(100% - 36px)", maxWidth: 340,
          zIndex: 291,
          background: "rgba(6,10,6,0.97)",
          border: "1px solid rgba(74,222,128,0.25)",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(74,222,128,0.12), 0 28px 56px rgba(0,0,0,0.75)",
          backdropFilter: "blur(30px)",
        }}
      >
        {/* Top green bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #15803d, #4ade80, #22c55e)" }} />

        <div style={{ padding: "26px 22px 24px", textAlign: "center" }}>

          {/* Ghost logo pulse */}
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}
          >
            <img src={GHOST_LOGO} alt="ghost" style={{ width: 64, height: 64, objectFit: "contain" }} />
          </motion.div>

          {/* Label */}
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(74,222,128,0.75)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>
            New Arrivals
          </p>

          {/* Headline */}
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.02em", margin: "0 0 10px" }}>
            Meet Our New Guests<br />That Just Arrived
          </h2>

          {/* Sub text */}
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "0 0 20px" }}>
            You are welcomed to the lobby to meet our new guests that arrived today, all of whom are searching for their soul mate. Would you like to pop in and say hi?
          </p>

          {/* Avatar previews */}
          {previews.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: -8, marginBottom: 22 }}>
              {previews.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.08, type: "spring", stiffness: 300, damping: 22 }}
                  style={{
                    width: 52, height: 52, borderRadius: "50%", overflow: "hidden",
                    border: "2.5px solid rgba(74,222,128,0.5)",
                    boxShadow: "0 0 12px rgba(74,222,128,0.2)",
                    marginLeft: idx === 0 ? 0 : -14,
                    zIndex: previews.length - idx,
                    position: "relative",
                  }}
                >
                  <img
                    src={p.image}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                </motion.div>
              ))}
              {newGuests.length > 3 && (
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "rgba(74,222,128,0.1)",
                  border: "2.5px solid rgba(74,222,128,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginLeft: -14, zIndex: 0, position: "relative",
                  fontSize: 12, fontWeight: 800, color: "rgba(74,222,128,0.9)",
                }}>
                  +{newGuests.length - 3}
                </div>
              )}
            </div>
          )}

          {/* CTA button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onEnterLobby}
            style={{
              width: "100%", height: 52, borderRadius: 50, border: "none",
              background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
              color: "#fff", fontSize: 15, fontWeight: 900,
              cursor: "pointer", letterSpacing: "0.02em",
              boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 24px rgba(34,197,94,0.4)",
              position: "relative", overflow: "hidden", marginBottom: 10,
            }}
          >
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
            Take Me To The Lobby
          </motion.button>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "rgba(255,255,255,0.25)", fontWeight: 600, padding: "4px 0" }}
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </>
  );
}
