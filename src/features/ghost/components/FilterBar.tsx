import { useState } from "react";
import { Navigation, Globe } from "lucide-react";
import { WORLD_COUNTRIES } from "../data/worldCountries";
import type { GenderFilter, KmFilter } from "../types/ghostTypes";
import { PROFILE_BADGES, BADGE_CATEGORIES } from "../data/profileBadges";

// ── Filter bar ──────────────────────────────────────────────────────────────
export default function FilterBar({
  gender, setGender,
  ageMin, ageMax, setAgeMin, setAgeMax,
  maxKm, setMaxKm,
  locationLoading, hasLocation, onRequestLocation,
  filterCountry, setFilterCountry,
  onlineOnly, setOnlineOnly,
  lookingFor, setLookingFor,
  filterBadge, setFilterBadge,
}: {
  gender: GenderFilter; setGender: (g: GenderFilter) => void;
  ageMin: number; ageMax: number;
  setAgeMin: (v: number) => void; setAgeMax: (v: number) => void;
  maxKm: KmFilter; setMaxKm: (v: KmFilter) => void;
  locationLoading: boolean; hasLocation: boolean;
  onRequestLocation: () => void;
  filterCountry: string; setFilterCountry: (c: string) => void;
  onlineOnly: boolean; setOnlineOnly: (v: boolean) => void;
  lookingFor: string; setLookingFor: (v: string) => void;
  filterBadge: string; setFilterBadge: (v: string) => void;
}) {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const filteredCountries = WORLD_COUNTRIES.filter((c) =>
    countryQuery.length === 0 || c.name.toLowerCase().includes(countryQuery.toLowerCase())
  );
  const KM_OPTIONS: { label: string; value: KmFilter }[] = [
    { label: "5 km", value: 5 },
    { label: "10 km", value: 10 },
    { label: "25 km", value: 25 },
    { label: "50 km", value: 50 },
    { label: "Any", value: 9999 },
  ];

  const S = {
    label: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase" as const, letterSpacing: "0.1em", margin: "0 0 8px" },
    divider: { height: 1, background: "rgba(255,255,255,0.05)", margin: "16px 0" },
    chip: (active: boolean): React.CSSProperties => ({
      flex: 1, height: 34, borderRadius: 10, border: "none",
      background: active ? "linear-gradient(135deg, #16a34a, #22c55e)" : "rgba(255,255,255,0.06)",
      color: active ? "#fff" : "rgba(255,255,255,0.45)",
      fontSize: 12, fontWeight: 700, cursor: "pointer",
    }),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* ── Gender ── */}
      <p style={S.label}>Show me</p>
      <div style={{ display: "flex", gap: 6 }}>
        {(["all", "Female", "Male"] as GenderFilter[]).map((g) => (
          <button key={g} onClick={() => setGender(g)} style={S.chip(gender === g)}>
            {g === "all" ? "Everyone" : g === "Female" ? "👩 Women" : "👨 Men"}
          </button>
        ))}
      </div>

      <div style={S.divider} />

      {/* ── Age range ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ ...S.label, margin: 0 }}>Age range</p>
        <span style={{ fontSize: 12, fontWeight: 800, color: "rgba(74,222,128,0.9)" }}>{ageMin} – {ageMax} yrs</span>
      </div>
      <div style={{ position: "relative", height: 24, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }} />
        <div style={{ position: "absolute", left: `${((ageMin - 18) / (60 - 18)) * 100}%`, right: `${100 - ((ageMax - 18) / (60 - 18)) * 100}%`, height: 4, background: "linear-gradient(90deg, #16a34a, #4ade80)", borderRadius: 2 }} />
        <input type="range" min={18} max={60} value={ageMin} onChange={(e) => { const v = parseInt(e.target.value); if (v < ageMax - 1) setAgeMin(v); }} style={{ position: "absolute", width: "100%", opacity: 0, cursor: "pointer", height: 24, zIndex: 2 }} />
        <input type="range" min={18} max={60} value={ageMax} onChange={(e) => { const v = parseInt(e.target.value); if (v > ageMin + 1) setAgeMax(v); }} style={{ position: "absolute", width: "100%", opacity: 0, cursor: "pointer", height: 24, zIndex: 3 }} />
        <div style={{ position: "absolute", left: `calc(${((ageMin - 18) / (60 - 18)) * 100}% - 9px)`, width: 18, height: 18, borderRadius: "50%", background: "#22c55e", border: "2px solid #050508", boxShadow: "0 0 10px rgba(34,197,94,0.5)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", left: `calc(${((ageMax - 18) / (60 - 18)) * 100}% - 9px)`, width: 18, height: 18, borderRadius: "50%", background: "#22c55e", border: "2px solid #050508", boxShadow: "0 0 10px rgba(34,197,94,0.5)", pointerEvents: "none" }} />
      </div>

      <div style={S.divider} />

      {/* ── Distance ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <p style={{ ...S.label, margin: 0 }}>Distance</p>
        <button onClick={onRequestLocation} style={{ height: 26, paddingInline: 10, borderRadius: 8, border: hasLocation ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.1)", background: hasLocation ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)", color: hasLocation ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <Navigation size={10} /> {locationLoading ? "..." : hasLocation ? "📍 GPS On" : "Enable GPS"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 5 }}>
        {KM_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setMaxKm(opt.value)} style={{ flex: 1, height: 32, borderRadius: 9, border: maxKm === opt.value ? "1px solid rgba(74,222,128,0.4)" : "1px solid rgba(255,255,255,0.07)", background: maxKm === opt.value ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)", color: maxKm === opt.value ? "rgba(74,222,128,0.95)" : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {opt.label}
          </button>
        ))}
      </div>

      <div style={S.divider} />

      {/* ── Country ── */}
      <p style={S.label}>Country</p>
      <div style={{ position: "relative" }}>
        <button onClick={() => setShowCountryPicker(!showCountryPicker)} style={{ width: "100%", height: 38, borderRadius: 10, cursor: "pointer", background: filterCountry ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)", border: filterCountry ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(255,255,255,0.08)", color: filterCountry ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Globe size={13} />
            <span>{filterCountry ? `${WORLD_COUNTRIES.find(c => c.name === filterCountry)?.flag} ${filterCountry}` : "All Countries"}</span>
          </div>
          <span style={{ fontSize: 10, opacity: 0.4 }}>{showCountryPicker ? "▲" : "▼"}</span>
        </button>
        {showCountryPicker && (
          <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100, background: "rgba(8,8,14,0.99)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <input autoFocus placeholder="Search country..." value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} style={{ width: "100%", height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 12, padding: "0 10px", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ maxHeight: 180, overflowY: "auto" }}>
              <button onClick={() => { setFilterCountry(""); setShowCountryPicker(false); setCountryQuery(""); }} style={{ width: "100%", padding: "9px 12px", background: !filterCountry ? "rgba(74,222,128,0.1)" : "none", border: "none", color: !filterCountry ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.5)", fontSize: 12, textAlign: "left", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 8 }}>
                <Globe size={13} /> All Countries
              </button>
              {filteredCountries.map((c) => (
                <button key={c.code} onClick={() => { setFilterCountry(c.name); setShowCountryPicker(false); setCountryQuery(""); }} style={{ width: "100%", padding: "9px 12px", background: filterCountry === c.name ? "rgba(74,222,128,0.1)" : "none", border: "none", color: filterCountry === c.name ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.65)", fontSize: 12, textAlign: "left", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{c.flag}</span> {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={S.divider} />

      {/* ── Online status ── */}
      <p style={S.label}>Availability</p>
      <div style={{ display: "flex", gap: 6 }}>
        {[{ val: false, label: "🌐 All Members" }, { val: true, label: "🟢 Online Now" }].map(({ val, label }) => (
          <button key={String(val)} onClick={() => setOnlineOnly(val)} style={S.chip(onlineOnly === val)}>
            {label}
          </button>
        ))}
      </div>

      <div style={S.divider} />

      {/* ── Looking for ── */}
      <p style={S.label}>Looking for</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { val: "all",         label: "✨ Open to all"    },
          { val: "relationship",label: "💍 Relationship"   },
          { val: "casual",      label: "🌊 Casual dating"  },
          { val: "friends",     label: "🤝 Just friends"   },
          { val: "tonight",     label: "🌙 Free tonight"   },
          { val: "travel",      label: "✈️ Travel partner" },
        ].map(({ val, label }) => (
          <button key={val} onClick={() => setLookingFor(val)} style={{ ...S.chip(lookingFor === val), height: 38, fontSize: 11 }}>
            {label}
          </button>
        ))}
      </div>

      <div style={S.divider} />

      {/* ── Badge filter ── */}
      <p style={S.label}>Profile Badge</p>
      <button
        onClick={() => setFilterBadge("")}
        style={{ ...S.chip(!filterBadge), height: 36, width: "100%", marginBottom: 10, fontSize: 12 }}
      >
        ✨ All Badges
      </button>
      {BADGE_CATEGORIES.map((cat) => {
        const badges = PROFILE_BADGES.filter((b) => b.category === cat.key);
        return (
          <div key={cat.key} style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px" }}>
              {cat.label}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {badges.map((b) => {
                const active = filterBadge === b.key;
                return (
                  <button
                    key={b.key}
                    onClick={() => setFilterBadge(active ? "" : b.key)}
                    style={{
                      height: 32, borderRadius: 50, padding: "0 11px",
                      background: active ? "rgba(251,191,36,0.18)" : "rgba(255,255,255,0.05)",
                      color: active ? "#fbbf24" : "rgba(255,255,255,0.45)",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                      border: active ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.07)",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <span>{b.emoji}</span>{b.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

    </div>
  );
}
