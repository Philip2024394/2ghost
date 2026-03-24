// ── Settings Drawer ─────────────────────────────────────────────────────────────
// Right-side slide-in settings/menu drawer.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

const SHIELD_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdfsdsdsddsdf.png";

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
  const a = useGenderAccent();
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
    { icon: "📊", label: "Dashboard", desc: "Your stats & activity", action: "dashboard" },
    { icon: null, label: "Shield", desc: "Block & privacy controls", isShield: true, action: "shield" },
    { icon: "🏨", label: "Rooms", desc: "Ghost Hotel floor", action: "rooms" },
    { icon: null, label: "Room Vault", desc: "Your private ghost room", isRoom: true, action: "roomVault" },
    { icon: "🕐", label: "Ghost Clock", desc: "Open your 2-hour availability window", action: "ghostClock" },
    { icon: "🎮", label: "Games", desc: "Rooms", action: "games" },
    { icon: "🍳", label: "Breakfast Lounge", desc: loungeGuestCount != null ? `${loungeGuestCount} guests online worldwide` : "Invite a guest to your table", action: "breakfastLounge" },
    { icon: "⚔️", label: "Floor Wars", desc: "Weekly floor gift leaderboard", action: "floorWars" },
    { icon: "🎬", label: "Video Introduction", desc: "Upload & manage your video intro", action: "video" },
    { icon: "📄", label: "Terms & Conditions", desc: "Privacy & usage policy", action: "terms" },
    { icon: "🏨", label: "Check Out of Hotel", desc: "Leave a calling card or check out with your match", isCheckout: true, action: "checkout" },
  ];

  const handleItem = (action: SettingsAction) => {
    onClose();
    if (action === "dashboard") { navigate("/ghost/dashboard"); return; }
    if (action === "shield") { navigate("/ghost/block"); return; }
    if (action === "roomVault") { navigate("/ghost/room"); return; }
    if (action === "terms") { window.open("https://2ghost.com/terms", "_blank"); return; }
    if (action === "checkout") { navigate("/ghost/checkout"); return; }
    onAction(action);
  };

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
              background: "rgba(8,10,14,0.99)",
              borderLeft: `1px solid ${a.glow(0.15)}`,
              display: "flex", flexDirection: "column",
              paddingTop: "max(48px, env(safe-area-inset-top, 48px))",
              paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))",
            }}
          >
            {/* Top rim */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)` }} />

            {/* Header */}
            <div style={{ padding: "0 20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>Menu</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>2Ghost</p>
              </div>
              <button onClick={onClose}
                style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>

            <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${a.glow(0.15)}, transparent)`, margin: "0 20px 16px" }} />

            {/* Nav items */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
              {items.map(({ icon, label, desc, action, isShield, isRoom, isCheckout }) => {
                const isLounge = action === "breakfastLounge";
                return (
                <button key={label} onClick={() => isLounge && !loungeEnabled ? undefined : handleItem(action)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 14,
                    background: isCheckout ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)",
                    border: isCheckout ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 14, padding: "13px 14px", marginBottom: 8,
                    cursor: isLounge && !loungeEnabled ? "default" : "pointer", textAlign: "left",
                    opacity: isLounge && !loungeEnabled ? 0.5 : 1,
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: isShield ? "rgba(255,255,255,0.04)" : isCheckout ? "rgba(239,68,68,0.08)" : a.glow(0.07),
                    border: `1px solid ${isShield ? "rgba(255,255,255,0.08)" : isCheckout ? "rgba(239,68,68,0.2)" : a.glow(0.15)}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {isShield
                      ? <img src={SHIELD_LOGO} alt="shield" style={{ width: 22, height: 22, objectFit: "contain" }} />
                      : isRoom
                      ? <img src="https://ik.imagekit.io/7grri5v7d/weqweqw.png" alt="room" style={{ width: 22, height: 22, objectFit: "contain" }} />
                      : <span style={{ fontSize: 18 }}>{icon}</span>
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: isCheckout ? "rgba(239,68,68,0.85)" : "#fff", margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                      {isLounge && !loungeEnabled ? "You are opted out" : desc}
                    </p>
                  </div>
                  {isLounge ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      {loungeEnabled && loungeGuestCount != null && loungeGuestCount > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#d4af37", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 8, padding: "2px 7px" }}>{loungeGuestCount}</span>
                      )}
                      {/* Toggle switch */}
                      <div
                        onClick={e => { e.stopPropagation(); onToggleLounge?.(); }}
                        style={{ width: 38, height: 22, borderRadius: 11, background: loungeEnabled ? "#22c55e" : "rgba(255,255,255,0.1)", border: `1px solid ${loungeEnabled ? "#16a34a" : "rgba(255,255,255,0.15)"}`, position: "relative", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}
                      >
                        <div style={{ position: "absolute", top: 2, left: loungeEnabled ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>›</span>
                  )}
                </button>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 20px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", margin: 0, textAlign: "center" }}>2Ghost · Find your boo 👻</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
