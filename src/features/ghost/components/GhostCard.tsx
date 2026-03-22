import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

const ICEBREAKERS = [
  "Would you rather know someone's deepest fear or their biggest dream?",
  "What's the most spontaneous thing you've done in the last year?",
  "If tonight was your last night in this city, where would you go?",
  "What's something you believe that most people would disagree with?",
  "What does your ideal Sunday look like?",
  "What's the question you're afraid to ask?",
  "If you could be anonymous for one day, what would you do?",
  "What's the thing that always makes you laugh, no matter what?",
  "What are you secretly really good at?",
  "What does adventure mean to you?",
  "What's the best meal you've ever had?",
  "If you could live anywhere for a year, where?",
  "What's one thing on your bucket list?",
  "What's your love language?",
  "What are you most proud of that you never talk about?",
  "Morning person or night ghost?",
  "What's the first thing you notice about someone?",
  "What's a small thing that makes your day better?",
  "What would you do with 48 hours of total freedom?",
  "What's the story behind your best scar or memory?",
];

function idHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(37, h) + id.charCodeAt(i) | 0;
  return Math.abs(h);
}

function getRepBadge(profileId: string): { label: string; color: string } | null {
  const weeks = 1 + (idHash(profileId + "weeks") % 20);
  if (weeks >= 12) return { label: "💎 Elder", color: "#a78bfa" };
  if (weeks >= 4)  return { label: "🏅 Veteran", color: "#d4af37" };
  return null;
}

function isFaceVerifiedSeeded(profileId: string): boolean {
  return (idHash(profileId + "fv") % 10) < 4;
}

function getMatchScore(profile: GhostProfile): number | null {
  try {
    const myInterests: string[] = JSON.parse(localStorage.getItem("ghost_interests") || "[]");
    if (!myInterests.length) return null;
    const profileInterests = [...(profile.interests || []), ...(profile.bio || "").split(/\s+/)];
    const setA = new Set(myInterests.map(w => w.toLowerCase()));
    const overlap = profileInterests.filter(w => setA.has(w.toLowerCase())).length;
    if (!overlap) return null;
    return Math.min(99, Math.round((overlap / myInterests.length) * 100) + 30);
  } catch { return null; }
}

const OUTCOME_TAGS  = ["Serious", "Casual", "Discreet", "Open", "Friendship", "Adventurous", "Exploring", "Free Spirit"];
const OUTCOME_ICONS = ["💍",      "🤝",      "🤫",       "🔓",   "🌱",         "🔥",          "🌀",        "🕊️"];

const SPAM_IMG        = "https://ik.imagekit.io/7grri5v7d/spam%20in.png";
const FOUND_BOO_STAMP = "https://ik.imagekit.io/7grri5v7d/Found%20Boo%20postage%20stamp%20design.png";

