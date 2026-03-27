// MaidUpgradeSheet — appears when a user taps an unverified female (Maid Eloise) profile
// Eloise offers to escort the guest to their next available room upgrade.
// Shows only the single next tier above the user's current room.
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const MAID_IMG   = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasddsds.png";

type RoomTier = "standard" | "suite" | "kings" | "penthouse" | "cellar" | "garden" | "loft";

// Ordered upgrade ladder — standard is the starting floor, so upgrades begin at suite
const UPGRADE_LADDER: RoomTier[] = ["suite", "kings", "penthouse"];

const ROOM_META: Record<string, {
  name: string; tagline: string; price: string; icon: string;
  color: string; gradient: string; iconImg: string;
  features: string[];
}> = {
  suite: {
    name: "Ensuite",
    tagline: "Earned by completing your profile",
    price: "$9.99/mo",
    icon: "🛎️",
    iconImg: "https://ik.imagekit.io/7grri5v7d/Untitledsdfasdfasdf-removebg-preview.png",
    color: "#cd7f32",
    gradient: "linear-gradient(135deg, #7a3b10, #cd7f32, #e8a050)",
    features: [
      "5 match unlocks / month",
      "Ghost Vault: 10 photos · 3 videos",
      "Ghost Flash: 4 sessions / month",
      "1 weekly profile boost",
    ],
  },
  kings: {
    name: "Kings Room",
    tagline: "The room where serious matches happen",
    price: "$14.99/mo",
    icon: "👑",
    iconImg: "https://ik.imagekit.io/7grri5v7d/SADFASDFASDFASDFS-removebg-preview.png",
    color: "#d4af37",
    gradient: "linear-gradient(135deg, #92400e, #d4af37)",
    features: [
      "Unlimited match unlocks",
      "Ghost Vault: 50 photos · 10 videos",
      "3 profile boosts per week",
      "See who liked you",
    ],
  },
  penthouse: {
    name: "Penthouse",
    tagline: "The highest floor. Reserved for the elite.",
    price: "$24.99/mo",
    icon: "🏙️",
    iconImg: "https://ik.imagekit.io/7grri5v7d/UntitledaSFASDFASDF-removebg-preview.png",
    color: "#e8e4d0",
    gradient: "linear-gradient(135deg, #8a8070, #c8c0a8, #e8e4d0)",
    features: [
      "Everything in The Casino",
      "Penthouse badge — globally visible",
      "Featured on Ghost Pulse — all countries",
      "Early access to all new features",
    ],
  },
};

function getCurrentTier(): RoomTier | null {
  try { return (localStorage.getItem("ghost_house_tier") as RoomTier | null) ?? null; } catch { return null; }
}

function isProfileComplete(): boolean {
  try { return !!localStorage.getItem("ghost_profile_setup_done"); } catch { return false; }
}

function getNextTier(): RoomTier | null {
  const current = getCurrentTier();
  // null, standard, garden, cellar, loft → all start at suite upgrade
  if (!current || !UPGRADE_LADDER.includes(current)) return "suite";
  const idx = UPGRADE_LADDER.indexOf(current);
  if (idx >= UPGRADE_LADDER.length - 1) return null; // already at penthouse
  return UPGRADE_LADDER[idx + 1];
}

interface Props {
  onClose: () => void;
}

export default function MaidUpgradeSheet({ onClose }: Props) {
  const navigate = useNavigate();
  const nextTier = getNextTier();
  const profileComplete = isProfileComplete();
  const room = nextTier ? ROOM_META[nextTier] : null;
  const displayPrice = (nextTier === "suite" && profileComplete) ? "Free — Profile Complete ✓" : room?.price;
  const [confirmed, setConfirmed] = useState(false);

  function accept() {
    try { localStorage.setItem("rooms_unlocked", "true"); } catch {}
    setConfirmed(true);
    setTimeout(() => {
      onClose();
      navigate("/rooms");
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
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          overflow: "hidden",
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 3, background: room ? room.gradient : "linear-gradient(90deg,#888,#ccc)" }} />

        <div style={{ padding: "20px 20px max(36px,env(safe-area-inset-bottom,36px))" }}>
          {/* Drag handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 20px" }} />

          {/* Header row: maid image + byline */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginBottom: 20 }}>
            <img
              src={MAID_IMG}
              alt="Maid Eloise"
              style={{ width: 130, height: 130, objectFit: "contain", flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px", fontSize: 10, color: "rgba(212,175,55,0.85)", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Maid Eloise
              </p>
              <p style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>
                {room ? `Room Upgrade Available` : `You've reached the top floor`}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                {room
                  ? `Allow me to escort you to ${room.name}.`
                  : "The Penthouse awaits. You're already there."}
              </p>
            </div>
          </div>

          {room ? (
            <>
              {/* Letter */}
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${room.color}22`,
                borderRadius: 16, padding: "14px 16px", marginBottom: 16,
              }}>
                <p style={{ margin: "0 0 10px", fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.75 }}>
                  Dear Guest,
                </p>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                  It would be my honour to show you to your next room. The{" "}
                  <span style={{ color: room.color, fontWeight: 800 }}>{room.name}</span>{" "}
                  is ready and waiting — at{" "}
                  <span style={{ color: room.color, fontWeight: 800 }}>{displayPrice}</span>.
                </p>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.8)", letterSpacing: "0.12em", textAlign: "right" }}>
                  — ELOISE
                </p>
              </div>

              {/* Room details card */}
              <div style={{
                background: `${room.color}08`,
                border: `1px solid ${room.color}25`,
                borderRadius: 14, padding: "12px 14px", marginBottom: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  {room.iconImg
                    ? <img src={room.iconImg} alt={room.name} style={{ width: 36, height: 36, objectFit: "contain" }} />
                    : <span style={{ fontSize: 26 }}>{room.icon}</span>
                  }
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: room.color }}>{room.name}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{room.tagline}</p>
                  </div>
                  <div style={{ marginLeft: "auto", background: `${room.color}18`, border: `1px solid ${room.color}33`, borderRadius: 8, padding: "3px 10px" }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: room.color }}>{displayPrice}</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {room.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: room.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{f}</span>
                    </div>
                  ))}
                </div>
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
                      background: `${room.color}10`,
                      border: `1px solid ${room.color}35`,
                      borderRadius: 14, padding: "12px 16px",
                    }}
                  >
                    <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 900, color: room.color }}>
                      ✓ Added to your side menu
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                      Find Hotel Vacancy anytime in the drawer
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
                  background: confirmed ? `${room.color}20` : room.gradient,
                  color: confirmed ? `${room.color}80` : "#000",
                  fontSize: 15, fontWeight: 900, cursor: confirmed ? "default" : "pointer",
                  boxShadow: confirmed ? "none" : `0 4px 20px ${room.color}33`,
                  marginBottom: 10, transition: "all 0.3s",
                }}
              >
                {confirmed ? `Opening ${room.name}…` : `View ${room.name} →`}
              </motion.button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🏙️</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", lineHeight: 1.6 }}>
                You are already on the highest floor of the Hotel.
              </p>
            </div>
          )}

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
