import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Moon, KeyRound, Swords, SlidersHorizontal, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { SEA_COUNTRY_LIST, INTL_PROFILES } from "../types/ghostTypes";
import type { GhostProfile } from "../types/ghostTypes";
import GhostCard from "../components/GhostCard";
import FloorChatPopup, { getChatUnread, setChatUnread } from "../components/FloorChatPopup";
import FloorWarsBoard from "../components/FloorWarsBoard";
import ButlerArrivalPopup from "../components/ButlerArrivalPopup";
import BreakfastGuestPicker from "../components/BreakfastGuestPicker";
import BreakfastInviteReceived from "../components/BreakfastInviteReceived";
import LoungeSplashScreen from "../components/LoungeSplashScreen";
import FloorViewedMePopup from "../components/FloorViewedMePopup";
import GhostTonightSheet from "../components/GhostTonightSheet";
import ButlerExcusePopup from "../components/ButlerExcusePopup";
import BreakfastRatingPopup from "../components/BreakfastRatingPopup";
import ButlerMatchSignalPopup from "../components/ButlerMatchSignalPopup";
import SocialActivityInvitePopup from "../components/SocialActivityInvitePopup";
import { isFirstEntry, getReceivedInvite, isBreakfastMissed } from "../utils/breakfastInviteService";
import type { BreakfastInvite } from "../utils/breakfastInviteService";
import { saveRating, getRating, getReceivedSocialInvite } from "../utils/breakfastRatingService";
import type { SocialInvite } from "../utils/breakfastRatingService";
import { readCoins } from "../utils/featureGating";

// ── Floor config map ──────────────────────────────────────────────────────────
export type FloorTier = "cellar" | "loft" | "suite" | "penthouse" | "standard" | "garden" | "kings";

interface FloorConfig {
  name:           string;
  color:          string;
  glowRgb:        string;
  gradient:       string;
  bg:             string;
  icon:           string;
  chatIconImg?:   string;
  profilePrefix:  string;
  hasSuiteFeatures: boolean;
  hasTonightSheet:  boolean;
}

const FLOOR_CONFIG: Record<FloorTier, FloorConfig> = {
  standard: {
    name:          "Standard Room",
    color:         "#a8a8b0",
    glowRgb:       "168,168,176",
    gradient:      "linear-gradient(to bottom, #d0d0d8 0%, #a8a8b0 40%, #505058 100%)",
    bg:            "https://ik.imagekit.io/7grri5v7d/sdsdffsdfsdfasdasd.png",
    icon:          "🛏️",
    profilePrefix: "std",
    hasSuiteFeatures: false,
    hasTonightSheet:  false,
  },
  garden: {
    name:          "The Garden",
    color:         "#4ade80",
    glowRgb:       "74,222,128",
    gradient:      "linear-gradient(to bottom, #86efac 0%, #4ade80 40%, #166534 100%)",
    bg:            "https://ik.imagekit.io/7grri5v7d/asdfasdfasdfvcxcvzxcvasfdfasd.png",
    icon:          "🌿",
    profilePrefix: "garden",
    hasSuiteFeatures: false,
    hasTonightSheet:  false,
  },
  cellar: {
    name:          "The Cellar",
    color:         "#c0392b",
    glowRgb:       "192,57,43",
    gradient:      "linear-gradient(to bottom, #e74c3c 0%, #c0392b 40%, #7b241c 100%)",
    bg:            "https://ik.imagekit.io/7grri5v7d/sdsdffsdfsdf.png",
    icon:          "🍷",
    chatIconImg:   "https://ik.imagekit.io/7grri5v7d/UntitledSDFSDFASDFDSF-removebg-preview.png?updatedAt=1774209937636",
    profilePrefix: "cellar",
    hasSuiteFeatures: false,
    hasTonightSheet:  true,
  },
  loft: {
    name:          "The Loft",
    color:         "#8b5cf6",
    glowRgb:       "139,92,246",
    gradient:      "linear-gradient(to bottom, #a78bfa 0%, #8b5cf6 40%, #5b21b6 100%)",
    bg:            "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsdstertefsdfsd.png",
    icon:          "🎨",
    profilePrefix: "loft",
    hasSuiteFeatures: false,
    hasTonightSheet:  false,
  },
  suite: {
    name:          "The Ensuite",
    color:         "#cd7f32",
    glowRgb:       "205,127,50",
    gradient:      "linear-gradient(to bottom, #e8a050 0%, #cd7f32 40%, #7a3b10 100%)",
    bg:            "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsds.png",
    icon:          "🛎️",
    profilePrefix: "suite",
    hasSuiteFeatures: true,
    hasTonightSheet:  false,
  },
  kings: {
    name:          "Kings Floor",
    color:         "#d4af37",
    glowRgb:       "212,175,55",
    gradient:      "linear-gradient(to bottom, #f5d769 0%, #d4af37 40%, #8a6f1e 100%)",
    bg:            "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrt.png",
    icon:          "🎰",
    profilePrefix: "kings",
    hasSuiteFeatures: false,
    hasTonightSheet:  false,
  },
  penthouse: {
    name:          "The Penthouse",
    color:         "#c0c8d8",
    glowRgb:       "192,200,216",
    gradient:      "linear-gradient(to bottom, #e8edf5 0%, #c0c8d8 40%, #7a8494 100%)",
    bg:            "https://ik.imagekit.io/7grri5v7d/sdsdffsdfsdfasdasdasdas.png",
    icon:          "🏙️",
    profilePrefix: "pent",
    hasSuiteFeatures: false,
    hasTonightSheet:  false,
  },
};

