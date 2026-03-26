import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ghostSupabase } from "../ghostSupabase";
import { recordConversion } from "../../affiliate/affiliateStorage";


const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

const ROOM_ROUTES: Record<string, string> = {
  suite:     "/ghost/rooms",
  kings:     "/ghost/rooms",
  penthouse: "/ghost/rooms",
  cellar:    "/ghost/rooms",
  garden:    "/ghost/rooms",
  gold:      "/ghost/rooms",
  standard:  "/ghost/mode",
};

const TIER_META: Record<string, { label: string; icon: string; color: string; gradient: string; floor: string; welcome: string }> = {
  standard:  { label: "Standard",      icon: "🏠", color: "#4ade80",  gradient: "linear-gradient(135deg,#16a34a,#4ade80)",     floor: "Standard Floor",   welcome: "Your room is ready on the Standard Floor." },
  suite:     { label: "Ghost Ensuite", icon: "🏨", color: "#4ade80",  gradient: "linear-gradient(135deg,#16a34a,#22c55e)",     floor: "Ensuite Floor",    welcome: "Your ensuite has been prepared. The finest standard of comfort awaits." },
  kings:     { label: "The Casino",    icon: "🎰", color: "#f59e0b",  gradient: "linear-gradient(135deg,#b45309,#f59e0b)",     floor: "Casino Floor",      welcome: "The Casino Floor recognises your arrival. Your crown has been noted." },
  penthouse: { label: "Penthouse",     icon: "🌙", color: "#c084fc",  gradient: "linear-gradient(135deg,#7e22ce,#c084fc)",     floor: "Penthouse",        welcome: "The Penthouse is yours. Very few reach this floor." },
  cellar:    { label: "The Cellar",    icon: "🕯️", color: "#f87171",  gradient: "linear-gradient(135deg,#991b1b,#f87171)",     floor: "The Cellar",       welcome: "The Cellar doors open for you. What lies below is known only to the bold." },
  garden:    { label: "Garden Lodge",  icon: "🌿", color: "#86efac",  gradient: "linear-gradient(135deg,#14532d,#86efac)",     floor: "Garden Lodge",     welcome: "The Private Terrace is yours. Quiet, exclusive, unhurried." },
  gold:      { label: "Gold Room",     icon: "🔑", color: "#d4af37",  gradient: "linear-gradient(135deg,#92400e,#d4af37)",     floor: "Gold Floor",       welcome: "The Gold Room key is in your hand. Every door in the hotel is now open." },
};

