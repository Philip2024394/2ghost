import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

// ── Opt-in storage ────────────────────────────────────────────────────────────
function getOptIns(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem("ghost_event_optins") || "[]")); } catch { return new Set(); }
}
function toggleOptIn(id: string): boolean {
  try {
    const s = getOptIns();
    if (s.has(id)) { s.delete(id); } else { s.add(id); }
    localStorage.setItem("ghost_event_optins", JSON.stringify([...s]));
    return s.has(id);
  } catch { return false; }
}

// ── Tarot fortunes (rotate by day) ───────────────────────────────────────────
const FORTUNES = [
  "The cards reveal a connection forming in unexpected silence. Stay open tonight.",
  "A match already made holds more depth than you've explored. Look closer.",
  "The Tower has fallen. Something old ends — something real is about to begin.",
  "A message you haven't sent will mean more than you expect. Send it.",
  "Two of Cups reversed — a connection exists but needs honesty to bloom.",
  "The stars favour the quiet ones tonight. Your Ghost ID carries more energy than you know.",
  "Someone is looking at your profile right now and wondering the same thing you are.",
];
function dailyFortune(): string {
  return FORTUNES[Math.floor(Date.now() / 86400000) % FORTUNES.length];
}

// ── First date ideas (rotate by day) ─────────────────────────────────────────
const DATE_IDEAS = [
  { title: "Night Market Walk",    desc: "Find the nearest night market. No plan. Walk until something smells good.", emoji: "🌙" },
  { title: "Rooftop at Dusk",      desc: "Any rooftop, any city. Arrive 30 mins before sunset. Bring nothing.", emoji: "🌆" },
  { title: "Coffee & No Phones",   desc: "One rule: phones in pockets the entire time. See what happens.", emoji: "☕" },
  { title: "Local Museum, Last Hour", desc: "Museums are different when you're rushing. Pick one, go at closing time.", emoji: "🏛️" },
  { title: "Cook Something Together", desc: "One market, two strangers, one dish. The mess is the point.", emoji: "🍳" },
  { title: "Bookshop Browse",      desc: "Each person buys one book for the other. No budget, no rules.", emoji: "📚" },
  { title: "Midnight Dessert",     desc: "Find the best dessert place in your city. Only go after 10pm.", emoji: "🍨" },
];
function dailyDateIdea() {
  return DATE_IDEAS[Math.floor(Date.now() / 86400000) % DATE_IDEAS.length];
}

