// ── Dev Popup Launcher ────────────────────────────────────────────────────────
// Floating dev button that opens a bottom sheet with trigger buttons for every
// popup, banner and sheet in the app. For development only.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import ButlerArrivalPopup from "../../features/ghost/components/ButlerArrivalPopup";
import BreakfastGuestPicker from "../../features/ghost/components/BreakfastGuestPicker";
import BreakfastInviteReceived from "../../features/ghost/components/BreakfastInviteReceived";
import LoungeSplashScreen from "../../features/ghost/components/LoungeSplashScreen";
import BreakfastRatingPopup from "../../features/ghost/components/BreakfastRatingPopup";
import ButlerMatchSignalPopup from "../../features/ghost/components/ButlerMatchSignalPopup";
import SocialActivityInvitePopup from "../../features/ghost/components/SocialActivityInvitePopup";
import ButlerExcusePopup from "../../features/ghost/components/ButlerExcusePopup";
import { INTL_PROFILES } from "../../features/ghost/types/ghostTypes";
import { FLOOR_META } from "../../features/ghost/utils/breakfastGiftService";
import { loadActivities } from "../../features/ghost/utils/breakfastRatingService";
import type { SocialInvite } from "../../features/ghost/utils/breakfastRatingService";
import type { BreakfastInvite } from "../../features/ghost/utils/breakfastInviteService";

// ── Mock data ─────────────────────────────────────────────────────────────────

const FLOORS = ["standard", "suite", "kings", "penthouse", "loft", "cellar"] as const;
type Floor = typeof FLOORS[number];

function mockInvite(floor: Floor): BreakfastInvite {
  return {
    id: "dev-invite-1",
    fromUserId: "user-1",
    fromUserName: "Sofia",
    fromFloor: floor,
    toUserId: "me",
    toUserName: "You",
    toAvatar: "42",
    sentAt: Date.now() - 3600000,
    expiresAt: Date.now() + 7200000,
    status: "accepted",
    selectedGifts: [],
    proposedTime: Date.now() + 1800000,
    senderTimezone: "Asia/Singapore",
  };
}

function mockSocialInvite(floor: Floor): SocialInvite {
  const activities = loadActivities();
  const activity = activities[0] ?? {
    id: "act-1", name: "Rooftop Yoga", icon: "🧘", description: "Sunrise yoga with a view.", imageUrl: "",
  };
  return {
    id: "dev-social-1",
    inviteId: "dev-invite-1",
    fromUserId: "user-1",
    fromUserName: "Sofia",
    toUserId: "me",
    toUserName: "You",
    floor,
    activity,
    hostRating: 8,
    guestRating: 7,
    sentAt: Date.now() - 90000000,
    deliverAt: Date.now() - 1000,
    status: "delivered",
  };
}

const MOCK_PROFILES = INTL_PROFILES.slice(0, 8).map((p, i) => ({
  ...p,
  id: `dev-${p.id}`,
  last_seen_at: i % 2 === 0 ? new Date().toISOString() : null,
}));

// ── Types ─────────────────────────────────────────────────────────────────────

type PopupId =
  | "butler-arrival" | "guest-picker" | "invite-received" | "lounge-splash"
  | "rating" | "match-signal" | "social-invite" | "excuse"
  | null;

const SECTIONS = [
  {
    label: "🏨 Hotel",
    items: [
      { id: "butler-arrival" as PopupId, icon: "🛎", label: "Butler Arrival"         },
      { id: "lounge-splash"  as PopupId, icon: "☕", label: "Lounge Splash (5s)"     },
    ],
  },
  {
    label: "☕ Breakfast",
    items: [
      { id: "guest-picker"    as PopupId, icon: "👥", label: "Guest Picker"           },
      { id: "invite-received" as PopupId, icon: "📬", label: "Invite Received"        },
      { id: "excuse"          as PopupId, icon: "😴", label: "Butler Excuse (no-show)"},
      { id: "rating"          as PopupId, icon: "⭐", label: "Rating Popup"           },
      { id: "match-signal"    as PopupId, icon: "💛", label: "Match Signal"           },
      { id: "social-invite"   as PopupId, icon: "🎉", label: "Social Activity Invite" },
    ],
  },
];

