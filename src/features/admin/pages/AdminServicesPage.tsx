import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Check, Star, Shield, Phone } from "lucide-react";
import { BUTLER_CATEGORIES, ALL_BUTLER_PROVIDERS } from "../../../features/ghost/data/butlerProviders";
import type { ButlerProviderFull, ButlerCategory } from "../../../features/ghost/data/butlerProviders";
import { fetchButlerProviders, saveButlerProvider, deleteButlerProvider } from "../adminSupabaseService";

type ButlerProvider = ButlerProviderFull;

const ADMIN_PROVIDERS_KEY = "admin_butler_providers";

function localLoad(): ButlerProvider[] {
  try {
    const saved = localStorage.getItem(ADMIN_PROVIDERS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return ALL_BUTLER_PROVIDERS;
}

function localSave(list: ButlerProvider[]) {
  localStorage.setItem(ADMIN_PROVIDERS_KEY, JSON.stringify(list));
}

const CAT_COLORS: Record<ButlerCategory, string> = {
  flowers:    "#f472b6",
  jewellery:  "#fbbf24",
  spa:        "#a78bfa",
  beautician: "#34d399",
};

const EMPTY_PROVIDER: Omit<ButlerProvider, "id"> = {
  name: "", photo: "", description: "", specialty: "",
  city: "", countryCode: "", whatsapp: "",
  rating: 4.5, deliveryNote: "", verified: false,
  category: "flowers",
};

const CARD_STYLE = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: "20px",
};

const INPUT_STYLE: React.CSSProperties = {
  width: "100%", height: 44, borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff", fontSize: 13, padding: "0 12px",
  outline: "none", boxSizing: "border-box",
};

export default function AdminServicesPage() {
  const [providers, setProviders]     = useState<ButlerProvider[]>(localLoad);
  const [activeCategory, setActiveCat] = useState<ButlerCategory | "all">("all");
  const [editing, setEditing]          = useState<ButlerProvider | null>(null);
  const [isNew, setIsNew]              = useState(false);
  const [form, setForm]                = useState<Omit<ButlerProvider, "id">>(EMPTY_PROVIDER);
  const [editCat, setEditCat]          = useState<ButlerCategory>("flowers");
  const [saved, setSaved]              = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load from Supabase on mount (falls back to localStorage/hardcoded if not connected)
  useEffect(() => {
    fetchButlerProviders().then((data) => {
      if (data && data.length > 0) {
        const mapped = data.map((r: any) => ({
          id: r.id, name: r.name, photo: r.photo || "", description: r.description || "",
          specialty: r.specialty || "", city: r.city || "", countryCode: r.country_code || "",
          whatsapp: r.whatsapp || "", rating: Number(r.rating) || 4.5,
          deliveryNote: r.delivery_note || "", verified: !!r.is_verified,
          category: r.category as ButlerCategory,
        }));
        setProviders(mapped);
        localSave(mapped);
      }
    });
  }, []);

  const filtered = providers.filter((p) => activeCategory === "all" || p.category === activeCategory);

  const openEdit = (p: ButlerProvider) => {
    setEditing(p);
    setIsNew(false);
    setForm({ name: p.name, photo: p.photo, description: p.description, specialty: p.specialty, city: p.city, countryCode: p.countryCode, whatsapp: p.whatsapp, rating: p.rating, deliveryNote: p.deliveryNote, verified: p.verified, category: p.category as ButlerCategory });
    setEditCat(p.category as ButlerCategory);
    setSaved(false);
  };

  const openNew = () => {
    setEditing({ id: `new-${Date.now()}`, ...EMPTY_PROVIDER, category: "flowers" } as any);
    setIsNew(true);
    setForm({ ...EMPTY_PROVIDER });
    setEditCat("flowers");
    setSaved(false);
  };

  const handleSave = () => {
    let updated: ButlerProvider[];
    let toSync: ButlerProvider;
    if (isNew) {
      toSync = { id: `adm-${Date.now()}`, ...form, category: editCat } as any;
      updated = [...providers, toSync];
    } else {
      toSync = { ...editing!, ...form, category: editCat };
      updated = providers.map((p) => p.id === editing!.id ? toSync : p);
    }
    localSave(updated);
    setProviders(updated);
    saveButlerProvider({ id: toSync.id, name: toSync.name, photo: toSync.photo, description: toSync.description, specialty: toSync.specialty, city: toSync.city, country_code: toSync.countryCode, whatsapp: toSync.whatsapp, rating: toSync.rating, delivery_note: toSync.deliveryNote, is_verified: toSync.verified, category: toSync.category, is_active: true });
    setSaved(true);
    setTimeout(() => { setEditing(null); setSaved(false); }, 800);
  };

  const handleDelete = (id: string) => {
    const updated = providers.filter((p) => p.id !== id);
    localSave(updated);
    setProviders(updated);
    deleteButlerProvider(id);
    setDeleteConfirm(null);
  };

  const toggleVerified = (id: string) => {
    const updated = providers.map((p) => p.id === id ? { ...p, verified: !p.verified } : p);
    localSave(updated);
    setProviders(updated);
    const p = updated.find((x) => x.id === id)!;
    saveButlerProvider({ id: p.id, is_verified: p.verified });
  };

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, photo: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Butler Services</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            {providers.length} providers · {providers.filter((p) => p.verified).length} verified
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={openNew}
          style={{
            height: 40, padding: "0 16px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg,#4ade80,#22c55e)",
            color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 4px 16px rgba(74,222,128,0.3)",
          }}
        >
          <Plus size={14} /> Add Provider
        </motion.button>
      </div>

      {/* Category stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        {BUTLER_CATEGORIES.map((cat) => {
          const count = providers.filter((p) => p.category === cat.key).length;
          const color = CAT_COLORS[cat.key];
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCat(activeCategory === cat.key ? "all" : cat.key)}
              style={{
                ...CARD_STYLE,
                cursor: "pointer",
                border: activeCategory === cat.key ? `1px solid ${color}40` : "1px solid rgba(255,255,255,0.07)",
                background: activeCategory === cat.key ? `${color}10` : "rgba(255,255,255,0.03)",
                boxShadow: activeCategory === cat.key ? `0 0 20px ${color}18` : "none",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{cat.emoji}</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: activeCategory === cat.key ? color : "#fff", margin: "0 0 4px" }}>{cat.label}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>{count} providers</p>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div style={{ ...CARD_STYLE, marginBottom: 18, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setActiveCat("all")}
            style={{ height: 32, padding: "0 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, background: activeCategory === "all" ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)", border: activeCategory === "all" ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.07)", color: activeCategory === "all" ? "#4ade80" : "rgba(255,255,255,0.4)" }}
          >All</button>
          {BUTLER_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCat(cat.key)}
              style={{ height: 32, padding: "0 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, background: activeCategory === cat.key ? `${CAT_COLORS[cat.key]}15` : "rgba(255,255,255,0.04)", border: activeCategory === cat.key ? `1px solid ${CAT_COLORS[cat.key]}40` : "1px solid rgba(255,255,255,0.07)", color: activeCategory === cat.key ? CAT_COLORS[cat.key] : "rgba(255,255,255,0.4)" }}
            >{cat.emoji} {cat.label}</button>
          ))}
        </div>
      </div>

      {/* Provider cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {filtered.map((p) => {
          const cat = BUTLER_CATEGORIES.find((c) => c.key === p.category);
          const color = CAT_COLORS[p.category as ButlerCategory] || "#4ade80";
          return (
            <div key={p.id} style={{ ...CARD_STYLE, position: "relative" }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={p.photo}
                    alt={p.name}
                    style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://i.pravatar.cc/100?u=${p.id}`; }}
                  />
                  {p.verified && (
                    <div style={{ position: "absolute", bottom: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Shield size={10} style={{ color: "#000" }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                    <span style={{ fontSize: 12 }}>{cat?.emoji}</span>
                  </div>
                  <p style={{ fontSize: 11, color, margin: "2px 0", fontWeight: 600 }}>{p.specialty}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <Star size={10} style={{ color: "#fbbf24", fill: "#fbbf24" }} />
                    <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>{p.rating.toFixed(1)}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}> · {p.city}</span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 8px", lineHeight: 1.5 }}>{p.description}</p>

              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                <Phone size={10} style={{ color: "rgba(255,255,255,0.3)" }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{p.whatsapp}</span>
              </div>

              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 12px" }}>{p.deliveryNote}</p>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => toggleVerified(p.id)}
                  style={{ flex: 1, height: 34, borderRadius: 9, border: p.verified ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.1)", background: p.verified ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", color: p.verified ? "#4ade80" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                >
                  <Shield size={12} /> {p.verified ? "Verified" : "Unverified"}
                </button>
                <button onClick={() => openEdit(p)} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Edit2 size={13} />
                </button>
                {deleteConfirm === p.id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => handleDelete(p.id)} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.15)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={13} />
                    </button>
                    <button onClick={() => setDeleteConfirm(null)} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm(p.id)} style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(239,68,68,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: 0 }}>No providers in this category</p>
        </div>
      )}

      {/* Edit / Add Modal */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, backdropFilter: "blur(4px)" }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              style={{ position: "fixed", top: 40, left: "50%", transform: "translateX(-50%)", width: 500, maxHeight: "calc(100dvh - 60px)", overflowY: "auto", background: "#0e0e20", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "28px", zIndex: 101, boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <h2 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0 }}>{isNew ? "Add Provider" : "Edit Provider"}</h2>
                <button onClick={() => setEditing(null)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
              </div>

              {/* Category */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>Category</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {BUTLER_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setEditCat(cat.key)}
                      style={{ flex: 1, height: 38, borderRadius: 9, border: editCat === cat.key ? `1px solid ${CAT_COLORS[cat.key]}50` : "1px solid rgba(255,255,255,0.1)", background: editCat === cat.key ? `${CAT_COLORS[cat.key]}15` : "rgba(255,255,255,0.04)", color: editCat === cat.key ? CAT_COLORS[cat.key] : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                    >
                      {cat.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                <img src={form.photo || "https://i.pravatar.cc/100?u=new"} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).src = "https://i.pravatar.cc/100?u=new"; }} />
                <div style={{ flex: 1 }}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoFile} style={{ display: "none" }} />
                  <button onClick={() => fileRef.current?.click()} style={{ width: "100%", height: 34, borderRadius: 8, border: "1px dashed rgba(74,222,128,0.4)", background: "rgba(74,222,128,0.06)", color: "#4ade80", fontSize: 11, fontWeight: 700, cursor: "pointer", marginBottom: 6 }}>Upload Photo</button>
                  <input value={form.photo} onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))} placeholder="Or paste image URL…" style={{ ...INPUT_STYLE, height: 34, fontSize: 11 }} />
                </div>
              </div>

              {/* Fields */}
              {[
                { label: "Name",         field: "name",         placeholder: "Provider name"          },
                { label: "Specialty",    field: "specialty",    placeholder: "e.g. Hand-tied bouquets" },
                { label: "City",         field: "city",         placeholder: "City name"              },
                { label: "Country Code", field: "countryCode",  placeholder: "e.g. ID, SG, TH"        },
                { label: "WhatsApp",     field: "whatsapp",     placeholder: "+62 8xx xxxx xxxx"       },
                { label: "Delivery Note",field: "deliveryNote", placeholder: "e.g. Same-day delivery"  },
              ].map((f) => (
                <div key={f.field} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input
                    value={(form as any)[f.field]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.field]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={INPUT_STYLE}
                  />
                </div>
              ))}

              {/* Description */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description of the provider…"
                  rows={2}
                  style={{ ...INPUT_STYLE, height: "auto", padding: "10px 12px", resize: "vertical" }}
                />
              </div>

              {/* Rating + Verified */}
              <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Rating</label>
                  <input type="number" min={1} max={5} step={0.1} value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: parseFloat(e.target.value) }))} style={INPUT_STYLE} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Verified</label>
                  <button
                    onClick={() => setForm((f) => ({ ...f, verified: !f.verified }))}
                    style={{ width: "100%", height: 44, borderRadius: 10, border: form.verified ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.1)", background: form.verified ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", color: form.verified ? "#4ade80" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                  >
                    <Shield size={14} /> {form.verified ? "Verified ✓" : "Unverified"}
                  </button>
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} style={{ width: "100%", height: 48, borderRadius: 12, border: "none", background: saved ? "rgba(74,222,128,0.2)" : "linear-gradient(135deg,#4ade80,#22c55e)", color: saved ? "#4ade80" : "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: saved ? "none" : "0 6px 20px rgba(74,222,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {saved ? <><Check size={15} /> Saved!</> : isNew ? "Add Provider" : "Save Changes"}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
