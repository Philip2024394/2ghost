import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { PHONE_APPS, getUsernamePlatform } from "../data/connectPlatforms";
import type { GhostProfile } from "../types/ghostTypes";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { getMyGhostId } from "../ghostDataService";
import GhostVideoCall from "./GhostVideoCall";

// Seeded preference for mock profiles (no real contactPref set)
function seededContactPref(profileId: string, gender: string): "video" | "connect" {
  let h = 0;
  for (let i = 0; i < profileId.length; i++) { h = Math.imul(31, h) + profileId.charCodeAt(i) | 0; }
  const n = Math.abs(h) % 100;
  // Females: 58% prefer video. Males: 28% prefer video.
  return gender === "Female" ? (n < 58 ? "video" : "connect") : (n < 28 ? "video" : "connect");
}

export default function ConnectNowPopup({ profile, onDone }: { profile: GhostProfile; onDone: () => void }) {
  const a = useGenderAccent();
  const { t } = useLanguage();
  const firstName = profile.name.split(" ")[0];
  const altPlatform = profile.connectAlt ? getUsernamePlatform(profile.connectAlt) : undefined;
  const hasPhone = !!profile.connectPhone;
  const [copied, setCopied] = useState<string | null>(null);
  const [foundEachOther, setFoundEachOther] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Resolve contact preference
  const myGender: string = (() => { try { return localStorage.getItem("ghost_gender") ?? ""; } catch { return ""; } })();
  const myPref: "video" | "connect" = (() => { try { return (localStorage.getItem("ghost_contact_pref") as "video" | "connect") || "connect"; } catch { return "connect"; } })();
  const theirPref: "video" | "connect" = profile.contactPref ?? seededContactPref(profile.id, profile.gender);

  // Female preference wins — if either party is female and wants video, video goes first
  const femaleWantsVideo =
    (profile.gender === "Female" && theirPref === "video") ||
    (myGender === "Female" && myPref === "video");
  const showVideoFirst = femaleWantsVideo || theirPref === "video" || myPref === "video";

  const myGhostId = getMyGhostId() || "ghost-local";

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  // If video call is active, render full-screen call component
  if (showVideoCall) {
    return (
      <GhostVideoCall
        matchProfile={profile}
        myGhostId={myGhostId}
        onEnd={() => setShowVideoCall(false)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(4,10,4,0.98)", backdropFilter: "blur(40px)",
          borderRadius: "24px 24px 0 0",
          border: `1px solid ${a.glow(0.25)}`, borderBottom: "none",
          padding: "0 22px max(40px, env(safe-area-inset-bottom, 40px))",
          boxShadow: "0 -28px 80px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ height: 4, background: "linear-gradient(90deg, #d97706, #fbbf24, #f59e0b, #fbbf24, #d97706)", marginLeft: -22, marginRight: -22 }} />
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 6px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }} style={{ fontSize: 44, marginBottom: 8 }}>✨</motion.div>
          <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.02em", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {t("match.connected")}
          </h2>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.5 }}>
            {firstName}'s contact is now unlocked.
          </p>
        </div>

        {/* Profile row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
          <img src={profile.image} alt={firstName} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.4)}`, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{profile.name}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{profile.age} · {profile.city} {profile.countryFlag}</p>
          </div>
          {showVideoFirst && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 20, padding: "4px 10px" }}>
              <span style={{ fontSize: 12 }}>🎥</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#4ade80" }}>
                {profile.gender === "Female" && theirPref === "video" ? "Prefers video" : "Video first"}
              </span>
            </div>
          )}
        </div>

        {/* Ghost Date — video call option — shown first if female prefers video */}
        {showVideoFirst && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(74,222,128,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>
              {profile.gender === "Female" && theirPref === "video"
                ? `${firstName} prefers to meet on video first 🎥`
                : "Preferred: Ghost Date 🎥"}
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowVideoCall(true)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 14,
                background: "rgba(74,222,128,0.07)", border: "1.5px solid rgba(74,222,128,0.35)",
                borderRadius: 16, padding: "14px 16px", cursor: "pointer",
                boxShadow: "0 0 20px rgba(74,222,128,0.1)",
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(74,222,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 22 }}>🎥</span>
              </div>
              <div style={{ flex: 1, textAlign: "left" }}>
                <p style={{ fontSize: 14, fontWeight: 900, color: "#4ade80", margin: "0 0 2px" }}>Start Ghost Date</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>Video call · Gallery Room · Private</p>
              </div>
              <span style={{ fontSize: 18, color: "#4ade80", opacity: 0.7 }}>→</span>
            </motion.button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 8px" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: "0.08em" }}>OR CONNECT DIRECTLY</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            </div>
          </div>
        )}

        {/* Phone-based apps */}
        {hasPhone && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
              {showVideoFirst ? "Phone / Chat" : "Tap to open"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PHONE_APPS.map((app) => (
                <motion.a
                  key={app.key}
                  href={app.getLink(profile.connectPhone!)}
                  target="_blank" rel="noopener noreferrer"
                  whileTap={{ scale: 0.97 }}
                  onClick={onDone}
                  style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", border: `1.5px solid ${app.color}35`, borderRadius: 14, padding: "13px 16px", textDecoration: "none", cursor: "pointer" }}
                >
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{app.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: app.color, margin: 0 }}>{app.label}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>{profile.connectPhone}</p>
                  </div>
                  <span style={{ fontSize: 18, color: app.color, opacity: 0.7 }}>→</span>
                </motion.a>
              ))}
            </div>
          </div>
        )}

        {/* Alt platform */}
        {altPlatform && profile.connectAltHandle && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Also on</p>
            {altPlatform.getLink ? (
              <motion.a href={altPlatform.getLink(profile.connectAltHandle)} target="_blank" rel="noopener noreferrer" whileTap={{ scale: 0.97 }} onClick={onDone}
                style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", border: `1.5px solid ${altPlatform.color}35`, borderRadius: 14, padding: "13px 16px", textDecoration: "none", cursor: "pointer" }}>
                <span style={{ fontSize: 26 }}>{altPlatform.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: altPlatform.color, margin: 0 }}>{altPlatform.label}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>{profile.connectAltHandle}</p>
                </div>
                <span style={{ fontSize: 18, color: altPlatform.color, opacity: 0.7 }}>→</span>
              </motion.a>
            ) : (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleCopy(profile.connectAltHandle!, "alt")}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", border: `1.5px solid ${altPlatform.color}35`, borderRadius: 14, padding: "13px 16px", cursor: "pointer" }}>
                <span style={{ fontSize: 26 }}>{altPlatform.emoji}</span>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: altPlatform.color, margin: 0 }}>{altPlatform.label}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>{profile.connectAltHandle}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: copied === "alt" ? "#4ade80" : "rgba(255,255,255,0.4)" }}>
                  {copied === "alt" ? "Copied ✓" : "Copy ID"}
                </span>
              </motion.button>
            )}
          </div>
        )}

        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${a.glow(0.15)}, transparent)`, margin: "6px 0 16px" }} />

        <AnimatePresence mode="wait">
          {foundEachOther ? (
            <motion.div key="found" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>💚</div>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#4ade80", margin: "0 0 6px" }}>Found Each Other!</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 20px", lineHeight: 1.6 }}>
                This is what 2Ghost is about. Wishing you both an amazing story. Happy Haunting 👻
              </p>
              <button onClick={onDone} style={{ width: "100%", height: 46, borderRadius: 50, border: "none", background: "linear-gradient(135deg,#16a34a,#4ade80)", color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                Close & Celebrate 🎉
              </button>
            </motion.div>
          ) : (
            <motion.div key="actions" initial={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setFoundEachOther(true)}
                style={{ width: "100%", height: 46, borderRadius: 50, border: "none", background: "linear-gradient(135deg,#16a34a,#4ade80)", color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: "0 0 20px rgba(74,222,128,0.2)" }}>
                Found Each Other 💚
              </motion.button>
              <button onClick={onDone} style={{ width: "100%", height: 44, borderRadius: 50, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Done — back to feed
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
