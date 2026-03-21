import { useEffect, useState } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, DollarSign, Globe, TrendingUp, ArrowUpRight, RefreshCw } from "lucide-react";
import {
  fetchOverviewStats, fetchMonthlyRevenue, fetchCountryStats,
  fetchRecentTransactions, fetchPackageBreakdown,
  subscribeToPayments, subscribeToNewUsers,
  type AdminOverviewStats, type RevenueRow, type CountryStatRow, type TransactionRow,
} from "../adminSupabaseService";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const CARD_STYLE = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: "20px",
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 6px" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ fontSize: 13, fontWeight: 700, color: p.color, margin: "2px 0" }}>
          ${p.value.toLocaleString()} <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{p.name}</span>
        </p>
      ))}
    </div>
  );
}

export default function AdminOverviewPage() {
  const a = useGenderAccent();
  const [stats,        setStats]        = useState<AdminOverviewStats | null>(null);
  const [revenue,      setRevenue]      = useState<RevenueRow[]>([]);
  const [countries,    setCountries]    = useState<CountryStatRow[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [packages,     setPackages]     = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [lastRefresh,  setLastRefresh]  = useState(new Date());

  const load = async () => {
    setLoading(true);
    const [s, r, c, t, p] = await Promise.all([
      fetchOverviewStats(),
      fetchMonthlyRevenue(),
      fetchCountryStats(),
      fetchRecentTransactions(),
      fetchPackageBreakdown(),
    ]);
    setStats(s);
    setRevenue(r);
    setCountries(c);
    setTransactions(t);
    setPackages(p);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Realtime: bump counts on new payment or new user
    const unsub1 = subscribeToPayments(() => load());
    const unsub2 = subscribeToNewUsers(() => load());
    return () => { unsub1(); unsub2(); };
  }, []);

  const currentRev = revenue[revenue.length - 1]?.revenue ?? 0;
  const prevRev    = revenue[revenue.length - 2]?.revenue ?? 0;
  const mrrGrowth  = prevRev > 0 ? (((currentRev - prevRev) / prevRev) * 100).toFixed(1) : "0";

  const KPI_CARDS = [
    { label: "Total Users",    value: stats ? stats.total_users.toLocaleString() : "—",    sub: stats ? `${stats.premium_users} premium accounts` : "loading…", icon: Users,      color: a.accent, glow: a.glow(0.15)  },
    { label: "Monthly Revenue",value: `$${currentRev.toLocaleString()}`,                   sub: `+${mrrGrowth}% from last month`,                               icon: DollarSign, color: "#d4af37", glow: "rgba(212,175,55,0.15)"  },
    { label: "Active Countries",value: stats ? String(stats.active_countries) : "—",       sub: "Asia-Pacific · Europe · USA",                                  icon: Globe,      color: "#a78bfa", glow: "rgba(167,139,250,0.15)" },
    { label: "Active Today",   value: stats ? stats.active_today.toLocaleString() : "—",   sub: stats ? `${stats.new_this_month} joined this month` : "loading…",icon: TrendingUp, color: "#f472b6", glow: "rgba(244,114,182,0.15)" },
  ];

  return (
    <div style={{ padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Overview</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {loading && <span style={{ fontSize: 11, color: a.glow(0.6), fontWeight: 600 }}>Fetching live data…</span>}
          <button
            onClick={load}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
            {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: a.accent, boxShadow: `0 0 6px ${a.accent}` }} />
        <span style={{ fontSize: 11, color: a.glow(0.7), fontWeight: 600 }}>Live — updates automatically on new payments & signups</span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={{ ...CARD_STYLE, boxShadow: `0 0 30px ${kpi.glow}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>{kpi.label}</p>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${kpi.color}18`, border: `1px solid ${kpi.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} style={{ color: kpi.color }} />
                </div>
              </div>
              <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 4px", lineHeight: 1 }}>{kpi.value}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <ArrowUpRight size={11} style={{ color: kpi.color }} />
                <p style={{ fontSize: 11, color: kpi.color, margin: 0, fontWeight: 600 }}>{kpi.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue chart + Package donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 24 }}>
        <div style={CARD_STYLE}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Revenue Trend</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>Suite & Gold breakdown</p>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ label: "Ghost Suite", color: a.accent }, { label: "Gold Room", color: "#d4af37" }].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gSuite" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={a.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={a.accent} stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#d4af37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="suite" name="Ghost Suite" stroke={a.accent} fill="url(#gSuite)" strokeWidth={2} />
              <Area type="monotone" dataKey="gold"  name="Gold Room"  stroke="#d4af37" fill="url(#gGold)"  strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={CARD_STYLE}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Plan Distribution</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>Live across all countries</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={packages} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                {packages.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {packages.map((p) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{p.name}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.value}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 4 }}>users</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Country bar + Transactions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={CARD_STYLE}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Users by Country</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>Total vs Premium</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={countries.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="flag" tick={{ fontSize: 14 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = countries.find((c) => c.flag === label);
                  return (
                    <div style={{ background: "#0f0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{row?.country}</p>
                      <p style={{ fontSize: 11, color: a.accent, margin: "2px 0" }}>Total: {row?.users}</p>
                      <p style={{ fontSize: 11, color: "#d4af37", margin: "2px 0" }}>Premium: {row?.premium}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="users"   fill={a.glow(0.25)} radius={[0,4,4,0]} />
              <Bar dataKey="premium" fill={a.accent}                radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={CARD_STYLE}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Recent Transactions</p>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.accent, boxShadow: `0 0 4px ${a.accent}` }} />
              <span style={{ fontSize: 10, color: a.glow(0.6), fontWeight: 600 }}>Live</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {transactions.slice(0, 8).map((tx, i) => (
              <div key={tx.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: i < 7 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{tx.country}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.user}</span>
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "2px 0 0" }}>{tx.id} · {tx.date}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: tx.pkg === "Gold Room" ? "#d4af37" : a.accent, margin: 0 }}>{tx.amount}</p>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: tx.status === "paid" ? a.glow(0.7) : "rgba(239,68,68,0.7)" }}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
