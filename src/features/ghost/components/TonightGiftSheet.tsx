// ── Tonight Gift Sheet ────────────────────────────────────────────────────────
// Slides up when user likes a Tonight profile — send gift + note, await response.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId } from "../utils/ghostHelpers";
import { readCoins, spendCoins } from "../utils/featureGating";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

// ── Gift options ──────────────────────────────────────────────────────────────
const GIFTS = [
  { key: "rose",     emoji: "🌹", label: "Rose",       coins: 5  },
  { key: "choc",     emoji: "🍫", label: "Chocolates", coins: 10 },
  { key: "wine",     emoji: "🍷", label: "Wine",       coins: 15 },
  { key: "bouquet",  emoji: "💐", label: "Bouquet",    coins: 25 },
] as const;

// ── Seeded accept/decline ─────────────────────────────────────────────────────
function idHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(37, h) + id.charCodeAt(i) | 0;
  return Math.abs(h);
}

function willAccept(profileId: string): boolean {
  return idHash(profileId + "tonight_accept") % 10 < 4; // 40% accept
}

const DECLINE_MSGS = [
  "My sincerest apologies — tonight she has made other plans. Perhaps another evening would suit better.",
  "I'm afraid she has made alternative arrangements for this evening. Do not be discouraged — the hotel has many lovely evenings ahead.",
];

// ── Component ─────────────────────────────────────────────────────────────────
type Screen = "gift" | "waiting" | "accepted" | "declined" | "connect";

