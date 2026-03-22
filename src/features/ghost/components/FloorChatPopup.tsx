import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGenderAccent } from "../../../shared/hooks/useGenderAccent";
import VaultPrivateChatPopup from "./VaultPrivateChatPopup";
import GiftReplyModal, { type PendingGift } from "./GiftReplyModal";

// ── Types ─────────────────────────────────────────────────────────────────────
export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isOwn: boolean;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  isGift?: boolean;
  giftEmoji?: string;
  giftName?: string;
  giftCoins?: number;
  isDirected?: boolean;
  directedTo?: string;
};

type FloorMember = { id: string; name: string; seed: number; online: boolean; city: string };

// ── Monthly chat subscription ─────────────────────────────────────────────────
const CHAT_PLAN_KEY = "ghost_chat_plan_until";
export function isChatSubscribed(): boolean {
  try {
    if (Number(localStorage.getItem(CHAT_PLAN_KEY) || 0) > Date.now()) return true;
    const tier = localStorage.getItem("ghost_house_tier");
    if (tier) return true;
    return false;
  } catch { return false; }
}
export function activateChatPlan(): void {
  try { localStorage.setItem(CHAT_PLAN_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000)); } catch {}
}
const CHAT_PRICES: Record<string, string> = {
  standard: "$2.99/mo", suite: "$3.99/mo", kings: "$5.99/mo", penthouse: "$7.99/mo", garden: "$2.99/mo",
};

// ── localStorage helpers ───────────────────────────────────────────────────────
const MSGS_KEY   = "ghost_floor_chat_messages";
const COUNT_KEY  = "ghost_chat_message_count";
const UNREAD_KEY = "ghost_chat_unread";
const COINS_KEY  = "ghost_coins";

export function getChatMessageCount(): number {
  try { return Number(localStorage.getItem(COUNT_KEY) || "0"); } catch { return 0; }
}
export function getChatUnread(): number {
  try { return Number(localStorage.getItem(UNREAD_KEY) || "0"); } catch { return 0; }
}
export function setChatUnread(n: number): void {
  try { localStorage.setItem(UNREAD_KEY, String(n)); } catch {}
}
function loadMessages(): ChatMessage[] {
  try { return JSON.parse(localStorage.getItem(MSGS_KEY) || "[]"); } catch { return []; }
}
function saveMessages(msgs: ChatMessage[]): void {
  const clean = msgs.slice(-60).map(m => ({ ...m, mediaUrl: undefined }));
  try { localStorage.setItem(MSGS_KEY, JSON.stringify(clean)); } catch {}
}
function loadCoins(): number {
  try { return Number(localStorage.getItem(COINS_KEY) || "100"); } catch { return 100; }
}
function saveCoins(n: number): void {
  try { localStorage.setItem(COINS_KEY, String(n)); } catch {}
}

// ── Floor gifts ────────────────────────────────────────────────────────────────
const FLOOR_GIFTS = [
  { emoji: "🌹", name: "Rose",        coins: 10  },
  { emoji: "🥂", name: "Champagne",   coins: 25  },
  { emoji: "💎", name: "Diamond",     coins: 50  },
  { emoji: "🎭", name: "Masquerade",  coins: 100 },
  { emoji: "🛥️", name: "Yacht Night", coins: 200 },
];

// ── Floor members per tier ─────────────────────────────────────────────────────
const _NAMES  = ["Aisha","Marco","Yuki","Sofia","Liam","Nina","Carlos","Mei","James","Priya","Alex","Sara","Tom","Hana","David","Lea","Omar","Chloe","Jake","Nadia"];
const _CITIES = ["London","Paris","Singapore","Dubai","Tokyo","New York","Berlin","Sydney","Milan","Bangkok"];
const _SEEDS: Record<string, number[]> = {
  standard:  [3,7,12,15,22,29,36,40,48,55,58,64,70,77,83],
  suite:     [28,31,45,49,52,5,9,13,18,23,27,32,37,41,46],
  kings:     [2,8,14,19,25,33,38,44,50,56,60,66,72,78,84],
  penthouse: [1,6,11,16,21,26,31,36,41,46,51,56,61,66,71],
  garden:    [4,9,16,23,31,43,57,62,68,74,80,85,90,95,99],
};
function buildFloorMembers(tier: string): FloorMember[] {
  return (_SEEDS[tier] ?? _SEEDS.standard).map((seed, i) => ({
    id: `${tier}-m-${seed}`,
    name: _NAMES[i % _NAMES.length],
    seed, online: seed % 3 !== 0,
    city: _CITIES[seed % _CITIES.length],
  }));
}

