import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { GhostProfile, GhostMatch, InboundLike } from "../types/ghostTypes";
import { DEMO_INBOUND } from "../types/ghostTypes";
import { loadMatches, persistMatches, isFlashProfile } from "../utils/ghostHelpers";
import { isCitySupported } from "../data/butlerProviders";
import { markLateNightShown } from "../components/LateNightButlerPopup";
import { markButlerGreeted } from "../components/ButlerWelcomePopup";
import { markCheckoutShown } from "../components/CheckoutReminderPopup";
import { saveInvite } from "../components/GhostViewedMeSheet";
import { hasActiveWindowMode } from "../utils/featureGating";
import type { AcceptedMember } from "../components/FloorInviteSheet";
import { getAcceptedFloorMembers } from "../components/FloorInviteSheet";
import type { MatchActionContext } from "../components/MatchActionPopup";
import type { SettingsAction } from "../components/GhostSettingsDrawer";
import type { ButlerMessage, ButlerMessageKey } from "../components/GhostButlerMessage";
import { BUTLER_MESSAGES } from "../components/GhostButlerMessage";
import type { GameInvite } from "../utils/gameInviteService";
import { respondToInvite } from "../utils/gameInviteService";

import GameInvitePopup from "../components/GameInvitePopup";
import MatchActionPopup from "../components/MatchActionPopup";
import GhostLeaderboardSheet from "../components/GhostLeaderboardSheet";
import GhostTonightSheet from "../components/GhostTonightSheet";
import TonightGiftSheet from "../components/TonightGiftSheet";
import GhostLobbyWelcomePopup from "../components/GhostLobbyWelcomePopup";
import GhostCoinShop from "../components/GhostCoinShop";
import GhostMatchPopup from "../components/GhostMatchPopup";
import GhostIcebreakerPopup from "../components/GhostIcebreakerPopup";
import GhostButlerSheet from "../components/GhostButlerSheet";
import GhostButlerConnectPrompt from "../components/GhostButlerConnectPrompt";
import GhostButlerUnavailablePopup from "../components/GhostButlerUnavailablePopup";
import MatchPaywallModal from "../components/MatchPaywallModal";
import ConnectNowPopup from "../components/ConnectNowPopup";
import { GhostFlashMatchPopup } from "../components/GhostFlashSection";
import GhostNewGuestsPopup from "../components/GhostNewGuestsPopup";
import GhostHouseModal from "../components/GhostHouseModal";
import InboundLikePopup from "../components/InboundLikePopup";
import GhostSettingsDrawer from "../components/GhostSettingsDrawer";
import GhostFlagSheet from "../components/GhostFlagSheet";
import GhostSecurityPopup from "../components/GhostSecurityPopup";
import HouseRulesModal from "../components/HouseRulesModal";
import InternationalGhostModal from "../components/CountryTabBar";
import HotelEventsBoard from "../components/HotelEventsBoard";
import GhostStatsDashboard from "../components/GhostStatsDashboard";
import GhostReferralSheet from "../components/GhostReferralSheet";
import FloorInviteSheet, { FloorNudgeSheet } from "../components/FloorInviteSheet";
import GhostScoreSheet from "../components/GhostScoreSheet";
import GhostClockSheet from "../components/GhostClockSheet";
import FloorWarsBoard from "../components/FloorWarsBoard";
import WhisperSheet from "../components/WhisperSheet";
import GhostConciergeSheet from "../components/GhostConciergeSheet";
import SeancePopup from "../components/SeancePopup";
import MrButlasStaffPopup from "../components/MrButlasStaffPopup";
import VideoIntroPlayer from "../components/VideoIntroPlayer";
import VideoIntroUploader from "../components/VideoIntroUploader";
import GhostViewedMeSheet from "../components/GhostViewedMeSheet";
import GhostLobbySheet from "../components/GhostLobbySheet";
import LateNightButlerPopup from "../components/LateNightButlerPopup";
import ButlerWelcomePopup from "../components/ButlerWelcomePopup";
import CheckoutReminderPopup from "../components/CheckoutReminderPopup";
import FloorChatPopup from "../components/FloorChatPopup";
import GhostFlashPaywallSheet from "../components/GhostFlashPaywallSheet";
import DevPopupLauncher from "@/shared/components/DevPopupLauncher";
import GhostButlerMessage from "../components/GhostButlerMessage";
import { ProfileWhisperModal } from "../components/GhostCard";
import GhostDevPanel from "../components/GhostDevPanel";
import ButlerBroadcastPopup from "../components/ButlerBroadcastPopup";
import { useButlerInbox } from "../hooks/useButlerInbox";

