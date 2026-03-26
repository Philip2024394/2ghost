// ── Games Room Landing Page ────────────────────────────────────────────────────
// Always shown first when entering the Games Room from any route.
// Shows guests currently online + Enter Games Room button.

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const HERO_BG = "https://ik.imagekit.io/7grri5v7d/asddsasddSDFASDFASDFSASDF.png";

const GUESTS_IN_ROOM = [
  // Asia Pacific
  { id: "g1",  name: "Sari",      flag: "🇮🇩", city: "Jakarta",    img: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=120&q=80" },
  { id: "g2",  name: "Kenji",     flag: "🇯🇵", city: "Tokyo",      img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80" },
  { id: "g3",  name: "Mia",       flag: "🇸🇬", city: "Singapore",  img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80" },
  { id: "g4",  name: "Min-Ji",    flag: "🇰🇷", city: "Seoul",      img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&q=80" },
  { id: "g5",  name: "Wei",       flag: "🇨🇳", city: "Shanghai",   img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80" },
  { id: "g6",  name: "Sofia",     flag: "🇦🇺", city: "Sydney",     img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80" },
  // South Asia & Middle East
  { id: "g7",  name: "Arjun",     flag: "🇮🇳", city: "Mumbai",     img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80" },
  { id: "g8",  name: "Layla",     flag: "🇦🇪", city: "Dubai",      img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&q=80" },
  { id: "g9",  name: "Omar",      flag: "🇸🇦", city: "Riyadh",     img: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&q=80" },
  // Europe
  { id: "g10", name: "Liam",      flag: "🇬🇧", city: "London",     img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&q=80" },
  { id: "g11", name: "Léa",       flag: "🇫🇷", city: "Paris",      img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&q=80" },
  { id: "g12", name: "Marco",     flag: "🇮🇹", city: "Milan",      img: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=120&q=80" },
  { id: "g13", name: "Nadia",     flag: "🇩🇪", city: "Berlin",     img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80" },
  { id: "g14", name: "Elena",     flag: "🇷🇺", city: "Moscow",     img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80" },
  // Americas
  { id: "g15", name: "Zara",      flag: "🇺🇸", city: "New York",   img: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=120&q=80" },
  { id: "g16", name: "Carlos",    flag: "🇧🇷", city: "São Paulo",  img: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&q=80" },
  { id: "g17", name: "Valentina", flag: "🇨🇴", city: "Bogotá",     img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&q=80" },
  { id: "g18", name: "Tyler",     flag: "🇨🇦", city: "Toronto",    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&q=80" },
  // Africa
  { id: "g19", name: "Marcus",    flag: "🇿🇦", city: "Cape Town",  img: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&q=80" },
  { id: "g20", name: "Amara",     flag: "🇳🇬", city: "Lagos",      img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80" },
];

export default function GamesRoomLandingPage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ minHeight: "100dvh", background: "#05030a", display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden" }}>
      <div style={{ width: "100%", maxWidth: 480, minHeight: "100dvh", position: "relative", display: "flex", flexDirection: "column" }}>

        {/* ── Full-screen hero image ── */}
        <img
          src={HERO_BG}
          alt=""
          onLoad={() => setLoaded(true)}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center center",
            opacity: loaded ? 1 : 0,
            transition: "opacity 1s ease",
          }}
        />

        {/* Gradient — clear top, heavy bottom */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 25%, rgba(5,3,10,0.5) 55%, rgba(5,3,10,0.97) 78%)",
          pointerEvents: "none",
        }} />

        {/* ── Header nav ── */}
        <div style={{ position: "relative", zIndex: 2, padding: "max(env(safe-area-inset-top,16px),16px) 16px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.18)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/ghost/mode")}
            style={{ height: 36, padding: "0 14px", borderRadius: 10, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>🏠</span> Home
          </motion.button>
        </div>

        {/* ── Bottom content ── */}
        <div style={{ position: "relative", zIndex: 2, marginTop: "auto", padding: "0 22px max(44px,env(safe-area-inset-bottom,44px))" }}>

          {/* Guests online section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
            style={{ marginBottom: 22 }}>

            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 900, color: "#fff" }}>Now in the Games Room</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
                  {GUESTS_IN_ROOM.length} guests from around the world
                </p>
              </div>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }}
                style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: "#22c55e", letterSpacing: "0.08em" }}>LIVE</span>
              </motion.div>
            </div>

            {/* Overlapping avatar row */}
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {GUESTS_IN_ROOM.slice(0, 9).map((g, i) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  style={{ position: "relative", marginLeft: i === 0 ? 0 : -10, zIndex: GUESTS_IN_ROOM.length - i }}
                >
                  <img
                    src={g.img}
                    alt={g.name}
                    title={`${g.flag} ${g.name} · ${g.city}`}
                    style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid rgba(5,3,10,0.9)", display: "block" }}
                  />
                  <div style={{ position: "absolute", bottom: 1, right: 1, width: 8, height: 8, borderRadius: "50%", background: "#22c55e", border: "1.5px solid rgba(5,3,10,0.9)" }} />
                </motion.div>
              ))}
              {GUESTS_IN_ROOM.length > 9 && (
                <div style={{ marginLeft: -10, zIndex: 0, width: 36, height: 36, borderRadius: "50%", background: "rgba(212,175,55,0.15)", border: "2px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: "#d4af37" }}>+{GUESTS_IN_ROOM.length - 9}</span>
                </div>
              )}
              <div style={{ marginLeft: 12, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{GUESTS_IN_ROOM.length} online</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>challenge anyone</span>
              </div>
            </div>
          </motion.div>

          {/* Label + headline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
            style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 800, color: "rgba(212,175,55,0.75)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Heartsway Hotel
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.5 }}
            style={{ margin: "0 0 6px", fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Games Room
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
            style={{ margin: "0 0 28px", fontSize: 13, color: "rgba(255,255,255,0.38)", fontWeight: 600 }}>
            Challenge guests. Beat Mr. Butlas. Win coins.
          </motion.p>

          {/* Enter button */}
          <motion.button
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58, duration: 0.5 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/ghost/games/lobby")}
            style={{
              width: "100%", height: 58, borderRadius: 18, border: "none",
              background: "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
              color: "#000", fontSize: 17, fontWeight: 900, cursor: "pointer",
              boxShadow: "0 6px 32px rgba(212,175,55,0.4), 0 2px 8px rgba(0,0,0,0.5)",
            }}>
            Enter Games Room
          </motion.button>
        </div>
      </div>
    </div>
  );
}
