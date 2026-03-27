// GamesRoomInviteSheet — appears when a user taps an unverified male "Games Boy" profile
// Mr. Butlas extends a personal invitation to the Games Room on his behalf
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const GAMES_BOY_IMG = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasddsdssdfs.png?updatedAt=1774487538945";

const GAMES = [
  { icon: "🎮", label: "Connect 4"     },
  { icon: "🧠", label: "Memory Match"  },
  { icon: "🎲", label: "More Coming"   },
];

interface Props {
  onClose: () => void;
}

export default function GamesRoomInviteSheet({ onClose }: Props) {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);

  function accept() {
    try { localStorage.setItem("games_room_unlocked", "true"); } catch {}
    setConfirmed(true);
    setTimeout(() => {
      onClose();
      navigate("/games");
    }, 1800);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 900,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(8,8,12,0.99)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(212,175,55,0.15)",
          borderBottom: "none",
          overflow: "hidden",
        }}
      >
        {/* Gold accent bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #92400e, #d4af37, #f0d060)" }} />

        <div style={{ padding: "20px 20px max(36px,env(safe-area-inset-bottom,36px))" }}>
          {/* Drag handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 20px" }} />

          {/* Header row: games boy image + intro */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 20 }}>
            <img
              src={GAMES_BOY_IMG}
              alt="Games Room"
              style={{ width: 130, height: 130, objectFit: "contain", flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: "rgba(212,175,55,0.85)", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Games Room
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>
                You've been invited to play
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                A private challenge awaits inside.
              </p>
            </div>
          </div>

          {/* Formal letter */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(212,175,55,0.15)",
            borderRadius: 16, padding: "14px 16px", marginBottom: 16,
          }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.75 }}>
              Dear Guest,
            </p>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
              The Games Room is now open to you. Our guests have found it to be a most agreeable way to break the ice — a well-played game reveals far more about a person than any introduction.
            </p>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.8)", letterSpacing: "0.12em", textAlign: "right" }}>
              — MR. BUTLAS
            </p>
          </div>

          {/* Game offerings */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {GAMES.map(g => (
              <div key={g.label} style={{
                flex: 1, background: "rgba(212,175,55,0.06)",
                border: "1px solid rgba(212,175,55,0.18)",
                borderRadius: 12, padding: "10px 6px", textAlign: "center",
              }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{g.icon}</div>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "rgba(212,175,55,0.8)", letterSpacing: "0.05em" }}>
                  {g.label}
                </p>
              </div>
            ))}
          </div>

          {/* Confirmation flash */}
          <AnimatePresence>
            {confirmed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  textAlign: "center", marginBottom: 14,
                  background: "rgba(212,175,55,0.08)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  borderRadius: 14, padding: "12px 16px",
                }}
              >
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 900, color: "rgba(212,175,55,0.95)" }}>
                  ✓ Added to your side menu
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  Find the Games Room anytime in the drawer
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={accept}
            disabled={confirmed}
            style={{
              width: "100%", height: 54, borderRadius: 16, border: "none",
              background: confirmed
                ? "rgba(212,175,55,0.2)"
                : "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
              color: confirmed ? "rgba(212,175,55,0.6)" : "#000",
              fontSize: 15, fontWeight: 900, cursor: confirmed ? "default" : "pointer",
              boxShadow: confirmed ? "none" : "0 4px 20px rgba(212,175,55,0.3)",
              marginBottom: 10, transition: "all 0.3s",
            }}
          >
            {confirmed ? "Opening Games Room…" : "Enter the Games Room"}
          </motion.button>

          {!confirmed && (
            <button
              onClick={onClose}
              style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "6px 0" }}
            >
              Not now
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
