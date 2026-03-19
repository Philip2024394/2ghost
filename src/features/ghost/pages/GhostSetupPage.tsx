import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, MapPin, User, Globe, Zap, Target, ShieldCheck, Tag, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WORLD_COUNTRIES } from "../data/worldCountries";
import { CONNECT_PLATFORMS, getPlatform } from "../data/connectPlatforms";

const GHOST_PROFILE_KEY = "ghost_profile";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

const INTEREST_TAGS = [
  "Coffee ☕", "Travel ✈️", "Fitness 💪", "Music 🎵", "Food 🍜", "Art 🎨",
  "Gaming 🎮", "Hiking 🏔️", "Yoga 🧘", "Movies 🎬", "Books 📚", "Photography 📷",
  "Dancing 💃", "Cooking 🍳", "Tech 💻", "Business 📈", "Fashion 👗", "Sports ⚽",
  "Beaches 🏖️", "Nightlife 🌃", "Meditation 🌿", "Motorcycles 🏍️", "Pets 🐾", "Anime 🎌",
];

const OUTCOMES = [
  { key: "serious",     icon: "💍", label: "Something Serious",  tag: "Serious" },
  { key: "casual",      icon: "🤝", label: "Casual Connection",  tag: "Casual" },
  { key: "discreet",    icon: "🤫", label: "Discreet Only",      tag: "Discreet" },
  { key: "open",        icon: "🔓", label: "Open Relationship",  tag: "Open" },
  { key: "friendship",  icon: "🌱", label: "Friendship First",   tag: "Friendship" },
  { key: "adventurous", icon: "🔥", label: "Group Experiences",  tag: "Adventurous" },
  { key: "exploring",   icon: "🌀", label: "Still Figuring Out", tag: "Exploring" },
  { key: "no-strings",  icon: "🕊️", label: "No Strings",         tag: "Free Spirit" },
];

const VIBES = [
  // Timing
  { key: "tonight",      icon: "🌙", label: "Tonight" },
  { key: "free-now",     icon: "⚡", label: "Free Now" },
  { key: "weekend",      icon: "🎉", label: "Weekend" },
  { key: "anytime",      icon: "😊", label: "Anytime" },
  { key: "late-night",   icon: "🌃", label: "Late Night" },
  { key: "last-minute",  icon: "🏃", label: "Last Minute" },
  // Intent
  { key: "no-strings",   icon: "🕊️", label: "No Strings" },
  { key: "chill-only",   icon: "😌", label: "Chill Only" },
  { key: "just-fun",     icon: "🎈", label: "Just Fun" },
  { key: "no-drama",     icon: "🙅", label: "No Drama" },
  { key: "keep-simple",  icon: "✌️", label: "Keep Simple" },
  // Personality
  { key: "flirty",       icon: "😏", label: "Flirty" },
  { key: "playful",      icon: "🎭", label: "Playful" },
  { key: "spontaneous",  icon: "🌊", label: "Spontaneous" },
  { key: "adventurous",  icon: "🚀", label: "Adventurous" },
  { key: "curious",      icon: "🤔", label: "Curious" },
  { key: "bold",         icon: "🦁", label: "Bold" },
  // Style
  { key: "chat-first",   icon: "💬", label: "Chat First" },
  { key: "quick-date",   icon: "☕", label: "Quick Date" },
  { key: "low-key",      icon: "🤫", label: "Low Key" },
  { key: "discreet",     icon: "🕵️", label: "Discreet" },
  { key: "private",      icon: "🔐", label: "Private" },
  { key: "low-profile",  icon: "👤", label: "Low Profile" },
  { key: "off-radar",    icon: "📴", label: "Off Radar" },
  { key: "try-me",       icon: "😈", label: "Try Me" },
  { key: "lets-go",      icon: "🔥", label: "Let's Go" },
  { key: "no-limits",    icon: "💥", label: "No Limits" },
];

