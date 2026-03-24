// ── Butler Message Popup ──────────────────────────────────────────────────────
// Displays an in-app message from The Butler. Gold-themed, strict tone.

import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  | "floor_upgrade"
  | "room_ready"
  | "repeated_view"
  | "chat_invite_viewed";

export type ButlerMessage = {
  key: ButlerMessageKey;
  icon: string;
  title: string;
  body: string;
  tone: "strict" | "funny" | "warning" | "gold";
  buttonLabel?: string;
  headerLabel?: string;
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
  chat_invite_viewed: {
    key: "chat_invite_viewed",
    icon: "🎩",
    title: "The Signals Are There — This Is The Right Move.",
    body: "This guest has visited your profile more than once. That is not something people do without reason. Whether the attraction is curiosity, connection, or something more — only a conversation will confirm it.\n\nThe direction of their interest is unknown until words are exchanged. But what is clear is this — they have already looked twice. The hesitation is on their side. One well-placed invitation cuts through that entirely.\n\nThe Butler considers this the correct first move. A simple, direct chat invitation. No pressure, no commitment — just an open door. The signals are strong. Let us see if they walk through it.",
    tone: "gold",
    buttonLabel: "Send Chat Invite",
    headerLabel: "Let's Start a Chat",
  },
  repeated_view: {
    key: "repeated_view",
    icon: "🎩",
    title: "A Guest Has Returned To Your Profile — More Than Once.",
    body: "The Butler has observed that a particular guest has visited your profile three times or more. This is not coincidence — within these walls, nobody lingers without reason.\n\nNow, before we draw conclusions, I must be measured. It could be a friend. A sibling. Someone simply curious. The hotel sees many types of visitors. However — when the guest in question is of the kind that captures romantic interest, three visits carries a clear signal. They are drawn to you. They have looked once, returned, and looked again. That is not casual browsing. That is someone gathering the courage to act.\n\nThe question is not whether they are interested. The question is who moves first.\n\nThe Butler's counsel is this — do not wait indefinitely. A single, well-placed gesture tends to resolve all hesitation. Consider sending a small gift with a personal message. Keep it warm, keep it simple, keep it genuine. Something that says you noticed them too — without pressure, without urgency.\n\nThey have already done the hard part. They came back. Now it is your move.",
    tone: "gold",
  },
  room_ready: {
    key: "room_ready",
    icon: "🎩",
    title: "Your Room Is Ready, Guest",
    body: "Your luggage has been carefully placed in your room, and all is prepared for your stay. However, there is one matter that now requires your immediate attention — your profile.\n\nFor the safety and comfort of all esteemed guests, and to properly acknowledge your identity within the Hotel, it is required that you complete your registration. Only once this has been attended to may you enjoy full access to the Hotel's facilities.\n\nI trust you will see to this without delay.",
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
  onCreateProfile?: () => void;
  onAction?: () => void;
};

export default function GhostButlerMessage({ message, onClose, onCreateProfile, onAction }: Props) {
  useGenderAccent();
  const ts = message ? TONE_STYLE[message.tone] : TONE_STYLE.strict;
  const navigate = useNavigate();

  const isRoomReady = message?.key === "room_ready";

  const [countdown, setCountdown] = useState(59);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRoomReady || !message) return;
    setCountdown(59);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          onClose();
          navigate("/ghost");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [message?.key]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={isRoomReady ? undefined : onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 800,
            ...(isRoomReady
              ? { backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsdsterte.png?updatedAt=1774134188482)", backgroundSize: "cover", backgroundPosition: "center top" }
              : { background: "rgba(0,0,0,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)" }
            ),
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
        >
          {isRoomReady && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 0 }} />
          )}
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{
              position: "relative", zIndex: 1,
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
                <img src="https://ik.imagekit.io/7grri5v7d/ewrwerwerwer-removebg-preview.png?updatedAt=1774288645920" alt="Butler" style={{ width: 92, height: 92, objectFit: "contain", flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#d4af37", letterSpacing: "0.08em", textTransform: "uppercase" }}>{message?.headerLabel ?? "Create Profile"}</p>
                  <p style={{ margin: "3px 0 8px", fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>Today's 2Ghost Guests</p>
                  <div style={{ display: "flex", gap: 5 }}>
                    {[
                      "https://ik.imagekit.io/7grri5v7d/5q.png?updatedAt=1774013004908",
                      "https://ik.imagekit.io/7grri5v7d/4q.png?updatedAt=1774012953710",
                      "https://ik.imagekit.io/7grri5v7d/4i.png?updatedAt=1774012879924",
                      "https://ik.imagekit.io/7grri5v7d/1a.png?updatedAt=1774012891284",
                      "https://ik.imagekit.io/7grri5v7d/2q.png?updatedAt=1774012847860",
                    ].map((src, i) => (
                      <img key={i} src={src} alt="" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(212,175,55,0.3)", flexShrink: 0 }} />
                    ))}
                  </div>
                </div>
                {!isRoomReady && (
                  <button
                    onClick={onClose}
                    style={{ marginLeft: "auto", width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  >✕</button>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)", marginBottom: 18 }} />

              {/* Message */}
              <p style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 900, color: ts.titleColor, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                {message.title}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {message.body.split("\n\n").map((para, i) => (
                  <p key={i} style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.75 }}>{para}</p>
                ))}
              </div>

              {/* Countdown */}
              {isRoomReady && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18, padding: "10px 14px", borderRadius: 12, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
                    <svg width="36" height="36" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#ef4444" strokeWidth="2.5"
                        strokeDasharray={`${2 * Math.PI * 15}`}
                        strokeDashoffset={`${2 * Math.PI * 15 * (1 - countdown / 59)}`}
                        style={{ transition: "stroke-dashoffset 1s linear" }}
                      />
                    </svg>
                    <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#ef4444" }}>{countdown}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                    You will be returned to the entrance in <span style={{ color: "#f87171", fontWeight: 700 }}>{countdown}s</span> if you do not proceed.
                  </p>
                </div>
              )}

              {/* CTA */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  if (timerRef.current) clearInterval(timerRef.current);
                  if (onAction) { onAction(); onClose(); }
                  else if (onCreateProfile) onCreateProfile();
                  else onClose();
                }}
                style={{
                  width: "100%", height: 48, marginTop: 14, borderRadius: 14, border: `1px solid ${ts.border}`,
                  background: isRoomReady ? "linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))" : ts.glow,
                  color: ts.titleColor,
                  fontSize: 13, fontWeight: 800, cursor: "pointer", letterSpacing: "0.02em",
                }}
              >
                {message?.buttonLabel ?? (isRoomReady ? "Create Profile" : "Understood")}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
