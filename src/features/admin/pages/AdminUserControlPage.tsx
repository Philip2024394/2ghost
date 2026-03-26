/**
 * AdminUserControlPage — Full user management dashboard
 *
 * Layout:
 *  ┌──────────────────────────┬────────────────────────────────────────────────┐
 *  │  LEFT: User list (380px) │  RIGHT: Vertical icon nav (56px) + content     │
 *  │  • search + dropdowns    │  • Profile / Coins / Purchases / Butler         │
 *  │  • rich user cards       │  • Actions / Verify                             │
 *  └──────────────────────────┴────────────────────────────────────────────────┘
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, ShieldOff, Ban, Edit2, Check, RefreshCw,
  AlertTriangle, Trash2, Save, RotateCcw, Camera, Send, Radio,
  User, Coins, ShoppingBag, MessageSquare, Zap, CheckCircle,
  ChevronDown, ChevronUp,
} from "lucide-react";
import {
  fetchUsers, UserRow, sendButlerMessage,
  banGhostUser, setGhostCoins, setGhostTier, updateGhostProfile,
  approveGhostVerification, rejectGhostVerification, fetchPendingVerifications,
  fetchUserPurchases,
  PendingVerificationRow, UserPurchaseRow,
} from "../adminSupabaseService";

// ── Persistent store ──────────────────────────────────────────────────────────
const BANS_KEY    = "admin_bans";
const BLOCKS_KEY  = "admin_blocks";
const EDITS_KEY   = "admin_user_edits";
const DISMISS_KEY = "admin_portrait_dismissed";

function loadJSON<T>(key: string, fb: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fb; }
}
function saveJSON(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
type UserEdits = { name?: string; city?: string; tier?: string; coins?: number; bio?: string; note?: string };

// ── Mock helpers ──────────────────────────────────────────────────────────────
function mockChatsFor(userId: string) {
  const h = [...userId].reduce((a, c) => Math.imul(31, a) + c.charCodeAt(0) | 0, 0);
  const names = ["Sara M.", "Alex K.", "Lina J.", "Omar R.", "Mia P."];
  const msgs  = ["Hey, are you coming tonight?", "I loved your profile 😍", "Ghost ID match!", "Just sent you a gift 🎁", "Ready for the lobby?"];
  return Array.from({ length: 1 + Math.abs(h) % 5 }, (_, i) => ({
    partner: names[Math.abs(h >> (i * 4)) % names.length],
    last:    msgs[Math.abs(h >> (i * 3)) % msgs.length],
    ago:     `${1 + Math.abs(h >> (i * 2 + 1)) % 48}h ago`,
    unread:  Math.abs(h >> (i + 7)) % 3,
  }));
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD        = "#d4af37";
const GOLD_DIM    = "rgba(212,175,55,0.7)";
const GOLD_BG     = "rgba(212,175,55,0.08)";
const GOLD_BORDER = "rgba(212,175,55,0.22)";
const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
};
const GOLD_CARD: React.CSSProperties = {
  background: GOLD_BG,
  border: `1px solid ${GOLD_BORDER}`,
  borderRadius: 16,
};

const TIER_COLOR: Record<string, string> = {
  free: "#94a3b8", suite: "#4ade80", gold: "#d4af37", standard: "#94a3b8", penthouse: "#a78bfa",
};
const TIER_BG: Record<string, string> = {
  free: "rgba(148,163,184,0.1)", suite: "rgba(74,222,128,0.1)", gold: "rgba(212,175,55,0.1)",
};

// ── Small dropdown component ──────────────────────────────────────────────────
function Dropdown<T extends string>({
  value, options, onChange, placeholder,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          height: 34, minWidth: 110, borderRadius: 9, border: `1px solid ${GOLD_BORDER}`,
          background: GOLD_BG, color: GOLD, fontSize: 11, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, padding: "0 10px", whiteSpace: "nowrap",
        }}
      >
        <span style={{ flex: 1, textAlign: "left" }}>{current?.label ?? placeholder}</span>
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 9999,
              background: "#0e0d12", border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 10, padding: 4, minWidth: "100%",
              boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
            }}
          >
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                style={{
                  display: "block", width: "100%", textAlign: "left",
                  padding: "8px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                  background: value === o.value ? GOLD_BG : "transparent",
                  color: value === o.value ? GOLD : "rgba(255,255,255,0.6)",
                  fontSize: 12, fontWeight: value === o.value ? 700 : 500,
                }}
              >
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section nav config ────────────────────────────────────────────────────────
type Section = "profile" | "coins" | "purchases" | "butler" | "actions" | "verify";
const SECTIONS: { id: Section; icon: React.ReactNode; label: string; gold?: boolean }[] = [
  { id: "profile",   icon: <User size={17} />,         label: "Profile"   },
  { id: "coins",     icon: <Coins size={17} />,        label: "Coins",     gold: true },
  { id: "purchases", icon: <ShoppingBag size={17} />,  label: "Purchases"  },
  { id: "butler",    icon: <MessageSquare size={17} />, label: "Butler",   gold: true },
  { id: "actions",   icon: <Zap size={17} />,          label: "Actions"   },
  { id: "verify",    icon: <CheckCircle size={17} />,  label: "Verify",   gold: true },
];

// ── AdminDateIdeasPanel (inline, unchanged) ───────────────────────────────────
function AdminDateIdeasPanel() {
  const [idea, setIdea] = useState("");
  const [city, setCity] = useState("Jakarta");
  const [saved, setSaved] = useState(false);
  const [posts, setPosts] = useState<{ idea: string; city: string; ts: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem("ghost_date_ideas_posts") || "[]"); } catch { return []; }
  });
  const submit = () => {
    if (!idea.trim()) return;
    const next = [{ idea: idea.trim(), city, ts: Date.now() }, ...posts].slice(0, 20);
    setPosts(next);
    localStorage.setItem("ghost_date_ideas_posts", JSON.stringify(next));
    setSaved(true); setIdea("");
    setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...GOLD_CARD, padding: "18px" }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: GOLD_DIM, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>Post Date Idea as Mr. Butlas</p>
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City…" style={{ width: "100%", height: 36, borderRadius: 9, border: `1px solid ${GOLD_BORDER}`, background: GOLD_BG, color: "#fff", fontSize: 12, padding: "0 12px", outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
        <textarea value={idea} onChange={(e) => setIdea(e.target.value)} rows={3} placeholder="A romantic dinner idea…" style={{ width: "100%", borderRadius: 9, border: `1px solid ${GOLD_BORDER}`, background: GOLD_BG, color: "#fff", fontSize: 12, padding: "10px 12px", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 10 }} />
        <button onClick={submit} style={{ width: "100%", height: 42, borderRadius: 11, border: "none", background: saved ? "rgba(74,222,128,0.15)" : `linear-gradient(135deg,#92660a,${GOLD})`, color: saved ? "#4ade80" : "#000", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
          {saved ? "✓ Posted!" : "💝 Post Date Idea"}
        </button>
      </div>
      {posts.slice(0, 4).map((p) => (
        <div key={p.ts} style={{ ...CARD, padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: GOLD_DIM }}>{p.city}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{new Date(p.ts).toLocaleDateString()}</span>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.5 }}>{p.idea}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminUserControlPage() {
  const [users,     setUsers]     = useState<UserRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [tierF,     setTierF]     = useState<"all" | "free" | "suite" | "gold">("all");
  const [statusF,   setStatusF]   = useState<"all" | "active" | "banned" | "blocked">("all");
  const [genderF,   setGenderF]   = useState<"all" | "Female" | "Male">("all");
  const [selected,  setSelected]  = useState<UserRow | null>(null);
  const [section,   setSection]   = useState<Section>("profile");
  const [editing,   setEditing]   = useState(false);

  // Butler state
  const [butlerMsg,     setButlerMsg]     = useState("");
  const [butlerSending, setButlerSending] = useState(false);
  const [butlerSent,    setButlerSent]    = useState(false);
  const [butlerHistory, setButlerHistory] = useState<{ text: string; ts: number }[]>([]);

  // Broadcast state
  const [broadcastOpen,    setBroadcastOpen]    = useState(false);
  const [broadcastMsg,     setBroadcastMsg]     = useState("");
  const [broadcastExpiry,  setBroadcastExpiry]  = useState(24);
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSent,    setBroadcastSent]    = useState(false);

  // Persistent ban/block/dismiss/edits
  const [bans,      setBans]      = useState<Record<string, boolean>>(() => loadJSON(BANS_KEY, {}));
  const [blocks,    setBlocks]    = useState<Record<string, boolean>>(() => loadJSON(BLOCKS_KEY, {}));
  const [dismissed, setDismissed] = useState<Record<string, boolean>>(() => loadJSON(DISMISS_KEY, {}));
  const [edits,     setEdits]     = useState<Record<string, UserEdits>>(() => loadJSON(EDITS_KEY, {}));

  // Edit form
  const [eName,  setEName]  = useState("");
  const [eCity,  setECity]  = useState("");
  const [eTier,  setETier]  = useState("");
  const [eCoins, setECoins] = useState("");
  const [eBio,   setEBio]   = useState("");
  const [eNote,  setENote]  = useState("");
  const [saved,  setSaved]  = useState(false);

  // Coins custom input
  const [coinInput,     setCoinInput]     = useState("");
  const [coinInputMode, setCoinInputMode] = useState(false);

  // Verification
  const [pendingVerify, setPendingVerify]   = useState<PendingVerificationRow[]>([]);
  const [verifyAction,  setVerifyAction]    = useState<Record<string, "approving" | "rejecting">>({});

  // Purchase history
  const [purchases,        setPurchases]        = useState<UserPurchaseRow[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  const persist = useCallback((key: string, val: unknown) => saveJSON(key, val), []);

  const load = async () => {
    setLoading(true);
    const [u, pv] = await Promise.all([fetchUsers(), fetchPendingVerifications()]);
    setUsers(u);
    setPendingVerify(pv);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Load purchases when switching to that section
  useEffect(() => {
    if (section === "purchases" && selected) {
      setPurchasesLoading(true);
      fetchUserPurchases(selected.ghostId).then((p) => { setPurchases(p); setPurchasesLoading(false); });
    }
  }, [section, selected]);

  const toggleBan = (id: string, ghostId?: string) => {
    const next = { ...bans, [id]: !bans[id] };
    if (!next[id]) delete next[id];
    setBans(next); persist(BANS_KEY, next);
    if (ghostId) banGhostUser(ghostId, !!next[id]);
  };
  const toggleBlock = (id: string, ghostId?: string) => {
    const next = { ...blocks, [id]: !blocks[id] };
    if (!next[id]) delete next[id];
    setBlocks(next); persist(BLOCKS_KEY, next);
    if (ghostId) banGhostUser(ghostId, !!next[id]);
  };
  const toggleDismiss = (id: string) => {
    const next = { ...dismissed, [id]: !dismissed[id] };
    if (!next[id]) delete next[id];
    setDismissed(next); persist(DISMISS_KEY, next);
  };

  const openUser = (u: UserRow) => {
    setSelected(u); setSection("profile"); setEditing(false);
    const e = edits[u.id] ?? {};
    setEName(e.name ?? u.name); setECity(e.city ?? u.city);
    setETier(e.tier ?? u.tier); setECoins(String(e.coins ?? 0));
    setEBio(e.bio ?? ""); setENote(e.note ?? ""); setSaved(false);
  };

  const saveEdits = () => {
    if (!selected) return;
    const next: UserEdits = { name: eName || selected.name, city: eCity || selected.city, tier: eTier || selected.tier, coins: Number(eCoins) || 0, bio: eBio, note: eNote };
    const all = { ...edits, [selected.id]: next };
    setEdits(all); persist(EDITS_KEY, all);
    if (selected.ghostId) {
      updateGhostProfile(selected.ghostId, { display_name: next.name, city: next.city });
      if (next.tier) setGhostTier(selected.ghostId, next.tier);
      if (next.coins !== undefined) setGhostCoins(selected.ghostId, next.coins);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditing(false); }, 900);
  };
  const deleteEdits = (id: string) => {
    const all = { ...edits }; delete all[id];
    setEdits(all); persist(EDITS_KEY, all);
  };
  const adjustCoins = (delta: number) => {
    if (!selected) return;
    const cur = edits[selected.id]?.coins ?? 0;
    const next = Math.max(0, cur + delta);
    const all = { ...edits, [selected.id]: { ...(edits[selected.id] ?? {}), coins: next } };
    setEdits(all); persist(EDITS_KEY, all); setECoins(String(next));
    if (selected.ghostId) setGhostCoins(selected.ghostId, next);
  };
  const setCoinsExact = (n: number) => {
    if (!selected) return;
    const all = { ...edits, [selected.id]: { ...(edits[selected.id] ?? {}), coins: n } };
    setEdits(all); persist(EDITS_KEY, all); setECoins(String(n));
    if (selected.ghostId) setGhostCoins(selected.ghostId, n);
  };

  const getDisplayName = (u: UserRow) => edits[u.id]?.name ?? u.name;
  const getStatus      = (id: string)  => bans[id] ? "banned" : blocks[id] ? "blocked" : dismissed[id] ? "no portrait" : "active";
  const currentCoins   = selected ? (edits[selected.id]?.coins ?? 0) : 0;
  const currentTier    = selected ? (edits[selected.id]?.tier ?? selected.tier) : "free";

  const filtered = users.filter((u) => {
    const st = getStatus(u.id);
    if (statusF !== "all" && st !== statusF) return false;
    if (tierF   !== "all" && (edits[u.id]?.tier ?? u.tier) !== tierF) return false;
    if (genderF !== "all" && u.gender !== genderF) return false;
    const q = search.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !u.city.toLowerCase().includes(q) && !u.phone.includes(q)) return false;
    return true;
  });

  const STATUS_COLOR: Record<string, string> = { banned: "#ef4444", blocked: "#f59e0b", "no portrait": GOLD, active: "#4ade80" };
  const STATUS_BG: Record<string, string> = { banned: "rgba(239,68,68,0.1)", blocked: "rgba(245,158,11,0.1)", "no portrait": GOLD_BG, active: "rgba(74,222,128,0.1)" };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: "#08070c" }}>

      {/* ════════════════════════════════════════════════════════
          LEFT PANEL — User list
      ════════════════════════════════════════════════════════ */}
      <div style={{
        width: selected ? 380 : "100%", flexShrink: 0,
        display: "flex", flexDirection: "column",
        borderRight: selected ? `1px solid rgba(212,175,55,0.1)` : "none",
        overflow: "hidden", transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 18px 14px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>Guest Control</h1>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                {filtered.length}/{users.length} guests
                {pendingVerify.length > 0 && <span style={{ color: GOLD, fontWeight: 700, marginLeft: 6 }}>· {pendingVerify.length} verify</span>}
              </p>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <button
                onClick={() => setBroadcastOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 5, height: 32, padding: "0 10px", borderRadius: 8, border: `1px solid ${GOLD_BORDER}`, background: GOLD_BG, color: GOLD, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                <Radio size={11} /> Broadcast
              </button>
              <button
                onClick={load}
                style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, city, phone…"
              style={{ width: "100%", height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, padding: "0 12px 0 32px", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Filter dropdowns */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <Dropdown
              value={tierF}
              onChange={setTierF}
              options={[{ value: "all", label: "All Tiers" }, { value: "free", label: "Free" }, { value: "suite", label: "Suite" }, { value: "gold", label: "Gold" }]}
            />
            <Dropdown
              value={statusF}
              onChange={setStatusF}
              options={[{ value: "all", label: "All Status" }, { value: "active", label: "Active" }, { value: "banned", label: "Banned" }, { value: "blocked", label: "Blocked" }]}
            />
            <Dropdown
              value={genderF}
              onChange={setGenderF}
              options={[{ value: "all", label: "All Genders" }, { value: "Female", label: "Female" }, { value: "Male", label: "Male" }]}
            />
          </div>
        </div>

        {/* User list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px 12px" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Loading guests…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>No guests found</div>
          ) : filtered.map((u, idx) => {
            const st       = getStatus(u.id);
            const isActive = selected?.id === u.id;
            const coins    = edits[u.id]?.coins ?? 0;
            const tier     = edits[u.id]?.tier ?? u.tier;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.015, duration: 0.2 }}
                onClick={() => openUser(u)}
                style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "11px 12px", borderRadius: 13, cursor: "pointer", marginBottom: 3,
                  background: isActive ? GOLD_BG : "transparent",
                  border: isActive ? `1px solid ${GOLD_BORDER}` : "1px solid transparent",
                  transition: "all 0.15s",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: st === "banned" ? "rgba(239,68,68,0.15)" : TIER_BG[tier] ?? "rgba(255,255,255,0.06)",
                  border: `2px solid ${STATUS_COLOR[st]}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 800, color: TIER_COLOR[tier] ?? "#fff",
                  position: "relative",
                }}>
                  {getDisplayName(u).charAt(0)}
                  {/* Online dot */}
                  {(u.lastActive?.includes("m") || u.lastActive?.includes("1h") || u.lastActive?.includes("2h")) && (
                    <div style={{ position: "absolute", bottom: 1, right: 1, width: 9, height: 9, borderRadius: "50%", background: "#4ade80", border: "2px solid #08070c" }} />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{getDisplayName(u)}</span>
                    {u.verificationStatus === "verified" && <span style={{ fontSize: 9 }}>✅</span>}
                    {u.verificationStatus === "pending"  && <span style={{ fontSize: 9 }}>⏳</span>}
                    {edits[u.id] && <span style={{ fontSize: 8, background: "rgba(168,85,247,0.2)", color: "#c084fc", borderRadius: 4, padding: "1px 4px", fontWeight: 700 }}>EDIT</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{u.country} {u.city}</span>
                    <span style={{ fontSize: 9, color: TIER_COLOR[tier], fontWeight: 700 }}>{tier.toUpperCase()}</span>
                  </div>
                </div>

                {/* Right: coin + status + quick ban */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                  {coins > 0 && (
                    <span style={{ fontSize: 10, color: GOLD, fontWeight: 700 }}>{coins}🪙</span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 8, fontWeight: 800, borderRadius: 4, padding: "2px 5px", background: STATUS_BG[st], color: STATUS_COLOR[st], textTransform: "uppercase", letterSpacing: "0.05em" }}>{st}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBan(u.id, u.ghostId); }}
                      style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: bans[u.id] ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)", color: bans[u.id] ? "#ef4444" : "rgba(255,255,255,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Ban size={10} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          RIGHT PANEL — User detail
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22 }}
            style={{ flex: 1, display: "flex", overflow: "hidden" }}
          >
            {/* ── Vertical icon sidebar ── */}
            <div style={{
              width: 60, flexShrink: 0,
              display: "flex", flexDirection: "column", alignItems: "center",
              paddingTop: 16, gap: 4,
              borderRight: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(0,0,0,0.15)",
            }}>
              {SECTIONS.map((s) => {
                const active = section === s.id;
                const badge  = s.id === "verify" && (pendingVerify.length > 0) ? pendingVerify.length : 0;
                return (
                  <div key={s.id} style={{ position: "relative" }}>
                    <button
                      onClick={() => setSection(s.id)}
                      title={s.label}
                      style={{
                        width: 44, height: 44, borderRadius: 12, border: "none", cursor: "pointer",
                        background: active ? (s.gold ? GOLD_BG : "rgba(74,222,128,0.1)") : "transparent",
                        color: active ? (s.gold ? GOLD : "#4ade80") : "rgba(255,255,255,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s",
                        outline: active ? `1px solid ${s.gold ? GOLD_BORDER : "rgba(74,222,128,0.2)"}` : "none",
                      }}
                    >
                      {s.icon}
                    </button>
                    {badge > 0 && (
                      <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: "#000" }}>{badge}</div>
                    )}
                  </div>
                );
              })}

              {/* Spacer + close */}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setSelected(null)}
                style={{ width: 44, height: 44, borderRadius: 12, border: "none", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Content area ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* User header */}
              <div style={{ padding: "18px 22px 14px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(212,175,55,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Big avatar */}
                  <div style={{
                    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                    background: TIER_BG[currentTier] ?? GOLD_BG,
                    border: `2px solid ${TIER_COLOR[currentTier] ?? GOLD}50`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, fontWeight: 900, color: TIER_COLOR[currentTier] ?? GOLD,
                  }}>
                    {getDisplayName(selected).charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getDisplayName(selected)}</h2>
                      {selected.verificationStatus === "verified" && <span style={{ fontSize: 13 }}>✅</span>}
                      {selected.verificationStatus === "pending"  && <span style={{ fontSize: 11, background: "rgba(212,175,55,0.15)", color: GOLD, borderRadius: 5, padding: "2px 6px", fontWeight: 700, fontSize: 9 }}>VERIFY PENDING</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{selected.phone}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, borderRadius: 5, padding: "2px 7px", background: TIER_BG[currentTier] ?? GOLD_BG, color: TIER_COLOR[currentTier] ?? GOLD, textTransform: "uppercase" }}>{currentTier}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, borderRadius: 5, padding: "2px 7px", background: STATUS_BG[getStatus(selected.id)], color: STATUS_COLOR[getStatus(selected.id)], textTransform: "uppercase" }}>{getStatus(selected.id)}</span>
                      <span style={{ fontSize: 11, color: GOLD, fontWeight: 800 }}>{currentCoins}🪙</span>
                    </div>
                  </div>
                  {/* Section label */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>
                      {SECTIONS.find((s) => s.id === section)?.label}
                    </p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "3px 0 0" }}>
                      {selected.lastActive} · {selected.country} {selected.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={section}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >

                    {/* ────────── PROFILE ────────── */}
                    {section === "profile" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ ...CARD, padding: "18px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Profile Details</span>
                            <button onClick={() => { setEditing(!editing); setSaved(false); }} style={{ display: "flex", alignItems: "center", gap: 5, height: 30, padding: "0 10px", borderRadius: 8, border: `1px solid ${editing ? GOLD_BORDER : "rgba(255,255,255,0.1)"}`, background: editing ? GOLD_BG : "rgba(255,255,255,0.04)", color: editing ? GOLD : "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              <Edit2 size={11} /> {editing ? "Cancel" : "Edit"}
                            </button>
                          </div>

                          {editing ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                              {[
                                { label: "Display Name", val: eName,  set: setEName  },
                                { label: "City",         val: eCity,  set: setECity  },
                                { label: "Bio",          val: eBio,   set: setEBio   },
                                { label: "Admin Note",   val: eNote,  set: setENote  },
                              ].map((f) => (
                                <div key={f.label}>
                                  <label style={{ fontSize: 10, fontWeight: 700, color: GOLD_DIM, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 5 }}>{f.label}</label>
                                  {(f.label === "Bio" || f.label === "Admin Note") ? (
                                    <textarea value={f.val} onChange={(e) => f.set(e.target.value)} rows={2}
                                      style={{ width: "100%", borderRadius: 10, border: `1px solid ${GOLD_BORDER}`, background: GOLD_BG, color: "#fff", fontSize: 12, padding: "8px 12px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
                                  ) : (
                                    <input type="text" value={f.val} onChange={(e) => f.set(e.target.value)}
                                      style={{ width: "100%", height: 38, borderRadius: 10, border: `1px solid ${GOLD_BORDER}`, background: GOLD_BG, color: "#fff", fontSize: 12, padding: "0 12px", outline: "none", boxSizing: "border-box" }} />
                                  )}
                                </div>
                              ))}

                              <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: GOLD_DIM, textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 6 }}>Subscription Tier</label>
                                <div style={{ display: "flex", gap: 8 }}>
                                  {["free", "suite", "gold"].map((t) => (
                                    <button key={t} onClick={() => setETier(t)} style={{ flex: 1, height: 36, borderRadius: 9, border: eTier === t ? `1px solid ${TIER_COLOR[t]}60` : "1px solid rgba(255,255,255,0.07)", background: eTier === t ? TIER_BG[t] : "rgba(255,255,255,0.03)", color: eTier === t ? TIER_COLOR[t] : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
                                  ))}
                                </div>
                              </div>

                              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                {edits[selected.id] && (
                                  <button onClick={() => { deleteEdits(selected.id); setEditing(false); }} style={{ flex: 1, height: 42, borderRadius: 11, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                                    <RotateCcw size={11} /> Reset
                                  </button>
                                )}
                                <motion.button whileTap={{ scale: 0.97 }} onClick={saveEdits}
                                  style={{ flex: 3, height: 42, borderRadius: 11, border: "none", background: saved ? "rgba(74,222,128,0.15)" : `linear-gradient(135deg,#92660a,${GOLD})`, color: saved ? "#4ade80" : "#000", fontSize: 13, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                                  {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
                                </motion.button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px" }}>
                              {[
                                { label: "Name",        value: getDisplayName(selected)                      },
                                { label: "Phone",       value: selected.phone                                },
                                { label: "Location",    value: `${selected.country} ${selected.city}`        },
                                { label: "Gender",      value: selected.gender                               },
                                { label: "Tier",        value: (edits[selected.id]?.tier ?? selected.tier).toUpperCase() },
                                { label: "Joined",      value: selected.joined                               },
                                { label: "Last Active", value: selected.lastActive                           },
                                { label: "Ghost ID",    value: selected.ghostId || selected.id               },
                              ].map((r) => (
                                <div key={r.label}>
                                  <p style={{ fontSize: 9, fontWeight: 700, color: GOLD_DIM, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>{r.label}</p>
                                  <p style={{ fontSize: 12, color: "#fff", margin: 0, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</p>
                                </div>
                              ))}
                              {edits[selected.id]?.bio && (
                                <div style={{ gridColumn: "span 2" }}>
                                  <p style={{ fontSize: 9, fontWeight: 700, color: GOLD_DIM, textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 3px" }}>Bio</p>
                                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.5 }}>{edits[selected.id]?.bio}</p>
                                </div>
                              )}
                              {edits[selected.id]?.note && (
                                <div style={{ gridColumn: "span 2", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.18)", borderRadius: 10, padding: "10px 12px" }}>
                                  <p style={{ fontSize: 9, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 4px" }}>🔒 Admin Note</p>
                                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>{edits[selected.id]?.note}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Chat activity preview */}
                        <div style={{ ...CARD, padding: "16px 18px" }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Recent Chat Activity</p>
                          {mockChatsFor(selected.id).map((c, i, arr) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                              <div style={{ width: 30, height: 30, borderRadius: "50%", background: GOLD_BG, border: `1px solid ${GOLD_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: GOLD, flexShrink: 0 }}>{c.partner.charAt(0)}</div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{c.partner}</span>
                                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{c.ago}</span>
                                </div>
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.last}</p>
                              </div>
                              {c.unread > 0 && <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, color: "#000" }}>{c.unread}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ────────── COINS ────────── */}
                    {section === "coins" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {/* Balance display */}
                        <div style={{ ...GOLD_CARD, padding: "24px 20px", textAlign: "center" }}>
                          <p style={{ fontSize: 11, fontWeight: 800, color: GOLD_DIM, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 8px" }}>Ghost Coin Balance</p>
                          <motion.p
                            key={currentCoins}
                            initial={{ scale: 1.15, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ fontSize: 56, fontWeight: 900, color: GOLD, margin: 0, lineHeight: 1 }}
                          >
                            {currentCoins}
                          </motion.p>
                          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "6px 0 0" }}>🪙 Ghost Coins</p>
                        </div>

                        {/* Quick add */}
                        <div style={{ ...CARD, padding: "16px 18px" }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Quick Adjust</p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                            {[25, 50, 100, 200].map((amt) => (
                              <motion.button key={amt} whileTap={{ scale: 0.95 }} onClick={() => adjustCoins(amt)}
                                style={{ height: 42, borderRadius: 10, border: `1px solid rgba(74,222,128,0.25)`, background: "rgba(74,222,128,0.07)", color: "#4ade80", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                                +{amt}
                              </motion.button>
                            ))}
                            {[25, 50, 100, 200].map((amt) => (
                              <motion.button key={`-${amt}`} whileTap={{ scale: 0.95 }} onClick={() => adjustCoins(-amt)}
                                style={{ height: 42, borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                                -{amt}
                              </motion.button>
                            ))}
                          </div>

                          {/* Custom amount */}
                          {coinInputMode ? (
                            <div style={{ display: "flex", gap: 8 }}>
                              <input
                                type="number" value={coinInput} onChange={(e) => setCoinInput(e.target.value)}
                                placeholder="Enter exact amount…"
                                style={{ flex: 1, height: 40, borderRadius: 10, border: `1px solid ${GOLD_BORDER}`, background: GOLD_BG, color: "#fff", fontSize: 13, padding: "0 12px", outline: "none" }}
                              />
                              <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setCoinsExact(Math.max(0, Number(coinInput))); setCoinInputMode(false); setCoinInput(""); }}
                                style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "none", background: `linear-gradient(135deg,#92660a,${GOLD})`, color: "#000", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>
                                Set
                              </motion.button>
                              <button onClick={() => setCoinInputMode(false)} style={{ height: 40, width: 40, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setCoinInputMode(true)} style={{ flex: 1, height: 40, borderRadius: 10, border: `1px solid ${GOLD_BORDER}`, background: GOLD_BG, color: GOLD, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                Set Custom Amount
                              </button>
                              <button onClick={() => { setCoinsExact(0); }}
                                style={{ height: 40, padding: "0 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                Reset to 0
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Coin history (simulated) */}
                        <div style={{ ...CARD, padding: "16px 18px" }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Coin Activity Log</p>
                          {[
                            { type: "+", label: "Welcome bonus",           coins: 10,   ago: "on join" },
                            { type: "+", label: "Referral reward",         coins: 25,   ago: "3 days ago" },
                            { type: "-", label: "WhatsApp contact reveal", coins: 50,   ago: "2 days ago" },
                            { type: "+", label: "Admin grant",             coins: currentCoins, ago: "today" },
                          ].map((e, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                              <div style={{ width: 28, height: 28, borderRadius: 8, background: e.type === "+" ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: e.type === "+" ? "#4ade80" : "#f87171", flexShrink: 0 }}>
                                {e.type}
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 12, color: "#fff", margin: 0, fontWeight: 600 }}>{e.label}</p>
                                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{e.ago}</p>
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 800, color: e.type === "+" ? "#4ade80" : "#f87171" }}>{e.type}{e.coins}🪙</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ────────── PURCHASES ────────── */}
                    {section === "purchases" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {/* Summary card */}
                        <div style={{ ...GOLD_CARD, padding: "18px 20px" }}>
                          {purchasesLoading ? (
                            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", margin: 0, padding: "8px 0" }}>Loading…</p>
                          ) : (
                            <>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
                                <div>
                                  <p style={{ fontSize: 28, fontWeight: 900, color: GOLD, margin: 0, lineHeight: 1 }}>
                                    ${purchases.filter((p) => p.status === "paid").reduce((s, p) => s + parseFloat(p.amount.replace("$", "")), 0).toFixed(2)}
                                  </p>
                                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "3px 0 0" }}>Total spent (paid)</p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <p style={{ fontSize: 18, fontWeight: 800, color: "#fff", margin: 0 }}>{purchases.length}</p>
                                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>transactions</p>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                {[
                                  { label: "Paid",     count: purchases.filter((p) => p.status === "paid").length,     color: "#4ade80" },
                                  { label: "Refunded", count: purchases.filter((p) => p.status === "refunded").length,  color: "#f59e0b" },
                                  { label: "Failed",   count: purchases.filter((p) => p.status === "failed").length,    color: "#ef4444" },
                                ].map((s) => (
                                  <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                                    <p style={{ fontSize: 18, fontWeight: 900, color: s.color, margin: 0 }}>{s.count}</p>
                                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", margin: "2px 0 0", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</p>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Transaction list */}
                        <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
                          {purchasesLoading ? (
                            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, textAlign: "center", padding: "28px 0" }}>Loading transactions…</p>
                          ) : purchases.length === 0 ? (
                            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, textAlign: "center", padding: "28px 0" }}>No purchase history found</p>
                          ) : purchases.map((p, i) => {
                            const scl = p.status === "paid" ? "#4ade80" : p.status === "refunded" ? "#f59e0b" : "#ef4444";
                            const sbg = p.status === "paid" ? "rgba(74,222,128,0.1)" : p.status === "refunded" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.08)";
                            return (
                              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i < purchases.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: sbg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                                  {p.pkg.includes("Gold") ? "👑" : "🏨"}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 13, fontWeight: 700, color: p.pkg.includes("Gold") ? GOLD : "#4ade80", margin: 0 }}>{p.pkg}</p>
                                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, fontFamily: "monospace" }}>{p.id} · {p.date}</p>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                  <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: 0 }}>{p.amount}</p>
                                  <span style={{ fontSize: 9, fontWeight: 800, borderRadius: 4, padding: "2px 6px", background: sbg, color: scl, textTransform: "uppercase" }}>{p.status}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ────────── BUTLER ────────── */}
                    {section === "butler" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ ...GOLD_CARD, padding: "18px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(212,175,55,0.15)", border: `1px solid ${GOLD_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎩</div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 800, color: GOLD, margin: 0 }}>Send as Mr. Butlas</p>
                              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Personal butler message to {getDisplayName(selected)}</p>
                            </div>
                          </div>
                          <textarea value={butlerMsg} onChange={(e) => setButlerMsg(e.target.value)} rows={4} placeholder="Good evening — Mr. Butlas here. A private note for you…"
                            style={{ width: "100%", borderRadius: 12, border: `1px solid ${GOLD_BORDER}`, background: "rgba(212,175,55,0.04)", color: "#fff", fontSize: 13, padding: "12px 14px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
                          <motion.button whileTap={{ scale: 0.97 }} disabled={!butlerMsg.trim() || butlerSending}
                            onClick={async () => {
                              if (!butlerMsg.trim()) return;
                              setButlerSending(true);
                              await sendButlerMessage(selected.id, butlerMsg.trim());
                              setButlerHistory((h) => [{ text: butlerMsg.trim(), ts: Date.now() }, ...h].slice(0, 20));
                              setButlerMsg(""); setButlerSending(false); setButlerSent(true);
                              setTimeout(() => setButlerSent(false), 2500);
                            }}
                            style={{ width: "100%", height: 46, borderRadius: 12, marginTop: 10, border: "none", background: butlerSent ? "rgba(74,222,128,0.12)" : butlerMsg.trim() ? `linear-gradient(135deg,#92660a,${GOLD})` : "rgba(255,255,255,0.05)", color: butlerSent ? "#4ade80" : butlerMsg.trim() ? "#000" : "rgba(255,255,255,0.25)", fontSize: 13, fontWeight: 900, cursor: butlerMsg.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                            {butlerSending ? "Sending…" : butlerSent ? <><Check size={14} /> Delivered!</> : <><Send size={14} /> Send to {getDisplayName(selected)}</>}
                          </motion.button>
                        </div>

                        {butlerHistory.length > 0 && (
                          <div style={{ ...CARD, padding: "14px 16px" }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Sent This Session</p>
                            {butlerHistory.map((h, i) => (
                              <div key={i} style={{ background: GOLD_BG, border: `1px solid ${GOLD_BORDER}`, borderRadius: 10, padding: "10px 12px", marginBottom: i < butlerHistory.length - 1 ? 8 : 0 }}>
                                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: "0 0 4px", fontStyle: "italic", lineHeight: 1.5 }}>"{h.text}"</p>
                                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0 }}>{new Date(h.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ ...CARD, padding: "14px 16px" }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Date Ideas Panel</p>
                          <AdminDateIdeasPanel />
                        </div>
                      </div>
                    )}

                    {/* ────────── ACTIONS ────────── */}
                    {section === "actions" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Access control */}
                        <div style={{ ...CARD, padding: "16px 18px" }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Access Control</p>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <button onClick={() => toggleBan(selected.id, selected.ghostId)} style={{ height: 44, borderRadius: 11, background: bans[selected.id] ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)", border: bans[selected.id] ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(239,68,68,0.25)", color: bans[selected.id] ? "#4ade80" : "#f87171", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                              <Ban size={14} />{bans[selected.id] ? "Remove Ban" : "Ban User"}
                            </button>
                            <button onClick={() => toggleBlock(selected.id, selected.ghostId)} style={{ height: 44, borderRadius: 11, background: blocks[selected.id] ? "rgba(74,222,128,0.08)" : "rgba(245,158,11,0.08)", border: blocks[selected.id] ? "1px solid rgba(74,222,128,0.25)" : "1px solid rgba(245,158,11,0.25)", color: blocks[selected.id] ? "#4ade80" : "#f59e0b", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                              <ShieldOff size={14} />{blocks[selected.id] ? "Unblock" : "Block User"}
                            </button>
                            <button onClick={() => toggleDismiss(selected.id)} style={{ height: 44, borderRadius: 11, background: dismissed[selected.id] ? "rgba(74,222,128,0.08)" : GOLD_BG, border: dismissed[selected.id] ? "1px solid rgba(74,222,128,0.25)" : `1px solid ${GOLD_BORDER}`, color: dismissed[selected.id] ? "#4ade80" : GOLD, fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                              <Camera size={14} />{dismissed[selected.id] ? "Restore Portrait" : "Dismiss — No Portrait"}
                            </button>
                          </div>
                        </div>

                        {/* Tier override */}
                        <div style={{ ...CARD, padding: "16px 18px" }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Force Tier Change</p>
                          <div style={{ display: "flex", gap: 8 }}>
                            {["free", "suite", "gold"].map((t) => (
                              <button key={t} onClick={() => {
                                const e = edits[selected.id] ?? {};
                                const next = { ...edits, [selected.id]: { ...e, tier: t } };
                                setEdits(next); persist(EDITS_KEY, next);
                                if (selected.ghostId) setGhostTier(selected.ghostId, t);
                              }} style={{ flex: 1, height: 40, borderRadius: 10, border: currentTier === t ? `1px solid ${TIER_COLOR[t]}60` : "1px solid rgba(255,255,255,0.07)", background: currentTier === t ? TIER_BG[t] : "rgba(255,255,255,0.03)", color: currentTier === t ? TIER_COLOR[t] : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
                            ))}
                          </div>
                        </div>

                        {/* Danger zone */}
                        <div style={{ ...CARD, padding: "16px 18px", border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.02)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                            <AlertTriangle size={13} style={{ color: "#ef4444" }} />
                            <p style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Danger Zone</p>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => deleteEdits(selected.id)} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                              <RotateCcw size={12} /> Reset Edits
                            </button>
                            <button onClick={() => { toggleBan(selected.id, selected.ghostId); }} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.07)", color: "#ef4444", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                              <Trash2 size={12} /> Ban + Flag
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ────────── VERIFY ────────── */}
                    {section === "verify" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ ...GOLD_CARD, padding: "18px" }}>
                          <p style={{ fontSize: 11, fontWeight: 800, color: GOLD_DIM, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
                            {getDisplayName(selected)}'s Verification
                          </p>
                          {(() => {
                            const vs = selected.verificationStatus ?? "none";
                            const vc = vs === "verified" ? "#4ade80" : vs === "pending" ? GOLD : vs === "rejected" ? "#ef4444" : "rgba(255,255,255,0.3)";
                            return (
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${vc}18`, border: `1px solid ${vc}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                                    {vs === "verified" ? "✅" : vs === "pending" ? "⏳" : vs === "rejected" ? "❌" : "⬜"}
                                  </div>
                                  <div>
                                    <p style={{ fontSize: 15, fontWeight: 800, color: vc, margin: 0, textTransform: "capitalize" }}>{vs}</p>
                                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                                      {vs === "verified" ? "Face verified — blue checkmark active" : vs === "pending" ? "Video submitted — awaiting review" : vs === "rejected" ? "Declined — user can resubmit" : "No verification submitted"}
                                    </p>
                                  </div>
                                </div>

                                {vs === "pending" && selected.verificationVideoUrl && (
                                  <div style={{ marginBottom: 14 }}>
                                    <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Verification Video</p>
                                    <video src={selected.verificationVideoUrl} controls style={{ width: "100%", borderRadius: 12, border: `1px solid ${GOLD_BORDER}`, background: "#000", maxHeight: 220 }} />
                                  </div>
                                )}

                                {vs === "pending" && (
                                  <div style={{ display: "flex", gap: 10 }}>
                                    <motion.button whileTap={{ scale: 0.97 }} disabled={verifyAction[selected.id] === "approving"}
                                      onClick={async () => {
                                        setVerifyAction((p) => ({ ...p, [selected.id]: "approving" }));
                                        await approveGhostVerification(selected.ghostId);
                                        setUsers((p) => p.map((u) => u.id === selected.id ? { ...u, verificationStatus: "verified" as const } : u));
                                        setSelected((p) => p ? { ...p, verificationStatus: "verified" as const } : p);
                                        setPendingVerify((p) => p.filter((v) => v.ghostId !== selected.ghostId));
                                        setVerifyAction((p) => { const n = { ...p }; delete n[selected.id]; return n; });
                                      }}
                                      style={{ flex: 1, height: 46, borderRadius: 12, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ade80", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                                      <Check size={14} />{verifyAction[selected.id] === "approving" ? "Approving…" : "Approve ✓"}
                                    </motion.button>
                                    <motion.button whileTap={{ scale: 0.97 }} disabled={verifyAction[selected.id] === "rejecting"}
                                      onClick={async () => {
                                        setVerifyAction((p) => ({ ...p, [selected.id]: "rejecting" }));
                                        await rejectGhostVerification(selected.ghostId);
                                        setUsers((p) => p.map((u) => u.id === selected.id ? { ...u, verificationStatus: "rejected" as const } : u));
                                        setSelected((p) => p ? { ...p, verificationStatus: "rejected" as const } : p);
                                        setPendingVerify((p) => p.filter((v) => v.ghostId !== selected.ghostId));
                                        setVerifyAction((p) => { const n = { ...p }; delete n[selected.id]; return n; });
                                      }}
                                      style={{ flex: 1, height: 46, borderRadius: 12, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                                      <X size={14} />{verifyAction[selected.id] === "rejecting" ? "Rejecting…" : "Reject ✗"}
                                    </motion.button>
                                  </div>
                                )}
                                {vs === "verified" && (
                                  <button onClick={async () => { await rejectGhostVerification(selected.ghostId); setUsers((p) => p.map((u) => u.id === selected.id ? { ...u, verificationStatus: "rejected" as const } : u)); setSelected((p) => p ? { ...p, verificationStatus: "rejected" as const } : p); }}
                                    style={{ width: "100%", height: 40, borderRadius: 10, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.18)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                    <X size={12} /> Revoke Verification
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Global pending queue */}
                        {pendingVerify.length > 0 && (
                          <div style={{ ...CARD, padding: "16px 18px" }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                              All Pending — {pendingVerify.length} in queue
                            </p>
                            {pendingVerify.map((pv) => (
                              <div key={pv.ghostId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <div style={{ width: 32, height: 32, borderRadius: "50%", background: GOLD_BG, border: `1px solid ${GOLD_BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{pv.country}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: 0 }}>{pv.name}</p>
                                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{new Date(pv.submittedAt).toLocaleDateString()}</p>
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <button onClick={async () => { await approveGhostVerification(pv.ghostId); setPendingVerify((p) => p.filter((v) => v.ghostId !== pv.ghostId)); setUsers((p) => p.map((u) => u.ghostId === pv.ghostId ? { ...u, verificationStatus: "verified" as const } : u)); }} style={{ height: 30, padding: "0 10px", borderRadius: 7, border: "1px solid rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.07)", color: "#4ade80", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✓ Approve</button>
                                  <button onClick={async () => { await rejectGhostVerification(pv.ghostId); setPendingVerify((p) => p.filter((v) => v.ghostId !== pv.ghostId)); setUsers((p) => p.map((u) => u.ghostId === pv.ghostId ? { ...u, verificationStatus: "rejected" as const } : u)); }} style={{ height: 30, width: 30, borderRadius: 7, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✗</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════
          BROADCAST MODAL
      ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {broadcastOpen && (
          <motion.div
            key="bc-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}
            onClick={() => setBroadcastOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 440, background: "#0e0d13", border: `1px solid ${GOLD_BORDER}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}
            >
              <div style={{ height: 3, background: `linear-gradient(90deg,#92660a,${GOLD},#f0d060,${GOLD},#92660a)` }} />
              <div style={{ padding: "22px 22px 26px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 900, color: GOLD, margin: "0 0 3px", display: "flex", alignItems: "center", gap: 7 }}><Radio size={15} /> Broadcast to All</h3>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Appears live on every guest's screen as Mr. Butlas</p>
                  </div>
                  <button onClick={() => setBroadcastOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={13} />
                  </button>
                </div>
                <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} rows={5} placeholder="Good evening, dear guests. Mr. Butlas here…"
                  style={{ width: "100%", borderRadius: 12, border: `1px solid ${GOLD_BORDER}`, background: GOLD_BG, color: "#fff", fontSize: 13, padding: "12px 14px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, marginBottom: 14 }} />
                <p style={{ fontSize: 10, fontWeight: 700, color: GOLD_DIM, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Active for</p>
                <div style={{ display: "flex", gap: 7, marginBottom: 18 }}>
                  {[2, 6, 12, 24, 48].map((h) => (
                    <button key={h} onClick={() => setBroadcastExpiry(h)} style={{ flex: 1, height: 34, borderRadius: 8, border: broadcastExpiry === h ? `1px solid ${GOLD_BORDER}` : "1px solid rgba(255,255,255,0.07)", background: broadcastExpiry === h ? GOLD_BG : "rgba(255,255,255,0.03)", color: broadcastExpiry === h ? GOLD : "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{h}h</button>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.97 }} disabled={!broadcastMsg.trim() || broadcastSending}
                  onClick={async () => {
                    if (!broadcastMsg.trim()) return;
                    setBroadcastSending(true);
                    await sendButlerMessage(null, broadcastMsg.trim(), broadcastExpiry);
                    setBroadcastSending(false); setBroadcastSent(true); setBroadcastMsg("");
                    setTimeout(() => { setBroadcastSent(false); setBroadcastOpen(false); }, 2000);
                  }}
                  style={{ width: "100%", height: 48, borderRadius: 13, border: "none", background: broadcastSent ? "rgba(74,222,128,0.12)" : broadcastMsg.trim() ? `linear-gradient(135deg,#92660a,${GOLD})` : "rgba(255,255,255,0.04)", color: broadcastSent ? "#4ade80" : broadcastMsg.trim() ? "#000" : "rgba(255,255,255,0.2)", fontSize: 14, fontWeight: 900, cursor: broadcastMsg.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {broadcastSending ? "Broadcasting…" : broadcastSent ? <><Check size={15} /> Live on all screens!</> : <><Radio size={15} /> Send Broadcast</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
