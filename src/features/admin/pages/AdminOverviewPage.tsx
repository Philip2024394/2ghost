import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, DollarSign, Globe, TrendingUp, ArrowUpRight } from "lucide-react";
import { COUNTRY_STATS, MONTHLY_REVENUE, PACKAGE_BREAKDOWN, RECENT_TRANSACTIONS } from "../adminMockData";

const CARD_STYLE = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: "20px",
};

const totalUsers   = COUNTRY_STATS.reduce((s, c) => s + c.users, 0);
const totalPremium = COUNTRY_STATS.reduce((s, c) => s + c.premium, 0);
const totalMRR     = COUNTRY_STATS.reduce((s, c) => s + c.mrr, 0);
const currentRevenue = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 1].revenue;
const prevRevenue    = MONTHLY_REVENUE[MONTHLY_REVENUE.length - 2].revenue;
const mrrGrowth      = (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1);

const KPI_CARDS = [
  {
    label: "Total Users",
    value: totalUsers.toLocaleString(),
    sub: `${totalPremium} premium accounts`,
    icon: Users,
    color: "#4ade80",
    glow: "rgba(74,222,128,0.15)",
  },
  {
    label: "Monthly Revenue",
    value: `$${currentRevenue.toLocaleString()}`,
    sub: `+${mrrGrowth}% from last month`,
    icon: DollarSign,
    color: "#d4af37",
    glow: "rgba(212,175,55,0.15)",
  },
  {
    label: "Active Countries",
    value: "12",
    sub: "Asia-Pacific · Europe · USA",
    icon: Globe,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.15)",
  },
  {
    label: "Total MRR",
    value: `$${totalMRR.toFixed(0)}`,
    sub: "Combined all tiers",
    icon: TrendingUp,
    color: "#f472b6",
    glow: "rgba(244,114,182,0.15)",
  },
];

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
  return (
    <div style={{ padding: "28px 32px", maxWidth: 1400 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Overview</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
          Dashboard · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
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

        {/* Revenue Area Chart */}
        <div style={CARD_STYLE}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>Revenue Trend</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "2px 0 0" }}>Last 12 months — Suite & Gold breakdown</p>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[{ label: "Ghost Suite", color: "#4ade80" }, { label: "Gold Room", color: "#d4af37" }].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY_REVENUE} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gSuite" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0}   />
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
              <Area type="monotone" dataKey="suite" name="Ghost Suite" stroke="#4ade80" fill="url(#gSuite)" strokeWidth={2} />
              <Area type="monotone" dataKey="gold"  name="Gold Room"  stroke="#d4af37" fill="url(#gGold)"  strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Package Donut */}
        <div style={CARD_STYLE}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Plan Distribution</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>Across all countries</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={PACKAGE_BREAKDOWN} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                {PACKAGE_BREAKDOWN.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {PACKAGE_BREAKDOWN.map((p) => (
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

      {/* Users by country bar chart + Recent Transactions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Country bar chart */}
        <div style={CARD_STYLE}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Users by Country</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>Total vs Premium</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={COUNTRY_STATS.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="flag" tick={{ fontSize: 14 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = COUNTRY_STATS.find((c) => c.flag === label);
                  return (
                    <div style={{ background: "#0f0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{row?.country}</p>
                      <p style={{ fontSize: 11, color: "#4ade80", margin: "2px 0" }}>Total: {row?.users}</p>
                      <p style={{ fontSize: 11, color: "#d4af37", margin: "2px 0" }}>Premium: {row?.premium}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="users"   fill="rgba(74,222,128,0.25)" radius={[0,4,4,0]} />
              <Bar dataKey="premium" fill="#4ade80"                radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Transactions */}
        <div style={CARD_STYLE}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>Recent Transactions</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {RECENT_TRANSACTIONS.slice(0, 8).map((tx, i) => (
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
                  <p style={{ fontSize: 12, fontWeight: 700, color: tx.pkg === "Gold Room" ? "#d4af37" : "#4ade80", margin: 0 }}>{tx.amount}</p>
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                    color: tx.status === "paid" ? "rgba(74,222,128,0.7)" : "rgba(239,68,68,0.7)",
                  }}>
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
