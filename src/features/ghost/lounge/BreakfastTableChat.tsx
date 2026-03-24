// ── BreakfastTableChat ────────────────────────────────────────────────────────
// Self-contained at-table chat view for the Breakfast Lounge.
// Owns all chat state, group-invite state, and goodbye-note flow internally.
// Parent only needs: partner, seatingTime, available list, and onLeave callback.

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoins } from "../hooks/useCoins";
import CoinBalanceChip from "../components/CoinBalanceChip";
import LoungeAvatar from "./LoungeAvatar";
import {
  CHAT_COST, TIP_COST, TABLE_INVITE_COST, TABLE_NOTE_COST,
  avCol,
  LoungeProfile, ChatMsg, VisibleEntry,
  PARTNER_REPLIES, BUTLER_SURPRISE_MSGS,
  rnd,
} from "./loungeData";

const BUTLER_IMG = "https://ik.imagekit.io/7grri5v7d/ewrwerwerwer-removebg-preview.png?updatedAt=1774288645920";

// Free first session: first chat message costs 0 coins.
function checkFirstSession(): boolean {
  try { return !localStorage.getItem("lounge_had_table_session"); } catch { return false; }
}
function markSessionUsed() {
  try { localStorage.setItem("lounge_had_table_session", "true"); } catch {}
}

interface Props {
  partner: LoungeProfile;
  seatingTime: string | null;
  available: VisibleEntry[];
  onLeave: (note: string) => void;
}

