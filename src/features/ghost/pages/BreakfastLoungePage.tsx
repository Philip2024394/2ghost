// ── Breakfast Lounge ─────────────────────────────────────────────────────────
// Time-gated (7am–11am) social dining room with butler check-in, group tables,
// recommendations, international guest mode, and anonymous coffee gifting.

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCoins } from "../hooks/useCoins";
import CoinBalanceChip from "../components/CoinBalanceChip";
import LoungeAvatar from "../lounge/LoungeAvatar";
import {
  CHAT_COST, NOTE_COST, TIP_COST, TABLE_INVITE_COST, TABLE_NOTE_COST,
  COFFEE_COST, INTL_COST, EXTRA_REC_COST,
  ROTATE_MIN, ROTATE_MAX, LOUNGE_OPEN_H, LOUNGE_CLOSE_H, SWAP_PER_TICK,
  UTC_OFFSETS, REGIONS, avCol,
  LoungeProfile, Phase, ChatMsg,
  POOL, SEATING_TIMES, SOFT_DECLINES, PARTNER_REPLIES,
  BUTLER_SURPRISE_MSGS, REC_INTROS,
  isOnlineHours,
  getBusiestBreakfastRegion, loungePresence, approxDistance, pickInviteMsg,
  isLoungeOpen, getOpenCountdown, buildVisible, pickRec, rnd,
} from "../lounge/loungeData";

const LOUNGE_IMG  = "https://ik.imagekit.io/7grri5v7d/mmmmmdfgdsfgdfg.png";
const BUTLER_IMG  = "https://ik.imagekit.io/7grri5v7d/ewrwerwerwer-removebg-preview.png?updatedAt=1774288645920";
const INVITE_COST = 0; // keep local — only used here



function getMorningTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}


