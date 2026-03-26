/**
 * MsVeraPopup — Hotel Information Lady
 * Ms. Vera appears in two situations:
 *   mode="locked"   — Date Ideas is gated, shows countdown to unlock
 *   mode="new_post" — A new date place was posted, she announces it + suggests inviting a guest
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VERA_IMG = "https://ik.imagekit.io/7grri5v7d/asddsasdd.png";
const FIRST_VISIT_KEY  = "ghost_first_visit";
const UNLOCK_HOURS     = 24;
const UNLOCK_MS        = UNLOCK_HOURS * 60 * 60 * 1000;

// ── Helpers ───────────────────────────────────────────────────────────────────

export function recordFirstVisit() {
  if (!localStorage.getItem(FIRST_VISIT_KEY)) {
    localStorage.setItem(FIRST_VISIT_KEY, String(Date.now()));
  }
}

export function isDateIdeasUnlocked(): boolean {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    const joinedAt = p.joined_at
      ? new Date(p.joined_at).getTime()
      : parseInt(localStorage.getItem(FIRST_VISIT_KEY) || "0", 10);
    if (!joinedAt) return true; // no data → don't block
    return Date.now() - joinedAt >= UNLOCK_MS;
  } catch { return true; }
}

function getTimeUntilUnlock(): { hrs: number; mins: number; pct: number } {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    const joinedAt = p.joined_at
      ? new Date(p.joined_at).getTime()
      : parseInt(localStorage.getItem(FIRST_VISIT_KEY) || "0", 10);
    if (!joinedAt) return { hrs: 0, mins: 0, pct: 100 };
    const elapsed  = Date.now() - joinedAt;
    const remaining = Math.max(0, UNLOCK_MS - elapsed);
    const hrs  = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    const pct  = Math.min(100, Math.round((elapsed / UNLOCK_MS) * 100));
    return { hrs, mins, pct };
  } catch { return { hrs: 0, mins: 0, pct: 100 }; }
}

function getMyName(): string {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    return p.name || p.display_name || "Guest";
  } catch { return "Guest"; }
}

function timeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NewPostInfo {
  id: string;
  title: string;
  image: string;
  location: string;
  authorName: string;
  authorCity?: string;
  authorFlag?: string;
}

interface LockedProps {
  mode: "locked";
  onClose: () => void;
}

interface NewPostProps {
  mode: "new_post";
  post: NewPostInfo;
  onClose: () => void;
  onInvite: (post: NewPostInfo) => void;
  onBrowse: () => void;
}

type Props = LockedProps | NewPostProps;

// ── Shared shell ──────────────────────────────────────────────────────────────

function Shell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9600,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "linear-gradient(180deg, #0a090e 0%, #05040a 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderTop: "2px solid rgba(180,140,255,0.3)",
          borderRadius: "24px 24px 0 0",
          padding: "8px 22px max(48px, env(safe-area-inset-bottom, 48px))",
          maxHeight: "92dvh", overflowY: "auto",
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(180,140,255,0.4)", margin: "12px auto 20px" }} />
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── Ms. Vera header row ────────────────────────────────────────────────────────

function VeraHeader({ subtitle, onClose }: { subtitle: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <img
        src={VERA_IMG}
        alt="Ms. Vera"
        style={{ width: 62, height: 62, objectFit: "cover", objectPosition: "top", borderRadius: "50%", flexShrink: 0, border: "2px solid rgba(180,140,255,0.4)" }}
      />
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 900, color: "rgba(180,140,255,0.85)", letterSpacing: "0.14em", textTransform: "uppercase" }}>MS. VERA</p>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>{subtitle}</p>
      </div>
      <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 13, flexShrink: 0 }}>
        ✕
      </motion.button>
    </div>
  );
}

// ── LOCKED mode ───────────────────────────────────────────────────────────────

function LockedView({ onClose }: { onClose: () => void }) {
  const name = getMyName();
  const [time, setTime] = useState(getTimeUntilUnlock());

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeUntilUnlock()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <Shell onClose={onClose}>
      <VeraHeader subtitle="Hotel Information" onClose={onClose} />

      {/* Message */}
      <div style={{ background: "rgba(180,140,255,0.06)", border: "1px solid rgba(180,140,255,0.15)", borderRadius: 16, padding: "16px 18px", marginBottom: 20 }}>
        <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1.4 }}>
          Welcome to the hotel, {name}.
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
          Our Hotel Information area opens to new guests after their first <strong style={{ color: "#fff" }}>24 hours</strong> at the hotel. Take some time to settle in — we'll have everything ready for you soon.
        </p>
      </div>

      {/* Countdown */}
      {time.pct < 100 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Opens in</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>
              {String(time.hrs).padStart(2, "0")}:{String(time.mins).padStart(2, "0")}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${time.pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg, rgba(180,140,255,0.6), rgba(180,140,255,1))" }}
            />
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "right" }}>{time.pct}% of your first day complete</p>
        </div>
      )}

      {/* What's inside teaser */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 22 }}>
        <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase" }}>What's inside</p>
        {[
          { icon: "💝", text: "Date ideas posted by hotel guests" },
          { icon: "📍", text: "Real places recommended in your city" },
          { icon: "💌", text: "Invite any guest to visit a place together" },
          { icon: "⭐", text: "Rate and review experiences" },
        ].map(({ icon, text }) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{text}</span>
          </div>
        ))}
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
        style={{ width: "100%", height: 48, borderRadius: 50, border: "1px solid rgba(180,140,255,0.3)", background: "rgba(180,140,255,0.08)", color: "rgba(180,140,255,0.9)", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
        Got it, I'll come back soon
      </motion.button>
    </Shell>
  );
}

