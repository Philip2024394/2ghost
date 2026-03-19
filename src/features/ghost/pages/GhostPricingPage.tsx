import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GHOST_HERO = "https://ik.imagekit.io/7grri5v7d/find%20meddddd.png";

const PLANS = [
  {
    key: "founding",
    badge: "🔥 LIMITED",
    badgeColor: "rgba(251,146,60,0.9)",
    name: "Founding Ghost",
    idr: "49,000",
    usd: "~$3",
    period: "for 3 months",
    sub: "Price locks in forever",
    color: "#f97316",
    glowColor: "rgba(249,115,22,0.45)",
    borderColor: "rgba(251,146,60,0.45)",
    bg: "rgba(249,115,22,0.07)",
    perks: [
      "Full Ghost Mode access",
      "Photo · Name · Age · City only",
      "Mutual like — no unsolicited contact",
      "WhatsApp connect on match",
      "Hidden from map & regular feed",
      "Price locked forever at 49k IDR",
    ],
    cta: "Claim Founding Price",
  },
  {
    key: "monthly",
    badge: null,
    name: "Ghost Monthly",
    idr: "69,000",
    usd: "~$4.50",
    period: "per month",
    sub: "Cancel anytime",
    color: "#22c55e",
    glowColor: "rgba(34,197,94,0.4)",
    borderColor: "rgba(74,222,128,0.35)",
    bg: "rgba(34,197,94,0.06)",
    perks: [
      "Full Ghost Mode access",
      "Photo · Name · Age · City only",
      "Mutual like — no unsolicited contact",
      "WhatsApp connect on match",
      "Hidden from map & regular feed",
    ],
    cta: "Start Ghost Mode",
  },
  {
    key: "bundle",
    badge: "⭐ BEST VALUE",
    badgeColor: "rgba(168,85,247,0.9)",
    name: "Ghost + VIP",
    idr: "99,000",
    usd: "~$6.50",
    period: "per month",
    sub: "Ghost Mode + VIP on regular feed",
    color: "#a855f7",
    glowColor: "rgba(168,85,247,0.4)",
    borderColor: "rgba(168,85,247,0.4)",
    bg: "rgba(168,85,247,0.07)",
    perks: [
      "Everything in Ghost Mode",
      "VIP badge on 2dateme feed",
      "Unlimited likes on regular feed",
      "5 Super Likes per month",
      "Priority position in stack",
      "Save vs buying separately",
    ],
    cta: "Get Bundle",
  },
];

