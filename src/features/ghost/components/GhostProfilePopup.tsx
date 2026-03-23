import { motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId, fmtKm } from "../utils/ghostHelpers";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { getReputation, getShowRate, getReputationBadge, BADGE_META } from "../utils/reputationService";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

// ── Profile popup overlay ───────────────────────────────────────────────────
export default function GhostProfilePopup({
  profile, liked, onLike, onClose, onPass, isLobby = false, cooldownSecs = 0, onCallButler,
  onWhisper, onVideoIntro, onSeance, onGameInvite,
}: {
  profile: GhostProfile; liked: boolean; onLike: () => void; onClose: () => void; onPass: () => void;
  isLobby?: boolean; cooldownSecs?: number; onCallButler?: () => void;
  onWhisper?: () => void; onVideoIntro?: () => void; onSeance?: () => void;
  onGameInvite?: () => void;
}) {
  const a = useGenderAccent();
  const accent = isLobby ? "#d4af37" : a.accent;
  const accentRgb = isLobby ? "212,175,55" : "74,222,128";
  const accentDark = isLobby ? "#92660a" : a.accentDark;
  const { t } = useLanguage();
  const online = isOnline(profile.last_seen_at);
  const ghostId = toGhostId(profile.id);
  const rep   = getReputation(profile.id);
  const rate  = getShowRate(rep);
  const badge = getReputationBadge(rep);
  const total = rep.showUps + rep.noShows;

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
          borderRadius: 22, border: isLobby ? "1px solid rgba(212,175,55,0.35)" : "1px solid rgba(255,255,255,0.08)", overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, ${accentDark}, ${accent}, ${accentDark})` }} />
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
            border: `1px solid rgba(${accentRgb},0.3)`,
            fontSize: 10, fontWeight: 700, color: `rgba(${accentRgb},0.9)`, letterSpacing: "0.1em",
          }}><img src={GHOST_LOGO} alt="" style={{ width: 30, height: 30, objectFit: "contain", verticalAlign: "middle", marginRight: 6 }} /> GHOST</div>

          {/* Online */}
          {online && (
            <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: accent, boxShadow: "0 0 8px rgba(${accentRgb},0.8)", display: "block" }} />
              <span style={{ fontSize: 10, color: `rgba(${accentRgb},0.9)`, fontWeight: 600 }}>Online</span>
            </div>
          )}

          {/* Ghost ID / age / city */}
          <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: `rgba(${accentRgb},0.9)`, margin: 0, letterSpacing: "0.06em" }}>
                <span>{ghostId}</span>
              </p>
              {profile.isVerified && (
                <span style={{
                  fontSize: 10, fontWeight: 800, background: `rgba(${accentRgb},0.2)`,
                  border: `1px solid rgba(${accentRgb},0.5)`, borderRadius: 5,
                  padding: "1px 6px", color: `rgba(${accentRgb},0.95)`,
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
                  background: `rgba(${accentRgb},0.15)`, border: `1px solid rgba(${accentRgb},0.3)`,
                  borderRadius: 6, padding: "1px 6px", fontSize: 10, fontWeight: 700,
                  color: `rgba(${accentRgb},0.9)`,
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

        {/* ── Guest Reputation ── */}
        {total >= 2 && (
          <div style={{ margin: "0 16px 4px", padding: "12px 14px",
            background: badge ? BADGE_META[badge].bg : "rgba(255,255,255,0.03)",
            border: `1px solid ${badge ? BADGE_META[badge].border : "rgba(255,255,255,0.07)"}`,
            borderRadius: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700,
              color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              🎩 Guest Reputation
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 11, color: "rgba(74,222,128,0.9)", fontWeight: 700 }}>
                    ✅ {rep.showUps} showed up
                  </span>
                  {rep.noShows > 0 && (
                    <span style={{ fontSize: 11, color: "rgba(248,113,113,0.85)", fontWeight: 700 }}>
                      ❌ {rep.noShows} no-show{rep.noShows > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {/* Rate bar */}
                <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${rate}%`, borderRadius: 4,
                    background: rate >= 90 ? "#4ade80" : rate >= 60 ? "#facc15" : "#f87171",
                    transition: "width 0.6s ease" }} />
                </div>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{rate}% show rate</span>
              </div>
              {badge && (
                <div style={{ flexShrink: 0, textAlign: "center" }}>
                  <div style={{ padding: "4px 8px", borderRadius: 8,
                    background: BADGE_META[badge].bg, border: `1px solid ${BADGE_META[badge].border}` }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: BADGE_META[badge].color }}>
                      {BADGE_META[badge].icon} {BADGE_META[badge].label}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {/* Butler caution notice */}
            {(badge === "caution" || badge === "flagged") && (
              <p style={{ margin: "8px 0 0", fontSize: 10, color: "rgba(248,113,113,0.65)", lineHeight: 1.6 }}>
                ⚠️ The butler has noted this guest has missed {rep.noShows} agreed connection{rep.noShows > 1 ? "s" : ""}. Please proceed with awareness.
              </p>
            )}
          </div>
        )}

        <div style={{ padding: "10px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 12 }}>
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
            onClick={onLike} disabled={liked || cooldownSecs > 0}
            style={{
              flex: 2, height: 48, borderRadius: 14,
              border: liked ? "none" : cooldownSecs > 0 ? "1px solid rgba(${accentRgb},0.2)" : "none",
              background: liked
                ? `rgba(${accentRgb},0.2)`
                : cooldownSecs > 0
                  ? "rgba(255,255,255,0.06)"
                  : `linear-gradient(135deg, ${accentDark}, ${accent})`,
              color: liked ? accent : cooldownSecs > 0 ? `rgba(${accentRgb},0.55)` : (isLobby ? "#000" : "#fff"),
              fontSize: 13, fontWeight: 800, cursor: liked || cooldownSecs > 0 ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: liked || cooldownSecs > 0 ? "none" : `0 4px 18px rgba(${accentRgb},0.4)`,
              transition: "all 0.2s",
            }}
          >
            {cooldownSecs > 0 ? (
              <>
                <span style={{ fontSize: 14 }}>⏱</span>
                <span>Next like in {Math.floor(cooldownSecs / 60)}:{String(cooldownSecs % 60).padStart(2, "0")}</span>
              </>
            ) : (
              <>
                <Heart size={16} fill={liked ? "currentColor" : "none"} />
                {liked ? "Liked ✓" : "Like"}
              </>
            )}
          </button>
          </div>
          {/* Hotel Games Room */}
          <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(250,204,21,0.2)" }}>
            {/* Header */}
            <div style={{ padding: "10px 14px 8px", background: "rgba(250,204,21,0.07)", borderBottom: "1px solid rgba(250,204,21,0.12)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: "rgba(250,204,21,0.9)" }}>Hotel Games Room</p>
                <p style={{ margin: "1px 0 0", fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Connect 4 · Chat open at every level</p>
              </div>
              <Link to="/ghost/games" style={{ fontSize: 9, fontWeight: 800, color: "rgba(250,204,21,0.65)", textDecoration: "none", background: "rgba(250,204,21,0.1)", border: "1px solid rgba(250,204,21,0.25)", borderRadius: 8, padding: "4px 8px" }}>
                Enter →
              </Link>
            </div>

            {/* Connect 4 mini preview */}
            <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.3)" }}>
              {/* Grid preview */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 8 }}>
                {[
                  [0,0,0,0,0,0,0],
                  [0,0,0,0,0,0,0],
                  [0,0,0,1,0,0,0],
                  [0,0,1,2,0,0,0],
                  [0,1,2,1,2,0,0],
                  [2,1,2,1,2,1,0],
                ].flat().map((cell, i) => (
                  <div key={i} style={{
                    width: "100%", aspectRatio: "1",
                    borderRadius: "50%",
                    background: cell === 1 ? "rgba(250,204,21,0.9)" : cell === 2 ? "rgba(239,68,68,0.85)" : "rgba(255,255,255,0.07)",
                    border: cell === 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                    boxShadow: cell === 1 ? "0 0 5px rgba(250,204,21,0.6)" : cell === 2 ? "0 0 5px rgba(239,68,68,0.5)" : "none",
                  }} />
                ))}
              </div>
              {/* Text */}
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>{ghostId}</span> may be open to a game. Chat unlocks as you play — it's a natural way to connect before revealing yourself.
              </p>
            </div>
          </div>

          {/* Secondary action row */}
          {(onWhisper || onVideoIntro || onSeance || onCallButler) && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {onWhisper && !liked && (
                <button onClick={onWhisper}
                  style={{ flex: 1, minWidth: 90, height: 36, borderRadius: 10, border: "1px solid rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.08)", color: "#a78bfa", fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                >
                  💨 Whisper
                </button>
              )}
              {onSeance && (
                <button onClick={onSeance}
                  style={{ flex: 1, minWidth: 90, height: 36, borderRadius: 10, border: `1px solid rgba(${accentRgb},0.3)`, background: `rgba(${accentRgb},0.07)`, color: accent, fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                >
                  🌫️ Séance
                </button>
              )}
              {onVideoIntro && (
                <button onClick={onVideoIntro}
                  style={{ flex: 1, minWidth: 90, height: 36, borderRadius: 10, border: `1px solid rgba(${accentRgb},0.3)`, background: `rgba(${accentRgb},0.07)`, color: accent, fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                >
                  🎬 Video Intro
                </button>
              )}
              {onCallButler && (
                <button onClick={onCallButler}
                  style={{ flex: 1, minWidth: 90, height: 36, borderRadius: 10, background: "none", border: "1px solid rgba(212,175,55,0.25)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: 0 }}
                >
                  <img src="https://ik.imagekit.io/7grri5v7d/butlers%20tray.png" alt="butler" style={{ width: 14, height: 14, objectFit: "contain" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(212,175,55,0.6)" }}>Butler Gift</span>
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
