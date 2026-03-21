import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ghostSupabase } from "../ghostSupabase";
import { recordConversion } from "../../affiliate/affiliateStorage";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
export default function GhostPaymentSuccessPage() {
  const a = useGenderAccent();
  const navigate       = useNavigate();
  const [params]       = useSearchParams();
  const [done, setDone] = useState(false);

  const plan = params.get("plan") || "suite"; // ?plan=suite or ?plan=gold

  useEffect(() => {
    // Mark the plan in localStorage immediately so the app reacts
    try {
      localStorage.setItem("ghost_house_tier", plan);
      const raw = localStorage.getItem("ghost_profile");
      if (raw) {
        const profile = JSON.parse(raw);
        profile.tier = plan;
        localStorage.setItem("ghost_profile", JSON.stringify(profile));

        // Also update Supabase if connected
        if (profile.ghost_id) {
          ghostSupabase
            .from("ghost_profiles")
            .update({ tier: plan, updated_at: new Date().toISOString() })
            .eq("ghost_id", profile.ghost_id)
            .then(null, () => null);
        }
      }
    } catch {}

    // Record affiliate conversion if user arrived via referral link
    recordConversion(plan as "suite" | "gold");

    const t = setTimeout(() => setDone(true), 2200);
    return () => clearTimeout(t);
  }, [plan]);

  const planLabel = plan === "gold" ? "Gold Room 🔑" : "Ghost Suite 🏨";
  const planColor = plan === "gold" ? "#d4af37" : a.accent;

  return (
    <div style={{
      minHeight: "100dvh", background: "#050508", color: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "32px 24px", textAlign: "center",
    }}>

      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
        style={{
          width: 90, height: 90, borderRadius: "50%",
          background: `radial-gradient(circle, ${planColor}22, transparent)`,
          border: `2px solid ${planColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40, marginBottom: 28,
          boxShadow: `0 0 40px ${planColor}44`,
        }}
      >
        ✓
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: planColor, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 10px" }}>
          Payment Confirmed
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 10px", lineHeight: 1.2 }}>
          Welcome to<br />
          <span style={{ color: planColor }}>{planLabel}</span>
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 36px", lineHeight: 1.6 }}>
          Your subscription is active. All features are now unlocked.
        </p>
      </motion.div>

      {/* Perks summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          background: `${planColor}0d`,
          border: `1px solid ${planColor}33`,
          borderRadius: 16, padding: "16px 20px", marginBottom: 32,
          width: "100%", maxWidth: 320, textAlign: "left",
        }}
      >
        {(plan === "gold"
          ? ["Unlimited match unlocks", "50 photos · 10 videos in Ghost Room", "3 boosts per week", "See who liked you", "Ghost Butler — all services"]
          : ["5 match unlocks per month", "10 photos · 3 videos in Ghost Room", "1 weekly boost", "Ghost Butler access", "Suite badge on your card"]
        ).map((perk) => (
          <div key={perk} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ color: planColor, fontSize: 13 }}>✓</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{perk}</span>
          </div>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: done ? 1 : 0, y: done ? 0 : 10 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/ghost/mode", { replace: true })}
        style={{
          width: "100%", maxWidth: 320, height: 52, borderRadius: 50, border: "none",
          background: plan === "gold"
            ? "linear-gradient(135deg,#92400e,#d4af37)"
            : `linear-gradient(135deg,#16a34a,${a.accent})`,
          color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
          boxShadow: `0 8px 28px ${planColor}44`,
        }}
      >
        Start Exploring →
      </motion.button>

    </div>
  );
}
