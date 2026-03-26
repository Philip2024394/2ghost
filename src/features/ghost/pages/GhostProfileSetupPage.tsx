// ── Ghost Profile Setup ────────────────────────────────────────────────────────
// 5-second butler intro → red-themed slider gathers name/country, languages, intent.

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ghostSupabase } from "../ghostSupabase";

const BG_IMG     = "https://ik.imagekit.io/7grri5v7d/jjj.png";
const BUTLER_IMG = "https://ik.imagekit.io/7grri5v7d/werwerwer-removebg-preview.png";

const R      = "#e01010";
const R_GLOW = "rgba(220,20,20,0.22)";
const R_EDGE = "rgba(220,20,20,0.35)";

const COUNTRIES = [
  { flag: "🇬🇧", name: "United Kingdom" },
  { flag: "🇮🇪", name: "Ireland" },
  { flag: "🇺🇸", name: "United States" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇦🇺", name: "Australia" },
  { flag: "🇳🇿", name: "New Zealand" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇳🇱", name: "Netherlands" },
  { flag: "🇪🇸", name: "Spain" },
  { flag: "🇮🇹", name: "Italy" },
  { flag: "🇵🇹", name: "Portugal" },
  { flag: "🇸🇪", name: "Sweden" },
  { flag: "🇳🇴", name: "Norway" },
  { flag: "🇩🇰", name: "Denmark" },
  { flag: "🇨🇭", name: "Switzerland" },
  { flag: "🇦🇹", name: "Austria" },
  { flag: "🇧🇪", name: "Belgium" },
  { flag: "🇵🇱", name: "Poland" },
  { flag: "🇨🇿", name: "Czech Republic" },
  { flag: "🇮🇩", name: "Indonesia" },
  { flag: "🇲🇾", name: "Malaysia" },
  { flag: "🇸🇬", name: "Singapore" },
  { flag: "🇵🇭", name: "Philippines" },
  { flag: "🇹🇭", name: "Thailand" },
  { flag: "🇻🇳", name: "Vietnam" },
  { flag: "🇯🇵", name: "Japan" },
  { flag: "🇰🇷", name: "South Korea" },
  { flag: "🇮🇳", name: "India" },
  { flag: "🇦🇪", name: "UAE" },
  { flag: "🇸🇦", name: "Saudi Arabia" },
  { flag: "🇿🇦", name: "South Africa" },
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇧🇷", name: "Brazil" },
  { flag: "🇲🇽", name: "Mexico" },
  { flag: "🇦🇷", name: "Argentina" },
  { flag: "🌍", name: "Other" },
];

function detectCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    if (tz.includes("London"))                                            return "United Kingdom";
    if (tz.includes("Dublin"))                                            return "Ireland";
    if (tz.includes("New_York") || tz.includes("Los_Angeles") || tz.includes("Chicago")) return "United States";
    if (tz.includes("Toronto") || tz.includes("Vancouver"))              return "Canada";
    if (tz.includes("Sydney")  || tz.includes("Melbourne"))              return "Australia";
    if (tz.includes("Auckland"))                                          return "New Zealand";
    if (tz.includes("Berlin")  || tz.includes("Vienna"))                 return "Germany";
    if (tz.includes("Paris")   || tz.includes("Brussels"))               return "France";
    if (tz.includes("Amsterdam"))                                         return "Netherlands";
    if (tz.includes("Madrid"))                                            return "Spain";
    if (tz.includes("Rome"))                                              return "Italy";
    if (tz.includes("Stockholm"))                                         return "Sweden";
    if (tz.includes("Jakarta") || tz.includes("Makassar"))               return "Indonesia";
    if (tz.includes("Kuala_Lumpur"))                                      return "Malaysia";
    if (tz.includes("Singapore"))                                         return "Singapore";
    if (tz.includes("Manila"))                                            return "Philippines";
    if (tz.includes("Bangkok"))                                           return "Thailand";
    if (tz.includes("Ho_Chi_Minh") || tz.includes("Hanoi"))              return "Vietnam";
    if (tz.includes("Tokyo"))                                             return "Japan";
    if (tz.includes("Seoul"))                                             return "South Korea";
    if (tz.includes("Kolkata"))                                           return "India";
    if (tz.includes("Dubai"))                                             return "UAE";
    if (tz.includes("Johannesburg"))                                      return "South Africa";
    if (tz.includes("Lagos"))                                             return "Nigeria";
    if (tz.includes("Sao_Paulo"))                                         return "Brazil";
    if (tz.includes("Mexico_City"))                                       return "Mexico";
  } catch {}
  return "Other";
}

