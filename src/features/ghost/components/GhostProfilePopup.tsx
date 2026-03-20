import { motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId, fmtKm } from "../utils/ghostHelpers";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

// ── Profile popup overlay ───────────────────────────────────────────────────
export default function GhostProfilePopup({
  profile, liked, onLike, onClose, onPass,
}: {
  profile: GhostProfile; liked: boolean; onLike: () => void; onClose: () => void; onPass: () => void;
}) {
  const { t } = useLanguage();
  const online = isOnline(profile.last_seen_at);
  const ghostId = toGhostId(profile.id);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 320,
          background: "rgba(8,8,12,0.92)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 22, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #16a34a)" }} />
        <div style={{ position: "relative" }}>
          <img
            src={profile.image} alt={ghostId}
            style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", display: "block" }}
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)" }} />

          {/* Ghost badge */}
          <div style={{
            position: "absolute", top: 12, left: 12,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            borderRadius: 20, padding: "4px 10px",
            border: "1px solid rgba(74,222,128,0.3)",
            fontSize: 10, fontWeight: 700, color: "rgba(74,222,128,0.9)", letterSpacing: "0.1em",
          }}><img src={GHOST_LOGO} alt="" style={{ width: 30, height: 30, objectFit: "contain", verticalAlign: "middle", marginRight: 6 }} /> GHOST</div>

          {/* Online */}
          {online && (
            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.8)", display: "block" }} />
              <span style={{ fontSize: 10, color: "rgba(74,222,128,0.9)", fontWeight: 600 }}>Online</span>
            </div>
          )}

          {/* Ghost ID / age / city */}
          <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "rgba(74,222,128,0.9)", margin: 0, letterSpacing: "0.06em" }}>
                <span>{ghostId}</span>
              </p>
              {profile.isVerified && (
                <span style={{
                  fontSize: 10, fontWeight: 800, background: "rgba(74,222,128,0.2)",
                  border: "1px solid rgba(74,222,128,0.5)", borderRadius: 5,
                  padding: "1px 6px", color: "rgba(74,222,128,0.95)",
                }}>✅ {t("card.verified")}</span>
              )}
            </div>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 4px", textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
              <span>{profile.age} · {profile.gender === "Female" ? t("card.woman") : t("card.man")}</span>
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 13 }}>{profile.countryFlag}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{profile.city}</span>
              </div>
              {profile.distanceKm !== undefined ? (
                <span style={{
                  background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)",
                  borderRadius: 6, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                  color: "rgba(74,222,128,0.9)",
                }}>
                  📍 {fmtKm(profile.distanceKm)}
                </span>
              ) : (
                <span style={{
                  background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "1px 6px",
                  fontSize: 10, color: "rgba(255,255,255,0.45)",
                }}>
                  {profile.country}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: "10px 16px 6px", textAlign: "center" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: "0.05em" }}>
            No bio · No details · Match on instinct
          </p>
        </div>

        <div style={{ padding: "10px 20px 20px", display: "flex", gap: 12 }}>
          <button
            onClick={onPass}
            style={{
              flex: 1, height: 48, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <X size={16} /> Pass
          </button>
          <button
            onClick={onLike} disabled={liked}
            style={{
              flex: 2, height: 48, borderRadius: 14, border: "none",
              background: liked ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #16a34a, #22c55e)",
              color: liked ? "#4ade80" : "#fff",
              fontSize: 13, fontWeight: 800, cursor: liked ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: liked ? "none" : "0 4px 18px rgba(34,197,94,0.4)", transition: "all 0.2s",
            }}
          >
            <Heart size={16} fill={liked ? "currentColor" : "none"} />
            {liked ? "Liked ✓" : "Like"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
