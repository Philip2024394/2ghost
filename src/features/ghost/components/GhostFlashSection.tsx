import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId, fmtFlashTime } from "../utils/ghostHelpers";

// ── Ghost Flash match popup ──────────────────────────────────────────────────
export function GhostFlashMatchPopup({ profile, onClose }: { profile: GhostProfile; onClose: () => void }) {
  const firstName = profile.name.split(" ")[0];
  const ghostId = toGhostId(profile.id);
  const [secs, setSecs] = useState(30);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => { if (s <= 1) { onClose(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [onClose]);

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
          borderRadius: 24, border: "1px solid rgba(74,222,128,0.35)",
          overflow: "hidden",
          boxShadow: "0 0 60px rgba(74,222,128,0.2), 0 24px 80px rgba(0,0,0,0.8)",
        }}
      >
        {/* Pulsing top bar */}
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
          style={{ height: 4, background: "linear-gradient(90deg, #16a34a, #4ade80, #16a34a)" }}
        />

        <div style={{ padding: "28px 24px 26px" }}>
          {/* Flash badge */}
          <motion.div
            animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1, repeat: Infinity }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.4)",
              borderRadius: 20, padding: "5px 14px", marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 14 }}>⚡</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: "rgba(74,222,128,0.95)", letterSpacing: "0.12em" }}>FLASH MATCH</span>
          </motion.div>

          {/* Photo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <div style={{ position: "relative" }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "2px solid rgba(74,222,128,0.6)" }}
              />
              <img
                src={profile.image} alt={firstName}
                style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(74,222,128,0.6)", display: "block" }}
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
            </div>
          </div>

          {/* Ghost ID reveal */}
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 2px" }}>
            <span>{ghostId} is revealed as</span>
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 4px", background: "linear-gradient(135deg, #4ade80, #22c55e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            <span>{firstName}!</span>
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 6px" }}>
            <span>{profile.age} · {profile.city} {profile.countryFlag}</span>
          </p>
          <p style={{ fontSize: 12, color: "rgba(74,222,128,0.7)", fontWeight: 700, margin: "0 0 22px" }}>
            <span>You're both live right now. WhatsApp opens instantly.</span>
          </p>

          {/* CTA */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            animate={{ boxShadow: ["0 4px 24px rgba(34,197,94,0.35)", "0 4px 32px rgba(34,197,94,0.6)", "0 4px 24px rgba(34,197,94,0.35)"] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{
              width: "100%", height: 52, borderRadius: 16, border: "none",
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <MessageCircle size={18} />
            <span>Open WhatsApp Now</span>
          </motion.button>

          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 12, marginBottom: 0 }}>
            <span>Auto-closing in {secs}s</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Ghost Flash section (entry + active) ─────────────────────────────────────
export default function GhostFlashSection({
  isActive, flashUntil, flashTick, flashProfiles, onEnter, onExit, onSelectProfile,
  contactsUsed, contactLimit,
}: {
  isActive: boolean; flashUntil: number; flashTick: number;
  flashProfiles: GhostProfile[]; onEnter: () => void; onExit: () => void;
  onSelectProfile: (p: GhostProfile) => void;
  contactsUsed: number; contactLimit: number;
}) {
  const liveCount = 8 + (Math.floor(Date.now() / 300000) % 17);
  void flashTick; // triggers re-render for countdown
  void onExit;    // part of public API — caller may wire an exit button

  // Auto-scroll: slowly left → then back right, pause at each end
  const scrollRef = useRef<HTMLDivElement>(null);
  const dirRef = useRef<1 | -1>(1); // 1 = scrolling left, -1 = scrolling right
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
        if (atEnd && dirRef.current === 1) { dirRef.current = -1; pauseRef.current = true; setTimeout(() => { pauseRef.current = false; }, 800); }
        else if (atStart && dirRef.current === -1) { dirRef.current = 1; pauseRef.current = true; setTimeout(() => { pauseRef.current = false; }, 800); }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); el.removeEventListener("scroll", onUserScroll); };
  }, [isActive]);

  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        style={{
          margin: "10px 14px 0",
          background: "rgba(5,5,8,0.6)",
          border: "1px solid rgba(74,222,128,0.25)",
          borderRadius: 16, overflow: "hidden",
        }}
      >
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ height: 2, background: "linear-gradient(90deg, #16a34a, #4ade80, #16a34a)" }}
        />
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "block", boxShadow: "0 0 8px rgba(74,222,128,0.9)", flexShrink: 0 }}
                />
                <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "0.05em" }}>⚡ Ghost Flash</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                <span>60-min live pool · instant WhatsApp on like</span>
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#4ade80", margin: 0 }}>{liveCount}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0 }}>live now</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {["Enter Flash → you're visible to live members only", "Like someone in Flash → WhatsApp opens instantly", "Pool resets every 60 minutes — no dead profiles"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <span style={{ color: "rgba(74,222,128,0.7)", fontSize: 11, flexShrink: 0, marginTop: 1 }}>⚡</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{t}</span>
              </div>
            ))}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onEnter}
            animate={{ boxShadow: ["0 4px 16px rgba(34,197,94,0.3)", "0 4px 24px rgba(34,197,94,0.55)", "0 4px 16px rgba(34,197,94,0.3)"] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{
              width: "100%", height: 48, borderRadius: 14, border: "none",
              background: "linear-gradient(135deg, #16a34a, #22c55e)",
              color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>⚡</span>
            <span>Enter Ghost Flash — Free</span>
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Active Flash state
  return (
    <div style={{ margin: "10px 14px 0", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 16, overflow: "hidden", background: "rgba(5,5,8,0.5)" }}>
      <motion.div
        animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 0.8, repeat: Infinity }}
        style={{ height: 2, background: "linear-gradient(90deg, #16a34a, #4ade80, #16a34a)" }}
      />
      <div style={{ padding: "10px 14px 12px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }}
              style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 10px rgba(74,222,128,1)", display: "block", flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, lineHeight: 1 }}>⚡</span>
            <span style={{ fontSize: 14, lineHeight: 1 }}>🕰️</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: "#4ade80", letterSpacing: "0.04em" }}>Ghosting</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>· {liveCount} live now</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Contact limit pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: contactsUsed >= contactLimit ? "rgba(239,68,68,0.15)" : "rgba(74,222,128,0.1)",
              border: `1px solid ${contactsUsed >= contactLimit ? "rgba(239,68,68,0.3)" : "rgba(74,222,128,0.25)"}`,
              borderRadius: 8, padding: "2px 8px",
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: contactsUsed >= contactLimit ? "#f87171" : "rgba(74,222,128,0.9)", letterSpacing: "0.04em" }}>
                {contactsUsed >= contactLimit ? "LIMIT REACHED" : `${contactLimit - contactsUsed} left`}
              </span>
            </div>
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}
              style={{ fontSize: 16, fontWeight: 900, color: "#4ade80", fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}
            >
              {fmtFlashTime(flashUntil)}
            </motion.span>
          </div>
        </div>

        {/* Flash profiles horizontal scroll */}
        {flashProfiles.length > 0 ? (
          <div ref={scrollRef} className="ghost-flash-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}>
            {flashProfiles.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProfile(p)}
                style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
              >
                <div style={{ position: "relative", width: 60, height: 60 }}>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid rgba(74,222,128,0.8)", pointerEvents: "none" }}
                  />
                  <img
                    src={p.image} alt=""
                    style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(74,222,128,0.6)", display: "block" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: "50%", background: "#050508", border: "1.5px solid rgba(74,222,128,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>⚡</div>
                </div>
                <p style={{ fontSize: 8, color: "rgba(74,222,128,0.85)", fontWeight: 800, margin: 0 }}>
                  <span>{p.age}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, textAlign: "center", padding: "6px 0" }}>
            <span>Waiting for others to enter Flash...</span>
          </p>
        )}
      </div>
    </div>
  );
}

