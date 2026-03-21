import { motion } from "framer-motion";
import type { LoftProfile } from "../types/loftTypes";
import { loftActivityLabel } from "../utils/loftHelpers";

const VIOLET = "#d4af37";

interface Props {
  profile: LoftProfile;
  liked: boolean;
  onLike: () => void;
  onGift: () => void;
}

export default function LoftLandscapeCard({ profile, liked, onLike, onGift }: Props) {
  const activityLabel = loftActivityLabel(profile.last_seen_at);
  const isLive = activityLabel === "In the Loft now";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      style={{
        width: "100%", borderRadius: 18, overflow: "hidden",
        border: "1px solid rgba(212,175,55,0.2)",
        background: "rgba(8,6,2,0.97)",
        boxShadow: "0 4px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(212,175,55,0.08)",
        display: "flex", flexDirection: "row", minHeight: 200,
        position: "relative",
      }}
    >
      {/* Photo panel */}
      <div style={{ width: "52%", flexShrink: 0, position: "relative", overflow: "hidden" }}>
        <img
          src={profile.photo} alt={profile.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: 200 }}
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, transparent 50%, rgba(8,6,2,0.97) 100%)",
          pointerEvents: "none",
        }} />
        {/* New arrival ribbon */}
        {profile.isNewArrival && (
          <div style={{
            position: "absolute", top: 10, left: 0,
            background: `linear-gradient(90deg, #7a5500, ${VIOLET})`,
            color: "#0a0700", fontSize: 8, fontWeight: 900,
            padding: "3px 10px 3px 8px", letterSpacing: "0.1em",
            borderRadius: "0 6px 6px 0",
          }}>
            NEW IN THE LOFT
          </div>
        )}
        {/* Activity dot */}
        <div style={{
          position: "absolute", bottom: 10, left: 10,
          display: "flex", alignItems: "center", gap: 4,
          background: "rgba(0,0,0,0.7)", borderRadius: 20, padding: "3px 8px",
        }}>
          <motion.div
            animate={isLive ? { opacity: [1, 0.3, 1] } : {}}
            transition={{ duration: 1.4, repeat: Infinity }}
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: isLive ? "#4ade80" : `rgba(212,175,55,0.7)`,
            }}
          />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{activityLabel}</span>
        </div>
      </div>

      {/* Info panel */}
      <div style={{ flex: 1, padding: "14px 14px 12px 8px", display: "flex", flexDirection: "column" }}>
        {/* Name + age */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.02em", lineHeight: 1 }}>
            {profile.name}
          </p>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: 0, fontWeight: 600 }}>{profile.age}</p>
        </div>

        {/* City */}
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 10px", fontWeight: 600 }}>
          {profile.countryFlag} {profile.city}
        </p>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
          {profile.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 9, fontWeight: 700,
              color: "rgba(139,92,246,0.85)",
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.2)",
              borderRadius: 5, padding: "3px 7px",
            }}>{tag}</span>
          ))}
        </div>

        {/* Bio */}
        <p style={{
          fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 12px",
          lineHeight: 1.6, flex: 1,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}>
          {profile.bio}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onGift}
            style={{
              flex: 1, height: 36, borderRadius: 10,
              border: "1px solid rgba(212,175,55,0.35)",
              background: "rgba(212,175,55,0.08)", color: VIOLET,
              fontSize: 11, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            🎁 <span>Send Gift</span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onLike}
            style={{
              width: 36, height: 36, borderRadius: 10, border: "none", flexShrink: 0,
              background: liked
                ? `linear-gradient(135deg, #7a5500, ${VIOLET})`
                : "rgba(255,255,255,0.06)",
              color: liked ? "#fff" : "rgba(255,255,255,0.5)",
              fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {liked ? "♥" : "♡"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