// ── Events definition ─────────────────────────────────────────────────────────
function buildEvents(accent: string) {
  const now  = new Date();
  const day  = now.getDay(); // 0=Sun … 6=Sat
  const hour = now.getHours();
  const isThursday  = day === 4;
  const isFriday    = day === 5;
  const isSunday    = day === 0;
  const isNight     = hour >= 20 || hour < 4;
  const idea = dailyDateIdea();

  return [
    {
      id:    "tarot",
      emoji: "🃏",
      title: "Daily Tarot Reading",
      schedule: "Every day at midnight",
      status: "Today",
      statusColor: accent,
      desc:  dailyFortune(),
      detail: "Your reading is based on the current phase of the house — member activity, time, and your floor.",
      live:  true,
    },
    {
      id:    "dateidea",
      emoji: "💡",
      title: "First Date Idea of the Day",
      schedule: "Refreshes daily",
      status: "Today",
      statusColor: "#34d399",
      desc:  `${idea.emoji} ${idea.title} — ${idea.desc}`,
      detail: "A new idea every morning. Share it with a match or use it yourself.",
      live:  true,
    },
    {
      id:    "quiz",
      emoji: "🧠",
      title: "Floor Quiz Night",
      schedule: "Every Thursday · 9pm in your floor chat",
      status: isThursday ? (isNight ? "Live Now 🔴" : "Tonight") : "This Week",
      statusColor: isThursday && isNight ? "#ef4444" : "#ffd700",
      desc:  "10 questions. All floor members compete. The winner gets a 🏆 badge for 24 hours.",
      detail: "Questions cover: travel, food, culture, and Ghost House trivia. Hosted by the Butler.",
      live:  isThursday && isNight,
    },
    {
      id:    "masquerade",
      emoji: "🎭",
      title: "Masquerade Night",
      schedule: "Every Friday · All profiles go incognito",
      status: isFriday ? "Active Tonight" : "This Friday",
      statusColor: isFriday ? "#f97316" : "rgba(255,255,255,0.4)",
      desc:  "Every Friday, profiles show only a silhouette and one personal clue. Identity reveals only on mutual like.",
      detail: "Masquerade Night consistently produces the most genuine first-impression connections on the platform.",
      live:  isFriday,
    },
    {
      id:    "roses",
      emoji: "🌹",
      title: "Rose Sunday",
      schedule: "Every Sunday · Free roses for all floors",
      status: isSunday ? "Active Today" : "This Sunday",
      statusColor: isSunday ? "#f43f5e" : "rgba(255,255,255,0.4)",
      desc:  "Every Sunday, send one free rose to anyone on your floor. No coins needed. Just a signal.",
      detail: "Rose Sunday is the most-used feature in Ghost House. A rose sent often starts a Vault conversation.",
      live:  isSunday,
    },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HotelEventsBoard({ onClose }: { onClose: () => void }) {
  const a = useGenderAccent();
  const [optIns,   setOptIns]   = useState<Set<string>>(getOptIns);
  const [expanded, setExpanded] = useState<string | null>(null);
  const events = buildEvents(a.accent);

  function handleToggle(id: string) {
    const now = toggleOptIn(id);
    setOptIns(prev => {
      const next = new Set(prev);
      now ? next.add(id) : next.delete(id);
      return next;
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 580, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(5,4,2,0.99)", borderRadius: "24px 24px 0 0", border: `1px solid ${a.glow(0.2)}`, borderBottom: "none", maxHeight: "88dvh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: `0 -8px 60px ${a.glow(0.12)}` }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)`, flexShrink: 0 }} />

        {/* Header */}
        <div style={{ flexShrink: 0, padding: "18px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>🎪 Hotel Events</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Organised by Ghost House · Opt in for reminders</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>✕</span>
          </button>
        </div>

        {/* Events list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px max(16px,env(safe-area-inset-bottom,16px))" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {events.map(ev => {
              const isOn  = optIns.has(ev.id);
              const isExp = expanded === ev.id;
              return (
                <motion.div
                  key={ev.id}
                  layout
                  style={{ background: ev.live ? a.glow(0.08) : "rgba(255,255,255,0.03)", border: `1px solid ${ev.live ? a.glow(0.25) : "rgba(255,255,255,0.07)"}`, borderRadius: 16, overflow: "hidden" }}
                >
                  {/* Main row */}
                  <div
                    onClick={() => setExpanded(isExp ? null : ev.id)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", cursor: "pointer" }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: ev.live ? a.glow(0.15) : "rgba(255,255,255,0.05)", border: `1px solid ${ev.live ? a.glow(0.3) : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {ev.live
                        ? <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize: 20 }}>{ev.emoji}</motion.span>
                        : <span style={{ fontSize: 20 }}>{ev.emoji}</span>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>{ev.title}</p>
                        <span style={{ fontSize: 9, fontWeight: 800, color: ev.statusColor, background: `${ev.statusColor}18`, border: `1px solid ${ev.statusColor}35`, borderRadius: 20, padding: "1px 7px", whiteSpace: "nowrap" }}>{ev.status}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{ev.schedule}</p>
                    </div>
                    {/* Opt-in toggle */}
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={e => { e.stopPropagation(); handleToggle(ev.id); }}
                      style={{ flexShrink: 0, width: 46, height: 26, borderRadius: 13, border: "none", background: isOn ? a.accent : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s" }}
                    >
                      <motion.div
                        animate={{ x: isOn ? 22 : 2 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        style={{ position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
                      />
                    </motion.button>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ padding: "0 14px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <p style={{ margin: "12px 0 6px", fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{ev.desc}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>{ev.detail}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <p style={{ margin: "14px 0 0", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", lineHeight: 1.6 }}>
            Toggle events on to receive in-app reminders · All events are free to participate
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
