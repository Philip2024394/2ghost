import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { ghostSupabase } from "../ghostSupabase";
const GHOST_HERO = "https://ik.imagekit.io/7grri5v7d/find%20meddddd.png";

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

export default function GhostAuthPage() {
  const a = useGenderAccent();
  const navigate = useNavigate();
  const [ageConfirmed, setAgeConfirmed] = useState(() => !!localStorage.getItem("ghost_dob"));
  const [dobDay,   setDobDay]   = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear,  setDobYear]  = useState("");
  const [tosChecked, setTosChecked] = useState(false);
  const [dobError,   setDobError]   = useState("");
  const [gender, setGender] = useState<"Female" | "Male">("Female");
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanPhone = phone.replace(/\D/g, "");
  const isPhoneValid = cleanPhone.length >= 8;
  const fullOtp = otp.join("");
  const isOtpComplete = fullOtp.length === 6;
  const [serverError, setServerError] = useState(false);

  const isBlocked = (full: string): boolean => {
    try {
      // Block only active while Shield subscription is paid
      const blockUntil = parseInt(localStorage.getItem("ghost_block_until") || "0", 10);
      if (Date.now() > blockUntil) return false; // subscription lapsed — all unblocked
      const list: string[] = JSON.parse(localStorage.getItem("ghost_blocked_numbers") || "[]");
      return list.includes(full);
    } catch { return false; }
  };

  // Cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setResendCooldown((n) => {
        if (n <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return n - 1;
      });
    }, 1000);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [resendCooldown]);

  const handleSendCode = async () => {
    if (!isPhoneValid) return;
    setSending(true);
    setServerError(false);
    const fullNumber = countryCode.code + cleanPhone;
    if (isBlocked(fullNumber)) {
      setSending(false);
      setServerError(true);
      return;
    }
    const { error } = await ghostSupabase.auth.signInWithOtp({
      phone: fullNumber,
      options: { channel: "whatsapp" },
    });
    setSending(false);
    if (error) {
      setServerError(true);
      return;
    }
    setStep("otp");
    setResendCooldown(30);
    setTimeout(() => otpRefs.current[0]?.focus(), 300);
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!isOtpComplete) return;
    setVerifying(true);
    setVerifyError("");
    const fullNumber = countryCode.code + cleanPhone;
    const { data, error } = await ghostSupabase.auth.verifyOtp({
      phone: fullNumber,
      token: fullOtp,
      type: "sms",
    });
    setVerifying(false);
    if (error) {
      setVerifyError("Incorrect code — please try again");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
      return;
    }
    try {
      localStorage.setItem("ghost_gender", gender);
      localStorage.setItem("ghost_phone", fullNumber);
      if (data.user) localStorage.setItem("ghost_auth_uid", data.user.id);
      localStorage.removeItem("ghost_house_welcomed");
    } catch {}
    const isNewUser = !localStorage.getItem("ghost_profile_setup_done");
    navigate(isNewUser ? "/ghost/profile-setup" : "/ghost/gateway", { replace: true });
  };

  const inputBase: React.CSSProperties = {
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#fff", outline: "none",
    boxSizing: "border-box",
  };

  // ── Age gate ──────────────────────────────────────────────────────────────
  if (!ageConfirmed) {
    const currentYear = new Date().getFullYear();
    const years  = Array.from({ length: 100 }, (_, i) => currentYear - 18 - i);
    const months = [
      { v: "1", l: "January" }, { v: "2", l: "February" }, { v: "3", l: "March" },
      { v: "4", l: "April" },   { v: "5", l: "May" },      { v: "6", l: "June" },
      { v: "7", l: "July" },    { v: "8", l: "August" },   { v: "9", l: "September" },
      { v: "10", l: "October" },{ v: "11", l: "November" },{ v: "12", l: "December" },
    ];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    const handleDobConfirm = () => {
      if (!dobDay || !dobMonth || !dobYear) { setDobError("Please enter your full date of birth."); return; }
      const dob   = new Date(`${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      if (isNaN(age) || age < 0) { setDobError("Please enter a valid date of birth."); return; }
      if (age < 18) { setDobError("You must be 18 or older to join Mr Butlas."); return; }
      const iso = `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`;
      try { localStorage.setItem("ghost_dob", iso); } catch {}
      setDobError("");
      setAgeConfirmed(true);
    };

    const selectStyle: React.CSSProperties = {
      background: "#050508", border: "1px solid rgba(255,255,255,0.14)",
      borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 600,
      padding: "0 12px", height: 46, outline: "none", appearance: "none",
      WebkitAppearance: "none", cursor: "pointer", width: "100%",
    };
    const canConfirm = !!dobDay && !!dobMonth && !!dobYear && tosChecked;

    return (
      <div style={{
        minHeight: "100dvh", background: "#050508", color: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "32px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <img src="https://ik.imagekit.io/7grri5v7d/Untitledsfasdfasdf.png" alt="Mr Butlas" style={{ width: 120, height: 120, objectFit: "contain", display: "block", margin: "0 auto 14px" }} />
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 8px", lineHeight: 1.2 }}>
              Welcome to Mr Butlas
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.65, maxWidth: 280, marginInline: "auto" }}>
              This platform is exclusively for adults aged <strong style={{ color: "#fff" }}>18 and over</strong>. Please enter your date of birth to continue.
            </p>
          </div>

          {/* DOB selects */}
          <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>Date of Birth</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr 1fr", gap: 8, marginBottom: 16 }}>
            <div style={{ position: "relative" }}>
              <select value={dobDay} onChange={e => { setDobDay(e.target.value); setDobError(""); }} style={selectStyle}>
                <option value="">Day</option>
                {days.map(d => <option key={d} value={String(d)}>{d}</option>)}
              </select>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>▾</span>
            </div>
            <div style={{ position: "relative" }}>
              <select value={dobMonth} onChange={e => { setDobMonth(e.target.value); setDobError(""); }} style={selectStyle}>
                <option value="">Month</option>
                {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>▾</span>
            </div>
            <div style={{ position: "relative" }}>
              <select value={dobYear} onChange={e => { setDobYear(e.target.value); setDobError(""); }} style={selectStyle}>
                <option value="">Year</option>
                {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
              </select>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>▾</span>
            </div>
          </div>

          {/* Age error */}
          <AnimatePresence>
            {dobError && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                <p style={{ margin: 0, fontSize: 12, color: "#fca5a5", fontWeight: 700 }}>{dobError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ToS checkbox */}
          <div onClick={() => setTosChecked(c => !c)}
            style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 24, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1, border: `2px solid ${tosChecked ? a.accent : "rgba(255,255,255,0.2)"}`, background: tosChecked ? a.glow(0.3) : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
              {tosChecked && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.6 }}>
              I confirm I am <strong style={{ color: "#fff" }}>18 years or older</strong> and I agree to the{" "}
              <span style={{ color: a.accent, fontWeight: 700 }}>Terms of Service</span>. This platform is for adults only — no minors permitted.
            </p>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleDobConfirm} disabled={!canConfirm}
            style={{ width: "100%", height: 52, borderRadius: 50, border: "none", background: canConfirm ? `linear-gradient(135deg,${a.accentDark},${a.accent})` : "rgba(255,255,255,0.07)", color: canConfirm ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 16, fontWeight: 900, cursor: canConfirm ? "pointer" : "default", boxShadow: canConfirm ? `0 8px 28px ${a.glow(0.3)}` : "none", transition: "all 0.2s", marginBottom: 14 }}>
            Confirm &amp; Continue
          </motion.button>

          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: 0, textAlign: "center", lineHeight: 1.6 }}>
            Your date of birth is used solely for age verification and is never shown on your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", position: "relative", overflow: "hidden", background: "#000" }}>

      {/* ── Background image ── */}
      <img src={GHOST_HERO} alt="2Ghost" style={{
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        objectFit: "cover", objectPosition: "top center",
      }} />

      {/* ── Gradient overlay ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, transparent 42%, rgba(0,0,0,0.7) 62%, rgba(0,0,0,0.96) 78%, #000 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Country picker dropdown ── */}
      <AnimatePresence>
        {showCountryPicker && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => setShowCountryPicker(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 420,
                background: "rgba(8,8,12,0.98)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "18px 18px 0 0",
                padding: "10px 0 max(20px, env(safe-area-inset-bottom, 20px))",
                maxHeight: "60dvh", overflowY: "auto",
              }}
            >
              <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff", textAlign: "center" }}>
                  <span>Select Country</span>
                </p>
              </div>
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

      {/* ── Form ── */}
      <div style={{
        position: "relative", zIndex: 10,
        minHeight: "100dvh",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: "0 22px max(28px, env(safe-area-inset-bottom, 28px))",
      }}>
        <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: 11 }}>

          <AnimatePresence mode="wait">

            {step === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ display: "flex", flexDirection: "column", gap: 11 }}
              >
                {/* ── Gender toggle ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", paddingRight: "4%" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: a.glow(0.85),
                      letterSpacing: "0.04em",
                      display: "flex", alignItems: "center", gap: 4,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: a.accent,
                        boxShadow: `0 0 6px ${a.glow(0.8)}`,
                        display: "inline-block", flexShrink: 0,
                      }} />
                      58.382 Online Now
                    </span>
                  </div>
                  <div style={{
                    display: "flex", borderRadius: 50,
                    background: "rgba(0,0,0,0.45)",
                    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    padding: 3, gap: 3,
                  }}>
                    {(["Female", "Male"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        style={{
                          flex: 1, height: 38, borderRadius: 50, border: "none",
                          background: gender === g
                            ? g === `Female`
                              ? `linear-gradient(to bottom, ${a.accent}, ${a.accentMid})`
                              : `linear-gradient(to bottom, ${a.accentMid}, ${a.accentDark})`
                            : "transparent",
                          color: gender === g ? "#fff" : "rgba(255,255,255,0.35)",
                          fontSize: 13, fontWeight: 800, cursor: "pointer",
                          transition: "all 0.2s",
                          boxShadow: gender === g
                            ? `0 4px 14px ${a.glowMid(0.4)}`
                            : "none",
                        }}
                      >
                        <span>{g === "Female" ? "👩 I'm a Woman" : "👨 I'm a Man"}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Free badge for women ── */}
                {gender === "Female" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      textAlign: "center",
                      background: a.glowMid(0.08),
                      border: `1px solid ${a.glowMid(0.25)}`,
                      borderRadius: 10, padding: "7px 14px", overflow: "hidden",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: a.glow(0.9) }}>
                      <span>Join free · No card required</span>
                    </span>
                  </motion.div>
                )}

                {/* ── Phone number row ── */}
                <div style={{ display: "flex", gap: 8 }}>
                  {/* Country code button */}
                  <button
                    onClick={() => setShowCountryPicker(true)}
                    style={{
                      ...inputBase,
                      height: 44, borderRadius: 12, padding: "0 12px",
                      display: "flex", alignItems: "center", gap: 6,
                      cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{countryCode.flag}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{countryCode.code}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>▾</span>
                  </button>

                  {/* Phone input */}
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="8xx xxxx xxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                      style={{
                        ...inputBase,
                        width: "100%", height: 44, borderRadius: 12,
                        paddingLeft: 16, paddingRight: 44, fontSize: 15,
                      }}
                    />
                    <Phone size={15} style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      color: "rgba(255,255,255,0.35)", pointerEvents: "none",
                    }} />
                  </div>
                </div>

                {/* ── Fake server error (shown when number is blocked) ── */}
                <AnimatePresence>
                  {serverError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        borderRadius: 12, padding: "12px 14px",
                        display: "flex", alignItems: "flex-start", gap: 10,
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fca5a5", margin: "0 0 2px" }}>
                          <span>Sorry, our server is down</span>
                        </p>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>
                          <span>We are experiencing problems. Please try again later.</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Send code button (WhatsApp green) ── */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -1 }}
                  onClick={handleSendCode}
                  disabled={sending || !isPhoneValid}
                  style={{
                    width: "100%", height: 46, borderRadius: 50, border: "none",
                    background: isPhoneValid
                      ? a.gradient
                      : "rgba(255,255,255,0.07)",
                    color: isPhoneValid ? "#fff" : "rgba(255,255,255,0.3)",
                    fontSize: 15, fontWeight: 900, letterSpacing: "0.04em",
                    cursor: isPhoneValid ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: isPhoneValid ? `0 1px 0 rgba(255,255,255,0.3) inset, 0 4px 16px ${a.glowMid(0.4)}` : "none",
                    transition: "all 0.2s",
                    marginTop: 2, position: "relative", overflow: "hidden",
                    textShadow: isPhoneValid ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)",
                    borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
                  }} />
                  {sending ? (
                    <span style={{ opacity: 0.7 }}>Sending to WhatsApp...</span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {/* WhatsApp icon */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span>Send Code to WhatsApp</span>
                    </span>
                  )}
                </motion.button>

                {/* Legal */}
                <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", margin: "2px 0 0", lineHeight: 1.6 }}>
                  <span>By continuing you agree to our </span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Terms</span>
                  <span> & </span>
                  <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Privacy Policy</span>
                </p>

                {/* Admin bypass */}
                <button
                  onClick={() => {
                    try {
                      localStorage.setItem("supabase.auth.token", JSON.stringify({ user: { id: "admin-12345" } }));
                      localStorage.setItem("ghost_mode_until", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
                      localStorage.setItem("ghost_mode_plan", "bundle");
                      localStorage.setItem("ghost_gender", "Male");
                      localStorage.setItem("ghost_phone", "+62812345678");
                      localStorage.setItem("ghost_profile", JSON.stringify({
                        name: "Admin", age: 30, city: "Jakarta", country: "Indonesia",
                        countryFlag: "🇮🇩", gender: "Male",
                        photo: "https://i.pravatar.cc/400?img=14",
                      }));
                    } catch {}
                    navigate("/ghost/gateway");
                  }}
                  style={{
                    display: "block", margin: "2px auto 0",
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.1)", fontSize: 10,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                  }}
                >
                  · · ·
                </button>

                {/* DEV — start page shortcut */}
                <button
                  onClick={() => {
                    localStorage.removeItem("ghost_profile_setup_done");
                    navigate("/ghost/welcome");
                  }}
                  style={{
                    display: "block", margin: "6px auto 0",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: 8, cursor: "pointer",
                    color: "rgba(239,68,68,0.6)", fontSize: 10,
                    fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", padding: "5px 12px",
                  }}
                >
                  ⚙ Dev · Start Page
                </button>
              </motion.div>
            )}

            {step === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                style={{ display: "flex", flexDirection: "column", gap: 11 }}
              >
                {/* Back */}
                <button
                  onClick={() => { setStep("phone"); setOtp(["","","","","",""]); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 5, padding: 0,
                    alignSelf: "flex-start",
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>Change number</span>
                </button>

                {/* WhatsApp sent confirmation */}
                <div style={{
                  background: "rgba(37,211,102,0.08)",
                  border: "1px solid rgba(37,211,102,0.25)",
                  borderRadius: 12, padding: "12px 16px",
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #25d366, #128c7e)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>
                      <span>Code sent to WhatsApp</span>
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                      <span>{countryCode.code} {phone}</span>
                    </p>
                  </div>
                </div>

                {/* ── 6-digit OTP boxes ── */}
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }} onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      style={{
                        width: 46, height: 54, borderRadius: 12,
                        background: digit ? a.glow(0.12) : "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                        border: digit
                          ? `1px solid ${a.glow(0.5)}`
                          : "1px solid rgba(255,255,255,0.14)",
                        color: "#fff", fontSize: 22, fontWeight: 900,
                        textAlign: "center", outline: "none",
                        transition: "all 0.15s",
                        boxSizing: "border-box",
                      }}
                    />
                  ))}
                </div>

                {/* Verify error */}
                <AnimatePresence>
                  {verifyError && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 12, color: "#f87171", margin: 0, textAlign: "center" }}
                    >
                      {verifyError}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* ── Verify button ── */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -1 }}
                  onClick={handleVerify}
                  disabled={verifying || !isOtpComplete}
                  style={{
                    width: "100%", height: 46, borderRadius: 50, border: "none",
                    background: isOtpComplete
                      ? a.gradient
                      : "rgba(255,255,255,0.07)",
                    color: isOtpComplete ? "#fff" : "rgba(255,255,255,0.3)",
                    fontSize: 15, fontWeight: 900, letterSpacing: "0.04em",
                    cursor: isOtpComplete ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: isOtpComplete ? `0 1px 0 rgba(255,255,255,0.3) inset, 0 4px 16px ${a.glowMid(0.4)}` : "none",
                    transition: "all 0.2s",
                    marginTop: 2, position: "relative", overflow: "hidden",
                    textShadow: isOtpComplete ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)",
                    borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
                  }} />
                  {verifying ? (
                    <span style={{ opacity: 0.7 }}>Verifying...</span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>Enter Ghost Mode</span>
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </span>
                  )}
                </motion.button>

                {/* Resend */}
                <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                  {resendCooldown > 0 ? (
                    <span>Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      onClick={handleSendCode}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: a.accent, fontWeight: 700, fontSize: 12, padding: 0,
                      }}
                    >
                      Resend code
                    </button>
                  )}
                </p>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
