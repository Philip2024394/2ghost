import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Show logic ────────────────────────────────────────────────────────────────
const NIGHT_KEY = "ghost_late_night_shown_date";

export function shouldShowLateNight(): boolean {
  try {
    const h = new Date().getHours();
    if (h < 22 && h >= 4) return false; // only 10pm–3:59am
    const today = new Date().toDateString();
    return localStorage.getItem(NIGHT_KEY) !== today;
  } catch { return false; }
}

export function markLateNightShown(): void {
  try { localStorage.setItem(NIGHT_KEY, new Date().toDateString()); } catch {}
}

// ── Coins ─────────────────────────────────────────────────────────────────────
function readCoins(): number  { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } }
function writeCoins(n: number) { try { localStorage.setItem("ghost_coins", String(Math.max(0, n))); } catch {} }

// ── Matches ───────────────────────────────────────────────────────────────────
function loadMatchNames(): Array<{ id: string; ghostId: string; avatar: string }> {
  try {
    const raw = JSON.parse(localStorage.getItem("ghost_matches") || "[]");
    return raw.slice(0, 8).map((m: { id: string; profile: { id: string; images?: string[] } }) => {
      const pid = m.profile?.id || m.id;
      let h = 0;
      for (let i = 0; i < pid.length; i++) { h = Math.imul(31, h) + pid.charCodeAt(i) | 0; }
      const ghostId = `Ghost-${1000 + Math.abs(h) % 9000}`;
      const avatar  = m.profile?.images?.[0] ?? `https://i.pravatar.cc/60?u=${pid}`;
      return { id: pid, ghostId, avatar };
    });
  } catch { return []; }
}

// ── Rotating butler messages (one per day) ────────────────────────────────────
const NIGHT_MESSAGES = [
  "The house is quiet at this hour — a good time to think of someone.",
  "Late nights have a way of bringing certain people to mind.",
  "The Manor is still. Sometimes the quietest hours say the most.",
  "The night shift is yours. Most guests have retired — but not all thoughts have.",
  "You're up late. Someone worth thinking about?",
];

function dailyMessage(): string {
  const day = Math.floor(Date.now() / 86400000);
  return NIGHT_MESSAGES[day % NIGHT_MESSAGES.length];
}

