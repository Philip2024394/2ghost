import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Upload, Check, Edit2, Star } from "lucide-react";
import { MOCK_PROFILES, MockProfile } from "../../../data/mockProfiles";
import { fetchMockOverrides, saveMockOverride, deleteMockOverride } from "../adminSupabaseService";

const OVERRIDE_KEY = "admin_profile_overrides";

type Override = Partial<Pick<MockProfile, "name" | "age" | "city" | "image" | "isVip">> & { id: string };

function localLoadOverrides(): Record<string, Override> {
  try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY) || "{}"); }
  catch { return {}; }
}

function localSaveOverride(override: Override) {
  const all = localLoadOverrides();
  all[override.id] = override;
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(all));
}

const COUNTRIES = Array.from(new Set(MOCK_PROFILES.map((p) => p.country)));

const TIER_COLOR: Record<string, string> = {
  Female: "#f472b6",
  Male:   "#60a5fa",
};

function applyOverride(p: MockProfile, overrides: Record<string, Override>): MockProfile {
  const o = overrides[p.id];
  if (!o) return p;
  return { ...p, ...o };
}

export default function AdminProfilesPage() {
  const [overrides, setOverrides] = useState<Record<string, Override>>(localLoadOverrides);
  const [country, setCountry]     = useState("All");
  const [search, setSearch]       = useState("");
  const [gender, setGender]       = useState<"All" | "Female" | "Male">("All");
  const [editing, setEditing]     = useState<MockProfile | null>(null);

  // Edit form state
  const [eName, setEName]     = useState("");
  const [eAge, setEAge]       = useState("");
  const [eCity, setECity]     = useState("");
  const [eImage, setEImage]   = useState("");
  const [eVip, setEVip]       = useState(false);
  const [saved, setSaved]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync overrides from Supabase on mount
  useEffect(() => {
    fetchMockOverrides().then((data) => {
      if (data && Object.keys(data).length > 0) {
        const mapped: Record<string, Override> = {};
        for (const [id, v] of Object.entries(data)) {
          mapped[id] = { id, name: (v as any).name, age: (v as any).age, city: (v as any).city, image: (v as any).image, isVip: (v as any).isVip };
        }
        setOverrides(mapped);
        localStorage.setItem(OVERRIDE_KEY, JSON.stringify(mapped));
      }
    });
  }, []);

  const profiles = MOCK_PROFILES.map((p) => applyOverride(p, overrides));

  const filtered = profiles.filter((p) => {
    if (country !== "All" && p.country !== country) return false;
    if (gender !== "All" && p.gender !== gender) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.city.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openEdit = (p: MockProfile) => {
    setEditing(p);
    setEName(p.name);
    setEAge(String(p.age));
    setECity(p.city);
    setEImage(p.image);
    setEVip(p.isVip);
    setSaved(false);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = useCallback(() => {
    if (!editing) return;
    const override: Override = {
      id: editing.id,
      name: eName.trim() || editing.name,
      age: parseInt(eAge, 10) || editing.age,
      city: eCity.trim() || editing.city,
      image: eImage || editing.image,
      isVip: eVip,
    };
    localSaveOverride(override);
    setOverrides((prev) => ({ ...prev, [override.id]: override }));
    saveMockOverride({ id: override.id, name: override.name, age: override.age, city: override.city, image: override.image, isVip: override.isVip });
    setSaved(true);
    setTimeout(() => { setEditing(null); setSaved(false); }, 800);
  }, [editing, eName, eAge, eCity, eImage, eVip]);

  const handleReset = (id: string) => {
    const all = localLoadOverrides();
    delete all[id];
    localStorage.setItem(OVERRIDE_KEY, JSON.stringify(all));
    setOverrides(all);
    deleteMockOverride(id);
  };

  const CARD = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16,
    padding: "20px",
  };

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Mock Profiles</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          {MOCK_PROFILES.length.toLocaleString()} profiles across {COUNTRIES.length} countries · {Object.keys(overrides).length} customized
        </p>
      </div>

      {/* Filters */}
      <div style={{ ...CARD, marginBottom: 20, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>

          {/* Country */}
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={{
              height: 38, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13,
              padding: "0 12px", outline: "none", cursor: "pointer",
            }}
          >
            <option value="All" style={{ color: "#000", background: "#fff" }}>All Countries</option>
            {COUNTRIES.map((c) => <option key={c} value={c} style={{ color: "#000", background: "#fff" }}>{c}</option>)}
          </select>

          {/* Gender */}
          {(["All", "Female", "Male"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              style={{
                height: 38, borderRadius: 10, padding: "0 14px",
                background: gender === g ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
                border: gender === g ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.07)",
                color: gender === g ? "#4ade80" : "rgba(255,255,255,0.5)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              } as any}
            >
              {g === "All" ? "All Genders" : g === "Female" ? "👩 Female" : "👨 Male"}
            </button>
          ))}

          {/* Search */}
          <div style={{ position: "relative", marginLeft: "auto" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or city…"
              style={{
                height: 38, width: 220, borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13,
                padding: "0 12px 0 32px", outline: "none",
              }}
            />
          </div>

          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
            {filtered.length} profiles
          </span>
        </div>
      </div>

      {/* Profile Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {filtered.slice(0, 120).map((p) => {
          const isOverridden = !!overrides[p.id];
          return (
            <motion.div
              key={p.id}
              whileHover={{ y: -2 }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: isOverridden ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, overflow: "hidden", cursor: "pointer",
                position: "relative",
              }}
              onClick={() => openEdit(p)}
            >
              <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden" }}>
                <img
                  src={p.image}
                  alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://i.pravatar.cc/200?u=${p.id}`; }}
                />
                {isOverridden && (
                  <div style={{ position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: "50%", background: "#4ade80", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={10} style={{ color: "#000" }} />
                  </div>
                )}
                {p.isVip && (
                  <div style={{ position: "absolute", top: 6, left: 6 }}>
                    <Star size={12} style={{ color: "#d4af37", fill: "#d4af37" }} />
                  </div>
                )}
              </div>
              <div style={{ padding: "10px 10px 12px" }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}, {p.age}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.city}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: TIER_COLOR[p.gender], textTransform: "uppercase", letterSpacing: "0.06em" }}>{p.gender}</span>
                  <Edit2 size={11} style={{ color: "rgba(255,255,255,0.25)" }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length > 120 && (
        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 16 }}>
          Showing first 120 of {filtered.length} — use filters to narrow results
        </p>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditing(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              style={{
                position: "fixed", top: 40, left: "50%", transform: "translateX(-50%)",
                width: 460, maxHeight: "calc(100dvh - 60px)", overflowY: "auto",
                background: "#0e0e20", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20, padding: "28px", zIndex: 101,
                boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: 0 }}>Edit Profile</h2>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "3px 0 0" }}>{editing.id} · {editing.country} {editing.countryFlag}</p>
                </div>
                <button onClick={() => setEditing(null)} style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={14} />
                </button>
              </div>

              {/* Photo */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}>
                <img src={eImage} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).src = `https://i.pravatar.cc/200?u=${editing.id}`; }} />
                <div style={{ flex: 1 }}>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} style={{ display: "none" }} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                      width: "100%", height: 40, borderRadius: 10, border: "1px dashed rgba(74,222,128,0.4)",
                      background: "rgba(74,222,128,0.06)", color: "#4ade80", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <Upload size={13} /> Upload New Photo
                  </button>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "6px 0 0", textAlign: "center" }}>Or paste URL below</p>
                  <input
                    value={eImage}
                    onChange={(e) => setEImage(e.target.value)}
                    placeholder="https://..."
                    style={{ width: "100%", height: 34, marginTop: 6, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 11, padding: "0 10px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              {/* Fields */}
              {[
                { label: "Name", value: eName, set: setEName, placeholder: "Display name" },
                { label: "Age",  value: eAge,  set: setEAge,  placeholder: "18 – 80", type: "number" },
                { label: "City", value: eCity, set: setECity, placeholder: "City name" },
              ].map((f) => (
                <div key={f.label} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input
                    type={(f as any).type || "text"}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{ width: "100%", height: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, padding: "0 12px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}

              {/* VIP toggle */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, padding: "12px 14px", background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Star size={14} style={{ color: "#d4af37" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#d4af37" }}>VIP Profile</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>— shown in Pulse row</span>
                </div>
                <button
                  onClick={() => setEVip(!eVip)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none",
                    background: eVip ? "#d4af37" : "rgba(255,255,255,0.1)",
                    cursor: "pointer", position: "relative", transition: "background 0.2s",
                  }}
                >
                  <div style={{ position: "absolute", top: 2, left: eVip ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                {overrides[editing.id] && (
                  <button
                    onClick={() => { handleReset(editing.id); setEditing(null); }}
                    style={{ flex: 1, height: 46, borderRadius: 12, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,0.8)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Reset to Default
                  </button>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  style={{
                    flex: 2, height: 46, borderRadius: 12, border: "none",
                    background: saved ? "rgba(74,222,128,0.2)" : "linear-gradient(135deg,#4ade80,#22c55e)",
                    color: saved ? "#4ade80" : "#fff", fontSize: 13, fontWeight: 900,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: saved ? "none" : "0 6px 20px rgba(74,222,128,0.3)",
                  }}
                >
                  {saved ? <><Check size={14} /> Saved!</> : "Save Changes"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
