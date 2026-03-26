// ── Settings / Hotel Menu Drawer ─────────────────────────────────────────────
// Right-side slide-in drawer — full hotel navigation + room toggles.

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCurrentTier } from "../utils/guestProgress";
import { getProgress } from "../utils/guestProgress";

const SHIELD_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdfsdsdsddsdf.png";
const ROOM_IMG    = "https://ik.imagekit.io/7grri5v7d/weqweqw.png";

const R      = "#e01010";
const R_DIM  = "rgba(220,20,20,0.7)";
const R_BG   = "rgba(220,20,20,0.08)";
const R_EDGE = "rgba(220,20,20,0.3)";
const R_GLOW = "rgba(220,20,20,0.15)";

const TIER_COLORS = ["#888", "#d4af37", "#4caf50", "#4a90d9", "#9b59b6", "#e01010"];

// ── Room guest avatars ────────────────────────────────────────────────────────
// Deterministic per room — seeds 4 pravatar images from room name hash

function roomHash(roomId: string): number {
  let h = 5381;
  for (let i = 0; i < roomId.length; i++) h = Math.imul(33, h) ^ roomId.charCodeAt(i);
  return Math.abs(h);
}

function getRoomAvatars(roomId: string, count = 4): string[] {
  const base = roomHash(roomId);
  return Array.from({ length: count }, (_, i) => {
    const idx = ((base + i * 17) % 70) + 1;
    return `https://i.pravatar.cc/60?img=${idx}`;
  });
}

function RoomAvatars({ roomId }: { roomId: string }) {
  const avatars = getRoomAvatars(roomId, 4);
  return (
    <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
      {avatars.map((src, i) => (
        <div
          key={i}
          style={{
            width: 20, height: 20, borderRadius: "50%",
            border: "1.5px solid rgba(6,3,3,0.99)",
            overflow: "hidden", flexShrink: 0,
            marginLeft: i === 0 ? 0 : -6,
            zIndex: avatars.length - i,
            position: "relative",
          }}
        >
          <img
            src={src}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      ))}
    </div>
  );
}

export type SettingsAction =
  | "dashboard" | "shield" | "rooms" | "roomVault"
  | "ghostClock" | "floorWars" | "video" | "terms" | "checkout" | "games" | "breakfastLounge" | "leaderboard"
  | "getVerified" | "inviteFriends";

type Props = {
  show: boolean;
  onClose: () => void;
  onAction: (action: SettingsAction) => void;
  loungeGuestCount?: number;
  loungeEnabled?: boolean;
  onToggleLounge?: () => void;
  casinoEnabled?: boolean;
  onToggleCasino?: () => void;
};

// ── Toggle pill ───────────────────────────────────────────────────────────────
function Toggle({ on, onFlip }: { on: boolean; onFlip: () => void }) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onFlip(); }}
      style={{
        width: 40, height: 22, borderRadius: 11, flexShrink: 0,
        background: on ? R : "rgba(255,255,255,0.08)",
        border: `1px solid ${on ? "rgba(220,20,20,0.5)" : "rgba(255,255,255,0.12)"}`,
        position: "relative", cursor: "pointer", transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 2,
        left: on ? 20 : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }} />
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function Section({ label }: { label: string }) {
  return (
    <div style={{ margin: "20px 0 10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, rgba(255,255,255,0.2), transparent)` }} />
        <span style={{
          color: "#fff", fontSize: 13,
          fontFamily: "monospace", letterSpacing: 3, fontWeight: 900,
        }}>
          {label}
        </span>
        <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.2))` }} />
      </div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
function Row({
  icon, label, desc, onClick, right, dim, isCheckout, roomId,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: () => void;
  right?: React.ReactNode;
  dim?: boolean;
  isCheckout?: boolean;
  roomId?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12,
        background: isCheckout ? "rgba(239,68,68,0.06)" : "rgba(10,6,6,0.82)",
        border: isCheckout ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(220,20,20,0.15)",
        borderTop: isCheckout ? "1px solid rgba(239,68,68,0.4)" : `1px solid ${R_EDGE}`,
        boxShadow: `inset 0 1px 0 ${isCheckout ? "rgba(239,68,68,0.2)" : R_GLOW}`,
        borderRadius: 12, padding: "11px 12px", marginBottom: 6,
        cursor: "pointer", textAlign: "left",
        opacity: dim ? 0.45 : 1,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: isCheckout ? "rgba(239,68,68,0.1)" : R_BG,
        border: `1px solid ${isCheckout ? "rgba(239,68,68,0.25)" : R_EDGE}`,
        borderTop: `1px solid ${isCheckout ? "rgba(239,68,68,0.5)" : R}`,
        boxShadow: `inset 0 1px 0 ${R_GLOW}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: isCheckout ? "rgba(239,68,68,0.85)" : "#fff", marginBottom: 1 }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.3 }}>
          {desc}
        </div>
      </div>
      {right ?? (roomId ? <RoomAvatars roomId={roomId} /> : <span style={{ color: "rgba(220,20,20,0.35)", fontSize: 14, flexShrink: 0 }}>›</span>)}
    </motion.button>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────
