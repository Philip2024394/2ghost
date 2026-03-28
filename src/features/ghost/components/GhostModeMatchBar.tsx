import React from "react";
import { motion } from "framer-motion";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import type { GhostProfile, GhostMatch } from "../types/ghostTypes";
import { MATCH_EXPIRY_MS, INTL_PROFILES } from "../types/ghostTypes";
import { getDaysConnected, getConciergeShown } from "../utils/featureGating";
import { isCitySupported } from "../data/butlerProviders";
import type { MatchActionContext } from "../components/MatchActionPopup";

export interface GhostModeMatchBarProps {
  savedMatches: GhostMatch[];
  connectedMatchIds: Set<string>;
  isFemale: boolean;
  iLikeList: GhostProfile[];
  likedMeList: GhostProfile[];
  lobbyList: GhostProfile[];
  roomMemberList: GhostProfile[];
  matchTab: "matches" | "ilike" | "liked" | "lobby" | "room";
  setMatchTab: (v: "matches" | "ilike" | "liked" | "lobby" | "room") => void;
  tierLabel: string;
  tierColor: string;
  tierIcon: string;
  revealedInbound: Set<string>;
  setRevealedInbound: React.Dispatch<React.SetStateAction<Set<string>>>;
  coinBalance: number;
  setShowCoinShop: (v: boolean) => void;
  updateCoins: (n: number) => void;
  setExpandedLikedProfile: (v: GhostProfile | null) => void;
  openMatchAction: (p: GhostProfile, ctx: MatchActionContext) => void;
  setStaffPopupProfile: (v: GhostProfile | null) => void;
  startTabRevert: () => void;
  userCity: string;
  setButlerMatchName: (v: string | undefined) => void;
  setShowButler: (v: boolean) => void;
  setShowButlerUnavailable: (v: boolean) => void;
  setConciergeProfile: (v: GhostProfile | null) => void;
  setConciergeMatchId: (v: string) => void;
  setConciergeDays: (v: number) => void;
  setShowConcierge: (v: boolean) => void;
  a: {
    accent: string;
    accentDark: string;
    glow: (o: number) => string;
    glowMid: (o: number) => string;
    gradient: string;
  };
}

