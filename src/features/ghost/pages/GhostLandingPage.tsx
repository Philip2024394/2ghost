import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCachedIpCountry } from "@/shared/hooks/useIpCountry";

import { buildAccent } from "@/shared/hooks/useGenderAccent";
const GHOST_HERO = "https://ik.imagekit.io/7grri5v7d/Untitledasfsadfasdftewrtewrt.png";

// ── Helpers ────────────────────────────────────────────────────────────────────
function seededInt(seed: number, lo: number, hi: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return lo + Math.floor((x - Math.floor(x)) * (hi - lo + 1));
}
function getDailyTarget(): number {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  return seededInt(seed, 243, 800);
}
function getNewProfilesToday(): number {
  const now = new Date();
  const minuteOfDay = now.getHours() * 60 + now.getMinutes();
  const fraction = minuteOfDay / 1440;
  return Math.max(1, Math.floor(getDailyTarget() * fraction));
}

const AVATARS = [
  "https://ik.imagekit.io/7grri5v7d/4i.png?updatedAt=1774012879924",
  "https://ik.imagekit.io/7grri5v7d/2q.png?updatedAt=1774012847860",
  "https://ik.imagekit.io/7grri5v7d/1as.png?updatedAt=1774009744350",
  "https://ik.imagekit.io/7grri5v7d/5q.png?updatedAt=1774013004908",
  "https://ik.imagekit.io/7grri5v7d/1a.png?updatedAt=1774012891284",
  "https://ik.imagekit.io/7grri5v7d/15a.png?updatedAt=1774012937480",
];

// ── Floating hearts only ───────────────────────────────────────────────────────
const HEARTS = [
  { delay: 0,    x:  "8%",  size: 14, dur: 3.8, drift:  10, icon: "❤️" },
  { delay: 0.4,  x: "18%",  size: 16, dur: 3.2, drift:  14, icon: "💗" },
  { delay: 0.8,  x: "28%",  size: 12, dur: 4.1, drift: -12, icon: "💕" },
  { delay: 1.2,  x: "38%",  size: 18, dur: 3.5, drift:   8, icon: "❤️" },
  { delay: 1.6,  x: "48%",  size: 20, dur: 2.9, drift: -16, icon: "💓" },
  { delay: 2.0,  x: "58%",  size: 13, dur: 3.9, drift:  18, icon: "💗" },
  { delay: 2.4,  x: "68%",  size: 16, dur: 3.3, drift:  -8, icon: "❤️" },
  { delay: 2.8,  x: "78%",  size: 11, dur: 4.2, drift:  12, icon: "💕" },
  { delay: 3.2,  x: "88%",  size: 15, dur: 3.6, drift: -14, icon: "💝" },
  { delay: 3.6,  x: "13%",  size: 22, dur: 2.8, drift:   6, icon: "💗" },
  { delay: 4.0,  x: "73%",  size: 18, dur: 3.4, drift: -10, icon: "❤️" },
  { delay: 4.4,  x: "43%",  size: 14, dur: 4.0, drift:  16, icon: "💓" },
];

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

function getDeadline(): number {
  try {
    const stored = localStorage.getItem("ghost_beta_deadline");
    if (stored) return Number(stored);
    const d = Date.now() + 72 * 60 * 60 * 1000;
    localStorage.setItem("ghost_beta_deadline", String(d));
    return d;
  } catch {
    return Date.now() + 72 * 60 * 60 * 1000;
  }
}
function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function isBlocked(full: string): boolean {
  try {
    const blockUntil = parseInt(localStorage.getItem("ghost_block_until") || "0", 10);
    if (Date.now() > blockUntil) return false;
    const list: string[] = JSON.parse(localStorage.getItem("ghost_blocked_numbers") || "[]");
    return list.includes(full);
  } catch { return false; }
}

