import { useState, useRef, useMemo, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, SlidersHorizontal, X } from "lucide-react";
import { generateIndonesianProfiles } from "@/data/indonesianProfiles";
import { useGhostMode } from "@/features/ghost/hooks/useGhostMode";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

// ── Badges ────────────────────────────────────────────────────────────────────
const BADGES = [
  { id: "tonight", icon: "🌙", label: "Free Tonight",    desc: "Available tonight for a meetup" },
  { id: "weekend", icon: "📅", label: "Free Weekend",    desc: "Open plans this weekend" },
  { id: "flash",   icon: "⚡", label: "Flash Date",      desc: "Quick spontaneous date, right now" },
  { id: "room",    icon: "🚪", label: "Ghost Vault",      desc: "Has a private Ghost Vault" },
  { id: "ghosted", icon: "👻", label: "Ghosted",         desc: "Premium Ghosted member" },
  { id: "drinks",  icon: "🍷", label: "Drinks",          desc: "Down for drinks" },
  { id: "coffee",  icon: "☕", label: "Coffee",          desc: "Casual coffee date" },
  { id: "party",   icon: "🎉", label: "Party",           desc: "Looking to party" },
  { id: "travel",  icon: "✈️", label: "Travel",          desc: "Loves to travel" },
  { id: "chill",   icon: "🎬", label: "Netflix & Chill", desc: "Stay in together" },
  { id: "sport",   icon: "🏋️", label: "Sport",           desc: "Active lifestyle" },
  { id: "music",   icon: "🎵", label: "Music",           desc: "Gig, festival or jam" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toGhostId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i) | 0;
  return `Ghost-${1000 + Math.abs(h) % 9000}`;
}
function seedPos(i: number) {
  return {
    distKm:  1 + Math.abs(Math.sin(i * 2.399963)) * 149,
    bearing: Math.abs(Math.sin(i * 5.123456)) * 360,
  };
}
function seedBadges(i: number): string[] {
  const count = 1 + (i % 3);
  return Array.from({ length: count }, (_, k) => BADGES[(i * 3 + k * 7) % BADGES.length].id);
}
function toXY(distKm: number, bearing: number, radiusPx: number, maxKm: number, cx: number, cy: number) {
  const r = (distKm / maxKm) * radiusPx;
  const a = (bearing - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

// ── Profile popup ─────────────────────────────────────────────────────────────
type MapProfile = ReturnType<typeof generateIndonesianProfiles>[0] & {
  distKm: number; bearing: number; ghostId: string; badges: string[];
};

function ProfilePopup({ profile, isGhost, onClose }: { profile: MapProfile; isGhost: boolean; onClose: () => void }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,8,5,0.98)", borderRadius: "22px 22px 0 0", border: "1px solid rgba(74,222,128,0.12)", borderBottom: "none", overflow: "hidden", paddingBottom: "max(24px,env(safe-area-inset-bottom,24px))" }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
        </div>

        {/* Flip card area */}
        <div style={{ perspective: 900, height: 340, margin: "14px 18px 0" }}>
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}
          >
            {/* Front — profile image */}
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", borderRadius: 18, overflow: "hidden" }}>
              <img src={profile.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)" }} />
              <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#fff" }}>{profile.ghostId}</span>
                  <span style={{ fontSize: 11, background: "rgba(74,222,128,0.9)", borderRadius: 10, padding: "1px 8px", fontWeight: 800, color: "#000" }}>{profile.distKm} km</span>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {profile.badges.map(bid => {
                    const b = BADGES.find(x => x.id === bid);
                    return b ? <span key={bid} style={{ fontSize: 11, background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: "2px 8px", color: "rgba(255,255,255,0.8)" }}><span>{b.icon}</span> <span>{b.label}</span></span> : null;
                  })}
                </div>
              </div>
              {/* Flip hint */}
              {isGhost && (
                <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(74,222,128,0.9)", borderRadius: 10, padding: "3px 9px", fontSize: 10, fontWeight: 800, color: "#000", cursor: "pointer" }} onClick={() => setFlipped(true)}>
                  <span>Flip for details ↩</span>
                </div>
              )}
            </div>

            {/* Back — details (Ghosted users only) */}
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: 18, background: "linear-gradient(135deg, rgba(10,18,8,0.98), rgba(6,14,4,0.98))", border: "1px solid rgba(74,222,128,0.15)", display: "flex", flexDirection: "column", padding: "20px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 54, height: 54, borderRadius: 14, overflow: "hidden", border: "2px solid rgba(74,222,128,0.4)", flexShrink: 0 }}>
                  <img src={profile.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 3px" }}>{profile.ghostId}</p>
                  <p style={{ fontSize: 11, color: "rgba(74,222,128,0.8)", margin: 0, fontWeight: 700 }}><span>{profile.distKm} km away</span></p>
                </div>
              </div>
              {[
                { label: "Age",    value: `${profile.age} years old` },
                { label: "City",   value: profile.city },
                { label: "Gender", value: profile.gender },
                { label: "Status", value: "Active recently" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>{row.value}</span>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <p style={{ fontSize: 10, color: "rgba(74,222,128,0.6)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Active badges</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {profile.badges.map(bid => {
                    const b = BADGES.find(x => x.id === bid);
                    return b ? <span key={bid} style={{ fontSize: 11, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 8, padding: "3px 9px", color: "rgba(74,222,128,0.9)", fontWeight: 700 }}><span>{b.icon}</span> <span>{b.label}</span></span> : null;
                  })}
                </div>
              </div>
              <div style={{ position: "absolute", top: 12, right: 12, cursor: "pointer" }} onClick={() => setFlipped(false)}>
                <span style={{ fontSize: 11, background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: "3px 9px", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>↩ Back</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action row */}
        <div style={{ display: "flex", gap: 10, padding: "14px 18px 0" }}>
          <button onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <span>Pass</span>
          </button>
          <button style={{ flex: 2, height: 44, borderRadius: 12, border: "none", background: "linear-gradient(to bottom, #4ade80, #22c55e)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 16px rgba(34,197,94,0.35)" }}>
            <span><img src={GHOST_LOGO} alt="" style={{ width: 48, height: 48, objectFit: "contain", verticalAlign: "middle", marginRight: 6 }} /> Like Ghost</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GhostMapPage() {
  const navigate       = useNavigate();
  const { isGhost }    = useGhostMode();
  const containerRef   = useRef<HTMLDivElement>(null);
  const [mapW, setMapW]           = useState(320);
  const [mapH, setMapH]           = useState(500);
  const [maxKm, setMaxKm]         = useState(50);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [activeBadge, setActiveBadge]   = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [popupProfile, setPopupProfile] = useState<MapProfile | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { setMapW(el.clientWidth); setMapH(el.clientHeight); });
    ro.observe(el);
    setMapW(el.clientWidth); setMapH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const profiles = useMemo(() => generateIndonesianProfiles(), []);

  const mapProfiles = useMemo(() =>
    profiles.map((p, i) => {
      const { distKm, bearing } = seedPos(i);
      return { ...p, distKm: Math.round(distKm * 10) / 10, bearing, ghostId: toGhostId(p.id), badges: seedBadges(i) };
    }),
  [profiles]);

  const visible = useMemo(() => mapProfiles.filter(p => p.distKm <= maxKm), [mapProfiles, maxKm]);

  // Always show 4 nearest
  const nearest4 = useMemo(() =>
    [...mapProfiles].filter(p => p.distKm <= maxKm).sort((a, b) => a.distKm - b.distKm).slice(0, 4),
  [mapProfiles, maxKm]);

  const nearest4Ids = useMemo(() => new Set(nearest4.map(p => p.id)), [nearest4]);

  const selected = useMemo(() => mapProfiles.find(p => p.id === selectedId) ?? null, [mapProfiles, selectedId]);

  const cx     = mapW / 2;
  const cy     = mapH / 2;
  const radius = Math.min(cx, cy) * 0.84;

  const activeBadgeObj = BADGES.find(b => b.id === activeBadge);

  return (
    <div translate="no" style={{ height: "100dvh", background: "#0a0c08", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{ padding: "max(12px,env(safe-area-inset-top,12px)) 14px 10px", background: "rgba(8,10,6,0.97)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)", flexShrink: 0 }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          {selected ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{selected.ghostId}</span>
                <span style={{ fontSize: 11, color: "rgba(74,222,128,0.9)", fontWeight: 700 }}>· <span>{selected.distKm}</span> km</span>
                {activeBadgeObj && <span style={{ fontSize: 10, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 20, padding: "1px 7px", color: "rgba(74,222,128,0.9)", fontWeight: 700 }}><span>{activeBadgeObj.icon}</span> <span>{activeBadgeObj.label}</span></span>}
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}><span>{selected.city} · {selected.gender} · {selected.age}y</span></p>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <img src={GHOST_LOGO} alt="ghost" style={{ width: 48, height: 48, objectFit: "contain" }} />
              <span style={{ fontSize: 15, fontWeight: 900 }}>Ghost Map</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>· <span>{visible.length}</span> nearby</span>
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 800, color: "rgba(74,222,128,0.9)" }}>
          <span>{maxKm}</span> km
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>
        <div ref={containerRef} style={{ position: "absolute", inset: 0 }}>

          {/* Atmospheric background */}
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 60% 40%, rgba(30,50,20,0.55) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 20% 70%, rgba(20,35,15,0.4) 0%, transparent 60%), linear-gradient(180deg, #0a0f06 0%, #0d1208 40%, #080e05 100%)` }} />

          <svg width={mapW} height={mapH} style={{ position: "absolute", inset: 0, display: "block" }}>
            <defs>
              {visible.map(p => {
                const pos = toXY(p.distKm, p.bearing, radius, maxKm, cx, cy);
                const r   = p.id === selectedId ? 19 : nearest4Ids.has(p.id) ? 17 : 15;
                return (
                  <clipPath key={`clip-${p.id}`} id={`clip-${p.id}`}>
                    <circle cx={pos.x} cy={pos.y} r={r} />
                  </clipPath>
                );
              })}
            </defs>

            {/* Grid */}
            {Array.from({ length: 9 }, (_, i) => (
              <line key={`v${i}`} x1={(mapW / 8) * i} y1={0} x2={(mapW / 8) * i} y2={mapH} stroke="rgba(180,160,80,0.07)" strokeWidth={1} />
            ))}
            {Array.from({ length: 13 }, (_, i) => (
              <line key={`h${i}`} x1={0} y1={(mapH / 12) * i} x2={mapW} y2={(mapH / 12) * i} stroke="rgba(180,160,80,0.07)" strokeWidth={1} />
            ))}

            {/* Range rings */}
            {[0.25, 0.5, 0.75, 1].map(f => (
              <circle key={f} cx={cx} cy={cy} r={radius * f} fill="none" stroke="rgba(74,222,128,0.08)" strokeWidth={1} strokeDasharray="6,8" />
            ))}
            {[0.25, 0.5, 0.75, 1].map(f => (
              <text key={f} x={cx + 5} y={cy - radius * f + 10} fill="rgba(180,160,80,0.35)" fontSize={8} fontFamily="system-ui,sans-serif">
                {Math.round(maxKm * f)}km
              </text>
            ))}

            {/* Dotted line to selected */}
            {selected && (() => {
              const pos = toXY(selected.distKm, selected.bearing, radius, maxKm, cx, cy);
              return <line x1={cx} y1={cy} x2={pos.x} y2={pos.y} stroke="rgba(239,68,68,0.6)" strokeWidth={1.5} strokeDasharray="5,4" />;
            })()}

            {/* Ping rings for nearest 4 */}
            {nearest4.map(p => {
              const pos = toXY(p.distKm, p.bearing, radius, maxKm, cx, cy);
              return (
                <g key={`ping-${p.id}`}>
                  <circle cx={pos.x} cy={pos.y} r={22} fill="none" stroke="rgba(74,222,128,0.6)" strokeWidth={1.5}>
                    <animate attributeName="r"       values="18;34;18" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.55;0;0.55" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={pos.x} cy={pos.y} r={28} fill="none" stroke="rgba(74,222,128,0.3)" strokeWidth={1}>
                    <animate attributeName="r"       values="20;40;20" dur="2.2s" begin="0.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3" dur="2.2s" begin="0.4s" repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })}

            {/* Profile avatars */}
            {visible.map(p => {
              const pos      = toXY(p.distKm, p.bearing, radius, maxKm, cx, cy);
              const isSel    = p.id === selectedId;
              const isNearest = nearest4Ids.has(p.id);
              const r        = isSel ? 19 : isNearest ? 17 : 15;
              const hasBadge = activeBadge ? p.badges.includes(activeBadge) : false;
              const ringColor = isSel ? "#ef4444" : hasBadge ? "#4ade80" : isNearest ? "rgba(74,222,128,0.7)" : activeBadge ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.2)";
              const ringW = (isSel || hasBadge || isNearest) ? 2.5 : 1;

              return (
                <g key={p.id} onClick={e => { e.stopPropagation(); setSelectedId(p.id); }} style={{ cursor: "pointer" }}>
                  {(isSel || hasBadge) && <circle cx={pos.x} cy={pos.y} r={r + 5} fill={isSel ? "rgba(239,68,68,0.12)" : "rgba(74,222,128,0.1)"} stroke={isSel ? "rgba(239,68,68,0.3)" : "rgba(74,222,128,0.2)"} strokeWidth={1} />}
                  <image href={p.image} x={pos.x - r} y={pos.y - r} width={r * 2} height={r * 2} clipPath={`url(#clip-${p.id})`} style={{ opacity: activeBadge && !hasBadge && !isSel ? 0.25 : 1 }} preserveAspectRatio="xMidYMid slice" />
                  <circle cx={pos.x} cy={pos.y} r={r} fill="none" stroke={ringColor} strokeWidth={ringW} />
                  {isSel && <text x={pos.x} y={pos.y + r + 11} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize={8} fontFamily="system-ui,sans-serif" fontWeight="bold">{p.ghostId}</text>}
                </g>
              );
            })}

            {/* User heart */}
            <circle cx={cx} cy={cy} r={16} fill="rgba(239,68,68,0.08)">
              <animate attributeName="r"       values="12;20;12" dur="1.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.12;0.04;0.12" dur="1.8s" repeatCount="indefinite" />
            </circle>
            <text x={cx} y={cy + 6} textAnchor="middle" fontSize={18} style={{ userSelect: "none", pointerEvents: "none" }}>❤️</text>
          </svg>

          {/* Vignette */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 45%, rgba(5,7,3,0.7) 100%)" }} />
        </div>

        {/* Right drawer trigger */}
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => setDrawerOpen(true)}
          style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 20, width: 30, height: 64, background: "rgba(8,12,6,0.92)", border: "1px solid rgba(74,222,128,0.2)", borderRight: "none", borderRadius: "12px 0 0 12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}
        >
          <SlidersHorizontal size={13} color="rgba(74,222,128,0.8)" />
          <span style={{ fontSize: 7, color: "rgba(74,222,128,0.6)", fontWeight: 800, writingMode: "vertical-rl", letterSpacing: "0.06em" }}>BADGES</span>
        </motion.button>

        {/* KM slider */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10, padding: "12px 20px 14px", background: "linear-gradient(to top, rgba(5,7,3,0.95) 55%, transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: "rgba(180,160,80,0.5)", fontWeight: 700, flexShrink: 0 }}>1km</span>
            <input type="range" min={1} max={150} value={maxKm} onChange={e => { setMaxKm(Number(e.target.value)); setSelectedId(null); }} style={{ flex: 1, accentColor: "#4ade80", cursor: "pointer" }} />
            <span style={{ fontSize: 9, color: "rgba(180,160,80,0.5)", fontWeight: 700, flexShrink: 0 }}>150km</span>
          </div>
        </div>
      </div>

      {/* ── Footer — always shows 4 nearest ── */}
      <div style={{ background: "rgba(6,8,5,0.98)", borderTop: "1px solid rgba(255,255,255,0.07)", padding: "10px 14px max(14px,env(safe-area-inset-bottom,14px))", flexShrink: 0 }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(74,222,128,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Nearest ghosts</p>
        <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none" }}>
          {nearest4.length === 0 ? (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>No ghosts in range — expand the slider</p>
          ) : (
            nearest4.map(p => {
              const isSel = p.id === selectedId;
              return (
                <motion.div
                  key={p.id}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => { setSelectedId(p.id); setPopupProfile(p); }}
                  style={{ flexShrink: 0, width: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
                >
                  <div style={{ position: "relative" }}>
                    {/* Ping ring on footer avatar */}
                    <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2px solid ${isSel ? "#ef4444" : "rgba(74,222,128,0.5)"}`, animation: "ping 2s ease-in-out infinite", pointerEvents: "none" }} />
                    <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: `2px solid ${isSel ? "#ef4444" : "rgba(74,222,128,0.4)"}`, background: "rgba(74,222,128,0.05)" }}>
                      <img src={p.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <span style={{ position: "absolute", bottom: -3, right: -3, background: isSel ? "#ef4444" : "rgba(74,222,128,0.9)", borderRadius: 6, padding: "1px 4px", fontSize: 7, fontWeight: 900, color: isSel ? "#fff" : "#000" }}>{p.distKm}km</span>
                  </div>
                  <span style={{ fontSize: 8, fontWeight: 700, color: isSel ? "rgba(239,68,68,0.9)" : "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.2 }}>{p.ghostId}</span>
                </motion.div>
              );
            })
          )}
          {/* Selected profile (if not in nearest 4) */}
          {selected && !nearest4Ids.has(selected.id) && (
            <>
              <div style={{ width: 1, background: "rgba(255,255,255,0.07)", flexShrink: 0, alignSelf: "stretch" }} />
              <motion.div whileTap={{ scale: 0.94 }} onClick={() => setPopupProfile(selected)} style={{ flexShrink: 0, width: 64, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: "2px solid #ef4444" }}>
                    <img src={selected.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <span style={{ position: "absolute", bottom: -3, right: -3, background: "#ef4444", borderRadius: 6, padding: "1px 4px", fontSize: 7, fontWeight: 900, color: "#fff" }}>{selected.distKm}km</span>
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(239,68,68,0.9)", textAlign: "center" }}>{selected.ghostId}</span>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* ── Badge drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)" }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 101, width: 280, maxWidth: "82vw", background: "rgba(8,12,6,0.98)", backdropFilter: "blur(24px)", borderLeft: "1px solid rgba(74,222,128,0.12)", display: "flex", flexDirection: "column" }}
            >
              <div style={{ padding: "max(16px,env(safe-area-inset-top,16px)) 16px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: 0 }}>Badge Filters</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Highlight ghosts by vibe</p>
                </div>
                <button onClick={() => setDrawerOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
                  <X size={14} />
                </button>
              </div>
              {activeBadge && (
                <div style={{ padding: "10px 14px 0" }}>
                  <button onClick={() => { setActiveBadge(null); setDrawerOpen(false); }} style={{ width: "100%", height: 34, borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,0.8)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                    <span>✕ Clear filter</span>
                  </button>
                </div>
              )}
              <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "10px 14px max(16px,env(safe-area-inset-bottom,16px))" }}>
                {BADGES.map(badge => {
                  const isActive = activeBadge === badge.id;
                  const count = visible.filter(p => p.badges.includes(badge.id)).length;
                  return (
                    <motion.button key={badge.id} whileTap={{ scale: 0.97 }}
                      onClick={() => { setActiveBadge(a => a === badge.id ? null : badge.id); setDrawerOpen(false); }}
                      style={{ width: "100%", marginBottom: 8, background: isActive ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${isActive ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "11px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}
                    >
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{badge.icon === "👻" ? <img src={GHOST_LOGO} alt="ghost" style={{ width: 54, height: 54, objectFit: "contain", verticalAlign: "middle" }} /> : badge.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: isActive ? "rgba(74,222,128,0.95)" : "#fff" }}>{badge.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? "rgba(74,222,128,0.8)" : "rgba(255,255,255,0.25)", background: isActive ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.05)", borderRadius: 10, padding: "1px 7px" }}>{count}</span>
                        </div>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", margin: 0, marginTop: 2 }}>{badge.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Profile popup ── */}
      <AnimatePresence>
        {popupProfile && (
          <ProfilePopup profile={popupProfile} isGhost={isGhost} onClose={() => setPopupProfile(null)} />
        )}
      </AnimatePresence>

      <style>{`@keyframes ping { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.3);opacity:0} }`}</style>
    </div>
  );
}