// ── Seed messages per tier ────────────────────────────────────────────────────
const SEED: Record<string, Array<{ name: string; text: string; minsAgo: number }>> = {
  standard: [
    { name: "Ghost-2341", text: "Hey everyone — just checked in to Standard. Anyone from Jakarta? 👋", minsAgo: 52 },
    { name: "Ghost-8821", text: "Jakarta here! welcome to the floor", minsAgo: 50 },
    { name: "Ghost-3302", text: "How does the matching work here vs the main page?", minsAgo: 44 },
    { name: "Ghost-5544", text: "You browse, you like, they like back — it opens. Simple. The room badge helps a lot", minsAgo: 41 },
    { name: "Ghost-1129", text: "Has anyone actually got a match through the floor chat?", minsAgo: 28 },
    { name: "Ghost-8821", text: "Twice 😅 the second one is still going", minsAgo: 25 },
    { name: "Ghost-7701", text: "The vibe here is genuinely different. Less noise than the usual apps", minsAgo: 9 },
  ],
  suite: [
    { name: "Ghost-4490", text: "Suite floor feels different — people actually read before liking", minsAgo: 65 },
    { name: "Ghost-7723", text: "Agreed. Less volume, more quality. Worth the upgrade from Standard", minsAgo: 60 },
    { name: "Ghost-2211", text: "Anyone from Singapore or KL?", minsAgo: 45 },
    { name: "Ghost-9934", text: "KL here 🇲🇾 — welcome to the floor", minsAgo: 42 },
    { name: "Ghost-4490", text: "What pushed you all to Suite? Genuinely curious", minsAgo: 30 },
    { name: "Ghost-7723", text: "The weekly boost. My profile went top of stack Monday morning. Noticed it immediately", minsAgo: 26 },
    { name: "Ghost-1108", text: "This chat is underrated honestly. More real conversations here than anywhere", minsAgo: 6 },
  ],
  kings: [
    { name: "Ghost-9901", text: "Kings floor is quieter than I expected. I like it", minsAgo: 95 },
    { name: "Ghost-5588", text: "Quality filter does its job. No noise here at all", minsAgo: 90 },
    { name: "Ghost-0032", text: "Who else is running unlimited unlocks? Changed how I use this completely", minsAgo: 72 },
    { name: "Ghost-9901", text: "Night and day from Standard honestly. Not going back", minsAgo: 68 },
    { name: "Ghost-3341", text: "The see-who-liked-you feature is what sold me. Cut straight to the signal", minsAgo: 35 },
    { name: "Ghost-5588", text: "Real talk — met someone last week through this floor. Kings chat is where it started 👑", minsAgo: 20 },
    { name: "Ghost-7712", text: "That's exactly the point of this chat. It works", minsAgo: 11 },
  ],
  penthouse: [
    { name: "Ghost-0011", text: "Good morning from Monaco 🎰", minsAgo: 130 },
    { name: "Ghost-1199", text: "Tokyo here — late night but this floor is worth the timezone", minsAgo: 125 },
    { name: "Ghost-0044", text: "Penthouse attracts a genuinely different type of person. You notice it immediately", minsAgo: 100 },
    { name: "Ghost-0011", text: "No noise. Everyone here made a deliberate choice to be here", minsAgo: 95 },
    { name: "Ghost-5501", text: "The Masquerade gift I received earlier was something else 😌", minsAgo: 50 },
    { name: "Ghost-1199", text: "Who sent it 👀", minsAgo: 47 },
    { name: "Ghost-5501", text: "Ghost ID stays anonymous until I decide otherwise 😉", minsAgo: 44 },
    { name: "Ghost-0044", text: "Floor chat is the best feature they've added. Feels like a private club", minsAgo: 14 },
  ],
  garden: [
    { name: "Ghost-5201", text: "Good morning from Cape Town ☕ — what a peaceful way to start the day here", minsAgo: 110 },
    { name: "Ghost-8847", text: "Edinburgh checking in 🌧️ — Garden Lodge is the first floor that actually feels grown up", minsAgo: 100 },
    { name: "Ghost-3307", text: "Anyone else appreciate how slow the pace is here? No rush, no noise", minsAgo: 80 },
    { name: "Ghost-5201", text: "That's exactly why I'm here. I'm not interested in volume, I'm interested in the right one", minsAgo: 74 },
    { name: "Ghost-6612", text: "Had the most genuine conversation I've had in years through this terrace last week 🌿", minsAgo: 45 },
    { name: "Ghost-8847", text: "No games, no performance — just two people being honest. It's rare.", minsAgo: 38 },
    { name: "Ghost-3307", text: "The morning coffee prompt earlier got me. Some questions deserve more than a swipe", minsAgo: 12 },
  ],
};

