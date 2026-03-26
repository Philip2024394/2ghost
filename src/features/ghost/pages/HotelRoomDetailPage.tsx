import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCoins } from "../hooks/useCoins";

// ── Room definitions ──────────────────────────────────────────────────────────

type AccessType =
  | { type: "free" }
  | { type: "coins"; amount: number }
  | { type: "membership"; label: string };

interface RoomDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  tagline: string;
  description: string;
  activities: { icon: string; label: string }[];
  access: AccessType;
  memberCount: number;
  route: string;
}

const ROOMS: Record<string, RoomDef> = {
  standard: {
    id: "standard",
    name: "Standard Room",
    icon: "🛏️",
    color: "#a8a8b0",
    tagline: "Where every stay begins",
    description: "The heart of Heartsway Hotel. Every guest starts here. Browse the floor, meet people at your level and begin building your presence in the hotel.",
    activities: [
      { icon: "💬", label: "Floor Chat — talk to guests on your floor" },
      { icon: "👥", label: "Browse floor members" },
      { icon: "❤️", label: "Send likes and Tonight signals" },
      { icon: "🎁", label: "Send gifts to guests you admire" },
    ],
    access: { type: "free" },
    memberCount: 124,
    route: "/ghost/floor/standard",
  },
  suite: {
    id: "suite",
    name: "Ensuite",
    icon: "🛎️",
    color: "#cd7f32",
    tagline: "A step above the ordinary",
    description: "Guests who have made at least one real connection graduate to the Ensuite floor. A warmer, more social atmosphere than Standard.",
    activities: [
      { icon: "💬", label: "Suite Floor Chat" },
      { icon: "👥", label: "Browse Ensuite members" },
      { icon: "🎁", label: "Priority gift delivery" },
      { icon: "⚔️", label: "Floor Wars — weekly gift leaderboard" },
    ],
    access: { type: "coins", amount: 10 },
    memberCount: 71,
    route: "/ghost/floor/suite",
  },
  kings: {
    id: "kings",
    name: "Kings Room",
    icon: "👑",
    color: "#d4af37",
    tagline: "The most active social floor",
    description: "Exclusive access for valued guests who have made their first purchase. The Kings floor is where the most engaged members connect.",
    activities: [
      { icon: "💬", label: "VIP Floor Chat" },
      { icon: "👥", label: "Browse Kings members" },
      { icon: "🎰", label: "Casino access when available" },
      { icon: "🎁", label: "Premium gift options" },
    ],
    access: { type: "coins", amount: 30 },
    memberCount: 38,
    route: "/ghost/floor/kings",
  },
  penthouse: {
    id: "penthouse",
    name: "Penthouse",
    icon: "🏙️",
    color: "#c8c4bc",
    tagline: "The highest honour in Heartsway",
    description: "Reserved for Hotel Members only. The Penthouse represents the pinnacle of the hotel experience — the most exclusive connections in the building.",
    activities: [
      { icon: "🏨", label: "Penthouse lounge access" },
      { icon: "🔐", label: "Vault private chat with matches" },
      { icon: "🌍", label: "Global guest visibility" },
      { icon: "🎩", label: "Butler Gift Pack — real-world delivery" },
    ],
    access: { type: "membership", label: "Ghost Black membership required" },
    memberCount: 14,
    route: "/ghost/penthouse",
  },
  loft: {
    id: "loft",
    name: "Loft",
    icon: "🌆",
    color: "#7b9ea8",
    tagline: "Open minds, open conversations",
    description: "Creative spirits and free thinkers gather in the Loft. An open, artistic atmosphere above the main floors with a distinct energy.",
    activities: [
      { icon: "💬", label: "Loft Floor Chat" },
      { icon: "👥", label: "Browse Loft members" },
      { icon: "🎨", label: "Creative events and themed nights" },
      { icon: "🎁", label: "Send gifts to Loft guests" },
    ],
    access: { type: "coins", amount: 15 },
    memberCount: 49,
    route: "/ghost/loft",
  },
  cellar: {
    id: "cellar",
    name: "The Cellar",
    icon: "🕯️",
    color: "#9b1c1c",
    tagline: "Underground. Mysterious. Unforgettable",
    description: "Not for everyone. The Cellar is the most underground space in the hotel — those who enter rarely leave disappointed. An acquired taste.",
    activities: [
      { icon: "💬", label: "Cellar Chat — anonymous mode on" },
      { icon: "👥", label: "Browse Cellar members" },
      { icon: "🔒", label: "Deep connection invitations" },
      { icon: "🎭", label: "Private Cellar events" },
    ],
    access: { type: "coins", amount: 25 },
    memberCount: 26,
    route: "/ghost/cellar",
  },
  garden: {
    id: "garden",
    name: "Garden Lodge",
    icon: "🌿",
    color: "#7a9e7e",
    tagline: "Peaceful. Relaxed. Unhurried",
    description: "Outdoor terrace, firepit evenings and conversations that go somewhere. The Garden Lodge attracts guests who prefer depth over speed.",
    activities: [
      { icon: "💬", label: "Garden Floor Chat" },
      { icon: "👥", label: "Browse Garden members" },
      { icon: "🔥", label: "Evening firepit social events" },
      { icon: "🌙", label: "Tonight Mode — available to meet now" },
    ],
    access: { type: "free" },
    memberCount: 58,
    route: "/ghost/floor/garden",
  },
};