export default function GhostModeMatchBar({
  savedMatches,
  connectedMatchIds,
  isFemale,
  iLikeList,
  likedMeList,
  lobbyList,
  roomMemberList,
  matchTab,
  setMatchTab,
  tierLabel,
  tierColor,
  tierIcon,
  revealedInbound,
  setRevealedInbound,
  coinBalance,
  setShowCoinShop,
  updateCoins,
  setExpandedLikedProfile,
  openMatchAction,
  setStaffPopupProfile,
  startTabRevert,
  userCity,
  setButlerMatchName,
  setShowButler,
  setShowButlerUnavailable,

  setConciergeProfile,
  setConciergeMatchId,
  setConciergeDays,
  setShowConcierge,
  a,
}: GhostModeMatchBarProps) {
  const activeMatches = savedMatches
    .filter((m) => Date.now() - m.matchedAt < MATCH_EXPIRY_MS && !connectedMatchIds.has(m.id));
  const PLACEHOLDER_IMG = isFemale
    ? "https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdftewrtewrtDASDASD.png?updatedAt=1774110335030"
    : "https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdftewrtewrtDASDASDDSDS.png?updatedAt=1774110383388";

  // Use component-level computed lists (shuffled live)
  // Fill with mock profiles when real data is absent so new users see live-looking avatars
  const MOCK_I_LIKE   = INTL_PROFILES.slice(0, 6);
  const MOCK_LIKED_ME = INTL_PROFILES.slice(6, 12);
  const iLikeProfiles  = iLikeList.length  > 0 ? iLikeList  : MOCK_I_LIKE;
  const likedMeProfiles = likedMeList.length > 0 ? likedMeList : MOCK_LIKED_ME;
  const iLikeIsMock  = iLikeList.length  === 0;
  const likedIsMock  = likedMeList.length === 0;

  // Avatar size: exactly 3 fit in screen width
  const avatarSize = "calc((100vw - 108px) / 3)";
  const avatarH = 78;

  // Header label
  const tabLabel = matchTab === "ilike" ? "I Like" : matchTab === "liked" ? "Liked Me" : matchTab === "lobby" ? "Hotel Lobby" : matchTab === "room" ? tierLabel : "Matches";
  const tabCount = matchTab === "ilike" ? iLikeList.length : matchTab === "liked" ? likedMeList.length : matchTab === "lobby" ? lobbyList.length : matchTab === "room" ? roomMemberList.length : activeMatches.length;
  const dotColor  = a.accent;
  const dotGlow   = a.glow(0.9);
  const labelColor = a.glow(0.85);

  // Build scroll content
  const renderScrollContent = () => {
    if (matchTab === "ilike") {
      return (
        <>
          {iLikeProfiles.map((p, i) => (
            <div key={p.id} onClick={() => {
                if (iLikeIsMock) return;
                if (!p.isVerified && !p.faceVerified) { setStaffPopupProfile(p); return; }
                openMatchAction(p, "ilike");
              }}
              style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: iLikeIsMock ? "default" : "pointer", opacity: iLikeIsMock ? 0.65 : 1 }}
            >
              <div style={{ position: "relative", width: avatarSize, height: avatarH }}>
                <motion.div
                  animate={{ scale: [1, 1.22, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2 }}
                  style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${a.glow(0.7)}`, pointerEvents: "none" }}
                />
                <img src={p.image} alt=""
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.55)}`, display: "block" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
                {p.countryFlag && (
                  <span style={{ position: "absolute", bottom: -1, right: -1, fontSize: 12, lineHeight: 1 }}>{p.countryFlag}</span>
                )}
              </div>
              <p style={{ fontSize: 8, color: a.glow(0.8), fontWeight: 700, margin: 0, textAlign: "center", width: avatarSize, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name}</p>
            </div>
          ))}
        </>
      );
    }
    if (matchTab === "liked") {
      return (
        <>
          {likedMeProfiles.map((p, i) => {
            const revealed = !likedIsMock && revealedInbound.has(p.id);
            return (
              <div key={p.id}
                onClick={() => {
                  if (likedIsMock) return;
                  if (!p.isVerified && !p.faceVerified) {
                    setStaffPopupProfile(p);
                    return;
                  }
                  if (revealed) { setExpandedLikedProfile(p); return; }
                  const current = coinBalance;
                  if (current < 5) { setShowCoinShop(true); return; }
                  updateCoins(current - 5);
                  setRevealedInbound(prev => new Set([...prev, p.id]));
                  setExpandedLikedProfile(p);
                }}
                style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: likedIsMock ? "default" : "pointer", opacity: likedIsMock ? 0.65 : 1 }}
              >
                <div style={{ position: "relative", width: avatarSize, height: avatarH }}>
                  <motion.div
                    animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.18 }}
                    style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid rgba(212,175,55,0.65)", pointerEvents: "none" }}
                  />
                  <img src={p.image} alt=""
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.45)", display: "block", filter: (!likedIsMock && !revealed) ? "blur(7px) brightness(0.65)" : "none", transition: "filter 0.4s" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                  {!likedIsMock && !revealed && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.15)" }}>
                      <span style={{ fontSize: 8, fontWeight: 900, color: "#d4af37", textAlign: "center", lineHeight: 1.3 }}>5🪙</span>
                    </div>
                  )}
                  {likedIsMock && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.35)" }}>
                      <span style={{ fontSize: 18 }}>👻</span>
                    </div>
                  )}
                  {!likedIsMock && p.countryFlag && revealed && (
                    <span style={{ position: "absolute", bottom: -1, right: -1, fontSize: 12, lineHeight: 1 }}>{p.countryFlag}</span>
                  )}
                </div>
                <p style={{ fontSize: 8, color: "rgba(212,175,55,0.85)", fontWeight: 700, margin: 0, textAlign: "center", width: avatarSize, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                  {likedIsMock || (!revealed) ? "???" : p.name}
                </p>
              </div>
            );
          })}
        </>
      );
    }
    if (matchTab === "lobby") {
      const TOTAL = Math.max(3, lobbyList.length);
      const phCount = TOTAL - lobbyList.length;
      return (
        <>
          {lobbyList.map((p, i) => (
            <div key={p.id} onClick={() => openMatchAction(p, "lobby")}
              style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
            >
              <div style={{ position: "relative", width: avatarSize, height: avatarH }}>
                <motion.div
                  animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.9, repeat: Infinity, delay: i * 0.18 }}
                  style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${a.glow(0.65)}`, pointerEvents: "none" }}
                />
                <img src={p.image} alt=""
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.45)}`, display: "block" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
                {isOnline(p.last_seen_at) && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    style={{ position: "absolute", bottom: 1, right: 1, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.9)", display: "block" }}
                  />
                )}
              </div>
              <p style={{ fontSize: 8, color: a.glow(0.8), fontWeight: 700, margin: 0, textAlign: "center", width: avatarSize, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name}</p>
            </div>
          ))}
          {Array.from({ length: phCount }).map((_, i) => (
            <div key={`ph-${i}`} style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: avatarSize, height: avatarH, borderRadius: "50%", border: `2px dashed ${a.glow(0.2)}`, background: a.glow(0.03), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16, opacity: 0.3 }}>🏨</span>
              </div>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", margin: 0 }}>Soon…</p>
            </div>
          ))}
        </>
      );
    }

    if (matchTab === "room") {
      const TOTAL = Math.max(3, roomMemberList.length);
      const phCount = TOTAL - roomMemberList.length;
      return (
        <>
          {roomMemberList.map((p, i) => (
            <div key={p.id} onClick={() => openMatchAction(p, "match")}
              style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
            >
              <div style={{ position: "relative", width: avatarSize, height: avatarH }}>
                <motion.div
                  animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2.1, repeat: Infinity, delay: i * 0.18 }}
                  style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${tierColor}80`, pointerEvents: "none" }}
                />
                <img src={p.image} alt=""
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${tierColor}60`, display: "block" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
                {isOnline(p.last_seen_at) && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    style={{ position: "absolute", bottom: 1, right: 1, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.9)", display: "block" }}
                  />
                )}
              </div>
              <p style={{ fontSize: 8, color: `${tierColor}cc`, fontWeight: 700, margin: 0, textAlign: "center", width: avatarSize, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name}</p>
            </div>
          ))}
          {Array.from({ length: phCount }).map((_, i) => (
            <div key={`ph-${i}`} style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: avatarSize, height: avatarH, borderRadius: "50%", border: `2px dashed ${tierColor}30`, background: `${tierColor}05`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 16, opacity: 0.3 }}>{tierIcon}</span>
              </div>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", margin: 0 }}>Soon…</p>
            </div>
          ))}
        </>
      );
    }

    // Default: matches tab
    const TOTAL_SLOTS = Math.max(3, activeMatches.length);
    const placeholderCount = TOTAL_SLOTS - activeMatches.length;
    return (
      <>
        {activeMatches.map((m, i) => (
          <div key={m.id} onClick={() => {
              const days = getDaysConnected(m.matchedAt);
              const shown = getConciergeShown();
              if (days >= 5 && !shown.includes(m.id)) {
                setConciergeProfile(m.profile);
                setConciergeMatchId(m.id);
                setConciergeDays(days);
                setShowConcierge(true);
              } else {
                openMatchAction(m.profile, "match");
              }
            }}
            style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
          >
            <div style={{ position: "relative", width: avatarSize, height: avatarH }}>
              <motion.div
                animate={{ scale: [1, 1.22, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2 }}
                style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${a.glow(0.7)}`, pointerEvents: "none" }}
              />
              <img src={m.profile.image} alt=""
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.55)}`, display: "block" }}
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              {(m.profile.lastActiveHoursAgo ?? 99) <= 0.5 && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ position: "absolute", bottom: 1, right: 1, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.9)", display: "block" }}
                />
              )}
            </div>
            <p style={{ fontSize: 8, color: a.glow(0.8), fontWeight: 700, margin: 0, letterSpacing: "0.04em", textAlign: "center", width: avatarSize, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{m.profile.name}</p>
            {getDaysConnected(m.matchedAt) >= 1 && (
              <p style={{ fontSize: 7, fontWeight: 900, color: "#fb923c", margin: 0, letterSpacing: "0.02em" }}>
                Day {getDaysConnected(m.matchedAt)} 🔥
              </p>
            )}
          </div>
        ))}
        {Array.from({ length: placeholderCount }).map((_, i) => (
          <div key={`ph-${i}`} style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ position: "relative", width: avatarSize, height: avatarH }}>
              <motion.div
                animate={{ scale: [1, 1.22, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.15 }}
                style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${a.glow(0.35)}`, pointerEvents: "none" }}
              />
              <img src={PLACEHOLDER_IMG} alt=""
                style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.3)}`, display: "block", opacity: 0.6 }}
              />
            </div>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", fontWeight: 700, margin: 0 }}>Soon…</p>
          </div>
        ))}
      </>
    );
  };

  return null;
}
