import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId, fmtFlashTime, isProfileTonight } from "../utils/ghostHelpers";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

// ── Hotel Lobby match popup ───────────────────────────────────────────────────
export function GhostFlashMatchPopup({ profile, onClose, onConnect }: { profile: GhostProfile; onClose: () => void; onConnect?: (p: GhostProfile) => void }) {
  const firstName = profile.name.split(" ")[0];
  const ghostId = toGhostId(profile.id);
  const [secs, setSecs] = useState(30);
  const [screen, setScreen] = useState<"match" | "pay" | "connected">("match");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (screen !== "match") return;
    const t = setInterval(() => setSecs((s) => { if (s <= 1) { onClose(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [onClose, screen]);

  const handleConnect = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      setScreen("connected");
      if (onConnect) onConnect(profile);
    }, 1600);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px",
      }}
    >
      <motion.div
        initial={{ scale: 0.75, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        style={{
          width: "100%", maxWidth: 340, textAlign: "center",
          background: "rgba(5,5,8,0.98)", backdropFilter: "blur(40px)",
          borderRadius: 24, border: "1px solid rgba(212,175,55,0.35)",
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(212,175,55,0.15), 0 24px 80px rgba(0,0,0,0.8)",
        }}
      >
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
          style={{ height: 4, background: "linear-gradient(90deg, #92660a, #d4af37, #f0d060, #d4af37, #92660a)" }}
        />

        <div style={{ padding: "28px 24px 26px" }}>
          <motion.div
            animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)",
              borderRadius: 20, padding: "5px 14px", marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 14 }}>🏨</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#d4af37", letterSpacing: "0.12em" }}>LOBBY MATCH</span>
          </motion.div>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div style={{ position: "relative" }}>
              <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "2px solid rgba(212,175,55,0.6)" }}
              />
              <img
                src={profile.image} alt={firstName}
                style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(212,175,55,0.7)", display: "block" }}
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: "#050508", border: "1.5px solid rgba(212,175,55,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>🔑</div>
            </div>
          </div>

          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 2px" }}>
            <span>A guest in the lobby</span>
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 4px", background: "linear-gradient(135deg, #d4af37, #f0d060)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            <span>{firstName}!</span>
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 4px" }}>
            <span>{profile.age} · {profile.city} {profile.countryFlag}</span>
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 4px", fontWeight: 600 }}>
            <span>{ghostId}</span>
          </p>
          <p style={{ fontSize: 12, color: "rgba(212,175,55,0.75)", fontWeight: 700, margin: "0 0 22px" }}>
            <span>Both in the lobby right now. Step out together tonight.</span>
          </p>

          {screen === "match" ? (
            <>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setScreen("pay")}
                animate={{ boxShadow: ["0 4px 24px rgba(212,175,55,0.25)", "0 4px 32px rgba(212,175,55,0.5)", "0 4px 24px rgba(212,175,55,0.25)"] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{
                  width: "100%", height: 52, borderRadius: 16, border: "none",
                  background: "linear-gradient(135deg, #92660a, #d4af37)",
                  color: "#000", fontWeight: 900, fontSize: 15, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <MessageCircle size={18} />
                <span>Leave the Lobby Together</span>
              </motion.button>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 12, marginBottom: 0 }}>
                <span>Auto-closing in {secs}s</span>
              </p>
            </>
          ) : screen === "pay" ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, textAlign: "left" }}>
                {[
                  ["🚪", "Leave the hotel together"],
                  ["📱", "Connect on WhatsApp, iMessage or WeChat"],
                  ["🔑", "One-time match fee — only pay when you connect"],
                ].map(([icon, text]) => (
                  <div key={text as string} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{text}</span>
                  </div>
                ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                disabled={paying}
                onClick={handleConnect}
                animate={{ boxShadow: paying ? undefined : ["0 4px 20px rgba(212,175,55,0.25)", "0 4px 32px rgba(212,175,55,0.5)", "0 4px 20px rgba(212,175,55,0.25)"] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{
                  width: "100%", height: 52, borderRadius: 16, border: "none",
                  background: paying ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #92660a, #d4af37)",
                  color: paying ? "rgba(255,255,255,0.3)" : "#000",
                  fontWeight: 900, fontSize: 15, cursor: paying ? "default" : "pointer",
                  marginBottom: 10,
                }}
              >
                {paying ? "Processing…" : "Connect Now — 🪙 50 coins"}
              </motion.button>
              <button onClick={() => setScreen("match")} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "4px 0" }}>
                ← Go back
              </button>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center" }}>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                style={{ fontSize: 40, marginBottom: 10 }}
              >🔑</motion.div>
              <p style={{ fontSize: 16, fontWeight: 900, color: "#d4af37", margin: "0 0 6px" }}>
                {firstName} is waiting in the lobby
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "0 0 14px", lineHeight: 1.6 }}>
                They're expecting your message. The lobby resets in 60 minutes — step out while you can.
              </p>
              <p style={{ fontSize: 15, fontWeight: 900, color: "#d4af37", margin: "0 0 20px", letterSpacing: "0.02em" }}>
                Enjoy your evening 🏨
              </p>
              <button
                onClick={onClose}
                style={{
                  width: "100%", height: 46, borderRadius: 14, border: "1px solid rgba(212,175,55,0.3)",
                  background: "rgba(212,175,55,0.08)", color: "#d4af37",
                  fontWeight: 800, fontSize: 13, cursor: "pointer",
                }}
              >
                Back to Ghost Hotel
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Hotel Lobby info popup (shown before joining) ─────────────────────────────
function LobbyInfoPopup({ onJoin, onClose }: { onJoin: () => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(6,4,0,0.99)", backdropFilter: "blur(40px)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(212,175,55,0.3)", borderBottom: "none",
          overflow: "hidden",
          boxShadow: "0 -20px 60px rgba(212,175,55,0.1)",
          padding: "0 22px max(32px, env(safe-area-inset-bottom, 32px))",
        }}
      >
        {/* Gold bar */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ height: 3, background: "linear-gradient(90deg, #92660a, #d4af37, #f0d060, #d4af37, #92660a)", marginBottom: 0 }}
        />

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 18px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(212,175,55,0.3)" }} />
        </div>

        {/* Icon */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ fontSize: 52, textAlign: "center", marginBottom: 14, lineHeight: 1 }}
        >🏨</motion.div>

        {/* Title */}
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 6px", textAlign: "center" }}>
          Hotel Lobby
        </h2>
        <p style={{ fontSize: 13, color: "#d4af37", fontWeight: 700, margin: "0 0 22px", textAlign: "center" }}>
          Available to date · Right now
        </p>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
          {[
            { icon: "⚡", title: "60 minutes live", desc: "You're visible in the lobby for 60 minutes as someone available to go on a date right now." },
            { icon: "❤️", title: "Like + Like = Match", desc: "If you like someone and they like you back, you're instantly matched — no waiting." },
            { icon: "🚪", title: "Leave together", desc: "Once matched, you both leave the lobby and head straight to your first date. That's it." },
          ].map((s) => (
            <div key={s.icon} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>{s.title}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onJoin}
          animate={{ boxShadow: ["0 4px 20px rgba(212,175,55,0.25)", "0 4px 36px rgba(212,175,55,0.5)", "0 4px 20px rgba(212,175,55,0.25)"] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: "100%", height: 52, borderRadius: 16, border: "none",
            background: "linear-gradient(135deg, #92660a, #d4af37, #f0d060)",
            color: "#000", fontWeight: 900, fontSize: 15, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginBottom: 12,
          }}
        >
          <span>🏨</span>
          <span>I'm Ready — Join the Lobby</span>
        </motion.button>
        <button
          onClick={onClose}
          style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 13, cursor: "pointer", padding: "4px 0" }}
        >
          Not right now
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Combined Hotel Lobby section (pulse + lobby entry/active) ─────────────────
export default function GhostFlashSection({
  isActive, flashUntil, flashTick, flashProfiles, pulseProfiles, onEnter, onExit, onSelectProfile,
  onCallButler,
  contactsUsed, contactLimit,
}: {
  isActive: boolean; flashUntil: number; flashTick: number;
  flashProfiles: GhostProfile[]; pulseProfiles: GhostProfile[];
  onEnter: () => void; onExit: () => void;
  onSelectProfile: (p: GhostProfile) => void;
  onCallButler?: () => void;
  contactsUsed: number; contactLimit: number;
}) {
  const a = useGenderAccent();
  const guestCount = 8 + (Math.floor(Date.now() / 300000) % 17);
  void flashTick;

  const [showInfo, setShowInfo] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Pulse profiles: active in last hour
  const pulse = pulseProfiles.filter((p) => (p.lastActiveHoursAgo ?? 99) <= 1).slice(0, 8);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleJoin = () => {
    setShowInfo(false);
    onEnter();
  };

  return (
    <>
      <AnimatePresence>
        {showInfo && <LobbyInfoPopup onJoin={handleJoin} onClose={() => setShowInfo(false)} />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{
          margin: "10px 14px 0",
          background: a.glow(0.05),
          border: `1px solid ${isActive ? a.glow(0.45) : a.glow(0.2)}`,
          borderRadius: 16, overflow: "hidden",
        }}
      >
        {/* Pulsing accent bar */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: isActive ? 1 : 2.2, repeat: Infinity }}
          style={{ height: 2, background: a.gradient }}
        />

        {/* ── Header row — tap to expand/collapse ── */}
        <div
          onClick={() => setExpanded((v) => !v)}
          style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: isActive ? 1 : 1.4, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: "50%", background: a.accent, display: "block", boxShadow: `0 0 8px ${a.glow(0.9)}`, flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, fontWeight: 900, color: "#fff", letterSpacing: "0.04em" }}>🏨 Hotel Lobby</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: a.accent, background: a.glow(0.12), border: `1px solid ${a.glow(0.3)}`, borderRadius: 20, padding: "1px 8px" }}>{guestCount}</span>
          <span style={{ flex: 1 }} />
          {/* Exit button — only shown when active */}
          {isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); onExit(); }}
              style={{
                height: 24, paddingInline: 12, borderRadius: 20,
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.35)",
                color: "#f87171",
                fontSize: 10, fontWeight: 900, cursor: "pointer", letterSpacing: "0.04em", flexShrink: 0,
              }}
            >
              Exit
            </button>
          )}
          {/* Chevron */}
          <span style={{ fontSize: 10, color: a.glow(0.5), transition: "transform 0.2s", display: "block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>▼</span>
        </div>

        {/* ── Expandable body ── */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="lobby-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0, padding: "0 14px 8px" }}>
                {isActive ? "You're live — available to date now" : "Ready to date right now · 60-min window"}
              </p>

              {/* Profile scroll row — 5 visible on screen, scroll for more */}
              {(isActive ? flashProfiles : pulse).length > 0 ? (
                <div
                  ref={scrollRef}
                  className="lobby-scroll"
                  style={{ display: "flex", gap: 8, overflowX: "auto", padding: "4px 14px 10px" }}
                >
                  {(isActive ? flashProfiles : pulse).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onSelectProfile(p)}
                      style={{ flexShrink: 0, width: "calc((100vw - 96px) / 5)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
                    >
                      <div style={{ position: "relative", width: "calc((100vw - 96px) / 5)", height: "calc((100vw - 96px) / 5)" }}>
                        <motion.div
                          animate={{ scale: [1, 1.22, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 1.8, repeat: Infinity, delay: Math.random() * 1.2 }}
                          style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${a.glow(0.7)}`, pointerEvents: "none" }}
                        />
                        <img
                          src={p.image} alt=""
                          style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.55)}`, display: "block" }}
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                        {isActive && (
                          <div style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: "50%", background: "#050508", border: `1.5px solid ${a.glow(0.7)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>🔑</div>
                        )}
                        {!isActive && isProfileTonight(p.id) && (
                          <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 12, lineHeight: 1 }}>🌙</span>
                        )}
                      </div>
                      <p style={{ fontSize: 8, color: a.accent, fontWeight: isActive ? 800 : 700, margin: 0, letterSpacing: "0.04em" }}>
                        {isActive ? String(p.age) : toGhostId(p.id).replace("Guest-", "")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : isActive ? (
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, textAlign: "center", padding: "8px 14px 12px" }}>
                  Waiting for guests to enter the lobby...
                </p>
              ) : null}

              {/* Bottom action row — active only */}
              {isActive && (
                <div style={{ padding: "0 14px 12px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: contactsUsed >= contactLimit ? "rgba(239,68,68,0.15)" : a.glow(0.1),
                    border: `1px solid ${contactsUsed >= contactLimit ? "rgba(239,68,68,0.3)" : a.glow(0.25)}`,
                    borderRadius: 8, padding: "2px 8px",
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: contactsUsed >= contactLimit ? "#f87171" : a.accent, letterSpacing: "0.04em" }}>
                      {contactsUsed >= contactLimit ? "LIMIT REACHED" : `${contactLimit - contactsUsed} left`}
                    </span>
                  </div>
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}
                    style={{ fontSize: 16, fontWeight: 900, color: a.accent, fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}
                  >
                    {fmtFlashTime(flashUntil)}
                  </motion.span>
                </div>
              )}

              {/* Call Butler */}
              {onCallButler && (
                <div style={{ padding: "0 14px 12px", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={onCallButler}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <img src="https://ik.imagekit.io/7grri5v7d/butlers%20tray.png" alt="butler" style={{ width: 16, height: 16, objectFit: "contain" }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>Call Butler</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