export default function GhostPaymentSuccessPage() {
  const navigate        = useNavigate();
  const [params]        = useSearchParams();
  const [done, setDone] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; delay: number }[]>([]);

  const VALID_PLANS = ["standard", "suite", "kings", "penthouse", "cellar", "garden", "gold"];
  const planParam = params.get("plan") ?? "";
  const isCoins   = planParam === "coins";
  const coinsAmount = isCoins ? Number(params.get("amount") ?? 0) : 0;
  const plan = VALID_PLANS.includes(planParam) ? planParam : "suite";
  const meta = TIER_META[plan] ?? TIER_META.suite;

  useEffect(() => {
    if (isCoins && coinsAmount > 0) {
      // ── Coin purchase fulfillment ──────────────────────────────────────────
      // Webhook is authoritative, but we also update locally as instant feedback.
      // Supabase balance is polled until it reflects the new amount (webhook race).
      try {
        const raw = localStorage.getItem("ghost_profile");
        const profile = raw ? JSON.parse(raw) : {};
        const ghostId: string = profile.ghost_id || profile.phone || profile.whatsapp || "";
        const firstDone = !!localStorage.getItem("ghost_first_purchase_done");
        const bonus = firstDone ? 0 : coinsAmount;
        const current = Number(localStorage.getItem("ghost_coins") || "0");
        const next = current + coinsAmount + bonus;
        localStorage.setItem("ghost_coins", String(next));
        if (!firstDone) localStorage.setItem("ghost_first_purchase_done", "1");

        if (ghostId) {
          // Poll Supabase until the webhook-fulfilled balance appears (max 10s)
          let attempts = 0;
          const poll = setInterval(async () => {
            attempts++;
            const { data } = await ghostSupabase
              .from("ghost_coins")
              .select("balance")
              .eq("ghost_id", ghostId)
              .maybeSingle();
            if (data?.balance && data.balance > current) {
              localStorage.setItem("ghost_coins", String(data.balance));
              clearInterval(poll);
            }
            if (attempts >= 10) clearInterval(poll);
          }, 1000);
        }
      } catch {}

    } else {
      // ── Tier purchase fulfillment ──────────────────────────────────────────
      try {
        localStorage.setItem("ghost_house_tier", plan);
        const raw = localStorage.getItem("ghost_profile");
        if (raw) {
          const profile = JSON.parse(raw);
          profile.tier = plan;
          localStorage.setItem("ghost_profile", JSON.stringify(profile));
          if (profile.ghost_id) {
            ghostSupabase
              .from("ghost_profiles")
              .update({ tier: plan, updated_at: new Date().toISOString() })
              .eq("ghost_id", profile.ghost_id)
              .then(null, () => null);
          }
        }
      } catch {}

      recordConversion(plan as "suite" | "gold");
    }

    // Spawn particle burst
    const ps = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      y: 20 + Math.random() * 30,
      color: [meta.color, "#fff", "#d4af37", "#a78bfa"][i % 4],
      delay: Math.random() * 0.6,
    }));
    setParticles(ps);
    setTimeout(() => setParticles([]), 3000);

    const t = setTimeout(() => setDone(true), 2400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, isCoins, coinsAmount]);

  // Deterministic ghost ID from profile
  const ghostIdSuffix = (() => {
    try {
      const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
      const phone: string = p.phone || p.whatsapp || "";
      if (phone.length >= 4) return phone.slice(-4);
    } catch {}
    return String(Math.floor(1000 + Math.random() * 9000));
  })();

  return (
    <div style={{
      minHeight: "100dvh", background: "#050508", color: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "32px 24px", textAlign: "center",
      position: "relative", overflow: "hidden",
    }}>

      {/* Particle burst */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: `${p.x}vw`, y: `${p.y}vh`, scale: 0 }}
          animate={{ opacity: 0, y: `${p.y - 30}vh`, scale: 1.4 }}
          transition={{ duration: 1.2 + p.delay, ease: "easeOut", delay: p.delay }}
          style={{ position: "fixed", width: 8, height: 8, borderRadius: "50%", background: p.color, pointerEvents: "none", zIndex: 0 }}
        />
      ))}

      {/* Glow background */}
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${meta.color}18, transparent 70%)`, pointerEvents: "none" }} />

      {/* Logo */}
      <motion.img
        src={GHOST_LOGO}
        alt="2Ghost"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
        style={{ width: 64, height: 64, objectFit: "contain", marginBottom: 8, position: "relative", zIndex: 1 }}
      />

      {/* Badge */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.25 }}
        style={{
          width: 80, height: 80, borderRadius: "50%",
          background: `radial-gradient(circle, ${isCoins ? "rgba(212,175,55,0.22)" : meta.color + "22"}, transparent)`,
          border: `2px solid ${isCoins ? "#d4af37" : meta.color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 36, marginBottom: 24, position: "relative", zIndex: 1,
          boxShadow: isCoins
            ? "0 0 48px rgba(212,175,55,0.44), 0 0 80px rgba(212,175,55,0.22)"
            : `0 0 48px ${meta.color}44, 0 0 80px ${meta.color}22`,
        }}
      >
        {isCoins ? "🪙" : meta.icon}
      </motion.div>

      {/* Header text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{ position: "relative", zIndex: 1 }}
      >
        <p style={{ fontSize: 10, fontWeight: 800, color: isCoins ? "#d4af37" : meta.color, letterSpacing: "0.18em", textTransform: "uppercase", margin: "0 0 10px" }}>
          {isCoins ? "Coins Delivered" : "Check-In Confirmed"}
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 8px", lineHeight: 1.2 }}>
          {isCoins ? (
            <><span style={{ color: "#d4af37" }}>{coinsAmount.toLocaleString()} Coins</span><br />added to your wallet</>
          ) : (
            <>Welcome to the<br /><span style={{ color: meta.color }}>{meta.floor}</span></>
          )}
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.38)", margin: "0 0 6px" }}>
          Ghost-{ghostIdSuffix} · {isCoins ? "Coin Top-Up" : meta.label}
        </p>
      </motion.div>

      {/* Hotel letter */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.45 }}
        style={{
          background: `${meta.color}0a`,
          border: `1px solid ${meta.color}28`,
          borderRadius: 20, padding: "22px 22px",
          width: "100%", maxWidth: 340, textAlign: "left",
          marginTop: 20, marginBottom: 28,
          position: "relative", zIndex: 1,
        }}
      >
        {/* Letter header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${meta.color}1a` }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${meta.color}18`, border: `1px solid ${meta.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
            {meta.icon}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 900, color: meta.color }}>2Ghost Hotel</p>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Guest Services · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.75, margin: "0 0 14px" }}>
          Dear <span style={{ color: meta.color, fontWeight: 800 }}>Ghost-{ghostIdSuffix}</span>,
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.62)", lineHeight: 1.75, margin: "0 0 14px" }}>
          On behalf of the entire 2Ghost Hotel, thank you for your reservation. {meta.welcome}
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.62)", lineHeight: 1.75, margin: "0 0 14px" }}>
          The floors are alive with guests. The Ghost Radio is broadcasting. The Séance rooms are open. Your story begins now — and we are honoured to host it.
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, margin: 0 }}>
          We wish you a <span style={{ color: "#fff", fontWeight: 700 }}>pleasant stay</span> — and as always at 2Ghost...
        </p>
        <p style={{ fontSize: 16, fontWeight: 900, color: meta.color, margin: "10px 0 0", letterSpacing: "0.04em" }}>
          Happy Haunting. 👻
        </p>

        {/* Signature line */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${meta.color}1a`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.45)" }}>The Management</p>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.2)" }}>2Ghost Hotel · Est. 2025</p>
          </div>
          <img src={GHOST_LOGO} alt="" style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.6 }} />
        </div>
      </motion.div>

      {/* CTA button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: done ? 1 : 0, y: done ? 0 : 10 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(isCoins ? "/ghost/mode" : (ROOM_ROUTES[plan] ?? "/ghost/mode"), { replace: true })}
        style={{
          width: "100%", maxWidth: 320, height: 54, borderRadius: 50, border: "none",
          background: isCoins ? "linear-gradient(135deg, #92400e, #d4af37, #f0d060)" : meta.gradient,
          color: isCoins ? "#000" : "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
          boxShadow: isCoins ? "0 8px 32px rgba(212,175,55,0.44)" : `0 8px 32px ${meta.color}44`,
          position: "relative", zIndex: 1, overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom,rgba(255,255,255,0.2),transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
        {isCoins ? "Back to Hotel →" : `Enter ${meta.floor} →`}
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: done ? 1 : 0 }}
        transition={{ delay: 0.2 }}
        style={{ marginTop: 14, fontSize: 10, color: "rgba(255,255,255,0.2)", position: "relative", zIndex: 1 }}
      >
        {isCoins ? `🪙 ${coinsAmount.toLocaleString()} coins · ready to spend` : "Your subscription is active · Cancel anytime"}
      </motion.p>

    </div>
  );
}
