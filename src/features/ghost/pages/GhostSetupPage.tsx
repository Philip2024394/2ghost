import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, MapPin, Globe, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WORLD_COUNTRIES } from "../data/worldCountries";
import { getCitiesForCountry } from "../data/countryCities";
import { PHONE_APPS } from "../data/connectPlatforms";
import { detectIpCountry, getCachedIpCountry, COUNTRY_PHONE_PREFIX } from "@/shared/hooks/useIpCountry";
import { saveProfileToSupabase } from "../ghostProfileService";
import { DATE_IDEAS as FIRST_DATE_IDEAS } from "../data/dateIdeas";
import { PROFILE_BADGES, BADGE_CATEGORIES } from "../data/profileBadges";

const GHOST_PROFILE_KEY = "ghost_profile";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasd.png";

const RELIGIONS = [
  "Muslim 🌙", "Christian ✝️", "Catholic ✝️", "Buddhist ☸️",
  "Hindu 🕉️", "Jewish ✡️", "Spiritual 🌿", "Not religious 🙂",
];

const LOOKING_FOR = [
  { key: "serious",    icon: "💍", label: "Something Serious" },
  { key: "casual",     icon: "🌊", label: "Casual Dating" },
  { key: "friendship", icon: "🤝", label: "Friendship First" },
  { key: "exploring",  icon: "🌀", label: "Still Exploring" },
];

const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)",
  letterSpacing: "0.1em", textTransform: "uppercase",
  display: "block", marginBottom: 8,
};

const input = (hasError = false, focused = false): React.CSSProperties => ({
  width: "100%", height: 50, borderRadius: 12,
  background: focused ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)",
  border: hasError
    ? "1px solid rgba(239,68,68,0.5)"
    : focused
      ? "1px solid rgba(74,222,128,0.45)"
      : "1px solid rgba(255,255,255,0.1)",
  color: "#fff", fontSize: 15, padding: "0 14px",
  outline: "none", boxSizing: "border-box",
  transition: "background 0.15s, border-color 0.15s",
  boxShadow: focused ? "0 0 0 3px rgba(74,222,128,0.08)" : "none",
});