export default function GhostLandingPage() {
  const navigate = useNavigate();
  const [showManifesto, setShowManifesto]   = useState(false);
  const [showA2HS, setShowA2HS]             = useState(false);
  const [a2hsDismissed, setA2HSDismissed]   = useState(() => {
    try { return !!localStorage.getItem("ghost_a2hs_dismissed"); } catch { return false; }
  });
  const deferredPromptRef = useRef<any>(null);
  const [countdown, setCountdown]     = useState(() => Math.max(0, getDeadline() - Date.now()));
  const [newProfiles, setNewProfiles] = useState(getNewProfilesToday);
  const [countryName] = useState(() => getCachedIpCountry()?.countryName ?? "Indonesia");
  const [countryFlag] = useState(() => {
    const code = getCachedIpCountry()?.countryCode ?? "ID";
    return [...code.toUpperCase()].map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join("");
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auth form state ──────────────────────────────────────────────────────────
  const [gender, setGender]             = useState<"Female" | "Male">("Female");
  const a = buildAccent(gender);
  const [countryCode, setCountryCode]   = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone]               = useState("");
  const [authStep, setAuthStep]         = useState<"phone" | "otp">("phone");
  const [otp, setOtp]                   = useState(["", "", "", "", "", ""]);
  const [sending, setSending]           = useState(false);
  const [verifying, setVerifying]       = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [serverError, setServerError]   = useState(false);
  const [otpChannel, setOtpChannel]     = useState<"whatsapp" | "sms">("whatsapp");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanPhone    = phone.replace(/\D/g, "");
  const isPhoneValid  = cleanPhone.length >= 8;
  const fullOtp       = otp.join("");
  const isOtpComplete = fullOtp.length === 6;

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

  const handleSendCode = (channel: "whatsapp" | "sms" = otpChannel) => {
    if (!isPhoneValid) return;
    setSending(true);
    setServerError(false);
    setOtpChannel(channel);
    const fullNumber = countryCode.code + cleanPhone;
    // TODO: call Twilio Verify — channel: "whatsapp" or "sms"
    setTimeout(() => {
      setSending(false);
      if (isBlocked(fullNumber)) { setServerError(true); return; }
      setAuthStep("otp");
      setResendCooldown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    }, 1800);
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[i] = digit; setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); otpRefs.current[5]?.focus(); }
  };

  const handleVerify = () => {
    if (!isOtpComplete) return;
    setVerifying(true);
    // TODO: verify OTP with Twilio — any 6 digits pass for now
    setTimeout(() => {
      setVerifying(false);
      try {
        localStorage.setItem("ghost_gender", gender);
        localStorage.setItem("ghost_phone", countryCode.code + cleanPhone);
        localStorage.removeItem("ghost_house_welcomed");
      } catch {}
      navigate("/ghost/gateway", { replace: true });
    }, 1000);
  };

  // ── Manifesto popup ──────────────────────────────────────────────────────────
  useEffect(() => {
    const alreadySeen = sessionStorage.getItem("ghost_manifesto_seen");
    if (alreadySeen) return;
    const t = setTimeout(() => {
      setShowManifesto(true);
      sessionStorage.setItem("ghost_manifesto_seen", "1");
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  // ── A2HS ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (a2hsDismissed) return;
    try {
      if (!localStorage.getItem("ghost_first_visit"))
        localStorage.setItem("ghost_first_visit", String(Date.now()));
    } catch {}
    const onPrompt = (e: Event) => { e.preventDefault(); deferredPromptRef.current = e; };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const firstVisit = (() => { try { return Number(localStorage.getItem("ghost_first_visit")) || Date.now(); } catch { return Date.now(); } })();
    const delay = Math.max(0, firstVisit + 10 * 60 * 1000 - Date.now());
    const t = setTimeout(() => setShowA2HS(true), delay);
    return () => { clearTimeout(t); window.removeEventListener("beforeinstallprompt", onPrompt); };
  }, [a2hsDismissed]);

  const handleA2HSInstall = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      await deferredPromptRef.current.userChoice;
      deferredPromptRef.current = null;
    }
    dismissA2HS();
  };
  const dismissA2HS = () => {
    setShowA2HS(false);
    setA2HSDismissed(true);
    try { localStorage.setItem("ghost_a2hs_dismissed", "1"); } catch {}
  };

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
  const isInStandaloneMode = ("standalone" in window.navigator) && (window.navigator as any).standalone;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(Math.max(0, getDeadline() - Date.now()));
      setNewProfiles(getNewProfilesToday());
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const inputBase: React.CSSProperties = {
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "#fff", outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div translate="no" style={{ minHeight: "100dvh", position: "relative", overflow: "hidden", background: "#050508" }}>
      {/* Background image */}
      <img
        src={GHOST_HERO}
        alt="2Ghost"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "top center",
        }}
      />

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 28%, rgba(5,5,8,0.55) 55%, rgba(5,5,8,0.93) 72%, #050508 90%)",
        pointerEvents: "none",
      }} />


      {/* ── "2Ghost" — right side, vertically centered on hero ── */}
      <div style={{
        position: "absolute",
        top: "calc(32% - 140px)",
        right: 20,
        zIndex: 20,
        pointerEvents: "none",
      }}>
        <p style={{
          margin: 0,
          fontSize: 62,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: 0,
        }}>
          <span style={{
            color: gender === "Female" ? "#f472b6" : a.accent,
            textShadow: gender === "Female"
              ? "0 0 12px rgba(244,114,182,0.9), 0 0 28px rgba(244,114,182,0.6), 0 0 55px rgba(244,114,182,0.35)"
              : `0 0 12px ${a.glow(0.9)}, 0 0 28px ${a.glow(0.6)}, 0 0 55px ${a.glow(0.35)}`,
          }}>2</span>
          <span style={{
            color: "#fff",
            textShadow: `0 0 18px ${a.glow(0.25)}, 0 2px 16px rgba(0,0,0,0.5)`,
            letterSpacing: 0,
          }}>Gh</span>
          <span style={{
            display: "inline-block",
            fontSize: 42,
            verticalAlign: "middle",
            lineHeight: 1,
            margin: "0 -9px",
            letterSpacing: 0,
            filter: gender === "Female"
              ? "drop-shadow(0 0 8px rgba(244,114,182,0.9)) drop-shadow(0 0 20px rgba(244,114,182,0.55))"
              : `drop-shadow(0 0 8px ${a.glow(0.9)}) drop-shadow(0 0 20px ${a.glow(0.55)})`,
          }}>{gender === "Female" ? "🩷" : "💚"}</span>
          <span style={{
            color: "#fff",
            textShadow: `0 0 18px ${a.glow(0.25)}, 0 2px 16px rgba(0,0,0,0.5)`,
            letterSpacing: 0,
          }}>st</span>
        </p>
      </div>

      {/* ── Floating hearts ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none", overflow: "hidden" }}>
        <style>{`
          @keyframes floatHeart {
            0%   { transform: translateY(0) translateX(0) scale(0.5); opacity: 0; }
            15%  { opacity: 1; }
            80%  { opacity: 0.65; }
            100% { transform: translateY(-38vh) translateX(var(--drift)) scale(1.1); opacity: 0; }
          }
        `}</style>
        {HEARTS.map((h, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: h.x,
              bottom: "28%",
              fontSize: h.size,
              animation: `floatHeart ${h.dur}s ease-out ${h.delay}s infinite`,
              ["--drift" as any]: `${h.drift}px`,
              willChange: "transform, opacity",
              filter: "drop-shadow(0 0 5px rgba(239,68,68,0.5))",
            }}
          >{h.icon}</span>
        ))}
      </div>

      {/* ── Bottom form content ── */}
      <div style={{
        position: "relative", zIndex: 10,
        minHeight: "100dvh",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: "0 22px max(36px, env(safe-area-inset-bottom, 36px))",
      }}>
        <div style={{ width: "100%", maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Find Your Boo */}
          <p style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}>Find Your Boo</p>

          {/* Avatar row */}
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {AVATARS.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #050508",
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: AVATARS.length - i,
                  position: "relative",
                }}
              />
            ))}
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: "rgba(255,255,255,0.45)",
              marginLeft: 10,
            }}>
              {newProfiles.toLocaleString()} New Today · {countryFlag} {countryName}
            </span>
          </div>

          <>

            {/* ── Phone step ── */}
            {authStep === "phone" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Gender toggle */}
                <div style={{
                  display: "flex", borderRadius: 50,
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: 3, gap: 3,
                }}>
                  {(["Female", "Male"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      style={{
                        flex: 1, height: 40, borderRadius: 50, border: "none",
                        background: gender === g
                          ? g === "Female"
                            ? "linear-gradient(to bottom, #f472b6, #ec4899)"
                            : `linear-gradient(to bottom, ${a.accent}, ${a.accentMid})`
                          : "transparent",
                        color: gender === g ? "#fff" : "rgba(255,255,255,0.4)",
                        fontSize: 13, fontWeight: 800, cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: gender === g
                          ? g === "Female"
                            ? "0 4px 14px rgba(244,114,182,0.35)"
                            : `0 4px 14px ${a.glowMid(0.35)}`
                          : "none",
                      }}
                    >
                      {g === "Female" ? "🩷 I'm a Woman" : "💚 I'm a Man"}
                    </button>
                  ))}
                </div>


                {/* Phone input row */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setShowCountryPicker(true)}
                    style={{
                      ...inputBase,
                      height: 46, borderRadius: 14, padding: "0 12px",
                      display: "flex", alignItems: "center", gap: 6,
                      cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{countryCode.flag}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{countryCode.code}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>▾</span>
                  </button>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="WhatsApp number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendCode("whatsapp")}
                    style={{
                      ...inputBase,
                      flex: 1, height: 46, borderRadius: 14,
                      paddingLeft: 16, paddingRight: 16, fontSize: 15,
                    }}
                  />
                </div>

                {/* Server error */}
                {serverError && (
                  <div style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: 12, padding: "10px 14px",
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#fca5a5", margin: "0 0 2px" }}>Sorry, our server is down</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>Please try again later.</p>
                    </div>
                  </div>
                )}

                {/* Send via WhatsApp */}
                <button
                  onClick={() => handleSendCode("whatsapp")}
                  disabled={sending || !isPhoneValid}
                  style={{
                    width: "100%", height: 50, borderRadius: 50, border: "none",
                    background: isPhoneValid
                      ? gender === "Female"
                        ? "linear-gradient(to bottom, #f472b6 0%, #ec4899 40%, #db2777 100%)"
                        : a.gradient
                      : "rgba(255,255,255,0.07)",
                    color: isPhoneValid ? "#fff" : "rgba(255,255,255,0.3)",
                    fontSize: 15, fontWeight: 900, letterSpacing: "0.04em",
                    cursor: isPhoneValid ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: isPhoneValid
                      ? gender === "Female"
                        ? "0 1px 0 rgba(255,255,255,0.28) inset, 0 4px 16px rgba(236,72,153,0.4)"
                        : `0 1px 0 rgba(255,255,255,0.28) inset, 0 4px 16px ${a.glowMid(0.4)}`
                      : "none",
                    transition: "all 0.2s",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)",
                    borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
                  }} />
                  {sending && otpChannel === "whatsapp" ? (
                    <span style={{ opacity: 0.7 }}>Sending to WhatsApp...</span>
                  ) : (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Send Code via WhatsApp
                    </span>
                  )}
                </button>

                {/* SMS fallback */}
                <div style={{ textAlign: "center" }}>
                  <button
                    onClick={() => handleSendCode("sms")}
                    disabled={sending || !isPhoneValid}
                    style={{
                      background: "none", border: "none",
                      color: isPhoneValid ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
                      fontSize: 12, fontWeight: 600, cursor: isPhoneValid ? "pointer" : "default",
                      padding: "2px 0",
                    }}
                  >
                    {sending && otpChannel === "sms" ? "Sending SMS..." : "No WhatsApp? Send code via SMS instead →"}
                  </button>
                </div>

                {/* Legal */}
                <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)", margin: 0, lineHeight: 1.6 }}>
                  By continuing you agree to our{" "}
                  <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Terms</span>
                  {" "}&amp;{" "}
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
                    display: "block", margin: "0 auto",
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.08)", fontSize: 10,
                    letterSpacing: "0.12em",
                  }}
                >· · ·</button>

                {/* Footer */}
                <p style={{ textAlign: "center", margin: "4px 0 0", fontSize: 14, lineHeight: 1.8, fontWeight: 700 }}>
                  <a href="/affiliate/join" style={{
                    color: gender === "Female" ? "rgba(244,114,182,0.75)" : a.glow(0.75),
                    textDecoration: "none",
                  }}>Become an Affiliate</a>
                </p>
              </div>
            )}

            {/* ── OTP step ── */}
            {authStep === "otp" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Back */}
                <button
                  onClick={() => { setAuthStep("phone"); setOtp(["","","","","",""]); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 5, padding: 0,
                    alignSelf: "flex-start",
                  }}
                >
                  ← Change number
                </button>

                {/* Sent confirmation */}
                <div style={{
                  background: a.glow(0.08),
                  border: `1px solid ${a.glow(0.3)}`,
                  borderRadius: 12, padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: gender === "Female"
                      ? "linear-gradient(135deg, #f472b6, #db2777)"
                      : "linear-gradient(135deg, #4ade80, #16a34a)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                    boxShadow: `0 0 12px ${a.glow(0.4)}`,
                  }}>
                    {otpChannel === "whatsapp" ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    ) : "📱"}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>
                      Code sent via {otpChannel === "whatsapp" ? "WhatsApp" : "SMS"}
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                      {countryCode.code} {phone}
                    </p>
                  </div>
                </div>

                {/* 6-digit OTP */}
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
                        width: 44, height: 52, borderRadius: 12,
                        background: digit ? a.glow(0.12) : "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                        border: digit ? `1px solid ${a.glow(0.5)}` : "1px solid rgba(255,255,255,0.14)",
                        color: "#fff", fontSize: 22, fontWeight: 900,
                        textAlign: "center", outline: "none", transition: "all 0.15s",
                        boxSizing: "border-box",
                      }}
                    />
                  ))}
                </div>

                {/* Verify button */}
                <button
                  onClick={handleVerify}
                  disabled={verifying || !isOtpComplete}
                  style={{
                    width: "100%", height: 50, borderRadius: 50, border: "none",
                    background: isOtpComplete
                      ? a.gradient
                      : "rgba(255,255,255,0.07)",
                    color: isOtpComplete ? "#fff" : "rgba(255,255,255,0.3)",
                    fontSize: 15, fontWeight: 900, cursor: isOtpComplete ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: isOtpComplete ? `0 1px 0 rgba(255,255,255,0.28) inset, 0 4px 16px ${a.glowMid(0.4)}` : "none",
                    transition: "all 0.2s", position: "relative", overflow: "hidden",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)",
                    borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
                  }} />
                  {verifying ? <span style={{ opacity: 0.7 }}>Verifying...</span> : <span>Enter Ghost Hotel →</span>}
                </button>

                {/* Resend */}
                <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                  {resendCooldown > 0 ? (
                    <span>Resend in {resendCooldown}s</span>
                  ) : (
                    <span>
                      <button onClick={() => handleSendCode(otpChannel)} style={{ background: "none", border: "none", cursor: "pointer", color: a.accent, fontWeight: 700, fontSize: 12, padding: 0 }}>
                        Resend code
                      </button>
                      {" · "}
                      <button onClick={() => handleSendCode(otpChannel === "whatsapp" ? "sms" : "whatsapp")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontWeight: 600, fontSize: 12, padding: 0 }}>
                        Try {otpChannel === "whatsapp" ? "SMS" : "WhatsApp"} instead
                      </button>
                    </span>
                  )}
                </p>
              </div>
            )}

          </>
        </div>
      </div>

      {/* ── Country picker sheet ── */}
      <AnimatePresence>
        {showCountryPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff", textAlign: "center" }}>Select Country</p>
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

      {/* ── Manifesto popup — fires after 3s ── */}
      <AnimatePresence>
        {showManifesto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowManifesto(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(4,6,4,0.97)",
                borderRadius: "24px 24px 0 0",
                border: `1px solid ${gender === "Female" ? "rgba(244,114,182,0.2)" : a.glow(0.2)}`, borderBottom: "none",
                padding: "0 22px max(36px, env(safe-area-inset-bottom, 36px))",
                boxShadow: "0 -24px 80px rgba(0,0,0,0.7)",
                overflow: "hidden",
              }}
            >
              <div style={{ height: 3, background: gender === "Female" ? "linear-gradient(90deg, #be185d, #f472b6, #ec4899)" : `linear-gradient(90deg, ${a.accentDeep}, ${a.accent}, ${a.accentMid})`, marginLeft: -22, marginRight: -22 }} />
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 20px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 18px", gap: 12 }}
              >
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0, flex: 1 }}>
                  Dating without<br />the noise —<br /><span style={{ color: gender === "Female" ? "#f472b6" : a.accent }}>finally.</span>
                </h2>
                <img
                  src="https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasdasdasd.png"
                  alt=""
                  style={{ width: "auto", height: 250, objectFit: "contain", flexShrink: 0 }}
                />
              </motion.div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28, duration: 0.45 }}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, margin: "0 0 14px" }}>
                2Ghost is the dating app of 2026 that forms relationships like no other dating app. We keep dating simple — no long profiles, no credit card required to get started, and most importantly, we want you to find your soul mate as quickly as possible and move on outside of the 2Ghost app.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32, duration: 0.45 }}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, margin: "0 0 18px" }}>
                We are here to give you an experience like never before, with strict privacy for your profile and high spam filters, supported by live operators. We aim to become the app that leads the future of the dating industry, helping you succeed with less effort, lower cost, and real connections.
              </motion.p>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36, duration: 0.4 }}
                style={{ fontSize: 14, color: gender === "Female" ? "rgba(244,114,182,0.9)" : a.glow(0.9), fontWeight: 900, margin: "0 0 20px", letterSpacing: "0.01em" }}>
                2Ghost — Now its time to - Find your boo. 👻
              </motion.p>

              <div style={{ height: 1, background: gender === "Female" ? "linear-gradient(90deg, transparent, rgba(244,114,182,0.18), transparent)" : `linear-gradient(90deg, transparent, ${a.glow(0.18)}, transparent)`, marginBottom: 20 }} />

              {/* Countdown */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }}
                style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: "50%", background: gender === "Female" ? "#f472b6" : a.accent, boxShadow: gender === "Female" ? "0 0 8px rgba(244,114,182,0.8)" : `0 0 8px ${a.glow(0.8)}`, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 2px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Free membership closes in
                  </p>
                  <p style={{ fontSize: 24, fontWeight: 900, color: gender === "Female" ? "#f472b6" : a.accent, margin: 0, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
                    {formatCountdown(countdown)}
                  </p>
                </div>
              </motion.div>

              <p style={{ margin: "0 0 18px", fontSize: 13, fontWeight: 900, color: "#ef4444", textAlign: "center" }}>
                After this closes, it's paid membership only
              </p>

              <motion.button
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.35 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowManifesto(false)}
                style={{
                  width: "100%", height: 54, borderRadius: 50, border: "none",
                  background: gender === "Female"
                    ? "linear-gradient(to bottom, #f472b6 0%, #ec4899 40%, #db2777 100%)"
                    : a.gradient,
                  color: "#fff", fontSize: 16, fontWeight: 900,
                  cursor: "pointer", letterSpacing: "0.03em",
                  boxShadow: gender === "Female"
                    ? "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 28px rgba(236,72,153,0.45)"
                    : `0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 28px ${a.glowMid(0.45)}`,
                  position: "relative", overflow: "hidden",
                  marginBottom: 14,
                }}
              >
                <div style={{
                  position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)",
                  borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
                }} />
                Join Free Now →
              </motion.button>

              <button
                onClick={() => setShowManifesto(false)}
                style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "4px 0" }}
              >
                Maybe another time
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add to Home Screen banner ── */}
      <AnimatePresence>
        {showA2HS && !isInStandaloneMode && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{
              position: "fixed",
              bottom: 0, left: 0, right: 0,
              zIndex: 9999,
              padding: "0 12px max(20px, env(safe-area-inset-bottom, 20px))",
            }}
          >
            <div style={{
              background: "rgba(4,6,4,0.97)",
              border: `1px solid ${a.glow(0.25)}`,
              borderRadius: 20,
              padding: "16px 16px 14px",
              backdropFilter: "blur(20px)",
              boxShadow: `0 -4px 40px ${a.glow(0.12)}`,
            }}>
              <div style={{ height: 3, background: `linear-gradient(90deg,${a.accentDark},${a.accent})`, borderRadius: "3px 3px 0 0", margin: "-16px -16px 14px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                  background: `linear-gradient(135deg,${a.accentDark},${a.accent})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, boxShadow: `0 0 16px ${a.glow(0.3)}`,
                }}>👻</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>Add 2Ghost to your Home Screen</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0 }}>One tap to open — always ready when you are</p>
                </div>
                <button onClick={dismissA2HS} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 18, cursor: "pointer", padding: "4px", lineHeight: 1, flexShrink: 0 }}>✕</button>
              </div>

              {isIOS ? (
                <div>
                  <div style={{ background: a.glow(0.06), border: `1px solid ${a.glow(0.15)}`, borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
                    {[
                      ["1", "Tap the", "Share button", "⬆️", "at the bottom of Safari"],
                      ["2", "Scroll down and tap", "Add to Home Screen", "➕", ""],
                      ["3", "Tap", "Add", "✓", "— done!"],
                    ].map(([num, pre, bold, icon, post]) => (
                      <div key={num} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: a.accent, background: a.glow(0.12), borderRadius: 4, padding: "1px 5px", flexShrink: 0, marginTop: 1 }}>{num}</span>
                        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>
                          {pre} <strong style={{ color: "#fff" }}>{bold}</strong> {icon} {post}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button onClick={dismissA2HS} style={{ width: "100%", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 0", fontSize: 12, color: "rgba(255,255,255,0.35)", cursor: "pointer", fontWeight: 600 }}>
                    Already added — close
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={dismissA2HS} style={{ flex: "0 0 auto", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "11px 16px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Not now</button>
                  <button onClick={handleA2HSInstall} style={{ flex: 1, background: `linear-gradient(135deg,${a.accentDark},${a.accent})`, border: "none", borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 900, color: "#000", cursor: "pointer" }}>Add to Home Screen →</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
