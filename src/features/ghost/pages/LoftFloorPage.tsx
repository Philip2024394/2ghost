import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MOCK_LOFT_PROFILES, LOFT_GIFTS, LOFT_CITIES,
  LOFT_SUB_PRICE, LOFT_EXTRA_CITY_PRICE,
  LOFT_DAILY_FREE_GIFTS, LOFT_NOTE_COST, LOFT_OPENER_MAX_CHARS,
  type LoftProfile, type LoftSection,
} from "../types/loftTypes";
import {
  isLoftSubscribed, activateLoftSub, getLoftDailyGiftsUsed, incrementLoftDailyGifts,
  addLoftGift, getLoftLikedIds, addLoftLike, getLoftExtraCities,
} from "../utils/loftHelpers";
import LoftLandscapeCard from "../components/LoftLandscapeCard";

// ── Image — user to provide ──────────────────────────────────────────────────
const LOFT_BG = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsdstertefsdfsd.png";

const VIOLET       = "#8b5cf6";
const VIOLET_GRAD  = "linear-gradient(135deg, #4c1d95, #7c3aed, #a78bfa)";
const VIOLET_DARK  = "rgba(8,6,14,0.98)";

// ── Helpers ──────────────────────────────────────────────────────────────────
function readCoins(): number  { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } }
function writeCoins(n: number): void { try { localStorage.setItem("ghost_coins", String(n)); } catch {} }

