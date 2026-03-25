import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Settings, Gift, SlidersHorizontal, Lock, KeyRound, Swords } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { useGhostMode } from "../hooks/useGhostMode";
import { generateIndonesianProfiles } from "@/data/indonesianProfiles";
import GhostInstallBanner from "../components/GhostInstallBanner";
import { detectIpCountry, getCachedIpCountry, getCountryProximity, type IpCountryResult } from "@/shared/hooks/useIpCountry";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
// Types & constants
import type { GhostProfile, GhostMatch, InboundLike, GenderFilter, KmFilter } from "../types/ghostTypes";
import { MATCH_EXPIRY_MS, SEA_COUNTRY_LIST, FLAG_TO_CODE, INTL_PROFILES, DEMO_INBOUND } from "../types/ghostTypes";

// Helpers
import {
  loadMatches, persistMatches, activeHoursAgo,
  profileHouseTier, tonightMidnight, isProfileTonight, isFlashProfile,
  getFlaggedProfiles, saveFlaggedProfiles, hasIntlGhost, getIntlCountries,
  haversineKm, profileIsVerified, toGhostId,
} from "../utils/ghostHelpers";

// Components
import GhostParticles from "../components/GhostParticles";
import GhostDevPanel from "../components/GhostDevPanel";
import GhostButlerMessage, { BUTLER_MESSAGES, type ButlerMessageKey, type ButlerMessage } from "../components/GhostButlerMessage";
import HouseRulesModal from "../components/HouseRulesModal";
import GhostFlashPaywallSheet from "../components/GhostFlashPaywallSheet";
import GhostAuthGateSheet from "../components/GhostAuthGateSheet";
import GhostLobbySheet from "../components/GhostLobbySheet";
import GhostViewedMeSheet, { saveInvite, getInvite } from "../components/GhostViewedMeSheet";
import GhostLeaderboardSheet from "../components/GhostLeaderboardSheet";
import GhostTonightSheet from "../components/GhostTonightSheet";
import GhostLobbyWelcomePopup from "../components/GhostLobbyWelcomePopup";
import GhostFlagSheet from "../components/GhostFlagSheet";
import GhostSecurityPopup from "../components/GhostSecurityPopup";
import GhostButlerConnectPrompt from "../components/GhostButlerConnectPrompt";
import GhostButlerUnavailablePopup from "../components/GhostButlerUnavailablePopup";
import GhostSettingsDrawer, { type SettingsAction } from "../components/GhostSettingsDrawer";
import FilterBar from "../components/FilterBar";
import GhostMatchPopup from "../components/GhostMatchPopup";
import ConnectNowPopup from "../components/ConnectNowPopup";
import InboundLikePopup from "../components/InboundLikePopup";
import GhostCard, { ProfileWhisperModal } from "../components/GhostCard";
import MatchPaywallModal from "../components/MatchPaywallModal";
import GhostHouseModal from "../components/GhostHouseModal";
import { GhostFlashMatchPopup } from "../components/GhostFlashSection";
import FoundBooBanner from "../components/FoundBooBanner";
import InternationalGhostModal from "../components/CountryTabBar";
import GhostNewGuestsPopup from "../components/GhostNewGuestsPopup";
import GhostIcebreakerPopup from "../components/GhostIcebreakerPopup";
import GhostButlerSheet from "../components/GhostButlerSheet";
import { isCitySupported } from "../data/butlerProviders";
import MatchActionPopup, { type MatchActionContext } from "../components/MatchActionPopup";
import GhostCoinShop from "../components/GhostCoinShop";
import FloorChatPopup, { getChatUnread, setChatUnread } from "../components/FloorChatPopup";
import CheckoutReminderPopup, { shouldShowCheckout, markCheckoutShown } from "../components/CheckoutReminderPopup";
import ButlerWelcomePopup, { shouldShowButlerWelcome, markButlerGreeted } from "../components/ButlerWelcomePopup";
import PushPermissionPrompt, { shouldShowPushPrompt } from "../components/PushPermissionPrompt";
import LateNightButlerPopup, { shouldShowLateNight, markLateNightShown } from "../components/LateNightButlerPopup";
import HotelEventsBoard from "../components/HotelEventsBoard";
import GhostStatsDashboard from "../components/GhostStatsDashboard";
import GhostReferralSheet from "../components/GhostReferralSheet";
import FloorInviteSheet, { FloorNudgeSheet, getAcceptedFloorMembers, type AcceptedMember } from "../components/FloorInviteSheet";
import GhostScoreSheet from "../components/GhostScoreSheet";
import GhostClockSheet from "../components/GhostClockSheet";
import WhisperSheet from "../components/WhisperSheet";
import FloorWarsBoard from "../components/FloorWarsBoard";
import GhostConciergeSheet from "../components/GhostConciergeSheet";
import SeancePopup from "../components/SeancePopup";
import VideoIntroPlayer from "../components/VideoIntroPlayer";
import VideoIntroUploader from "../components/VideoIntroUploader";
import GhostStreakBanner from "../components/GhostStreakBanner";
import DevPopupLauncher from "@/shared/components/DevPopupLauncher";
import GameInvitePopup from "../components/GameInvitePopup";
import { sendGameInvite, subscribeToGameInvites, respondToInvite, type GameInvite } from "../utils/gameInviteService";
import { hasActiveWindowMode, getDaysConnected, getConciergeShown, whisperWillConvert, profileHasVideo, isProfileInWindow } from "../utils/featureGating";
import { recordLike, loadMyMatches, getMyGhostId, syncTierToSupabase, loadTierFromSupabase, syncCoinsToSupabase, loadCoinsFromSupabase, loadGhostProfiles, type RealProfileRow } from "../ghostDataService";

const SHIELD_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdfsdsdsddsdf.png";


