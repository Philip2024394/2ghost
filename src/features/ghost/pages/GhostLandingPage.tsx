import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCachedIpCountry } from "@/shared/hooks/useIpCountry";

import { buildAccent } from "@/shared/hooks/useGenderAccent";
const GHOST_HERO = "https://ik.imagekit.io/7grri5v7d/sfsadfasdfsdfasdfsdadsa.png";

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
  { delay: 0,    x: "15%",  size: 13, dur: 3.8, drift:  10 },
  { delay: 1.2,  x: "42%",  size: 11, dur: 4.1, drift: -12 },
  { delay: 2.4,  x: "70%",  size: 14, dur: 3.5, drift:   8 },
  { delay: 3.6,  x: "85%",  size: 10, dur: 4.3, drift: -10 },
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
  const [gender, setGender]   = useState<"Female" | "Male">("Female");
  const a = buildAccent(gender);
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(false);

  const isFormValid = email.includes("@") && password.length >= 6;

  const handleLogin = () => {
    if (!isFormValid) return;
    setIsLoading(true);
    setServerError(false);
    // TODO: call auth API with email/password
    setTimeout(() => {
      setIsLoading(false);
      try {
        localStorage.setItem("ghost_gender", gender);
        localStorage.setItem("ghost_email", email);
        localStorage.setItem("ghost_password", password);
        localStorage.removeItem("ghost_house_welcomed");
      } catch {}
      navigate("/ghost/gateway", { replace: true });
    }, 1200);
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
          position: "absolute", top: 0, left: 0, right: 0, bottom: 90,
          width: "100%", height: "calc(100% - 90px)",
          objectFit: "cover", objectPosition: "top center",
        }}
      />

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 28%, rgba(5,5,8,0.55) 55%, rgba(5,5,8,0.93) 72%, #050508 90%)",
        pointerEvents: "none",
      }} />



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
              width: h.size,
              height: h.size,
              animation: `floatHeart ${h.dur}s ease-out ${h.delay}s infinite`,
              ["--drift" as any]: `${h.drift}px`,
              willChange: "transform, opacity",
              filter: "drop-shadow(0 0 4px rgba(220,20,20,0.7))",
              display: "inline-block",
            }}
          >
            <svg viewBox="0 0 24 24" width={h.size} height={h.size} fill="#e01010" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </span>
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

          {/* Find My Match */}
          <p style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}>Find My Match</p>

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
                          ? "linear-gradient(to bottom, #ff3b3b 0%, #e01010 40%, #b80000 100%)"
                          : "transparent",
                        color: gender === g ? "#fff" : "rgba(255,255,255,0.4)",
                        fontSize: 13, fontWeight: 800, cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow: gender === g ? "0 4px 14px rgba(220,20,20,0.4)" : "none",
                      }}
                    >
                      {g === "Female" ? "I'm a Woman" : "I'm a Man"}
                    </button>
                  ))}
                </div>


                {/* Email input */}
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  style={{
                    ...inputBase,
                    width: "100%", height: 46, borderRadius: 14,
                    paddingLeft: 16, paddingRight: 16, fontSize: 15,
                    boxSizing: "border-box",
                  }}
                />

                {/* Password input */}
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    style={{
                      ...inputBase,
                      width: "100%", height: 46, borderRadius: 14,
                      paddingLeft: 16, paddingRight: 46, fontSize: 15,
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: "rgba(255,255,255,0.35)", fontSize: 13, padding: 0,
                    }}
                  >{showPassword ? "Hide" : "Show"}</button>
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
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#fca5a5", margin: "0 0 2px" }}>Invalid email or password</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>Please check your details and try again.</p>
                    </div>
                  </div>
                )}

                {/* Login button */}
                <button
                  onClick={handleLogin}
                  disabled={isLoading || !isFormValid}
                  style={{
                    width: "100%", height: 50, borderRadius: 50, border: "none",
                    background: isFormValid ? "linear-gradient(to bottom, #ff3b3b 0%, #e01010 40%, #b80000 100%)" : "rgba(255,255,255,0.07)",
                    color: isFormValid ? "#fff" : "rgba(255,255,255,0.3)",
                    fontSize: 15, fontWeight: 900, letterSpacing: "0.04em",
                    cursor: isFormValid ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: isFormValid ? "0 1px 0 rgba(255,255,255,0.25) inset, 0 4px 16px rgba(220,20,20,0.45)" : "none",
                    transition: "all 0.2s", position: "relative", overflow: "hidden",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)",
                    borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
                  }} />
                  {isLoading ? <span style={{ opacity: 0.7 }}>Signing in...</span> : <span>Proceed To Find →</span>}
                </button>

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

              </div>

          </>
        </div>
      </div>


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
                border: `1px solid ${a.glow(0.2)}`, borderBottom: "none",
                padding: "0 22px max(36px, env(safe-area-inset-bottom, 36px))",
                boxShadow: "0 -24px 80px rgba(0,0,0,0.7)",
                overflow: "hidden",
              }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg, ${a.accentDeep}, ${a.accent}, ${a.accentMid})`, marginLeft: -22, marginRight: -22 }} />
              <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 20px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 0 18px", gap: 12 }}
              >
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", margin: 0, flex: 1 }}>
                  Dating without<br />the noise —<br /><span style={{ color: a.accent }}>finally.</span>
                </h2>
                <img
                  src="https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasdasdasd.png"
                  alt=""
                  style={{ width: "auto", height: 250, objectFit: "contain", flexShrink: 0 }}
                />
              </motion.div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28, duration: 0.45 }}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, margin: "0 0 12px" }}>
                I am Mr Butlas, your host for the dating experience of 2026. Within my hotel, connections are formed unlike anywhere else. I keep dating simple — no long profiles, no credit cards to begin, and most importantly, my purpose is to help you find your soulmate as quickly as possible… so you may leave my halls together.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32, duration: 0.45 }}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, margin: "0 0 12px" }}>
                Every guest under my care is granted strict privacy, carefully managed introductions, and protection from unwanted distractions through refined filtering and attentive oversight. I personally ensure the atmosphere remains… suitable for meaningful encounters.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.34, duration: 0.45 }}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, margin: "0 0 12px" }}>
                Each day, I arrange activities, subtle opportunities, and curated moments designed to bring the right people together at the right time. Here, you will not wander endlessly — you will be guided.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36, duration: 0.45 }}
                style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, margin: "0 0 18px" }}>
                My ambition is simple: to redefine the future of dating. Less effort, less cost… and far more real connections.
              </motion.p>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38, duration: 0.4 }}
                style={{ fontSize: 14, color: a.glow(0.9), fontWeight: 900, margin: "0 0 20px", letterSpacing: "0.01em", fontStyle: "italic" }}>
                Now let's get you checked in — your soulmate awaits. 🎩
              </motion.p>

              <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${a.glow(0.18)}, transparent)`, marginBottom: 20 }} />

              {/* Countdown */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }}
                style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: "50%", background: a.accent, boxShadow: `0 0 8px ${a.glow(0.8)}`, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 2px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Free membership closes in
                  </p>
                  <p style={{ fontSize: 24, fontWeight: 900, color: a.accent, margin: 0, letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
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
                  background: "linear-gradient(to bottom, #ff3b3b 0%, #e01010 40%, #b80000 100%)",
                  color: "#fff", fontSize: 16, fontWeight: 900,
                  cursor: "pointer", letterSpacing: "0.03em",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 28px rgba(220,20,20,0.55)",
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
                  <button onClick={handleA2HSInstall} style={{ flex: 1, background: "linear-gradient(to bottom, #ff3b3b 0%, #e01010 40%, #b80000 100%)", border: "none", borderRadius: 12, padding: "11px 0", fontSize: 13, fontWeight: 900, color: "#fff", cursor: "pointer" }}>Add to Home Screen →</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
