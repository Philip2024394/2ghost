import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, Settings, ArrowRight, X, SlidersHorizontal } from "lucide-react";
import { MOCK_PROFILES, PROFILE_IMAGES, isOnlineNow, type MockProfile } from "../../../data/mockProfiles";
import { useLanguage } from "@/i18n/LanguageContext";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const SHIELD_LOGO = "https://ik.imagekit.io/7grri5v7d/weqweqwsdfsdfsdsdsddsdf.png";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

// ── Ghost ID helper ────────────────────────────────────────────────────────────
function toGhostId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
  return `Ghost-${1000 + Math.abs(h) % 9000}`;
}

const MOCK_IMAGES = PROFILE_IMAGES;

const BASE_ONLINE = 127;

// ~30% of profiles deterministically show "Tonight" available
function isProfileTonight(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(47, h) + id.charCodeAt(i) | 0; }
  return Math.abs(h) % 10 < 3;
}

// ── Members-only popup ────────────────────────────────────────────────────────
function MembersPopup({ onClose }: { onClose: () => void }) {
  const a = useGenderAccent();
  const navigate = useNavigate();

  const PLANS = [
    {
      key: "women",
      emoji: "👩",
      name: "Women — Free Forever",
      idr: "0",
      usd: "Free",
      period: `Browse · Like · Match · Connect — all free · Ghost Vault 19k IDR`,
      color: a.accent,
      border: a.glow(0.45),
      bg: a.glow(0.09),
      gradient: `linear-gradient(to bottom, ${a.accent}, ${a.accentMid}, ${a.accentDark})`,
      glow: a.glowMid(0.4),
      badge: `WOMEN FREE`,
    },
    {
      key: "founding",
      emoji: "⭐",
      name: "Founding Ghost",
      idr: "49,000",
      usd: "~$3",
      period: "3 months · locks forever at this price",
      color: "#f59e0b",
      border: "rgba(251,191,36,0.45)",
      bg: "rgba(251,191,36,0.07)",
      gradient: "linear-gradient(to bottom, #fbbf24, #f59e0b, #d97706)",
      glow: "rgba(251,191,36,0.45)",
      badge: "BEST VALUE",
    },
    {
      key: "monthly",
      emoji: "👻",
      name: "Ghost Monthly",
      idr: "29,000",
      usd: "~$2",
      period: `per month · cancel anytime`,
      color: a.accentMid,
      border: a.glow(0.4),
      bg: a.glowMid(0.07),
      gradient: `linear-gradient(to bottom, ${a.accent}, ${a.accentMid}, ${a.accentDark})`,
      glow: a.glowMid(0.4),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: `fixed`, inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(5,5,8,0.98)",
          backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
          borderRadius: "22px 22px 0 0",
          border: "1px solid rgba(255,255,255,0.08)",
          borderBottom: "none",
          maxHeight: "92dvh", overflowY: "auto",
        }}
      >
        {/* Top accent */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${a.accentMid}, ${a.accent}, #a855f7)` }} />

        <div style={{ padding: "20px 18px max(28px, env(safe-area-inset-bottom, 28px))", position: "relative" }}>

          {/* Close */}
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            width: 30, height: 30, borderRadius: 8,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.5)",
          }}><X size={14} /></button>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{ lineHeight: 1, marginBottom: 10 }}
            >
              <img src={GHOST_LOGO} alt="ghost" style={{ width: 156, height: 156, objectFit: "contain" }} />
            </motion.div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 6px" }}>
              <span>Welcome to the </span>
              <span style={{
                background: `linear-gradient(135deg, ${a.accent}, ${a.accentMid})`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Ghost House</span>
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
              <span>Join free · No card required</span><br />
              <span>Ghost Vault (media sharing) is paid for everyone.</span>
            </p>
          </div>

          {/* Feature points */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "14px 16px", marginBottom: 18,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {[
              { icon: "👩", title: "Women — Free to Join", desc: "Browse, like, match and connect free. Ghost Vault (media sharing) is 19k IDR/month for everyone." },
              { icon: "🔒", title: "Total Privacy", desc: "Your identity stays hidden until a mutual match" },
              { icon: "👻", title: "Guest IDs Only", desc: "Every profile is anonymous — Guest-XXXX until you connect" },
              { icon: "📱", title: "Connect on Match", desc: "No in-app chat. Unlock their contact — WhatsApp, Telegram, WeChat, iMessage, any app they use" },
              { icon: "🌍", title: "SEA House", desc: "Indonesia 🇮🇩 Philippines 🇵🇭 Thailand 🇹🇭 Singapore 🇸🇬 Malaysia 🇲🇾 Vietnam 🇻🇳 and beyond" },
            ].map((f) => (
              <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: a.glow(0.08), border: `1px solid ${a.glow(0.15)}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>
                  {f.icon === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle" }} /> : <span>{f.icon}</span>}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 1px" }}>
                    <span>{f.title}</span>
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                    <span>{f.desc}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Plans */}
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 10px", textAlign: "center" }}>
            <span>Choose your plan</span>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {PLANS.map((p) => (
              <motion.button
                key={p.key}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/ghost/auth")}
                style={{
                  width: "100%", borderRadius: 14, padding: "12px 16px",
                  background: p.bg, border: `1px solid ${p.border}`,
                  cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>
                      <span>{p.emoji === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} /> : p.emoji} {p.name}</span>
                    </p>
                    {"badge" in p && p.badge && (
                      <span style={{ fontSize: 8, fontWeight: 900, color: p.color, background: p.bg, border: `1px solid ${p.border}`, borderRadius: 4, padding: "1px 5px", letterSpacing: "0.06em", flexShrink: 0 }}>
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                    <span>{p.period}</span>
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: p.color, margin: 0 }}>
                      <span>{p.idr === "0" ? "FREE" : `${p.idr} IDR`}</span>
                    </p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                      <span>{p.usd}</span>
                    </p>
                  </div>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: p.gradient,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 12px ${p.glow}`, flexShrink: 0,
                  }}>
                    <ArrowRight size={13} color="#fff" strokeWidth={2.5} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Already a member */}
          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>
            <span>Already a member? </span>
            <button
              onClick={() => navigate("/ghost/auth")}
              style={{ background: "none", border: "none", cursor: "pointer", color: a.accent, fontWeight: 700, fontSize: 12, padding: 0 }}
            >
              <span>Sign in</span>
            </button>
          </p>

        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Locked profile card (mirrors real GhostCard exactly) ─────────────────────
function LockedCard({ profile, onTap }: { profile: MockProfile; onTap: () => void }) {
  const a = useGenderAccent();
  const { t } = useLanguage();
  const ghostId = toGhostId(profile.id);
  const isTonight = isProfileTonight(profile.id);
  return (
    <motion.div
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={onTap}
      style={{
        borderRadius: 16, overflow: "hidden", cursor: "pointer", position: "relative",
        border: isTonight ? `1.5px solid ${a.glow(0.5)}` : "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.03)",
        boxShadow: isTonight ? `0 0 12px ${a.glow(0.2)}` : undefined,
      }}
    >
      <div style={{ position: "relative", aspectRatio: "3/4" }}>
        <img
          src={profile.image} alt={ghostId}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 55%)" }} />

        {/* Ghost / Tonight badge */}
        <div style={{ position: "absolute", top: 7, left: 7, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "3px 7px", fontSize: 8, fontWeight: 700, color: a.glow(0.85) }}>
          {isTonight ? `🌙 ${t("card.tonight")}` : <img src={GHOST_LOGO} alt="ghost" style={{ width: 30, height: 30, objectFit: "contain" }} />}
        </div>

        {/* VIP badge */}
        {profile.isVip && (
          <div style={{
            position: "absolute", top: 28, left: 7,
            background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
            borderRadius: 20, padding: "3px 6px",
            fontSize: 8, fontWeight: 800, color: "#fff", letterSpacing: "0.04em",
            boxShadow: "0 2px 8px rgba(251,191,36,0.5)",
          }}>
            ⭐ VIP
          </div>
        )}

        {/* Lock badge — top right */}
        <div style={{
          position: "absolute", top: 7, right: 7,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
          borderRadius: 20, padding: "3px 8px",
          display: "flex", alignItems: "center", gap: 3,
          border: "1px solid rgba(255,255,255,0.12)",
        }}>
          <Lock size={8} style={{ color: "#fff" }} />
          <span style={{ fontSize: 7, fontWeight: 800, color: "#fff", letterSpacing: "0.06em" }}>{t("card.members")}</span>
        </div>

        {/* Online dot */}
        {isOnlineNow(profile) && (
          <span style={{ position: "absolute", top: 7, right: 72, width: 8, height: 8, borderRadius: "50%", background: a.accent, boxShadow: "0 0 6px ${a.glow(0.8)}", display: "block" }} />
        )}

        {/* Info */}
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: a.glow(0.9), margin: "0 0 1px", lineHeight: 1, letterSpacing: "0.04em" }}>
            <span>{ghostId}</span>
          </p>
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)", margin: "0 0 2px", lineHeight: 1 }}>
            <span>{profile.age} · {profile.gender === "Female" ? "Woman" : "Man"}</span>
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 9 }}>{profile.countryFlag}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{profile.city}</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: a.glow(0.8) }}>
              <span>{profile.distanceKm} km</span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Locked filter slide-up sheet ──────────────────────────────────────────────
