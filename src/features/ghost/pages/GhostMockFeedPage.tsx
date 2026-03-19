import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock, Settings, Shield, ArrowRight, X, MapPin, Heart, Navigation, Globe } from "lucide-react";

// ── Ghost ID helper (same algorithm as real feed) ─────────────────────────────
function toGhostId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
  return `Ghost-${1000 + Math.abs(h) % 9000}`;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_IMAGES: string[] = Array.from(
  { length: 40 },
  (_, i) => `https://i.pravatar.cc/400?img=${i + 1}`
);

const NAMES = [
  "Sari","Dewi","Rina","Ayu","Fitri","Nadia","Putri","Maya","Dina","Cinta",
  "Reni","Lina","Hana","Wulan","Tari","Indah","Sinta","Mega","Yuni","Lia",
  "Bagas","Rizky","Andi","Danu","Fajar","Hendra","Iwan","Joko","Kevin","Lukman",
  "Mario","Novan","Ogi","Pandu","Raka","Surya","Tegar","Umar","Vino","Wahyu",
];
const CITIES = [
  "Jakarta","Surabaya","Bandung","Bali","Yogyakarta","Medan","Semarang",
  "Makassar","Malang","Solo","Bogor","Depok","Bekasi","Tangerang","Batam",
];
const GENDERS = [
  "Female","Female","Female","Female","Female","Female","Female","Male",
  "Female","Female","Female","Female","Female","Female","Female","Male",
  "Female","Female","Female","Female","Male","Male","Male","Male",
  "Male","Male","Male","Male","Male","Male","Male","Male",
  "Female","Female","Female","Female","Female","Female","Female","Male",
];

function rng(seed: number, min: number, max: number) {
  const x = Math.sin(seed + 1) * 10000;
  return min + Math.floor((x - Math.floor(x)) * (max - min + 1));
}

const MOCK_PROFILES = MOCK_IMAGES.map((img, i) => ({
  id: `mock-${i}`,
  name: NAMES[i] || `User${i}`,
  age: rng(i * 7, 20, 35),
  city: CITIES[i % CITIES.length],
  image: img,
  gender: GENDERS[i] || "Female",
  distanceKm: rng(i * 3, 1, 48),
  isOnline: i % 3 === 0,
  lastSeen: i % 3 === 1 ? `${rng(i, 2, 59)}m ago` : i % 3 === 2 ? `${rng(i, 1, 5)}h ago` : null,
  countryFlag: "🇮🇩",
  country: "Indonesia",
}));

const BASE_ONLINE = 127;