// ── NEW POST mode ─────────────────────────────────────────────────────────────

function NewPostView({ post, onClose, onInvite, onBrowse }: Omit<NewPostProps, "mode">) {
  const name = getMyName();

  return (
    <Shell onClose={onClose}>
      <VeraHeader subtitle="Hotel Information" onClose={onClose} />

      {/* Greeting */}
      <p style={{ margin: "0 0 16px", fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
        <span style={{ color: "#fff", fontWeight: 800 }}>{timeOfDay()}, {name}.</span>{" "}
        A new place has just been added to the hotel guide. Let me tell you about it.
      </p>

      {/* Place card */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onBrowse}
        style={{ borderRadius: 18, overflow: "hidden", marginBottom: 20, cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div style={{ position: "relative", height: 170 }}>
          <img src={post.image} alt={post.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 40%, transparent)" }} />
          <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
            <p style={{ margin: "0 0 3px", fontSize: 15, fontWeight: 900, color: "#fff" }}>{post.title}</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>📍 {post.location}</p>
          </div>
        </div>
        <div style={{ padding: "10px 14px 12px", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
            Recommended by {post.authorFlag} {post.authorName}
            {post.authorCity ? ` · ${post.authorCity}` : ""}
          </p>
        </div>
      </motion.div>

      {/* Ms. Vera suggestion */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 22 }}>
        <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>💌</span>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
          This looks like a wonderful spot for a first date. Would you like to invite a guest to visit together?
        </p>
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onInvite(post)}
          style={{
            width: "100%", height: 52, borderRadius: 50, border: "none",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
            boxShadow: "0 4px 20px rgba(168,85,247,0.3)",
          }}>
          Invite a Guest 💌
        </motion.button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onBrowse}
          style={{
            width: "100%", height: 46, borderRadius: 50,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>
          View in Hotel Guide
        </motion.button>
      </div>
    </Shell>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function MsVeraPopup(props: Props) {
  return (
    <AnimatePresence>
      {props.mode === "locked"
        ? <LockedView key="locked" onClose={props.onClose} />
        : <NewPostView key="new_post" post={props.post} onClose={props.onClose} onInvite={props.onInvite} onBrowse={props.onBrowse} />
      }
    </AnimatePresence>
  );
}
