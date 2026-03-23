import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, X, Check, RotateCcw, Gift } from "lucide-react";
import {
  loadGifts, saveGifts, addGift, updateGift, deleteGift, resetToDefaults,
  FLOOR_META,
  type BreakfastGift,
} from "../../ghost/utils/breakfastGiftService";

const FLOORS = Object.keys(FLOOR_META);

const INPUT: React.CSSProperties = {
  width: "100%", height: 42, borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff", fontSize: 13, padding: "0 12px",
  outline: "none", boxSizing: "border-box",
};
const LABEL: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)",
  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block",
};

const EMPTY: Omit<BreakfastGift, "id"> = {
  floor: "suite", emoji: "", name: "", imageUrl: "", description: "", coinValue: 5,
};

export default function AdminGiftsPage() {
  const [gifts,       setGifts]       = useState<BreakfastGift[]>(loadGifts);
  const [activeFloor, setActiveFloor] = useState("suite");
  const [editing,     setEditing]     = useState<BreakfastGift | null>(null);
  const [isNew,       setIsNew]       = useState(false);
  const [form,        setForm]        = useState<Omit<BreakfastGift, "id">>(EMPTY);
  const [saved,       setSaved]       = useState(false);
  const [delConfirm,  setDelConfirm]  = useState<string | null>(null);
  const [resetConfirm,setResetConfirm]= useState(false);

  const floorGifts = gifts.filter(g => g.floor === activeFloor);
  const meta = FLOOR_META[activeFloor];

  function openNew() {
    setForm({ ...EMPTY, floor: activeFloor });
    setEditing(null);
    setIsNew(true);
  }

  function openEdit(g: BreakfastGift) {
    setForm({ floor: g.floor, emoji: g.emoji, name: g.name, imageUrl: g.imageUrl, description: g.description, coinValue: g.coinValue });
    setEditing(g);
    setIsNew(false);
  }

  function handleSave() {
    let next: BreakfastGift[];
    if (isNew) {
      const created = addGift(form);
      next = [...gifts, created];
    } else if (editing) {
      const updated = { ...editing, ...form };
      updateGift(updated);
      next = gifts.map(g => g.id === updated.id ? updated : g);
    } else return;
    setGifts(next);
    setEditing(null);
    setIsNew(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleDelete(id: string) {
    deleteGift(id);
    setGifts(gifts.filter(g => g.id !== id));
    setDelConfirm(null);
  }

  function handleReset() {
    resetToDefaults();
    setGifts(loadGifts());
    setResetConfirm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const showForm = isNew || !!editing;

  return (
    <div style={{ padding: "28px 28px 60px", minHeight: "100vh", background: "#06060f", color: "#fff" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Floor Breakfast Gifts</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            Manage the gift library shown to guests when they arrive at a floor lounge
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {saved && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.35)", borderRadius: 10 }}>
              <Check size={14} color="#34d399" />
              <span style={{ fontSize: 12, color: "#34d399", fontWeight: 700 }}>Saved</span>
            </motion.div>
          )}
          <button onClick={() => setResetConfirm(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>
            <RotateCcw size={13} /> Reset defaults
          </button>
          <button onClick={openNew}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: `${meta.color}22`, border: `1px solid ${meta.color}66`, borderRadius: 10, color: meta.color, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={15} /> Add Gift
          </button>
        </div>
      </div>

      {/* Floor tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {FLOORS.map(floor => {
          const m = FLOOR_META[floor];
          const count = gifts.filter(g => g.floor === floor).length;
          const active = floor === activeFloor;
          return (
            <button key={floor} onClick={() => { setActiveFloor(floor); setEditing(null); setIsNew(false); }}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 12,
                background: active ? `${m.color}22` : "rgba(255,255,255,0.04)",
                border: `1px solid ${active ? m.color + "88" : "rgba(255,255,255,0.08)"}`,
                color: active ? m.color : "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: active ? 800 : 600, cursor: "pointer" }}>
              <span>{m.icon}</span>
              <span>{m.label}</span>
              <span style={{ fontSize: 10, background: active ? `${m.color}33` : "rgba(255,255,255,0.06)", borderRadius: 6, padding: "1px 6px" }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showForm ? "1fr 380px" : "1fr", gap: 20, alignItems: "start" }}>

        {/* Gift cards grid */}
        <div>
          {floorGifts.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16 }}>
              <Gift size={32} color="rgba(255,255,255,0.2)" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No gifts yet for this floor</p>
              <button onClick={openNew} style={{ marginTop: 16, padding: "8px 18px", background: `${meta.color}22`, border: `1px solid ${meta.color}55`, borderRadius: 10, color: meta.color, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Add first gift
              </button>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {floorGifts.map(g => (
              <motion.div key={g.id} layout
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${editing?.id === g.id ? meta.color + "88" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, overflow: "hidden" }}>

                {/* Gift image or emoji */}
                <div style={{ height: 100, background: `${meta.color}11`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {g.imageUrl ? (
                    <img src={g.imageUrl} alt={g.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 44 }}>{g.emoji || "🎁"}</span>
                  )}
                  <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(g)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => setDelConfirm(g.id)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>{g.emoji}</span>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{g.name}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{g.description}</p>
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: meta.color }}>🪙 {g.coinValue} coins value</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Edit / Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div key="form"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${meta.color}44`, borderRadius: 16, overflow: "hidden", position: "sticky", top: 20 }}>

              {/* Form header */}
              <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: meta.color }}>{isNew ? "Add Gift" : "Edit Gift"}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{meta.icon} {meta.label}</p>
                </div>
                <button onClick={() => { setEditing(null); setIsNew(false); }}
                  style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Emoji */}
                <div>
                  <label style={LABEL}>Emoji</label>
                  <input style={{ ...INPUT, fontSize: 22, textAlign: "center", width: 70 }}
                    value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                    placeholder="🎁" maxLength={4} />
                </div>

                {/* Name */}
                <div>
                  <label style={LABEL}>Gift Name</label>
                  <input style={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Bronze Rose" />
                </div>

                {/* Image URL */}
                <div>
                  <label style={LABEL}>Image URL (optional)</label>
                  <input style={INPUT} value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://ik.imagekit.io/..." />
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="" style={{ marginTop: 8, width: "100%", height: 80, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }} />
                  )}
                </div>

                {/* Description */}
                <div>
                  <label style={LABEL}>Description</label>
                  <textarea style={{ ...INPUT, height: 72, padding: "10px 12px", resize: "none" } as React.CSSProperties}
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Short description shown to arriving guest" />
                </div>

                {/* Coin value */}
                <div>
                  <label style={LABEL}>Display Coin Value</label>
                  <input style={{ ...INPUT, width: 120 }} type="number" min={1} max={500}
                    value={form.coinValue} onChange={e => setForm(f => ({ ...f, coinValue: Number(e.target.value) }))} />
                </div>

                {/* Save button */}
                <button onClick={handleSave}
                  disabled={!form.name || !form.emoji}
                  style={{ width: "100%", height: 44, borderRadius: 12, background: form.name && form.emoji ? `${meta.color}33` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${form.name && form.emoji ? meta.color + "88" : "rgba(255,255,255,0.08)"}`,
                    color: form.name && form.emoji ? meta.color : "rgba(255,255,255,0.25)",
                    fontSize: 14, fontWeight: 800, cursor: form.name && form.emoji ? "pointer" : "not-allowed" }}>
                  {isNew ? "Add to Library" : "Save Changes"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirm */}
      <AnimatePresence>
        {delConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setDelConfirm(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#0d0d18", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 18, padding: 28, maxWidth: 340, width: "90%", textAlign: "center" }}>
              <Trash2 size={28} color="#ef4444" style={{ marginBottom: 12 }} />
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900 }}>Delete this gift?</p>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>It will be removed from the floor's library permanently.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDelConfirm(null)} style={{ flex: 1, height: 42, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button onClick={() => handleDelete(delConfirm)} style={{ flex: 1, height: 42, borderRadius: 10, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset confirm */}
      <AnimatePresence>
        {resetConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setResetConfirm(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#0d0d18", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 18, padding: 28, maxWidth: 340, width: "90%", textAlign: "center" }}>
              <RotateCcw size={28} color="#fbbf24" style={{ marginBottom: 12 }} />
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900 }}>Reset all gifts?</p>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>All custom gifts will be replaced with the default library for all floors.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setResetConfirm(false)} style={{ flex: 1, height: 42, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleReset} style={{ flex: 1, height: 42, borderRadius: 10, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.4)", color: "#fbbf24", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Reset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
