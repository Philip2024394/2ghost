import { useState } from "react";
import { motion } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

export type PendingGift = {
  giftEmoji: string;
  giftName: string;
  fromName: string;
  fromId: string;
};

const REPLY_OPTIONS = [
  { id: "night",    emoji: "😊", text: "Thank you, this truly made my night 😊" },
  { id: "talk",     emoji: "💬", text: "You're so thoughtful — let's talk 💬" },
  { id: "way",      emoji: "🌹", text: "This is unexpected... in the best way 🌹" },
  { id: "sweet",    emoji: "✨", text: "Wow, I wasn't expecting this — you're so sweet!" },
  {
    id: "decline1", emoji: "🙏",
    text: "Thank you for the gift, unfortunately for now I would like to take notice for a while. Hope you understand.",
  },
  {
    id: "decline2", emoji: "🤍",
    text: "Thanks, it's so nice to receive — but I just opened a conversation with another ghost and would like to show respect.",
  },
  { id: "custom",   emoji: "✍️", text: "Write your own reply…" },
];

const isDecline = (id: string) => id === "decline1" || id === "decline2";

type Props = {
  gift: PendingGift;
  onReply: (text: string, isDecline: boolean) => void;
};

export default function GiftReplyModal({ gift, onReply }: Props) {
  const a = useGenderAccent();
  const [selected, setSelected]     = useState<string | null>(null);
  const [customText, setCustomText] = useState("");

  const isCustom = selected === "custom";
  const canSend  = selected !== null && (!isCustom || customText.trim().length > 0);

  function handleSend() {
    if (!canSend) return;
    const text   = isCustom ? customText.trim() : REPLY_OPTIONS.find(o => o.id === selected)!.text;
    const decline = isDecline(selected!);
    onReply(text, decline);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,10,0.99)", borderRadius: "24px 24px 0 0", border: "1px solid rgba(212,175,55,0.22)", borderBottom: "none", maxHeight: "90dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Gold top stripe */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #92400e, #d4af37, #fbbf24, #d4af37, #92400e, transparent)", flexShrink: 0 }} />

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px max(28px,env(safe-area-inset-bottom,28px))" }}>

          {/* Gift card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
            style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.14), rgba(251,191,36,0.06))", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, padding: "18px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              style={{ fontSize: 46, lineHeight: 1, flexShrink: 0 }}
            >
              {gift.giftEmoji}
            </motion.div>
            <div>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#d4af37", letterSpacing: "0.12em", textTransform: "uppercase" }}>Gift Received</p>
              <p style={{ margin: "4px 0 3px", fontSize: 17, fontWeight: 900, color: "#fff" }}>{gift.giftName}</p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                from <strong style={{ color: "rgba(255,255,255,0.8)" }}>{gift.fromName}</strong>
              </p>
            </div>
          </motion.div>

          {/* Must-reply notice */}
          <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.18)", borderRadius: 12, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💌</span>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>
              <strong style={{ color: "#fbbf24" }}>{gift.fromName}</strong> sent you a gift and is waiting.
              A reply is required — choose one below or write your own.
            </p>
          </div>

          {/* Options label */}
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            Choose your reply
          </p>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {REPLY_OPTIONS.map(opt => (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(opt.id)}
                style={{
                  width: "100%", textAlign: "left",
                  background: selected === opt.id
                    ? (isDecline(opt.id) ? "rgba(239,68,68,0.1)" : a.glow(0.14))
                    : "rgba(255,255,255,0.04)",
                  border: `1px solid ${selected === opt.id
                    ? (isDecline(opt.id) ? "rgba(239,68,68,0.4)" : a.glow(0.4))
                    : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 14, padding: "12px 14px", cursor: "pointer",
                  display: "flex", alignItems: "flex-start", gap: 10,
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{opt.emoji}</span>
                <span style={{
                  fontSize: 12, lineHeight: 1.55, fontWeight: selected === opt.id ? 700 : 400,
                  color: selected === opt.id
                    ? (isDecline(opt.id) ? "#f87171" : "#fff")
                    : "rgba(255,255,255,0.6)",
                }}>
                  {opt.text}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Custom text area */}
          {isCustom && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 16 }}
            >
              <textarea
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                placeholder="Type your reply here…"
                maxLength={220}
                autoFocus
                style={{
                  width: "100%", minHeight: 84,
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${a.glow(0.28)}`,
                  borderRadius: 14, padding: "12px 14px",
                  color: "#fff", fontSize: 13, resize: "none",
                  outline: "none", fontFamily: "inherit", lineHeight: 1.5,
                  boxSizing: "border-box",
                }}
              />
            </motion.div>
          )}

          {/* Send button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSend}
            disabled={!canSend}
            style={{
              width: "100%", height: 52, borderRadius: 16, border: "none",
              background: canSend
                ? "linear-gradient(135deg, #92400e, #d4af37)"
                : "rgba(255,255,255,0.06)",
              color: canSend ? "#fff" : "rgba(255,255,255,0.22)",
              fontSize: 15, fontWeight: 900,
              cursor: canSend ? "pointer" : "not-allowed",
              boxShadow: canSend ? "0 8px 24px rgba(212,175,55,0.28)" : "none",
              transition: "all 0.2s",
            }}
          >
            Send Reply
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
