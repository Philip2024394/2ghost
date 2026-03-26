import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Shield, ShieldOff, Ban, Edit2, Check, RefreshCw,
  MessageSquare, Lock, User, AlertTriangle, Trash2, Coins,
  ChevronDown, Eye, EyeOff, Save, RotateCcw, Camera, Send, Radio,
} from "lucide-react";
import {
  fetchUsers, UserRow, sendButlerMessage,
  banGhostUser, setGhostCoins, setGhostTier, updateGhostProfile,
  approveGhostVerification, rejectGhostVerification, fetchPendingVerifications,
  PendingVerificationRow,
} from "../adminSupabaseService";

// ── Persistent ban/block/edit store (localStorage) ───────────────────────────
const BANS_KEY      = "admin_bans";
const BLOCKS_KEY    = "admin_blocks";
const EDITS_KEY     = "admin_user_edits";
const DISMISS_KEY   = "admin_portrait_dismissed";

function loadJSON<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fallback; }
}
function saveJSON(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

type UserEdits = { name?: string; city?: string; tier?: string; coins?: number; bio?: string; note?: string };

// ── Mock vault + chat data ────────────────────────────────────────────────────
function mockVaultFor(userId: string) {
  const h = [...userId].reduce((a, c) => Math.imul(31, a) + c.charCodeAt(0) | 0, 0);
  const photos = 2 + (Math.abs(h) % 9);
  const videos = Math.abs(h >> 4) % 5;
  const tier   = ["standard", "suite", "kings", "penthouse"][Math.abs(h >> 8) % 4];
  const rooms  = Math.abs(h >> 12) % 4;
  return { photos, videos, tier, rooms, lastUpload: `${1 + Math.abs(h >> 16) % 28} days ago` };
}

function mockChatsFor(userId: string) {
  const h = [...userId].reduce((a, c) => Math.imul(31, a) + c.charCodeAt(0) | 0, 0);
  const count = 1 + Math.abs(h) % 6;
  const names  = ["Sara M.", "Alex K.", "Lina J.", "Omar R.", "Mia P.", "Jake L.", "Nour S."];
  const msgs   = [
    "Hey, are you coming tonight?",
    "I loved your profile 😍",
    "What room are you in?",
    "Ghost ID match! Let's talk",
    "Your photo is stunning",
    "Ready for the lobby?",
    "Just sent you a gift 🎁",
  ];
  return Array.from({ length: count }, (_, i) => ({
    partner: names[(Math.abs(h >> (i * 4)) % names.length)],
    last: msgs[(Math.abs(h >> (i * 3)) % msgs.length)],
    ago: `${1 + Math.abs(h >> (i * 2 + 1)) % 72}h ago`,
    unread: Math.abs(h >> (i + 7)) % 4,
  }));
}

// ── CARD style ────────────────────────────────────────────────────────────────
const CARD = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
};

const TIER_COLOR: Record<string, string> = {
  free:       "#94a3b8",
  suite:      "#4ade80",
  gold:       "#d4af37",
  standard:   "#94a3b8",
  penthouse:  "#a78bfa",
};

// ── Admin Date Ideas Panel ────────────────────────────────────────────────────

const POSTS_KEY   = "ghost_date_ideas_posts";
const REPORTS_KEY = "ghost_place_reports";

interface AdminDatePost { id: string; title: string; location: string; description: string; mainImage: string; tags: string[]; authorId: string; authorName: string; isGlobal?: boolean; createdAt: number; likes: number; ratingSum: number; ratingCount: number; commentCount: number; gallery: string[]; }
interface AdminPlaceReport { id: string; postId: string; postTitle: string; reporterId: string; reporterName: string; reporterPhone: string; reporterEmail: string; reason: string; comments: string; createdAt: number; status: string; }