export default function GhostSetupPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [gender, setGender] = useState<"Female" | "Male" | "">("");
  const [interest, setInterest] = useState<"Women" | "Men" | "Both" | "">("");
  const [connectPhone, setConnectPhone] = useState("");
  const [bio, setBio] = useState("");
  const [firstDateIdea, setFirstDateIdea] = useState("");
  const [profileBadge, setProfileBadge] = useState("");
  const [religion, setReligion] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    const cached = getCachedIpCountry();
    const apply = (r: typeof cached) => {
      if (!r) return;
      const prefix = COUNTRY_PHONE_PREFIX[r.countryCode];
      if (prefix && !connectPhone) setConnectPhone(prefix + " ");
    };
    if (cached) apply(cached);
    else detectIpCountry().then(apply);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request GPS silently in the background — saved to profile if granted
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGpsCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {}, // silently ignore denial
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, []);

  const selectedCountryObj = WORLD_COUNTRIES.find((c) => c.name === country);

  const ageNum = parseInt(age, 10);

  // Which required fields are missing
  const errors = {
    photo: !photo,
    name: name.trim().length < 2,
    age: !(ageNum >= 18 && ageNum <= 80),
    city: city.trim().length === 0,
    country: country.length === 0,
    gender: gender === "",
    interest: interest === "",
  };
  const isValid = !Object.values(errors).some(Boolean);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSubmitAttempted(true);
    if (!isValid) return;
    setSaving(true);

    const profileData = {
      photo,
      name: name.trim(),
      age: ageNum,
      city: city.trim(),
      country,
      countryFlag: selectedCountryObj?.flag ?? "🌍",
      countryCode: selectedCountryObj?.code ?? "",
      gender,
      interest,
      bio: bio.trim() || null,
      firstDateIdea: firstDateIdea || null,
      badge: profileBadge || null,
      religion: religion || null,
      lookingFor: lookingFor || null,
      connectPhone: connectPhone.trim() || null,
      connectAlt: null,
      connectAltHandle: null,
      latitude: gpsCoords?.lat ?? null,
      longitude: gpsCoords?.lon ?? null,
      verified: false,
      idVerified: false,
      faceVerified: (() => { try { return localStorage.getItem("ghost_face_verified") === "1"; } catch { return false; } })(),
    };

    // Save to localStorage immediately (always works, instant)
    try {
      localStorage.setItem(GHOST_PROFILE_KEY, JSON.stringify(profileData));
      localStorage.setItem("ghost_interest", interest);
      // Stamp join time so we can apply a new-account notification grace period
      if (!localStorage.getItem("ghost_joined_at")) {
        localStorage.setItem("ghost_joined_at", String(Date.now()));
      }
    } catch {}

    // Save to Supabase (best-effort — failures don't block the user)
    const phone = (() => { try { return localStorage.getItem("ghost_phone") || ""; } catch { return ""; } })();
    if (phone) {
      try {
        await saveProfileToSupabase(phone, profileData);
      } catch {
        // Supabase error — profile is already in localStorage, continue normally
      }
    }

    navigate("/ghost/mode", { replace: true });
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#050508", color: "#fff", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "12px 18px",
        paddingTop: "max(12px, env(safe-area-inset-top, 12px))",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>Create Your Ghost Profile</h1>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>Anonymous until you match</p>
        </div>
        <img src={GHOST_LOGO} alt="" style={{ width: 38, height: 38, objectFit: "contain", opacity: 0.85 }} />
      </div>

      {/* Form */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 48px" }}>

        {/* ── Photo ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={handlePhotoChange} style={{ display: "none" }} />
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => fileRef.current?.click()}
            style={{
              width: 110, height: 110, borderRadius: "50%",
              background: photo ? "transparent" : "rgba(74,222,128,0.06)",
              border: submitAttempted && errors.photo
                ? "2px dashed rgba(239,68,68,0.6)"
                : photo ? "3px solid rgba(74,222,128,0.5)" : "2px dashed rgba(74,222,128,0.25)",
              cursor: "pointer", overflow: "hidden", position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {photo ? (
              <img src={photo} alt="You" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ textAlign: "center" }}>
                <Camera size={26} style={{ color: "rgba(74,222,128,0.5)", display: "block", margin: "0 auto 6px" }} />
                <span style={{ fontSize: 10, color: "rgba(74,222,128,0.5)", fontWeight: 700 }}>Add Photo</span>
              </div>
            )}
          </motion.button>
          <p style={{ fontSize: 11, color: photo ? "rgba(74,222,128,0.7)" : "rgba(255,255,255,0.3)", marginTop: 10, fontWeight: photo ? 700 : 400 }}>
            {photo ? "✓ Photo added — tap to change" : "Your profile photo · required"}
          </p>
          {submitAttempted && errors.photo && (
            <p style={{ fontSize: 11, color: "rgba(239,68,68,0.8)", margin: "2px 0 0", fontWeight: 700 }}>Please add a photo</p>
          )}
        </div>

        {/* ── Required fields section ── */}
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(74,222,128,0.5)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 20px" }}>
            Required
          </p>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>Your First Name</label>
          <input
            style={input(submitAttempted && errors.name, focusedField === "name")}
            placeholder="e.g. Sari"
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
          />
          {submitAttempted && errors.name && (
            <p style={{ fontSize: 11, color: "rgba(239,68,68,0.7)", margin: "5px 0 0" }}>Enter your first name</p>
          )}
        </div>

        {/* Age + City in a row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            <label style={label}>Age</label>
            <input
              style={input(submitAttempted && errors.age, focusedField === "age")}
              type="number" min={18} max={80}
              placeholder="e.g. 24"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              onFocus={() => setFocusedField("age")}
              onBlur={() => setFocusedField(null)}
            />
            {submitAttempted && errors.age && (
              <p style={{ fontSize: 11, color: "rgba(239,68,68,0.7)", margin: "5px 0 0" }}>18 – 80</p>
            )}
          </div>
          <div>
            <label style={label}>
              <MapPin size={10} style={{ display: "inline", marginRight: 4 }} />
              City / Area
            </label>
            {!country ? (
              <div style={{
                height: 50, borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center",
                paddingLeft: 14,
              }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Select country first</span>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onFocus={() => setFocusedField("city")}
                  onBlur={() => setFocusedField(null)}
                  style={{
                    width: "100%", height: 50, borderRadius: 12,
                    background: focusedField === "city" ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)",
                    border: submitAttempted && errors.city
                      ? "1px solid rgba(239,68,68,0.5)"
                      : focusedField === "city"
                        ? "1px solid rgba(74,222,128,0.45)"
                        : "1px solid rgba(255,255,255,0.1)",
                    color: city ? "#fff" : "rgba(255,255,255,0.35)",
                    fontSize: 15, paddingLeft: 14, paddingRight: 30,
                    outline: "none", boxSizing: "border-box",
                    appearance: "none", WebkitAppearance: "none",
                    cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s",
                    boxShadow: focusedField === "city" ? "0 0 0 3px rgba(74,222,128,0.08)" : "none",
                  }}
                >
                  <option value="" disabled style={{ background: "#0a0a10", color: "rgba(255,255,255,0.4)" }}>
                    Select your city…
                  </option>
                  {getCitiesForCountry(selectedCountryObj?.code ?? "").map((c) => (
                    <option key={c} value={c} style={{ background: "#0a0a10", color: "#fff" }}>{c}</option>
                  ))}
                </select>
                <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>▼</span>
              </div>
            )}
            {submitAttempted && errors.city && (
              <p style={{ fontSize: 11, color: "rgba(239,68,68,0.7)", margin: "5px 0 0" }}>Select your city</p>
            )}
          </div>
        </div>

        {/* Country */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>
            <Globe size={10} style={{ display: "inline", marginRight: 4 }} />
            Country
          </label>
          <div style={{ position: "relative" }}>
            {selectedCountryObj && (
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 18, pointerEvents: "none", zIndex: 1 }}>
                {selectedCountryObj.flag}
              </span>
            )}
            <select
              value={country}
              onChange={(e) => { setCountry(e.target.value); setCity(""); }}
              onFocus={() => setFocusedField("country")}
              onBlur={() => setFocusedField(null)}
              style={{
                width: "100%", height: 50, borderRadius: 12,
                background: focusedField === "country" ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.05)",
                border: submitAttempted && errors.country
                  ? "1px solid rgba(239,68,68,0.5)"
                  : focusedField === "country"
                    ? "1px solid rgba(74,222,128,0.45)"
                    : "1px solid rgba(255,255,255,0.1)",
                color: country ? "#fff" : "rgba(255,255,255,0.35)",
                fontSize: 15,
                paddingLeft: selectedCountryObj ? 44 : 14,
                paddingRight: 14,
                outline: "none",
                boxSizing: "border-box",
                appearance: "none", WebkitAppearance: "none",
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
                boxShadow: focusedField === "country" ? "0 0 0 3px rgba(74,222,128,0.08)" : "none",
              }}
            >
              <option value="" disabled style={{ background: "#0a0a10", color: "rgba(255,255,255,0.4)" }}>
                Select your country…
              </option>
              {WORLD_COUNTRIES.map((c) => (
                <option key={c.code} value={c.name} style={{ background: "#0a0a10", color: "#fff" }}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            {/* Dropdown arrow */}
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
              ▼
            </span>
          </div>
          {submitAttempted && errors.country && (
            <p style={{ fontSize: 11, color: "rgba(239,68,68,0.7)", margin: "5px 0 0" }}>Select your country</p>
          )}
        </div>

        {/* Gender */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>I am</label>
          <div style={{ display: "flex", gap: 10 }}>
            {(["Female", "Male"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                style={{
                  flex: 1, height: 50, borderRadius: 12, cursor: "pointer",
                  background: gender === g ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.04)",
                  border: submitAttempted && errors.gender
                    ? "1px solid rgba(239,68,68,0.4)"
                    : gender === g ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  color: gender === g ? "rgba(74,222,128,0.95)" : "rgba(255,255,255,0.5)",
                  fontSize: 14, fontWeight: 700, transition: "all 0.15s",
                }}
              >
                {g === "Female" ? "👩 Woman" : "👨 Man"}
              </button>
            ))}
          </div>
          {submitAttempted && errors.gender && (
            <p style={{ fontSize: 11, color: "rgba(239,68,68,0.7)", margin: "5px 0 0" }}>Select your gender</p>
          )}
        </div>

        {/* Interested In */}
        <div style={{ marginBottom: 32 }}>
          <label style={label}>Interested In</label>
          <div style={{ display: "flex", gap: 10 }}>
            {([
              { value: "Women", label: "👩 Women" },
              { value: "Men",   label: "👨 Men" },
              { value: "Both",  label: "🌈 Both" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setInterest(opt.value)}
                style={{
                  flex: 1, height: 50, borderRadius: 12, cursor: "pointer",
                  background: interest === opt.value ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.04)",
                  border: submitAttempted && errors.interest
                    ? "1px solid rgba(239,68,68,0.4)"
                    : interest === opt.value ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.08)",
                  color: interest === opt.value ? "rgba(74,222,128,0.95)" : "rgba(255,255,255,0.5)",
                  fontSize: 13, fontWeight: 700, transition: "all 0.15s",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {submitAttempted && errors.interest && (
            <p style={{ fontSize: 11, color: "rgba(239,68,68,0.7)", margin: "5px 0 0" }}>Select who you're interested in</p>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 28 }} />

        {/* ── Optional section ── */}
        <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 20px" }}>
          Optional — shown on reveal
        </p>

        {/* Bio */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>One Line About You</label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...input(false, focusedField === "bio"), paddingRight: 42 }}
              placeholder="e.g. Loves late nights and good coffee"
              value={bio}
              maxLength={72}
              onChange={(e) => setBio(e.target.value)}
              onFocus={() => setFocusedField("bio")}
              onBlur={() => setFocusedField(null)}
            />
            <span style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              fontSize: 10, color: bio.length > 60 ? "rgba(251,191,36,0.7)" : "rgba(255,255,255,0.2)",
              fontWeight: 700, pointerEvents: "none",
            }}>
              {72 - bio.length}
            </span>
          </div>
        </div>

        {/* Looking For */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>Looking For</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {LOOKING_FOR.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setLookingFor(lookingFor === opt.key ? "" : opt.key)}
                style={{
                  height: 46, borderRadius: 12, cursor: "pointer",
                  background: lookingFor === opt.key ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.03)",
                  border: lookingFor === opt.key ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.07)",
                  color: lookingFor === opt.key ? "rgba(74,222,128,0.95)" : "rgba(255,255,255,0.5)",
                  fontSize: 12, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <span style={{ fontSize: 16 }}>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Take Me On A Date */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>
            Take Me On A Date
            <span style={{ fontWeight: 400, opacity: 0.5, textTransform: "none", letterSpacing: 0 }}> — pick one</span>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {FIRST_DATE_IDEAS.map((idea) => {
              const sel = firstDateIdea === idea.key;
              return (
                <button
                  key={idea.key}
                  onClick={() => setFirstDateIdea(sel ? "" : idea.key)}
                  style={{
                    borderRadius: 14, padding: "14px 12px",
                    background: sel ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.03)",
                    border: sel ? "1px solid rgba(74,222,128,0.5)" : "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer", textAlign: "left",
                    boxShadow: sel ? "0 0 16px rgba(74,222,128,0.15)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {idea.image
                    ? <img src={idea.image} alt={idea.label} style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", marginBottom: 6, display: "block" }} />
                    : <div style={{ fontSize: 26, marginBottom: 6, lineHeight: 1 }}>{idea.emoji}</div>
                  }
                  <p style={{ fontSize: 12, fontWeight: 800, color: sel ? "rgba(74,222,128,0.95)" : "#fff", margin: "0 0 3px", lineHeight: 1.2 }}>{idea.label}</p>
                  <p style={{ fontSize: 10, color: sel ? "rgba(74,222,128,0.6)" : "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.4 }}>{idea.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* My Badge */}
        <div style={{ marginBottom: 20 }}>
          <label style={label}>
            My Badge
            <span style={{ fontWeight: 400, opacity: 0.5, textTransform: "none", letterSpacing: 0 }}> — shows on your card (optional)</span>
          </label>
          <select
            value={profileBadge}
            onChange={(e) => setProfileBadge(e.target.value)}
            style={{
              width: "100%", height: 44, borderRadius: 12,
              border: "1px solid rgba(251,191,36,0.25)",
              background: "rgba(251,191,36,0.07)",
              color: profileBadge ? "#fbbf24" : "rgba(255,255,255,0.35)",
              fontSize: 13, fontWeight: 700, padding: "0 12px",
              appearance: "none", WebkitAppearance: "none", cursor: "pointer",
            }}
          >
            <option value="">— Choose a badge —</option>
            {BADGE_CATEGORIES.map((cat) => (
              <optgroup key={cat.key} label={cat.label}>
                {PROFILE_BADGES.filter((b) => b.category === cat.key).map((b) => (
                  <option key={b.key} value={b.key}>{b.emoji} {b.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Religion */}
        <div style={{ marginBottom: 32 }}>
          <label style={label}>Religion</label>
          <select
            value={religion}
            onChange={(e) => setReligion(e.target.value)}
            style={{
              width: "100%", height: 44, borderRadius: 12,
              border: "1px solid rgba(168,85,247,0.25)",
              background: "rgba(168,85,247,0.07)",
              color: religion ? "rgba(168,85,247,0.9)" : "rgba(255,255,255,0.35)",
              fontSize: 13, fontWeight: 700, padding: "0 12px",
              appearance: "none", WebkitAppearance: "none", cursor: "pointer",
            }}
          >
            <option value="">— Select religion —</option>
            {RELIGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 28 }} />

        {/* ── Contact ── */}
        <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 20px" }}>
          How matches reach you
        </p>

        <div style={{ marginBottom: 32 }}>
          <label style={label}>
            <Smartphone size={10} style={{ display: "inline", marginRight: 4 }} />
            Phone Number <span style={{ fontWeight: 400, opacity: 0.5, textTransform: "none", letterSpacing: 0 }}>— only shared after a mutual match</span>
          </label>
          <input
            style={input(false, focusedField === "phone")}
            type="tel"
            placeholder="+62 8xx xxxx xxxx"
            value={connectPhone}
            maxLength={20}
            onChange={(e) => setConnectPhone(e.target.value)}
            onFocus={() => setFocusedField("phone")}
            onBlur={() => setFocusedField(null)}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {PHONE_APPS.map((a) => (
              <span key={a.key} style={{
                fontSize: 11, fontWeight: 600,
                background: "rgba(255,255,255,0.04)", border: `1px solid ${a.color}20`,
                borderRadius: 50, padding: "3px 9px", color: a.color,
              }}>
                {a.emoji} {a.label}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "8px 0 0", lineHeight: 1.5 }}>
            One number unlocks WhatsApp, Telegram, Signal, iMessage and more for your match.
          </p>
        </div>

        {/* Error summary */}
        <AnimatePresence>
          {submitAttempted && !isValid && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 12, padding: "12px 16px", marginBottom: 16,
              }}
            >
              <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(239,68,68,0.9)", margin: "0 0 6px" }}>
                Please complete the required fields:
              </p>
              <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
                {errors.photo    && <li>Profile photo</li>}
                {errors.name     && <li>First name (minimum 2 characters)</li>}
                {errors.age      && <li>Age (must be 18 – 80)</li>}
                {errors.city     && <li>City</li>}
                {errors.country  && <li>Country</li>}
                {errors.gender   && <li>Gender</li>}
                {errors.interest && <li>Who you're interested in</li>}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.button
          whileTap={isValid ? { scale: 0.97 } : {}}
          onClick={handleSave}
          style={{
            width: "100%", height: 56, borderRadius: 16, border: "none",
            background: isValid
              ? "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)"
              : "rgba(255,255,255,0.06)",
            color: isValid ? "#fff" : "rgba(255,255,255,0.2)",
            fontSize: 16, fontWeight: 900, cursor: isValid ? "pointer" : "default",
            boxShadow: isValid ? "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 32px rgba(34,197,94,0.4)" : "none",
            transition: "all 0.2s",
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {isValid && (
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
          )}
          {saving ? (
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1, repeat: Infinity }}>
              Creating your profile…
            </motion.span>
          ) : (
            <>
              <img src={GHOST_LOGO} alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
              Meet The Guests
            </>
          )}
        </motion.button>

        {!isValid && !submitAttempted && (
          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 10 }}>
            Fill in the required fields above to continue
          </p>
        )}

      </div>
    </div>
  );
}
