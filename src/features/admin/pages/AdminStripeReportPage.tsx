/**
 * AdminStripeReportPage — Live Stripe revenue dashboard
 *
 * Reads from ghost_payments Supabase table (populated by Stripe webhook).
 * Shows: MRR, total revenue, ARPU, tier breakdown, failed payments,
 * refund rate, and full transaction table with CSV export.
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, RefreshCw,
  Download, AlertCircle, CheckCircle2, CreditCard,
  Users, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  fetchStripeStats, fetchAllPayments, fetchMonthlyRevenue,
  StripeRevenueStats, TransactionRow, RevenueRow,
} from "../adminSupabaseService";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const CARD: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: "20px",
};

const GOLD_CARD: React.CSSProperties = {
  ...CARD,
  border: "1px solid rgba(212,175,55,0.2)",
  background: "rgba(212,175,55,0.04)",
};

function StatCard({
  label, value, sub, icon, color = "#fff", trend,
}: { label: string; value: string; sub?: string; icon: React.ReactNode; color?: string; trend?: number }) {
  return (
    <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: trend >= 0 ? "#4ade80" : "#f87171" }}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p style={{ fontSize: 24, fontWeight: 900, color, margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "4px 0 0", fontWeight: 600 }}>{label}</p>
        {sub && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0f0f1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px" }}>
      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 5px" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ fontSize: 13, fontWeight: 700, color: p.color, margin: "2px 0" }}>
          ${p.value?.toLocaleString()} <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400, fontSize: 11 }}>{p.name}</span>
        </p>
      ))}
    </div>
  );
}

function exportCSV(rows: TransactionRow[]) {
  const header = ["ID", "User", "Country", "Package", "Amount", "Date", "Status"].join(",");
  const lines  = rows.map((r) =>
    [r.id, `"${r.user}"`, r.country, `"${r.pkg}"`, r.amount, r.date, r.status].join(",")
  );
  const csv   = [header, ...lines].join("\n");
  const blob  = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url   = URL.createObjectURL(blob);
  const link  = document.createElement("a");
  link.href   = url;
  link.download = `2ghost_payments_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminStripeReportPage() {
  const [stats,    setStats]    = useState<StripeRevenueStats | null>(null);
  const [payments, setPayments] = useState<TransactionRow[]>([]);
  const [revenue,  setRevenue]  = useState<RevenueRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"all" | "paid" | "failed" | "refunded">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [s, p, r] = await Promise.all([fetchStripeStats(), fetchAllPayments(), fetchMonthlyRevenue()]);
    setStats(s);
    setPayments(p);
    setRevenue(r);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const trend = stats && stats.lastMonthRevenue > 0
    ? ((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100
    : 0;

  const filtered = payments.filter((p) => filter === "all" || p.status === filter);

  const statusColor = (s: string) =>
    s === "paid" ? "#4ade80" : s === "failed" ? "#ef4444" : s === "refunded" ? "#f59e0b" : "rgba(255,255,255,0.4)";
  const statusBg = (s: string) =>
    s === "paid" ? "rgba(74,222,128,0.1)" : s === "failed" ? "rgba(239,68,68,0.1)" : s === "refunded" ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)";

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Stripe Revenue</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            Live payments data · all products · all countries
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => exportCSV(filtered)}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.08)", color: "#d4af37", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={load}
            style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : undefined} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard
          label="Total Revenue"
          value={loading ? "…" : `$${(stats?.totalRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="All-time paid"
          icon={<DollarSign size={18} color="#d4af37" />}
          color="#d4af37"
        />
        <StatCard
          label="This Month (MRR)"
          value={loading ? "…" : `$${(stats?.thisMonthRevenue ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={`vs $${(stats?.lastMonthRevenue ?? 0).toFixed(2)} last month`}
          icon={<TrendingUp size={18} color="#4ade80" />}
          color="#4ade80"
          trend={trend}
        />
        <StatCard
          label="ARPU"
          value={loading ? "…" : `$${stats?.arpu ?? "0.00"}`}
          sub="Avg revenue per transaction"
          icon={<Users size={18} color="#60a5fa" />}
          color="#60a5fa"
        />
        <StatCard
          label="Total Transactions"
          value={loading ? "…" : String(stats?.totalTransactions ?? 0)}
          sub={`${stats?.failedCount ?? 0} failed · ${stats?.refundedCount ?? 0} refunded`}
          icon={<CreditCard size={18} color="#a78bfa" />}
          color="#a78bfa"
        />
      </div>

      {/* Revenue chart + breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 24 }}>
        {/* Area chart */}
        <div style={CARD}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "0 0 18px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Monthly Revenue</p>
          {loading ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenue}>
                <defs>
                  <linearGradient id="colGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Total" stroke="#d4af37" strokeWidth={2} fill="url(#colGold)" />
                <Area type="monotone" dataKey="gold"    name="Gold"  stroke="#4ade80" strokeWidth={1.5} fill="url(#colGreen)" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tier breakdown */}
        <div style={GOLD_CARD}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(212,175,55,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>Product Breakdown</p>

          {[
            { label: "Gold Room",   count: stats?.goldCount  ?? 0, price: 9.99,  color: "#d4af37" },
            { label: "Ghost Suite", count: stats?.suiteCount ?? 0, price: 4.99,  color: "#4ade80" },
          ].map((pkg) => {
            const total     = (stats?.totalTransactions ?? 0) || 1;
            const pct       = Math.round((pkg.count / total) * 100);
            const revenue   = pkg.count * pkg.price;
            return (
              <div key={pkg.label} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: pkg.color }}>{pkg.label}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{pkg.count} × ${pkg.price}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 4 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pkg.color, borderRadius: 3, transition: "width 0.6s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{pct}% of transactions</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: pkg.color }}>${revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            );
          })}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, marginTop: 4 }}>
            {[
              { label: "Failed Payments",   value: stats?.failedCount   ?? 0, color: "#ef4444", icon: <AlertCircle size={11} /> },
              { label: "Refunds",           value: stats?.refundedCount ?? 0, color: "#f59e0b", icon: <TrendingDown size={11} /> },
              { label: "Success Rate",      value: stats ? `${((stats.totalTransactions / Math.max(stats.totalTransactions + stats.failedCount, 1)) * 100).toFixed(1)}%` : "—", color: "#4ade80", icon: <CheckCircle2 size={11} /> },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                  <span style={{ color: r.color }}>{r.icon}</span>{r.label}
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: r.color }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction table */}
      <div style={CARD}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>Transactions</p>
          <div style={{ display: "flex", gap: 6 }}>
            {(["all", "paid", "failed", "refunded"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  height: 28, padding: "0 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: filter === f ? statusBg(f === "all" ? "paid" : f) : "rgba(255,255,255,0.04)",
                  border: filter === f ? `1px solid ${statusColor(f === "all" ? "paid" : f)}40` : "1px solid rgba(255,255,255,0.07)",
                  color: filter === f ? statusColor(f === "all" ? "paid" : f) : "rgba(255,255,255,0.4)",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Loading transactions…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No transactions found</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["ID", "User", "Package", "Amount", "Date", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid rgba(255,255,255,0.06)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: 11 }}>{t.id}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{t.country} {t.user}</span>
                    </td>
                    <td style={{ padding: "10px 12px", color: t.pkg.includes("Gold") ? "#d4af37" : "#4ade80", fontWeight: 700, fontSize: 12 }}>{t.pkg}</td>
                    <td style={{ padding: "10px 12px", color: "#fff", fontWeight: 800 }}>{t.amount}</td>
                    <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{t.date}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontSize: 10, fontWeight: 800, borderRadius: 5, padding: "2px 7px", background: statusBg(t.status), color: statusColor(t.status), textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {t.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
              {filtered.length} transactions · Total: <strong style={{ color: "#fff" }}>
                ${filtered.filter(t => t.status === "paid").reduce((s, t) => s + parseFloat(t.amount.replace("$", "")), 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </p>
            <button
              onClick={() => exportCSV(filtered)}
              style={{ display: "flex", alignItems: "center", gap: 5, height: 30, padding: "0 12px", borderRadius: 7, border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.07)", color: "#d4af37", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              <Download size={11} /> Export CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
