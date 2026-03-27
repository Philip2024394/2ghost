import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { MapPin, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import type { GhostProfile } from "../types/ghostTypes";
import { filterContent, addStrike, getStrikes, isAccountDeactivated } from "../utils/contentFilter";
import MrButlasStaffPopup from "./MrButlasStaffPopup";
import BreakfastChefInviteSheet from "./BreakfastChefInviteSheet";
import MaidUpgradeSheet from "./MaidUpgradeSheet";
import GamesRoomInviteSheet from "./GamesRoomInviteSheet";
import JokerInviteSheet, { shouldShowJoker } from "./JokerInviteSheet";
import { sendVideoRequest, getVideoRequestStatus, profileHasVideo, readCoins, spendCoins } from "../utils/featureGating";
import { matchScoreColor } from "../utils/matchScore";
import {
  toGhostId,
  fmtKm,
  mockBio,
  getStaffPlaceholder,
} from "../utils/ghostHelpers";
import { getDateIdea } from "../data/dateIdeas";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";


const ALL_WHISPER_QUESTIONS = [
  // Thought-Provoking / Emotional
  "If my heart was warm, would it win over looks?",
  "Are you serious for the right person, or just seeing what happens?",
  "What matters more to you long-term: chemistry or consistency?",
  "Do you believe people meet for a reason or just by chance?",
  "What does a \"healthy relationship\" look like to you?",
  "What's one thing you wish people understood about you sooner?",
  // Flirty but Meaningful
  "Be honest… personality or looks first? 😄",
  "What would make you choose someone and not keep scrolling?",
  "Are you the type to fall slowly or all at once?",
  "Would you rather have butterflies or something calm and real?",
  "If we matched in real life, what would you notice first about me?",
  // Fun & Light
  "What's your idea of a perfect first date?",
  "Are you more \"stay in and chill\" or \"go out and explore\"?",
  "What's something small that instantly makes you like someone?",
  "Coffee date, dinner, or spontaneous adventure?",
  "What kind of vibe are you hoping to find here?",
  // Slightly Deep / Real Talk
  "What's something you won't compromise on in a relationship?",
  "Have you learned more from love or heartbreak?",
  "What makes you feel truly appreciated?",
  "Are you ready for something real, or just seeing where things go?",
  "What's your green flag that people usually miss?",
  // Bold / Standout
  "If we got along perfectly, would distance or timing stop you?",
  "Would you take a risk on someone different from your \"type\"?",
  "Are you here for attention… or something that could actually grow?",
  "What would make you delete this app for someone?",
];

// Pick 3 questions deterministically per profile (consistent across renders)
function getWhisperPresets(profileId: string): string[] {
  const h = idHash(profileId + "whisper");
  const result: string[] = [];
  const used = new Set<number>();
  let seed = h;
  while (result.length < 3) {
    seed = Math.abs(Math.imul(seed, 1664525) + 1013904223 | 0);
    const idx = Math.abs(seed) % ALL_WHISPER_QUESTIONS.length;
    if (!used.has(idx)) { used.add(idx); result.push(ALL_WHISPER_QUESTIONS[idx]); }
  }
  return result;
}

function idHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(37, h) + id.charCodeAt(i) | 0;
  return Math.abs(h);
}

function getMemberStars(profileId: string): number {
  // Seed 0–23 months, 1 star per 2 months, max 5 stars
  const months = idHash(profileId + "months") % 24;
  return Math.min(5, Math.floor(months / 2));
}

function isFaceVerifiedSeeded(profileId: string): boolean {
  return (idHash(profileId + "fv") % 10) < 4;
}

// Seeded portrait deadline for unverified profiles — between 1h and 35h remaining
function getSeededCountdown(profileId: string): string {
  const h = Math.abs(idHash(profileId + "deadline"));
  const msRemaining = (1 + (h % 35)) * 60 * 60 * 1000 + (h % 59) * 60 * 1000;
  const totalMin = Math.floor(msRemaining / 60_000);
  const hrs = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  return hrs === 0 ? `${mins}m` : `${hrs}h ${mins}m`;
}

function hasVoiceNote(profileId: string): boolean {
  return (idHash(profileId + "voice") % 10) < 7; // ~70% of profiles have a voice note
}

function getMatchScore(profile: GhostProfile): number {
  // Try real interests first; fall back to a seeded score so it always shows
  try {
    const myInterests: string[] = JSON.parse(localStorage.getItem("ghost_interests") || "[]");
    if (myInterests.length) {
      const profileInterests = [...(profile.interests || []), ...(profile.bio || "").split(/\s+/)];
      const setA = new Set(myInterests.map(w => w.toLowerCase()));
      const overlap = profileInterests.filter(w => setA.has(w.toLowerCase())).length;
      if (overlap) return Math.min(99, Math.round((overlap / myInterests.length) * 100) + 30);
    }
  } catch {}
  // Seeded fallback: score between 42 and 97
  return 42 + (idHash(profile.id + "match") % 56);
}

const OUTCOME_TAGS  = ["Serious", "Casual", "Discreet", "Open", "Friendship", "Adventurous", "Exploring", "Free Spirit"];
const OUTCOME_ICONS = ["💍",      "🤝",      "🤫",       "🔓",   "🌱",         "🔥",          "🌀",        "🕊️"];

const SPAM_IMG        = "https://ik.imagekit.io/7grri5v7d/spam%20in.png";
const REPORTED_IMG    = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdf.png";
const FOUND_BOO_STAMP = "https://ik.imagekit.io/7grri5v7d/Found%20Boo%20postage%20stamp%20design.png";

// ── Bestie seeded data ─────────────────────────────────────────────────────
const BESTIE_AVATARS = [
  "https://ik.imagekit.io/7grri5v7d/4i.png?updatedAt=1774012879924",
  "https://ik.imagekit.io/7grri5v7d/2q.png?updatedAt=1774012847860",
  "https://ik.imagekit.io/7grri5v7d/1as.png?updatedAt=1774009744350",
  "https://ik.imagekit.io/7grri5v7d/5q.png?updatedAt=1774013004908",
  "https://ik.imagekit.io/7grri5v7d/1a.png?updatedAt=1774012891284",
  "https://ik.imagekit.io/7grri5v7d/15a.png?updatedAt=1774012937480",
];
const BESTIE_REVIEWS = [
  "She's the realest person I know — funny, kind, and worth your time 💯",
  "I've known her for years. If she chose you, you're already lucky 🌸",
  "Don't sleep on this one. She's the one everyone talks about after the night ends 🔥",
  "She has standards. But if you make her laugh, you're halfway there 😂",
  "Most genuine girl I know. No games, no drama — just real vibes ✨",
  "If she's talking to you, it means something. She doesn't waste time 🎯",
  "My ride or die since forever. She'll show up for the right person 💕",
  "Real talk — she's the one my whole friend group ships to win 🏆",
];
const BESTIE_CITIES = ["Jakarta", "Bali", "Singapore", "Kuala Lumpur", "Manila", "Bangkok", "London", "Dubai"];

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

// ── Bestie helpers & component ───────────────────────────────────────────────
function getSeededBestie(profileId: string) {
  const h = idHash(profileId + "bestie_v1");
  const bh = idHash(profileId + "bestie_photo");
  return {
    photo:   BESTIE_AVATARS[bh % BESTIE_AVATARS.length],
    ghostId: `Guest-${1000 + (h % 9000)}`,
    review:  BESTIE_REVIEWS[h % BESTIE_REVIEWS.length],
    city:    BESTIE_CITIES[(h >> 3) % BESTIE_CITIES.length],
    age:     22 + (h % 12),
  };
}

