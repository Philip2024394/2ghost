import { useState } from "react";
import { motion } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { DATE_IDEAS, getDateIdea } from "../data/dateIdeas";
import { markConciergeShown } from "../utils/featureGating";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId } from "../utils/ghostHelpers";

type Props = {
  profile: GhostProfile;
  matchId: string;
  daysConnected: number;
  onClose: () => void;
};

const VENUE_INTROS = [
  "Based on your cities, the Butler suggests:",
  "The House recommends for your first meeting:",
  "Curated for this connection:",
  "Your first date, handled:",
];

export default function GhostConciergeSheet({ profile, matchId, daysConnected, onClose }: Props) {
  const a = useGenderAccent();
  const [selected, setSelected] = useState<string | null>(null);
  const [phase,    setPhase]    = useState<"browse" | "planned">("browse");

  const seedIdea = getDateIdea(profile.id);
  const ideas    = [seedIdea, ...DATE_IDEAS.filter(d => d.key !== seedIdea.key).slice(0, 5)];
  const intro    = VENUE_INTROS[Math.abs(profile.id.charCodeAt(0)) % VENUE_INTROS.length];

  function handlePlan() {
    if (!selected) return;
    markConciergeShown(matchId);
    setPhase("planned");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,10,0.99)", borderRadius: "24px 24px 0 0", border: "1px solid rgba(212,175,55,0.22)", borderBottom: "none", maxHeight: "93dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #92400e, #d4af37, #fbbf24, #d4af37, #92400e, transparent)" }} />

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px max(32px,env(safe-area-inset-bottom,32px))", scrollbarWidth: "none" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", margin: "0 auto 18px" }} />

          {phase === "planned" ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: "center", padding: "12px 0 8px" }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🗓️</div>
              <p style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 900, color: "#fff" }}>Date planned</p>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                The Butler has noted your preference. Send {toGhostId(profile.id)} a message to confirm.
              </p>
              <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 12, padding: "12px 16px", margin: "18px 0 24px", textAlign: "left" }}>
                <p style={{ margin: "0 0 2px", fontSize: 9, color: "#d4af37", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>Your pick</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>
                  {ideas.find(i => i.key === selected)?.emoji} {ideas.find(i => i.key === selected)?.label}
                </p>
              </div>
              <button onClick={onClose} style={{ height: 48, padding: "0 32px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #92400e, #d4af37)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                Back to Vault
              </button>
            </motion.div>
          ) : (
            <>
              {/* Butler header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <motion.span animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ fontSize: 36 }}>🎩</motion.span>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#d4af37", letterSpacing: "0.12em", textTransform: "uppercase" }}>Ghost Butler · Date Concierge</p>
                  <p style={{ margin: "3px 0 0", fontSize: 15, fontWeight: 900, color: "#fff" }}>Plan your first meeting</p>
                </div>
              </div>

              {/* Days badge */}
              <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 10, padding: "8px 12px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
                <img src={profile.image} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(212,175,55,0.4)" }}
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#fff" }}>{toGhostId(profile.id)}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#d4af37" }}>Connected {daysConnected} days · {profile.city}</p>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Butler says</p>
                  <p style={{ margin: 0, fontSize: 10, color: "#fff", fontWeight: 700 }}>Time to meet 💬</p>
                </div>
              </div>

              {/* Venue label */}
              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 12px" }}>{intro}</p>

              {/* Ideas grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {ideas.map(idea => {
                  const isSelected = selected === idea.key;
                  return (
                    <motion.button
                      key={idea.key}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelected(idea.key)}
                      style={{
                        width: "100%", textAlign: "left",
                        background: isSelected ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${isSelected ? "rgba(212,175,55,0.45)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 12, padding: "11px 14px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s",
                      }}
                    >
                      {idea.image ? (
                        <img src={idea.image} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <span style={{ fontSize: 28, flexShrink: 0 }}>{idea.emoji}</span>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: isSelected ? 900 : 600, color: isSelected ? "#fff" : "rgba(255,255,255,0.7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{idea.label}</p>
                        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{idea.desc}</p>
                      </div>
                      {isSelected && <span style={{ fontSize: 16, flexShrink: 0 }}>✓</span>}
                    </motion.button>
                  );
                })}
              </div>

              {/* Plan button */}
              <motion.button
                whileTap={{ scale: 0.97 }} onClick={handlePlan} disabled={!selected}
                style={{
                  width: "100%", height: 52, borderRadius: 16, border: "none",
                  background: selected ? "linear-gradient(135deg, #92400e, #d4af37)" : "rgba(255,255,255,0.06)",
                  color: selected ? "#fff" : "rgba(255,255,255,0.2)",
                  fontSize: 15, fontWeight: 900, cursor: selected ? "pointer" : "default",
                  boxShadow: selected ? "0 8px 24px rgba(212,175,55,0.3)" : "none", transition: "all 0.2s",
                }}
              >
                🗓️ Plan This Date
              </motion.button>

              <button onClick={onClose} style={{ display: "block", margin: "12px auto 0", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 11, cursor: "pointer" }}>
                Maybe another time
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