export default function TonightGiftSheet({
  profile,
  onClose,
  onLike,
  onConnect,
}: {
  profile: GhostProfile;
  onClose: () => void;
  onLike: (profile: GhostProfile) => void;
  onConnect: (profile: GhostProfile) => void;
}) {
  const a = useGenderAccent();
  const [screen, setScreen]       = useState<Screen>("gift");
  const [gift, setGift]           = useState<string | null>(null);
  const [note, setNote]           = useState("");
  const [connecting, setConnecting] = useState(false);

  const selectedGift = GIFTS.find(g => g.key === gift);
  const totalCost    = (selectedGift?.coins ?? 0) + 50; // 50 to leave the house if accepted
  const canAffordGift = !gift || readCoins() >= (selectedGift?.coins ?? 0);

  const handleSend = () => {
    if (gift && selectedGift) {
      if (!spendCoins(selectedGift.coins)) return; // not enough coins
    }
    onLike(profile);
    setScreen("waiting");
    const delay = 1800 + Math.random() * 1000;
    setTimeout(() => {
      setScreen(willAccept(profile.id) ? "accepted" : "declined");
    }, delay);
  };

  const handleConnect = () => {
    if (connecting) return;
    if (!spendCoins(50)) return;
    setConnecting(true);
    setTimeout(() => {
      setScreen("connect");
      onConnect(profile);
    }, 1400);
  };

  const guestId = toGhostId(profile.id);
  const declineMsg = DECLINE_MSGS[idHash(profile.id + "dm") % DECLINE_MSGS.length];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9100,
        background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(6,4,4,0.99)", backdropFilter: "blur(30px)",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(220,20,20,0.2)", borderBottom: "none",
          paddingBottom: "max(28px, env(safe-area-inset-bottom, 28px))",
          overflow: "hidden",
        }}
      >
        {/* Red top stripe */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #e01010, transparent)" }} />

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>

        {/* Close */}
        <motion.button whileTap={{ scale: 0.88 }} onClick={onClose}
          style={{ position: "absolute", top: 14, right: 16, width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >✕</motion.button>

        {/* Profile row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px 16px" }}>
          <img src={profile.image} alt=""
            style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(220,20,20,0.4)", flexShrink: 0 }}
            onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff" }}>{profile.name.split(" ")[0]}</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{guestId} · {profile.age} · {profile.city}</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(220,20,20,0.2), transparent)", margin: "0 20px 18px" }} />

        <AnimatePresence mode="wait">

          {/* ── Gift selection screen ── */}
          {screen === "gift" && (
            <motion.div key="gift" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ padding: "0 20px" }}>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 900, color: "#fff" }}>Send a Gift with Your Like</p>
              <p style={{ margin: "0 0 16px", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                A gift makes your like stand out tonight. She'll decide whether to accept.
              </p>

              {/* Gift grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
                {GIFTS.map(g => {
                  const active = gift === g.key;
                  const canAfford = readCoins() >= g.coins;
                  return (
                    <motion.button key={g.key} whileTap={{ scale: 0.93 }}
                      onClick={() => setGift(active ? null : g.key)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                        padding: "10px 6px 8px",
                        borderRadius: 14,
                        background: active ? "rgba(220,20,20,0.12)" : "rgba(255,255,255,0.04)",
                        border: active ? "1px solid rgba(220,20,20,0.5)" : "1px solid rgba(255,255,255,0.08)",
                        cursor: canAfford ? "pointer" : "default",
                        opacity: canAfford ? 1 : 0.4,
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{g.emoji}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: active ? "#e01010" : "rgba(255,255,255,0.55)" }}>{g.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#d4af37" }}>🪙{g.coins}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Optional note */}
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Add a Note (optional)</p>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value.slice(0, 120))}
                placeholder="A short message to send with your gift…"
                rows={2}
                style={{
                  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 12,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 12, outline: "none", resize: "none",
                  lineHeight: 1.55, fontFamily: "inherit", marginBottom: 4,
                }}
              />
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", textAlign: "right", margin: "0 0 18px" }}>{note.length}/120</p>

              {/* Coin balance */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 14, gap: 6 }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Your balance:</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#d4af37" }}>🪙{readCoins()}</span>
              </div>

              {/* Send button */}
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={!canAffordGift}
                style={{
                  width: "100%", height: 50, borderRadius: 14, border: "none",
                  background: canAffordGift ? "linear-gradient(135deg, #b91c1c, #e01010)" : "rgba(255,255,255,0.06)",
                  color: canAffordGift ? "#fff" : "rgba(255,255,255,0.2)",
                  fontSize: 14, fontWeight: 900, cursor: canAffordGift ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  marginBottom: 10,
                }}
              >
                {gift
                  ? <><span>{selectedGift?.emoji}</span><span>Send Like + Gift · 🪙{selectedGift?.coins}</span></>
                  : <><span>❤️</span><span>Send Like Only</span></>
                }
              </motion.button>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", margin: 0 }}>She'll receive your like and gift anonymously via The Butler</p>
            </motion.div>
          )}

          {/* ── Waiting screen ── */}
          {screen === "waiting" && (
            <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "0 20px 10px", textAlign: "center" }}
            >
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.1, repeat: Infinity }}
                style={{ fontSize: 40, marginBottom: 14 }}
              >🏨</motion.div>
              <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 900, color: "#fff" }}>Gift Delivered</p>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>
                The Butler has personally delivered your {gift ? `${selectedGift?.emoji} ${selectedGift?.label}` : "like"} to {profile.name.split(" ")[0]}.
              </p>
              <p style={{ margin: "0 0 20px", fontSize: 11, color: "rgba(220,20,20,0.7)", fontWeight: 700 }}>Awaiting her response…</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.26 }}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#e01010" }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Accepted screen ── */}
          {screen === "accepted" && (
            <motion.div key="accepted" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: "0 20px 10px" }}
            >
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <motion.div
                  initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 340, damping: 18 }}
                  style={{ fontSize: 44, marginBottom: 10 }}
                >🎉</motion.div>
                <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "#4ade80" }}>She Accepted!</p>
                <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                  {profile.name.split(" ")[0]} has accepted your {gift ? `${selectedGift?.emoji} gift` : "like"} tonight.{note ? ` She also read your note.` : ""} Pay the one-time fee to connect and leave the hotel together.
                </p>
                {/* Butler note */}
                <div style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)", textAlign: "left", marginBottom: 16 }}>
                  <img src="https://ik.imagekit.io/7grri5v7d/werwerwer-removebg-preview.png" alt="" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>
                    <span style={{ color: "#d4af37", fontWeight: 800 }}>The Butler — </span>
                    Congratulations. She is waiting. A one-time connection fee unlocks your shared chat and allows you both to leave the hotel together this evening.
                  </p>
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }}
                onClick={handleConnect}
                disabled={connecting || readCoins() < 50}
                animate={{ boxShadow: connecting || readCoins() < 50 ? undefined : ["0 4px 20px rgba(220,20,20,0.3)", "0 4px 32px rgba(220,20,20,0.6)", "0 4px 20px rgba(220,20,20,0.3)"] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{
                  width: "100%", height: 50, borderRadius: 14, border: "none",
                  background: connecting || readCoins() < 50 ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #b91c1c, #e01010)",
                  color: connecting || readCoins() < 50 ? "rgba(255,255,255,0.25)" : "#fff",
                  fontSize: 14, fontWeight: 900, cursor: connecting || readCoins() < 50 ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10,
                }}
              >
                {connecting
                  ? <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>Connecting…</motion.span>
                  : <><span>🚪</span><span>Connect &amp; Leave Together · 🪙50</span></>
                }
              </motion.button>
              {readCoins() < 50 && (
                <p style={{ fontSize: 10, color: "rgba(239,68,68,0.7)", textAlign: "center", margin: "0 0 8px", fontWeight: 700 }}>You need 🪙50 to connect — visit the Coin Shop</p>
              )}
              <button onClick={onClose} style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}>
                Maybe later
              </button>
            </motion.div>
          )}

          {/* ── Declined screen ── */}
          {screen === "declined" && (
            <motion.div key="declined" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: "0 20px 10px", textAlign: "center" }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌙</div>
              <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 900, color: "rgba(255,255,255,0.75)" }}>Not Tonight</p>

              {/* Butler message */}
              <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 14, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)", textAlign: "left", marginBottom: 18 }}>
                <img src="https://ik.imagekit.io/7grri5v7d/werwerwer-removebg-preview.png" alt="" style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontStyle: "italic" }}>
                  <span style={{ color: "#d4af37", fontWeight: 800, fontStyle: "normal" }}>The Butler — </span>
                  "{declineMsg}"
                </p>
              </div>

              <p style={{ margin: "0 0 20px", fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.55 }}>
                The hotel has many more evenings. Perhaps another guest is waiting for you tonight.
              </p>

              <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                style={{ width: "100%", height: 48, borderRadius: 14, border: "1px solid rgba(220,20,20,0.25)", background: "rgba(220,20,20,0.08)", color: "rgba(220,20,20,0.8)", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
              >
                Back to the Hotel
              </motion.button>
            </motion.div>
          )}

          {/* ── Connected screen ── */}
          {screen === "connect" && (
            <motion.div key="connect" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ padding: "0 20px 10px", textAlign: "center" }}
            >
              <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ fontSize: 44, marginBottom: 10 }}>🔑</motion.div>
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "#d4af37" }}>{profile.name.split(" ")[0]} is waiting</p>
              <p style={{ margin: "0 0 20px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                Your connection is live. Check your Vault — a chat room has opened for you both.
              </p>
              <p style={{ fontSize: 15, fontWeight: 900, color: "#d4af37", margin: "0 0 20px" }}>Enjoy your evening 🏨</p>
              <button onClick={onClose}
                style={{ width: "100%", height: 46, borderRadius: 14, border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.08)", color: "#d4af37", fontWeight: 800, fontSize: 13, cursor: "pointer" }}
              >
                Back to Ghost Hotel
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