// ── Members-only popup ────────────────────────────────────────────────────────
function MembersPopup({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  const PLANS = [
    { key: "founding", emoji: "🔥", name: "Founding Ghost", idr: "49,000", usd: "~$3", period: "3 months · locks forever", color: "#f97316", border: "rgba(251,146,60,0.4)", bg: "rgba(249,115,22,0.08)", gradient: "linear-gradient(to bottom, #fb923c, #f97316, #ea580c)", glow: "rgba(249,115,22,0.4)" },
    { key: "monthly",  emoji: "👻", name: "Ghost Monthly",  idr: "69,000", usd: "~$4.50", period: "per month · cancel anytime", color: "#22c55e", border: "rgba(74,222,128,0.4)",  bg: "rgba(34,197,94,0.07)",  gradient: "linear-gradient(to bottom, #4ade80, #22c55e, #16a34a)", glow: "rgba(34,197,94,0.4)" },
    { key: "bundle",   emoji: "⭐", name: "Ghost + VIP",    idr: "99,000", usd: "~$6.50", period: "per month · best value",     color: "#a855f7", border: "rgba(168,85,247,0.4)", bg: "rgba(168,85,247,0.07)", gradient: "linear-gradient(to bottom, #c084fc, #a855f7, #9333ea)", glow: "rgba(168,85,247,0.4)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
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
        <div style={{ height: 3, background: "linear-gradient(90deg, #22c55e, #4ade80, #a855f7)" }} />

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
              style={{ fontSize: 52, lineHeight: 1, marginBottom: 10 }}
            >
              👻
            </motion.div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 6px" }}>
              <span>Welcome to the </span>
              <span style={{
                background: "linear-gradient(135deg, #4ade80, #22c55e)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Ghost House</span>
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
              <span>2Ghost is a private members club.</span><br />
              <span>Only paying members can explore and connect.</span>
            </p>
          </div>

          {/* Feature points */}
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "14px 16px", marginBottom: 18,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {[
              { icon: "🔒", title: "Total Privacy", desc: "Your identity stays hidden until a mutual match" },
              { icon: "👻", title: "Ghost IDs Only", desc: "Every profile is anonymous — Ghost-XXXX until you connect" },
              { icon: "📱", title: "WhatsApp on Match", desc: "No in-app chat. Connect directly when both sides like" },
              { icon: "🌍", title: "Members Worldwide", desc: "Indonesia, UK, Japan, Ireland, Australia and more" },
            ].map((f) => (
              <div key={f.title} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>
                  {f.icon}
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
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: "0 0 1px" }}>
                    <span>{p.emoji} {p.name}</span>
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                    <span>{p.period}</span>
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: p.color, margin: 0 }}>
                      <span>{p.idr} IDR</span>
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
              style={{ background: "none", border: "none", cursor: "pointer", color: "#4ade80", fontWeight: 700, fontSize: 12, padding: 0 }}
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
function LockedCard({ profile, onTap }: { profile: typeof MOCK_PROFILES[0]; onTap: () => void }) {
  const ghostId = toGhostId(profile.id);
  return (
    <motion.div
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={onTap}
      style={{
        borderRadius: 16, overflow: "hidden", cursor: "pointer", position: "relative",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "3/4" }}>
        <img
          src={profile.image} alt={ghostId}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 55%)" }} />

        {/* Ghost badge */}
        <div style={{ position: "absolute", top: 7, left: 7, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "3px 7px", fontSize: 8, fontWeight: 700, color: "rgba(74,222,128,0.85)" }}>
          👻
        </div>

        {/* Lock badge — top right */}
        <div style={{
          position: "absolute", top: 7, right: 7,
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
          borderRadius: 20, padding: "3px 8px",
          display: "flex", alignItems: "center", gap: 3,
          border: "1px solid rgba(255,255,255,0.12)",
        }}>
          <Lock size={8} style={{ color: "#fff" }} />
          <span style={{ fontSize: 7, fontWeight: 800, color: "#fff", letterSpacing: "0.06em" }}>MEMBERS</span>
        </div>

        {/* Online dot */}
        {profile.isOnline && (
          <span style={{ position: "absolute", top: 7, right: 72, width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px rgba(74,222,128,0.8)", display: "block" }} />
        )}

        {/* Info */}
        <div style={{ position: "absolute", bottom: 8, left: 8, right: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(74,222,128,0.9)", margin: "0 0 1px", lineHeight: 1, letterSpacing: "0.04em" }}>
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
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(74,222,128,0.8)" }}>
              <span>{profile.distanceKm} km</span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Locked filter bar ─────────────────────────────────────────────────────────
function LockedFilterBar({ onTap }: { onTap: () => void }) {
  return (
    <div style={{
      padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)",
      background: "rgba(5,5,8,0.8)", backdropFilter: "blur(12px)",
      display: "flex", gap: 6, overflowX: "auto",
    }}>
      {/* Gender pills */}
      {["All", "Women", "Men"].map((g, i) => (
        <button
          key={g}
          onClick={onTap}
          style={{
            height: 30, borderRadius: 50, padding: "0 12px", flexShrink: 0,
            background: i === 0 ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
            border: i === 0 ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.08)",
            color: i === 0 ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.35)",
            fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          }}
        >
          <span>{g}</span>
        </button>
      ))}
      {/* Age pill */}
      <button onClick={onTap} style={{ height: 30, borderRadius: 50, padding: "0 12px", flexShrink: 0, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
        <span>18–45</span>
      </button>
      {/* Distance pill */}
      <button onClick={onTap} style={{ height: 30, borderRadius: 50, padding: "0 10px", flexShrink: 0, display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
        <Navigation size={10} /><span>Any</span>
      </button>
      {/* Country pill */}
      <button onClick={onTap} style={{ height: 30, borderRadius: 50, padding: "0 10px", flexShrink: 0, display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
        <Globe size={10} /><span>World</span>
      </button>
    </div>
  );
}

// ── Main mock feed page ───────────────────────────────────────────────────────
export default function GhostMockFeedPage({ onUnlock }: { onUnlock: () => void }) {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [onlineCount, setOnlineCount] = useState(BASE_ONLINE);

  // Fluctuating online counter
  useEffect(() => {
    const t = setInterval(() => {
      setOnlineCount((n) => Math.max(100, n + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3)));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const lock = () => setShowPopup(true);

  const onlineProfiles = MOCK_PROFILES.filter((p) => p.isOnline).length;

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
        <button onClick={() => navigate("/ghost/auth")} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}>
          ←
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>👻</span>
            <h1 style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>Ghost Mode</h1>
            <span style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "1px 6px", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
              PREVIEW
            </span>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
            <span>Members only · Join to explore</span>
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
              background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: 20, padding: "5px 10px", cursor: "pointer",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80", display: "block" }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(74,222,128,0.95)" }}>
              <span>{onlineCount}</span>
            </span>
          </motion.div>

          <button onClick={lock} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(96,165,250,0.5)" }}>
            <Shield size={15} />
          </button>
          <button onClick={lock} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.3)" }}>
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* ── Filter bar (locked) ── */}
      <LockedFilterBar onTap={lock} />

      {/* ── Ghost info banner ── */}
      <motion.div
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity }}
        onClick={lock}
        style={{
          margin: "10px 14px 0",
          background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)",
          borderRadius: 12, padding: "9px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Lock size={13} style={{ color: "#4ade80", flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "rgba(74,222,128,0.9)", margin: 0, fontWeight: 700 }}>
            <span>{onlineCount} Ghost members active near you</span>
          </p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, color: "#f97316" }}>
          <span>from 49k IDR</span>
        </span>
      </motion.div>

      {/* ── Stats row (mirrors real feed) ── */}
      <div style={{ display: "flex", gap: 8, padding: "10px 14px 0" }}>
        {[
          { label: "Profiles", value: MOCK_PROFILES.length },
          { label: "Online now", value: onlineProfiles },
          { label: "Countries", value: 12 },
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
          onClick={lock}
          style={{
            width: "100%", height: 52, borderRadius: 50, border: "none",
            background: "linear-gradient(to bottom, #4ade80, #22c55e, #16a34a)",
            color: "#fff", fontSize: 15, fontWeight: 900,
            letterSpacing: "0.04em", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 32px rgba(34,197,94,0.5)",
            position: "relative", overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", top: 0, left: "10%", right: "10%", height: "45%",
            background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)",
            borderRadius: "50px 50px 60% 60%", pointerEvents: "none",
          }} />
          <Lock size={16} strokeWidth={2.5} />
          <span>Join the Ghost House — from 49k IDR</span>
        </motion.button>
      </div>

      {/* ── Members-only popup ── */}
      <AnimatePresence>
        {showPopup && <MembersPopup onClose={() => setShowPopup(false)} />}
      </AnimatePresence>

    </div>
  );
}
