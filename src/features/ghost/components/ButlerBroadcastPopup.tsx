import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const BUTLER_AVATAR = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdfsdsdsddsdf.png";

interface Props {
  message: string;
  onDismiss: () => void;
}

export default function ButlerBroadcastPopup({ message, onDismiss }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        key="butler-broadcast-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.75)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px 20px",
        }}
        onClick={onDismiss}
      >
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 400,
            background: "linear-gradient(160deg,#111014 0%,#1a1520 100%)",
            border: "1px solid rgba(212,175,55,0.25)",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 0 60px rgba(212,175,55,0.12), 0 24px 48px rgba(0,0,0,0.6)",
          }}
        >
          {/* Gold top bar */}
          <div style={{
            height: 3,
            background: "linear-gradient(90deg,#d4af37,#f0d060,#d4af37)",
          }} />

          {/* Header */}
          <div style={{ padding: "22px 22px 0", display: "flex", alignItems: "flex-start", gap: 14 }}>
            {/* Butler avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <motion.div
                animate={{ boxShadow: ["0 0 0px rgba(212,175,55,0.4)", "0 0 18px rgba(212,175,55,0.6)", "0 0 0px rgba(212,175,55,0.4)"] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  width: 54, height: 54, borderRadius: "50%",
                  border: "2px solid rgba(212,175,55,0.5)",
                  overflow: "hidden",
                  background: "rgba(212,175,55,0.08)",
                }}
              >
                <img
                  src={BUTLER_AVATAR}
                  alt="Mr. Butlas"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </motion.div>
              {/* Live indicator */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{
                  position: "absolute", bottom: 1, right: 1,
                  width: 12, height: 12, borderRadius: "50%",
                  background: "#d4af37",
                  border: "2px solid #111014",
                }}
              />
            </div>

            {/* Name + label */}
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: "#d4af37", letterSpacing: "-0.01em" }}>
                  Mr. Butlas
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                  background: "rgba(212,175,55,0.15)", color: "#d4af37",
                  border: "1px solid rgba(212,175,55,0.3)",
                  borderRadius: 4, padding: "2px 6px", textTransform: "uppercase",
                }}>
                  LIVE
                </span>
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>
                Hotel Concierge · House Announcement
              </span>
            </div>

            {/* Dismiss */}
            <button
              onClick={onDismiss}
              style={{
                width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Divider */}
          <div style={{ margin: "16px 22px 0", height: 1, background: "rgba(212,175,55,0.1)" }} />

          {/* Message body */}
          <div style={{ padding: "18px 22px 22px" }}>
            {/* Quote mark */}
            <div style={{ fontSize: 36, lineHeight: 1, color: "rgba(212,175,55,0.2)", marginBottom: -6, fontFamily: "Georgia, serif" }}>
              "
            </div>
            <p style={{
              fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.88)",
              margin: "0 0 18px", fontStyle: "italic",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}>
              {message}
            </p>
            <p style={{ fontSize: 11, color: "rgba(212,175,55,0.5)", margin: 0, fontWeight: 600 }}>
              — Mr. Butlas, Hotel Concierge
            </p>
          </div>

          {/* Dismiss button */}
          <div style={{ padding: "0 22px 22px" }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onDismiss}
              style={{
                width: "100%", height: 46, borderRadius: 12,
                background: "rgba(212,175,55,0.1)",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#d4af37", fontSize: 13, fontWeight: 800,
                cursor: "pointer", letterSpacing: "0.04em",
              }}
            >
              Thank you, Mr. Butlas
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