const SHIELD_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdfsdsdsddsdf.png";

// ── Dev Panel alias ───────────────────────────────────────────────────────────
function DevPanel(props: Parameters<typeof GhostDevPanel>[0]) {
  return <GhostDevPanel {...props} />;
}

export interface GhostModePopupsProps {
  // Game invite
  pendingGameInvite: GameInvite | null;
  setPendingGameInvite: (v: GameInvite | null) => void;

  // Match action
  matchActionProfile: GhostProfile | null;
  setMatchActionProfile: (v: GhostProfile | null) => void;
  matchActionContext: MatchActionContext;
  coinBalance: number;
  handleMatchConnect: (p: GhostProfile) => void;
  handleLikeBack: (p: GhostProfile) => void;
  handleSendGift: (emoji: string, coins: number) => void;
  handlePass: (profileId: string) => void;
  setShowCoinShop: (v: boolean) => void;

  // Leaderboard
  showLeaderboard: boolean;
  setShowLeaderboard: (v: boolean) => void;
  allProfiles: GhostProfile[];
  userCity: string;
  homeFlag: string;
  likedIds: Set<string>;
  handleLike: (p: GhostProfile) => void;
  setSelectedProfile: (p: GhostProfile | null) => void;

  // Tonight sheet
  showTonightSheet: boolean;
  setShowTonightSheet: (v: boolean) => void;
  lobbyList: GhostProfile[];

  // Tonight gift
  tonightGiftProfile: GhostProfile | null;
  setTonightGiftProfile: (v: GhostProfile | null) => void;
  saveMatch: (p: GhostProfile) => void;
  setFlashMatchProfile: (v: GhostProfile | null) => void;

  // Lobby welcome
  showLobbyWelcome: boolean;
  setShowLobbyWelcome: (v: boolean) => void;
  startTabRevert: () => void;

  // Coin shop
  showCoinShop: boolean;
  updateCoins: (n: number) => void;

  // Match popup
  matchProfile: GhostProfile | null;
  setMatchProfile: (v: GhostProfile | null) => void;
  isGhost: boolean;
  setIcebreakerProfile: (v: GhostProfile | null) => void;
  setButlerMatchName: (v: string | undefined) => void;
  setShowButler: (v: boolean) => void;
  setShowButlerUnavailable: (v: boolean) => void;
  isFemale: boolean;
  handleFoundBoo: (p: GhostProfile) => void;
  setConnectNowProfile: (v: GhostProfile | null) => void;
  setMatchPaywallProfile: (v: GhostProfile | null) => void;

  // Icebreaker
  icebreakerProfile: GhostProfile | null;

  // Butler sheet
  showButler: boolean;
  butlerMatchName: string | undefined;

  // Butler connect prompt
  butlerConnectProfile: GhostProfile | null;
  setButlerConnectProfile: (v: GhostProfile | null) => void;

  // Butler unavailable
  showButlerUnavailable: boolean;

  // Match paywall
  matchPaywallProfile: GhostProfile | null;
  activate: (plan: "ghost" | "bundle") => void;

  // Connect now
  connectNowProfile: GhostProfile | null;
  savedMatches: GhostMatch[];
  connectedMatchIds: Set<string>;
  setConnectedMatchIds: (v: Set<string>) => void;

  // Flash match
  flashMatchProfile: GhostProfile | null;
  flashConnectedIds: Set<string>;
  setFlashConnectedIds: (v: Set<string>) => void;

