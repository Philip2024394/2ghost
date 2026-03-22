import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { PHONE_APPS, getUsernamePlatform } from "../data/connectPlatforms";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId } from "../utils/ghostHelpers";
import { getDateIdea } from "../data/dateIdeas";
import VaultPrivateChatPopup from "./VaultPrivateChatPopup";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

// ── Match popup ─────────────────────────────────────────────────────────────
export default function GhostMatchPopup({ profile, onClose, isSubscribed, onConnectWhatsApp, onButler }: {
  profile: GhostProfile;
  onClose: () => void;
  isSubscribed: boolean;
  onConnectWhatsApp: () => void;
  onButler?: () => void;
}) {
  const a = useGenderAccent();
  const { t } = useLanguage();
  const firstName = profile.name.split(" ")[0];
  const ghostId = toGhostId(profile.id);
  const altPlatform = profile.connectAlt ? getUsernamePlatform(profile.connectAlt) : undefined;
  const hasPhone = !!profile.connectPhone;
  const [showChat, setShowChat] = useState(false);

  // Confetti particles on mount
  const [confetti] = useState(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ["#fbbf24","#4ade80","#f472b6","#a78bfa","#fff","#fb923c"][i % 6],
      delay: Math.random() * 0.5,
      rotate: Math.random() * 360,
      size: 6 + Math.random() * 8,
    }))
  );

  if (showChat) {
    return (
      <AnimatePresence>
        <VaultPrivateChatPopup
          targetId={`vault_${[toGhostId(profile.id), 'me'].sort().join('_')}`}
          tierColor={a.accent}
          tierIcon="💬"
          onClose={() => setShowChat(false)}
        />
      </AnimatePresence>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px",
      }}
    >
      {confetti.map(c => (
        <motion.div
          key={c.id}
          initial={{ opacity: 1, y: "-5vh", x: `${c.x}vw`, rotate: c.rotate, scale: 0 }}
          animate={{ opacity: 0, y: "110vh", rotate: c.rotate + 720, scale: 1 }}
          transition={{ duration: 2.5 + Math.random(), delay: c.delay, ease: "easeIn" }}
          style={{
            position: "fixed", width: c.size, height: c.size * 0.6,
            background: c.color, borderRadius: 2, zIndex: 299, pointerEvents: "none",
          }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        style={{
          width: "100%", maxWidth: 340, textAlign: "center",
          background: "rgba(8,8,12,0.95)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: 22, border: `1px solid ${a.glow(0.2)}`, overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #d97706, #fbbf24, #f59e0b, #fbbf24, #d97706)" }} />
        <div style={{ padding: "28px 24px 24px" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", border: "2px solid rgba(251,191,36,0.7)", overflow: "hidden", zIndex: 2, boxShadow: "0 0 24px rgba(251,191,36,0.35)" }}>
              <img src={profile.image} alt={firstName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ width: 40, height: 40, borderRadius: "50%", zIndex: 3, marginLeft: -12, background: "linear-gradient(135deg, #f59e0b, #fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(251,191,36,0.5)" }}>
              <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain" }} />
            </div>
          </div>

          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 2px", letterSpacing: "0.05em" }}>
            <span>{ghostId} is revealed as</span>
          </p>
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(251,191,36,0.9)", letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 4px" }}>{t("match.title")}</p>
          <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 4px", background: "linear-gradient(135deg, #fbbf24, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            <span>{firstName}! 🎉</span>
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>
            <span>{profile.age} · {profile.city} {profile.countryFlag}</span>
          </p>

          {/* Dream First Date */}
          {(() => {
            const idea = getDateIdea(profile.id, profile.firstDateIdea);
            if (!idea) return null;
            return (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: "8px 0 12px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.22)", borderRadius: 50, padding: "4px 12px" }}>
                <span style={{ fontSize: 15 }}>{idea.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(251,191,36,0.85)" }}>{idea.label}</span>
              </div>
            );
          })()}

          {isSubscribed ? (
            <>
              {/* ── SUBSCRIBER: show all available connect options ── */}
              <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "12px 0 10px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Reach {firstName} on
              </p>

              {hasPhone && (
                <>
                  {/* Phone-based apps — all work from one number */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 10 }}>
                    {PHONE_APPS.map((app) => (
                      <motion.button
                        key={app.key}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => {
                          const link = app.getLink(profile.connectPhone!);
                          window.open(link, "_blank");
                          onConnectWhatsApp();
                        }}
                        style={{
                          height: 44, borderRadius: 12, padding: "0 14px",
                          background: "rgba(255,255,255,0.05)", border: `1px solid ${app.color}30`,
                          color: app.color, fontWeight: 800, fontSize: 13, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{app.emoji}</span>
                        <span>{app.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </>
              )}

              {/* Username-based alt platform */}
              {altPlatform && profile.connectAltHandle && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (altPlatform.getLink) {
                      window.open(altPlatform.getLink(profile.connectAltHandle!), "_blank");
                    } else {
                      navigator.clipboard?.writeText(profile.connectAltHandle!);
                    }
                    onConnectWhatsApp();
                  }}
                  style={{
                    width: "100%", height: 46, borderRadius: 12, border: `1px solid ${altPlatform.color}40`,
                    background: "rgba(255,255,255,0.04)", color: altPlatform.color,
                    fontWeight: 800, fontSize: 13, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{altPlatform.emoji}</span>
                  <span>{altPlatform.label} · {profile.connectAltHandle}</span>
                  {!altPlatform.getLink && <span style={{ fontSize: 10, opacity: 0.6 }}>tap to copy</span>}
                </motion.button>
              )}

              {!hasPhone && !altPlatform && (
                <button
                  onClick={onConnectWhatsApp}
                  style={{ width: "100%", height: 48, borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${a.accentDark}, ${a.accentMid})`, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 24px ${a.glowMid(0.4)}` }}
                >
                  <MessageCircle size={18} /> {t("match.connectNow")}
                </button>
              )}
            </>
          ) : (
            <>
              {/* ── FREE USER: show which apps this person uses, paywall to unlock ── */}
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "12px 0 10px", lineHeight: 1.5 }}>
                Unlock to connect. {firstName} is reachable on:
              </p>
              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {hasPhone && PHONE_APPS.map((app) => (
                  <span key={app.key} style={{ fontSize: 18, padding: 4, background: "rgba(255,255,255,0.04)", borderRadius: 8, border: `1px solid ${app.color}25` }} title={app.label}>
                    {app.emoji}
                  </span>
                ))}
                {altPlatform && (
                  <span style={{ fontSize: 18, padding: 4, background: "rgba(255,255,255,0.04)", borderRadius: 8, border: `1px solid ${altPlatform.color}25` }} title={altPlatform.label}>
                    {altPlatform.emoji}
                  </span>
                )}
              </div>
              <button
                onClick={onConnectWhatsApp}
                style={{ width: "100%", height: 48, borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${a.accentDark}, ${a.accentMid})`, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 4px 24px ${a.glowMid(0.4)}` }}
              >
                <MessageCircle size={18} /> {t("btn.unlock")}
              </button>
            </>
          )}

          {onButler && (
            <button
              onClick={onButler}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                width: "100%", height: 42, borderRadius: 14, border: "1px solid rgba(251,191,36,0.3)",
                background: "rgba(251,191,36,0.07)", color: "#fbbf24",
                fontSize: 12, fontWeight: 800, cursor: "pointer", margin: "10px 0 0",
              }}
            >
              🎩 Send a Surprise via Ghost Butler
            </button>
          )}
          <button
            onClick={() => setShowChat(true)}
            style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 12, padding: "11px 0", width: "100%", color: "#4ade80", fontSize: 13, fontWeight: 800, cursor: "pointer", marginTop: 8 }}
          >
            Chat in 2Ghost 💬
          </button>
          <button onClick={onClose} style={{ display: "block", margin: "10px auto 0", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer" }}>
            Keep browsing
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
