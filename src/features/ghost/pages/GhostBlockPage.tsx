import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Phone, X, Globe, MapPin, Bell, BellOff, Mail, User, ShieldOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

const SHIELD_LOGO = "https://ik.imagekit.io/7grri5v7d/ccccccccc-removebg-preview.png";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

const COUNTRY_CODES = [
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+63", flag: "🇵🇭", name: "Philippines" },
  { code: "+66", flag: "🇹🇭", name: "Thailand" },
  { code: "+84", flag: "🇻🇳", name: "Vietnam" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+353", flag: "🇮🇪", name: "Ireland" },
  { code: "+1",  flag: "🇺🇸", name: "USA" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+91", flag: "🇮🇳", name: "India" },
];

const ALL_COUNTRIES = [
  { flag: "🇦🇫", name: "Afghanistan" },
  { flag: "🇦🇱", name: "Albania" },
  { flag: "🇩🇿", name: "Algeria" },
  { flag: "🇦🇷", name: "Argentina" },
  { flag: "🇦🇲", name: "Armenia" },
  { flag: "🇦🇺", name: "Australia" },
  { flag: "🇦🇹", name: "Austria" },
  { flag: "🇦🇿", name: "Azerbaijan" },
  { flag: "🇧🇩", name: "Bangladesh" },
  { flag: "🇧🇾", name: "Belarus" },
  { flag: "🇧🇪", name: "Belgium" },
  { flag: "🇧🇴", name: "Bolivia" },
  { flag: "🇧🇦", name: "Bosnia" },
  { flag: "🇧🇷", name: "Brazil" },
  { flag: "🇧🇬", name: "Bulgaria" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇨🇱", name: "Chile" },
  { flag: "🇨🇳", name: "China" },
  { flag: "🇨🇴", name: "Colombia" },
  { flag: "🇭🇷", name: "Croatia" },
  { flag: "🇨🇿", name: "Czech Republic" },
  { flag: "🇩🇰", name: "Denmark" },
  { flag: "🇪🇨", name: "Ecuador" },
  { flag: "🇪🇬", name: "Egypt" },
  { flag: "🇪🇹", name: "Ethiopia" },
  { flag: "🇫🇮", name: "Finland" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇬🇪", name: "Georgia" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇬🇭", name: "Ghana" },
  { flag: "🇬🇷", name: "Greece" },
  { flag: "🇬🇹", name: "Guatemala" },
  { flag: "🇭🇳", name: "Honduras" },
  { flag: "🇭🇺", name: "Hungary" },
  { flag: "🇮🇳", name: "India" },
  { flag: "🇮🇩", name: "Indonesia" },
  { flag: "🇮🇷", name: "Iran" },
  { flag: "🇮🇶", name: "Iraq" },
  { flag: "🇮🇪", name: "Ireland" },
  { flag: "🇮🇱", name: "Israel" },
  { flag: "🇮🇹", name: "Italy" },
  { flag: "🇯🇲", name: "Jamaica" },
  { flag: "🇯🇵", name: "Japan" },
  { flag: "🇯🇴", name: "Jordan" },
  { flag: "🇰🇿", name: "Kazakhstan" },
  { flag: "🇰🇪", name: "Kenya" },
  { flag: "🇰🇷", name: "South Korea" },
  { flag: "🇰🇼", name: "Kuwait" },
  { flag: "🇱🇧", name: "Lebanon" },
  { flag: "🇱🇾", name: "Libya" },
  { flag: "🇲🇾", name: "Malaysia" },
  { flag: "🇲🇽", name: "Mexico" },
  { flag: "🇲🇦", name: "Morocco" },
  { flag: "🇲🇿", name: "Mozambique" },
  { flag: "🇲🇲", name: "Myanmar" },
  { flag: "🇳🇵", name: "Nepal" },
  { flag: "🇳🇱", name: "Netherlands" },
  { flag: "🇳🇿", name: "New Zealand" },
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇳🇴", name: "Norway" },
  { flag: "🇴🇲", name: "Oman" },
  { flag: "🇵🇰", name: "Pakistan" },
  { flag: "🇵🇪", name: "Peru" },
  { flag: "🇵🇭", name: "Philippines" },
  { flag: "🇵🇱", name: "Poland" },
  { flag: "🇵🇹", name: "Portugal" },
  { flag: "🇶🇦", name: "Qatar" },
  { flag: "🇷🇴", name: "Romania" },
  { flag: "🇷🇺", name: "Russia" },
  { flag: "🇸🇦", name: "Saudi Arabia" },
  { flag: "🇸🇳", name: "Senegal" },
  { flag: "🇷🇸", name: "Serbia" },
  { flag: "🇸🇬", name: "Singapore" },
  { flag: "🇸🇰", name: "Slovakia" },
  { flag: "🇸🇴", name: "Somalia" },
  { flag: "🇿🇦", name: "South Africa" },
  { flag: "🇸🇸", name: "South Sudan" },
  { flag: "🇪🇸", name: "Spain" },
  { flag: "🇱🇰", name: "Sri Lanka" },
  { flag: "🇸🇩", name: "Sudan" },
  { flag: "🇸🇪", name: "Sweden" },
  { flag: "🇨🇭", name: "Switzerland" },
  { flag: "🇸🇾", name: "Syria" },
  { flag: "🇹🇼", name: "Taiwan" },
  { flag: "🇹🇿", name: "Tanzania" },
  { flag: "🇹🇭", name: "Thailand" },
  { flag: "🇹🇳", name: "Tunisia" },
  { flag: "🇹🇷", name: "Turkey" },
  { flag: "🇺🇬", name: "Uganda" },
  { flag: "🇺🇦", name: "Ukraine" },
  { flag: "🇦🇪", name: "UAE" },
  { flag: "🇬🇧", name: "UK" },
  { flag: "🇺🇸", name: "USA" },
  { flag: "🇺🇿", name: "Uzbekistan" },
  { flag: "🇻🇪", name: "Venezuela" },
  { flag: "🇻🇳", name: "Vietnam" },
  { flag: "🇾🇪", name: "Yemen" },
  { flag: "🇿🇲", name: "Zambia" },
  { flag: "🇿🇼", name: "Zimbabwe" },
];

const PACKAGES = [
  {
    key: 1,
    name: "No Vacancy × 1",
    shieldCount: 1,
    desc: "Turn away 1 specific guest",
    idr: "29,000",
    usd: "~$2",
    period: "per month",
    color: "#86efac",
    glow: "rgba(134,239,172,0.4)",
    border: "rgba(134,239,172,0.35)",
    bg: "rgba(134,239,172,0.07)",
    gradient: "linear-gradient(to bottom, #bbf7d0, #86efac, #4ade80)",
  },
  {
    key: 3,
    name: "No Vacancy × 3",
    shieldCount: 3,
    desc: "Turn away up to 3 guests",
    idr: "59,000",
    usd: "~$4",
    period: "per month",
    color: "#4ade80",
    glow: "rgba(74,222,128,0.4)",
    border: "rgba(74,222,128,0.4)",
    bg: "rgba(74,222,128,0.08)",
    gradient: "linear-gradient(to bottom, #4ade80, #22c55e, #16a34a)",
    badge: "POPULAR",
  },
  {
    key: 6,
    name: "No Vacancy × 6",
    shieldCount: 6,
    desc: "Turn away up to 6 guests",
    idr: "89,000",
    usd: "~$6",
    period: "per month",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.4)",
    border: "rgba(34,197,94,0.35)",
    bg: "rgba(34,197,94,0.07)",
    gradient: "linear-gradient(to bottom, #22c55e, #16a34a, #15803d)",
  },
];

function getBlockedNumbers(): string[] {
  try { return JSON.parse(localStorage.getItem("ghost_blocked_numbers") || "[]"); } catch { return []; }
}
function saveBlockedNumbers(arr: string[]) {
  try { localStorage.setItem("ghost_blocked_numbers", JSON.stringify(arr)); } catch {}
}
function getBlockPackage(): number {
  try { return parseInt(localStorage.getItem("ghost_block_package") || "0", 10); } catch { return 0; }
}
function getBlockedCountries(): string[] {
  try { return JSON.parse(localStorage.getItem("ghost_blocked_countries") || "[]"); } catch { return []; }
}
function saveBlockedCountries(arr: string[]) {
  try { localStorage.setItem("ghost_blocked_countries", JSON.stringify(arr)); } catch {}
}
function getHiddenCities(): string[] {
  try { return JSON.parse(localStorage.getItem("ghost_hidden_cities") || "[]"); } catch { return []; }
}
function saveHiddenCities(arr: string[]) {
  try { localStorage.setItem("ghost_hidden_cities", JSON.stringify(arr)); } catch {}
}
function getBlockedGuestIds(): string[] {
  try { return JSON.parse(localStorage.getItem("ghost_blocked_guest_ids") || "[]"); } catch { return []; }
}
function saveBlockedGuestIds(arr: string[]) {
  try { localStorage.setItem("ghost_blocked_guest_ids", JSON.stringify(arr)); } catch {}
}
function getBlockedEmails(): string[] {
  try { return JSON.parse(localStorage.getItem("ghost_blocked_emails") || "[]"); } catch { return []; }
}
function saveBlockedEmails(arr: string[]) {
  try { localStorage.setItem("ghost_blocked_emails", JSON.stringify(arr)); } catch {}
}
function getEmailPkg(): boolean {
  try { return localStorage.getItem("ghost_email_block_pkg") === "true"; } catch { return false; }
}
function getNotifPref(key: string): boolean {
  try { const v = localStorage.getItem(key); return v === null ? true : v === "true"; } catch { return true; }
}

// ── Toggle Switch component ───────────────────────────────────────────────────
function ToggleSwitch({ on, onToggle, accent }: { on: boolean; onToggle: () => void; accent: string }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: on ? accent : "rgba(255,255,255,0.12)",
        position: "relative", flexShrink: 0,
        transition: "background 0.22s",
        padding: 0,
      }}
    >
      <motion.div
        animate={{ x: on ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        style={{
          position: "absolute", top: 3, width: 18, height: 18, borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
        }}
      />
    </button>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.3)",
      letterSpacing: "0.14em", textTransform: "uppercase" as const,
      margin: "0 0 8px 4px",
    }}>
      {children}
    </p>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(4,8,4,0.78)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      overflow: "hidden",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Free badge ────────────────────────────────────────────────────────────────
