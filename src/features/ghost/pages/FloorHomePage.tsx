import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import FloorChatPopup, { getChatUnread, setChatUnread } from "../components/FloorChatPopup";

// ── Room config ───────────────────────────────────────────────────────────────
type FloorConfig = {
  label: string; icon: string; color: string; gradient: string;
  bg: string; tagline: string;
  memberCount: number; activeCount: number;
  avatarSeeds: number[];
};

const STANDARD_BG = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsdsterte.png";
const SUITE_BG    = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsds.png";

const FLOOR_CONFIG: Record<string, FloorConfig> = {
  standard: {
    label: "Standard Room", icon: "🛏️",
    color: "#a8a8b0", gradient: "linear-gradient(135deg, #505058, #a8a8b0, #d0d0d8)",
    bg: STANDARD_BG,
    tagline: "Your first key to the Ghost House. Welcome to the floor.",
    memberCount: 1247, activeCount: 89,
    avatarSeeds: [3,7,12,15,22,29,36,40,48,55,58,64,70,77,83],
  },
  suite: {
    label: "Suite", icon: "🛎️",
    color: "#cd7f32", gradient: "linear-gradient(135deg, #7a3b10, #cd7f32, #e8a050)",
    bg: SUITE_BG,
    tagline: "More space, more power. The Suite floor is a step above.",
    memberCount: 428, activeCount: 34,
    avatarSeeds: [28,31,45,49,52,5,9,13,18,23,27,32,37,41,46],
  },
};

// ── Seed member profiles per floor ────────────────────────────────────────────
type FloorMember = { id: string; seed: number; name: string; age: number; city: string; online: boolean };

function buildMembers(tier: string, avatarSeeds: number[]): FloorMember[] {
  const names = [
    "Aisha","Marco","Yuki","Sofia","Liam","Nina","Carlos","Mei","James","Priya",
    "Alex","Sara","Tom","Hana","David","Lea","Omar","Chloe","Jake","Nadia",
  ];
  const cities = ["London","Paris","Singapore","Dubai","Tokyo","New York","Berlin","Sydney","Milan","Bangkok"];
  return avatarSeeds.map((seed, i) => ({
    id: `${tier}-${seed}`,
    seed,
    name: names[i % names.length],
    age: 24 + (seed % 12),
    city: cities[seed % cities.length],
    online: seed % 3 !== 0,
  }));
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FloorHomePage() {
  const { tier = "standard" } = useParams<{ tier: string }>();
  const navigate  = useNavigate();
  const config    = FLOOR_CONFIG[tier] ?? FLOOR_CONFIG.standard;
  const members   = buildMembers(tier, config.avatarSeeds);

  const [showChat,     setShowChat]     = useState(false);
  const [chatUnread,   setChatUnreadSt] = useState(() => getChatUnread());
  const [selectedMember, setSelectedMember] = useState<FloorMember | null>(null);

  function openChat() {
    setShowChat(true);
    setChatUnreadSt(0);
    setChatUnread(0);
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#06060a", color: "#fff", fontFamily: "inherit", position: "relative", overflowX: "hidden" }}>

      {/* Background image */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: `url(${config.bg})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.18, pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "linear-gradient(to bottom, rgba(6,6,10,0.55) 0%, rgba(6,6,10,0.95) 100%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${config.color}, transparent)` }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "max(env(safe-area-inset-top,16px),16px) 16px 14px", borderBottom: `1px solid ${config.color}18`, background: `${config.color}08` }}>
          <button
            onClick={() => navigate("/ghost/rooms")}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            ←
          </button>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: `${config.color}18`, border: `1.5px solid ${config.color}45`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 22 }}>{config.icon}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: config.color }}>{config.label}</p>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block", flexShrink: 0 }} />
            </div>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
              {config.memberCount.toLocaleString()} members · {config.activeCount} active tonight
            </p>
          </div>
          {chatUnread > 0 && (
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: config.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: "#0a0700" }}>{chatUnread}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 0 max(env(safe-area-inset-bottom,24px),24px)" }}>

        {/* Tagline */}
        <div style={{ margin: "16px 16px 0", padding: "12px 14px", background: `${config.color}0a`, border: `1px solid ${config.color}20`, borderRadius: 14 }}>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.55, fontStyle: "italic" }}>"{config.tagline}"</p>
        </div>

        {/* Floor Chat CTA */}
        <div style={{ margin: "14px 16px 0" }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openChat}
            style={{ width: "100%", height: 52, borderRadius: 14, border: "none", background: config.gradient, color: "#0a0700", fontSize: 14, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: `0 4px 20px ${config.color}35` }}
          >
            <span style={{ fontSize: 20 }}>💬</span>
            Open {config.label} Chat
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
              style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(0,0,0,0.4)", flexShrink: 0 }} />
          </motion.button>
        </div>

        {/* Section label */}
        <p style={{ margin: "20px 16px 10px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Members on this floor tonight
        </p>

        {/* Members grid */}
        <div style={{ padding: "0 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {members.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 24 }}
              onClick={() => setSelectedMember(m)}
              style={{ borderRadius: 16, overflow: "hidden", position: "relative", cursor: "pointer", border: `1px solid ${config.color}20`, boxShadow: `0 2px 12px ${config.color}10` }}
            >
              <div style={{ paddingBottom: "130%", position: "relative" }}>
                <img
                  src={`https://i.pravatar.cc/160?img=${m.seed}`}
                  alt={m.name}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)" }} />
                {/* Online dot */}
                {m.online && (
                  <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", border: "1.5px solid rgba(6,6,10,0.8)" }} />
                )}
                {/* Name */}
                <div style={{ position: "absolute", bottom: 6, left: 7, right: 7 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{m.name}, {m.age}</p>
                  <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{m.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Active count note */}
        <p style={{ margin: "16px 0 0", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.5 }}>
          {config.activeCount} members active tonight · refreshes every evening
        </p>
      </div>

      {/* ── Member tap popup ── */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedMember(null)}
            style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={e => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,10,0.99)", borderRadius: "22px 22px 0 0", border: `1px solid ${config.color}30`, borderBottom: "none", overflow: "hidden" }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${config.color}, transparent)` }} />
              <div style={{ padding: "20px 20px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", overflow: "hidden", border: `2px solid ${config.color}50`, flexShrink: 0 }}>
                    <img src={`https://i.pravatar.cc/64?img=${selectedMember.seed}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 900, color: "#fff" }}>{selectedMember.name}, {selectedMember.age}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>📍 {selectedMember.city} · {config.label}</p>
                    {selectedMember.online && <p style={{ margin: "3px 0 0", fontSize: 9, fontWeight: 800, color: "#4ade80" }}>● Online now</p>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={openChat}
                    style={{ flex: 1, height: 46, borderRadius: 12, border: "none", background: config.gradient, color: "#0a0700", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
                    💬 Message in Chat
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSelectedMember(null)}
                    style={{ width: 46, height: 46, borderRadius: 12, border: `1px solid rgba(255,255,255,0.1)`, background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: 18, color: "rgba(255,255,255,0.4)" }}>
                    ✕
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floor Chat popup ── */}
      <AnimatePresence>
        {showChat && (
          <FloorChatPopup
            tier={tier}
            tierColor={config.color}
            tierLabel={config.label}
            tierIcon={config.icon}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