const NAVIGATE_ITEMS = [
  { label: "🏠 Ghost Mode",    path: "/ghost/mode"                  },
  { label: "🏨 Checkout",      path: "/ghost/checkout"              },
  { label: "🛋 Suite Room",    path: "/ghost/floor/suite"           },
  { label: "👑 Kings Room",    path: "/ghost/floor/kings"           },
  { label: "🌆 Penthouse",     path: "/ghost/floor/penthouse-floor" },
  { label: "🎨 Loft",          path: "/ghost/floor/loft-floor"      },
  { label: "🍷 Cellar",        path: "/ghost/floor/cellar-floor"    },
  { label: "📊 Dashboard",     path: "/ghost/dashboard"             },
  { label: "⚙️ Admin",         path: "/admin"                       },
  { label: "🎮 Games Room",    path: "/ghost/games"                 },
  { label: "🔴 Connect 4",     path: "/ghost/games/connect4"        },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function DevPopupLauncher() {
  const navigate = useNavigate();
  const [open,   setOpen]   = useState(false);
  const [active, setActive] = useState<PopupId>(null);
  const [floor,  setFloor]  = useState<Floor>("suite");

  const meta = FLOOR_META[floor] ?? FLOOR_META.standard;

  function show(id: PopupId) { setActive(id); setOpen(false); }
  function hide()             { setActive(null); }

  const inv    = mockInvite(floor);
  const socInv = mockSocialInvite(floor);

  return (
    <>
      {/* ── Floating toggle ── */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(v => !v)}
        style={{
          position: "fixed", bottom: 90, left: 14, zIndex: 9500,
          height: 28, padding: "0 10px", borderRadius: 8,
          background: open ? "rgba(139,92,246,0.25)" : "rgba(0,0,0,0.75)",
          border: open ? "1px solid rgba(139,92,246,0.55)" : "1px solid rgba(255,255,255,0.15)",
          color: open ? "#a78bfa" : "rgba(255,255,255,0.5)",
          fontSize: 10, fontWeight: 900, cursor: "pointer",
          backdropFilter: "blur(12px)", letterSpacing: "0.06em",
          display: "flex", alignItems: "center", gap: 5,
        }}
      >
        🪟 POPUPS
      </motion.button>

      {/* ── Bottom sheet ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 9490, background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                background: "rgba(6,6,15,0.99)", borderRadius: "22px 22px 0 0",
                border: "1px solid rgba(139,92,246,0.3)", borderBottom: "none",
                maxHeight: "88dvh", display: "flex", flexDirection: "column",
                paddingBottom: "max(20px,env(safe-area-inset-bottom,20px))" }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #8b5cf6, transparent)", flexShrink: 0 }} />

              {/* Header */}
              <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#a78bfa" }}>🪟 Dev Popup Launcher</p>
                    <p style={{ margin: "3px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Trigger any popup or banner for testing</p>
                  </div>
                  <button onClick={() => setOpen(false)}
                    style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
                      fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ✕
                  </button>
                </div>

                {/* Floor selector */}
                <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.1em" }}>Floor:</span>
                  {FLOORS.map(f => {
                    const m = FLOOR_META[f];
                    const isActive = floor === f;
                    return (
                      <button key={f} onClick={() => setFloor(f)}
                        style={{ height: 26, padding: "0 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                          cursor: "pointer",
                          border: isActive ? `1px solid ${m.color}88` : "1px solid rgba(255,255,255,0.08)",
                          background: isActive ? `${m.color}22` : "rgba(255,255,255,0.04)",
                          color: isActive ? m.color : "rgba(255,255,255,0.45)" }}>
                        {m.icon} {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
                {SECTIONS.map(section => (
                  <div key={section.label} style={{ marginBottom: 18 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {section.label}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {section.items.map(item => (
                        <button key={String(item.id)} onClick={() => show(item.id)}
                          style={{ display: "flex", alignItems: "center", gap: 6,
                            padding: "9px 14px", borderRadius: 12,
                            background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)",
                            color: "#c4b5fd", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Navigate links */}
                <div style={{ marginBottom: 8 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    🔗 Navigate to page
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {NAVIGATE_ITEMS.map(n => (
                      <button key={n.path} onClick={() => { setOpen(false); navigate(n.path); }}
                        style={{ padding: "9px 14px", borderRadius: 12,
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>

                <p style={{ margin: "16px 0 0", fontSize: 9, color: "rgba(255,255,255,0.18)", textAlign: "center" }}>
                  Dev only · not visible in production
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Inline popup renders ── */}
      <AnimatePresence>
        {active === "butler-arrival" && (
          <ButlerArrivalPopup key="butler"
            floor={floor}
            floorLabel={meta.label}
            floorColor={meta.color}
            floorIcon={meta.icon}
            onClose={hide}
            onInvite={hide}
          />
        )}

        {active === "guest-picker" && (
          <BreakfastGuestPicker key="picker"
            floor={floor}
            profiles={MOCK_PROFILES}
            onClose={hide}
            onSent={hide}
          />
        )}

        {active === "invite-received" && (
          <BreakfastInviteReceived key="received"
            invite={inv}
            onAccept={hide}
            onDecline={hide}
          />
        )}

        {active === "lounge-splash" && (
          <LoungeSplashScreen key="lounge"
            floorLabel={meta.label}
            floorColor={meta.color}
            floorIcon={meta.icon}
            guestName="Sofia"
            onDone={hide}
          />
        )}

        {active === "rating" && (
          <BreakfastRatingPopup key="rating"
            floorColor={meta.color}
            floorLabel={meta.label}
            guestName="Sofia"
            onRated={(r) => { console.log("dev rated", r); hide(); }}
            onSkip={hide}
          />
        )}

        {active === "match-signal" && (
          <ButlerMatchSignalPopup key="match"
            invite={inv}
            myRating={8}
            otherRating={7}
            floor={floor}
            floorColor={meta.color}
            floorLabel={meta.label}
            onClose={hide}
          />
        )}

        {active === "social-invite" && (
          <SocialActivityInvitePopup key="social"
            invite={socInv}
            onAccept={hide}
            onDecline={hide}
          />
        )}

        {active === "excuse" && (
          <ButlerExcusePopup key="excuse"
            invite={inv}
            perspective="guest"
            onDismiss={hide}
            onReschedule={hide}
          />
        )}
      </AnimatePresence>
    </>
  );
}
