import { motion } from "framer-motion";
import { X } from "lucide-react";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

// ── Ghost House Welcome Modal ─────────────────────────────────────────────────
export function GhostHouseWelcomeModal({ onAccept }: { onAccept: () => void }) {
  const RULES = [
    { icon: "🤝", title: "Respect Every Ghost", desc: "No harassment, hate, or disrespect. Every person here deserves dignity — no exceptions." },
    { icon: "🔒", title: "Privacy is Sacred", desc: "Never share another member's identity, photos, or location outside the House." },
    { icon: "🚫", title: "No Bad Energy", desc: "No spam, scams, or fake profiles. Genuine connections only — the House self-cleanses." },
    { icon: "👻", title: "Stay Anonymous Until Ready", desc: "Your Ghost ID protects you. Only reveal yourself when you're truly comfortable." },
    { icon: "💚", title: "Good Vibes Only", desc: "Bring curiosity, openness, and warmth. The energy you put in is the energy you get back." },
  ];

  const HOW_IT_WORKS = [
    { icon: "❤️", title: "Like for Free", desc: "Browse every profile and like as many as you want — completely free, no subscription needed." },
    { icon: "✨", title: "Ghost Match", desc: "When two ghosts like each other it becomes a mutual match. You'll get notified instantly." },
    { icon: "📱", title: "Connect on Match", desc: "After a mutual match, pay once to unlock their contact — WhatsApp, Telegram, WeChat, iMessage, any app they use. No in-app chat — real connection only." },
    { icon: "🚪", title: "Ghost Vault", desc: "Your private vault. All your matches live here with a 48-hour countdown. Don't let them fade." },
    { icon: "🌍", title: "Global House", desc: "Members from Indonesia, Philippines, Thailand, Singapore, Malaysia, Vietnam and beyond — your next match could be anywhere in SEA." },
    { icon: "👁️", title: "You're Invisible", desc: "Others only see your Ghost ID, photo, age, and city — nothing else — until you both connect." },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        overflowY: "auto",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        style={{
          width: "100%", maxWidth: 480,
          background: "linear-gradient(180deg, rgba(5,8,5,0.99) 0%, rgba(8,12,8,0.99) 100%)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(74,222,128,0.12)",
          borderBottom: "none",
          maxHeight: "94dvh", overflowY: "auto",
          scrollbarWidth: "none",
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e, #4ade80, #16a34a)" }} />

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>

        <div style={{ padding: "20px 22px max(36px, env(safe-area-inset-bottom, 36px))" }}>

          {/* Ghost hero */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <motion.div
              animate={{
                y: [0, -12, 0],
                filter: [
                  "drop-shadow(0 0 16px rgba(74,222,128,0.4))",
                  "drop-shadow(0 0 32px rgba(74,222,128,0.8))",
                  "drop-shadow(0 0 16px rgba(74,222,128,0.4))",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ lineHeight: 1, display: "inline-block", marginBottom: 16 }}
            >
              <img src={GHOST_LOGO} alt="ghost" style={{ width: 216, height: 216, objectFit: "contain" }} />
            </motion.div>
            <h1 style={{
              fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 10px",
              letterSpacing: "-0.02em", lineHeight: 1.2,
            }}>
              Welcome to{" "}
              <span style={{
                background: "linear-gradient(135deg, #4ade80, #22c55e)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Ghost Rooms
              </span>
            </h1>
            <p style={{
              fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.7,
              maxWidth: 320, marginInline: "auto",
            }}>
              Before you settle in, we have some{" "}
              <span style={{ color: "rgba(74,222,128,0.85)", fontWeight: 700 }}>house rules</span>{" "}
              that we must all abide by — to keep our house free from bad energies entering.
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.2), transparent)", marginBottom: 22 }} />

          {/* House Rules */}
          <div style={{ marginBottom: 26 }}>
            <p style={{
              fontSize: 10, fontWeight: 800, color: "rgba(74,222,128,0.6)",
              textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 14px",
            }}>🏠 The House Rules</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {RULES.map((rule) => (
                <div
                  key={rule.title}
                  style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.08)",
                    borderRadius: 14, padding: "12px 14px",
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>
                    {rule.icon === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle" }} /> : rule.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>
                      {rule.title}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", margin: 0, lineHeight: 1.5 }}>
                      {rule.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.2), transparent)", marginBottom: 22 }} />

          {/* How it works */}
          <div style={{ marginBottom: 28 }}>
            <p style={{
              fontSize: 10, fontWeight: 800, color: "rgba(74,222,128,0.6)",
              textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 14px",
            }}>⚙️ How the House Works</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {HOW_IT_WORKS.map((item) => (
                <div key={item.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ paddingTop: 2 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>
                      {item.title}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -2 }}
            onClick={onAccept}
            style={{
              width: "100%", height: 54, borderRadius: 50, border: "none",
              background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
              color: "#fff", fontSize: 15, fontWeight: 900,
              cursor: "pointer", letterSpacing: "0.03em",
              boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 32px rgba(34,197,94,0.5)",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{
              position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
              background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)",
              borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
            }} />
            <img src={GHOST_LOGO} alt="" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle", marginRight: 6 }} /> I Accept the House Rules — Enter Ghost Mode
          </motion.button>

          <p style={{
            textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)",
            margin: "12px 0 0", lineHeight: 1.6,
          }}>
            By entering you agree to the house rules above and our{" "}
            <span style={{ color: "rgba(255,255,255,0.35)" }}>Privacy Policy</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

const GOLD_KEY = "https://ik.imagekit.io/7grri5v7d/Haunted%20hotel%20key%20and%20tag.png";

// ── Ghost Rooms purchase modal ────────────────────────────────────────────────
export default function GhostHouseModal({
  currentTier, onClose, onPurchase,
}: {
  currentTier: "gold" | "suite" | null;
  onClose: () => void;
  onPurchase: (tier: "gold" | "suite") => void;
}) {
  const TIERS = [
    {
      key: "suite" as const,
      icon: "🏨",
      name: "Ghost Suite",
      price: "$4.99/mo",
      period: "per month",
      border: "rgba(74,222,128,0.35)",
      bg: "rgba(74,222,128,0.07)",
      glow: "rgba(74,222,128,0.4)",
      color: "#4ade80",
      gradient: "linear-gradient(135deg, #16a34a, #22c55e)",
      features: [
        "5 match unlocks/month included",
        "Ghost Vault: 10 photos · 3 videos",
        "Images max 10 MB · JPG PNG WEBP",
        "Videos max 100 MB · 2 min · MP4 MOV WEBM",
        "Ghost Flash: 4 sessions/month",
        "1 weekly profile boost (1hr top of stack)",
        "Suite badge on profile card",
        "Ghost Butler access — service numbers visible",
        "Priority in browse stack over free users",
      ],
    },
    {
      key: "gold" as const,
      icon: null,
      name: "Gold Room",
      price: "$9.99/mo",
      period: "per month",
      border: "rgba(212,175,55,0.45)",
      bg: "rgba(212,175,55,0.06)",
      glow: "rgba(212,175,55,0.5)",
      color: "#d4af37",
      gradient: "linear-gradient(135deg, #92400e, #d4af37)",
      features: [
        "Unlimited match unlocks",
        "Ghost Vault: 50 photos · 10 videos",
        "Images max 20 MB · JPG PNG WEBP",
        "Videos max 300 MB · 5 min · MP4 MOV WEBM",
        "Ghost Flash: unlimited sessions",
        "3 boosts per week",
        "Gold Room key badge — top of every stack",
        "Ghost Butler — all 7 service numbers visible",
        "Tonight Mode always on",
        "See who liked you",
        "Profile featured in Ghost Pulse row",
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          backgroundImage: "url('https://ik.imagekit.io/7grri5v7d/ghost%20rooms.png')",
          backgroundSize: "cover", backgroundPosition: "center top",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
          overflow: "hidden", position: "relative",
        }}
      >
        {/* Dark overlay over background image */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(3,6,3,0.82) 0%, rgba(5,8,5,0.92) 100%)", zIndex: 0, pointerEvents: "none" }} />
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #d4af37)", position: "relative", zIndex: 1 }} />
        <div style={{ padding: "22px 20px 36px", position: "relative", zIndex: 1 }}>
          <button onClick={onClose} style={{ position: "absolute", top: 18, right: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
            <X size={13} />
          </button>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ lineHeight: 1, marginBottom: 8 }}>
              <img src={GOLD_KEY} alt="Ghost Rooms" style={{ width: 48, height: 48, objectFit: "contain" }} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>
              <span>Ghost Rooms</span>
            </h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.55 }}>
              <span>A Room's badge that says everything without saying a word. Members notice. Women filter for it.</span>
            </p>
          </div>

          {/* Tier cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {TIERS.map((t) => {
              const owned = currentTier === t.key || (t.key === "suite" && currentTier === "gold");
              return (
                <motion.button
                  key={t.key}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !owned && onPurchase(t.key)}
                  style={{
                    width: "100%", borderRadius: 16, padding: "14px 16px",
                    background: t.bg,
                    border: `1px solid ${t.border}`,
                    cursor: owned ? "default" : "pointer",
                    display: "flex", alignItems: "center", gap: 14, textAlign: "left",
                    boxShadow: owned ? `0 0 20px ${t.glow}` : "none",
                  }}
                >
                  {/* Badge preview */}
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
                    background: t.key === "gold" ? "#0a0a0a" : "rgba(5,5,8,0.8)",
                    border: `2px solid ${t.color}`,
                    boxShadow: `0 0 14px ${t.glow}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>
                    {t.key === "gold"
                      ? <img src={GOLD_KEY} alt="Gold Room" style={{ width: 30, height: 30, objectFit: "contain" }} />
                      : t.icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>{t.name}</p>
                        {owned && (
                          <span style={{ fontSize: 9, fontWeight: 800, color: t.color, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 5, padding: "1px 6px", letterSpacing: "0.08em" }}>ACTIVE</span>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 15, fontWeight: 900, color: t.color, margin: 0 }}>{t.price}</p>
                        {!owned && (
                          <div style={{ marginTop: 4, height: 26, paddingInline: 10, borderRadius: 7, background: t.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>Join</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      {t.features.map((f) => (
                        <div key={f} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                          <span style={{ color: t.color, fontSize: 10, marginTop: 1, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.18)", margin: 0 }}>
            <span>🔒 Badge shows on your Ghost profile only · visible to Ghost members</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
