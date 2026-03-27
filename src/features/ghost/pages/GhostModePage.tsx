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
  haversineKm, profileIsVerified, toGhostId, getWantedGender,
} from "../utils/ghostHelpers";

// Components
import GhostParticles from "../components/GhostParticles";
import GhostDevPanel from "../components/GhostDevPanel";
import GhostButlerMessage, { BUTLER_MESSAGES, type ButlerMessageKey, type ButlerMessage } from "../components/GhostButlerMessage";
import HouseRulesModal from "../components/HouseRulesModal";
import GhostFlashPaywallSheet from "../components/GhostFlashPaywallSheet";
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
import ButlerGameChallengeSheet from "../components/ButlerGameChallengeSheet";
import DateIdeasFeed from "../components/DateIdeasFeed";
import { useDateInvites } from "../hooks/useDateInvites";
import { DateInviteReceivedPopup, DateInviteAcceptedPopup } from "../components/DateInvitePopup";
import MsVeraPopup, { isDateIdeasUnlocked, recordFirstVisit, type NewPostInfo } from "../components/MsVeraPopup";
import SendDateInviteSheet from "../components/SendDateInviteSheet";
import { canShowAutoPopup, markAutoPopupShown } from "../utils/popupThrottle";
import FloorChatPopup, { getChatUnread, setChatUnread } from "../components/FloorChatPopup";
import GhostModePopups from "../components/GhostModePopups";
import GhostModeMatchBar from "../components/GhostModeMatchBar";
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
import MrButlasStaffPopup from "../components/MrButlasStaffPopup";
import { useMrButlasCountdown, fmtCountdown } from "../hooks/useMrButlasCountdown";
import VideoIntroPlayer from "../components/VideoIntroPlayer";
import VideoIntroUploader from "../components/VideoIntroUploader";
import GhostStreakBanner from "../components/GhostStreakBanner";
import DevPopupLauncher from "@/shared/components/DevPopupLauncher";
import GameInvitePopup from "../components/GameInvitePopup";
import TonightGiftSheet from "../components/TonightGiftSheet";
import { subscribeToGameInvites, respondToInvite, type GameInvite } from "../utils/gameInviteService";
import SendGameChallengeSheet, { type ChallengeTarget } from "../components/SendGameChallengeSheet";
import { hasActiveWindowMode, getDaysConnected, getConciergeShown, whisperWillConvert, profileHasVideo, isProfileInWindow } from "../utils/featureGating";
import { recordLike, loadMyMatches, getMyGhostId, syncTierToSupabase, loadTierFromSupabase, syncCoinsToSupabase, loadCoinsFromSupabase, loadGhostProfiles, type RealProfileRow } from "../ghostDataService";
import { computeMatchScore, sortByMatchScore, type UserPreferences as MatchPreferences } from "../utils/matchScore";
import VideoVerificationSheet from "../components/VideoVerificationSheet";
import InviteFriendsSheet from "../components/InviteFriendsSheet";

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

  const isAuthed = hasGhostProfile
    || !!localStorage.getItem("ghost_phone")
    || !!localStorage.getItem("ghost_email")
    || !!localStorage.getItem("ghost_auth_uid");
  const requireAuth = (fn: () => void) => { fn(); };

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

  // Open game challenge sheet for a profile from the browse feed
  const [challengeTarget, setChallengeTarget] = useState<ChallengeTarget | null>(null);
  const handleGameInvite = useCallback((profile: GhostProfile) => {
    setSelectedProfile(null);
    setChallengeTarget({
      id:    profile.id,
      name:  profile.name,
      image: profile.image,
      city:  profile.city,
      flag:  profile.countryFlag,
    });
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
  const [showButlerChallenge, setShowButlerChallenge] = useState(false);
  const challengeFiredRef = useRef(false);
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
  const [showGetVerified,  setShowGetVerified]   = useState(false);
  const [showInviteFriends, setShowInviteFriends] = useState(false);
  const [showWhisper,      setShowWhisper]       = useState(false);
  const [whisperProfile,   setWhisperProfile]   = useState<GhostProfile | null>(null);
  const [showConcierge,    setShowConcierge]     = useState(false);
  const [conciergeProfile, setConciergeProfile] = useState<GhostProfile | null>(null);
  const [conciergeMatchId, setConciergeMatchId] = useState("");
  const [conciergeDays,    setConciergeDays]     = useState(0);
  const [showSeance,       setShowSeance]        = useState(false);
  const [seanceProfile,    setSeanceProfile]     = useState<GhostProfile | null>(null);
  const [staffPopupProfile, setStaffPopupProfile] = useState<GhostProfile | null>(null);

  // Mr. Butlas staff enforcement
  const { stage: butlasStage, msRemaining } = useMrButlasCountdown();
  const ownIsStaff = butlasStage !== "guest";
  // Redirect if portrait deadline expired OR admin has dismissed this user
  useEffect(() => {
    if (butlasStage === "expired") { navigate("/escorted-out", { replace: true }); return; }
    try {
      const profileId = JSON.parse(localStorage.getItem("ghost_profile") || "{}").id;
      const dismissed = JSON.parse(localStorage.getItem("admin_portrait_dismissed") || "{}");
      if (profileId && dismissed[profileId]) navigate("/escorted-out", { replace: true });
    } catch {}
  }, [butlasStage, navigate]);
  const [showVideoPlayer,  setShowVideoPlayer]   = useState(false);
  const [videoProfile,     setVideoProfile]      = useState<GhostProfile | null>(null);
  const [showVideoUpload,  setShowVideoUpload]   = useState(false);
  const [showLeaderboard,  setShowLeaderboard]   = useState(false);
  const [showDateIdeas,    setShowDateIdeas]     = useState(false);
  const [showVeraLocked,   setShowVeraLocked]    = useState(false);
  const [veraNewPost,      setVeraNewPost]       = useState<NewPostInfo | null>(null);
  const [veraInvitePost,   setVeraInvitePost]    = useState<NewPostInfo | null>(null);
  const { pendingInvite, acceptedInvite, dismissPending, dismissAccepted } = useDateInvites();

  // Record first visit for Ms. Vera unlock timer + check for new posts
  useEffect(() => {
    recordFirstVisit();
    if (!isDateIdeasUnlocked()) return;
    try {
      const LAST_KEY = "ghost_date_ideas_last_seen";
      const lastSeen = parseInt(localStorage.getItem(LAST_KEY) || "0", 10);
      const posts: Array<{ id: string; title: string; mainImage: string; location: string; authorName: string; authorCity?: string; authorFlag?: string; createdAt: number }> =
        JSON.parse(localStorage.getItem("ghost_date_ideas_posts") || "[]");
      const newPost = posts.filter(p => p.createdAt > lastSeen && p.createdAt > Date.now() - 86400000 * 2)[0];
      if (newPost) {
        setTimeout(() => {
          if (!canShowAutoPopup()) return;
          setVeraNewPost({ id: newPost.id, title: newPost.title, image: newPost.mainImage, location: newPost.location, authorName: newPost.authorName, authorCity: newPost.authorCity, authorFlag: newPost.authorFlag });
          markAutoPopupShown();
        }, 2500);
      }
      localStorage.setItem(LAST_KEY, String(Date.now()));
    } catch {}
  }, []);
  const [showTonightSheet, setShowTonightSheet]  = useState(false);
  const [tonightGiftProfile, setTonightGiftProfile] = useState<GhostProfile | null>(null);
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
      if (shouldShowCheckout() && canShowAutoPopup()) {
        setShowCheckout(true);
        markAutoPopupShown();
      }
    }, 8000);
    return () => clearTimeout(t);
  }, []);

  // Butler welcome — disabled (flow: house rules only auto-popup)
  // useEffect(() => {
  //   if (!shouldShowButlerWelcome()) return;
  //   const t = setTimeout(() => setShowButlerWelcome(true), 60000);
  //   return () => clearTimeout(t);
  // }, []);

  // Butler game challenge — shown randomly after 3–5 min if Games Room discovered
  useEffect(() => {
    const gamesUnlocked = localStorage.getItem("games_room_unlocked") === "true";
    if (!gamesUnlocked || challengeFiredRef.current) return;
    const delay = 180_000 + Math.random() * 120_000; // 3–5 min
    const t = setTimeout(() => {
      if (challengeFiredRef.current) return;
      if (!canShowAutoPopup()) return;
      challengeFiredRef.current = true;
      setShowButlerChallenge(true);
      markAutoPopupShown();
    }, delay);
    return () => clearTimeout(t);
  }, []);

  // Push notification prompt — show 20s after load if not yet subscribed/dismissed
  useEffect(() => {
    if (!shouldShowPushPrompt()) return;
    const t = setTimeout(() => {
      if (!canShowAutoPopup()) return;
      setShowPushPrompt(true);
      markAutoPopupShown();
    }, 20000);
    return () => clearTimeout(t);
  }, []);

  // Late-night butler — show 90s after load if time is 10pm–3:59am, once per day
  useEffect(() => {
    if (!shouldShowLateNight()) return;
    const t = setTimeout(() => {
      if (!canShowAutoPopup()) return;
      setShowLateNight(true);
      markAutoPopupShown();
    }, 90000);
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

  const [casinoEnabled, setCasinoEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem("casino_enabled") === "true"; } catch { return false; }
  });
  const handleToggleCasino = () => {
    const next = !casinoEnabled;
    setCasinoEnabled(next);
    try { localStorage.setItem("casino_enabled", next ? "true" : "false"); } catch {}
  };

  const handleSettingsAction = (action: SettingsAction) => {
    if (action === "rooms") { setShowHouseModal(true); return; }
    if (action === "ghostClock") { setWindowActive(hasActiveWindowMode()); setShowGhostClock(true); return; }
    if (action === "floorWars") { setShowFloorWars(true); return; }
    if (action === "games") { navigate("/games"); return; }
    if (action === "video") { setShowVideoUpload(true); return; }
    if (action === "breakfastLounge") { if (loungeEnabled) setShowBreakfastPicker(true); return; }
    if (action === "leaderboard")   { setShowLeaderboard(true);   return; }
    if (action === "getVerified")   { setShowGetVerified(true);   return; }
    if (action === "inviteFriends") { setShowInviteFriends(true); return; }
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
    // Real profiles go first, then mocks — mocks hidden once real count reaches threshold
    const MOCK_THRESHOLD = 20;
    const showMocks = real.length < MOCK_THRESHOLD;
    const realIds = new Set(real.map(r => r.id));
    const merged = showMocks
      ? [...real, ...sea.filter(p => !realIds.has(p.id)), ...intl]
      : real;

    // ── Interest filter — only show genders the user is looking for ──────────
    const wantedGender = getWantedGender();
    const interestFiltered = wantedGender
      ? merged.filter(p => p.gender === wantedGender)
      : merged;

    if (ipCountry?.countryCode) {
      const userCC = ipCountry.countryCode;
      interestFiltered.sort((a, b) => {
        const aCC = a.countryFlag ? Object.entries({ ID:"🇮🇩",PH:"🇵🇭",TH:"🇹🇭",SG:"🇸🇬",MY:"🇲🇾",VN:"🇻🇳" }).find(([,f])=>f===a.countryFlag)?.[0] ?? "ZZ" : "ZZ";
        const bCC = b.countryFlag ? Object.entries({ ID:"🇮🇩",PH:"🇵🇭",TH:"🇹🇭",SG:"🇸🇬",MY:"🇲🇾",VN:"🇻🇳" }).find(([,f])=>f===b.countryFlag)?.[0] ?? "ZZ" : "ZZ";
        return getCountryProximity(userCC, aCC) - getCountryProximity(userCC, bCC);
      });
    }
    return interestFiltered;
  }, [userLat, userLon, ipCountry, realProfiles]);

  // New guest profiles subset (for popup + lobby mode)
  const newGuestProfiles = useMemo(() => allProfiles.filter((p) => p.isNewGuest), [allProfiles]);

  // Don't show popup if there are no new guests
  useEffect(() => {
    if (showNewGuests && newGuestProfiles.length === 0) setShowNewGuests(false);
  }, [showNewGuests, newGuestProfiles.length]);

  // Current user preferences for match scoring
  const matchPrefs = useMemo<MatchPreferences>(() => {
    try {
      const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
      return {
        ageMin,
        ageMax,
        age: p.age ?? 25,
        interests: Array.isArray(p.interests) ? p.interests : [],
        likedIds,
        inboundLikeIds: new Set<string>(), // populated from inbound likes if available
      };
    } catch { return { ageMin, ageMax, age: 25, interests: [], likedIds, inboundLikeIds: new Set() }; }
  }, [ageMin, ageMax, likedIds]);

  // Filtered + sorted profiles (excludes passed/refused) — sorted by match score
  const profiles = useMemo(() => {
    const filtered = allProfiles.filter((p) => {
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
    });
    // Compute match score for each profile then sort: online-first, then score desc
    const scored = filtered.map(p => ({ p, score: computeMatchScore(p, matchPrefs) }));
    scored.sort((a, b) => sortByMatchScore(a.p, b.p, a.score, b.score, isOnline));
    return scored.map(({ p, score }) => ({ ...p, matchScore: score }));
  }, [allProfiles, gender, ageMin, ageMax, maxKm, filterCountry, onlineOnly, passedIds, browsingCountryCode, lobbyMode, filterBadge, matchPrefs]);

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

      {/* DEV — reset to start page */}
      <button
        onClick={() => {
          localStorage.removeItem("ghost_profile_setup_done");
          localStorage.removeItem("ghost_phone");
          navigate("/welcome");
        }}
        style={{
          position: "fixed", bottom: 12, right: 12, zIndex: 9999,
          background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: 8, cursor: "pointer",
          color: "rgba(212,175,55,0.6)", fontSize: 9,
          fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", padding: "5px 10px",
        }}
      >
        ⚙ Dev · Start
      </button>

      {/* DEV — view escort page */}
      <button
        onClick={() => navigate("/escorted-out")}
        style={{
          position: "fixed", bottom: 12, right: 100, zIndex: 9999,
          background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: 8, cursor: "pointer",
          color: "rgba(212,175,55,0.7)", fontSize: 9,
          fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", padding: "5px 10px",
        }}
      >
        🚪 Dev · Escort
      </button>

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
        <div style={{ padding: "0 16px 4px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
            <h1 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>
              Mr.Butlas
            </h1>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: userRoomTier ? tierColor : "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>
              {userRoomTier ? `${tierIcon} ${tierLabel}` : "🏨 Arrivals · Ground Floor"}
            </p>
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
              background: a.glow(0.07), border: `1px solid ${a.glow(0.22)}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: a.accent,
            }}
          >
            <Settings size={17} />
          </button>
        </div>

      {/* Match bar lives inside the sticky header — one cohesive zone */}
      <GhostModeMatchBar
        savedMatches={savedMatches}
        connectedMatchIds={connectedMatchIds}
        isFemale={isFemale}
        iLikeList={iLikeList}
        likedMeList={likedMeList}
        lobbyList={lobbyList}
        roomMemberList={roomMemberList}
        matchTab={matchTab}
        setMatchTab={setMatchTab}
        tierLabel={tierLabel}
        tierColor={tierColor}
        tierIcon={tierIcon}
        revealedInbound={revealedInbound}
        setRevealedInbound={setRevealedInbound}
        coinBalance={coinBalance}
        setShowCoinShop={setShowCoinShop}
        updateCoins={updateCoins}
        setExpandedLikedProfile={setExpandedLikedProfile}
        openMatchAction={openMatchAction}
        setStaffPopupProfile={setStaffPopupProfile}
        startTabRevert={startTabRevert}
        userCity={userCity}
        setButlerMatchName={setButlerMatchName}
        setShowButler={setShowButler}
        setShowButlerUnavailable={setShowButlerUnavailable}
        setConciergeProfile={setConciergeProfile}
        setConciergeMatchId={setConciergeMatchId}
        setConciergeDays={setConciergeDays}
        setShowConcierge={setShowConcierge}
        a={a}
      />

      </div>




      {/* ── Quick-action icon strip (replaces 2 rows → 1 compact row) ── */}
      <div style={{ margin: "10px 14px 0", display: "flex", gap: 6 }}>

        {/* Vault */}
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => requireAuth(() => navigate("/room"))}
          style={{ flex: 1, height: 44, borderRadius: 12, background: a.glow(0.07), border: `1px solid ${a.glow(0.22)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer" }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>🔒</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: a.accent, letterSpacing: "0.02em" }}>Vault</span>
        </motion.button>

        {/* Tonight */}
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => requireAuth(() => setShowTonightSheet(true))}
          style={{ flex: 1, height: 44, borderRadius: 12, background: lobbyList.length > 0 ? "rgba(212,175,55,0.12)" : "rgba(212,175,55,0.07)", border: `1px solid ${lobbyList.length > 0 ? "rgba(212,175,55,0.45)" : "rgba(212,175,55,0.2)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer", position: "relative" }}
        >
          {lobbyList.length > 0 && (
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
              style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.9)" }} />
          )}
          <span style={{ fontSize: 16, lineHeight: 1 }}>🌙</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#d4af37", letterSpacing: "0.02em" }}>Tonight</span>
        </motion.button>

        {/* Date Idea */}
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => requireAuth(() => {
          if (isDateIdeasUnlocked()) { setShowDateIdeas(true); }
          else { setShowVeraLocked(true); }
        })}
          style={{ flex: 1, height: 44, borderRadius: 12, background: a.glow(0.07), border: `1px solid ${a.glow(0.22)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer" }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>💝</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: a.accent, letterSpacing: "0.02em" }}>
            {isDateIdeasUnlocked() ? "Date" : "🔒 Date"}
          </span>
        </motion.button>

        {/* Chat */}
        <motion.button whileTap={{ scale: 0.93 }}
          onClick={() => requireAuth(() => {
            const tier = userRoomTier ?? "standard";
            setFloorChatTier(tier);
            setShowFloorChat(true);
            setChatUnreadState(0);
            setChatUnread("standard", 0);
          })}
          style={{ flex: 1, height: 44, borderRadius: 12, background: a.glow(0.07), border: `1px solid ${a.glow(0.22)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer", position: "relative" }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>💬</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: a.accent, letterSpacing: "0.02em" }}>Chat</span>
          {chatUnread > 0 && (
            <div style={{ position: "absolute", top: 5, right: 5, minWidth: 14, height: 14, borderRadius: 7, background: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
              <span style={{ fontSize: 7, fontWeight: 900, color: "#000" }}>{chatUnread > 9 ? "9+" : chatUnread}</span>
            </div>
          )}
        </motion.button>

        {/* Viewed Me */}
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => requireAuth(() => setShowViewedMe(true))}
          style={{ flex: 1, height: 44, borderRadius: 12, background: a.glow(0.07), border: `1px solid ${a.glow(0.22)}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer", position: "relative" }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>👁️</span>
          <span style={{ fontSize: 9, fontWeight: 800, color: a.accent, letterSpacing: "0.02em" }}>Viewed</span>
          {viewedMeList.some(p => p.viewCount >= 2) && (
            <div style={{ position: "absolute", top: 5, right: 5, minWidth: 14, height: 14, borderRadius: 7, background: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
              <span style={{ fontSize: 7, fontWeight: 900, color: "#000" }}>{viewedMeList.filter(p => p.viewCount >= 2).length}</span>
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
                  const url = `${window.location.origin}/auth?ref=${ghostId}`;
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
              onClick={() => navigate("/setup")}
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
        {/* Block */}
        <button
          onClick={() => requireAuth(() => navigate("/block"))}
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <img src={SHIELD_LOGO} alt="Block" style={{ width: 20, height: 20, objectFit: "contain" }} />
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
                navigator.share({ title: "Join Mr Butlas", text: "Join me on Mr Butlas — anonymous dating done right 👻", url });
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
          <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.22)", borderRadius: 16, overflow: "hidden", marginBottom: 0 }}>
            {/* Gold top stripe */}
            <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #d4af37, transparent)" }} />
            <div style={{ padding: "12px 14px 0" }}>
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

                    {/* Online / Busy status */}
                    {(() => {
                      const online = isOnline(p.last_seen_at);
                      const dotColor = online ? "#4ade80" : "#fb923c";
                      const dotGlow  = online ? "rgba(74,222,128,0.9)" : "rgba(251,146,60,0.9)";
                      const label    = online ? "Online" : "Busy";
                      return (
                        <div style={{ position: "absolute", top: 7, left: 7, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "3px 8px" }}>
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
                            style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, boxShadow: `0 0 5px ${dotGlow}`, flexShrink: 0 }}
                          />
                          <span style={{ fontSize: 8, fontWeight: 800, color: dotColor, letterSpacing: "0.04em" }}>{label}</span>
                        </div>
                      );
                    })()}

                    {/* Name + age */}
                    <div style={{ position: "absolute", bottom: 7, left: 8, right: 8 }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: "#fff", lineHeight: 1.2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name.split(" ")[0]}</p>
                      <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{p.age} · {p.city}</p>
                    </div>
                  </div>

                  {/* Like / Gift button below card */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={e => { e.stopPropagation(); if (likedIds.has(p.id)) return; setTonightGiftProfile(p); }}
                    style={{ width: "100%", marginTop: 6, height: 30, borderRadius: 9, border: likedIds.has(p.id) ? `1.5px solid ${a.accent}` : "1px solid rgba(255,255,255,0.12)", background: likedIds.has(p.id) ? a.glowMid(0.2) : "rgba(255,255,255,0.05)", color: likedIds.has(p.id) ? a.accent : "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 800, cursor: likedIds.has(p.id) ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                  >
                    {likedIds.has(p.id) ? "❤️ Liked" : "🎁 Like + Gift"}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)", margin: "14px 0 0" }} />
            </div>{/* close inner padding div */}
          </div>{/* close gold container */}
        </div>
      )}

      <GhostModePopups
        pendingGameInvite={pendingGameInvite}
        setPendingGameInvite={setPendingGameInvite}
        matchActionProfile={matchActionProfile}
        setMatchActionProfile={setMatchActionProfile}
        matchActionContext={matchActionContext}
        coinBalance={coinBalance}
        handleMatchConnect={handleMatchConnect}
        handleLikeBack={handleLikeBack}
        handleSendGift={handleSendGift}
        handlePass={handlePass}
        setShowCoinShop={setShowCoinShop}
        showLeaderboard={showLeaderboard}
        setShowLeaderboard={setShowLeaderboard}
        allProfiles={allProfiles}
        userCity={userCity}
        homeFlag={homeFlag}
        likedIds={likedIds}
        handleLike={handleLike}
        setSelectedProfile={setSelectedProfile}
        showTonightSheet={showTonightSheet}
        setShowTonightSheet={setShowTonightSheet}
        lobbyList={lobbyList}
        tonightGiftProfile={tonightGiftProfile}
        setTonightGiftProfile={setTonightGiftProfile}
        saveMatch={saveMatch}
        setFlashMatchProfile={setFlashMatchProfile}
        showLobbyWelcome={showLobbyWelcome}
        setShowLobbyWelcome={setShowLobbyWelcome}
        startTabRevert={startTabRevert}
        showCoinShop={showCoinShop}
        updateCoins={updateCoins}
        matchProfile={matchProfile}
        setMatchProfile={setMatchProfile}
        isGhost={isGhost}
        setIcebreakerProfile={setIcebreakerProfile}
        setButlerMatchName={setButlerMatchName}
        setShowButler={setShowButler}
        setShowButlerUnavailable={setShowButlerUnavailable}
        isFemale={isFemale}
        setButlerConnectProfile={setButlerConnectProfile}
        handleFoundBoo={handleFoundBoo}
        setConnectNowProfile={setConnectNowProfile}
        setMatchPaywallProfile={setMatchPaywallProfile}
        icebreakerProfile={icebreakerProfile}
        showButler={showButler}
        butlerMatchName={butlerMatchName}
        butlerConnectProfile={butlerConnectProfile}
        showButlerUnavailable={showButlerUnavailable}
        matchPaywallProfile={matchPaywallProfile}
        activate={activate}
        connectNowProfile={connectNowProfile}
        savedMatches={savedMatches}
        connectedMatchIds={connectedMatchIds}
        setConnectedMatchIds={setConnectedMatchIds}
        flashMatchProfile={flashMatchProfile}
        flashConnectedIds={flashConnectedIds}
        setFlashConnectedIds={setFlashConnectedIds}
        showFlashLimitToast={showFlashLimitToast}
        FLASH_CONTACT_LIMIT={FLASH_CONTACT_LIMIT}
        showNewGuests={showNewGuests}
        setShowNewGuests={setShowNewGuests}
        newGuestProfiles={newGuestProfiles}
        setLobbyMode={setLobbyMode}
        showBlockedAlert={showBlockedAlert}
        setShowBlockedAlert={setShowBlockedAlert}
        a={a}
        showHouseModal={showHouseModal}
        setShowHouseModal={setShowHouseModal}
        houseTier={houseTier}
        handleHousePurchase={handleHousePurchase}
        inboundLike={inboundLike}
        setInboundLike={setInboundLike}
        showSettingsSheet={showSettingsSheet}
        setShowSettingsSheet={setShowSettingsSheet}
        handleSettingsAction={handleSettingsAction}
        loungeGuestCount={loungeGuestCount}
        loungeEnabled={loungeEnabled}
        handleToggleLounge={handleToggleLounge}
        casinoEnabled={casinoEnabled}
        handleToggleCasino={handleToggleCasino}
        showBreakfastPicker={showBreakfastPicker}
        setShowBreakfastPicker={setShowBreakfastPicker}
        LOUNGE_COUNTRIES={LOUNGE_COUNTRIES}
        flagSheet={flagSheet}
        setFlagSheet={setFlagSheet}
        handleFlag={handleFlag}
        showSecurityPopup={showSecurityPopup}
        setShowSecurityPopup={setShowSecurityPopup}
        setShowHouseRules={setShowHouseRules}
        showHouseRules={showHouseRules}
        handleHouseRulesAccept={handleHouseRulesAccept}
        showIntlModal={showIntlModal}
        setShowIntlModal={setShowIntlModal}
        homeCountryCode={homeCountryCode}
        setIntlCountries={setIntlCountries}
        setIsIntlGhost={setIsIntlGhost}
        showEvents={showEvents}
        setShowEvents={setShowEvents}
        showStats={showStats}
        setShowStats={setShowStats}
        showReferral={showReferral}
        setShowReferral={setShowReferral}
        showFloorInvite={showFloorInvite}
        setShowFloorInvite={setShowFloorInvite}
        floorInviteProfile={floorInviteProfile}
        floorInviteTarget={floorInviteTarget}
        floorInviteMode={floorInviteMode}
        setInvitedMembers={setInvitedMembers}
        nudgeProfile={nudgeProfile}
        setNudgeProfile={setNudgeProfile}
        showGhostScore={showGhostScore}
        setShowGhostScore={setShowGhostScore}
        scoreProfile={scoreProfile}
        setScoreProfile={setScoreProfile}
        showGhostClock={showGhostClock}
        setShowGhostClock={setShowGhostClock}
        setWindowActive={setWindowActive}
        showFloorWars={showFloorWars}
        setShowFloorWars={setShowFloorWars}
        showWhisper={showWhisper}
        setShowWhisper={setShowWhisper}
        whisperProfile={whisperProfile}
        setWhisperProfile={setWhisperProfile}
        setSavedMatches={setSavedMatches}
        showConcierge={showConcierge}
        setShowConcierge={setShowConcierge}
        conciergeProfile={conciergeProfile}
        setConciergeProfile={setConciergeProfile}
        conciergeMatchId={conciergeMatchId}
        conciergeDays={conciergeDays}
        showSeance={showSeance}
        setShowSeance={setShowSeance}
        seanceProfile={seanceProfile}
        setSeanceProfile={setSeanceProfile}
        staffPopupProfile={staffPopupProfile}
        setStaffPopupProfile={setStaffPopupProfile}
        showVideoPlayer={showVideoPlayer}
        setShowVideoPlayer={setShowVideoPlayer}
        videoProfile={videoProfile}
        setVideoProfile={setVideoProfile}
        showVideoUpload={showVideoUpload}
        setShowVideoUpload={setShowVideoUpload}
        showViewedMe={showViewedMe}
        setShowViewedMe={setShowViewedMe}
        viewedMeList={viewedMeList}
        myProfileId={myProfileId}
        userRoomTier={userRoomTier}
        openMatchAction={openMatchAction}
        setFloorInviteProfile={setFloorInviteProfile}
        setFloorInviteMode={setFloorInviteMode}
        setFloorInviteTarget={setFloorInviteTarget}
        setPendingChatInviteProfileId={setPendingChatInviteProfileId}
        setButlerMessage={setButlerMessage}
        showLobbyPopup={showLobbyPopup}
        setShowLobbyPopup={setShowLobbyPopup}
        roomMemberList={roomMemberList}
        showLateNight={showLateNight}
        setShowLateNight={setShowLateNight}
        showButlerWelcome={showButlerWelcome}
        setShowButlerWelcome={setShowButlerWelcome}
        showPushPrompt={showPushPrompt}
        setShowPushPrompt={setShowPushPrompt}
        showCheckout={showCheckout}
        setShowCheckout={setShowCheckout}
        showFloorChat={showFloorChat}
        setShowFloorChat={setShowFloorChat}
        floorChatTier={floorChatTier}
        setFloorChatTier={setFloorChatTier}
        tierColor={tierColor}
        tierLabel={tierLabel}
        tierIcon={tierIcon}
        showFlashPaywall={showFlashPaywall}
        setShowFlashPaywall={setShowFlashPaywall}
        enterFlash={enterFlash}
        isTonightMode={isTonightMode}
        toggleTonight={toggleTonight}
        isFlashActive={isFlashActive}
        exitFlash={exitFlash}
        setHouseTier={setHouseTier}
        deactivate={deactivate}
        profiles={profiles}
        expandedLikedProfile={expandedLikedProfile}
        setExpandedLikedProfile={setExpandedLikedProfile}
        butlerMessage={butlerMessage}
        pendingChatInviteProfileId={pendingChatInviteProfileId}
        showLikeRain={showLikeRain}
        likeRainHearts={likeRainHearts}
      />


    </div>

      {/* Butler game challenge — fires 3–5 min after load if Games Room discovered */}
      <AnimatePresence>
        {showButlerChallenge && (
          <ButlerGameChallengeSheet onClose={() => setShowButlerChallenge(false)} />
        )}
      </AnimatePresence>

      {/* Send game challenge to any guest */}
      <AnimatePresence>
        {challengeTarget && (
          <SendGameChallengeSheet
            target={challengeTarget}
            onClose={() => setChallengeTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Date Ideas — Hotel Information Center */}
      <AnimatePresence>
        {showDateIdeas && (
          <DateIdeasFeed key="date-ideas" onBack={() => setShowDateIdeas(false)} />
        )}
      </AnimatePresence>

      {/* Ms. Vera — locked gate */}
      {showVeraLocked && (
        <MsVeraPopup mode="locked" onClose={() => setShowVeraLocked(false)} />
      )}

      {/* Ms. Vera — new post announcement */}
      {veraNewPost && !veraInvitePost && (
        <MsVeraPopup
          mode="new_post"
          post={veraNewPost}
          onClose={() => setVeraNewPost(null)}
          onInvite={post => { setVeraNewPost(null); setVeraInvitePost(post); }}
          onBrowse={() => { setVeraNewPost(null); setShowDateIdeas(true); }}
        />
      )}

      {/* Ms. Vera → invite flow (from new post announcement) */}
      {veraInvitePost && (
        <SendDateInviteSheet
          show={!!veraInvitePost}
          post={{ id: veraInvitePost.id, title: veraInvitePost.title, image: veraInvitePost.image, location: veraInvitePost.location, authorId: "", authorName: veraInvitePost.authorName }}
          onClose={() => setVeraInvitePost(null)}
        />
      )}

      {/* Date Invite — incoming (recipient side) */}
      <AnimatePresence>
        {pendingInvite && (
          <DateInviteReceivedPopup
            key={pendingInvite.id}
            invite={pendingInvite}
            onDismiss={dismissPending}
          />
        )}
      </AnimatePresence>

      {/* Date Invite — accepted notification (sender side) */}
      <AnimatePresence>
        {acceptedInvite && (
          <DateInviteAcceptedPopup
            key={acceptedInvite.id}
            invite={acceptedInvite}
            onDismiss={dismissAccepted}
          />
        )}
      </AnimatePresence>

      {/* Video Verification Sheet */}
      <AnimatePresence>
        {showGetVerified && (() => {
          const gp = (() => { try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}"); } catch { return {}; } })();
          return (
            <VideoVerificationSheet
              ghostId={gp.ghost_id || gp.id || "anon"}
              onClose={() => setShowGetVerified(false)}
              onVerified={() => setShowGetVerified(false)}
            />
          );
        })()}
      </AnimatePresence>

      {/* Invite Friends Sheet */}
      <AnimatePresence>
        {showInviteFriends && (() => {
          const gp = (() => { try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}"); } catch { return {}; } })();
          return (
            <InviteFriendsSheet
              ghostId={gp.ghost_id || gp.id || "anon"}
              onClose={() => setShowInviteFriends(false)}
            />
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