  // Flash limit toast
  showFlashLimitToast: boolean;
  FLASH_CONTACT_LIMIT: number;

  // New guests
  showNewGuests: boolean;
  setShowNewGuests: (v: boolean) => void;
  newGuestProfiles: GhostProfile[];
  setLobbyMode: (v: boolean) => void;

  // Blocked alert
  showBlockedAlert: boolean;
  setShowBlockedAlert: (v: boolean) => void;
  a: {
    accent: string;
    accentDark: string;
    glow: (o: number) => string;
    glowMid: (o: number) => string;
    gradient: string;
  };

  // House modal
  showHouseModal: boolean;
  setShowHouseModal: (v: boolean) => void;
  houseTier: "gold" | "suite" | null;
  handleHousePurchase: (tier: "gold" | "suite") => void;

  // Inbound like
  inboundLike: InboundLike | null;
  setInboundLike: (v: InboundLike | null) => void;

  // Settings drawer
  showSettingsSheet: boolean;
  setShowSettingsSheet: (v: boolean) => void;
  handleSettingsAction: (action: SettingsAction) => void;
  loungeGuestCount: number;
  loungeEnabled: boolean;
  handleToggleLounge: () => void;
  casinoEnabled: boolean;
  handleToggleCasino: () => void;

  // Breakfast picker
  showBreakfastPicker: boolean;
  setShowBreakfastPicker: (v: boolean) => void;
  LOUNGE_COUNTRIES: ReadonlyArray<{ name: string; flag: string; utcOffset: number; poolCount: number }>;

  // Flag sheet
  flagSheet: { profileId: string; ghostId: string } | null;
  setFlagSheet: (v: { profileId: string; ghostId: string } | null) => void;
  handleFlag: (profileId: string, reason: string) => void;

  // Security popup
  showSecurityPopup: boolean;
  setShowSecurityPopup: (v: boolean) => void;
  setShowHouseRules: (v: boolean) => void;

  // House rules
  showHouseRules: boolean;
  handleHouseRulesAccept: () => void;

  // Intl modal
  showIntlModal: boolean;
  setShowIntlModal: (v: boolean) => void;
  homeCountryCode: string;
  setIntlCountries: (v: string[]) => void;
  setIsIntlGhost: (v: boolean) => void;

  // Events
  showEvents: boolean;
  setShowEvents: (v: boolean) => void;

  // Stats
  showStats: boolean;
  setShowStats: (v: boolean) => void;

  // Referral
  showReferral: boolean;
  setShowReferral: (v: boolean) => void;

  // Floor invite
  showFloorInvite: boolean;
  setShowFloorInvite: (v: boolean) => void;
  floorInviteProfile: GhostProfile | null;
  floorInviteTarget: string;
  floorInviteMode: "invite" | "request";
  setInvitedMembers: (v: AcceptedMember[]) => void;

  // Nudge
  nudgeProfile: AcceptedMember | null;
  setNudgeProfile: (v: AcceptedMember | null) => void;

  // Ghost score
  showGhostScore: boolean;
  setShowGhostScore: (v: boolean) => void;
  scoreProfile: GhostProfile | null;
  setScoreProfile: (v: GhostProfile | null) => void;

  // Ghost clock
  showGhostClock: boolean;
  setShowGhostClock: (v: boolean) => void;
  setWindowActive: (v: boolean) => void;

  // Floor wars
  showFloorWars: boolean;
  setShowFloorWars: (v: boolean) => void;

  // Whisper
  showWhisper: boolean;
  setShowWhisper: (v: boolean) => void;
  whisperProfile: GhostProfile | null;
  setWhisperProfile: (v: GhostProfile | null) => void;
  setSavedMatches: React.Dispatch<React.SetStateAction<GhostMatch[]>>;

  // Concierge
  showConcierge: boolean;
  setShowConcierge: (v: boolean) => void;
  conciergeProfile: GhostProfile | null;
  setConciergeProfile: (v: GhostProfile | null) => void;
  conciergeMatchId: string;
  conciergeDays: number;

