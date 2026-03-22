import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────
type VaultMessage = {
  id: string;
  text: string;
  timestamp: number;
  isOwn: boolean;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  isGift?: boolean;
  giftEmoji?: string;
  coinCost?: number;
};

// ── Coins ─────────────────────────────────────────────────────────────────────
const MSG_COST  = 1;   // coins per message sent
const GIFT_COST = 10;  // coins per gift

function readCoins(): number  { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } }
function writeCoins(n: number) { try { localStorage.setItem("ghost_coins", String(Math.max(0, n))); } catch {} }

// ── Vault key ─────────────────────────────────────────────────────────────────
function vaultKey(targetId: string) { return `ghost_vault_chat_${targetId.replace(/\W/g, "_")}`; }
function loadVault(targetId: string): VaultMessage[] {
  try { return JSON.parse(localStorage.getItem(vaultKey(targetId)) || "[]"); } catch { return []; }
}
function saveVault(targetId: string, msgs: VaultMessage[]) {
  const clean = msgs.slice(-80).map(m => ({ ...m, mediaUrl: undefined }));
  try { localStorage.setItem(vaultKey(targetId), JSON.stringify(clean)); } catch {}
}

// ── Time ──────────────────────────────────────────────────────────────────────
function timeLabel(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

// ── Vault gifts ───────────────────────────────────────────────────────────────
const VAULT_GIFTS = [
  { emoji: "🌹", label: "Rose",     coins: GIFT_COST },
  { emoji: "💎", label: "Diamond",  coins: GIFT_COST * 2 },
  { emoji: "🍷", label: "Wine",     coins: GIFT_COST },
  { emoji: "💋", label: "Kiss",     coins: GIFT_COST },
  { emoji: "👑", label: "Crown",    coins: GIFT_COST * 3 },
  { emoji: "✨", label: "Sparkle",  coins: GIFT_COST },
];

// ── Simulated replies ─────────────────────────────────────────────────────────
const VAULT_REPLIES = [
  "This is actually really nice 😊",
  "I was hoping you'd reach out",
  "Tell me more about yourself…",
  "Love the energy here 💫",
  "You're interesting 👀",
  "I like that you took the initiative",
  "This feels different from the main chat",
  "So where are you based?",
];
const VAULT_GIFT_REPLIES = [
  "Aww that's so sweet 🥺",
  "You didn't have to do that… but I love it 💖",
  "This made my day honestly",
  "The Crown?? You're too much 👑",
  "Sending one back your way 🌹",
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function VaultPrivateChatPopup({
  targetId, tierColor, tierIcon, onClose,
}: {
  targetId: string;
  tierColor: string;
  tierIcon: string;
  onClose: () => void;
}) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const [coins,      setCoins]      = useState(readCoins);
  const [input,      setInput]      = useState("");
  const [showGifts,  setShowGifts]  = useState(false);
  const [lowCoins,   setLowCoins]   = useState(false);
  const [messages,   setMessages]   = useState<VaultMessage[]>(() => {
    const stored = loadVault(targetId);
    if (stored.length > 0) return stored;
    // Opening message from the other person
    return [{
      id: "open-0", text: "👋 Your vault invite was accepted. This is a private space — just the two of us.",
      timestamp: Date.now() - 5000, isOwn: false,
    }];
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 350); }, []);

  const scheduleReply = useCallback((isGift = false) => {
    const pool = isGift ? VAULT_GIFT_REPLIES : VAULT_REPLIES;
    const delay = 3500 + Math.random() * 4000;
    setTimeout(() => {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setMessages(prev => {
        const next = [...prev, { id: `vr-${Date.now()}`, text: pick, timestamp: Date.now(), isOwn: false }];
        saveVault(targetId, next);
        return next;
      });
    }, delay);
  }, [targetId]);

  function deductCoins(amount: number): boolean {
    const current = readCoins();
    if (current < amount) { setLowCoins(true); setTimeout(() => setLowCoins(false), 2500); return false; }
    const next = current - amount;
    writeCoins(next);
    setCoins(next);
    return true;
  }

  function addMsg(msg: VaultMessage) {
    setMessages(prev => {
      const next = [...prev, msg];
      saveVault(targetId, next);
      return next;
    });
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    if (!deductCoins(MSG_COST)) return;
    addMsg({ id: `vm-${Date.now()}`, text, timestamp: Date.now(), isOwn: true, coinCost: MSG_COST });
    setInput("");
    scheduleReply(false);
  }

  function handleGift(gift: typeof VAULT_GIFTS[number]) {
    if (!deductCoins(gift.coins)) return;
    addMsg({ id: `vg-${Date.now()}`, text: `Sent you a ${gift.label}`, timestamp: Date.now(), isOwn: true, isGift: true, giftEmoji: gift.emoji, coinCost: gift.coins });
    setShowGifts(false);
    scheduleReply(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!deductCoins(MSG_COST)) { e.target.value = ""; return; }
    const isVideo = file.type.startsWith("video/");
    const url = URL.createObjectURL(file);
    addMsg({ id: `vmedia-${Date.now()}`, text: isVideo ? "🎬 Video" : "📸 Photo", mediaUrl: url, mediaType: isVideo ? "video" : "image", timestamp: Date.now(), isOwn: true, coinCost: MSG_COST });
    e.target.value = "";
    scheduleReply(false);
  }

  const isDark = ["#d4af37", "#e0ddd8", "#a8a8b0"].includes(tierColor);
  const bubbleText = isDark ? "#0a0700" : "#fff";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 610, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, height: "88dvh", background: "rgba(4,4,8,1)", borderRadius: "22px 22px 0 0", border: `1px solid ${tierColor}40`, borderBottom: "none", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: `0 -12px 80px ${tierColor}22` }}
      >
        {/* Top stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${tierColor}, transparent)`, flexShrink: 0 }} />

        {/* Header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px 12px", borderBottom: `1px solid ${tierColor}20`, background: `linear-gradient(135deg, ${tierColor}18, ${tierColor}08)` }}>
          {/* Avatar */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${tierColor}22`, border: `2px solid ${tierColor}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: tierColor }}>{targetId.replace("Ghost-", "").charAt(0)}</span>
            </div>
            {/* Online dot */}
            <motion.span animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
              style={{ position: "absolute", bottom: 1, right: 1, width: 9, height: 9, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.9)", display: "block" }} />
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>{targetId}</p>
              <span style={{ fontSize: 9, fontWeight: 800, color: tierColor, background: `${tierColor}15`, border: `1px solid ${tierColor}30`, borderRadius: 20, padding: "1px 7px" }}>
                {tierIcon} Vault
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
              Private · {MSG_COST} coins/msg
            </p>
          </div>

          {/* Coin balance */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <div style={{ background: "rgba(255,215,0,0.12)", border: "1px solid rgba(255,215,0,0.25)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11 }}>🪙</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#ffd700" }}>{coins}</span>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>✕</span>
            </button>
          </div>
        </div>

        {/* Low coins warning */}
        <AnimatePresence>
          {lowCoins && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ flexShrink: 0, margin: "8px 14px 0", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(239,68,68,0.9)", fontWeight: 700 }}>Not enough coins — top up to keep the conversation going</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                style={{ display: "flex", flexDirection: msg.isOwn ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}
              >
                {/* Other avatar */}
                {!msg.isOwn && (
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${tierColor}22`, border: `1.5px solid ${tierColor}45`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: tierColor }}>{targetId.replace("Ghost-", "").charAt(0)}</span>
                  </div>
                )}

                <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 2, alignItems: msg.isOwn ? "flex-end" : "flex-start" }}>
                  {/* Gift bubble */}
                  {msg.isGift ? (
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      style={{ padding: "10px 16px", borderRadius: "16px", background: `linear-gradient(135deg, ${tierColor}33, ${tierColor}18)`, border: `1.5px solid ${tierColor}55`, display: "flex", alignItems: "center", gap: 10, boxShadow: `0 4px 20px ${tierColor}25` }}
                    >
                      <span style={{ fontSize: 28 }}>{msg.giftEmoji}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: tierColor }}>{msg.text}</p>
                        <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.35)" }}>−{msg.coinCost} 🪙</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div style={{ padding: msg.mediaUrl ? "4px" : "9px 13px", borderRadius: msg.isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.isOwn ? `linear-gradient(135deg, ${tierColor}cc, ${tierColor}88)` : "rgba(255,255,255,0.08)", border: msg.isOwn ? "none" : "1px solid rgba(255,255,255,0.1)", boxShadow: msg.isOwn ? `0 2px 14px ${tierColor}35` : "none", overflow: "hidden" }}>
                      {msg.mediaUrl && msg.mediaType === "image" && <img src={msg.mediaUrl} alt="" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 12, display: "block", objectFit: "cover" }} />}
                      {msg.mediaUrl && msg.mediaType === "video" && <video src={msg.mediaUrl} controls style={{ maxWidth: 200, maxHeight: 200, borderRadius: 12, display: "block" }} />}
                      {!msg.mediaUrl && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: msg.isOwn ? bubbleText : "rgba(255,255,255,0.9)", fontWeight: msg.isOwn ? 700 : 400 }}>{msg.text}</p>}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.2)" }}>{timeLabel(msg.timestamp)}</p>
                    {msg.isOwn && msg.coinCost && !msg.isGift && <p style={{ margin: 0, fontSize: 8, color: "rgba(255,215,0,0.35)" }}>−{msg.coinCost}🪙</p>}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Gift tray */}
        <AnimatePresence>
          {showGifts && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              style={{ flexShrink: 0, borderTop: `1px solid ${tierColor}18`, background: "rgba(6,6,10,0.98)", overflow: "hidden" }}>
              <div style={{ padding: "12px 14px" }}>
                <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Send a Vault Gift</p>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                  {VAULT_GIFTS.map(g => (
                    <motion.button key={g.label} whileTap={{ scale: 0.9 }} onClick={() => handleGift(g)}
                      style={{ flexShrink: 0, width: 60, height: 72, borderRadius: 14, background: `${tierColor}10`, border: `1px solid ${tierColor}30`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}>
                      <span style={{ fontSize: 24 }}>{g.emoji}</span>
                      <span style={{ fontSize: 8, fontWeight: 800, color: tierColor }}>{g.label}</span>
                      <span style={{ fontSize: 8, color: "rgba(255,215,0,0.7)" }}>−{g.coins}🪙</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <div style={{ flexShrink: 0, padding: "10px 14px max(16px,env(safe-area-inset-bottom,16px))", borderTop: `1px solid ${tierColor}18`, background: "rgba(4,4,8,0.99)", display: "flex", alignItems: "center", gap: 8 }}>
          {/* Hidden file input */}
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileChange} />

          {/* Gift button */}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowGifts(s => !s)}
            style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: `1px solid ${showGifts ? tierColor + "55" : "rgba(255,255,255,0.1)"}`, background: showGifts ? `${tierColor}18` : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <span style={{ fontSize: 17 }}>🎁</span>
          </motion.button>

          {/* Media button */}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => fileRef.current?.click()}
            style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <span style={{ fontSize: 17 }}>📎</span>
          </motion.button>

          {/* Text input */}
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Message… −${MSG_COST}🪙`} maxLength={280}
            style={{ flex: 1, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: `1px solid ${input ? tierColor + "40" : "rgba(255,255,255,0.1)"}`, color: "#fff", fontSize: 13, padding: "0 14px", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
          />

          {/* Send */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={!input.trim()}
            style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: "none", background: input.trim() ? `linear-gradient(135deg, ${tierColor}cc, ${tierColor}88)` : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() ? "pointer" : "default", transition: "all 0.2s", boxShadow: input.trim() ? `0 2px 12px ${tierColor}35` : "none" }}>
            <span style={{ fontSize: 16 }}>↑</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
