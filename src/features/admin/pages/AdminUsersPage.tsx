import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Users, TrendingUp, Star, Shield, RefreshCw } from "lucide-react";
import { fetchUsers, fetchCountryStats, fetchOverviewStats, UserRow, CountryStatRow } from "../adminSupabaseService";

type Tier = "all" | "free" | "suite" | "gold";

const TIER_CONFIG = {
  free:  { label: "Seller Room", color: "rgba(255,255,255,0.5)", bg: "rgba(255,255,255,0.06)" },
  suite: { label: "Ghost Suite", color: "#4ade80",                bg: "rgba(74,222,128,0.1)"  },
  gold:  { label: "Gold Room",   color: "#d4af37",                bg: "rgba(212,175,55,0.1)"  },
};

const CARD_STYLE = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: "20px",
};

export default function AdminUsersPage() {
  const [users, setUsers]                   = useState<UserRow[]>([]);
  const [countries, setCountries]           = useState<CountryStatRow[]>([]);
  const [totalUsers, setTotalUsers]         = useState(0);
  const [totalPremium, setTotalPremium]     = useState(0);
  const [totalGold, setTotalGold]           = useState(0);
  const [newThisMonth, setNewThisMonth]     = useState(0);
  const [loading, setLoading]               = useState(true);
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [tierFilter, setTierFilter]           = useState<Tier>("all");
  const [genderFilter, setGenderFilter]       = useState<"All" | "Female" | "Male">("All");
  const [search, setSearch]                   = useState("");

  const load = async () => {
    setLoading(true);
    const [u, c, s] = await Promise.all([fetchUsers(), fetchCountryStats(), fetchOverviewStats()]);
    setUsers(u);
    setCountries(c);
    setTotalUsers(s.total_users);
    setTotalPremium(s.premium_users);
    setTotalGold(s.gold_users);
    setNewThisMonth(s.new_this_month);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) => {
    if (selectedCountry !== "All") {
      const cs = countries.find((c) => c.flag === u.country);
      if (cs?.country !== selectedCountry) return false;
    }
    if (tierFilter !== "all" && u.tier !== tierFilter) return false;
    if (genderFilter !== "All" && u.gender !== genderFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.city.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const countryData = selectedCountry === "All"
    ? null
    : countries.find((c) => c.country === selectedCountry);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Real Users</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Registered accounts · {totalUsers.toLocaleString()} total
          </p>
        </div>
        <button
          onClick={load}
          style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : undefined} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Total Users",    value: totalUsers.toLocaleString(),   icon: Users,      color: "#4ade80" },
          { label: "Premium Users",  value: totalPremium.toLocaleString(), icon: Shield,     color: "#a78bfa" },
          { label: "Gold Members",   value: totalGold.toLocaleString(),    icon: Star,       color: "#d4af37" },
          { label: "New This Month", value: newThisMonth.toLocaleString(), icon: TrendingUp, color: "#f472b6" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={CARD_STYLE}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>{s.label}</p>
                <Icon size={15} style={{ color: s.color }} />
              </div>
              <p style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: 0 }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Country breakdown */}
      <div style={{ ...CARD_STYLE, marginBottom: 20, padding: "14px 16px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>Users by Country</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setSelectedCountry("All")}
            style={{
              height: 32, borderRadius: 8, padding: "0 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: selectedCountry === "All" ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
              border: selectedCountry === "All" ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.07)",
              color: selectedCountry === "All" ? "#4ade80" : "rgba(255,255,255,0.4)",
            } as any}
          >
            All Countries
          </button>
          {countries.map((c) => (
            <button
              key={c.country}
              onClick={() => setSelectedCountry(c.country)}
              style={{
                height: 32, borderRadius: 8, padding: "0 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: selectedCountry === c.country ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
                border: selectedCountry === c.country ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.07)",
                color: selectedCountry === c.country ? "#4ade80" : "rgba(255,255,255,0.4)",
                display: "flex", alignItems: "center", gap: 5,
              } as any}
            >
              <span>{c.flag}</span>
              <span>{c.country}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>({c.users})</span>
            </button>
          ))}
        </div>

        {/* Selected country stats */}
        {countryData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}
          >
            {[
              { label: "Total",   value: countryData.users,   color: "#fff"      },
              { label: "Premium", value: countryData.premium, color: "#4ade80"   },
              { label: "Suite",   value: countryData.suite,   color: "#4ade80"   },
              { label: "Gold",    value: countryData.gold,    color: "#d4af37"   },
              { label: "MRR",     value: "$${countryData.mrr.toFixed(0)}", color: "#d4af37" },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: s.color, margin: "0 0 2px" }}>{s.value}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Filters row */}
      <div style={{ ...CARD_STYLE, marginBottom: 16, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {/* Tier filter */}
          {(["all", "free", "suite", "gold"] as Tier[]).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              style={{
                height: 34, borderRadius: 9, padding: "0 14px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: tierFilter === t ? (t === "all" ? "rgba(255,255,255,0.1)" : TIER_CONFIG[t]?.bg) : "rgba(255,255,255,0.03)",
                border: tierFilter === t ? `1px solid ${t === "all" ? "rgba(255,255,255,0.2)" : TIER_CONFIG[t]?.color}40` : "1px solid rgba(255,255,255,0.07)",
                color: tierFilter === t ? (t === "all" ? "#fff" : TIER_CONFIG[t]?.color) : "rgba(255,255,255,0.4)",
              } as any}
            >
              {t === "all" ? "All Tiers" : TIER_CONFIG[t].label}
            </button>
          ))}

          {/* Gender */}
          {(["All", "Female", "Male"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              style={{
                height: 34, borderRadius: 9, padding: "0 12px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: genderFilter === g ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                border: genderFilter === g ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.07)",
                color: genderFilter === g ? "#fff" : "rgba(255,255,255,0.4)",
              } as any}
            >
              {g}
            </button>
          ))}

          <div style={{ position: "relative", marginLeft: "auto" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              style={{ height: 34, width: 200, borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12, padding: "0 12px 0 30px", outline: "none" }}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ ...CARD_STYLE, padding: 0, overflow: "hidden" }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "44px 1fr 120px 120px 90px 100px 100px 80px",
          gap: 0, padding: "12px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}>
          {["#", "User", "Country", "City", "Tier", "Joined", "Last Active", "Gender"].map((h) => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: 0 }}>Loading users…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: 0 }}>No users match your filters</p>
          </div>
        ) : (
          filtered.map((u, i) => {
            const tc = TIER_CONFIG[u.tier as keyof typeof TIER_CONFIG];
            return (
              <div
                key={u.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1fr 120px 120px 90px 100px 100px 80px",
                  padding: "13px 16px",
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>{i + 1}</span>

                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: u.tier === "gold" ? "rgba(212,175,55,0.2)" : u.tier === "suite" ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)",
                    border: `1px solid ${u.tier === "gold" ? "rgba(212,175,55,0.4)" : u.tier === "suite" ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700, color: tc?.color,
                  }}>
                    {u.name.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, fontFamily: "monospace" }}>{u.phone}</p>
                  </div>
                </div>

                <span style={{ fontSize: 16 }}>{u.country}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.city}</span>

                <span style={{
                  display: "inline-flex", alignItems: "center",
                  height: 22, borderRadius: 6, padding: "0 8px",
                  background: tc?.bg, border: `1px solid ${tc?.color}40`,
                  fontSize: 10, fontWeight: 700, color: tc?.color,
                  whiteSpace: "nowrap",
                }}>
                  {tc?.label}
                </span>

                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{u.joined}</span>
                <span style={{ fontSize: 11, color: u.lastActive.includes("h") || u.lastActive.includes("m") ? "#4ade80" : "rgba(255,255,255,0.3)" }}>
                  {u.lastActive}
                </span>
                <span style={{ fontSize: 11, color: u.gender === "Female" ? "#f472b6" : "#60a5fa", fontWeight: 600 }}>{u.gender}</span>
              </div>
            );
          })
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: 12 }}>
          Showing {filtered.length} of {users.length} registered users
        </p>
      )}
    </div>
  );
}