  // Seance
  showSeance: boolean;
  setShowSeance: (v: boolean) => void;
  seanceProfile: GhostProfile | null;
  setSeanceProfile: (v: GhostProfile | null) => void;

  // Staff popup
  staffPopupProfile: GhostProfile | null;
  setStaffPopupProfile: (v: GhostProfile | null) => void;

  // Video player
  showVideoPlayer: boolean;
  setShowVideoPlayer: (v: boolean) => void;
  videoProfile: GhostProfile | null;
  setVideoProfile: (v: GhostProfile | null) => void;

  // Video upload
  showVideoUpload: boolean;
  setShowVideoUpload: (v: boolean) => void;

  // Viewed me
  showViewedMe: boolean;
  setShowViewedMe: (v: boolean) => void;
  viewedMeList: Array<GhostProfile & { viewCount: number }>;
  myProfileId: string | null;
  userRoomTier: "standard" | "suite" | "kings" | "penthouse" | "cellar" | "garden" | null;
  openMatchAction: (p: GhostProfile, ctx: MatchActionContext) => void;
  setFloorInviteProfile: (v: GhostProfile | null) => void;
  setFloorInviteMode: (v: "invite" | "request") => void;
  setFloorInviteTarget: (v: string) => void;
  setPendingChatInviteProfileId: (v: string | null) => void;
  setButlerMessage: (v: ButlerMessage | null) => void;

  // Lobby popup
  showLobbyPopup: boolean;
  setShowLobbyPopup: (v: boolean) => void;
  roomMemberList: GhostProfile[];

  // Late night butler
  showLateNight: boolean;
  setShowLateNight: (v: boolean) => void;

  // Butler welcome
  showButlerWelcome: boolean;
  setShowButlerWelcome: (v: boolean) => void;

  // Checkout
  showCheckout: boolean;
  setShowCheckout: (v: boolean) => void;

  // Floor chat
  showFloorChat: boolean;
  setShowFloorChat: (v: boolean) => void;
  floorChatTier: "standard" | "suite" | "kings" | "penthouse" | "cellar" | "garden" | null;
  setFloorChatTier: (v: "standard" | "suite" | "kings" | "penthouse" | "cellar" | "garden" | null) => void;
  tierColor: string;
  tierLabel: string;
  tierIcon: string;

  // Flash paywall
  showFlashPaywall: boolean;
  setShowFlashPaywall: (v: boolean) => void;
  enterFlash: () => void;

  // Dev panel
  isTonightMode: boolean;
  toggleTonight: () => void;
  isFlashActive: boolean;
  exitFlash: () => void;
  setHouseTier: (v: "gold" | "suite" | null) => void;
  deactivate: () => void;
  profiles: GhostProfile[];

  // Expanded liked profile
  expandedLikedProfile: GhostProfile | null;
  setExpandedLikedProfile: (v: GhostProfile | null) => void;

  // Butler message
  butlerMessage: ButlerMessage | null;
  pendingChatInviteProfileId: string | null;

  // Hearts cascade
  showLikeRain: boolean;
  likeRainHearts: Array<{ id: number; x: number; delay: number; size: number; duration: number }>;
}

