/**
 * InviteFriendsSheet — Viral referral loop.
 *
 * How it works:
 *  - Each user gets a unique invite link: https://2ghost.app/welcome?ref=GHOSTID
 *  - When a referred user completes signup, the referrer earns 50 Ghost Coins
 *  - The new user gets 25 bonus coins on first login (handled at welcome/setup)
 *  - Referral count + coins earned shown inside this sheet
 *  - Share via native share API, WhatsApp, or copy-to-clipboard
 *
 * OPTIONAL: Does NOT gate any feature. Pure bonus mechanic.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ghostSupabase } from "../ghostSupabase";

interface Props {
  ghostId: string;
  onClose: () => void;
}

const APP_URL = "https://2ghost.app";

interface ReferralStats {
  totalReferred: number;
  coinsEarned:   number;
  pendingCount:  number;
}

export default function InviteFriendsSheet({ ghostId, onClose }: Props) {
  const [copied, setCopied]       = useState(false);
  const [stats, setStats]         = useState<ReferralStats>({ totalReferred: 0, coinsEarned: 0, pendingCount: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const inviteLink = `${APP_URL}/welcome?ref=${ghostId}`;

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Load referral stats from Supabase
  useEffect(() => {
    async function loadStats() {
      try {
        const { data, error } = await ghostSupabase
          .from("ghost_referrals")
          .select("status, coins_awarded")
          .eq("inviter_ghost_id", ghostId);
        if (error || !data) return;
        const completed = data.filter(r => r.status === "completed");
        setStats({
          totalReferred: completed.length,
          coinsEarned:   completed.reduce((sum, r) => sum + (r.coins_awarded ?? 50), 0),
          pendingCount:  data.filter(r => r.status === "pending").length,
        });
      } catch { /* stats unavailable — show zeros */ }
      finally { setLoadingStats(false); }
    }
    loadStats();
  }, [ghostId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) { handleCopy(); return; }
    try {
      await navigator.share({
        title: "Join me on 2Ghost Hotel 👻",
        text: "I'm on 2Ghost Hotel — the most exclusive anonymous dating experience. Join with my link and get 25 free coins!",
        url: inviteLink,
      });
    } catch { /* user dismissed share */ }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Join me on 2Ghost Hotel 👻\nGet 25 free coins when you sign up: ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const TIERS = [
    { count: 1,  reward: "25 coins",  label: "First Friend",   icon: "🌟" },
    { count: 3,  reward: "100 coins", label: "Social Ghost",   icon: "💫" },
    { count: 5,  reward: "200 coins", label: "Suite Opener",   icon: "🏨" },
    { count: 10, reward: "500 coins", label: "Ghost Royalty",  icon: "👑" },
  ];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="if-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }}
      />

      {/* Sheet */}
      <motion.div
        key="if-sheet"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10000,
          maxWidth: 500, margin: "0 auto",
          background: "#07060a",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(212,175,55,0.2)",
          borderBottom: "none",
          maxHeight: "92dvh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Gold bar */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          style={{ height: 3, flexShrink: 0, background: "linear-gradient(90deg,#92660a,#d4af37,#f0d060,#d4af37,#92660a)", borderRadius: "3px 3px 0 0" }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px", flexShrink: 0, borderBottom: "1px solid rgba(212,175,55,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              🔗
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>Invite Friends</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(212,175,55,0.7)", fontWeight: 600 }}>Earn 25 coins for every friend who joins</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px max(28px,env(safe-area-inset-bottom,28px))" }}>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 10, marginBottom: 22 }}>
            {[
              { label: "Friends Joined", value: loadingStats ? "—" : String(stats.totalReferred) },
              { label: "Coins Earned",   value: loadingStats ? "—" : `${stats.coinsEarned}🪙` },
              { label: "Pending",        value: loadingStats ? "—" : String(stats.pendingCount) },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#d4af37" }}>{s.value}</p>
                <p style={{ margin: "3px 0 0", fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Invite link box */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, padding: "14px 16px", marginBottom: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "rgba(212,175,55,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Your invite link</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {inviteLink}
              </p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                style={{ height: 34, borderRadius: 10, border: "none", background: copied ? "rgba(74,222,128,0.2)" : "rgba(212,175,55,0.15)", color: copied ? "#4ade80" : "#d4af37", fontSize: 12, fontWeight: 900, cursor: "pointer", padding: "0 14px", flexShrink: 0, transition: "all 0.2s" }}
              >
                {copied ? "Copied!" : "Copy"}
              </motion.button>
            </div>
          </div>

          {/* Share buttons */}
          <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleNativeShare}
              style={{ flex: 1, height: 50, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#92660a,#d4af37)", color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer" }}
            >
              Share Link 🔗
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleWhatsApp}
              style={{ height: 50, width: 50, borderRadius: 14, border: "1px solid rgba(37,211,102,0.4)", background: "rgba(37,211,102,0.1)", color: "#25d366", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.083.535 4.042 1.473 5.744L0 24l6.433-1.448A11.935 11.935 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.792 9.792 0 01-4.988-1.363l-.358-.213-3.716.836.875-3.622-.232-.372A9.785 9.785 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
              </svg>
            </motion.button>
          </div>

          {/* Reward tiers */}
          <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(212,175,55,0.6)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>
            Reward Milestones
          </p>
          {TIERS.map(tier => {
            const reached = stats.totalReferred >= tier.count;
            return (
              <div key={tier.count} style={{
                display: "flex", alignItems: "center", gap: 14, marginBottom: 10,
                background: reached ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${reached ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 14, padding: "12px 16px",
                opacity: loadingStats ? 0.5 : 1,
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{tier.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: reached ? "#d4af37" : "rgba(255,255,255,0.7)" }}>{tier.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Invite {tier.count} friend{tier.count > 1 ? "s" : ""}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: reached ? "#d4af37" : "rgba(255,255,255,0.4)" }}>{tier.reward}</p>
                  {reached && <p style={{ margin: "2px 0 0", fontSize: 9, color: "#4ade80", fontWeight: 800 }}>✓ EARNED</p>}
                </div>
              </div>
            );
          })}

          {/* How it works */}
          <div style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 14, padding: "14px 16px", marginTop: 18 }}>
            <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 900, color: "rgba(212,175,55,0.7)", letterSpacing: "0.05em", textTransform: "uppercase" }}>How it works</p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>
              1. Share your personal link with friends<br />
              2. They sign up and create their Ghost profile<br />
              3. You automatically receive 25 coins — they get 10 coins as a welcome gift<br />
              4. Coins are credited within minutes of their first login
            </p>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