function LockedFilterSheet({ onClose, onTap }: { onClose: () => void; onTap: () => void }) {
  const a = useGenderAccent();
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(8,10,14,0.99)", borderRadius: "20px 20px 0 0", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", padding: "6px 20px max(32px,env(safe-area-inset-bottom,32px))" }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 18px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>
        <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 16px" }}>Filters</p>
        {[
          { label: "Gender", value: "All" },
          { label: "Age range", value: "18 – 45" },
          { label: "Distance", value: "Any" },
          { label: "Country", value: "World" },
        ].map(({ label, value }) => (
          <div key={label} onClick={onTap} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: a.glow(0.9) }}>{value}</span>
              <Lock size={12} color="rgba(255,255,255,0.2)" />
            </div>
          </div>
        ))}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onTap}
          style={{ width: "100%", height: 48, borderRadius: 50, border: "none", marginTop: 20, background: `linear-gradient(to bottom, ${a.accent}, ${a.accentMid}, ${a.accentDark})`, color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 20px ${a.glowMid(0.4)}` }}
        >
          Apply Filters
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Main mock feed page ───────────────────────────────────────────────────────
export default function GhostMockFeedPage({ onUnlock: _onUnlock }: { onUnlock?: () => void }) {
  const a = useGenderAccent();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [onlineCount, setOnlineCount] = useState(BASE_ONLINE);
  const hasWhatsApp = (() => { try { return !!localStorage.getItem("ghost_room_whatsapp"); } catch { return false; } })();
  const [showFilters, setShowFilters] = useState(false);
  const [ctaSecs, setCtaSecs] = useState(600); // 10-minute urgency countdown

  // Fluctuating online counter
  useEffect(() => {
    const t = setInterval(() => {
      setOnlineCount((n) => Math.max(100, n + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3)));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // CTA urgency countdown (10 min → 0)
  useEffect(() => {
    if (ctaSecs <= 0) return;
    const t = setInterval(() => setCtaSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [ctaSecs]);

  // Randomly cycling avatar indices for the banner
  const [bannerAvatars, setBannerAvatars] = useState<number[]>([0, 1, 2]);
  useEffect(() => {
    const t = setInterval(() => {
      setBannerAvatars(() => {
        const pool = Array.from({ length: MOCK_IMAGES.length }, (_, i) => i);
        const picked: number[] = [];
        while (picked.length < 3) {
          const idx = Math.floor(Math.random() * pool.length);
          picked.push(pool.splice(idx, 1)[0]);
        }
        return picked;
      });
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const lock = () => setShowPopup(true);

  const onlineProfiles = MOCK_PROFILES.filter((p) => isOnlineNow(p)).length;

  return (
    <div style={{ minHeight: "100dvh", background: "#050508", color: "#fff", display: "flex", flexDirection: "column" }}>

      {/* ── Header (mirrors real feed) ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,8,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "12px 16px",
        paddingTop: "max(12px, env(safe-area-inset-top, 12px))",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <img src={GHOST_LOGO} alt="ghost" style={{ width: 48, height: 48, objectFit: "contain" }} />
            <h1 style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>Ghost Mode</h1>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
            <span>{t("nav.membersOnly")}</span>
          </p>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {/* Live counter */}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            onClick={lock}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: a.glow(0.1), border: `1px solid ${a.glow(0.25)}`,
              borderRadius: 20, padding: "5px 10px", cursor: "pointer",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.accent, boxShadow: "0 0 6px ${a.accent}", display: "block" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: a.glow(0.95) }}>
              <span>{onlineCount}</span>
            </span>
          </motion.div>

          <button onClick={lock} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <img src={SHIELD_LOGO} alt="shield" style={{ width: 40, height: 40, objectFit: "contain" }} />
          </button>
          <button onClick={lock} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* ── Action strip: Ghost Vault · VIP Profile · Flash Date · Filter ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px 0", overflowX: "auto", scrollbarWidth: "none" }}>
        {[
          { icon: "🚪", label: "Ghost Vault", color: a.glow(0.9), border: a.glow(0.25), bg: a.glow(0.08), action: () => navigate("/ghost/room") },
          { icon: "👻", label: "Ghosted", color: "rgba(168,85,247,0.9)", border: "rgba(168,85,247,0.25)", bg: "rgba(168,85,247,0.08)", action: lock },
          { icon: "⚡", label: "Flash Date",  color: "rgba(251,191,36,0.9)", border: "rgba(251,191,36,0.25)", bg: "rgba(251,191,36,0.08)", action: lock },
        ].map(({ icon, label, color, border, bg, action }) => (
          <motion.button
            key={label}
            whileTap={{ scale: 0.93 }}
            onClick={action}
            style={{
              flexShrink: 0, height: 34, borderRadius: 50, padding: "0 12px",
              background: bg, border: `1px solid ${border}`,
              display: "flex", alignItems: "center", gap: 5,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 13 }}>{icon === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle" }} /> : icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color, whiteSpace: "nowrap" }}>{label}</span>
          </motion.button>
        ))}

        {/* Spacer pushes filter to the right */}
        <div style={{ flex: 1 }} />

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowFilters(true)}
          style={{
            flexShrink: 0, width: 34, height: 34, borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.6)",
          }}
        >
          <SlidersHorizontal size={15} />
        </motion.button>
      </div>

      {/* ── Ghost info banner ── */}
      <motion.div
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity }}
        onClick={lock}
        style={{
          margin: "10px 14px 0",
          background: a.glow(0.07), border: `1px solid ${a.glow(0.18)}`,
          borderRadius: 12, padding: "9px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Rotating round avatars */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {bannerAvatars.map((imgIdx, i) => (
              <motion.img
                key={`${imgIdx}-${i}`}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                src={MOCK_IMAGES[imgIdx]}
                style={{
                  width: 26, height: 26, borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${a.glow(0.5)}`,
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: 3 - i,
                  position: "relative",
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 12, color: a.glow(0.9), margin: 0, fontWeight: 700 }}>
            <span>{onlineCount} {t("feed.activeNear")}</span>
          </p>
        </div>
      </motion.div>

      {/* ── Stats row (mirrors real feed) ── */}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px 0" }}>
        {[
          { label: t("feed.profiles"), value: MOCK_PROFILES.length },
          { label: t("feed.onlineNow"), value: onlineProfiles },
          { label: t("feed.countries"), value: 12 },
        ].map(({ label, value }) => (
          <div
            key={label}
            onClick={lock}
            style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)", padding: "8px 0", textAlign: "center", cursor: "pointer" }}
          >
            <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>{value}</p>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Profile grid (mirrors real feed) ── */}
      <div style={{
        flex: 1, padding: "10px 12px 100px",
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8,
      }}>
        {MOCK_PROFILES.map((profile) => (
          <LockedCard key={profile.id} profile={profile} onTap={lock} />
        ))}
      </div>

      {/* ── Sticky bottom CTA (mirrors real feed) ── */}
      <div style={{
        position: "sticky", bottom: 0, zIndex: 40,
        background: "linear-gradient(to top, #050508 55%, transparent)",
        padding: "16px 16px max(16px, env(safe-area-inset-bottom, 16px))",
      }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => hasWhatsApp ? lock() : navigate("/ghost/setup")}
          animate={ctaSecs === 0 ? { scale: [1, 1.03, 1] } : {}}
          transition={ctaSecs === 0 ? { duration: 1.2, repeat: Infinity } : {}}
          style={{
            width: "100%", borderRadius: 50, border: "none",
            background: ctaSecs === 0
              ? `linear-gradient(to bottom, #f97316, #ea580c)`
              : `linear-gradient(to bottom, ${a.accent}, ${a.accentMid}, ${a.accentDark})`,
            color: "#fff", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 1, padding: "10px 20px",
            boxShadow: ctaSecs === 0
              ? "0 8px 32px rgba(249,115,22,0.55)"
              : `0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 32px ${a.glowMid(0.5)}`,
            position: "relative", overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)",
            borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
          }} />
          {hasWhatsApp ? (
            <>
              <Lock size={14} strokeWidth={2.5} />
              <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.04em" }}>Join the Ghost House — from 49k IDR</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.04em" }}>
                {ctaSecs === 0 ? "Last Chance — Join Free Now" : "Free Membership"}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                color: ctaSecs === 0 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.7)",
              }}>
                {ctaSecs === 0
                  ? "Offer expired — sign up anyway"
                  : `Offer ends in ${Math.floor(ctaSecs / 60)}:${String(ctaSecs % 60).padStart(2, "0")}`}
              </span>
            </>
          )}
        </motion.button>
      </div>


      {/* ── Members-only popup ── */}
      <AnimatePresence>
        {showPopup && <MembersPopup onClose={() => setShowPopup(false)} />}
      </AnimatePresence>

      {/* ── Filter slide-up sheet ── */}
      <AnimatePresence>
        {showFilters && (
          <LockedFilterSheet
            onClose={() => setShowFilters(false)}
            onTap={() => { setShowFilters(false); lock(); }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