// Card-only — sheet is rendered at top level to escape CSS transform stacking context
function BestieSection({ profile, onView }: { profile: GhostProfile; onView: () => void }) {
  const bestie = getSeededBestie(profile.id);
  return (
    <>
      <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "rgba(212,175,55,0.7)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        👯 Hotel Bestie
      </p>
      <motion.div whileTap={{ scale: 0.98 }} onClick={onView}
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
          borderRadius: 14, cursor: "pointer",
          background: "rgba(6,6,8,0.88)",
          border: "1px solid rgba(212,175,55,0.25)",
          borderTop: "1px solid rgba(212,175,55,0.4)",
          boxShadow: "inset 0 1px 0 rgba(212,175,55,0.12)",
        }}
      >
        {/* Left: avatar + badge */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <img src={bestie.photo} alt=""
            style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.35)" }}
          />
          <span style={{ fontSize: 8, fontWeight: 800, color: "#d4af37", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, padding: "2px 7px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            BESTIE
          </span>
        </div>
        {/* Center: guest ID + review */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 800, color: "#d4af37" }}>{bestie.ghostId}</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.65)", fontStyle: "italic", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {bestie.review}
          </p>
        </div>
        {/* Right: View button */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); onView(); }}
          style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 10, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.28)", color: "#d4af37", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          <span>👁</span><span>View</span>
        </motion.button>
      </motion.div>
    </>
  );
}

// Full bestie profile sheet — rendered outside any CSS transform so position:fixed works
function BestieSheet({ profile, onClose }: { profile: GhostProfile; onClose: () => void }) {
  const bestie = getSeededBestie(profile.id);
  const bestieBestie = getSeededBestie(bestie.ghostId);
  const profileGhostId = toGhostId(profile.id);
  const outcomeIdx = idHash(bestie.ghostId + "outcome") % OUTCOME_TAGS.length;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(8,8,12,0.99)", borderRadius: "20px 20px 0 0", paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))", maxHeight: "80dvh", overflowY: "auto", scrollbarWidth: "none", position: "relative" }}
      >
        {/* Red top stripe */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #e01010, transparent)", borderRadius: "20px 20px 0 0" }} />
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
        </div>
        {/* Close */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
          style={{ position: "absolute", top: 14, right: 16, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >✕</motion.button>

        <div style={{ padding: "8px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src={bestie.photo} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(212,175,55,0.5)", marginBottom: 10 }} />
          <p style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 900, color: "#d4af37" }}>{bestie.ghostId}</p>
          <p style={{ margin: "0 0 14px", fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Bestie of {profileGhostId}</p>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "rgba(255,255,255,0.8)", fontStyle: "italic", lineHeight: 1.65, textAlign: "center" }}>"{bestie.review}"</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[`📍 ${bestie.city}`, `🎂 ${bestie.age}`, `${OUTCOME_ICONS[outcomeIdx]} ${OUTCOME_TAGS[outcomeIdx]}`].map(t => (
              <span key={t} style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "4px 10px" }}>{t}</span>
            ))}
          </div>
          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 16 }} />
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "rgba(212,175,55,0.7)", textTransform: "uppercase", letterSpacing: "0.12em", alignSelf: "flex-start" }}>Her Bestie</p>
          <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(6,6,8,0.85)", border: "1px solid rgba(212,175,55,0.2)", boxShadow: "inset 0 1px 0 rgba(212,175,55,0.08)" }}>
            <img src={bestieBestie.photo} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(212,175,55,0.3)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 800, color: "#d4af37" }}>{bestieBestie.ghostId}</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.55)", fontStyle: "italic", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>{bestieBestie.review}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Combined Profile + Whisper Modal ─────────────────────────────────────────
type WhisperScreen = "main" | "sent" | "strike1" | "deactivated";