// ── Dev Panel — moved to GhostDevPanel.tsx ───────────────────────────────────
// (kept as alias so no JSX changes needed below)
function DevPanel(props: Parameters<typeof GhostDevPanel>[0]) {
  return <GhostDevPanel {...props} />;
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function GhostModePage() {
  const a = useGenderAccent();
  const navigate = useNavigate();
  const location = useLocation();
  useLanguage();
  const { isGhost, plan, activate, deactivate } = useGhostMode();

  // IP country detection — runs once, cached 24h
  const [ipCountry, setIpCountry] = useState<IpCountryResult | null>(() => getCachedIpCountry());
  useEffect(() => {
    if (!ipCountry) {
      detectIpCountry().then((result) => { if (result) setIpCountry(result); });
    }
  }, []);

  // International Ghost state
  const [_isIntlGhost, setIsIntlGhost] = useState(hasIntlGhost);
  const [intlCountries, setIntlCountries] = useState<string[]>(getIntlCountries);
  const [showIntlModal, setShowIntlModal] = useState(false);
  void intlCountries; // consumed by parent context only

  // Country tab — null means home country
  const homeCountryCode = ipCountry?.countryCode ?? "ID";
  const homeCountryName = ipCountry?.countryName ?? "Indonesia";
  const homeFlag = SEA_COUNTRY_LIST.find((c) => c.code === homeCountryCode)?.flag ?? "🇮🇩";
  const [browsingCountryCode, setBrowsingCountryCode] = useState<string | null>(null);

  const hasGhostProfile = (() => {
    try { return !!localStorage.getItem("ghost_profile"); } catch { return false; }
  })();

  const isAuthed = hasGhostProfile || !!localStorage.getItem("ghost_phone");
  const [showAuthGate, setShowAuthGate] = useState(false);
  const requireAuth = (fn: () => void) => { if (isAuthed) { fn(); } else { setShowAuthGate(true); } };

  const userCity = (() => {
    try { const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}"); return p.city ?? "Jakarta"; } catch { return "Jakarta"; }
  })();

  // Women browse free — paywall only fires at the moment of first WhatsApp connection
  const isFemale = (() => {
    try { return localStorage.getItem("ghost_gender") === "Female"; } catch { return false; }
  })();

  // Found Boo state
  const [foundBoo, setFoundBoo] = useState<{
    matchProfileId: string;
    matchProfileImage: string;
    matchName: string;
    connectedAt: number;
    pausedUntil: number;
    canReactivateAt: number;
  } | null>(() => {
    try {
      const raw = localStorage.getItem("ghost_found_boo");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const isProfilePaused = foundBoo && foundBoo.pausedUntil > Date.now();

  const handleFoundBoo = (profile: GhostProfile) => {
    const data = {
      matchProfileId: profile.id,
      matchProfileImage: profile.image,
      matchName: profile.name,
      connectedAt: Date.now(),
      pausedUntil: Date.now() + 72 * 60 * 60 * 1000,
      canReactivateAt: Date.now() + 60 * 60 * 1000,
    };
    try { localStorage.setItem("ghost_found_boo", JSON.stringify(data)); } catch {}
    setFoundBoo(data);
  };

  // Flag / Report state
  const [flaggedProfiles, setFlaggedProfiles] = useState<Record<string, { reason: string; at: number }>>(getFlaggedProfiles);
  const [flagSheet, setFlagSheet] = useState<{ profileId: string; ghostId: string } | null>(null);

  const handleFlag = (profileId: string, reason: string) => {
    const next = { ...flaggedProfiles, [profileId]: { reason, at: Date.now() } };
    setFlaggedProfiles(next);
    saveFlaggedProfiles(next);
    setFlagSheet(null);
  };

  const [realProfiles, setRealProfiles] = useState<RealProfileRow[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<GhostProfile | null>(null);
  const [pendingGameInvite, setPendingGameInvite] = useState<GameInvite | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [matchProfile, setMatchProfile] = useState<GhostProfile | null>(null);
  const [icebreakerProfile, setIcebreakerProfile] = useState<GhostProfile | null>(null);
  const [showButler, setShowButler] = useState(false);
  const [butlerMatchName, setButlerMatchName] = useState<string | undefined>();
  const [butlerConnectProfile, setButlerConnectProfile] = useState<GhostProfile | null>(null);
  const [showButlerUnavailable, setShowButlerUnavailable] = useState(false);
  const [matchPaywallProfile, setMatchPaywallProfile] = useState<GhostProfile | null>(null);
  const [connectNowProfile, setConnectNowProfile] = useState<GhostProfile | null>(null);
  const [savedMatches, setSavedMatches] = useState<GhostMatch[]>(loadMatches);
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  const [referralCopied, setReferralCopied] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  // Invite popup — fires after 7 minutes of browsing
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [invitePopupDismissed, setInvitePopupDismissed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      if (!invitePopupDismissed) setShowInvitePopup(true);
    }, 7 * 60 * 1000);
    return () => clearTimeout(t);
  }, [invitePopupDismissed]);

  // Tonight Mode — auto-expires at midnight
  const [tonightUntil, setTonightUntil] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("ghost_tonight_until") || 0); return v > Date.now() ? v : 0; } catch { return 0; }
  });
  const isTonightMode = tonightUntil > Date.now();

  const [tonightActive, setTonightActive] = useState(() => {
    try { return localStorage.getItem("ghost_tonight_active") === "1"; } catch { return false; }
  });
  const toggleTonightActive = () => {
    const next = !tonightActive;
    setTonightActive(next);
    try { localStorage.setItem("ghost_tonight_active", next ? "1" : "0"); } catch {}
  };

  const toggleTonight = () => {
    if (isTonightMode) {
      try { localStorage.removeItem("ghost_tonight_until"); } catch {}
      setTonightUntil(0);
      setTonightActive(false);
      try { localStorage.setItem("ghost_tonight_active", "0"); } catch {}
    } else {
      const until = tonightMidnight();
      try { localStorage.setItem("ghost_tonight_until", String(until)); } catch {}
      setTonightUntil(until);
      setTonightActive(true);
      try { localStorage.setItem("ghost_tonight_active", "1"); } catch {}
    }
  };
  void toggleTonightActive; // kept for external use

  // Coin balance — reads from localStorage, refreshes on focus
  const [coinBalance, setCoinBalance] = useState(() => {
    try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; }
  });
  const [coinDebt, setCoinDebt] = useState(() => {
    try { return Number(localStorage.getItem("ghost_coins_debt") || "0"); } catch { return 0; }
  });
  useEffect(() => {
    const refresh = () => {
      try {
        setCoinBalance(Number(localStorage.getItem("ghost_coins") || "0"));
        setCoinDebt(Number(localStorage.getItem("ghost_coins_debt") || "0"));
      } catch {}
    };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  // Central coin updater — always writes localStorage + Supabase
  const updateCoins = (next: number) => {
    const clamped = Math.max(0, next);
    setCoinBalance(clamped);
    try { localStorage.setItem("ghost_coins", String(clamped)); } catch {}
    syncCoinsToSupabase(getMyGhostId(), clamped);
  };

  // Monthly subscription delivery — Ghost Black Monthly (200 coins/mo)
  useEffect(() => {
    try {
      const until = Number(localStorage.getItem("ghost_black_sub_until") || "0");
      if (until < Date.now()) return; // subscription not active
      const today = new Date().toISOString().slice(0, 7); // YYYY-MM
      const lastDelivery = localStorage.getItem("ghost_black_delivery_month");
      if (lastDelivery !== today) {
        localStorage.setItem("ghost_black_delivery_month", today);
        const current = Number(localStorage.getItem("ghost_coins") || "0");
        updateCoins(current + 200);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load real ghost profiles from Supabase (mixed into browse feed)
  useEffect(() => {
    loadGhostProfiles().then(rows => { if (rows.length) setRealProfiles(rows); });
  }, []);

  // Subscribe to incoming game invites via Supabase realtime
  useEffect(() => {
    const myId = localStorage.getItem("ghost_phone") ?? "";
    if (!myId) return;
    const unsub = subscribeToGameInvites(myId, (invite) => {
      setPendingGameInvite(invite);
    });
    return unsub;
  }, []);

  // Send a game invite to a profile from the browse feed
  const handleGameInvite = useCallback(async (profile: GhostProfile) => {
    const myPhone = localStorage.getItem("ghost_phone") ?? "";
    if (!myPhone) return;
    const rawProfile = (() => { try { return JSON.parse(localStorage.getItem("ghost_profile") ?? "{}"); } catch { return {}; } })();
    const myName = rawProfile.name ?? myPhone;
    const myImage = rawProfile.photo ?? "";
    await sendGameInvite(myPhone, myName, myImage, profile.id);
    setSelectedProfile(null);
  }, []);

  // Supabase: sync tier + coins on mount
  useEffect(() => {
    const myId = getMyGhostId();
    if (!myId) return;
    loadTierFromSupabase(myId).then(tier => {
      if (!tier) return;
      const local = localStorage.getItem("ghost_house_tier");
      if (tier !== local) {
        try { localStorage.setItem("ghost_house_tier", tier); } catch {}
        setHouseTier(tier as "gold" | "suite");
      }
    });
    loadCoinsFromSupabase(myId).then(balance => {
      if (balance === null) return;
      const local = Number(localStorage.getItem("ghost_coins") || "0");
      if (balance !== local) {
        try { localStorage.setItem("ghost_coins", String(balance)); } catch {}
        setCoinBalance(balance);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quick Exit — renders a blank screen instantly
  const [quickExit, setQuickExit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showBreakfastPicker, setShowBreakfastPicker] = useState(false);

  // House rules gate — shows 5s after first arrival, blocks interaction until agreed
  const [houseRulesAgreed, setHouseRulesAgreed] = useState(() => {
    try { return !!localStorage.getItem("ghost_house_welcomed"); } catch { return false; }
  });
  const [showHouseRules, setShowHouseRules] = useState(false);
  const [showSecurityPopup, setShowSecurityPopup] = useState(false);

  useEffect(() => {
    if (houseRulesAgreed) return;
    const timer = setTimeout(() => setShowHouseRules(true), 5000);
    return () => clearTimeout(timer);
  }, [houseRulesAgreed]);

  const handleHouseRulesAccept = () => {
    try { localStorage.setItem("ghost_house_welcomed", "1"); } catch {}
    // Grant 15 complimentary starter coins on first acceptance
    try {
      if (!localStorage.getItem("ghost_starter_coins_given")) {
        localStorage.setItem("ghost_starter_coins_given", "1");
        updateCoins(coinBalance + 15);
      }
    } catch {}
    setHouseRulesAgreed(true);
    setShowHouseRules(false);
    setTimeout(() => setButlerMessage(BUTLER_MESSAGES["room_ready"]), 5000);
  };

  // Filter button randomly cycling glow
  const FILTER_GLOWS = [
    a.glow(0.8),
    "rgba(168,85,247,0.8)",
    "rgba(251,191,36,0.8)",
    "rgba(96,165,250,0.8)",
    "rgba(251,113,133,0.8)",
    "rgba(251,146,60,0.8)",
  ];
  const [filterGlowIdx, setFilterGlowIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setFilterGlowIdx(i => {
        let next = i;
        while (next === i) next = Math.floor(Math.random() * FILTER_GLOWS.length);
        return next;
      });
    }, 1800);
    return () => clearInterval(t);
  }, []);
  const [_settingsGateFeature, setSettingsGateFeature] = useState<string | null>(null);

  // Ghost Flash — 60-minute live pool
  const FLASH_CONTACT_LIMIT = 3;
  const [flashUntil, setFlashUntil] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("ghost_flash_until") || 0); return v > Date.now() ? v : 0; } catch { return 0; }
  });
  const isFlashActive = flashUntil > Date.now();
  const [_flashTick, setFlashTick] = useState(0);
  const [flashMatchProfile, setFlashMatchProfile] = useState<GhostProfile | null>(null);
  const [showFlashPaywall, setShowFlashPaywall] = useState(false);
  const [flashConnectedIds, setFlashConnectedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ghost_flash_connected") || "[]")); } catch { return new Set(); }
  });
  const [connectedMatchIds, setConnectedMatchIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ghost_connected_matches") || "[]")); } catch { return new Set(); }
  });
  const [matchTab, setMatchTab] = useState<"matches" | "ilike" | "liked" | "lobby" | "room">("matches");
  const [showFloorChat,      setShowFloorChat]      = useState(false);
  // Which floor chat to open — defaults to user's own tier, but Kings/Penthouse can visit lower floors
  const [floorChatTier,     setFloorChatTier]      = useState<"standard"|"suite"|"kings"|"penthouse"|"cellar"|"garden"|null>(null);
  const [chatUnread,         setChatUnreadState]    = useState(() => getChatUnread("standard"));
  const [showCheckout,       setShowCheckout]       = useState(false);
  const [showButlerWelcome,  setShowButlerWelcome]  = useState(false);
  const [showLateNight,      setShowLateNight]      = useState(false);
  const [showPushPrompt,     setShowPushPrompt]     = useState(false);
  const [showCoinShop,       setShowCoinShop]       = useState(false);
  const [butlerMessage,      setButlerMessage]      = useState<ButlerMessage | null>(null);
  const [showEvents,         setShowEvents]         = useState(false);
  const [showStats,          setShowStats]          = useState(false);
  const [showReferral,       setShowReferral]       = useState(false);
  const [showLobbyPopup,     setShowLobbyPopup]     = useState(false);
  const [showViewedMe,       setShowViewedMe]       = useState(false);
  const [expandedLikedProfile, setExpandedLikedProfile] = useState<GhostProfile | null>(null);
  const myProfileId = useMemo(() => { try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}").id ?? null; } catch { return null; } }, []);
  const [pendingChatInviteProfileId, setPendingChatInviteProfileId] = useState<string | null>(null);
  const [showFloorInvite,    setShowFloorInvite]    = useState(false);
  const [floorInviteProfile, setFloorInviteProfile] = useState<import("../types/ghostTypes").GhostProfile | null>(null);
  const [floorInviteMode,    setFloorInviteMode]    = useState<"invite" | "request">("invite");
  const [floorInviteTarget,  setFloorInviteTarget]  = useState("standard");
  const [invitedMembers,     setInvitedMembers]     = useState<AcceptedMember[]>(() => getAcceptedFloorMembers());
  const [nudgeProfile,       setNudgeProfile]       = useState<AcceptedMember | null>(null);

  // ── New features ────────────────────────────────────────────────────────────
  const [showGhostScore,   setShowGhostScore]   = useState(false);
  const [scoreProfile,     setScoreProfile]     = useState<GhostProfile | null>(null);
  const [showGhostClock,   setShowGhostClock]   = useState(false);
  const [showFloorWars,    setShowFloorWars]     = useState(false);
  const [showWhisper,      setShowWhisper]       = useState(false);
  const [whisperProfile,   setWhisperProfile]   = useState<GhostProfile | null>(null);
  const [showConcierge,    setShowConcierge]     = useState(false);
  const [conciergeProfile, setConciergeProfile] = useState<GhostProfile | null>(null);
  const [conciergeMatchId, setConciergeMatchId] = useState("");
  const [conciergeDays,    setConciergeDays]     = useState(0);
  const [showSeance,       setShowSeance]        = useState(false);
  const [seanceProfile,    setSeanceProfile]     = useState<GhostProfile | null>(null);
  const [showVideoPlayer,  setShowVideoPlayer]   = useState(false);
  const [videoProfile,     setVideoProfile]      = useState<GhostProfile | null>(null);
  const [showVideoUpload,  setShowVideoUpload]   = useState(false);
  const [showLeaderboard,  setShowLeaderboard]   = useState(false);
  const [showTonightSheet, setShowTonightSheet]  = useState(false);
  // Revealed "liked me" avatars in hero tab
  const [revealedInbound,  setRevealedInbound]   = useState<Set<string>>(new Set());
  const [windowActive,     setWindowActive]      = useState(hasActiveWindowMode);
  // Read room tier as state so navigation back from Rooms page triggers re-render
  const [userRoomTier, setUserRoomTier] = useState<"standard"|"suite"|"kings"|"penthouse"|"cellar"|"garden"|null>(() => {
    try {
      const t = localStorage.getItem("ghost_house_tier");
      const valid = ["standard","suite","kings","penthouse","cellar"];
      return (t && valid.includes(t) ? t : null) as "standard"|"suite"|"kings"|"penthouse"|"cellar"|null;
    } catch { return null; }
  });

  // Re-read tier whenever the page becomes visible again (returning from Rooms page)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      try {
        const t = localStorage.getItem("ghost_house_tier");
        const valid = ["standard","suite","kings","penthouse","cellar"];
        const next = (t && valid.includes(t) ? t : null) as "standard"|"suite"|"kings"|"penthouse"|"cellar"|null;
        setUserRoomTier(next);
      } catch {}
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  // Match-action popup
  const [matchActionProfile, setMatchActionProfile] = useState<GhostProfile | null>(null);
  const [matchActionContext, setMatchActionContext] = useState<MatchActionContext>("match");
  // Live shuffle seed — increments every 20s to rotate profile order
  const [shuffleSeed, setShuffleSeed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setShuffleSeed(s => s + 1), 20000);
    return () => clearInterval(t);
  }, []);

  // Checkout reminder — show 8s after load if within 3 days of plan expiry
  useEffect(() => {
    const t = setTimeout(() => {
      if (shouldShowCheckout()) setShowCheckout(true);
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  // Butler welcome — disabled (flow: house rules only auto-popup)
  // useEffect(() => {
  //   if (!shouldShowButlerWelcome()) return;
  //   const t = setTimeout(() => setShowButlerWelcome(true), 60000);
  //   return () => clearTimeout(t);
  // }, []);

  // Push notification prompt — show 20s after load if not yet subscribed/dismissed
  useEffect(() => {
    if (!shouldShowPushPrompt()) return;
    const t = setTimeout(() => setShowPushPrompt(true), 20000);
    return () => clearTimeout(t);
  }, []);

  // Late-night butler — show 90s after load if time is 10pm–3:59am, once per day
  useEffect(() => {
    if (!shouldShowLateNight()) return;
    const t = setTimeout(() => setShowLateNight(true), 90000);
    return () => clearTimeout(t);
  }, []);

  // Butler nudge — if an invited member joined but hasn't interacted, fire after 30s
  useEffect(() => {
    const members = getAcceptedFloorMembers();
    const silent  = members.find(m => !m.nudgeSentAt && Date.now() - m.joinedAt > 30_000);
    if (!silent) return;
    const t = setTimeout(() => {
      const updated = members.map(m => m.profileId === silent.profileId ? { ...m, nudgeSentAt: Date.now() } : m);
      try { localStorage.setItem("ghost_floor_accepted", JSON.stringify(updated)); } catch {}
      setNudgeProfile(silent);
    }, 5000);
    return () => clearTimeout(t);
  }, [invitedMembers]);

  // Open a specific floor chat when navigated back from Rooms page via "Enter Chat"
  useEffect(() => {
    const state = location.state as { openFloorChat?: string } | null;
    if (!state?.openFloorChat) return;
    const valid = ["standard","suite","kings","penthouse","cellar"];
    const tier = state.openFloorChat;
    if (!valid.includes(tier)) return;
    // Clear state so it doesn't re-trigger on re-render
    navigate(location.pathname, { replace: true, state: {} });
    const t = setTimeout(() => {
      setFloorChatTier(tier as "standard"|"suite"|"kings"|"penthouse"|"cellar");
      setShowFloorChat(true);
      setChatUnreadState(0);
      setChatUnread("standard", 0);
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Auto-open floor chat once per session if user has a room
  useEffect(() => {
    if (!userRoomTier) return;
    if (sessionStorage.getItem("floor_chat_session_opened")) return;
    sessionStorage.setItem("floor_chat_session_opened", "1");
    const t = setTimeout(() => {
      setFloorChatTier(userRoomTier);
      setShowFloorChat(true);
      setChatUnreadState(0);
      setChatUnread("standard", 0);
    }, 2000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRoomTier]);

  // Simulate incoming floor chat messages every 45-90s → increment unread badge when chat is closed
  useEffect(() => {
    if (!userRoomTier) return;
    const schedule = () => {
      const delay = 45000 + Math.random() * 45000;
      return setTimeout(() => {
        if (!showFloorChat) {
          const next = getChatUnread("standard") + 1;
          setChatUnread("standard", next);
          setChatUnreadState(next);
        }
        timerRef.current = schedule();
      }, delay);
    };
    const timerRef = { current: schedule() };
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRoomTier, showFloorChat]);

  // Auto-revert: if user switches to I Like / Liked Me and does nothing for 10s → back to Matches
  const tabRevertRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTabRevert = useCallback(() => {
    if (tabRevertRef.current) clearTimeout(tabRevertRef.current);
    tabRevertRef.current = setTimeout(() => setMatchTab("matches"), 10000);
  }, []);
  const cancelTabRevert = useCallback(() => {
    if (tabRevertRef.current) { clearTimeout(tabRevertRef.current); tabRevertRef.current = null; }
  }, []);
  useEffect(() => {
    if (matchTab === "ilike" || matchTab === "liked") {
      startTabRevert();
    } else if (matchTab === "lobby") {
      // Don't start revert while welcome popup is visible — start it only after dismiss
      cancelTabRevert();
      setShowLobbyWelcome(true);
    } else if (matchTab === "room") {
      cancelTabRevert();
    } else {
      cancelTabRevert();
    }
    return () => cancelTabRevert();
  }, [matchTab, startTabRevert, cancelTabRevert]);
  const [flashContactsUsed, setFlashContactsUsed] = useState<number>(() => {
    try {
      const until = Number(localStorage.getItem("ghost_flash_until") || 0);
      if (until > Date.now()) return Number(localStorage.getItem("ghost_flash_contacts_used") || 0);
      return 0;
    } catch { return 0; }
  });
  const [showFlashLimitToast, setShowFlashLimitToast] = useState(false);

  // ── Shield blocked-attempt alert ──────────────────────────────────────────
  const [showBlockedAlert, setShowBlockedAlert] = useState(false);
  useEffect(() => {
    const pkg = Number(localStorage.getItem("ghost_block_package") || 0);
    if (pkg === 0) return;
    let blocked: string[] = [];
    try { blocked = JSON.parse(localStorage.getItem("ghost_blocked_numbers") || "[]"); } catch {}
    if (blocked.length === 0) return;

    const LAST_KEY = "ghost_blocked_alert_last";
    const last = Number(localStorage.getItem(LAST_KEY) || 0);
    const minGap = 4 * 60 * 1000;
    const now = Date.now();
    const initialDelay = last === 0 ? 90000 : Math.max(0, minGap - (now - last));

    const fire = () => {
      try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch {}
      setShowBlockedAlert(true);
      const next = (4 + Math.floor(Math.random() * 6)) * 60 * 1000;
      setTimeout(fire, next);
    };
    const t = setTimeout(fire, initialDelay);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!isFlashActive) return;
    const t = setInterval(() => setFlashTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [isFlashActive]);

  const enterFlash = () => {
    const until = Date.now() + 60 * 60 * 1000;
    try {
      localStorage.setItem("ghost_flash_until", String(until));
      localStorage.setItem("ghost_flash_contacts_used", "0");
    } catch {}
    setFlashUntil(until);
    setFlashContactsUsed(0);
  };
  const exitFlash = () => {
    try {
      localStorage.removeItem("ghost_flash_until");
      localStorage.removeItem("ghost_flash_contacts_used");
    } catch {}
    setFlashUntil(0);
    setFlashContactsUsed(0);
  };

  // Ghost Vaults membership
  const [houseTier, setHouseTier] = useState<"gold" | "suite" | null>(() => {
    try { return (localStorage.getItem("ghost_house_tier") as "gold" | "suite" | null) ?? null; } catch { return null; }
  });
  const [showHouseModal, setShowHouseModal] = useState(false);
  const handleHousePurchase = (tier: "gold" | "suite") => {
    const next = tier === "gold" || houseTier !== "gold" ? tier : houseTier;
    try { localStorage.setItem("ghost_house_tier", next); } catch {}
    setHouseTier(next);
    setShowHouseModal(false);
    syncTierToSupabase(getMyGhostId(), next);
  };
  const handleReveal = (id: string) => {
    setRevealedIds((prev) => new Set([...prev, id]));
  };

  // ── Breakfast Lounge country picker ──────────────────────────────────────────
  const LOUNGE_COUNTRIES = [
    { name: "Indonesia",    flag: "🇮🇩", utcOffset: 7,    poolCount: 8 },
    { name: "UAE",          flag: "🇦🇪", utcOffset: 4,    poolCount: 2 },
    { name: "Japan",        flag: "🇯🇵", utcOffset: 9,    poolCount: 2 },
    { name: "Singapore",    flag: "🇸🇬", utcOffset: 8,    poolCount: 2 },
    { name: "India",        flag: "🇮🇳", utcOffset: 5.5,  poolCount: 2 },
    { name: "Italy",        flag: "🇮🇹", utcOffset: 1,    poolCount: 2 },
    { name: "France",       flag: "🇫🇷", utcOffset: 1,    poolCount: 2 },
    { name: "Saudi Arabia", flag: "🇸🇦", utcOffset: 3,    poolCount: 2 },
    { name: "Turkey",       flag: "🇹🇷", utcOffset: 3,    poolCount: 1 },
    { name: "Lebanon",      flag: "🇱🇧", utcOffset: 2,    poolCount: 1 },
    { name: "Greece",       flag: "🇬🇷", utcOffset: 2,    poolCount: 1 },
    { name: "Germany",      flag: "🇩🇪", utcOffset: 1,    poolCount: 1 },
    { name: "Spain",        flag: "🇪🇸", utcOffset: 1,    poolCount: 2 },
    { name: "UK",           flag: "🇬🇧", utcOffset: 0,    poolCount: 1 },
    { name: "Ireland",      flag: "🇮🇪", utcOffset: 0,    poolCount: 1 },
    { name: "Egypt",        flag: "🇪🇬", utcOffset: 2,    poolCount: 1 },
    { name: "Nigeria",      flag: "🇳🇬", utcOffset: 1,    poolCount: 1 },
    { name: "Kenya",        flag: "🇰🇪", utcOffset: 3,    poolCount: 1 },
    { name: "Korea",        flag: "🇰🇷", utcOffset: 9,    poolCount: 1 },
    { name: "USA",          flag: "🇺🇸", utcOffset: -5,   poolCount: 1 },
    { name: "Colombia",     flag: "🇨🇴", utcOffset: -5,   poolCount: 1 },
    { name: "Argentina",    flag: "🇦🇷", utcOffset: -3,   poolCount: 1 },
  ] as const;

  const loungeGuestCount = useMemo(() => {
    const utcH = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
    return LOUNGE_COUNTRIES.reduce((sum, c) => {
      const localH = ((utcH + c.utcOffset) % 24 + 24) % 24;
      return sum + (localH >= 7 && localH < 23 ? c.poolCount : 0);
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [loungeEnabled, setLoungeEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("breakfast_lounge_enabled") !== "false"; } catch { return true; }
  });
  const handleToggleLounge = () => {
    const next = !loungeEnabled;
    setLoungeEnabled(next);
    try { localStorage.setItem("breakfast_lounge_enabled", next ? "true" : "false"); } catch {}
  };

  const handleSettingsAction = (action: SettingsAction) => {
    if (action === "rooms") { setShowHouseModal(true); return; }
    if (action === "ghostClock") { setWindowActive(hasActiveWindowMode()); setShowGhostClock(true); return; }
    if (action === "floorWars") { setShowFloorWars(true); return; }
    if (action === "games") { navigate("/ghost/games"); return; }
    if (action === "video") { setShowVideoUpload(true); return; }
    if (action === "breakfastLounge") { if (loungeEnabled) setShowBreakfastPicker(true); return; }
  };

  // Passed (refused) profiles — persisted so they never reappear
  const [passedIds, setPassedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("ghost_passed_ids");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const handlePass = (profileId: string) => {
    const next = new Set(passedIds);
    next.add(profileId);
    setPassedIds(next);
    try { localStorage.setItem("ghost_passed_ids", JSON.stringify([...next])); } catch {}
    setSelectedProfile(null);
  };

  // Filters
  const [gender, setGender] = useState<GenderFilter>(() => {
    try {
      const interest = localStorage.getItem("ghost_interest");
      if (interest === "Women") return "Female";
      if (interest === "Men") return "Male";
      return "all";
    } catch { return "all"; }
  });
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(45);
  const [maxKm, setMaxKm] = useState<KmFilter>(9999);
  const [filterCountry, setFilterCountry] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [lookingFor, setLookingFor] = useState<string>("all");
  const [filterBadge, setFilterBadge] = useState<string>("");

  // Inbound like notification
  const [inboundLike, setInboundLike] = useState<InboundLike | null>(null);
  const inboundShownRef = useRef(false);

  // Hearts cascade on inbound like
  const [showLikeRain, setShowLikeRain] = useState(false);
  const [likeRainHearts] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      delay: Math.random() * 1.2,
      size: 18 + Math.random() * 18,
      duration: 2.5 + Math.random() * 1.5,
    }))
  );

  // New Guests popup
  const [showNewGuests, setShowNewGuests] = useState(false);
  const [lobbyMode, setLobbyMode] = useState(false);
  const newGuestsShownRef = useRef(false);

  // Geolocation
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLat(lat);
        setUserLon(lon);
        setLocationLoading(false);
        // Persist real coordinates to ghost_profile so other users see correct distance
        try {
          const raw = localStorage.getItem("ghost_profile");
          if (raw) {
            const profile = JSON.parse(raw);
            profile.latitude = lat;
            profile.longitude = lon;
            localStorage.setItem("ghost_profile", JSON.stringify(profile));
          }
        } catch {}
      },
      () => setLocationLoading(false),
      { timeout: 8000, enableHighAccuracy: false }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Profile is optional — users can browse and set up later via the dashboard

  // Simulate an inbound international like after 18s (demo — fires once per session)
  // Skipped entirely if the account was created less than 5 minutes ago
  useEffect(() => {
    if (inboundShownRef.current || !hasGhostProfile) return;
    const GRACE_MS = 5 * 60 * 1000; // 5 minutes
    const joinedAt = (() => { try { return Number(localStorage.getItem("ghost_joined_at") || 0); } catch { return 0; } })();
    const accountAgeMs = joinedAt ? Date.now() - joinedAt : GRACE_MS + 1;
    if (accountAgeMs < GRACE_MS) return; // new account — skip notification
    // Inbound like auto-timer disabled (flow: house rules only auto-popup)
    // const t = setTimeout(() => {
    //   if (inboundShownRef.current) return;
    //   inboundShownRef.current = true;
    //   const pick = DEMO_INBOUND[Math.floor(Math.random() * DEMO_INBOUND.length)];
    //   setInboundLike(pick);
    // }, 18000);
    // return () => clearTimeout(t);
  }, [isGhost, hasGhostProfile]);

  // Trigger hearts cascade when a new inbound like arrives
  useEffect(() => {
    if (!inboundLike) return;
    setShowLikeRain(true);
    const t = setTimeout(() => setShowLikeRain(false), 3500);
    return () => clearTimeout(t);
  }, [inboundLike]);

  // New Guests popup — disabled (flow: house rules only auto-popup)
  // useEffect(() => {
  //   if (newGuestsShownRef.current || !hasGhostProfile) return;
  //   const delayMs = (5 + Math.random() * 4) * 60 * 1000;
  //   const t = setTimeout(() => {
  //     if (newGuestsShownRef.current) return;
  //     newGuestsShownRef.current = true;
  //     setShowNewGuests(true);
  //   }, delayMs);
  //   return () => clearTimeout(t);
  // }, [hasGhostProfile]);

  // Base profiles — real Supabase profiles + mock SEA + international
  const allProfiles = useMemo<GhostProfile[]>(() => {
    // Convert real DB rows to GhostProfile shape
    const real: GhostProfile[] = realProfiles.map(r => ({
      id: r.id,
      name: r.name,
      age: r.age,
      city: r.city,
      country: r.country,
      countryFlag: r.country_flag,
      gender: r.gender,
      image: r.photo_url || "https://i.pravatar.cc/400",
      bio: r.bio ?? null,
      interests: r.interests ?? null,
      firstDateIdea: r.first_date_idea ?? null,
      religion: r.religion ?? null,
      connectPhone: r.connect_phone ?? null,
      connectAlt: r.connect_alt ?? null,
      connectAltHandle: r.connect_alt_handle ?? null,
      isVerified: r.is_verified ?? false,
      faceVerified: r.face_verified ?? false,
      latitude: r.latitude ?? undefined,
      longitude: r.longitude ?? undefined,
      distanceKm: userLat !== null && userLon !== null && r.latitude && r.longitude
        ? haversineKm(userLat, userLon, r.latitude, r.longitude) : undefined,
      lastActiveHoursAgo: 0, // real users are considered active
    }));

    const raw = generateIndonesianProfiles();
    const sea: GhostProfile[] = raw.map((p) => {
      const lat = p.latitude ?? undefined;
      const lng = p.longitude ?? undefined;
      const distanceKm =
        userLat !== null && userLon !== null && lat !== undefined && lng !== undefined
          ? haversineKm(userLat, userLon, lat, lng)
          : undefined;
      return {
        id: p.id,
        name: p.name,
        age: p.age,
        city: p.city,
        country: p.country,
        countryFlag: p.countryFlag,
        image: p.image || "/placeholder.svg",
        last_seen_at: p.last_seen_at ?? null,
        gender: p.gender || "Female",
        latitude: lat,
        longitude: lng,
        distanceKm,
        lastActiveHoursAgo: activeHoursAgo(p.id),
        isVerified: profileIsVerified(p.id),
        isNewGuest: p.isNewGuest,
        badge: p.badge ?? null,
      };
    });
    const intl = INTL_PROFILES.map((p) => ({ ...p, lastActiveHoursAgo: activeHoursAgo(p.id), isVerified: profileIsVerified(p.id) }));
    // Real profiles go first, then mocks
    const realIds = new Set(real.map(r => r.id));
    const merged = [...real, ...sea.filter(p => !realIds.has(p.id)), ...intl];

    if (ipCountry?.countryCode) {
      const userCC = ipCountry.countryCode;
      merged.sort((a, b) => {
        const aCC = a.countryFlag ? Object.entries({ ID:"🇮🇩",PH:"🇵🇭",TH:"🇹🇭",SG:"🇸🇬",MY:"🇲🇾",VN:"🇻🇳" }).find(([,f])=>f===a.countryFlag)?.[0] ?? "ZZ" : "ZZ";
        const bCC = b.countryFlag ? Object.entries({ ID:"🇮🇩",PH:"🇵🇭",TH:"🇹🇭",SG:"🇸🇬",MY:"🇲🇾",VN:"🇻🇳" }).find(([,f])=>f===b.countryFlag)?.[0] ?? "ZZ" : "ZZ";
        return getCountryProximity(userCC, aCC) - getCountryProximity(userCC, bCC);
      });
    }
    return merged;
  }, [userLat, userLon, ipCountry, realProfiles]);

  // New guest profiles subset (for popup + lobby mode)
  const newGuestProfiles = useMemo(() => allProfiles.filter((p) => p.isNewGuest), [allProfiles]);

  // Don't show popup if there are no new guests
  useEffect(() => {
    if (showNewGuests && newGuestProfiles.length === 0) setShowNewGuests(false);
  }, [showNewGuests, newGuestProfiles.length]);

  // Filtered + sorted profiles (excludes passed/refused)
  const profiles = useMemo(() => {
    return allProfiles
      .filter((p) => {
        if (passedIds.has(p.id)) return false;
        if (lobbyMode && !p.isNewGuest) return false;
        if (filterBadge && p.badge !== filterBadge) return false;
        if (p.lastActiveHoursAgo !== undefined && p.lastActiveHoursAgo > 24) return false;
        if (gender !== "all" && p.gender !== gender) return false;
        if (p.age < ageMin || p.age > ageMax) return false;
        if (maxKm !== 9999 && p.distanceKm !== undefined && p.distanceKm > maxKm) return false;
        if (onlineOnly && !isOnline(p.last_seen_at)) return false;
        if (browsingCountryCode) {
          const cc = FLAG_TO_CODE[p.countryFlag ?? ""] ?? "";
          if (cc !== browsingCountryCode) return false;
        } else {
          if (filterCountry && p.country !== filterCountry) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.distanceKm !== undefined && b.distanceKm !== undefined) return a.distanceKm - b.distanceKm;
        return 0;
      });
  }, [allProfiles, gender, ageMin, ageMax, maxKm, filterCountry, onlineOnly, passedIds, browsingCountryCode, lobbyMode, filterBadge]);

  // ── Computed match-tab lists ───────────────────────────────────────────────
  // Profiles the user has liked
  const iLikeList = useMemo(
    () => allProfiles.filter(p => likedIds.has(p.id)),
    [allProfiles, likedIds]
  );
  // Hotel lobby profiles — only active guests (online or app open in background within 30 min)
  const lobbyList = useMemo(
    () => allProfiles
      .filter(p => isFlashProfile(p.id))
      .filter(p => isOnline(p.last_seen_at) || (p.lastActiveHoursAgo ?? 99) <= 0.5)
      .slice(0, 24),
    [allProfiles]
  );

  // Room members — profiles "assigned" to the same tier as the user (seeded by profile ID hash)
  const TIER_COLORS: Record<string, string> = { standard: "#a8a8b0", suite: "#cd7f32", kings: "#d4af37", penthouse: "#e0ddd8", cellar: "#9b1c1c", garden: "#7a9e7e" };
  const TIER_LABELS: Record<string, string> = { standard: "Standard Room", suite: "Ensuite", kings: "The Casino", penthouse: "Penthouse", cellar: "The Cellar", garden: "Garden Lodge" };
  const TIER_ICONS: Record<string, string>  = { standard: "🛏️", suite: "🛎️", kings: "🎰", penthouse: "🏙️", cellar: "🕯️", garden: "🌿" };
  const tierColor = userRoomTier ? (TIER_COLORS[userRoomTier] ?? a.accent) : a.accent;
  const tierLabel = userRoomTier ? (TIER_LABELS[userRoomTier] ?? "My Room") : "My Room";
  const tierIcon  = userRoomTier ? (TIER_ICONS[userRoomTier] ?? "🏠") : "🏠";
  // Assign tier to each profile deterministically, then filter to match user's tier
  const roomMemberList = useMemo(() => {
    const TIER_ORDER = ["standard", "suite", "kings", "penthouse"];
    if (!userRoomTier) return allProfiles.slice(0, 12);
    const targetIdx = TIER_ORDER.indexOf(userRoomTier);
    return allProfiles.filter(p => {
      const hash = p.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return hash % 4 === targetIdx;
    }).slice(0, 24);
  }, [allProfiles, userRoomTier]);

  // Profiles that viewed the user's profile — seeded deterministically per Ghost ID
  const viewedMeList = useMemo(() => {
    if (!allProfiles.length) return [] as Array<typeof allProfiles[0] & { viewCount: number }>;
    try {
      const gid = (() => { const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}"); return p.id || "anon"; })();
      const seed = gid.split("").reduce((h: number, c: string) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0);
      const arr = [...allProfiles];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.abs(Math.sin(i * 71 + seed * 137)) * (i + 1) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      const VIEW_COUNTS = [4, 3, 2, 2, 2, 1, 3, 1, 2, 1, 1, 2, 1, 1, 1];
      return arr.slice(0, 15)
        .map((p, i) => ({ ...p, viewCount: VIEW_COUNTS[i] ?? 1 }))
        .sort((a, b) => b.viewCount - a.viewCount);
    } catch { return [] as Array<typeof allProfiles[0] & { viewCount: number }>; }
  }, [allProfiles]);

  // Profiles that "liked" the user — seeded demo: unfiltered profiles the user hasn't liked back
  // A seeded-shuffle changes their order every shuffleSeed tick so it feels "live"
  const likedMeList = useMemo(() => {
    const base = allProfiles.filter(p => !likedIds.has(p.id)).slice(0, 20);
    if (base.length <= 3) return base;
    const arr = [...base];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.abs(Math.sin(i * 127 + shuffleSeed * 4093)) * (i + 1) | 0;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [allProfiles, likedIds, shuffleSeed]);

  const saveMatch = (profile: GhostProfile) => {
    const next = [
      ...savedMatches.filter((m) => m.id !== profile.id && Date.now() - m.matchedAt < MATCH_EXPIRY_MS),
      { id: profile.id, profile, matchedAt: Date.now() },
    ];
    setSavedMatches(next);
    persistMatches(next);
  };

  const handleLike = (profile: GhostProfile) => {
    if (!isAuthed) { setShowAuthGate(true); return; }
    const newLiked = new Set(likedIds);
    newLiked.add(profile.id);
    setLikedIds(newLiked);
    // Persist like to Supabase (fire and forget)
    recordLike(getMyGhostId(), profile.id);
    try {
      const key = `ghost_likes_today_${new Date().toISOString().slice(0, 10)}`;
      localStorage.setItem(key, String((parseInt(localStorage.getItem(key) ?? "0") || 0) + 1));
      const streakKey = "ghost_streak";
      const lastKey = "ghost_streak_last_day";
      const today = new Date().toISOString().slice(0, 10);
      const last = localStorage.getItem(lastKey);
      if (last !== today) {
        const streak = parseInt(localStorage.getItem(streakKey) ?? "0") || 0;
        localStorage.setItem(streakKey, String(last === new Date(Date.now() - 86400000).toISOString().slice(0, 10) ? streak + 1 : 1));
        localStorage.setItem(lastKey, today);
      }
    } catch {}

    if (isFlashActive && isFlashProfile(profile.id)) {
      if (flashContactsUsed >= FLASH_CONTACT_LIMIT) {
        setShowFlashLimitToast(true);
        setTimeout(() => setShowFlashLimitToast(false), 3500);
        setTimeout(() => setSelectedProfile(null), 300);
        return;
      }
      const nextCount = flashContactsUsed + 1;
      setFlashContactsUsed(nextCount);
      try { localStorage.setItem("ghost_flash_contacts_used", String(nextCount)); } catch {}
      setTimeout(() => {
        setSelectedProfile(null);
        saveMatch(profile);
        setFlashMatchProfile(profile);
      }, 300);
      return;
    }

    const likeCount = newLiked.size;
    if (likeCount % 3 === 0) {
      setTimeout(() => {
        setSelectedProfile(null);
        saveMatch(profile);
        setMatchProfile(profile);
      }, 600);
    } else {
      setTimeout(() => setSelectedProfile(null), 400);
    }
  };

  const [showLobbyWelcome, setShowLobbyWelcome] = useState(false);

  // ── Match-action popup handlers ──────────────────────────────────────────
  const openMatchAction = (profile: GhostProfile, ctx: MatchActionContext) => {
    cancelTabRevert();
    setMatchActionProfile(profile);
    setMatchActionContext(ctx);
  };
  const handleLikeBack = (profile: GhostProfile) => {
    handleLike(profile);
    saveMatch(profile);
    setMatchActionProfile(null);
    setMatchTab("matches");
  };
  const handleSendGift = (_emoji: string, coins: number) => {
    updateCoins(coinBalance - coins);
  };
  const handleMatchConnect = (profile: GhostProfile) => {
    setMatchActionProfile(null);
    if (matchActionContext === "lobby") {
      enterFlash();
      setMatchTab("matches");
    } else {
      setConnectNowProfile(profile);
    }
  };

  // ── Quick Exit ───────────────────────────────────────────────────────────
  if (quickExit) {
    return (
      <div
        style={{ position: "fixed", inset: 0, background: "#f2f2f7", zIndex: 99999, cursor: "pointer" }}
        onClick={() => setQuickExit(false)}
      >
        <div style={{ padding: "60px 20px 0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          <div style={{ height: 44, background: "#fff", borderRadius: 12, display: "flex", alignItems: "center", padding: "0 14px", gap: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", marginBottom: 16 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#e5e5ea" }} />
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#e5e5ea" }} />
          </div>
          <div style={{ background: "#fff", borderRadius: 12, height: 200, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }} />
        </div>
      </div>
    );
  }

  return (
    <div translate="no" style={{ minHeight: "100dvh", background: "#050508", display: "flex", justifyContent: "center" }}>
    <div
      style={{ width: "100%", maxWidth: 480, minHeight: "100dvh", background: "#050508", color: "#fff", display: "flex", flexDirection: "column", position: "relative" }}
    >
      {/* Blocking overlay — sits above cards/content but below house rules modal and install banner */}
      {!houseRulesAgreed && (
        <div
          onClick={() => setShowSecurityPopup(true)}
          style={{ position: "fixed", inset: 0, zIndex: 120, cursor: "default" }}
        />
      )}
      <GhostParticles />

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingTop: `max(12px, env(safe-area-inset-top, 12px))`,
      }}>
        {/* Top row: title + primary actions */}
        <div style={{ padding: "0 16px 6px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
            <h1 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>
              Mr.Butlas
            </h1>
          </div>
          {/* Coin balance pill */}
          <button
            onClick={() => setShowCoinShop(true)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: coinDebt > 0 ? "rgba(239,68,68,0.12)" : "rgba(212,175,55,0.08)",
              border: coinDebt > 0 ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(212,175,55,0.4)",
              borderRadius: 20, padding: "5px 10px",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 14 }}>{coinDebt > 0 ? "🔴" : "🪙"}</span>
            <span style={{ fontSize: 13, fontWeight: 900, fontVariantNumeric: "tabular-nums",
              color: coinDebt > 0 ? "#f87171" : "#d4af37" }}>
              {coinDebt > 0 ? `−${coinDebt}` : coinBalance.toLocaleString()}
            </span>
          </button>
          {/* Settings — opens side drawer */}
          <button
            onClick={() => { setSettingsGateFeature(null); setShowSettingsSheet(true); }}
            style={{
              width: 38, height: 38, borderRadius: 12, flexShrink: 0,
              background: a.glow(0.1), border: `1.5px solid ${a.glow(0.3)}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: a.accent,
              boxShadow: `0 0 12px ${a.glow(0.2)}`,
            }}
          >
            <Settings size={17} />
          </button>
        </div>

      </div>


      {/* ── Matches container ── */}
      {(() => {
        const activeMatches = savedMatches
          .filter((m) => Date.now() - m.matchedAt < MATCH_EXPIRY_MS && !connectedMatchIds.has(m.id));
        const PLACEHOLDER_IMG = isFemale
          ? "https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdftewrtewrtDASDASD.png?updatedAt=1774110335030"
          : "https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdftewrtewrtDASDASDDSDS.png?updatedAt=1774110383388";

        // Use component-level computed lists (shuffled live)
        const iLikeProfiles = iLikeList;
        const likedMeProfiles = likedMeList;

        // Avatar size: exactly 3 fit in screen width
        // 28px margins + 2×8px item gaps = 44px, plus 8px flex-gap + 4px marginLeft + 52px buttons = 64px → 108px total
        const avatarSize = "calc((100vw - 108px) / 3)";
        // Height: profile item (avatar + 4px gap + ~12px label) should equal button stack (44+6+44 = 94px)
        const avatarH = 78;

        // Header label
        const tabLabel = matchTab === "ilike" ? "I Like" : matchTab === "liked" ? "Liked Me" : matchTab === "lobby" ? "Hotel Lobby" : matchTab === "room" ? tierLabel : "Matches";
        const tabCount = matchTab === "ilike" ? iLikeProfiles.length : matchTab === "liked" ? likedMeProfiles.length : matchTab === "lobby" ? lobbyList.length : matchTab === "room" ? roomMemberList.length : activeMatches.length;
        // Lobby uses gender accent (same as everything else — pink/green)
        const dotColor = a.accent;
        const dotGlow  = a.glow(0.9);
        const labelColor = a.glow(0.85);

        // Build scroll content
        const renderScrollContent = () => {
          if (matchTab === "ilike") {
            const TOTAL = Math.max(3, iLikeProfiles.length);
            const phCount = TOTAL - iLikeProfiles.length;
            return (
              <>
                {iLikeProfiles.map((p, i) => (
                  <div key={p.id} onClick={() => openMatchAction(p, "ilike")}
                    style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
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
                    </div>
                    <p style={{ fontSize: 8, color: a.glow(0.8), fontWeight: 700, margin: 0, textAlign: "center", width: avatarSize, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name}</p>
                  </div>
                ))}
                {Array.from({ length: phCount }).map((_, i) => (
                  <div key={`ph-${i}`} style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: avatarSize, height: avatarH, borderRadius: "50%", border: `2px dashed ${a.glow(0.2)}`, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 14, opacity: 0.3 }}>👻</span>
                    </div>
                    <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", margin: 0 }}>Soon…</p>
                  </div>
                ))}
              </>
            );
          }
          if (matchTab === "liked") {
            const TOTAL = Math.max(3, likedMeProfiles.length);
            const phCount = TOTAL - likedMeProfiles.length;
            return (
              <>
                {likedMeProfiles.map((p, i) => {
                  const revealed = revealedInbound.has(p.id);
                  return (
                    <div key={p.id}
                      onClick={() => {
                        if (revealed) { setExpandedLikedProfile(p); return; }
                        const current = coinBalance;
                        if (current < 20) { setShowCoinShop(true); return; }
                        updateCoins(current - 20);
                        setRevealedInbound(prev => new Set([...prev, p.id]));
                        setExpandedLikedProfile(p);
                      }}
                      style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
                    >
                      <div style={{ position: "relative", width: avatarSize, height: avatarH }}>
                        <motion.div
                          animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.18 }}
                          style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid rgba(220,20,20,0.65)", pointerEvents: "none" }}
                        />
                        <img src={p.image} alt=""
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(220,20,20,0.45)", display: "block", filter: revealed ? "none" : "blur(7px) brightness(0.65)", transition: "filter 0.4s" }}
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                        {!revealed && (
                          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.15)" }}>
                            <span style={{ fontSize: 8, fontWeight: 900, color: "#d4af37", textAlign: "center", lineHeight: 1.3 }}>20🪙</span>
                          </div>
                        )}
                      </div>
                      <p style={{ fontSize: 8, color: "rgba(220,20,20,0.85)", fontWeight: 700, margin: 0, textAlign: "center", width: avatarSize, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                        {revealed ? p.name : "???"}
                      </p>
                    </div>
                  );
                })}
                {Array.from({ length: phCount }).map((_, i) => (
                  <div key={`ph-${i}`} style={{ flexShrink: 0, width: avatarSize, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: avatarSize, height: avatarH, borderRadius: "50%", border: "2px dashed rgba(220,20,20,0.2)", background: "rgba(220,20,20,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 14, opacity: 0.3 }}>💗</span>
                    </div>
                    <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", margin: 0 }}>Soon…</p>
                  </div>
                ))}
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

        return (
          <div style={{ margin: "10px 14px 0" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <motion.span
                animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, display: "block", boxShadow: `0 0 8px ${dotGlow}`, flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, fontWeight: 800, color: labelColor, letterSpacing: "0.1em", textTransform: "uppercase" }}>{tabLabel}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", flex: 1 }}>
                · {tabCount > 0 ? `${tabCount} ${matchTab === "liked" ? "liked you" : matchTab === "lobby" ? "in lobby" : "waiting"}` : "waiting for you"}
              </span>
              {/* Butler — right side */}
              <div
                onClick={() => { if (isCitySupported(userCity)) { setButlerMatchName(undefined); setShowButler(true); } else setShowButlerUnavailable(true); }}
                style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", flexShrink: 0, padding: "6px 0 6px 10px" }}
              >
                <img src="https://ik.imagekit.io/7grri5v7d/butlers%20tray.png" alt="butler" style={{ width: 16, height: 16, objectFit: "contain" }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>Butler Service</span>
              </div>
            </div>
            {/* Main row: scroll area + tab buttons */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              {/* Scrollable profiles */}
              <style>{`.matches-row::-webkit-scrollbar { display: none; }`}</style>
              <div className="matches-row" onScroll={() => { if (matchTab !== "matches") startTabRevert(); }} style={{ flex: 1, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
                {renderScrollContent()}
              </div>
              {/* Tab buttons — stacked vertically */}
              <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 6, paddingBottom: 8, marginLeft: 4 }}>
                <button
                  onClick={() => setMatchTab(matchTab === "ilike" ? "matches" : "ilike")}
                  style={{
                    width: 52, height: 44, borderRadius: 10,
                    background: matchTab === "ilike" ? a.gradient : "rgba(255,255,255,0.07)",
                    border: matchTab === "ilike" ? "none" : "1.5px solid rgba(255,255,255,0.15)",
                    cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                    boxShadow: matchTab === "ilike" ? `0 0 14px ${a.glow(0.5)}` : "none",
                  }}
                >
                  <img src="https://ik.imagekit.io/7grri5v7d/dfghdfghdfghdfg-removebg-preview.png?updatedAt=1774183141963" alt="" style={{ width: 22, height: 22, objectFit: "contain", display: "block" }} />
                  <span style={{ fontSize: 8, fontWeight: 700, color: matchTab === "ilike" ? "#fff" : "rgba(255,255,255,0.5)", letterSpacing: "0.02em" }}>I Like</span>
                </button>
                <button
                  onClick={() => setMatchTab(matchTab === "liked" ? "matches" : "liked")}
                  style={{
                    width: 52, height: 44, borderRadius: 10,
                    background: matchTab === "liked" ? "linear-gradient(to bottom, #ff3b3b 0%, #e01010 40%, #b80000 100%)" : "rgba(255,255,255,0.07)",
                    border: matchTab === "liked" ? "none" : "1.5px solid rgba(255,255,255,0.15)",
                    cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                    boxShadow: matchTab === "liked" ? "0 0 14px rgba(220,20,20,0.5)" : "none",
                  }}
                >
                  <span style={{ fontSize: 15 }}>❤️</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: matchTab === "liked" ? "#fff" : "rgba(255,255,255,0.5)", letterSpacing: "0.02em" }}>Liked</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}




      {/* ── Quick-action buttons — row 1 ── */}
      <div style={{ margin: "12px 14px 0", display: "flex", gap: 8 }}>
        {/* Vault */}
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => requireAuth(() => navigate("/ghost/room"))}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: a.glow(0.08), border: `1px solid ${a.glow(0.28)}`, borderRadius: 14, cursor: "pointer" }}
        >
          <Lock size={20} style={{ color: "#fff", flexShrink: 0 }} />
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: a.accent }}>Vault</p>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Private</p>
          </div>
        </motion.button>

        {/* Tonight */}
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => requireAuth(() => setShowTonightSheet(true))}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: lobbyList.length > 0 ? "rgba(220,20,20,0.12)" : "rgba(220,20,20,0.08)", border: `1px solid ${lobbyList.length > 0 ? "rgba(220,20,20,0.5)" : "rgba(220,20,20,0.25)"}`, borderRadius: 14, cursor: "pointer", position: "relative" }}
        >
          {lobbyList.length > 0 && (
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }}
              style={{ position: "absolute", top: 7, right: 8, width: 6, height: 6, borderRadius: "50%", background: "#e01010", boxShadow: "0 0 6px rgba(220,20,20,0.9)" }} />
          )}
          <Moon size={20} style={{ color: "#fff", flexShrink: 0 }} />
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: "#e01010" }}>Tonight</p>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Available</p>
          </div>
        </motion.button>

        {/* Rooms */}
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => requireAuth(() => navigate("/ghost/rooms"))}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: a.glow(0.08), border: `1px solid ${a.glow(0.28)}`, borderRadius: 14, cursor: "pointer" }}
        >
          <KeyRound size={20} style={{ color: "#fff", flexShrink: 0 }} />
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: a.accent }}>Rooms</p>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Upgrade</p>
          </div>
        </motion.button>
      </div>

      {/* ── Quick-action buttons — row 2 ── */}
      <div style={{ margin: "8px 14px 0", display: "flex", gap: 8 }}>
        {/* Floor Chat */}
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={() => requireAuth(() => {
            const tier = userRoomTier ?? "standard";
            setFloorChatTier(tier);
            setShowFloorChat(true);
            setChatUnreadState(0);
            setChatUnread("standard", 0);
          })}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: a.glow(0.08), border: `1px solid ${a.glow(0.28)}`, borderRadius: 14, cursor: "pointer", position: "relative" }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>💬</span>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: a.accent }}>Chat</p>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>Members live</p>
          </div>
          {chatUnread > 0 && (
            <div style={{ position: "absolute", top: 6, right: 8, minWidth: 16, height: 16, borderRadius: 8, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: "#fff" }}>{chatUnread > 9 ? "9+" : chatUnread}</span>
            </div>
          )}
        </motion.button>

        {/* Viewed Me */}
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => requireAuth(() => setShowViewedMe(true))}
          style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: a.glow(0.08), border: `1px solid ${a.glow(0.28)}`, borderRadius: 14, cursor: "pointer", position: "relative" }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>👁️</span>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: a.accent }}>Viewed</p>
            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{viewedMeList.length} profiles</p>
          </div>
          {viewedMeList.some(p => p.viewCount >= 2) && (
            <div style={{ position: "absolute", top: 6, right: 8, minWidth: 16, height: 16, borderRadius: 8, background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: "#fff" }}>{viewedMeList.filter(p => p.viewCount >= 2).length}</span>
            </div>
          )}
        </motion.button>
      </div>

      {/* Filter slide-up sheet */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFilters(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="ghost-flash-scroll"
              style={{
                position: "fixed", bottom: 0,
                left: "50%", transform: "translateX(-50%)",
                width: "100%", maxWidth: 480,
                background: "rgba(8,8,14,0.98)", backdropFilter: "blur(30px)",
                borderRadius: "22px 22px 0 0",
                border: "1px solid rgba(255,255,255,0.08)",
                paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
                maxHeight: "85dvh", overflowY: "auto",
                scrollbarWidth: "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SlidersHorizontal size={16} color={a.glow(0.9)} />
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>Filters</span>
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 16, fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>
              {/* ── Stats row inside filter sheet ── */}
              <div style={{ display: "flex", gap: 8, padding: "0 18px 14px" }}>
                {[
                  { label: "Liked", value: likedIds.size },
                  { label: "Active now", value: profiles.filter((p) => isOnline(p.last_seen_at)).length },
                  { label: "Showing", value: profiles.length },
                  ...(ipCountry ? [{ label: ipCountry.countryName, value: "📍" }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={{ flex: 1, background: a.glow(0.05), borderRadius: 10, border: `1px solid ${a.glow(0.1)}`, padding: "8px 0", textAlign: "center" }}>
                    <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>{value}</p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: 0 }}>{label}</p>
                  </div>
                ))}
              </div>

              <div style={{ padding: "0 18px" }}>
                <FilterBar
                  gender={gender} setGender={setGender}
                  ageMin={ageMin} ageMax={ageMax} setAgeMin={setAgeMin} setAgeMax={setAgeMax}
                  maxKm={maxKm} setMaxKm={setMaxKm}
                  locationLoading={locationLoading} hasLocation={userLat !== null}
                  onRequestLocation={requestLocation}
                  filterCountry={filterCountry} setFilterCountry={setFilterCountry}
                  onlineOnly={onlineOnly} setOnlineOnly={setOnlineOnly}
                  lookingFor={lookingFor} setLookingFor={setLookingFor}
                  filterBadge={filterBadge} setFilterBadge={setFilterBadge}
                />
              </div>
              <div style={{ padding: "14px 18px 0" }}>
                <button
                  onClick={() => setShowFilters(false)}
                  style={{
                    width: "100%", height: 44, borderRadius: 12, border: "none",
                    background: `linear-gradient(to bottom, ${a.accent}, #22c55e)`,
                    color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                    boxShadow: `0 4px 16px ${a.glowMid(0.35)}`,
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Tonight Mode banner */}
      <AnimatePresence>
        {isTonightMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ margin: "8px 14px 0", background: a.glow(0.1), border: `1px solid ${a.glow(0.3)}`, borderRadius: 10, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}
          >
            <Moon size={12} color={a.glow(0.9)} fill={a.glow(0.3)} />
            <p style={{ fontSize: 11, color: a.glow(0.9), margin: 0, fontWeight: 700 }}>
              <span>Tonight Mode is ON · resets at midnight</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── Ghost Pulse row — hidden when Flash is active ── */}


      {/* ── Invite popup (shown after 7 min for all users) ── */}
      <AnimatePresence>
        {showInvitePopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowInvitePopup(false); setInvitePopupDismissed(true); }}
            style={{
              position: "fixed", inset: 0, zIndex: 600,
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 24px",
            }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 320,
                background: "linear-gradient(160deg, rgba(5,8,5,0.98) 0%, rgba(8,12,8,0.98) 100%)",
                border: `1px solid ${a.glow(0.2)}`,
                borderRadius: 20, padding: "22px 20px 20px",
                position: "relative", overflow: "hidden",
              }}
            >
              {/* Top accent */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, #16a34a, ${a.accent}, #22c55e)` }} />

              {/* Close */}
              <button
                onClick={() => { setShowInvitePopup(false); setInvitePopupDismissed(true); }}
                style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}
              >×</button>

              {/* Icon */}
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <img src="https://ik.imagekit.io/7grri5v7d/Haunted%20hotel%20key%20and%20tag.png" alt="key" style={{ width: 52, height: 52, objectFit: "contain" }} />
              </div>

              {/* Header */}
              <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", textAlign: "center", margin: "0 0 6px", lineHeight: 1.3 }}>
                Rooms Remain Available<br />
                <span style={{ color: a.accent }}>Invite a Guest for Free Access</span>
              </p>

              {/* Subtext */}
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textAlign: "center", margin: "0 0 18px", lineHeight: 1.5 }}>
                Guest's Must Follow Our Privacy Hotel Rules
              </p>

              {/* Invite button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const ghostId = (() => { try { const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}"); return toGhostId(p.id || "anon"); } catch { return toGhostId("anon"); } })();
                  const url = `${window.location.origin}/ghost/auth?ref=${ghostId}`;
                  if (navigator.share) {
                    navigator.share({ title: "Join Ghost Rooms", text: "I'm on Ghost — come join me 👻", url });
                  } else {
                    navigator.clipboard.writeText(url).then(() => {
                      setReferralCopied(true);
                      setTimeout(() => setReferralCopied(false), 2500);
                    });
                  }
                }}
                style={{
                  width: "100%", height: 44, borderRadius: 12, border: "none",
                  background: a.gradient,
                  color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  boxShadow: `0 4px 16px ${a.glow(0.3)}`,
                }}
              >
                <Gift size={14} />
                {referralCopied ? "Link Copied!" : "Send Invite"}
              </motion.button>

              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textAlign: "center", margin: "10px 0 0" }}>
                Tap outside to dismiss
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Found Boo banner ── */}
      <AnimatePresence>
        {isProfilePaused && foundBoo && (
          <FoundBooBanner
            foundBoo={foundBoo}
            onReactivate={() => {
              try { localStorage.removeItem("ghost_found_boo"); } catch {}
              setFoundBoo(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Lobby mode banner ── */}
      <AnimatePresence>
        {lobbyMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              margin: "10px 14px 0",
              background: a.glow(0.07),
              border: `1px solid ${a.glow(0.25)}`,
              borderRadius: 12, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>🏨</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: a.accent, margin: 0 }}>The Lobby — New Guests</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Showing {newGuestProfiles.length} guests who just arrived</p>
            </div>
            <button
              onClick={() => setLobbyMode(false)}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, padding: "4px 10px", cursor: "pointer" }}
            >
              Exit
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Profile completion nudge ── */}
      {(() => {
        try {
          const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
          let pct = 0;
          if (p.photo || p.image) pct += 25;
          if (p.bio) pct += 25;
          if (localStorage.getItem("ghost_voice_note")) pct += 20;
          if (p.photo2 || p.secondPhoto) pct += 15;
          if (p.firstDateIdea) pct += 15;
          if (pct >= 100) return null;
          return (
            <div
              onClick={() => navigate("/ghost/setup")}
              style={{ margin: "8px 14px 0", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                  Profile {pct}% complete — complete it for 3× more matches
                </span>
                <span style={{ fontSize: 10, color: a.accent, fontWeight: 700 }}>Edit →</span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: `linear-gradient(90deg,${a.accentDark},${a.accent})`, transition: "width 0.5s" }} />
              </div>
            </div>
          );
        } catch { return null; }
      })()}

      {/* ── Daily Login Streak Banner ── */}
      <GhostStreakBanner />

      {/* ── Country + Filter floating bar ── */}
      <div style={{ margin: "10px 14px 6px", display: "flex", alignItems: "center", gap: 8 }}>
        {/* Trophy — leaderboard */}
        <button
          onClick={() => setShowLeaderboard(true)}
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 16,
          }}
        >
          🏆
        </button>
        {/* Country dropdown — left */}
        <div style={{ position: "relative", flex: 1 }}>
          <select
            value={browsingCountryCode ?? ""}
            onChange={(e) => setBrowsingCountryCode(e.target.value || null)}
            style={{
              width: "100%", height: 36, borderRadius: 10,
              background: browsingCountryCode ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.05)",
              border: browsingCountryCode ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.1)",
              color: browsingCountryCode ? "#818cf8" : "rgba(255,255,255,0.6)",
              fontSize: 12, fontWeight: 700, padding: "0 10px",
              appearance: "none", WebkitAppearance: "none", cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">{homeFlag} {homeCountryName}</option>
            {SEA_COUNTRY_LIST.filter((c) => c.code !== homeCountryCode).map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
            ))}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>▾</span>
        </div>
        {/* Filter button — right */}
        <button onClick={() => setShowFilters(true)} title="Filter"
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: a.glow(0.12),
            border: `1.5px solid ${a.glow(0.6)}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <SlidersHorizontal size={15} color={a.accent} />
        </button>
      </div>


      {/* ── Section header ── */}
      {(() => {
        const displayCountry = browsingCountryCode
          ? (SEA_COUNTRY_LIST.find((c) => c.code === browsingCountryCode)?.name ?? homeCountryName)
          : homeCountryName;
        return (
          <div style={{ margin: "14px 14px 4px" }}>
            <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1.15 }}>
              {displayCountry}'s
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.38)", fontWeight: 500, letterSpacing: "0.01em" }}>
              Real Connections waiting for you
            </p>
          </div>
        );
      })()}

      {/* Profile grid */}
      {profiles.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 14 }}>
          <span style={{ fontSize: 64 }}>👻</span>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff", textAlign: "center" }}>No ghosts in {userCity} yet</p>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.55 }}>
            Be the first. Invite 3 friends → get 50 free coins
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const url = `https://2ghost.app?ref=${getMyGhostId()}`;
              if (navigator.share) {
                navigator.share({ title: "Join 2Ghost", text: "Join me on 2Ghost — anonymous dating done right 👻", url });
              } else {
                try { navigator.clipboard.writeText(url); } catch {}
                setReferralCopied(true);
                setTimeout(() => setReferralCopied(false), 2000);
              }
            }}
            style={{ height: 46, borderRadius: 14, background: "linear-gradient(135deg,#16a34a,#4ade80)", border: "none", color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer", padding: "0 28px" }}
          >
            {referralCopied ? "Link copied! ✓" : "Invite Friends 🤝"}
          </motion.button>
        </div>
      ) : (
        <div style={{ flex: 1, padding: "12px 14px 24px", paddingBottom: `max(24px, env(safe-area-inset-bottom, 24px))`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {profiles.map((profile) => (
            <GhostCard
              key={profile.id}
              profile={profile}
              liked={likedIds.has(profile.id)}
              onClick={() => requireAuth(() => setSelectedProfile(profile))}
              onLike={() => handleLike(profile)}
              isRevealed={revealedIds.has(profile.id)}
              onReveal={() => handleReveal(profile.id)}
              canReveal={isGhost || isFemale}
              isTonight={isProfileTonight(profile.id)}
              houseTier={profileHouseTier(profile.id)}
              flaggedReason={flaggedProfiles[profile.id]?.reason}
              onFlagOpen={() => { const gId = toGhostId(profile.id); setFlagSheet({ profileId: profile.id, ghostId: gId }); }}
              isFoundBoo={!!(isProfilePaused && foundBoo?.matchProfileId === profile.id)}
              onGameInvite={isOnline(profile.last_seen_at) ? () => handleGameInvite(profile) : undefined}
            />
          ))}
        </div>
      )}

      {/* ── Ready to Meet Tonight ── */}
      {lobbyList.length > 0 && (
        <div style={{ padding: "20px 14px 0" }}>
          <div style={{ background: a.glow(0.08), border: `1px solid ${a.glow(0.28)}`, borderRadius: 16, padding: "12px 14px 0", marginBottom: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <motion.img
                src="https://ik.imagekit.io/7grri5v7d/SADFASDFASDFASDFSdsfasdf.png"
                alt="tonight"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }}
              />
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "-0.01em" }}>Ready to Meet Tonight</p>
                <p style={{ margin: 0, fontSize: 10, color: a.glow(0.6), fontWeight: 600 }}>{lobbyList.length} ghost{lobbyList.length !== 1 ? "s" : ""} available now</p>
              </div>
            </div>
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: a.accent, boxShadow: `0 0 8px ${a.glow(0.9)}` }}
            />
          </div>

          {/* Horizontal scroll row of cards */}
          <div style={{ overflowX: "auto", scrollbarWidth: "none", marginLeft: -14, marginRight: -14 } as React.CSSProperties}>
            <style>{`.tonight-row::-webkit-scrollbar{display:none}`}</style>
            <div className="tonight-row" style={{ display: "flex", gap: 10, padding: "4px 14px 8px" }}>
              {lobbyList.slice(0, 12).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 26 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedProfile(p)}
                  style={{ flexShrink: 0, width: 110, cursor: "pointer" }}
                >
                  <div style={{ position: "relative", width: 110, height: 140, borderRadius: 14, overflow: "hidden", border: `1.5px solid ${a.glow(0.4)}`, boxShadow: `0 0 12px ${a.glow(0.18)}` }}>
                    <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)" }} />

                    {/* Tonight badge */}
                    <div style={{ position: "absolute", top: 7, left: 7, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "2px 7px", border: `1px solid ${a.glow(0.45)}` }}>
                      <span style={{ fontSize: 8, fontWeight: 800, color: a.glow(0.95), letterSpacing: "0.04em" }}>🌙 TONIGHT</span>
                    </div>

                    {/* Online pulse */}
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                      style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.9)" }}
                    />

                    {/* Name + age */}
                    <div style={{ position: "absolute", bottom: 7, left: 8, right: 8 }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: "#fff", lineHeight: 1.2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name.split(" ")[0]}</p>
                      <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{p.age} · {p.city}</p>
                    </div>
                  </div>

                  {/* Like button below card */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={e => { e.stopPropagation(); handleLike(p); }}
                    style={{ width: "100%", marginTop: 6, height: 30, borderRadius: 9, border: likedIds.has(p.id) ? `1.5px solid ${a.accent}` : "1px solid rgba(255,255,255,0.12)", background: likedIds.has(p.id) ? a.glowMid(0.2) : "rgba(255,255,255,0.05)", color: likedIds.has(p.id) ? a.accent : "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                  >
                    {likedIds.has(p.id) ? "❤️ Liked" : "♡ Like"}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${a.glow(0.2)}, transparent)`, margin: "14px 0 0" }} />
          </div>{/* close gender-accent container */}
        </div>
      )}

      <AnimatePresence>
        {pendingGameInvite && (
          <GameInvitePopup
            invite={pendingGameInvite}
            onAccept={async () => {
              await respondToInvite(pendingGameInvite.id, "accepted");
              setPendingGameInvite(null);
              navigate("/ghost/games/connect4");
            }}
            onDecline={async (reason) => {
              await respondToInvite(pendingGameInvite.id, "declined", reason);
              setPendingGameInvite(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {matchActionProfile && (
          <MatchActionPopup
            profile={matchActionProfile}
            context={matchActionContext}
            coinBalance={coinBalance}
            onClose={() => setMatchActionProfile(null)}
            onConnect={() => handleMatchConnect(matchActionProfile)}
            onLikeBack={() => handleLikeBack(matchActionProfile)}
            onGift={(emoji, coins) => handleSendGift(emoji, coins)}
            onPass={() => {
              if (matchActionContext === "liked" || matchActionContext === "ilike") handlePass(matchActionProfile.id);
              setMatchActionProfile(null);
            }}
            onNeedCoins={() => { setMatchActionProfile(null); setShowCoinShop(true); }}
          />
        )}
      </AnimatePresence>


      {/* ── 🏆 Top Profiles — City Leaderboard ── */}
      <GhostLeaderboardSheet
        show={showLeaderboard}
        profiles={allProfiles}
        userCity={userCity}
        homeFlag={homeFlag}
        likedIds={likedIds}
        onClose={() => setShowLeaderboard(false)}
        onLike={handleLike}
        onView={(p) => setSelectedProfile(p)}
      />

      {/* ── 🌙 Tonight Lobby Sheet ── */}
      <GhostTonightSheet
        show={showTonightSheet}
        lobbyList={lobbyList}
        likedIds={likedIds}
        onClose={() => setShowTonightSheet(false)}
        onSelectProfile={(p) => setSelectedProfile(p)}
        onLike={handleLike}
      />

      {/* ── Lobby Welcome Popup ── */}
      <GhostLobbyWelcomePopup
        show={showLobbyWelcome}
        onDismiss={() => { setShowLobbyWelcome(false); startTabRevert(); }}
      />

      <AnimatePresence>
        {showCoinShop && (
          <GhostCoinShop
            coinBalance={coinBalance}
            onClose={() => setShowCoinShop(false)}
            onAddCoins={(amount) => {
              updateCoins(coinBalance + amount);
              setShowCoinShop(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {matchProfile && (
          <GhostMatchPopup
            profile={matchProfile}
            isSubscribed={isGhost}
            onClose={() => { const p = matchProfile; setMatchProfile(null); setTimeout(() => setIcebreakerProfile(p), 350); }}
            onButler={() => {
              const p = matchProfile;
              setMatchProfile(null);
              if (isCitySupported(userCity)) {
                setButlerMatchName(p?.name);
                setTimeout(() => setShowButler(true), 350);
              } else {
                setTimeout(() => setShowButlerUnavailable(true), 350);
              }
            }}
            onConnectWhatsApp={() => {
              if (isGhost) {
                if (matchProfile) {
                  // If user is male, show butler prompt first
                  if (!isFemale) {
                    setButlerConnectProfile(matchProfile);
                    setMatchProfile(null);
                  } else {
                    handleFoundBoo(matchProfile);
                    setConnectNowProfile(matchProfile);
                    setMatchProfile(null);
                  }
                } else {
                  setMatchProfile(null);
                }
              } else {
                setMatchPaywallProfile(matchProfile);
                setMatchProfile(null);
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {icebreakerProfile && (
          <GhostIcebreakerPopup
            profile={icebreakerProfile}
            onClose={() => setIcebreakerProfile(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showButler && (
          <GhostButlerSheet
            city={userCity}
            matchName={butlerMatchName}
            onClose={() => setShowButler(false)}
          />
        )}
      </AnimatePresence>

      {/* Butler connect prompt — shows before opening WhatsApp when city is supported */}
      <GhostButlerConnectPrompt
        profile={butlerConnectProfile}
        onConnectNow={() => {
          const p = butlerConnectProfile;
          setButlerConnectProfile(null);
          if (p) { handleFoundBoo(p); setConnectNowProfile(p); }
        }}
        onOpenButler={() => {
          const p = butlerConnectProfile;
          setButlerConnectProfile(null);
          if (isCitySupported(userCity)) {
            setButlerMatchName(p?.name);
            setTimeout(() => setShowButler(true), 200);
          } else {
            setTimeout(() => setShowButlerUnavailable(true), 200);
          }
        }}
      />

      {/* Butler unavailable — city not yet served */}
      <GhostButlerUnavailablePopup
        show={showButlerUnavailable}
        onClose={() => setShowButlerUnavailable(false)}
      />

      <AnimatePresence>
        {matchPaywallProfile && (
          <MatchPaywallModal
            profile={matchPaywallProfile}
            onPay={(planKey) => {
              try {
                localStorage.setItem("ghost_mode_until", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
                localStorage.setItem("ghost_mode_plan", planKey);
              } catch {}
              activate(planKey as "ghost" | "bundle");
              const profile = matchPaywallProfile;
              setMatchPaywallProfile(null);
              setMatchProfile(null);
              if (profile) {
                handleFoundBoo(profile);
                setConnectNowProfile(profile);
              }
            }}
            onClose={() => setMatchPaywallProfile(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {connectNowProfile && (
          <ConnectNowPopup
            profile={connectNowProfile}
            onDone={() => {
              if (connectNowProfile) {
                const matchEntry = savedMatches.find((m) => m.profile.id === connectNowProfile.id);
                if (matchEntry) {
                  const next = new Set(connectedMatchIds).add(matchEntry.id);
                  setConnectedMatchIds(next);
                  try { localStorage.setItem("ghost_connected_matches", JSON.stringify([...next])); } catch {}
                }
              }
              setConnectNowProfile(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {flashMatchProfile && (
          <GhostFlashMatchPopup
            profile={flashMatchProfile}
            onClose={() => setFlashMatchProfile(null)}
            onConnect={(p) => {
              const next = new Set(flashConnectedIds).add(p.id);
              setFlashConnectedIds(next);
              try { localStorage.setItem("ghost_flash_connected", JSON.stringify([...next])); } catch {}
              setFlashMatchProfile(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Flash contact limit toast ── */}
      <AnimatePresence>
        {showFlashLimitToast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            style={{
              position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
              zIndex: 9999, background: "rgba(15,15,20,0.96)", border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: 14, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)", backdropFilter: "blur(12px)",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 18 }}>⚡</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#f87171", margin: 0 }}>Flash limit reached</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                {FLASH_CONTACT_LIMIT} contacts per session — enter a new Flash window to reset
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── New Guests popup ── */}
      <AnimatePresence>
        {showNewGuests && newGuestProfiles.length > 0 && (
          <GhostNewGuestsPopup
            newGuests={newGuestProfiles}
            onEnterLobby={() => { setShowNewGuests(false); setLobbyMode(true); }}
            onDismiss={() => setShowNewGuests(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Shield blocked-attempt alert ── */}
      <AnimatePresence>
        {showBlockedAlert && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBlockedAlert(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9990, backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: "calc(100% - 40px)", maxWidth: 340,
                zIndex: 9991,
                background: "rgba(6,10,6,0.97)",
                border: `1px solid ${a.glow(0.35)}`,
                borderRadius: 22,
                padding: "26px 22px 20px",
                boxShadow: `0 0 60px ${a.glow(0.1)}, 0 24px 48px rgba(0,0,0,0.7)`,
                backdropFilter: "blur(24px)",
                textAlign: "center",
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, #16a34a, ${a.accent}, #22c55e)`, borderRadius: "4px 4px 0 0", position: "absolute", top: 0, left: 0, right: 0 }} />
              <motion.div
                animate={{ scale: [1, 1.07, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}
              >
                <img src={SHIELD_LOGO} alt="shield" style={{ width: 64, height: 64, objectFit: "contain", filter: `drop-shadow(0 0 12px ${a.glow(0.5)})` }} />
              </motion.div>
              <p style={{ fontSize: 11, fontWeight: 800, color: a.glow(0.8), letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>
                🛡️ Alert Ghost
              </p>
              <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 10px", lineHeight: 1.35 }}>
                1 of your Shield numbers has tried to gain access to the Ghost House
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 22px", lineHeight: 1.6 }}>
                Don't stress — we guarded the gates as requested.
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowBlockedAlert(false)}
                style={{
                  width: "100%", height: 46, borderRadius: 50, border: "none",
                  background: a.gradient,
                  color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer",
                  boxShadow: `0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 20px ${a.glowMid(0.4)}`,
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
                Thanks 2Ghost
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Ghost House modal ── */}
      <AnimatePresence>
        {showHouseModal && (
          <GhostHouseModal
            currentTier={houseTier}
            onClose={() => setShowHouseModal(false)}
            onPurchase={handleHousePurchase}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {inboundLike && (
          <InboundLikePopup
            like={inboundLike}
            onLikeBack={() => {
              const matched: GhostProfile = {
                id: inboundLike.id, name: inboundLike.name, age: inboundLike.age,
                city: inboundLike.city, country: inboundLike.country, countryFlag: inboundLike.countryFlag,
                image: inboundLike.image, gender: "Female",
              };
              saveMatch(matched);
              setInboundLike(null);
              setMatchProfile(matched);
            }}
            onPass={() => setInboundLike(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Settings Sheet ── */}
      <GhostSettingsDrawer
        show={showSettingsSheet}
        onClose={() => setShowSettingsSheet(false)}
        onAction={handleSettingsAction}
        loungeGuestCount={loungeGuestCount}
        loungeEnabled={loungeEnabled}
        onToggleLounge={handleToggleLounge}
      />

      {/* ── Breakfast Lounge Country Picker ── */}
      <AnimatePresence>
        {showBreakfastPicker && (() => {
          const userCountry = (() => { try { return localStorage.getItem("ghost_country") ?? "Indonesia"; } catch { return "Indonesia"; } })();
          const utcH = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
          const sorted = [...LOUNGE_COUNTRIES].sort((a, b) =>
            a.name === userCountry ? -1 : b.name === userCountry ? 1 : 0
          );
          return (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowBreakfastPicker(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9100, backdropFilter: "blur(4px)" }}
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 340 }}
                style={{
                  position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9101,
                  background: "rgba(8,10,14,0.99)",
                  borderTop: "1px solid rgba(212,175,55,0.25)",
                  borderRadius: "20px 20px 0 0",
                  maxHeight: "82vh", display: "flex", flexDirection: "column",
                  paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
                }}
              >
                {/* Gold top rim */}
                <div style={{ height: 3, borderRadius: "20px 20px 0 0", background: "linear-gradient(90deg, transparent, #d4af37, rgba(212,175,55,0.4), transparent)" }} />
                {/* Handle */}
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "12px auto 0" }} />
                {/* Header */}
                <div style={{ padding: "16px 20px 12px" }}>
                  <p style={{ fontSize: 16, fontWeight: 900, color: "#d4af37", margin: 0 }}>Breakfast Lounges</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                    {loungeGuestCount} guests online worldwide · select a country
                  </p>
                </div>
                <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)", margin: "0 20px 8px" }} />
                {/* Country list */}
                <div style={{ overflowY: "auto", flex: 1, padding: "0 14px" }}>
                  {sorted.map((c) => {
                    const localH = ((utcH + c.utcOffset) % 24 + 24) % 24;
                    const isOnline = localH >= 7 && localH < 23;
                    const isBreakfast = localH >= 7 && localH < 11;
                    const hh = Math.floor(localH);
                    const mm = Math.floor((localH - hh) * 60);
                    const localTime = `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
                    const isHome = c.name === userCountry;
                    return (
                      <button key={c.name}
                        onClick={() => {
                          try { sessionStorage.setItem("breakfast_country", c.name); } catch {}
                          setShowBreakfastPicker(false);
                          navigate("/ghost/breakfast-lounge");
                        }}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 14,
                          background: isHome ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)",
                          border: isHome ? "1px solid rgba(212,175,55,0.2)" : "1px solid rgba(255,255,255,0.05)",
                          borderRadius: 14, padding: "12px 14px", marginBottom: 8,
                          cursor: "pointer", textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: 24 }}>{c.flag}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <p style={{ fontSize: 13, fontWeight: 800, color: isHome ? "#d4af37" : "#fff", margin: 0 }}>{c.name}</p>
                            {isHome && <span style={{ fontSize: 9, fontWeight: 700, color: "#d4af37", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 5, padding: "1px 5px" }}>YOUR COUNTRY</span>}
                          </div>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>Local time {localTime}</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: isBreakfast ? "#d4af37" : isOnline ? "#22c55e" : "rgba(255,255,255,0.3)",
                            background: isBreakfast ? "rgba(212,175,55,0.1)" : isOnline ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${isBreakfast ? "rgba(212,175,55,0.3)" : isOnline ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 6, padding: "2px 7px",
                          }}>
                            {isBreakfast ? "🍳 Breakfast" : isOnline ? "Active" : "Quiet"}
                          </span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{isOnline ? c.poolCount : 0} guests</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* ── Flag / Report sheet ── */}
      <GhostFlagSheet
        flagSheet={flagSheet}
        onSubmit={handleFlag}
        onClose={() => setFlagSheet(null)}
      />

      {/* ── Security popup — fires when user taps before agreeing to house rules ── */}
      <GhostSecurityPopup
        show={showSecurityPopup}
        onClose={() => setShowSecurityPopup(false)}
        onShowRules={() => setShowHouseRules(true)}
      />

      {/* ── House rules modal ── */}
      <HouseRulesModal show={showHouseRules} onAccept={handleHouseRulesAccept} />

      {/* ── International Ghost modal ── */}
      <AnimatePresence>
        {showIntlModal && (
          <InternationalGhostModal
            userCountryCode={homeCountryCode}
            isFemale={isFemale}
            onActivate={(countries) => {
              setIntlCountries(countries);
              setIsIntlGhost(true);
              setShowIntlModal(false);
            }}
            onClose={() => setShowIntlModal(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Hotel events ── */}
      <AnimatePresence>
        {showEvents && <HotelEventsBoard onClose={() => setShowEvents(false)} />}
      </AnimatePresence>

      {/* ── Stats dashboard ── */}
      <AnimatePresence>
        {showStats && <GhostStatsDashboard onClose={() => setShowStats(false)} />}
      </AnimatePresence>

      {/* ── Invite Friend / Referral ── */}
      <AnimatePresence>
        {showReferral && <GhostReferralSheet onClose={() => setShowReferral(false)} />}
      </AnimatePresence>

      {/* ── Floor Invite Sheet ── */}
      <AnimatePresence>
        {showFloorInvite && floorInviteProfile && (
          <FloorInviteSheet
            profile={floorInviteProfile}
            targetFloor={floorInviteTarget}
            mode={floorInviteMode}
            onClose={() => setShowFloorInvite(false)}
            onSuccess={(member) => {
              setInvitedMembers(getAcceptedFloorMembers());
              setShowFloorInvite(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Butler nudge for silent floor joiner ── */}
      <AnimatePresence>
        {nudgeProfile && (
          <FloorNudgeSheet member={nudgeProfile} onClose={() => setNudgeProfile(null)} />
        )}
      </AnimatePresence>

      {/* ── Ghost Score Sheet ── */}
      <AnimatePresence>
        {showGhostScore && scoreProfile && (
          <GhostScoreSheet profile={scoreProfile} onClose={() => { setShowGhostScore(false); setScoreProfile(null); }} />
        )}
      </AnimatePresence>

      {/* ── Ghost Clock Sheet ── */}
      <AnimatePresence>
        {showGhostClock && (
          <GhostClockSheet onClose={() => { setShowGhostClock(false); setWindowActive(hasActiveWindowMode()); }} />
        )}
      </AnimatePresence>

      {/* ── Floor Wars Board ── */}
      <AnimatePresence>
        {showFloorWars && (
          <FloorWarsBoard onClose={() => setShowFloorWars(false)} />
        )}
      </AnimatePresence>

      {/* ── Whisper Sheet ── */}
      <AnimatePresence>
        {showWhisper && whisperProfile && (
          <WhisperSheet
            profile={whisperProfile}
            onClose={() => { setShowWhisper(false); setWhisperProfile(null); }}
            onWhisperSent={(profile, willConvert) => {
              if (willConvert) {
                const delay = (90 + Math.floor(Math.random() * 120)) * 1000;
                setTimeout(() => {
                  const savedMatches = loadMatches();
                  const newMatch = { id: profile.id, profile, matchedAt: Date.now() };
                  persistMatches([...savedMatches.filter(m => m.id !== profile.id), newMatch]);
                  setSavedMatches(prev => [...prev.filter(m => m.id !== profile.id), newMatch]);
                }, delay);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Concierge Date Sheet ── */}
      <AnimatePresence>
        {showConcierge && conciergeProfile && (
          <GhostConciergeSheet
            profile={conciergeProfile}
            matchId={conciergeMatchId}
            daysConnected={conciergeDays}
            onClose={() => { setShowConcierge(false); setConciergeProfile(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Séance Popup ── */}
      <AnimatePresence>
        {showSeance && seanceProfile && (
          <SeancePopup profile={seanceProfile} onClose={() => { setShowSeance(false); setSeanceProfile(null); }} />
        )}
      </AnimatePresence>

      {/* ── Video Intro Player ── */}
      <AnimatePresence>
        {showVideoPlayer && videoProfile && (
          <VideoIntroPlayer
            profile={videoProfile}
            myGhostId={(() => { try { return `Guest-${Math.abs(Array.from(localStorage.getItem("ghost_phone") ?? "").reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0)) % 9000 + 1000}`; } catch { return "Guest-0000"; } })()}
            onClose={() => { setShowVideoPlayer(false); setVideoProfile(null); }}
          />
        )}
      </AnimatePresence>

      {/* ── Video Intro Uploader ── */}
      <AnimatePresence>
        {showVideoUpload && (
          <VideoIntroUploader onClose={() => setShowVideoUpload(false)} />
        )}
      </AnimatePresence>

      {/* ── Viewed Me popup ── */}
      <GhostViewedMeSheet
        show={showViewedMe}
        viewedMeList={viewedMeList}
        myProfileId={myProfileId}
        userRoomTier={userRoomTier}
        likedIds={likedIds}
        onClose={() => setShowViewedMe(false)}
        onLike={handleLike}
        onMatchAction={(p) => openMatchAction(p, "match")}
        onFloorInvite={(p, mode, target) => {
          setFloorInviteProfile(p);
          setFloorInviteMode(mode);
          setFloorInviteTarget(target);
          setShowViewedMe(false);
          setShowFloorInvite(true);
        }}
        onStartChat={(p) => {
          setShowViewedMe(false);
          setPendingChatInviteProfileId(p.id);
          setButlerMessage({ ...BUTLER_MESSAGES["chat_invite_viewed"] });
        }}
      />

      {/* ── Hotel Lobby popup ── */}
      <GhostLobbySheet
        show={showLobbyPopup}
        profiles={roomMemberList}
        onClose={() => setShowLobbyPopup(false)}
        onSelectProfile={(p) => openMatchAction(p, "match")}
      />

      {/* ── Late-night butler ── */}
      <AnimatePresence>
        {showLateNight && (
          <LateNightButlerPopup
            onDismiss={() => {
              markLateNightShown();
              setShowLateNight(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Butler welcome ── */}
      <AnimatePresence>
        {showButlerWelcome && (
          <ButlerWelcomePopup
            onDismiss={() => {
              markButlerGreeted();
              setShowButlerWelcome(false);
            }}
          />
        )}

        {showPushPrompt && (
          <PushPermissionPrompt onDone={() => setShowPushPrompt(false)} />
        )}
      </AnimatePresence>

      {/* ── Checkout reminder ── */}
      <AnimatePresence>
        {showCheckout && (
          <CheckoutReminderPopup
            onExtend={() => {
              markCheckoutShown();
              setShowCheckout(false);
              navigate("/ghost/rooms");
            }}
            onDismiss={() => {
              markCheckoutShown();
              setShowCheckout(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Floor Chat popup ── */}
      <AnimatePresence>
        {showFloorChat && (floorChatTier ?? userRoomTier) && (() => {
          const TIER_COLORS_ALL: Record<string, string> = { standard: "#a8a8b0", suite: "#cd7f32", kings: "#d4af37", penthouse: "#e0ddd8", cellar: "#9b1c1c", garden: "#7a9e7e" };
          const TIER_LABELS_ALL: Record<string, string> = { standard: "Standard Room", suite: "Ensuite", kings: "The Casino", penthouse: "Penthouse", cellar: "The Cellar", garden: "Garden Lodge" };
          const TIER_ICONS_ALL:  Record<string, string> = { standard: "🛏️", suite: "🛎️", kings: "🎰", penthouse: "🏙️", cellar: "🕯️", garden: "🌿" };
          const activeTier  = (floorChatTier ?? userRoomTier)!;
          const activeColor = TIER_COLORS_ALL[activeTier] ?? tierColor;
          const activeLabel = TIER_LABELS_ALL[activeTier] ?? tierLabel;
          const activeIcon  = TIER_ICONS_ALL[activeTier]  ?? tierIcon;
          return (
            <FloorChatPopup
              tier={activeTier}
              tierColor={activeColor}
              tierLabel={activeLabel}
              tierIcon={activeIcon}
              onClose={() => { setShowFloorChat(false); setFloorChatTier(null); }}
            />
          );
        })()}
      </AnimatePresence>

      {/* ── Ghost Flash paywall ── */}
      <GhostFlashPaywallSheet
        show={showFlashPaywall}
        onClose={() => setShowFlashPaywall(false)}
        onEnterFlash={enterFlash}
      />

      {/* ── Dev Popup Launcher ── */}
      <DevPopupLauncher />

      {/* ── Dev Panel ── */}
      <DevPanel
        isTonightMode={isTonightMode}
        toggleTonight={toggleTonight}
        isFlashActive={isFlashActive}
        enterFlash={enterFlash}
        exitFlash={exitFlash}
        houseTier={houseTier}
        setHouseTier={setHouseTier}
        activate={activate}
        deactivate={deactivate}
        onTriggerFlashMatch={() => {
          const pick = profiles.filter((p) => isFlashProfile(p.id))[0] ?? profiles[0];
          if (pick) setFlashMatchProfile(pick);
        }}
        onTriggerMatch={() => {
          const pick = profiles[Math.floor(Math.random() * Math.min(profiles.length, 10))];
          if (pick) { saveMatch(pick); setMatchProfile(pick); }
        }}
        onTriggerInbound={() => {
          const pick = DEMO_INBOUND[Math.floor(Math.random() * DEMO_INBOUND.length)];
          setInboundLike(pick);
        }}
        onTriggerButler={(key: ButlerMessageKey) => setButlerMessage(BUTLER_MESSAGES[key])}
        onSimulateChatInvite={() => {
          // Simulate User B receiving an invite from a random profile
          const fakeFromId = allProfiles[0]?.id ?? "demo-profile-id";
          const myId = myProfileId ?? "demo-my-id";
          saveInvite(fakeFromId, myId);
          setShowViewedMe(true);
        }}
      />

      {/* ── Butler Message ── */}
      {/* Liked-me profile modal — same component as fingerprint view */}
      <AnimatePresence>
        {expandedLikedProfile && (
          <ProfileWhisperModal
            profile={expandedLikedProfile}
            liked={likedIds.has(expandedLikedProfile.id)}
            onLike={() => handleLike(expandedLikedProfile)}
            onClose={() => setExpandedLikedProfile(null)}
          />
        )}
      </AnimatePresence>

      {butlerMessage?.key === "room_ready" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 799, cursor: "not-allowed" }} onClickCapture={e => e.stopPropagation()} />
      )}
      <GhostButlerMessage
        message={butlerMessage}
        onClose={() => { setButlerMessage(null); setPendingChatInviteProfileId(null); }}
        onCreateProfile={() => { setButlerMessage(null); navigate("/ghost/setup"); }}
        onAction={pendingChatInviteProfileId ? () => {
          if (myProfileId) saveInvite(myProfileId, pendingChatInviteProfileId);
          setPendingChatInviteProfileId(null);
          setShowViewedMe(true);
        } : undefined}
      />

      {/* ── Hearts cascade on inbound like ── */}
      <AnimatePresence>
        {showLikeRain && (
          <motion.div
            initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}
          >
            {likeRainHearts.map(h => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0.9, y: "-8vh", x: `${h.x}vw` }}
                animate={{ opacity: 0, y: "108vh" }}
                transition={{ duration: h.duration, delay: h.delay, ease: "easeIn" }}
                style={{ position: "absolute", fontSize: h.size, pointerEvents: "none" }}
              >
                ❤️
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Auth Gate Popup ── */}
      <GhostAuthGateSheet show={showAuthGate} onClose={() => setShowAuthGate(false)} />

    </div>
    </div>
  );
}
