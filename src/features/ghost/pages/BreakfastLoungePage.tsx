// ── Breakfast Lounge ─────────────────────────────────────────────────────────
// Auto-presence social dining room. Guests auto-join, browse live profiles,
// invite immediately — no time slots. Accept via butler popup or quietly leave.

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCoins } from "../hooks/useCoins";
import CoinBalanceChip from "../components/CoinBalanceChip";

const LOUNGE_IMG  = "https://ik.imagekit.io/7grri5v7d/mmmmmdfgdsfgdfg.png";
const BUTLER_IMG  = "https://ik.imagekit.io/7grri5v7d/mmmmm.png";
const INVITE_COST = 15;
const CHAT_COST   = 2;
const TIP_COST    = 5;
const ROTATE_MIN  = 5 * 60 * 1000;
const ROTATE_MAX  = 10 * 60 * 1000;

const AV_COLS = [
  "#e879f9","#a78bfa","#60a5fa","#34d399","#fbbf24",
  "#f87171","#fb923c","#4ade80","#38bdf8","#c084fc","#f472b6","#a3e635",
];
const avCol = (seed: number) => AV_COLS[seed % AV_COLS.length];

interface LoungeProfile {
  id: string; seed: number; ghostId: string;
  city: string; floor: string; floorColor: string;
  mood: string; gender: "m" | "f"; age: number; about: string;
}

type Phase = "browsing" | "invite-pending" | "refused" | "at-table";
interface ChatMsg { id: number; from: "me" | "them" | "butler"; text: string; }

const POOL: LoungeProfile[] = [
  { id:"bl1",  seed:3,  ghostId:"Ghost-4821", city:"Dubai",     floor:"Penthouse", floorColor:"#e8e4d0", mood:"Early riser ☀️",          gender:"f", age:28, about:"Loves mornings, strong coffee and the quiet before the city wakes." },
  { id:"bl2",  seed:7,  ghostId:"Ghost-7734", city:"Milan",     floor:"Casino",    floorColor:"#d4af37", mood:"Coffee first, talk later", gender:"m", age:33, about:"Fashion week regular. Prefers his espresso black and his mornings slow." },
  { id:"bl3",  seed:12, ghostId:"Ghost-2093", city:"Tokyo",     floor:"Ensuite",   floorColor:"#cd7f32", mood:"Croissant hunter 🥐",      gender:"f", age:26, about:"Pastry enthusiast. Will absolutely judge your breakfast order." },
  { id:"bl4",  seed:18, ghostId:"Ghost-9901", city:"Barcelona", floor:"Casino",    floorColor:"#d4af37", mood:"Morning person 🌅",        gender:"f", age:30, about:"Up with the sun. Runs before breakfast. Annoyingly cheerful about it." },
  { id:"bl5",  seed:25, ghostId:"Ghost-5588", city:"London",    floor:"Standard",  floorColor:"#c0c0c0", mood:"Just arrived ✈️",          gender:"m", age:29, about:"Landed at 6am. In desperate need of a full English and a good chat." },
  { id:"bl6",  seed:35, ghostId:"Ghost-3312", city:"Paris",     floor:"Penthouse", floorColor:"#e8e4d0", mood:"Reading the paper 📰",     gender:"f", age:35, about:"Morning ritual: croissant, Le Monde, eavesdrop on strangers." },
  { id:"bl7",  seed:48, ghostId:"Ghost-8847", city:"Riyadh",    floor:"Casino",    floorColor:"#d4af37", mood:"Espresso, no sugar",       gender:"m", age:31, about:"Business is done at breakfast. The rest of the day is just follow-up." },
  { id:"bl8",  seed:54, ghostId:"Ghost-1199", city:"Athens",    floor:"Ensuite",   floorColor:"#cd7f32", mood:"Watching the sunrise 🌄",  gender:"f", age:27, about:"Philosophy student. Mornings feel like a fresh page." },
  { id:"bl9",  seed:64, ghostId:"Ghost-6622", city:"New York",  floor:"Casino",    floorColor:"#d4af37", mood:"Catching up on emails",    gender:"m", age:38, about:"Never fully off. But buys the best coffee for the table." },
  { id:"bl10", seed:72, ghostId:"Ghost-4490", city:"Beirut",    floor:"Loft",      floorColor:"#a78bfa", mood:"Pancakes or bust 🥞",      gender:"f", age:24, about:"Came for the food. Stayed for the conversation." },
  { id:"bl11", seed:83, ghostId:"Ghost-0011", city:"Bogotá",    floor:"Standard",  floorColor:"#c0c0c0", mood:"First morning here 🏨",    gender:"m", age:22, about:"Solo trip. Open to meeting anyone interesting." },
  { id:"bl12", seed:92, ghostId:"Ghost-7712", city:"Cairo",     floor:"Ensuite",   floorColor:"#cd7f32", mood:"Loves the quiet hours",    gender:"f", age:32, about:"Dawn swimmer. Breakfast is the reward." },
  { id:"bl13", seed:15, ghostId:"Ghost-3390", city:"Dublin",    floor:"Loft",      floorColor:"#a78bfa", mood:"Full Irish please 🍳",      gender:"m", age:34, about:"Can't be reasoned with before the first cup. After it — great craic." },
  { id:"bl14", seed:29, ghostId:"Ghost-5501", city:"Singapore", floor:"Penthouse", floorColor:"#e8e4d0", mood:"Green tea & silence 🍵",   gender:"f", age:29, about:"Minimalist. The silence is intentional and she loves your company anyway." },
  { id:"bl15", seed:41, ghostId:"Ghost-2287", city:"Berlin",    floor:"Casino",    floorColor:"#d4af37", mood:"People watching 👀",        gender:"m", age:36, about:"Prefers observing. Will surprise you with exactly the right thing to say." },
];

