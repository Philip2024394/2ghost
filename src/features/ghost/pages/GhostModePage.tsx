import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Moon, Settings, Check, Gift, SlidersHorizontal, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { useGhostMode } from "../hooks/useGhostMode";
import { generateIndonesianProfiles } from "@/data/indonesianProfiles";
import GhostInstallBanner from "../components/GhostInstallBanner";
import { detectIpCountry, getCachedIpCountry, getCountryProximity, type IpCountryResult } from "@/shared/hooks/useIpCountry";

// Types & constants
import type { GhostProfile, GhostMatch, InboundLike, GenderFilter, KmFilter } from "../types/ghostTypes";
import { MATCH_EXPIRY_MS, SEA_COUNTRY_LIST, FLAG_TO_CODE, INTL_PROFILES, DEMO_INBOUND } from "../types/ghostTypes";

// Helpers
import {
  loadMatches, persistMatches, matchCountdown, activeHoursAgo,
  profileHouseTier, tonightMidnight, isProfileTonight, isFlashProfile,
  getFlaggedProfiles, saveFlaggedProfiles, hasIntlGhost, getIntlCountries,
  haversineKm, profileIsVerified, toGhostId,
} from "../utils/ghostHelpers";

// Components
import GhostParticles from "../components/GhostParticles";
import FilterBar from "../components/FilterBar";
import GhostProfilePopup from "../components/GhostProfilePopup";
import GhostMatchPopup from "../components/GhostMatchPopup";
import ConnectNowPopup from "../components/ConnectNowPopup";
import InboundLikePopup from "../components/InboundLikePopup";
import GhostCard from "../components/GhostCard";
import MatchPaywallModal from "../components/MatchPaywallModal";
import GhostHouseModal from "../components/GhostHouseModal";
import GhostFlashSection, { GhostFlashMatchPopup } from "../components/GhostFlashSection";
import GhostPulseRow from "../components/GhostPulseRow";
import FoundBooBanner from "../components/FoundBooBanner";
import { CountryTabBar } from "../components/CountryTabBar";
import InternationalGhostModal from "../components/CountryTabBar";
import GhostNewGuestsPopup from "../components/GhostNewGuestsPopup";
import GhostIcebreakerPopup from "../components/GhostIcebreakerPopup";
import GhostButlerSheet from "../components/GhostButlerSheet";
import { isCitySupported } from "../data/butlerProviders";

const SHIELD_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdfsdsdsddsdf.png";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdf.png";

const HOUSE_RULES = [
  { icon: "🤝", title: "Respect Every Ghost", desc: "No harassment, hate, or disrespect. Every person here deserves dignity — no exceptions." },
  { icon: "🔒", title: "Privacy is Sacred", desc: "Never share another member's identity, photos, or location outside the House." },
  { icon: "🚫", title: "No Bad Energy", desc: "No spam, scams, or fake profiles. Genuine connections only — the House self-cleanses." },
  { icon: "👻", title: "Stay Anonymous Until Ready", desc: "Your Ghost ID protects you. Only reveal yourself when you're truly comfortable." },
  { icon: "💚", title: "Good Vibes Only", desc: "Bring curiosity, openness, and warmth. The energy you put in is the energy you get back." },
];

const HOW_IT_WORKS = [
  { icon: "❤️", title: "Like for Free", desc: "Browse every profile and like as many as you want — completely free, no subscription needed." },
  { icon: "✨", title: "Ghost Match", desc: "When two ghosts like each other it becomes a mutual match. You'll get notified instantly." },
  { icon: "📱", title: "Connect on Match", desc: "After a mutual match, pay once to unlock their real contact — WhatsApp, Telegram, or any app they use." },
  { icon: "🚪", title: "Ghost Vault", desc: "Your private vault. All your matches live here with a 48-hour countdown. Don't let them fade." },
  { icon: "🌍", title: "Global House", desc: "Members from Indonesia 🇮🇩 Philippines 🇵🇭 Thailand 🇹🇭 Singapore 🇸🇬 Malaysia 🇲🇾 Vietnam 🇻🇳 and beyond." },
  { icon: "👁️", title: "You're Invisible", desc: "Others only see your Ghost ID, photo, age, and city — nothing else — until you both connect." },
];

const PREVIEW_AVATARS = Array.from({ length: 8 }, (_, i) => `https://i.pravatar.cc/80?img=${i + 1}`);

