import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { saveGhostRating, hasRatedProfile } from "../utils/featureGating";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId } from "../utils/ghostHelpers";

const TAGS = ["Genuine", "Respectful", "Interesting", "Funny", "Deep"];

type Props = {
  profile: GhostProfile;
  onClose: () => void;
};

export default function GhostScoreSheet({ profile, onClose }: Props) {
  const a = useGenderAccent();
  const [stars,    setStars]    = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [done,     setDone]     = useState(hasRatedProfile(profile.id));

  const canSubmit = stars > 0;

  function toggleTag(t: string) {
    setSelected(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t]);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    saveGhostRating(profile.id, stars, selected);
    setDone(true);
    setTimeout(onClose, 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.86)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,10,0.99)", borderRadius: "24px 24px 0 0", border: `1px solid ${a.glow(0.2)}`, borderBottom: "none", overflow: "hidden" }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)` }} />
        <div style={{ padding: "20px 22px max(32px,env(safe-area-inset-bottom,32px))" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", margin: "0 auto 18px" }} />

          {done ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: "center", padding: "12px 0 8px" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>⭐</div>
              <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>Score Submitted</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>Your rating helps quality ghosts rise to the top</p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <img src={profile.image} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.35)}` }}
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: a.accent, letterSpacing: "0.12em", textTransform: "uppercase" }}>Rate the experience</p>
                  <p style={{ margin: "3px 0 0", fontSize: 15, fontWeight: 900, color: "#fff" }}>{toGhostId(profile.id)}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>How was this conversation?</p>
                </div>
              </div>

              {/* Stars */}
              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 12px" }}>Your rating</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 22 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <motion.button key={n} whileTap={{ scale: 0.85 }} onClick={() => setStars(n)}
                    style={{ width: 52, height: 52, borderRadius: 14, border: "none", cursor: "pointer", fontSize: 26, background: n <= stars ? a.glow(0.15) : "rgba(255,255,255,0.04)", outline: n <= stars ? `1.5px solid ${a.glow(0.4)}` : "1px solid rgba(255,255,255,0.08)", transition: "all 0.15s" }}
                  >
                    <span style={{ filter: n <= stars ? "none" : "grayscale(1)", opacity: n <= stars ? 1 : 0.3 }}>★</span>
                  </motion.button>
                ))}
              </div>

              {/* Tags */}
              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px" }}>How was their energy? (optional)</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
                {TAGS.map(tag => {
                  const active = selected.includes(tag);
                  return (
                    <motion.button key={tag} whileTap={{ scale: 0.95 }} onClick={() => toggleTag(tag)}
                      style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${active ? a.glow(0.5) : "rgba(255,255,255,0.1)"}`, background: active ? a.glow(0.12) : "rgba(255,255,255,0.04)", color: active ? "#fff" : "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: active ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}
                    >
                      {tag}
                    </motion.button>
                  );
                })}
              </div>

              {/* Notice */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "9px 12px", marginBottom: 18, display: "flex", gap: 9, alignItems: "flex-start" }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>👻</span>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.55 }}>
                  Scores are anonymous. High-rated ghosts rise in browse order — your rating shapes the whole House.
                </p>
              </div>

              {/* Submit */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={!canSubmit}
                style={{ width: "100%", height: 52, borderRadius: 16, border: "none", background: canSubmit ? a.gradient : "rgba(255,255,255,0.06)", color: canSubmit ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 15, fontWeight: 900, cursor: canSubmit ? "pointer" : "default", boxShadow: canSubmit ? `0 8px 24px ${a.glow(0.3)}` : "none", transition: "all 0.2s" }}
              >
                Submit Score
              </motion.button>

              <button onClick={onClose} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 11, cursor: "pointer" }}>
                Skip for now
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Export small score badge for GhostCard use
export function ScoreBadge({ score }: { score: number }) {
  const a = useGenderAccent();
  return (
    <span style={{ fontSize: 9, fontWeight: 800, color: a.accent, background: a.glow(0.1), border: `1px solid ${a.glow(0.25)}`, borderRadius: 6, padding: "2px 5px" }}>
      ★ {score.toFixed(1)}
    </span>
  );
}