const SOFT_DECLINES = [
  "has quietly slipped away from the lounge.",
  "has stepped out — something came up in the lobby.",
  "has left for a floor gathering.",
  "has moved on — another commitment called.",
  "has stepped out to take a call and hasn't returned.",
  "has already joined another table.",
  "has checked out of the lounge this morning.",
  "drifted away — happens in the lounge sometimes.",
];

const PARTNER_REPLIES = [
  "Good morning! ☀️ I'll be right down.",
  "Already grabbed the window seat — croissants are fresh 🥐",
  "Perfect. Just ordered the eggs benedict, highly recommend it.",
  "On my way. Can you grab me a coffee? ☕",
  "So glad you reached out, I was sitting alone.",
  "Coming down from the penthouse now 😊",
  "The orange juice here is freshly squeezed, just so you know.",
  "I've been people-watching for 20 minutes. You saved me 😄",
  "I hear the French toast is incredible today.",
];

const BUTLER_SURPRISE_MSGS = [
  "Mr. Butla has arranged fresh orange juice for your table. 🍊 Compliments of the house.",
  "A warm basket of pastries has been sent to your table. 🥐 Enjoy.",
  "Mr. Butla has reserved your table for another 30 minutes. 🕐",
  "A fresh pot of coffee is on its way. ☕ Mr. Butla's compliments.",
  "Mr. Butla has upgraded your table to the window view. 🌅",
];

function buildVisible() {
  const shuffled = [...POOL].sort(() => Math.random() - 0.5).slice(0, 9);
  return shuffled.map((p, i) => ({
    profile: p,
    status: (i < 6 ? "available" : "at-table") as "available" | "at-table",
    tableWith: i >= 6 ? (POOL.find(q => q.id !== p.id) ?? POOL[0]).ghostId : undefined,
  }));
}

function getMorningTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const rnd = (min: number, max: number) => min + Math.random() * (max - min);

