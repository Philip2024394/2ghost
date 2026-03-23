// ── Butler Arrival Popup ───────────────────────────────────────────────────────
// Shown once on first entry to any floor room.
// Butler welcomes guest and introduces the breakfast invite feature.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { markFirstEntry } from "../utils/breakfastInviteService";

const BUTLER_IMG = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdfccc-removebg-preview.png";
const LUGGAGE_IMG = "https://ik.imagekit.io/7grri5v7d/sdfasdfasdeee-removebg-preview.png";

type Props = {
  floor:      string;
  floorLabel: string;
  floorColor: string;
  floorIcon:  string;
  onClose:    () => void;
  onInvite:   () => void; // opens guest picker
  butlerImg?: string;     // optional per-floor butler image override
};

export default function ButlerArrivalPopup({ floor, floorLabel, floorColor, floorIcon, onClose, onInvite, butlerImg }: Props) {
  const [step, setStep] = useState<"welcome" | "breakfast">("welcome");

  const r = parseInt(floorColor.slice(1,3),16);
  const g = parseInt(floorColor.slice(3,5),16);
  const b = parseInt(floorColor.slice(5,7),16);
  const glow = (o: number) => `rgba(${r},${g},${b},${o})`;

  function handleClose() {
    markFirstEntry(floor);
    onClose();
  }

  function handleInvite() {
    markFirstEntry(floor);
    onInvite();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9500, background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,15,0.99)",
          borderRadius: "24px 24px 0 0", border: `1px solid ${glow(0.3)}`,
          borderBottom: "none", overflow: "hidden",
          paddingBottom: "max(28px,env(safe-area-inset-bottom,28px))" }}
      >
        {/* Floor accent stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${floorColor}, transparent)` }} />

        <AnimatePresence mode="wait">
          {step === "welcome" ? (
            <motion.div key="welcome"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ position: "relative", padding: "24px 24px 20px", overflow: "hidden" }}
            >
              {/* Background room image */}
              <div style={{ position: "absolute", inset: 0, backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsds.png?updatedAt=1774134023247)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.18, pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(6,6,15,0.3) 0%, rgba(6,6,15,0.85) 100%)", pointerEvents: "none" }} />
              {/* Content above background */}
              <div style={{ position: "relative", zIndex: 1 }}>
              {/* Butler + floor badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ position: "relative", width: 64, height: 64, borderRadius: 16, overflow: "hidden", border: `2px solid ${glow(0.5)}`, boxShadow: `0 0 20px ${glow(0.3)}`, flexShrink: 0 }}>
                  <img src={butlerImg ?? BUTLER_IMG} alt="Butler"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }} />
                  <div style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22,
                    borderRadius: "50%", background: "#050508", border: `1.5px solid ${floorColor}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                    {floorIcon}
                  </div>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: floorColor, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Your Butler</p>
                  <p style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 900, color: "#fff" }}>Welcome to {floorLabel}</p>
                </div>
              </div>

              {/* Message lines */}
              {[
                { icon: "__luggage__", text: "Your bags have been placed in the room." },
                { icon: "__linen__", text: "Fresh linen has been changed and your suite is prepared." },
                { icon: "__breakfast__", text: "Breakfast is served from 8am to 10am in The Lounge." },
              ].map((line, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14,
                    padding: "12px 14px", background: glow(0.07), border: `1px solid ${glow(0.18)}`,
                    borderRadius: 14 }}>
                  {line.icon === "__luggage__"
                    ? <img src={LUGGAGE_IMG} alt="Luggage" style={{ width: 72, height: 72, objectFit: "contain", flexShrink: 0 }} />
                    : line.icon === "__linen__"
                    ? <img src="https://ik.imagekit.io/7grri5v7d/sdfasdfsfff-removebg-preview.png" alt="Fresh linen" style={{ width: 72, height: 72, objectFit: "contain", flexShrink: 0 }} />
                    : line.icon === "__breakfast__"
                    ? <img src="https://ik.imagekit.io/7grri5v7d/sdfasdfsfffsdfasdf-removebg-preview.png" alt="Breakfast" style={{ width: 72, height: 72, objectFit: "contain", flexShrink: 0 }} />
                    : <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{line.icon}</span>
                  }
                  <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.5, fontWeight: 500 }}>{line.text}</p>
                </motion.div>
              ))}

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose}
                  style={{ flex: 1, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
                    fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Thank you
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("breakfast")}
                  style={{ flex: 2, height: 48, borderRadius: 14,
                    background: `linear-gradient(135deg, ${floorColor}44, ${floorColor}22)`,
                    border: `1px solid ${glow(0.6)}`, color: floorColor,
                    fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                  About breakfast →
                </motion.button>
              </div>
              </div>{/* end zIndex wrapper */}
            </motion.div>
          ) : (
            <motion.div key="breakfast"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ position: "relative", padding: "24px 24px 20px", overflow: "hidden" }}
            >
              {/* Background room image */}
              <div style={{ position: "absolute", inset: 0, backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsds.png?updatedAt=1774134023247)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.18, pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(6,6,15,0.3) 0%, rgba(6,6,15,0.85) 100%)", pointerEvents: "none" }} />

              <div style={{ position: "relative", zIndex: 1 }}>
              {/* Breakfast header */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <img src="https://ik.imagekit.io/7grri5v7d/Untitledsdafasdf-removebg-preview.png" alt="Breakfast in The Lounge" style={{ display: "block", margin: "0 auto 10px", maxWidth: "100%", height: 48, objectFit: "contain" }} />
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>Breakfast in The Lounge</p>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.55 }}>
                  As a guest of {floorLabel}, you may invite<br />one other guest to join you for breakfast.
                </p>
              </div>

              {/* Details */}
              {[
                { icon: "__gift__", text: "Arrival gifts are placed at your table before your guest arrives." },
                { icon: "__tray__", text: "A butler tip is collected on arrival — first invite is on the house." },
                { icon: "__clock__", text: "Breakfast invites expire after 6 hours. If offline, butler leaves a note in their room." },
              ].map((line, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.08 }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12,
                    padding: "11px 14px", background: glow(0.06), border: `1px solid ${glow(0.15)}`, borderRadius: 12 }}>
                  {line.icon === "__gift__"
                    ? <img src="https://ik.imagekit.io/7grri5v7d/ghjfghjfgj-removebg-preview.png" alt="Arrival gifts" style={{ width: 48, height: 48, objectFit: "contain", flexShrink: 0 }} />
                    : line.icon === "__tray__"
                    ? <img src="https://ik.imagekit.io/7grri5v7d/Untitledsdfasdfasdfasdfsdf-removebg-preview.png" alt="Butler tray" style={{ width: 48, height: 48, objectFit: "contain", flexShrink: 0 }} />
                    : line.icon === "__clock__"
                    ? <img src="https://ik.imagekit.io/7grri5v7d/Untitledsfsdfs-removebg-preview.png" alt="Expires" style={{ width: 48, height: 48, objectFit: "contain", flexShrink: 0 }} />
                    : <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{line.icon}</span>
                  }
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{line.text}</p>
                </motion.div>
              ))}

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose}
                  style={{ flex: 1, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
                    fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Later
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleInvite}
                  style={{ flex: 2, height: 48, borderRadius: 14,
                    background: `linear-gradient(135deg, ${floorColor}44, ${floorColor}22)`,
                    border: `1px solid ${glow(0.6)}`, color: floorColor,
                    fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                  Invite a guest
                </motion.button>
              </div>
              </div>{/* end zIndex wrapper */}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