// ── Gift Tray ─────────────────────────────────────────────────────────────────
function LoftGiftTray({ profile, coinBalance, dailyUsed, onClose, onSent }: {
  profile: LoftProfile;
  coinBalance: number;
  dailyUsed: number;
  onClose: () => void;
  onSent: (coinsSpent: number) => void;
}) {
  const [selectedGift, setSelectedGift] = useState<typeof LOFT_GIFTS[number] | null>(null);
  const [openerNote,   setOpenerNote]   = useState("");
  const [sending,      setSending]      = useState(false);
  const [sent,         setSent]         = useState(false);

  const isFree   = dailyUsed < LOFT_DAILY_FREE_GIFTS;
  const giftCost = selectedGift ? (isFree ? 0 : selectedGift.coins) : 0;
  const canAfford = coinBalance >= giftCost;
  const canSend   = selectedGift && openerNote.trim().length >= 10 && canAfford && !sending;

  const handleSend = () => {
    if (!selectedGift || !canSend) return;
    setSending(true);
    setTimeout(() => {
      const coinsEarned = Math.floor(selectedGift.coins * 0.6);
      addLoftGift({
        id: `loft-gift-${Date.now()}`,
        fromGhostId: "me",
        toProfileId: profile.id,
        giftKey: selectedGift.key,
        giftName: selectedGift.name,
        giftEmoji: selectedGift.emoji,
        openerNote: openerNote.trim(),
        coinsPaid: giftCost,
        coinsEarned,
        sentAt: Date.now(),
        status: "pending",
      });
      if (!isFree) {
        writeCoins(coinBalance - giftCost);
        onSent(giftCost);
      } else {
        incrementLoftDailyGifts();
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
        background: "rgba(0,0,0,0.88)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: VIOLET_DARK, borderRadius: "24px 24px 0 0",
          border: `1px solid ${VIOLET}33`, borderBottom: "none", overflow: "hidden",
        }}
      >
        {/* Violet top bar */}
        <div style={{ height: 3, background: VIOLET_GRAD }} />
        <div style={{ padding: "18px 20px max(32px,env(safe-area-inset-bottom,32px))" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: `${VIOLET}22`, margin: "0 auto 18px" }} />

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <img src={profile.photo} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: `2px solid ${VIOLET}55` }} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
            <div>
              <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>Send a gift to {profile.name}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                {isFree ? `${LOFT_DAILY_FREE_GIFTS - dailyUsed} free gift${LOFT_DAILY_FREE_GIFTS - dailyUsed !== 1 ? "s" : ""} remaining today` : "Daily free gifts used · coins apply"}
              </p>
            </div>
          </div>

          {sent ? (
            <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🍸</div>
              <p style={{ fontSize: 15, fontWeight: 800, color: VIOLET, margin: "0 0 4px" }}>Gift sent with style</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{profile.name} will be notified</p>
            </div>
          ) : (
            <>
              {/* Gift grid */}
              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Choose a gift</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 18 }}>
                {LOFT_GIFTS.map(g => {
                  const cost = isFree ? 0 : g.coins;
                  const affordable = coinBalance >= cost;
                  const selected = selectedGift?.key === g.key;
                  return (
                    <motion.button
                      key={g.key} whileTap={{ scale: 0.94 }}
                      onClick={() => setSelectedGift(g)}
                      style={{
                        borderRadius: 12, padding: "10px 4px 8px", border: "none", cursor: affordable ? "pointer" : "default",
                        background: selected ? `${VIOLET}22` : "rgba(255,255,255,0.04)",
                        outline: selected ? `1.5px solid ${VIOLET}88` : "1px solid rgba(255,255,255,0.07)",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        opacity: affordable ? 1 : 0.4,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{g.emoji}</span>
                      <span style={{ fontSize: 7, color: selected ? VIOLET : "rgba(255,255,255,0.5)", fontWeight: 700, textAlign: "center" }}>{g.name}</span>
                      <span style={{ fontSize: 8, fontWeight: 900, color: isFree ? "#4ade80" : VIOLET }}>
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
                    Add a note <span style={{ color: "rgba(255,255,255,0.15)", fontWeight: 600 }}>(required · {LOFT_OPENER_MAX_CHARS} chars)</span>
                  </p>
                  <textarea
                    value={openerNote}
                    onChange={e => setOpenerNote(e.target.value.slice(0, LOFT_OPENER_MAX_CHARS))}
                    placeholder="A short, genuine note — this is your first impression..."
                    rows={3}
                    style={{
                      width: "100%", borderRadius: 12, border: `1px solid ${VIOLET}33`,
                      background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12,
                      padding: "10px 12px", resize: "none", outline: "none",
                      fontFamily: "inherit", lineHeight: 1.55, boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Min. 10 characters</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontVariantNumeric: "tabular-nums" }}>{openerNote.length}/{LOFT_OPENER_MAX_CHARS}</span>
                  </div>
                </motion.div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }} onClick={handleSend} disabled={!canSend}
                style={{
                  width: "100%", height: 50, borderRadius: 14, border: "none",
                  background: canSend ? VIOLET_GRAD : "rgba(255,255,255,0.06)",
                  color: canSend ? "#fff" : "rgba(255,255,255,0.2)",
                  fontSize: 14, fontWeight: 900, cursor: canSend ? "pointer" : "default",
                  boxShadow: canSend ? `0 6px 24px ${VIOLET}55` : "none",
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

// ── New Arrival Overlay ───────────────────────────────────────────────────────
function LoftNewArrival({ profile, onDismiss }: { profile: LoftProfile; onDismiss: () => void }) {
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
      <div style={{
        position: "absolute", inset: 0,
        background: LOFT_BG ? `url(${LOFT_BG})` : `linear-gradient(135deg, #0d0520, #1e0a40, #0d0520)`,
        backgroundSize: "cover", backgroundPosition: "center",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to bottom, rgba(8,4,18,0.55) 0%, rgba(8,4,18,0.75) 50%, rgba(8,4,18,0.96) 100%)",
      }} />
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.15 }}
        style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 360, textAlign: "center" }}
      >
        <p style={{ fontSize: 10, fontWeight: 800, color: `${VIOLET}bb`, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 20px" }}>
          A new guest has arrived in the Loft tonight
        </p>
        <div style={{
          borderRadius: 20, overflow: "hidden",
          border: `1px solid ${VIOLET}55`,
          boxShadow: `0 0 80px ${VIOLET}22`, marginBottom: 20,
        }}>
          <img src={profile.photo} alt={profile.name}
            style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
            onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          <div style={{ background: VIOLET_DARK, padding: "14px 16px", borderTop: `1px solid ${VIOLET}22` }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>{profile.name}, {profile.age}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>{profile.countryFlag} {profile.city}</p>
          </div>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>Tap anywhere to continue →</p>
      </motion.div>
    </motion.div>
  );
}

// ── Teaser ────────────────────────────────────────────────────────────────────
function LoftTeaser({ onSubscribe }: { onSubscribe: () => void }) {
  const preview = MOCK_LOFT_PROFILES.slice(0, 3);
  return (
    <div style={{ padding: "0 16px 40px" }}>
      {/* Stats */}
      <div style={{
        display: "flex", gap: 0, marginBottom: 24,
        background: `${VIOLET}0d`, border: `1px solid ${VIOLET}2a`, borderRadius: 14,
      }}>
        {[
          { value: MOCK_LOFT_PROFILES.length, label: "in the Loft" },
          { value: MOCK_LOFT_PROFILES.filter(p => p.isNewArrival).length, label: "new arrivals" },
          { value: 3, label: "sections" },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center", padding: "14px 8px",
            borderRight: i < 2 ? `1px solid ${VIOLET}18` : "none",
          }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: VIOLET, margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: 0, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Section badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "center" }}>
        {[
          { icon: "🧔", label: "Men's Lounge",    desc: "Gay men · curated" },
          { icon: "👩", label: "Women's Suite",   desc: "Lesbian women · curated" },
          { icon: "✨", label: "The Mix",          desc: "Fluid · open · free" },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, borderRadius: 12, padding: "10px 8px", textAlign: "center",
            background: `${VIOLET}0a`, border: `1px solid ${VIOLET}22`,
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <p style={{ fontSize: 9, fontWeight: 900, color: VIOLET, margin: "0 0 2px" }}>{s.label}</p>
            <p style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", margin: 0 }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Blurred preview */}
      <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.2)", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>
        Preview — members only
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28, filter: "blur(6px)", pointerEvents: "none", opacity: 0.6 }}>
        {preview.map(p => (
          <div key={p.id} style={{
            width: "100%", borderRadius: 16, overflow: "hidden",
            border: `1px solid ${VIOLET}22`, display: "flex", minHeight: 120,
          }}>
            <img src={p.photo} alt="" style={{ width: "40%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
            <div style={{ flex: 1, padding: 12, background: VIOLET_DARK }}>
              <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 3px" }}>{p.name}, {p.age}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 8px" }}>{p.countryFlag} {p.city}</p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {p.tags.slice(0, 2).map(t => (
                  <span key={t} style={{ fontSize: 8, background: `${VIOLET}18`, color: `${VIOLET}cc`, borderRadius: 4, padding: "2px 6px", fontWeight: 700 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* What's included */}
      <div style={{ background: `${VIOLET}08`, border: `1px solid ${VIOLET}25`, borderRadius: 16, padding: 16, marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: VIOLET, margin: "0 0 12px" }}>🪟 What The Loft includes</p>
        {[
          "Three curated sections — Men, Women, The Mix",
          "Admin-verified guests only — max 30 per city",
          "Send gifts with a personal opener note",
          "2 free gifts daily — coins for more",
          "Mutual like → private Vault chat opens",
          "Browse other city Lofts for +$14.99/city",
          "Safe, respectful, anonymous — always",
        ].map(item => (
          <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: VIOLET, flexShrink: 0, marginTop: 1 }}>◆</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Subscribe CTA */}
      <motion.button
        whileTap={{ scale: 0.97 }} onClick={onSubscribe}
        style={{
          width: "100%", height: 54, borderRadius: 16, border: "none",
          background: VIOLET_GRAD,
          color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer",
          boxShadow: `0 6px 32px ${VIOLET}55`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}
      >
        <span>🪟</span>
        <span>Enter The Loft — {LOFT_SUB_PRICE}/mo</span>
      </motion.button>
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 10 }}>
        Cancel anytime · Curated guests · Safe & anonymous
      </p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LoftFloorPage() {
  const navigate = useNavigate();

  const [subscribed,   setSubscribed]   = useState(isLoftSubscribed);
  const [coinBalance,  setCoinBalance]  = useState(readCoins);
  const [likedIds,     setLikedIds]     = useState<string[]>(getLoftLikedIds);
  const [dailyUsed,    setDailyUsed]    = useState(getLoftDailyGiftsUsed);
  const [giftTarget,   setGiftTarget]   = useState<LoftProfile | null>(null);
  const [newArrival,   setNewArrival]   = useState<LoftProfile | null>(null);
  const [activeCity,   setActiveCity]   = useState("LON");
  const [section,      setSection]      = useState<LoftSection>("men");
  const [justLiked,    setJustLiked]    = useState<string | null>(null);
  const [loftTab,      setLoftTab]      = useState<"ilike" | "liked">("ilike");
  const loftRevertRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownArrival   = useRef(false);

  const extraCities = getLoftExtraCities();
  const profiles    = MOCK_LOFT_PROFILES.filter(p => p.cityCode === activeCity && p.section === section && p.status === "active");

  const startLoftRevert = useCallback(() => {
    if (loftRevertRef.current) clearTimeout(loftRevertRef.current);
    loftRevertRef.current = setTimeout(() => setLoftTab("ilike"), 10000);
  }, []);
  const cancelLoftRevert = useCallback(() => {
    if (loftRevertRef.current) { clearTimeout(loftRevertRef.current); loftRevertRef.current = null; }
  }, []);

  useEffect(() => {
    if (loftTab === "liked") startLoftRevert();
    else cancelLoftRevert();
    return () => cancelLoftRevert();
  }, [loftTab, startLoftRevert, cancelLoftRevert]);

  const loftILikeList  = useMemo(() => MOCK_LOFT_PROFILES.filter(p => likedIds.includes(p.id)), [likedIds]);
  const loftLikedMeList = useMemo(() => {
    const notLiked = MOCK_LOFT_PROFILES.filter(p => !likedIds.includes(p.id));
    return [...notLiked].sort((a, _b) => {
      const idx = notLiked.indexOf(a);
      return (Math.abs(Math.sin(idx * 127)) * notLiked.length | 0) - idx;
    });
  }, [likedIds]);

  // New arrival — fires once per session
  useEffect(() => {
    if (!subscribed || shownArrival.current) return;
    const arrival = MOCK_LOFT_PROFILES.find(p => p.isNewArrival);
    if (arrival) {
      shownArrival.current = true;
      const t = setTimeout(() => setNewArrival(arrival), 600);
      return () => clearTimeout(t);
    }
  }, [subscribed]);

  const handleLike = (p: LoftProfile) => {
    addLoftLike(p.id);
    setLikedIds(prev => [...prev, p.id]);
    setJustLiked(p.id);
    setTimeout(() => setJustLiked(null), 1800);
  };

  const handleGiftSent = (coinsSpent: number) => {
    if (coinsSpent > 0) {
      const next = Math.max(0, coinBalance - coinsSpent);
      setCoinBalance(next);
      writeCoins(next);
    }
    setDailyUsed(getLoftDailyGiftsUsed());
    setGiftTarget(null);
  };

  const SECTIONS: { key: LoftSection; icon: string; label: string }[] = [
    { key: "men",   icon: "🧔", label: "Men's Lounge"  },
    { key: "women", icon: "👩", label: "Women's Suite" },
    { key: "mix",   icon: "✨", label: "The Mix"       },
  ];

  return (
    <div style={{
      minHeight: "100dvh",
      background: LOFT_BG ? `#08060e` : "linear-gradient(180deg, #08060e 0%, #0d0520 100%)",
      color: "#fff", fontFamily: "inherit",
      paddingBottom: "env(safe-area-inset-bottom, 20px)",
    }}>
      {/* Background image (fills in when LOFT_BG is set) */}
      {LOFT_BG && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: `url(${LOFT_BG})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.08, pointerEvents: "none" }} />
          <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "rgba(8,6,14,0.88)", pointerEvents: "none" }} />
        </>
      )}

      {/* ── Top bar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(8,6,14,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${VIOLET}1a`,
        padding: "12px 16px 10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => navigate(-1)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", padding: 0 }}
            >←</button>
            <div>
              <p style={{
                fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: "-0.02em",
                background: VIOLET_GRAD,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>The Loft</p>
              <p style={{ fontSize: 9, color: `${VIOLET}66`, margin: 0, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Top floor · Curated · Safe
              </p>
            </div>
          </div>
          {subscribed && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: `${VIOLET}12`, border: `1px solid ${VIOLET}30`, borderRadius: 8, padding: "4px 8px" }}>
                <span style={{ fontSize: 12 }}>🪙</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: VIOLET, fontVariantNumeric: "tabular-nums" }}>{coinBalance}</span>
              </div>
              <div style={{ background: `${VIOLET}18`, border: `1px solid ${VIOLET}44`, borderRadius: 6, padding: "3px 8px" }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: VIOLET, letterSpacing: "0.08em" }}>MEMBER</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", position: "relative", zIndex: 2 }}>
        {!subscribed ? (
          <LoftTeaser onSubscribe={() => { activateLoftSub(); setSubscribed(true); }} />
        ) : (
          <>
            {/* ── I Like / Liked Me container ── */}
            {(() => {
              const avatarW = "calc((100vw - 108px) / 3)";
              const avatarH = 78;
              const list    = loftTab === "liked" ? loftLikedMeList : loftILikeList;
              const header  = loftTab === "liked" ? "💜 Liked Me" : "💜 I Like";

              return (
                <div style={{
                  padding: "10px 16px 6px", margin: "0",
                  position: "relative", overflow: "hidden", borderRadius: 16,
                }}>
                  {LOFT_BG && <>
                    <div style={{ position: "absolute", inset: 0, borderRadius: 16, backgroundImage: `url(${LOFT_BG})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5, pointerEvents: "none" }} />
                    <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: "linear-gradient(to right, rgba(8,4,18,0.72), rgba(8,4,18,0.45))", pointerEvents: "none" }} />
                  </>}
                  {!LOFT_BG && (
                    <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: `linear-gradient(135deg, rgba(76,29,149,0.25), rgba(139,92,246,0.1))`, border: `1px solid ${VIOLET}22`, pointerEvents: "none" }} />
                  )}
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <p style={{ fontSize: 9, fontWeight: 800, color: `${VIOLET}88`, margin: "0 0 8px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      {header}
                    </p>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      {/* Scrollable profiles */}
                      <div
                        style={{ flex: 1, display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}
                        onScroll={() => { if (loftTab === "liked") startLoftRevert(); }}
                      >
                        {list.length === 0 ? (
                          <div style={{ flex: 1, height: avatarH, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: 0 }}>
                              {loftTab === "ilike" ? "No likes yet" : "No likes received yet"}
                            </p>
                          </div>
                        ) : list.map(p => (
                          <div
                            key={p.id}
                            style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
                            onClick={() => { cancelLoftRevert(); setGiftTarget(p); }}
                          >
                            <div style={{
                              width: avatarW, height: avatarH, borderRadius: 12, overflow: "hidden",
                              border: `2px solid ${loftTab === "liked" ? `${VIOLET}bb` : `${VIOLET}44`}`,
                              boxShadow: loftTab === "liked" ? `0 0 12px ${VIOLET}55` : "none",
                              position: "relative", flexShrink: 0,
                            }}>
                              <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                              {loftTab === "liked" && (
                                <div style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, borderRadius: "50%", background: VIOLET, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#fff", fontWeight: 900 }}>♥</div>
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
                          onClick={() => setLoftTab("ilike")}
                          style={{
                            width: 52, height: 44, borderRadius: 10, border: "none", cursor: "pointer",
                            background: loftTab === "ilike" ? `${VIOLET}28` : "rgba(255,255,255,0.05)",
                            outline: loftTab === "ilike" ? `1.5px solid ${VIOLET}77` : "1px solid rgba(255,255,255,0.09)",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                          }}
                        >
                          <span style={{ fontSize: 12 }}>💜</span>
                          <span style={{ fontSize: 7, fontWeight: 800, color: loftTab === "ilike" ? VIOLET : "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>I LIKE</span>
                        </button>
                        <button
                          onClick={() => setLoftTab("liked")}
                          style={{
                            width: 52, height: 44, borderRadius: 10, border: "none", cursor: "pointer",
                            background: loftTab === "liked" ? `${VIOLET}28` : "rgba(255,255,255,0.05)",
                            outline: loftTab === "liked" ? `1.5px solid ${VIOLET}77` : "1px solid rgba(255,255,255,0.09)",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                          }}
                        >
                          <span style={{ fontSize: 12 }}>💗</span>
                          <span style={{ fontSize: 7, fontWeight: 800, color: loftTab === "liked" ? VIOLET : "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>LIKED ME</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Section tabs ── */}
            <div style={{ display: "flex", gap: 8, padding: "10px 16px 4px" }}>
              {SECTIONS.map(s => (
                <motion.button
                  key={s.key} whileTap={{ scale: 0.95 }}
                  onClick={() => setSection(s.key)}
                  style={{
                    flex: 1, height: 48, borderRadius: 12, border: "none", cursor: "pointer",
                    background: section === s.key ? VIOLET_GRAD : "rgba(255,255,255,0.04)",
                    outline: section === s.key ? "none" : `1px solid ${VIOLET}22`,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                    boxShadow: section === s.key ? `0 4px 18px ${VIOLET}44` : "none",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{s.icon}</span>
                  <span style={{ fontSize: 8, fontWeight: 900, color: section === s.key ? "#fff" : "rgba(255,255,255,0.35)", letterSpacing: "0.05em" }}>
                    {s.label.toUpperCase()}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* ── City selector ── */}
            <div style={{ display: "flex", overflowX: "auto", gap: 8, padding: "8px 16px", scrollbarWidth: "none" }}>
              {LOFT_CITIES.map(city => {
                const hasAccess = city.code === "LON" || extraCities.includes(city.code);
                const active    = activeCity === city.code;
                return (
                  <motion.button
                    key={city.code} whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (hasAccess) setActiveCity(city.code);
                      else alert(`Add ${city.name} for ${LOFT_EXTRA_CITY_PRICE}/mo`);
                    }}
                    style={{
                      flexShrink: 0, height: 32, borderRadius: 50, padding: "0 12px",
                      background: active ? `${VIOLET}22` : "rgba(255,255,255,0.04)",
                      border: active ? `1px solid ${VIOLET}77` : "1px solid rgba(255,255,255,0.08)",
                      color: active ? VIOLET : hasAccess ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)",
                      fontSize: 11, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <span>{city.flag}</span>
                    <span>{city.name}</span>
                    {!hasAccess && <span style={{ fontSize: 8, color: `${VIOLET}88` }}>+{LOFT_EXTRA_CITY_PRICE}</span>}
                  </motion.button>
                );
              })}
            </div>

            {/* ── Floor header ── */}
            <div style={{ padding: "4px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0, fontWeight: 600 }}>
                {profiles.length} guests in {SECTIONS.find(s => s.key === section)?.label}
              </p>
              <p style={{ fontSize: 10, color: `${VIOLET}88`, margin: 0, fontWeight: 700 }}>
                {LOFT_DAILY_FREE_GIFTS - dailyUsed > 0
                  ? `${LOFT_DAILY_FREE_GIFTS - dailyUsed} free gift${LOFT_DAILY_FREE_GIFTS - dailyUsed !== 1 ? "s" : ""} left`
                  : "Daily gifts used"}
              </p>
            </div>

            {/* ── Profile cards ── */}
            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>
              {profiles.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>🪟</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>Quiet in this section</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>New guests arrive regularly — check back soon</p>
                </div>
              ) : (
                profiles.map(p => (
                  <div key={p.id} style={{ position: "relative" }}>
                    <LoftLandscapeCard
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
                          background: `${VIOLET}12`, border: `1px solid ${VIOLET}66`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          pointerEvents: "none",
                        }}
                      >
                        <p style={{ fontSize: 28, fontWeight: 900, color: VIOLET }}>♥</p>
                      </motion.div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Note hint */}
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", textAlign: "center", padding: "20px 16px 8px", lineHeight: 1.6 }}>
              Reply notes cost 🪙{LOFT_NOTE_COST} · Vault messages 🪙2 · They earn 60% of every gift
            </p>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {newArrival && <LoftNewArrival profile={newArrival} onDismiss={() => setNewArrival(null)} />}
      </AnimatePresence>
      <AnimatePresence>
        {giftTarget && (
          <LoftGiftTray
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