function Avatar({ p, size = 48, border, status }: { p: LoungeProfile; size?: number; border?: string; status?: "available" | "at-table" }) {
  const c = avCol(p.seed);
  const dotSize = Math.max(8, size * 0.18);
  const dotColor = status === "at-table" ? "#f97316" : "#22c55e";
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `radial-gradient(circle at 35% 35%, ${c}55, ${c}22)`,
      border: border ?? `2px solid ${c}80`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42, position: "relative",
    }}>
      👻
      {status && (
        <motion.div
          animate={{ opacity: [1, 0.25, 1], scale: [1, 1.2, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", bottom: 1, right: 1,
            width: dotSize, height: dotSize,
            borderRadius: "50%", background: dotColor,
            border: `${Math.max(1.5, size * 0.03)}px solid #08080e`,
          }}
        />
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function BreakfastLoungePage() {
  const navigate = useNavigate();
  const { deductCoins, canAfford } = useCoins();

  const [clock, setClock]         = useState(getMorningTime);
  const [visible, setVisible]     = useState(buildVisible);
  const [countdown, setCountdown] = useState(() => rnd(ROTATE_MIN, ROTATE_MAX));

  const [phase, setPhase]                     = useState<Phase>("browsing");
  const [partner, setPartner]                 = useState<LoungeProfile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<LoungeProfile | null>(null);
  const [inviteNote, setInviteNote]           = useState("");
  const [refuseMsg, setRefuseMsg]             = useState("");

  const [incomingInvite, setIncomingInvite] = useState<LoungeProfile | null>(null);
  const incomingFired = useRef(false);

  const [chatMsgs, setChatMsgs]         = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput]       = useState("");
  const [msgId, setMsgId]               = useState(1);
  const [butlerTipped, setButlerTipped] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(getMorningTime()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Guest rotation countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1000) {
          setVisible(buildVisible());
          return rnd(ROTATE_MIN, ROTATE_MAX);
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Simulated incoming invite from a stranger (~30s after arrival)
  useEffect(() => {
    if (incomingFired.current) return;
    const t = setTimeout(() => {
      if (phase !== "browsing") return;
      const stranger = POOL.find(p => !visible.some(v => v.profile.id === p.id)) ?? POOL[14];
      setIncomingInvite(stranger);
      incomingFired.current = true;
    }, rnd(28_000, 40_000));
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll chat
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMsgs]);

  // ── Send invite ─────────────────────────────────────────────────────────────
  const handleSendInvite = useCallback(() => {
    if (!selectedProfile || !canAfford(INVITE_COST)) return;
    const invited = selectedProfile;
    deductCoins(INVITE_COST, `Breakfast invite to ${invited.ghostId}`);
    setPartner(invited);
    setSelectedProfile(null);
    setInviteNote("");
    setPhase("invite-pending");

    const accept = Math.random() < 0.70;
    setTimeout(() => {
      if (accept) {
        setPhase("at-table");
        setChatMsgs([{ id: 1, from: "butler", text: `Your table is set. ${invited.ghostId} is on their way. 🍳` }]);
        setMsgId(2);
        setTimeout(() => {
          const reply = PARTNER_REPLIES[Math.floor(Math.random() * PARTNER_REPLIES.length)];
          setChatMsgs(prev => [...prev, { id: Date.now(), from: "them", text: reply }]);
        }, 3_000);
      } else {
        // Profile disappears from visible list
        setVisible(prev => prev.filter(v => v.profile.id !== invited.id));
        const decline = SOFT_DECLINES[Math.floor(Math.random() * SOFT_DECLINES.length)];
        setRefuseMsg(`${invited.ghostId} ${decline}`);
        setPhase("refused");
        setTimeout(() => {
          setPhase("browsing");
          setPartner(null);
          setRefuseMsg("");
        }, 4_000);
      }
    }, rnd(4_000, 8_000));
  }, [selectedProfile, canAfford, deductCoins]);

  // ── Accept incoming invite ───────────────────────────────────────────────────
  const acceptIncoming = useCallback(() => {
    if (!incomingInvite) return;
    const p = incomingInvite;
    setPartner(p);
    setIncomingInvite(null);
    setPhase("at-table");
    setChatMsgs([{ id: 1, from: "butler", text: `Welcome to your table. ${p.ghostId} is already seated. 🍳` }]);
    setMsgId(2);
    setTimeout(() => {
      const reply = PARTNER_REPLIES[Math.floor(Math.random() * PARTNER_REPLIES.length)];
      setChatMsgs(prev => [...prev, { id: Date.now(), from: "them", text: reply }]);
    }, 2_000);
  }, [incomingInvite]);

  // ── Decline incoming — profile silently leaves ───────────────────────────────
  const declineIncoming = useCallback(() => {
    if (!incomingInvite) return;
    setVisible(prev => prev.filter(v => v.profile.id !== incomingInvite.id));
    setIncomingInvite(null);
  }, [incomingInvite]);

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const sendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text || !canAfford(CHAT_COST)) return;
    deductCoins(CHAT_COST, "Breakfast table chat");
    setChatMsgs(prev => [...prev, { id: msgId, from: "me", text }]);
    setMsgId(n => n + 1);
    setChatInput("");
    setTimeout(() => {
      const reply = PARTNER_REPLIES[Math.floor(Math.random() * PARTNER_REPLIES.length)];
      setChatMsgs(prev => [...prev, { id: Date.now(), from: "them", text: reply }]);
    }, rnd(2_000, 5_000));
  }, [chatInput, canAfford, deductCoins, msgId]);

  // ── Butler tip ────────────────────────────────────────────────────────────────
  const tipButler = useCallback(() => {
    if (!canAfford(TIP_COST) || butlerTipped) return;
    deductCoins(TIP_COST, "Butler tip at breakfast table");
    setButlerTipped(true);
    const msg = BUTLER_SURPRISE_MSGS[Math.floor(Math.random() * BUTLER_SURPRISE_MSGS.length)];
    setChatMsgs(prev => [...prev, { id: Date.now(), from: "butler", text: msg }]);
  }, [canAfford, deductCoins, butlerTipped]);

  const leaveTable = () => {
    setPhase("browsing"); setPartner(null);
    setChatMsgs([]); setChatInput(""); setButlerTipped(false);
  };

  const fmtCountdown = () => {
    const m = Math.floor(countdown / 60_000);
    const s = Math.floor((countdown % 60_000) / 1_000);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const available = visible.filter(v => v.status === "available");
  const atTable   = visible.filter(v => v.status === "at-table");

  // ════════════════════════════════════════════════════════════════════════════
  // AT-TABLE VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "at-table" && partner) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#08080e", fontFamily: "system-ui, sans-serif", color: "#fff" }}>

        {/* Fixed header */}
        <div style={{
          flexShrink: 0, background: "rgba(8,8,14,0.97)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          paddingTop: "calc(env(safe-area-inset-top,0px) + 12px)",
          paddingBottom: 14, paddingLeft: 16, paddingRight: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <motion.button whileTap={{ scale: 0.92 }} onClick={leaveTable}
              style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ←
            </motion.button>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              🍳 Breakfast Table
            </p>
            <CoinBalanceChip size="sm" />
          </div>

          {/* Dual avatars */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #4ade8055, #4ade8022)", border: "2.5px solid #4ade8080", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>👤</div>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "#4ade80", letterSpacing: "0.08em" }}>YOU</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, margin: "0 12px" }}>
              <div style={{ width: 38, height: 2, borderRadius: 1, background: "linear-gradient(90deg, #4ade8040, #d4af3780)" }} />
              <span style={{ fontSize: 16 }}>🍽️</span>
              <div style={{ width: 38, height: 2, borderRadius: 1, background: "linear-gradient(90deg, #d4af3780, #4ade8040)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <Avatar p={partner} size={56} border={`2.5px solid ${avCol(partner.seed)}80`} />
              <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: avCol(partner.seed), letterSpacing: "0.08em" }}>{partner.ghostId}</p>
            </div>
          </div>
          <p style={{ margin: "10px 0 0", textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.28)" }}>
            {partner.city} · {partner.floor} Floor · "{partner.mood}"
          </p>
        </div>

        {/* Messages */}
        <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "14px 14px 0" }}>
          {chatMsgs.map(msg => (
            <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "me" ? "flex-end" : "flex-start", marginBottom: 10 }}>
              {msg.from === "butler" ? (
                <div style={{ maxWidth: "82%", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 14, padding: "9px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <img src={BUTLER_IMG} alt="" style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(212,175,55,0.85)", lineHeight: 1.5 }}>{msg.text}</p>
                </div>
              ) : (
                <div style={{
                  maxWidth: "75%",
                  background: msg.from === "me" ? "linear-gradient(135deg, #16a34a, #22c55e)" : "rgba(255,255,255,0.07)",
                  borderRadius: msg.from === "me" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  padding: "10px 14px",
                  border: msg.from === "me" ? "none" : "1px solid rgba(255,255,255,0.08)",
                }}>
                  <p style={{ margin: 0, fontSize: 13, color: msg.from === "me" ? "#fff" : "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{msg.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input bar */}
        <div style={{ flexShrink: 0, padding: "10px 14px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 10px)", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(8,8,14,0.97)" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={tipButler}
              disabled={butlerTipped || !canAfford(TIP_COST)}
              style={{
                padding: "6px 18px", borderRadius: 20, cursor: butlerTipped || !canAfford(TIP_COST) ? "default" : "pointer",
                background: butlerTipped ? "rgba(255,255,255,0.03)" : "rgba(212,175,55,0.08)",
                border: `1px solid ${butlerTipped ? "rgba(255,255,255,0.05)" : "rgba(212,175,55,0.25)"}`,
                fontSize: 11, fontWeight: 700, color: butlerTipped ? "rgba(255,255,255,0.2)" : "#d4af37",
                display: "flex", alignItems: "center", gap: 6,
              }}>
              {butlerTipped ? "🍾 Tip sent to Mr. Butla" : `🎩 Tip the Butler · 🪙${TIP_COST}`}
            </motion.button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }}}
              placeholder="Type a message…" maxLength={200}
              style={{ flex: 1, height: 44, borderRadius: 22, boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, padding: "0 16px", outline: "none" }} />
            <motion.button whileTap={{ scale: 0.93 }} onClick={sendChat}
              disabled={!chatInput.trim() || !canAfford(CHAT_COST)}
              style={{
                height: 44, padding: "0 16px", borderRadius: 22, flexShrink: 0,
                background: chatInput.trim() && canAfford(CHAT_COST) ? "linear-gradient(135deg, #16a34a, #22c55e)" : "rgba(255,255,255,0.05)",
                border: "none", cursor: chatInput.trim() && canAfford(CHAT_COST) ? "pointer" : "default",
                fontSize: 12, fontWeight: 800,
                color: chatInput.trim() && canAfford(CHAT_COST) ? "#fff" : "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              Send <span style={{ fontSize: 10, opacity: 0.7 }}>🪙{CHAT_COST}</span>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // BROWSING VIEW
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100dvh", background: "#08080e", color: "#fff", fontFamily: "system-ui, sans-serif", overflowX: "hidden" }}>

      {/* Hero banner */}
      <div style={{ position: "relative", height: 210, overflow: "hidden" }}>
        <img src={LOUNGE_IMG} alt="Breakfast Lounge" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,14,0.25) 0%, rgba(8,8,14,0.88) 100%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(env(safe-area-inset-top,16px) + 10px) 16px 0" }}>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => navigate(-1)}
            style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.7)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </motion.button>
          <CoinBalanceChip size="md" />
        </div>
        <div style={{ position: "absolute", bottom: 14, left: 16 }}>
          <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.16em", textTransform: "uppercase" }}>Ghost Hotel</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>🍳 Breakfast Lounge</p>
        </div>
        <div style={{ position: "absolute", bottom: 18, right: 14, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{clock}</p>
        </div>
      </div>

      <div style={{ padding: "14px 13px calc(env(safe-area-inset-bottom,0px) + 32px)" }}>

        {/* You're live in the lounge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: 14, padding: "11px 14px", marginBottom: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            <span style={{ color: "#4ade80", fontWeight: 800 }}>You're in the lounge</span> — other guests can see your presence
          </p>
        </div>

        {/* Invite pending / refused banners */}
        <AnimatePresence>
          {phase === "invite-pending" && partner && (
            <motion.div key="pending"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.22)", borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fbbf24" }}>Invite pending</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                  Mr. Butla is delivering your invite to {partner.ghostId}…
                </p>
              </div>
              <img src={BUTLER_IMG} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            </motion.div>
          )}

          {phase === "refused" && refuseMsg && (
            <motion.div key="refused"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
              <img src={BUTLER_IMG} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              <div>
                <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Mr. Butla</p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.55 }}>{refuseMsg}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Countdown */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Live Guests
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "3px 10px" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80" }} />
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
              Refreshes in {fmtCountdown()}
            </p>
          </div>
        </div>

        {/* Available guests */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          {available.map(({ profile: p }) => {
            const locked = phase === "invite-pending" || phase === "at-table";
            return (
              <motion.div key={p.id} whileTap={{ scale: locked ? 1 : 0.98 }}
                onClick={() => { if (!locked) { setSelectedProfile(p); setInviteNote(""); } }}
                style={{
                  display: "flex", alignItems: "center", gap: 13, padding: "12px 14px", borderRadius: 16,
                  cursor: locked ? "default" : "pointer",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  opacity: locked ? 0.45 : 1,
                }}
              >
                <Avatar p={p} size={46} status="available" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{p.ghostId}</p>
                  <p style={{ margin: "2px 0", fontSize: 10, color: "rgba(255,255,255,0.32)" }}>{p.city} · {p.floor}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>"{p.mood}"</p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.22)", borderRadius: 20, padding: "2px 8px" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80" }} />
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "#4ade80" }}>Available</p>
                  </div>
                  {!locked && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)" }}>tap to view</span>}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* At a Table */}
        {atTable.length > 0 && (
          <>
            <p style={{ margin: "0 0 9px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: "0.14em", textTransform: "uppercase" }}>At a Table</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {atTable.map(({ profile: p, tableWith }) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", opacity: 0.45 }}>
                  <Avatar p={p} size={38} status="at-table" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>{p.ghostId}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.22)" }}>Sitting with {tableWith}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 20, padding: "2px 8px" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f87171" }} />
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "#f87171" }}>At a table</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ════ PROFILE POPUP SHEET ════ */}
      <AnimatePresence>
        {selectedProfile && (
          <>
            <motion.div key="pp-bg"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProfile(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 200, backdropFilter: "blur(7px)" }} />
            <motion.div key="pp-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201, background: "#0e0e18", borderRadius: "22px 22px 0 0", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 26px)" }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "12px auto 0" }} />
              <div style={{ padding: "18px 18px 0" }}>

                {/* Profile header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <Avatar p={selectedProfile} size={62} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 19, fontWeight: 900, color: "#fff" }}>{selectedProfile.ghostId}</p>
                    <p style={{ margin: "3px 0 1px", fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
                      {selectedProfile.city} · {selectedProfile.floor} Floor · Age {selectedProfile.age}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: avCol(selectedProfile.seed), fontStyle: "italic" }}>
                      "{selectedProfile.mood}"
                    </p>
                  </div>
                </div>

                {/* About */}
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
                    {selectedProfile.about}
                  </p>
                </div>

                {/* Optional note */}
                <p style={{ margin: "0 0 7px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Add a note <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "rgba(255,255,255,0.18)" }}>— optional</span>
                </p>
                <input
                  value={inviteNote}
                  onChange={e => setInviteNote(e.target.value)}
                  placeholder="e.g. I'll be by the window…"
                  maxLength={80}
                  style={{ width: "100%", height: 42, borderRadius: 11, boxSizing: "border-box", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 13, padding: "0 14px", outline: "none", marginBottom: 16 }}
                />

                {/* Invite CTA */}
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={handleSendInvite}
                  disabled={!canAfford(INVITE_COST)}
                  style={{
                    width: "100%", padding: "16px",
                    background: canAfford(INVITE_COST)
                      ? "linear-gradient(135deg, #78350f, #d97706, #fbbf24)"
                      : "rgba(255,255,255,0.04)",
                    border: canAfford(INVITE_COST) ? "none" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 16, cursor: canAfford(INVITE_COST) ? "pointer" : "not-allowed",
                    fontSize: 14, fontWeight: 900,
                    color: canAfford(INVITE_COST) ? "#0a0500" : "rgba(255,255,255,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                  <span>🍳</span>
                  <span>Invite to join me</span>
                  <span style={{ fontSize: 11, opacity: 0.65 }}>· 🪙{INVITE_COST}</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════ INCOMING BUTLER INVITE POPUP ════ */}
      <AnimatePresence>
        {incomingInvite && phase === "browsing" && (
          <>
            <motion.div key="ii-bg"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 300, backdropFilter: "blur(9px)" }} />
            <motion.div key="ii-popup"
              initial={{ opacity: 0, y: 40, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.94 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 301, background: "#0e0e18", borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.22)", borderBottom: "none", padding: "20px 20px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)" }}>

              {/* Butler header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{ position: "relative" }}>
                  <img src={BUTLER_IMG} alt="Butler" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.4)" }} />
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>🔔</div>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#d4af37", letterSpacing: "0.1em", textTransform: "uppercase" }}>Mr. Butla</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>A message from the breakfast lounge</p>
                </div>
              </div>

              {/* Invite card */}
              <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 14, padding: "14px", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
                  <Avatar p={incomingInvite} size={44} status="available" />
                  <div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>{incomingInvite.ghostId}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                      {incomingInvite.city} · {incomingInvite.floor} Floor
                    </p>
                  </div>
                </div>
                <p style={{ margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>
                  has invited you to join them at their breakfast table.
                </p>
                <p style={{ margin: 0, fontSize: 11, fontStyle: "italic", color: "rgba(255,255,255,0.28)" }}>
                  "{incomingInvite.mood}"
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={declineIncoming}
                  style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, cursor: "pointer", fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.35)" }}>
                  Decline
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={acceptIncoming}
                  style={{ flex: 2, padding: "14px", background: "linear-gradient(135deg, #78350f, #d97706, #fbbf24)", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 14, fontWeight: 900, color: "#0a0500", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <span>🍳</span> Accept Invitation
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
