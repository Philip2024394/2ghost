// ── Butler Message Popup ──────────────────────────────────────────────────────
// Displays an in-app message from The Butler. Gold-themed, strict tone.

import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

export type ButlerMessageKey =
  | "match_interest"
  | "noshow_warning_1"
  | "noshow_warning_2"
  | "noshow_final"
  | "match_expiry"
  | "coin_shop"
  | "banned"
  | "welcome_back"
  | "profile_incomplete"
  | "gift_received"
  | "late_reply"
  | "spam_warning"
  | "content_warning"
  | "floor_upgrade";

export type ButlerMessage = {
  key: ButlerMessageKey;
  icon: string;
  title: string;
  body: string;
  tone: "strict" | "funny" | "warning" | "gold";
};

export const BUTLER_MESSAGES: Record<ButlerMessageKey, ButlerMessage> = {
  match_interest: {
    key: "match_interest",
    icon: "🎩",
    title: "A Guest Has Expressed Interest",
    body: "A guest has taken notice of you. The Butler suggests you respond within 24 hours. First impressions within these walls carry weight — do not squander this one.",
    tone: "strict",
  },
  noshow_warning_1: {
    key: "noshow_warning_1",
    icon: "🎩",
    title: "The Butler Has Noted Your Absence",
    body: "You accepted a date and did not appear. The Butler has noted your absence. This is your first recorded offence. A second will not be viewed as coincidence.",
    tone: "warning",
  },
  noshow_warning_2: {
    key: "noshow_warning_2",
    icon: "🎩",
    title: "The Butler Is Watching",
    body: "You have now failed to appear on two occasions. The Butler is watching. A third offence will not be overlooked — nor will it be handled gently. Consider this your final courtesy warning.",
    tone: "warning",
  },
  noshow_final: {
    key: "noshow_final",
    icon: "🎩",
    title: "Three Strikes. The Butler Remembers Everything.",
    body: "A third no-show has been recorded. The Butler does not forget. Your account has been flagged. Future reservations within this hotel are at the Butler's sole discretion. Conduct yourself accordingly — or do not conduct yourself here at all.",
    tone: "strict",
  },
  match_expiry: {
    key: "match_expiry",
    icon: "🎩",
    title: "Your Connection Has Expired",
    body: "Your connection has expired. The Butler is disappointed, but not surprised. Opportunities within these walls do not wait indefinitely. The next one may not come so easily.",
    tone: "funny",
  },
  coin_shop: {
    key: "coin_shop",
    icon: "🎩",
    title: "A Word From The Butler",
    body: "The Butler recommends the Gold package. Quality costs. The guests who invest in their experience here are, without exception, the ones who leave satisfied. The ones who do not — well. The Butler has seen them before.",
    tone: "gold",
  },
  banned: {
    key: "banned",
    icon: "🎩",
    title: "The Butler Has Escorted You From The Premises",
    body: "The Butler has escorted you from the premises. Your account has been suspended. The rules of this hotel exist for every guest — including you. There will be no further discussion on the matter.",
    tone: "strict",
  },
  welcome_back: {
    key: "welcome_back",
    icon: "🎩",
    title: "Welcome Back",
    body: "The Butler notes your return. The hotel has not changed. The standards have not changed. We trust that you have.",
    tone: "funny",
  },
  profile_incomplete: {
    key: "profile_incomplete",
    icon: "🎩",
    title: "Your Profile Requires Attention",
    body: "The Butler has reviewed your profile and found it... lacking. A complete profile is not a suggestion within these walls — it is an expectation. Guests who present themselves properly are guests worth meeting.",
    tone: "strict",
  },
  gift_received: {
    key: "gift_received",
    icon: "🎩",
    title: "A Gift Has Arrived For You",
    body: "A guest has sent you a gift. The Butler suggests you acknowledge it. Ignoring a gesture of this nature reflects poorly on your standing in the hotel. Respond with the grace this establishment expects.",
    tone: "strict",
  },
  late_reply: {
    key: "late_reply",
    icon: "🎩",
    title: "You Are Running Out Of Time",
    body: "Your match is waiting. The Butler has observed your silence for longer than is acceptable. This guest will not wait forever — and frankly, neither would the Butler.",
    tone: "funny",
  },
  spam_warning: {
    key: "spam_warning",
    icon: "🎩",
    title: "The Butler Has Observed Unusual Activity",
    body: "The Butler has flagged your messaging behaviour. Sending the same message to multiple guests is beneath the standards of this hotel. One more incident and this matter will be escalated. You have been warned — precisely once.",
    tone: "warning",
  },
  content_warning: {
    key: "content_warning",
    icon: "🎩",
    title: "Inappropriate Content Detected",
    body: "The Butler is aware of what was shared. This hotel does not tolerate indecent language or explicit content of any kind. This is your one and only formal notice. The next violation will not result in a warning.",
    tone: "warning",
  },
  floor_upgrade: {
    key: "floor_upgrade",
    icon: "🎩",
    title: "Your Floor Awaits",
    body: "The Butler has prepared a higher floor for you. Each level of this hotel reflects your intentions. Choose wisely — the guests you meet above are not here by accident. Neither are you.",
    tone: "gold",
  },
};

const TONE_STYLE: Record<ButlerMessage["tone"], { border: string; glow: string; titleColor: string }> = {
  strict:  { border: "rgba(255,255,255,0.15)", glow: "rgba(255,255,255,0.05)", titleColor: "#fff" },
  funny:   { border: "rgba(251,191,36,0.3)",   glow: "rgba(251,191,36,0.06)",  titleColor: "#fbbf24" },
  warning: { border: "rgba(239,68,68,0.35)",   glow: "rgba(239,68,68,0.07)",   titleColor: "#f87171" },
  gold:    { border: "rgba(212,175,55,0.4)",   glow: "rgba(212,175,55,0.08)",  titleColor: "#d4af37" },
};

type Props = {
  message: ButlerMessage | null;
  onClose: () => void;
};

export default function GhostButlerMessage({ message, onClose }: Props) {
  const a = useGenderAccent();
  const ts = message ? TONE_STYLE[message.tone] : TONE_STYLE.strict;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 800,
            background: "rgba(0,0,0,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 480,
              background: "rgba(4,4,8,0.99)",
              borderRadius: "22px 22px 0 0",
              border: `1px solid ${ts.border}`,
              borderBottom: "none",
              overflow: "hidden",
            }}
          >
            {/* Gold top bar */}
            <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #d4af37, #fbbf24, #d4af37, transparent)" }} />

            <div style={{ padding: "22px 20px max(32px,env(safe-area-inset-bottom,32px))" }}>
              {/* Butler header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                  background: `radial-gradient(circle, rgba(212,175,55,0.2), rgba(212,175,55,0.05))`,
                  border: "1.5px solid rgba(212,175,55,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
                }}>
                  🎩
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#d4af37", letterSpacing: "0.08em", textTransform: "uppercase" }}>The Butler</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>2Ghost Hotel · Management</p>
                </div>
                <button
                  onClick={onClose}
                  style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >✕</button>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)", marginBottom: 18 }} />

              {/* Message */}
              <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 900, color: ts.titleColor, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                {message.title}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.75 }}>
                {message.body}
              </p>

              {/* Dismiss */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onClose}
                style={{
                  width: "100%", height: 48, marginTop: 22, borderRadius: 14, border: `1px solid ${ts.border}`,
                  background: ts.glow, color: ts.titleColor,
                  fontSize: 13, fontWeight: 800, cursor: "pointer", letterSpacing: "0.02em",
                }}
              >
                Understood
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
