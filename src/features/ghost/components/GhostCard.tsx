import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Eye } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import type { GhostProfile } from "../types/ghostTypes";
import {
  toGhostId,
  fmtKm,
  profileActivity,
  profileLikesCount,
  mockBio,
} from "../utils/ghostHelpers";
import { getDateIdea } from "../data/dateIdeas";
import { getBadge } from "../data/profileBadges";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

const SPAM_IMG = "https://ik.imagekit.io/7grri5v7d/spam%20in.png";
const FOUND_BOO_STAMP = "https://ik.imagekit.io/7grri5v7d/Found%20Boo%20postage%20stamp%20design.png";

// ── Profile mini card ───────────────────────────────────────────────────────
export default function GhostCard({
  profile, liked, onClick, isRevealed, onReveal, canReveal, isTonight, houseTier,
  flaggedReason, onFlagOpen, isFoundBoo,
}: {
  profile: GhostProfile; liked: boolean; onClick: () => void;
  isRevealed: boolean; onReveal: () => void; canReveal: boolean;
  isTonight?: boolean; houseTier?: "gold" | "suite" | null;
  flaggedReason?: string; onFlagOpen?: () => void;
  isFoundBoo?: boolean;
}) {
  const { t } = useLanguage();
  const online = isOnline(profile.last_seen_at);
  const ghostId = toGhostId(profile.id);
  const [flipped, setFlipped] = useState(false);

  // When revealed externally, flip the card
  const handleRevealClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canReveal && !isRevealed) return;
    onReveal();
    setFlipped(true);
  };

  const activity = profileActivity(profile.id);
  const likesCount = profileLikesCount(profile.id);

  // Read outcome from mock ghost_profile (for demo, vary by id hash)
  const OUTCOME_TAGS = ["Serious", "Casual", "Discreet", "Open", "Friendship", "Adventurous", "Exploring", "Free Spirit"];
  const OUTCOME_ICONS = ["💍", "🤝", "🤫", "🔓", "🌱", "🔥", "🌀", "🕊️"];
  let oh = 0;
  for (let i = 0; i < profile.id.length; i++) { oh = Math.imul(43, oh) + profile.id.charCodeAt(i) | 0; }
  const outcomeIdx = Math.abs(oh) % OUTCOME_TAGS.length;
  const outcomeTag = OUTCOME_TAGS[outcomeIdx];
  const outcomeIcon = OUTCOME_ICONS[outcomeIdx];

  return (
    <div style={{ borderRadius: 16, position: "relative", perspective: 800, aspectRatio: "3/4" }}>
      {/* Tonight pulsing ring behind card */}
      {isTonight && !flipped && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: "absolute", inset: -3, borderRadius: 18,
            border: "2px solid rgba(74,222,128,0.6)",
            boxShadow: "0 0 12px rgba(74,222,128,0.4)",
            pointerEvents: "none", zIndex: 10,
          }}
        />
      )}

      {/* ── Front face ── */}
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          borderRadius: 16, overflow: "hidden", cursor: "pointer",
          border: isTonight ? "1.5px solid rgba(74,222,128,0.5)" : liked ? "1.5px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.07)",
          boxShadow: isTonight ? "0 0 16px rgba(74,222,128,0.25)" : liked ? "0 0 14px rgba(74,222,128,0.2)" : undefined,
          background: "rgba(255,255,255,0.03)",
        }}
        onClick={flipped ? undefined : onClick}
        whileTap={flipped ? undefined : { scale: 0.97 }}
      >
        <img
          src={profile.image} alt={ghostId}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 55%)" }} />

        {/* Ghost badge */}
        <div style={{ position: "absolute", top: 7, left: 7, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "3px 7px", fontSize: 8, fontWeight: 700, color: "rgba(74,222,128,0.85)" }}>
          {isTonight ? `🌙 ${t("card.tonight")}` : <img src={GHOST_LOGO} alt="ghost" style={{ width: 42, height: 42, objectFit: "contain" }} />}
        </div>

        {/* Online dot */}
        {online && (
          <span style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.8)", display: "block" }} />
        )}

        {/* Liked heart */}
        {liked && (
          <div style={{ position: "absolute", bottom: 38, right: 8, background: "rgba(34,197,94,0.2)", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Heart size={13} style={{ color: "#4ade80" }} fill="currentColor" />
          </div>
        )}

        {/* Ghost Rooms badge — Gold Room or Ghost Suite */}
        {houseTier && (
          <div style={{
            position: "absolute", top: 7, left: isTonight ? 70 : 30,
            width: 22, height: 22, borderRadius: "50%",
            background: houseTier === "gold" ? "#080808" : "rgba(5,5,8,0.85)",
            border: houseTier === "gold" ? "1.5px solid #d4af37" : "1.5px solid rgba(74,222,128,0.7)",
            boxShadow: houseTier === "gold" ? "0 0 8px rgba(212,175,55,0.6)" : "0 0 6px rgba(74,222,128,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, backdropFilter: "blur(4px)",
          }}>
            {houseTier === "gold"
              ? <img src="https://ik.imagekit.io/7grri5v7d/Haunted%20hotel%20key%20and%20tag.png" alt="Gold Room" style={{ width: 14, height: 14, objectFit: "contain" }} />
              : "🏨"}
          </div>
        )}

        {/* Face verified badge */}
        {profile.faceVerified && (
          <div style={{
            position: "absolute", top: 7, right: 7,
            background: "rgba(74,222,128,0.15)", backdropFilter: "blur(6px)",
            border: "1px solid rgba(74,222,128,0.4)",
            borderRadius: 50, padding: "3px 8px",
            display: "inline-flex", alignItems: "center", gap: 3,
          }}>
            <span style={{ fontSize: 9 }}>✅</span>
            <span style={{ fontSize: 8, fontWeight: 800, color: "#4ade80", letterSpacing: "0.03em" }}>Verified</span>
          </div>
        )}

        {/* Badge */}
        {(() => {
          const badge = getBadge(profile.badge);
          if (!badge) return null;
          return (
            <div style={{
              position: "absolute", bottom: 52, left: 8,
              background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
              borderRadius: 50, padding: "3px 9px",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}>
              <span style={{ fontSize: 10 }}>{badge.emoji}</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#fbbf24", letterSpacing: "0.03em" }}>{badge.label}</span>
            </div>
          );
        })()}

        {/* Ghost ID / age */}
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(74,222,128,0.9)", margin: 0, lineHeight: 1, letterSpacing: "0.04em" }}>
              <span>{ghostId}</span>
            </p>
            {profile.isVerified && (
              <span title={t("card.verified")} style={{
                fontSize: 9, fontWeight: 800, background: "rgba(74,222,128,0.2)",
                border: "1px solid rgba(74,222,128,0.4)", borderRadius: 4,
                padding: "1px 4px", color: "rgba(74,222,128,0.95)", lineHeight: 1,
              }}>✅ ID</span>
            )}
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: "0 0 2px", lineHeight: 1 }}>
            <span>{profile.age} · {profile.gender === "Female" ? t("card.woman") : t("card.man")}</span>
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 10 }}>{profile.countryFlag}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{profile.city}</span>
            </div>
            {profile.distanceKm !== undefined ? (
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(74,222,128,0.8)" }}>{fmtKm(profile.distanceKm)}</span>
            ) : (
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{profile.country}</span>
            )}
          </div>
        </div>

        {/* Reveal button */}
        {!flipped && (
          <button
            onClick={handleRevealClick}
            title={canReveal || isRevealed ? "Reveal" : "Subscribers only"}
            style={{
              position: "absolute", top: 7, right: online ? 22 : 7,
              width: 24, height: 24, borderRadius: 8,
              background: isRevealed ? "rgba(74,222,128,0.25)" : canReveal ? "rgba(74,222,128,0.15)" : "rgba(0,0,0,0.4)",
              border: isRevealed ? "1px solid rgba(74,222,128,0.6)" : "1px solid rgba(74,222,128,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: canReveal || isRevealed ? "pointer" : "not-allowed",
              backdropFilter: "blur(6px)",
            }}
          >
            <Eye size={11} color={canReveal || isRevealed ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.3)"} />
          </button>
        )}

        {/* Spam — full cover overlay with ghost ID + details on front */}
        {flaggedReason === "spam" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 5, borderRadius: 16, overflow: "hidden" }}>
            {/* Spam image fills the card */}
            <img src={SPAM_IMG} alt="Spam" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            {/* Dark gradient so text is readable */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 55%)" }} />
            {/* Ghost ID + details on top */}
            <div style={{ position: "absolute", bottom: 10, left: 10, right: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(239,68,68,0.95)", margin: "0 0 2px", letterSpacing: "0.04em" }}>{ghostId}</p>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: "0 0 2px" }}>{profile.age} · {profile.city} {profile.countryFlag}</p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 50, padding: "2px 8px" }}>
                <span style={{ fontSize: 9 }}>🚫</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(239,68,68,0.9)" }}>REPORTED · UNDER REVIEW</span>
              </div>
            </div>
          </div>
        )}

        {/* Other flags — light dimmed overlay */}
        {flaggedReason && flaggedReason !== "spam" && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 5, borderRadius: 16,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 10, padding: "6px 12px", textAlign: "center" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(239,68,68,0.85)" }}>🚩 Reported</span>
            </div>
          </div>
        )}

        {/* Found Boo stamp overlay */}
        {isFoundBoo && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <img
              src={FOUND_BOO_STAMP}
              alt="Found Boo"
              style={{ width: "72%", maxWidth: 130, objectFit: "contain", opacity: 0.92 }}
            />
          </div>
        )}
      </motion.div>

      {/* ── Back face (reveal) ── */}
      <motion.div
        animate={{ rotateY: flipped ? 0 : -180 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          borderRadius: 16, overflow: "hidden",
          background: "rgba(10,8,20,0.97)",
          border: "1px solid rgba(74,222,128,0.2)",
          boxShadow: "0 0 24px rgba(74,222,128,0.1)",
          cursor: "pointer",
        }}
        onClick={() => setFlipped(false)}
      >
        {/* Blurred photo bg */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 16 }}>
          <img src={profile.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(14px) brightness(0.22)", transform: "scale(1.1)" }} />
        </div>

        {/* Content */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, display: "flex", flexDirection: "column", padding: "14px 12px 12px", gap: 9 }}>

          {/* Top accent + Ghost ID row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 20, height: 3, borderRadius: 2, background: "linear-gradient(90deg, #16a34a, #4ade80)" }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(74,222,128,0.6)", letterSpacing: "0.08em" }}>{ghostId}</span>
            </div>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Tap to flip ↩</span>
          </div>

          {/* Outcome pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: 50, padding: "4px 10px" }}>
            <span style={{ fontSize: 13 }}>{outcomeIcon}</span>
            <div>
              <p style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Looking for</p>
              <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(74,222,128,0.95)", margin: 0 }}>{outcomeTag}</p>
            </div>
          </div>

          {/* Bio */}
          {(() => {
            const bioText = profile.bio || mockBio(profile.id);
            return (
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "7px 10px" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>
                  "{bioText}"
                </p>
              </div>
            );
          })()}

          {/* Dream First Date — no container, just inline */}
          {(() => {
            const idea = getDateIdea(profile.id, profile.firstDateIdea);
            if (!idea) return null;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {idea.image
                  ? <img src={idea.image} alt={idea.label} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0, opacity: 0.9 }} />
                  : <span style={{ fontSize: 22, flexShrink: 0 }}>{idea.emoji}</span>
                }
                <div>
                  <p style={{ fontSize: 8, fontWeight: 800, color: "rgba(251,191,36,0.7)", margin: "0 0 1px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Take me on a date</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.2 }}>{idea.label}</p>
                </div>
              </div>
            );
          })()}

          {/* Religion + likes row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {profile.religion ? (
              <span style={{ fontSize: 10, fontWeight: 700, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.22)", borderRadius: 50, padding: "3px 9px", color: "rgba(168,85,247,0.85)" }}>
                {profile.religion}
              </span>
            ) : <span />}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Heart size={10} fill="#ec4899" color="#ec4899" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>{likesCount}</span>
            </div>
          </div>

          {/* Activity bar */}
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Activity</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: activity.color }}>{activity.label}</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
              <div style={{ height: "100%", width: `${activity.pct}%`, borderRadius: 2, background: activity.color, boxShadow: `0 0 5px ${activity.color}` }} />
            </div>
          </div>

        </div>

        {/* Flag button — absolute bottom-right circle */}
        {onFlagOpen && (
          <button
            onClick={(e) => { e.stopPropagation(); onFlagOpen(); }}
            style={{
              position: "absolute", bottom: 10, right: 10, zIndex: 2,
              width: 32, height: 32, borderRadius: "50%",
              background: flaggedReason ? "rgba(239,68,68,0.22)" : "rgba(0,0,0,0.45)",
              border: flaggedReason ? "1.5px solid rgba(239,68,68,0.55)" : "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 14,
              boxShadow: flaggedReason ? "0 0 10px rgba(239,68,68,0.3)" : "none",
            }}
          >
            🚩
          </button>
        )}
      </motion.div>
    </div>
  );
}
