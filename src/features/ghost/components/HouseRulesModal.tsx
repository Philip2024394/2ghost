// ── House Rules Modal ─────────────────────────────────────────────────────────
// Slides up ~5s after first arrival. User must agree before browsing.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

const PREVIEW_AVATARS = [
  "https://ik.imagekit.io/7grri5v7d/5q.png?updatedAt=1774013004908",
  "https://ik.imagekit.io/7grri5v7d/4q.png?updatedAt=1774012953710",
  "https://ik.imagekit.io/7grri5v7d/4i.png?updatedAt=1774012879924",
  "https://ik.imagekit.io/7grri5v7d/1a.png?updatedAt=1774012891284",
  "https://ik.imagekit.io/7grri5v7d/2q.png?updatedAt=1774012847860",
  "https://ik.imagekit.io/7grri5v7d/1q.png?updatedAt=1774012805166",
  "https://ik.imagekit.io/7grri5v7d/1as.png?updatedAt=1774009744350",
  "https://ik.imagekit.io/7grri5v7d/wee.png",
  "https://ik.imagekit.io/7grri5v7d/weeeehu.png",
];

type Props = { show: boolean; onAccept: () => void };

export default function HouseRulesModal({ show, onAccept }: Props) {
  const a = useGenderAccent();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 280, damping: 32 }}
          style={{
            position: "fixed", inset: 0, zIndex: 250,
            backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/sdfasdfdddsaasdf.png?updatedAt=1774270395199)",
            backgroundSize: "cover", backgroundPosition: "center top",
            display: "flex", flexDirection: "column",
          }}
        >
            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "20px 22px 16px" }}>

              {/* Header row: text left, hero right */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 20 }}>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h1 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.2, background: `linear-gradient(135deg, #fff 40%, ${a.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Welcome To 2Ghost Hotel
                  </h1>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.65 }}>
                    Within these walls, you are free to be whoever you are —{" "}
                    <span style={{ color: a.glow(0.85), fontWeight: 700 }}>but the rules of this hotel are absolute.</span>
                  </p>
                </div>
                {/* Hero character */}
                <img
                  src="https://ik.imagekit.io/7grri5v7d/tyiytityutyiutyuiyu-removebg-preview.png?updatedAt=1774293037210"
                  alt=""
                  style={{
                    width: 220, height: 280,
                    objectFit: "contain",
                    flexShrink: 0,
                    filter: `drop-shadow(0 0 14px ${a.glow(0.5)})`,
                    pointerEvents: "none",
                    marginBottom: -98,
                    marginRight: -22,
                  }}
                />
              </div>

              {/* Preview avatars */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px", textAlign: "left" }}>
                  🇮🇩 New Guests Indonesia +237
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: 0 }}>
                  {PREVIEW_AVATARS.map((src, i) => (
                    <img key={i} src={src} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.45)}`, marginLeft: i === 0 ? 0 : -10, zIndex: PREVIEW_AVATARS.length - i, position: "relative" }} />
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${a.glow(0.2)}, transparent)`, marginBottom: 22 }} />

              {/* Hotel Rules letter */}
              <div style={{ marginBottom: 26 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: a.glow(0.6), textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 18px" }}>🏨 Hotel Rules</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    "To all new guests, I welcome you.",
                    "As the head of this hotel, I uphold strict rules designed to guard and protect the well-being of every guest who walks through these doors. This is a place for those who are serious about their journey — those who are truly seeking a connection, a bond, a soulmate.",
                    "Many of you arrive familiar with other dating environments, where intentions can be fleeting and choices are made without meaning. 2Ghost is not that place.",
                    "Here, every floor holds a different experience, and choosing the level that reflects your true intentions will be the first step in your journey — perhaps, for the first time, in the right direction.",
                    "Take your time to settle in. Allow yourself to be known. What happens within this hotel is as real as it will ever get. If you respect the rules and embrace the process, you will find that the path to your soulmate becomes clear… and effortless.",
                    "For those with lighter intentions, understand this: the hotel can accommodate all guests, but the walls are always listening. Respect the space, respect the rules, and conduct yourself accordingly.",
                    "There is only one rule within my hotel:",
                    "Enjoy. Seek. Discover. Fall in love. Follow whatever destiny reveals to you…",
                    "But do not break the rules of this hotel.",
                    "And now, without further ado… allow me to allocate you your room.",
                  ].map((para, i) => (
                    <p
                      key={i}
                      style={{
                        fontSize: i === 0 ? 14 : i === 7 ? 13 : 12,
                        fontWeight: i === 0 ? 800 : i === 7 || i === 8 ? 700 : 400,
                        color: i === 0 ? "#fff" : i === 7 ? a.accent : i === 8 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)",
                        margin: 0,
                        lineHeight: 1.75,
                        fontStyle: i === 7 || i === 9 ? "italic" : "normal",
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>

                {/* Hotel Rules link */}
                <p style={{ margin: "18px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                  By continuing you agree to our{" "}
                  <a
                    href="/hotel-rules"
                    style={{ color: a.accent, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}
                  >
                    Hotel Rules
                  </a>
                </p>
              </div>
            </div>

            {/* Sticky footer */}
            <div style={{ flexShrink: 0, padding: "14px 22px max(28px, env(safe-area-inset-bottom, 28px))", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(4,6,4,0.97)" }}>
              <motion.button
                whileTap={{ scale: 0.97 }} whileHover={{ y: -2 }}
                onClick={onAccept}
                style={{
                  width: "100%", height: 54, borderRadius: 50, border: "none",
                  background: a.gradient,
                  color: "#fff", fontSize: 15, fontWeight: 900,
                  cursor: "pointer", letterSpacing: "0.03em",
                  boxShadow: `0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 32px ${a.glowMid(0.5)}`,
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
                I Accept The Hotel Rules
              </motion.button>
              <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "10px 0 0", lineHeight: 1.6 }}>
                By entering you agree to the house rules above and our{" "}
                <span style={{ color: "rgba(255,255,255,0.35)" }}>Privacy Policy</span>
              </p>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