const SHIELD_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdfsdsdsddsdf.png";
const LIKE_ICON   = "https://ik.imagekit.io/7grri5v7d/dfghdfghdfghdfg-removebg-preview.png?updatedAt=1774183141963";

type MemberTab = "members" | "ilike" | "liked";

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FloorRoomPage({ tier }: { tier: FloorTier }) {
  const cfg      = FLOOR_CONFIG[tier];
  const C        = cfg.color;
  const C_GLOW   = (o: number) => `rgba(${cfg.glowRgb},${o})`;
  const C_GRAD   = cfg.gradient;

  const PROFILES: GhostProfile[] = useMemo(
    () => INTL_PROFILES.map((p, i) => ({
      ...p,
      id: `${cfg.profilePrefix}-${p.id}`,
      last_seen_at: i % 3 !== 0
        ? new Date(Date.now() - (i * 7 + 3) * 60000).toISOString()
        : null,
    })),
    [cfg.profilePrefix],
  );

  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────
  const [likedIds,            setLikedIds]           = useState<Set<string>>(new Set());
  const [memberTab,           setMemberTab]           = useState<MemberTab>("members");
  const [showChat,            setShowChat]            = useState(false);
  const [chatUnread,          setChatUnreadSt]        = useState(() => getChatUnread(tier));
  const [coinBalance]                                 = useState(() => readCoins());
  const [browsingCountryCode, setBrowsingCountryCode] = useState<string | null>(null);
  const [showFilters,         setShowFilters]         = useState(false);
  const [showSettingsSheet,   setShowSettingsSheet]   = useState(false);
  const [showFloorWars,       setShowFloorWars]       = useState(false);
  const [showViewedMe,        setShowViewedMe]        = useState(false);
  const [showTonight,         setShowTonight]         = useState(false);
  const [showButlerArrival,   setShowButlerArrival]   = useState(() => isFirstEntry(tier));
  const [showGuestPicker,     setShowGuestPicker]     = useState(false);
  const [showLoungeSplash,    setShowLoungeSplash]    = useState(false);
  const [loungeGuestName,     setLoungeGuestName]     = useState("");
  const [receivedInvite,      setReceivedInvite]      = useState<BreakfastInvite | null>(() => {
    const inv = getReceivedInvite();
    return inv?.status === "pending" ? inv : null;
  });

  // Suite-only state
  const [isBreakfastChat,    setIsBreakfastChat]    = useState(false);
  const [breakfastInviteRef, setBreakfastInviteRef] = useState<BreakfastInvite | null>(null);
  const [showRating,         setShowRating]         = useState(false);
  const [myRating,           setMyRating]           = useState(0);
  const [showMatchSignal,    setShowMatchSignal]    = useState(false);
  const [socialInvite,       setSocialInvite]       = useState<SocialInvite | null>(() => {
    if (!cfg.hasSuiteFeatures) return null;
    const inv = getReceivedSocialInvite();
    return inv?.status === "delivered" ? inv : null;
  });
  const [showExcuse,         setShowExcuse]         = useState<BreakfastInvite | null>(() => {
    if (!cfg.hasSuiteFeatures) return null;
    const inv = getReceivedInvite();
    if (!inv) return null;
    return isBreakfastMissed(inv) && !inv.missedAt ? inv : null;
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const homeFlag        = "🇮🇩";
  const homeCountryName = "Indonesia";

  function openChat() {
    setShowChat(true);
    setChatUnreadSt(0);
    setChatUnread(tier, 0);
  }

  const avatarSize = "calc((100vw - 108px) / 3)";
  const avatarH    = 78;

  const likedMeProfiles = useMemo(() => PROFILES.filter((_, i) => i % 2 === 0).slice(0, 3), [PROFILES]);
  const iLikeProfiles   = useMemo(() => PROFILES.filter(p => likedIds.has(p.id)), [likedIds, PROFILES]);

  const tabLabel = memberTab === "ilike" ? "I Like" : memberTab === "liked" ? "Liked Me" : cfg.name;
  const tabCount = memberTab === "ilike" ? iLikeProfiles.length
    : memberTab === "liked" ? likedMeProfiles.length
    : PROFILES.length;

  const displayProfiles = useMemo(() => {
    if (!browsingCountryCode) return PROFILES;
    return PROFILES.filter(p =>
      (p as GhostProfile & { countryCode?: string }).countryCode === browsingCountryCode,
    ).concat(PROFILES.slice(0, 4));
  }, [browsingCountryCode, PROFILES]);

  const displayCountry = browsingCountryCode
    ? (SEA_COUNTRY_LIST.find(c => c.code === browsingCountryCode)?.name ?? homeCountryName)
    : homeCountryName;

  // ── Hero scroll content ───────────────────────────────────────────────────
  const renderScrollContent = () => {
    const TOTAL = Math.max(3, tabCount);

    if (memberTab === "ilike") {
      const phCount = TOTAL - iLikeProfiles.length;
      return (
        <>
          {iLikeProfiles.map((p, i) => (
            <div key={p.id} style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ position: "relative", width: avatarSize, height: avatarH }}>
                <motion.div animate={{ scale: [1, 1.22, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2 }}
                  style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${C_GLOW(0.7)}`, pointerEvents: "none" }} />
                <img src={p.image} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${C_GLOW(0.55)}`, display: "block" }}
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
              </div>
              <p style={{ fontSize: 8, color: C_GLOW(0.8), fontWeight: 700, margin: 0, textAlign: "center", width: avatarSize, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name}</p>
            </div>
          ))}
          {Array.from({ length: phCount }).map((_, i) => (
            <div key={`ph-${i}`} style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: avatarSize, height: avatarH, borderRadius: "50%", border: `2px dashed ${C_GLOW(0.2)}`, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 14, opacity: 0.3 }}>👻</span>
              </div>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", margin: 0 }}>Soon…</p>
            </div>
          ))}
        </>
      );
    }

    if (memberTab === "liked") {
      const phCount = TOTAL - likedMeProfiles.length;
      return (
        <>
          {likedMeProfiles.map((p, i) => (
            <div key={p.id} style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ position: "relative", width: avatarSize, height: avatarH }}>
                <motion.div animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.18 }}
                  style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid rgba(244,114,182,0.65)", pointerEvents: "none" }} />
                <img src={p.image} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(244,114,182,0.45)", display: "block" }}
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
              </div>
              <p style={{ fontSize: 8, color: "rgba(244,114,182,0.85)", fontWeight: 700, margin: 0, textAlign: "center", width: avatarSize, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name}</p>
            </div>
          ))}
          {Array.from({ length: phCount }).map((_, i) => (
            <div key={`ph-${i}`} style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: avatarSize, height: avatarH, borderRadius: "50%", border: "2px dashed rgba(244,114,182,0.2)", background: "rgba(244,114,182,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 14, opacity: 0.3 }}>💗</span>
              </div>
              <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", margin: 0 }}>Soon…</p>
            </div>
          ))}
        </>
      );
    }

    return (
      <>
        {PROFILES.slice(0, 12).map((p, i) => {
          const online = isOnline(p.last_seen_at);
          return (
            <div key={p.id} style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ position: "relative", width: avatarSize, height: avatarH }}>
                <motion.div animate={{ scale: [1, 1.22, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2 }}
                  style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${C_GLOW(0.7)}`, pointerEvents: "none" }} />
                <img src={p.image} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${C_GLOW(0.55)}`, display: "block" }}
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                {online && (
                  <motion.span animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                    style={{ position: "absolute", bottom: 1, right: 1, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.9)", display: "block" }} />
                )}
              </div>
              <p style={{ fontSize: 8, color: C_GLOW(0.8), fontWeight: 700, margin: 0, textAlign: "center", width: avatarSize, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name}</p>
            </div>
          );
        })}
      </>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: "#06060a", color: "#fff", fontFamily: "inherit", position: "relative", overflowX: "hidden" }}>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1, backgroundImage: `url(${cfg.bg})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.12, pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: -1, background: "linear-gradient(to bottom, rgba(6,6,10,0.5) 0%, rgba(6,6,10,0.97) 100%)", pointerEvents: "none" }} />

      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingTop: "max(12px, env(safe-area-inset-top, 12px))",
      }}>
        <div style={{ padding: "0 16px 6px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>Mr Butlas</h1>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: C, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {cfg.name} {cfg.icon}
              </p>
            </div>
          </div>
          <button onClick={() => {}}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 20, padding: "5px 10px", cursor: "pointer", flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>🪙</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#d4af37", fontVariantNumeric: "tabular-nums" }}>{coinBalance.toLocaleString()}</span>
          </button>
          <button onClick={() => setShowSettingsSheet(true)}
            style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: C_GLOW(0.1), border: `1.5px solid ${C_GLOW(0.3)}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C, boxShadow: `0 0 12px ${C_GLOW(0.2)}` }}>
            <Settings size={17} />
          </button>
        </div>
      </div>

      {/* ── Hero member scroll row ── */}
      <div style={{ margin: "10px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          <motion.span animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
            style={{ width: 7, height: 7, borderRadius: "50%", background: C, display: "block", boxShadow: `0 0 8px ${C_GLOW(0.9)}`, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: C_GLOW(0.85), letterSpacing: "0.1em", textTransform: "uppercase" }}>{tabLabel}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", flex: 1 }}>
            · {tabCount > 0 ? `${tabCount} ${memberTab === "liked" ? "liked you" : "waiting"}` : "waiting for you"}
          </span>
          <div onClick={openChat} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", flexShrink: 0, padding: "6px 0 6px 10px" }}>
            <img src="https://ik.imagekit.io/7grri5v7d/butlers%20tray.png" alt="butler" style={{ width: 16, height: 16, objectFit: "contain" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>Butler Service</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <style>{`.floor-hero-row::-webkit-scrollbar { display: none; }`}</style>
          <div className="floor-hero-row" style={{ flex: 1, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
            {renderScrollContent()}
          </div>
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 6, paddingBottom: 8, marginLeft: 4 }}>
            <button onClick={() => setMemberTab(memberTab === "ilike" ? "members" : "ilike")}
              style={{ width: 52, height: 44, borderRadius: 10, background: memberTab === "ilike" ? C_GRAD : "rgba(255,255,255,0.07)", border: memberTab === "ilike" ? "none" : "1.5px solid rgba(255,255,255,0.15)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, boxShadow: memberTab === "ilike" ? `0 0 14px ${C_GLOW(0.5)}` : "none" }}>
              <img src={LIKE_ICON} alt="" style={{ width: 22, height: 22, objectFit: "contain", display: "block" }} />
              <span style={{ fontSize: 8, fontWeight: 700, color: memberTab === "ilike" ? "#fff" : "rgba(255,255,255,0.5)", letterSpacing: "0.02em" }}>I Like</span>
            </button>
            <button onClick={() => setMemberTab(memberTab === "liked" ? "members" : "liked")}
              style={{ width: 52, height: 44, borderRadius: 10, background: memberTab === "liked" ? "linear-gradient(to bottom, #f472b6 0%, #ec4899 40%, #db2777 100%)" : "rgba(255,255,255,0.07)", border: memberTab === "liked" ? "none" : "1.5px solid rgba(255,255,255,0.15)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, boxShadow: memberTab === "liked" ? "0 0 14px rgba(244,114,182,0.5)" : "none" }}>
              <span style={{ fontSize: 15 }}>❤️</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: memberTab === "liked" ? "#fff" : "rgba(255,255,255,0.5)", letterSpacing: "0.02em" }}>Liked</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick actions row 1 ── */}
      <div style={{ margin: "12px 14px 0", display: "flex", gap: 8 }}>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/room")}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: C_GLOW(0.14), border: `1px solid ${C_GLOW(0.45)}`, borderRadius: 14, cursor: "pointer" }}>
          <Lock size={20} style={{ color: "#fff", flexShrink: 0 }} />
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: C }}>Vault</p>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Your matches</p>
          </div>
        </motion.button>

        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowTonight(true)}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: C_GLOW(0.14), border: `1px solid ${C_GLOW(0.45)}`, borderRadius: 14, cursor: "pointer" }}>
          <Moon size={20} style={{ color: "#fff", flexShrink: 0 }} />
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: C }}>Tonight</p>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Meet tonight</p>
          </div>
        </motion.button>

        <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate("/rooms")}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: C_GLOW(0.14), border: `1px solid ${C_GLOW(0.45)}`, borderRadius: 14, cursor: "pointer" }}>
          <KeyRound size={20} style={{ color: "#fff", flexShrink: 0 }} />
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: C }}>Rooms</p>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Ghost Hotel</p>
          </div>
        </motion.button>
      </div>

      {/* ── Quick actions row 2 ── */}
      <div style={{ margin: "8px 14px 0", display: "flex", gap: 8 }}>
        <motion.button whileTap={{ scale: 0.95 }} onClick={openChat}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: C_GLOW(0.14), border: `1px solid ${C_GLOW(0.45)}`, borderRadius: 14, cursor: "pointer", position: "relative" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>💬</span>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: C }}>Floor Chat</p>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Members live</p>
          </div>
          {chatUnread > 0 && (
            <div style={{ position: "absolute", top: 6, right: 8, minWidth: 16, height: 16, borderRadius: 8, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: "#fff" }}>{chatUnread > 9 ? "9+" : chatUnread}</span>
            </div>
          )}
        </motion.button>

        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowFloorWars(true)}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: C_GLOW(0.14), border: `1px solid ${C_GLOW(0.45)}`, borderRadius: 14, cursor: "pointer" }}>
          <Swords size={20} style={{ color: "#fff", flexShrink: 0 }} />
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: C }}>Floor Wars</p>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Today</p>
          </div>
        </motion.button>

        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowViewedMe(true)}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: C_GLOW(0.14), border: `1px solid ${C_GLOW(0.45)}`, borderRadius: 14, cursor: "pointer" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>👁️</span>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: C }}>Viewed Me</p>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>All floors</p>
          </div>
        </motion.button>
      </div>

      {/* ── Country + Filter bar ── */}
      <div style={{ margin: "10px 14px 6px", display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => navigate("/dashboard")}
          style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>
          🏆
        </button>
        <div style={{ position: "relative", flex: 1 }}>
          <select value={browsingCountryCode ?? ""} onChange={e => setBrowsingCountryCode(e.target.value || null)}
            style={{ width: "100%", height: 36, borderRadius: 10, background: browsingCountryCode ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.05)", border: browsingCountryCode ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)", color: browsingCountryCode ? "#818cf8" : "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, padding: "0 10px", appearance: "none", WebkitAppearance: "none", cursor: "pointer", outline: "none" }}>
            <option value="">{homeFlag} {homeCountryName}</option>
            {SEA_COUNTRY_LIST.filter(c => c.code !== "ID").map(c => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>▾</span>
        </div>
        <button onClick={() => setShowFilters(true)}
          style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: C_GLOW(0.12), border: `1.5px solid ${C_GLOW(0.6)}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <SlidersHorizontal size={15} color={C} />
        </button>
      </div>

      {/* ── Section header ── */}
      <div style={{ margin: "14px 14px 4px" }}>
        <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.15 }}>{displayCountry}'s</p>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.38)", fontWeight: 500 }}>Real Connections waiting for you</p>
      </div>

      {/* ── Profile cards grid ── */}
      <div style={{ padding: "12px 14px", paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {displayProfiles.map((profile, i) => (
          <motion.div key={profile.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 24 }}>
            <GhostCard
              profile={profile} liked={likedIds.has(profile.id)}
              onClick={() => {}}
              onLike={() => setLikedIds(prev => { const n = new Set(prev); n.add(profile.id); return n; })}
              isRevealed={false} onReveal={() => {}} canReveal={false} isTonight={false}
              accentColor={C}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Filter sheet ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowFilters(false)}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              onClick={e => e.stopPropagation()}
              style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "rgba(8,8,14,0.98)", backdropFilter: "blur(30px)", borderRadius: "22px 22px 0 0", border: "1px solid rgba(255,255,255,0.08)", paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))", maxHeight: "60dvh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SlidersHorizontal size={16} color={C} />
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Filters</span>
                </div>
                <button onClick={() => setShowFilters(false)}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 16, fontWeight: 700 }}>✕</button>
              </div>
              <div style={{ padding: "0 18px 14px" }}>
                <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Browse Country</p>
                <div style={{ position: "relative" }}>
                  <select value={browsingCountryCode ?? ""} onChange={e => setBrowsingCountryCode(e.target.value || null)}
                    style={{ width: "100%", height: 40, borderRadius: 10, background: browsingCountryCode ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.05)", border: browsingCountryCode ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)", color: browsingCountryCode ? "#818cf8" : "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, padding: "0 10px", appearance: "none", WebkitAppearance: "none", cursor: "pointer", outline: "none" }}>
                    <option value="">{homeFlag} {homeCountryName}</option>
                    {SEA_COUNTRY_LIST.filter(c => c.code !== "ID").map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>▾</span>
                </div>
              </div>
              <div style={{ padding: "0 18px" }}>
                <button onClick={() => setShowFilters(false)}
                  style={{ width: "100%", height: 44, borderRadius: 12, border: "none", background: C_GRAD, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${C_GLOW(0.35)}` }}>
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Settings side drawer ── */}
      <AnimatePresence>
        {showSettingsSheet && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSettingsSheet(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9000, backdropFilter: "blur(4px)" }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 260, zIndex: 9001, background: "rgba(8,10,14,0.99)", borderLeft: `1px solid ${C_GLOW(0.15)}`, display: "flex", flexDirection: "column", paddingTop: "max(48px, env(safe-area-inset-top, 48px))", paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${C}, transparent)` }} />
              <div style={{ padding: "0 20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>Menu</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>Mr Butlas</p>
                </div>
                <button onClick={() => setShowSettingsSheet(false)}
                  style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
              </div>
              <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${C_GLOW(0.15)}, transparent)`, margin: "0 20px 16px" }} />
              <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
                {[
                  { icon: "📊", label: "Dashboard",         desc: "Your stats & activity",          action: () => { setShowSettingsSheet(false); navigate("/dashboard"); } },
                  { icon: null, label: "Shield",             desc: "Block & privacy controls",       isShield: true, action: () => { setShowSettingsSheet(false); navigate("/block"); } },
                  { icon: "🏨", label: "Rooms",              desc: "Ghost Hotel floor",              action: () => { setShowSettingsSheet(false); navigate("/rooms"); } },
                  { icon: null, label: "Room Vault",         desc: "Your private ghost room",        isRoom: true, action: () => { setShowSettingsSheet(false); navigate("/room"); } },
                  { icon: "⚔️", label: "Floor Wars",         desc: "Weekly floor gift leaderboard",  action: () => { setShowSettingsSheet(false); setShowFloorWars(true); } },
                  { icon: "📄", label: "Terms & Conditions", desc: "Privacy & usage policy",         action: () => { setShowSettingsSheet(false); window.open("https://2ghost.com/terms", "_blank"); } },
                ].map(({ icon, label, desc, isShield, isRoom, action }) => (
                  <button key={label} onClick={action}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "13px 14px", marginBottom: 8, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: C_GLOW(0.07), border: `1px solid ${C_GLOW(0.15)}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isShield
                        ? <img src={SHIELD_LOGO} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
                        : isRoom
                        ? <img src="https://ik.imagekit.io/7grri5v7d/weqweqw.png" alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
                        : <span style={{ fontSize: 18 }}>{icon}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>{desc}</p>
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 14 }}>›</span>
                  </button>
                ))}
              </div>
              <div style={{ padding: "16px 20px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", margin: 0, textAlign: "center" }}>Mr Butlas · Find your match 👻</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Floor Chat ── */}
      <AnimatePresence>
        {showChat && (
          <FloorChatPopup
            tier={tier} tierColor={C} tierLabel={cfg.name} tierIcon={cfg.icon}
            tierIconImg={cfg.chatIconImg}
            onClose={() => setShowChat(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Floor Wars ── */}
      <AnimatePresence>
        {showFloorWars && <FloorWarsBoard onClose={() => setShowFloorWars(false)} />}
      </AnimatePresence>

      {/* ── Butler Arrival ── */}
      <AnimatePresence>
        {showButlerArrival && (
          <ButlerArrivalPopup
            floor={tier} floorLabel={cfg.name} floorColor={C} floorIcon={cfg.icon}
            onClose={() => setShowButlerArrival(false)}
            onInvite={() => { setShowButlerArrival(false); setShowGuestPicker(true); }}
          />
        )}
      </AnimatePresence>

      {/* ── Breakfast Guest Picker ── */}
      <AnimatePresence>
        {showGuestPicker && (
          <BreakfastGuestPicker
            floor={tier} profiles={PROFILES}
            onClose={() => setShowGuestPicker(false)}
            onSent={(invite) => {
              setShowGuestPicker(false);
              if (cfg.hasSuiteFeatures) setBreakfastInviteRef(invite);
              setLoungeGuestName(invite.toUserName);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Received Invite ── */}
      <AnimatePresence>
        {receivedInvite && (
          <BreakfastInviteReceived
            invite={receivedInvite}
            onAccept={() => {
              if (cfg.hasSuiteFeatures) setBreakfastInviteRef(receivedInvite);
              setReceivedInvite(null);
              setLoungeGuestName(receivedInvite.fromUserName);
              setShowLoungeSplash(true);
            }}
            onDecline={() => setReceivedInvite(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Lounge Splash ── */}
      <AnimatePresence>
        {showLoungeSplash && (
          <LoungeSplashScreen
            floorLabel={cfg.name} floorColor={C} floorIcon={cfg.icon}
            guestName={loungeGuestName}
            onDone={() => {
              setShowLoungeSplash(false);
              if (cfg.hasSuiteFeatures) setIsBreakfastChat(true);
              setShowChat(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Viewed Me ── */}
      <AnimatePresence>
        {showViewedMe && (
          <FloorViewedMePopup
            floorKey={tier} floorLabel={cfg.name} floorColor={C}
            profiles={PROFILES}
            onClose={() => setShowViewedMe(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Tonight Sheet (cellar only) ── */}
      {cfg.hasTonightSheet && (
        <GhostTonightSheet
          show={showTonight}
          lobbyList={PROFILES.filter(p => isOnline(p.last_seen_at))}
          likedIds={likedIds}
          onClose={() => setShowTonight(false)}
          onSelectProfile={() => {}}
          onLike={p => setLikedIds(prev => { const n = new Set(prev); n.add(p.id); return n; })}
        />
      )}

      {/* ── Suite-only popups ── */}
      {cfg.hasSuiteFeatures && (
        <>
          <AnimatePresence>
            {showRating && breakfastInviteRef && (
              <BreakfastRatingPopup
                floorColor={C} floorLabel={cfg.name} guestName={loungeGuestName}
                onRated={(rating) => {
                  setShowRating(false);
                  saveRating({ inviteId: breakfastInviteRef.id, raterRole: "host", rating, ratedAt: Date.now() });
                  setMyRating(rating);
                  if (rating >= 6) setShowMatchSignal(true);
                }}
                onSkip={() => setShowRating(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showMatchSignal && breakfastInviteRef && (
              <ButlerMatchSignalPopup
                invite={breakfastInviteRef}
                myRating={myRating}
                otherRating={getRating(breakfastInviteRef.id, "guest")?.rating ?? null}
                floor={tier} floorColor={C} floorLabel={cfg.name}
                onClose={() => setShowMatchSignal(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {socialInvite && (
              <SocialActivityInvitePopup
                invite={socialInvite}
                onAccept={() => setSocialInvite(null)}
                onDecline={() => setSocialInvite(null)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showExcuse && (
              <ButlerExcusePopup
                invite={showExcuse}
                perspective="guest"
                onDismiss={() => setShowExcuse(null)}
                onReschedule={() => { setShowExcuse(null); setShowGuestPicker(true); }}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {/* suppress unused warning */}
      {isBreakfastChat && null}
    </div>
  );
}
