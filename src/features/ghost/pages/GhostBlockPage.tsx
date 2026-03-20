import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, ArrowRight, Phone, X, Globe, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SHIELD_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdfsdsdsddsdf.png";
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
    name: "Shield 1",
    shieldCount: 1,
    desc: "Block 1 number",
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
    name: "Shield 3",
    shieldCount: 3,
    desc: "Block up to 3 numbers",
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
    name: "Shield 6",
    shieldCount: 6,
    desc: "Block up to 6 numbers",
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

export default function GhostBlockPage() {
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<number>(getBlockPackage);
  const [blocked, setBlocked] = useState<string[]>(getBlockedNumbers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Free features
  const [blockedCountries, setBlockedCountries] = useState<string[]>(getBlockedCountries);
  const [hiddenCities, setHiddenCities] = useState<string[]>(getHiddenCities);
  const [newCity, setNewCity] = useState("");
  const [showCountryBlockSheet, setShowCountryBlockSheet] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const cleanNew = newPhone.replace(/\D/g, "");
  const fullNew = countryCode.code + cleanNew;
  const canAdd = cleanNew.length >= 8 && blocked.length < pkg && !blocked.includes(fullNew);

  const handleBuy = (slots: number) => {
    try {
      localStorage.setItem("ghost_block_package", String(slots));
      localStorage.setItem("ghost_block_until", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
    } catch {}
    setPkg(slots);
    setShowPurchase(false);
  };

  const handleAdd = () => {
    if (!canAdd) return;
    const next = [...blocked, fullNew];
    setBlocked(next);
    saveBlockedNumbers(next);
    setNewPhone("");
    setShowAddModal(false);
  };

  const handleDelete = (num: string) => {
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

  const filteredCountries = ALL_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // First-entry welcome popup
  const [showShieldWelcome, setShowShieldWelcome] = useState(false);
  useEffect(() => {
    if (!sessionStorage.getItem("ghost_shield_welcome_seen")) {
      const t = setTimeout(() => {
        setShowShieldWelcome(true);
        sessionStorage.setItem("ghost_shield_welcome_seen", "1");
      }, 600);
      return () => clearTimeout(t);
    }
  }, []);

  const slotsUsed = blocked.length;
  const slotsTotal = pkg;

  return (
    <div style={{
      minHeight: "100dvh", color: "#fff", position: "relative",
      backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/vxcvxcvxcv.png)",
      backgroundSize: "cover", backgroundPosition: "center top", backgroundAttachment: "fixed",
    }}>

      {/* Dark overlay */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(4,5,8,0.78)", zIndex: 0, pointerEvents: "none" }} />

      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(4,5,8,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(74,222,128,0.12)",
        padding: "max(14px, env(safe-area-inset-top, 14px)) 16px 14px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.6)",
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Ghost Mode Shield</h1>
          <p style={{ fontSize: 10, color: "rgba(74,222,128,0.7)", margin: 0, fontWeight: 600 }}>Secure 2Ghost House from unwanted traffic entering</p>
        </div>
        <img src={SHIELD_LOGO} alt="shield" style={{ width: 64, height: 64, objectFit: "contain" }} />
      </div>

      {/* ── Main scrollable content ── */}
      <div style={{ position: "relative", zIndex: 1, padding: "16px 16px 40px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── Intro text ── */}
        <div style={{
          background: "rgba(4,8,4,0.75)", border: "1px solid rgba(74,222,128,0.15)",
          borderRadius: 14, padding: "14px 16px",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <img src={SHIELD_LOGO} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
            <p style={{ fontSize: 13, fontWeight: 900, color: "#4ade80", margin: 0 }}>How Shield Protects You</p>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.7 }}>
            Ghost Shield is your invisible security layer. Block specific numbers from entering your Ghost House, stop likes from entire countries, and hide your profile from cities you choose — all without anyone knowing. Blocked users see only a server error, never the truth.
          </p>
        </div>

        {/* ── FREE: Block Likes from Countries ── */}
        <div style={{
          background: "rgba(4,8,4,0.75)", border: "1px solid rgba(74,222,128,0.18)",
          borderRadius: 16, overflow: "hidden",
          backdropFilter: "blur(10px)",
        }}>
          {/* Section header */}
          <div style={{
            padding: "14px 16px",
            borderBottom: blockedCountries.length > 0 ? "1px solid rgba(74,222,128,0.1)" : "none",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Globe size={16} color="#4ade80" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: 0 }}>Block Likes from Countries</p>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: "#4ade80",
                  background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)",
                  borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em",
                }}>FREE</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "1px 0 0" }}>
                {blockedCountries.length === 0
                  ? "No countries blocked · likes from everywhere allowed"
                  : `${blockedCountries.length} countr${blockedCountries.length === 1 ? "y" : "ies"} blocked`}
              </p>
            </div>
            <button
              onClick={() => setShowCountryBlockSheet(true)}
              style={{
                height: 32, borderRadius: 8, padding: "0 12px",
                background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)",
                color: "#4ade80", fontSize: 12, fontWeight: 800, cursor: "pointer",
              }}
            >
              {blockedCountries.length === 0 ? "Set Up" : "Edit"}
            </button>
          </div>

          {/* Blocked country chips */}
          {blockedCountries.length > 0 && (
            <div style={{ padding: "10px 16px 14px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {blockedCountries.map((name) => {
                const c = ALL_COUNTRIES.find((x) => x.name === name);
                return (
                  <div key={name} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
                    borderRadius: 20, padding: "4px 10px 4px 8px",
                  }}>
                    <span style={{ fontSize: 14 }}>{c?.flag}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{name}</span>
                    <button
                      onClick={() => toggleCountry(name)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "rgba(255,255,255,0.3)", padding: 0, marginLeft: 2,
                        display: "flex", alignItems: "center",
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FREE: Hide from Cities ── */}
        <div style={{
          background: "rgba(4,8,4,0.75)", border: "1px solid rgba(74,222,128,0.18)",
          borderRadius: 16, overflow: "hidden",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <MapPin size={16} color="#4ade80" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: 0 }}>Hide from Cities</p>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: "#4ade80",
                  background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)",
                  borderRadius: 4, padding: "1px 6px", letterSpacing: "0.06em",
                }}>FREE</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "1px 0 0" }}>
                Your profile won't appear to users in these cities
              </p>
            </div>
          </div>

          {/* City input row */}
          <div style={{ padding: "12px 16px 0", display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Enter city name…"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addCity(); }}
              style={{
                flex: 1, height: 40, borderRadius: 10,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 13, paddingLeft: 12, paddingRight: 12,
                outline: "none", boxSizing: "border-box",
              }}
            />
            <button
              onClick={addCity}
              disabled={!newCity.trim() || hiddenCities.includes(newCity.trim())}
              style={{
                width: 40, height: 40, borderRadius: 10, border: "none",
                background: newCity.trim() && !hiddenCities.includes(newCity.trim())
                  ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.05)",
                color: newCity.trim() && !hiddenCities.includes(newCity.trim())
                  ? "#4ade80" : "rgba(255,255,255,0.2)",
                cursor: newCity.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* City chips */}
          {hiddenCities.length > 0 ? (
            <div style={{ padding: "10px 16px 14px", display: "flex", flexWrap: "wrap", gap: 6 }}>
              {hiddenCities.map((city) => (
                <div key={city} style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
                  borderRadius: 20, padding: "4px 10px 4px 10px",
                }}>
                  <MapPin size={10} color="rgba(74,222,128,0.6)" />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{city}</span>
                  <button
                    onClick={() => removeCity(city)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(255,255,255,0.3)", padding: 0, marginLeft: 2,
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "10px 16px 14px" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0, fontStyle: "italic" }}>
                No cities hidden yet · your profile is visible everywhere
              </p>
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ flex: 1, height: 1, background: "rgba(74,222,128,0.1)" }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Number Shield</span>
          <div style={{ flex: 1, height: 1, background: "rgba(74,222,128,0.1)" }} />
        </div>

        {/* ── Shield inactive — show info card + activate CTA ── */}
        {pkg === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              background: "rgba(4,8,4,0.82)",
              border: "1px solid rgba(74,222,128,0.3)",
              borderRadius: 24, padding: "28px 22px 24px",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              boxShadow: "0 0 60px rgba(74,222,128,0.08), 0 24px 48px rgba(0,0,0,0.5)",
              textAlign: "center",
            }}
          >
            {/* Top accent */}
            <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)", borderRadius: "4px 4px 0 0", marginBottom: 24, marginLeft: -22, marginRight: -22, marginTop: -28 }} />

            {/* Icon */}
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}
            >
              <img src={SHIELD_LOGO} alt="shield" style={{ width: 120, height: 120, objectFit: "contain", filter: "drop-shadow(0 0 18px rgba(74,222,128,0.45))" }} />
            </motion.div>

            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
              Block Specific Numbers
            </h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 20px", lineHeight: 1.7 }}>
              Choose a Shield plan to block specific WhatsApp numbers from entering your Ghost House. They'll see a server error — they'll never know they're blocked.
            </p>

            {/* Feature points */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22, textAlign: "left" }}>
              {[
                { icon: "🚫", text: "Block any WhatsApp number from entering the house" },
                { icon: "👻", text: "Blocked ghosts see a server error — never know they're blocked" },
                { icon: "🔒", text: "Active while your Ghost membership is active" },
                { icon: "📅", text: "1 month Shield included with every pay-per-connection" },
                { icon: "🌍", text: "Works globally — any country code" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{icon === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 36, height: 36, objectFit: "contain", verticalAlign: "middle" }} /> : icon}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.2), transparent)", marginBottom: 18 }} />

            {/* Activate Now CTA */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -1 }}
              onClick={() => setShowPurchase(true)}
              style={{
                width: "100%", height: 52, borderRadius: 50, border: "none",
                background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
                color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
                letterSpacing: "0.04em",
                boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 28px rgba(34,197,94,0.45)",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
                background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)",
                borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
              }} />
              <img src={SHIELD_LOGO} alt="" style={{ width: 32, height: 32, objectFit: "contain", verticalAlign: "middle", marginRight: 8 }} />
              Activate Shield Now
            </motion.button>

            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "10px 0 0", lineHeight: 1.6 }}>
              Shield stays active with your membership or 1 month per connection
            </p>
          </motion.div>
        )}

        {/* ── Active shield — blocked numbers management ── */}
        {pkg > 0 && (
          <>
            {/* Active status card */}
            {(() => {
              const activePkg = PACKAGES.find((p) => p.key === pkg)!;
              return (
                <div style={{
                  background: "rgba(4,8,4,0.82)",
                  border: `1px solid ${activePkg.border}`,
                  borderRadius: 18, padding: "16px 18px",
                  backdropFilter: "blur(12px)",
                  boxShadow: `0 0 30px ${activePkg.glow}22`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <img src={SHIELD_LOGO} alt="shield" style={{ width: 44, height: 44, objectFit: "contain" }} />
                        <p style={{ fontSize: 14, fontWeight: 900, color: activePkg.color, margin: 0 }}>
                          {activePkg.name} — Active
                        </p>
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                        {slotsUsed} of {slotsTotal} slots used · active with membership
                      </p>
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
                        color: "rgba(74,222,128,0.6)", fontSize: 11, fontWeight: 700, padding: 0,
                      }}
                    >
                      Upgrade Shield ↑
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Blocked numbers */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
              Blocked Numbers
            </p>

            {blocked.length === 0 && (
              <div style={{
                background: "rgba(4,8,4,0.7)", border: "1px solid rgba(74,222,128,0.1)",
                borderRadius: 14, padding: "20px 16px", textAlign: "center",
                backdropFilter: "blur(8px)",
              }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>No numbers blocked yet</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {blocked.map((num) => {
                const cc = COUNTRY_CODES.find((c) => num.startsWith(c.code)) || COUNTRY_CODES[0];
                const local = num.slice(cc.code.length);
                return (
                  <div key={num} style={{
                    background: "rgba(4,8,4,0.75)", border: "1px solid rgba(74,222,128,0.12)",
                    borderRadius: 12, padding: "12px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    backdropFilter: "blur(8px)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                      }}>
                        {cc.flag}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 1px" }}>{cc.code} {local}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>{cc.name} · Blocked</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmDelete(num)}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", color: "#ef4444",
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {slotsUsed < slotsTotal && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAddModal(true)}
                style={{
                  width: "100%", height: 50, borderRadius: 14,
                  background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)",
                  color: "#4ade80", fontSize: 14, fontWeight: 800,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Plus size={16} />
                Add Number to Block
              </motion.button>
            )}
          </>
        )}
      </div>

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
                border: "1px solid rgba(74,222,128,0.15)", borderBottom: "none",
                maxHeight: "78dvh", display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)", borderRadius: "4px 4px 0 0" }} />
              <div style={{ padding: "14px 18px 10px", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Block Countries</h3>
                  <span style={{ fontSize: 12, color: "rgba(74,222,128,0.7)", fontWeight: 700 }}>
                    {blockedCountries.length} selected
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 12px" }}>
                  Users from these countries won't be able to like your profile.
                </p>
                {/* Search */}
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

              {/* Country list */}
              <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "none" as const }}>
                {filteredCountries.map((c) => {
                  const selected = blockedCountries.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      onClick={() => toggleCountry(c.name)}
                      style={{
                        width: "100%", padding: "11px 18px",
                        background: selected ? "rgba(74,222,128,0.08)" : "transparent",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{c.flag}</span>
                      <span style={{ flex: 1, fontSize: 14, color: selected ? "#4ade80" : "rgba(255,255,255,0.8)", fontWeight: selected ? 700 : 500 }}>{c.name}</span>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                        border: selected ? "none" : "1.5px solid rgba(255,255,255,0.2)",
                        background: selected ? "#22c55e" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {selected && <span style={{ color: "#fff", fontSize: 13, lineHeight: 1 }}>✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Done button */}
              <div style={{ padding: "12px 18px max(20px, env(safe-area-inset-bottom, 20px))", flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <button
                  onClick={() => setShowCountryBlockSheet(false)}
                  style={{
                    width: "100%", height: 48, borderRadius: 50, border: "none",
                    background: "linear-gradient(to bottom, #4ade80, #22c55e, #16a34a)",
                    color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(34,197,94,0.4)",
                  }}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add number modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
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
              <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)", borderRadius: 4, marginBottom: 18, marginLeft: -18, marginRight: -18, marginTop: -20 }} />

              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Block a Number</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 18px" }}>
                <span>They will see a server error if they try to sign in.</span>
              </p>

              {/* Country code + phone row */}
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
                  <span>This number is already blocked.</span>
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                disabled={!canAdd}
                style={{
                  width: "100%", height: 46, borderRadius: 50, border: "none",
                  background: canAdd
                    ? "linear-gradient(to bottom, #86efac, #4ade80, #16a34a)"
                    : "rgba(255,255,255,0.07)",
                  color: canAdd ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: 14, fontWeight: 900, cursor: canAdd ? "pointer" : "default",
                  boxShadow: canAdd ? "0 4px 16px rgba(74,222,128,0.4)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <span>Block This Number</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Country picker (for phone add modal) ── */}
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
                <span>Select Country</span>
              </p>
              {COUNTRY_CODES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => { setCountryCode(c); setShowCountryPicker(false); }}
                  style={{
                    width: "100%", padding: "13px 20px",
                    background: countryCode.code === c.code ? "rgba(74,222,128,0.08)" : "transparent",
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

      {/* ── Confirm delete ── */}
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
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 8px" }}>Remove Block?</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>
                <span>This number will be able to sign in again.</span>
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
                  <span>Cancel</span>
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  style={{
                    flex: 1, height: 42, borderRadius: 50, border: "none",
                    background: "linear-gradient(to bottom, #f87171, #ef4444)",
                    color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(239,68,68,0.4)",
                  }}
                >
                  <span>Remove</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shield packages bottom sheet ── */}
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
                border: "1px solid rgba(74,222,128,0.18)", borderBottom: "none",
                padding: "6px 18px max(32px, env(safe-area-inset-bottom, 32px))",
              }}
            >
              {/* Top accent + handle */}
              <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)", borderRadius: "4px 4px 0 0", marginLeft: -18, marginRight: -18 }} />
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 18px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 4px", color: "#fff" }}>Choose Your Shield</h3>
              <p style={{ fontSize: 12, color: "rgba(74,222,128,0.7)", margin: "0 0 18px", fontWeight: 600 }}>
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
                            <img key={i} src={SHIELD_LOGO} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
                          ))}
                          {p.name}
                        </p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 8px" }}>{p.desc}</p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                          <span style={{ fontSize: 22, fontWeight: 900, color: p.color }}>{p.idr}</span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>IDR</span>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>· {p.usd}</span>
                        </div>
                        <p style={{ fontSize: 10, color: "rgba(74,222,128,0.55)", margin: "5px 0 0", fontWeight: 600 }}>
                          Active with membership · 1 month per connection
                        </p>
                      </div>
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: p.gradient, flexShrink: 0, marginLeft: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 4px 14px ${p.glow}`,
                      }}>
                        <ArrowRight size={16} color="#fff" strokeWidth={2.5} />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shield first-entry welcome popup ── */}
      <AnimatePresence>
        {showShieldWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShieldWelcome(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(4,8,4,0.97)",
                borderRadius: "24px 24px 0 0",
                border: "1px solid rgba(74,222,128,0.2)", borderBottom: "none",
                padding: "0 22px max(36px, env(safe-area-inset-bottom, 36px))",
                boxShadow: "0 -24px 80px rgba(0,0,0,0.7)",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, #15803d, #4ade80, #22c55e)", marginLeft: -22, marginRight: -22 }} />
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 18px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <img src={SHIELD_LOGO} alt="shield" style={{ width: 48, height: 48, objectFit: "contain" }} />
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.35 }}
                  style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0 }}
                >
                  Ghost Mode Shield
                </motion.h2>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18, duration: 0.35 }}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "0 0 18px" }}
              >
                Your privacy firewall. You control exactly who can reach you in the Ghost House — down to the country level.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.26, duration: 0.4 }}
                style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}
              >
                {[
                  { icon: "🌍", badge: "FREE", text: "Block likes from entire countries — if a region brings you bad energy, shut it off instantly" },
                  { icon: "📍", badge: "FREE", text: "Hide from cities — your profile won't appear in feeds from those areas" },
                  { icon: "📵", badge: "PAID", text: "Block specific WhatsApp numbers after connecting — they vanish from both feeds permanently" },
                ].map(({ icon, badge, text }) => (
                  <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ fontSize: 15, flexShrink: 0, lineHeight: 1.5 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
                        padding: "1px 6px", borderRadius: 4, marginRight: 6,
                        background: badge === "FREE" ? "rgba(74,222,128,0.12)" : "rgba(251,191,36,0.12)",
                        color: badge === "FREE" ? "#4ade80" : "#fbbf24",
                        border: `1px solid ${badge === "FREE" ? "rgba(74,222,128,0.25)" : "rgba(251,191,36,0.25)"}`,
                      }}>{badge}</span>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: "4px 0 0", lineHeight: 1.55 }}>{text}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.15), transparent)", marginBottom: 18 }} />

              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowShieldWelcome(false)}
                style={{
                  width: "100%", height: 52, borderRadius: 50, border: "none",
                  background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
                  color: "#fff", fontSize: 15, fontWeight: 900,
                  cursor: "pointer", letterSpacing: "0.03em",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 24px rgba(34,197,94,0.4)",
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
                Set Up My Shield →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
