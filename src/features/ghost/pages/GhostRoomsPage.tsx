import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

const ROOM_BG   = "https://ik.imagekit.io/7grri5v7d/ghost%20rooms.png";
const GOLD_KEY  = "https://ik.imagekit.io/7grri5v7d/Haunted%20hotel%20key%20and%20tag.png";

type RoomTier = "standard" | "suite" | "kings" | "penthouse";

function readTier(): RoomTier | null {
  try { return (localStorage.getItem("ghost_house_tier") as RoomTier | null) ?? null; } catch { return null; }
}
function writeTier(t: RoomTier) {
  try { localStorage.setItem("ghost_house_tier", t); } catch {}
}

const ROOMS = [
  {
    key: "standard" as RoomTier,
    icon: "🛏️",
    name: "Standard Room",
    tagline: "Your first key to the Ghost House",
    price: "🪙 200 / mo",
    color: "#a3a3a3",
    border: "rgba(163,163,163,0.35)",
    bg: "rgba(163,163,163,0.06)",
    glow: "rgba(163,163,163,0.3)",
    gradient: "linear-gradient(135deg, #525252, #a3a3a3)",
    features: [
      "2 match unlocks / month",
      "Ghost Vault: 5 photos",
      "Ghost Flash: 1 session / month",
      "Standard Room badge on profile",
      "Access to Ghost Butler (view only)",
    ],
  },
  {
    key: "suite" as RoomTier,
    icon: "🏨",
    name: "Suite Room",
    tagline: "More space, more power, more matches",
    price: "🪙 500 / mo",
    color: "#4ade80",
    border: "rgba(74,222,128,0.35)",
    bg: "rgba(74,222,128,0.07)",
    glow: "rgba(74,222,128,0.4)",
    gradient: "linear-gradient(135deg, #16a34a, #4ade80)",
    features: [
      "5 match unlocks / month included",
      "Ghost Vault: 10 photos · 3 videos",
      "Ghost Flash: 4 sessions / month",
      "1 weekly profile boost (1 hr top of stack)",
      "Suite badge on your profile card",
      "Ghost Butler access — service numbers visible",
      "Priority in browse stack over free users",
    ],
  },
  {
    key: "kings" as RoomTier,
    icon: "👑",
    name: "Kings Room",
    tagline: "The room where serious matches happen",
    price: "🪙 1,000 / mo",
    color: "#d4af37",
    border: "rgba(212,175,55,0.45)",
    bg: "rgba(212,175,55,0.07)",
    glow: "rgba(212,175,55,0.5)",
    gradient: "linear-gradient(135deg, #92400e, #d4af37)",
    features: [
      "Unlimited match unlocks",
      "Ghost Vault: 50 photos · 10 videos",
      "Ghost Flash: unlimited sessions",
      "3 profile boosts per week",
      "Kings Room badge — top of every stack",
      "Ghost Butler — all 7 service numbers visible",
      "Tonight Mode always on",
      "See who liked you",
      "Profile featured in Ghost Pulse row",
    ],
  },
  {
    key: "penthouse" as RoomTier,
    icon: "🏙️",
    name: "Penthouse",
    tagline: "The highest floor. Reserved for the elite.",
    price: "🪙 3,000 / mo",
    color: "#d4af37",
    border: "rgba(212,175,55,0.45)",
    bg: "rgba(212,175,55,0.07)",
    glow: "rgba(212,175,55,0.5)",
    gradient: "linear-gradient(135deg, #92660a, #d4af37, #f0d060)",
    features: [
      "Everything in Kings Room",
      "Penthouse profile badge — globally visible",
      "Unlimited Ghost Butler real-world deliveries",
      "Featured on Ghost Pulse — all countries",
      "Dedicated concierge priority queue",
      "Early access to all new features",
      "Penthouse Floor — exclusive member lounge",
      "Custom Ghost ID display name",
    ],
  },
] as const;

