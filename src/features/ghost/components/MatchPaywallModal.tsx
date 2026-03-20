import { motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { GhostProfile } from "../types/ghostTypes";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

// ── Match paywall — pay to unlock contact on mutual match ─────────────────────
export default function MatchPaywallModal({
  profile, onPay, onClose,
}: {
  profile: GhostProfile;
  onPay: (plan: string) => void;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const PLANS = [
    { key: "founding", emoji: "⭐", name: "Founding Ghost", idr: "49,000", usd: "~$3", period: "3 months · locks forever", color: "#f59e0b", gradient: "linear-gradient(to bottom, #fbbf24, #f59e0b, #d97706)", glow: "rgba(251,191,36,0.45)", border: "rgba(251,191,36,0.4)" },
    { key: "monthly",  emoji: "👻", name: "Ghost Monthly",  idr: "69,000", usd: "~$4.50", period: "per month · cancel anytime", color: "#22c55e", gradient: "linear-gradient(to bottom, #4ade80, #22c55e, #16a34a)", glow: "rgba(34,197,94,0.45)",  border: "rgba(74,222,128,0.4)" },
    { key: "bundle",   emoji: "⭐", name: "Ghost + VIP",    idr: "99,000", usd: "~$6.50", period: "per month · best value",     color: "#a855f7", gradient: "linear-gradient(to bottom, #c084fc, #a855f7, #9333ea)", glow: "rgba(168,85,247,0.45)", border: "rgba(168,85,247,0.4)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(6,6,10,0.97)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none", overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)" }} />

        <div style={{ padding: "20px 18px 32px", position: "relative" }}>
          {/* Close */}
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            width: 28, height: 28, borderRadius: 8,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.5)",
          }}><X size={13} /></button>

          {/* Matched person teaser */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={profile.image} alt={profile.name}
                style={{
                  width: 60, height: 60, borderRadius: "50%", objectFit: "cover",
                  border: "2px solid rgba(74,222,128,0.5)",
                  filter: "blur(6px)",
                }}
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>❤️</div>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(74,222,128,0.9)", margin: "0 0 4px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                <span><img src={GHOST_LOGO} alt="" style={{ width: 48, height: 48, objectFit: "contain", verticalAlign: "middle", marginRight: 6 }} /> Ghost Match!</span>
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>
                <span>{profile.name}, {profile.age}</span>
              </h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                <span>{profile.countryFlag} {profile.city}, {profile.country}</span>
              </p>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 16px", lineHeight: 1.5 }}>
            <span>{t("match.likedEachOther")}</span>
          </p>

          {/* Plans */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {PLANS.map((p) => (
              <motion.button
                key={p.key}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPay(p.key)}
                style={{
                  width: "100%", borderRadius: 14, padding: "11px 16px",
                  background: `rgba(255,255,255,0.04)`,
                  border: `1px solid ${p.border}`,
                  cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 1px" }}>
                    <span>{p.emoji === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} /> : p.emoji} {p.name}</span>
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}><span>{p.period}</span></p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 15, fontWeight: 900, color: p.color, margin: 0 }}><span>{p.idr} IDR</span></p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0 }}><span>{p.usd}</span></p>
                  </div>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: p.gradient,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 12px ${p.glow}`,
                  }}>
                    <ArrowRight size={14} color="#fff" strokeWidth={2.5} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 12, marginBottom: 0 }}>
            <span>🔒 Private · No public profile · contact shared on match only</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