function FreeBadge({ accent, glow }: { accent: string; glow: (o: number) => string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, color: accent,
      background: glow(0.12), border: `1px solid ${glow(0.3)}`,
      borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em",
      flexShrink: 0,
    }}>
      FREE
    </span>
  );
}

// ── Icon bubble ───────────────────────────────────────────────────────────────
function IconBubble({ icon, accent, glow }: { icon: React.ReactNode; accent: string; glow: (o: number) => string }) {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 11,
      background: glow(0.1), border: `1px solid ${glow(0.22)}`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      {icon}
    </div>
  );
}

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ label, onRemove, accent, glow }: { label: string; onRemove: () => void; accent: string; glow: (o: number) => string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      background: glow(0.08), border: `1px solid ${glow(0.2)}`,
      borderRadius: 20, padding: "4px 8px 4px 10px",
    }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{label}</span>
      <button
        onClick={onRemove}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.3)", padding: 0,
          display: "flex", alignItems: "center",
        }}
      >
        <X size={11} />
      </button>
    </div>
  );
}

export default function GhostBlockPage() {
  const a = useGenderAccent();
  const navigate = useNavigate();

  // Phone blocking (paid)
  const [pkg, setPkg] = useState<number>(getBlockPackage);
  const [blocked, setBlocked] = useState<string[]>(getBlockedNumbers);
  const [showAddPhoneModal, setShowAddPhoneModal] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Country / city (free)
  const [blockedCountries, setBlockedCountries] = useState<string[]>(getBlockedCountries);
  const [hiddenCities, setHiddenCities] = useState<string[]>(getHiddenCities);
  const [newCity, setNewCity] = useState("");
  const [showCountryBlockSheet, setShowCountryBlockSheet] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  // Guest ID (free)
  const [blockedGuestIds, setBlockedGuestIds] = useState<string[]>(getBlockedGuestIds);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [newGuestSuffix, setNewGuestSuffix] = useState("");

  // Notifications (free)
  const [notifGames, setNotifGames] = useState<boolean>(() => getNotifPref("ghost_notif_games"));
  const [notifBreakfast, setNotifBreakfast] = useState<boolean>(() => getNotifPref("ghost_notif_breakfast"));

  // Email (paid)
  const [emailPkg, setEmailPkg] = useState<boolean>(getEmailPkg);
  const [blockedEmails, setBlockedEmails] = useState<string[]>(getBlockedEmails);
  const [showAddEmailModal, setShowAddEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  // ── computed ─────────────────────────────────────────────────────────────────
  const cleanNew = newPhone.replace(/\D/g, "");
  const fullNew = countryCode.code + cleanNew;
  const canAddPhone = cleanNew.length >= 8 && blocked.length < pkg && !blocked.includes(fullNew);

  const guestSuffixClean = newGuestSuffix.replace(/\D/g, "").slice(0, 4);
  const fullGuestId = `Guest-${guestSuffixClean}`;
  const canAddGuest = guestSuffixClean.length === 4 && !blockedGuestIds.includes(fullGuestId);

  const canAddEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) && blockedEmails.length < 3 && !blockedEmails.includes(newEmail);

  const filteredCountries = ALL_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const slotsUsed = blocked.length;
  const slotsTotal = pkg;

  // ── stat counts for hero ──────────────────────────────────────────────────
  const notifsSilenced = [!notifGames, !notifBreakfast].filter(Boolean).length;

  // ── handlers ─────────────────────────────────────────────────────────────────
  const handleBuy = (slots: number) => {
    try {
      localStorage.setItem("ghost_block_package", String(slots));
      localStorage.setItem("ghost_block_until", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
    } catch {}
    setPkg(slots);
    setShowPurchase(false);
  };

  const handleAddPhone = () => {
    if (!canAddPhone) return;
    const next = [...blocked, fullNew];
    setBlocked(next);
    saveBlockedNumbers(next);
    setNewPhone("");
    setShowAddPhoneModal(false);
  };

  const handleDeletePhone = (num: string) => {
    const next = blocked.filter((n) => n !== num);
    setBlocked(next);
    saveBlockedNumbers(next);
    setConfirmDelete(null);
  };

  const toggleCountry = (name: string) => {
    const next = blockedCountries.includes(name)
      ? blockedCountries.filter((c) => c !== name)
      : [...blockedCountries, name];
    setBlockedCountries(next);
    saveBlockedCountries(next);
  };

  const addCity = () => {
    const city = newCity.trim();
    if (!city || hiddenCities.includes(city)) return;
    const next = [...hiddenCities, city];
    setHiddenCities(next);
    saveHiddenCities(next);
    setNewCity("");
  };

  const removeCity = (city: string) => {
    const next = hiddenCities.filter((c) => c !== city);
    setHiddenCities(next);
    saveHiddenCities(next);
  };

  const handleAddGuest = () => {
    if (!canAddGuest) return;
    const next = [...blockedGuestIds, fullGuestId];
    setBlockedGuestIds(next);
    saveBlockedGuestIds(next);
    setNewGuestSuffix("");
    setShowAddGuestModal(false);
  };

  const removeGuest = (id: string) => {
    const next = blockedGuestIds.filter((g) => g !== id);
    setBlockedGuestIds(next);
    saveBlockedGuestIds(next);
  };

  const toggleNotif = (key: string, cur: boolean, set: (v: boolean) => void) => {
    const next = !cur;
    set(next);
    try { localStorage.setItem(key, String(next)); } catch {}
  };

  const handleActivateEmailPkg = () => {
    try { localStorage.setItem("ghost_email_block_pkg", "true"); } catch {}
    setEmailPkg(true);
  };

  const handleAddEmail = () => {
    if (!canAddEmail) return;
    const next = [...blockedEmails, newEmail.trim()];
    setBlockedEmails(next);
    saveBlockedEmails(next);
    setNewEmail("");
    setShowAddEmailModal(false);
  };

  const removeEmail = (email: string) => {
    const next = blockedEmails.filter((e) => e !== email);
    setBlockedEmails(next);
    saveBlockedEmails(next);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100dvh", color: "#fff", position: "relative",
      backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/vxcvxcvxcv.png)",
      backgroundSize: "cover", backgroundPosition: "center top", backgroundAttachment: "fixed",
    }}>
      {/* Dark overlay */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(4,5,8,0.82)", zIndex: 0, pointerEvents: "none" }} />

      {/* ── HEADER ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(4,5,8,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${a.glow(0.12)}`,
        padding: "max(14px, env(safe-area-inset-top, 14px)) 16px 14px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.6)", flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#fff" }}>Shield</h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 500 }}>Guest privacy controls</p>
        </div>
        <motion.img
          src={SHIELD_LOGO}
          alt="shield"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 56, height: 56, objectFit: "contain", filter: `drop-shadow(0 0 14px ${a.glow(0.5)})` }}
        />
      </div>

      {/* ── SCROLL CONTAINER ── */}
      <div style={{
        position: "relative", zIndex: 1,
        padding: "16px 16px 80px",
        display: "flex", flexDirection: "column", gap: 20,
        overflowX: "hidden",
      }}>

        {/* ═══ HERO ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: "rgba(4,8,4,0.88)",
            border: `1px solid ${a.glow(0.18)}`,
            borderRadius: 20,
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            padding: "28px 20px 22px",
            textAlign: "center",
            boxShadow: `0 0 50px ${a.glow(0.06)}, 0 20px 40px rgba(0,0,0,0.4)`,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)`,
          }} />
          <motion.div
            animate={{ scale: [1, 1.07, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "inline-block", marginBottom: 14 }}
          >
            <img
              src={SHIELD_LOGO}
              alt="shield"
              style={{
                width: 100, height: 100, objectFit: "contain",
                filter: `drop-shadow(0 0 24px ${a.glow(0.55)})`,
              }}
            />
          </motion.div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.01em" }}>
            You Are In Control
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 20px", lineHeight: 1.65 }}>
            Your hotel, your rules. Every setting below is invisible to other guests.
          </p>

          {/* Stat pills */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Guest IDs blocked", value: blockedGuestIds.length },
              { label: "Countries blocked", value: blockedCountries.length },
              { label: "Notifications silenced", value: notifsSilenced },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${a.glow(0.18)}`,
                borderRadius: 20, padding: "6px 14px",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 15, fontWeight: 900, color: a.accent }}>{value}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ═══ SECTION 1: GUEST CONTROLS ═══ */}
        <div>
          <SectionLabel>Guest Controls</SectionLabel>
          <Card>
            <div style={{ padding: "14px 16px" }}>
              {/* Header row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <IconBubble icon={<User size={16} color={a.accent} />} accent={a.accent} glow={a.glow} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Block Guest ID</p>
                    <FreeBadge accent={a.accent} glow={a.glow} />
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", margin: "2px 0 0" }}>
                    Block any Guest-XXXX from seeing your profile. They'll see No Vacancy.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddGuestModal(true)}
                  style={{
                    width: 34, height: 34, borderRadius: 9, border: `1px solid ${a.glow(0.3)}`,
                    background: a.glow(0.1), color: a.accent, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <Plus size={15} />
                </button>
              </div>

              {/* Guest ID chips */}
              {blockedGuestIds.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 4 }}>
                  {blockedGuestIds.map((id) => (
                    <Chip key={id} label={id} onRemove={() => removeGuest(id)} accent={a.accent} glow={a.glow} />
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic", margin: "4px 0 0" }}>
                  No guests blocked
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* ═══ SECTION 2: NOTIFICATION CONTROLS ═══ */}
        <div>
          <Card>
            <div style={{ padding: "14px 16px 6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <IconBubble icon={<Bell size={16} color={a.accent} />} accent={a.accent} glow={a.glow} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Notification Controls</p>
                    <FreeBadge accent={a.accent} glow={a.glow} />
                  </div>
                </div>
              </div>

              {/* Toggle row 1 */}
              {[
                {
                  key: "ghost_notif_games",
                  label: "Games Room Invitations",
                  desc: "Receive invites to the games room",
                  on: notifGames,
                  set: setNotifGames,
                },
                {
                  key: "ghost_notif_breakfast",
                  label: "Breakfast Table Invitations",
                  desc: "Receive invites to breakfast tables",
                  on: notifBreakfast,
                  set: setNotifBreakfast,
                },
              ].map(({ key, label, desc, on, set }) => (
                <div
                  key={key}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, paddingBottom: 14,
                    borderBottom: key === "ghost_notif_games" ? "1px solid rgba(255,255,255,0.05)" : "none",
                    marginBottom: key === "ghost_notif_games" ? 14 : 0,
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {on ? <Bell size={14} color={a.accent} /> : <BellOff size={14} color="rgba(255,255,255,0.3)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "1px 0 0" }}>{desc}</p>
                  </div>
                  <ToggleSwitch on={on} onToggle={() => toggleNotif(key, on, set)} accent={a.accent} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ═══ SECTION 3: LOCATION & VISIBILITY ═══ */}
        <div>
          <SectionLabel>Location & Visibility</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Block Countries card */}
            <Card>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <IconBubble icon={<Globe size={16} color={a.accent} />} accent={a.accent} glow={a.glow} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Block Countries</p>
                      <FreeBadge accent={a.accent} glow={a.glow} />
                    </div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", margin: "0 0 10px" }}>
                      Block specific countries from viewing your profile
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCountryBlockSheet(true)}
                    style={{
                      height: 30, borderRadius: 8, padding: "0 12px",
                      background: a.glow(0.1), border: `1px solid ${a.glow(0.3)}`,
                      color: a.accent, fontSize: 11, fontWeight: 800, cursor: "pointer", flexShrink: 0,
                    }}
                  >
                    {blockedCountries.length === 0 ? "Set Up" : "Edit"}
                  </button>
                </div>
                {blockedCountries.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 2 }}>
                    {blockedCountries.map((name) => {
                      const c = ALL_COUNTRIES.find((x) => x.name === name);
                      return (
                        <div key={name} style={{
                          display: "flex", alignItems: "center", gap: 5,
                          background: a.glow(0.08), border: `1px solid ${a.glow(0.2)}`,
                          borderRadius: 20, padding: "4px 8px 4px 8px",
                        }}>
                          <span style={{ fontSize: 13 }}>{c?.flag}</span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{name}</span>
                          <button
                            onClick={() => toggleCountry(name)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "rgba(255,255,255,0.3)", padding: 0,
                              display: "flex", alignItems: "center",
                            }}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Hide from Cities card */}
            <Card>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <IconBubble icon={<MapPin size={16} color={a.accent} />} accent={a.accent} glow={a.glow} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Hide from Cities</p>
                      <FreeBadge accent={a.accent} glow={a.glow} />
                    </div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", margin: "2px 0 0" }}>
                      Your profile won't appear to users in these cities
                    </p>
                  </div>
                </div>
                {/* City input */}
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder="Enter city name…"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addCity(); }}
                    style={{
                      flex: 1, height: 38, borderRadius: 10,
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff", fontSize: 13, paddingLeft: 12,
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <button
                    onClick={addCity}
                    disabled={!newCity.trim() || hiddenCities.includes(newCity.trim())}
                    style={{
                      width: 38, height: 38, borderRadius: 10, border: "none", flexShrink: 0,
                      background: newCity.trim() && !hiddenCities.includes(newCity.trim())
                        ? a.glow(0.2) : "rgba(255,255,255,0.05)",
                      color: newCity.trim() && !hiddenCities.includes(newCity.trim())
                        ? a.accent : "rgba(255,255,255,0.2)",
                      cursor: newCity.trim() ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {hiddenCities.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {hiddenCities.map((city) => (
                      <div key={city} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        background: a.glow(0.08), border: `1px solid ${a.glow(0.2)}`,
                        borderRadius: 20, padding: "4px 8px 4px 10px",
                      }}>
                        <MapPin size={10} color={a.glow(0.7)} />
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{city}</span>
                        <button
                          onClick={() => removeCity(city)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: "rgba(255,255,255,0.3)", padding: 0,
                            display: "flex", alignItems: "center",
                          }}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic", margin: 0 }}>
                    No cities hidden yet
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* ═══ SECTION 4: ADVANCED PRIVACY ═══ */}
        <div>
          <SectionLabel>Advanced Privacy</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Email Shield */}
            <Card>
              <div style={{ padding: "14px 16px" }}>
                {!emailPkg ? (
                  /* Locked state */
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 11,
                      background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <Mail size={16} color="#fbbf24" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Email Shield</p>
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: "#fbbf24",
                          background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)",
                          borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em",
                        }}>$2.99/mo</span>
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", margin: 0 }}>
                        Block up to 3 email addresses
                      </p>
                    </div>
                    <button
                      onClick={handleActivateEmailPkg}
                      style={{
                        height: 30, borderRadius: 8, padding: "0 12px",
                        background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)",
                        color: "#fbbf24", fontSize: 11, fontWeight: 800, cursor: "pointer", flexShrink: 0,
                      }}
                    >
                      Activate
                    </button>
                  </div>
                ) : (
                  /* Purchased state */
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 11,
                        background: a.glow(0.1), border: `1px solid ${a.glow(0.22)}`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Mail size={16} color={a.accent} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Email Shield</p>
                          <span style={{
                            fontSize: 9, fontWeight: 800, color: a.accent,
                            background: a.glow(0.12), border: `1px solid ${a.glow(0.3)}`,
                            borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em",
                          }}>ACTIVE</span>
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", margin: "2px 0 0" }}>
                          {blockedEmails.length}/3 emails blocked
                        </p>
                      </div>
                      {blockedEmails.length < 3 && (
                        <button
                          onClick={() => setShowAddEmailModal(true)}
                          style={{
                            width: 34, height: 34, borderRadius: 9, border: `1px solid ${a.glow(0.3)}`,
                            background: a.glow(0.1), color: a.accent, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}
                        >
                          <Plus size={15} />
                        </button>
                      )}
                    </div>
                    {blockedEmails.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {blockedEmails.map((email) => (
                          <Chip key={email} label={email} onRemove={() => removeEmail(email)} accent={a.accent} glow={a.glow} />
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontStyle: "italic", margin: 0 }}>
                        No emails blocked yet
                      </p>
                    )}
                  </>
                )}
              </div>
            </Card>

            {/* ═══ SECTION 5: NO VACANCY PHONE BLOCKING ═══ */}

            {/* Shield inactive */}
            {pkg === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  background: "rgba(4,8,4,0.88)",
                  border: `1px solid ${a.glow(0.25)}`,
                  borderRadius: 18, padding: "26px 20px 22px",
                  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                  boxShadow: `0 0 50px ${a.glow(0.06)}, 0 20px 40px rgba(0,0,0,0.45)`,
                  textAlign: "center",
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 3,
                  background: `linear-gradient(90deg, #16a34a, ${a.accent}, #22c55e)`,
                }} />
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                  style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}
                >
                  <img src={SHIELD_LOGO} alt="shield" style={{ width: 100, height: 100, objectFit: "contain", filter: `drop-shadow(0 0 18px ${a.glow(0.45)})` }} />
                </motion.div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
                  No Vacancy — Phone Blocking
                </h2>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 18px", lineHeight: 1.65 }}>
                  Choose a No Vacancy plan to turn away specific guests by WhatsApp number. They'll be told the hotel is full — they'll never know it's personal.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20, textAlign: "left" }}>
                  {[
                    { icon: "🚪", text: "Turn away any guest by number — no room for them" },
                    { icon: "👻", text: "Turned-away guests see No Vacancy — never know it's personal" },
                    { icon: "🔒", text: "Active while your membership is active" },
                    { icon: "🌍", text: "Works globally — any country code" },
                  ].map(({ icon, text }) => (
                    <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {icon === "👻"
                        ? <img src={GHOST_LOGO} alt="" style={{ width: 30, height: 30, objectFit: "contain", flexShrink: 0 }} />
                        : <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                      }
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${a.glow(0.18)}, transparent)`, marginBottom: 16 }} />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -1 }}
                  onClick={() => setShowPurchase(true)}
                  style={{
                    width: "100%", height: 50, borderRadius: 50, border: "none",
                    background: a.gradient,
                    color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer",
                    letterSpacing: "0.04em",
                    boxShadow: `0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 24px ${a.glowMid(0.42)}`,
                    position: "relative", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <div style={{
                    position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)",
                    borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
                  }} />
                  <img src={SHIELD_LOGO} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
                  Hang the No Vacancy Sign
                </motion.button>
              </motion.div>
            )}

            {/* Shield active */}
            {pkg > 0 && (() => {
              const activePkg = PACKAGES.find((p) => p.key === pkg)!;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Active status card */}
                  <Card>
                    <div style={{
                      padding: "14px 16px",
                      borderBottom: `1px solid ${activePkg.border}22`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <img src={SHIELD_LOGO} alt="shield" style={{ width: 40, height: 40, objectFit: "contain" }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 900, color: activePkg.color, margin: "0 0 2px" }}>
                              {activePkg.name} — Active
                            </p>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", margin: 0 }}>
                              {slotsUsed} of {slotsTotal} slots used
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          {Array.from({ length: slotsTotal }).map((_, i) => (
                            <div key={i} style={{
                              width: 10, height: 10, borderRadius: "50%",
                              background: i < slotsUsed ? activePkg.color : "rgba(255,255,255,0.1)",
                              boxShadow: i < slotsUsed ? `0 0 6px ${activePkg.glow}` : "none",
                            }} />
                          ))}
                        </div>
                      </div>
                      {pkg < 6 && (
                        <button
                          onClick={() => setShowPurchase(true)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            color: a.glow(0.6), fontSize: 11, fontWeight: 700, padding: 0,
                          }}
                        >
                          More No Vacancy slots →
                        </button>
                      )}
                    </div>

                    <div style={{ padding: "10px 16px 14px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
                        No Vacancy List
                      </p>

                      {blocked.length === 0 ? (
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: "0 0 10px", fontStyle: "italic" }}>
                          No guests turned away yet — hotel open to all
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                          {blocked.map((num) => {
                            const cc = COUNTRY_CODES.find((c) => num.startsWith(c.code)) || COUNTRY_CODES[0];
                            const local = num.slice(cc.code.length);
                            return (
                              <div key={num} style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 12, padding: "10px 12px",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{
                                    width: 34, height: 34, borderRadius: "50%",
                                    background: a.glow(0.07), border: `1px solid ${a.glow(0.18)}`,
                                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
                                  }}>
                                    {cc.flag}
                                  </div>
                                  <div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 1px" }}>{cc.code} {local}</p>
                                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", margin: 0 }}>{cc.name} · No Vacancy</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => setConfirmDelete(num)}
                                  style={{
                                    width: 30, height: 30, borderRadius: 8,
                                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    cursor: "pointer", color: "#ef4444",
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {slotsUsed < slotsTotal && (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShowAddPhoneModal(true)}
                          style={{
                            width: "100%", height: 46, borderRadius: 12,
                            background: a.glow(0.08), border: `1px solid ${a.glow(0.28)}`,
                            color: a.accent, fontSize: 13, fontWeight: 800,
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          }}
                        >
                          <Plus size={15} />
                          Add Guest to No Vacancy
                        </motion.button>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })()}
          </div>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════
          MODALS
      ═════════════════════════════════════════════════════════════ */}

      {/* ── Country block sheet ── */}
      <AnimatePresence>
        {showCountryBlockSheet && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCountryBlockSheet(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(6,6,10,0.98)",
                borderRadius: "20px 20px 0 0",
                border: `1px solid ${a.glow(0.15)}`, borderBottom: "none",
                maxHeight: "78dvh", display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, #16a34a, ${a.accent}, #22c55e)`, borderRadius: "4px 4px 0 0" }} />
              <div style={{ padding: "14px 18px 10px", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Block Countries</h3>
                  <span style={{ fontSize: 12, color: a.glow(0.7), fontWeight: 700 }}>
                    {blockedCountries.length} selected
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 12px" }}>
                  Users from these countries won't be able to view your profile.
                </p>
                <input
                  type="text"
                  placeholder="Search country…"
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  style={{
                    width: "100%", height: 38, borderRadius: 10,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: 13, paddingLeft: 12,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "none" as const }}>
                {filteredCountries.map((c) => {
                  const selected = blockedCountries.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      onClick={() => toggleCountry(c.name)}
                      style={{
                        width: "100%", padding: "11px 18px",
                        background: selected ? a.glow(0.08) : "transparent",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{c.flag}</span>
                      <span style={{ flex: 1, fontSize: 14, color: selected ? a.accent : "rgba(255,255,255,0.8)", fontWeight: selected ? 700 : 500 }}>{c.name}</span>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        border: selected ? "none" : "1.5px solid rgba(255,255,255,0.2)",
                        background: selected ? a.accentMid : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {selected && <span style={{ color: "#fff", fontSize: 13, lineHeight: 1 }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div style={{ padding: "12px 18px max(20px, env(safe-area-inset-bottom, 20px))", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button
                  onClick={() => setShowCountryBlockSheet(false)}
                  style={{
                    width: "100%", height: 48, borderRadius: 50, border: "none",
                    background: a.gradient,
                    color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
                    boxShadow: `0 4px 16px ${a.glowMid(0.4)}`,
                  }}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add phone number modal ── */}
      <AnimatePresence>
        {showAddPhoneModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddPhoneModal(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(6,6,10,0.98)",
                borderRadius: "20px 20px 0 0",
                border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
                padding: "20px 18px max(28px, env(safe-area-inset-bottom, 28px))",
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, #16a34a, ${a.accent}, #22c55e)`, borderRadius: 4, marginBottom: 18, marginLeft: -18, marginRight: -18, marginTop: -20 }} />
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>No Vacancy — Block by Phone</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 18px" }}>
                They'll be told the hotel is full. They'll never know it's personal.
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <button
                  onClick={() => setShowCountryPicker(true)}
                  style={{
                    height: 46, borderRadius: 12, padding: "0 12px",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", gap: 6,
                    cursor: "pointer", flexShrink: 0, color: "#fff",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{countryCode.flag}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{countryCode.code}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>▾</span>
                </button>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    type="tel" inputMode="numeric"
                    placeholder="8xx xxxx xxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    autoFocus
                    style={{
                      width: "100%", height: 46, borderRadius: 12,
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                      color: "#fff", fontSize: 15, paddingLeft: 16, paddingRight: 44,
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <Phone size={15} style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.3)", pointerEvents: "none",
                  }} />
                </div>
              </div>
              {blocked.includes(fullNew) && (
                <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 10px" }}>
                  This number is already blocked.
                </p>
              )}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddPhone}
                disabled={!canAddPhone}
                style={{
                  width: "100%", height: 46, borderRadius: 50, border: "none",
                  background: canAddPhone ? a.gradient : "rgba(255,255,255,0.07)",
                  color: canAddPhone ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: 14, fontWeight: 900, cursor: canAddPhone ? "pointer" : "default",
                  transition: "all 0.2s",
                }}
              >
                Set No Vacancy
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Country picker (for phone modal) ── */}
      <AnimatePresence>
        {showCountryPicker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCountryPicker(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 300,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(8,8,12,0.98)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "18px 18px 0 0",
                padding: "10px 0 max(20px, env(safe-area-inset-bottom, 20px))",
                maxHeight: "60dvh", overflowY: "auto",
              }}
            >
              <p style={{ margin: "8px 0 12px", fontSize: 14, fontWeight: 800, color: "#fff", textAlign: "center" }}>
                Select Country
              </p>
              {COUNTRY_CODES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => { setCountryCode(c); setShowCountryPicker(false); }}
                  style={{
                    width: "100%", padding: "13px 20px",
                    background: countryCode.code === c.code ? a.glow(0.08) : "transparent",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{c.flag}</span>
                  <span style={{ flex: 1, fontSize: 14, color: "#fff", fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{c.code}</span>
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm delete phone ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 400,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 320,
                background: "rgba(8,8,12,0.98)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 18, padding: "22px 20px", textAlign: "center",
              }}
            >
              <div style={{ fontSize: 34, marginBottom: 10 }}>🗑️</div>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 8px" }}>Open a Room Again?</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>
                This guest will be able to contact you again.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setConfirmDelete(null)}
                  style={{
                    flex: 1, height: 42, borderRadius: 50,
                    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePhone(confirmDelete)}
                  style={{
                    flex: 1, height: 42, borderRadius: 50, border: "none",
                    background: "linear-gradient(to bottom, #f87171, #ef4444)",
                    color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(239,68,68,0.4)",
                  }}
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── No Vacancy packages sheet ── */}
      <AnimatePresence>
        {showPurchase && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPurchase(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.82)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(4,6,4,0.98)",
                borderRadius: "22px 22px 0 0",
                border: `1px solid ${a.glow(0.18)}`, borderBottom: "none",
                padding: "6px 18px max(32px, env(safe-area-inset-bottom, 32px))",
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, #16a34a, ${a.accent}, #22c55e)`, borderRadius: "4px 4px 0 0", marginLeft: -18, marginRight: -18 }} />
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 18px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px", color: "#fff" }}>Set Your No Vacancy</h3>
              <p style={{ fontSize: 12, color: a.glow(0.7), margin: "0 0 18px", fontWeight: 600 }}>
                Active with membership · 1 month per connection payment
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {PACKAGES.filter((p) => p.key > pkg).map((p) => (
                  <motion.button
                    key={p.key}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleBuy(p.key)}
                    style={{
                      width: "100%", borderRadius: 16, padding: "16px 18px",
                      background: p.bg, border: `1px solid ${p.border}`,
                      cursor: "pointer", textAlign: "left", position: "relative",
                      boxShadow: `0 0 24px ${p.glow}18`,
                    }}
                  >
                    {p.badge && (
                      <div style={{
                        position: "absolute", top: 12, right: 12,
                        background: p.color, borderRadius: 6,
                        padding: "2px 8px", fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: "0.06em",
                      }}>
                        {p.badge}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: "0 0 3px", display: "flex", alignItems: "center", gap: 4 }}>
                          {Array.from({ length: Math.min(p.shieldCount, 3) }).map((_, i) => (
                            <img key={i} src={SHIELD_LOGO} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
                          ))}
                          {p.name}
                        </p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}>{p.desc}</p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                          <span style={{ fontSize: 20, fontWeight: 900, color: p.color }}>{p.idr}</span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>IDR</span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>· {p.usd}</span>
                        </div>
                      </div>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: p.gradient, flexShrink: 0, marginLeft: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 4px 14px ${p.glow}`,
                      }}>
                        <span style={{ color: "#fff", fontSize: 16, fontWeight: 900 }}>→</span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Guest ID modal ── */}
      <AnimatePresence>
        {showAddGuestModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowAddGuestModal(false); setNewGuestSuffix(""); }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(6,6,10,0.98)",
                borderRadius: "20px 20px 0 0",
                border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
                padding: "20px 18px max(28px, env(safe-area-inset-bottom, 28px))",
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, ${a.accent}, #ef4444, ${a.accent})`, borderRadius: 4, marginBottom: 18, marginLeft: -18, marginRight: -18, marginTop: -20 }} />

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Block Guest ID</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 18px" }}>
                Enter the 4-digit number after "Guest-". They'll see No Vacancy.
              </p>

              <div style={{ position: "relative", marginBottom: 14 }}>
                <div style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.35)", pointerEvents: "none",
                  userSelect: "none",
                }}>
                  Guest-
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="e.g. 1234"
                  value={guestSuffixClean}
                  onChange={(e) => setNewGuestSuffix(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  autoFocus
                  style={{
                    width: "100%", height: 46, borderRadius: 12,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff", fontSize: 15,
                    paddingLeft: 74, paddingRight: 16,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              {guestSuffixClean.length === 4 && blockedGuestIds.includes(fullGuestId) && (
                <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 10px" }}>
                  {fullGuestId} is already blocked.
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddGuest}
                disabled={!canAddGuest}
                style={{
                  width: "100%", height: 46, borderRadius: 50, border: "none",
                  background: canAddGuest
                    ? "linear-gradient(to bottom, #f87171, #ef4444, #dc2626)"
                    : "rgba(255,255,255,0.07)",
                  color: canAddGuest ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: 14, fontWeight: 900, cursor: canAddGuest ? "pointer" : "default",
                  boxShadow: canAddGuest ? "0 4px 16px rgba(239,68,68,0.4)" : "none",
                  transition: "all 0.2s", marginBottom: 10,
                }}
              >
                Block Guest
              </motion.button>

              <button
                onClick={() => { setShowAddGuestModal(false); setNewGuestSuffix(""); }}
                style={{
                  width: "100%", background: "none", border: "none",
                  color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", padding: "6px 0",
                }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Email modal ── */}
      <AnimatePresence>
        {showAddEmailModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { setShowAddEmailModal(false); setNewEmail(""); }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(6,6,10,0.98)",
                borderRadius: "20px 20px 0 0",
                border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
                padding: "20px 18px max(28px, env(safe-area-inset-bottom, 28px))",
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, ${a.accent}, #fbbf24, ${a.accent})`, borderRadius: 4, marginBottom: 18, marginLeft: -18, marginRight: -18, marginTop: -20 }} />

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Block Email Address</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 18px" }}>
                This email address will be blocked from contacting you.
              </p>

              <div style={{ position: "relative", marginBottom: 14 }}>
                <input
                  type="email"
                  inputMode="email"
                  placeholder="name@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%", height: 46, borderRadius: 12,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff", fontSize: 15, paddingLeft: 16, paddingRight: 44,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
                <Mail size={15} style={{
                  position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.3)", pointerEvents: "none",
                }} />
              </div>

              {blockedEmails.includes(newEmail.trim()) && (
                <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 10px" }}>
                  This email is already blocked.
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAddEmail}
                disabled={!canAddEmail}
                style={{
                  width: "100%", height: 46, borderRadius: 50, border: "none",
                  background: canAddEmail ? a.gradient : "rgba(255,255,255,0.07)",
                  color: canAddEmail ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: 14, fontWeight: 900, cursor: canAddEmail ? "pointer" : "default",
                  transition: "all 0.2s", marginBottom: 10,
                }}
              >
                Block Email
              </motion.button>

              <button
                onClick={() => { setShowAddEmailModal(false); setNewEmail(""); }}
                style={{
                  width: "100%", background: "none", border: "none",
                  color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", padding: "6px 0",
                }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