export default function GhostPricingPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("founding");

  const plan = PLANS.find((p) => p.key === selected)!;

  return (
    <div style={{ minHeight: "100dvh", background: "#000", color: "#fff", position: "relative", overflow: "hidden" }}>

      {/* ── Faint hero background ── */}
      <img
        src={GHOST_HERO}
        alt=""
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          width: "100%", height: 280,
          objectFit: "cover", objectPosition: "top center",
          opacity: 0.18,
          pointerEvents: "none",
        }}
      />
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 280,
        background: "linear-gradient(to bottom, transparent 30%, #000 100%)",
        pointerEvents: "none",
      }} />

      {/* ── Header ── */}
      <div style={{
        position: "relative", zIndex: 10,
        padding: "max(16px, env(safe-area-inset-top, 16px)) 16px 0",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={() => navigate("/ghost/auth")}
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.6)",
          }}
        >
          <ArrowLeft size={16} />
        </button>

        <div style={{ flex: 1, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(74,222,128,0.7)", letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}>
            2Ghost · Indonesia
          </p>
        </div>
        <div style={{ width: 34 }} />
      </div>

      {/* ── Title ── */}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "20px 24px 0" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 6px", lineHeight: 1.2 }}>
          Choose Your{" "}
          <span style={{
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Ghost Plan
          </span>
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          Private dating. No drama. Cancel anytime.
        </p>
      </div>

      {/* ── Plan selector tabs ── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", gap: 8, padding: "20px 16px 0",
      }}>
        {PLANS.map((p) => (
          <button
            key={p.key}
            onClick={() => setSelected(p.key)}
            style={{
              flex: 1, height: 38, borderRadius: 10, cursor: "pointer",
              background: selected === p.key ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
              border: selected === p.key
                ? `1px solid ${p.borderColor}`
                : "1px solid rgba(255,255,255,0.07)",
              color: selected === p.key ? "#fff" : "rgba(255,255,255,0.35)",
              fontSize: 10, fontWeight: 800, transition: "all 0.18s",
              letterSpacing: "0.04em",
            }}
          >
            {p.key === "founding" ? "👻 Founding" : p.key === "monthly" ? "Monthly" : "VIP Bundle"}
          </button>
        ))}
      </div>

      {/* ── Active plan card ── */}
      <div style={{ position: "relative", zIndex: 10, padding: "14px 16px 0" }}>
        <motion.div
          key={plan.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            background: plan.bg,
            border: `1px solid ${plan.borderColor}`,
            borderRadius: 20, overflow: "hidden",
            boxShadow: `0 0 40px ${plan.glowColor}`,
          }}
        >
          {/* Top accent bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${plan.color}, ${plan.color}99)` }} />

          <div style={{ padding: "18px 20px 20px" }}>

            {/* Badge + name row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0 }}>{plan.name}</h2>
                {plan.badge && (
                  <span style={{
                    background: plan.badgeColor, borderRadius: 6,
                    padding: "2px 8px", fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: "0.06em",
                  }}>
                    {plan.badge}
                  </span>
                )}
              </div>
              {/* Price */}
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: plan.color, lineHeight: 1 }}>
                    {plan.idr}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>IDR</span>
                </div>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>
                  {plan.usd} · {plan.period}
                </p>
              </div>
            </div>

            {/* Sub label */}
            <p style={{
              fontSize: 11, fontWeight: 700,
              color: plan.color,
              margin: "0 0 14px",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <Zap size={11} fill="currentColor" />
              {plan.sub}
            </p>

            {/* Perks */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
              {plan.perks.map((perk) => (
                <div key={perk} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                    background: `${plan.color}22`,
                    border: `1px solid ${plan.color}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: 1,
                  }}>
                    <Check size={10} style={{ color: plan.color }} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>{perk}</span>
                </div>
              ))}
            </div>

            {/* CTA button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -1 }}
              onClick={() => navigate("/ghost/setup")}
              style={{
                width: "100%", height: 50, borderRadius: 50, border: "none",
                background: plan.key === "founding"
                  ? "linear-gradient(to bottom, #fb923c, #f97316, #ea580c)"
                  : plan.key === "monthly"
                    ? "linear-gradient(to bottom, #4ade80, #22c55e, #16a34a)"
                    : "linear-gradient(to bottom, #c084fc, #a855f7, #9333ea)",
                color: "#fff",
                fontSize: 15, fontWeight: 900,
                letterSpacing: "0.04em",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: `0 1px 0 rgba(255,255,255,0.25) inset, 0 6px 24px ${plan.glowColor}`,
                textShadow: "0 1px 2px rgba(0,0,0,0.25)",
                position: "relative", overflow: "hidden",
              }}
            >
              {/* Top gloss */}
              <div style={{
                position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
                background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)",
                borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
              }} />
              {plan.cta}
              <ArrowRight size={16} strokeWidth={2.5} />
            </motion.button>

          </div>
        </motion.div>
      </div>

      {/* ── Compare all plans ── */}
      <div style={{ position: "relative", zIndex: 10, padding: "18px 16px 0" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px", textAlign: "center" }}>
          Compare plans
        </p>
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14, overflow: "hidden",
        }}>
          {/* Header row */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 80px 80px 80px",
            padding: "10px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>FEATURE</span>
            {["Founding", "Monthly", "Bundle"].map((h) => (
              <span key={h} style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, textAlign: "center" }}>{h}</span>
            ))}
          </div>
          {[
            { label: "Ghost Mode", vals: [true, true, true] },
            { label: "WhatsApp match", vals: [true, true, true] },
            { label: "Hidden from map", vals: [true, true, true] },
            { label: "VIP on 2dateme", vals: [false, false, true] },
            { label: "Super Likes", vals: [false, false, true] },
            { label: "Price lock forever", vals: [true, false, false] },
          ].map((row, i) => (
            <div key={row.label} style={{
              display: "grid", gridTemplateColumns: "1fr 80px 80px 80px",
              padding: "9px 14px",
              borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none",
              background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
            }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{row.label}</span>
              {row.vals.map((v, j) => (
                <div key={j} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  {v ? (
                    <Check size={14} style={{ color: "#22c55e" }} strokeWidth={2.5} />
                  ) : (
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>—</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Price summary row ── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", gap: 8, padding: "12px 16px",
        marginBottom: "max(16px, env(safe-area-inset-bottom, 16px))",
      }}>
        {PLANS.map((p) => (
          <motion.button
            key={p.key}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(p.key)}
            style={{
              flex: 1, borderRadius: 12, padding: "10px 8px",
              background: selected === p.key ? p.bg : "rgba(255,255,255,0.03)",
              border: selected === p.key ? `1px solid ${p.borderColor}` : "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer", textAlign: "center",
              transition: "all 0.18s",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 900, color: selected === p.key ? p.color : "rgba(255,255,255,0.5)", margin: "0 0 2px" }}>
              {p.idr}
            </p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0, fontWeight: 600 }}>IDR · {p.usd}</p>
          </motion.button>
        ))}
      </div>

    </div>
  );
}
