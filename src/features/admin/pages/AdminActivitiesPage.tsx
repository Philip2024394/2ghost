import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, X, Check, RotateCcw, Sparkles } from "lucide-react";
import {
  loadActivities, addActivity, updateActivity, deleteActivity, resetActivities,
  type SocialActivity,
} from "../../ghost/utils/breakfastRatingService";

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
const ACCENT = "#f472b6";
const EMPTY: Omit<SocialActivity, "id"> = { icon: "", name: "", description: "", imageUrl: "" };

export default function AdminActivitiesPage() {
  const [activities,   setActivities]  = useState<SocialActivity[]>(loadActivities);
  const [editing,      setEditing]     = useState<SocialActivity | null>(null);
  const [isNew,        setIsNew]       = useState(false);
  const [form,         setForm]        = useState<Omit<SocialActivity, "id">>(EMPTY);
  const [saved,        setSaved]       = useState(false);
  const [delConfirm,   setDelConfirm]  = useState<string | null>(null);
  const [resetConfirm, setResetConfirm]= useState(false);

  function openNew()  { setForm(EMPTY); setEditing(null); setIsNew(true); }
  function openEdit(a: SocialActivity) {
    setForm({ icon: a.icon, name: a.name, description: a.description, imageUrl: a.imageUrl });
    setEditing(a); setIsNew(false);
  }
  function flash() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  function handleSave() {
    if (isNew) {
      const created = addActivity(form);
      setActivities(prev => [...prev, created]);
    } else if (editing) {
      const updated = { ...editing, ...form };
      updateActivity(updated);
      setActivities(prev => prev.map(a => a.id === updated.id ? updated : a));
    }
    setEditing(null); setIsNew(false); flash();
  }

  function handleDelete(id: string) {
    deleteActivity(id);
    setActivities(prev => prev.filter(a => a.id !== id));
    setDelConfirm(null);
  }

  function handleReset() {
    resetActivities();
    setActivities(loadActivities());
    setResetConfirm(false); flash();
  }

  const showForm = isNew || !!editing;

  return (
    <div style={{ padding: "28px 28px 60px", minHeight: "100vh", background: "#06060f", color: "#fff" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>Social Activities</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
            Activities shown to guests after a 6+ rated breakfast connection
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {saved && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.35)", borderRadius: 10 }}>
              <Check size={14} color="#34d399" />
              <span style={{ fontSize: 12, color: "#34d399", fontWeight: 700 }}>Saved</span>
            </motion.div>
          )}
          <button onClick={() => setResetConfirm(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10, color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>
            <RotateCcw size={13} /> Reset defaults
          </button>
          <button onClick={openNew}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
              background: `${ACCENT}22`, border: `1px solid ${ACCENT}66`,
              borderRadius: 10, color: ACCENT, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={15} /> Add Activity
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showForm ? "1fr 380px" : "1fr", gap: 20, alignItems: "start" }}>

        {/* Activity cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {activities.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px",
              background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16 }}>
              <Sparkles size={32} color="rgba(255,255,255,0.2)" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No activities yet</p>
            </div>
          )}
          {activities.map(a => (
            <motion.div key={a.id} layout
              style={{ background: "rgba(255,255,255,0.03)",
                border: `1px solid ${editing?.id === a.id ? ACCENT + "88" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 14, overflow: "hidden" }}>
              {/* Image / icon */}
              <div style={{ height: 120, background: "rgba(255,255,255,0.04)", display: "flex",
                alignItems: "center", justifyContent: "center", position: "relative" }}>
                {a.imageUrl
                  ? <img src={a.imageUrl} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 52 }}>{a.icon || "✨"}</span>
                }
                <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
                  <button onClick={() => openEdit(a)}
                    style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,0,0,0.65)",
                      border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => setDelConfirm(a.id)}
                    style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(0,0,0,0.65)",
                      border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{a.name}</p>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{a.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Form panel */}
        <AnimatePresence>
          {showForm && (
            <motion.div key="form"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${ACCENT}44`,
                borderRadius: 16, overflow: "hidden", position: "sticky", top: 20 }}>
              <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: ACCENT }}>
                  {isNew ? "Add Activity" : "Edit Activity"}
                </p>
                <button onClick={() => { setEditing(null); setIsNew(false); }}
                  style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={14} />
                </button>
              </div>

              <div style={{ padding: "18px 18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: "0 0 70px" }}>
                    <label style={LABEL}>Icon</label>
                    <input style={{ ...INPUT, fontSize: 22, textAlign: "center", width: 70 }}
                      value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                      placeholder="🌅" maxLength={4} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={LABEL}>Activity Name</label>
                    <input style={INPUT} value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Sunset Rooftop Drinks" />
                  </div>
                </div>

                <div>
                  <label style={LABEL}>Description</label>
                  <textarea style={{ ...INPUT, height: 80, padding: "10px 12px", resize: "none" } as React.CSSProperties}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="What will the couple experience?" />
                </div>

                <div>
                  <label style={LABEL}>Image URL</label>
                  <input style={INPUT} value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://ik.imagekit.io/..." />
                  {form.imageUrl && (
                    <img src={form.imageUrl} alt="" style={{ marginTop: 8, width: "100%", height: 90,
                      objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }} />
                  )}
                </div>

                <button onClick={handleSave} disabled={!form.name || !form.icon}
                  style={{ width: "100%", height: 44, borderRadius: 12,
                    background: form.name && form.icon ? `${ACCENT}33` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${form.name && form.icon ? ACCENT + "88" : "rgba(255,255,255,0.08)"}`,
                    color: form.name && form.icon ? ACCENT : "rgba(255,255,255,0.25)",
                    fontSize: 14, fontWeight: 800, cursor: form.name && form.icon ? "pointer" : "not-allowed" }}>
                  {isNew ? "Add Activity" : "Save Changes"}
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
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9000,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#0d0d18", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 18,
                padding: 28, maxWidth: 320, width: "90%", textAlign: "center" }}>
              <Trash2 size={28} color="#ef4444" style={{ marginBottom: 12 }} />
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900 }}>Delete this activity?</p>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>It will no longer appear in the social suggestion picker.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setDelConfirm(null)}
                  style={{ flex: 1, height: 42, borderRadius: 10, background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button onClick={() => handleDelete(delConfirm!)}
                  style={{ flex: 1, height: 42, borderRadius: 10, background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Delete</button>
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
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9000,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#0d0d18", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 18,
                padding: 28, maxWidth: 320, width: "90%", textAlign: "center" }}>
              <RotateCcw size={28} color="#fbbf24" style={{ marginBottom: 12 }} />
              <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900 }}>Reset all activities?</p>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Replaces all custom activities with the default list.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setResetConfirm(false)}
                  style={{ flex: 1, height: 42, borderRadius: 10, background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleReset}
                  style={{ flex: 1, height: 42, borderRadius: 10, background: "rgba(251,191,36,0.12)",
                    border: "1px solid rgba(251,191,36,0.4)", color: "#fbbf24", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Reset</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