// ── Dev Panel ────────────────────────────────────────────────────────────────
function DevPanel({
  isTonightMode, toggleTonight,
  isFlashActive, enterFlash, exitFlash,
  houseTier, setHouseTier,
  activate, deactivate,
  onTriggerFlashMatch, onTriggerMatch, onTriggerInbound,
}: {
  isTonightMode: boolean; toggleTonight: () => void;
  isFlashActive: boolean; enterFlash: () => void; exitFlash: () => void;
  houseTier: "gold" | "suite" | null; setHouseTier: (t: "gold" | "suite" | null) => void;
  activate: (p: "ghost" | "bundle") => void; deactivate: () => void;
  onTriggerFlashMatch: () => void; onTriggerMatch: () => void; onTriggerInbound: () => void;
}) {
  const [open, setOpen] = useState(false);

  const DEMO_PROFILE = {
    photo: "https://i.pravatar.cc/400?img=33",
    name: "Dev Admin", age: 28, city: "Yogyakarta", country: "Indonesia",
    countryFlag: "🇮🇩", countryCode: "ID", gender: "Male",
    vibe: { key: "tonight", icon: "🌙", label: "Tonight" },
    outcome: { key: "casual", icon: "🤝", label: "Casual Connection", tag: "Casual" },
  };

  const setGender = (g: "Male" | "Female") => {
    try {
      localStorage.setItem("ghost_gender", g);
      localStorage.setItem("ghost_phone", "+628123456789");
      const profile = { ...DEMO_PROFILE, gender: g, name: g === "Female" ? "Devi Admin" : "Dev Admin" };
      localStorage.setItem("ghost_profile", JSON.stringify(profile));
    } catch {}
  };

  const grantAccess = (plan: "ghost" | "bundle") => {
    const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem("ghost_mode_until", String(until));
      localStorage.setItem("ghost_mode_plan", plan);
      localStorage.setItem("ghost_phone", "+628123456789");
      if (!localStorage.getItem("ghost_profile")) {
        localStorage.setItem("ghost_profile", JSON.stringify(DEMO_PROFILE));
      }
    } catch {}
    activate(plan);
  };

  const setHouseAndPersist = (tier: "gold" | "suite" | null) => {
    try {
      if (tier) localStorage.setItem("ghost_house_tier", tier);
      else localStorage.removeItem("ghost_house_tier");
    } catch {}
    setHouseTier(tier);
  };

  const unlockAll = () => {
    try {
      // Full ghost plan
      const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem("ghost_mode_until", String(until));
      localStorage.setItem("ghost_mode_plan", "bundle");
      localStorage.setItem("ghost_phone", "+628123456789");
      // Full profile — Yogyakarta city so real Butler providers show, face verified
      const fullProfile = { ...DEMO_PROFILE, gender: "Male", id: "dev00000-0000-0000-0000-000000000001", faceVerified: true, city: "Yogyakarta", country: "Indonesia", countryFlag: "🇮🇩" };
      localStorage.setItem("ghost_profile", JSON.stringify(fullProfile));
      localStorage.setItem("ghost_gender", "Male");
      // Face verified
      localStorage.setItem("ghost_face_verified", "1");
      // Gold Room tier
      localStorage.setItem("ghost_house_tier", "gold");
      // Referral count — tier 2 (3 friends)
      localStorage.setItem("ghost_referral_count", "3");
      // Block package
      localStorage.setItem("ghost_block_package", "10");
      // Butler — unlock Yogyakarta flowers as demo
      localStorage.setItem("ghost_butler_yogyakarta_flowers", "1");
    } catch {}
    activate("bundle");
    setHouseAndPersist("gold");
    window.location.reload();
  };

  const resetAll = () => {
    const keys = ["ghost_mode_until","ghost_mode_plan","ghost_profile","ghost_gender","ghost_phone",
      "ghost_passed_ids","ghost_matches","ghost_tonight_until","ghost_flash_until",
      "ghost_boost_until","ghost_house_tier","ghost_blocked_numbers","ghost_block_package","ghost_block_until",
      "ghost_face_verified","ghost_referral_count","ghost_referral_reward"];
    keys.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
    deactivate();
    window.location.reload();
  };

  const btnBase: React.CSSProperties = {
    flex: 1, minWidth: 0, height: 34, borderRadius: 9, border: "none",
    fontSize: 11, fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
    transition: "all 0.15s",
  };
  const btn = (active: boolean): React.CSSProperties => ({
    ...btnBase,
    background: active ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)",
    color: active ? "#4ade80" : "rgba(255,255,255,0.6)",
    border: active ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.08)",
  });
  const actionBtn: React.CSSProperties = {
    ...btnBase,
    background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(255,255,255,0.1)",
  };
  const dangerBtn: React.CSSProperties = {
    ...btnBase,
    background: "rgba(239,68,68,0.12)", color: "rgba(248,113,113,0.9)",
    border: "1px solid rgba(239,68,68,0.2)",
  };
  const label: React.CSSProperties = {
    fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)",
    letterSpacing: "0.1em", textTransform: "uppercase",
    marginBottom: 5, display: "block",
  };

  return (
    <>
      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.94 }}
        style={{
          position: "fixed", bottom: 90, right: 14, zIndex: 9000,
          width: 48, height: 28, borderRadius: 8,
          background: open ? "rgba(74,222,128,0.2)" : "rgba(0,0,0,0.75)",
          border: open ? "1px solid rgba(74,222,128,0.5)" : "1px solid rgba(255,255,255,0.15)",
          color: open ? "#4ade80" : "rgba(255,255,255,0.5)",
          fontSize: 10, fontWeight: 900, cursor: "pointer",
          backdropFilter: "blur(12px)", letterSpacing: "0.06em",
        }}
      >
        DEV
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            style={{
              position: "fixed", bottom: 126, right: 14, zIndex: 8999,
              width: 280,
              background: "rgba(6,6,12,0.97)", backdropFilter: "blur(30px)",
              borderRadius: 16, border: "1px solid rgba(74,222,128,0.2)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
              overflow: "hidden",
            }}
          >
            <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80)" }} />
            <div style={{ padding: "12px 12px 14px", display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: "#4ade80" }}>🛠 Dev Panel</span>
                <button onClick={resetAll} style={{ ...dangerBtn, flex: "none", width: "auto", padding: "0 10px", fontSize: 10 }}>
                  Reset All
                </button>
              </div>

              {/* Gender / Profile */}
              <div>
                <span style={label}>Profile Setup</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={actionBtn} onClick={() => { setGender("Male"); grantAccess("ghost"); }}>👨 Male</button>
                  <button style={actionBtn} onClick={() => { setGender("Female"); grantAccess("ghost"); }}>👩 Female</button>
                </div>
              </div>

              {/* Access */}
              <div>
                <span style={label}>Access Level</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={actionBtn} onClick={() => grantAccess("ghost")}><img src={GHOST_LOGO} alt="" style={{ width: 36, height: 36, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} /> Ghost</button>
                  <button style={actionBtn} onClick={() => grantAccess("bundle")}>⭐ Bundle</button>
                  <button style={dangerBtn} onClick={() => deactivate()}>Revoke</button>
                </div>
              </div>

              {/* Modes */}
              <div>
                <span style={label}>Modes</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={btn(isTonightMode)} onClick={toggleTonight}>🌙 Tonight</button>
                  <button style={btn(isFlashActive)} onClick={isFlashActive ? exitFlash : enterFlash}>⚡ Flash</button>
                </div>
              </div>

              {/* Ghost Vaults */}
              <div>
                <span style={label}>Ghost Vaults Badge</span>
                <div style={{ display: "flex", gap: 5 }}>
                  <button style={btn(houseTier === "suite")} onClick={() => setHouseAndPersist("suite")}>🏨 Suite</button>
                  <button style={btn(houseTier === "gold")} onClick={() => setHouseAndPersist("gold")}>🔑 Gold</button>
                  <button style={btn(!houseTier)} onClick={() => setHouseAndPersist(null)}>None</button>
                </div>
              </div>

              {/* Popup triggers */}
              <div>
                <span style={label}>Trigger Popups</span>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <button style={actionBtn} onClick={onTriggerFlashMatch}>⚡ Flash Match</button>
                  <button style={actionBtn} onClick={onTriggerMatch}>💚 Match</button>
                  <button style={actionBtn} onClick={onTriggerInbound}>👋 Inbound Like</button>
                </div>
              </div>

              {/* Unlock All */}
              <div>
                <span style={label}>Admin Shortcut</span>
                <button
                  style={{ ...btnBase, width: "100%", background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.4)", fontWeight: 900, fontSize: 12 }}
                  onClick={unlockAll}
                >
                  🔓 Unlock All Features
                </button>
              </div>

              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", margin: 0, textAlign: "center" }}>
                Dev panel — not visible in production
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function GhostModePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isGhost, plan, activate, deactivate } = useGhostMode();

  // IP country detection — runs once, cached 24h
  const [ipCountry, setIpCountry] = useState<IpCountryResult | null>(() => getCachedIpCountry());
  useEffect(() => {
    if (!ipCountry) {
      detectIpCountry().then((result) => { if (result) setIpCountry(result); });
    }
  }, []);

  // International Ghost state
  const [isIntlGhost, setIsIntlGhost] = useState(hasIntlGhost);
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
  const [flagReason, setFlagReason] = useState("");

  const handleFlag = () => {
    if (!flagSheet || !flagReason) return;
    const next = { ...flaggedProfiles, [flagSheet.profileId]: { reason: flagReason, at: Date.now() } };
    setFlaggedProfiles(next);
    saveFlaggedProfiles(next);
    setFlagSheet(null);
    setFlagReason("");
  };

  const [selectedProfile, setSelectedProfile] = useState<GhostProfile | null>(null);
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

  // Quick Exit — renders a blank screen instantly
  const [quickExit, setQuickExit] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

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
    setHouseRulesAgreed(true);
    setShowHouseRules(false);
  };

  // Filter button randomly cycling glow
  const FILTER_GLOWS = [
    "rgba(74,222,128,0.8)",
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
  const [settingsGateFeature, setSettingsGateFeature] = useState<string | null>(null);

  // Ghost Flash — 60-minute live pool
  const FLASH_CONTACT_LIMIT = 3;
  const [flashUntil, setFlashUntil] = useState<number>(() => {
    try { const v = Number(localStorage.getItem("ghost_flash_until") || 0); return v > Date.now() ? v : 0; } catch { return 0; }
  });
  const isFlashActive = flashUntil > Date.now();
  const [flashTick, setFlashTick] = useState(0);
  const [flashMatchProfile, setFlashMatchProfile] = useState<GhostProfile | null>(null);
  const [showFlashPaywall, setShowFlashPaywall] = useState(false);
  const [flashPaywallPaying, setFlashPaywallPaying] = useState(false);
  const [flashConnectedIds, setFlashConnectedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ghost_flash_connected") || "[]")); } catch { return new Set(); }
  });
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
  };
  const handleReveal = (id: string) => {
    setRevealedIds((prev) => new Set([...prev, id]));
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
    const t = setTimeout(() => {
      if (inboundShownRef.current) return;
      inboundShownRef.current = true;
      const pick = DEMO_INBOUND[Math.floor(Math.random() * DEMO_INBOUND.length)];
      setInboundLike(pick);
    }, 18000);
    return () => clearTimeout(t);
  }, [isGhost, hasGhostProfile]);

  // New Guests popup — fires once per session after 5–9 random minutes
  useEffect(() => {
    if (newGuestsShownRef.current || !hasGhostProfile) return;
    const delayMs = (5 + Math.random() * 4) * 60 * 1000; // 5–9 minutes
    const t = setTimeout(() => {
      if (newGuestsShownRef.current) return;
      newGuestsShownRef.current = true;
      setShowNewGuests(true);
    }, delayMs);
    return () => clearTimeout(t);
  }, [hasGhostProfile]);

  // Base profiles — all SEA countries + international, sorted by IP proximity
  const allProfiles = useMemo<GhostProfile[]>(() => {
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
    const merged = [...sea, ...intl];

    if (ipCountry?.countryCode) {
      const userCC = ipCountry.countryCode;
      merged.sort((a, b) => {
        const aCC = a.countryFlag ? Object.entries({ ID:"🇮🇩",PH:"🇵🇭",TH:"🇹🇭",SG:"🇸🇬",MY:"🇲🇾",VN:"🇻🇳" }).find(([,f])=>f===a.countryFlag)?.[0] ?? "ZZ" : "ZZ";
        const bCC = b.countryFlag ? Object.entries({ ID:"🇮🇩",PH:"🇵🇭",TH:"🇹🇭",SG:"🇸🇬",MY:"🇲🇾",VN:"🇻🇳" }).find(([,f])=>f===b.countryFlag)?.[0] ?? "ZZ" : "ZZ";
        return getCountryProximity(userCC, aCC) - getCountryProximity(userCC, bCC);
      });
    }
    return merged;
  }, [userLat, userLon, ipCountry]);

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
      <GhostInstallBanner />

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        paddingTop: `max(12px, env(safe-area-inset-top, 12px))`,
      }}>
        {/* Top row: title + primary actions */}
        <div style={{ padding: "0 16px 10px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
            <img src="https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasd.png" alt="2Ghost" style={{ width: 78, height: 78, objectFit: "contain" }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h1 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "-0.01em" }}>
                  <span style={{ color: "#4ade80", fontWeight: 900 }}>2</span>Ghost
                </h1>
                <span style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 6, padding: "1px 6px", fontSize: 9, fontWeight: 700, color: "rgba(74,222,128,0.9)", letterSpacing: "0.08em" }}>
                  {plan === "bundle" ? "GHOST + VIP" : "ACTIVE"}
                </span>
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", margin: 0 }}>Invisible · Photo · Name · Age · City only</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => navigate("/ghost/dashboard")}
              title="Dashboard"
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(74,222,128,0.7)",
              }}
            >
              <LayoutDashboard size={15} />
            </button>
            <button
              onClick={() => { setSettingsGateFeature(null); setShowSettingsSheet(true); }}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.3)",
              }}
            >
              <Settings size={15} />
            </button>
          </div>
        </div>

        {/* Feature strip */}
        <div style={{ padding: "0 10px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>

          {/* Room */}
          <button onClick={() => navigate("/ghost/room")}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
          >
            <img src="https://ik.imagekit.io/7grri5v7d/weqweqw.png" alt="room" style={{ width: 28, height: 28, objectFit: "contain" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Room</span>
          </button>

          {/* Ghost Vaults */}
          <button onClick={() => setShowHouseModal(true)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
          >
            <span style={{ fontSize: 24, lineHeight: 1 }}>
              {houseTier === "gold"
                ? <img src="https://ik.imagekit.io/7grri5v7d/Haunted%20hotel%20key%20and%20tag.png" alt="Gold Room" style={{ width: 24, height: 24, objectFit: "contain" }} />
                : "🏨"}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: houseTier === "gold" ? "rgba(212,175,55,0.9)" : houseTier === "suite" ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.5)" }}>
              {houseTier === "gold" ? "Gold" : "Rooms"}
            </span>
          </button>

          {/* Tonight */}
          <button onClick={toggleTonight}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 4px", position: "relative" }}
          >
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Moon size={22} color={isTonightMode ? "#4ade80" : "rgba(255,255,255,0.55)"} fill={isTonightMode ? "rgba(74,222,128,0.35)" : "none"} />
              {isTonightMode && (
                <motion.span
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{
                    position: "absolute", top: -3, right: -3,
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#4ade80", display: "block",
                    boxShadow: "0 0 6px rgba(74,222,128,0.9)",
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: isTonightMode ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.5)" }}>
              {isTonightMode ? "LIVE" : "Tonight"}
            </span>
          </button>

          {/* Shield */}
          <button onClick={() => navigate("/ghost/block")}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
          >
            <img src={SHIELD_LOGO} alt="shield" style={{ width: 26, height: 26, objectFit: "contain" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Shield</span>
          </button>

          {/* Ghost Butler */}
          <button
            onClick={() => {
              if (isCitySupported(userCity)) {
                setButlerMatchName(undefined);
                setShowButler(true);
              } else {
                setShowButlerUnavailable(true);
              }
            }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>🎩</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(251,191,36,0.9)" }}>Butler</span>
          </button>

          {/* Filter */}
          <button
            onClick={() => setShowFilters(true)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: FILTER_GLOWS[filterGlowIdx].replace("0.8", "0.12"),
              border: `1.5px solid ${FILTER_GLOWS[filterGlowIdx].replace("0.8", "0.6")}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.6s, border-color 0.6s",
            }}>
              <SlidersHorizontal size={14} color={FILTER_GLOWS[filterGlowIdx].replace("0.8", "1")} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: FILTER_GLOWS[filterGlowIdx].replace("0.8", "0.9"), transition: "color 0.6s" }}>Filter</span>
          </button>

        </div>
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
                  <SlidersHorizontal size={16} color="rgba(74,222,128,0.9)" />
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
                  <div key={label} style={{ flex: 1, background: "rgba(74,222,128,0.05)", borderRadius: 10, border: "1px solid rgba(74,222,128,0.1)", padding: "8px 0", textAlign: "center" }}>
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
                    background: "linear-gradient(to bottom, #4ade80, #22c55e)",
                    color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(34,197,94,0.35)",
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ghost banner */}
      <div style={{ margin: "10px 14px 0", background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 12, padding: "7px 14px", display: "flex", alignItems: "center", gap: 8 }}>
        <img src={GHOST_LOGO} alt="ghost" style={{ width: 42, height: 42, objectFit: "contain" }} />
        <p style={{ fontSize: 11, color: "rgba(74,222,128,0.8)", margin: 0, fontWeight: 600 }}>
          You are invisible. Others only see your photo, name, age & city.
        </p>
      </div>

      {/* Tonight Mode banner */}
      <AnimatePresence>
        {isTonightMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            style={{ margin: "8px 14px 0", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10, padding: "7px 12px", display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}
          >
            <Moon size={12} color="rgba(74,222,128,0.9)" fill="rgba(74,222,128,0.3)" />
            <p style={{ fontSize: 11, color: "rgba(74,222,128,0.9)", margin: 0, fontWeight: 700 }}>
              <span>Tonight Mode is ON · resets at midnight</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Ghost Flash ── */}
      <GhostFlashSection
        isActive={isFlashActive}
        flashUntil={flashUntil}
        flashTick={flashTick}
        flashProfiles={profiles.filter((p) => isFlashProfile(p.id) && !flashConnectedIds.has(p.id)).slice(0, 10)}
        onEnter={() => setShowFlashPaywall(true)}
        onExit={exitFlash}
        onSelectProfile={(p) => setSelectedProfile(p)}
        contactsUsed={flashContactsUsed}
        contactLimit={FLASH_CONTACT_LIMIT}
      />

      {/* ── Ghost Pulse row — hidden when Flash is active ── */}
      {!isFlashActive && <GhostPulseRow profiles={profiles} onSelect={(p) => setSelectedProfile(p)} />}

      {/* ── Country tab bar ── */}
      <CountryTabBar
        homeCode={homeCountryCode}
        homeName={homeCountryName}
        homeFlag={homeFlag}
        activeCode={browsingCountryCode}
        onChange={setBrowsingCountryCode}
      />

      {/* ── Browsing another country notice ── */}
      {browsingCountryCode && (() => {
        const c = SEA_COUNTRY_LIST.find((x) => x.code === browsingCountryCode)!;
        return (
          <div style={{ margin: "0 14px 8px", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 20 }}>{c.flag}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#818cf8", margin: 0 }}>Browsing {c.name} Ghost House</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Liking and matching works across countries</p>
            </div>
            {!isIntlGhost && !isFemale && (
              <button
                onClick={() => setShowIntlModal(true)}
                style={{ height: 30, borderRadius: 50, padding: "0 12px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#818cf8", fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {t("feed.listHere")}
              </button>
            )}
          </div>
        );
      })()}

      {/* ── Active matches row (48h expiry) ── */}
      {savedMatches.filter((m) => Date.now() - m.matchedAt < MATCH_EXPIRY_MS).length > 0 && (
        <div style={{ margin: "10px 14px 0" }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", margin: "0 0 6px", letterSpacing: "0.07em", textTransform: "uppercase" }}>
            <span>Matches · expires in</span>
          </p>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {savedMatches
              .filter((m) => Date.now() - m.matchedAt < MATCH_EXPIRY_MS)
              .map((m) => (
                <div
                  key={m.id}
                  onClick={() => setMatchProfile(m.profile)}
                  style={{
                    flexShrink: 0, width: 70, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}
                >
                  <div style={{ position: "relative", width: 54, height: 54 }}>
                    <img
                      src={m.profile.image} alt=""
                      style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(74,222,128,0.5)" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                    />
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: "conic-gradient(rgba(74,222,128,0.6) 0%, transparent 0%)",
                      opacity: 0.4,
                    }} />
                  </div>
                  <p style={{ fontSize: 8, color: "rgba(255,183,0,0.85)", margin: 0, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>
                    <span>{matchCountdown(m.matchedAt)}</span>
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

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
                border: "1px solid rgba(74,222,128,0.2)",
                borderRadius: 20, padding: "22px 20px 20px",
                position: "relative", overflow: "hidden",
              }}
            >
              {/* Top accent */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)" }} />

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
                <span style={{ color: "#4ade80" }}>Invite a Guest for Free Access</span>
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
                  background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
                  color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  boxShadow: "0 4px 16px rgba(74,222,128,0.3)",
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
              background: "rgba(74,222,128,0.07)",
              border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: 12, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>🏨</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: "#4ade80", margin: 0 }}>The Lobby — New Guests</p>
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

      {/* Profile grid */}
      {profiles.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: 0.5 }}>
          <img src={GHOST_LOGO} alt="ghost" style={{ width: 120, height: 120, objectFit: "contain" }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center" }}>No profiles match your filters.<br />Try widening your search.</p>
        </div>
      ) : (
        <div style={{ flex: 1, padding: "12px 14px 24px", paddingBottom: `max(24px, env(safe-area-inset-bottom, 24px))`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {profiles.map((profile) => (
            <GhostCard
              key={profile.id}
              profile={profile}
              liked={likedIds.has(profile.id)}
              onClick={() => setSelectedProfile(profile)}
              isRevealed={revealedIds.has(profile.id)}
              onReveal={() => handleReveal(profile.id)}
              canReveal={isGhost || isFemale}
              isTonight={isProfileTonight(profile.id)}
              houseTier={profileHouseTier(profile.id)}
              flaggedReason={flaggedProfiles[profile.id]?.reason}
              onFlagOpen={() => { const gId = toGhostId(profile.id); setFlagSheet({ profileId: profile.id, ghostId: gId }); }}
              isFoundBoo={!!(isProfilePaused && foundBoo?.matchProfileId === profile.id)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedProfile && (
          <GhostProfilePopup profile={selectedProfile} liked={likedIds.has(selectedProfile.id)} onLike={() => handleLike(selectedProfile)} onClose={() => setSelectedProfile(null)} onPass={() => handlePass(selectedProfile.id)} />
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
      <AnimatePresence>
        {butlerConnectProfile && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 320, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={() => {
              const p = butlerConnectProfile;
              setButlerConnectProfile(null);
              if (p) { handleFoundBoo(p); setConnectNowProfile(p); }
            }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(10,10,16,0.98)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
                borderRadius: "22px 22px 0 0", border: "1px solid rgba(251,191,36,0.2)",
                padding: "20px 20px max(20px, env(safe-area-inset-bottom, 20px))",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 32, lineHeight: 1 }}>🎩</span>
                <p style={{ margin: "8px 0 4px", fontSize: 15, fontWeight: 800, color: "#fbbf24" }}>
                  Send a Surprise First?
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                  Impress {butlerConnectProfile.name.split(" ")[0]} with flowers, jewellery or a spa gift — delivered right to her door.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => {
                    const p = butlerConnectProfile;
                    setButlerConnectProfile(null);
                    if (isCitySupported(userCity)) {
                      setButlerMatchName(p?.name);
                      setTimeout(() => setShowButler(true), 200);
                    } else {
                      setTimeout(() => setShowButlerUnavailable(true), 200);
                    }
                  }}
                  style={{
                    width: "100%", height: 48, borderRadius: 14, border: "none",
                    background: "linear-gradient(135deg, #d97706, #fbbf24)",
                    color: "#000", fontWeight: 900, fontSize: 14, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  🎩 Open Ghost Butler
                </button>
                <button
                  onClick={() => {
                    const p = butlerConnectProfile;
                    setButlerConnectProfile(null);
                    if (p) { handleFoundBoo(p); setConnectNowProfile(p); }
                  }}
                  style={{
                    width: "100%", height: 44, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)",
                    fontWeight: 700, fontSize: 13, cursor: "pointer",
                  }}
                >
                  No thanks, connect now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Butler unavailable — city not yet served */}
      <AnimatePresence>
        {showButlerUnavailable && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 320, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={() => setShowButlerUnavailable(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(10,10,16,0.98)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
                borderRadius: "22px 22px 0 0", border: "1px solid rgba(251,191,36,0.15)",
                padding: "32px 24px max(28px, env(safe-area-inset-bottom, 28px))",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 16 }}>🎩</div>
              <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 900, color: "#fbbf24" }}>
                The Butler Has Not Yet Arrived
              </h3>
              <p style={{ margin: "0 0 24px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
                Our butler is not yet on service shift in your city. Please come back later — we're expanding our list of gift service providers soon.
              </p>
              <button
                onClick={() => setShowButlerUnavailable(false)}
                style={{
                  width: "100%", height: 48, borderRadius: 14,
                  background: "rgba(251,191,36,0.12)", color: "#fbbf24",
                  fontWeight: 800, fontSize: 14, cursor: "pointer",
                  border: "1px solid rgba(251,191,36,0.25)",
                }}
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            onDone={() => setConnectNowProfile(null)}
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
                border: "1px solid rgba(74,222,128,0.35)",
                borderRadius: 22,
                padding: "26px 22px 20px",
                boxShadow: "0 0 60px rgba(74,222,128,0.1), 0 24px 48px rgba(0,0,0,0.7)",
                backdropFilter: "blur(24px)",
                textAlign: "center",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)", borderRadius: "4px 4px 0 0", position: "absolute", top: 0, left: 0, right: 0 }} />
              <motion.div
                animate={{ scale: [1, 1.07, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}
              >
                <img src={SHIELD_LOGO} alt="shield" style={{ width: 64, height: 64, objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(74,222,128,0.5))" }} />
              </motion.div>
              <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(74,222,128,0.8)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>
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
                  background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
                  color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 20px rgba(34,197,94,0.4)",
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
      <AnimatePresence>
        {showSettingsSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSettingsSheet(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9000, backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              style={{
                position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
                width: "100%", maxWidth: 480, zIndex: 9001,
                background: "rgba(10,12,16,0.98)", borderTop: "1px solid rgba(74,222,128,0.18)",
                borderRadius: "24px 24px 0 0", padding: "20px 20px 36px",
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "0 auto 20px" }} />
              <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.9)", margin: "0 0 6px", letterSpacing: 0.3 }}>
                Ghost Settings
              </p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>
                Manage what you share in Ghost Mode
              </p>

              {settingsGateFeature ? (
                <div style={{
                  background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)",
                  borderRadius: 16, padding: "20px 18px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🚪</div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "rgba(74,222,128,0.9)", margin: "0 0 6px" }}>
                    Ghost Vault Required
                  </p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 18px", lineHeight: 1.5 }}>
                    You need to create your Ghost Vault before sharing {settingsGateFeature.toLowerCase()}. Your room is the private link ghosts use to access your content.
                  </p>
                  <button
                    onClick={() => { setShowSettingsSheet(false); navigate("/ghost/room"); }}
                    style={{
                      height: 40, paddingInline: 24, borderRadius: 12,
                      background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.35)",
                      color: "rgba(74,222,128,0.9)", fontSize: 13, fontWeight: 800, cursor: "pointer",
                    }}
                  >
                    Set Up Ghost Vault
                  </button>
                  <button
                    onClick={() => setSettingsGateFeature(null)}
                    style={{
                      display: "block", margin: "12px auto 0", background: "none", border: "none",
                      color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer",
                    }}
                  >
                    ← Back
                  </button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { icon: "🎥", label: "Video", desc: "Share video clips" },
                    { icon: "🖼️", label: "Images", desc: "Share photo gallery" },
                    { icon: "👥", label: "Contacts", desc: "Share contact list" },
                    { icon: null, label: "Shield", desc: "Block unwanted ghosts", isShield: true },
                  ].map(({ icon, label, desc, isShield }) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (isShield) {
                          setShowSettingsSheet(false);
                          navigate("/ghost/block");
                        } else {
                          const hasRoom = !!localStorage.getItem("ghost_room_code");
                          if (!hasRoom) {
                            setSettingsGateFeature(label);
                          } else {
                            setShowSettingsSheet(false);
                            navigate("/ghost/room");
                          }
                        }
                      }}
                      style={{
                        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 16, padding: "18px 14px", textAlign: "left", cursor: "pointer",
                        display: "flex", flexDirection: "column", gap: 8,
                      }}
                    >
                      {isShield
                        ? <img src={SHIELD_LOGO} alt="shield" style={{ width: 72, height: 72, objectFit: "contain" }} />
                        : <span style={{ fontSize: 28 }}>{icon}</span>
                      }
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.85)", margin: 0 }}>{label}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Flag / Report sheet ── */}
      <AnimatePresence>
        {flagSheet && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setFlagSheet(null); setFlagReason(""); }}
            style={{
              position: "fixed", inset: 0, zIndex: 500,
              background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(8,6,6,0.98)",
                borderRadius: "20px 20px 0 0",
                border: "1px solid rgba(239,68,68,0.2)", borderBottom: "none",
                padding: "0 18px max(28px, env(safe-area-inset-bottom, 28px))",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, #ef4444, #f87171)", borderRadius: "4px 4px 0 0" }} />
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 16px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Report {flagSheet.ghostId}</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>
                Select a reason. This profile will be flagged for admin review and frozen until investigated.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[
                  { key: "spam", label: "Spam or repeated harassment", icon: "🚫" },
                  { key: "fake", label: "Fake profile or catfishing", icon: "🎭" },
                  { key: "inappropriate", label: "Inappropriate content", icon: "⚠️" },
                  { key: "threatening", label: "Threatening or abusive behaviour", icon: "🛑" },
                  { key: "underage", label: "Appears to be underage", icon: "🔞" },
                ].map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setFlagReason(r.key)}
                    style={{
                      width: "100%", height: 46, borderRadius: 12, padding: "0 14px",
                      background: flagReason === r.key ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
                      border: flagReason === r.key ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      color: flagReason === r.key ? "#f87171" : "rgba(255,255,255,0.7)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                    }}
                  >
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleFlag}
                disabled={!flagReason}
                style={{
                  width: "100%", height: 48, borderRadius: 50, border: "none",
                  background: flagReason ? "linear-gradient(to bottom, #f87171, #ef4444)" : "rgba(255,255,255,0.07)",
                  color: flagReason ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: 14, fontWeight: 900, cursor: flagReason ? "pointer" : "default",
                  boxShadow: flagReason ? "0 4px 16px rgba(239,68,68,0.4)" : "none",
                  marginBottom: 10,
                }}
              >
                Submit Report
              </motion.button>
              <button
                onClick={() => { setFlagSheet(null); setFlagReason(""); }}
                style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "4px 0" }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Security popup — fires when user taps before agreeing to house rules ── */}
      <AnimatePresence>
        {showSecurityPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSecurityPopup(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 300,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 24px",
            }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 12 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 340,
                background: "rgba(8,10,8,0.98)",
                border: "1px solid rgba(74,222,128,0.18)",
                borderRadius: 20,
                padding: "28px 24px 22px",
                boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
                textAlign: "center",
              }}
            >
              <img src={GHOST_LOGO} alt="ghost" style={{ width: 56, height: 56, objectFit: "contain", marginBottom: 14 }} />
              <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(74,222,128,0.7)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>
                🔒 Security Notice
              </p>
              <h3 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: "0 0 10px", lineHeight: 1.3 }}>
                Account Required
              </h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 20px", lineHeight: 1.6 }}>
                For security reasons, all users must agree to our house rules before viewing our house guests.
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => { setShowSecurityPopup(false); setShowHouseRules(true); }}
                style={{
                  width: "100%", height: 46, borderRadius: 50, border: "none",
                  background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
                  color: "#fff", fontSize: 14, fontWeight: 900,
                  cursor: "pointer",
                  boxShadow: "0 4px 20px rgba(34,197,94,0.4)",
                }}
              >
                View House Rules
              </motion.button>
              <button
                onClick={() => setShowSecurityPopup(false)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", marginTop: 12, padding: "4px 0" }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── House rules modal — slides up 5s after first arrival ── */}
      <AnimatePresence>
        {showHouseRules && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 250,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
              style={{
                width: "100%", maxWidth: 480,
                backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdfasdASD.png)",
                backgroundSize: "cover", backgroundPosition: "center top",
                borderRadius: "24px 24px 0 0",
                border: "1px solid rgba(74,222,128,0.12)", borderBottom: "none",
                maxHeight: "92dvh",
                display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ height: 3, flexShrink: 0, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e, #4ade80, #16a34a)" }} />
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0", flexShrink: 0 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
              </div>

              {/* Scrollable content */}
              <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "20px 22px 16px" }}>

                <div style={{ textAlign: "center", marginBottom: 24 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.2, background: "linear-gradient(135deg, #fff 40%, #4ade80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Welcome to the Ghost Hotel 👻
                  </h1>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.7, maxWidth: 320, marginInline: "auto" }}>
                    Before you settle in, we have some{" "}
                    <span style={{ color: "rgba(74,222,128,0.85)", fontWeight: 700 }}>hotel rules</span>{" "}
                    that keep our hotel free from bad energy.
                  </p>
                </div>

                {/* Preview avatars */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 16 }}>
                  {PREVIEW_AVATARS.map((src, i) => (
                    <img key={i} src={src} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(74,222,128,0.45)", marginLeft: i === 0 ? 0 : -10, zIndex: PREVIEW_AVATARS.length - i, position: "relative" }} />
                  ))}
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", marginLeft: 10 }}>+120 ghosts inside</span>
                </div>

                <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.2), transparent)", marginBottom: 22 }} />

                {/* Rules */}
                <div style={{ marginBottom: 26 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(74,222,128,0.6)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 14px" }}>🏠 House Rules</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {HOUSE_RULES.map((rule) => (
                      <div key={rule.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.08)", borderRadius: 14, padding: "12px 14px" }}>
                        <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                          {rule.icon === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain" }} /> : rule.icon}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>{rule.title}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", margin: 0, lineHeight: 1.5 }}>{rule.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.2), transparent)", marginBottom: 22 }} />

                {/* How it works */}
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(74,222,128,0.6)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 14px" }}>⚙️ How It Works</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {HOW_IT_WORKS.map((item) => (
                      <div key={item.title} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                          {item.icon}
                        </div>
                        <div style={{ paddingTop: 2 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{item.title}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky footer */}
              <div style={{ flexShrink: 0, padding: "14px 22px max(28px, env(safe-area-inset-bottom, 28px))", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(4,6,4,0.97)" }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -2 }}
                  onClick={handleHouseRulesAccept}
                  style={{
                    width: "100%", height: 54, borderRadius: 50, border: "none",
                    background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
                    color: "#fff", fontSize: 15, fontWeight: 900,
                    cursor: "pointer", letterSpacing: "0.03em",
                    boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 32px rgba(34,197,94,0.5)",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
                  Agree To Abide By Rules
                </motion.button>
                <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "10px 0 0", lineHeight: 1.6 }}>
                  By entering you agree to the house rules above and our{" "}
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>Privacy Policy</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* ── Ghost Flash paywall ── */}
      <AnimatePresence>
        {showFlashPaywall && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { if (!flashPaywallPaying) setShowFlashPaywall(false); }}
            style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 480, background: "rgb(5,5,10)", borderRadius: "22px 22px 0 0", border: "1px solid rgba(74,222,128,0.2)", borderBottom: "none", padding: "24px 24px max(28px, env(safe-area-inset-bottom, 28px))" }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "0 auto 20px" }} />
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: 22 }}>
                <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1, repeat: Infinity }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.35)", borderRadius: 50, padding: "6px 16px", marginBottom: 14 }}>
                  <span style={{ fontSize: 16 }}>⚡</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "rgba(74,222,128,0.95)", letterSpacing: "0.1em" }}>GHOST FLASH</span>
                </motion.div>
                <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>Go Live for 60 Minutes</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
                  Enter the live Flash pool and connect with active Ghosts right now. Up to 3 instant WhatsApp connections.
                </p>
              </div>
              {/* Features */}
              <div style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 14, padding: "14px 16px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  ["⚡", "60-minute live session in the Flash pool"],
                  ["💚", "Up to 3 instant WhatsApp connections"],
                  ["👻", "Only live, active Ghosts shown"],
                  ["🔄", "Rejoin anytime — each session is $2.99"],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{text}</span>
                  </div>
                ))}
              </div>
              {/* Pay button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={flashPaywallPaying}
                onClick={() => {
                  setFlashPaywallPaying(true);
                  setTimeout(() => {
                    enterFlash();
                    setFlashPaywallPaying(false);
                    setShowFlashPaywall(false);
                  }, 1600);
                }}
                style={{
                  width: "100%", height: 54, borderRadius: 50, border: "none",
                  background: flashPaywallPaying ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #4ade80, #16a34a)",
                  color: flashPaywallPaying ? "rgba(255,255,255,0.3)" : "#000",
                  fontSize: 16, fontWeight: 900, cursor: flashPaywallPaying ? "default" : "pointer",
                  marginBottom: 10,
                  boxShadow: flashPaywallPaying ? "none" : "0 4px 24px rgba(74,222,128,0.3)",
                }}
              >
                {flashPaywallPaying ? "Processing…" : "⚡ Join Flash — $2.99"}
              </motion.button>
              <button onClick={() => setShowFlashPaywall(false)} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 13, cursor: "pointer", padding: "6px 0" }}>
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
      />

    </div>
    </div>
  );
}
