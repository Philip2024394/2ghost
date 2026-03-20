import { useState } from "react";
import { motion } from "framer-motion";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdf.png";
const APP_BASE   = "https://2ghost.app";          // Update to production URL

/** Derive a short referral code from the user's ghost ID or phone */
function getReferralCode(): string {
  try {
    const raw = localStorage.getItem("ghost_profile");
    if (raw) {
      const p = JSON.parse(raw);
      // Take first 8 chars of id (UUID) and uppercase
      if (p.id) return p.id.replace(/-/g, "").slice(0, 8).toUpperCase();
    }
    const phone = localStorage.getItem("ghost_phone") || "";
    if (phone) return phone.replace(/\D/g, "").slice(-6);
  } catch {}
  return "GHOST001";
}

function getReferralCount(): number {
  try { return Number(localStorage.getItem("ghost_referral_count") || "0"); } catch { return 0; }
}

function getReferralReward(): string | null {
  try { return localStorage.getItem("ghost_referral_reward"); } catch { return null; }
}

type Props = { onClose: () => void };

const REWARDS = [
  { target: 1,  reward: "1 free Ghost Vault day",          emoji: "🏠" },
  { target: 3,  reward: "Ghost Verified Host badge",       emoji: "⭐" },
  { target: 5,  reward: "1 week Ghost Black membership",  emoji: "👻" },
  { target: 10, reward: "1 month Ghost Black + priority", emoji: "🖤" },
];

export default function GhostReferralSheet({ onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const code  = getReferralCode();
  const count = getReferralCount();
  const reward = getReferralReward();
  const link  = `${APP_BASE}?ref=${code}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for devices without clipboard API
      const el = document.createElement("textarea");
      el.value = link;
      el.style.position = "fixed"; el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareLink = async () => {
    const shareData = {
      title: "Join me on 2Ghost 👻",
      text: "Anonymous dating done right — no noise, just real connections. Join with my link:",
      url: link,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await copyLink();
      }
    } catch {}
  };

  const nextReward = REWARDS.find((r) => r.target > count);
  const progressPct = nextReward ? Math.min((count / nextReward.target) * 100, 100) : 100;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, background: "#0d0d0f",
          borderRadius: "24px 24px 0 0", padding: "28px 20px 52px",
          border: "1px solid rgba(74,222,128,0.1)", borderBottom: "none",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "0 auto 24px" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <img src={GHOST_LOGO} alt="ghost" style={{ width: 40, height: 40, objectFit: "contain" }} />
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#fff", margin: 0 }}>Invite Friends 👻</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Earn rewards for every successful invite</p>
          </div>
        </div>

        {/* Referral count + progress */}
        <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 16, padding: 16, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 28, fontWeight: 900, color: "#4ade80", margin: 0, lineHeight: 1 }}>{count}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>friends joined</p>
            </div>
            {reward && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", margin: 0 }}>🎁 Reward unlocked!</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{reward}</p>
              </div>
            )}
          </div>
          {nextReward && (
            <>
              <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#4ade80,#22c55e)", width: `${progressPct}%`, transition: "width 0.5s ease" }} />
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "6px 0 0", fontWeight: 600 }}>
                {nextReward.target - count} more to unlock {nextReward.emoji} {nextReward.reward}
              </p>
            </>
          )}
        </div>

        {/* Reward ladder */}
        <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Reward ladder</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {REWARDS.map((r) => {
            const unlocked = count >= r.target;
            return (
              <div
                key={r.target}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 12,
                  background: unlocked ? "rgba(74,222,128,0.07)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${unlocked ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <span style={{ fontSize: 20 }}>{r.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: unlocked ? "#4ade80" : "rgba(255,255,255,0.5)", margin: 0 }}>{r.reward}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0 }}>{r.target} friend{r.target > 1 ? "s" : ""}</p>
                </div>
                {unlocked && <span style={{ fontSize: 14, color: "#4ade80" }}>✓</span>}
              </div>
            );
          })}
        </div>

        {/* Your referral code */}
        <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>Your invite link</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
          <p style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, wordBreak: "break-all" }}>{link}</p>
          <button
            onClick={copyLink}
            style={{
              flexShrink: 0, height: 32, borderRadius: 8, padding: "0 14px",
              background: copied ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.07)",
              border: `1px solid ${copied ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)"}`,
              color: copied ? "#4ade80" : "rgba(255,255,255,0.6)",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={shareLink}
            style={{
              flex: 1, height: 50, borderRadius: 50, border: "none",
              background: "linear-gradient(135deg,#4ade80,#22c55e)",
              color: "#000", fontSize: 14, fontWeight: 800, cursor: "pointer",
            }}
          >
            Share Invite Link
          </button>
          <button
            onClick={onClose}
            style={{
              width: 50, height: 50, borderRadius: 50, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)",
              fontSize: 18, cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
