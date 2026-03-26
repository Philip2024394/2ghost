import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getProgress,
  getCurrentTier,
  getNextTier,
  UNLOCK_TIERS,
  type ProgressData,
  type FeatureItem,
} from "../utils/guestProgress";

const BUTLAS_IMG = "https://ik.imagekit.io/7grri5v7d/Skeletal%20butler%20at%20workdesk.png";

const TIER_COLORS = ["#888", "#d4af37", "#4caf50", "#4a90d9", "#9b59b6", "#e01010"];

// Flat list of every feature with its tier attached
type FlatFeature = FeatureItem & {
  tierId: number;
  tierTitle: string;
  requirementShort: string;
  unlocked: boolean;
};

function buildFeatureList(progress: ProgressData): FlatFeature[] {
  const all: FlatFeature[] = [];
  for (const tier of UNLOCK_TIERS) {
    const unlocked = tier.isUnlocked(progress);
    for (const f of tier.features) {
      all.push({
        ...f,
        tierId: tier.id,
        tierTitle: tier.hotelTitle,
        requirementShort: tier.requirementShort,
        unlocked,
      });
    }
  }
  return all;
}

export default function MrButlasHotelGuidePage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ProgressData>(getProgress());
  const [selected, setSelected] = useState<FlatFeature | null>(null);

  useEffect(() => { setProgress(getProgress()); }, []);

  const currentTier = getCurrentTier(progress);
  const nextTier    = getNextTier(progress);
  const nextPct     = nextTier ? nextTier.progressValue(progress) : 100;

  const allFeatures  = buildFeatureList(progress);
  const openFeatures = allFeatures.filter(f => f.unlocked);
  const lockedFeatures = allFeatures.filter(f => !f.unlocked);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#060406",
      overflowY: "scroll", WebkitOverflowScrolling: "touch",
      color: "#fff",
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto", paddingBottom: 48 }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 0" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "rgba(30,20,10,0.8)", border: "1px solid rgba(180,150,40,0.25)",
              color: "rgba(180,150,40,0.8)", fontSize: 13, padding: "6px 14px",
              borderRadius: 8, cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <div>
            <div style={{ color: "rgba(255,240,200,0.9)", fontSize: 15, fontFamily: "Georgia, serif" }}>
              Hotel Guide
            </div>
            <div style={{ color: "rgba(180,150,40,0.45)", fontSize: 10, fontFamily: "monospace", letterSpacing: 2 }}>
              YOUR ROOM ACCESS
            </div>
          </div>
        </div>

        {/* ── Status card ── */}
        <div style={{
          margin: "14px 16px 0",
          background: "rgba(12,8,4,0.98)",
          border: "1px solid rgba(180,150,40,0.18)",
          borderRadius: 16, overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            {/* Left: status text */}
            <div style={{ flex: 1, padding: "16px 0 16px 16px" }}>
              <div style={{ color: "rgba(180,150,40,0.5)", fontSize: 9, fontFamily: "monospace", letterSpacing: 3, marginBottom: 6 }}>
                YOUR STANDING
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: `${TIER_COLORS[currentTier.id]}15`,
                border: `1px solid ${TIER_COLORS[currentTier.id]}40`,
                borderRadius: 8, padding: "5px 12px", marginBottom: 10,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: TIER_COLORS[currentTier.id], flexShrink: 0 }} />
                <span style={{ color: TIER_COLORS[currentTier.id], fontSize: 12, fontFamily: "Georgia, serif" }}>
                  {currentTier.hotelTitle}
                </span>
              </div>

              {nextTier ? (
                <>
                  <div style={{ color: "rgba(255,240,200,0.5)", fontSize: 11, fontFamily: "Georgia, serif", marginBottom: 8 }}>
                    To unlock <strong style={{ color: "rgba(255,240,200,0.8)" }}>{nextTier.hotelTitle}</strong>:
                    <br />{nextTier.requirementText}
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${nextPct}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                      style={{
                        height: "100%", borderRadius: 2,
                        background: `linear-gradient(90deg, ${TIER_COLORS[nextTier.id]}80, ${TIER_COLORS[nextTier.id]})`,
                      }}
                    />
                  </div>
                </>
              ) : (
                <div style={{ color: "rgba(180,150,40,0.7)", fontSize: 12, fontFamily: "Georgia, serif" }}>
                  All rooms unlocked ✦
                </div>
              )}
            </div>

            {/* Right: butler */}
            <img
              src={BUTLAS_IMG}
              alt="Mr. Butlas"
              style={{
                width: 80, height: 96, objectFit: "contain",
                objectPosition: "bottom", flexShrink: 0,
                filter: "drop-shadow(0 0 10px rgba(180,150,40,0.15))",
              }}
            />
          </div>
        </div>

        {/* ── Open now ── */}
        {openFeatures.length > 0 && (
          <div style={{ margin: "24px 16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(80,220,80,0.9)" }} />
              <span style={{ color: "rgba(255,240,200,0.6)", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}>
                OPEN TO YOU
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {openFeatures.map(f => (
                <motion.div
                  key={f.name}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => f.route ? navigate(f.route) : null}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "rgba(16,12,6,0.95)",
                    border: `1px solid ${TIER_COLORS[f.tierId]}30`,
                    borderRadius: 14, padding: "12px 14px",
                    cursor: f.route ? "pointer" : "default",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  {/* Left colour strip */}
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                    background: TIER_COLORS[f.tierId], borderRadius: "14px 0 0 14px",
                    opacity: 0.6,
                  }} />

                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${TIER_COLORS[f.tierId]}15`,
                    border: `1px solid ${TIER_COLORS[f.tierId]}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22,
                  }}>
                    {f.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "rgba(255,240,200,0.9)", fontSize: 13, fontFamily: "Georgia, serif" }}>
                      {f.name}
                    </div>
                    <div style={{ color: "rgba(255,240,200,0.4)", fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>
                      {f.description}
                    </div>
                  </div>

                  {/* Arrow */}
                  {f.route && (
                    <div style={{ color: "rgba(180,150,40,0.5)", fontSize: 16, flexShrink: 0 }}>›</div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Locked ── */}
        {lockedFeatures.length > 0 && (
          <div style={{ margin: "24px 16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(200,60,60,0.8)" }} />
              <span style={{ color: "rgba(255,240,200,0.4)", fontSize: 11, fontFamily: "monospace", letterSpacing: 2 }}>
                LOCKED ROOMS
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lockedFeatures.map(f => (
                <motion.div
                  key={f.name}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(f)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    background: "rgba(10,6,6,0.95)",
                    border: "1px solid rgba(80,40,40,0.3)",
                    borderRadius: 14, padding: "12px 14px",
                    cursor: "pointer",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  {/* Left strip (dim) */}
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                    background: "rgba(200,60,60,0.3)", borderRadius: "14px 0 0 14px",
                  }} />

                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: "rgba(30,20,20,0.8)",
                    border: "1px solid rgba(80,40,40,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, filter: "grayscale(1) opacity(0.3)",
                  }}>
                    {f.icon}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontFamily: "Georgia, serif" }}>
                      {f.name}
                    </div>
                    <div style={{
                      color: "rgba(200,80,80,0.6)", fontSize: 10,
                      fontFamily: "monospace", marginTop: 3,
                    }}>
                      🔒 {f.requirementShort}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 16, flexShrink: 0 }}>›</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Locked detail popup ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)" }}
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "rgba(8,4,4,0.99)",
                borderTop: "1px solid rgba(200,60,60,0.25)",
                borderRadius: "20px 20px 0 0",
                padding: "20px 20px 36px",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ width: 36, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, margin: "0 auto 18px" }} />

              {/* Icon + name */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, fontSize: 26,
                  background: "rgba(200,50,50,0.1)", border: "1px solid rgba(200,50,50,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  filter: "grayscale(0.5)",
                }}>
                  {selected.icon}
                </div>
                <div>
                  <div style={{ color: "rgba(255,240,200,0.85)", fontSize: 16, fontFamily: "Georgia, serif" }}>
                    {selected.name}
                  </div>
                  <div style={{ color: "rgba(200,80,80,0.7)", fontSize: 11, marginTop: 2 }}>
                    🔒 Locked
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ color: "rgba(255,240,200,0.6)", fontSize: 13, lineHeight: 1.65, fontFamily: "Georgia, serif", margin: "0 0 16px" }}>
                {selected.description}
              </p>

              {/* Requirement box */}
              <div style={{
                background: "rgba(200,50,50,0.08)", border: "1px solid rgba(200,50,50,0.22)",
                borderRadius: 10, padding: "12px 14px", marginBottom: 18,
              }}>
                <div style={{ color: "rgba(255,240,200,0.4)", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, marginBottom: 4 }}>
                  TO UNLOCK THIS ROOM
                </div>
                <div style={{ color: "rgba(255,240,200,0.85)", fontSize: 13, fontFamily: "Georgia, serif" }}>
                  {UNLOCK_TIERS.find(t => t.id === selected.tierId)?.requirementText}
                </div>
              </div>

              <button
                onClick={() => setSelected(null)}
                style={{
                  width: "100%", padding: "13px 0",
                  background: "rgba(30,20,10,0.9)", border: "1px solid rgba(180,150,40,0.25)",
                  color: "rgba(180,150,40,0.8)", fontSize: 13, fontFamily: "Georgia, serif",
                  borderRadius: 12, cursor: "pointer",
                }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
