import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId } from "../utils/ghostHelpers";

const SEANCE_DURATION = 15 * 60 * 1000; // 15 minutes

const GHOST_REPLIES = [
  "Interesting that you'd say that…",
  "I wasn't expecting that question 👀",
  "That's the most honest thing anyone's said to me on here",
  "Tell me more.",
  "I've been thinking the same thing.",
  "You ask good questions.",
  "I wasn't going to respond but that made me.",
  "Only if you answer mine first.",
  "That actually made me smile.",
  "I'll need a moment to think about that.",
  "You're different from what I expected.",
  "Let's say I'm intrigued.",
];

type Phase = "chatting" | "voting" | "revealed" | "passed";

type SeanceMessage = { id: string; text: string; isOwn: boolean; timestamp: number };

type Props = {
  profile: GhostProfile;
  onClose: () => void;
};

function fmt(ms: number): string {
  if (ms <= 0) return "0:00";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SeancePopup({ profile, onClose }: Props) {
  const a = useGenderAccent();
  const [showExplainer, setShowExplainer] = useState(() => {
    try { return !sessionStorage.getItem("seance_explained"); } catch { return true; }
  });
  const [phase,    setPhase]    = useState<Phase>("chatting");
  const [messages, setMessages] = useState<SeanceMessage[]>([
    { id: "sys-0", text: "The Séance has begun. You have 15 minutes before the veil lifts. No photos. No names. Just words.", isOwn: false, timestamp: Date.now() - 100 },
  ]);
  const [input,    setInput]    = useState("");
  const [remaining, setRemaining] = useState(SEANCE_DURATION);
  const [myVote,   setMyVote]   = useState<"reveal" | "pass" | null>(null);
  const [theirVote, setTheirVote] = useState<"reveal" | "pass" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(r => {
        if (r <= 1000) {
          clearInterval(id);
          setPhase("voting");
          return 0;
        }
        return r - 1000;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    const t = input.trim();
    if (!t || phase !== "chatting") return;
    const msg: SeanceMessage = { id: `m-${Date.now()}`, text: t, isOwn: true, timestamp: Date.now() };
    setMessages(prev => [...prev, msg]);
    setInput("");

    // Schedule ghost reply
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    replyTimerRef.current = setTimeout(() => {
      const reply = GHOST_REPLIES[Math.floor(Math.random() * GHOST_REPLIES.length)];
      setMessages(prev => [...prev, { id: `r-${Date.now()}`, text: reply, isOwn: false, timestamp: Date.now() }]);
    }, 3000 + Math.random() * 8000);
  }

  function castVote(v: "reveal" | "pass") {
    setMyVote(v);
    // Simulate partner vote after 3s
    setTimeout(() => {
      // ~60% chance they also reveal if you reveal; 80% pass if you pass
      const theirChoice: "reveal" | "pass" = v === "reveal"
        ? (Math.random() < 0.6 ? "reveal" : "pass")
        : (Math.random() < 0.8 ? "pass" : "reveal");
      setTheirVote(theirChoice);
      setPhase(v === "reveal" && theirChoice === "reveal" ? "revealed" : "passed");
    }, 3000);
  }

  const ghostId = toGhostId(profile.id);

  if (showExplainer) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
        style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(0,0,0,0.94)", backdropFilter: "blur(28px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px",
        }}
      >
        <motion.div style={{ width: "100%", maxWidth: 340, background: "rgba(8,6,20,0.98)", borderRadius: 22, border: "1px solid rgba(139,92,246,0.3)", overflow: "hidden" }}>
          <div style={{ height: 3, background: "linear-gradient(90deg, #7c3aed, #a78bfa, #7c3aed)" }} />
          <div style={{ padding: "28px 24px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🕯️</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>The Séance</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "0 0 20px", lineHeight: 1.65 }}>
              The Séance is a 15-minute anonymous chat with someone you've already liked. No names. No photos. Just conversation.
            </p>
            {[
              ["🕯️", "Anonymous", "Neither of you knows who the other is"],
              ["⏳", "15 Minutes", "The session expires — no pressure, no history"],
              ["💚", "Vote to Connect", "At the end, both choose to reveal or part ways"],
              ["🔒", "Disappears", "The chat vanishes when the session ends"],
            ].map(([icon, title, desc]) => (
              <div key={String(title)} style={{ display: "flex", gap: 12, marginBottom: 12, textAlign: "left" }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{title}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                try { sessionStorage.setItem("seance_explained", "1"); } catch {}
                setShowExplainer(false);
              }}
              style={{ width: "100%", height: 48, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#7c3aed,#a78bfa)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", marginTop: 8 }}
            >
              Enter the Séance →
            </motion.button>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, cursor: "pointer", marginTop: 10 }}>Not now</button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.96)", display: "flex", flexDirection: "column" }}
    >
      {/* ── Chatting phase ─────────────────────────────────────────────── */}
      {phase === "chatting" && (
        <>
          {/* Header */}
          <div style={{ flexShrink: 0, padding: "max(env(safe-area-inset-top,16px),16px) 18px 12px", background: "rgba(4,4,8,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
              👻
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>The Séance</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>No photos · No identity · Just words</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <motion.p
                key={remaining}
                animate={remaining < 60000 ? { color: ["#f87171", "#fff", "#f87171"] } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                style={{ margin: 0, fontSize: 18, fontWeight: 900, color: remaining < 60000 ? "#f87171" : a.accent, fontVariantNumeric: "tabular-nums" }}
              >
                {fmt(remaining)}
              </motion.p>
              <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em" }}>until veil lifts</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, scrollbarWidth: "none" }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: "flex", justifyContent: msg.isOwn ? "flex-end" : "flex-start" }}>
                {!msg.isOwn && (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginRight: 8, alignSelf: "flex-end" }}>
                    👻
                  </div>
                )}
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  style={{
                    maxWidth: "76%", padding: "9px 13px", borderRadius: msg.isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.isOwn ? a.glow(0.18) : msg.id === "sys-0" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)",
                    border: msg.isOwn ? `1px solid ${a.glow(0.35)}` : msg.id === "sys-0" ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.08)",
                    fontSize: msg.id === "sys-0" ? 10 : 13, lineHeight: 1.5,
                    color: msg.id === "sys-0" ? "rgba(255,255,255,0.4)" : "#fff",
                    fontStyle: msg.id === "sys-0" ? "italic" : "normal",
                  }}
                >
                  {msg.text}
                </motion.div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ flexShrink: 0, padding: "10px 14px max(env(safe-area-inset-bottom,16px),16px)", background: "rgba(4,4,8,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10, alignItems: "flex-end" }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Say something honest…"
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: `1px solid ${a.glow(0.2)}`, borderRadius: 22, padding: "10px 16px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit" }}
            />
            <motion.button whileTap={{ scale: 0.92 }} onClick={sendMessage}
              style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: a.gradient, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 16px ${a.glow(0.35)}` }}
            >
              <span style={{ fontSize: 18 }}>➤</span>
            </motion.button>
          </div>
        </>
      )}

      {/* ── Voting phase ───────────────────────────────────────────────── */}
      {phase === "voting" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 28px" }}>
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🌫️</div>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em" }}>15 minutes are up</p>
            <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 900, color: "#fff" }}>The veil is lifting</h2>
            <p style={{ margin: "0 0 32px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
              Do you want to reveal yourself to the ghost on the other side? They're choosing right now too.
            </p>

            {!myVote ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => castVote("reveal")}
                  style={{ width: "100%", height: 56, borderRadius: 16, border: "none", background: a.gradient, color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 28px ${a.glow(0.4)}` }}
                >
                  ✨ Reveal Myself
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => castVote("pass")}
                  style={{ width: "100%", height: 48, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >
                  👻 Stay a Ghost
                </motion.button>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, repeat: Infinity }} style={{ fontSize: 32, marginBottom: 14 }}>⏳</motion.div>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                  You chose to {myVote === "reveal" ? "✨ reveal" : "👻 stay hidden"}.<br />Waiting for the other ghost…
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ── Revealed phase ─────────────────────────────────────────────── */}
      {phase === "revealed" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 28px" }}>
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
              <motion.div
                animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", border: `3px solid ${a.accent}`, boxShadow: `0 0 40px ${a.glow(0.6)}`, margin: "0 auto" }}
              >
                <img src={profile.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
              </motion.div>
              <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ position: "absolute", bottom: 0, right: 0, fontSize: 22 }}>✨</motion.div>
            </div>

            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: a.accent, textTransform: "uppercase", letterSpacing: "0.15em" }}>Both Revealed</p>
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#fff" }}>The veil has lifted</h2>
            <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#fff" }}>{profile.name}, {profile.age} · {profile.city}</p>
            <p style={{ margin: "0 0 28px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
              You both chose to reveal. The connection started with words — now it continues.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <motion.a whileTap={{ scale: 0.97 }} href="https://wa.me/" target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, height: 52, borderRadius: 14, background: "#25d366", textDecoration: "none", color: "#fff", fontSize: 14, fontWeight: 900, boxShadow: "0 4px 20px rgba(37,211,102,0.4)" }}
              >
                <span style={{ fontSize: 20 }}>📱</span> Connect on WhatsApp
              </motion.a>
              <button onClick={onClose} style={{ height: 44, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Passed phase ───────────────────────────────────────────────── */}
      {phase === "passed" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 28px" }}>
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: "100%", maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>🌫️</div>
            <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 900, color: "#fff" }}>The ghost stayed hidden</h2>
            <p style={{ margin: "0 0 28px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 }}>
              {myVote === "reveal"
                ? `You chose to reveal but ${ghostId} chose to stay anonymous. The conversation was real — that's what matters.`
                : "Both chose to remain ghosts. The conversation lives in its own space now."}
            </p>
            <button onClick={onClose} style={{ height: 48, padding: "0 36px", borderRadius: 14, border: `1px solid ${a.glow(0.3)}`, background: a.glow(0.08), color: a.accent, fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              Back to the House
            </button>
          </motion.div>
        </div>
      )}

      {/* Close button — only during chatting */}
      {phase === "chatting" && (
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "max(env(safe-area-inset-top,16px),16px)", right: 16, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}
        >
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>✕</span>
        </button>
      )}
    </motion.div>
  );
}
