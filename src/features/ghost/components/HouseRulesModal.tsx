// ── House Rules Modal ─────────────────────────────────────────────────────────
// Slides up ~5s after first arrival. User must agree before browsing.
// Extracted from GhostModePage to reduce file size.

import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

const GHOST_LOGO  = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdf.png";
const PREVIEW_AVATARS = Array.from({ length: 8 }, (_, i) => `https://i.pravatar.cc/80?img=${i + 1}`);

const HOUSE_RULES = [
  { icon: "🤝", title: "Respect Every Ghost",       desc: "No harassment, hate, or disrespect. Every person here deserves dignity — no exceptions." },
  { icon: "🔒", title: "Privacy is Sacred",          desc: "Never share another member's identity, photos, or location outside the House." },
  { icon: "🚫", title: "No Bad Energy",              desc: "No spam, scams, or fake profiles. Genuine connections only — the House self-cleanses." },
  { icon: "👻", title: "Stay Anonymous Until Ready", desc: "Your Ghost ID protects you. Only reveal yourself when you're truly comfortable." },
  { icon: "💚", title: "Good Vibes Only",            desc: "Bring curiosity, openness, and warmth. The energy you put in is the energy you get back." },
];

const HOW_IT_WORKS = [
  { icon: "❤️", title: "Like for Free",       desc: "Browse every profile and like as many as you want — completely free, no subscription needed." },
  { icon: "✨", title: "Ghost Match",          desc: "When two ghosts like each other it becomes a mutual match. You'll get notified instantly." },
  { icon: "📱", title: "Connect on Match",    desc: "After a mutual match, pay once to unlock their real contact — WhatsApp, Telegram, or any app they use." },
  { icon: "🚪", title: "Ghost Vault",         desc: "Your private vault. All your matches live here with a 48-hour countdown. Don't let them fade." },
  { icon: "🌍", title: "Global House",        desc: "Members from Indonesia 🇮🇩 Philippines 🇵🇭 Thailand 🇹🇭 Singapore 🇸🇬 Malaysia 🇲🇾 Vietnam 🇻🇳 and beyond." },
  { icon: "👁️", title: "You're Invisible",   desc: "Others only see your Ghost ID, photo, age, and city — nothing else — until you both connect." },
];

type Props = { show: boolean; onAccept: () => void };

export default function HouseRulesModal({ show, onAccept }: Props) {
  const a = useGenderAccent();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: "fixed", inset: 0, zIndex: 250,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            style={{
              width: "100%", maxWidth: 480,
              backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdfasdASD.png)",
              backgroundSize: "cover", backgroundPosition: "center top",
              borderRadius: "24px 24px 0 0",
              border: `1px solid ${a.glow(0.12)}`, borderBottom: "none",
              maxHeight: "92dvh",
              display: "flex", flexDirection: "column",
            }}
          >
            <div style={{ height: 3, flexShrink: 0, background: `linear-gradient(90deg, ${a.accentDeep}, ${a.accent}, ${a.accentMid}, ${a.accent}, ${a.accentDeep})` }} />
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0", flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
            </div>

            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "20px 22px 16px" }}>

              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.2, background: `linear-gradient(135deg, #fff 40%, ${a.accent})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Welcome to the Ghost Hotel 👻
                </h1>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.7, maxWidth: 320, marginInline: "auto" }}>
                  Before you settle in, we have some{" "}
                  <span style={{ color: a.glow(0.85), fontWeight: 700 }}>hotel rules</span>{" "}
                  that keep our hotel free from bad energy.
                </p>
              </div>

              {/* Preview avatars */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 16 }}>
                {PREVIEW_AVATARS.map((src, i) => (
                  <img key={i} src={src} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.45)}`, marginLeft: i === 0 ? 0 : -10, zIndex: PREVIEW_AVATARS.length - i, position: "relative" }} />
                ))}
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginLeft: 10 }}>+120 ghosts inside</span>
              </div>

              <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${a.glow(0.2)}, transparent)`, marginBottom: 22 }} />

              {/* Rules */}
              <div style={{ marginBottom: 26 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: a.glow(0.6), textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 14px" }}>🏠 House Rules</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {HOUSE_RULES.map((rule) => (
                    <div key={rule.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: a.glow(0.04), border: `1px solid ${a.glow(0.08)}`, borderRadius: 14, padding: "12px 14px" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: a.glow(0.1), border: `1px solid ${a.glow(0.18)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {rule.icon === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain" }} /> : rule.icon}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>{rule.title}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", margin: 0, lineHeight: 1.5 }}>{rule.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${a.glow(0.2)}, transparent)`, marginBottom: 22 }} />

              {/* How it works */}
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: a.glow(0.6), textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 14px" }}>⚙️ How It Works</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {HOW_IT_WORKS.map((item) => (
                    <div key={item.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                        {item.icon}
                      </div>
                      <div style={{ paddingTop: 2 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{item.title}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
                Agree To Abide By Rules
              </motion.button>
              <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "10px 0 0", lineHeight: 1.6 }}>
                By entering you agree to the house rules above and our{" "}
                <span style={{ color: "rgba(255,255,255,0.35)" }}>Privacy Policy</span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