// ── Breakfast menu ────────────────────────────────────────────────────────────
const MENU = [
  { id: "coffee",      emoji: "☕", name: "Coffee & Croissant",    desc: "Freshly brewed · warm pastry",         coins: 10 },
  { id: "fruit",       emoji: "🍓", name: "Fruit & Granola Bowl",  desc: "Seasonal fruit · honey · oat",         coins: 12 },
  { id: "full",        emoji: "🍳", name: "Full Breakfast",        desc: "Eggs · toast · grilled · sides",       coins: 20 },
  { id: "tea",         emoji: "🍵", name: "Tea & Toast",           desc: "Earl Grey · butter · marmalade",       coins: 8  },
  { id: "champagne",   emoji: "🥂", name: "Champagne Breakfast",   desc: "Bubbles · strawberries · brioche",     coins: 35 },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function LateNightButlerPopup({ onDismiss }: { onDismiss: () => void }) {
  const [step,     setStep]     = useState<"menu" | "pick" | "sent">("menu");
  const [selected, setSelected] = useState<typeof MENU[number] | null>(null);
  const [coins,    setCoins]    = useState(readCoins);
  const [lowCoins, setLowCoins] = useState(false);
  const [sentTo,   setSentTo]   = useState<string>("");
  const matches = loadMatchNames();
  const msg     = dailyMessage();
  const gold    = "#d4af37";
  const nightBlue = "#1a1a2e";

  function handleSelectItem(item: typeof MENU[number]) {
    setLowCoins(false);
    setSelected(item);
    setStep("pick");
  }

  function handleSend(match: { ghostId: string }) {
    if (!selected) return;
    if (coins < selected.coins) { setLowCoins(true); return; }
    const next = coins - selected.coins;
    writeCoins(next);
    setCoins(next);
    setSentTo(match.ghostId);
    setStep("sent");
  }

  function handleDismiss() {
    markLateNightShown();
    onDismiss();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 492,
        background: "rgba(0,0,8,0.82)",
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 18px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 52, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 270, damping: 26 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 400,
          background: `linear-gradient(170deg, ${nightBlue} 0%, rgba(4,3,8,0.99) 100%)`,
          borderRadius: 26,
          border: `1px solid rgba(100,80,180,0.25)`,
          overflow: "hidden",
          boxShadow: "0 0 100px rgba(80,60,160,0.18), 0 30px 80px rgba(0,0,0,0.8)",
          maxHeight: "88dvh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Top stripe — deep violet night */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #7c3aed, #a78bfa, #7c3aed, transparent)", flexShrink: 0 }} />

        {/* Scrollable content */}
        <div style={{ overflowY: "auto", flex: 1 }}>

          {/* Letterhead */}
          <div style={{ padding: "20px 22px 0", textAlign: "center" }}>
            <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 800, color: "rgba(167,139,250,0.6)", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Ghost House · Butler Service
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, margin: "12px 0 6px" }}>
              <div style={{ height: 1, flex: 1, background: "linear-gradient(to right, transparent, rgba(124,58,237,0.35))" }} />
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ fontSize: 26 }}
              >
                🌙
              </motion.div>
              <div style={{ height: 1, flex: 1, background: "linear-gradient(to left, transparent, rgba(124,58,237,0.35))" }} />
            </div>
            {/* Stars */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 14 }}>
              {["✦","✧","✦","✧","✦"].map((s, i) => (
                <motion.span key={i}
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
                  style={{ fontSize: 8, color: "rgba(167,139,250,0.7)" }}
                >{s}</motion.span>
              ))}
            </div>
          </div>

          <div style={{ padding: "0 22px 20px" }}>

            {/* Daily butler message */}
            <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, textAlign: "center", fontStyle: "italic" }}>
              {msg}
            </p>

            <div style={{ height: 1, background: "rgba(124,58,237,0.18)", margin: "14px 0" }} />

            <AnimatePresence mode="wait">

              {/* ── Step 1: Breakfast menu ── */}
              {step === "menu" && (
                <motion.div key="menu" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>

                  <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 900, color: "#fff" }}>
                      🍽️ Manor Room — Breakfast
                    </p>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
                      Served daily · 8:00 am to 10:00 am · Room service available anytime
                    </p>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 14 }}>
                    {MENU.map((item, i) => (
                      <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.98, background: "rgba(124,58,237,0.12)" }}
                        onClick={() => handleSelectItem(item)}
                        style={{
                          width: "100%", padding: "13px 14px", background: "none", border: "none",
                          borderBottom: i < MENU.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                          display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left",
                        }}
                      >
                        <span style={{ fontSize: 22, flexShrink: 0 }}>{item.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.88)" }}>{item.name}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{item.desc}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                          <span style={{ fontSize: 11 }}>🪙</span>
                          <span style={{ fontSize: 12, fontWeight: 900, color: "#ffd700" }}>{item.coins}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Coin balance */}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
                    <div style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", borderRadius: 20, padding: "5px 14px", display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 12 }}>🪙</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#ffd700" }}>{coins} coins available</span>
                    </div>
                  </div>

                  <p style={{ margin: "10px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center", lineHeight: 1.6 }}>
                    Send a breakfast to someone's room — they'll find it waiting in the morning. A quiet reminder that someone was thinking of them.
                  </p>
                </motion.div>
              )}

              {/* ── Step 2: Pick who to send to ── */}
              {step === "pick" && selected && (
                <motion.div key="pick" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}>

                  {/* Selected item recap */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 20 }}>{selected.emoji}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.9)" }}>{selected.name}</p>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{selected.coins} coins · delivered at 8am</p>
                    </div>
                  </div>

                  <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Send to your matches
                  </p>

                  {/* Low coins warning */}
                  <AnimatePresence>
                    {lowCoins && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        style={{ padding: "9px 12px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, marginBottom: 10, display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 14 }}>⚠️</span>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(239,68,68,0.9)", fontWeight: 700 }}>Not enough coins — top up to send this gift</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {matches.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
                        No matches yet — start liking profiles and come back when the house wakes up.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                      {matches.map(m => (
                        <motion.button
                          key={m.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleSend(m)}
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, cursor: "pointer" }}
                        >
                          <img src={m.avatar} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(124,58,237,0.4)", flexShrink: 0 }} />
                          <div style={{ flex: 1, textAlign: "left" }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.88)" }}>{m.ghostId}</p>
                            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Your match</p>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 20 }}>
                            <span style={{ fontSize: 11 }}>{selected.emoji}</span>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#a78bfa" }}>Send</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  <button onClick={() => { setStep("menu"); setLowCoins(false); }}
                    style={{ width: "100%", padding: "10px", background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 12, cursor: "pointer" }}>
                    ← Back to menu
                  </button>
                </motion.div>
              )}

              {/* ── Step 3: Sent confirmation ── */}
              {step === "sent" && selected && (
                <motion.div key="sent" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ fontSize: 48, marginBottom: 14, display: "block" }}
                  >
                    {selected.emoji}
                  </motion.div>
                  <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "#fff" }}>
                    Breakfast is on its way
                  </p>
                  <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
                    Your <strong style={{ color: "rgba(255,255,255,0.7)" }}>{selected.name}</strong> has been arranged for <strong style={{ color: "rgba(255,255,255,0.7)" }}>{sentTo}</strong>'s room. They'll find it waiting in the morning. 🌅
                  </p>
                  <div style={{ padding: "10px 14px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.22)", borderRadius: 12, marginBottom: 18 }}>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(167,139,250,0.8)", fontStyle: "italic", lineHeight: 1.6 }}>
                      A quiet reminder that someone was thinking of them while the rest of the house slept.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 18 }}>
                    <span style={{ fontSize: 12 }}>🪙</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#ffd700" }}>{coins} coins remaining</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleDismiss}
                    style={{ width: "100%", height: 48, borderRadius: 14, border: "none", background: "linear-gradient(135deg, #7c3aed, #5b21b6)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 22px rgba(124,58,237,0.4)" }}
                  >
                    Good night 🌙
                  </motion.button>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Dismiss (only on menu step) */}
            {step === "menu" && (
              <button onClick={handleDismiss}
                style={{ width: "100%", marginTop: 8, padding: "10px", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer" }}>
                Not tonight
              </button>
            )}

          </div>
        </div>

        {/* Bottom stripe */}
        <div style={{ height: 2, background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)", flexShrink: 0 }} />
      </motion.div>
    </motion.div>
  );
}
