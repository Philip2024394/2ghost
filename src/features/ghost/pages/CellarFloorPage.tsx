import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MOCK_CELLAR_PROFILES, CELLAR_GIFTS, CELLAR_CITIES,
  CELLAR_SUB_PRICE, CELLAR_EXTRA_CITY_PRICE,
  CELLAR_DAILY_FREE_GIFTS, CELLAR_OPENER_MAX_CHARS,
  type CellarProfile, type CellarSection,
} from "../types/cellarTypes";
import {
  isCellarSubscribed, activateCellarSub, getCellarDailyGiftsUsed, incrementCellarDailyGifts,
  addCellarGift, getCellarLikedIds, addCellarLike, getCellarExtraCities,
  isCellarAgeVerified, setCellarAgeVerified,
} from "../utils/cellarHelpers";
import CellarLandscapeCard from "../components/CellarLandscapeCard";

// ── Image — user to provide ──────────────────────────────────────────────────
const CELLAR_BG = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsdstertefsdfsddsd.png";

const CRIMSON      = "#c0392b";
const CRIMSON_GRAD = "linear-gradient(135deg, #6b0f0f, #c0392b, #e8553f)";
const CRIMSON_DARK = "rgba(14,3,3,0.98)";

// ── Helpers ──────────────────────────────────────────────────────────────────
function readCoins(): number  { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } }
function writeCoins(n: number): void { try { localStorage.setItem("ghost_coins", String(n)); } catch {} }