function AdminDateIdeasPanel() {
  const [title,    setTitle]    = useState("");
  const [location, setLocation] = useState("");
  const [desc,     setDesc]     = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags,     setTags]     = useState<string[]>([]);
  const [done,     setDone]     = useState(false);
  const [posts,    setPosts]    = useState<AdminDatePost[]>(() => {
    try { return JSON.parse(localStorage.getItem(POSTS_KEY) || "[]"); } catch { return []; }
  });

  const ALL_TAGS = ["Outdoor","Romantic","Cheap","Group","Foodie","Adventure","Cultural","Nightlife"];
  const toggleTag = (t: string) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t].slice(0, 4));

  const submit = () => {
    if (!title.trim() || !desc.trim() || !imageUrl.trim()) return;
    const post: AdminDatePost = {
      id: crypto.randomUUID(), authorId: "system", authorName: "Mr. Butlas", isGlobal: true,
      title: title.trim(), location: location.trim(), description: desc.trim(),
      mainImage: imageUrl.trim(), tags, gallery: [],
      likes: 0, ratingSum: 0, ratingCount: 0, commentCount: 0, createdAt: Date.now(),
    };
    const existing: AdminDatePost[] = (() => { try { return JSON.parse(localStorage.getItem(POSTS_KEY) || "[]"); } catch { return []; } })();
    const updated = [post, ...existing];
    localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
    setPosts(updated);
    setTitle(""); setLocation(""); setDesc(""); setImageUrl(""); setTags([]);
    setDone(true); setTimeout(() => setDone(false), 3000);
  };

  const deletePost = (id: string) => {
    const updated = posts.filter(p => p.id !== id);
    localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
    setPosts(updated);
  };

  const inp: React.CSSProperties = { width: "100%", height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, padding: "0 12px", outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Create */}
      <div style={{ ...CARD, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 18 }}>💝</span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#d4af37" }}>Post Date Idea as Mr. Butlas</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Visible globally in all cities</p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title *" style={inp} maxLength={80} />
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location" style={inp} maxLength={80} />
          <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0,300))} placeholder="Description * (max 300 chars)" rows={3} style={{ ...inp, height: 80, padding: "8px 12px", resize: "none" }} />
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL *" style={inp} />
          {imageUrl && <img src={imageUrl} alt="preview" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 10, opacity: 0.85 }} />}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {ALL_TAGS.map(t => (
              <button key={t} onClick={() => toggleTag(t)} style={{ fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "4px 10px", cursor: "pointer", border: tags.includes(t) ? "1px solid #d4af37" : "1px solid rgba(255,255,255,0.12)", background: tags.includes(t) ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)", color: tags.includes(t) ? "#d4af37" : "rgba(255,255,255,0.45)" }}>{t}</button>
            ))}
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={submit} style={{ height: 40, borderRadius: 50, border: "none", background: done ? "rgba(74,222,128,0.2)" : "linear-gradient(135deg,#a8892f,#d4af37)", color: done ? "#4ade80" : "#000", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
            {done ? "✓ Posted!" : "Post to Feed"}
          </motion.button>
        </div>
      </div>

      {/* Existing posts */}
      <div style={{ ...CARD, padding: 16 }}>
        <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          All Date Ideas ({posts.length})
        </p>
        {posts.length === 0 && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "16px 0" }}>No posts yet</p>}
        {posts.map(p => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <img src={p.mainImage} alt={p.title} style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{p.authorName} · ❤️ {p.likes} · 💬 {p.commentCount} {p.isGlobal ? "· 🌍 Global" : ""}</p>
            </div>
            <button onClick={() => deletePost(p.id)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Admin Place Reports Panel ─────────────────────────────────────────────────

function AdminPlaceReportsPanel() {
  const [reports, setReports] = useState<AdminPlaceReport[]>(() => {
    try { return JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]"); } catch { return []; }
  });
  const [expanded, setExpanded] = useState<string | null>(null);

  const resolve = (id: string) => {
    const updated = reports.map(r => r.id === id ? { ...r, status: "resolved" } : r);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(updated));
    setReports(updated);
  };

  const pending = reports.filter(r => r.status === "pending");
  const resolved = reports.filter(r => r.status !== "pending");

  const ReportCard = ({ r }: { r: AdminPlaceReport }) => (
    <div style={{ background: r.status === "pending" ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${r.status === "pending" ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }} onClick={() => setExpanded(expanded === r.id ? null : r.id)} >
        <div style={{ flex: 1, cursor: "pointer" }}>
          <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 800, color: "#fff" }}>{r.postTitle}</p>
          <p style={{ margin: "0 0 3px", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
            {r.reason.replace(/_/g," ")} · {r.reporterName}
            {r.reporterPhone && ` · ${r.reporterPhone}`}
          </p>
          <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{new Date(r.createdAt).toLocaleString()}</p>
        </div>
        <span style={{ fontSize: 9, fontWeight: 800, color: r.status === "pending" ? "#ef4444" : "#4ade80", background: r.status === "pending" ? "rgba(239,68,68,0.12)" : "rgba(74,222,128,0.12)", border: `1px solid ${r.status === "pending" ? "rgba(239,68,68,0.3)" : "rgba(74,222,128,0.3)"}`, borderRadius: 20, padding: "2px 8px", flexShrink: 0 }}>
          {r.status}
        </span>
      </div>
      {expanded === r.id && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>"{r.comments}"</p>
          <p style={{ margin: "0 0 8px", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            Reporter ID: {r.reporterId}
            {r.reporterEmail && ` · ${r.reporterEmail}`}
          </p>
          {r.status === "pending" && (
            <button onClick={() => resolve(r.id)} style={{ height: 30, paddingInline: 14, borderRadius: 50, border: "none", background: "rgba(74,222,128,0.15)", color: "#4ade80", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
              ✓ Mark Resolved
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...CARD, padding: 16 }}>
        <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 800, color: "#ef4444", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          🚩 Pending Reports ({pending.length})
        </p>
        {pending.length === 0 && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "16px 0" }}>No pending reports</p>}
        {pending.map(r => <ReportCard key={r.id} r={r} />)}
      </div>
      {resolved.length > 0 && (
        <div style={{ ...CARD, padding: 16 }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Resolved ({resolved.length})
          </p>
          {resolved.map(r => <ReportCard key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}

export default function AdminUserControlPage() {
  const [users, setUsers]       = useState<UserRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [tierF, setTierF]       = useState("all");
  const [statusF, setStatusF]   = useState<"all" | "active" | "banned" | "blocked">("all");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [tab, setTab]           = useState<"profile" | "vault" | "chats" | "butler" | "actions" | "dateideas" | "reports" | "verify">("profile");
  const [editing, setEditing]   = useState(false);

  // ── Butler messaging state ─────────────────────────────────────────────────
  const [butlerMsg, setButlerMsg]           = useState("");
  const [butlerSending, setButlerSending]   = useState(false);
  const [butlerSent, setButlerSent]         = useState(false);
  const [butlerHistory, setButlerHistory]   = useState<Array<{ text: string; ts: number }>>([]);

  // ── Broadcast state ────────────────────────────────────────────────────────
  const [broadcastOpen, setBroadcastOpen]   = useState(false);
  const [broadcastMsg, setBroadcastMsg]     = useState("");
  const [broadcastExpiry, setBroadcastExpiry] = useState(24);
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSent, setBroadcastSent]   = useState(false);

  // ── Verification queue state ────────────────────────────────────────────────
  const [pendingVerify, setPendingVerify]       = useState<PendingVerificationRow[]>([]);
  const [verifyAction, setVerifyAction]         = useState<Record<string, "approving" | "rejecting" | "done">>({});

  // Persistent state
  const [bans,      setBans]      = useState<Record<string, boolean>>(() => loadJSON(BANS_KEY, {}));
  const [blocks,    setBlocks]    = useState<Record<string, boolean>>(() => loadJSON(BLOCKS_KEY, {}));
  const [dismissed, setDismissed] = useState<Record<string, boolean>>(() => loadJSON(DISMISS_KEY, {}));
  const [edits,     setEdits]     = useState<Record<string, UserEdits>>(() => loadJSON(EDITS_KEY, {}));

  // Edit form fields
  const [eName, setEName]   = useState("");
  const [eCity, setECity]   = useState("");
  const [eTier, setETier]   = useState("");
  const [eCoins, setECoins] = useState("");
  const [eBio, setEBio]     = useState("");
  const [eNote, setENote]   = useState("");
  const [saved, setSaved]   = useState(false);

  const load = async () => {
    setLoading(true);
    const [u, pv] = await Promise.all([fetchUsers(), fetchPendingVerifications()]);
    setUsers(u);
    setPendingVerify(pv);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const persist = useCallback((key: string, val: unknown) => saveJSON(key, val), []);

  const toggleBan = (id: string, ghostId?: string) => {
    const next = { ...bans, [id]: !bans[id] };
    if (!next[id]) delete next[id];
    setBans(next);
    persist(BANS_KEY, next);
    // Persist to Supabase (ghostId = real profile id)
    if (ghostId) banGhostUser(ghostId, !!next[id]);
  };

  const toggleBlock = (id: string, ghostId?: string) => {
    const next = { ...blocks, [id]: !blocks[id] };
    if (!next[id]) delete next[id];
    setBlocks(next);
    persist(BLOCKS_KEY, next);
    // Block = soft ban (is_blocked) — same field in Supabase
    if (ghostId) banGhostUser(ghostId, !!next[id]);
  };

  const toggleDismiss = (id: string) => {
    const next = { ...dismissed, [id]: !dismissed[id] };
    if (!next[id]) delete next[id];
    setDismissed(next);
    persist(DISMISS_KEY, next);
  };

  const openUser = (u: UserRow) => {
    setSelected(u);
    setTab("profile");
    setEditing(false);
    const e = edits[u.id] ?? {};
    setEName(e.name ?? u.name);
    setECity(e.city ?? u.city);
    setETier(e.tier ?? u.tier);
    setECoins(String(e.coins ?? 0));
    setEBio(e.bio ?? "");
    setENote(e.note ?? "");
    setSaved(false);
  };

  const saveEdits = () => {
    if (!selected) return;
    const next: UserEdits = {
      name:  eName  || selected.name,
      city:  eCity  || selected.city,
      tier:  eTier  || selected.tier,
      coins: Number(eCoins) || 0,
      bio:   eBio,
      note:  eNote,
    };
    const all = { ...edits, [selected.id]: next };
    setEdits(all);
    persist(EDITS_KEY, all);
    // Persist to Supabase
    if (selected.ghostId) {
      updateGhostProfile(selected.ghostId, {
        display_name: next.name,
        city: next.city,
      });
      if (next.tier) setGhostTier(selected.ghostId, next.tier);
      if (next.coins !== undefined) setGhostCoins(selected.ghostId, next.coins);
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditing(false); }, 900);
  };

  const deleteEdits = (id: string) => {
    const all = { ...edits };
    delete all[id];
    setEdits(all);
    persist(EDITS_KEY, all);
  };

  const getDisplayName = (u: UserRow) => edits[u.id]?.name ?? u.name;
  const getStatus = (id: string) => bans[id] ? "banned" : blocks[id] ? "blocked" : dismissed[id] ? "no portrait" : "active";

  const filtered = users.filter((u) => {
    const st = getStatus(u.id);
    if (statusF !== "all" && st !== statusF) return false;
    if (tierF !== "all" && (edits[u.id]?.tier ?? u.tier) !== tierF) return false;
    const q = search.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !u.city.toLowerCase().includes(q) && !u.phone.includes(q)) return false;
    return true;
  });

  const vault = selected ? mockVaultFor(selected.id) : null;
  const chats = selected ? mockChatsFor(selected.id) : [];

  const statusColor = (st: string) =>
    st === "banned" ? "#ef4444" : st === "blocked" ? "#f59e0b" : st === "no portrait" ? "#d4af37" : "#4ade80";

  const statusBg = (st: string) =>
    st === "banned" ? "rgba(239,68,68,0.12)" : st === "blocked" ? "rgba(245,158,11,0.12)" : st === "no portrait" ? "rgba(212,175,55,0.1)" : "rgba(74,222,128,0.1)";

  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden" }}>

      {/* ── LEFT: User list ── */}
      <div style={{ width: selected ? 460 : "100%", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: selected ? "1px solid rgba(255,255,255,0.07)" : "none", overflow: "hidden", transition: "width 0.25s" }}>

        {/* Header */}
        <div style={{ padding: "24px 24px 16px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>User Control</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                {users.length} users · {Object.keys(bans).length} banned · {Object.keys(blocks).length} blocked
                {pendingVerify.length > 0 && <span style={{ color: "#d4af37", fontWeight: 700 }}> · {pendingVerify.length} verify pending</span>}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setBroadcastOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px", borderRadius: 8, border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.08)", color: "#d4af37", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                <Radio size={11} /> Broadcast
              </button>
              <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                <RefreshCw size={11} style={loading ? { animation: "spin 1s linear infinite" } : undefined} /> Refresh
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: "relative", marginBottom: 10 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, city, phone…"
              style={{ width: "100%", height: 36, borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, padding: "0 12px 0 30px", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["all", "active", "banned", "blocked"] as const).map((s) => (
              <button key={s} onClick={() => setStatusF(s)} style={{ height: 28, borderRadius: 7, padding: "0 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: statusF === s ? (s === "banned" ? "rgba(239,68,68,0.15)" : s === "blocked" ? "rgba(245,158,11,0.15)" : "rgba(74,222,128,0.12)") : "rgba(255,255,255,0.04)", border: statusF === s ? `1px solid ${s === "banned" ? "#ef444440" : s === "blocked" ? "#f59e0b40" : "#4ade8040"}` : "1px solid rgba(255,255,255,0.07)", color: statusF === s ? (s === "banned" ? "#ef4444" : s === "blocked" ? "#f59e0b" : s === "all" ? "#fff" : "#4ade80") : "rgba(255,255,255,0.4)" }}>
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
            {(["all", "free", "suite", "gold"] as const).map((t) => (
              <button key={t} onClick={() => setTierF(t)} style={{ height: 28, borderRadius: 7, padding: "0 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", background: tierF === t ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.03)", border: tierF === t ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)", color: tierF === t ? "#fff" : "rgba(255,255,255,0.35)" }}>
                {t === "all" ? "All Tiers" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* User list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No users found</div>
          ) : filtered.map((u) => {
            const st = getStatus(u.id);
            const isSelected = selected?.id === u.id;
            const hasEdit = !!edits[u.id];
            return (
              <div
                key={u.id}
                onClick={() => openUser(u)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 12, cursor: "pointer", marginBottom: 2,
                  background: isSelected ? "rgba(74,222,128,0.07)" : "transparent",
                  border: isSelected ? "1px solid rgba(74,222,128,0.2)" : "1px solid transparent",
                  transition: "all 0.12s",
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                  background: st === "banned" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${statusColor(st)}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15, fontWeight: 700, color: statusColor(st),
                }}>
                  {getDisplayName(u).charAt(0)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getDisplayName(u)}</span>
                    {hasEdit && <span style={{ fontSize: 9, background: "rgba(168,85,247,0.2)", color: "#c084fc", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>EDITED</span>}
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{u.country} {u.city}</span>
                    <span style={{ fontSize: 9, color: TIER_COLOR[edits[u.id]?.tier ?? u.tier] ?? "#94a3b8", fontWeight: 700 }}>{(edits[u.id]?.tier ?? u.tier).toUpperCase()}</span>
                  </div>
                </div>

                {/* Status + quick actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 800, borderRadius: 5, padding: "2px 6px", background: statusBg(st), color: statusColor(st), textTransform: "uppercase", letterSpacing: "0.06em" }}>{st}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBan(u.id, u.ghostId); }}
                    title={bans[u.id] ? "Unban" : "Ban"}
                    style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: bans[u.id] ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", color: bans[u.id] ? "#ef4444" : "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Ban size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleBlock(u.id, u.ghostId); }}
                    title={blocks[u.id] ? "Unblock" : "Block"}
                    style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: blocks[u.id] ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)", color: blocks[u.id] ? "#f59e0b" : "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <ShieldOff size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleDismiss(u.id); }}
                    title={dismissed[u.id] ? "Restore Access" : "Dismiss — No Portrait"}
                    style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: dismissed[u.id] ? "rgba(212,175,55,0.2)" : "rgba(255,255,255,0.05)", color: dismissed[u.id] ? "#d4af37" : "rgba(255,255,255,0.3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Camera size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: User detail panel ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            {/* Panel header */}
            <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                {/* Big avatar */}
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                  background: `rgba(74,222,128,0.12)`, border: "2px solid rgba(74,222,128,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 900, color: "#4ade80",
                }}>
                  {getDisplayName(selected).charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getDisplayName(selected)}</h2>
                    {edits[selected.id] && <span style={{ fontSize: 9, background: "rgba(168,85,247,0.2)", color: "#c084fc", borderRadius: 4, padding: "2px 6px", fontWeight: 700, flexShrink: 0 }}>EDITED</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 3 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{selected.phone}</span>
                    <span style={{ fontSize: 10, color: statusColor(getStatus(selected.id)), fontWeight: 700, textTransform: "uppercase" }}>{getStatus(selected.id)}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={15} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 2, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
                {(["profile", "vault", "chats", "butler", "actions", "dateideas", "reports", "verify"] as const).map((t) => {
                  const gold = t === "butler" || t === "dateideas" || t === "reports" || t === "verify";
                  const pendingCount = t === "verify" ? pendingVerify.length + users.filter(u => u.verificationStatus === "pending").length : 0;
                  const label = t === "butler" ? "🎩 Butler" : t === "dateideas" ? "💝 Date Ideas" : t === "reports" ? "🚩 Reports" : t === "verify" ? `✅ Verify${pendingCount > 0 ? ` (${pendingCount})` : ""}` : t;
                  return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      height: 36, padding: "0 12px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      background: "none", border: "none",
                      borderBottom: tab === t ? `2px solid ${gold ? "#d4af37" : "#4ade80"}` : "2px solid transparent",
                      color: tab === t ? (gold ? "#d4af37" : "#4ade80") : "rgba(255,255,255,0.4)",
                      textTransform: "capitalize", whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </button>
                  );
                })}
              </div>
            </div>

            {/* Tab content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

              {/* ── PROFILE TAB ── */}
              {tab === "profile" && (
                <div>
                  {/* Info rows */}
                  <div style={{ ...CARD, padding: "16px 18px", marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Profile Info</span>
                      <button onClick={() => { setEditing(!editing); setSaved(false); }} style={{ display: "flex", alignItems: "center", gap: 5, height: 28, padding: "0 10px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: editing ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", color: editing ? "#4ade80" : "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                        <Edit2 size={11} /> {editing ? "Cancel" : "Edit"}
                      </button>
                    </div>

                    {editing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {[
                          { label: "Name",   val: eName,  set: setEName  },
                          { label: "City",   val: eCity,  set: setECity  },
                          { label: "Bio",    val: eBio,   set: setEBio   },
                          { label: "Coins",  val: eCoins, set: setECoins, type: "number" },
                          { label: "Admin Note", val: eNote, set: setENote },
                        ].map((f) => (
                          <div key={f.label}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>{f.label}</label>
                            {f.label === "Bio" || f.label === "Admin Note" ? (
                              <textarea
                                value={f.val}
                                onChange={(e) => f.set(e.target.value)}
                                rows={2}
                                style={{ width: "100%", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, padding: "8px 12px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                              />
                            ) : (
                              <input
                                type={(f as any).type ?? "text"}
                                value={f.val}
                                onChange={(e) => f.set(e.target.value)}
                                style={{ width: "100%", height: 38, borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, padding: "0 12px", outline: "none", boxSizing: "border-box" }}
                              />
                            )}
                          </div>
                        ))}

                        {/* Tier selector */}
                        <div>
                          <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 5 }}>Tier</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            {["free", "suite", "gold"].map((t) => (
                              <button key={t} onClick={() => setETier(t)} style={{ flex: 1, height: 34, borderRadius: 8, border: eTier === t ? `1px solid ${TIER_COLOR[t]}60` : "1px solid rgba(255,255,255,0.08)", background: eTier === t ? `${TIER_COLOR[t]}18` : "rgba(255,255,255,0.04)", color: eTier === t ? TIER_COLOR[t] : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          {edits[selected.id] && (
                            <button onClick={() => { deleteEdits(selected.id); setEditing(false); }} style={{ flex: 1, height: 40, borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                              <RotateCcw size={12} /> Reset
                            </button>
                          )}
                          <motion.button whileTap={{ scale: 0.97 }} onClick={saveEdits} style={{ flex: 2, height: 40, borderRadius: 10, border: "none", background: saved ? "rgba(74,222,128,0.15)" : "linear-gradient(135deg,#22c55e,#4ade80)", color: saved ? "#4ade80" : "#000", fontSize: 12, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                            {saved ? <><Check size={13} /> Saved!</> : <><Save size={13} /> Save Changes</>}
                          </motion.button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px" }}>
                        {[
                          { label: "Name",      value: getDisplayName(selected)             },
                          { label: "Phone",     value: selected.phone                       },
                          { label: "Country",   value: `${selected.country} ${selected.city}` },
                          { label: "Gender",    value: selected.gender                      },
                          { label: "Tier",      value: edits[selected.id]?.tier ?? selected.tier },
                          { label: "Joined",    value: selected.joined                      },
                          { label: "Last Active", value: selected.lastActive               },
                          { label: "Coins",     value: String(edits[selected.id]?.coins ?? 0) },
                        ].map((r) => (
                          <div key={r.label}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>{r.label}</p>
                            <p style={{ fontSize: 13, color: "#fff", margin: 0, fontWeight: 600 }}>{r.value}</p>
                          </div>
                        ))}
                        {edits[selected.id]?.bio && (
                          <div style={{ gridColumn: "span 2" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>Bio</p>
                            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.5 }}>{edits[selected.id]?.bio}</p>
                          </div>
                        )}
                        {edits[selected.id]?.note && (
                          <div style={{ gridColumn: "span 2", background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "10px 12px" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>🔒 Admin Note</p>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.5 }}>{edits[selected.id]?.note}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── VAULT TAB ── */}
              {tab === "vault" && vault && (
                <div>
                  <div style={{ ...CARD, padding: "18px", marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>Room Vault Summary</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                      {[
                        { label: "Photos",      value: String(vault.photos), color: "#60a5fa" },
                        { label: "Videos",      value: String(vault.videos), color: "#a78bfa" },
                        { label: "Room Tier",   value: vault.tier,           color: TIER_COLOR[vault.tier] ?? "#94a3b8" },
                        { label: "Vault Rooms", value: String(vault.rooms),  color: "#4ade80" },
                        { label: "Last Upload", value: vault.lastUpload,     color: "rgba(255,255,255,0.6)" },
                      ].map((s) => (
                        <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 14px" }}>
                          <p style={{ fontSize: 18, fontWeight: 900, color: s.color, margin: "0 0 4px" }}>{s.value}</p>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Mock media grid */}
                    <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Vault Media Preview</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                      {Array.from({ length: vault.photos }).map((_, i) => (
                        <div key={i} style={{ aspectRatio: "1", borderRadius: 8, background: `rgba(96,165,250,0.${10 + (i * 7) % 20})`, border: "1px solid rgba(96,165,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 18 }}>🖼</span>
                        </div>
                      ))}
                      {Array.from({ length: vault.videos }).map((_, i) => (
                        <div key={`v${i}`} style={{ aspectRatio: "1", borderRadius: 8, background: `rgba(167,139,250,0.${12 + (i * 5) % 18})`, border: "1px solid rgba(167,139,250,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 18 }}>🎬</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ ...CARD, padding: "14px 16px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", margin: "0 0 8px" }}>⚠️ Vault Access Log (simulated)</p>
                    {["Accessed vault", "Uploaded photo", "Shared room link", "Viewed partner media"].map((a, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{a}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{2 + i * 3}h ago</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CHATS TAB ── */}
              {tab === "chats" && (
                <div>
                  <div style={{ ...CARD, padding: "16px", marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>Active Conversations</p>
                    {chats.length === 0 ? (
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", textAlign: "center", padding: "20px 0" }}>No conversations</p>
                    ) : chats.map((c, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < chats.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>
                          {c.partner.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.partner}</span>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{c.ago}</span>
                          </div>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.last}</p>
                        </div>
                        {c.unread > 0 && (
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: "#000", flexShrink: 0 }}>{c.unread}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div style={{ ...CARD, padding: "14px 16px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>Chat Stats</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                      {[
                        { label: "Total Chats",   value: chats.length },
                        { label: "Unread",        value: chats.reduce((s, c) => s + c.unread, 0) },
                        { label: "Avg Response",  value: "18m" },
                      ].map((s) => (
                        <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 3px" }}>{s.value}</p>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── ACTIONS TAB ── */}
              {tab === "actions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  {/* Ban / Block / Dismiss */}
                  <div style={{ ...CARD, padding: "16px 18px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>Access Control</p>
                    <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
                      <button
                        onClick={() => toggleBan(selected.id, selected.ghostId)}
                        style={{
                          flex: 1, height: 44, borderRadius: 11,
                          background: bans[selected.id] ? "rgba(74,222,128,0.1)" : "rgba(239,68,68,0.1)",
                          border: bans[selected.id] ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(239,68,68,0.3)",
                          color: bans[selected.id] ? "#4ade80" : "#f87171",
                          fontSize: 13, fontWeight: 800, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                        }}
                      >
                        <Ban size={14} />
                        {bans[selected.id] ? "Remove Ban" : "Ban User"}
                      </button>
                      <button
                        onClick={() => toggleBlock(selected.id, selected.ghostId)}
                        style={{
                          flex: 1, height: 44, borderRadius: 11,
                          background: blocks[selected.id] ? "rgba(74,222,128,0.1)" : "rgba(245,158,11,0.1)",
                          border: blocks[selected.id] ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(245,158,11,0.3)",
                          color: blocks[selected.id] ? "#4ade80" : "#f59e0b",
                          fontSize: 13, fontWeight: 800, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                        }}
                      >
                        <ShieldOff size={14} />
                        {blocks[selected.id] ? "Unblock" : "Block User"}
                      </button>
                    </div>
                    <button
                      onClick={() => toggleDismiss(selected.id)}
                      style={{
                        width: "100%", height: 44, borderRadius: 11,
                        background: dismissed[selected.id] ? "rgba(74,222,128,0.1)" : "rgba(212,175,55,0.08)",
                        border: dismissed[selected.id] ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(212,175,55,0.35)",
                        color: dismissed[selected.id] ? "#4ade80" : "#d4af37",
                        fontSize: 13, fontWeight: 800, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      }}
                    >
                      <Camera size={14} />
                      {dismissed[selected.id] ? "Restore — Portrait Submitted" : "Dismiss — No Portrait Uploaded"}
                    </button>
                    {dismissed[selected.id] && (
                      <p style={{ fontSize: 11, color: "rgba(212,175,55,0.6)", margin: "6px 0 0", textAlign: "center", lineHeight: 1.5 }}>
                        User will be redirected to the escort page and asked to return with their portrait.
                      </p>
                    )}
                  </div>

                  {/* Coin management */}
                  <div style={{ ...CARD, padding: "16px 18px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Coin Management</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[50, 100, 200].map((amt) => (
                        <button key={amt} onClick={() => {
                          const cur = edits[selected.id]?.coins ?? 0;
                          const e = edits[selected.id] ?? {};
                          const newCoins = cur + amt;
                          const next = { ...edits, [selected.id]: { ...e, coins: newCoins } };
                          setEdits(next); persist(EDITS_KEY, next);
                          setECoins(String(newCoins));
                          if (selected.ghostId) setGhostCoins(selected.ghostId, newCoins);
                        }} style={{ flex: 1, height: 38, borderRadius: 9, border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.07)", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          +{amt}
                        </button>
                      ))}
                      <button onClick={() => {
                        const e = edits[selected.id] ?? {};
                        const next = { ...edits, [selected.id]: { ...e, coins: 0 } };
                        setEdits(next); persist(EDITS_KEY, next);
                        setECoins("0");
                        if (selected.ghostId) setGhostCoins(selected.ghostId, 0);
                      }} style={{ flex: 1, height: 38, borderRadius: 9, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        Reset
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "8px 0 0", textAlign: "center" }}>
                      Current balance: <strong style={{ color: "#fff" }}>{edits[selected.id]?.coins ?? 0} coins</strong>
                    </p>
                  </div>

                  {/* Tier override */}
                  <div style={{ ...CARD, padding: "16px 18px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Force Tier Change</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["free", "suite", "gold"].map((t) => {
                        const cur = edits[selected.id]?.tier ?? selected.tier;
                        return (
                          <button key={t} onClick={() => {
                            const e = edits[selected.id] ?? {};
                            const next = { ...edits, [selected.id]: { ...e, tier: t } };
                            setEdits(next); persist(EDITS_KEY, next);
                            if (selected.ghostId) setGhostTier(selected.ghostId, t);
                          }} style={{ flex: 1, height: 40, borderRadius: 10, border: cur === t ? `1px solid ${TIER_COLOR[t]}50` : "1px solid rgba(255,255,255,0.08)", background: cur === t ? `${TIER_COLOR[t]}14` : "rgba(255,255,255,0.03)", color: cur === t ? TIER_COLOR[t] : "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Danger zone */}
                  <div style={{ ...CARD, padding: "16px 18px", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.03)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                      <AlertTriangle size={14} style={{ color: "#ef4444" }} />
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Danger Zone</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <button
                        onClick={() => { deleteEdits(selected.id); }}
                        style={{ height: 40, borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "transparent", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <RotateCcw size={13} /> Reset All Admin Edits
                      </button>
                      <button
                        onClick={() => {
                          toggleBan(selected.id);
                          const e = edits[selected.id] ?? {};
                          const next = { ...edits, [selected.id]: { ...e, note: `Flagged by admin ${new Date().toLocaleDateString()}` } };
                          setEdits(next); persist(EDITS_KEY, next);
                        }}
                        style={{ height: 40, borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <Trash2 size={13} /> Ban + Flag Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── BUTLER TAB ── */}
              {tab === "butler" && selected && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                  {/* DM composer */}
                  <div style={{ ...CARD, padding: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <span style={{ fontSize: 18 }}>🎩</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#d4af37", margin: 0 }}>Send as Mr. Butlas</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Appears as a personal butler message to {getDisplayName(selected)}</p>
                      </div>
                    </div>

                    <textarea
                      value={butlerMsg}
                      onChange={(e) => setButlerMsg(e.target.value)}
                      placeholder="Good evening — Mr. Butlas here. A private note for you…"
                      rows={4}
                      style={{
                        width: "100%", borderRadius: 12,
                        border: "1px solid rgba(212,175,55,0.25)",
                        background: "rgba(212,175,55,0.04)",
                        color: "#fff", fontSize: 13, padding: "12px 14px",
                        outline: "none", boxSizing: "border-box",
                        resize: "vertical", fontFamily: "inherit",
                        lineHeight: 1.6,
                      }}
                    />

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={!butlerMsg.trim() || butlerSending}
                      onClick={async () => {
                        if (!butlerMsg.trim()) return;
                        setButlerSending(true);
                        await sendButlerMessage(selected.id, butlerMsg.trim());
                        const entry = { text: butlerMsg.trim(), ts: Date.now() };
                        setButlerHistory((h) => [entry, ...h].slice(0, 20));
                        setButlerMsg("");
                        setButlerSending(false);
                        setButlerSent(true);
                        setTimeout(() => setButlerSent(false), 2500);
                      }}
                      style={{
                        width: "100%", height: 44, borderRadius: 11, marginTop: 10,
                        background: butlerSent ? "rgba(74,222,128,0.12)" : butlerMsg.trim() ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                        border: butlerSent ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(212,175,55,0.3)",
                        color: butlerSent ? "#4ade80" : "#d4af37",
                        fontSize: 13, fontWeight: 800, cursor: butlerMsg.trim() ? "pointer" : "default",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                        opacity: butlerMsg.trim() ? 1 : 0.45,
                      }}
                    >
                      {butlerSending ? "Sending…" : butlerSent ? <><Check size={14} /> Message Delivered</> : <><Send size={14} /> Send to {getDisplayName(selected)}</>}
                    </motion.button>
                  </div>

                  {/* Chat inject info */}
                  <div style={{ ...CARD, padding: "14px 16px", border: "1px solid rgba(212,175,55,0.12)" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(212,175,55,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>How delivery works</p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.7 }}>
                      Messages are delivered as a Mr. Butlas notification on the user's main feed within 30 seconds. They appear with the gold butler branding and a formal italic style — indistinguishable from a real concierge message.
                    </p>
                  </div>

                  {/* Sent history */}
                  {butlerHistory.length > 0 && (
                    <div style={{ ...CARD, padding: "14px 16px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>Sent This Session</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {butlerHistory.map((h, i) => (
                          <div key={i} style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)", borderRadius: 10, padding: "10px 12px" }}>
                            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", margin: "0 0 4px", fontStyle: "italic", lineHeight: 1.5 }}>"{h.text}"</p>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0 }}>
                              {new Date(h.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── DATE IDEAS TAB ── */}
              {tab === "dateideas" && (
                <AdminDateIdeasPanel />
              )}

              {/* ── PLACE REPORTS TAB ── */}
              {tab === "reports" && (
                <AdminPlaceReportsPanel />
              )}

              {/* ── VERIFY TAB ── */}
              {tab === "verify" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Selected user verification status */}
                  <div style={{ ...CARD, padding: "16px 18px" }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(212,175,55,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 14px" }}>
                      {getDisplayName(selected!)}'s Verification
                    </p>
                    {(() => {
                      const vs = selected!.verificationStatus ?? "none";
                      const color = vs === "verified" ? "#4ade80" : vs === "pending" ? "#d4af37" : vs === "rejected" ? "#ef4444" : "rgba(255,255,255,0.3)";
                      return (
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                              {vs === "verified" ? "✅" : vs === "pending" ? "⏳" : vs === "rejected" ? "❌" : "⬜"}
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 800, color, margin: 0, textTransform: "capitalize" }}>{vs}</p>
                              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                                {vs === "verified" ? "Face verified — blue checkmark active" :
                                 vs === "pending" ? "Video submitted — awaiting admin review" :
                                 vs === "rejected" ? "Verification declined — user can retry" :
                                 "No verification submitted"}
                              </p>
                            </div>
                          </div>

                          {vs === "pending" && selected!.verificationVideoUrl && (
                            <div style={{ marginBottom: 14 }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Verification Video</p>
                              <video
                                src={selected!.verificationVideoUrl}
                                controls
                                style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(212,175,55,0.25)", background: "#000", maxHeight: 240 }}
                              />
                            </div>
                          )}

                          {vs === "pending" && (
                            <div style={{ display: "flex", gap: 10 }}>
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                disabled={verifyAction[selected!.id] === "approving"}
                                onClick={async () => {
                                  setVerifyAction((prev) => ({ ...prev, [selected!.id]: "approving" }));
                                  await approveGhostVerification(selected!.ghostId);
                                  // Update local state
                                  setUsers((prev) => prev.map((u) => u.id === selected!.id ? { ...u, verificationStatus: "verified" as const } : u));
                                  setSelected((prev) => prev ? { ...prev, verificationStatus: "verified" as const } : prev);
                                  setPendingVerify((prev) => prev.filter((p) => p.ghostId !== selected!.ghostId));
                                  setVerifyAction((prev) => ({ ...prev, [selected!.id]: "done" }));
                                }}
                                style={{ flex: 1, height: 44, borderRadius: 11, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.35)", color: "#4ade80", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
                              >
                                <Check size={14} /> {verifyAction[selected!.id] === "approving" ? "Approving…" : "Approve ✓"}
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.97 }}
                                disabled={verifyAction[selected!.id] === "rejecting"}
                                onClick={async () => {
                                  setVerifyAction((prev) => ({ ...prev, [selected!.id]: "rejecting" }));
                                  await rejectGhostVerification(selected!.ghostId);
                                  setUsers((prev) => prev.map((u) => u.id === selected!.id ? { ...u, verificationStatus: "rejected" as const } : u));
                                  setSelected((prev) => prev ? { ...prev, verificationStatus: "rejected" as const } : prev);
                                  setPendingVerify((prev) => prev.filter((p) => p.ghostId !== selected!.ghostId));
                                  setVerifyAction((prev) => ({ ...prev, [selected!.id]: "done" }));
                                }}
                                style={{ flex: 1, height: 44, borderRadius: 11, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
                              >
                                <X size={14} /> {verifyAction[selected!.id] === "rejecting" ? "Rejecting…" : "Reject ✗"}
                              </motion.button>
                            </div>
                          )}

                          {vs === "verified" && (
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={async () => {
                                await rejectGhostVerification(selected!.ghostId);
                                setUsers((prev) => prev.map((u) => u.id === selected!.id ? { ...u, verificationStatus: "rejected" as const } : u));
                                setSelected((prev) => prev ? { ...prev, verificationStatus: "rejected" as const } : prev);
                              }}
                              style={{ width: "100%", height: 40, borderRadius: 10, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                            >
                              <X size={13} /> Revoke Verification
                            </motion.button>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Global pending verification queue */}
                  {pendingVerify.length > 0 && (
                    <div style={{ ...CARD, padding: "16px 18px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(212,175,55,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                        All Pending — {pendingVerify.length} in queue
                      </p>
                      {pendingVerify.map((pv) => (
                        <div key={pv.ghostId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                            {pv.country}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{pv.name}</p>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>{new Date(pv.submittedAt).toLocaleDateString()}</p>
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              onClick={async () => {
                                await approveGhostVerification(pv.ghostId);
                                setPendingVerify((prev) => prev.filter((p) => p.ghostId !== pv.ghostId));
                                setUsers((prev) => prev.map((u) => u.ghostId === pv.ghostId ? { ...u, verificationStatus: "verified" as const } : u));
                              }}
                              style={{ height: 30, padding: "0 12px", borderRadius: 8, border: "1px solid rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.08)", color: "#4ade80", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                            >✓ Approve</button>
                            <button
                              onClick={async () => {
                                await rejectGhostVerification(pv.ghostId);
                                setPendingVerify((prev) => prev.filter((p) => p.ghostId !== pv.ghostId));
                                setUsers((prev) => prev.map((u) => u.ghostId === pv.ghostId ? { ...u, verificationStatus: "rejected" as const } : u));
                              }}
                              style={{ height: 30, padding: "0 10px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                            >✗</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BROADCAST MODAL ── */}
      <AnimatePresence>
        {broadcastOpen && (
          <motion.div
            key="broadcast-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}
            onClick={() => setBroadcastOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 440, background: "#111014", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
            >
              {/* Gold bar */}
              <div style={{ height: 3, background: "linear-gradient(90deg,#d4af37,#f0d060,#d4af37)" }} />
              <div style={{ padding: "22px 22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: "#d4af37", margin: "0 0 3px", display: "flex", alignItems: "center", gap: 8 }}>
                      <Radio size={16} /> Broadcast to All Users
                    </h3>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>Popup appears live on every user's screen as Mr. Butlas</p>
                  </div>
                  <button onClick={() => setBroadcastOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={13} />
                  </button>
                </div>

                <textarea
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="Good evening, dear guests. Mr. Butlas here with an announcement for the house…"
                  rows={5}
                  style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(212,175,55,0.25)", background: "rgba(212,175,55,0.04)", color: "#fff", fontSize: 13, padding: "12px 14px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, marginBottom: 14 }}
                />

                {/* Expiry selector */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Active for</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[2, 6, 12, 24, 48].map((h) => (
                      <button key={h} onClick={() => setBroadcastExpiry(h)} style={{ flex: 1, height: 34, borderRadius: 8, border: broadcastExpiry === h ? "1px solid rgba(212,175,55,0.4)" : "1px solid rgba(255,255,255,0.08)", background: broadcastExpiry === h ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)", color: broadcastExpiry === h ? "#d4af37" : "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={!broadcastMsg.trim() || broadcastSending}
                  onClick={async () => {
                    if (!broadcastMsg.trim()) return;
                    setBroadcastSending(true);
                    await sendButlerMessage(null, broadcastMsg.trim(), broadcastExpiry);
                    setBroadcastSending(false);
                    setBroadcastSent(true);
                    setBroadcastMsg("");
                    setTimeout(() => {
                      setBroadcastSent(false);
                      setBroadcastOpen(false);
                    }, 2000);
                  }}
                  style={{
                    width: "100%", height: 48, borderRadius: 12,
                    background: broadcastSent ? "rgba(74,222,128,0.12)" : broadcastMsg.trim() ? "linear-gradient(135deg,rgba(212,175,55,0.3),rgba(240,208,96,0.2))" : "rgba(255,255,255,0.04)",
                    border: broadcastSent ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(212,175,55,0.4)",
                    color: broadcastSent ? "#4ade80" : "#d4af37",
                    fontSize: 14, fontWeight: 900, cursor: broadcastMsg.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    opacity: broadcastMsg.trim() ? 1 : 0.45,
                  }}
                >
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
