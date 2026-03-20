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

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

const FIRST_DATE_IDEAS = [
  { key: "french_restaurant", emoji: "🍷", label: "French Restaurant",  desc: "Candlelit dinner, good wine" },
  { key: "beach_walk",        emoji: "🏖️", label: "Beach Shore Walk",   desc: "Sunset stroll, barefoot vibes" },
  { key: "cinema_night",      emoji: "🎬", label: "Cinema Night",        desc: "Pick a film, share popcorn" },
  { key: "coffee_date",       emoji: "☕", label: "Coffee & Cake",        desc: "Slow morning, easy conversation" },
  { key: "night_market",      emoji: "🏮", label: "Night Market",         desc: "Street food, good energy" },
  { key: "picnic",            emoji: "🌿", label: "Picnic in the Park",   desc: "Blanket, snacks, fresh air" },
  { key: "live_music",        emoji: "🎶", label: "Live Music Night",     desc: "Jazz bar, concert, or rooftop" },
  { key: "sushi",             emoji: "🍣", label: "Sushi Date",           desc: "Good food, clean vibes" },
  { key: "city_explore",      emoji: "🚶", label: "City Explore",         desc: "Walk, discover, see where it leads" },
  { key: "rooftop",           emoji: "🌆", label: "Rooftop Bar",          desc: "City views, cocktails, golden hour" },
  { key: "bowling",           emoji: "🎳", label: "Bowling Night",        desc: "Playful, competitive, fun" },
  { key: "boat_trip",         emoji: "⛵", label: "Boat Trip",            desc: "Open water, coastal adventure" },
];

function getDateIdea(profileId: string, key?: string | null) {
  if (key) return FIRST_DATE_IDEAS.find((d) => d.key === key) ?? null;
  // deterministic random from profile id
  let h = 0;
  for (let i = 0; i < profileId.length; i++) h = Math.imul(31, h) + profileId.charCodeAt(i) | 0;
  return FIRST_DATE_IDEAS[Math.abs(h) % FIRST_DATE_IDEAS.length];
}

// ── Profile mini card ───────────────────────────────────────────────────────
export default function GhostCard({
  profile, liked, onClick, isRevealed, onReveal, canReveal, isTonight, houseTier,
  isFlagged, onFlagOpen,
}: {
  profile: GhostProfile; liked: boolean; onClick: () => void;
  isRevealed: boolean; onReveal: () => void; canReveal: boolean;
  isTonight?: boolean; houseTier?: "black" | "house" | null;
  isFlagged?: boolean; onFlagOpen?: () => void;
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

        {/* Ghost House / Ghost Black badge */}
        {houseTier && (
          <div style={{
            position: "absolute", top: 7, left: isTonight ? 70 : 30,
            width: 22, height: 22, borderRadius: "50%",
            background: houseTier === "black" ? "#080808" : "rgba(5,5,8,0.85)",
            border: houseTier === "black" ? "1.5px solid #d4af37" : "1.5px solid rgba(74,222,128,0.7)",
            boxShadow: houseTier === "black" ? "0 0 8px rgba(212,175,55,0.6)" : "0 0 6px rgba(74,222,128,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, backdropFilter: "blur(4px)",
          }}>
            {houseTier === "black" ? "🖤" : "🏠"}
          </div>
        )}

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

        {/* Flag button */}
        {onFlagOpen && (
          <button
            onClick={(e) => { e.stopPropagation(); onFlagOpen(); }}
            style={{
              position: "absolute", bottom: 8, right: 8,
              width: 24, height: 24, borderRadius: 6,
              background: isFlagged ? "rgba(239,68,68,0.3)" : "rgba(0,0,0,0.45)",
              border: isFlagged ? "1px solid rgba(239,68,68,0.6)" : "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", backdropFilter: "blur(4px)",
              fontSize: 11,
            }}
            title="Report this profile"
          >
            🚩
          </button>
        )}

        {/* Under Investigation overlay */}
        {isFlagged && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(239,68,68,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 5,
          }}>
            <div style={{
              background: "rgba(0,0,0,0.75)", borderRadius: 8, padding: "6px 10px",
              border: "1px solid rgba(239,68,68,0.4)", textAlign: "center",
            }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#f87171", margin: 0 }}>🔍 Under Investigation</p>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>Cannot interact</p>
            </div>
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
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "14px 12px", gap: 12,
          cursor: "pointer",
        }}
        onClick={() => setFlipped(false)}
      >
        {/* Blurred photo bg */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 16 }}>
          <img src={profile.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(14px) brightness(0.25)", transform: "scale(1.1)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          {/* Purple accent */}
          <div style={{ width: 32, height: 3, borderRadius: 2, background: "linear-gradient(90deg, #16a34a, #4ade80)" }} />

          {/* Outcome */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>
              <span>Looking for</span>
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>{outcomeIcon}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(74,222,128,0.95)" }}>{outcomeTag}</span>
            </div>
          </div>

          {/* Bio */}
          {(() => {
            const bioText = profile.bio || mockBio(profile.id);
            return (
              <div style={{
                width: "100%", background: "rgba(74,222,128,0.06)",
                border: "1px solid rgba(74,222,128,0.15)",
                borderRadius: 10, padding: "8px 10px", textAlign: "center",
              }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                  "{bioText}"
                </p>
              </div>
            );
          })()}

          {/* Dream First Date */}
          {(() => {
            const idea = getDateIdea(profile.id, profile.firstDateIdea);
            if (!idea) return null;
            return (
              <div style={{
                width: "100%",
                background: "rgba(251,191,36,0.07)",
                border: "1px solid rgba(251,191,36,0.2)",
                borderRadius: 10, padding: "8px 10px",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{idea.emoji}</span>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(251,191,36,0.85)", margin: "0 0 1px", letterSpacing: "0.04em" }}>
                    DREAM FIRST DATE
                  </p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>{idea.label}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{idea.desc}</p>
                </div>
              </div>
            );
          })()}

          {/* Religion */}
          {profile.religion && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.22)",
                borderRadius: 50, padding: "3px 10px", color: "rgba(168,85,247,0.85)",
              }}>
                {profile.religion}
              </span>
            </div>
          )}

          {/* Activity */}
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Activity</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: activity.color }}>{activity.label}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
              <div style={{ height: "100%", width: `${activity.pct}%`, borderRadius: 2, background: activity.color, boxShadow: `0 0 6px ${activity.color}` }} />
            </div>
          </div>

          {/* Likes */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Heart size={11} fill="#ec4899" color="#ec4899" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
              <span>{likesCount} likes received</span>
            </span>
          </div>

          {/* Tap to flip back hint */}
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", margin: 0 }}>
            <span>Tap to flip back</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
