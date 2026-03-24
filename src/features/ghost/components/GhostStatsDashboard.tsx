import { useMemo } from "react";
import { motion } from "framer-motion";

function readCoins(): number { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } }

function getGhostId(): string {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    const id = p.id || "anon";
    let h = 0;
    for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
    return `Guest-${1000 + Math.abs(h) % 9000}`;
  } catch { return "Guest-0000"; }
}

const ROOM_MAP: Record<string, { label: string; icon: string; color: string; members: number; active: number }> = {
  standard:  { label: "Standard Room",  icon: "🛏️",  color: "#a8a8b0", members: 1247, active: 89  },
  suite:     { label: "Ensuite",         icon: "🛎️",  color: "#cd7f32", members: 428,  active: 34  },
  kings:     { label: "The Casino",     icon: "🎰",  color: "#d4af37", members: 156,  active: 21  },
  penthouse: { label: "Penthouse",      icon: "🏙️", color: "#e0ddd8", members: 47,   active: 12  },
  cellar:    { label: "The Cellar",     icon: "🕯️",  color: "#9b1c1c", members: 83,   active: 18  },
};

function seedStat(ghostId: string, key: string, min: number, max: number): number {
  let h = 0;
  const s = ghostId + key;
  for (let i = 0; i < s.length; i++) { h = Math.imul(31, h) + s.charCodeAt(i) | 0; }
  return min + (Math.abs(h) % (max - min + 1));
}

function countVaultChats(): number {
  try {
    return Object.keys(localStorage).filter(k => k.startsWith("ghost_vault_chat_")).length;
  } catch { return 0; }
}

function countLikedIds(): number {
  try { return JSON.parse(localStorage.getItem("ghost_liked_ids") || "[]").length; } catch { return 0; }
}

function countGiftsSent(): number {
  try {
    let total = 0;
    Object.keys(localStorage).forEach(k => {
      if (!k.startsWith("ghost_vault_chat_")) return;
      const msgs = JSON.parse(localStorage.getItem(k) || "[]");
      total += msgs.filter((m: { isGift?: boolean; isOwn?: boolean }) => m.isGift && m.isOwn).length;
    });
    return total;
  } catch { return 0; }
}

function memberSince(): string {
  try {
    const w = localStorage.getItem("ghost_house_welcomed");
    if (!w) return "New member";
    // Use a fixed "join date" if we don't have a timestamp — check ghost_mode_until and work back
    const until = Number(localStorage.getItem("ghost_mode_until") || "0");
    if (until) {
      const joined = new Date(until - 30 * 24 * 60 * 60 * 1000);
      return joined.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
    return "This month";
  } catch { return "This month"; }
}

export default function GhostStatsDashboard({ onClose }: { onClose: () => void }) {
  const ghostId = getGhostId();
  const tier    = (() => { try { return localStorage.getItem("ghost_house_tier") || "standard"; } catch { return "standard"; } })();
  const room    = ROOM_MAP[tier] ?? ROOM_MAP.standard;
  const coins   = readCoins();

  const stats = useMemo(() => {
    const likesReceived = seedStat(ghostId, "likes_recv", 12, 94);
    const profileViews  = seedStat(ghostId, "views",      48, 312);
    const floorRank     = seedStat(ghostId, "rank",       3,  room.active);
    const likesSent     = countLikedIds();
    const vaultChats    = countVaultChats();
    const giftsSent     = countGiftsSent();
    return { likesReceived, profileViews, floorRank, likesSent, vaultChats, giftsSent };
  }, [ghostId, room.active]);

  const joined = memberSince();

  const STAT_ROWS = [
    { icon: "👁️",  label: "Profile views",        value: stats.profileViews,  sub: "this month",    color: "#60a5fa" },
    { icon: "❤️",  label: "Likes received",        value: stats.likesReceived, sub: "from members",  color: "#f472b6" },
    { icon: "🤍",  label: "Likes sent",            value: stats.likesSent,     sub: "by you",        color: "#a78bfa" },
    { icon: "🔐",  label: "Vault conversations",   value: stats.vaultChats,    sub: "opened",        color: "#fbbf24" },
    { icon: "🎁",  label: "Gifts sent",            value: stats.giftsSent,     sub: "total",         color: "#34d399" },
    { icon: "🪙",  label: "Coins balance",         value: coins,               sub: "available",     color: "#ffd700" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 580, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(5,4,2,0.99)", borderRadius: "24px 24px 0 0", border: `1px solid ${room.color}20`, borderBottom: "none", maxHeight: "88dvh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: `0 -8px 60px ${room.color}10` }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${room.color}cc, transparent)`, flexShrink: 0 }} />

        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Profile card */}
          <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: `linear-gradient(135deg, ${room.color}10, transparent)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${room.color}18`, border: `2px solid ${room.color}45`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 26 }}>{room.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>{ghostId}</p>
                  <span style={{ fontSize: 9, fontWeight: 800, color: room.color, background: `${room.color}18`, border: `1px solid ${room.color}35`, borderRadius: 20, padding: "2px 8px" }}>{room.icon} {room.label}</span>
                </div>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Member since {joined}</p>
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>✕</span>
              </button>
            </div>

            {/* Floor rank */}
            <div style={{ marginTop: 14, padding: "10px 14px", background: `${room.color}0a`, border: `1px solid ${room.color}20`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: room.color }}>🏆 Floor Rank #{stats.floorRank}</p>
                <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Among {room.active} active members tonight</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{room.members.toLocaleString()} total</p>
                <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.25)" }}>on {room.label}</p>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ padding: "14px 16px max(20px,env(safe-area-inset-bottom,20px))" }}>
            <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Your Activity</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {STAT_ROWS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  style={{ background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}
                >
                  <span style={{ fontSize: 18, display: "block", marginBottom: 5 }}>{s.icon}</span>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 9, color: "rgba(255,255,255,0.35)", lineHeight: 1.3 }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.2)" }}>{s.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