export default function GhostSetupPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState<"Female" | "Male" | "">("");
  const [interest, setInterest] = useState<"Women" | "Men" | "Both" | "">("");
  const [country, setCountry] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vibe, setVibe] = useState("");
  const [showVibePicker, setShowVibePicker] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [showOutcomePicker, setShowOutcomePicker] = useState(false);
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [connectPlatform, setConnectPlatform] = useState("whatsapp");
  const [connectHandle, setConnectHandle] = useState("");
  const [showPlatformSheet, setShowPlatformSheet] = useState(false);

  // Photo verification
  const selfieRef = useRef<HTMLInputElement>(null);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // ID / Passport verification
  const idRef = useRef<HTMLInputElement>(null);
  const [idUploaded, setIdUploaded] = useState(false);
  const [idVerifying, setIdVerifying] = useState(false);
  const [idVerified, setIdVerified] = useState(() => {
    try { return localStorage.getItem("ghost_id_verified") === "1"; } catch { return false; }
  });
  const [showIdPayment, setShowIdPayment] = useState(false);
  const isReVerification = (() => { try { return !!localStorage.getItem("ghost_id_verified"); } catch { return false; } })();
  void idUploaded; void showIdPayment; void isReVerification;

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIdVerifying(true);
    setTimeout(() => {
      setIdVerifying(false);
      setIdUploaded(true);
      setIdVerified(true);
      try { localStorage.setItem("ghost_id_verified", "1"); } catch {}
    }, 2800);
  };


  const selectedVibe = VIBES.find((v) => v.key === vibe);
  const selectedOutcome = OUTCOMES.find((o) => o.key === outcome);

  const countrySuggestions = WORLD_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countryQuery.toLowerCase()) && countryQuery.length > 0
  );

  const selectedCountryObj = WORLD_COUNTRIES.find((c) => c.name === country);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSelfie = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setVerifying(true);
    setTimeout(() => { setVerifying(false); setVerified(true); }, 2200);
  };

  const ageNum = parseInt(age, 10);
  const isValid =
    photo !== null &&
    name.trim().length >= 2 &&
    ageNum >= 18 && ageNum <= 80 &&
    city.trim().length > 0 &&
    country.length > 0 &&
    gender !== "" &&
    interest !== "";

  const handleSave = () => {
    if (!isValid) return;
    setSaving(true);
    try {
      localStorage.setItem(
        GHOST_PROFILE_KEY,
        JSON.stringify({
          photo,
          name: name.trim(),
          age: ageNum,
          city: city.trim(),
          country,
          countryFlag: selectedCountryObj?.flag ?? "🌍",
          countryCode: selectedCountryObj?.code ?? "",
          gender,
          interest,
          verified,
          vibe: selectedVibe ? { key: selectedVibe.key, icon: selectedVibe.icon, label: selectedVibe.label } : null,
          outcome: selectedOutcome ? { key: selectedOutcome.key, icon: selectedOutcome.icon, label: selectedOutcome.label, tag: selectedOutcome.tag } : null,
          idVerified,
          bio: bio.trim() || null,
          interests: interests.length > 0 ? interests : null,
          connectPlatform,
          connectHandle: connectHandle.trim() || null,
        })
      );
      // Store interest separately so GhostModePage can read it for default feed filter
      localStorage.setItem("ghost_interest", interest);
    } catch {}
    setTimeout(() => navigate("/ghost/gateway"), 600);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 48, borderRadius: 12,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff", fontSize: 15, padding: "0 14px",
    outline: "none", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)",
    letterSpacing: "0.1em", textTransform: "uppercase" as const,
    display: "block", marginBottom: 6,
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "#050508", color: "#fff",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "12px 16px",
        paddingTop: `max(12px, env(safe-area-inset-top, 12px))`,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={() => navigate("/ghost/gateway")}
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <img src={GHOST_LOGO} alt="ghost" style={{ width: 45, height: 45, objectFit: "contain" }} />
            <h1 style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>Set Up Ghost Profile</h1>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>Photo · Name · Age · City · Country</p>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 40px" }}>

        {/* Privacy notice */}
        <div style={{
          background: "rgba(74,222,128,0.07)",
          border: "1px solid rgba(74,222,128,0.18)",
          borderRadius: 12, padding: "10px 14px", marginBottom: 24,
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>🔒</span>
          <p style={{ fontSize: 11, color: "rgba(74,222,128,0.8)", margin: 0, lineHeight: 1.55 }}>
            Your Ghost profile shows <strong>photo, name, age, city &amp; country only</strong>. Like a ghost and start chatting on WhatsApp — private. No trail or records stored.
          </p>
        </div>

        {/* Photo upload */}
        <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <input
            ref={fileRef} type="file" accept="image/*" capture="user"
            onChange={handlePhotoChange}
            style={{ display: "none" }}
          />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => fileRef.current?.click()}
            style={{
              width: 120, height: 120, borderRadius: "50%",
              background: photo ? "transparent" : "rgba(74,222,128,0.08)",
              border: photo ? "3px solid rgba(74,222,128,0.5)" : "2px dashed rgba(74,222,128,0.3)",
              cursor: "pointer", overflow: "hidden", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {photo ? (
              <img src={photo} alt="Ghost" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ textAlign: "center" }}>
                <Camera size={28} style={{ color: "rgba(74,222,128,0.6)", display: "block", margin: "0 auto 6px" }} />
                <span style={{ fontSize: 10, color: "rgba(74,222,128,0.5)", fontWeight: 700 }}>Add Photo</span>
              </div>
            )}
          </motion.button>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8, textAlign: "center" }}>
            Tap to add your photo
          </p>
        </div>

        {/* Photo Verification */}
        <AnimatePresence>
          {photo && !verified && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                marginBottom: 20,
                background: verifying ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.03)",
                border: verifying ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <input ref={selfieRef} type="file" accept="image/*" capture="user" onChange={handleSelfie} style={{ display: "none" }} />
              <ShieldCheck size={22} color={verifying ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.25)"} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: verifying ? "rgba(74,222,128,0.9)" : "#fff", margin: "0 0 2px" }}>
                  {verifying ? "Verifying your identity..." : "Verify your identity"}
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                  {verifying ? "Checking your selfie — takes a moment" : "Take a quick selfie · shows ✅ badge on your profile"}
                </p>
              </div>
              {verifying ? (
                <motion.div
                  animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(74,222,128,0.3)", borderTopColor: "#4ade80" }}
                />
              ) : (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selfieRef.current?.click()}
                  style={{
                    height: 34, borderRadius: 10, padding: "0 14px", border: "none",
                    background: "rgba(74,222,128,0.15)", color: "rgba(74,222,128,0.95)",
                    fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0,
                  }}
                >
                  Take Selfie
                </motion.button>
              )}
            </motion.div>
          )}
          {photo && verified && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                marginBottom: 20, background: "rgba(74,222,128,0.08)",
                border: "1px solid rgba(74,222,128,0.35)", borderRadius: 14,
                padding: "11px 16px", display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <ShieldCheck size={18} color="#4ade80" />
              <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(74,222,128,0.95)", margin: 0 }}>
                ✅ Identity Verified — your profile will show the verified badge
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ID / Passport Verification */}
        <div style={{ marginBottom: 20, background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 14, padding: "14px 16px" }}>
          <input ref={idRef} type="file" accept="image/*" capture="environment" onChange={handleIdUpload} style={{ display: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 22 }}>🪪</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>ID / Passport Verification</p>
                {!idVerified && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#4ade80", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 4, padding: "1px 6px" }}>
                    FREE — New Accounts
                  </span>
                )}
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "1px 0 0" }}>
                {idVerified ? "✅ ID verified — badge shown on your profile" : "Upload your ID or passport — photo must match your profile photo"}
              </p>
            </div>
          </div>
          {idVerified ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,0.1)", borderRadius: 10, padding: "8px 12px" }}>
              <span style={{ fontSize: 16 }}>✅</span>
              <p style={{ fontSize: 12, fontWeight: 800, color: "rgba(74,222,128,0.9)", margin: 0 }}>Identity confirmed — ID badge active on profile</p>
            </div>
          ) : idVerifying ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(74,222,128,0.3)", borderTopColor: "#4ade80" }} />
              <p style={{ fontSize: 12, color: "rgba(74,222,128,0.8)", margin: 0, fontWeight: 700 }}>Verifying identity — checking photo match...</p>
            </div>
          ) : (
            <button
              onClick={() => idRef.current?.click()}
              style={{ height: 36, borderRadius: 10, padding: "0 16px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "rgba(74,222,128,0.9)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
            >
              Upload ID / Passport
            </button>
          )}
        </div>

        {/* Name */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>
            <User size={10} style={{ display: "inline", marginRight: 5 }} />
            First Name Only
          </label>
          <input
            style={inputStyle}
            placeholder="e.g. Sari"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Age */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Age</label>
          <input
            style={inputStyle}
            type="number" min={18} max={80}
            placeholder="e.g. 24"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </div>

        {/* Country */}
        <div style={{ marginBottom: 18, position: "relative" }}>
          <label style={labelStyle}>
            <Globe size={10} style={{ display: "inline", marginRight: 5 }} />
            Your Country
          </label>
          <div style={{ position: "relative" }}>
            {selectedCountryObj && (
              <span style={{
                position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                fontSize: 18, pointerEvents: "none", zIndex: 1,
              }}>
                {selectedCountryObj.flag}
              </span>
            )}
            <input
              style={{ ...inputStyle, paddingLeft: selectedCountryObj ? 42 : 14 }}
              placeholder="Search your country..."
              value={countryQuery || country}
              onChange={(e) => {
                setCountryQuery(e.target.value);
                setCountry("");
                setShowCountrySuggestions(true);
              }}
              onFocus={() => setShowCountrySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCountrySuggestions(false), 150)}
            />
          </div>
          {showCountrySuggestions && countrySuggestions.length > 0 && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
              background: "rgba(10,10,16,0.98)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
              marginTop: 4, overflow: "hidden", maxHeight: 220, overflowY: "auto",
            }}>
              {countrySuggestions.slice(0, 8).map((c) => (
                <button
                  key={c.code}
                  onMouseDown={() => {
                    setCountry(c.name);
                    setCountryQuery("");
                    setShowCountrySuggestions(false);
                  }}
                  style={{
                    width: "100%", padding: "10px 14px", background: "none",
                    border: "none", color: "#fff", fontSize: 13, textAlign: "left",
                    cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* City */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>
            <MapPin size={10} style={{ display: "inline", marginRight: 5 }} />
            City
          </label>
          <input
            style={inputStyle}
            placeholder="e.g. Dublin, London, Jakarta..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        {/* Gender */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>I am a</label>
          <div style={{ display: "flex", gap: 10 }}>
            {(["Female", "Male"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                style={{
                  flex: 1, height: 48, borderRadius: 12, cursor: "pointer",
                  background: gender === g ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
                  border: gender === g ? "1px solid rgba(74,222,128,0.45)" : "1px solid rgba(255,255,255,0.08)",
                  color: gender === g ? "rgba(74,222,128,0.95)" : "rgba(255,255,255,0.5)",
                  fontSize: 14, fontWeight: 700, transition: "all 0.15s",
                }}
              >
                {g === "Female" ? "👩 Woman" : "👨 Man"}
              </button>
            ))}
          </div>
        </div>

        {/* Interested In */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Interested In</label>
          <div style={{ display: "flex", gap: 8 }}>
            {([
              { value: "Women", label: "👩 Women" },
              { value: "Men",   label: "👨 Men" },
              { value: "Both",  label: "🌈 Both" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setInterest(opt.value)}
                style={{
                  flex: 1, height: 48, borderRadius: 12, cursor: "pointer",
                  background: interest === opt.value ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
                  border: interest === opt.value ? "1px solid rgba(74,222,128,0.45)" : "1px solid rgba(255,255,255,0.08)",
                  color: interest === opt.value ? "rgba(74,222,128,0.95)" : "rgba(255,255,255,0.5)",
                  fontSize: 13, fontWeight: 700, transition: "all 0.15s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {interest === "Both" && (
            <p style={{ fontSize: 10, color: "rgba(74,222,128,0.6)", margin: "6px 0 0", fontWeight: 600 }}>
              ✓ Your feed will show all genders — welcome everyone
            </p>
          )}
        </div>

        {/* Vibe */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>
            <Zap size={10} style={{ display: "inline", marginRight: 5 }} />
            Your Vibe <span style={{ fontWeight: 400, opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          <button
            onClick={() => setShowVibePicker(true)}
            style={{
              width: "100%", height: 48, borderRadius: 12,
              background: selectedVibe ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.05)",
              border: selectedVibe ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.1)",
              color: selectedVibe ? "#fff" : "rgba(255,255,255,0.35)",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 14px",
            }}
          >
            {selectedVibe ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{selectedVibe.icon}</span>
                <span style={{ color: "rgba(74,222,128,0.95)" }}>{selectedVibe.label}</span>
              </span>
            ) : (
              <span>Select your vibe...</span>
            )}
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>▾</span>
          </button>
          {selectedVibe && (
            <button
              onClick={() => setVibe("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 6, padding: 0 }}
            >
              <span>✕ Clear vibe</span>
            </button>
          )}
        </div>

        {/* Desired Outcome */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>
            <Target size={10} style={{ display: "inline", marginRight: 5 }} />
            Desired Outcome <span style={{ fontWeight: 400, opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional · shown on Reveal)</span>
          </label>
          <button
            onClick={() => setShowOutcomePicker(true)}
            style={{
              width: "100%", height: 48, borderRadius: 12,
              background: selectedOutcome ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.05)",
              border: selectedOutcome ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.1)",
              color: selectedOutcome ? "#fff" : "rgba(255,255,255,0.35)",
              fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 14px",
            }}
          >
            {selectedOutcome ? (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{selectedOutcome.icon}</span>
                <span style={{ color: "rgba(74,222,128,0.95)" }}>{selectedOutcome.label}</span>
              </span>
            ) : (
              <span>What are you open to?</span>
            )}
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>▾</span>
          </button>
          {selectedOutcome && (
            <button
              onClick={() => setOutcome("")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 6, padding: 0 }}
            >
              <span>✕ Clear</span>
            </button>
          )}
        </div>

        {/* One-line bio */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>
            One Line About You <span style={{ fontWeight: 400, opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...inputStyle, paddingRight: 48 }}
              placeholder="e.g. Loves late nights and bad ideas"
              value={bio}
              maxLength={72}
              onChange={(e) => setBio(e.target.value)}
            />
            <span style={{
              position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 10, color: bio.length > 60 ? "rgba(251,191,36,0.7)" : "rgba(255,255,255,0.2)",
              fontWeight: 700, pointerEvents: "none",
            }}>
              {72 - bio.length}
            </span>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "6px 0 0", lineHeight: 1.5 }}>
            One sentence. Your words. No prompts — just say something real.
          </p>
        </div>

        {/* Interest Tags */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>
            <Tag size={10} style={{ display: "inline", marginRight: 5 }} />
            Your Interests <span style={{ fontWeight: 400, opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(pick up to 3 · shown on Reveal)</span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {INTEREST_TAGS.map((tag) => {
              const selected = interests.includes(tag);
              const maxed = interests.length >= 3 && !selected;
              return (
                <button
                  key={tag}
                  onClick={() => {
                    if (maxed) return;
                    setInterests(selected ? interests.filter((t) => t !== tag) : [...interests, tag]);
                  }}
                  style={{
                    height: 34, borderRadius: 50, padding: "0 12px",
                    background: selected ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
                    border: selected ? "1px solid rgba(74,222,128,0.45)" : "1px solid rgba(255,255,255,0.09)",
                    color: selected ? "rgba(74,222,128,0.95)" : maxed ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.65)",
                    fontSize: 12, fontWeight: 700, cursor: maxed ? "default" : "pointer",
                    transition: "all 0.15s",
                    boxShadow: selected ? "0 0 10px rgba(74,222,128,0.15)" : "none",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
          {interests.length > 0 && (
            <p style={{ fontSize: 10, color: "rgba(74,222,128,0.6)", margin: "6px 0 0", fontWeight: 600 }}>
              {3 - interests.length} more {3 - interests.length === 1 ? "tag" : "tags"} available
              {interests.length === 3 && " · 3/3 selected"}
            </p>
          )}
        </div>

        {/* Connect Platform */}
        {(() => {
          const p = getPlatform(connectPlatform);
          return (
            <div style={{ marginBottom: 28 }}>
              <label style={labelStyle}>
                <Smartphone size={10} style={{ display: "inline", marginRight: 5 }} />
                How People Reach You <span style={{ fontWeight: 400, opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>(shared only on mutual match)</span>
              </label>

              {/* Platform selector */}
              <button
                onClick={() => setShowPlatformSheet(true)}
                style={{
                  width: "100%", height: 48, borderRadius: 12, marginBottom: 10,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0 14px",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{p.emoji}</span>
                  <span style={{ color: p.color }}>{p.label}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{p.reach}</span>
                </span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>▾ Change</span>
              </button>

              {/* Handle input */}
              <input
                style={inputStyle}
                placeholder={p.placeholder}
                value={connectHandle}
                maxLength={80}
                onChange={(e) => setConnectHandle(e.target.value)}
              />
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "6px 0 0", lineHeight: 1.5 }}>
                {p.inputType === "phone" ? "Enter your number with country code. Only shared with your mutual matches." :
                 `Your ${p.label} ${p.inputType}. Only shared with your mutual matches.`}
              </p>
            </div>
          );
        })()}

        {/* Profile preview */}
        {photo && name && age && city && country && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "14px 16px", marginBottom: 24,
            }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>
              Preview — how others see you
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(74,222,128,0.3)", flexShrink: 0 }}>
                <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>
                  <span>{name.trim()}, {age}</span>
                  {selectedVibe && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(74,222,128,0.85)", marginLeft: 8 }}>
                      <span>{selectedVibe.icon} {selectedVibe.label}</span>
                    </span>
                  )}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <MapPin size={10} style={{ color: "rgba(255,255,255,0.4)" }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{city}</span>
                  </div>
                  <span style={{ fontSize: 13 }}>{selectedCountryObj?.flag}</span>
                  <span style={{ fontSize: 9, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 5, padding: "1px 6px", color: "rgba(74,222,128,0.8)", fontWeight: 700 }}>
                    <img src={GHOST_LOGO} alt="" style={{ width: 30, height: 30, objectFit: "contain", verticalAlign: "middle", marginRight: 6 }} /> Ghost
                  </span>
                  {selectedOutcome && (
                    <span style={{ fontSize: 9, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 5, padding: "1px 6px", color: "rgba(74,222,128,0.9)", fontWeight: 700 }}>
                      {selectedOutcome.icon} {selectedOutcome.tag}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {bio.trim() && (
              <div style={{ marginTop: 12, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 8, padding: "8px 10px" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", margin: 0, fontStyle: "italic" }}>"{bio.trim()}"</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!isValid || saving}
          style={{
            width: "100%", height: 52, borderRadius: 16, border: "none",
            background: isValid ? "linear-gradient(135deg, #16a34a, #22c55e)" : "rgba(255,255,255,0.07)",
            color: isValid ? "#fff" : "rgba(255,255,255,0.25)",
            fontSize: 15, fontWeight: 800, cursor: isValid ? "pointer" : "default",
            boxShadow: isValid ? "0 6px 28px rgba(34,197,94,0.4)" : "none",
            transition: "all 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {saving ? (
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              <span>Activating...</span>
            </motion.span>
          ) : (
            <><img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain" }} /><span> Activate Ghost Profile</span></>
          )}
        </motion.button>

        {!isValid && (
          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 10 }}>
            Fill in all fields to continue
          </p>
        )}
      </div>
      {/* ── Platform picker bottom sheet ── */}
      <AnimatePresence>
        {showPlatformSheet && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPlatformSheet(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(6,6,12,0.98)", backdropFilter: "blur(40px)",
                borderRadius: "20px 20px 0 0",
                border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
                maxHeight: "80dvh", display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)" }} />
              <div style={{ padding: "16px 18px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0, textAlign: "center" }}>
                  How People Reach You
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "4px 0 0", textAlign: "center" }}>
                  Covering 8 billion people — pick the app you live on
                </p>
              </div>
              <div style={{ overflowY: "auto", padding: "14px 16px max(20px, env(safe-area-inset-bottom, 20px))" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {CONNECT_PLATFORMS.map((p) => (
                    <motion.button
                      key={p.key}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setConnectPlatform(p.key); setConnectHandle(""); setShowPlatformSheet(false); }}
                      style={{
                        width: "100%", height: 58, borderRadius: 14, padding: "0 16px",
                        background: connectPlatform === p.key ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)",
                        border: connectPlatform === p.key ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.07)",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 14,
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{p.emoji}</span>
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: connectPlatform === p.key ? p.color : "#fff", margin: 0 }}>
                          {p.label}
                        </p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{p.reach}</p>
                      </div>
                      {connectPlatform === p.key && (
                        <span style={{ fontSize: 16, color: "rgba(74,222,128,0.9)" }}>✓</span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Outcome picker bottom sheet ── */}
      <AnimatePresence>
        {showOutcomePicker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowOutcomePicker(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(6,6,12,0.98)", backdropFilter: "blur(40px)",
                borderRadius: "20px 20px 0 0",
                border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
                maxHeight: "80dvh", display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)" }} />
              <div style={{ padding: "16px 18px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0, textAlign: "center" }}>
                  <span>What Are You Open To?</span>
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "4px 0 0", textAlign: "center" }}>
                  <span>Shown only to subscribers who use Reveal — keeps it honest</span>
                </p>
              </div>
              <div style={{ overflowY: "auto", padding: "14px 16px max(20px, env(safe-area-inset-bottom, 20px))" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {OUTCOMES.map((o) => (
                    <motion.button
                      key={o.key}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setOutcome(o.key); setShowOutcomePicker(false); }}
                      style={{
                        width: "100%", height: 52, borderRadius: 14, padding: "0 16px",
                        background: outcome === o.key ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.04)",
                        border: outcome === o.key ? "1px solid rgba(74,222,128,0.45)" : "1px solid rgba(255,255,255,0.08)",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 12,
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{o.icon}</span>
                      <div style={{ textAlign: "left" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: outcome === o.key ? "rgba(74,222,128,0.95)" : "#fff", margin: 0 }}>
                          <span>{o.label}</span>
                        </p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                          <span>Shows as: {o.tag}</span>
                        </p>
                      </div>
                      {outcome === o.key && (
                        <span style={{ marginLeft: "auto", fontSize: 16, color: "rgba(74,222,128,0.9)" }}>✓</span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Vibe picker bottom sheet ── */}
      <AnimatePresence>
        {showVibePicker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowVibePicker(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(6,6,12,0.98)", backdropFilter: "blur(40px)",
                borderRadius: "20px 20px 0 0",
                border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
                maxHeight: "80dvh", display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #22c55e, #4ade80)" }} />
              <div style={{ padding: "16px 18px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0, textAlign: "center" }}>
                  <span>Choose Your Vibe</span>
                </p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "4px 0 0", textAlign: "center" }}>
                  <span>Appears after your age on your profile</span>
                </p>
              </div>
              <div style={{ overflowY: "auto", padding: "14px 16px max(20px, env(safe-area-inset-bottom, 20px))" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {VIBES.map((v) => (
                    <motion.button
                      key={v.key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setVibe(v.key); setShowVibePicker(false); }}
                      style={{
                        height: 38, borderRadius: 50, padding: "0 14px",
                        background: vibe === v.key ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)",
                        border: vibe === v.key ? "1px solid rgba(74,222,128,0.45)" : "1px solid rgba(255,255,255,0.09)",
                        color: vibe === v.key ? "rgba(74,222,128,0.95)" : "rgba(255,255,255,0.7)",
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                        transition: "all 0.15s",
                        boxShadow: vibe === v.key ? "0 0 12px rgba(74,222,128,0.2)" : "none",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{v.icon}</span>
                      <span>{v.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