// ── Gift Tray ─────────────────────────────────────────────────────────────────
function CellarGiftTray({ profile, coinBalance, dailyUsed, onClose, onSent }: {
  profile: CellarProfile;
  coinBalance: number;
  dailyUsed: number;
  onClose: () => void;
  onSent: (coinsSpent: number) => void;
}) {
  const [selectedGift, setSelectedGift] = useState<typeof CELLAR_GIFTS[number] | null>(null);
  const [openerNote,   setOpenerNote]   = useState("");
  const [sending,      setSending]      = useState(false);
  const [sent,         setSent]         = useState(false);

  const isFree   = dailyUsed < CELLAR_DAILY_FREE_GIFTS;
  const giftCost = selectedGift ? (isFree ? 0 : selectedGift.coins) : 0;
  const canAfford = coinBalance >= giftCost;
  const canSend   = selectedGift && openerNote.trim().length >= 10 && canAfford && !sending;

  function handleSend() {
    if (!selectedGift || !canSend) return;
    setSending(true);
    setTimeout(() => {
      const record = {
        id: `cg-${Date.now()}`,
        fromGhostId: localStorage.getItem("ghost_phone") || "anon",
        toProfileId: profile.id,
        giftKey: selectedGift.key,
        giftName: selectedGift.name,
        giftEmoji: selectedGift.emoji,
        openerNote: openerNote.trim(),
        coinsPaid: giftCost,
        coinsEarned: 0,
        sentAt: Date.now(),
        status: "pending" as const,
      };
      addCellarGift(record);
      incrementCellarDailyGifts();
      setSending(false);
      setSent(true);
      setTimeout(() => { onSent(giftCost); }, 1400);
    }, 900);
  }

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      style={{
        position: "fixed", inset: 0, zIndex: 120,
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        background: "rgba(0,0,0,0.65)",
      }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: CRIMSON_DARK, borderRadius: "20px 20px 0 0",
          border: `1px solid rgba(192,57,43,0.3)`, borderBottom: "none",
          padding: "20px 20px 36px", maxHeight: "85vh", overflowY: "auto",
        }}
      >
        {sent ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔥</div>
            <p style={{ color: "#fff", fontWeight: 900, fontSize: 18, margin: "0 0 6px" }}>Gift sent to {profile.name}</p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0 }}>Your opener note is on its way</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: "#fff" }}>Send a gift to {profile.name}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  {isFree
                    ? `${CELLAR_DAILY_FREE_GIFTS - dailyUsed} free gift${CELLAR_DAILY_FREE_GIFTS - dailyUsed !== 1 ? "s" : ""} remaining today`
                    : `${coinBalance} coins available`}
                </p>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 22, cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
            </div>

            {/* Gift grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 18 }}>
              {CELLAR_GIFTS.map(gift => {
                const cost = isFree ? 0 : gift.coins;
                const affordable = coinBalance >= cost;
                const active = selectedGift?.key === gift.key;
                return (
                  <motion.button
                    key={gift.key} whileTap={{ scale: 0.93 }}
                    onClick={() => setSelectedGift(gift)}
                    style={{
                      background: active ? `rgba(192,57,43,0.18)` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${active ? CRIMSON : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 12, padding: "10px 4px 8px",
                      cursor: affordable ? "pointer" : "not-allowed",
                      opacity: affordable ? 1 : 0.4,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{gift.emoji}</span>
                    <span style={{ fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{gift.name}</span>
                    <span style={{ fontSize: 8, fontWeight: 800, color: active ? CRIMSON : "rgba(255,255,255,0.35)" }}>
                      {cost === 0 ? "FREE" : `${cost}c`}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Opener note */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", margin: "0 0 6px" }}>
              Opener note <span style={{ color: "rgba(255,255,255,0.25)", fontWeight: 400 }}>(min 10 chars · max {CELLAR_OPENER_MAX_CHARS})</span>
            </p>
            <textarea
              value={openerNote}
              onChange={(e) => setOpenerNote(e.target.value.slice(0, CELLAR_OPENER_MAX_CHARS))}
              placeholder="Make it count — your note arrives with the gift..."
              style={{
                width: "100%", minHeight: 80, background: "rgba(255,255,255,0.04)",
                border: `1px solid rgba(192,57,43,0.2)`, borderRadius: 10, color: "#fff",
                fontSize: 13, padding: "10px 12px", resize: "none",
                outline: "none", boxSizing: "border-box", fontFamily: "inherit",
              }}
            />
            <div style={{ textAlign: "right", fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 16 }}>
              {openerNote.length}/{CELLAR_OPENER_MAX_CHARS}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSend}
              disabled={!canSend}
              style={{
                width: "100%", height: 46, borderRadius: 12, border: "none",
                background: canSend ? CRIMSON_GRAD : "rgba(255,255,255,0.06)",
                color: canSend ? "#fff" : "rgba(255,255,255,0.25)",
                fontSize: 14, fontWeight: 800, cursor: canSend ? "pointer" : "not-allowed",
              }}
            >
              {sending ? "Sending..." : selectedGift ? `Send ${selectedGift.emoji} ${selectedGift.name}` : "Select a gift"}
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Age Gate ─────────────────────────────────────────────────────────────────
function CellarAgeGate({ onConfirm, onBack }: { onConfirm: () => void; onBack: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div style={{
      minHeight: "100dvh", background: "#0a0000",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 24px",
    }}>
      {CELLAR_BG && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 0,
          backgroundImage: `url(${CELLAR_BG})`, backgroundSize: "cover", backgroundPosition: "center",
          opacity: 0.12, pointerEvents: "none",
        }} />
      )}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 360, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🔞</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          The Cellar
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 32px", lineHeight: 1.6 }}>
          Adults-only floor for people who know what they want.
          Bold, honest, no judgement — just real connections.
        </p>

        <div
          onClick={() => setChecked(c => !c)}
          style={{
            display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 28,
            background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.2)",
            borderRadius: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left",
          }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
            border: `2px solid ${checked ? CRIMSON : "rgba(255,255,255,0.2)"}`,
            background: checked ? CRIMSON : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}>
            {checked && <span style={{ color: "#fff", fontSize: 12, lineHeight: 1 }}>✓</span>}
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.55 }}>
            I confirm I am <strong style={{ color: "#fff" }}>18 years or older</strong> and I consent to entering an adults-only space with mature content and dating intent.
          </p>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { if (checked) onConfirm(); }}
          style={{
            width: "100%", height: 48, borderRadius: 12, border: "none",
            background: checked ? CRIMSON_GRAD : "rgba(255,255,255,0.06)",
            color: checked ? "#fff" : "rgba(255,255,255,0.25)",
            fontSize: 15, fontWeight: 800, cursor: checked ? "pointer" : "not-allowed",
            marginBottom: 12,
            boxShadow: checked ? "0 4px 24px rgba(192,57,43,0.5)" : "none",
          }}
        >
          {checked ? "Enter The Cellar 🔥" : "Confirm you are 18+ to enter"}
        </motion.button>
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
        >
          ← Go back
        </button>
      </div>
    </div>
  );
}