// ── Voice Note Player ─────────────────────────────────────────────────────────
function VoiceNotePlayer({ profileId, accent }: { profileId: string; accent: string }) {
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  let h = 0;
  for (let i = 0; i < profileId.length; i++) { h = Math.imul(37, h) + profileId.charCodeAt(i) | 0; }
  const bars = Array.from({ length: 18 }, (_, i) => 3 + (Math.abs(Math.imul(h, i + 1)) % 14));

  const playTone = () => {
    if (playing) return;
    setPlaying(true);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      [440, 523, 659].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.3);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.3 + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.3 + 0.4);
        osc.start(ctx.currentTime + i * 0.3);
        osc.stop(ctx.currentTime + i * 0.3 + 0.5);
      });
      setTimeout(() => setPlaying(false), 1200);
    } catch { setPlaying(false); }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={playTone}>
      <motion.div whileTap={{ scale: 0.9 }}
        style={{ width: 28, height: 28, borderRadius: "50%", background: playing ? `${accent}25` : "rgba(255,255,255,0.07)", border: `1.5px solid ${playing ? accent : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 10 }}>{playing ? "🔊" : "▶"}</span>
      </motion.div>
      <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
        {bars.map((bh, i) => (
          <motion.div key={i}
            animate={playing ? { scaleY: [1, 1.9, 0.5, 1.5, 1], opacity: [0.5, 1, 0.5] } : { scaleY: 1, opacity: 0.35 }}
            transition={{ duration: 0.5, repeat: playing ? Infinity : 0, delay: i * 0.04 }}
            style={{ width: 2, height: bh, borderRadius: 1, background: accent, transformOrigin: "center" }}
          />
        ))}
      </div>
      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", flexShrink: 0, fontWeight: 700 }}>0:12</span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "0 14px" }} />;
}

// ── Expanded Profile Overlay ──────────────────────────────────────────────────
function ProfileOverlay({
  profile, liked, onLike, onClose,
}: {
  profile: GhostProfile;
  liked: boolean;
  onLike: () => void;
  onClose: () => void;
}) {
  const a = useGenderAccent();
  const online    = isOnline(profile.last_seen_at);
  const ghostId   = toGhostId(profile.id);

  let oh = 0;
  for (let i = 0; i < profile.id.length; i++) { oh = Math.imul(43, oh) + profile.id.charCodeAt(i) | 0; }
  const outcomeIdx  = Math.abs(oh) % OUTCOME_TAGS.length;
  const outcomeTag  = OUTCOME_TAGS[outcomeIdx];
  const outcomeIcon = OUTCOME_ICONS[outcomeIdx];
  const repBadge    = getRepBadge(profile.id);
  const isVerified  = profile.isVerified || profile.faceVerified || isFaceVerifiedSeeded(profile.id);
  const matchScore  = getMatchScore(profile);
  const activity    = profileActivity(profile.id);
  const likesCount  = profileLikesCount(profile.id);
  const icebreaker  = ICEBREAKERS[idHash(profile.id) % ICEBREAKERS.length];
  const dateIdea    = getDateIdea(profile.id, profile.firstDateIdea);
  const bioText     = profile.bio || mockBio(profile.id);
  const heartColor  = profile.gender === "Female" ? "#f472b6" : "#ef4444";

  const myDateIdea = (() => { try { return localStorage.getItem("ghost_first_date_idea") || ""; } catch { return ""; } })();
  const hasDateMatch = myDateIdea.length > 0 && dateIdea && dateIdea.label.toLowerCase().split(/\s+/).some(w => w.length > 3 && myDateIdea.toLowerCase().includes(w));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%", scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: "100%", scale: 0.96 }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(5,5,10,0.99)", borderRadius: "22px 22px 0 0", border: `1px solid ${a.glow(0.22)}`, borderBottom: "none", maxHeight: "94dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Accent stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)`, flexShrink: 0 }} />

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" } as React.CSSProperties}>

          {/* ── Square image ── */}
          <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", flexShrink: 0 }}>
            {/* Blurred bg */}
            <img src={profile.image} alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(24px) brightness(0.3)", transform: "scale(1.1)" }} />
            {/* Square photo */}
            <img src={profile.image} alt={ghostId}
              style={{ position: "relative", width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
            />
            {/* Bottom fade */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,5,10,1) 0%, transparent 55%)" }} />

            {/* Close button */}
            <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
              style={{ position: "absolute", top: 12, right: 12, width: 34, height: 34, borderRadius: 10, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 2 }}>
              <span style={{ fontSize: 15, color: "rgba(255,255,255,0.7)" }}>✕</span>
            </motion.button>

            {/* Verified */}
            {isVerified && (
              <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 5, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 10px", border: "1px solid rgba(74,222,128,0.45)", zIndex: 2 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(74,222,128,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 8, fontWeight: 900, color: "#fff" }}>✓</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#4ade80" }}>Verified</span>
              </div>
            )}

            {/* km away */}
            {profile.distanceKm !== undefined && (
              <div style={{ position: "absolute", bottom: 16, right: 14, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "3px 10px", border: "1px solid rgba(255,255,255,0.14)", zIndex: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>{fmtKm(profile.distanceKm)}</span>
              </div>
            )}
          </div>

          {/* ── Identity block ── */}
          <div style={{ padding: "16px 16px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>{profile.age}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>{ghostId}</span>
              {repBadge && <span style={{ fontSize: 9, fontWeight: 800, color: repBadge.color, marginLeft: "auto" }}>{repBadge.label}</span>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>{profile.countryFlag}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{profile.city}</span>
              {online && (
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 5px rgba(74,222,128,0.8)", marginLeft: 2 }} />
              )}
            </div>
          </div>

          <Divider />

          {/* ── Looking For ── */}
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.3)", margin: "0 0 8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Looking For</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: a.glow(0.08), border: `1px solid ${a.glow(0.22)}`, borderRadius: 50, padding: "7px 16px" }}>
              <span style={{ fontSize: 16 }}>{outcomeIcon}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: a.glow(0.95) }}>{outcomeTag}</span>
            </div>
          </div>

          <Divider />

          {/* ── Bio ── */}
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.3)", margin: "0 0 7px", letterSpacing: "0.1em", textTransform: "uppercase" }}>About</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.65, fontStyle: "italic" }}>
              "{bioText}"
            </p>
          </div>

          <Divider />

          {/* ── Religion ── */}
          {profile.religion && (
            <>
              <div style={{ padding: "12px 16px" }}>
                <p style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.3)", margin: "0 0 8px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Faith</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: 20, padding: "5px 14px" }}>
                  <span style={{ fontSize: 13 }}>🙏</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(168,85,247,0.9)" }}>{profile.religion}</span>
                </div>
              </div>
              <Divider />
            </>
          )}

          {/* ── Dream Date ── */}
          {dateIdea && (
            <>
              <div style={{ padding: "12px 16px" }}>
                <p style={{ fontSize: 8, fontWeight: 800, color: "rgba(251,191,36,0.6)", margin: "0 0 10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>☀ Dream Date</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {dateIdea.image
                    ? <img src={dateIdea.image} alt={dateIdea.label} style={{ width: 46, height: 46, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                    : <span style={{ fontSize: 28, flexShrink: 0 }}>{dateIdea.emoji}</span>}
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>{dateIdea.label}</p>
                    {hasDateMatch && (
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 5, padding: "2px 8px" }}>🎯 Date match!</span>
                    )}
                  </div>
                </div>
              </div>
              <Divider />
            </>
          )}

          {/* ── Icebreaker ── */}
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 8, fontWeight: 800, color: a.glow(0.55), margin: "0 0 7px", letterSpacing: "0.1em", textTransform: "uppercase" }}>💬 Icebreaker</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.65, fontStyle: "italic" }}>
              "{icebreaker}"
            </p>
          </div>

          <Divider />

          {/* ── Voice Intro ── */}
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.3)", margin: "0 0 10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>🎙 Voice Intro</p>
            <VoiceNotePlayer profileId={profile.id} accent={a.accent} />
          </div>

          <Divider />

          {/* ── Stats ── */}
          <div style={{ padding: "12px 16px 10px", display: "flex", gap: 8 }}>
            <div style={{ flex: 1, background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 10, padding: "8px", textAlign: "center" }}>
              <p style={{ fontSize: 8, color: "rgba(236,72,153,0.55)", margin: "0 0 3px", fontWeight: 700 }}>Likes</p>
              <p style={{ fontSize: 13, color: "rgba(236,72,153,0.9)", margin: 0, fontWeight: 900 }}>❤ {likesCount}</p>
            </div>
            {matchScore && (
              <div style={{ flex: 1, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, padding: "8px", textAlign: "center" }}>
                <p style={{ fontSize: 8, color: "rgba(74,222,128,0.55)", margin: "0 0 3px", fontWeight: 700 }}>Match</p>
                <p style={{ fontSize: 13, color: "rgba(74,222,128,0.9)", margin: 0, fontWeight: 900 }}>⚡ {matchScore}%</p>
              </div>
            )}
            {profile.weeksSinceJoin !== undefined && (
              <div style={{ flex: 1, background: a.glow(0.07), border: `1px solid ${a.glow(0.18)}`, borderRadius: 10, padding: "8px", textAlign: "center" }}>
                <p style={{ fontSize: 8, color: a.glow(0.5), margin: "0 0 3px", fontWeight: 700 }}>Weeks</p>
                <p style={{ fontSize: 13, color: a.glow(0.9), margin: 0, fontWeight: 900 }}>{profile.weeksSinceJoin}w</p>
              </div>
            )}
          </div>

          {/* ── Activity ── */}
          <div style={{ padding: "6px 16px 28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Activity</span>
              <span style={{ fontSize: 8, fontWeight: 800, color: activity.color }}>{activity.label}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activity.pct}%` }}
                transition={{ duration: 0.7, delay: 0.3 }}
                style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${activity.color}88, ${activity.color})`, boxShadow: `0 0 6px ${activity.color}` }}
              />
            </div>
          </div>
        </div>

        {/* ── Sticky Like button at bottom ── */}
        <div style={{ flexShrink: 0, padding: "12px 16px max(20px, env(safe-area-inset-bottom, 20px))", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(5,5,10,0.98)" }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onLike}
            style={{
              width: "100%", height: 50, borderRadius: 16, border: liked ? `1.5px solid ${heartColor}` : "1.5px solid rgba(255,255,255,0.18)",
              background: liked ? `${heartColor}20` : "rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              cursor: liked ? "default" : "pointer",
              boxShadow: liked ? `0 0 20px ${heartColor}35` : "none",
            }}
          >
            <span style={{ fontSize: 20, color: liked ? heartColor : "rgba(255,255,255,0.6)" }}>{liked ? "♥" : "♡"}</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: liked ? heartColor : "rgba(255,255,255,0.7)" }}>
              {liked ? "Liked" : "Like"}
            </span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────
