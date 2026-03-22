import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
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

// ── Icebreaker questions ──────────────────────────────────────────────────────
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

function getInvitedBySeeded(profileId: string): string | null {
  const h = idHash(profileId + "inv");
  if (h % 10 >= 3) return null;
  return `Ghost-${1000 + (h % 9000)}`;
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

const SPAM_IMG       = "https://ik.imagekit.io/7grri5v7d/spam%20in.png";
const FOUND_BOO_STAMP = "https://ik.imagekit.io/7grri5v7d/Found%20Boo%20postage%20stamp%20design.png";

// ── Voice Note Player ────────────────────────────────────────────────────────
function VoiceNotePlayer({ profileId, accent }: { profileId: string; accent: string }) {
  const [playing, setPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  let h = 0;
  for (let i = 0; i < profileId.length; i++) { h = Math.imul(37, h) + profileId.charCodeAt(i) | 0; }
  const bars = Array.from({ length: 14 }, (_, i) => 3 + (Math.abs(Math.imul(h, i + 1)) % 14));

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
      <motion.div
        whileTap={{ scale: 0.9 }}
        style={{ width: 30, height: 30, borderRadius: "50%", background: playing ? `${accent}25` : "rgba(255,255,255,0.07)", border: `1.5px solid ${playing ? accent : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s" }}
      >
        <span style={{ fontSize: 11 }}>{playing ? "🔊" : "▶"}</span>
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

// ── Section divider ───────────────────────────────────────────────────────────
function Divider({ accent }: { accent: string }) {
  return <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accent}30, transparent)`, margin: "1px 0" }} />;
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
  const [flipped, setFlipped]             = useState(false);
  const [reportedConfirm, setReportedConfirm] = useState(false);

  // Seeded data
  let oh = 0;
  for (let i = 0; i < profile.id.length; i++) { oh = Math.imul(43, oh) + profile.id.charCodeAt(i) | 0; }
  const outcomeIdx  = Math.abs(oh) % OUTCOME_TAGS.length;
  const outcomeTag  = OUTCOME_TAGS[outcomeIdx];
  const outcomeIcon = OUTCOME_ICONS[outcomeIdx];
  const repBadge    = getRepBadge(profile.id);
  const isVerified  = profile.isVerified || profile.faceVerified || isFaceVerifiedSeeded(profile.id);
  const invitedBy   = profile.invitedBy   || getInvitedBySeeded(profile.id);
  const matchScore  = getMatchScore(profile);
  const activity    = profileActivity(profile.id);
  const likesCount  = profileLikesCount(profile.id);
  const icebreaker  = ICEBREAKERS[idHash(profile.id) % ICEBREAKERS.length];
  const dateIdea    = getDateIdea(profile.id, profile.firstDateIdea);
  const bioText     = profile.bio || mockBio(profile.id);
  const isFloorOnly = Math.abs(oh) % 5 === 0;

  // Date match indicator
  const myDateIdea = (() => { try { return localStorage.getItem("ghost_first_date_idea") || ""; } catch { return ""; } })();
  const hasDateMatch = myDateIdea.length > 0 && dateIdea && dateIdea.label.toLowerCase().split(/\s+/).some(w => w.length > 3 && myDateIdea.toLowerCase().includes(w));

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

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isRevealed && !canReveal) { onReveal(); }
    setFlipped(f => !f);
  };

  const genderColor = profile.gender === "Female"
    ? { ring: "rgba(244,114,182,0.85)", glow: "rgba(244,114,182,0.4)" }
    : { ring: "rgba(74,222,128,0.85)",  glow: "rgba(74,222,128,0.4)" };

  return (
    <div style={{ borderRadius: 18, position: "relative", perspective: 900, aspectRatio: "3/4" }}>

      {/* ── Online ring ── */}
      {online && !flipped && (
        <>
          <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.4, repeat: Infinity }}
            style={{ position: "absolute", inset: -4, borderRadius: 21, border: `2px solid ${genderColor.ring}`, boxShadow: `0 0 14px ${genderColor.glow}`, pointerEvents: "none", zIndex: 10 }} />
          <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
            style={{ position: "absolute", inset: -9, borderRadius: 25, border: `1.5px solid ${genderColor.ring}`, pointerEvents: "none", zIndex: 9 }} />
        </>
      )}

      {/* ── Tonight ring ── */}
      {isTonight && !flipped && (
        <motion.div animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ position: "absolute", inset: -3, borderRadius: 20, border: `2px solid ${a.glow(0.7)}`, boxShadow: `0 0 16px ${a.glow(0.35)}`, pointerEvents: "none", zIndex: 10 }} />
      )}

      {/* ════════════════════════════════════
          FRONT FACE — image dominant, info strip
          ════════════════════════════════════ */}
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          borderRadius: 18, overflow: "hidden", cursor: "pointer",
          border: isTonight
            ? `1.5px solid ${a.glow(0.55)}`
            : liked
            ? `1.5px solid ${a.glow(0.45)}`
            : "1px solid rgba(255,255,255,0.09)",
          boxShadow: isTonight
            ? `0 0 20px ${a.glow(0.22)}`
            : liked
            ? `0 0 16px ${a.glow(0.18)}`
            : "0 4px 24px rgba(0,0,0,0.5)",
        }}
        onClick={flipped ? undefined : onClick}
        whileTap={flipped ? undefined : { scale: 0.98 }}
      >
        {/* Photo */}
        <img
          src={profile.image} alt={ghostId}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />

        {/* Bottom gradient — strong enough for text */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 42%, transparent 65%)" }} />

        {/* ── TOP LEFT badges ── */}
        <div style={{ position: "absolute", top: 10, left: 10, display: "flex", flexDirection: "column", gap: 5 }}>
          {isTonight ? (
            <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "3px 9px", border: `1px solid ${a.glow(0.4)}` }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: a.glow(0.95), letterSpacing: "0.04em" }}>🌙 {t("card.tonight")}</span>
            </div>
          ) : profile.distanceKm !== undefined ? (
            <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "3px 9px", border: "1px solid rgba(255,255,255,0.14)" }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>{fmtKm(profile.distanceKm)}</span>
            </div>
          ) : null}
          {isFloorOnly && (
            <div style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "2px 8px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 7 }}>🔒</span>
              <span style={{ fontSize: 7, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em" }}>FLOOR ONLY</span>
            </div>
          )}
        </div>

        {/* ── TOP RIGHT: online dot + report ── */}
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 6 }}>
          {online && (
            <motion.div animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 7px rgba(74,222,128,0.9)" }} />
          )}
          <button onClick={handleReport}
            style={{ width: 26, height: 26, borderRadius: 8, background: reportedConfirm ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: reportedConfirm ? "1px solid rgba(239,68,68,0.55)" : "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {reportedConfirm
              ? <span style={{ fontSize: 9, fontWeight: 900, color: "#ef4444" }}>✓</span>
              : <span style={{ fontSize: 11 }}>🚩</span>}
          </button>
        </div>

        {/* ── BOTTOM info strip ── */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 11px 10px" }}>

          {/* Badges row */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5, flexWrap: "wrap" }}>
            {isVerified && (
              <div style={{ display: "flex", alignItems: "center", gap: 3, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)", borderRadius: 20, padding: "2px 7px" }}>
                <span style={{ fontSize: 8, fontWeight: 900, color: "#4ade80" }}>✅ Verified</span>
              </div>
            )}
            {repBadge && (
              <div style={{ display: "flex", alignItems: "center", gap: 2, background: `${repBadge.color}18`, border: `1px solid ${repBadge.color}40`, borderRadius: 20, padding: "2px 7px" }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: repBadge.color }}>{repBadge.label}</span>
              </div>
            )}
            {matchScore && (
              <div style={{ display: "flex", alignItems: "center", gap: 2, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 20, padding: "2px 7px" }}>
                <span style={{ fontSize: 8, fontWeight: 800, color: "#4ade80" }}>⚡ {matchScore}%</span>
              </div>
            )}
          </div>

          {/* Name row */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
              {ghostId}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.75)" }}>{profile.age}</span>
          </div>

          {/* City row */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 11 }}>{profile.countryFlag}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{profile.city}</span>
            {invitedBy && (
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", fontStyle: "italic", marginLeft: 2 }}>· via {invitedBy}</span>
            )}
          </div>

          {/* Action buttons row */}
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {/* Like button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={triggerHearts}
              style={{
                flex: 1, height: 38, borderRadius: 12,
                background: liked ? a.glowMid(0.25) : "rgba(255,255,255,0.08)",
                border: liked ? `1.5px solid ${a.accent}` : "1.5px solid rgba(255,255,255,0.18)",
                backdropFilter: "blur(10px)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                cursor: liked ? "default" : "pointer",
                boxShadow: liked ? `0 0 14px ${a.glow(0.35)}` : "none",
              }}
            >
              <Heart size={14} style={{ color: liked ? a.accent : "rgba(255,255,255,0.7)" }} fill={liked ? "currentColor" : "none"} />
              <span style={{ fontSize: 11, fontWeight: 800, color: liked ? a.accent : "rgba(255,255,255,0.7)" }}>
                {liked ? "Liked" : "Like"}
              </span>
            </motion.button>

            {/* View details / flip button */}
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={handleFlip}
              style={{
                flex: 1, height: 38, borderRadius: 12,
                background: "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(255,255,255,0.18)",
                backdropFilter: "blur(10px)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 13 }}>👁</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.75)" }}>Profile</span>
            </motion.button>
          </div>
        </div>

        {/* ── Special overlays ── */}
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

      {/* ── Floating hearts ── */}
      <AnimatePresence>
        {floatingHearts.map(h => (
          <motion.div key={h.id}
            initial={{ opacity: 1, y: 0, x: h.x, scale: 0.7 }}
            animate={{ opacity: 0, y: -130, x: h.x + (Math.random() * 20 - 10), scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ position: "absolute", bottom: 50, right: 20, fontSize: 18, pointerEvents: "none", zIndex: 20 }}
          >❤️</motion.div>
        ))}
      </AnimatePresence>

      {/* ════════════════════════════════════
          BACK FACE — rich profile detail panel
          ════════════════════════════════════ */}
      <motion.div
        animate={{ rotateY: flipped ? 0 : -180 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: "absolute", inset: 0,
          backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden",
          borderRadius: 18, overflow: "hidden",
          background: "rgba(7,5,14,0.98)",
          border: `1px solid ${a.glow(0.22)}`,
          boxShadow: `0 0 32px ${a.glow(0.12)}`,
        }}
      >
        {/* Blurred photo backdrop */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: 18 }}>
          <img src={profile.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(18px) brightness(0.18)", transform: "scale(1.12)" }} />
        </div>

        {/* Accent top stripe */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)` }} />

        {/* ── Scrollable content ── */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, display: "flex", flexDirection: "column", overflowY: "auto", scrollbarWidth: "none" }}>

          {/* ── HEADER: photo thumb + identity ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 12px 10px", flexShrink: 0 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img src={profile.image} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", border: `2px solid ${a.glow(0.45)}` }} />
              {isVerified && (
                <div style={{ position: "absolute", bottom: -3, right: -3, background: "rgba(74,222,128,0.95)", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid rgba(7,5,14,1)" }}>
                  <span style={{ fontSize: 8 }}>✓</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>{ghostId}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{profile.age}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 10 }}>{profile.countryFlag}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{profile.city}</span>
                {repBadge && <span style={{ fontSize: 8, fontWeight: 800, color: repBadge.color }}>{repBadge.label}</span>}
              </div>
            </div>
            {/* Close / flip back */}
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setFlipped(false)}
              style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>↩</span>
            </motion.button>
          </div>

          {/* ── Looking for ── */}
          <div style={{ padding: "0 12px 10px", flexShrink: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${a.glow(0.07)}`, border: `1px solid ${a.glow(0.2)}`, borderRadius: 50, padding: "6px 14px" }}>
              <span style={{ fontSize: 16 }}>{outcomeIcon}</span>
              <div>
                <p style={{ fontSize: 7, fontWeight: 800, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>Looking for</p>
                <p style={{ fontSize: 12, fontWeight: 900, color: a.glow(0.95), margin: 0 }}>{outcomeTag}</p>
              </div>
            </div>
          </div>

          <Divider accent={a.accent} />

          {/* ── Icebreaker ── */}
          <div style={{ padding: "10px 12px", flexShrink: 0 }}>
            <p style={{ fontSize: 8, fontWeight: 800, color: a.glow(0.55), margin: "0 0 5px", letterSpacing: "0.1em", textTransform: "uppercase" }}>💬 Icebreaker</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.55, fontStyle: "italic", fontWeight: 500 }}>
              "{icebreaker}"
            </p>
          </div>

          <Divider accent={a.accent} />

          {/* ── Bio ── */}
          <div style={{ padding: "10px 12px", flexShrink: 0 }}>
            <p style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.3)", margin: "0 0 5px", letterSpacing: "0.1em", textTransform: "uppercase" }}>About</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>
              "{bioText}"
            </p>
          </div>

          <Divider accent={a.accent} />

          {/* ── Voice note ── */}
          <div style={{ padding: "10px 12px", flexShrink: 0 }}>
            <p style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.3)", margin: "0 0 7px", letterSpacing: "0.1em", textTransform: "uppercase" }}>🎙 Voice Intro</p>
            <VoiceNotePlayer profileId={profile.id} accent={a.accent} />
          </div>

          <Divider accent={a.accent} />

          {/* ── Dream date ── */}
          {dateIdea && (
            <>
              <div style={{ padding: "10px 12px", flexShrink: 0 }}>
                <p style={{ fontSize: 8, fontWeight: 800, color: "rgba(251,191,36,0.65)", margin: "0 0 7px", letterSpacing: "0.1em", textTransform: "uppercase" }}>☀ Dream Date</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {dateIdea.image
                    ? <img src={dateIdea.image} alt={dateIdea.label} style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                    : <span style={{ fontSize: 24, flexShrink: 0 }}>{dateIdea.emoji}</span>}
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>{dateIdea.label}</p>
                    {hasDateMatch && (
                      <span style={{ fontSize: 8, fontWeight: 800, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 5, padding: "1px 6px" }}>🎯 Date match!</span>
                    )}
                  </div>
                </div>
              </div>
              <Divider accent={a.accent} />
            </>
          )}

          {/* ── Stats row ── */}
          <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Religion */}
            {profile.religion ? (
              <div style={{ flex: 1, background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.22)", borderRadius: 8, padding: "5px 8px", textAlign: "center" }}>
                <p style={{ fontSize: 8, color: "rgba(168,85,247,0.6)", margin: "0 0 1px", fontWeight: 700 }}>Faith</p>
                <p style={{ fontSize: 10, color: "rgba(168,85,247,0.9)", margin: 0, fontWeight: 800 }}>{profile.religion}</p>
              </div>
            ) : null}
            {/* Likes */}
            <div style={{ flex: 1, background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 8, padding: "5px 8px", textAlign: "center" }}>
              <p style={{ fontSize: 8, color: "rgba(236,72,153,0.55)", margin: "0 0 1px", fontWeight: 700 }}>Likes</p>
              <p style={{ fontSize: 10, color: "rgba(236,72,153,0.9)", margin: 0, fontWeight: 800 }}>❤ {likesCount}</p>
            </div>
            {/* Match score */}
            {matchScore ? (
              <div style={{ flex: 1, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 8, padding: "5px 8px", textAlign: "center" }}>
                <p style={{ fontSize: 8, color: "rgba(74,222,128,0.55)", margin: "0 0 1px", fontWeight: 700 }}>Match</p>
                <p style={{ fontSize: 10, color: "rgba(74,222,128,0.9)", margin: 0, fontWeight: 800 }}>⚡ {matchScore}%</p>
              </div>
            ) : null}
          </div>

          <Divider accent={a.accent} />

          {/* ── Activity bar ── */}
          <div style={{ padding: "10px 12px 14px", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Activity</span>
              <span style={{ fontSize: 8, fontWeight: 800, color: activity.color }}>{activity.label}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${activity.pct}%` }}
                transition={{ duration: 0.7, delay: 0.2 }}
                style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${activity.color}88, ${activity.color})`, boxShadow: `0 0 6px ${activity.color}` }}
              />
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