// ── Access badge ──────────────────────────────────────────────────────────────

function AccessBadge({ access, color }: { access: AccessType; color: string }) {
  if (access.type === "free") {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "rgba(30,100,30,0.2)", border: "1px solid rgba(80,200,80,0.25)",
        borderRadius: 8, padding: "4px 12px",
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(80,220,80,0.9)" }} />
        <span style={{ color: "rgba(100,220,100,0.9)", fontSize: 12, fontFamily: "monospace" }}>Free Access</span>
      </div>
    );
  }
  if (access.type === "coins") {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "rgba(180,150,40,0.12)", border: `1px solid ${color}44`,
        borderRadius: 8, padding: "4px 12px",
      }}>
        <span style={{ fontSize: 14 }}>🪙</span>
        <span style={{ color, fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>
          {access.amount} coins to enter
        </span>
      </div>
    );
  }
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: "rgba(180,150,40,0.1)", border: "1px solid rgba(180,150,40,0.3)",
      borderRadius: 8, padding: "4px 12px",
    }}>
      <span style={{ fontSize: 14 }}>🎩</span>
      <span style={{ color: "rgba(180,150,40,0.9)", fontSize: 12, fontFamily: "Georgia, serif" }}>
        {access.label}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HotelRoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate   = useNavigate();
  const { balance } = useCoins();

  const room = roomId ? ROOMS[roomId] : null;

  if (!room) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#060406", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <span style={{ fontSize: 48 }}>🚪</span>
        <p style={{ color: "rgba(255,255,255,0.5)", fontFamily: "Georgia, serif" }}>Room not found</p>
        <button onClick={() => navigate(-1)} style={{ background: "rgba(180,150,40,0.2)", border: "1px solid rgba(180,150,40,0.3)", color: "rgba(180,150,40,0.8)", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
          ← Back
        </button>
      </div>
    );
  }

  const canAfford = room.access.type === "free"
    || room.access.type === "membership"
    || (room.access.type === "coins" && balance >= room.access.amount);

  const handleEnter = () => {
    navigate(room.route);
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#060406",
      overflowY: "scroll", WebkitOverflowScrolling: "touch",
      color: "#fff",
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 48 }}>

        {/* ── Hero banner ── */}
        <div style={{
          position: "relative",
          height: 220,
          background: `linear-gradient(160deg, rgba(6,4,6,0.98) 0%, ${room.color}22 60%, ${room.color}44 100%)`,
          overflow: "hidden",
        }}>
          {/* Glow */}
          <div style={{
            position: "absolute", bottom: -40, right: -40,
            width: 200, height: 200, borderRadius: "50%",
            background: `radial-gradient(circle, ${room.color}30 0%, transparent 70%)`,
          }} />

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            style={{
              position: "absolute", top: 52, left: 16,
              background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)", fontSize: 13, padding: "6px 14px",
              borderRadius: 8, cursor: "pointer",
            }}
          >
            ← Back
          </button>

          {/* Room icon */}
          <div style={{
            position: "absolute", bottom: 24, left: 20,
          }}>
            <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 10 }}>{room.icon}</div>
            <div style={{
              display: "inline-block",
              background: `${room.color}22`, border: `1px solid ${room.color}55`,
              borderRadius: 6, padding: "3px 10px",
              color: room.color, fontSize: 10, fontFamily: "monospace", letterSpacing: 2,
            }}>
              {room.id.toUpperCase()} FLOOR
            </div>
          </div>

          {/* Member count */}
          <div style={{
            position: "absolute", bottom: 28, right: 20,
            textAlign: "right",
          }}>
            <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 28, fontWeight: 900, lineHeight: 1 }}>
              {room.memberCount}
            </div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: "monospace" }}>
              GUESTS
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: "linear-gradient(to bottom, transparent, #060406)" }} />
        </div>

        {/* ── Room name + tagline ── */}
        <div style={{ padding: "20px 20px 0" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontFamily: "Georgia, serif", color: "#fff", fontWeight: 400 }}>
            {room.name}
          </h1>
          <p style={{ margin: "0 0 16px", color: room.color, fontSize: 13, fontFamily: "Georgia, serif", fontStyle: "italic" }}>
            {room.tagline}
          </p>

          {/* Access badge */}
          <AccessBadge access={room.access} color={room.color} />
        </div>

        {/* ── Description ── */}
        <div style={{ padding: "18px 20px 0" }}>
          <p style={{
            margin: 0, color: "rgba(255,240,200,0.65)",
            fontSize: 14, lineHeight: 1.7, fontFamily: "Georgia, serif",
          }}>
            {room.description}
          </p>
        </div>

        {/* ── Activities ── */}
        <div style={{ padding: "22px 20px 0" }}>
          <div style={{
            color: "rgba(255,255,255,0.3)", fontSize: 9,
            fontFamily: "monospace", letterSpacing: 3, marginBottom: 12,
          }}>
            WHAT'S IN THIS ROOM
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {room.activities.map((act, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: `${room.color}08`,
                  border: `1px solid ${room.color}20`,
                  borderLeft: `3px solid ${room.color}60`,
                  borderRadius: 10, padding: "10px 14px",
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{act.icon}</span>
                <span style={{ color: "rgba(255,240,200,0.8)", fontSize: 13, fontFamily: "Georgia, serif" }}>
                  {act.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Coin info (if coin-gated) ── */}
        {room.access.type === "coins" && (
          <div style={{ padding: "18px 20px 0" }}>
            <div style={{
              background: canAfford ? `${room.color}0a` : "rgba(200,50,50,0.08)",
              border: `1px solid ${canAfford ? room.color + "30" : "rgba(200,50,50,0.25)"}`,
              borderRadius: 12, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>🪙</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "rgba(255,240,200,0.85)", fontSize: 13, fontFamily: "Georgia, serif" }}>
                  Entry costs <strong style={{ color: room.color }}>{room.access.amount} coins</strong>
                </div>
                <div style={{ color: canAfford ? "rgba(100,220,100,0.8)" : "rgba(200,80,80,0.8)", fontSize: 11, marginTop: 3, fontFamily: "monospace" }}>
                  {canAfford
                    ? `Your balance: ${balance} coins — you're good to go`
                    : `Your balance: ${balance} coins — you need ${room.access.amount - balance} more`}
                </div>
              </div>
            </div>
            {!canAfford && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/ghost/pricing")}
                style={{
                  width: "100%", marginTop: 10, padding: "12px 0",
                  background: "rgba(180,150,40,0.12)", border: "1px solid rgba(180,150,40,0.3)",
                  color: "rgba(180,150,40,0.85)", fontSize: 13, fontFamily: "Georgia, serif",
                  borderRadius: 12, cursor: "pointer",
                }}
              >
                🪙 Get more coins
              </motion.button>
            )}
          </div>
        )}

        {/* ── Enter Room button ── */}
        <div style={{ padding: "24px 20px 0" }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleEnter}
            disabled={room.access.type === "coins" && !canAfford}
            style={{
              width: "100%", padding: "15px 0",
              background: (room.access.type === "coins" && !canAfford)
                ? "rgba(40,30,30,0.8)"
                : `linear-gradient(135deg, ${room.color}cc, ${room.color})`,
              border: `1px solid ${room.color}60`,
              color: (room.access.type === "coins" && !canAfford) ? "rgba(255,255,255,0.2)" : "#000",
              fontSize: 15, fontWeight: 700, fontFamily: "Georgia, serif",
              borderRadius: 14, cursor: (room.access.type === "coins" && !canAfford) ? "not-allowed" : "pointer",
              letterSpacing: 0.5,
            }}
          >
            {room.access.type === "coins" && !canAfford
              ? "Insufficient Coins"
              : `Enter ${room.name} →`}
          </motion.button>

          {room.access.type === "membership" && (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "Georgia, serif", marginTop: 10 }}>
              Requires Ghost Black membership · <span
                style={{ color: "rgba(180,150,40,0.6)", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => navigate("/ghost/pricing")}
              >upgrade here</span>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
