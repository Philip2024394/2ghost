import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Settings, Gift, SlidersHorizontal, Lock, KeyRound, Swords, Fingerprint } from "lucide-react";
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
import GhostProfileDetailOverlay from "../components/GhostProfileDetailOverlay";
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
import JokerInviteSheet, { shouldShowJoker } from "../components/JokerInviteSheet";
import { readCoins } from "../utils/featureGating";
import BreakfastChefInviteSheet from "../components/BreakfastChefInviteSheet";
import MaidUpgradeSheet from "../components/MaidUpgradeSheet";
import GamesRoomInviteSheet from "../components/GamesRoomInviteSheet";
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

  // 3-panel browse layout
  const [topCardIdx, setTopCardIdx] = useState(0);
  const [bottomCardIdx, setBottomCardIdx] = useState(2);
  const [topCardDir, setTopCardDir] = useState<"left" | "right">("left");
  const [bottomCardDir, setBottomCardDir] = useState<"left" | "right">("left");
  const [browseTab, setBrowseTab] = useState<"new" | "iliked" | "likesme" | "unlock" | "gifts">("new");
  const [isBottomPackageView, setIsBottomPackageView] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{ emoji: string; label: string; sub: string; coins: number; path: string; locked: boolean } | null>(null);

  const UNLOCK_PACKAGES = [
    { emoji: "💬", label: "1 Unlock",     sub: "Connect now",      coins: 10,  path: "/pricing", locked: coinBalance < 10 },
    { emoji: "💬", label: "3 Pack",        sub: "3 connections",    coins: 25,  path: "/pricing", locked: coinBalance < 25 },
    { emoji: "👑", label: "Ghost Black",   sub: "Unlimited",        coins: 200, path: "/pricing", locked: coinBalance < 200 },
    { emoji: "⭐", label: "Super Like",    sub: "Priority match",   coins: 20,  path: "/pricing", locked: coinBalance < 20 },
    { emoji: "🚀", label: "Boost",         sub: "Top of stack",     coins: 15,  path: "/pricing", locked: coinBalance < 15 },
    { emoji: "✅", label: "Verified",      sub: "Trust badge",      coins: 30,  path: "/pricing", locked: coinBalance < 30 },
    { emoji: "👻", label: "Incognito",     sub: "Browse hidden",    coins: 40,  path: "/pricing", locked: coinBalance < 40 },
    { emoji: "🌟", label: "Spotlight",     sub: "Featured 24h",     coins: 50,  path: "/pricing", locked: coinBalance < 50 },
  ];

  const GIFT_OPTIONS = [
    { emoji: "🌹", label: "Rose",      coins: 5  },
    { emoji: "💐", label: "Bouquet",   coins: 15 },
    { emoji: "🍷", label: "Wine",      coins: 10 },
    { emoji: "🍫", label: "Chocolate", coins: 8  },
    { emoji: "💎", label: "Diamond",   coins: 50 },
    { emoji: "🎁", label: "Gift Box",  coins: 20 },
  ];

  // Profile view mode
  const [ghostProfileView, setGhostProfileView] = useState<GhostProfile | null>(null);
  const [profileTab, setProfileTab] = useState<"profile" | "dateideas" | "treat" | "gifts">("profile");
  const [pvImageIdx, setPvImageIdx] = useState(0);
  const isProfileView = ghostProfileView !== null;
  useEffect(() => { setPvImageIdx(0); }, [ghostProfileView?.id]);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [showJokerSheet, setShowJokerSheet] = useState(false);
  const [showChefSheet, setShowChefSheet] = useState(false);
  const [showMaidSheet, setShowMaidSheet] = useState(false);
  const [showGamesSheet, setShowGamesSheet] = useState(false);

  // Preload character videos in the background so they're cached before the sheet opens
  useEffect(() => {
    const CHAR_VIDEOS = [
      "https://ik.imagekit.io/7grri5v7d/joker%20woman.mp4",
      "https://ik.imagekit.io/7grri5v7d/maid%20with%20key.mp4",
    ];
    const els = CHAR_VIDEOS.map(url => {
      const v = document.createElement("video");
      v.src = url;
      v.preload = "auto";
      v.muted = true;
      v.playsInline = true;
      v.load();
      return v;
    });
    return () => { els.forEach(v => { v.src = ""; }); };
  }, []);

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


  const centerProfiles = useMemo(() => {
    return newGuestProfiles.length > 0 ? newGuestProfiles : profiles.slice(0, 12);
  }, [profiles, newGuestProfiles]);

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
    if (newLiked.has(profile.id)) {
      newLiked.delete(profile.id);
      setLikedIds(newLiked);
      return;
    }
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
      style={{ width: "100%", maxWidth: 480, minHeight: "100dvh", background: "#000", color: "#fff", display: "flex", flexDirection: "column", position: "relative" }}
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


      {/* ── Daily Login Streak Banner ── */}
      <GhostStreakBanner />



      {/* ── 3-Panel Browse Layout ── */}
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
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", minHeight: 0,
          padding: "6px 16px",
          paddingBottom: `max(16px, env(safe-area-inset-bottom, 16px))`,
          gap: 10,
        }}>

          {/* ── Profile view top card ── */}
          {isProfileView && ghostProfileView && (() => {
            const p = ghostProfileView;
            const online = isOnline(p.last_seen_at);
            const isLiked = likedIds.has(p.id);
            // Simulate multiple images — real app will supply p.images[]
            const pvImages = [p.image, p.image, p.image];
            const pvTotal = pvImages.length;
            return (
              <motion.div
                key={`pv-${p.id}`}
                initial={{ opacity: 0, flexGrow: 1.8 }}
                animate={{ opacity: 1, flexGrow: 3.5 }}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
                onClick={() => { setGhostProfileView(null); setProfileTab("profile"); }}
                style={{
                  flex: "0 0 0px", minHeight: 150,
                  position: "relative", borderRadius: 28, overflow: "hidden",
                  boxShadow: "0 14px 36px rgba(0,0,0,0.5)", cursor: "pointer",
                }}
              >
                {/* Current photo */}
                <motion.img
                  key={`pv-img-${pvImageIdx}`}
                  src={pvImages[pvImageIdx]} alt=""
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)" }} />

                {/* Image indicator lines — top center */}
                <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4, zIndex: 10 }}>
                  {pvImages.map((_, i) => (
                    <div key={i} style={{
                      width: 28, height: 3, borderRadius: 2,
                      background: i === pvImageIdx ? "#fff" : "rgba(255,255,255,0.35)",
                      transition: "background 0.25s",
                    }} />
                  ))}
                </div>

                {/* Distance badge — top-left */}
                <div style={{ position: "absolute", top: 24, left: 14, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}>
                  📍 {p.distanceKm !== undefined ? `${p.distanceKm < 1 ? "<1" : Math.round(p.distanceKm)} km` : "Nearby"}
                </div>

                {/* Heart button — top-right */}
                <motion.button whileTap={{ scale: 0.84 }}
                  onClick={e => { e.stopPropagation(); handleLike(p); if (!likedIds.has(p.id)) { setShowLikeRain(true); setTimeout(() => setShowLikeRain(false), 2500); } }}
                  style={{ position: "absolute", top: 18, right: 14, width: 44, height: 44, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.22)", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", touchAction: "manipulation", fontSize: 21 }}>
                  {isLiked ? "❤️" : "🤍"}
                </motion.button>

                {/* Info overlay — bottom-left */}
                <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{toGhostId(p.id)}</p>
                    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.4, repeat: Infinity }}
                      style={{ width: 8, height: 8, borderRadius: "50%", background: online ? "#22c55e" : "#f59e0b", boxShadow: online ? "0 0 6px rgba(34,197,94,0.9)" : "0 0 6px rgba(245,158,11,0.9)", flexShrink: 0 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {p.isVerified && <span style={{ fontSize: 13, lineHeight: 1 }}>✅</span>}
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{p.age}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{p.city.split(",")[0]}</p>
                </div>

                {/* Fingerprint button — bottom-right, cycles through images */}
                <motion.button
                  whileTap={{ scale: 0.84 }}
                  onClick={e => { e.stopPropagation(); setPvImageIdx(i => (i + 1) % pvTotal); }}
                  style={{ position: "absolute", bottom: 14, right: 14, width: 48, height: 48, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.28)", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", touchAction: "manipulation" }}
                >
                  <Fingerprint size={24} color="rgba(255,255,255,0.8)" />
                </motion.button>
              </motion.div>
            );
          })()}

          {/* ── Top profile card (home mode only) ── */}
          {!isProfileView && (() => {
            const profile = profiles[topCardIdx % profiles.length];
            const online = isOnline(profile.last_seen_at);
            const isLiked = likedIds.has(profile.id);
            // Persona logic — same rules as GhostCard
            function _idHash(id: string): number { let h = 0; for (let i = 0; i < id.length; i++) h = Math.imul(37, h) + id.charCodeAt(i) | 0; return Math.abs(h); }
            const _isVerified = profile.isVerified || profile.faceVerified || profile.badge === "Verified";
            const _isMaleUnverified = !_isVerified && profile.gender !== "Female";
            const _isChef   = _isMaleUnverified && (_idHash(profile.id + "persona") % 2 === 0);
            const _isGames  = _isMaleUnverified && !_isChef;
            const _isJoker  = !_isVerified && profile.gender === "Female" && shouldShowJoker(profile.id, readCoins());
            const _isMaid   = !_isVerified && profile.gender === "Female" && !_isJoker;
            const PERSONA_JOKER = "https://ik.imagekit.io/7grri5v7d/Untitleddsfsdfsdf.png";
            const PERSONA_CHEF  = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasd.png";
            const PERSONA_MAID  = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasddsds.png";
            const PERSONA_GAMES = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasddsdssdfs.png?updatedAt=1774487538945";
            const cardImg = _isVerified ? profile.image
              : _isJoker ? PERSONA_JOKER : _isChef ? PERSONA_CHEF
              : _isMaid  ? PERSONA_MAID  : _isGames ? PERSONA_GAMES : profile.image;
            const personaFrame = _isChef  ? "rgba(249,115,22,0.7)"
              : _isGames ? "rgba(34,211,238,0.7)"
              : _isMaid  ? "rgba(192,132,252,0.7)"
              : _isJoker ? "rgba(236,72,153,0.7)" : null;
            function handleCardTap(e: React.MouseEvent) {
              e.stopPropagation();
              if (_isJoker) { setShowJokerSheet(true); return; }
              if (_isChef)  { setShowChefSheet(true);  return; }
              if (_isMaid)  { setShowMaidSheet(true);  return; }
              if (_isGames) { setShowGamesSheet(true); return; }
              requireAuth(() => setGhostProfileView(profile));
            }
            return (
              <motion.div
                key={`top-${profile.id}`}
                initial={{ x: topCardDir === "left" ? 260 : -260, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                dragTransition={{ bounceStiffness: 500, bounceDamping: 40 }}
                onDragEnd={(_, info) => {
                  const triggered = Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 500;
                  if (triggered) {
                    if (info.offset.x > 0) {
                      setTopCardDir("right");
                      setTopCardIdx(i => (i - 1 + profiles.length) % profiles.length);
                    } else {
                      setTopCardDir("left");
                      setTopCardIdx(i => (i + 1) % profiles.length);
                    }
                  } else if (info.offset.y < -60) {
                    requireAuth(() => setGhostProfileView(profile));
                  }
                }}
                style={{
                  flex: "0 0 0px", flexGrow: 1.8, minHeight: 150,
                  position: "relative", borderRadius: 28, overflow: "hidden",
                  cursor: "pointer", touchAction: "pan-y",
                  border: personaFrame ? `2px solid ${personaFrame}` : undefined,
                  boxShadow: personaFrame ? `0 14px 36px rgba(0,0,0,0.5), 0 0 0 2px ${personaFrame}` : "0 14px 36px rgba(0,0,0,0.5)",
                }}
                onClick={handleCardTap}
              >
                {/* Full-bleed image */}
                <img
                  src={cardImg} alt=""
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
                  onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
                {/* Gradient overlay */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 38%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.5) 100%)" }} />

                {/* Distance badge — top-left */}
                <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                  📍 {profile.distanceKm !== undefined ? `${profile.distanceKm < 1 ? "<1" : Math.round(profile.distanceKm)} km` : "Nearby"}
                </div>

                {/* Info overlay — bottom-left */}
                <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: personaFrame ? "#d4af37" : "#fff", lineHeight: 1 }}>
                      {_isChef ? "👨‍🍳 Chef Armand" : _isGames ? "🎮 Games Boy" : _isMaid ? "🧹 Maid Eloise" : _isJoker ? "🃏 The Joker" : toGhostId(profile.id)}
                    </p>
                    <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.4, repeat: Infinity }}
                      style={{ width: 8, height: 8, borderRadius: "50%", background: online ? "#22c55e" : "#f59e0b", boxShadow: online ? "0 0 6px rgba(34,197,94,0.9)" : "0 0 6px rgba(245,158,11,0.9)", flexShrink: 0 }} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {profile.isVerified && <span style={{ fontSize: 13, lineHeight: 1 }}>✅</span>}
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{profile.age}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{profile.city.split(",")[0]}</p>
                </div>

                {/* Heart button — top-right */}
                <motion.button
                  whileTap={{ scale: 0.84 }}
                  onClick={e => { e.stopPropagation(); handleLike(profile); requireAuth(() => setGhostProfileView(profile)); if (!likedIds.has(profile.id)) { setShowLikeRain(true); setTimeout(() => setShowLikeRain(false), 2500); } }}
                  style={{
                    position: "absolute", top: 14, right: 14,
                    width: 44, height: 44, borderRadius: "50%",
                    border: "1.5px solid rgba(255,255,255,0.22)",
                    background: "rgba(0,0,0,0.45)",
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", touchAction: "manipulation", fontSize: 21,
                    transition: "none",
                  }}
                >
                  {isLiked ? "❤️" : "🤍"}
                </motion.button>

                {/* Fingerprint button — bottom-right */}
                <motion.button
                  whileTap={{ scale: 0.84 }}
                  onClick={e => {
                    e.stopPropagation();
                    setTopCardDir("left");
                    setTopCardIdx(cur => {
                      const n = profiles.length;
                      if (n <= 1) return cur;
                      let next = (cur + 1) % n;
                      if (next === bottomCardIdx) next = (next + 1) % n;
                      return next;
                    });
                  }}
                  style={{
                    position: "absolute", bottom: 14, right: 14,
                    width: 48, height: 48, borderRadius: "50%",
                    border: "1.5px solid rgba(255,255,255,0.22)",
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", touchAction: "manipulation",
                  }}
                >
                  <Fingerprint size={24} color="rgba(255,255,255,0.75)" />
                </motion.button>

              </motion.div>
            );
          })()}


          {/* ── Center panel (home mode only) ── */}
          {!isProfileView && <div style={{
            flex: "0 0 0px", flexGrow: 1.6, minHeight: 0,
            background: "#000",
            borderRadius: 28,
            border: "1.5px solid #d4af37",
            boxShadow: "0 0 0 1px rgba(212,175,55,0.18), 0 0 18px rgba(212,175,55,0.22), inset 0 0 12px rgba(212,175,55,0.06)",
            display: "flex", flexDirection: "column", padding: "12px 14px 10px", gap: 8,
            overflowY: "auto", scrollbarWidth: "none",
            position: "relative", overflowX: "hidden",
          }}>

            {/* Floating hearts — decorative, always visible */}
            <style>{`
              @keyframes floatHeart{0%{transform:translateY(0) scale(0.7);opacity:0.7}100%{transform:translateY(-90px) scale(0.3);opacity:0}}
              .fh{position:absolute;bottom:10px;pointer-events:none;animation:floatHeart 2.8s ease-in infinite;font-size:14px;z-index:0}
            `}</style>
            {[14, 26, 40, 56, 70, 82].map((left, i) => (
              <div key={i} className="fh" style={{ left: `${left}%`, animationDelay: `${i * 0.45}s`, animationDuration: `${2.4 + i * 0.3}s` }}>❤️</div>
            ))}

            {/* Header row */}
            {isProfileView && ghostProfileView ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative", zIndex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#d4af37" }}>
                  {toGhostId(ghostProfileView.id)}
                </p>
                <div style={{ display: "flex", background: "rgba(212,175,55,0.1)", borderRadius: 30, padding: 3, gap: 1, border: "1px solid rgba(212,175,55,0.25)" }}>
                  {(["profile", "dateideas", "treat", "gifts"] as const).map(tab => (
                    <motion.button key={tab} whileTap={{ scale: 0.93 }}
                      onClick={() => setProfileTab(tab)}
                      style={{ padding: "4px 7px", borderRadius: 26, border: "none", background: profileTab === tab ? "#e11d48" : "transparent", color: profileTab === tab ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 8, fontWeight: 700, cursor: "pointer", touchAction: "manipulation", transition: "background 0.15s, color 0.15s", whiteSpace: "nowrap" }}>
                      {tab === "profile" ? "Profile" : tab === "dateideas" ? "Date" : tab === "treat" ? "Treat" : "Gifts"}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative", zIndex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#d4af37" }}>
                  {browseTab === "new" ? "New Guests" : browseTab === "iliked" ? "I Liked" : browseTab === "likesme" ? "Likes Me" : browseTab === "unlock" ? "Unlock" : "Gifts"}
                </p>
                {/* 5-tab segmented toggle */}
                <div style={{ display: "flex", background: "rgba(212,175,55,0.1)", borderRadius: 30, padding: 3, gap: 1, border: "1px solid rgba(212,175,55,0.25)" }}>
                  {(["new", "iliked", "likesme", "unlock", "gifts"] as const).map(tab => (
                    <motion.button key={tab} whileTap={{ scale: 0.93 }}
                      onClick={() => {
                        setBrowseTab(tab);
                        if (tab === "unlock") {
                          setSelectedPackage(UNLOCK_PACKAGES[0]);
                          setIsBottomPackageView(true);
                        } else {
                          setIsBottomPackageView(false);
                          setSelectedPackage(null);
                        }
                      }}
                      style={{
                        padding: "4px 7px", borderRadius: 26, border: "none",
                        background: browseTab === tab ? "#e11d48" : "transparent",
                        color: browseTab === tab ? "#fff" : "rgba(255,255,255,0.5)",
                        fontSize: 8, fontWeight: 700, cursor: "pointer", touchAction: "manipulation",
                        transition: "background 0.15s, color 0.15s", whiteSpace: "nowrap",
                      }}
                    >
                      {tab === "new" ? "New" : tab === "iliked" ? "Liked" : tab === "likesme" ? "Fans" : tab === "unlock" ? "Unlock" : "Gifts"}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            <style>{`.c-scroll::-webkit-scrollbar{display:none}`}</style>

            {/* ── New Guests ── */}
            {!isProfileView && browseTab === "new" && (
              <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", flex: 1, minHeight: 0, paddingBottom: 4, display: "flex", gap: 10, alignItems: "stretch", position: "relative", zIndex: 1, WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                  {centerProfiles.slice(0, 12).map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.92 }}
                      onClick={() => requireAuth(() => setGhostProfileView(p))}
                      style={{ flexShrink: 0, width: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(212,175,55,0.08)", borderRadius: 18, padding: "12px 6px", cursor: "pointer", border: "1px solid rgba(212,175,55,0.2)", touchAction: "manipulation", position: "relative", gap: 6 }}
                    >
                      <div style={{ position: "relative" }}>
                        {/* Gold ring around avatar */}
                        <div style={{ width: 66, height: 66, borderRadius: "50%", padding: 2, background: "linear-gradient(135deg, #d4af37, #f5e47a, #d4af37)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <img src={p.image} alt="" style={{ width: 62, height: 62, borderRadius: "50%", objectFit: "cover", display: "block" }} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                        </div>
                        {/* Status dot — always shown, green=online orange=busy */}
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.15, 0.9] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                          style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: "50%", background: isOnline(p.last_seen_at) ? "#22c55e" : "#f59e0b", border: "2px solid #0d1422", boxShadow: isOnline(p.last_seen_at) ? "0 0 7px rgba(34,197,94,0.9)" : "0 0 7px rgba(245,158,11,0.9)" }} />
                        {i < 4 && <div style={{ position: "absolute", top: -5, right: -8, background: "gold", borderRadius: 20, padding: "2px 6px", fontSize: 7, fontWeight: 900, color: "#1f1a0a", boxShadow: "0 0 6px gold", zIndex: 2 }}>NEW</div>}
                      </div>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#fff", textAlign: "center", width: "100%", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name.split(" ")[0]}</p>
                      <p style={{ margin: 0, fontSize: 8, color: "#a5b3d4" }}>{p.age} · {p.city.split(",")[0].split(" ")[0]}</p>
                    </motion.div>
                  ))}
              </div>
            )}

            {/* ── I Liked ── */}
            {!isProfileView && browseTab === "iliked" && (
              <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", flex: 1, minHeight: 0, paddingBottom: 4, display: "flex", gap: 10, alignItems: "stretch", position: "relative", zIndex: 1, WebkitOverflowScrolling: "touch" } as React.CSSProperties}>
                  {iLikeList.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", fontStyle: "italic", padding: "10px 0" }}>No likes yet — tap a heart!</p>
                  ) : iLikeList.slice(0, 12).map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.92 }}
                      onClick={() => requireAuth(() => setGhostProfileView(p))}
                      style={{ flexShrink: 0, width: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(212,175,55,0.08)", borderRadius: 18, padding: "12px 6px", cursor: "pointer", border: "1px solid rgba(212,175,55,0.25)", touchAction: "manipulation", position: "relative", gap: 6 }}
                    >
                      <div style={{ position: "relative" }}>
                        <img src={p.image} alt="" style={{ width: 62, height: 62, borderRadius: "50%", objectFit: "cover", display: "block" }} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                        {isOnline(p.last_seen_at) && <div style={{ position: "absolute", bottom: 2, right: 2, width: 11, height: 11, borderRadius: "50%", background: "#22c55e", border: "2px solid #0d1422" }} />}
                      </div>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#fff", textAlign: "center", width: "100%", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{p.name.split(" ")[0]}</p>
                      <p style={{ margin: 0, fontSize: 8, color: "#a5b3d4" }}>{p.age} · {p.city.split(",")[0].split(" ")[0]}</p>
                      <div style={{ position: "absolute", top: 8, right: 8, fontSize: 10 }}>❤️</div>
                    </motion.div>
                  ))}
              </div>
            )}

            {/* ── Likes Me (Fans) ── */}
            {!isProfileView && browseTab === "likesme" && (
              <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", flex: 1, minHeight: 0, paddingBottom: 4, display: "flex", gap: 10, alignItems: "stretch", position: "relative", zIndex: 1 } as React.CSSProperties}>
                  {likedMeList.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", fontStyle: "italic", padding: "10px 0" }}>No fans yet — keep swiping!</p>
                  ) : likedMeList.slice(0, 12).map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.92 }}
                      onClick={() => requireAuth(() => setGhostProfileView(p))}
                      style={{ flexShrink: 0, width: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(212,175,55,0.08)", borderRadius: 18, padding: "12px 6px", cursor: "pointer", border: "1px solid rgba(236,72,153,0.3)", touchAction: "manipulation", position: "relative", gap: 6 }}
                    >
                      <div style={{ position: "relative", filter: likedIds.has(p.id) ? "none" : "blur(4px)" }}>
                        <img src={p.image} alt="" style={{ width: 62, height: 62, borderRadius: "50%", objectFit: "cover", display: "block" }} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                        {isOnline(p.last_seen_at) && <div style={{ position: "absolute", bottom: 2, right: 2, width: 11, height: 11, borderRadius: "50%", background: "#22c55e", border: "2px solid #0d1422" }} />}
                      </div>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "#fff", textAlign: "center", width: "100%", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{likedIds.has(p.id) ? p.name.split(" ")[0] : "Ghost"}</p>
                      <p style={{ margin: 0, fontSize: 8, color: "#a5b3d4" }}>{p.age} · {likedIds.has(p.id) ? p.city.split(",")[0].split(" ")[0] : "???"}</p>
                      <div style={{ position: "absolute", top: 8, right: 8, fontSize: 10 }}>🩷</div>
                    </motion.div>
                  ))}
              </div>
            )}

            {/* ── Unlock ── */}
            {!isProfileView && browseTab === "unlock" && (
              <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", flex: 1, minHeight: 0, paddingBottom: 4, display: "flex", gap: 10, alignItems: "stretch", position: "relative", zIndex: 1 } as React.CSSProperties}>
                  {UNLOCK_PACKAGES.map((pkg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.92 }}
                      onClick={() => { setSelectedPackage(pkg); setIsBottomPackageView(true); }}
                      style={{ flexShrink: 0, width: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: selectedPackage?.label === pkg.label ? "rgba(212,175,55,0.18)" : "rgba(212,175,55,0.08)", borderRadius: 18, padding: "10px 6px", cursor: "pointer", border: `1px solid ${selectedPackage?.label === pkg.label ? "#d4af37" : pkg.locked ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.3)"}`, touchAction: "manipulation", position: "relative", overflow: "hidden", gap: 5 }}
                    >
                      <div style={{ fontSize: 28, lineHeight: 1 }}>{pkg.emoji}</div>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: pkg.locked ? "rgba(255,255,255,0.4)" : "#fff", textAlign: "center", width: "100%", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{pkg.label}</p>
                      <div style={{ background: "rgba(44,62,102,0.9)", padding: "1px 8px", borderRadius: 20, fontSize: 8, fontWeight: 700, color: "#ffd966" }}>🪙 {pkg.coins > 0 ? pkg.coins : "Free"}</div>
                      {pkg.locked && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, backdropFilter: "blur(2px)" }}>🔒</div>}
                    </motion.div>
                  ))}
              </div>
            )}

            {/* ── Gifts (browse mode) ── */}
            {!isProfileView && browseTab === "gifts" && (
              <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", flex: 1, minHeight: 0, paddingBottom: 4, display: "flex", gap: 10, alignItems: "stretch", position: "relative", zIndex: 1 } as React.CSSProperties}>
                  {GIFT_OPTIONS.map((gift, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.92 }}
                      onClick={() => requireAuth(() => {
                        if (coinBalance < gift.coins) { setShowCoinShop(true); return; }
                        handleSendGift(gift.emoji, gift.coins);
                        setShowLikeRain(true);
                        setTimeout(() => setShowLikeRain(false), 2500);
                      })}
                      style={{ flexShrink: 0, width: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(212,175,55,0.08)", borderRadius: 18, padding: "12px 6px", cursor: "pointer", border: `1px solid ${coinBalance >= gift.coins ? "rgba(212,175,55,0.3)" : "rgba(212,175,55,0.1)"}`, touchAction: "manipulation", gap: 6 }}
                    >
                      <div style={{ fontSize: 32, lineHeight: 1 }}>{gift.emoji}</div>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#fff", textAlign: "center" }}>{gift.label}</p>
                      <div style={{ background: "rgba(44,62,102,0.9)", padding: "1px 8px", borderRadius: 20, fontSize: 8, fontWeight: 700, color: coinBalance >= gift.coins ? "#ffd966" : "rgba(255,100,100,0.8)" }}>🪙 {gift.coins}</div>
                    </motion.div>
                  ))}
              </div>
            )}

            {/* ── Profile view: Profile tab — About Me / Images / Video containers ── */}
            {isProfileView && ghostProfileView && profileTab === "profile" && (
              <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", flex: 1, minHeight: 0, paddingBottom: 4, display: "flex", gap: 10, alignItems: "stretch", position: "relative", zIndex: 1 } as React.CSSProperties}>

                  {/* About Me */}
                  <div style={{ flexShrink: 0, width: 100, borderRadius: 18, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.22)", padding: "12px 10px", display: "flex", flexDirection: "column", gap: 6, overflow: "hidden" }}>
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "#d4af37", letterSpacing: 0.5, textTransform: "uppercase", flexShrink: 0 }}>About Me</p>
                    {ghostProfileView.bio ? (
                      <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, overflow: "hidden", flex: 1 }}>{ghostProfileView.bio}</p>
                    ) : (
                      <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>No bio yet 👻</p>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, flexShrink: 0 }}>
                      {[
                        ghostProfileView.religion && ghostProfileView.religion,
                        ghostProfileView.gender,
                        ghostProfileView.contactPref && ghostProfileView.contactPref,
                      ].filter(Boolean).map((val, i) => (
                        <span key={i} style={{ fontSize: 7, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 20, padding: "2px 6px", color: "#d4af37", fontWeight: 600 }}>{val}</span>
                      ))}
                    </div>
                    {ghostProfileView.interests && ghostProfileView.interests.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, flexShrink: 0 }}>
                        {ghostProfileView.interests.slice(0, 3).map((interest, i) => (
                          <span key={i} style={{ fontSize: 7, background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "2px 6px", color: "rgba(255,255,255,0.55)" }}>{interest}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Images */}
                  <div style={{ flexShrink: 0, width: 100, borderRadius: 18, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "10px 10px 6px", flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "#d4af37", letterSpacing: 0.5, textTransform: "uppercase" }}>Images</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, padding: "0 6px 6px", flex: 1, minHeight: 0 }}>
                      {[ghostProfileView.image, ghostProfileView.image, ghostProfileView.image, ghostProfileView.image].map((img, i) => (
                        <div key={i} style={{ borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,0.05)", minHeight: 0 }}>
                          <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: i === 0 ? 1 : 0.4 }} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Video */}
                  <div style={{ flexShrink: 0, width: 100, borderRadius: 18, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.22)", display: "flex", flexDirection: "column", padding: "12px 10px", gap: 8, overflow: "hidden" }}>
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "#d4af37", letterSpacing: 0.5, textTransform: "uppercase", flexShrink: 0 }}>Video</p>
                    <div style={{ flex: 1, borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(212,175,55,0.15)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", minHeight: 0 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(212,175,55,0.15)", border: "1.5px solid rgba(212,175,55,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>▶</div>
                      <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>No video yet</p>
                    </div>
                  </div>

                  {/* Joker */}
                  <motion.div
                    whileTap={{ scale: 0.93 }}
                    onClick={e => { e.stopPropagation(); setShowJokerSheet(true); }}
                    style={{ flexShrink: 0, width: 100, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(212,175,55,0.35)", cursor: "pointer", position: "relative", touchAction: "manipulation" }}
                  >
                    <img src="https://ik.imagekit.io/7grri5v7d/Untitleddsfsdfsdf.png" alt="Joker"
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)" }} />
                    <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: "#d4af37", letterSpacing: "0.1em", textTransform: "uppercase" }}>🃏 Joker</p>
                      <p style={{ margin: "2px 0 0", fontSize: 8, color: "rgba(255,255,255,0.45)" }}>Tap to collect</p>
                    </div>
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }}
                      style={{ position: "absolute", inset: 0, borderRadius: 18, border: "1.5px solid rgba(212,175,55,0.6)", pointerEvents: "none" }} />
                  </motion.div>

                  {/* Chef Armand */}
                  <motion.div
                    whileTap={{ scale: 0.93 }}
                    onClick={e => { e.stopPropagation(); setShowChefSheet(true); }}
                    style={{ flexShrink: 0, width: 100, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(249,115,22,0.35)", cursor: "pointer", position: "relative", touchAction: "manipulation" }}
                  >
                    <img src="https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasd.png" alt="Chef"
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)" }} />
                    <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: "#f97316", letterSpacing: "0.1em", textTransform: "uppercase" }}>👨‍🍳 Chef</p>
                      <p style={{ margin: "2px 0 0", fontSize: 8, color: "rgba(255,255,255,0.45)" }}>Breakfast lounge</p>
                    </div>
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
                      style={{ position: "absolute", inset: 0, borderRadius: 18, border: "1.5px solid rgba(249,115,22,0.6)", pointerEvents: "none" }} />
                  </motion.div>

                  {/* Maid Eloise */}
                  <motion.div
                    whileTap={{ scale: 0.93 }}
                    onClick={e => { e.stopPropagation(); setShowMaidSheet(true); }}
                    style={{ flexShrink: 0, width: 100, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(192,132,252,0.35)", cursor: "pointer", position: "relative", touchAction: "manipulation" }}
                  >
                    <img src="https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasddsds.png" alt="Maid"
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)" }} />
                    <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: "#c084fc", letterSpacing: "0.1em", textTransform: "uppercase" }}>🧹 Maid</p>
                      <p style={{ margin: "2px 0 0", fontSize: 8, color: "rgba(255,255,255,0.45)" }}>Room service</p>
                    </div>
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity, delay: 1.2 }}
                      style={{ position: "absolute", inset: 0, borderRadius: 18, border: "1.5px solid rgba(192,132,252,0.6)", pointerEvents: "none" }} />
                  </motion.div>

                  {/* Games Boy */}
                  <motion.div
                    whileTap={{ scale: 0.93 }}
                    onClick={e => { e.stopPropagation(); setShowGamesSheet(true); }}
                    style={{ flexShrink: 0, width: 100, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(34,211,238,0.35)", cursor: "pointer", position: "relative", touchAction: "manipulation" }}
                  >
                    <img src="https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasddsdssdfs.png?updatedAt=1774487538945" alt="Games Boy"
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 55%)" }} />
                    <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: "#22d3ee", letterSpacing: "0.1em", textTransform: "uppercase" }}>🎮 Games</p>
                      <p style={{ margin: "2px 0 0", fontSize: 8, color: "rgba(255,255,255,0.45)" }}>Games room</p>
                    </div>
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity, delay: 1.8 }}
                      style={{ position: "absolute", inset: 0, borderRadius: 18, border: "1.5px solid rgba(34,211,238,0.6)", pointerEvents: "none" }} />
                  </motion.div>

              </div>
            )}

            {/* ── Profile view: Date Ideas tab — cards in center ── */}
            {isProfileView && ghostProfileView && profileTab === "dateideas" && (
              <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", flex: 1, minHeight: 0, paddingBottom: 4, display: "flex", gap: 10, alignItems: "stretch", position: "relative", zIndex: 1 } as React.CSSProperties}>
                  {[
                    ghostProfileView.firstDateIdea || "Dinner Date",
                    "Coffee & Walk", "Movie Night", "Sunset Drive", "Live Music", "Cooking Together",
                  ].map((idea, i) => (
                    <motion.div key={i} whileTap={{ scale: 0.93 }} onClick={() => setShowDateIdeas(true)}
                      style={{ flexShrink: 0, width: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(212,175,55,0.08)", borderRadius: 18, padding: "12px 6px", cursor: "pointer", border: "1px solid rgba(212,175,55,0.22)", touchAction: "manipulation", gap: 8 }}>
                      <span style={{ fontSize: 28 }}>{["🌙","☕","🎬","🌅","🎵","👨‍🍳"][i] || "💡"}</span>
                      <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.3 }}>{idea}</p>
                    </motion.div>
                  ))}
              </div>
            )}

            {/* ── Profile view: Treat — horizontal scroll in center, full height ── */}
            {isProfileView && profileTab === "treat" && (
              <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", flex: 1, minHeight: 0, paddingBottom: 4, display: "flex", gap: 10, alignItems: "stretch", position: "relative", zIndex: 1 } as React.CSSProperties}>
                  {[
                    { emoji: "💆", label: "Massage",   sub: "From Rp 250k", img: "https://ik.imagekit.io/7grri5v7d/massage%20therapsy.png" },
                    { emoji: "💅", label: "Beautician", sub: "From Rp 200k", img: "https://ik.imagekit.io/7grri5v7d/beauty%20woman.png" },
                    { emoji: "💐", label: "Flowers",    sub: "From Rp 350k", img: "https://ik.imagekit.io/7grri5v7d/flowers%20nice.png" },
                    { emoji: "💎", label: "Jewelry",    sub: "From Rp 250k", img: "https://ik.imagekit.io/7grri5v7d/jewerlysss.png" },
                    { emoji: "🍷", label: "Wine Night",  sub: "From Rp 300k", img: "https://ik.imagekit.io/7grri5v7d/flowers%20nice.png" },
                    { emoji: "🎁", label: "Surprise",   sub: "From Rp 400k", img: "https://ik.imagekit.io/7grri5v7d/jewerlysss.png" },
                  ].map((t, i) => (
                    <motion.div key={i} whileTap={{ scale: 0.93 }}
                      style={{ flexShrink: 0, width: 100, borderRadius: 18, overflow: "hidden", cursor: "pointer", border: "1px solid rgba(212,175,55,0.25)", background: "rgba(212,175,55,0.06)", display: "flex", flexDirection: "column" }}>
                      <img src={t.img} alt={t.label} style={{ width: "100%", flex: 1, objectFit: "cover", display: "block", minHeight: 0 }} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                      <div style={{ padding: "7px 9px", flexShrink: 0 }}>
                        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#fff" }}>{t.emoji} {t.label}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 8, color: "rgba(212,175,55,0.7)" }}>{t.sub}</p>
                      </div>
                    </motion.div>
                  ))}
              </div>
            )}

            {/* ── Profile view: Gifts — horizontal scroll in center ── */}
            {isProfileView && profileTab === "gifts" && (
              <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", flex: 1, minHeight: 0, paddingBottom: 4, display: "flex", gap: 10, alignItems: "stretch", position: "relative", zIndex: 1 } as React.CSSProperties}>
                  {GIFT_OPTIONS.map((gift, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }} whileTap={{ scale: 0.92 }}
                      onClick={() => requireAuth(() => {
                        if (coinBalance < gift.coins) { setShowCoinShop(true); return; }
                        handleSendGift(gift.emoji, gift.coins);
                        setShowLikeRain(true);
                        setTimeout(() => setShowLikeRain(false), 2500);
                      })}
                      style={{ flexShrink: 0, width: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(212,175,55,0.08)", borderRadius: 18, padding: "12px 6px", cursor: "pointer", border: `1px solid ${coinBalance >= gift.coins ? "rgba(212,175,55,0.3)" : "rgba(212,175,55,0.1)"}`, touchAction: "manipulation", gap: 6 }}
                    >
                      <div style={{ fontSize: 32, lineHeight: 1 }}>{gift.emoji}</div>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#fff", textAlign: "center" }}>{gift.label}</p>
                      <div style={{ background: "rgba(44,62,102,0.9)", padding: "1px 8px", borderRadius: 20, fontSize: 8, fontWeight: 700, color: coinBalance >= gift.coins ? "#ffd966" : "rgba(255,100,100,0.8)" }}>🪙 {gift.coins}</div>
                    </motion.div>
                  ))}
              </div>
            )}

          </div>}

          {/* ── Bottom card (profile or package detail) ── */}
          <motion.div
            key={isProfileView ? `pv-bottom-${ghostProfileView?.id}` : isBottomPackageView ? `pkg-${selectedPackage?.label}` : `bottom-${profiles[bottomCardIdx % Math.max(profiles.length,1)]?.id}`}
            initial={{ x: bottomCardDir === "left" ? 260 : -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            drag={isProfileView || isBottomPackageView ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            dragTransition={{ bounceStiffness: 500, bounceDamping: 40 }}
            onDragEnd={isProfileView || isBottomPackageView ? undefined : (_, info) => {
              if (profiles.length < 2) return;
              const triggered = Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 500;
              if (triggered) {
                if (info.offset.x > 0) {
                  setBottomCardDir("right");
                  setBottomCardIdx(i => (i - 1 + profiles.length) % profiles.length);
                } else {
                  setBottomCardDir("left");
                  setBottomCardIdx(i => (i + 1) % profiles.length);
                }
              }
            }}
            style={{
              flex: "0 0 0px", flexGrow: 1.8, minHeight: 150,
              position: "relative",
              borderRadius: 28, overflow: "hidden",
              boxShadow: "0 14px 36px rgba(0,0,0,0.5)",
              cursor: isProfileView || isBottomPackageView ? "default" : "grab",
              touchAction: isProfileView || isBottomPackageView ? "manipulation" : "pan-y",
            }}
          >
            {isProfileView && ghostProfileView ? (
              /* ── Profile detail view in bottom card ── */
              (() => {
                const p = ghostProfileView;
                const isLiked = likedIds.has(p.id);
                return (
                  <>
                    {/* Solid dark background — no image, top card already shows the image */}
                    <div style={{ position: "absolute", inset: 0, background: "#0a0a0a" }} />

                    {/* Header: ghost ID + tab toggle */}
                    <div style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#d4af37" }}>{toGhostId(p.id)}</p>
                      <div style={{ display: "flex", background: "rgba(212,175,55,0.12)", borderRadius: 30, padding: 3, gap: 1, border: "1px solid rgba(212,175,55,0.28)" }}>
                        {(["profile","dateideas","treat","gifts"] as const).map(tab => (
                          <motion.button key={tab} whileTap={{ scale: 0.93 }}
                            onClick={e => { e.stopPropagation(); setProfileTab(tab); }}
                            style={{ padding: "4px 8px", borderRadius: 26, border: "none", background: profileTab === tab ? "#e11d48" : "transparent", color: profileTab === tab ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 8, fontWeight: 700, cursor: "pointer", touchAction: "manipulation", transition: "background 0.15s, color 0.15s", whiteSpace: "nowrap" }}>
                            {tab === "profile" ? "Profile" : tab === "dateideas" ? "Date" : tab === "treat" ? "Treat" : "Gifts"}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Tab content — horizontal scroll at bottom */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px 10px", height: 130 }}>

                      {/* Profile */}
                      {profileTab === "profile" && (
                        <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", display: "flex", gap: 8, alignItems: "stretch", height: "100%" } as React.CSSProperties}>
                          <div onClick={e => { e.stopPropagation(); setShowProfileDetail(true); }}
                            style={{ flexShrink: 0, width: 80, borderRadius: 14, background: "rgba(0,0,0,0.65)", border: "1px solid rgba(212,175,55,0.22)", padding: "8px 8px", display: "flex", flexDirection: "column", gap: 4, overflow: "hidden", cursor: "pointer" }}>
                            <p style={{ margin: 0, fontSize: 8, fontWeight: 800, color: "#d4af37", textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>About Me</p>
                            <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.8)", lineHeight: 1.4, overflow: "hidden", flex: 1 }}>{p.bio || "No bio yet 👻"}</p>
                          </div>
                          <div style={{ flexShrink: 0, width: 80, borderRadius: 14, background: "rgba(0,0,0,0.65)", border: "1px solid rgba(212,175,55,0.22)", padding: "8px 8px", display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
                            <p style={{ margin: 0, fontSize: 8, fontWeight: 800, color: "#d4af37", textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>Details</p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 2, overflow: "hidden", flex: 1 }}>
                              {[p.gender, p.religion, p.contactPref, `${p.countryFlag} ${p.country}`].filter(Boolean).map((v, i) => (
                                <span key={i} style={{ fontSize: 7, background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.22)", borderRadius: 20, padding: "2px 5px", color: "#d4af37", fontWeight: 600 }}>{v}</span>
                              ))}
                            </div>
                          </div>
                          {p.interests?.length > 0 && (
                            <div style={{ flexShrink: 0, width: 80, borderRadius: 14, background: "rgba(0,0,0,0.65)", border: "1px solid rgba(212,175,55,0.22)", padding: "8px 8px", display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
                              <p style={{ margin: 0, fontSize: 8, fontWeight: 800, color: "#d4af37", textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0 }}>Interests</p>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 2, overflow: "hidden", flex: 1 }}>{p.interests.slice(0, 5).map((x, i) => <span key={i} style={{ fontSize: 7, background: "rgba(255,255,255,0.07)", borderRadius: 20, padding: "2px 5px", color: "rgba(255,255,255,0.6)" }}>{x}</span>)}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Date */}
                      {profileTab === "dateideas" && (
                        <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", display: "flex", gap: 8, alignItems: "stretch", height: "100%" } as React.CSSProperties}>
                          {[p.firstDateIdea || "Dinner Date","Coffee & Walk","Movie Night","Sunset Drive","Live Music","Cooking Together"].map((idea, i) => (
                            <motion.div key={i} whileTap={{ scale: 0.93 }} onClick={() => setShowDateIdeas(true)}
                              style={{ flexShrink: 0, width: 80, borderRadius: 14, background: "rgba(0,0,0,0.65)", border: "1px solid rgba(212,175,55,0.22)", padding: "8px 8px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer" }}>
                              <span style={{ fontSize: 22 }}>{["🌙","☕","🎬","🌅","🎵","👨‍🍳"][i]||"💡"}</span>
                              <p style={{ margin: 0, fontSize: 8, fontWeight: 700, color: "#fff", textAlign: "center", lineHeight: 1.3 }}>{idea}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Treat */}
                      {profileTab === "treat" && (
                        <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", display: "flex", gap: 8, alignItems: "stretch", height: "100%" } as React.CSSProperties}>
                          {[{emoji:"💆",label:"Massage",sub:"Rp 250k",img:"https://ik.imagekit.io/7grri5v7d/massage%20therapsy.png"},{emoji:"💅",label:"Beautician",sub:"Rp 200k",img:"https://ik.imagekit.io/7grri5v7d/beauty%20woman.png"},{emoji:"💐",label:"Flowers",sub:"Rp 350k",img:"https://ik.imagekit.io/7grri5v7d/flowers%20nice.png"},{emoji:"💎",label:"Jewelry",sub:"Rp 250k",img:"https://ik.imagekit.io/7grri5v7d/jewerlysss.png"},{emoji:"🍷",label:"Wine Night",sub:"Rp 300k",img:"https://ik.imagekit.io/7grri5v7d/flowers%20nice.png"},{emoji:"🎁",label:"Surprise",sub:"Rp 400k",img:"https://ik.imagekit.io/7grri5v7d/jewerlysss.png"}].map((t, i) => (
                            <motion.div key={i} whileTap={{ scale: 0.93 }}
                              style={{ flexShrink: 0, width: 80, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(212,175,55,0.22)", background: "rgba(0,0,0,0.65)", display: "flex", flexDirection: "column" }}>
                              <img src={t.img} alt={t.label} style={{ width: "100%", flex: 1, objectFit: "cover", display: "block", minHeight: 0 }} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                              <div style={{ padding: "5px 7px", flexShrink: 0 }}>
                                <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "#fff" }}>{t.emoji} {t.label}</p>
                                <p style={{ margin: "1px 0 0", fontSize: 7, color: "rgba(212,175,55,0.7)" }}>{t.sub}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Gifts */}
                      {profileTab === "gifts" && (
                        <div className="c-scroll" style={{ overflowX: "auto", scrollbarWidth: "none", display: "flex", gap: 8, alignItems: "stretch", height: "100%" } as React.CSSProperties}>
                          {GIFT_OPTIONS.map((gift, i) => (
                            <motion.div key={i} whileTap={{ scale: 0.93 }}
                              onClick={() => requireAuth(() => { if (coinBalance < gift.coins) { setShowCoinShop(true); return; } handleSendGift(gift.emoji, gift.coins); setShowLikeRain(true); setTimeout(() => setShowLikeRain(false), 2500); })}
                              style={{ flexShrink: 0, width: 80, borderRadius: 14, background: "rgba(0,0,0,0.65)", border: `1px solid ${coinBalance >= gift.coins ? "rgba(212,175,55,0.3)" : "rgba(212,175,55,0.12)"}`, padding: "8px 6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}>
                              <span style={{ fontSize: 24 }}>{gift.emoji}</span>
                              <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "#fff", textAlign: "center" }}>{gift.label}</p>
                              <div style={{ background: "rgba(44,62,102,0.9)", padding: "1px 6px", borderRadius: 20, fontSize: 7, fontWeight: 700, color: coinBalance >= gift.coins ? "#ffd966" : "rgba(255,100,100,0.8)" }}>🪙 {gift.coins}</div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                    </div>
                  </>
                );
              })()
            ) : isBottomPackageView && selectedPackage ? (
              /* ── Package detail view ── */
              <>
                {/* Back button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={e => { e.stopPropagation(); setIsBottomPackageView(false); setSelectedPackage(null); }}
                  style={{
                    position: "absolute", top: 10, left: 10, zIndex: 20,
                    width: 32, height: 32, borderRadius: "50%", border: "none",
                    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
                    color: "#fff", fontSize: 14, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    touchAction: "manipulation",
                  }}
                >←</motion.button>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "16px 16px 16px 16px", gap: 6 }}>
                  <div style={{ fontSize: 42, lineHeight: 1 }}>{selectedPackage.emoji}</div>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#fff" }}>{selectedPackage.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{selectedPackage.sub}</p>
                  <div style={{ background: "rgba(44,62,102,0.9)", padding: "3px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "#ffd966", marginTop: 2 }}>
                    💰 {selectedPackage.coins > 0 ? `${selectedPackage.coins} coins` : "Free"}
                  </div>
                  {selectedPackage.locked ? (
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,100,100,0.8)", textAlign: "center" }}>
                      Need {selectedPackage.coins - coinBalance} more coins
                    </p>
                  ) : null}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={e => { e.stopPropagation(); navigate(selectedPackage.path); }}
                    style={{
                      marginTop: 6, padding: "7px 24px", borderRadius: 40, border: "none",
                      background: selectedPackage.locked ? "rgba(255,255,255,0.1)" : "#3b4bff",
                      color: selectedPackage.locked ? "rgba(255,255,255,0.4)" : "#fff",
                      fontSize: 12, fontWeight: 800, cursor: "pointer", touchAction: "manipulation",
                      boxShadow: selectedPackage.locked ? "none" : "0 4px 14px rgba(59,75,255,0.45)",
                    }}
                  >
                    {selectedPackage.locked ? "🔒 Get More Coins" : "Purchase →"}
                  </motion.button>
                </div>
              </>
            ) : profiles.length > 0 ? (
              /* ── Normal profile view ── */
              (() => {
                const profile = profiles[bottomCardIdx % profiles.length];
                const online = isOnline(profile.last_seen_at);
                const isLiked = likedIds.has(profile.id);
                // Persona logic — mirrors GhostCard
                function _bHash(id: string): number { let h = 0; for (let i = 0; i < id.length; i++) h = Math.imul(37, h) + id.charCodeAt(i) | 0; return Math.abs(h); }
                const _bVerified = profile.isVerified || profile.faceVerified || profile.badge === "Verified";
                const _bMaleUnver = !_bVerified && profile.gender !== "Female";
                const _bChef   = _bMaleUnver && (_bHash(profile.id + "persona") % 2 === 0);
                const _bGames  = _bMaleUnver && !_bChef;
                const _bJoker  = !_bVerified && profile.gender === "Female" && shouldShowJoker(profile.id, readCoins());
                const _bMaid   = !_bVerified && profile.gender === "Female" && !_bJoker;
                const B_JOKER = "https://ik.imagekit.io/7grri5v7d/Untitleddsfsdfsdf.png";
                const B_CHEF  = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasd.png";
                const B_MAID  = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasddsds.png";
                const B_GAMES = "https://ik.imagekit.io/7grri5v7d/jjjhfghfgsdasdasdsfasdfasdasddsdssdfs.png?updatedAt=1774487538945";
                const bCardImg = _bVerified ? profile.image
                  : _bJoker ? B_JOKER : _bChef ? B_CHEF
                  : _bMaid  ? B_MAID  : _bGames ? B_GAMES : profile.image;
                const bFrame = _bChef  ? "rgba(249,115,22,0.7)"
                  : _bGames ? "rgba(34,211,238,0.7)"
                  : _bMaid  ? "rgba(192,132,252,0.7)"
                  : _bJoker ? "rgba(236,72,153,0.7)" : null;
                return (<>
                  {/* Full-bleed image */}
                  <img
                    src={bCardImg} alt=""
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block", cursor: bFrame ? "pointer" : "inherit" }}
                    onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    onClick={bFrame ? (e => { e.stopPropagation(); if (_bJoker) setShowJokerSheet(true); else if (_bChef) setShowChefSheet(true); else if (_bMaid) setShowMaidSheet(true); else if (_bGames) setShowGamesSheet(true); }) : undefined}
                  />
                  {/* Persona glow border */}
                  {bFrame && <div style={{ position: "absolute", inset: 0, borderRadius: 28, border: `2px solid ${bFrame}`, pointerEvents: "none", zIndex: 5 }} />}
                  {/* Gradient overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 38%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.5) 100%)" }} />

                  {/* Distance badge — top-left */}
                  <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                    📍 {profile.distanceKm !== undefined ? `${profile.distanceKm < 1 ? "<1" : Math.round(profile.distanceKm)} km` : "Nearby"}
                  </div>

                  {/* Info overlay — bottom-left */}
                  <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", flexDirection: "column", gap: 3, zIndex: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: bFrame ? "#d4af37" : "#fff", lineHeight: 1 }}>
                        {_bChef ? "👨‍🍳 Chef Armand" : _bGames ? "🎮 Games Boy" : _bMaid ? "🧹 Maid Eloise" : _bJoker ? "🃏 The Joker" : toGhostId(profile.id)}
                      </p>
                      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.4, repeat: Infinity }}
                        style={{ width: 8, height: 8, borderRadius: "50%", background: online ? "#22c55e" : "#f59e0b", boxShadow: online ? "0 0 6px rgba(34,197,94,0.9)" : "0 0 6px rgba(245,158,11,0.9)", flexShrink: 0 }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {profile.isVerified && <span style={{ fontSize: 13, lineHeight: 1 }}>✅</span>}
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{profile.age}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>{profile.city.split(",")[0]}</p>
                  </div>

                  {/* Heart button — bottom-right */}
                  <motion.button
                    whileTap={{ scale: 0.84 }}
                    onClick={e => { e.stopPropagation(); handleLike(profile); }}
                    style={{
                      position: "absolute", bottom: 14, right: 14,
                      width: 44, height: 44, borderRadius: "50%",
                      border: "1.5px solid rgba(255,255,255,0.22)",
                      background: "rgba(0,0,0,0.45)",
                      backdropFilter: "blur(8px)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", touchAction: "manipulation", fontSize: 21,
                      transition: "none",
                    }}
                  >
                    {isLiked ? "❤️" : "🤍"}
                  </motion.button>

                  {/* Fingerprint button — bottom-right (next profile) */}
                  <motion.button
                    whileTap={{ scale: 0.84 }}
                    onClick={e => {
                      e.stopPropagation();
                      setBottomCardDir("left");
                      setBottomCardIdx(cur => {
                        const n = profiles.length;
                        if (n <= 1) return cur;
                        let next = (cur + 1) % n;
                        if (next === topCardIdx) next = (next + 1) % n;
                        return next;
                      });
                    }}
                    style={{
                      position: "absolute", top: 14, right: 14,
                      width: 48, height: 48, borderRadius: "50%",
                      border: "1.5px solid rgba(255,255,255,0.22)",
                      background: "rgba(0,0,0,0.55)",
                      backdropFilter: "blur(8px)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", touchAction: "manipulation",
                    }}
                  >
                    <Fingerprint size={24} color="rgba(255,255,255,0.75)" />
                  </motion.button>

                  {/* Swipe hint */}
                  <div style={{ position: "absolute", top: 14, left: 14, fontSize: 9, color: "rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.38)", padding: "2px 8px", borderRadius: 20 }}>
                    ↔ swipe · ↑ profile
                  </div>
                </>);
              })()
            ) : null}
          </motion.div>

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

      {/* Profile detail overlay — opened from About Me container */}
      <AnimatePresence>
        {showProfileDetail && ghostProfileView && (
          <GhostProfileDetailOverlay
            profile={ghostProfileView}
            onClose={() => setShowProfileDetail(false)}
          />
        )}
      </AnimatePresence>

      {/* Joker sheet — opened from Joker card in profile tab */}
      <AnimatePresence>
        {showJokerSheet && (
          <JokerInviteSheet onClose={() => setShowJokerSheet(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChefSheet && (
          <BreakfastChefInviteSheet onClose={() => setShowChefSheet(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMaidSheet && (
          <MaidUpgradeSheet onClose={() => setShowMaidSheet(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGamesSheet && (
          <GamesRoomInviteSheet onClose={() => setShowGamesSheet(false)} />
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
