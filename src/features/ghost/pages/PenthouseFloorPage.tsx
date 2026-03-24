import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MOCK_PENTHOUSE_PROFILES, PENTHOUSE_GIFTS, PENTHOUSE_CITIES,
  PENTHOUSE_EXTRA_CITY_PRICE,
  PENTHOUSE_DAILY_FREE_GIFTS, PENTHOUSE_NOTE_COST, PENTHOUSE_OPENER_MAX_CHARS,
  type PenthouseProfile,
} from "../types/penthouseTypes";
import {
  isPenthouseSubscribed, getDailyGiftsUsed, incrementDailyGifts,
  addPenthouseGift, getPenthouseLikedIds, addPenthouseLike,
  getPenthouseExtraCities,
} from "../utils/penthouseHelpers";
import PenthouseLandscapeCard from "../components/PenthouseLandscapeCard";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

const PENTHOUSE_BG = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsd.png";

// ── Coin balance helpers (reads same key as GhostModePage) ───────────────────
function readCoins(): number { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } }
function writeCoins(n: number): void { try { localStorage.setItem("ghost_coins", String(n)); } catch {} }

// ── Gift tray ─────────────────────────────────────────────────────────────────
function GiftTray({ profile, coinBalance, dailyUsed, onClose, onSent }: {
  profile: PenthouseProfile;
  coinBalance: number;
  dailyUsed: number;
  onClose: () => void;
  onSent: (coinsSpent: number) => void;
}) {
  const [selectedGift, setSelectedGift] = useState<typeof PENTHOUSE_GIFTS[number] | null>(null);
  const [openerNote, setOpenerNote]     = useState("");
  const [sending, setSending]           = useState(false);
  const [sent, setSent]                 = useState(false);
  const isFree    = dailyUsed < PENTHOUSE_DAILY_FREE_GIFTS;
  const giftCost  = selectedGift ? (isFree ? 0 : selectedGift.coins) : 0;
  const canAfford = coinBalance >= giftCost;
  const canSend   = selectedGift && openerNote.trim().length >= 10 && canAfford && !sending;

  const handleSend = () => {
    if (!selectedGift || !canSend) return;
    setSending(true);
    setTimeout(() => {
      const earnedByWoman = Math.floor(selectedGift.coins * 0.6);
      addPenthouseGift({
        id: `gift-${Date.now()}`,
        fromGhostId: "me",
        fromDisplayName: "Ghost Member",
        toProfileId: profile.id,
        giftKey: selectedGift.key,
        giftName: selectedGift.name,
        giftEmoji: selectedGift.emoji,
        openerNote: openerNote.trim(),
        coinsPaid: giftCost,
        coinsEarned: earnedByWoman,
        sentAt: Date.now(),
        status: "pending",
      });
      if (!isFree) {
        writeCoins(coinBalance - giftCost);
        onSent(giftCost);
      } else {
        incrementDailyGifts();
        onSent(0);
      }
      setSent(true);
      setSending(false);
      setTimeout(onClose, 2000);
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(10,8,4,0.99)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(212,175,55,0.2)", borderBottom: "none",
          overflow: "hidden",
        }}
      >
        {/* Gold top bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg, #92660a, #d4af37, #f0d060, #d4af37, #92660a)" }} />
        <div style={{ padding: "18px 20px max(32px,env(safe-area-inset-bottom,32px))" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(212,175,55,0.15)", margin: "0 auto 18px" }} />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <img src={profile.photo} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.4)" }} onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>Send a gift to {profile.name}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                {isFree ? `${PENTHOUSE_DAILY_FREE_GIFTS - dailyUsed} free gift${PENTHOUSE_DAILY_FREE_GIFTS - dailyUsed !== 1 ? "s" : ""} remaining today` : "Daily free gifts used · coins apply"}
              </p>
            </div>
          </div>

          {sent ? (
            <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🥂</div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#d4af37", margin: "0 0 4px" }}>Gift sent with style</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{profile.name} will be notified</p>
            </div>
          ) : (
            <>
              {/* Gift grid */}
              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Choose a gift</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 18 }}>
                {PENTHOUSE_GIFTS.map((g) => {
                  const cost = isFree ? 0 : g.coins;
                  const affordable = coinBalance >= cost;
                  const selected = selectedGift?.key === g.key;
                  return (
                    <motion.button
                      key={g.key} whileTap={{ scale: 0.94 }}
                      onClick={() => setSelectedGift(g)}
                      style={{
                        borderRadius: 12, padding: "10px 6px 8px", border: "none", cursor: affordable ? "pointer" : "default",
                        background: selected ? "rgba(212,175,55,0.18)" : "rgba(255,255,255,0.04)",
                        outline: selected ? "1.5px solid rgba(212,175,55,0.6)" : "1px solid rgba(255,255,255,0.07)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        opacity: affordable ? 1 : 0.4,
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{g.emoji}</span>
                      <span style={{ fontSize: 8, color: selected ? "#d4af37" : "rgba(255,255,255,0.5)", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>{g.name}</span>
                      <span style={{ fontSize: 9, fontWeight: 900, color: isFree ? "#4ade80" : "#d4af37" }}>
                        {isFree ? "Free" : `🪙${g.coins}`}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Opener note */}
              {selectedGift && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>
                    Add a note <span style={{ color: "rgba(255,255,255,0.15)", fontWeight: 600 }}>(required · {PENTHOUSE_OPENER_MAX_CHARS} chars)</span>
                  </p>
                  <textarea
                    value={openerNote}
                    onChange={(e) => setOpenerNote(e.target.value.slice(0, PENTHOUSE_OPENER_MAX_CHARS))}
                    placeholder="A short, genuine note — this is your first impression..."
                    rows={3}
                    style={{
                      width: "100%", borderRadius: 12, border: "1px solid rgba(212,175,55,0.2)",
                      background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12,
                      padding: "10px 12px", resize: "none", outline: "none",
                      fontFamily: "inherit", lineHeight: 1.55,
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Min. 10 characters</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontVariantNumeric: "tabular-nums" }}>{openerNote.length}/{PENTHOUSE_OPENER_MAX_CHARS}</span>
                  </div>
                </motion.div>
              )}

              {/* Send button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={!canSend}
                style={{
                  width: "100%", height: 50, borderRadius: 14, border: "none",
                  background: canSend
                    ? "linear-gradient(135deg, #92660a, #d4af37, #f0d060)"
                    : "rgba(255,255,255,0.06)",
                  color: canSend ? "#000" : "rgba(255,255,255,0.2)",
                  fontSize: 14, fontWeight: 900, cursor: canSend ? "pointer" : "default",
                  boxShadow: canSend ? "0 6px 24px rgba(212,175,55,0.4)" : "none",
                }}
              >
                {sending ? "Sending…" : selectedGift
                  ? `Send ${selectedGift.emoji} ${selectedGift.name}${giftCost > 0 ? ` · 🪙${giftCost}` : " · Free"}`
                  : "Select a gift above"}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── New arrival overlay ───────────────────────────────────────────────────────
function NewArrivalOverlay({ profile, onDismiss }: { profile: PenthouseProfile; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 700,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "0 28px",
      }}
    >
      {/* Full-screen background image */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${PENTHOUSE_BG})`,
        backgroundSize: "cover", backgroundPosition: "center",
      }} />
      {/* Dark overlay for readability */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(6,4,2,0.55) 0%, rgba(6,4,2,0.75) 50%, rgba(6,4,2,0.95) 100%)",
      }} />

      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.15 }}
        style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 360, textAlign: "center" }}
      >
        <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(212,175,55,0.7)", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 20px" }}>
          A new guest has arrived on the floor tonight
        </p>
        <div style={{
          borderRadius: 20, overflow: "hidden", border: "1px solid rgba(212,175,55,0.45)",
          boxShadow: "0 0 80px rgba(212,175,55,0.18)", marginBottom: 20,
        }}>
          <img
            src={profile.photo} alt={profile.name}
            style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          <div style={{ background: "rgba(10,8,4,0.98)", padding: "14px 16px", borderTop: "1px solid rgba(212,175,55,0.15)" }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>{profile.name}, {profile.age}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{profile.countryFlag} {profile.city} · {profile.stayType}</p>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>Tap anywhere to continue →</p>
      </motion.div>
    </motion.div>
  );
}

// ── Teaser (non-subscribers) ──────────────────────────────────────────────────
function PenthouseTeaser({ onSubscribe }: { onSubscribe: () => void }) {
  const profiles = MOCK_PENTHOUSE_PROFILES.slice(0, 3);
  return (
    <div style={{ padding: "0 16px 40px" }}>
      {/* Stats strip */}
      <div style={{
        display: "flex", gap: 0, marginBottom: 24,
        background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.18)",
        borderRadius: 14,
      }}>
        {[
          { value: MOCK_PENTHOUSE_PROFILES.length, label: "on the floor" },
          { value: MOCK_PENTHOUSE_PROFILES.filter((p) => p.isNewArrival).length, label: "new this week" },
          { value: 4, label: "connections made" },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center", padding: "14px 8px",
            borderRight: i < 2 ? "1px solid rgba(212,175,55,0.1)" : "none",
          }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#d4af37", margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: 0, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Blurred preview cards */}
      <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>
        Preview — members only
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28, filter: "blur(6px)", pointerEvents: "none", opacity: 0.7 }}>
        {profiles.map((p) => (
          <div key={p.id} style={{
            width: "100%", borderRadius: 16, overflow: "hidden",
            border: "1px solid rgba(212,175,55,0.15)",
            display: "flex", minHeight: 140,
          }}>
            <img src={p.photo} alt="" style={{ width: "45%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
            <div style={{ flex: 1, padding: "12px", background: "rgba(12,10,6,0.98)" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>{p.name}, {p.age}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 8px" }}>{p.countryFlag} {p.city}</p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[p.religion, p.stayType].map((tag) => (
                  <span key={tag} style={{ fontSize: 9, background: "rgba(212,175,55,0.1)", color: "rgba(212,175,55,0.7)", borderRadius: 4, padding: "2px 6px", fontWeight: 700 }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* What's included */}
      <div style={{
        background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)",
        borderRadius: 16, padding: "16px", marginBottom: 20,
      }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: "#d4af37", margin: "0 0 12px" }}>🏨 What Penthouse includes</p>
        {[
          "Admin-curated guests only — max 30 per city floor",
          "Landscape cards with bio, religion, stay type",
          "Send gifts with a personal note",
          "2 free gifts daily — coins for more",
          "Mutual like → private Vault chat opens",
          "Vault chat never expires for members",
          "Browse other city floors for +$19.99/city",
        ].map((item) => (
          <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#d4af37", flexShrink: 0, marginTop: 1 }}>◆</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Men — coin gate */}
      <div style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, padding: 16, marginBottom: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 900, color: "#d4af37", margin: "0 0 4px" }}>🧔 Entry for Men</p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: "0 0 14px", lineHeight: 1.5 }}>
          Access the Tonight pool for 24 hours. Only verified women appear here — always available tonight.
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSubscribe}
          style={{
            width: "100%", height: 50, borderRadius: 14, border: "none",
            background: "linear-gradient(135deg, #92660a, #d4af37, #f0d060)",
            color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer",
            boxShadow: "0 4px 24px rgba(212,175,55,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <span>🪙</span>
          <span>Enter Tonight — {PENTHOUSE_ENTRY_COST} coins · 24hrs</span>
        </motion.button>
      </div>

      {/* Women — free entry info */}
      <div style={{
        background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)",
        borderRadius: 14, padding: "14px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>👩</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 800, color: "#d4af37", margin: "0 0 2px" }}>
            Women enter free — always
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.5 }}>
            Select Penthouse in your profile setup · face verification required · earn coins from gifts
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const PENTHOUSE_ENTRY_COST = 100; // coins for men

function getPenthouseAccess(): boolean {
  try {
    const profile = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    // Women who selected penthouse in setup — always in
    if (localStorage.getItem("ghost_penthouse_member") === "1" && profile.gender === "Female") return true;
    // Men — check nightly access window
    const until = Number(localStorage.getItem("ghost_penthouse_access_until") || "0");
    return Date.now() < until;
  } catch { return false; }
}

function grantPenthouseAccess(): void {
  try {
    const until = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    localStorage.setItem("ghost_penthouse_access_until", String(until));
  } catch {}
}

export default function PenthouseFloorPage() {
  const navigate     = useNavigate();
  const [subscribed, setSubscribed]   = useState(getPenthouseAccess);
  const [coinBalance, setCoinBalance] = useState(readCoins);
  const isMember = (() => { try { return localStorage.getItem("ghost_penthouse_member") === "1"; } catch { return false; } })();
  const [likedIds, setLikedIds]       = useState<string[]>(getPenthouseLikedIds);
  const [dailyUsed, setDailyUsed]     = useState(getDailyGiftsUsed);
  const [giftTarget, setGiftTarget]   = useState<PenthouseProfile | null>(null);
  const [newArrival, setNewArrival]   = useState<PenthouseProfile | null>(null);
  const [activeCity, setActiveCity]   = useState("JKT");
  const [justLiked, setJustLiked]     = useState<string | null>(null);
  const [penthouseTab, setPenthouseTab] = useState<"ilike" | "liked">("ilike");
  const ptRevertRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownArrival = useRef(false);

  const startPtRevert = useCallback(() => {
    if (ptRevertRef.current) clearTimeout(ptRevertRef.current);
    ptRevertRef.current = setTimeout(() => setPenthouseTab("ilike"), 10000);
  }, []);

  const cancelPtRevert = useCallback(() => {
    if (ptRevertRef.current) { clearTimeout(ptRevertRef.current); ptRevertRef.current = null; }
  }, []);

  // Auto-revert "liked" tab back to "ilike" after 10s
  useEffect(() => {
    if (penthouseTab === "liked") startPtRevert();
    else cancelPtRevert();
    return () => cancelPtRevert();
  }, [penthouseTab, startPtRevert, cancelPtRevert]);

  const ptILikeList = useMemo(() =>
    MOCK_PENTHOUSE_PROFILES.filter(p => likedIds.includes(p.id)),
    [likedIds]);

  const ptLikedMeList = useMemo(() => {
    const notLiked = MOCK_PENTHOUSE_PROFILES.filter(p => !likedIds.includes(p.id));
    return [...notLiked].sort((a, _b) => {
      const idx = notLiked.indexOf(a);
      return (Math.abs(Math.sin(idx * 127)) * notLiked.length | 0) - idx;
    });
  }, [likedIds]);

  const extraCities = getPenthouseExtraCities();
  const profiles    = MOCK_PENTHOUSE_PROFILES.filter((p) => p.cityCode === activeCity && p.status === "active");

  // New arrival event — fires once per session on mount
  useEffect(() => {
    if (!subscribed || shownArrival.current) return;
    const arrival = profiles.find((p) => p.isNewArrival);
    if (arrival) {
      shownArrival.current = true;
      const t = setTimeout(() => setNewArrival(arrival), 600);
      return () => clearTimeout(t);
    }
  }, [subscribed]);

  const handleLike = (profile: PenthouseProfile) => {
    addPenthouseLike(profile.id);
    setLikedIds((prev) => [...prev, profile.id]);
    setJustLiked(profile.id);
    setTimeout(() => setJustLiked(null), 1800);
  };

  const handleGiftSent = (coinsSpent: number) => {
    if (coinsSpent > 0) {
      const next = Math.max(0, coinBalance - coinsSpent);
      setCoinBalance(next);
      writeCoins(next);
    }
    setDailyUsed(getDailyGiftsUsed());
    setGiftTarget(null);
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "#060402",
      color: "#fff", fontFamily: "inherit",
      paddingBottom: "env(safe-area-inset-bottom, 20px)",
    }}>
      {/* ── Top bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(6,4,2,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(212,175,55,0.12)",
        padding: "12px 16px 10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => navigate("/ghost/mode")}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", padding: 0, lineHeight: 1 }}
            >←</button>
            <div>
              <p style={{
                fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #c9a227, #f0d060, #d4af37)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Penthouse</p>
              <p style={{ fontSize: 9, color: "rgba(212,175,55,0.45)", margin: 0, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Tonight Only · Always Available
              </p>
            </div>
          </div>
          {subscribed && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 8, padding: "4px 8px" }}>
                <span style={{ fontSize: 12 }}>🪙</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#d4af37", fontVariantNumeric: "tabular-nums" }}>{coinBalance}</span>
              </div>
              <div style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 6, padding: "3px 8px" }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: "#d4af37", letterSpacing: "0.08em" }}>MEMBER</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        {!subscribed ? (
          <PenthouseTeaser onSubscribe={() => {
            if (coinBalance < PENTHOUSE_ENTRY_COST) {
              alert(`You need ${PENTHOUSE_ENTRY_COST} coins to enter. You have ${coinBalance}.`);
              return;
            }
            const next = coinBalance - PENTHOUSE_ENTRY_COST;
            writeCoins(next);
            setCoinBalance(next);
            grantPenthouseAccess();
            setSubscribed(true);
          }} />
        ) : (
          <>
            {/* ── I Like / Liked Me container ── */}
            {(() => {
              const GOLD      = "#d4af37";
              const avatarW   = "calc((100vw - 108px) / 3)";
              const avatarH   = 78;
              const list      = penthouseTab === "liked" ? ptLikedMeList : ptILikeList;
              const header    = penthouseTab === "liked" ? "💛 Liked Me" : "💛 I Like";

              return (
                <div style={{
                  padding: "10px 16px 6px", margin: "0 0 0",
                  position: "relative", overflow: "hidden",
                  borderRadius: 16,
                }}>
                  {/* Background image */}
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 16,
                    backgroundImage: `url(${PENTHOUSE_BG})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    opacity: 0.55,
                    pointerEvents: "none",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 16,
                    background: "linear-gradient(to right, rgba(6,4,2,0.72), rgba(6,4,2,0.45))",
                    pointerEvents: "none",
                  }} />
                  <div style={{ position: "relative", zIndex: 1 }}>
                  <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(212,175,55,0.6)", margin: "0 0 8px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    {header}
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    {/* Scrollable profiles */}
                    <div
                      style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}
                      onScroll={() => { if (penthouseTab === "liked") startPtRevert(); }}
                    >
                      {list.length === 0 ? (
                        <div style={{ flex: 1, height: avatarH, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: 0 }}>
                            {penthouseTab === "ilike" ? "No likes yet" : "No likes received yet"}
                          </p>
                        </div>
                      ) : list.map(p => (
                        <div
                          key={p.id}
                          style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
                          onClick={() => { cancelPtRevert(); setGiftTarget(p); }}
                        >
                          <div style={{
                            width: avatarW, height: avatarH, borderRadius: 12, overflow: "hidden",
                            border: `2px solid ${penthouseTab === "liked" ? "rgba(212,175,55,0.7)" : "rgba(212,175,55,0.3)"}`,
                            boxShadow: penthouseTab === "liked" ? "0 0 12px rgba(212,175,55,0.4)" : "none",
                            position: "relative", flexShrink: 0,
                          }}>
                            <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                            {penthouseTab === "liked" && (
                              <div style={{
                                position: "absolute", top: 4, right: 4,
                                width: 14, height: 14, borderRadius: "50%",
                                background: GOLD, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 7, color: "#000", fontWeight: 900,
                              }}>♥</div>
                            )}
                            {penthouseTab === "ilike" && likedIds.includes(p.id) && (
                              <div style={{
                                position: "absolute", bottom: 0, left: 0, right: 0, height: 20,
                                background: "linear-gradient(transparent, rgba(212,175,55,0.35))",
                                display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 2,
                              }}>
                                <span style={{ fontSize: 7, color: GOLD, fontWeight: 900 }}>LIKED</span>
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 700, width: avatarW, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {p.name.split(" ")[0]}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tab buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => setPenthouseTab("ilike")}
                        style={{
                          width: 52, height: 44, borderRadius: 10, border: "none", cursor: "pointer",
                          background: penthouseTab === "ilike" ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)",
                          outline: penthouseTab === "ilike" ? `1.5px solid rgba(212,175,55,0.55)` : "1px solid rgba(255,255,255,0.09)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                        }}
                      >
                        <span style={{ fontSize: 12 }}>💛</span>
                        <span style={{ fontSize: 7, fontWeight: 800, color: penthouseTab === "ilike" ? GOLD : "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>I LIKE</span>
                      </button>
                      <button
                        onClick={() => setPenthouseTab("liked")}
                        style={{
                          width: 52, height: 44, borderRadius: 10, border: "none", cursor: "pointer",
                          background: penthouseTab === "liked" ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)",
                          outline: penthouseTab === "liked" ? `1.5px solid rgba(212,175,55,0.55)` : "1px solid rgba(255,255,255,0.09)",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                        }}
                      >
                        <span style={{ fontSize: 12 }}>💗</span>
                        <span style={{ fontSize: 7, fontWeight: 800, color: penthouseTab === "liked" ? GOLD : "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>LIKED ME</span>
                      </button>
                    </div>
                  </div>
                  </div>{/* end zIndex wrapper */}
                </div>
              );
            })()}

            {/* ── City selector ── */}
            <div style={{ display: "flex", overflowX: "auto", gap: 8, padding: "12px 16px 8px", scrollbarWidth: "none" }}>
              {PENTHOUSE_CITIES.map((city) => {
                const hasAccess = city.code === "JKT" || extraCities.includes(city.code);
                const active    = activeCity === city.code;
                return (
                  <motion.button
                    key={city.code} whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (hasAccess) { setActiveCity(city.code); }
                      else { alert(`Add ${city.name} for ${PENTHOUSE_EXTRA_CITY_PRICE} one-time`); }
                    }}
                    style={{
                      flexShrink: 0, height: 32, borderRadius: 50, padding: "0 12px",
                      background: active ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                      border: active ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      color: active ? "#d4af37" : hasAccess ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)",
                      fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <span>{city.flag}</span>
                    <span>{city.name}</span>
                    {!hasAccess && <span style={{ fontSize: 8, color: "rgba(212,175,55,0.5)" }}>+{PENTHOUSE_EXTRA_CITY_PRICE}</span>}
                  </motion.button>
                );
              })}
            </div>

            {/* ── Floor header ── */}
            <div style={{ padding: "4px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, fontWeight: 600 }}>
                {profiles.length} guests on the floor · Max {30}
              </p>
              <p style={{ fontSize: 10, color: "rgba(212,175,55,0.5)", margin: 0, fontWeight: 700 }}>
                {PENTHOUSE_DAILY_FREE_GIFTS - dailyUsed > 0 ? `${PENTHOUSE_DAILY_FREE_GIFTS - dailyUsed} free gift${PENTHOUSE_DAILY_FREE_GIFTS - dailyUsed !== 1 ? "s" : ""} left today` : "Daily gifts used"}
              </p>
            </div>

            {/* ── Landscape cards ── */}
            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
              {profiles.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>🏨</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>Floor is quiet tonight</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>New guests arrive regularly — check back soon</p>
                </div>
              ) : (
                profiles.map((p) => (
                  <div key={p.id} style={{ position: "relative" }}>
                    <PenthouseLandscapeCard
                      profile={p}
                      liked={likedIds.includes(p.id)}
                      onLike={() => handleLike(p)}
                      onGift={() => setGiftTarget(p)}
                    />
                    {justLiked === p.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        style={{
                          position: "absolute", inset: 0, borderRadius: 18,
                          background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.5)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          pointerEvents: "none",
                        }}
                      >
                        <p style={{ fontSize: 28, fontWeight: 900, color: "#d4af37" }}>♥</p>
                      </motion.div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* ── Note cost hint ── */}
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", textAlign: "center", padding: "20px 16px 8px", lineHeight: 1.6 }}>
              Reply notes cost 🪙{PENTHOUSE_NOTE_COST} · Vault messages 🪙2 · She earns 60% of every gift
            </p>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {newArrival && (
          <NewArrivalOverlay profile={newArrival} onDismiss={() => setNewArrival(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {giftTarget && (
          <GiftTray
            profile={giftTarget}
            coinBalance={coinBalance}
            dailyUsed={dailyUsed}
            onClose={() => setGiftTarget(null)}
            onSent={handleGiftSent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