export function ProfileWhisperModal({
  profile, liked, onLike, onClose, accentColor,
}: {
  profile: GhostProfile; liked: boolean; onLike: () => void; onClose: () => void;
  accentColor?: string;
}) {
  const _a = useGenderAccent();
  const a = accentColor ? {
    ..._a,
    accent:     accentColor,
    accentMid:  accentColor,
    accentDark: accentColor,
    gradient:   `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
    glow:       (o: number) => {
      const r = parseInt(accentColor.slice(1,3),16);
      const g = parseInt(accentColor.slice(3,5),16);
      const b = parseInt(accentColor.slice(5,7),16);
      return `rgba(${r},${g},${b},${o})`;
    },
  } : _a;
  const online     = isOnline(profile.last_seen_at);
  const ghostId    = toGhostId(profile.id);
  const memberStars = getMemberStars(profile.id);
  const isVerified  = profile.isVerified || profile.faceVerified || isFaceVerifiedSeeded(profile.id);
  // Staff (no verified photo): use gender-specific hotel placeholder
  const cardImage   = !isVerified
    ? (getStaffPlaceholder(profile.gender) ?? profile.image)
    : profile.image;
  const dateIdea   = getDateIdea(profile.id, profile.firstDateIdea);
  const bioText    = profile.bio || mockBio(profile.id);

  let oh = 0;
  for (let i = 0; i < profile.id.length; i++) { oh = Math.imul(43, oh) + profile.id.charCodeAt(i) | 0; }
  const outcomeIdx  = Math.abs(oh) % OUTCOME_TAGS.length;
  const outcomeTag  = OUTCOME_TAGS[outcomeIdx];
  const outcomeIcon = OUTCOME_ICONS[outcomeIdx];

  const myDateIdea   = (() => { try { return localStorage.getItem("ghost_first_date_idea") || ""; } catch { return ""; } })();
  const hasDateMatch = myDateIdea.length > 0 && dateIdea && dateIdea.label.toLowerCase().split(/\s+/).some(w => w.length > 3 && myDateIdea.toLowerCase().includes(w));

  // ── Partner preference seeds ──────────────────────────────────────────────
  const ph = idHash(profile.id + "partner");
  const PREF_RELIGIONS = ["Muslim", "Christian", "Catholic", "Any faith", "No preference"];
  const PREF_LOCATIONS = ["Local only", "Local preferred", "Open to distance", "Anywhere"];
  const PREF_LIFESTYLE = ["Non-smoker", "Active lifestyle", "Social drinker OK", "Family-oriented"];
  const partnerReligion = PREF_RELIGIONS[ph % PREF_RELIGIONS.length];
  const partnerLocation = PREF_LOCATIONS[(ph >> 3) % PREF_LOCATIONS.length];
  const partnerLifestyle = PREF_LIFESTYLE[(ph >> 6) % PREF_LIFESTYLE.length];
  const ageMin = Math.max(18, profile.age - 4 - (ph % 5));
  const ageMax = Math.min(65, profile.age + 6 + (ph % 8));

  // ── Preferred first contact (seeded for mock profiles) ───────────────────
  const fcH = idHash(profile.id + "fc");
  const FC_OPTS  = ["chat", "video", "outside"] as const;
  const FC_W     = [5, 3, 2]; // 50% chat, 30% video, 20% outside
  let fcAcc = 0; let fcSeeded: "chat" | "video" | "outside" = "chat";
  const fcPick = Math.abs(fcH) % FC_W.reduce((a, b) => a + b, 0);
  for (let i = 0; i < FC_OPTS.length; i++) { fcAcc += FC_W[i]; if (fcPick < fcAcc) { fcSeeded = FC_OPTS[i]; break; } }
  const resolvedContactPref = (profile.contactPref as "chat" | "video" | "outside" | null | undefined) ?? fcSeeded;

  const FC_META = {
    chat:    { emoji: "💬", label: "Guest Chat First",   sub: "Anonymous in-app chat",          coinCost: 0,  color: "#4ade80" },
    video:   { emoji: "🎬", label: "Video Intro First",  sub: "Short personal video first",      coinCost: 5,  color: "#e01010" },
    outside: { emoji: "📱", label: "Meet Outside First", sub: "WhatsApp + book a real date",     coinCost: 50, color: "#f59e0b" },
  } as const;

  // ── Photo thumbnail state ─────────────────────────────────────────────────
  const [activeThumb, setActiveThumb] = useState(0);
  const [outsideStatus, setOutsideStatus] = useState<"idle" | "pending" | "done">("idle");
  const [showReport, setShowReport]       = useState(false);
  const [showBestieSheet, setShowBestieSheet] = useState(false);
  const [reportReason, setReportReason]   = useState("");
  const [reporterId, setReporterId]       = useState("");
  const [reporterWA, setReporterWA]       = useState("");
  const [reportExplanation, setReportExplanation] = useState("");
  const PHOTO_CROPS = ["center 8%", "center 32%", "center 58%", "center 85%"] as const;

  // ── Whisper state ────────────────────────────────────────────────────────
  const [screen, setScreen]         = useState<WhisperScreen>("main");
  const [selected, setSelected]     = useState<string | null>(null);
  const [custom, setCustom]         = useState("");
  const [useCustom, setUseCustom]   = useState(false);
  const [filterReason, setFilterReason] = useState("");
  const currentStrikes = getStrikes();

  // ── Video intro state ─────────────────────────────────────────────────────
  profileHasVideo(profile.id); // side-effect: warms cache
  const _existingVR = getVideoRequestStatus(profile.id);
  const [videoStatus, setVideoStatus] = useState<"idle" | "requesting" | "pending" | "approved" | "denied">(
    _existingVR ? (_existingVR.status as "pending" | "approved" | "denied") : "idle"
  );
  const [videoRequesting, setVideoRequesting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const text = useCustom ? custom.trim() : selected ?? "";
    if (!text) return;
    const result = filterContent(text);
    if (result.blocked) {
      const newStrikes = addStrike();
      setFilterReason(result.reason ?? "policy violation");
      setScreen(newStrikes >= 2 || isAccountDeactivated() ? "deactivated" : "strike1");
      return;
    }
    try { localStorage.setItem(`ghost_icebreaker_${profile.id}`, JSON.stringify({ question: text, sentAt: Date.now() })); } catch {}
    setScreen("sent");
  };

  const isCustomBlocked = useCustom && filterContent(custom.trim()).blocked;
  const canSend = !isCustomBlocked && (useCustom ? custom.trim().length >= 5 : !!selected);

  const handleVideoRequest = () => {
    if (videoRequesting) return;
    setVideoRequesting(true);
    const ok = sendVideoRequest(profile.id, "me");
    if (!ok) { setVideoRequesting(false); return; }
    setTimeout(() => {
      const autoApprove = Math.abs(profile.id.charCodeAt(0)) % 3 === 0;
      setVideoStatus(autoApprove ? "approved" : "pending");
      setVideoRequesting(false);
    }, 1800);
  };

  // ── Sent screen ───────────────────────────────────────────────────────────
  if (screen === "sent") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: "100%", maxWidth: 480, background: "#0d0d0f", borderRadius: "24px 24px 0 0", padding: "36px 24px 52px", textAlign: "center", border: `1px solid ${a.glow(0.2)}`, borderBottom: "none" }}>
          <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)`, borderRadius: 2, marginBottom: 28 }} />
          <img src={cardImage} alt={profile.name} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${a.glow(0.5)}`, marginBottom: 14, boxShadow: `0 0 20px ${a.glow(0.35)}` }} />
          <p style={{ fontSize: 20, fontWeight: 800, color: a.accent, margin: "0 0 8px" }}>Question Sent 👻</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 28px", lineHeight: 1.5 }}>
            {profile.name} will see it when they open the match. If they reply, you'll both unlock the conversation naturally.
          </p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
            style={{ width: "100%", height: 50, borderRadius: 50, border: "none", background: `linear-gradient(135deg,${a.accent},${a.accentMid})`, color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
            Back to Feed
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Deactivated screen ────────────────────────────────────────────────────
  if (screen === "deactivated") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: "100%", maxWidth: 480, background: "#0d0d0f", borderRadius: "24px 24px 0 0", padding: "32px 24px 48px", border: "1px solid rgba(239,68,68,0.3)", borderBottom: "none" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚫</div>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#ef4444", margin: "0 0 8px" }}>Account Deactivated</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>You attempted to share <strong style={{ color: "rgba(255,255,255,0.8)" }}>{filterReason}</strong> twice against Ghost House policy.</p>
          </div>
          <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: "0 0 6px" }}>Why we do this</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>Contact info is shared only after both parties agree — that's the deal.</p>
          </div>
          <button style={{ width: "100%", height: 50, borderRadius: 50, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 12 }}>Reinstate Account — Pay Fee</button>
          <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "8px 0" }}>Close</button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Strike 1 screen ───────────────────────────────────────────────────────
  if (screen === "strike1") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: "100%", maxWidth: 480, background: "#0d0d0f", borderRadius: "24px 24px 0 0", padding: "32px 24px 48px", border: "1px solid rgba(251,146,60,0.3)", borderBottom: "none" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fb923c", margin: "0 0 6px" }}>Policy Violation — Strike 1 of 2</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>We detected a <strong style={{ color: "#fb923c" }}>{filterReason}</strong> in your question.</p>
          </div>
          <div style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", margin: "0 0 8px" }}>Ghost House Rule</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.65 }}>No phone numbers, links, or social handles. One more violation = <strong style={{ color: "#ef4444" }}>permanent deactivation</strong>.</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
            {[1, 2].map(n => <div key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: n <= currentStrikes ? "#ef4444" : "rgba(255,255,255,0.08)" }} />)}
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "right", margin: "4px 0 20px", fontWeight: 700 }}>{currentStrikes}/2 strikes</p>
          <button onClick={() => { setCustom(""); setSelected(null); setUseCustom(false); setScreen("main"); }}
            style={{ width: "100%", height: 50, borderRadius: 50, border: "none", background: "linear-gradient(135deg,#fb923c,#ef4444)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", marginBottom: 10 }}>
            I Understand — Edit My Question
          </button>
          <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "8px 0" }}>Skip for now</button>
        </motion.div>
      </motion.div>
    );
  }

  // ── Main: profile details + whisper ──────────────────────────────────────
  return (
    <>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%", scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: "100%", scale: 0.96 }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(5,5,10,0.99)", borderRadius: "22px 22px 0 0", border: `1px solid ${a.glow(0.22)}`, borderBottom: "none", maxHeight: "94dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Accent stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)`, flexShrink: 0 }} />

        {/* Scrollable */}
        <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" } as React.CSSProperties}>

          {/* ── Main Photo (4:5) ── */}
          <div style={{ position: "relative", width: "100%", aspectRatio: "4/5", flexShrink: 0 }}>
            {/* Blurred bg */}
            <img src={cardImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "blur(28px) brightness(0.25)", transform: "scale(1.1)" }} />
            {/* Active photo crop */}
            <AnimatePresence mode="wait">
              <motion.img
                key={activeThumb}
                initial={{ opacity: 0.7, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.7 }}
                transition={{ duration: 0.22 }}
                src={cardImage}
                alt={ghostId}
                style={{ position: "relative", width: "100%", height: "100%", objectFit: "cover", display: "block", objectPosition: PHOTO_CROPS[activeThumb] }}
                onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
            </AnimatePresence>
            {/* Bottom gradient */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(5,5,10,1) 0%, rgba(5,5,10,0.4) 35%, transparent 60%)" }} />

            {/* Match score + ✕ Close — top right */}
            <div style={{ position: "absolute", top: 12, right: 12, zIndex: 3, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 10px", border: `1px solid ${a.glow(0.45)}`, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: a.accent, letterSpacing: "0.04em" }}>{getMatchScore(profile)}%</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>match</span>
              </div>
              <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
                style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <span style={{ fontSize: 15, color: "rgba(255,255,255,0.7)" }}>✕</span>
              </motion.button>
            </div>

            {/* Verified — top left */}
            {isVerified && (
              <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 5, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "4px 10px", border: `1px solid ${a.glow(0.45)}`, zIndex: 3 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: a.glow(0.9), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 8, fontWeight: 900, color: "#fff" }}>✓</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 800, color: a.accent }}>Verified</span>
              </div>
            )}

            {/* ♥ Like — bottom right on image */}
            <motion.button whileTap={{ scale: 0.85 }} onClick={onLike}
              style={{ position: "absolute", bottom: 14, right: 14, zIndex: 3, width: 44, height: 44, borderRadius: "50%", background: liked ? a.glow(0.4) : "rgba(0,0,0,0.6)", border: liked ? `2px solid ${a.accent}` : "2px solid rgba(255,255,255,0.25)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: liked ? "default" : "pointer", boxShadow: liked ? `0 0 16px ${a.glow(0.55)}` : "0 2px 10px rgba(0,0,0,0.5)" }}>
              <span style={{ fontSize: 20, color: "#fff", lineHeight: 1 }}>{liked ? "♥" : "♡"}</span>
            </motion.button>

            {/* 🎙 Voice player overlay — above ghost ID */}
            {hasVoiceNote(profile.id) && (
              <div style={{ position: "absolute", bottom: 80, left: 14, right: 62, zIndex: 3 }}>
                <VoiceNotePlayer profileId={profile.id} accent={a.accent} />
              </div>
            )}

            {/* ID · Age · Flag · City — bottom left */}
            <div style={{ position: "absolute", bottom: 14, left: 14, zIndex: 3 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}>{ghostId}</span>
                {memberStars > 0 && <span style={{ fontSize: 9, letterSpacing: "0.05em", color: "#d4af37" }}>{"★".repeat(memberStars)}</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {online && <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.4, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: "50%", background: a.accent, boxShadow: `0 0 5px ${a.glow(0.8)}` }} />}
                <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>{profile.age}</span>
                <span style={{ fontSize: 14 }}>{profile.countryFlag}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>{profile.city}</span>
              </div>
            </div>
          </div>

          {/* ── 4 Thumbnails ── */}
          <div style={{ display: "flex", gap: 6, padding: "10px 14px 4px" }}>
            {PHOTO_CROPS.map((crop, i) => (
              <motion.div key={i} whileTap={{ scale: 0.92 }} onClick={() => setActiveThumb(i)}
                style={{ flex: 1, aspectRatio: "3/4", borderRadius: 10, overflow: "hidden", cursor: "pointer", border: activeThumb === i ? `2px solid ${a.accent}` : "2px solid rgba(255,255,255,0.1)", boxShadow: activeThumb === i ? `0 0 10px ${a.glow(0.5)}` : "none", transition: "border-color 0.15s, box-shadow 0.15s" }}>
                <img src={cardImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: crop }} />
              </motion.div>
            ))}
          </div>

          {/* ── Bio ── */}
          <div style={{ padding: "14px 16px 4px" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.65, fontStyle: "italic" }}>"{bioText}"</p>
          </div>

          {/* ══════════ MY IDEAL DATE ══════════════════════════════════════ */}
          {dateIdea && (
            <>
              <Divider />
              <div style={{ padding: "16px 16px 18px" }}>
                <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(251,191,36,0.7)", margin: "0 0 10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>☀ My Ideal Date</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 5px", letterSpacing: "-0.01em" }}>{dateIdea.label}</p>
                {dateIdea.desc && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 14px", lineHeight: 1.55 }}>{dateIdea.desc}</p>}
                {hasDateMatch && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: a.glow(0.1), border: `1px solid ${a.glow(0.3)}`, borderRadius: 20, padding: "4px 12px", marginBottom: 12 }}>
                    <span style={{ fontSize: 11 }}>🎯</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: a.accent }}>You both want this date!</span>
                  </div>
                )}
                {dateIdea.image
                  ? <img src={dateIdea.image} alt={dateIdea.label} style={{ width: "100%", borderRadius: 16, objectFit: "cover", height: 160, display: "block" }} />
                  : <div style={{ width: "100%", height: 120, borderRadius: 16, background: a.glow(0.06), border: `1px solid ${a.glow(0.15)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>{dateIdea.emoji}</div>
                }
              </div>
            </>
          )}

          {/* ══════════ I'M HERE FOR ═══════════════════════════════════════ */}
          <Divider />
          <div style={{ padding: "16px 16px 18px" }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: a.glow(0.6), margin: "0 0 10px", letterSpacing: "0.12em", textTransform: "uppercase", textAlign: "center" }}>I'm Here For</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: a.glow(0.95), margin: "0 0 16px", textAlign: "center" }}>{outcomeIcon} {outcomeTag}</p>
            {/* Partner preferences */}
            <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", margin: "0 0 10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>My partner should be</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: "🙏", label: "Religion", value: partnerReligion },
                { icon: "📍", label: "Location", value: partnerLocation },
                { icon: "🎂", label: "Age range", value: `${ageMin} – ${ageMax} years` },
                { icon: "✨", label: "Lifestyle", value: partnerLifestyle },
                ...(profile.religion ? [{ icon: "🕌", label: "My faith", value: profile.religion }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "9px 12px" }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{row.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", minWidth: 66 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ══════════ PREFERRED FIRST MOVE ════════════════════════════════ */}
          <Divider />
          <div style={{ padding: "16px 16px 18px" }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", margin: "0 0 12px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              👋 Preferred First Move
            </p>

            {/* All 3 options — their pick highlighted */}
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
              {(["chat", "video", "outside"] as const).map(key => {
                const m = FC_META[key];
                const active = resolvedContactPref === key;
                return (
                  <div key={key} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 13px", borderRadius: 12,
                    background: active ? `${m.color}10` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${active ? `${m.color}38` : "rgba(255,255,255,0.06)"}`,
                  }}>
                    <span style={{ fontSize: 17, opacity: active ? 1 : 0.28 }}>{m.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: active ? m.color : "rgba(255,255,255,0.28)" }}>
                        {m.label}
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.22)" }}>{m.sub}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: m.coinCost === 0 ? "#4ade80" : "#d4af37" }}>
                        {m.coinCost === 0 ? "Free" : `🪙${m.coinCost}`}
                      </span>
                      {active && (
                        <span style={{ fontSize: 9, fontWeight: 900, color: m.color }}>Their pick ✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action button for their preferred method */}
            {resolvedContactPref === "chat" && (
              <motion.button whileTap={{ scale: 0.97 }}
                style={{ width: "100%", height: 46, borderRadius: 14, border: "1px solid rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.08)", color: "#4ade80", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span>💬</span><span>Start Chat in Vault</span><span style={{ fontSize: 11, opacity: 0.5 }}>· Free</span>
              </motion.button>
            )}
            {resolvedContactPref === "video" && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleVideoRequest} disabled={videoRequesting || readCoins() < 5}
                style={{ width: "100%", height: 46, borderRadius: 14, border: `1px solid ${a.glow(readCoins() >= 5 ? 0.35 : 0.1)}`, background: readCoins() >= 5 ? a.glow(0.08) : "rgba(255,255,255,0.03)", color: readCoins() >= 5 ? a.accent : "rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 800, cursor: readCoins() >= 5 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {videoRequesting
                  ? <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>Sending request…</motion.span>
                  : <><span>🎬</span><span>Request Video Introduction</span><span style={{ fontSize: 11, opacity: 0.6 }}>· 🪙5</span></>}
              </motion.button>
            )}
            {resolvedContactPref === "outside" && (
              outsideStatus === "idle" ? (
                <motion.button whileTap={{ scale: 0.97 }}
                  disabled={readCoins() < 50}
                  onClick={() => {
                    if (!spendCoins(50)) return;
                    setOutsideStatus("pending");
                    setTimeout(() => {
                      setOutsideStatus(idHash(profile.id) % 2 === 0 ? "done" : "pending");
                    }, 2200);
                  }}
                  style={{ width: "100%", height: 46, borderRadius: 14, border: `1px solid ${readCoins() >= 50 ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.08)"}`, background: readCoins() >= 50 ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.03)", color: readCoins() >= 50 ? "#f59e0b" : "rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 800, cursor: readCoins() >= 50 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span>📱</span><span>Request WhatsApp + Book Date</span><span style={{ fontSize: 11, opacity: 0.6 }}>· 🪙50</span>
                </motion.button>
              ) : outsideStatus === "pending" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(245,158,11,0.06)", borderRadius: 12, border: "1px solid rgba(245,158,11,0.2)" }}>
                  <span style={{ fontSize: 20 }}>📬</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff" }}>Request sent</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>You'll receive their WhatsApp number in your Vault if they accept.</p>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(245,158,11,0.08)", borderRadius: 12, border: "1px solid rgba(245,158,11,0.3)" }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#f59e0b" }}>Accepted — check your Vault</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Their WhatsApp number is waiting in your private Vault room.</p>
                  </div>
                </div>
              )
            )}
          </div>

          {/* ══════════ INTRODUCTION VIDEO ══════════════════════════════════ */}
          <Divider />
          <div style={{ padding: "16px 16px 18px" }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", margin: "0 0 6px", letterSpacing: "0.12em", textTransform: "uppercase" }}>🎬 Introduction Video</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.01em" }}>Private Vault Video</p>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 13px", marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
                Some members choose to share a short personal intro video — only released to your Vault if they approve.{" "}
                <span style={{ color: "rgba(255,255,255,0.3)" }}>Note: choosing not to send one doesn't mean she's not open to connecting — some are just a little nervous.</span>
              </p>
            </div>

            {videoStatus === "idle" && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleVideoRequest} disabled={videoRequesting || readCoins() < 5}
                style={{ width: "100%", height: 46, borderRadius: 14, border: `1px solid ${a.glow(readCoins() >= 5 ? 0.35 : 0.1)}`, background: readCoins() >= 5 ? a.glow(0.1) : "rgba(255,255,255,0.03)", color: readCoins() >= 5 ? a.accent : "rgba(255,255,255,0.2)", fontSize: 13, fontWeight: 800, cursor: readCoins() >= 5 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
                {videoRequesting
                  ? <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>Sending request…</motion.span>
                  : <><span>🎬</span><span>Request Video Introduction</span><span style={{ fontSize: 11, opacity: 0.6 }}>· 5 coins</span></>}
              </motion.button>
            )}
            {videoStatus === "pending" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: 20 }}>📬</span>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff" }}>Request sent</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>You'll receive a Vault notification if they approve.</p>
                </div>
              </div>
            )}
            {videoStatus === "approved" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: a.glow(0.07), borderRadius: 12, border: `1px solid ${a.glow(0.25)}` }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: a.accent }}>Approved — check your Vault</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>The video is waiting for you in your private Vault room.</p>
                </div>
              </div>
            )}
            {videoStatus === "denied" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 20 }}>🔒</span>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>Kept private for now</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>They chose not to share their video intro at this time.</p>
                </div>
              </div>
            )}
          </div>

          {/* ══════════ SEND A WHISPER ══════════════════════════════════════ */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${a.glow(0.35)}, transparent)` }} />
          <div style={{ padding: "20px 16px 32px" }}>
            <p style={{ fontSize: 9, fontWeight: 800, color: a.glow(0.5), margin: "0 0 6px", letterSpacing: "0.12em", textTransform: "uppercase" }}>👻 Send a Whisper</p>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 16px", letterSpacing: "-0.01em" }}>One opening question</p>

            <div style={{ background: a.glow(0.04), border: `1px solid ${a.glow(0.12)}`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🔒</span>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.55 }}>No phone numbers, links, or social handles. Contact details shared only after mutual unlock. 2 violations = deactivated.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              {getWhisperPresets(profile.id).map(q => (
                <button key={q} onClick={() => { setSelected(q); setUseCustom(false); }}
                  style={{ textAlign: "left", padding: "12px 14px", borderRadius: 12, background: selected === q && !useCustom ? a.glow(0.12) : "rgba(255,255,255,0.04)", border: selected === q && !useCustom ? `1px solid ${a.glow(0.4)}` : "1px solid rgba(255,255,255,0.07)", color: selected === q && !useCustom ? a.accent : "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: selected === q && !useCustom ? 700 : 500, cursor: "pointer", lineHeight: 1.4 }}>
                  {q}
                </button>
              ))}
            </div>

            <button onClick={() => { setUseCustom(true); setSelected(null); setTimeout(() => inputRef.current?.focus(), 50); }}
              style={{ width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: 12, background: useCustom ? "rgba(220,20,20,0.08)" : "rgba(255,255,255,0.03)", border: useCustom ? "1px solid rgba(220,20,20,0.35)" : "1px solid rgba(255,255,255,0.06)", color: useCustom ? "rgba(220,20,20,0.9)" : "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: useCustom ? 8 : 0 }}>
              ✏️ Write my own question
            </button>
            <AnimatePresence>
              {useCustom && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                  <textarea ref={inputRef} value={custom} onChange={e => setCustom(e.target.value)} maxLength={160} placeholder="Type a genuine question…" rows={3}
                    style={{ width: "100%", borderRadius: 12, padding: "12px 14px", boxSizing: "border-box", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, border: isCustomBlocked ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)", outline: "none", resize: "none", lineHeight: 1.5, marginTop: 8 }} />
                  {isCustomBlocked && <p style={{ fontSize: 11, color: "#ef4444", margin: "4px 0 0 4px", fontWeight: 700 }}>⚠️ {filterContent(custom.trim()).reason} detected</p>}
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "4px 0 0", textAlign: "right" }}>{custom.length}/160</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Hotel Games Room ── */}
          <div style={{ margin: "0 16px 20px" }}>
            <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>🎮 Hotel Games Room</p>

            {/* Connect 4 — standard game on every profile */}
            <Link
              to="/games/connect4"
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 11, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", textDecoration: "none", marginBottom: 10 }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>🔴</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>Connect 4</p>
                <p style={{ margin: "1px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Hotel standard game · Chat opens as you play</p>
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>→</span>
            </Link>

            {/* Butler suggestion */}
            <div style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 11, background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.18)" }}>
              <img src="https://ik.imagekit.io/7grri5v7d/werwerwer-removebg-preview.png" alt="" style={{ width: 30, height: 30, objectFit: "contain", flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
                <span style={{ color: "#d4af37", fontWeight: 800 }}>The Butler suggests —</span> rather than an opening question, consider inviting <span style={{ color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>{toGhostId(profile.id)}</span> to a game. The chat room opens as you play — a natural way to connect before you reveal yourself.
              </p>
            </div>
          </div>

          {/* ── Hotel Bestie ── */}
          <div style={{ margin: "0 16px 20px" }}>
            <BestieSection profile={profile} onView={() => setShowBestieSheet(true)} />
          </div>
        </div>

        {/* ── Sticky footer ── */}
        <div style={{ flexShrink: 0, padding: "12px 16px max(20px, env(safe-area-inset-bottom, 20px))", borderTop: `1px solid ${a.glow(0.12)}`, background: "rgba(5,5,10,0.98)", display: "flex", gap: 10, alignItems: "center" }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSend} disabled={!canSend}
            style={{ flex: 1, height: 52, borderRadius: 14, border: "none", background: canSend ? `linear-gradient(135deg,${a.accent},${a.accentMid})` : "rgba(255,255,255,0.06)", color: canSend ? "#000" : "rgba(255,255,255,0.2)", fontSize: 15, fontWeight: 800, cursor: canSend ? "pointer" : "default", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span>👻</span><span>Send Whisper</span>
          </motion.button>
          <motion.button whileTap={{ scale: 0.92 }}
            onClick={() => setShowReport(true)}
            style={{ width: 52, height: 52, borderRadius: 14, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>

    {/* ── Profile Report Page ── */}
    <AnimatePresence>
      {showReport && (
        <motion.div
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/sdfsdfssssdfsdfshkhj.png?updatedAt=1774292956820)",
            backgroundSize: "cover", backgroundPosition: "center top",
            display: "flex", flexDirection: "column",
            maxWidth: 480, margin: "0 auto",
          }}
        >
          {/* Dark overlay so text is readable */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 0 }} />

          {/* Content */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>

            {/* Header */}
            <div style={{ flexShrink: 0, padding: "env(safe-area-inset-top,16px) 20px 0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 16px" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>Profile Reporting</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Reported to The Butler</p>
                </div>
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => { setShowReport(false); setReportReason(""); setReporterId(""); setReporterWA(""); setReportExplanation(""); }}
                  style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.6)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ✕
                </motion.button>
              </div>
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.5), transparent)", marginBottom: 20 }} />
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "0 20px" }}>

              {/* Intro text */}
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.75 }}>
                You have initiated a report against <span style={{ color: "#fff", fontWeight: 700 }}>{toGhostId(profile.id)}</span>. I ask that you select the most applicable violation below. Every report within this hotel is taken with the utmost seriousness — proper steps will follow. I would also remind you that false or malicious reports are treated with equal gravity. Reflect carefully before you submit.
              </p>

              {/* Violations */}
              <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Select Violation</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {[
                  { key: "fake",        icon: "🎭", label: "Fake profile or catfishing" },
                  { key: "explicit",    icon: "🔞", label: "Indecent or explicit content shared" },
                  { key: "harassment",  icon: "🛑", label: "Harassment or threatening behaviour" },
                  { key: "spam",        icon: "📵", label: "Spam or unsolicited mass messaging" },
                  { key: "noshow",      icon: "📅", label: "Accepted a date and did not appear" },
                  { key: "underage",    icon: "⚠️", label: "Suspected underage guest" },
                  { key: "scam",        icon: "💸", label: "Scam, soliciting money or gifts" },
                  { key: "hate",        icon: "🚫", label: "Hate speech or discriminatory language" },
                  { key: "contact",     icon: "🔓", label: "Shared contact details before mutual unlock" },
                  { key: "impersonate", icon: "👤", label: "Impersonating another person or celebrity" },
                  { key: "other",       icon: "📋", label: "Other — does not comply with Hotel Rules" },
                ].map(r => (
                  <button key={r.key} onClick={() => setReportReason(r.key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                      borderRadius: 12, cursor: "pointer", textAlign: "left",
                      background: reportReason === r.key ? "rgba(239,68,68,0.14)" : "rgba(255,255,255,0.04)",
                      border: reportReason === r.key ? "1px solid rgba(239,68,68,0.55)" : "1px solid rgba(255,255,255,0.08)",
                      color: reportReason === r.key ? "#f87171" : "rgba(255,255,255,0.65)",
                      fontSize: 13, fontWeight: reportReason === r.key ? 700 : 500,
                    }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{r.icon}</span>
                    <span>{r.label}</span>
                    {reportReason === r.key && <span style={{ marginLeft: "auto", fontSize: 12 }}>✓</span>}
                  </button>
                ))}
              </div>

              {/* Your ID */}
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Your Guest ID</p>
              <input
                value={reporterId}
                onChange={e => setReporterId(e.target.value)}
                placeholder="e.g. #GH-00421"
                style={{
                  width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 13, outline: "none", marginBottom: 16,
                }}
              />

              {/* WhatsApp */}
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Your WhatsApp Number</p>
              <input
                value={reporterWA}
                onChange={e => setReporterWA(e.target.value)}
                placeholder="+62 812 3456 7890"
                type="tel"
                style={{
                  width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 13, outline: "none", marginBottom: 16,
                }}
              />

              {/* Explanation */}
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Explanation</p>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <textarea
                  value={reportExplanation}
                  onChange={e => setReportExplanation(e.target.value.slice(0, 500))}
                  placeholder="Describe what happened in detail..."
                  rows={4}
                  style={{
                    width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: 13, outline: "none", resize: "none",
                    lineHeight: 1.6, fontFamily: "inherit",
                  }}
                />
                <p style={{ margin: "4px 0 0", textAlign: "right", fontSize: 10, color: reportExplanation.length >= 490 ? "#f87171" : "rgba(255,255,255,0.25)" }}>
                  {reportExplanation.length} / 500
                </p>
              </div>

              {/* Disclaimer */}
              <p style={{ margin: "0 0 24px", fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.65 }}>
                By submitting this report you confirm the information provided is accurate to the best of your knowledge. False or malicious reports may result in action being taken against your own account. All reports are reviewed by hotel management.
              </p>
            </div>

            {/* Sticky footer */}
            <div style={{ flexShrink: 0, padding: "14px 20px max(28px,env(safe-area-inset-bottom,28px))", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(0,0,0,0.6)" }}>
              <motion.button whileTap={{ scale: 0.97 }}
                disabled={!reportReason}
                onClick={() => {
                  if (!reportReason) return;
                  try {
                    const r = JSON.parse(localStorage.getItem("ghost_reports") || "[]");
                    r.push({ profileId: profile.id, ghostId: toGhostId(profile.id), reason: reportReason, reporterId, reporterWA, explanation: reportExplanation, reportedAt: Date.now() });
                    localStorage.setItem("ghost_reports", JSON.stringify(r));
                  } catch {}
                  setShowReport(false);
                  setReportReason("");
                  setReporterId("");
                  setReporterWA("");
                  setReportExplanation("");
                }}
                style={{
                  width: "100%", height: 52, borderRadius: 50, border: "none",
                  background: reportReason ? "linear-gradient(135deg, #b91c1c, #7f1d1d)" : "rgba(255,255,255,0.07)",
                  color: reportReason ? "#fff" : "rgba(255,255,255,0.25)",
                  fontSize: 15, fontWeight: 900, cursor: reportReason ? "pointer" : "default",
                  boxShadow: reportReason ? "0 4px 20px rgba(127,29,29,0.5)" : "none",
                }}>
                Submit Report to The Butler
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* ── Bestie Sheet — outside transform so position:fixed works ── */}
    <AnimatePresence>
      {showBestieSheet && (
        <BestieSheet profile={profile} onClose={() => setShowBestieSheet(false)} />
      )}
    </AnimatePresence>
    </>
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────
export default function GhostCard({
  profile, liked, onClick, onLike, isRevealed: _isRevealed, onReveal: _onReveal, canReveal: _canReveal, isTonight, houseTier: _houseTier,
  flaggedReason, onFlagOpen: _onFlagOpen, isFoundBoo, accentColor, onGameInvite, startExpanded, onModalClose,
}: {
  profile: GhostProfile; liked: boolean; onClick: () => void; onLike?: () => void;
  isRevealed: boolean; onReveal: () => void; canReveal: boolean;
  isTonight?: boolean; houseTier?: "gold" | "suite" | null;
  flaggedReason?: string; onFlagOpen?: () => void;
  isFoundBoo?: boolean;
  accentColor?: string;
  onGameInvite?: (profile: GhostProfile) => void;
  startExpanded?: boolean;
  onModalClose?: () => void;
}) {
  const _a = useGenderAccent();
  // When a room accent is provided, override the gender accent throughout the card
  const a = accentColor ? {
    ..._a,
    accent:     accentColor,
    accentMid:  accentColor,
    accentDark: accentColor,
    gradient:   `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
    glow:       (o: number) => {
      const r = parseInt(accentColor.slice(1,3),16);
      const g = parseInt(accentColor.slice(3,5),16);
      const b = parseInt(accentColor.slice(5,7),16);
      return `rgba(${r},${g},${b},${o})`;
    },
  } : _a;
  const online    = isOnline(profile.last_seen_at);
  const ghostId   = toGhostId(profile.id);
  const [expanded, setExpanded] = useState(startExpanded ?? false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isVerified  = profile.isVerified || profile.faceVerified || isFaceVerifiedSeeded(profile.id);
  const loungeDiscovered = (() => { try { return localStorage.getItem("breakfast_lounge_unlocked") === "true"; } catch { return false; } })();
  const gamesDiscovered  = (() => { try { return localStorage.getItem("games_room_unlocked") === "true"; } catch { return false; } })();
  const roomsDiscovered  = (() => { try { return localStorage.getItem("rooms_unlocked") === "true"; } catch { return false; } })();

  const isMaleUnverified = !isVerified && profile.gender !== "Female";
  // Always show personas — discovery flags no longer suppress them
  const isChefProfile  = isMaleUnverified && (idHash(profile.id + "persona") % 2 === 0);
  const isGamesProfile = isMaleUnverified && !isChefProfile;
  // Joker: female unverified, timing/balance based — takes priority over Maid
  const isJokerProfile = !isVerified && profile.gender === "Female" && shouldShowJoker(profile.id, readCoins());
  const isMaidProfile  = !isVerified && profile.gender === "Female" && !isJokerProfile;

  const GAMES_BOY_IMG = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasddsdssdfs.png?updatedAt=1774487538945";
  const JOKER_CARD_IMG = "https://ik.imagekit.io/7grri5v7d/Untitleddsfsdfsdf.png";
  const cardImage = !isVerified
    ? (isJokerProfile  ? JOKER_CARD_IMG
      : isGamesProfile ? GAMES_BOY_IMG
      : getStaffPlaceholder(profile.gender) ?? profile.image)
    : profile.image;
  const heartColor  = "#e01010";
  // Online ring is green — universal live presence signal
  const onlineRing  = { color: "rgba(74,222,128,0.85)", glow: "rgba(74,222,128,0.4)" };
  // Staff persona frame — each role gets a distinctive color
  const personaFrame = isChefProfile  ? { color: "#f97316", glow: "rgba(249,115,22,0.55)"  }
                     : isGamesProfile ? { color: "#22d3ee", glow: "rgba(34,211,238,0.55)"  }
                     : isMaidProfile  ? { color: "#c084fc", glow: "rgba(192,132,252,0.55)" }
                     : isJokerProfile ? { color: "#ec4899", glow: "rgba(236,72,153,0.55)"  }
                     : null;

  // Floating hearts
  const heartIdRef = useRef(0);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number }[]>([]);
  const [staffLimitedOpen, setStaffLimitedOpen] = useState(false);
  const [chefInviteOpen,   setChefInviteOpen]   = useState(false);
  const [maidUpgradeOpen,  setMaidUpgradeOpen]  = useState(false);
  const [gamesInviteOpen,  setGamesInviteOpen]  = useState(false);
  const [jokerOpen,        setJokerOpen]         = useState(false);

  const handleUnverifiedTap = () => {
    if (isJokerProfile)      { setJokerOpen(true); }
    else if (isChefProfile)  { setChefInviteOpen(true); }
    else if (isGamesProfile) { setGamesInviteOpen(true); }
    else if (isMaidProfile)  { setMaidUpgradeOpen(true); }
    else { setStaffLimitedOpen(true); }
  };

  const triggerHearts = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isVerified) { handleUnverifiedTap(); return; }
    if (liked) return;
    onLike?.();
    const newHearts = Array.from({ length: 6 }, () => ({ id: ++heartIdRef.current, x: Math.random() * 60 - 30 }));
    setFloatingHearts(prev => [...prev, ...newHearts]);
    setTimeout(() => setFloatingHearts(prev => prev.filter(h => !newHearts.find(n => n.id === h.id))), 1800);
  };

  const handleFingerprintClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isVerified) { handleUnverifiedTap(); return; }
    setExpanded(true);
  };

  return (
    <>
      {/* ── Card ── */}
      <div ref={cardRef} style={{ borderRadius: 18, position: "relative", aspectRatio: "3/4" }}>

        {/* Online ring — green, only for regular online guests (not staff personas) */}
        {online && !personaFrame && (
          <>
            <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.4, repeat: Infinity }}
              style={{ position: "absolute", inset: -4, borderRadius: 21, border: `2px solid ${onlineRing.color}`, boxShadow: `0 0 14px ${onlineRing.glow}`, pointerEvents: "none", zIndex: 10 }} />
            <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 1.4, repeat: Infinity, delay: 0.2 }}
              style={{ position: "absolute", inset: -9, borderRadius: 25, border: `1.5px solid ${onlineRing.color}`, pointerEvents: "none", zIndex: 9 }} />
          </>
        )}

        {/* Staff persona frame — unique color per role, always visible */}
        {personaFrame && (
          <>
            <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.1, repeat: Infinity }}
              style={{ position: "absolute", inset: -4, borderRadius: 21, border: `2px solid ${personaFrame.color}`, boxShadow: `0 0 20px ${personaFrame.glow}`, pointerEvents: "none", zIndex: 10 }} />
            <motion.div animate={{ opacity: [0.2, 0.55, 0.2] }} transition={{ duration: 1.1, repeat: Infinity, delay: 0.18 }}
              style={{ position: "absolute", inset: -9, borderRadius: 25, border: `1.5px solid ${personaFrame.color}`, pointerEvents: "none", zIndex: 9 }} />
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
          onClick={e => { e.stopPropagation(); if (!isVerified) { handleUnverifiedTap(); return; } setExpanded(true); }}
          style={{
            position: "absolute", inset: 0, borderRadius: 18, overflow: "hidden", cursor: "pointer",
            border: liked ? `1.5px solid ${heartColor}55` : "1px solid rgba(255,255,255,0.09)",
            boxShadow: liked ? `0 0 16px ${heartColor}30` : "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          {/* Photo */}
          <img src={cardImage} alt={ghostId}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />

          {/* Bottom gradient */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.35) 38%, transparent 60%)" }} />

          {/* TOP LEFT: km + map pin */}
          {profile.distanceKm !== undefined && (
            <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.62)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "3px 9px", border: "1px solid rgba(255,255,255,0.14)" }}>
              <MapPin size={9} style={{ color: "#f87171", flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>{fmtKm(profile.distanceKm)}</span>
            </div>
          )}

          {/* TOP RIGHT: match score pill — only for real scored profiles */}
          {isVerified && profile.matchScore !== undefined && profile.matchScore >= 40 && (
            <div style={{
              position: "absolute", top: 10, right: 10,
              display: "flex", alignItems: "center", gap: 3,
              background: "rgba(0,0,0,0.68)", backdropFilter: "blur(10px)",
              borderRadius: 20, padding: "3px 9px",
              border: `1px solid ${matchScoreColor(profile.matchScore)}55`,
            }}>
              <span style={{ fontSize: 8 }}>✦</span>
              <span style={{ fontSize: 9, fontWeight: 900, color: matchScoreColor(profile.matchScore) }}>
                {profile.matchScore}%
              </span>
            </div>
          )}

          {/* BOTTOM LEFT: portrait countdown — unverified non-persona profiles only */}
          {!isVerified && !isChefProfile && !isGamesProfile && !isMaidProfile && !isJokerProfile && (
            <div style={{ position: "absolute", bottom: 12, left: 10, zIndex: 5, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)", borderRadius: 20, padding: "3px 9px", border: "1px solid rgba(212,175,55,0.35)" }}>
              <span style={{ fontSize: 9 }}>⏱</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(212,175,55,0.9)" }}>{getSeededCountdown(profile.id)}</span>
            </div>
          )}


          {/* BOTTOM strip */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 11px 12px" }}>
            {/* Guest ID + voice indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              {hasVoiceNote(profile.id) && (
                <motion.div
                  animate={{ scale: [1, 1.12, 1], opacity: [0.75, 1, 0.75] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: 18, height: 18, borderRadius: "50%", background: a.glow(0.35), border: `1.5px solid ${a.accent}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 0 6px ${a.glow(0.5)}` }}
                >
                  <span style={{ fontSize: 7, color: "#fff", lineHeight: 1, marginLeft: 1 }}>▶</span>
                </motion.div>
              )}
              <span style={{ fontSize: 11, fontWeight: 900, color: (isChefProfile || isGamesProfile || isMaidProfile || isJokerProfile) ? "rgba(212,175,55,0.85)" : "rgba(255,255,255,0.5)", letterSpacing: "0.02em" }}>
                {isChefProfile ? "Chef Armand" : isGamesProfile ? "Games Room" : isMaidProfile ? "Maid Eloise" : isJokerProfile ? "🃏 The Joker" : ghostId}
              </span>
            </div>
            {/* Age + verified */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>{profile.age}</span>
              {isVerified && (
                <div style={{ width: 17, height: 17, borderRadius: "50%", background: "rgba(74,222,128,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 6px rgba(74,222,128,0.7)", border: "1.5px solid rgba(255,255,255,0.3)" }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: "#fff" }}>✓</span>
                </div>
              )}
            </div>
            {/* Flag + city */}
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13 }}>{profile.countryFlag}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{profile.city}</span>
            </div>
          </div>

          {/* Like button — floating round circle TOP-RIGHT */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={triggerHearts}
            style={{
              position: "absolute", top: 10, right: 10, zIndex: 5,
              width: 38, height: 38, borderRadius: "50%",
              background: liked ? a.glow(0.35) : "rgba(0,0,0,0.55)",
              border: liked ? `2px solid ${a.accent}` : "2px solid rgba(255,255,255,0.22)",
              backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: liked ? "default" : "pointer",
              boxShadow: liked ? `0 0 14px ${a.glow(0.5)}` : "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            <span style={{ fontSize: 16, color: "#fff", lineHeight: 1 }}>{liked ? "♥" : "♡"}</span>
          </motion.button>

          {/* Fingerprint button — lower-right, opens landscape detail panel */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleFingerprintClick}
            style={{
              position: "absolute", bottom: 12, right: 10, zIndex: 5,
              width: 38, height: 38, borderRadius: "50%",
              background: "rgba(0,0,0,0.55)",
              border: "2px solid rgba(255,255,255,0.22)",
              backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}
          >
            <Fingerprint size={17} color="#fff" />
          </motion.button>


          {/* Special overlays */}
          {flaggedReason && (
            <div style={{ position: "absolute", inset: 0, zIndex: 5, borderRadius: 18, overflow: "hidden" }}>
              <img src={REPORTED_IMG} alt="Reported" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 60%)" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid rgba(239,68,68,0.5)", borderRadius: 12, padding: "8px 18px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "rgba(239,68,68,0.95)", letterSpacing: "0.06em" }}>Guest Reported</p>
                </div>
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

      {/* ── Profile + Whisper Modal ── */}
      <AnimatePresence>
        {expanded && (
          <ProfileWhisperModal
            key="pwm"
            profile={profile}
            liked={liked}
            onLike={() => { onLike?.(); }}
            onClose={() => { setExpanded(false); onModalClose?.(); }}
            accentColor={accentColor}
          />
        )}
      </AnimatePresence>

      {/* ── Mr. Butlas — limited account popup ── */}
      <AnimatePresence>
        {staffLimitedOpen && (
          <MrButlasStaffPopup
            key="staff-limited"
            profile={profile}
            onClose={() => setStaffLimitedOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Breakfast Chef Invite ── */}
      <AnimatePresence>
        {chefInviteOpen && (
          <BreakfastChefInviteSheet
            key="chef-invite"
            onClose={() => setChefInviteOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Maid Eloise — room upgrade sheet ── */}
      <AnimatePresence>
        {maidUpgradeOpen && (
          <MaidUpgradeSheet
            key="maid-upgrade"
            onClose={() => setMaidUpgradeOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Games Room invite ── */}
      <AnimatePresence>
        {gamesInviteOpen && (
          <GamesRoomInviteSheet
            key="games-invite"
            onClose={() => setGamesInviteOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── The Joker — coin reward ── */}
      <AnimatePresence>
        {jokerOpen && (
          <JokerInviteSheet
            key="joker"
            onClose={() => setJokerOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
