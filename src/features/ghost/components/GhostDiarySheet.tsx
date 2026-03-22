import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DiaryEntry = {
  id: string;
  matchId: string;
  note: string;
  date: string;
};

function loadDiary(): DiaryEntry[] {
  try { return JSON.parse(localStorage.getItem("ghost_diary") || "[]"); } catch { return []; }
}
function saveDiary(entries: DiaryEntry[]): void {
  const trimmed = entries.slice(-50);
  try { localStorage.setItem("ghost_diary", JSON.stringify(trimmed)); } catch {}
}

export default function GhostDiarySheet({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<DiaryEntry[]>(loadDiary);
  const [matchId, setMatchId] = useState("");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (!matchId.trim() || !note.trim()) return;
    const entry: DiaryEntry = {
      id: `d-${Date.now()}`,
      matchId: matchId.trim(),
      note: note.trim(),
      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    };
    const next = [...entries, entry].slice(-50);
    setEntries(next);
    saveDiary(next);
    setMatchId("");
    setNote("");
    setAdding(false);
  };

  const handleDelete = (id: string) => {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    saveDiary(next);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "rgba(6,5,12,0.99)",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
          maxHeight: "88dvh", display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>📖 Ghost Diary</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Private notes, only you can see</p>
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 10, width: 32, height: 32, cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", scrollbarWidth: "none" } as React.CSSProperties}>

          {/* Add entry button / form */}
          <AnimatePresence>
            {adding ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 14, marginBottom: 14 }}
              >
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>New Entry</p>
                <input
                  value={matchId}
                  onChange={e => setMatchId(e.target.value)}
                  placeholder="Ghost ID (e.g. Ghost-4421)"
                  style={{ width: "100%", boxSizing: "border-box", height: 38, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 12, padding: "0 12px", outline: "none", fontFamily: "inherit", marginBottom: 8 }}
                />
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Write your note…"
                  rows={3}
                  style={{ width: "100%", boxSizing: "border-box", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 12, padding: "10px 12px", outline: "none", fontFamily: "inherit", resize: "none", marginBottom: 10 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={handleAdd}
                    disabled={!matchId.trim() || !note.trim()}
                    style={{ flex: 1, height: 36, borderRadius: 10, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.35)", color: "#4ade80", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                  >
                    Save Entry
                  </button>
                  <button
                    onClick={() => { setAdding(false); setMatchId(""); setNote(""); }}
                    style={{ height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "0 14px" }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setAdding(true)}
                style={{ width: "100%", height: 42, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <span style={{ fontSize: 16 }}>+</span> Add Diary Entry
              </motion.button>
            )}
          </AnimatePresence>

          {/* Entries list */}
          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
              <p style={{ margin: "0 0 6px", fontSize: 24 }}>📖</p>
              <p style={{ margin: 0 }}>No diary entries yet.<br />Add your first note above.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...entries].reverse().map(entry => (
                <div
                  key={entry.id}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px", position: "relative" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.5)" }}>{entry.matchId}</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{entry.date}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.55 }}>{entry.note}</p>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    style={{ position: "absolute", top: 8, right: 10, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.25)", fontSize: 14, fontWeight: 700, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