// ── Main ──────────────────────────────────────────────────────────────────────
export default function BreakfastLoungePage() {
  const navigate = useNavigate();
  const { deductCoins, canAfford } = useCoins();

  // Country selected from the lobby picker (sessionStorage)
  const pickedCountry = (() => { try { return sessionStorage.getItem("breakfast_country") ?? null; } catch { return null; } })();

  // Opt-in state — user can toggle off from the side drawer
  const [loungeOptIn, setLoungeOptIn] = useState<boolean>(() => {
    try { return localStorage.getItem("breakfast_lounge_enabled") !== "false"; } catch { return true; }
  });

  const open = isLoungeOpen();

  const [clock, setClock]         = useState(getMorningTime);
  const [intlUnlocked, setIntlUnlocked] = useState(false); void intlUnlocked;
  const [intlActive, setIntlActive]     = useState(() => pickedCountry != null ? true : false);
  const [visible, setVisible]     = useState(() => buildVisible(pickedCountry != null, new Set(), new Set(), pickedCountry));
  const [countdown, setCountdown] = useState(() => rnd(ROTATE_MIN, ROTATE_MAX));

  // ── Phase / invite
  const [phase, setPhase]                     = useState<Phase>("browsing");
  const [partner, setPartner]                 = useState<LoungeProfile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<LoungeProfile | null>(null);
  const [inviteNote, setInviteNote]           = useState("");
  const [refuseMsg, setRefuseMsg]             = useState("");

  // ── Group table (3rd guest)
  const [groupPartner, setGroupPartner]     = useState<LoungeProfile | null>(null);
  const [groupPhase, setGroupPhase]         = useState<"none"|"pending"|"joined">("none");
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [tableInviteNote, setTableInviteNote]       = useState("");
  const [tableSelectedGuest, setTableSelectedGuest] = useState<LoungeProfile | null>(null);
  const [myTableInviteId, setMyTableInviteId]       = useState<string | null>(null);
  const [partnerInvited, setPartnerInvited]         = useState(false);

  // ── Chat likes
  const [likedMsgs, setLikedMsgs] = useState<Set<string>>(new Set());

  // ── Floor view
  const [floorView, setFloorView] = useState(false);
  const [floorSelectedProfile, setFloorSelectedProfile] = useState<LoungeProfile | null>(null);
  const [floorSelectedTableId, setFloorSelectedTableId] = useState<string | null>(null);
  const [floorJoinTableId, setFloorJoinTableId] = useState<string | null>(null);
  const [inviteLaterIds, setInviteLaterIds] = useState<Set<string>>(new Set());

  // ── Butler recommendation
  const [butlerRec, setButlerRec]     = useState<LoungeProfile | null>(null);
  const [recMsg, setRecMsg]           = useState<string>("");
  const [recUsedIds, setRecUsedIds]   = useState<string[]>([]);
  const [extraRecLoading, setExtraRecLoading] = useState(false);

  // ── Butler check-in popup
  const [showCheckin, setShowCheckin]   = useState(false);
  const checkinFired = useRef(false);
  const [seatingTime, setSeatingTime]   = useState<string | null>(null);
  const [seatedNow, setSeatedNow]       = useState(false); void setSeatedNow; void seatedNow;
  const [showSeatingPicker, setShowSeatingPicker] = useState(false);

  // ── Leave a coffee
  const [coffeesSent, setCoffeesSent]       = useState<Set<string>>(new Set());
  const [coffeeReceivedIds, setCoffeeReceivedIds] = useState<Set<string>>(new Set());
  const [coffeeToast, setCoffeeToast]       = useState<string | null>(null);
  const [receivedCoffee, setReceivedCoffee] = useState(false);
  const [coffeeFrom, setCoffeeFrom]         = useState<LoungeProfile | null>(null);
  const [showCoffeeReply, setShowCoffeeReply] = useState(false);
  const [coffeeReplySent, setCoffeeReplySent] = useState<string | null>(null);
  const [coffeeReplyCategory, setCoffeeReplyCategory] = useState(0);

  // ── Incoming invite
  const [incomingInvite, setIncomingInvite] = useState<LoungeProfile | null>(null);
  const [incomingMsg, setIncomingMsg]       = useState<string>("");
  const incomingFired = useRef(false);
  const [dismissedIds, setDismissedIds]     = useState<Set<string>>(new Set());
  const [declineMsg, setDeclineMsg]         = useState<string | null>(null);

  // ── Lounge quick menu
  const [showLoungeMenu, setShowLoungeMenu] = useState(false);

  // ── Fair rotation tracking
  const [shownIds, setShownIds]             = useState<Set<string>>(new Set());
  const [showRedirect, setShowRedirect]     = useState(false);

  // ── Chat
  const [chatMsgs, setChatMsgs]         = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput]       = useState("");
  const [msgId, setMsgId]               = useState(1);
  const [butlerTipped, setButlerTipped] = useState(false);
  const [tippedMsgIds, setTippedMsgIds] = useState<Set<number>>(new Set());
  const chatRef = useRef<HTMLDivElement>(null);
  const actionTimestamps = useRef<number[]>([]);

  // ── Typing indicator + read receipts
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [seenMsgId, setSeenMsgId]         = useState<number | null>(null);

  // ── Lounge streak (consecutive days) ─────────────────────────────────────
  const [loungeStreak] = useState<number>(() => {
    try {
      const last  = localStorage.getItem("lounge_last_visit");
      const saved = parseInt(localStorage.getItem("lounge_streak") ?? "0") || 0;
      const today = new Date().toDateString();
      const yest  = new Date(Date.now() - 86_400_000).toDateString();
      if (last === today) return saved || 1;
      const next = last === yest ? saved + 1 : 1;
      localStorage.setItem("lounge_last_visit", today);
      localStorage.setItem("lounge_streak", String(next));
      return next;
    } catch { return 1; }
  });

  // ── Lounge stats sheet
  const [showLoungeStats, setShowLoungeStats] = useState(false);

  // ── Leave-table goodbye note
  const [showLeaveNote, setShowLeaveNote]   = useState(false);
  const [leaveNoteText, setLeaveNoteText]   = useState("");

  // Rate limiter — call on every paid action
  const recordAction = useCallback(() => {
    const now = Date.now();
    actionTimestamps.current = [...actionTimestamps.current.filter(t => now - t < 15_000), now];
    if (actionTimestamps.current.length >= 3) {
      actionTimestamps.current = [];
      setTimeout(() => {
        setChatMsgs(prev => [...prev, { id: Date.now(), from: "butler", text: "A moment, if I may — the lounge is best enjoyed at a leisurely pace. Your requests are noted and being attended to." }]);
      }, 600);
    }
  }, []);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(getMorningTime()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Rotation — partial swap so every online guest gets fair exposure
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev > 1000) return prev - 1000;
        // Time to rotate: mark current visible as shown, swap in fresh faces
        setVisible(current => {
          const nowShown = new Set([...shownIds, ...current.map(v => v.profile.id)]);
          const totalPool = POOL.filter(p =>
            !dismissedIds.has(p.id) &&
            (intlActive || !p.international) &&
            isOnlineHours(p.country),
          );
          // Reset cycle when everyone has been shown
          const nextShown = nowShown.size >= totalPool.length ? new Set<string>() : nowShown;
          setShownIds(nextShown);

          // Keep (take - SWAP_PER_TICK) existing profiles, swap rest for new ones
          const keep = current
            .filter(v => !dismissedIds.has(v.profile.id))
            .slice(0, Math.max(0, current.length - SWAP_PER_TICK));
          const keepIds = new Set(keep.map(v => v.profile.id));
          const fresh = buildVisible(intlActive, new Set([...dismissedIds, ...keepIds]), nextShown, pickedCountry)
            .filter(v => !keepIds.has(v.profile.id))
            .slice(0, SWAP_PER_TICK);
          return [...keep, ...fresh];
        });
        return rnd(ROTATE_MIN, ROTATE_MAX);
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [intlActive, dismissedIds, shownIds]);

  // Butler recommendation on load
  useEffect(() => {
    if (!open) return;
    const rec = pickRec([]);
    setButlerRec(rec);
    setRecMsg(REC_INTROS[Math.floor(Math.random() * REC_INTROS.length)].replace("{name}", rec.ghostId).replace("{city}", rec.city));
    setRecUsedIds([rec.id]);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Butler check-in popup — fires shortly after entering the lounge
  useEffect(() => {
    if (checkinFired.current) return;
    const t = setTimeout(() => {
      if (phase !== "browsing") return;
      setShowCheckin(true);
      checkinFired.current = true;
    }, 3_500);
    return () => clearTimeout(t);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Simulated incoming invite ~30s
  useEffect(() => {
    if (!open || incomingFired.current) return;
    const t = setTimeout(() => {
      if (phase !== "browsing") return;
      const stranger = POOL.find(p => !visible.some(v => v.profile.id === p.id)) ?? POOL[14];
      setIncomingInvite(stranger);
      setIncomingMsg(pickInviteMsg(stranger));
      incomingFired.current = true;
    }, rnd(28_000, 40_000));
    return () => clearTimeout(t);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Simulated received coffee after ~45s — pick a random sender
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const sender = POOL[Math.floor(Math.random() * POOL.length)];
      setCoffeeFrom(sender);
      setReceivedCoffee(true);
    }, rnd(40_000, 60_000));
    return () => clearTimeout(t);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMsgs]);

  // ── Unlock international guests ──────────────────────────────────────────────
  const unlockIntl = useCallback(() => {
    if (!canAfford(INTL_COST)) return;
    deductCoins(INTL_COST, "International breakfast guests");
    setIntlUnlocked(true);
    setIntlActive(true);
    setVisible(buildVisible(true, dismissedIds, shownIds, pickedCountry));
    setShowCheckin(false);
  }, [canAfford, deductCoins]); void unlockIntl;

  // ── Get extra butler rec ─────────────────────────────────────────────────────
  const getExtraRec = useCallback(() => {
    if (!canAfford(EXTRA_REC_COST)) return;
    deductCoins(EXTRA_REC_COST, "Butler extra recommendation");
    setExtraRecLoading(true);
    setTimeout(() => {
      const rec = pickRec(recUsedIds);
      setButlerRec(rec);
      setRecMsg(REC_INTROS[Math.floor(Math.random() * REC_INTROS.length)].replace("{name}", rec.ghostId).replace("{city}", rec.city));
      setRecUsedIds(prev => [...prev, rec.id]);
      setExtraRecLoading(false);
    }, 1_200);
  }, [canAfford, deductCoins, recUsedIds]);

  // ── Send invite ──────────────────────────────────────────────────────────────
  const handleSendInvite = useCallback(() => {
    if (!selectedProfile) return;
    const hasNote = inviteNote.trim().length > 0;
    if (hasNote && !canAfford(NOTE_COST)) return;
    const invited = selectedProfile;
    if (hasNote) deductCoins(NOTE_COST, `Morning note to ${invited.ghostId}`);
    setPartner(invited);
    setSelectedProfile(null);
    setInviteNote("");
    setPhase("invite-pending");

    const accept = Math.random() < 0.70;
    setTimeout(() => {
      if (accept) {
        setPhase("at-table");
        setChatMsgs([{ id: 1, from: "butler", text: `Your table is set. ${invited.ghostId} is now live in chat. 🍳`, showTip: true }]);
        setMsgId(2);
        setTimeout(() => {
          const reply = PARTNER_REPLIES[Math.floor(Math.random() * PARTNER_REPLIES.length)];
          setChatMsgs(prev => [...prev, { id: Date.now(), from: "them", text: reply }]);
        }, 3_000);
      } else {
        setDismissedIds(prev => new Set([...prev, invited.id]));
        setVisible(prev => prev.filter(v => v.profile.id !== invited.id));
        const decline = SOFT_DECLINES[Math.floor(Math.random() * SOFT_DECLINES.length)];
        setRefuseMsg(`${invited.ghostId} ${decline}`);
        setPhase("refused");
        setTimeout(() => { setPhase("browsing"); setPartner(null); setRefuseMsg(""); }, 4_000);
      }
    }, rnd(4_000, 8_000));
  }, [selectedProfile, canAfford, deductCoins]);

  // ── Accept incoming ──────────────────────────────────────────────────────────
  const acceptIncoming = useCallback(() => {
    if (!incomingInvite) return;
    const p = incomingInvite;
    setPartner(p);
    setIncomingInvite(null);
    setPhase("at-table");
    setChatMsgs([{ id: 1, from: "butler", text: `Welcome to your table. ${p.ghostId} is now live in chat. 🍳`, showTip: true }]);
    setMsgId(2);
    setTimeout(() => {
      const reply = PARTNER_REPLIES[Math.floor(Math.random() * PARTNER_REPLIES.length)];
      setChatMsgs(prev => [...prev, { id: Date.now(), from: "them", text: reply }]);
    }, 2_000);
  }, [incomingInvite]);

  const declineIncoming = useCallback(() => {
    if (!incomingInvite) return;
    const declined = incomingInvite;
    setDismissedIds(prev => new Set([...prev, declined.id]));
    setVisible(prev => prev.filter(v => v.profile.id !== declined.id));
    setIncomingInvite(null);
    setDeclineMsg(`Thank you for your time. We've let ${declined.ghostId} know you won't be joining them this morning. Enjoy your breakfast.`);
    setTimeout(() => setDeclineMsg(null), 30_000);
  }, [incomingInvite]);

  // ── Invite 3rd guest ─────────────────────────────────────────────────────────
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
    // Butler notifies the chat that invite was sent
    setChatMsgs(prev => [...prev, {
      id: Date.now(), from: "butler",
      text: `I have sent ${third.ghostId} an invitation to join your table. They can accept or decline. ${hasNote ? "Your personal note has been delivered privately." : ""}`,
    }]);
    // Simulate partner also inviting someone after a delay
    setTimeout(() => {
      setPartnerInvited(true);
    }, rnd(8_000, 15_000));
    setTimeout(() => {
      const accept = Math.random() < 0.65;
      if (accept) {
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

  // ── Leave a coffee ───────────────────────────────────────────────────────────
  const sendCoffee = useCallback((profileId: string, ghostId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (coffeesSent.has(profileId) || !canAfford(COFFEE_COST)) return;
    deductCoins(COFFEE_COST, `Coffee for ${ghostId}`);
    recordAction();
    setCoffeesSent(prev => new Set([...prev, profileId]));
    setCoffeeToast(`☕ Coffee sent to ${ghostId} anonymously`);
    setTimeout(() => setCoffeeToast(null), 30_000);
    // Simulate guest receiving the coffee after a short delay
    const delay = 4_000 + Math.random() * 6_000;
    setTimeout(() => setCoffeeReceivedIds(prev => new Set([...prev, profileId])), delay);
  }, [coffeesSent, canAfford, deductCoins]);

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const sendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text || !canAfford(CHAT_COST)) return;
    deductCoins(CHAT_COST, "Breakfast table chat");
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
  }, [chatInput, canAfford, deductCoins, msgId, groupPhase]);

  const tipButler = useCallback(() => {
    if (!canAfford(TIP_COST) || butlerTipped) return;
    deductCoins(TIP_COST, "Butler tip at breakfast");
    setButlerTipped(true);
    const msg = BUTLER_SURPRISE_MSGS[Math.floor(Math.random() * BUTLER_SURPRISE_MSGS.length)];
    setChatMsgs(prev => [...prev, { id: Date.now(), from: "butler", text: msg }]);
  }, [canAfford, deductCoins, butlerTipped]);

  const leaveTable = () => setShowLeaveNote(true);

  const confirmLeave = (note: string) => {
    if (note.trim() && partner) {
      setChatMsgs(prev => [...prev, {
        id: Date.now(), from: "butler",
        text: `You left a farewell note for ${partner.ghostId}: "${note.trim()}"`,
      }]);
    }
    setPhase("browsing"); setPartner(null); setGroupPartner(null);
    setGroupPhase("none"); setChatMsgs([]); setChatInput(""); setButlerTipped(false);
    setPartnerTyping(false); setSeenMsgId(null);
    setShowLeaveNote(false); setLeaveNoteText("");
  };

  const fmtCountdown = () => {
    const m = Math.floor(countdown / 60_000);
    const s = Math.floor((countdown % 60_000) / 1_000);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const available = visible.filter(v => v.status === "available");
  const atTable   = visible.filter(v => v.status === "at-table");
  const locked    = phase === "invite-pending" || phase === "at-table";


  // ════════════════════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════════════════════
  // OPTED-OUT VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (!loungeOptIn) {
    return (
      <div style={{ minHeight: "100dvh", background: "#08080e", color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", height: 200, overflow: "hidden", flexShrink: 0 }}>
          <img src={LOUNGE_IMG} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,14,0.4) 0%, #08080e 100%)" }} />
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => navigate(-1)}
            style={{ position: "absolute", top: "calc(env(safe-area-inset-top,16px) + 10px)", left: 16, width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.7)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</motion.button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <img src={BUTLER_IMG} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.35)" }} />
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#d4af37", letterSpacing: "0.12em", textTransform: "uppercase" }}>Mr. Butla</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>Breakfast Lounge</p>
            </div>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 900, color: "#fff" }}>You are opted out</p>
          <p style={{ margin: "0 0 28px", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
            Your profile is not visible in the Breakfast Lounge and you will not receive table invitations. You may re-join at any time from the side menu.
          </p>
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={() => {
              try { localStorage.setItem("breakfast_lounge_enabled", "true"); } catch {}
              setLoungeOptIn(true);
            }}
            style={{ padding: "14px 32px", background: "linear-gradient(135deg, #78350f, #d97706, #fbbf24)", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 14, fontWeight: 900, color: "#0a0500" }}>
            Re-join the Breakfast Lounge
          </motion.button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CLOSED VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (!open) {
    return (
      <div style={{ minHeight: "100dvh", background: "#08080e", color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", height: 220, overflow: "hidden", flexShrink: 0 }}>
          <img src={LOUNGE_IMG} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,14,0.4) 0%, rgba(8,8,14,0.95) 100%)" }} />
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => navigate(-1)}
            style={{ position: "absolute", top: "calc(env(safe-area-inset-top,16px) + 10px)", left: 16, width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.7)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </motion.button>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍳</div>
          <p style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#fff" }}>Breakfast Lounge</p>
          <p style={{ margin: "0 0 4px", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
            The lounge is open daily
          </p>
          <p style={{ margin: "0 0 28px", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
            {LOUNGE_OPEN_H}:00 AM — {LOUNGE_CLOSE_H}:00 AM
          </p>
          <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, padding: "16px 24px" }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#d4af37", letterSpacing: "0.1em", textTransform: "uppercase" }}>Opens in</p>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff" }}>{getOpenCountdown()}</p>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AT-TABLE VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "at-table" && partner) {
    const guestCount = groupPhase === "joined" && groupPartner ? 3 : 2;
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#08080e", fontFamily: "system-ui, sans-serif", color: "#fff" }}>

        {/* Fixed header */}
        <div style={{ flexShrink: 0, background: "rgba(6,6,10,0.99)", borderBottom: "1px solid rgba(212,175,55,0.12)", paddingBottom: 14 }}>
          {/* Gold top stripe */}
          <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #d4af37, transparent)", flexShrink: 0 }} />
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px 10px", paddingTop: "calc(env(safe-area-inset-top,0px) + 12px)" }}>
            <motion.button whileTap={{ scale: 0.92 }} onClick={leaveTable}
              style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              ←
            </motion.button>
            <LoungeAvatar p={partner} size={38} border="2px solid rgba(212,175,55,0.45)" />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#d4af37" }}>{partner.ghostId}</p>
              <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{guestCount} guests · {partner.flag} {partner.city}</p>
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

        {/* Messages */}
        <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "14px 14px 0" }}>
          {chatMsgs.map(msg => {
            const isMe = msg.from === "me";
            const isButler = msg.from === "butler";
            const isThem2 = msg.from === "them2";
            const liked = likedMsgs.has(String(msg.id));
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
                    {/* Avatar left */}
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
                    {/* Like button */}
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
          {partnerTyping && partner && (
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

        {/* Input */}
        <div style={{ flexShrink: 0, padding: "10px 14px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 10px)", borderTop: "1px solid rgba(255,255,255,0.07)", background: "rgba(8,8,14,0.97)" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }}}
              placeholder="Type a message…" maxLength={200}
              style={{ flex: 1, height: 44, borderRadius: 22, boxSizing: "border-box", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, padding: "0 16px", outline: "none", caretColor: "#d4af37" }} />
            <motion.button whileTap={{ scale: 0.93 }} onClick={sendChat}
              disabled={!chatInput.trim() || !canAfford(CHAT_COST)}
              style={{ height: 44, padding: "0 16px", borderRadius: 22, flexShrink: 0, background: chatInput.trim() && canAfford(CHAT_COST) ? "linear-gradient(135deg, #16a34a, #22c55e)" : "rgba(255,255,255,0.05)", border: "none", cursor: chatInput.trim() && canAfford(CHAT_COST) ? "pointer" : "default", fontSize: 12, fontWeight: 800, color: chatInput.trim() && canAfford(CHAT_COST) ? "#fff" : "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 5 }}>
              Send <span style={{ fontSize: 10, opacity: 0.7 }}>🪙{CHAT_COST}</span>
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

        {/* Table settings / invite sheet */}
        <AnimatePresence>
          {showGroupPicker && (
            <>
              <motion.div key="gp-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => { setShowGroupPicker(false); setTableSelectedGuest(null); setTableInviteNote(""); }}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 400, backdropFilter: "blur(8px)" }} />
              <motion.div key="gp-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 401, background: "#0a0a0f", borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", maxHeight: "88dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Gold top rim */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, #d4af37, rgba(212,175,55,0.4), transparent)" }} />
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "16px auto 14px" }} />

                <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 8px" }}>
                  {/* Mr. Butla header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <img src={BUTLER_IMG} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.5)", flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#d4af37" }}>Invite a Guest</p>
                      <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.45 }}>
                        Each guest at the table may invite one person. Optionally add a private note only they will see.
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
                        {available.filter(v => v.profile.id !== partner?.id).map(({ profile: p }) => {
                          const isSel = tableSelectedGuest?.id === p.id;
                          return (
                            <motion.div key={p.id} whileTap={{ scale: 0.97 }}
                              onClick={() => setTableSelectedGuest(isSel ? null : p)}
                              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", borderRadius: 14, cursor: "pointer", background: isSel ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)", border: isSel ? "1px solid rgba(212,175,55,0.45)" : "1px solid rgba(255,255,255,0.07)", boxShadow: isSel ? "0 0 12px rgba(212,175,55,0.15)" : "none", transition: "all 0.18s" }}>
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

              {/* Note + sticky send */}
              {!myTableInviteId && (
                <div style={{ flexShrink: 0, padding: "10px 20px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 14px)", borderTop: "1px solid rgba(212,175,55,0.1)", background: "#0a0a0f" }}>
                  {/* Note field */}
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
                  {/* Send button — grey until guest selected, gold when ready */}
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

  // ════════════════════════════════════════════════════════════════════════════
  // BROWSING VIEW
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100dvh", background: "#08080e", color: "#fff", fontFamily: "system-ui, sans-serif", overflowX: "hidden" }}>

      {/* Hero */}
      <div style={{ position: "relative", height: 210, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, #d4af37, rgba(212,175,55,0.5), transparent)", zIndex: 10 }} />
        <img src={LOUNGE_IMG} alt="Breakfast Lounge" style={{ width: "100%", height: "110%", objectFit: "cover", objectPosition: "center 30%" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,14,0.2) 0%, rgba(8,8,14,0.6) 60%, #08080e 100%)" }} />
        {/* Host figure — left side, behind the lounge title */}
        <img
          src="https://ik.imagekit.io/7grri5v7d/sdfasdfasdfrrrr-removebg-preview.png?updatedAt=1774275671975"
          alt=""
          style={{ position: "absolute", bottom: 0, left: -8, height: "86%", objectFit: "contain", objectPosition: "bottom left", opacity: 0.78, pointerEvents: "none", userSelect: "none", zIndex: 1 }}
        />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(env(safe-area-inset-top,16px) + 10px) 16px 0", zIndex: 2 }}>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => navigate(-1)}
            style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.7)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</motion.button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CoinBalanceChip size="md" />
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowLoungeMenu(true)}
              style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.75)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ☰
            </motion.button>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 14, left: 16, zIndex: 2 }}>
          <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 700, color: "#d4af37", letterSpacing: "0.16em", textTransform: "uppercase" }}>Mr. Butla</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
            {pickedCountry ? `${pickedCountry} Lounge` : "Breakfast Lounge"}
          </p>
        </div>
        <div style={{ position: "absolute", bottom: 18, right: 14, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", zIndex: 2 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.65)" }}>{clock}</p>
        </div>
      </div>

      <div style={{ padding: "14px 13px calc(env(safe-area-inset-bottom,0px) + 32px)" }}>

        {/* Received coffee toast */}
        <AnimatePresence>
          {receivedCoffee && (
            <motion.div
              key="coffee-recv"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onClick={() => setShowCoffeeReply(true)}
              style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 14, overflow: "hidden", marginBottom: 10, cursor: "pointer", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #d4af37, rgba(212,175,55,0.4))", borderRadius: "14px 14px 0 0" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 14px 11px", width: "100%" }}>
                <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}>
                  <img src="https://ik.imagekit.io/7grri5v7d/Red%20mug%20with%20steam%20swirls.png" alt="coffee" style={{ width: 28, height: 28, objectFit: "contain", display: "block" }} />
                </motion.div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fbbf24" }}>Someone left you a coffee</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                    {coffeeReplySent ? `You replied: "${coffeeReplySent}"` : "Tap to see who — and reply"}
                  </p>
                </div>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>›</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decline confirmation message */}
        <AnimatePresence>
          {declineMsg && (
            <motion.div key="decline-msg" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
              <img src={BUTLER_IMG} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{declineMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invite pending / refused */}
        <AnimatePresence>
          {phase === "invite-pending" && partner && (
            <motion.div key="pending" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.22)", borderRadius: 14, padding: "12px 14px", marginBottom: 12 }}>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fbbf24" }}>Invite pending</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Mr. Butla is delivering your invite to {partner.ghostId}…</p>
              </div>
              <img src={BUTLER_IMG} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
            </motion.div>
          )}
          {phase === "refused" && refuseMsg && (
            <motion.div key="refused" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 14px", marginBottom: 12 }}>
              <img src={BUTLER_IMG} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Mr. Butla</p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.55 }}>{refuseMsg}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BUTLER RECOMMENDATION ── */}
        {butlerRec && phase === "browsing" && (
          <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, padding: "13px 14px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <img src={BUTLER_IMG} alt="" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} />
              <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#d4af37", letterSpacing: "0.1em", textTransform: "uppercase", flex: 1 }}>Mr. Butla's Pick</p>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fbbf24", lineHeight: 1 }}>
                  {42 + (butlerRec.seed % 57)}%
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 8, fontWeight: 700, color: "rgba(212,175,55,0.55)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Match</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <LoungeAvatar p={butlerRec} size={44} status="available" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{butlerRec.ghostId}</p>
                <p style={{ margin: "2px 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{butlerRec.flag} {butlerRec.city} · Age {butlerRec.age}</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>"{butlerRec.mood}"</p>
              </div>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(212,175,55,0.65)", fontStyle: "italic", lineHeight: 1.5 }}>"{recMsg}"</p>
            <div style={{ display: "flex", gap: 8 }}>
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={() => { setSelectedProfile(butlerRec); setInviteNote(""); }}
                disabled={locked}
                style={{ flex: 2, padding: "11px", background: locked ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #78350f, #d97706, #fbbf24)", border: "none", borderRadius: 12, cursor: locked ? "default" : "pointer", fontSize: 13, fontWeight: 900, color: locked ? "rgba(255,255,255,0.2)" : "#0a0500" }}>
                View & Invite
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={getExtraRec}
                disabled={!canAfford(EXTRA_REC_COST) || extraRecLoading}
                style={{ flex: 1, padding: "11px", background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 12, cursor: canAfford(EXTRA_REC_COST) ? "pointer" : "default", fontSize: 11, fontWeight: 800, color: canAfford(EXTRA_REC_COST) ? "#d4af37" : "rgba(255,255,255,0.2)" }}>
                {extraRecLoading ? "…" : `New pick 🪙${EXTRA_REC_COST}`}
              </motion.button>
            </div>
          </div>
        )}

        {/* Status strip + countdown */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11, gap: 8 }}>
          {/* View toggle — left, larger */}
          <div style={{ display: "flex", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setFloorView(false)}
              style={{ padding: "9px 18px", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer", background: !floorView ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.03)", color: !floorView ? "#d4af37" : "rgba(255,255,255,0.3)" }}>
              ≡ List
            </motion.button>
            <div style={{ width: 1, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => setFloorView(true)}
              style={{ padding: "9px 18px", fontSize: 13, fontWeight: 800, border: "none", cursor: "pointer", background: floorView ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.03)", color: floorView ? "#d4af37" : "rgba(255,255,255,0.3)" }}>
              ⊞ Floor
            </motion.button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "3px 10px" }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80" }} />
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>Refreshes {fmtCountdown()}</p>
          </div>
        </div>

        {/* Active region / redirect card */}
        {(() => {
          const region = getBusiestBreakfastRegion();
          if (!region) return null;
          const regionDef = REGIONS.find(r => r.name === region.name);
          const onlineCount = POOL.filter(p =>
            regionDef?.countries.includes(p.country) && !dismissedIds.has(p.id)
          ).length;
          const localBreakfast = available.length >= 3;
          if (localBreakfast && !showRedirect) return null;
          if (!localBreakfast) return (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 14, padding: "13px 14px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <img src={BUTLER_IMG} alt="" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} />
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#d4af37", letterSpacing: "0.1em", textTransform: "uppercase", flex: 1 }}>Mr. Butla</p>
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                  style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                The lounge is quiet here right now. <span style={{ color: "#fbbf24", fontWeight: 800 }}>{region.flag} {region.name}</span> is buzzing — {onlineCount} guests are at breakfast there this morning.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => { setIntlUnlocked(true); setIntlActive(true); setVisible(buildVisible(true, dismissedIds, shownIds, pickedCountry)); setShowRedirect(true); }}
                  style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg, #78350f, #d97706, #fbbf24)", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 900, color: "#0a0500" }}>
                  Take me there
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => setShowRedirect(true)}
                  style={{ flex: 1, padding: "11px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, cursor: "pointer", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>
                  Stay here
                </motion.button>
              </div>
            </motion.div>
          );
          return null;
        })()}

        {/* ═══ FLOOR VIEW — rendered as full-screen overlay below ═══ */}

        {/* Available guests + At a Table (list view only) */}
        {!floorView && (<>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          {available.map(({ profile: p }) => {
            return (
              <motion.div key={p.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                style={{ borderRadius: 16, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", overflow: "hidden", opacity: locked ? 0.45 : 1 }}>

                {/* Main row */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", cursor: locked ? "default" : "pointer" }}
                  onClick={() => { if (!locked) { setSelectedProfile(p); setInviteNote(""); }}}>

                  {/* Avatar */}
                  <LoungeAvatar p={p} size={54} status="available" />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3, flexWrap: "wrap" }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.ghostId}, {p.age}
                      </p>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#4ade80", background: "rgba(74,222,128,0.12)", borderRadius: 20, padding: "2px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>
                        🟢 Available
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>📍 {p.flag} {p.city}, {p.country}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{p.floor} Floor</p>
                    <p style={{ margin: "3px 0 0", fontSize: 10, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>"{p.mood}"</p>
                    {(() => { const lp = loungePresence(p.seed); return (
                      <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, color: "rgba(212,175,55,0.7)", fontWeight: 700 }}>🕐 Usually {lp.time}</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>·</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>🍽️ {lp.tables} table{lp.tables > 1 ? "s" : ""} this week</span>
                      </div>
                    ); })()}
                  </div>

                  {/* Match % — top right */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                    <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.22)", borderRadius: 10, padding: "5px 9px", textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#d4af37", lineHeight: 1 }}>{42 + (p.seed % 51)}%</p>
                      <p style={{ margin: "2px 0 0", fontSize: 8, fontWeight: 700, color: "rgba(212,175,55,0.6)", letterSpacing: "0.08em" }}>MATCH</p>
                    </div>
                  </div>
                </div>

                {/* Invite + coffee strip */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "8px 12px", display: "flex", gap: 8 }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { if (!locked) { setSelectedProfile(p); setInviteNote(""); }}}
                    disabled={locked}
                    style={{ flex: 1, padding: "11px", borderRadius: 12, border: "none", background: locked ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #78350f, #d97706, #fbbf24)", color: locked ? "rgba(255,255,255,0.2)" : "#0a0500", fontSize: 13, fontWeight: 900, cursor: locked ? "default" : "pointer" }}>
                    Invite to Breakfast · <span style={{ opacity: 0.7 }}>🪙{INVITE_COST}</span>
                  </motion.button>

                  {/* Coffee button + receipt status */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <motion.button whileTap={{ scale: 0.92 }}
                      onClick={e => sendCoffee(p.id, p.ghostId, e)}
                      disabled={coffeesSent.has(p.id) || !canAfford(COFFEE_COST) || locked}
                      style={{ height: 40, borderRadius: 10, border: "none", background: coffeesSent.has(p.id) ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #78350f, #d97706, #fbbf24)", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "0 10px", cursor: coffeesSent.has(p.id) || locked ? "default" : "pointer" }}>
                      {coffeesSent.has(p.id)
                        ? <img src="https://ik.imagekit.io/7grri5v7d/Red%20mug%20with%20steam%20swirls.png" alt="coffee" style={{ width: 20, height: 20, objectFit: "contain", opacity: 0.35 }} />
                        : <><img src="https://ik.imagekit.io/7grri5v7d/Red%20mug%20with%20steam%20swirls.png" alt="coffee" style={{ width: 20, height: 20, objectFit: "contain" }} /><span style={{ fontSize: 11, fontWeight: 900, color: "#0a0500" }}>Send</span></>}
                    </motion.button>
                    {coffeesSent.has(p.id) && (
                      <AnimatePresence mode="wait">
                        {coffeeReceivedIds.has(p.id) ? (
                          <motion.div key="received" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <img src="https://ik.imagekit.io/7grri5v7d/Red%20mug%20with%20steam%20swirls.png" alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#22c55e" }}>Received</span>
                          </motion.div>
                        ) : (
                          <motion.div key="pending" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <img src="https://ik.imagekit.io/7grri5v7d/Red%20mug%20with%20steam%20swirls.png" alt="" style={{ width: 14, height: 14, objectFit: "contain", opacity: 0.3 }} />
                            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)" }}>Not yet</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
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
              {atTable.map(({ profile: p, tableWith }) => {
                return (
                  <div key={p.id} style={{ borderRadius: 16, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", overflow: "hidden", opacity: 0.5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px" }}>
                      <LoungeAvatar p={p} size={54} status="at-table" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>{p.ghostId}, {p.age}</p>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "#f97316", background: "rgba(249,115,22,0.1)", borderRadius: 20, padding: "2px 8px" }}>🍽️ At a table</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.28)" }}>📍 {p.flag} {p.city}, {p.country}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Sitting with {tableWith}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
        </>)}
      </div>

      {/* ════ PROFILE POPUP ════ */}
      <AnimatePresence>
        {selectedProfile && (
          <>
            <motion.div key="pp-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedProfile(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 200, backdropFilter: "blur(7px)" }} />
            <motion.div key="pp-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201, background: "#0a0a0f", borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", maxHeight: "88dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Gold top rim */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "22px 22px 0 0", background: "linear-gradient(90deg, transparent, #d4af37, rgba(212,175,55,0.4), transparent)" }} />

              {/* Fixed top: handle + header + guest carousel */}
              <div style={{ flexShrink: 0, padding: "14px 18px 0" }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 14px" }} />

                {/* Mr. Butla intro */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <img src={BUTLER_IMG} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.5)", flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#d4af37" }}>Breakfast Invitation</p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", fontStyle: "italic", lineHeight: 1.5 }}>
                      Tap a guest to select them, then scroll down to send
                    </p>
                  </div>
                </div>

                {/* Guest selector — horizontal scroll */}
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "#d4af37", letterSpacing: "0.12em", textTransform: "uppercase" }}>Guests Available</p>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
                  {visible.filter(v => v.status === "available").map(({ profile: p }) => {
                    const isSel = selectedProfile.id === p.id;
                    return (
                      <button key={p.id} onClick={() => setSelectedProfile(p)}
                        style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <div style={{ position: "relative" }}>
                          <div style={{
                            width: 54, height: 54, borderRadius: "50%", overflow: "hidden",
                            border: isSel ? "3px solid #d4af37" : "2.5px solid #22c55e",
                            boxSizing: "border-box",
                            boxShadow: isSel ? "0 0 0 3px rgba(212,175,55,0.35), 0 0 14px rgba(212,175,55,0.4)" : "none",
                            transition: "box-shadow 0.2s, border-color 0.2s",
                          }}>
                            <img src={p.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                          </div>
                          <motion.div
                            animate={{ opacity: [1, 0.2, 1], scale: [1, 1.25, 1] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                            style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: "#22c55e", border: "1.5px solid #08080e" }}
                          />
                        </div>
                        <p style={{ margin: 0, fontSize: 9, fontWeight: isSel ? 800 : 600, color: isSel ? "#d4af37" : "rgba(255,255,255,0.3)", maxWidth: 58, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.ghostId.replace("Guest-", "")}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable middle: selected guest card + note */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 8px" }}>

                {/* Selected guest info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 13, padding: "12px 12px", boxShadow: "0 0 12px rgba(212,175,55,0.1)" }}>
                  <LoungeAvatar p={selectedProfile} size={44} status="available" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>{selectedProfile.ghostId}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.38)" }}>
                      {selectedProfile.flag} {selectedProfile.city} · Age {selectedProfile.age} · {selectedProfile.floor}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.4)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{selectedProfile.mood}"</p>
                    {(() => { const lp = loungePresence(selectedProfile.seed); return (
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: 9, color: "rgba(212,175,55,0.75)", fontWeight: 700 }}>🕐 Usually {lp.time}</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>·</span>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>🍽️ {lp.tables} table{lp.tables > 1 ? "s" : ""} this week</span>
                      </div>
                    ); })()}
                  </div>
                  <div style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 10, padding: "5px 9px", textAlign: "center", flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#d4af37", lineHeight: 1 }}>{42 + (selectedProfile.seed % 51)}%</p>
                    <p style={{ margin: "2px 0 0", fontSize: 8, fontWeight: 700, color: "rgba(212,175,55,0.6)", letterSpacing: "0.08em" }}>MATCH</p>
                  </div>
                </div>

                {/* Note label + counter */}
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    <span style={{ color: "#d4af37" }}>Morning note</span> <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "rgba(255,255,255,0.6)" }}>— optional · 🪙{NOTE_COST}</span>
                  </p>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{inviteNote.length}/500</span>
                </div>
                <textarea value={inviteNote} onChange={e => setInviteNote(e.target.value)}
                  placeholder="e.g. Good morning, your profile caught my eye and I would like to invite you to join me for a breakfast chat." maxLength={500} rows={4}
                  style={{ width: "100%", borderRadius: 11, boxSizing: "border-box", background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.18)", color: "#fff", fontSize: 13, padding: "10px 14px", outline: "none", caretColor: "#d4af37", resize: "none", lineHeight: 1.6, fontFamily: "inherit" }} />
              </div>

              {/* Sticky send button */}
              <div style={{ flexShrink: 0, padding: "10px 18px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 14px)", borderTop: "1px solid rgba(212,175,55,0.1)", background: "#0a0a0f" }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSendInvite}
                  disabled={inviteNote.trim().length > 0 && !canAfford(NOTE_COST)}
                  style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg, #78350f, #d97706, #fbbf24)", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 14, fontWeight: 900, color: "#0a0500", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span>Send Invitation</span>
                  <span style={{ fontSize: 11, opacity: 0.65 }}>
                    {inviteNote.trim().length > 0 ? `· 🪙${NOTE_COST}` : "· Free"}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════ BUTLER CHECK-IN ════ */}
      <AnimatePresence>
        {showCheckin && (
          <>
            <motion.div key="ci-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 350, backdropFilter: "blur(10px)" }} />
            <motion.div key="ci-popup" initial={{ opacity: 0, y: 40, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }} transition={{ type: "spring", damping: 26, stiffness: 280 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 351, background: "#0a0a0f", borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", padding: "20px 20px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)", overflow: "hidden" }}>

              {/* Gold top rim */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "22px 22px 0 0", background: "linear-gradient(90deg, transparent, #d4af37, rgba(212,175,55,0.4), transparent)" }} />

              {/* Butler header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img src={BUTLER_IMG} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.5)", flexShrink: 0 }} />
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>🔔</div>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#d4af37", letterSpacing: "0.12em", textTransform: "uppercase" }}>Mr. Butla</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, fontStyle: "italic" }}>
                    "Good morning. Allow me to arrange your seating."
                  </p>
                </div>
              </div>

              {/* Lounge intro blurb */}
              <div style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
                  You are automatically seated in the Breakfast Lounge and visible to guests. Browse guests and send invitations, or wait to receive one. Optionally set a time so guests know when to expect you.
                </p>
              </div>

              {/* Optional time picker */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "#d4af37", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Optional — set your arrival time
                </p>
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={() => setShowSeatingPicker(!showSeatingPicker)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: seatingTime ? "rgba(74,222,128,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${seatingTime ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: seatingTime ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${seatingTime ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.07)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🕐</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: seatingTime ? "#4ade80" : "#fff" }}>
                      {seatingTime ? `Reserved · ${seatingTime}` : "Select a time"}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                      Guests will see when you plan to be at the table
                    </p>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 16 }}>{showSeatingPicker ? "∧" : "›"}</span>
                </motion.button>

                {showSeatingPicker && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    style={{ display: "flex", gap: 7, flexWrap: "wrap", padding: "10px 4px 4px" }}>
                    {SEATING_TIMES.map(t => (
                      <motion.button key={t} whileTap={{ scale: 0.94 }}
                        onClick={() => { setSeatingTime(t); setShowSeatingPicker(false); }}
                        style={{ padding: "8px 14px", borderRadius: 20, cursor: "pointer", background: seatingTime === t ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${seatingTime === t ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)"}`, color: seatingTime === t ? "#4ade80" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700 }}>
                        {t}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCheckin(false)}
                style={{ width: "100%", padding: "15px", background: "linear-gradient(135deg, #78350f, #d97706, #fbbf24)", border: "none", borderRadius: 16, cursor: "pointer", fontSize: 14, fontWeight: 900, color: "#0a0500" }}>
                Enter the Lounge
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════ INCOMING INVITE ════ */}
      <AnimatePresence>
        {incomingInvite && phase === "browsing" && (
          <>
            <motion.div key="ii-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 300, backdropFilter: "blur(9px)" }} />
            <motion.div key="ii-popup" initial={{ opacity: 0, y: 40, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30 }} transition={{ type: "spring", damping: 26, stiffness: 280 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 301, background: "#0a0a0f", borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", padding: "20px 20px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)", overflow: "hidden" }}>
              {/* Gold top rim */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "22px 22px 0 0", background: "linear-gradient(90deg, transparent, #d4af37, rgba(212,175,55,0.4), transparent)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ position: "relative" }}>
                  <img src={BUTLER_IMG} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.5)", flexShrink: 0 }} />
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>🔔</div>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#d4af37", letterSpacing: "0.1em", textTransform: "uppercase" }}>Breakfast Invitation</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>A message from the breakfast lounge</p>
                </div>
              </div>
              <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 14, padding: "13px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", border: "2px solid #22c55e", boxSizing: "border-box", flexShrink: 0 }}>
                    <img src="https://ik.imagekit.io/7grri5v7d/ewrwerwerwer-removebg-preview.png?updatedAt=1774288645920" alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>{incomingInvite.ghostId}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{incomingInvite.flag} {incomingInvite.city}, {incomingInvite.country}</p>
                  </div>
                </div>
                <p style={{ margin: "0 0 5px", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                  {incomingMsg}
                </p>
                <p style={{ margin: 0, fontSize: 11, fontStyle: "italic", color: "rgba(255,255,255,0.28)" }}>"{incomingInvite.mood}"</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <motion.button whileTap={{ scale: 0.95 }} onClick={declineIncoming}
                  style={{ flex: 1, padding: "14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, cursor: "pointer", fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.35)" }}>Decline</motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={acceptIncoming}
                  style={{ flex: 2, padding: "14px", background: "linear-gradient(135deg, #78350f, #d97706, #fbbf24)", border: "none", borderRadius: 14, cursor: "pointer", fontSize: 14, fontWeight: 900, color: "#0a0500", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  Accept Invitation
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════ COFFEE REPLY SHEET ════ */}
      <AnimatePresence>
        {showCoffeeReply && coffeeFrom && (
          <>
            <motion.div key="cr-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCoffeeReply(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 400, backdropFilter: "blur(8px)" }} />
            <motion.div key="cr-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 401, background: "#0a0a0f", borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)", overflow: "hidden" }}>
              {/* Gold top rim */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "22px 22px 0 0", background: "linear-gradient(90deg, transparent, #d4af37, rgba(212,175,55,0.4), transparent)" }} />
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "14px auto 0" }} />
              <div style={{ padding: "16px 18px 0" }}>

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={BUTLER_IMG} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.5)", display: "block" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#d4af37", letterSpacing: "-0.01em" }}>You Received A Coffee</p>
                    <p style={{ margin: "5px 0 0", fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.6 }}>
                      A guest has sent you a coffee to catch your attention. Show a little warmth — a kind reply goes a long way.
                    </p>
                  </div>
                </div>

                {/* Sender profile */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 16, padding: "14px", marginBottom: 18 }}>
                  <LoungeAvatar p={coffeeFrom} size={56} status="available" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#fff" }}>{coffeeFrom.ghostId}</p>
                    <p style={{ margin: "3px 0 2px", fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
                      {coffeeFrom.flag} {coffeeFrom.city}, {coffeeFrom.country} · {coffeeFrom.floor} Floor · Age {coffeeFrom.age}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: avCol(coffeeFrom.seed), fontStyle: "italic" }}>"{coffeeFrom.mood}"</p>
                  </div>
                </div>

                {/* About */}
                <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, fontStyle: "italic" }}>
                  "{coffeeFrom.about}"
                </p>

                {/* Reply carousel */}
                {coffeeReplySent ? (
                  <div style={{ padding: "4px 0 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px 20px", background: "linear-gradient(135deg, #78350f, #d97706, #fbbf24)", borderRadius: 16 }}>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#0a0500" }}>Reply Sent</p>
                    </div>
                  </div>
                ) : (() => {
                  const isFemaleUser = (() => { try { return localStorage.getItem("ghost_gender") === "Female"; } catch { return false; } })();
                  const CATEGORIES = [
                    { label: "Polite Refuse", responses: [
                      "Thanks for the coffee but I'll pass",
                      "Appreciate it, not feeling a match",
                      "Thank you, wishing you luck here",
                      "That's kind, but not for me",
                      "Thanks, I'll politely decline",
                      "Appreciate the gesture, but no thanks",
                      "Very sweet, but I'll pass",
                      "Thanks for the coffee — not a match",
                      "Kind of you but I'll skip",
                      "Thank you, I'm going to pass",
                    ]},
                    { label: "Flirty", responses: [
                      "Careful… I might want another",
                      "Coffee first… what's next?",
                      "I like how you start things",
                      "Now you have my attention",
                      "Is this your smooth move?",
                      "I might say yes to that coffee",
                      "You're making this interesting",
                      "So… when are we getting the real one?",
                      "Coffee accepted, you're cute",
                      "That's a dangerous opener",
                    ]},
                    { label: "Funny", responses: [
                      "Is it strong coffee? I need help",
                      "I take mine with conversation",
                      "Coffee accepted… donut pending",
                      "Are you bribing me? It's working",
                      "One coffee = one question rule",
                      "Virtual caffeine hit received",
                      "I hope this is premium coffee",
                      "Does this refill automatically?",
                      "Coffee first, personality test next",
                      "This better not be decaf",
                    ]},
                    ...(isFemaleUser ? [{ label: "Her Tone", responses: [
                      "So sweet, thank you",
                      "Made me smile",
                      "That's really thoughtful",
                      "A coffee? I like that",
                      "You're off to a good start",
                      "Thank you, that's cute",
                      "I appreciate that",
                      "Nice move, I like it",
                      "Thanks… I'm intrigued",
                      "That's a lovely surprise",
                    ]}] : [{ label: "His Tone", responses: [
                      "Thanks, I appreciate it",
                      "Nice opener",
                      "Coffee works for me",
                      "I like your style",
                      "Appreciate the coffee",
                      "Good start",
                      "That got my attention",
                      "Smooth move",
                      "I'll take that coffee",
                      "Not bad, I like it",
                    ]}]),
                  ];
                  return (
                    <>
                      <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Choose your reply</p>
                      {/* Category tabs */}
                      <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 10, marginBottom: 2, scrollbarWidth: "none" }}>
                        {CATEGORIES.map((cat, i) => (
                          <button key={cat.label} onClick={() => setCoffeeReplyCategory(i)}
                            style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: `1px solid ${coffeeReplyCategory === i ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.1)"}`, background: coffeeReplyCategory === i ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)", color: coffeeReplyCategory === i ? "#d4af37" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                            {cat.label}
                          </button>
                        ))}
                      </div>
                      {/* Responses */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 220, overflowY: "auto", paddingRight: 2 }}>
                        {CATEGORIES[coffeeReplyCategory].responses.map(text => (
                          <motion.button key={text} whileTap={{ scale: 0.97 }}
                            onClick={() => { setCoffeeReplySent(text); setTimeout(() => setShowCoffeeReply(false), 3_000); }}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 13, cursor: "pointer", textAlign: "left" }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>{text}</p>
                            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", flexShrink: 0, marginLeft: 8 }}>›</span>
                          </motion.button>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════ LOUNGE QUICK MENU ════ */}
      <AnimatePresence>
        {showLoungeMenu && (
          <>
            <motion.div key="lm-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLoungeMenu(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, backdropFilter: "blur(6px)" }} />
            <motion.div key="lm-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 270, zIndex: 601, background: "rgba(8,10,14,0.99)", borderLeft: "1px solid rgba(212,175,55,0.15)", display: "flex", flexDirection: "column", paddingTop: "max(48px, env(safe-area-inset-top, 48px))", paddingBottom: "max(28px, env(safe-area-inset-bottom, 28px))" }}>
              {/* Gold top rim */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, transparent, #d4af37, transparent)" }} />

              {/* Header */}
              <div style={{ padding: "0 18px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={BUTLER_IMG} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(212,175,55,0.45)" }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#d4af37" }}>Lounge Menu</p>
                    <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>Mr. Butla · 2Ghost</p>
                  </div>
                </div>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowLoungeMenu(false)}
                  style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</motion.button>
              </div>
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)", margin: "0 18px 14px" }} />

              {/* Items */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 12px" }}>
                {[
                  { icon: floorView ? "≡" : "⊞", label: floorView ? "List View" : "Floor View", desc: floorView ? "Switch to guest list" : "See who's seated where", action: () => { setFloorView(!floorView); setShowLoungeMenu(false); } },
                  { icon: "☕", label: "Send a Coffee", desc: `Surprise someone · 🪙${COFFEE_COST}`, action: () => { setShowLoungeMenu(false); } },
                  { icon: "🕐", label: "Set Seating Time", desc: seatingTime ? `Reserved: ${seatingTime}` : "Book your breakfast slot", action: () => { setShowLoungeMenu(false); setShowSeatingPicker(true); } },
                  { icon: "📊", label: "My Lounge Stats", desc: `${coffeesSent.size} coffee${coffeesSent.size !== 1 ? "s" : ""} sent · 🔥 ${loungeStreak} day streak`, action: () => { setShowLoungeStats(true); setShowLoungeMenu(false); } },
                  { icon: "🔔", label: "Check-in", desc: "Confirm your seat with Mr. Butla", action: () => { setShowLoungeMenu(false); setShowCheckin(true); } },
                  { icon: "🌍", label: "International Guests", desc: intlActive ? "Showing worldwide guests" : "Local guests only", action: () => { setIntlActive(!intlActive); setVisible(buildVisible(!intlActive, dismissedIds, shownIds, pickedCountry)); setShowLoungeMenu(false); } },
                  { icon: "↩️", label: "Leave the Lounge", desc: "Return to Ghost Mode", action: () => { setShowLoungeMenu(false); navigate(-1); } },
                ].map(item => (
                  <motion.button key={item.label} whileTap={{ scale: 0.97 }} onClick={item.action}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 13, padding: "12px 12px", marginBottom: 7, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{item.label}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.32)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.desc}</p>
                    </div>
                    <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 14, flexShrink: 0 }}>›</span>
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div style={{ padding: "12px 18px 0", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.16)", textAlign: "center" }}>2Ghost Breakfast Lounge · {clock}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════ LOUNGE STATS SHEET ════ */}
      <AnimatePresence>
        {showLoungeStats && (
          <>
            <motion.div key="ls-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLoungeStats(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", zIndex: 600, backdropFilter: "blur(8px)" }} />
            <motion.div key="ls-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 601, background: "#0a0a0f", borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", padding: "20px 20px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)", overflow: "hidden" }}>
              <div style={{ height: 3, position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, transparent, #d4af37, transparent)", borderRadius: "22px 22px 0 0" }} />
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 16px" }} />
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <img src={BUTLER_IMG} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.45)" }} />
                <div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#d4af37" }}>Your Lounge Record</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Compiled by Mr. Butla</p>
                </div>
              </div>
              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { icon: "🔥", value: `${loungeStreak}`, label: `Day${loungeStreak !== 1 ? "s" : ""} in a row`, color: "#f97316" },
                  { icon: "☕", value: `${coffeesSent.size}`, label: "Coffees sent", color: "#d4af37" },
                  { icon: "📬", value: `${coffeeReceivedIds.size}`, label: "Coffees received", color: "#a78bfa" },
                  { icon: "🍽️", value: `${Math.max(1, loungeStreak)}`, label: "Tables this week", color: "#22c55e" },
                ].map(s => (
                  <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                    <p style={{ margin: 0, fontSize: 22 }}>{s.icon}</p>
                    <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
                  </div>
                ))}
              </div>
              {/* Streak badge */}
              {loungeStreak >= 3 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 14, padding: "12px 14px", marginBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>🏅</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#f97316" }}>{loungeStreak >= 7 ? "Week Warrior" : loungeStreak >= 5 ? "Regular" : "Early Regular"}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{loungeStreak} consecutive mornings at the lounge</p>
                  </div>
                </div>
              )}
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowLoungeStats(false)}
                style={{ width: "100%", padding: "14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, cursor: "pointer", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                Close
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════ COFFEE SENT TOAST ════ */}
      <AnimatePresence>
        {coffeeToast && (
          <motion.div key="ct" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            style={{ position: "fixed", bottom: "calc(env(safe-area-inset-bottom,0px) + 24px)", left: "50%", transform: "translateX(-50%)", zIndex: 500, background: "rgba(10,10,18,0.95)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 24, padding: "10px 20px", whiteSpace: "nowrap" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fbbf24" }}>{coffeeToast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════ FULL PAGE FLOOR VIEW OVERLAY ════ */}
      <AnimatePresence>
        {floorView && (() => {
          // ── 27 tables across 250vw × 210vw panning canvas ───────────────────
          // x/y = % of large canvas. First 3 cols + rows 1-3 visible on load.
          type FloorCfg = { id: string; x: number; y: number; maxSeats: 2|3|4 };
          const FLOOR_CONFIGS: FloorCfg[] = [
            // Row 1 (y≈8%) — cols 1-3 visible, 4-6 need pan-right
            { id: "T-01", x:  9, y:  7, maxSeats: 4 },
            { id: "T-02", x: 22, y:  9, maxSeats: 2 },
            { id: "T-03", x: 36, y:  7, maxSeats: 3 },
            { id: "T-04", x: 51, y:  8, maxSeats: 4 },
            { id: "T-05", x: 65, y:  7, maxSeats: 2 },
            { id: "T-06", x: 80, y:  9, maxSeats: 3 },
            // Row 2 (y≈28%)
            { id: "T-07", x:  7, y: 27, maxSeats: 2 },
            { id: "T-08", x: 20, y: 29, maxSeats: 4 },
            { id: "T-09", x: 34, y: 27, maxSeats: 2 },
            { id: "T-10", x: 50, y: 28, maxSeats: 3 },
            { id: "T-11", x: 67, y: 27, maxSeats: 4 },
            { id: "T-12", x: 82, y: 29, maxSeats: 2 },
            // Row 3 (y≈47%)
            { id: "T-13", x: 12, y: 47, maxSeats: 3 },
            { id: "T-14", x: 27, y: 49, maxSeats: 2 },
            { id: "T-15", x: 43, y: 47, maxSeats: 4 },
            { id: "T-16", x: 58, y: 48, maxSeats: 2 },
            { id: "T-17", x: 74, y: 46, maxSeats: 3 },
            // Row 4 (y≈67%) — pan down to see
            { id: "T-18", x:  9, y: 67, maxSeats: 4 },
            { id: "T-19", x: 24, y: 69, maxSeats: 2 },
            { id: "T-20", x: 40, y: 67, maxSeats: 3 },
            { id: "T-21", x: 56, y: 68, maxSeats: 4 },
            { id: "T-22", x: 72, y: 66, maxSeats: 2 },
            // Row 5 (y≈85%) — pan down far
            { id: "T-23", x: 15, y: 84, maxSeats: 2 },
            { id: "T-24", x: 32, y: 86, maxSeats: 4 },
            { id: "T-25", x: 50, y: 84, maxSeats: 2 },
            { id: "T-26", x: 68, y: 85, maxSeats: 3 },
            { id: "T-27", x: 84, y: 84, maxSeats: 4 },
            // VIP reserved table — centre floor, always visible
            { id: "VIP", x: 50, y: 50, maxSeats: 4 },
          ];

          // ── Seat positions per table shape ──────────────────────────────────
          const seatOffsets = (maxSeats: 2|3|4, tableSize: number): Array<React.CSSProperties> => {
            const half = tableSize / 2;
            const pad = 19;
            if (maxSeats === 2) return [
              { position: "absolute", top: -pad, left: -pad },
              { position: "absolute", bottom: -pad, right: -pad },
            ];
            if (maxSeats === 3) return [
              { position: "absolute", top: -pad, left: half - 17 },
              { position: "absolute", bottom: -pad, left: -pad },
              { position: "absolute", bottom: -pad, right: -pad },
            ];
            return [
              { position: "absolute", top: -pad, left: half - 18 },       // N
              { position: "absolute", right: -pad, top: half - 18 },      // E
              { position: "absolute", bottom: -pad, left: half - 18 },    // S
              { position: "absolute", left: -pad, top: half - 18 },       // W
            ];
          };

          const tableSize = (ms: 2|3|4) => ms === 2 ? 50 : ms === 3 ? 56 : 64;
          const seatSize = 36;

          // ── Assign profiles to seats deterministically ──────────────────────
          const floorPool = [
            ...atTable.map(v => v.profile),
            ...available.map(v => v.profile),
          ];
          let pi = 0;

          type SeatVal = LoungeProfile | "empty";
          const floorTables = FLOOR_CONFIGS.map((cfg, ti) => {
            const ts = tableSize(cfg.maxSeats);
            // How many seats to fill for this table
            const seed = ti; // stable per-table seed
            let fill = 0;
            if (pi < floorPool.length) {
              if (cfg.maxSeats === 4) fill = Math.min(2 + (seed % 3), cfg.maxSeats, floorPool.length - pi);
              else if (cfg.maxSeats === 3) fill = Math.min(1 + (ti % 2), cfg.maxSeats, floorPool.length - pi);
              else fill = Math.min(1 + ((ti + seed) % 2), 2, floorPool.length - pi);
            }
            const seats: SeatVal[] = [];
            for (let i = 0; i < cfg.maxSeats; i++) {
              seats.push(i < fill && pi < floorPool.length ? floorPool[pi++] : "empty");
            }
            return { ...cfg, ts, seats };
          });

          const hasAnyGuests = (seats: SeatVal[]) => seats.some(s => s !== "empty");
          const hasOpenSeat  = (seats: SeatVal[]) => seats.some(s => s === "empty") && seats.some(s => s !== "empty");

          const userCountry = (() => { try { return localStorage.getItem("ghost_country") ?? "UAE"; } catch { return "UAE"; } })();

          return (
            <motion.div key="floor-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, zIndex: 100, background: "radial-gradient(ellipse at 50% 30%, rgba(28,18,6,0.98) 0%, rgba(8,8,14,1) 100%)", display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif", color: "#fff" }}
            >
              {/* Top bar */}
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(env(safe-area-inset-top,16px) + 8px) 16px 10px", background: "rgba(6,6,10,0.96)", borderBottom: "1px solid rgba(212,175,55,0.12)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <motion.button whileTap={{ scale: 0.92 }}
                    onClick={() => setFloorView(false)}
                    style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 20, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <span>≡</span><span>List</span>
                  </motion.button>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(212,175,55,0.55)", letterSpacing: "0.12em", textTransform: "uppercase" }}>The Breakfast Room</p>
                </div>
                <CoinBalanceChip size="sm" />
              </div>

              {/* Pannable floor — scroll in all directions to explore */}
              <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
                {/* Scrollable inner */}
                <div style={{ position: "absolute", inset: 0, overflowX: "scroll", overflowY: "scroll", WebkitOverflowScrolling: "touch" as React.CSSProperties["WebkitOverflowScrolling"] }}>
                  {/* Large floor canvas: 250vw × 210vw */}
                  <div style={{ position: "relative", width: "250vw", height: "210vw", minHeight: "100%", flexShrink: 0, overflow: "hidden" }}>
                    {/* Restaurant background image */}
                    <img src="https://ik.imagekit.io/7grri5v7d/asdasdasd.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", opacity: 0.35, pointerEvents: "none", userSelect: "none" }} />
                    {/* Dark overlay to keep contrast */}
                    <div style={{ position: "absolute", inset: 0, background: "rgba(6,4,2,0.55)", pointerEvents: "none" }} />

                    {/* Ambient floor grid lines */}
                    {[12,24,36,48,60,72,84,96].map(y => (
                      <div key={y} style={{ position: "absolute", left: 0, right: 0, top: `${y}%`, height: 1, background: "rgba(212,175,55,0.02)", pointerEvents: "none" }} />
                    ))}
                    {[10,20,30,40,50,60,70,80,90].map(x => (
                      <div key={x} style={{ position: "absolute", top: 0, bottom: 0, left: `${x}%`, width: 1, background: "rgba(212,175,55,0.02)", pointerEvents: "none" }} />
                    ))}

                    {/* Tables */}
                    {floorTables.map(table => {
                      const anyGuests = hasAnyGuests(table.seats);
                      const isFloorSel = floorSelectedTableId === table.id;
                      const offsets = seatOffsets(table.maxSeats, table.ts);
                      const glowSize = table.ts + 54;
                      return (
                        <div key={table.id} style={{ position: "absolute", left: `${table.x}%`, top: `${table.y}%`, transform: "translate(-50%,-50%)" }}>
                          {/* Candle glow */}
                          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: glowSize, height: glowSize, borderRadius: "50%", background: anyGuests ? "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
                          {/* Table surface */}
                          {(() => {
                            const isVip = table.id === "VIP";
                            return (
                              <div style={{ position: "relative", width: table.ts, height: table.ts, borderRadius: "50%", background: isVip ? "rgba(212,175,55,0.22)" : anyGuests ? "rgba(212,175,55,0.14)" : "rgba(8,8,14,0.55)", border: `${isVip ? 3 : 2}px solid ${isFloorSel ? "#d4af37" : isVip ? "#d4af37" : anyGuests ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.12)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: isVip ? "0 0 28px rgba(212,175,55,0.5)" : isFloorSel ? "0 0 22px rgba(212,175,55,0.55)" : anyGuests ? "0 0 10px rgba(212,175,55,0.1)" : "none", backdropFilter: "blur(2px)" }}>
                                {isVip && <p style={{ margin: 0, fontSize: 7, fontWeight: 900, color: "rgba(212,175,55,0.7)", letterSpacing: "0.08em", lineHeight: 1 }}>★</p>}
                                <p style={{ margin: 0, fontSize: table.ts > 55 ? 9 : 8, fontWeight: 900, color: isVip ? "#d4af37" : anyGuests ? "#d4af37" : "rgba(255,255,255,0.3)", letterSpacing: "0.04em", lineHeight: 1 }}>{table.id}</p>
                              </div>
                            );
                          })()}
                          {/* Seats */}
                          {table.seats.map((seat, si) => {
                            const isOccupied = seat !== "empty";
                            const isEmptyAtOccupied = !isOccupied && anyGuests;
                            return (
                              <motion.div key={si} whileTap={{ scale: 0.88 }}
                                onClick={() => {
                                  if (isOccupied) { setFloorSelectedProfile(seat as LoungeProfile); setFloorSelectedTableId(table.id); }
                                  else if (isEmptyAtOccupied) { setFloorJoinTableId(table.id); }
                                }}
                                style={{ ...(offsets[si] ?? {}), width: seatSize, height: seatSize, borderRadius: "50%", overflow: "hidden", border: isOccupied ? "2px solid rgba(212,175,55,0.55)" : isEmptyAtOccupied ? "2px dashed rgba(74,222,128,0.5)" : "2px dashed rgba(255,255,255,0.1)", background: isOccupied ? "transparent" : "rgba(255,255,255,0.02)", cursor: isOccupied || isEmptyAtOccupied ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isOccupied ? "0 2px 8px rgba(0,0,0,0.5)" : "none" }}>
                                {isOccupied
                                  ? <img src={(seat as LoungeProfile).photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  : isEmptyAtOccupied
                                  ? <motion.div animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1.1, 0.85] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(74,222,128,0.7)" }} />
                                  : <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                                }
                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Edge fade — hints that more is beyond */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 36, background: "linear-gradient(to bottom, rgba(8,8,14,0.5), transparent)", pointerEvents: "none", zIndex: 2 }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 36, background: "linear-gradient(to top, rgba(8,8,14,0.5), transparent)", pointerEvents: "none", zIndex: 2 }} />
                <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 24, background: "linear-gradient(to right, rgba(8,8,14,0.4), transparent)", pointerEvents: "none", zIndex: 2 }} />
                <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 24, background: "linear-gradient(to left, rgba(8,8,14,0.4), transparent)", pointerEvents: "none", zIndex: 2 }} />

                {/* Pan hint + Legend */}
                <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 14px", pointerEvents: "none", zIndex: 3 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.12)" }} />
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Occupied</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px dashed rgba(74,222,128,0.45)" }} />
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Open seat</span>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.2)", fontWeight: 600 }}>← pan to explore →</p>
                </div>
              </div>

              {/* ── Profile card (tap occupied seat) ── */}
              <AnimatePresence>
                {floorSelectedProfile && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => { setFloorSelectedProfile(null); setFloorSelectedTableId(null); }}
                      style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 10, backdropFilter: "blur(4px)" }} />
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 30, stiffness: 300 }}
                      style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 11, background: "#0a0a0f", borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", padding: "0 0 calc(env(safe-area-inset-bottom,0px) + 22px)", overflow: "hidden" }}>
                      {/* Gold rim */}
                      <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #d4af37, rgba(212,175,55,0.4), transparent)" }} />
                      <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "12px auto 14px" }} />
                      <div style={{ padding: "0 18px" }}>
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <img src={floorSelectedProfile.photo} alt="" style={{ width: 62, height: 62, borderRadius: "50%", objectFit: "cover", border: "2.5px solid rgba(212,175,55,0.45)" }} />
                            <motion.div animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                              style={{ position: "absolute", bottom: 1, right: 1, width: 13, height: 13, borderRadius: "50%", background: "#22c55e", border: "2px solid #0a0a0f" }} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>{floorSelectedProfile.ghostId}</p>
                            <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                              {floorSelectedProfile.flag} {floorSelectedProfile.city}, {floorSelectedProfile.country} · Age {floorSelectedProfile.age}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(212,175,55,0.7)", fontStyle: "italic" }}>"{floorSelectedProfile.mood}"</p>
                          </div>
                          <div style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 12, padding: "6px 10px", textAlign: "center", flexShrink: 0 }}>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#d4af37", lineHeight: 1 }}>{42 + (floorSelectedProfile.seed % 51)}%</p>
                            <p style={{ margin: "2px 0 0", fontSize: 8, fontWeight: 700, color: "rgba(212,175,55,0.55)", letterSpacing: "0.08em" }}>MATCH</p>
                          </div>
                        </div>
                        {/* Stats */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                          {[
                            { icon: "📍", label: approxDistance(floorSelectedProfile.country, userCountry, UTC_OFFSETS) },
                            { icon: "🕐", label: `Usually ${loungePresence(floorSelectedProfile.seed).time}` },
                            { icon: "🍽️", label: `${loungePresence(floorSelectedProfile.seed).tables} tables this week` },
                          ].map(s => (
                            <div key={s.icon} style={{ flex: 1, borderRadius: 11, padding: "8px 6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
                              <p style={{ margin: 0, fontSize: 13 }}>{s.icon}</p>
                              <p style={{ margin: "3px 0 0", fontSize: 9, color: "rgba(255,255,255,0.45)", fontWeight: 600, lineHeight: 1.3 }}>{s.label}</p>
                            </div>
                          ))}
                        </div>
                        {/* Table status */}
                        {(() => {
                          const t = floorTables.find(t => t.id === floorSelectedTableId);
                          const occupied = t ? t.seats.filter(s => s !== "empty").length : 0;
                          const total = t?.maxSeats ?? 0;
                          const open = total - occupied;
                          return (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "9px 12px", background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 12 }}>
                              <span style={{ fontSize: 13 }}>🪑</span>
                              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                                {t ? `Table ${t.id} · ${occupied} seated · ${open} open seat${open !== 1 ? "s" : ""}` : "In the lounge"}
                              </p>
                            </div>
                          );
                        })()}
                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8 }}>
                          <motion.button whileTap={{ scale: 0.95 }}
                            onClick={e => sendCoffee(floorSelectedProfile.id, floorSelectedProfile.ghostId, e)}
                            disabled={coffeesSent.has(floorSelectedProfile.id) || !canAfford(COFFEE_COST)}
                            style={{ flex: 1, padding: "12px", borderRadius: 14, border: "none", background: coffeesSent.has(floorSelectedProfile.id) ? "rgba(255,255,255,0.04)" : "rgba(212,175,55,0.12)", cursor: coffeesSent.has(floorSelectedProfile.id) ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            <img src="https://ik.imagekit.io/7grri5v7d/Red%20mug%20with%20steam%20swirls.png" alt="" style={{ width: 18, height: 18, objectFit: "contain", opacity: coffeesSent.has(floorSelectedProfile.id) ? 0.3 : 1 }} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: coffeesSent.has(floorSelectedProfile.id) ? "rgba(255,255,255,0.2)" : "#d4af37" }}>
                              {coffeesSent.has(floorSelectedProfile.id) ? "Sent" : `Coffee · 🪙${COFFEE_COST}`}
                            </span>
                          </motion.button>
                          {(() => {
                            const t = floorTables.find(t => t.id === floorSelectedTableId);
                            const open = t ? hasOpenSeat(t.seats) : false;
                            if (open && !locked) return (
                              <motion.button whileTap={{ scale: 0.95 }}
                                onClick={() => { setFloorJoinTableId(floorSelectedTableId); setFloorSelectedProfile(null); setFloorSelectedTableId(null); }}
                                style={{ flex: 2, padding: "12px", borderRadius: 14, border: "none", background: "linear-gradient(135deg, #78350f, #d97706, #fbbf24)", cursor: "pointer", fontSize: 13, fontWeight: 900, color: "#0a0500" }}>
                                Request to Join · 🪙{TABLE_INVITE_COST}
                              </motion.button>
                            );
                            const isInviteLater = inviteLaterIds.has(floorSelectedProfile.id);
                            return (
                              <motion.button whileTap={{ scale: 0.95 }}
                                onClick={() => setInviteLaterIds(prev => { const n = new Set(prev); isInviteLater ? n.delete(floorSelectedProfile.id) : n.add(floorSelectedProfile.id); return n; })}
                                style={{ flex: 2, padding: "12px", borderRadius: 14, border: `1px solid ${isInviteLater ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`, background: isInviteLater ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.04)", cursor: "pointer", fontSize: 12, fontWeight: 800, color: isInviteLater ? "#4ade80" : "rgba(255,255,255,0.5)" }}>
                                {isInviteLater ? "✓ Queued" : "Invite Later"}
                              </motion.button>
                            );
                          })()}
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* ── Join seat request sheet ── */}
              <AnimatePresence>
                {floorJoinTableId && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setFloorJoinTableId(null)}
                      style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 10, backdropFilter: "blur(4px)" }} />
                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 30, stiffness: 300 }}
                      style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 11, background: "#0a0a0f", borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none", padding: "20px 20px", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)", overflow: "hidden" }}>
                      <div style={{ height: 3, position: "absolute", top: 0, left: 0, right: 0, background: "linear-gradient(90deg, transparent, #d4af37, transparent)", borderRadius: "22px 22px 0 0" }} />
                      <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 18px" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                        <img src={BUTLER_IMG} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.5)", flexShrink: 0 }} />
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#d4af37" }}>Request a Seat</p>
                          <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.38)" }}>Mr. Butla will arrange your seating at <span style={{ color: "#d4af37", fontWeight: 800 }}>{floorJoinTableId}</span></p>
                        </div>
                      </div>
                      {(() => {
                        const t = floorTables.find(t => t.id === floorJoinTableId);
                        const guests = t ? t.seats.filter((s): s is LoungeProfile => s !== "empty") : [];
                        return (
                          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                            {guests.map(g => (
                              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", borderRadius: 12, padding: "10px 10px" }}>
                                <img src={g.photo} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                                <div>
                                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#fff" }}>{g.ghostId}</p>
                                  <p style={{ margin: "1px 0 0", fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{g.flag} {g.city}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                      <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                        Mr. Butla will discreetly notify the guests at this table that you'd like to join. They can accept or decline your request.
                      </p>
                      <div style={{ display: "flex", gap: 10 }}>
                        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFloorJoinTableId(null)}
                          style={{ flex: 1, padding: "13px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>
                          Cancel
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (!canAfford(TABLE_INVITE_COST)) return;
                            deductCoins(TABLE_INVITE_COST, "Request to join table");
                            setFloorJoinTableId(null);
                          }}
                          disabled={!canAfford(TABLE_INVITE_COST)}
                          style={{ flex: 2, padding: "13px", background: canAfford(TABLE_INVITE_COST) ? "linear-gradient(135deg, #78350f, #d97706, #fbbf24)" : "rgba(255,255,255,0.04)", border: "none", borderRadius: 14, cursor: canAfford(TABLE_INVITE_COST) ? "pointer" : "default", fontSize: 13, fontWeight: 900, color: canAfford(TABLE_INVITE_COST) ? "#0a0500" : "rgba(255,255,255,0.2)" }}>
                          Send Request · 🪙{TABLE_INVITE_COST}
                        </motion.button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
