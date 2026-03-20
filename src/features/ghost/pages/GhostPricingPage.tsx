import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCachedIpCountry } from "@/shared/hooks/useIpCountry";
import { getLocalPrice, buildStripeLink } from "../data/stripePlans";

const GOLD_KEY = "https://ik.imagekit.io/7grri5v7d/Haunted%20hotel%20key%20and%20tag.png";

const PLANS = [
  {
    key: "free",
    icon: "👻",
    name: "Seller Room",
    price: "Free",
    period: "forever",
    sub: "Start exploring — no card needed",
    color: "rgba(255,255,255,0.55)",
    glowColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.12)",
    bg: "rgba(255,255,255,0.03)",
    gradient: "linear-gradient(135deg,#374151,#1f2937)",
    perks: [
      "Browse all profiles · Like unlimited",
      "1 mutual match unlock per week",
      "Ghost Vault: 3 photos · 1 video (30 sec · 30 MB)",
      "Images: JPG · PNG · WEBP (max 5 MB)",
      "Ghost Flash: 1 session per month",
      "Standard position in stack",
    ],
    cta: "Continue Free",
  },
  {
    key: "suite",
    icon: "🏨",
    name: "Ghost Suite",
    price: "$4.99",
    period: "per month",
    sub: "5 match unlocks included — save $15/mo",
    color: "#4ade80",
    glowColor: "rgba(74,222,128,0.35)",
    borderColor: "rgba(74,222,128,0.35)",
    bg: "rgba(74,222,128,0.06)",
    gradient: "linear-gradient(135deg,#16a34a,#22c55e)",
    perks: [
      "5 match unlocks per month included",
      "Ghost Vault: 10 photos · 3 videos (2 min · 100 MB)",
      "Images: JPG · PNG · WEBP (max 10 MB)",
      "Ghost Flash: 4 sessions per month",
      "1 weekly boost — top of stack for 1 hour",
      "Suite badge on your profile card",
      "Ghost Butler access — service numbers visible",
      "Priority placement over free users",
    ],
    cta: "Join Ghost Suite",
  },
  {
    key: "gold",
    icon: null,
    name: "Gold Room",
    price: "$9.99",
    period: "per month",
    sub: "Unlimited everything · highest visibility",
    color: "#d4af37",
    glowColor: "rgba(212,175,55,0.4)",
    borderColor: "rgba(212,175,55,0.45)",
    bg: "rgba(212,175,55,0.06)",
    gradient: "linear-gradient(135deg,#92400e,#d4af37)",
    perks: [
      "Unlimited match unlocks",
      "Ghost Vault: 50 photos · 10 videos (5 min · 300 MB)",
      "Images: JPG · PNG · WEBP (max 20 MB)",
      "Ghost Flash: unlimited sessions",
      "3 boosts per week — top of every stack",
      "Gold Room key badge — highest visibility",
      "Ghost Butler — all 7 service numbers visible",
      "Tonight Mode always on",
      "See who liked you",
      "Profile featured in Ghost Pulse row",
    ],
    cta: "Unlock Gold Room",
  },
];

const COMPARE = [
  { label: "Browse & like profiles",        vals: [true,  true,  true]  },
  { label: "Match unlocks per month",        vals: ["1/wk","5","∞"]     },
  { label: "Ghost Flash sessions",           vals: ["1",   "4",  "∞"]   },
  { label: "Ghost Vault photos",             vals: ["3",   "10", "50"]  },
  { label: "Ghost Vault videos",             vals: ["1",   "3",  "10"]  },
  { label: "Max video length",               vals: ["30s", "2m", "5m"]  },
  { label: "Profile boosts",                 vals: [false, "1/wk","3/wk"]},
  { label: "Suite / Gold badge on card",     vals: [false, "🏨", "🔑"] },
  { label: "Ghost Butler access",            vals: [false, true,  true]  },
  { label: "Priority in browse stack",       vals: [false, true,  true]  },
  { label: "See who liked you",              vals: [false, false, true]  },
  { label: "Tonight Mode always on",         vals: [false, false, true]  },
  { label: "Featured in Ghost Pulse row",    vals: [false, false, true]  },
];