export default function BreakfastTableChat({ partner, seatingTime, available, onLeave }: Props) {
  const { deductCoins, canAfford } = useCoins();

  // ── Group table ──────────────────────────────────────────────────────────────
  const [groupPartner, setGroupPartner]       = useState<LoungeProfile | null>(null);
  const [groupPhase, setGroupPhase]           = useState<"none" | "pending" | "joined">("none");
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [tableInviteNote, setTableInviteNote]             = useState("");
  const [tableSelectedGuest, setTableSelectedGuest]       = useState<LoungeProfile | null>(null);
  const [myTableInviteId, setMyTableInviteId]             = useState<string | null>(null);
  const [partnerInvited, setPartnerInvited]               = useState(false);

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const [chatMsgs, setChatMsgs]           = useState<ChatMsg[]>([
    { id: 1, from: "butler", text: `Your table is set. ${partner.ghostId} is now live in chat. 🍳`, showTip: true },
  ]);
  const [chatInput, setChatInput]         = useState("");
  const [msgId, setMsgId]                 = useState(2);
  const [butlerTipped, setButlerTipped]   = useState(false);
  const [tippedMsgIds, setTippedMsgIds]   = useState<Set<number>>(new Set());
  const [likedMsgs, setLikedMsgs]         = useState<Set<string>>(new Set());
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [seenMsgId, setSeenMsgId]         = useState<number | null>(null);
  const [isFirstSession]                  = useState(checkFirstSession);
  const chatRef                           = useRef<HTMLDivElement>(null);
  const actionTimestamps                  = useRef<number[]>([]);

  // ── Leave-note sheet ─────────────────────────────────────────────────────────
  const [showLeaveNote, setShowLeaveNote] = useState(false);
  const [leaveNoteText, setLeaveNoteText] = useState("");

  // Partner first reply
  useEffect(() => {
    const t = setTimeout(() => {
      const reply = PARTNER_REPLIES[Math.floor(Math.random() * PARTNER_REPLIES.length)];
      setChatMsgs(prev => [...prev, { id: Date.now(), from: "them", text: reply }]);
    }, 2_500);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMsgs]);

  const recordAction = useCallback(() => {
    const now = Date.now();
    actionTimestamps.current = [...actionTimestamps.current.filter(t => now - t < 15_000), now];
    if (actionTimestamps.current.length >= 3) {
      actionTimestamps.current = [];
      setTimeout(() => {
        setChatMsgs(prev => [...prev, { id: Date.now(), from: "butler",
          text: "A moment, if I may — the lounge is best enjoyed at a leisurely pace." }]);
      }, 600);
    }
  }, []);

  const effectiveCost = (base: number) => isFirstSession ? 0 : base;

  const sendChat = useCallback(() => {
    const text = chatInput.trim();
    const cost = effectiveCost(CHAT_COST);
    if (!text || (cost > 0 && !canAfford(cost))) return;
    if (cost > 0) deductCoins(cost, "Breakfast table chat");
    else markSessionUsed(); // first message free — mark session used
    recordAction();
    const sentId = msgId;
    setChatMsgs(prev => [...prev, { id: sentId, from: "me", text }]);
    setMsgId(n => n + 1);
    setChatInput("");
    setSeenMsgId(null);
    const delay = rnd(2_000, 5_000);
    setTimeout(() => setPartnerTyping(true), Math.min(600, delay - 800));
    setTimeout(() => {
      const reply = PARTNER_REPLIES[Math.floor(Math.random() * PARTNER_REPLIES.length)];
      const from = groupPhase === "joined" && Math.random() > 0.5 ? "them2" : "them";
      setPartnerTyping(false);
      setChatMsgs(prev => [...prev, { id: Date.now(), from, text: reply }]);
      setSeenMsgId(sentId);
    }, delay);
  }, [chatInput, canAfford, deductCoins, msgId, groupPhase, isFirstSession]); // eslint-disable-line react-hooks/exhaustive-deps

  const tipButler = useCallback(() => {
    if (!canAfford(TIP_COST) || butlerTipped) return;
    deductCoins(TIP_COST, "Butler tip at breakfast");
    setButlerTipped(true);
    const msg = BUTLER_SURPRISE_MSGS[Math.floor(Math.random() * BUTLER_SURPRISE_MSGS.length)];
    setChatMsgs(prev => [...prev, { id: Date.now(), from: "butler", text: msg }]);
  }, [canAfford, deductCoins, butlerTipped]);

  const inviteThird = useCallback((third: LoungeProfile, note: string) => {
    const hasNote = note.trim().length > 0;
    const totalCost = TABLE_INVITE_COST + (hasNote ? TABLE_NOTE_COST : 0);
    if (!canAfford(totalCost)) return;
    deductCoins(totalCost, `Table invite to ${third.ghostId}`);
    setMyTableInviteId(third.id);
    setGroupPhase("pending");
    setShowGroupPicker(false);
    setTableInviteNote("");
    setTableSelectedGuest(null);
    setChatMsgs(prev => [...prev, { id: Date.now(), from: "butler",
      text: `I have sent ${third.ghostId} an invitation to join your table.${hasNote ? " Your personal note has been delivered privately." : ""}` }]);
    setTimeout(() => setPartnerInvited(true), rnd(8_000, 15_000));
    setTimeout(() => {
      if (Math.random() < 0.65) {
        setGroupPartner(third);
        setGroupPhase("joined");
        setChatMsgs(prev => [...prev, { id: Date.now(), from: "butler", text: `${third.ghostId} is now live at your table. 🍽️`, showTip: true }]);
        setTimeout(() => {
          const reply = PARTNER_REPLIES[Math.floor(Math.random() * PARTNER_REPLIES.length)];
          setChatMsgs(prev => [...prev, { id: Date.now(), from: "them2", text: reply }]);
        }, 2_500);
      } else {
        setGroupPhase("none");
        setMyTableInviteId(null);
        setChatMsgs(prev => [...prev, { id: Date.now(), from: "butler", text: `${third.ghostId} is unable to join at this time.` }]);
      }
    }, rnd(4_000, 7_000));
  }, [canAfford, deductCoins]);

  const confirmLeave = (note: string) => {
    setShowLeaveNote(false);
    onLeave(note);
  };

  const guestCount = groupPhase === "joined" && groupPartner ? 3 : 2;
  const cost = effectiveCost(CHAT_COST);
  const canSend = chatInput.trim().length > 0 && (cost === 0 || canAfford(cost));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#08080e", fontFamily: "system-ui, sans-serif", color: "#fff" }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, background: "rgba(6,6,10,0.99)", borderBottom: "1px solid rgba(212,175,55,0.12)", paddingBottom: 14 }}>
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #d4af37, transparent)", flexShrink: 0 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px 10px", paddingTop: "calc(env(safe-area-inset-top,0px) + 12px)" }}>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowLeaveNote(true)}
            style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            ←
          </motion.button>
          <LoungeAvatar p={partner} size={38} border="2px solid rgba(212,175,55,0.45)" />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#d4af37" }}>{partner.ghostId}</p>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
              {guestCount} guests · {partner.flag} {partner.city}
              {isFirstSession && <span style={{ color: "#22c55e", marginLeft: 6 }}>✦ Free session</span>}
            </p>
          </div>
          <CoinBalanceChip size="sm" />
          <motion.button whileTap={{ scale: 0.9 }}
            onClick={() => setShowGroupPicker(true)}
            style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", color: "#d4af37", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            ⚙️
          </motion.button>
        </div>
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)", margin: "0 16px 0" }} />
        {seatingTime && (
          <p style={{ margin: "6px 0 0", textAlign: "center", fontSize: 10, color: "#d4af37" }}>🕐 Reserved {seatingTime}</p>
        )}
      </div>

      {/* ── Messages ── */}
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "14px 14px 0" }}>
        {chatMsgs.map(msg => {
          const isMe     = msg.from === "me";
          const isButler = msg.from === "butler";
          const isThem2  = msg.from === "them2";
          const liked    = likedMsgs.has(String(msg.id));
          const toggleLike = () => setLikedMsgs(prev => {
            const n = new Set(prev);
            liked ? n.delete(String(msg.id)) : n.add(String(msg.id));
            return n;
          });
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 12, alignItems: "flex-end", gap: 8 }}>
              {isButler ? (
                <div style={{ maxWidth: "82%", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 14, padding: "9px 14px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <img src={BUTLER_IMG} alt="" style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(212,175,55,0.85)", lineHeight: 1.5 }}>{msg.text}</p>
                    {msg.showTip && (
                      <motion.button whileTap={{ scale: 0.94 }}
                        onClick={() => {
                          if (tippedMsgIds.has(msg.id) || !canAfford(TIP_COST)) return;
                          tipButler();
                          setTippedMsgIds(prev => new Set([...prev, msg.id]));
                        }}
                        style={{ marginTop: 8, padding: "5px 12px", borderRadius: 12, border: "none", background: tippedMsgIds.has(msg.id) ? "rgba(255,255,255,0.04)" : "rgba(212,175,55,0.15)", color: tippedMsgIds.has(msg.id) ? "rgba(255,255,255,0.25)" : "#d4af37", fontSize: 11, fontWeight: 800, cursor: tippedMsgIds.has(msg.id) ? "default" : "pointer" }}>
                        {tippedMsgIds.has(msg.id) ? "🍾 Tip sent" : `🎩 Tip · 🪙${TIP_COST}`}
                      </motion.button>
                    )}
                  </div>
                </div>
              ) : isMe ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                    <motion.button whileTap={{ scale: 0.8 }} onClick={toggleLike}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: liked ? 1 : 0.25, flexShrink: 0, padding: 0 }}>
                      {liked ? "❤️" : "🤍"}
                    </motion.button>
                    <div style={{ maxWidth: "72%", background: "linear-gradient(135deg, #16a34a, #22c55e)", borderRadius: "18px 18px 4px 18px", padding: "10px 14px" }}>
                      <p style={{ margin: 0, fontSize: 13, color: "#fff", lineHeight: 1.5 }}>{msg.text}</p>
                    </div>
                  </div>
                  {seenMsgId === msg.id && (
                    <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600, paddingRight: 4 }}>👁 Seen</p>
                  )}
                </div>
              ) : (
                <>
                  {isThem2 && groupPartner
                    ? <LoungeAvatar p={groupPartner} size={28} border={`1.5px solid ${avCol(groupPartner.seed)}60`} />
                    : <LoungeAvatar p={partner} size={28} border="1.5px solid rgba(212,175,55,0.35)" />
                  }
                  <div style={{ maxWidth: "72%", background: isThem2 ? "rgba(168,139,250,0.15)" : "rgba(255,255,255,0.07)", borderRadius: "18px 18px 18px 4px", padding: "10px 14px", border: isThem2 ? "1px solid rgba(168,139,250,0.25)" : "1px solid rgba(255,255,255,0.08)" }}>
                    {isThem2 && groupPartner && (
                      <p style={{ margin: "0 0 3px", fontSize: 9, fontWeight: 800, color: avCol(groupPartner.seed), letterSpacing: "0.06em" }}>{groupPartner.ghostId}</p>
                    )}
                    <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{msg.text}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.8 }} onClick={toggleLike}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: liked ? 1 : 0.25, flexShrink: 0, padding: 0 }}>
                    {liked ? "❤️" : "🤍"}
                  </motion.button>
                </>
              )}
            </div>
          );
        })}
        {/* Typing indicator */}
        {partnerTyping && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 12 }}>
            <LoungeAvatar p={partner} size={28} border="1.5px solid rgba(212,175,55,0.35)" />
            <div style={{ padding: "10px 14px", background: "rgba(255,255,255,0.07)", borderRadius: "18px 18px 18px 4px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 0.18, 0.36].map(d => (
                <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: d }}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)" }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div style={{ flexShrink: 0, padding: "10px 14px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 10px)", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(8,8,14,0.97)" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={chatInput} onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
            placeholder="Type a message…" maxLength={200}
            style={{ flex: 1, height: 44, borderRadius: 22, boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, padding: "0 16px", outline: "none", caretColor: "#d4af37" }} />
          <motion.button whileTap={{ scale: 0.93 }} onClick={sendChat} disabled={!canSend}
            style={{ height: 44, padding: "0 16px", borderRadius: 22, flexShrink: 0, background: canSend ? "linear-gradient(135deg, #16a34a, #22c55e)" : "rgba(255,255,255,0.05)", border: "none", cursor: canSend ? "pointer" : "default", fontSize: 12, fontWeight: 800, color: canSend ? "#fff" : "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 5 }}>
            Send
            {cost > 0
              ? <span style={{ fontSize: 10, opacity: 0.7 }}>🪙{cost}</span>
              : <span style={{ fontSize: 10, color: "#4ade80" }}>Free</span>
            }
          </motion.button>
        </div>
      </div>

      {/* ── Goodbye note sheet ── */}
      <AnimatePresence>
        {showLeaveNote && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLeaveNote(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 450, backdropFilter: "blur(8px)" }} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 451, background: "#0a0a0f", borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", padding: "20px 20px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 24px)", overflow: "hidden" }}>
              <div style={{ height: 3, position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, transparent, #d4af37, transparent)", borderRadius: "22px 22px 0 0" }} />
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 16px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <img src={BUTLER_IMG} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(212,175,55,0.45)", flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#d4af37" }}>Leave a farewell note?</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Optional — your partner will see it on the table</p>
                </div>
              </div>
              <textarea value={leaveNoteText} onChange={e => setLeaveNoteText(e.target.value)}
                placeholder="e.g. It was a pleasure chatting — hope to see you here tomorrow morning ☕"
                maxLength={200} rows={3}
                style={{ width: "100%", borderRadius: 12, boxSizing: "border-box", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, padding: "10px 14px", outline: "none", caretColor: "#d4af37", resize: "none", fontFamily: "inherit", lineHeight: 1.6, marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => confirmLeave("")}
                  style={{ flex: 1, padding: "13px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>
                  Just Leave
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => confirmLeave(leaveNoteText)}
                  style={{ flex: 2, padding: "13px", background: leaveNoteText.trim() ? "linear-gradient(135deg, #78350f, #d97706, #fbbf24)" : "rgba(255,255,255,0.04)", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 13, fontWeight: 900, color: leaveNoteText.trim() ? "#0a0500" : "rgba(255,255,255,0.2)" }}>
                  {leaveNoteText.trim() ? "Leave Note & Exit" : "Leave Quietly"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Group invite sheet ── */}
      <AnimatePresence>
        {showGroupPicker && (
          <>
            <motion.div key="gp-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowGroupPicker(false); setTableSelectedGuest(null); setTableInviteNote(""); }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 400, backdropFilter: "blur(8px)" }} />
            <motion.div key="gp-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 401, background: "#0a0a0f", borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", maxHeight: "88dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, #d4af37, rgba(212,175,55,0.4), transparent)" }} />
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "16px auto 14px" }} />

              <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <img src={BUTLER_IMG} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.5)", flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#d4af37" }}>Invite a Guest</p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.45 }}>
                      Each guest may invite one person. Add a private note only they will see.
                    </p>
                  </div>
                </div>

                {/* Who has invited */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <div style={{ flex: 1, borderRadius: 12, padding: "9px 12px", background: myTableInviteId ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${myTableInviteId ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.07)"}`, display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #4ade8055, #4ade8022)", border: "2px solid #4ade8060", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "#4ade80", letterSpacing: "0.1em", textTransform: "uppercase" }}>You</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: myTableInviteId ? "#4ade80" : "rgba(255,255,255,0.3)" }}>{myTableInviteId ? "Invite sent ✓" : "1 invite available"}</p>
                    </div>
                  </div>
                  <div style={{ flex: 1, borderRadius: 12, padding: "9px 12px", background: partnerInvited ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${partnerInvited ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.07)"}`, display: "flex", alignItems: "center", gap: 9 }}>
                    <LoungeAvatar p={partner} size={32} border={`2px solid ${avCol(partner.seed)}60`} />
                    <div>
                      <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: avCol(partner.seed), letterSpacing: "0.1em", textTransform: "uppercase" }}>{partner.ghostId}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: partnerInvited ? "#4ade80" : "rgba(255,255,255,0.3)" }}>{partnerInvited ? "Invite sent ✓" : "1 invite available"}</p>
                    </div>
                  </div>
                </div>

                {/* Guest list */}
                {!myTableInviteId && (
                  <>
                    <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "#d4af37", letterSpacing: "0.1em", textTransform: "uppercase" }}>Live Guests — tap to select</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {available.filter(v => v.status === "available" && v.profile.id !== partner.id).map(({ profile: p }) => {
                        const isSel = tableSelectedGuest?.id === p.id;
                        return (
                          <motion.div key={p.id} whileTap={{ scale: 0.97 }}
                            onClick={() => setTableSelectedGuest(isSel ? null : p)}
                            style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 14, cursor: "pointer", background: isSel ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)", border: isSel ? "1px solid rgba(212,175,55,0.45)" : "1px solid rgba(255,255,255,0.07)", transition: "all 0.18s" }}>
                            <LoungeAvatar p={p} size={40} status="available" />
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: isSel ? "#d4af37" : "#fff" }}>{p.ghostId}</p>
                              <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{p.flag} {p.city} · {42 + (p.seed % 51)}% match</p>
                            </div>
                            {isSel && <span style={{ fontSize: 16, color: "#d4af37", flexShrink: 0 }}>✓</span>}
                          </motion.div>
                        );
                      })}
                    </div>
                  </>
                )}

                {myTableInviteId && (
                  <div style={{ borderRadius: 14, padding: "14px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 13, color: "#4ade80", fontWeight: 700 }}>Invitation sent — awaiting response</p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>You will see their reply in the chat</p>
                  </div>
                )}
              </div>

              {/* Note + send */}
              {!myTableInviteId && (
                <div style={{ flexShrink: 0, padding: "10px 20px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 14px)", borderTop: "1px solid rgba(212,175,55,0.1)", background: "#0a0a0f" }}>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: tableSelectedGuest ? "#d4af37" : "rgba(255,255,255,0.2)" }}>
                        Private note <span style={{ fontWeight: 400, color: tableSelectedGuest ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)" }}>— optional · 🪙{TABLE_NOTE_COST}</span>
                      </p>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{tableInviteNote.length}/200</span>
                    </div>
                    <textarea value={tableInviteNote}
                      onChange={e => tableSelectedGuest && setTableInviteNote(e.target.value)}
                      placeholder={tableSelectedGuest ? "Add a private note only this guest will see…" : "Select a guest above first"}
                      maxLength={200} rows={2}
                      style={{ width: "100%", borderRadius: 11, boxSizing: "border-box", background: tableSelectedGuest ? "rgba(212,175,55,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${tableSelectedGuest ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.06)"}`, color: tableSelectedGuest ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 12, padding: "9px 14px", outline: "none", caretColor: "#d4af37", resize: "none", lineHeight: 1.5, fontFamily: "inherit", cursor: tableSelectedGuest ? "text" : "not-allowed", transition: "all 0.2s" }} />
                  </div>
                  <motion.button whileTap={{ scale: tableSelectedGuest ? 0.97 : 1 }}
                    onClick={() => tableSelectedGuest && canAfford(TABLE_INVITE_COST) && inviteThird(tableSelectedGuest, tableInviteNote)}
                    style={{ width: "100%", padding: "14px", borderRadius: 16, border: "none", cursor: tableSelectedGuest ? "pointer" : "default", fontSize: 14, fontWeight: 900, background: tableSelectedGuest ? "linear-gradient(135deg, #78350f, #d97706, #fbbf24)" : "rgba(255,255,255,0.05)", color: tableSelectedGuest ? "#0a0500" : "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.25s, color 0.25s" }}>
                    <span>{tableSelectedGuest ? `Invite ${tableSelectedGuest.ghostId}` : "Select a guest to invite"}</span>
                    {tableSelectedGuest && (
                      <span style={{ fontSize: 11, opacity: 0.65 }}>
                        {tableInviteNote.trim().length > 0 ? `· 🪙${TABLE_INVITE_COST + TABLE_NOTE_COST}` : `· 🪙${TABLE_INVITE_COST}`}
                      </span>
                    )}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
