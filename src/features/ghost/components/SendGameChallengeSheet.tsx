// ── Send Game Challenge Sheet ──────────────────────────────────────────────────
// Step 1: Pick a guest — online guests shown prominently + full carousel swipe
// Step 2: Pick game type + coin stake, send challenge
// Step 3: Sent / No Coins confirmation states

import { useState } from "react";
import { motion, AnimatePresence, animate, useMotionValue } from "framer-motion";
import { useCoins } from "../hooks/useCoins";
import {
  sendGameInvite,
  GAME_LABELS,
  GAME_EMOJIS,
  STAKE_OPTIONS,
  type GameType,
} from "../utils/gameInviteService";

const ITEM_H = 78; // px — height of each carousel row

// ── World guest pool ──────────────────────────────────────────────────────────
interface WorldGuest {
  id: string; name: string; flag: string; city: string; img: string; online: boolean;
}

const WORLD_GUESTS: WorldGuest[] = [
  // Online (in games room right now)
  { id: "g1",  name: "Sari",      flag: "🇮🇩", city: "Jakarta",   online: true,  img: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=120&q=80" },
  { id: "g2",  name: "Kenji",     flag: "🇯🇵", city: "Tokyo",     online: true,  img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80" },
  { id: "g3",  name: "Mia",       flag: "🇸🇬", city: "Singapore", online: true,  img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80" },
  { id: "g4",  name: "Min-Ji",    flag: "🇰🇷", city: "Seoul",     online: true,  img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&q=80" },
  { id: "g5",  name: "Wei",       flag: "🇨🇳", city: "Shanghai",  online: true,  img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80" },
  { id: "g6",  name: "Sofia",     flag: "🇦🇺", city: "Sydney",    online: true,  img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80" },
  { id: "g7",  name: "Arjun",     flag: "🇮🇳", city: "Mumbai",    online: true,  img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80" },
  { id: "g8",  name: "Layla",     flag: "🇦🇪", city: "Dubai",     online: true,  img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&q=80" },
  { id: "g9",  name: "Liam",      flag: "🇬🇧", city: "London",    online: true,  img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&q=80" },
  { id: "g10", name: "Léa",       flag: "🇫🇷", city: "Paris",     online: true,  img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&q=80" },
  { id: "g11", name: "Zara",      flag: "🇺🇸", city: "New York",  online: true,  img: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=120&q=80" },
  { id: "g12", name: "Amara",     flag: "🇳🇬", city: "Lagos",     online: true,  img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80" },
  // Offline (world guests)
  { id: "g13", name: "Carlos",    flag: "🇧🇷", city: "São Paulo", online: false, img: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&q=80" },
  { id: "g14", name: "Valentina", flag: "🇨🇴", city: "Bogotá",    online: false, img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&q=80" },
  { id: "g15", name: "Tyler",     flag: "🇨🇦", city: "Toronto",   online: false, img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&q=80" },
  { id: "g16", name: "Marco",     flag: "🇮🇹", city: "Milan",     online: false, img: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=120&q=80" },
  { id: "g17", name: "Nadia",     flag: "🇩🇪", city: "Berlin",    online: false, img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80" },
  { id: "g18", name: "Elena",     flag: "🇷🇺", city: "Moscow",    online: false, img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80" },
  { id: "g19", name: "Marcus",    flag: "🇿🇦", city: "Cape Town", online: false, img: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&q=80" },
  { id: "g20", name: "Omar",      flag: "🇸🇦", city: "Riyadh",    online: false, img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&q=80" },
  { id: "g21", name: "Yuna",      flag: "🇰🇷", city: "Busan",     online: false, img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=120&q=80" },
  { id: "g22", name: "Priya",     flag: "🇮🇳", city: "Delhi",     online: false, img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&q=80" },
  { id: "g23", name: "Hana",      flag: "🇯🇵", city: "Osaka",     online: false, img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=80" },
  { id: "g24", name: "Diego",     flag: "🇲🇽", city: "Mexico City",online: false,img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80" },
];

// Online guests first, then offline
const GUESTS = [...WORLD_GUESTS.filter(g => g.online), ...WORLD_GUESTS.filter(g => !g.online)];
const ONLINE = GUESTS.filter(g => g.online);

// ── Helpers ───────────────────────────────────────────────────────────────────
function getMyProfile() {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    return {
      id:    (p.guest_id || p.id || localStorage.getItem("ghost_phone") || "") as string,
      name:  (p.name || p.display_name || "Guest") as string,
      image: (p.photo || "") as string,
    };
  } catch { return { id: "", name: "Guest", image: "" }; }
}

export interface ChallengeTarget {
  id: string; name: string; image?: string; city?: string; flag?: string;
}

// ── Vertical carousel — always shows exactly 3 slots (circular) ───────────────
// Renders prev / current / next using modulo so there is always a guest
// above and below the highlighted one, no matter where in the list you are.
function GuestCarousel({ guests, selectedIdx, onSelect }: {
  guests: WorldGuest[];
  selectedIdx: number;
  onSelect: (idx: number) => void;
}) {
  const n  = guests.length;
  const y  = useMotionValue(0);

  const wrap = (i: number) => ((i % n) + n) % n;

  function doSnap(delta: number) {
    if (delta === 0) {
      animate(y, 0, { type: "spring", stiffness: 420, damping: 32 });
      return;
    }
    const target = delta > 0 ? -ITEM_H : ITEM_H;
    animate(y, target, {
      type: "spring", stiffness: 420, damping: 32,
      onComplete: () => {
        y.set(0);
        onSelect(wrap(selectedIdx + delta));
      },
    });
  }

  function GuestSlot({ g, isCenter, onTap }: { g: WorldGuest; isCenter: boolean; onTap: () => void }) {
    return (
      <motion.div
        animate={{ scale: isCenter ? 1 : 0.91, opacity: isCenter ? 1 : 0.62 }}
        transition={{ duration: 0.18 }}
        onClick={onTap}
        style={{ height: ITEM_H, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", cursor: isCenter ? "default" : "pointer" }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img src={g.img} alt={g.name}
            style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: isCenter ? "2px solid rgba(212,175,55,0.7)" : "2px solid rgba(255,255,255,0.1)", display: "block" }} />
          {g.online && (
            <div style={{ position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: "#22c55e", border: "2px solid rgba(5,3,10,1)" }} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 900, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {g.flag} {g.name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
            {g.city}{g.online ? " · Online now 🟢" : ""}
          </p>
        </div>
        {isCenter && (
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(212,175,55,0.15)", border: "1.5px solid rgba(212,175,55,0.5)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: "#d4af37" }}>✓</span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div style={{ position: "relative", height: ITEM_H * 3, overflow: "hidden", touchAction: "none" }}>
      {/* Edge fades — just enough to hint items continue */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 22, background: "linear-gradient(to bottom, rgba(5,3,10,1), transparent)", zIndex: 3, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 22, background: "linear-gradient(to top, rgba(5,3,10,1), transparent)", zIndex: 3, pointerEvents: "none" }} />
      {/* Center highlight band */}
      <div style={{ position: "absolute", top: ITEM_H, left: 14, right: 14, height: ITEM_H, borderRadius: 14, border: "1px solid rgba(212,175,55,0.28)", background: "rgba(212,175,55,0.06)", zIndex: 1, pointerEvents: "none" }} />

      <motion.div
        drag="y"
        style={{ y, height: ITEM_H * 3 }}
        dragConstraints={{ top: -ITEM_H * 1.4, bottom: ITEM_H * 1.4 }}
        dragElastic={0.12}
        onDragEnd={(_, info) => {
          const offset   = y.get();
          const fast     = Math.abs(info.velocity.y) > 320;
          let delta = 0;
          if      (offset < -ITEM_H * 0.28 || (fast && info.velocity.y < 0)) delta =  1;
          else if (offset >  ITEM_H * 0.28 || (fast && info.velocity.y > 0)) delta = -1;
          doSnap(delta);
        }}
      >
        {/* Top slot — prev guest */}
        <GuestSlot
          g={guests[wrap(selectedIdx - 1)]}
          isCenter={false}
          onTap={() => doSnap(-1)}
        />
        {/* Center slot — selected guest */}
        <GuestSlot
          g={guests[selectedIdx]}
          isCenter={true}
          onTap={() => {}}
        />
        {/* Bottom slot — next guest */}
        <GuestSlot
          g={guests[wrap(selectedIdx + 1)]}
          isCenter={false}
          onTap={() => doSnap(1)}
        />
      </motion.div>
    </div>
  );
}

// ── Main sheet ────────────────────────────────────────────────────────────────
interface Props {
  target?: ChallengeTarget;
  onClose: () => void;
}

export default function SendGameChallengeSheet({ target, onClose }: Props) {
  const { balance, deductCoins } = useCoins();
  const me = getMyProfile();

  const initialIdx = target
    ? Math.max(0, GUESTS.findIndex(g => g.id === target.id))
    : 0;

  const [step,        setStep]        = useState<"pick_guest" | "compose" | "sent" | "no_coins">(
    target ? "compose" : "pick_guest"
  );
  const [selectedIdx, setSelectedIdx] = useState(initialIdx);
  const [gameType,    setGameType]    = useState<GameType>("connect4");
  const [stake,       setStake]       = useState<number>(25);
  const [sending,     setSending]     = useState(false);

  const selected = GUESTS[selectedIdx];
  const pot      = stake * 2;
  const canSend  = !!selected && balance >= stake;

  async function send() {
    if (!canSend || sending) return;
    if (balance < stake) { setStep("no_coins"); return; }
    setSending(true);
    deductCoins(stake, `Game challenge stake — ${GAME_LABELS[gameType]} vs ${selected.name} 🎮`);
    await sendGameInvite(me.id, me.name, me.image, selected.id, gameType, stake);
    setSending(false);
    setStep("sent");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9500, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(5,3,10,0.99)", borderRadius: "24px 24px 0 0", border: "1px solid rgba(212,175,55,0.15)", borderBottom: "none", maxHeight: "90dvh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #92400e, #d4af37, #f0d060)", flexShrink: 0 }} />
        <div style={{ overflowY: "auto", flex: 1 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "14px auto 0" }} />

          <AnimatePresence mode="wait">

            {/* ── PICK GUEST ── */}
            {step === "pick_guest" && (
              <motion.div key="pick" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                <div style={{ padding: "16px 20px 12px" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 900, color: "#fff" }}>Challenge a Guest</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                    Swipe up or down to browse · Tap to select
                  </p>
                </div>

                {/* Online now quick-tap */}
                <div style={{ padding: "0 20px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.6, repeat: Infinity }}
                      style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e" }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#22c55e", letterSpacing: "0.08em" }}>
                      ONLINE NOW — {ONLINE.length} guests
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                    {ONLINE.map((g) => {
                      const gIdx = GUESTS.indexOf(g);
                      const isSelected = gIdx === selectedIdx;
                      return (
                        <motion.div key={g.id}
                          whileTap={{ scale: 0.88 }}
                          onClick={() => { setSelectedIdx(gIdx); }}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, cursor: "pointer" }}>
                          <div style={{ position: "relative" }}>
                            <img src={g.img} alt={g.name}
                              style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: isSelected ? "2.5px solid #facc15" : "2px solid rgba(255,255,255,0.1)", display: "block" }} />
                            <div style={{ position: "absolute", bottom: 1, right: 1, width: 9, height: 9, borderRadius: "50%", background: "#22c55e", border: "1.5px solid rgba(5,3,10,1)" }} />
                          </div>
                          <span style={{ fontSize: 9, fontWeight: 700, color: isSelected ? "#facc15" : "rgba(255,255,255,0.45)", maxWidth: 44, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {g.name}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 4px" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                  <span style={{ fontSize: 16, fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>All guests</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
                </div>

                {/* Carousel */}
                <GuestCarousel
                  guests={GUESTS}
                  selectedIdx={selectedIdx}
                  onSelect={setSelectedIdx}
                />

                {/* Confirm button */}
                <div style={{ padding: "10px 20px max(36px,env(safe-area-inset-bottom,36px))" }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => setStep("compose")}
                    style={{ width: "100%", height: 52, borderRadius: 16, border: "none", background: "linear-gradient(135deg, #92400e, #d4af37, #f0d060)", color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 20px rgba(212,175,55,0.3)" }}>
                    Challenge {GUESTS[selectedIdx]?.name} →
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ── COMPOSE ── */}
            {step === "compose" && (
              <motion.div key="compose" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                style={{ padding: "14px 20px max(40px,env(safe-area-inset-bottom,40px))" }}>

                {/* Selected guest card */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 16, background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.25)", marginBottom: 20 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <img src={selected?.img} alt={selected?.name}
                      style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid rgba(212,175,55,0.4)", display: "block" }} />
                    {selected?.online && (
                      <div style={{ position: "absolute", bottom: 1, right: 1, width: 10, height: 10, borderRadius: "50%", background: "#22c55e", border: "2px solid rgba(5,3,10,1)" }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 900, color: "#fff" }}>
                      {selected?.flag} {selected?.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                      {selected?.city}{selected?.online ? " · Online now" : ""}
                    </p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => setStep("pick_guest")}
                    style={{ padding: "5px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    Change
                  </motion.button>
                </div>

                {/* Game type */}
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "rgba(212,175,55,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Game</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {(Object.keys(GAME_LABELS) as GameType[]).map(g => (
                    <motion.button key={g} whileTap={{ scale: 0.94 }} onClick={() => setGameType(g)}
                      style={{ flex: 1, height: 62, borderRadius: 14, cursor: "pointer", background: gameType === g ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)", border: gameType === g ? "1.5px solid rgba(212,175,55,0.5)" : "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <span style={{ fontSize: 20 }}>{GAME_EMOJIS[g]}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: gameType === g ? "#d4af37" : "rgba(255,255,255,0.4)" }}>{GAME_LABELS[g]}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Coin stake */}
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "rgba(212,175,55,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Coin Stake</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  {STAKE_OPTIONS.map(s => (
                    <motion.button key={s} whileTap={{ scale: 0.93 }} onClick={() => setStake(s)}
                      style={{ flex: 1, height: 50, borderRadius: 12, cursor: "pointer", background: stake === s ? "rgba(212,175,55,0.14)" : "rgba(255,255,255,0.04)", border: stake === s ? "1.5px solid rgba(212,175,55,0.55)" : "1px solid rgba(255,255,255,0.08)", opacity: balance < s ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: stake === s ? "#facc15" : "rgba(255,255,255,0.55)" }}>{s} 🪙</span>
                    </motion.button>
                  ))}
                </div>

                {/* Balance / pot row */}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.15)", marginBottom: 20 }}>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    Balance: <strong style={{ color: "#fff" }}>{balance} 🪙</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    Winner's pot: <strong style={{ color: "#facc15" }}>{pot} 🪙</strong>
                  </p>
                </div>

                {/* Send */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={send} disabled={!canSend || sending}
                  style={{ width: "100%", height: 54, borderRadius: 16, border: "none", background: canSend ? "linear-gradient(135deg, #92400e, #d4af37, #f0d060)" : "rgba(255,255,255,0.06)", color: canSend ? "#000" : "rgba(255,255,255,0.2)", fontSize: 15, fontWeight: 900, cursor: canSend ? "pointer" : "default", boxShadow: canSend ? "0 4px 20px rgba(212,175,55,0.3)" : "none", marginBottom: 10, transition: "all 0.3s" }}>
                  {sending ? "Sending…" : balance < stake ? `Need ${stake} coins (have ${balance})` : `Send Challenge — ${stake} 🪙`}
                </motion.button>
                <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}>
                  Cancel
                </button>
              </motion.div>
            )}

            {/* ── SENT ── */}
            {step === "sent" && (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "28px 22px max(44px,env(safe-area-inset-bottom,44px))" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎮</div>
                <p style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "#facc15" }}>Challenge Sent!</p>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                  Waiting for <strong style={{ color: "#fff" }}>{selected?.name}</strong> to accept.
                </p>
                <p style={{ margin: "0 0 28px", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                  Your {stake} 🪙 stake is held. Winner takes {pot} 🪙.
                </p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                  style={{ width: "100%", height: 50, borderRadius: 50, border: "none", background: "linear-gradient(135deg, #92400e, #d4af37)", color: "#000", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                  Done
                </motion.button>
              </motion.div>
            )}

            {/* ── NO COINS ── */}
            {step === "no_coins" && (
              <motion.div key="no_coins" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "28px 22px max(44px,env(safe-area-inset-bottom,44px))" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>🪙</div>
                <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: "#fff" }}>Not enough coins</p>
                <p style={{ margin: "0 0 24px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  You need {stake} coins to stake this challenge.<br />Your balance: {balance} 🪙
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("compose")}
                    style={{ width: "100%", height: 48, borderRadius: 50, border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.08)", color: "#d4af37", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                    Choose smaller stake
                  </motion.button>
                  <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}>
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