export default function GhostPricingPage() {
  const navigate  = useNavigate();
  const [selected, setSelected] = useState("suite");

  // Local currency
  const countryCode = getCachedIpCountry()?.countryCode ?? "US";
  const localPrice  = getLocalPrice(countryCode);

  // Ghost ID for Stripe client_reference_id
  const ghostId = (() => {
    try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}").ghost_id || ""; } catch { return ""; }
  })();

  const handlePlanCta = (planKey: string) => {
    if (planKey === "free") { navigate("/ghost/setup"); return; }
    const link = buildStripeLink(planKey as "suite" | "gold", ghostId);
    if (link) {
      window.location.href = link;
    } else {
      // Stripe not configured yet — fall through to setup
      navigate("/ghost/setup");
    }
  };

  const plan = PLANS.find((p) => p.key === selected)!;
  const displayPrice = selected === "suite" ? localPrice.suite : selected === "gold" ? localPrice.gold : "Free";

  return (
    <div style={{ minHeight: "100dvh", background: "#000", color: "#fff", overflowX: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "max(16px,env(safe-area-inset-top,16px)) 16px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(74,222,128,0.7)", letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}>
            Ghost Rooms
          </p>
        </div>
        <div style={{ width: 34 }} />
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", padding: "20px 24px 0" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 6px", lineHeight: 1.2 }}>
          Choose Your{" "}
          <span style={{ background: "linear-gradient(135deg,#4ade80,#d4af37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Room
          </span>
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          Private dating. One subscription. Every feature.
        </p>
      </div>

      {/* Plan tabs */}
      <div style={{ display: "flex", gap: 8, padding: "20px 16px 0" }}>
        {PLANS.map((p) => (
          <button
            key={p.key}
            onClick={() => setSelected(p.key)}
            style={{
              flex: 1, height: 44, borderRadius: 12, cursor: "pointer",
              background: selected === p.key ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
              border: selected === p.key ? `1px solid ${p.borderColor}` : "1px solid rgba(255,255,255,0.07)",
              color: selected === p.key ? "#fff" : "rgba(255,255,255,0.3)",
              fontSize: 10, fontWeight: 800, transition: "all 0.18s",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
            }}
          >
            {p.key === "gold"
              ? <img src={GOLD_KEY} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
              : <span style={{ fontSize: 16 }}>{p.icon}</span>}
            <span style={{ fontSize: 9, letterSpacing: "0.04em" }}>{p.key === "free" ? "Free" : p.key === "suite" ? "Suite" : "Gold"}</span>
          </button>
        ))}
      </div>

      {/* Active plan card */}
      <div style={{ padding: "14px 16px 0" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={plan.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{ background: plan.bg, border: `1px solid ${plan.borderColor}`, borderRadius: 20, overflow: "hidden", boxShadow: `0 0 40px ${plan.glowColor}` }}
          >
            <div style={{ height: 3, background: plan.gradient }} />
            <div style={{ padding: "18px 20px 20px" }}>

              {/* Name + price */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: plan.key === "gold" ? "#0a0a0a" : "rgba(0,0,0,0.3)", border: `2px solid ${plan.color}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 12px ${plan.glowColor}` }}>
                    {plan.key === "gold"
                      ? <img src={GOLD_KEY} alt="" style={{ width: 26, height: 26, objectFit: "contain" }} />
                      : <span style={{ fontSize: 20 }}>{plan.icon}</span>}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0 }}>{plan.name}</h2>
                    <p style={{ fontSize: 10, color: plan.color, margin: 0, fontWeight: 700 }}>{plan.sub}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 26, fontWeight: 900, color: plan.color, margin: 0, lineHeight: 1 }}>{displayPrice}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>{plan.period}</p>
                  {plan.key !== "free" && (
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", margin: "2px 0 0" }}>{localPrice.note}</p>
                  )}
                </div>
              </div>

              {/* Perks */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                {plan.perks.map((perk) => (
                  <div key={perk} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                    <div style={{ width: 17, height: 17, borderRadius: "50%", flexShrink: 0, background: `${plan.color}22`, border: `1px solid ${plan.color}55`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      <Check size={9} style={{ color: plan.color }} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.45 }}>{perk}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePlanCta(plan.key)}
                style={{
                  width: "100%", height: 50, borderRadius: 50, border: "none",
                  background: plan.gradient,
                  color: "#fff", fontSize: 15, fontWeight: 900,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: `0 1px 0 rgba(255,255,255,0.2) inset, 0 6px 24px ${plan.glowColor}`,
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom,rgba(255,255,255,0.18),transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
                {plan.cta} <ArrowRight size={16} strokeWidth={2.5} />
              </motion.button>

              {/* Trust signals */}
              {plan.key !== "free" && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 12 }}>
                  {["🔒 Secure checkout", "↩️ Cancel anytime", "🌍 190+ countries"].map(t => (
                    <span key={t} style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              )}

            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Compare table */}
      <div style={{ padding: "20px 16px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px", textAlign: "center" }}>
          Compare all rooms
        </p>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 54px 54px 54px", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", fontWeight: 700, textTransform: "uppercase" }}>Feature</span>
            {[{ label: "Free", color: "rgba(255,255,255,0.4)" }, { label: "Suite", color: "#4ade80" }, { label: "Gold", color: "#d4af37" }].map((h) => (
              <span key={h.label} style={{ fontSize: 9, color: h.color, fontWeight: 800, textAlign: "center", textTransform: "uppercase" }}>{h.label}</span>
            ))}
          </div>
          {COMPARE.map((row, i) => (
            <div key={row.label} style={{ display: "grid", gridTemplateColumns: "1fr 54px 54px 54px", padding: "8px 12px", borderBottom: i < COMPARE.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", alignSelf: "center" }}>{row.label}</span>
              {row.vals.map((v, j) => {
                const colors = ["rgba(255,255,255,0.5)", "#4ade80", "#d4af37"];
                return (
                  <div key={j} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    {v === true
                      ? <Check size={13} style={{ color: colors[j] }} strokeWidth={2.5} />
                      : v === false
                        ? <span style={{ fontSize: 11, color: "rgba(255,255,255,0.12)" }}>—</span>
                        : <span style={{ fontSize: 10, fontWeight: 800, color: colors[j] }}>{v}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom price selector */}
      <div style={{ display: "flex", gap: 8, padding: "14px 16px", marginBottom: "max(16px,env(safe-area-inset-bottom,16px))" }}>
        {PLANS.map((p) => (
          <motion.button
            key={p.key}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(p.key)}
            style={{ flex: 1, borderRadius: 12, padding: "10px 6px", background: selected === p.key ? p.bg : "rgba(255,255,255,0.02)", border: selected === p.key ? `1px solid ${p.borderColor}` : "1px solid rgba(255,255,255,0.06)", cursor: "pointer", textAlign: "center", transition: "all 0.18s" }}
          >
            <p style={{ fontSize: 13, fontWeight: 900, color: selected === p.key ? p.color : "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>{p.price}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", margin: 0, fontWeight: 600 }}>{p.period}</p>
          </motion.button>
        ))}
      </div>

    </div>
  );
}