// ── New Arrival Overlay ───────────────────────────────────────────────────────
function CellarNewArrival({ profile, onDone }: { profile: CellarProfile; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 8000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div style={{
        position: "absolute", inset: 0,
        background: CELLAR_BG ? `url(${CELLAR_BG})` : `linear-gradient(135deg, #0a0000, #1a0505, #0a0000)`,
        backgroundSize: "cover", backgroundPosition: "center",
      }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(14,3,3,0.75), rgba(14,3,3,0.5))" }} />
      <div style={{ position: "relative", zIndex: 1, width: "calc(100% - 48px)", maxWidth: 340, textAlign: "center" }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 22 }}
        >
          <div style={{
            fontSize: 9, fontWeight: 900, letterSpacing: "0.18em", color: CRIMSON,
            textTransform: "uppercase", marginBottom: 16,
          }}>🔥 New in The Cellar</div>
          <div style={{
            width: 110, height: 110, borderRadius: "50%", overflow: "hidden",
            margin: "0 auto 16px",
            border: `3px solid ${CRIMSON}`, boxShadow: `0 0 32px rgba(192,57,43,0.5)`,
          }}>
            <img src={profile.photo} alt={profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
          </div>
          <p style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{profile.name}</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 12px" }}>{profile.countryFlag} {profile.city} · {profile.age}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: "0 0 24px" }}>{profile.bio}</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onDone}
            style={{
              background: CRIMSON_GRAD, border: "none", borderRadius: 12,
              color: "#fff", fontWeight: 800, fontSize: 14, padding: "12px 28px", cursor: "pointer",
            }}
          >
            Enter The Cellar →
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ── Teaser (not subscribed) ───────────────────────────────────────────────────
function CellarTeaser({ onSubscribe }: { onSubscribe: () => void }) {
  return (
    <div style={{ padding: "24px 20px 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        fontSize: 9, fontWeight: 900, letterSpacing: "0.16em", color: CRIMSON,
        textTransform: "uppercase", marginBottom: 20, textAlign: "center",
      }}>
        🔥 Adults Only · 18+
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 8px", textAlign: "center", letterSpacing: "-0.02em" }}>
        The Cellar
      </h2>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textAlign: "center", margin: "0 0 24px", lineHeight: 1.6 }}>
        Three sections for people who know what they want.
        Bold, direct, no judgement.
      </p>

      {/* Section badges */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {[["🔥", "Flirty"], ["😈", "Naughty"], ["🌶️", "Wild"]].map(([emoji, label]) => (
          <div key={label} style={{
            background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)",
            borderRadius: 20, padding: "6px 14px",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>{emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Blurred preview */}
      <div style={{ width: "100%", borderRadius: 16, overflow: "hidden", marginBottom: 24, position: "relative" }}>
        <div style={{
          height: 160, background: "linear-gradient(135deg, rgba(107,15,15,0.4), rgba(192,57,43,0.2))",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["Mia", "Raven", "Axel"].map(n => (
              <div key={n} style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "rgba(192,57,43,0.2)", border: "1px solid rgba(192,57,43,0.3)",
                filter: "blur(6px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>🔥</div>
            ))}
          </div>
        </div>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(14,3,3,0.5)", backdropFilter: "blur(2px)",
        }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700 }}>Members only — unlock to browse</p>
        </div>
      </div>

      {/* Features */}
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
        {[
          "Three sections — Flirty · Naughty · Wild",
          "Verified adults only — max 30 per city floor",
          "Send gifts with a personal opener note",
          "2 free daily gifts — coins for more",
          "Mutual like → private Vault chat opens",
          "Browse other city Cellars for " + CELLAR_EXTRA_CITY_PRICE + "/city",
          "Anonymous · Safe · No explicit content",
        ].map(f => (
          <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ color: CRIMSON, fontSize: 12, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.45 }}>{f}</span>
          </div>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onSubscribe}
        style={{
          width: "100%", height: 50, borderRadius: 14, border: "none",
          background: CRIMSON_GRAD, color: "#fff",
          fontSize: 15, fontWeight: 900, cursor: "pointer",
          boxShadow: "0 4px 24px rgba(192,57,43,0.5)",
        }}
      >
        🔥 Enter The Cellar — {CELLAR_SUB_PRICE} one-time
      </motion.button>
    </div>
  );
}

// ── DOB age check from signup ─────────────────────────────────────────────────
function dobAgeCheck(): "over18" | "under18" | "unknown" {
  try {
    const dob = localStorage.getItem("ghost_dob");
    if (!dob) return "unknown";
    const born  = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - born.getFullYear();
    const m = today.getMonth() - born.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--;
    return age >= 18 ? "over18" : "under18";
  } catch { return "unknown"; }
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CellarFloorPage() {
  const navigate = useNavigate();

  const [ageVerified, setAgeVerified] = useState(() => {
    if (isCellarAgeVerified()) return true;
    // Auto-pass if signup DOB already confirms 18+
    if (dobAgeCheck() === "over18") { setCellarAgeVerified(); return true; }
    return false;
  });
  // If age already verified, treat as subscribed so they don't hit a second paywall
  const [subscribed, setSubscribed] = useState(() => isCellarSubscribed() || isCellarAgeVerified());
  const [section,       setSection]       = useState<CellarSection>("flirty");
  const [activeCity,    setActiveCity]    = useState("LON");
  const [likedIds,      setLikedIds]      = useState<string[]>(getCellarLikedIds);
  const [coinBalance,   setCoinBalance]   = useState(readCoins);
  const [dailyUsed,     setDailyUsed]     = useState(getCellarDailyGiftsUsed);
  const [giftTarget,    setGiftTarget]    = useState<CellarProfile | null>(null);
  const [newArrival,    setNewArrival]    = useState<CellarProfile | null>(null);
  const [cellarTab,     setCellarTab]     = useState<"ilike" | "liked">("ilike");
  const cellarRevertRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelCellarRevert = useCallback(() => {
    if (cellarRevertRef.current) clearTimeout(cellarRevertRef.current);
  }, []);
  const startCellarRevert = useCallback(() => {
    cancelCellarRevert();
    cellarRevertRef.current = setTimeout(() => setCellarTab("ilike"), 10000);
  }, [cancelCellarRevert]);

  useEffect(() => {
    if (cellarTab === "liked") startCellarRevert();
    else cancelCellarRevert();
    return cancelCellarRevert;
  }, [cellarTab, startCellarRevert, cancelCellarRevert]);

  // Show a new arrival once on subscribe
  useEffect(() => {
    if (subscribed && !newArrival) {
      const arrivals = MOCK_CELLAR_PROFILES.filter(p => p.isNewArrival);
      if (arrivals.length) setNewArrival(arrivals[Math.floor(Math.random() * arrivals.length)]);
    }
  }, [subscribed, newArrival]);

  const profiles = useMemo(() =>
    MOCK_CELLAR_PROFILES.filter(p => p.section === section && p.cityCode === activeCity),
    [section, activeCity]
  );

  const extraCities = getCellarExtraCities();
  const availableCities = CELLAR_CITIES.filter(c => c.code === "LON" || extraCities.includes(c.code));

  const iLikeList = useMemo(() => {
    const liked = new Set(likedIds);
    return MOCK_CELLAR_PROFILES.filter(p => liked.has(p.id)).slice(0, 3);
  }, [likedIds]);

  const likedMeList = useMemo(() => {
    const seed = 42;
    return [...MOCK_CELLAR_PROFILES]
      .filter(p => !likedIds.includes(p.id))
      .sort((a, b) => (parseInt(a.id.slice(-3), 10) * seed) % 100 - (parseInt(b.id.slice(-3), 10) * seed) % 100)
      .slice(0, 3);
  }, [likedIds]);

  function handleLike(id: string) {
    addCellarLike(id);
    setLikedIds(getCellarLikedIds());
  }
  function handleGiftSent(coinsSpent: number) {
    const newBal = Math.max(0, coinBalance - coinsSpent);
    writeCoins(newBal);
    setCoinBalance(newBal);
    setDailyUsed(getCellarDailyGiftsUsed());
    setGiftTarget(null);
  }

  const SECTIONS: { key: CellarSection; label: string; emoji: string }[] = [
    { key: "flirty",  label: "Flirty",  emoji: "🔥" },
    { key: "naughty", label: "Naughty", emoji: "😈" },
    { key: "wild",    label: "Wild",    emoji: "🌶️" },
  ];

  const avatarSize = "calc((100vw - 108px) / 3)";
  const avatarH    = 78;

  if (!ageVerified) {
    // Hard block if signup DOB confirms under 18 — no override possible
    if (dobAgeCheck() === "under18") {
      return (
        <div style={{ minHeight: "100dvh", background: "#0a0000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔞</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 10px" }}>Access Denied</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 28px", lineHeight: 1.65, maxWidth: 280 }}>
            The Cellar is restricted to members aged <strong style={{ color: "#fff" }}>18 and over</strong>. Your date of birth on file does not meet this requirement.
          </p>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate(-1)}
            style={{ height: 46, padding: "0 28px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            ← Go Back
          </motion.button>
        </div>
      );
    }
    return (
      <CellarAgeGate
        onConfirm={() => { setCellarAgeVerified(); activateCellarSub(); setAgeVerified(true); setSubscribed(true); }}
        onBack={() => navigate(-1)}
      />
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: CELLAR_BG ? "#0a0000" : "linear-gradient(180deg, #0a0000 0%, #1a0505 100%)", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      {/* Background image */}
      {CELLAR_BG && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: `url(${CELLAR_BG})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.08, pointerEvents: "none" }} />
          <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "linear-gradient(to bottom, rgba(14,3,3,0.85), rgba(14,3,3,0.7))", pointerEvents: "none" }} />
        </>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px 12px" }}>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
            style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 18 }}>←</span>
          </motion.button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>The Cellar 🔥</h1>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Adults only · Bold connections · No judgement</p>
          </div>
        </div>

        {!subscribed ? (
          <CellarTeaser onSubscribe={() => { activateCellarSub(); setSubscribed(true); }} />
        ) : (
          <div style={{ padding: "0 20px 40px" }}>

            {/* I Like / Liked Me container */}
            <div style={{
              borderRadius: 16, overflow: "hidden", marginBottom: 20, position: "relative",
              border: `1px solid rgba(192,57,43,0.3)`,
              boxShadow: "0 4px 24px rgba(192,57,43,0.2)",
            }}>
              {CELLAR_BG ? <>
                <div style={{ position: "absolute", inset: 0, borderRadius: 16, backgroundImage: `url(${CELLAR_BG})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5, pointerEvents: "none" }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: "linear-gradient(to bottom, rgba(14,3,3,0.72), rgba(14,3,3,0.45))", pointerEvents: "none" }} />
              </> : (
                <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: `linear-gradient(135deg, rgba(107,15,15,0.25), rgba(192,57,43,0.1))`, border: `1px solid rgba(192,57,43,0.22)`, pointerEvents: "none" }} />
              )}
              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Tab toggle */}
                <div style={{ display: "flex", padding: "10px 12px 0", gap: 8 }}>
                  {(["ilike", "liked"] as const).map(tab => (
                    <button key={tab} onClick={() => { setCellarTab(tab); if (tab === "liked") startCellarRevert(); else cancelCellarRevert(); }}
                      style={{
                        flex: 1, height: 32, borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 11,
                        background: cellarTab === tab ? CRIMSON_GRAD : "rgba(255,255,255,0.06)",
                        color: cellarTab === tab ? "#fff" : "rgba(255,255,255,0.4)",
                        transition: "all 0.2s",
                      }}>
                      {tab === "ilike" ? "❤️ I Like" : "💌 Liked Me"}
                    </button>
                  ))}
                </div>
                <div style={{ padding: "10px 12px 12px" }}>
                  <AnimatePresence mode="wait">
                    {cellarTab === "ilike" ? (
                      <motion.div key="ilike" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                        style={{ display: "flex", gap: 8 }}>
                        {iLikeList.length === 0 ? (
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "8px 0", fontStyle: "italic" }}>Tap ♡ on profiles to like them</p>
                        ) : iLikeList.map(p => (
                          <motion.div key={p.id} whileTap={{ scale: 0.95 }} onClick={() => setGiftTarget(p)}
                            style={{ width: avatarSize, maxWidth: avatarH, cursor: "pointer", textAlign: "center" }}>
                            <div style={{ width: avatarH, height: avatarH, borderRadius: "50%", overflow: "hidden", border: `2px solid ${CRIMSON}`, margin: "0 auto 4px" }}>
                              <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                            </div>
                            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", margin: 0, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div key="liked" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                        style={{ display: "flex", gap: 8 }}>
                        {likedMeList.map(p => (
                          <motion.div key={p.id} whileTap={{ scale: 0.95 }} onClick={() => setGiftTarget(p)}
                            style={{ width: avatarSize, maxWidth: avatarH, cursor: "pointer", textAlign: "center" }}>
                            <div style={{ width: avatarH, height: avatarH, borderRadius: "50%", overflow: "hidden", border: `2px solid rgba(192,57,43,0.5)`, margin: "0 auto 4px", filter: "blur(5px)" }}>
                              <img src={p.photo} alt="?" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                            </div>
                            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 700 }}>👤 Hidden</p>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Section tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {SECTIONS.map(s => (
                <button key={s.key} onClick={() => setSection(s.key)}
                  style={{
                    flex: 1, height: 38, borderRadius: 10, border: "none", cursor: "pointer",
                    fontWeight: 800, fontSize: 11,
                    background: section === s.key ? CRIMSON_GRAD : "rgba(255,255,255,0.05)",
                    color: section === s.key ? "#fff" : "rgba(255,255,255,0.45)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}>
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>

            {/* City selector */}
            {availableCities.length > 1 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
                {availableCities.map(c => (
                  <button key={c.code} onClick={() => setActiveCity(c.code)}
                    style={{
                      flexShrink: 0, height: 30, borderRadius: 8, border: `1px solid ${activeCity === c.code ? CRIMSON : "rgba(255,255,255,0.1)"}`,
                      background: activeCity === c.code ? `rgba(192,57,43,0.15)` : "transparent",
                      color: activeCity === c.code ? CRIMSON : "rgba(255,255,255,0.45)",
                      fontSize: 10, fontWeight: 700, padding: "0 10px", cursor: "pointer",
                    }}>
                    {c.flag} {c.name}
                  </button>
                ))}
                <button
                  onClick={() => {}}
                  style={{
                    flexShrink: 0, height: 30, borderRadius: 8,
                    border: "1px dashed rgba(192,57,43,0.3)",
                    background: "transparent", color: "rgba(192,57,43,0.6)",
                    fontSize: 10, fontWeight: 700, padding: "0 10px", cursor: "pointer",
                  }}>
                  + City ({CELLAR_EXTRA_CITY_PRICE})
                </button>
              </div>
            )}

            {/* Profiles */}
            {profiles.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No members in this section yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {profiles.map(p => (
                  <CellarLandscapeCard
                    key={p.id}
                    profile={p}
                    liked={likedIds.includes(p.id)}
                    onLike={() => handleLike(p.id)}
                    onGift={() => setGiftTarget(p)}
                  />
                ))}
              </div>
            )}

            {/* Add more cities CTA */}
            <div style={{ marginTop: 28, borderRadius: 14, border: "1px dashed rgba(192,57,43,0.25)", padding: "16px", textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 10px" }}>Want to browse another city's Cellar?</p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => {}}
                style={{
                  background: "rgba(192,57,43,0.1)", border: `1px solid rgba(192,57,43,0.3)`,
                  borderRadius: 10, color: CRIMSON, fontSize: 12, fontWeight: 800,
                  padding: "8px 20px", cursor: "pointer",
                }}>
                Add a city — {CELLAR_EXTRA_CITY_PRICE}
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* New arrival overlay */}
      <AnimatePresence>
        {newArrival && (
          <CellarNewArrival profile={newArrival} onDone={() => setNewArrival(null)} />
        )}
      </AnimatePresence>

      {/* Gift tray */}
      <AnimatePresence>
        {giftTarget && (
          <CellarGiftTray
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