export default function GhostCard({
  profile, liked, onClick, onLike, isRevealed, onReveal, canReveal, isTonight, houseTier: _houseTier,
  flaggedReason, onFlagOpen: _onFlagOpen, isFoundBoo,
}: {
  profile: GhostProfile; liked: boolean; onClick: () => void; onLike?: () => void;
  isRevealed: boolean; onReveal: () => void; canReveal: boolean;
  isTonight?: boolean; houseTier?: "gold" | "suite" | null;
  flaggedReason?: string; onFlagOpen?: () => void;
  isFoundBoo?: boolean;
}) {
  const a = useGenderAccent();
  const { t } = useLanguage();
  const online    = isOnline(profile.last_seen_at);
  const ghostId   = toGhostId(profile.id);
  const [expanded, setExpanded]           = useState(false);
  const [reportedConfirm, setReportedConfirm] = useState(false);

  const isVerified  = profile.isVerified || profile.faceVerified || isFaceVerifiedSeeded(profile.id);
  const heartColor  = profile.gender === "Female" ? "#f472b6" : "#ef4444";
  const genderColor = profile.gender === "Female"
    ? { ring: "rgba(244,114,182,0.85)", glow: "rgba(244,114,182,0.4)" }
    : { ring: "rgba(74,222,128,0.85)",  glow: "rgba(74,222,128,0.4)" };

  // Floating hearts
  const heartIdRef = useRef(0);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);

  const triggerHearts = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) return;
    onLike?.();
    const newHearts = Array.from({ length: 6 }, () => ({ id: ++heartIdRef.current, x: Math.random() * 60 - 30 }));
    setFloatingHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => setFloatingHearts(prev => prev.filter(h => !newHearts.find(n => n.id === h.id))), 1800);
  };

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const stored: string[] = JSON.parse(localStorage.getItem("ghost_reported_ids") || "[]");
      if (!stored.includes(profile.id)) { stored.push(profile.id); localStorage.setItem("ghost_reported_ids", JSON.stringify(stored)); }
    } catch {}
    setReportedConfirm(true);
    setTimeout(() => setReportedConfirm(false), 1500);
  };

  const handleProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isRevealed && !canReveal) { onReveal(); return; }
    setExpanded(true);
  };

  return (
    <>
      {/* ── Card ── */}
      <div style={{ borderRadius: 18, position: "relative", aspectRatio: "3/4" }}>

        {/* Online ring */}
        {online && (
          <>
            <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.4, repeat: Infinity }}
              style={{ position: "absolute", inset: -4, borderRadius: 21, border: `2px solid ${genderColor.ring}`, boxShadow: `0 0 14px ${genderColor.glow}`, pointerEvents: "none", zIndex: 10 }} />
            <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
              style={{ position: "absolute", inset: -9, borderRadius: 25, border: `1.5px solid ${genderColor.ring}`, pointerEvents: "none", zIndex: 9 }} />
          </>
        )}

        {/* Tonight ring */}
        {isTonight && (
          <motion.div animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ position: "absolute", inset: -3, borderRadius: 20, border: `2px solid ${a.glow(0.7)}`, boxShadow: `0 0 16px ${a.glow(0.35)}`, pointerEvents: "none", zIndex: 10 }} />
        )}

        {/* Card face */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={onClick}
          style={{
            position: "absolute", inset: 0, borderRadius: 18, overflow: "hidden", cursor: "pointer",
            border: liked ? `1.5px solid ${heartColor}55` : "1px solid rgba(255,255,255,0.09)",
            boxShadow: liked ? `0 0 16px ${heartColor}30` : "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {/* Photo */}
          <img src={profile.image} alt={ghostId}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />

          {/* Bottom gradient */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 38%, transparent 60%)" }} />

          {/* TOP RIGHT: km + report */}
          <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 5 }}>
            {profile.distanceKm !== undefined && (
              <div style={{ background: "rgba(0,0,0,0.62)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "3px 9px", border: "1px solid rgba(255,255,255,0.14)" }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>{fmtKm(profile.distanceKm)}</span>
              </div>
            )}
            <button onClick={handleReport}
              style={{ width: 26, height: 26, borderRadius: 8, background: reportedConfirm ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: reportedConfirm ? "1px solid rgba(239,68,68,0.55)" : "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              {reportedConfirm ? <span style={{ fontSize: 9, fontWeight: 900, color: "#ef4444" }}>✓</span> : <span style={{ fontSize: 11 }}>🚩</span>}
            </button>
          </div>

          {/* BOTTOM strip */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 11px 10px" }}>
            {/* Flag + city */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>{profile.countryFlag}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{profile.city}</span>
            </div>
            {/* Age + verified */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>{profile.age}</span>
              {isVerified && (
                <div style={{ width: 17, height: 17, borderRadius: "50%", background: "rgba(74,222,128,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 6px rgba(74,222,128,0.7)", border: "1.5px solid rgba(255,255,255,0.3)" }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: "#fff" }}>✓</span>
                </div>
              )}
              {isTonight && (
                <div style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "1px 7px", border: `1px solid ${a.glow(0.4)}` }}>
                  <span style={{ fontSize: 8, fontWeight: 800, color: a.glow(0.95) }}>🌙 {t("card.tonight")}</span>
                </div>
              )}
            </div>
            {/* Ghost ID */}
            <div style={{ marginBottom: 9 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.55)", letterSpacing: "0.02em" }}>{ghostId}</span>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 7 }}>
              <motion.button whileTap={{ scale: 0.88 }} onClick={triggerHearts}
                style={{ flex: 1, height: 38, borderRadius: 12, background: liked ? `${heartColor}22` : "rgba(255,255,255,0.08)", border: liked ? `1.5px solid ${heartColor}` : "1.5px solid rgba(255,255,255,0.18)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: liked ? "default" : "pointer", boxShadow: liked ? `0 0 14px ${heartColor}40` : "none" }}>
                <span style={{ fontSize: 14, color: liked ? heartColor : "rgba(255,255,255,0.7)" }}>{liked ? "♥" : "♡"}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: liked ? heartColor : "rgba(255,255,255,0.7)" }}>{liked ? "Liked" : "Like"}</span>
              </motion.button>

              <motion.button whileTap={{ scale: 0.88 }} onClick={handleProfile}
                style={{ flex: 1, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.18)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                <span style={{ fontSize: 13 }}>👁</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.75)" }}>Profile</span>
              </motion.button>
            </div>
          </div>

          {/* Special overlays */}
          {flaggedReason === "spam" && (
            <div style={{ position: "absolute", inset: 0, zIndex: 5, borderRadius: 18, overflow: "hidden" }}>
              <img src={SPAM_IMG} alt="Spam" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 55%)" }} />
              <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(239,68,68,0.95)", margin: "0 0 2px" }}>{ghostId}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "0 0 4px" }}>{profile.age} · {profile.city} {profile.countryFlag}</p>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 50, padding: "2px 10px" }}>
                  <span style={{ fontSize: 9 }}>🚫</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(239,68,68,0.9)" }}>REPORTED · UNDER REVIEW</span>
                </div>
              </div>
            </div>
          )}
          {flaggedReason && flaggedReason !== "spam" && (
            <div style={{ position: "absolute", inset: 0, zIndex: 5, borderRadius: 18, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 10, padding: "6px 14px" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(239,68,68,0.85)" }}>🚩 Reported</span>
              </div>
            </div>
          )}
          {isFoundBoo && (
            <div style={{ position: "absolute", inset: 0, zIndex: 6, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <img src={FOUND_BOO_STAMP} alt="Found Boo" style={{ width: "72%", maxWidth: 130, objectFit: "contain", opacity: 0.92 }} />
            </div>
          )}
        </motion.div>

        {/* Floating hearts */}
        <AnimatePresence>
          {floatingHearts.map(h => (
            <motion.div key={h.id}
              initial={{ opacity: 1, y: 0, x: h.x, scale: 0.7 }}
              animate={{ opacity: 0, y: -130, x: h.x + (Math.random() * 20 - 10), scale: 1.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ position: "absolute", bottom: 50, right: 20, fontSize: 18, pointerEvents: "none", zIndex: 20, color: heartColor }}
            >♥</motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Expanded profile overlay ── */}
      <AnimatePresence>
        {expanded && (
          <ProfileOverlay
            profile={profile}
            liked={liked}
            onLike={() => { onLike?.(); }}
            onClose={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
