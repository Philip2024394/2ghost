import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BUTLER_CATEGORIES, getProviders, isPackPurchased, markPackPurchased,
  isCitySupported, type ButlerCategory, type ButlerCategoryMeta,
} from "../data/butlerProviders";

const GHOST_LOGO  = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdf.png";
const PACK_PRICE  = "$9.99";

type Screen = "home" | "providers" | "payment" | "unlocked";

type Props = {
  city: string;       // user's city from their profile
  matchName?: string; // optional — shown in the intro copy
  onClose: () => void;
};

function StarRating({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: 10, color: "#fbbf24", letterSpacing: 1 }}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
      <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

export default function GhostButlerSheet({ city, matchName, onClose }: Props) {
  const [screen, setScreen]         = useState<Screen>("home");
  const [activeCategory, setActiveCategory] = useState<ButlerCategoryMeta | null>(null);
  const [paying, setPaying]         = useState(false);
  const [revealWa, setRevealWa]     = useState<string | null>(null);

  const supported = isCitySupported(city);

  const handleCategorySelect = (cat: ButlerCategoryMeta) => {
    setActiveCategory(cat);
    if (isPackPurchased(city, cat.key)) {
      setScreen("unlocked");
    } else {
      setScreen("providers");
    }
  };

  const handlePay = () => {
    if (!activeCategory) return;
    setPaying(true);
    // Simulate payment processing (replace with real payment gateway)
    setTimeout(() => {
      markPackPurchased(city, activeCategory.key);
      setPaying(false);
      setScreen("unlocked");
    }, 2000);
  };

  const providers = activeCategory ? getProviders(city, activeCategory.key as ButlerCategory) : [];

  // ── Ghost ID for admin verification ──────────────────────────────────────
  const ghostId = (() => {
    try {
      const raw = localStorage.getItem("ghost_profile");
      if (raw) { const p = JSON.parse(raw); return p.id?.slice(0, 8).toUpperCase() ?? "GHOST"; }
    } catch {}
    return "GHOST";
  })();

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
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(251,191,36,0.15)", borderBottom: "none",
          maxHeight: "92dvh", display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Drag handle */}
        <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "0 auto 20px" }} />
        </div>

        <div style={{ overflowY: "auto", padding: "0 20px 48px", flex: 1 }}>
          <AnimatePresence mode="wait">

            {/* ── Home screen ──────────────────────────────────────────── */}
            {screen === "home" && (
              <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <img src={GHOST_LOGO} alt="butler" style={{ width: 40, height: 40, objectFit: "contain" }} />
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24", margin: 0 }}>Ghost Butler 🎩</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                      {city} — verified local services
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, margin: "0 0 20px" }}>
                  {matchName
                    ? `Send ${matchName} a real-world surprise. The best icebreaker isn't a message — it's arriving at someone's door.`
                    : "Send a real-world surprise to your match. The best icebreaker isn't a message — it's arriving at someone's door."
                  }
                </p>

                {/* How it works */}
                <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 14, padding: 16, marginBottom: 22 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(251,191,36,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>How It Works</p>
                  {[
                    ["🎩", "Pick a category & pay $9.99"],
                    ["📱", "Get 5 verified WhatsApp numbers"],
                    ["💬", "Contact providers directly — you set the price"],
                    ["🏠", "Need delivery? Provider WhatsApps Ghost with your ID"],
                    ["✅", "Ghost verifies & releases address. Address never goes to you."],
                  ].map(([icon, text]) => (
                    <div key={text as string} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{text}</span>
                    </div>
                  ))}
                </div>

                {/* City not supported notice */}
                {!supported && (
                  <div style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: 12, padding: 14, marginBottom: 18 }}>
                    <p style={{ fontSize: 12, color: "#fb923c", fontWeight: 700, margin: "0 0 4px" }}>Coming to {city} soon</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Butler is currently live in Jakarta, Bali, Surabaya, Bandung, Medan, Yogyakarta, Makassar and Semarang.</p>
                  </div>
                )}

                {/* Category grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {BUTLER_CATEGORIES.map((cat) => {
                    const purchased = isPackPurchased(city, cat.key);
                    return (
                      <motion.button
                        key={cat.key}
                        whileTap={{ scale: 0.96 }}
                        disabled={!supported}
                        onClick={() => handleCategorySelect(cat)}
                        style={{
                          borderRadius: 16, padding: "16px 12px", cursor: supported ? "pointer" : "not-allowed",
                          background: purchased ? `rgba(${cat.color === "#f472b6" ? "244,114,182" : cat.color === "#fbbf24" ? "251,191,36" : cat.color === "#a78bfa" ? "167,139,250" : "52,211,153"},0.1)` : "rgba(255,255,255,0.04)",
                          border: purchased ? `1px solid ${cat.color}44` : "1px solid rgba(255,255,255,0.08)",
                          opacity: supported ? 1 : 0.4,
                          display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6,
                          textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{cat.label}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{cat.tagline}</span>
                        {purchased
                          ? <span style={{ fontSize: 9, fontWeight: 800, color: cat.color }}>✓ Unlocked</span>
                          : <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(251,191,36,0.7)" }}>{PACK_PRICE} for 5 numbers</span>
                        }
                      </motion.button>
                    );
                  })}
                </div>

                <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
                  Maybe later
                </button>
              </motion.div>
            )}

            {/* ── Provider preview screen ───────────────────────────────── */}
            {screen === "providers" && activeCategory && (
              <motion.div key="providers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", padding: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
                  ← Back
                </button>

                <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>
                  {activeCategory.emoji} {activeCategory.label}
                </p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>
                  5 verified providers in {city} — unlock all numbers for {PACK_PRICE}
                </p>

                {/* Provider preview cards — numbers blurred until paid */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {providers.map((p, i) => (
                    <div
                      key={p.id}
                      style={{
                        borderRadius: 14, padding: "14px 14px", background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        display: "flex", gap: 12, alignItems: "flex-start",
                      }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${activeCategory.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                        {activeCategory.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>{p.name}</p>
                          {p.verified && <span style={{ fontSize: 8, fontWeight: 800, color: "#4ade80", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 50, padding: "2px 6px" }}>✓ GHOST VERIFIED</span>}
                        </div>
                        <StarRating rating={p.rating} />
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "4px 0 4px", lineHeight: 1.4 }}>{p.description}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>📍 {p.deliveryNote}</p>
                        {/* Blurred WhatsApp number */}
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12 }}>📱</span>
                          <span style={{
                            fontSize: 12, fontWeight: 700, color: "#4ade80",
                            filter: "blur(5px)", userSelect: "none",
                          }}>+62 8XX-XXXX-X{String(i + 1).padStart(3, "0")}</span>
                          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>— unlock to reveal</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
                    Unlock all 5 numbers. Contact providers directly on WhatsApp — you negotiate price and service. If delivery is needed, ask the provider to WhatsApp Ghost with your ID and they'll coordinate the address privately.
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setScreen("payment")}
                  style={{
                    width: "100%", height: 54, borderRadius: 50, border: "none",
                    background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                    color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer", marginBottom: 10,
                  }}
                >
                  🎩 Unlock 5 Numbers — {PACK_PRICE}
                </motion.button>
                <button onClick={() => setScreen("home")} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
                  Back to categories
                </button>
              </motion.div>
            )}

            {/* ── Payment screen ────────────────────────────────────────── */}
            {screen === "payment" && activeCategory && (
              <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <button onClick={() => setScreen("providers")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", padding: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
                  ← Back
                </button>

                <p style={{ fontSize: 19, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Confirm Purchase</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 24px" }}>One-time unlock — valid forever for {city}</p>

                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{activeCategory.emoji} {activeCategory.label} Pack</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{PACK_PRICE}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>5 verified WhatsApp numbers</span>
                    <span style={{ fontSize: 12, color: "#4ade80" }}>✓ Included</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Total</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24" }}>{PACK_PRICE}</span>
                  </div>
                </div>

                <div style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 12, padding: 14, marginBottom: 20 }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>
                    🔒 Your match's delivery address is <strong style={{ color: "rgba(255,255,255,0.7)" }}>never shared with you</strong> — Ghost admin verifies and releases it directly to the service provider if a delivery is requested.
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handlePay}
                  disabled={paying}
                  style={{
                    width: "100%", height: 54, borderRadius: 50, border: "none",
                    background: paying ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg,#fbbf24,#f59e0b)",
                    color: paying ? "rgba(255,255,255,0.3)" : "#000",
                    fontSize: 15, fontWeight: 900, cursor: paying ? "default" : "pointer", marginBottom: 10,
                  }}
                >
                  {paying ? "Processing…" : `Pay ${PACK_PRICE} — Unlock Now`}
                </motion.button>
                <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
                  Cancel
                </button>
              </motion.div>
            )}

            {/* ── Unlocked providers with real numbers ─────────────────── */}
            {screen === "unlocked" && activeCategory && (
              <motion.div key="unlocked" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", padding: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
                  ← Back
                </button>

                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🎩</div>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24", margin: "0 0 4px" }}>Butler Unlocked</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                    {activeCategory.emoji} {activeCategory.label} — {city}
                  </p>
                </div>

                {/* Ghost ID for admin verification */}
                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: 14, marginBottom: 18 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(251,191,36,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px" }}>Your Ghost ID for Delivery</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: "#fbbf24", margin: "0 0 6px", letterSpacing: "0.1em" }}>{ghostId}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.5 }}>
                    If the provider needs a delivery address, give them this ID and ask them to WhatsApp Ghost admin. We'll verify and release the address directly to them.
                  </p>
                </div>

                {/* Provider cards with real numbers */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {providers.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        borderRadius: 14, padding: "14px 14px", background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${activeCategory.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                          {activeCategory.emoji}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>{p.name}</p>
                            {p.verified && <span style={{ fontSize: 8, fontWeight: 800, color: "#4ade80" }}>✓ VERIFIED</span>}
                          </div>
                          <StarRating rating={p.rating} />
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "3px 0 0" }}>📍 {p.deliveryNote}</p>
                        </div>
                      </div>

                      {/* WhatsApp number — real, tappable */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          if (revealWa === p.id) {
                            window.open(`https://wa.me/${p.whatsapp.replace(/\D/g, "")}`, "_blank");
                          } else {
                            setRevealWa(p.id);
                          }
                        }}
                        style={{
                          width: "100%", height: 42, borderRadius: 10, border: "1px solid rgba(37,211,102,0.35)",
                          background: "rgba(37,211,102,0.07)",
                          color: "#25d366", fontSize: 13, fontWeight: 800,
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 16 }}>📱</span>
                        {revealWa === p.id ? `Open WhatsApp — ${p.whatsapp}` : "Tap to WhatsApp"}
                      </motion.button>
                    </div>
                  ))}
                </div>

                <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
                  Close Butler
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
