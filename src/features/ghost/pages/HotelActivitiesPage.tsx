// ── Hotel Activities Page ──────────────────────────────────────────────────────
// Shows the guest's unlock journey through the hotel — what they have access to,
// what's coming next, and what they need to do to progress.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getProgress,
  getCurrentTier,
  getNextTier,
  UNLOCK_TIERS,
  trackAction,

} from "../utils/guestProgress";

const BUTLER_IMG  = "https://ik.imagekit.io/7grri5v7d/Skeletal%20butler%20at%20workdesk.png";
const BUTLER_FACE = "https://ik.imagekit.io/7grri5v7d/ewrwerwerwer-removebg-preview.png?updatedAt=1774288645920";

// ── Tier colours ──────────────────────────────────────────────────────────────
const TIER_COLORS = [
  { accent: "#6b7280", glow: "rgba(107,114,128,0.3)" },  // 0 grey
  { accent: "#d4af37", glow: "rgba(212,175,55,0.3)"  },  // 1 gold
  { accent: "#22c55e", glow: "rgba(34,197,94,0.3)"   },  // 2 green
  { accent: "#3b82f6", glow: "rgba(59,130,246,0.3)"  },  // 3 blue
  { accent: "#a855f7", glow: "rgba(168,85,247,0.3)"  },  // 4 purple
  { accent: "#e01010", glow: "rgba(220,16,16,0.3)"   },  // 5 red/black
];