export default function GhostModePopups({
  pendingGameInvite,
  setPendingGameInvite,
  matchActionProfile,
  setMatchActionProfile,
  matchActionContext,
  coinBalance,
  handleMatchConnect,
  handleLikeBack,
  handleSendGift,
  handlePass,
  setShowCoinShop,
  showLeaderboard,
  setShowLeaderboard,
  allProfiles,
  userCity,
  homeFlag,
  likedIds,
  handleLike,
  setSelectedProfile,
  showTonightSheet,
  setShowTonightSheet,
  lobbyList,
  tonightGiftProfile,
  setTonightGiftProfile,
  saveMatch,
  setFlashMatchProfile,
  showLobbyWelcome,
  setShowLobbyWelcome,
  startTabRevert,
  showCoinShop,
  updateCoins,
  matchProfile,
  setMatchProfile,
  isGhost,
  setIcebreakerProfile,
  setButlerMatchName,
  setShowButler,
  setShowButlerUnavailable,
  isFemale,
  setButlerConnectProfile,
  handleFoundBoo,
  setConnectNowProfile,
  setMatchPaywallProfile,
  icebreakerProfile,
  showButler,
  butlerMatchName,
  butlerConnectProfile,
  showButlerUnavailable,
  matchPaywallProfile,
  activate,
  connectNowProfile,
  savedMatches,
  connectedMatchIds,
  setConnectedMatchIds,
  flashMatchProfile,
  flashConnectedIds,
  setFlashConnectedIds,
  showFlashLimitToast,
  FLASH_CONTACT_LIMIT,
  showNewGuests,
  setShowNewGuests,
  newGuestProfiles,
  setLobbyMode,
  showBlockedAlert,
  setShowBlockedAlert,
  a,
  showHouseModal,
  setShowHouseModal,
  houseTier,
  handleHousePurchase,
  inboundLike,
  setInboundLike,
  showSettingsSheet,
  setShowSettingsSheet,
  handleSettingsAction,
  loungeGuestCount,
  loungeEnabled,
  handleToggleLounge,
  casinoEnabled,
  handleToggleCasino,
  showBreakfastPicker,
  setShowBreakfastPicker,
  LOUNGE_COUNTRIES,
  flagSheet,
  setFlagSheet,
  handleFlag,
  showSecurityPopup,
  setShowSecurityPopup,
  setShowHouseRules,
  showHouseRules,
  handleHouseRulesAccept,
  showIntlModal,
  setShowIntlModal,
  homeCountryCode,
  setIntlCountries,
  setIsIntlGhost,
  showEvents,
  setShowEvents,
  showStats,
  setShowStats,
  showReferral,
  setShowReferral,
  showFloorInvite,
  setShowFloorInvite,
  floorInviteProfile,
  floorInviteTarget,
  floorInviteMode,
  setInvitedMembers,
  nudgeProfile,
  setNudgeProfile,
  showGhostScore,
  setShowGhostScore,
  scoreProfile,
  setScoreProfile,
  showGhostClock,
  setShowGhostClock,
  setWindowActive,
  showFloorWars,
  setShowFloorWars,
  showWhisper,
  setShowWhisper,
  whisperProfile,
  setWhisperProfile,
  setSavedMatches,
  showConcierge,
  setShowConcierge,
  conciergeProfile,
  setConciergeProfile,
  conciergeMatchId,
  conciergeDays,
  showSeance,
  setShowSeance,
  seanceProfile,
  setSeanceProfile,
  staffPopupProfile,
  setStaffPopupProfile,
  showVideoPlayer,
  setShowVideoPlayer,
  videoProfile,
  setVideoProfile,
  showVideoUpload,
  setShowVideoUpload,
  showViewedMe,
  setShowViewedMe,
  viewedMeList,
  myProfileId,
  userRoomTier,
  openMatchAction,
  setFloorInviteProfile,
  setFloorInviteMode,
  setFloorInviteTarget,
  setPendingChatInviteProfileId,
  setButlerMessage,
  showLobbyPopup,
  setShowLobbyPopup,
  roomMemberList,
  showLateNight,
  setShowLateNight,
  showButlerWelcome,
  setShowButlerWelcome,
  showCheckout,
  setShowCheckout,
  showFloorChat,
  setShowFloorChat,
  floorChatTier,
  setFloorChatTier,
  tierColor,
  tierLabel,
  tierIcon,
  showFlashPaywall,
  setShowFlashPaywall,
  enterFlash,
  isTonightMode,
  toggleTonight,
  isFlashActive,
  exitFlash,
  setHouseTier,
  deactivate,
  profiles,
  expandedLikedProfile,
  setExpandedLikedProfile,
  butlerMessage,
  pendingChatInviteProfileId,
  showLikeRain,
  likeRainHearts,
}: GhostModePopupsProps) {
  const navigate = useNavigate();

  // ── Admin butler inbox ─────────────────────────────────────────────────────
  const { broadcast, dmMessages, dismissBroadcast } = useButlerInbox();

  // DM notification: show the most recent unread DM as a butler message nudge
  const [shownDmIds, setShownDmIds] = React.useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("butler_dm_shown") || "[]")); } catch { return new Set(); }
  });
  const pendingDm = dmMessages.find((m) => !shownDmIds.has(m.id)) ?? null;
  const [dmPopupOpen, setDmPopupOpen] = React.useState(false);

  React.useEffect(() => {
    if (pendingDm) setDmPopupOpen(true);
  }, [pendingDm?.id]);

  const dismissDm = () => {
    if (!pendingDm) return;
    const next = new Set(shownDmIds);
    next.add(pendingDm.id);
    setShownDmIds(next);
    try { localStorage.setItem("butler_dm_shown", JSON.stringify([...next].slice(-50))); } catch {}
    setDmPopupOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {pendingGameInvite && (
          <GameInvitePopup
            invite={pendingGameInvite}
            onAccept={async () => {
              await respondToInvite(pendingGameInvite.id, "accepted");
              setPendingGameInvite(null);
              navigate("/games/connect4");
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

      {/* ── Tonight Gift Sheet ── */}
      <AnimatePresence>
        {tonightGiftProfile && (
          <TonightGiftSheet
            profile={tonightGiftProfile}
            onClose={() => setTonightGiftProfile(null)}
            onLike={(p) => handleLike(p)}
            onConnect={(p) => { setTonightGiftProfile(null); saveMatch(p); setFlashMatchProfile(p); }}
          />
        )}
      </AnimatePresence>

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
        casinoEnabled={casinoEnabled}
        onToggleCasino={handleToggleCasino}
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
                    const isOnlineLoc = localH >= 7 && localH < 23;
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
                          navigate("/breakfast-lounge");
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
                            color: isBreakfast ? "#d4af37" : isOnlineLoc ? "#22c55e" : "rgba(255,255,255,0.3)",
                            background: isBreakfast ? "rgba(212,175,55,0.1)" : isOnlineLoc ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${isBreakfast ? "rgba(212,175,55,0.3)" : isOnlineLoc ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 6, padding: "2px 7px",
                          }}>
                            {isBreakfast ? "🍳 Breakfast" : isOnlineLoc ? "Active" : "Quiet"}
                          </span>
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{isOnlineLoc ? c.poolCount : 0} guests</span>
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
            onSuccess={(_member) => {
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
                  const currentMatches = loadMatches();
                  const newMatch = { id: profile.id, profile, matchedAt: Date.now() };
                  persistMatches([...currentMatches.filter(m => m.id !== profile.id), newMatch]);
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

      {/* ── Mr. Butlas — Staff profile popup ── */}
      <AnimatePresence>
        {staffPopupProfile && (
          <MrButlasStaffPopup
            profile={staffPopupProfile}
            onClose={() => setStaffPopupProfile(null)}
          />
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

      </AnimatePresence>

      {/* ── Checkout reminder ── */}
      <AnimatePresence>
        {showCheckout && (
          <CheckoutReminderPopup
            onExtend={() => {
              markCheckoutShown();
              setShowCheckout(false);
              navigate("/rooms");
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
        onCreateProfile={() => { setButlerMessage(null); navigate("/setup"); }}
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

      {/* ── Admin Mr. Butlas DM (personal message to this user) ── */}
      <AnimatePresence>
        {dmPopupOpen && pendingDm && (
          <ButlerBroadcastPopup
            message={pendingDm.message}
            onDismiss={dismissDm}
          />
        )}
      </AnimatePresence>

      {/* ── Admin Mr. Butlas Broadcast (live popup for ALL users) ── */}
      <AnimatePresence>
        {!dmPopupOpen && broadcast && (
          <ButlerBroadcastPopup
            message={broadcast.message}
            onDismiss={dismissBroadcast}
          />
        )}
      </AnimatePresence>
    </>
  );
}