export default function GhostSettingsDrawer({
  show, onClose, onAction,
  loungeGuestCount, loungeEnabled = true, onToggleLounge,
  casinoEnabled = false, onToggleCasino,
}: Props) {
  const navigate = useNavigate();

  // Read profile for header
  const profile = (() => {
    try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}"); } catch { return {}; }
  })();
  const progress    = getProgress();
  const loungeUnlocked = (() => { try { return localStorage.getItem("breakfast_lounge_unlocked") === "true"; } catch { return false; } })();
  const roomsUnlocked  = (() => { try { return localStorage.getItem("rooms_unlocked") === "true"; } catch { return false; } })();
  const gamesUnlocked  = (() => { try { return localStorage.getItem("games_room_unlocked") === "true"; } catch { return false; } })();
  const currentTier = getCurrentTier(progress);
  const tierColor   = TIER_COLORS[currentTier.id];
  const verificationStatus = profile.verification_status as string | undefined;
  const isVerifiedProfile  = profile.face_verified === true || verificationStatus === "verified";

  const go = (path: string) => { onClose(); navigate(path); };
  const act = (a: SettingsAction) => { onClose(); onAction(a); };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9000, backdropFilter: "blur(4px)" }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: 270, zIndex: 9001,
              background: "rgba(6,3,3,0.99)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              borderLeft: "1px solid rgba(220,20,20,0.18)",
              display: "flex", flexDirection: "column",
              paddingTop: "max(48px, env(safe-area-inset-top, 48px))",
              paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
            }}
          >
            {/* Top rim */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${R}, transparent)` }} />

            {/* ── Profile header ── */}
            <div style={{ padding: "0 16px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              {/* Avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: "rgba(40,20,20,0.8)",
                border: `1px solid ${tierColor}44`,
                overflow: "hidden",
              }}>
                {profile.image
                  ? <img src={profile.image} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👤</div>
                }
              </div>

              {/* Name + tier */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {profile.name || profile.ghostId || "Guest"}
                </div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5, marginTop: 3,
                  background: `${tierColor}18`, border: `1px solid ${tierColor}35`,
                  borderRadius: 6, padding: "2px 7px",
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: tierColor }} />
                  <span style={{ color: tierColor, fontSize: 9, fontFamily: "monospace", letterSpacing: 0.5 }}>
                    {currentTier.hotelTitle}
                  </span>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={onClose}
                style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: "rgba(220,20,20,0.08)", border: `1px solid ${R_EDGE}`,
                  color: "rgba(255,255,255,0.45)", fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >✕</button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, rgba(220,20,20,0.2), transparent)`, margin: "0 16px 4px" }} />

            {/* ── Scrollable nav ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 10px", scrollbarWidth: "none" }}>

              {/* MY ROOMS */}
              <Section label="MY ROOMS" />

              <Row
                icon={<span style={{ fontSize: 17 }}>🏛️</span>}
                label="Hotel Feed"
                desc="Browse all guests"
                onClick={() => go("/ghost/mode")}
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>🛏️</span>}
                label="Standard Room"
                desc="Ground floor guests"
                onClick={() => go("/ghost/room-detail/standard")}
                roomId="standard"
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>🛎️</span>}
                label="Ensuite"
                desc="Suite floor guests"
                onClick={() => go("/ghost/room-detail/suite")}
                roomId="suite"
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>👑</span>}
                label="Kings Room"
                desc="Exclusive Kings floor"
                onClick={() => go("/ghost/room-detail/kings")}
                roomId="kings"
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>🏙️</span>}
                label="Penthouse"
                desc="The most exclusive floor"
                onClick={() => go("/ghost/room-detail/penthouse")}
                roomId="penthouse"
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>🌆</span>}
                label="Loft"
                desc="Loft floor guests"
                onClick={() => go("/ghost/room-detail/loft")}
                roomId="loft"
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>🕯️</span>}
                label="The Cellar"
                desc="Underground members"
                onClick={() => go("/ghost/room-detail/cellar")}
                roomId="cellar"
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>🌿</span>}
                label="Garden Lodge"
                desc="Garden floor guests"
                onClick={() => go("/ghost/room-detail/garden")}
                roomId="garden"
              />
              {loungeUnlocked && (
                <Row
                  icon={<span style={{ fontSize: 17 }}>☕</span>}
                  label="Breakfast Lounge"
                  desc={loungeEnabled
                    ? loungeGuestCount ? `${loungeGuestCount} guests online` : "Social lounge"
                    : "You are opted out"}
                  onClick={() => { if (loungeEnabled) act("breakfastLounge"); }}
                  dim={!loungeEnabled}
                  right={
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {loungeEnabled && loungeGuestCount != null && loungeGuestCount > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: R, background: R_BG, border: `1px solid ${R_EDGE}`, borderRadius: 6, padding: "1px 6px" }}>
                          {loungeGuestCount}
                        </span>
                      )}
                      <Toggle on={loungeEnabled} onFlip={() => onToggleLounge?.()} />
                    </div>
                  }
                />
              )}
              <Row
                icon={<span style={{ fontSize: 17 }}>🎰</span>}
                label="Casino"
                desc={casinoEnabled ? "Coming soon" : "You are opted out"}
                onClick={() => {}}
                dim={!casinoEnabled}
                right={<Toggle on={casinoEnabled} onFlip={() => onToggleCasino?.()} />}
              />
              {gamesUnlocked && (
                <Row
                  icon={<span style={{ fontSize: 17 }}>🎮</span>}
                  label="Games Room"
                  desc="Connect 4 & memory games"
                  onClick={() => go("/ghost/games")}
                />
              )}

              {/* HOTEL SERVICES */}
              <Section label="HOTEL SERVICES" />

              <Row
                icon={<img src={ROOM_IMG} alt="room" style={{ width: 20, height: 20, objectFit: "contain" }} />}
                label="Room Vault"
                desc="Your private ghost room"
                onClick={() => go("/ghost/room")}
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>🕐</span>}
                label="Ghost Clock"
                desc="Open your 2-hour availability window"
                onClick={() => act("ghostClock")}
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>⚔️</span>}
                label="Floor Wars"
                desc="Weekly floor gift leaderboard"
                onClick={() => act("floorWars")}
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>🏆</span>}
                label="Leaderboard"
                desc="Top Ghosts this week"
                onClick={() => act("leaderboard")}
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>🎬</span>}
                label="Video Introduction"
                desc="Upload & manage your video intro"
                onClick={() => act("video")}
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>{isVerifiedProfile ? "✅" : verificationStatus === "pending" ? "🕐" : "🎥"}</span>}
                label={isVerifiedProfile ? "Verified Ghost" : verificationStatus === "pending" ? "Verification Pending" : "Get Verified"}
                desc={isVerifiedProfile ? "Your verified badge is active" : verificationStatus === "pending" ? "Under review — within 24h" : "Record a 5s selfie to get your badge"}
                onClick={() => !isVerifiedProfile && verificationStatus !== "pending" ? act("getVerified") : undefined}
                dim={isVerifiedProfile || verificationStatus === "pending"}
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>🔗</span>}
                label="Invite Friends"
                desc="Earn 25 coins per friend who joins"
                onClick={() => act("inviteFriends")}
              />

              {/* MY ACCOUNT */}
              <Section label="MY ACCOUNT" />

              <Row
                icon={<span style={{ fontSize: 17 }}>📊</span>}
                label="Dashboard"
                desc="Your stats & activity"
                onClick={() => go("/ghost/dashboard")}
              />
              {roomsUnlocked && (
                <Row
                  icon={<span style={{ fontSize: 17 }}>🏨</span>}
                  label="Hotel Vacancy"
                  desc="Room availability & booking"
                  onClick={() => go("/ghost/rooms")}
                />
              )}
              <Row
                icon={<span style={{ fontSize: 17 }}>📄</span>}
                label="Terms & Conditions"
                desc="Privacy & usage policy"
                onClick={() => { onClose(); window.open("https://2ghost.com/terms", "_blank"); }}
              />
              <Row
                icon={<span style={{ fontSize: 17 }}>🏨</span>}
                label="Check Out"
                desc="Leave a calling card or check out"
                onClick={() => go("/ghost/checkout")}
                isCheckout
              />
            </div>

            {/* ── Sign out ── */}
            <div style={{ padding: "10px 10px 0", borderTop: "1px solid rgba(220,20,20,0.1)" }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  try {
                    localStorage.removeItem("ghost_house_welcomed");
                    localStorage.removeItem("ghost_butler_greeted");
                    localStorage.removeItem("ghost_house_tier");
                  } catch {}
                  onClose();
                  navigate("/ghost");
                }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  background: "rgba(220,20,20,0.06)", border: "1px solid rgba(220,20,20,0.2)",
                  borderTop: "1px solid rgba(220,20,20,0.45)",
                  boxShadow: "inset 0 1px 0 rgba(220,20,20,0.18)",
                  borderRadius: 12, padding: "11px 12px", cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(220,20,20,0.1)", border: "1px solid rgba(220,20,20,0.3)", borderTop: "1px solid rgba(220,20,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 16 }}>🚪</span>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: R }}>Sign Out</div>
                  <div style={{ fontSize: 10, color: R_DIM }}>Return to landing page</div>
                </div>
              </motion.button>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.12)", margin: "8px 0 0", textAlign: "center" }}>
                Heartsway Hotel · 2Ghost
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