export default function HotelActivitiesPage() {
  const navigate   = useNavigate();
  const [progress, setProgress] = useState(getProgress);
  const [showIntro, setShowIntro] = useState(false);
  const [expandedTier, setExpandedTier] = useState<number | null>(null);

  const currentTier = getCurrentTier(progress);
  const nextTier    = getNextTier(progress);

  useEffect(() => {
    // Show Mr. Butlas intro on very first visit
    if (!progress.introShown) {
      setTimeout(() => setShowIntro(true), 600);
      trackAction("intro_shown");
      setProgress(getProgress());
    }
  }, []);

  function dismissIntro() { setShowIntro(false); }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "#080608",
      overflowY: "scroll",
      WebkitOverflowScrolling: "touch" as never,
    }}>
      {/* Red top bar */}
      <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #e01010, transparent)", flexShrink: 0 }} />

      {/* DEV — re-trigger intro sheet */}
      <button
        onClick={() => { trackAction("intro_shown"); setProgress(p => ({ ...p, introShown: false })); setShowIntro(true); }}
        style={{ position: "fixed", bottom: 12, right: 12, zIndex: 9999, background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: "5px 10px", color: "rgba(255,255,255,0.5)", fontSize: 10, cursor: "pointer" }}
      >
        🎩 Dev · Intro
      </button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 18px 0" }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "rgba(220,20,20,0.7)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Heartsway Hotel
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 22, fontWeight: 900, color: "#fff" }}>
            Hotel Activities
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={BUTLER_FACE} alt="Mr. Butlas" style={{ width: 46, height: 46, objectFit: "contain", opacity: 0.9 }} />
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 700 }}>
            ✕
          </motion.button>
        </div>
      </div>

      <div style={{ padding: "18px 18px 80px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Current status card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            background: `linear-gradient(135deg, ${TIER_COLORS[currentTier.id].glow}, rgba(0,0,0,0.5))`,
            border: `1px solid ${TIER_COLORS[currentTier.id].accent}40`,
            borderRadius: 18, padding: "18px 16px",
            display: "flex", alignItems: "center", gap: 14,
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Your Status</p>
            <p style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: TIER_COLORS[currentTier.id].accent }}>
              {currentTier.hotelTitle}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              {currentTier.subtitle}
            </p>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 36, lineHeight: 1 }}>🎖️</div>
            <p style={{ margin: "4px 0 0", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>
              TIER {currentTier.id + 1} / {UNLOCK_TIERS.length}
            </p>
          </div>
        </motion.div>

        {/* ── Next unlock teaser ── */}
        {nextTier && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            style={{ background: "rgba(220,20,20,0.08)", border: "1px solid rgba(220,20,20,0.3)", borderRadius: 16, padding: "14px 16px" }}
          >
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 800, color: "rgba(220,20,20,0.7)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              🔓 Next Unlock — {nextTier.hotelTitle}
            </p>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>
              {nextTier.requirementText}
            </p>
            {/* Progress bar */}
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 6, height: 6, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${nextTier.progressValue(progress)}%` }}
                transition={{ duration: 0.8, delay: 0.4 }}
                style={{ height: "100%", background: "linear-gradient(90deg, #b80000, #e01010)", borderRadius: 6 }}
              />
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "right" }}>
              {nextTier.progressValue(progress)}% complete
            </p>
          </motion.div>
        )}

        {!nextTier && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
            style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16, padding: "14px 16px", textAlign: "center" }}
          >
            <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 900, color: "#d4af37" }}>✦ Hotel Member</p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
              You have unlocked every feature in Heartsway Hotel. The full experience is yours.
            </p>
          </motion.div>
        )}

        {/* ── All tiers ── */}
        <p style={{ margin: "4px 0 0", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.22)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Your Hotel Journey
        </p>

        {UNLOCK_TIERS.map((tier, i) => {
          const unlocked  = tier.isUnlocked(progress);
          const isCurrent = tier.id === currentTier.id;
          const color     = TIER_COLORS[tier.id];
          const isOpen    = expandedTier === tier.id;

          return (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
            >
              {/* Tier header */}
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={() => setExpandedTier(isOpen ? null : tier.id)}
                style={{
                  width: "100%", textAlign: "left", cursor: "pointer",
                  background: unlocked
                    ? `linear-gradient(135deg, ${color.glow}, rgba(0,0,0,0.6))`
                    : "rgba(255,255,255,0.025)",
                  border: `1px solid ${unlocked ? color.accent + "50" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: isOpen ? "16px 16px 0 0" : 16,
                  padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "border-radius 0.2s",
                }}
              >
                {/* Status dot */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: unlocked ? color.accent : "rgba(255,255,255,0.06)",
                  border: `2px solid ${unlocked ? color.accent : "rgba(255,255,255,0.1)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: unlocked ? `0 0 12px ${color.glow}` : "none",
                }}>
                  <span style={{ fontSize: 14 }}>{unlocked ? "✓" : "🔒"}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: unlocked ? "#fff" : "rgba(255,255,255,0.35)" }}>
                      {tier.hotelTitle}
                    </p>
                    {isCurrent && (
                      <span style={{ fontSize: 9, fontWeight: 800, background: color.accent, color: "#000", borderRadius: 20, padding: "2px 7px", letterSpacing: "0.06em" }}>
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: unlocked ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.22)" }}>
                    {unlocked ? tier.subtitle : tier.requirementShort}
                  </p>
                </div>

                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </motion.button>

              {/* Features list */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      background: "rgba(0,0,0,0.4)",
                      border: `1px solid ${unlocked ? color.accent + "30" : "rgba(255,255,255,0.05)"}`,
                      borderTop: "none",
                      borderRadius: "0 0 16px 16px",
                      padding: "4px 0 8px",
                    }}>
                      {tier.features.map((f, fi) => (
                        <motion.div
                          key={f.name}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: fi * 0.06 }}
                          onClick={() => unlocked && f.route && navigate(f.route)}
                          style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "10px 16px",
                            cursor: unlocked && f.route ? "pointer" : "default",
                            opacity: unlocked ? 1 : 0.4,
                          }}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: unlocked ? `${color.glow}` : "rgba(255,255,255,0.04)",
                            border: `1px solid ${unlocked ? color.accent + "40" : "rgba(255,255,255,0.06)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                          }}>
                            {f.icon}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: unlocked ? "#fff" : "rgba(255,255,255,0.3)" }}>
                              {f.name}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
                              {f.description}
                            </p>
                          </div>
                          {unlocked && f.route && (
                            <span style={{ fontSize: 12, color: color.accent, flexShrink: 0 }}>→</span>
                          )}
                          {!unlocked && (
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", flexShrink: 0 }}>🔒</span>
                          )}
                        </motion.div>
                      ))}

                      {!unlocked && (
                        <div style={{ margin: "4px 16px 4px", padding: "10px 14px", background: "rgba(220,20,20,0.07)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 10 }}>
                          <p style={{ margin: 0, fontSize: 11, color: "rgba(220,20,20,0.7)", fontWeight: 700, lineHeight: 1.5 }}>
                            🔓 To unlock: {tier.requirementText}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* ── Mr. Butlas footer note ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ display: "flex", alignItems: "flex-end", gap: 14, background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 16, padding: "14px 16px", marginTop: 8 }}
        >
          <img src={BUTLER_IMG} alt="Mr. Butlas" style={{ width: 60, objectFit: "contain", opacity: 0.85, flexShrink: 0 }} />
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
              Every feature in this Hotel has been curated for guests who take their stay seriously.
              Progress naturally — the doors open as you engage with fellow guests.
            </p>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.7)", letterSpacing: "0.12em", textAlign: "right" }}>
              — MR. BUTLAS
            </p>
          </div>
        </motion.div>

      </div>

      {/* ── Mr. Butlas Day 1 Intro popup ── */}
      <AnimatePresence>
        {showIntro && (
          <>
            <motion.div
              key="intro-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={dismissIntro}
              style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.78)" }}
            />
            <motion.div
              key="intro-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 601,
                background: "#0c0a06",
                borderRadius: "22px 22px 0 0",
                border: "1px solid rgba(212,175,55,0.25)",
                borderBottom: "none",
                maxHeight: "82vh", overflowY: "auto",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #d4af37, transparent)", borderRadius: "22px 22px 0 0" }} />

              <div style={{ padding: "22px 20px 48px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 22 }}>
                  <img src={BUTLER_FACE} alt="Mr. Butlas" style={{ width: 72, objectFit: "contain", flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 800, color: "rgba(212,175,55,0.6)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Mr. Butlas</p>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>
                      Welcome to Heartsway Hotel
                    </p>
                  </div>
                </div>

                <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)", marginBottom: 18 }} />

                <p style={{ margin: "0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>
                  Allow me to acquaint you with what this Hotel has to offer. You will not find everything open to you on your first day — that is by design.
                </p>
                <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>
                  As you engage with fellow guests — liking profiles, sending invitations, visiting the lounge — new facilities will open to you. The Breakfast Lounge, the Games Room, private floor rooms, and ultimately the Penthouse itself.
                </p>

                {/* Quick preview of tiers */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
                  {UNLOCK_TIERS.map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: TIER_COLORS[t.id].accent, flexShrink: 0 }} />
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                        <span style={{ color: TIER_COLORS[t.id].accent, fontWeight: 800 }}>{t.hotelTitle}</span>
                        {" — "}{t.requirementShort}
                      </p>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={dismissIntro}
                  style={{
                    width: "100%", height: 52, borderRadius: 16, border: "none",
                    background: "linear-gradient(135deg, #b8922a, #d4af37)",
                    color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer",
                  }}
                >
                  I Understand — Begin My Stay
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