function timeLabel(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}
function idColor(name: string): string {
  const n = parseInt(name.replace("Ghost-", "")) || 0;
  const hues = [320, 200, 160, 45, 280, 15, 190, 350, 100, 240];
  return `hsl(${hues[n % 10]}, 65%, 58%)`;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FloorChatPopup({
  tier, tierColor, tierLabel, tierIcon, onClose,
}: {
  tier: string; tierColor: string; tierLabel: string; tierIcon: string; onClose: () => void;
}) {
  const a = useGenderAccent();
  const scrollRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);

  const [input,        setInput]       = useState("");
  const [sending,      setSending]     = useState(false);
  const [msgCount,     setMsgCount]    = useState(getChatMessageCount);
  const [coins,        setCoins]       = useState(loadCoins);
  const [tappedMsg,    setTappedMsg]   = useState<ChatMessage | null>(null);
  const [vaultTarget,  setVaultTarget] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [subscribed,   setSubscribed]  = useState(() => isChatSubscribed());
  useEffect(() => { setSubscribed(isChatSubscribed()); }, [tier]);

  // Drawer
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [drawerMember, setDrawerMember] = useState<FloorMember | null>(null);
  const [drawerAction, setDrawerAction] = useState<"idle" | "gift">("idle");

  // Notification toast
  const [notifToast, setNotifToast] = useState<string | null>(null);

  // Incoming gift — must reply before modal closes
  const [pendingGiftReply, setPendingGiftReply] = useState<PendingGift | null>(null);
  function showToast(msg: string) {
    setNotifToast(msg);
    setTimeout(() => setNotifToast(null), 3500);
  }

  const floorMembers = buildFloorMembers(tier);
  const onlineCount  = floorMembers.filter(m => m.online).length;

  const buildMessages = useCallback((): ChatMessage[] => {
    const seeds = (SEED[tier] ?? SEED.standard).map((s, i) => ({
      id: `seed-${i}`, senderId: s.name, senderName: s.name,
      text: s.text, timestamp: Date.now() - s.minsAgo * 60000, isOwn: false,
    }));
    const own = loadMessages().filter(m => m.isOwn);
    return [...seeds, ...own].sort((x, y) => x.timestamp - y.timestamp);
  }, [tier]);

  const [messages, setMessages] = useState<ChatMessage[]>(buildMessages);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 400); }, []);

  const scheduleReply = useCallback((userText: string, isMedia?: boolean, directedName?: string) => {
    const replies = isMedia
      ? ["Nice 🔥", "Love this 😍", "Where is this?", "Amazing shot 📸", "Wow 😮"]
      : ["That's a good point 👌", "Agree — this floor has the right energy", "Welcome! How long have you been on Ghost?",
         "Same experience here honestly", "💬 Real talk", "The matching here is on a different level",
         "Noticed the same thing when I joined", "Quality over quantity, always 🤝"];
    const rList = (SEED[tier] ?? SEED.standard).map(s => s.name);
    const delay = 3500 + Math.random() * 4000;
    setTimeout(() => {
      const pick    = replies[Math.abs(userText.length + Date.now()) % replies.length];
      const replier = rList[Math.floor(Math.random() * rList.length)];
      const text    = directedName ? `@You ${pick}` : pick;
      setMessages(prev => [...prev, { id: `reply-${Date.now()}`, senderId: replier, senderName: replier, text, timestamp: Date.now(), isOwn: false }]);
      if (directedName) showToast(`${replier} replied to your message`);
    }, delay);
  }, [tier]);

  function addMessage(msg: ChatMessage) {
    setMessages(prev => {
      const next = [...prev, msg];
      saveMessages(next.filter(m => m.isOwn));
      return next;
    });
    const nc = msgCount + 1;
    setMsgCount(nc);
    try { localStorage.setItem(COUNT_KEY, String(nc)); } catch {}
  }

  function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const isDirected = text.startsWith("@");
    const directedTo = isDirected ? text.split(" ")[0].substring(1) : undefined;
    addMessage({ id: `own-${Date.now()}`, senderId: "me", senderName: "You", text, timestamp: Date.now(), isOwn: true, isDirected, directedTo });
    setInput("");
    setSending(false);
    scheduleReply(text, false, directedTo);
    if (isDirected && directedTo) setTimeout(() => showToast(`Message sent to @${directedTo}`), 500);
  }

  function handleSendGift(member: FloorMember, gift: typeof FLOOR_GIFTS[0]) {
    if (coins < gift.coins) return;
    const nc = coins - gift.coins;
    setCoins(nc);
    saveCoins(nc);
    addMessage({
      id: `gift-${Date.now()}`, senderId: "me", senderName: "You",
      text: `sent ${gift.name} to ${member.name}`,
      timestamp: Date.now(), isOwn: true,
      isGift: true, giftEmoji: gift.emoji, giftName: gift.name, giftCoins: gift.coins, directedTo: member.name,
    });
    setDrawerOpen(false);
    setDrawerMember(null);
    setDrawerAction("idle");
    showToast(`${gift.emoji} ${gift.name} sent to ${member.name}!`);
    setTimeout(() => {
      const rList = (SEED[tier] ?? SEED.standard);
      const replier = rList[Math.floor(Math.random() * rList.length)].name;
      setMessages(prev => [...prev, {
        id: `gift-rx-${Date.now()}`, senderId: replier, senderName: replier,
        text: `${member.name} just received a ${gift.emoji} ${gift.name} 😍`, timestamp: Date.now(), isOwn: false,
      }]);
    }, 2500);
  }

  function handleDirectMessage(member: FloorMember) {
    setInput(`@${member.name} `);
    setDrawerOpen(false);
    setDrawerMember(null);
    setDrawerAction("idle");
    setTimeout(() => inputRef.current?.focus(), 300);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isImage && !isVideo) return;
    const url = URL.createObjectURL(file);
    const mediaType: "image" | "video" = isVideo ? "video" : "image";
    addMessage({ id: `media-${Date.now()}`, senderId: "me", senderName: "You", text: isVideo ? "🎬 Video" : "📸 Photo", mediaUrl: url, mediaType, timestamp: Date.now(), isOwn: true });
    e.target.value = "";
    scheduleReply(file.name, true);
  }

  function handleSubscribe() { activateChatPlan(); setSubscribed(true); }

  // After ~40 s in chat, a floor member sends you a gift — you must reply
  useEffect(() => {
    if (!subscribed) return;
    const already = sessionStorage.getItem(`ghost_gift_triggered_${tier}`);
    if (already) return;
    const delay = 40000 + Math.random() * 20000;
    const t = setTimeout(() => {
      sessionStorage.setItem(`ghost_gift_triggered_${tier}`, "1");
      const rList = (SEED[tier] ?? SEED.standard);
      const sender = rList[Math.floor(Math.random() * rList.length)];
      const gift   = FLOOR_GIFTS[Math.floor(Math.random() * 3)]; // rose, champagne, or diamond
      // Add gift bubble to chat first
      setMessages(prev => [...prev, {
        id: `rx-gift-${Date.now()}`, senderId: sender.name, senderName: sender.name,
        text: `sent you a ${gift.emoji} ${gift.name}`,
        timestamp: Date.now(), isOwn: false,
        isGift: true, giftEmoji: gift.emoji, giftName: gift.name, giftCoins: gift.coins,
      }]);
      // Then show reply modal
      setTimeout(() => setPendingGiftReply({ giftEmoji: gift.emoji, giftName: gift.name, fromName: sender.name, fromId: sender.name }), 800);
    }, delay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribed, tier]);

  function handleGiftReply(replyText: string) {
    addMessage({ id: `gift-reply-${Date.now()}`, senderId: "me", senderName: "You", text: replyText, timestamp: Date.now(), isOwn: true });
    setPendingGiftReply(null);
    if (pendingGiftReply) showToast(`Reply sent to ${pendingGiftReply.fromName}`);
  }

  // Open gift picker from message tap
  function openGiftFromTap(ghostName: string) {
    const num = parseInt(ghostName.replace("Ghost-", "")) || 1;
    const synthetic: FloorMember = { id: ghostName, name: ghostName, seed: num % 70, online: true, city: "" };
    setDrawerMember(synthetic);
    setDrawerAction("gift");
    setDrawerOpen(true);
    setTappedMsg(null);
  }

  return (
    <>
      {/* ── Full-screen chat window ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
        style={{ position: "fixed", inset: 0, zIndex: 500, background: "#06060a", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Top accent stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${a.accent}, transparent)`, flexShrink: 0 }} />

        {/* Header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10, padding: `max(env(safe-area-inset-top,14px),14px) 14px 12px`, borderBottom: `1px solid ${a.glow(0.15)}`, background: a.gradientSubtle }}>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            ←
          </button>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: a.glow(0.15), border: `1.5px solid ${a.glow(0.4)}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 18 }}>{tierIcon}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: a.accent }}>{tierLabel} Chat</p>
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block", flexShrink: 0 }} />
            </div>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{onlineCount} online · {floorMembers.length} members</p>
          </div>
          {/* Coin balance */}
          <div style={{ height: 30, borderRadius: 8, background: a.glow(0.1), border: `1px solid ${a.glow(0.28)}`, display: "flex", alignItems: "center", padding: "0 9px", gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 12 }}>🪙</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: a.accent }}>{coins}</span>
          </div>
          {/* Members drawer toggle */}
          <button
            onClick={() => { setDrawerOpen(o => !o); setDrawerMember(null); setDrawerAction("idle"); }}
            style={{ width: 36, height: 36, borderRadius: "50%", background: drawerOpen ? a.glow(0.2) : "rgba(255,255,255,0.07)", border: `1px solid ${drawerOpen ? a.glow(0.5) : "rgba(255,255,255,0.1)"}`, color: drawerOpen ? a.accent : "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", position: "relative" }}
          >
            👥
            <div style={{ position: "absolute", top: -3, right: -3, width: 16, height: 16, borderRadius: "50%", background: a.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 8, fontWeight: 900, color: "#0a0700" }}>{onlineCount}</span>
            </div>
          </button>
        </div>

        {/* Notification toast */}
        <AnimatePresence>
          {notifToast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ flexShrink: 0, margin: "8px 14px 0", padding: "8px 14px", background: a.glow(0.14), border: `1px solid ${a.glow(0.35)}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 8 }}
            >
              <span style={{ fontSize: 13 }}>🔔</span>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: a.accent }}>{notifToast}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rules pill */}
        <div style={{ flexShrink: 0, margin: "8px 14px 0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11 }}>🛡️</span>
          <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.28)", lineHeight: 1.4 }}>
            Members only · Be respectful · Tap a message to connect · Send gifts via 👥 members
          </p>
        </div>

        {/* Body: messages + drawer side-by-side */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex" }}>

          {/* Messages area */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <div ref={scrollRef} style={{ position: "absolute", inset: 0, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => {
                  const showSender = !msg.isOwn && (idx === 0 || messages[idx - 1].senderId !== msg.senderId);
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      style={{ display: "flex", flexDirection: msg.isOwn ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}
                    >
                      {/* Avatar */}
                      {!msg.isOwn && (
                        <div
                          onClick={() => { if (subscribed) setTappedMsg(msg); }}
                          style={{ width: 28, height: 28, borderRadius: "50%", background: `${idColor(msg.senderName)}22`, border: `1.5px solid ${idColor(msg.senderName)}55`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: subscribed ? "pointer" : "default" }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 800, color: idColor(msg.senderName) }}>{msg.senderName.replace("Ghost-","").charAt(0)}</span>
                        </div>
                      )}

                      <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", gap: 2, alignItems: msg.isOwn ? "flex-end" : "flex-start" }}>
                        {showSender && (
                          <p
                            onClick={() => { if (subscribed) setTappedMsg(msg); }}
                            style={{ margin: 0, fontSize: 9, fontWeight: 700, color: idColor(msg.senderName), letterSpacing: "0.02em", cursor: subscribed ? "pointer" : "default" }}
                          >
                            {msg.senderName}
                          </p>
                        )}

                        {/* ── Gift bubble ── */}
                        {msg.isGift ? (
                          <div style={{ padding: "10px 14px", borderRadius: msg.isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.08))", border: "1px solid rgba(212,175,55,0.38)", boxShadow: "0 2px 16px rgba(212,175,55,0.18)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 26 }}>{msg.giftEmoji}</span>
                              <div>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: "#d4af37" }}>{msg.giftName}</p>
                                <p style={{ margin: 0, fontSize: 9, color: "rgba(212,175,55,0.65)" }}>
                                  {msg.isOwn ? `→ ${msg.directedTo}` : `from ${msg.senderName}`} · 🪙 {msg.giftCoins}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* ── Regular / directed bubble ── */
                          <div
                            onClick={() => { if (!msg.isOwn && subscribed) setTappedMsg(msg); }}
                            style={{
                              padding: msg.mediaUrl ? "4px" : "9px 12px",
                              borderRadius: msg.isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                              background: msg.isOwn
                                ? `linear-gradient(135deg, ${a.accent}cc, ${a.accentMid}88)`
                                : msg.isDirected ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.07)",
                              border: msg.isOwn ? "none" : msg.isDirected ? `1px solid ${a.glow(0.35)}` : "1px solid rgba(255,255,255,0.08)",
                              boxShadow: msg.isOwn ? `0 2px 12px ${a.glow(0.28)}` : "none",
                              cursor: (!msg.isOwn && subscribed) ? "pointer" : "default",
                              overflow: "hidden",
                            }}
                          >
                            {!msg.isOwn && msg.isDirected && (
                              <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 800, color: a.accent }}>@you</p>
                            )}
                            {msg.mediaUrl && msg.mediaType === "image" && (
                              <img
                                src={msg.mediaUrl} alt=""
                                onClick={() => setMediaPreview({ url: msg.mediaUrl!, type: "image" })}
                                style={{ maxWidth: 200, maxHeight: 200, borderRadius: 12, display: "block", objectFit: "cover", cursor: "pointer" }}
                              />
                            )}
                            {msg.mediaUrl && msg.mediaType === "video" && (
                              <video src={msg.mediaUrl} controls style={{ maxWidth: 200, maxHeight: 200, borderRadius: 12, display: "block" }} />
                            )}
                            {!msg.mediaUrl && (
                              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: msg.isOwn ? "#0a0700" : "rgba(255,255,255,0.88)", fontWeight: msg.isOwn ? 700 : 400 }}>
                                {msg.isOwn && msg.isDirected && msg.directedTo ? (
                                  <>
                                    <span style={{ color: a.accentDark, fontWeight: 900 }}>@{msg.directedTo}</span>
                                    {" " + msg.text.substring(msg.directedTo.length + 2)}
                                  </>
                                ) : msg.text}
                              </p>
                            )}
                          </div>
                        )}

                        <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>{timeLabel(msg.timestamp)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Fade for unsubscribed */}
            {!subscribed && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 100, background: "linear-gradient(to top, rgba(6,6,10,0.98) 0%, transparent 100%)", pointerEvents: "none" }} />
            )}
          </div>

          {/* ── Members drawer (slides from right) ── */}
          <AnimatePresence>
            {drawerOpen && (
              <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 340, damping: 32 }}
                style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 272, background: "rgba(8,8,14,0.99)", borderLeft: `1px solid ${a.glow(0.2)}`, display: "flex", flexDirection: "column", zIndex: 10 }}
              >
                {/* Drawer header */}
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "12px 14px 10px", borderBottom: `1px solid ${a.glow(0.1)}` }}>
                  {drawerAction === "gift" && drawerMember ? (
                    <button onClick={() => { setDrawerAction("idle"); setDrawerMember(null); }} style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>←</button>
                  ) : null}
                  <p style={{ flex: 1, margin: 0, fontSize: 12, fontWeight: 900, color: a.accent }}>
                    {drawerAction === "gift" && drawerMember ? `Gift → ${drawerMember.name}` : "Floor Members"}
                  </p>
                  <button onClick={() => { setDrawerOpen(false); setDrawerMember(null); setDrawerAction("idle"); }} style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>

                {/* Drawer body */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {/* Gift picker */}
                  <AnimatePresence>
                    {drawerAction === "gift" && drawerMember && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ padding: "10px 12px" }}>
                        {FLOOR_GIFTS.map(gift => {
                          const can = coins >= gift.coins;
                          return (
                            <motion.button
                              key={gift.name}
                              whileTap={{ scale: can ? 0.96 : 1 }}
                              onClick={() => can && handleSendGift(drawerMember, gift)}
                              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", marginBottom: 8, borderRadius: 14, background: can ? a.glow(0.1) : "rgba(255,255,255,0.03)", border: `1px solid ${can ? a.glow(0.3) : "rgba(255,255,255,0.07)"}`, cursor: can ? "pointer" : "not-allowed", opacity: can ? 1 : 0.45 }}
                            >
                              <span style={{ fontSize: 26 }}>{gift.emoji}</span>
                              <div style={{ flex: 1, textAlign: "left" }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: can ? "#fff" : "rgba(255,255,255,0.4)" }}>{gift.name}</p>
                                <p style={{ margin: 0, fontSize: 10, color: can ? a.accent : "rgba(255,255,255,0.25)" }}>🪙 {gift.coins} coins</p>
                              </div>
                              {can && <span style={{ fontSize: 10, fontWeight: 800, color: a.accent }}>Send →</span>}
                            </motion.button>
                          );
                        })}
                        <p style={{ margin: "4px 0 0", fontSize: 9, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>Balance: 🪙 {coins}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Members list */}
                  {drawerAction === "idle" && (
                    <>
                      <p style={{ margin: "10px 14px 6px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Online now</p>
                      {floorMembers.filter(m => m.online).map(m => (
                        <MemberRow key={m.id} member={m} accent={a.accent} glow={a.glow}
                          onGift={() => { setDrawerMember(m); setDrawerAction("gift"); }}
                          onMessage={() => handleDirectMessage(m)}
                        />
                      ))}
                      <p style={{ margin: "10px 14px 6px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Others</p>
                      {floorMembers.filter(m => !m.online).map(m => (
                        <MemberRow key={m.id} member={m} accent={a.accent} glow={a.glow}
                          onGift={() => { setDrawerMember(m); setDrawerAction("gift"); }}
                          onMessage={() => handleDirectMessage(m)}
                        />
                      ))}
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Input bar / Paywall ── */}
        {subscribed ? (
          <div style={{ flexShrink: 0, padding: "10px 14px max(16px,env(safe-area-inset-bottom,16px))", borderTop: `1px solid ${a.glow(0.12)}`, background: "rgba(8,8,14,0.98)", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flexShrink: 0, height: 36, borderRadius: 10, background: a.glow(0.1), border: `1px solid ${a.glow(0.25)}`, display: "flex", alignItems: "center", padding: "0 8px" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: a.accent, whiteSpace: "nowrap" }}>💬 {msgCount}</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileChange} />
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => fileRef.current?.click()}
              style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <span style={{ fontSize: 17 }}>📎</span>
            </motion.button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={input.startsWith("@") ? "Type your message…" : "Say something or @name someone…"}
              maxLength={280}
              style={{ flex: 1, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: `1px solid ${input ? a.glow(0.4) : "rgba(255,255,255,0.1)"}`, color: "#fff", fontSize: 13, padding: "0 14px", outline: "none", fontFamily: "inherit", transition: "border-color 0.2s" }}
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleSend} disabled={!input.trim() || sending}
              style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 12, border: "none", background: input.trim() ? a.gradient : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() ? "pointer" : "default", transition: "all 0.2s", boxShadow: input.trim() ? `0 2px 12px ${a.glow(0.35)}` : "none" }}>
              <span style={{ fontSize: 16 }}>↑</span>
            </motion.button>
          </div>
        ) : (
          <div style={{ flexShrink: 0, padding: "14px 16px max(18px,env(safe-area-inset-bottom,18px))", borderTop: `1px solid ${a.glow(0.2)}`, background: "rgba(6,6,10,0.99)" }}>
            <div style={{ background: a.glow(0.07), border: `1px solid ${a.glow(0.24)}`, borderRadius: 16, padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{tierIcon}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: a.accent }}>{tierLabel} Floor Chat</p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Members only · Unlimited messages · Media sharing</p>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubscribe}
                style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: a.gradient, color: "#0a0700", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 20px ${a.glow(0.35)}`, marginBottom: 8 }}>
                Join for {CHAT_PRICES[tier] ?? "$2.99/mo"}
              </motion.button>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>Cancel anytime · Full floor access included</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Message tap menu ── */}
      <AnimatePresence>
        {tappedMsg && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setTappedMsg(null)}
            style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{ width: 280, background: "rgba(10,10,16,0.98)", borderRadius: 20, border: `1px solid ${idColor(tappedMsg.senderName)}30`, padding: "20px 0 8px", boxShadow: "0 8px 40px rgba(0,0,0,0.6)", overflow: "hidden" }}
            >
              <div style={{ textAlign: "center", padding: "0 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${idColor(tappedMsg.senderName)}20`, border: `2px solid ${idColor(tappedMsg.senderName)}55`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: idColor(tappedMsg.senderName) }}>{tappedMsg.senderName.replace("Ghost-","").charAt(0)}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{tappedMsg.senderName}</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{tierLabel} member</p>
              </div>
              {[
                { icon: "🔐", label: "Invite to Vault", sub: "Private chat · 2 coins/msg",           action: () => { setVaultTarget(tappedMsg.senderName); setTappedMsg(null); }, color: a.accent },
                { icon: "🎁", label: "Send Gift",       sub: "Choose a gift for this member",         action: () => openGiftFromTap(tappedMsg.senderName),                           color: null },
                { icon: "💬", label: "Direct Message",  sub: `@${tappedMsg.senderName} in chat`,      action: () => { setInput(`@${tappedMsg.senderName} `); setTappedMsg(null); setTimeout(() => inputRef.current?.focus(), 200); }, color: null },
                { icon: "❤️", label: "Like profile",    sub: "Send a floor like",                     action: () => setTappedMsg(null),                                              color: null },
                { icon: "🚫", label: "Report",          sub: "Report inappropriate content",          action: () => setTappedMsg(null),                                              color: null },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  style={{ width: "100%", padding: "13px 20px", background: "none", border: "none", display: "flex", alignItems: "center", gap: 14, cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: item.color ?? "rgba(255,255,255,0.85)" }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{item.sub}</p>
                  </div>
                </button>
              ))}
              <button onClick={() => setTappedMsg(null)} style={{ width: "100%", padding: "12px", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer" }}>Cancel</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Gift reply (required before modal closes) ── */}
      <AnimatePresence>
        {pendingGiftReply && (
          <GiftReplyModal gift={pendingGiftReply} onReply={handleGiftReply} />
        )}
      </AnimatePresence>

      {/* ── Vault private chat ── */}
      <AnimatePresence>
        {vaultTarget && (
          <VaultPrivateChatPopup targetId={vaultTarget} tierColor={tierColor} tierIcon={tierIcon} onClose={() => setVaultTarget(null)} />
        )}
      </AnimatePresence>

      {/* ── Full-screen media preview ── */}
      <AnimatePresence>
        {mediaPreview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMediaPreview(null)}
            style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {mediaPreview.type === "image"
              ? <img src={mediaPreview.url} alt="" style={{ maxWidth: "96vw", maxHeight: "90dvh", borderRadius: 12, objectFit: "contain" }} />
              : <video src={mediaPreview.url} controls autoPlay style={{ maxWidth: "96vw", maxHeight: "90dvh", borderRadius: 12 }} />
            }
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Member row (drawer list item) ──────────────────────────────────────────────
function MemberRow({ member, accent, glow, onGift, onMessage }: {
  member: FloorMember;
  accent: string;
  glow: (o: number) => string;
  onGift: () => void;
  onMessage: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", cursor: "pointer", background: open ? glow(0.07) : "transparent", transition: "background 0.15s" }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={`https://i.pravatar.cc/32?img=${member.seed}`} alt={member.name}
            style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", display: "block" }} />
          {member.online && (
            <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", border: "1.5px solid rgba(8,8,14,1)" }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.name}</p>
          <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>{member.city || "Floor member"}</p>
        </div>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)" }}>{open ? "▲" : "▼"}</span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 14px 10px", display: "flex", gap: 8 }}>
              <motion.button whileTap={{ scale: 0.96 }} onClick={onGift}
                style={{ flex: 1, height: 34, borderRadius: 10, border: `1px solid ${glow(0.3)}`, background: glow(0.1), color: accent, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                🎁 Gift
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={onMessage}
                style={{ flex: 1, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                💬 Message
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
