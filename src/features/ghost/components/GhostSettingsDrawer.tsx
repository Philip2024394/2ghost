// ── Settings Drawer ─────────────────────────────────────────────────────────────
// Right-side slide-in settings/menu drawer — red theme.

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const SHIELD_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdfsdsdsddsdf.png";

// ── Red theme constants ────────────────────────────────────────────────────────
const R       = "#e01010";
const R_DIM   = "rgba(220,20,20,0.7)";
const R_BG    = "rgba(220,20,20,0.08)";
const R_EDGE  = "rgba(220,20,20,0.3)";   // top-edge light border
const R_GLOW  = "rgba(220,20,20,0.15)";  // top-edge inner glow

export type SettingsAction =
  | "dashboard" | "shield" | "rooms" | "roomVault"
  | "ghostClock" | "floorWars" | "video" | "terms" | "checkout" | "games" | "breakfastLounge";

type Props = {
  show: boolean;
  onClose: () => void;
  onAction: (action: SettingsAction) => void;
  loungeGuestCount?: number;
  loungeEnabled?: boolean;
  onToggleLounge?: () => void;
};

export default function GhostSettingsDrawer({ show, onClose, onAction, loungeGuestCount, loungeEnabled = true, onToggleLounge }: Props) {
  const navigate = useNavigate();

  const items: Array<{
    icon: string | null;
    label: string;
    desc: string;
    action: SettingsAction;
    isShield?: boolean;
    isRoom?: boolean;
    isCheckout?: boolean;
  }> = [
    { icon: "📊", label: "Dashboard",             desc: "Your stats & activity",                           action: "dashboard" },
    { icon: null, label: "Shield",                 desc: "Block & privacy controls", isShield: true,       action: "shield" },
    { icon: "🏨", label: "Rooms",                  desc: "Ghost Hotel floor",                               action: "rooms" },
    { icon: null, label: "Room Vault",             desc: "Your private ghost room",  isRoom: true,          action: "roomVault" },
    { icon: "🕐", label: "Ghost Clock",            desc: "Open your 2-hour availability window",            action: "ghostClock" },
    { icon: "🎮", label: "Games",                  desc: "Rooms",                                           action: "games" },
    { icon: "🍳", label: "Breakfast Lounge",       desc: loungeGuestCount != null ? `${loungeGuestCount} guests online worldwide` : "Invite a guest to your table", action: "breakfastLounge" },
    { icon: "⚔️", label: "Floor Wars",             desc: "Weekly floor gift leaderboard",                   action: "floorWars" },
    { icon: "🎬", label: "Video Introduction",     desc: "Upload & manage your video intro",                action: "video" },
    { icon: "📄", label: "Terms & Conditions",     desc: "Privacy & usage policy",                          action: "terms" },
    { icon: "🏨", label: "Check Out of Hotel",     desc: "Leave a calling card or check out with your match", isCheckout: true, action: "checkout" },
  ];

  const handleItem = (action: SettingsAction) => {
    onClose();
    if (action === "dashboard")  { navigate("/ghost/dashboard"); return; }
    if (action === "shield")     { navigate("/ghost/block"); return; }
    if (action === "roomVault")  { navigate("/ghost/room"); return; }
    if (action === "terms")      { window.open("https://2ghost.com/terms", "_blank"); return; }
    if (action === "checkout")   { navigate("/ghost/checkout"); return; }
    onAction(action);
  };

  function handleSignOut() {
    try {
      localStorage.removeItem("ghost_house_welcomed");
      localStorage.removeItem("ghost_butler_greeted");
      localStorage.removeItem("ghost_house_tier");
    } catch {}
    onClose();
    navigate("/ghost");
  }

  // Shared button style — frosted dark with red top-edge light
  const btnStyle = (isCheckout = false): React.CSSProperties => ({
    width: "100%", display: "flex", alignItems: "center", gap: 14,
    background: isCheckout ? "rgba(239,68,68,0.06)" : "rgba(10,6,6,0.82)",
    border: isCheckout ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(220,20,20,0.18)",
    borderRadius: 14, padding: "13px 14px", marginBottom: 8,
    cursor: "pointer", textAlign: "left" as const,
    // Top-edge red light effect
    borderTop: isCheckout ? "1px solid rgba(239,68,68,0.4)" : `1px solid ${R_EDGE}`,
    boxShadow: isCheckout
      ? "inset 0 1px 0 rgba(239,68,68,0.2)"
      : `inset 0 1px 0 ${R_GLOW}`,
  });

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9000, backdropFilter: "blur(4px)" }}
          />

          {/* Right drawer */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: 260, zIndex: 9001,
              background: "rgba(8,4,4,0.99)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              borderLeft: `1px solid rgba(220,20,20,0.2)`,
              display: "flex", flexDirection: "column",
              paddingTop: "max(48px, env(safe-area-inset-top, 48px))",
              paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))",
            }}
          >
            {/* Top rim — red glow stripe */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${R}, transparent)` }} />

            {/* Header */}
            <div style={{ padding: "0 20px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>Menu</p>
                <p style={{ fontSize: 10, color: R_DIM, margin: 0, fontWeight: 700 }}>Hearts Way Hotel</p>
              </div>
              <button onClick={onClose}
                style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(220,20,20,0.08)", border: `1px solid ${R_EDGE}`, borderTop: `1px solid ${R_EDGE}`, boxShadow: `inset 0 1px 0 ${R_GLOW}`, color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, rgba(220,20,20,0.25), transparent)`, margin: "0 20px 14px" }} />

            {/* Nav items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 12px", scrollbarWidth: "none" }}>
              {items.map(({ icon, label, desc, action, isShield, isRoom, isCheckout }) => {
                const isLounge = action === "breakfastLounge";
                return (
                  <button key={label}
                    onClick={() => isLounge && !loungeEnabled ? undefined : handleItem(action)}
                    style={{ ...btnStyle(isCheckout), opacity: isLounge && !loungeEnabled ? 0.5 : 1, cursor: isLounge && !loungeEnabled ? "default" : "pointer" }}
                  >
                    {/* Icon box */}
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                      background: isCheckout ? "rgba(239,68,68,0.1)" : R_BG,
                      border: `1px solid ${isCheckout ? "rgba(239,68,68,0.25)" : R_EDGE}`,
                      borderTop: `1px solid ${isCheckout ? "rgba(239,68,68,0.5)" : R}`,
                      boxShadow: `inset 0 1px 0 ${isCheckout ? "rgba(239,68,68,0.2)" : R_GLOW}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {isShield
                        ? <img src={SHIELD_LOGO} alt="shield" style={{ width: 22, height: 22, objectFit: "contain" }} />
                        : isRoom
                        ? <img src="https://ik.imagekit.io/7grri5v7d/weqweqw.png" alt="room" style={{ width: 22, height: 22, objectFit: "contain" }} />
                        : <span style={{ fontSize: 18 }}>{icon}</span>
                      }
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: isCheckout ? "rgba(239,68,68,0.85)" : "#fff", margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                        {isLounge && !loungeEnabled ? "You are opted out" : desc}
                      </p>
                    </div>

                    {/* Lounge toggle / arrow */}
                    {isLounge ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        {loungeEnabled && loungeGuestCount != null && loungeGuestCount > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 800, color: R, background: R_BG, border: `1px solid ${R_EDGE}`, borderRadius: 8, padding: "2px 7px" }}>{loungeGuestCount}</span>
                        )}
                        <div
                          onClick={e => { e.stopPropagation(); onToggleLounge?.(); }}
                          style={{ width: 38, height: 22, borderRadius: 11, background: loungeEnabled ? R : "rgba(255,255,255,0.1)", border: `1px solid ${loungeEnabled ? "rgba(220,20,20,0.6)" : "rgba(255,255,255,0.15)"}`, position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}
                        >
                          <div style={{ position: "absolute", top: 2, left: loungeEnabled ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "rgba(220,20,20,0.4)", fontSize: 14 }}>›</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer — Sign out */}
            <div style={{ padding: "14px 12px 0", borderTop: `1px solid rgba(220,20,20,0.12)` }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSignOut}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  background: "rgba(220,20,20,0.06)",
                  border: "1px solid rgba(220,20,20,0.2)",
                  borderTop: `1px solid rgba(220,20,20,0.45)`,
                  boxShadow: `inset 0 1px 0 rgba(220,20,20,0.18)`,
                  borderRadius: 12, padding: "12px 14px",
                  cursor: "pointer", textAlign: "left" as const, marginBottom: 10,
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(220,20,20,0.1)", border: "1px solid rgba(220,20,20,0.3)", borderTop: `1px solid rgba(220,20,20,0.55)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 16 }}>🚪</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: R, margin: 0 }}>Sign Out</p>
                  <p style={{ fontSize: 10, color: "rgba(220,20,20,0.5)", margin: 0 }}>Return to landing page</p>
                </div>
              </motion.button>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", margin: 0, textAlign: "center" }}>Hearts Way Hotel · 2Ghost</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