export default function GhostRoomsPage() {
  const navigate  = useNavigate();
  const a         = useGenderAccent();
  const [currentTier, setCurrentTier] = useState<RoomTier | null>(readTier);
  const [buying,      setBuying]       = useState<RoomTier | null>(null);
  const [justBought,  setJustBought]   = useState<RoomTier | null>(null);

  const handlePurchase = (tier: RoomTier) => {
    if (buying) return;
    setBuying(tier);
    setTimeout(() => {
      writeTier(tier);
      setCurrentTier(tier);
      setBuying(null);
      setJustBought(tier);
      setTimeout(() => setJustBought(null), 3000);
    }, 1400);
  };

  const tierRank: Record<RoomTier, number> = { standard: 0, suite: 1, kings: 2, penthouse: 3 };
  const ownedRank = currentTier ? tierRank[currentTier] : -1;

  return (
    <div style={{
      minHeight: "100dvh", width: "100%",
      background: "#050508",
      display: "flex", flexDirection: "column",
      overflowY: "auto", overflowX: "hidden",
    }}>
      {/* Hero background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `url(${ROOM_BG})`,
        backgroundSize: "cover", backgroundPosition: "center top",
        opacity: 0.18,
        pointerEvents: "none",
      }} />
      {/* Dark overlay */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "rgba(3,4,8,0.82)", pointerEvents: "none" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", minHeight: "100dvh" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "env(safe-area-inset-top, 16px) 16px 0",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
          flexShrink: 0,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <ArrowLeft size={18} color="rgba(255,255,255,0.8)" />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.1 }}>Ghost Rooms</h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>Choose your floor</p>
          </div>
          <img src={GOLD_KEY} alt="" style={{ width: 40, height: 40, objectFit: "contain", opacity: 0.9 }} />
        </div>

        {/* Tagline */}
        <div style={{ padding: "16px 18px 8px", flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6, textAlign: "center" }}>
            A Room badge signals everything without saying a word.<br />
            Members notice. The right people filter for it.
          </p>
        </div>

        {/* Room cards */}
        <div style={{ padding: "8px 14px calc(env(safe-area-inset-bottom, 0px) + 24px)", display: "flex", flexDirection: "column", gap: 12 }}>
          {ROOMS.map((room, idx) => {
            const owned   = ownedRank >= idx;
            const active  = buying === room.key;
            const bought  = justBought === room.key;

            return (
              <motion.div
                key={room.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, type: "spring", stiffness: 280, damping: 24 }}
                style={{
                  borderRadius: 18,
                  background: room.bg,
                  border: `1px solid ${owned ? room.border : "rgba(255,255,255,0.08)"}`,
                  overflow: "hidden",
                  boxShadow: owned ? `0 0 24px ${room.glow}` : "none",
                }}
              >
                {/* Top stripe */}
                <div style={{ height: 3, background: owned ? room.gradient : "rgba(255,255,255,0.06)" }} />

                <div style={{ padding: "14px 16px 16px" }}>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{room.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: owned ? room.color : "#fff" }}>{room.name}</span>
                        {owned && (
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                            background: `${room.color}22`, border: `1px solid ${room.color}55`,
                            color: room.color, letterSpacing: "0.08em",
                          }}>✓ ACTIVE</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>{room.tagline}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.55)", flexShrink: 0 }}>{room.price}</span>
                  </div>

                  {/* Features */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                    {room.features.map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <Check size={11} color={owned ? room.color : "rgba(255,255,255,0.25)"} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 11, color: owned ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)", lineHeight: 1.45 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <AnimatePresence mode="wait">
                    {bought ? (
                      <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        style={{ height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${room.color}18`, border: `1px solid ${room.color}40` }}
                      >
                        <Check size={15} color={room.color} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: room.color }}>Room Unlocked!</span>
                      </motion.div>
                    ) : owned ? (
                      <div style={{ height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${room.color}10`, border: `1px solid ${room.color}30` }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: `${room.color}99` }}>Your current room</span>
                      </div>
                    ) : (
                      <motion.button
                        key="buy"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handlePurchase(room.key)}
                        disabled={active}
                        style={{
                          width: "100%", height: 44, borderRadius: 12, border: "none",
                          background: active ? "rgba(255,255,255,0.07)" : room.gradient,
                          color: active ? "rgba(255,255,255,0.4)" : (room.key === "kings" || room.key === "penthouse" ? "#0a0700" : "#fff"),
                          fontSize: 13, fontWeight: 800, cursor: active ? "default" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                          boxShadow: active ? "none" : `0 3px 16px ${room.glow}`,
                          transition: "all 0.2s",
                        }}
                      >
                        {active ? (
                          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                            Unlocking…
                          </motion.span>
                        ) : (
                          `Unlock ${room.name}`
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}

          {/* Penthouse teaser link */}
          <button
            onClick={() => navigate("/ghost/penthouse")}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: 14,
              background: "rgba(232,121,249,0.05)", border: "1px dashed rgba(232,121,249,0.2)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
              color: "rgba(232,121,249,0.7)", fontSize: 12, fontWeight: 700,
            }}
          >
            <span>🏙️ Explore the Penthouse Floor</span>
            <span style={{ fontSize: 16 }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
