import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BUTLER_CATEGORIES, getProviders, isPackPurchased, markPackPurchased,
  isCitySupported, type ButlerCategory,
} from "../data/butlerProviders";

const PACK_PRICE = "$9.99";

type Screen = "list" | "payment" | "unlocked";

type Props = {
  city: string;
  matchName?: string;
  onClose: () => void;
};

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ fontSize: 10, color: "#fbbf24" }}>
      {"★".repeat(Math.floor(rating))}
      <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: 3 }}>{rating.toFixed(1)}</span>
    </span>
  );
}

export default function GhostButlerSheet({ city, matchName, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<ButlerCategory>("flowers");
  const [screen, setScreen]       = useState<Screen>("list");
  const [paying, setPaying]       = useState(false);
  const [openWa, setOpenWa]       = useState<string | null>(null);

  const supported = isCitySupported(city);
  const purchased = isPackPurchased(city, activeTab);
  const providers = getProviders(city, activeTab);

  const activeMeta = BUTLER_CATEGORIES.find((c) => c.key === activeTab)!;

  const ghostId = (() => {
    try { const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}"); return p.id?.slice(0, 8).toUpperCase() ?? "GHOST"; } catch { return "GHOST"; }
  })();

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      markPackPurchased(city, activeTab);
      setPaying(false);
      setScreen("unlocked");
    }, 1800);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, background: "#0d0d0f",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(251,191,36,0.15)", borderBottom: "none",
          maxHeight: "93dvh", display: "flex", flexDirection: "column",
        }}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ padding: "16px 20px 0", flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "0 auto 18px" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div>
              <p style={{ fontSize: 19, fontWeight: 900, color: "#fbbf24", margin: 0 }}>🎩 Ghost Butler</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>
                {matchName ? `Send ${matchName} a real-world surprise` : "Send a surprise to your match"} · {city}
              </p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 20, cursor: "pointer", padding: 0, lineHeight: 1 }}>✕</button>
          </div>

          {!supported && (
            <div style={{ background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.2)", borderRadius: 10, padding: "8px 12px", margin: "10px 0 4px" }}>
              <p style={{ fontSize: 11, color: "#fb923c", margin: 0 }}>Butler coming to {city} soon — showing Jakarta providers</p>
            </div>
          )}

          {/* ── Category tabs ──────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 6, marginTop: 14, paddingBottom: 16 }}>
            {BUTLER_CATEGORIES.map((cat) => {
              const isActive = activeTab === cat.key;
              const done     = isPackPurchased(city, cat.key);
              return (
                <button
                  key={cat.key}
                  onClick={() => { setActiveTab(cat.key as ButlerCategory); setScreen("list"); setOpenWa(null); }}
                  style={{
                    flex: 1, height: 52, borderRadius: 14, border: "none", cursor: "pointer",
                    background: isActive ? `rgba(251,191,36,0.12)` : "rgba(255,255,255,0.04)",
                    outline: isActive ? "2px solid rgba(251,191,36,0.5)" : "2px solid transparent",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 8, fontWeight: 800, color: isActive ? "#fbbf24" : "rgba(255,255,255,0.4)", letterSpacing: "0.03em" }}>
                    {cat.label.split(" ")[0]}
                  </span>
                  {done && (
                    <span style={{ position: "absolute", top: 4, right: 4, fontSize: 8, background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.4)", borderRadius: 50, padding: "1px 4px", color: "#4ade80", fontWeight: 800 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 16px 48px" }}>
          <AnimatePresence mode="wait">

            {/* ── Provider list ── */}
            {(screen === "list" || (screen === "unlocked" && !purchased)) && (
              <motion.div key={`list-${activeTab}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 12px", lineHeight: 1.5 }}>
                  {activeMeta.tagline} — pay <strong style={{ color: "#fbbf24" }}>{PACK_PRICE}</strong> to unlock all 5 WhatsApp numbers
                </p>

                {/* Provider cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {providers.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: "rgba(255,255,255,0.04)", borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.07)",
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ display: "flex", gap: 12, padding: "14px 14px 12px" }}>
                        {/* Profile photo */}
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <img
                            src={p.photo}
                            alt={p.name}
                            style={{ width: 58, height: 58, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(251,191,36,0.25)" }}
                          />
                          {p.verified && (
                            <span style={{
                              position: "absolute", bottom: 0, right: 0,
                              width: 18, height: 18, borderRadius: "50%",
                              background: "#0d0d0f", border: "1.5px solid rgba(74,222,128,0.5)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9,
                            }}>✅</span>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>{p.name}</p>
                            <Stars rating={p.rating} />
                          </div>
                          <p style={{ fontSize: 10, fontWeight: 700, color: activeMeta.color, margin: "2px 0 5px" }}>{p.specialty}</p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "0 0 5px", lineHeight: 1.45 }}>{p.description}</p>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>📍 {p.deliveryNote}</p>
                        </div>
                      </div>

                      {/* WhatsApp row — locked until paid */}
                      <div style={{
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        padding: "10px 14px",
                        display: "flex", alignItems: "center", gap: 8,
                        background: "rgba(0,0,0,0.2)",
                      }}>
                        <span style={{ fontSize: 14 }}>📱</span>
                        <span style={{
                          fontSize: 13, fontWeight: 700,
                          color: purchased ? "#25d366" : "rgba(255,255,255,0.3)",
                          flex: 1,
                          filter: purchased ? "none" : "blur(4px)",
                          userSelect: purchased ? "text" : "none",
                        }}>
                          {p.whatsapp}
                        </span>
                        {!purchased && (
                          <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pay / already unlocked CTA */}
                {purchased ? (
                  <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 14, padding: 14, textAlign: "center", marginBottom: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#4ade80", margin: "0 0 4px" }}>✓ Numbers Unlocked</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 10px" }}>Tap any number above to open WhatsApp directly</p>
                    <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(251,191,36,0.7)", margin: 0 }}>Your Ghost ID for delivery: <strong style={{ color: "#fbbf24", letterSpacing: "0.08em" }}>{ghostId}</strong></p>
                  </div>
                ) : (
                  <>
                    <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>
                        🔒 Numbers are revealed after payment. Contact providers directly on WhatsApp and arrange service at your price. If they need a delivery address, ask them to WhatsApp Ghost admin with your ID — <strong style={{ color: "#fbbf24" }}>address goes to provider only, never to you</strong>.
                      </p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setScreen("payment")}
                      style={{
                        width: "100%", height: 54, borderRadius: 50, border: "none",
                        background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                        color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer",
                      }}
                    >
                      🎩 Unlock 5 Numbers — {PACK_PRICE}
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}

            {/* ── Payment screen ── */}
            {screen === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <button onClick={() => setScreen("list")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", padding: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
                  ← Back
                </button>

                <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Confirm Purchase</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>
                  One-time unlock — {activeMeta.emoji} {activeMeta.label} · {city}
                </p>

                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 18, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{activeMeta.emoji} {activeMeta.label} — 5 numbers</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{PACK_PRICE}</span>
                  </div>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 10 }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Total</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#fbbf24" }}>{PACK_PRICE}</span>
                  </div>
                </div>

                <div style={{ background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 12, padding: "10px 14px", marginBottom: 18 }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.6 }}>
                    🔒 Your match's delivery address is <strong style={{ color: "rgba(255,255,255,0.7)" }}>never shared with you</strong>. If delivery is needed, the provider contacts Ghost admin with your Ghost ID — we verify and release the address directly to them.
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
                  {paying ? "Processing…" : `Pay ${PACK_PRICE} — Unlock Numbers`}
                </motion.button>
                <button onClick={() => setScreen("list")} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
                  Cancel
                </button>
              </motion.div>
            )}

            {/* ── Unlocked confirmation ── */}
            {screen === "unlocked" && purchased && (
              <motion.div key="unlocked" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
                  <div style={{ fontSize: 44, marginBottom: 10 }}>🎩</div>
                  <p style={{ fontSize: 19, fontWeight: 900, color: "#fbbf24", margin: "0 0 6px" }}>Numbers Unlocked!</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>
                    {activeMeta.emoji} {activeMeta.label} · {city}
                  </p>
                </div>

                <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 14, padding: 14, marginBottom: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(251,191,36,0.7)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>Your Ghost ID for delivery requests</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: "#fbbf24", letterSpacing: "0.12em", margin: "0 0 4px" }}>{ghostId}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.5 }}>Give this to the provider if they need to coordinate a delivery address. They WhatsApp Ghost admin → we verify → release address to them only.</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {providers.map((p) => (
                    <motion.button
                      key={p.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (openWa === p.id) {
                          window.open(`https://wa.me/${p.whatsapp.replace(/\D/g, "")}`, "_blank");
                        } else {
                          setOpenWa(p.id);
                        }
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                        background: openWa === p.id ? "rgba(37,211,102,0.1)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${openWa === p.id ? "rgba(37,211,102,0.35)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: 14, cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <img src={p.photo} alt={p.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(251,191,36,0.2)" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 1px" }}>{p.name}</p>
                        <p style={{ fontSize: 11, color: "#25d366", fontWeight: 700, margin: 0 }}>
                          {openWa === p.id ? `Tap again → ${p.whatsapp}` : p.whatsapp}
                        </p>
                      </div>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>📱</span>
                    </motion.button>
                  ))}
                </div>

                <button onClick={() => setScreen("list")} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
                  ← Back to providers
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
