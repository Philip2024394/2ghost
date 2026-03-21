import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { DollarSign, TrendingUp, Users, ArrowUpRight, RefreshCw } from "lucide-react";
import {
  fetchAllPayments, fetchMonthlyRevenue, fetchCountryStats, fetchPackageBreakdown,
  TransactionRow, RevenueRow, CountryStatRow,
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
          ${p.value?.toLocaleString()} <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{p.name}</span>
        </p>
      ))}
    </div>
  );
}

export default function AdminPaymentsPage() {
  const a = useGenderAccent();
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [revenue, setRevenue]           = useState<RevenueRow[]>([]);
  const [countries, setCountries]       = useState<CountryStatRow[]>([]);
  const [packages, setPackages]         = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading]           = useState(true);

  const load = async () => {
    setLoading(true);
    const [t, r, c, p] = await Promise.all([
      fetchAllPayments(), fetchMonthlyRevenue(), fetchCountryStats(), fetchPackageBreakdown(),
    ]);
    setTransactions(t);
    setRevenue(r);
    setCountries(c);
    setPackages(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Derived metrics
  const totalRev  = revenue.length > 0 ? revenue[revenue.length - 1].revenue : 0;
  const prevRev   = revenue.length > 1 ? revenue[revenue.length - 2].revenue : 0;
  const growth    = prevRev > 0 ? (((totalRev - prevRev) / prevRev) * 100).toFixed(1) : "0.0";
  const totalMRR  = countries.reduce((s, c) => s + c.mrr, 0);
  const totalPaid = (packages.find((p) => p.name === "Ghost Suite")?.value ?? 0) + (packages.find((p) => p.name === "Gold Room")?.value ?? 0);
  const arpu      = totalPaid > 0 ? (totalMRR / totalPaid).toFixed(2) : "0.00";
  const ytd       = revenue.slice(-3).reduce((s, m) => s + m.revenue, 0);

  const countryRevenue = countries
    .map((c) => ({ name: c.country.split(" ")[0], flag: c.flag, mrr: c.mrr, gold: c.gold * 9.99, suite: c.suite * 4.99 }))
    .sort((a, b) => b.mrr - a.mrr);

  const totalPackages = packages.reduce((s, p) => s + p.value, 0) || 1;

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Payments & Revenue</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Subscription revenue · all countries · all tiers
          </p>
        </div>
        <button
          onClick={load}
          style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : undefined} /> Refresh
        </button>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Monthly Revenue",   value: `$${totalRev.toLocaleString()}`, sub: `+${growth}% vs last month`, color: a.accent, icon: TrendingUp  },
          { label: "Total MRR",         value: `$${totalMRR.toFixed(0)}`,       sub: "All active subscriptions",  color: "#d4af37", icon: DollarSign },
          { label: "ARPU",              value: `$${arpu}`,                       sub: "Avg revenue per paid user", color: "#a78bfa", icon: Users      },
          { label: "YTD Revenue",       value: `$${ytd.toLocaleString()}`,       sub: "Last 3 months",             color: "#f472b6", icon: DollarSign },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} style={CARD_STYLE}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>{kpi.label}</p>
                <Icon size={15} style={{ color: kpi.color }} />
              </div>
              <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 6px", lineHeight: 1 }}>{kpi.value}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <ArrowUpRight size={11} style={{ color: kpi.color }} />
                <span style={{ fontSize: 11, color: kpi.color, fontWeight: 600 }}>{kpi.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue chart */}
      <div style={{ ...CARD_STYLE, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>Revenue Over Time</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "3px 0 0" }}>12-month view · Suite + Gold breakdown</p>
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
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={revenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="pgSuite" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={a.accent} stopOpacity={0.25} />
                <stop offset="95%" stopColor={a.accent} stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="pgGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#d4af37" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#d4af37" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="suite" name="Ghost Suite" stroke={a.accent} fill="url(#pgSuite)" strokeWidth={2} />
            <Area type="monotone" dataKey="gold"  name="Gold Room"  stroke="#d4af37" fill="url(#pgGold)"  strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Country MRR + Package breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, marginBottom: 20 }}>

        {/* Country revenue bar */}
        <div style={CARD_STYLE}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>Revenue by Country</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>Monthly recurring revenue</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={countryRevenue} layout="vertical" margin={{ top: 0, right: 8, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="flag" tick={{ fontSize: 14 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = countryRevenue.find((c) => c.flag === label);
                  return (
                    <div style={{ background: "#0f0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>{row?.name}</p>
                      <p style={{ fontSize: 11, color: "#d4af37", margin: "2px 0" }}>MRR: ${row?.mrr.toFixed(0)}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="suite" name="Suite" fill={a.accent} stackId="a" radius={[0,0,0,0]} />
              <Bar dataKey="gold"  name="Gold"  fill="#d4af37" stackId="a" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Package breakdown */}
        <div style={CARD_STYLE}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 16px" }}>Package Sales</p>

          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={packages} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" strokeWidth={0}>
                {packages.map((p) => <Cell key={p.name} fill={p.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {packages.map((p) => (
              <div key={p.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.value}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: p.color, width: `${(p.value / totalPackages) * 100}%`, transition: "width 0.6s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div style={{ ...CARD_STYLE, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>Transaction History</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 80px 100px 80px 70px", padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
          {["Txn ID", "User", "Country", "Package", "Amount", "Status"].map((h) => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>Loading transactions…</p>
          </div>
        ) : transactions.map((tx, i) => (
          <div key={tx.id} style={{
            display: "grid", gridTemplateColumns: "100px 1fr 80px 100px 80px 70px",
            padding: "12px 20px",
            borderBottom: i < transactions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
            alignItems: "center",
          }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>{tx.id}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{tx.user}</span>
            <span style={{ fontSize: 16 }}>{tx.country}</span>
            <span style={{
              display: "inline-flex", height: 20, alignItems: "center",
              padding: "0 8px", borderRadius: 5, fontSize: 10, fontWeight: 700,
              background: tx.pkg === "Gold Room" ? "rgba(212,175,55,0.12)" : a.glow(0.1),
              color: tx.pkg === "Gold Room" ? "#d4af37" : a.accent,
              border: `1px solid ${tx.pkg === "Gold Room" ? "rgba(212,175,55,0.3)" : a.glow(0.25)}`,
              whiteSpace: "nowrap",
            }}>
              {tx.pkg}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{tx.amount}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
              color: tx.status === "paid" ? "#4ade80" : "#ef4444",
            }}>
              {tx.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
