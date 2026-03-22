import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function weekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

type Tab = "gifted" | "liked" | "connected";

const TAB_LABELS: Record<Tab, string> = {
  gifted: "Most Gifted 🎁",
  liked: "Most Liked ❤️",
  connected: "Most Connected 💬",
};

function generateBoard(tab: Tab, week: number): Array<{ ghostId: string; count: number }> {
  const seed = week * 1337 + tab.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const ids = Array.from({ length: 10 }, (_, i) => {
    const h = seedHash(`${seed}-${i}-${tab}`);
    return `Ghost-${1000 + (h % 9000)}`;
  });
  // Sort by deterministic count (decreasing)
  const entries = ids.map((id, i) => {
    const base = tab === "gifted" ? 120 : tab === "liked" ? 340 : 87;
    const h = seedHash(`${seed}-count-${i}`);
    return { ghostId: id, count: Math.max(1, base - i * 8 - (h % 15)) };
  });
  return entries;
}

export default function GhostLeaderboardSheet({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("gifted");
  const week = weekNumber();
  const board = generateBoard(tab, week);

  const myGhostId = (() => {
    try {
      const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
      const id = p.id || "anon";
      return `Ghost-${1000 + (seedHash(id) % 9000)}`;
    } catch { return "Ghost-???"; }
  })();

  const myRank = (() => {
    const idx = board.findIndex(e => e.ghostId === myGhostId);
    if (idx !== -1) return idx + 1;
    return 11 + (seedHash(myGhostId + tab) % 40);
  })();

  const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,5,12,0.99)", borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none", maxHeight: "88dvh", display: "flex", flexDirection: "column" }}
      >
        {/* Gold accent bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg,#92660a,#d4af37,#f0d060,#d4af37,#92660a)", borderRadius: "3px 3px 0 0", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: "14px 18px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#d4af37" }}>🏆 Ghost Leaderboard</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                Week {week} · Resets Sunday
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, width: 32, height: 32, cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, padding: "12px 16px 0", flexShrink: 0 }}>
          {(["gifted", "liked", "connected"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, height: 34, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 800,
                background: tab === t ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.05)",
                color: tab === t ? "#d4af37" : "rgba(255,255,255,0.4)",
                borderWidth: 1, borderStyle: "solid",
                borderColor: tab === t ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)",
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", scrollbarWidth: "none" } as React.CSSProperties}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {board.map((entry, i) => {
                const rank = i + 1;
                const isMe = entry.ghostId === myGhostId;
                return (
                  <div key={entry.ghostId} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px", marginBottom: 6, borderRadius: 12,
                    background: isMe ? "rgba(212,175,55,0.1)" : rank <= 3 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                    border: isMe ? "1px solid rgba(212,175,55,0.35)" : rank <= 3 ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <span style={{ fontSize: rank <= 3 ? 18 : 13, fontWeight: 900, color: rank <= 3 ? "#d4af37" : "rgba(255,255,255,0.3)", flexShrink: 0, minWidth: 24, textAlign: "center" }}>
                      {MEDAL[rank] ?? `#${rank}`}
                    </span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: isMe ? "#d4af37" : "rgba(255,255,255,0.75)" }}>
                      {entry.ghostId}
                    </span>
                    {isMe && (
                      <span style={{ fontSize: 8, fontWeight: 900, background: "rgba(212,175,55,0.2)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 5, padding: "2px 6px", color: "#d4af37", flexShrink: 0 }}>
                        YOU
                      </span>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 900, color: rank <= 3 ? "#d4af37" : "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                      {entry.count.toLocaleString()}
                    </span>
                  </div>
                );
              })}

              {/* My position if not in top 10 */}
              {!board.find(e => e.ghostId === myGhostId) && (
                <>
                  <div style={{ textAlign: "center", padding: "4px 0", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>· · ·</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)" }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,0.3)", minWidth: 24, textAlign: "center" }}>#{myRank}</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#d4af37" }}>{myGhostId}</span>
                    <span style={{ fontSize: 8, fontWeight: 900, background: "rgba(212,175,55,0.2)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 5, padding: "2px 6px", color: "#d4af37" }}>YOU</span>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