const SEEKING = [
  "Marriage",
  "Serious relationship",
  "Dating",
  "Romance",
  "Meaningful connection",
  "Companionship",
  "Friendship",
  "Good conversation",
  "Something magical",
  "Mystery & anonymity",
  "Excitement",
  "Just exploring",
];

const INTRO_DURATION = 10; // seconds

export default function GhostProfileSetupPage() {
  const navigate  = useNavigate();

  // Phase: "intro" shows 5s butler screen, "form" shows the slider
  const [phase,    setPhase]    = useState<"intro" | "form">("intro");
  const [progress, setProgress] = useState(0); // 0–100

  // Form state
  const [step,     setStep]     = useState(0);
  const [name,      setName]     = useState("");
  const [country,   setCountry]  = useState(detectCountry);
  const [languages, setLanguages] = useState<string[]>([]);
  const [seeking,   setSeeking]  = useState<string>("");

  // ── 5-second progress bar ────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "intro") return;
    const interval = 50; // ms tick
    const step_val  = 100 / ((INTRO_DURATION * 1000) / interval);
    const t = setInterval(() => {
      setProgress(p => {
        const next = p + step_val;
        if (next >= 100) {
          clearInterval(t);
          setTimeout(() => setPhase("form"), 100);
          return 100;
        }
        return next;
      });
    }, interval);
    return () => clearInterval(t);
  }, [phase]);

  // Language label → app locale (all 16 supported languages)
  const LANG_TO_LOCALE: Record<string, string> = {
    "English":    "en",
    "Indonesian": "id",
    "Thai":       "th",
    "Vietnamese": "vi",
    "Malay":      "ms",
    "French":     "fr",
    "Mandarin":   "zh",
    "Japanese":   "ja",
    "Korean":     "ko",
    "Arabic":     "ar",
    "Hindi":      "hi",
    "Spanish":    "es",
    "German":     "de",
    "Portuguese": "pt",
    "Russian":    "ru",
    "Filipino":   "tl",
  };

  function toggleLang(lang: string) {
    setLanguages(prev => {
      const next = prev.includes(lang) ? prev.filter(x => x !== lang) : [...prev, lang];
      // Pick best locale from selection — prefer first non-English supported language
      const primary = next.find(l => LANG_TO_LOCALE[l] && l !== "English")
        ?? next.find(l => LANG_TO_LOCALE[l])
        ?? null;
      if (primary) {
        try { localStorage.setItem("ghost_locale", LANG_TO_LOCALE[primary]); } catch {}
      }
      return next;
    });
  }

  function pickSeeking(label: string) {
    setSeeking(label);
  }

  function finish() {
    try {
      if (name.trim())    localStorage.setItem("ghost_alias",   name.trim());
      localStorage.setItem("ghost_country", country);
      if (seeking)          localStorage.setItem("ghost_seeking",   seeking);
      if (languages.length) localStorage.setItem("ghost_languages", JSON.stringify(languages));
      // Persist locale so LanguageContext picks it up on next mount
      const primary = languages.find(l => LANG_TO_LOCALE[l] && l !== "English")
        ?? languages.find(l => LANG_TO_LOCALE[l]);
      if (primary) localStorage.setItem("ghost_locale", LANG_TO_LOCALE[primary]);
      localStorage.setItem("ghost_profile_setup_done", "1");

      // ── Referral processing ──────────────────────────────────────────────
      const refCode = (() => { try { return localStorage.getItem("ghost_referral_code"); } catch { return null; } })();
      if (refCode) {
        const myId = (() => { try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}").ghost_id || JSON.parse(localStorage.getItem("ghost_profile") || "{}").id; } catch { return null; } })();
        if (myId && refCode !== myId) {
          // Record referral row (fire-and-forget — never blocks signup)
          ghostSupabase.from("ghost_referrals").insert({
            inviter_ghost_id: refCode,
            invited_ghost_id: myId,
            status: "pending",
            coins_awarded: 25,   // inviter earns 25 — below the 50-coin contact-reveal threshold
          }).then(null, () => null);
          // Award 10 welcome coins to the new user — meaningful but below reveal threshold
          ghostSupabase.rpc("add_coins_to_ghost", { p_ghost_id: myId, p_amount: 10 }).then(null, () => null);
          try { localStorage.removeItem("ghost_referral_code"); } catch {}
        }
      }
    } catch {}
    navigate("/ghost/gateway", { replace: true });
  }

  const canStep1  = name.trim().length >= 2;
  const canFinish = seeking.length > 0; // works for both string and array

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden" }}>

      {/* Background image */}
      <img src={BG_IMG} alt=""
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center top" }} />

      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.95) 85%)" }} />

      {/* ── Mist / smoke rising behind slider ─────────────────────────────── */}
      <style>{`
        @keyframes mist-rise {
          0%   { transform: translateY(0)   scaleX(1)   ; opacity: 0; }
          15%  { opacity: var(--mist-op); }
          80%  { opacity: var(--mist-op); }
          100% { transform: translateY(-55vh) scaleX(1.35); opacity: 0; }
        }
      `}</style>
      {[
        { left: "5%",  w: 180, h: 120, dur: 7.2, delay: 0,    op: 0.13 },
        { left: "22%", w: 140, h: 100, dur: 9.5, delay: 1.4,  op: 0.09 },
        { left: "40%", w: 220, h: 140, dur: 8.1, delay: 0.6,  op: 0.11 },
        { left: "58%", w: 160, h: 110, dur: 10,  delay: 2.2,  op: 0.08 },
        { left: "72%", w: 200, h: 130, dur: 7.8, delay: 3.1,  op: 0.12 },
        { left: "85%", w: 130, h: 90,  dur: 9,   delay: 0.9,  op: 0.07 },
        { left: "15%", w: 170, h: 115, dur: 11,  delay: 4.5,  op: 0.10 },
        { left: "62%", w: 150, h: 100, dur: 8.6, delay: 5.3,  op: 0.09 },
      ].map((m, i) => (
        <div key={i} style={{
          position: "absolute",
          bottom: "28%", // rises from behind the slider
          left: m.left,
          width: m.w, height: m.h,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, transparent 70%)",
          filter: "blur(28px)",
          pointerEvents: "none",
          zIndex: 3,
          // @ts-ignore
          "--mist-op": m.op,
          animation: `mist-rise ${m.dur}s ease-in-out ${m.delay}s infinite`,
        }} />
      ))}

      {/* ── INTRO PHASE ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            style={{ position: "absolute", inset: 0, display: "flex",
              flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
              padding: "0 28px max(56px,env(safe-area-inset-bottom,56px))" }}
          >
            {/* Butler + quote */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              style={{ width: "100%", maxWidth: 420, marginBottom: 32 }}
            >
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
                <img src={BUTLER_IMG} alt="Butler"
                  style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0,
                    filter: "drop-shadow(0 0 10px rgba(220,20,20,0.4))" }} />
                <div>
                  <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 800,
                    color: "rgba(220,20,20,0.8)", letterSpacing: "0.12em",
                    textTransform: "uppercase" }}>The Butler</p>
                  <p style={{ margin: 0, fontSize: 17, color: "rgba(255,255,255,0.9)",
                    lineHeight: 1.65, fontStyle: "italic",
                    textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
                    "Before I can admit you among my guests…
                    <br />I must prepare your presence."
                  </p>
                </div>
              </div>

              {/* Animated loading dots */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.15, 0.8] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.22 }}
                    style={{ width: 8, height: 8, borderRadius: "50%", background: R,
                      boxShadow: `0 0 8px ${R}` }} />
                ))}
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)",
                  fontStyle: "italic" }}>Preparing your welcome…</p>
              </div>

              {/* Progress bar */}
              <div style={{ height: 3, borderRadius: 2,
                background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <motion.div
                  style={{ height: "100%", borderRadius: 2,
                    background: `linear-gradient(90deg, #b80000, ${R}, #ff4444)`,
                    boxShadow: `0 0 8px ${R}`,
                    width: `${progress}%` }}
                  transition={{ duration: 0.05 }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FORM PHASE — red slider ────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === "form" && (
          <motion.div
            key="form"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0,
              display: "flex", justifyContent: "center" }}
          >
            <div style={{ width: "100%", maxWidth: 480,
              background: "rgba(6,2,2,0.98)",
              borderRadius: "26px 26px 0 0",
              paddingBottom: "max(32px,env(safe-area-inset-bottom,32px))",
              overflow: "hidden",
              boxShadow: `0 -8px 40px rgba(220,20,20,0.18)` }}>

              {/* Red top stripe */}
              <div style={{ height: 3, background: `linear-gradient(90deg,transparent,${R},transparent)` }} />

              {/* Step dots */}
              <div style={{ display: "flex", justifyContent: "center", gap: 7, padding: "14px 0 0" }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    animate={{
                      width: i === step ? 22 : 7,
                      background: i === step ? R : i < step ? "rgba(220,20,20,0.45)" : "rgba(255,255,255,0.13)",
                    }}
                    transition={{ duration: 0.3 }}
                    style={{ height: 7, borderRadius: 4 }} />
                ))}
              </div>

              {/* ── Step content ───────────────────────────────────────────── */}
              <AnimatePresence mode="wait">

                {/* Step 1 — Name + Country */}
                {step === 0 && (
                  <motion.div key="s0"
                    initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.22 }}
                    style={{ padding: "20px 20px 0" }}>

                    <p style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 900, color: "#fff" }}>
                      What shall we call you?
                    </p>
                    <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                      An alias is fine — your privacy is yours to keep
                    </p>

                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name or alias…"
                      maxLength={32}
                      autoFocus
                      style={{ width: "100%", height: 50, borderRadius: 14,
                        padding: "0 14px", boxSizing: "border-box",
                        background: "rgba(220,20,20,0.07)",
                        border: `1px solid ${R_EDGE}`,
                        color: "#fff", fontSize: 15, outline: "none",
                        marginBottom: 14 }} />

                    <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700,
                      color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
                      letterSpacing: "0.1em" }}>Your country</p>

                    <div style={{ position: "relative", marginBottom: 22 }}>
                      <select value={country} onChange={e => setCountry(e.target.value)}
                        style={{ width: "100%", height: 50, borderRadius: 14,
                          padding: "0 36px 0 14px", boxSizing: "border-box",
                          background: "rgba(220,20,20,0.07)",
                          border: `1px solid ${R_EDGE}`,
                          color: "#fff", fontSize: 14, outline: "none",
                          appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}>
                        {COUNTRIES.map(c => (
                          <option key={c.name} value={c.name} style={{ background: "#0a0a0a" }}>
                            {c.flag}  {c.name}
                          </option>
                        ))}
                      </select>
                      <span style={{ position: "absolute", right: 13, top: "50%",
                        transform: "translateY(-50%)", pointerEvents: "none",
                        fontSize: 11, color: "rgba(220,20,20,0.6)" }}>▾</span>
                    </div>

                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => setStep(1)} disabled={!canStep1}
                      style={{ width: "100%", height: 54, borderRadius: 15, border: "none",
                        background: canStep1
                          ? `linear-gradient(135deg, #b80000, ${R})`
                          : "rgba(255,255,255,0.07)",
                        color: canStep1 ? "#fff" : "rgba(255,255,255,0.2)",
                        fontSize: 15, fontWeight: 900, cursor: canStep1 ? "pointer" : "default",
                        boxShadow: canStep1 ? `0 4px 20px ${R_GLOW}` : "none" }}>
                      Continue →
                    </motion.button>
                  </motion.div>
                )}

                {/* Step 2 — Languages */}
                {step === 1 && (
                  <motion.div key="s1"
                    initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.22 }}
                    style={{ padding: "20px 20px 0" }}>

                    <p style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 900, color: "#fff" }}>
                      Which languages do you speak?
                    </p>
                    <p style={{ margin: "0 0 16px", fontSize: 12,
                      color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>
                      Select all you're comfortable with — we'll match you with guests who speak your language
                    </p>

                    {/* Vertical scrollable language list */}
                    <div style={{ position: "relative", marginLeft: -20, marginRight: -20, marginBottom: 18 }}>

                      {/* Top + bottom fade masks */}
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 40,
                        background: "linear-gradient(to bottom, rgba(6,2,2,0.98), transparent)",
                        zIndex: 2, pointerEvents: "none" }} />
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
                        background: "linear-gradient(to top, rgba(6,2,2,0.98), transparent)",
                        zIndex: 2, pointerEvents: "none" }} />

                      <div style={{
                        height: 168,
                        overflowY: "auto",
                        scrollSnapType: "y mandatory",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        padding: "56px 20px",
                        boxSizing: "border-box",
                      }}>
                        {[
                          { flag: "🇬🇧", lang: "English",    code: "EN" },
                          { flag: "🇨🇳", lang: "Mandarin",   code: "ZH" },
                          { flag: "🇮🇩", lang: "Indonesian", code: "ID" },
                          { flag: "🇲🇾", lang: "Malay",      code: "MS" },
                          { flag: "🇯🇵", lang: "Japanese",   code: "JA" },
                          { flag: "🇰🇷", lang: "Korean",     code: "KO" },
                          { flag: "🇹🇭", lang: "Thai",       code: "TH" },
                          { flag: "🇻🇳", lang: "Vietnamese", code: "VI" },
                          { flag: "🇵🇭", lang: "Filipino",   code: "TL" },
                          { flag: "🇮🇳", lang: "Hindi",      code: "HI" },
                          { flag: "🇸🇦", lang: "Arabic",     code: "AR" },
                          { flag: "🇪🇸", lang: "Spanish",    code: "ES" },
                          { flag: "🇫🇷", lang: "French",     code: "FR" },
                          { flag: "🇩🇪", lang: "German",     code: "DE" },
                          { flag: "🇵🇹", lang: "Portuguese", code: "PT" },
                          { flag: "🇷🇺", lang: "Russian",    code: "RU" },
                        ].map(({ flag, lang, code }) => {
                          const sel = languages.includes(lang);
                          return (
                            <motion.div key={lang}
                              onClick={() => toggleLang(lang)}
                              animate={{ scale: sel ? 1.03 : 1 }}
                              transition={{ duration: 0.15 }}
                              style={{
                                scrollSnapAlign: "center",
                                height: 56, display: "flex",
                                alignItems: "center",
                                padding: "0 16px",
                                cursor: "pointer", userSelect: "none",
                                position: "relative", zIndex: 3,
                                background: sel ? "rgba(220,20,20,0.10)" : "transparent",
                                borderRadius: 14,
                                transition: "background 0.18s",
                              }}>
                              {sel && (
                                <motion.span
                                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                                  style={{ position: "absolute", left: 0,
                                    width: 3, height: 28, borderRadius: 2,
                                    background: R, boxShadow: `0 0 8px ${R}` }} />
                              )}
                              <span style={{ fontSize: 22, marginRight: 12 }}>{flag}</span>
                              <span style={{ flex: 1, fontSize: 15,
                                fontWeight: sel ? 800 : 500,
                                color: sel ? "#fff" : "rgba(255,255,255,0.45)" }}>{lang}</span>
                              <span style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                                color: sel ? R : "rgba(255,255,255,0.18)",
                                background: sel ? "rgba(220,20,20,0.15)" : "rgba(255,255,255,0.05)",
                                border: sel ? `1px solid ${R_EDGE}` : "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 6, padding: "2px 6px",
                                marginRight: 8,
                                transition: "all 0.18s",
                              }}>{code}</span>
                              {sel
                                ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    style={{ fontSize: 13, color: R, fontWeight: 900 }}>✓</motion.span>
                                : <span style={{ fontSize: 13, color: "transparent" }}>✓</span>
                              }
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => setStep(2)}
                      disabled={languages.length === 0}
                      style={{ width: "100%", height: 54, borderRadius: 15, border: "none",
                        background: languages.length > 0
                          ? `linear-gradient(135deg, #b80000, ${R})`
                          : "rgba(255,255,255,0.07)",
                        color: languages.length > 0 ? "#fff" : "rgba(255,255,255,0.2)",
                        fontSize: 15, fontWeight: 900,
                        cursor: languages.length > 0 ? "pointer" : "default",
                        boxShadow: languages.length > 0 ? `0 4px 20px ${R_GLOW}` : "none" }}>
                      Continue →
                    </motion.button>
                  </motion.div>
                )}

                {/* Step 3 — Seeking vertical carousel */}
                {step === 2 && (
                  <motion.div key="s2"
                    initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.22 }}
                    style={{ padding: "20px 20px 0" }}>

                    <p style={{ margin: "0 0 2px", fontSize: 19, fontWeight: 900, color: "#fff" }}>
                      What are you seeking?
                    </p>
                    <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                      Scroll and tap to select one
                    </p>

                    {/* Vertical scroll carousel */}
                    <div style={{ position: "relative", marginLeft: -20, marginRight: -20, marginBottom: 18 }}>

                      {/* Top + bottom fade masks */}
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 40,
                        background: "linear-gradient(to bottom, rgba(6,2,2,0.98), transparent)",
                        zIndex: 2, pointerEvents: "none" }} />
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40,
                        background: "linear-gradient(to top, rgba(6,2,2,0.98), transparent)",
                        zIndex: 2, pointerEvents: "none" }} />

                      {/* Center selection highlight bar */}
                      <div style={{ position: "absolute", top: "50%", left: 20, right: 20,
                        transform: "translateY(-50%)", height: 56,
                        borderRadius: 14, border: `1px solid ${R_EDGE}`,
                        background: "rgba(220,20,20,0.07)",
                        zIndex: 1, pointerEvents: "none" }} />

                      {/* Scrollable list */}
                      <div style={{
                        height: 168, // shows ~3 items
                        overflowY: "auto",
                        scrollSnapType: "y mandatory",
                        WebkitOverflowScrolling: "touch",
                        scrollbarWidth: "none",
                        padding: "56px 20px",
                        boxSizing: "border-box",
                      }}>
                        {SEEKING.map(label => {
                          const sel = seeking === label;
                          return (
                            <motion.div key={label}
                              onClick={() => pickSeeking(label)}
                              animate={{
                                color: sel ? "#fff" : "rgba(255,255,255,0.3)",
                                scale: sel ? 1.04 : 1,
                              }}
                              transition={{ duration: 0.18 }}
                              style={{
                                scrollSnapAlign: "center",
                                height: 56, display: "flex",
                                alignItems: "center", justifyContent: "center",
                                fontSize: 16, fontWeight: sel ? 900 : 500,
                                cursor: "pointer", userSelect: "none",
                                letterSpacing: sel ? "0.02em" : "0",
                                position: "relative", zIndex: 3,
                              }}>
                              {sel && (
                                <motion.span
                                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                                  style={{ position: "absolute", left: 0,
                                    width: 3, height: 28, borderRadius: 2,
                                    background: R, boxShadow: `0 0 8px ${R}` }} />
                              )}
                              {label}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={finish} disabled={!canFinish}
                      animate={canFinish ? {
                        boxShadow: [
                          `0 4px 16px ${R_GLOW}`,
                          `0 4px 32px rgba(220,20,20,0.42)`,
                          `0 4px 16px ${R_GLOW}`,
                        ],
                      } : {}}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      style={{ width: "100%", height: 56, borderRadius: 15, border: "none",
                        background: canFinish
                          ? `linear-gradient(135deg, #b80000, ${R})`
                          : "rgba(255,255,255,0.07)",
                        color: canFinish ? "#fff" : "rgba(255,255,255,0.2)",
                        fontSize: 15, fontWeight: 900,
                        cursor: canFinish ? "pointer" : "default" }}>
                      Enter the Hotel 🏨
                    </motion.button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
