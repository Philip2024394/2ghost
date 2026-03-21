import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId, fmtFlashTime } from "../utils/ghostHelpers";

// ── Hotel Lobby match popup ───────────────────────────────────────────────────
export function GhostFlashMatchPopup({ profile, onClose, onConnect }: { profile: GhostProfile; onClose: () => void; onConnect?: (p: GhostProfile) => void }) {
  const firstName = profile.name.split(" ")[0];
  const ghostId = toGhostId(profile.id);
  const [secs, setSecs] = useState(30);
  const [screen, setScreen] = useState<"match" | "connected">("match");

  useEffect(() => {
    if (screen === "connected") return;
    const t = setInterval(() => setSecs((s) => { if (s <= 1) { onClose(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [onClose, screen]);

  const handleConnect = () => {
    setScreen("connected");
    if (onConnect) onConnect(profile);
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
        {/* Pulsing top bar — gold */}
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
          style={{ height: 4, background: "linear-gradient(90deg, #92660a, #d4af37, #f0d060, #d4af37, #92660a)" }}
        />

        <div style={{ padding: "28px 24px 26px" }}>

          {/* Lobby badge */}
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

          {/* Photo */}
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
              {/* Room key badge */}
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 22, height: 22, borderRadius: "50%", background: "#050508", border: "1.5px solid rgba(212,175,55,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>🔑</div>
            </div>
          </div>

          {/* Guest reveal */}
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
                onClick={handleConnect}
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
                <span>Open WhatsApp Now</span>
              </motion.button>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 12, marginBottom: 0 }}>
                <span>Auto-closing in {secs}s</span>
              </p>
            </>
          ) : (
            /* ── Connected confirmation screen ── */
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

// ── Hotel Lobby section (entry + active) ──────────────────────────────────────
export default function GhostFlashSection({
  isActive, flashUntil, flashTick, flashProfiles, onEnter, onExit, onSelectProfile,
  contactsUsed, contactLimit,
}: {
  isActive: boolean; flashUntil: number; flashTick: number;
  flashProfiles: GhostProfile[]; onEnter: () => void; onExit: () => void;
  onSelectProfile: (p: GhostProfile) => void;
  contactsUsed: number; contactLimit: number;
}) {
  const guestCount = 8 + (Math.floor(Date.now() / 300000) % 17);
  void flashTick;
  void onExit;

  // Auto-scroll lobby guests slowly left → right
  const scrollRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef<1 | -1>(1);
  const pauseRef = useRef(false);
  const userScrollRef = useRef(false);
  const userScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isActive) return;
    const el = scrollRef.current;
    if (!el) return;

    const onUserScroll = () => {
      userScrollRef.current = true;
      if (userScrollTimer.current) clearTimeout(userScrollTimer.current);
      userScrollTimer.current = setTimeout(() => { userScrollRef.current = false; }, 2000);
    };
    el.addEventListener("scroll", onUserScroll, { passive: true });

    let raf: number;
    const step = () => {
      if (!userScrollRef.current && !pauseRef.current && el) {
        el.scrollLeft += dirRef.current * 0.6;
        const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
        const atStart = el.scrollLeft <= 2;
        if (atEnd && dirRef.current === 1)   { dirRef.current = -1; pauseRef.current = true; setTimeout(() => { pauseRef.current = false; }, 800); }
        else if (atStart && dirRef.current === -1) { dirRef.current = 1; pauseRef.current = true; setTimeout(() => { pauseRef.current = false; }, 800); }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("scroll", onUserScroll); };
  }, [isActive]);

  // ── Entry state — lobby door ──────────────────────────────────────────────
  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{
          margin: "10px 14px 0",
          background: "rgba(8,6,2,0.7)",
          border: "1px solid rgba(212,175,55,0.25)",
          borderRadius: 16, overflow: "hidden",
        }}
      >
        {/* Pulsing gold bar */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 2.2, repeat: Infinity }}
          style={{ height: 2, background: "linear-gradient(90deg, #92660a, #d4af37, #f0d060, #d4af37, #92660a)" }}
        />

        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: "50%", background: "#d4af37", display: "block", boxShadow: "0 0 8px rgba(212,175,55,0.9)", flexShrink: 0 }}
                />
                <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "0.05em" }}>🏨 Hotel Lobby</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                <span>Guests ready to go out · 60-min window</span>
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#d4af37", margin: 0 }}>{guestCount}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0 }}>in lobby</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {[
              "Step into the lobby — you're visible to other guests only",
              "Like a guest → WhatsApp opens instantly for both of you",
              "Lobby clears every 60 minutes — only live guests shown",
            ].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: "#d4af37", fontSize: 11, flexShrink: 0, marginTop: 1 }}>🔑</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{t}</span>
              </div>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onEnter}
            animate={{ boxShadow: ["0 4px 16px rgba(212,175,55,0.2)", "0 4px 28px rgba(212,175,55,0.45)", "0 4px 16px rgba(212,175,55,0.2)"] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: "100%", height: 48, borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #92660a, #d4af37, #f0d060)",
              color: "#000", fontWeight: 900, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>🏨</span>
            <span>Step Into the Lobby — Free</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // ── Active lobby state ────────────────────────────────────────────────────
  return (
    <div style={{ margin: "10px 14px 0", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16, overflow: "hidden", background: "rgba(8,6,2,0.6)" }}>
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }}
        style={{ height: 2, background: "linear-gradient(90deg, #92660a, #d4af37, #f0d060, #d4af37, #92660a)" }}
      />
      <div style={{ padding: "10px 14px 12px" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#d4af37", boxShadow: "0 0 10px rgba(212,175,55,1)", display: "block", flexShrink: 0 }}
            />
            <span style={{ fontSize: 12 }}>🏨</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#d4af37", letterSpacing: "0.04em" }}>In the Lobby</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>· {guestCount} guests</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Contact limit pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: contactsUsed >= contactLimit ? "rgba(239,68,68,0.15)" : "rgba(212,175,55,0.1)",
              border: `1px solid ${contactsUsed >= contactLimit ? "rgba(239,68,68,0.3)" : "rgba(212,175,55,0.25)"}`,
              borderRadius: 8, padding: "2px 8px",
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: contactsUsed >= contactLimit ? "#f87171" : "#d4af37", letterSpacing: "0.04em" }}>
                {contactsUsed >= contactLimit ? "LIMIT REACHED" : `${contactLimit - contactsUsed} left`}
              </span>
            </div>
            {/* Countdown */}
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}
              style={{ fontSize: 16, fontWeight: 900, color: "#d4af37", fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}
            >
              {fmtFlashTime(flashUntil)}
            </motion.span>
          </div>
        </div>

        {/* Guest profiles horizontal scroll */}
        {flashProfiles.length > 0 ? (
          <div ref={scrollRef} className="ghost-flash-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 } as React.CSSProperties}>
            {flashProfiles.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProfile(p)}
                style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
              >
                <div style={{ position: "relative", width: 60, height: 60 }}>
                  <motion.div
                    animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                    style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid rgba(212,175,55,0.7)", pointerEvents: "none" }}
                  />
                  <img
                    src={p.image} alt=""
                    style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.55)", display: "block" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                  {/* Room key badge */}
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: "50%", background: "#050508", border: "1.5px solid rgba(212,175,55,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>🔑</div>
                </div>
                <p style={{ fontSize: 8, color: "#d4af37", fontWeight: 800, margin: 0 }}>
                  <span>{p.age}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, textAlign: "center", padding: "6px 0" }}>
            <span>Waiting for guests to enter the lobby...</span>
          </p>
        )}
      </div>
    </div>
  );
}
