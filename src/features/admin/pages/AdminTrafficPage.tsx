import { useEffect, useState, useCallback } from "react";
import { ghostSupabase } from "../../ghost/ghostSupabase";
import { RefreshCw, Users, Clock, Globe, TrendingUp, Monitor, Smartphone, Tablet, Eye, ArrowUpRight, ArrowDownRight } from "lucide-react";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
// ── Types ──────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  ghost_id: string | null;
  country: string;
  country_code: string;
  country_flag: string;
  city: string;
  ip: string;
  device: string;
  browser: string;
  referrer: string | null;
  started_at: string;
  ended_at: string | null;
  page_count: number;
  duration_secs: number | null;
}

interface PageView {
  id: string;
  session_id: string;
  path: string;
  page_label: string;
  entered_at: string;
  exited_at: string | null;
  duration_secs: number | null;
}

interface PageStat {
  path: string;
  label: string;
  views: number;
  avg_secs: number;
  exits: number;
  exit_rate: number;
}

interface CountryStat {
  country: string;
  country_flag: string;
  sessions: number;
  pct: number;
}

interface HourBucket {
  hour: number;
  day: number; // 0=Sun
  count: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isConnected(): boolean {
  const url = import.meta.env.VITE_GHOST_SUPABASE_URL as string | undefined;
  return !!url && !url.includes("placeholder");
}

function fmtDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function sinceNow(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Mock data for demo mode ────────────────────────────────────────────────

function buildMockSessions(): Session[] {
  const countries = [
    { country: "Indonesia", country_code: "ID", country_flag: "🇮🇩", city: "Jakarta" },
    { country: "Philippines", country_code: "PH", country_flag: "🇵🇭", city: "Manila" },
    { country: "United States", country_code: "US", country_flag: "🇺🇸", city: "New York" },
    { country: "Singapore", country_code: "SG", country_flag: "🇸🇬", city: "Singapore" },
    { country: "Australia", country_code: "AU", country_flag: "🇦🇺", city: "Sydney" },
    { country: "United Kingdom", country_code: "GB", country_flag: "🇬🇧", city: "London" },
    { country: "Malaysia", country_code: "MY", country_flag: "🇲🇾", city: "Kuala Lumpur" },
  ];
  const devices  = ["mobile", "mobile", "mobile", "desktop", "tablet"];
  const browsers = ["Chrome", "Safari", "Chrome", "Firefox", "Edge"];
  const now = Date.now();

  return Array.from({ length: 60 }, (_, i) => {
    const c = countries[Math.floor(Math.random() * countries.length)];
    const startedMs = now - Math.random() * 7 * 86400 * 1000;
    const duration  = Math.floor(Math.random() * 600 + 20);
    return {
      id:           `mock-${i}`,
      ghost_id:     Math.random() > 0.4 ? `user-${i}` : null,
      country:      c.country,
      country_code: c.country_code,
      country_flag: c.country_flag,
      city:         c.city,
      ip:           `103.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      device:       devices[Math.floor(Math.random() * devices.length)],
      browser:      browsers[Math.floor(Math.random() * browsers.length)],
      referrer:     Math.random() > 0.6 ? null : "https://instagram.com",
      started_at:   new Date(startedMs).toISOString(),
      ended_at:     new Date(startedMs + duration * 1000).toISOString(),
      page_count:   Math.floor(Math.random() * 8 + 1),
      duration_secs: duration,
    };
  });
}

function buildMockPageviews(): PageView[] {
  const pages = [
    { path: "/ghost",           label: "Landing" },
    { path: "/auth",      label: "Sign Up / Login" },
    { path: "/setup",     label: "Profile Setup" },
    { path: "/mode",      label: "Ghost Mode" },
    { path: "/mock",      label: "Browse Profiles" },
    { path: "/pricing",   label: "Pricing" },
    { path: "/room",      label: "Ghost Room" },
    { path: "/dashboard", label: "Dashboard" },
  ];
  const now = Date.now();
  return Array.from({ length: 220 }, (_, i) => {
    const p = pages[Math.floor(Math.random() * pages.length)];
    const enteredMs = now - Math.random() * 7 * 86400 * 1000;
    const dur = Math.floor(Math.random() * 300 + 5);
    return {
      id:           `pv-${i}`,
      session_id:   `mock-${Math.floor(Math.random() * 60)}`,
      path:         p.path,
      page_label:   p.label,
      entered_at:   new Date(enteredMs).toISOString(),
      exited_at:    new Date(enteredMs + dur * 1000).toISOString(),
      duration_secs: dur,
    };
  });
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, trend }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; trend?: number;
}) {
  const a = useGenderAccent();
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14, padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: a.glow(0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} style={{ color: a.accent }} />
        </div>
      </div>
      <p style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 4px", lineHeight: 1 }}>{value}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {trend !== undefined && (
          trend >= 0
            ? <ArrowUpRight size={12} style={{ color: a.accent }} />
            : <ArrowDownRight size={12} style={{ color: "#ef4444" }} />
        )}
        {sub && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{sub}</span>}
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>{title}</p>
      {children}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminTrafficPage() {
  const a = useGenderAccent();
  const [sessions,   setSessions]   = useState<Session[]>([]);
  const [pageviews,  setPageviews]  = useState<PageView[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [range,      setRange]      = useState<7 | 30>(7);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!isConnected()) {
        setSessions(buildMockSessions());
        setPageviews(buildMockPageviews());
        return;
      }
      const since = new Date(Date.now() - range * 86400 * 1000).toISOString();
      const [{ data: s }, { data: p }] = await Promise.all([
        ghostSupabase
          .from("ghost_analytics_sessions")
          .select("*")
          .gte("started_at", since)
          .order("started_at", { ascending: false })
          .limit(500),
        ghostSupabase
          .from("ghost_analytics_pageviews")
          .select("*")
          .gte("entered_at", since)
          .order("entered_at", { ascending: false })
          .limit(2000),
      ]);
      setSessions((s as Session[]) || []);
      setPageviews((p as PageView[]) || []);
    } finally {
      setLoading(false);
      setLastRefresh(Date.now());
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);

  // ── Derived stats ──────────────────────────────────────────────────────

  const totalSessions = sessions.length;
  const uniqueUsers   = new Set(sessions.filter(s => s.ghost_id).map(s => s.ghost_id)).size;

  const durSessions   = sessions.filter(s => s.duration_secs != null && s.duration_secs > 0);
  const avgDuration   = durSessions.length > 0
    ? Math.round(durSessions.reduce((a, s) => a + (s.duration_secs || 0), 0) / durSessions.length)
    : 0;

  const totalPageviews = pageviews.length;
  const avgPagesPerSess = totalSessions > 0 ? (totalPageviews / totalSessions).toFixed(1) : "0";

  // Bounce: sessions with 1 page view
  const pvBySess = pageviews.reduce<Record<string, number>>((acc, pv) => {
    acc[pv.session_id] = (acc[pv.session_id] || 0) + 1;
    return acc;
  }, {});
  const bounces   = sessions.filter(s => (pvBySess[s.id] || 0) <= 1).length;
  const bounceRate = totalSessions > 0 ? Math.round((bounces / totalSessions) * 100) : 0;

  // Active now (sessions started in last 5 min)
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const activeNow  = sessions.filter(s => new Date(s.started_at).getTime() > fiveMinAgo).length;

  // Country breakdown
  const countryMap: Record<string, { country: string; country_flag: string; count: number }> = {};
  for (const s of sessions) {
    if (!countryMap[s.country_code]) countryMap[s.country_code] = { country: s.country, country_flag: s.country_flag, count: 0 };
    countryMap[s.country_code].count++;
  }
  const countryStats: CountryStat[] = Object.values(countryMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map(c => ({ country: c.country, country_flag: c.country_flag, sessions: c.count, pct: Math.round((c.count / totalSessions) * 100) }));

  // Device breakdown
  const deviceMap: Record<string, number> = {};
  for (const s of sessions) deviceMap[s.device] = (deviceMap[s.device] || 0) + 1;

  // Page stats
  const pageMap: Record<string, { label: string; views: number; total_secs: number; exits: number }> = {};
  for (const pv of pageviews) {
    if (!pageMap[pv.path]) pageMap[pv.path] = { label: pv.page_label, views: 0, total_secs: 0, exits: 0 };
    pageMap[pv.path].views++;
    if (pv.duration_secs) pageMap[pv.path].total_secs += pv.duration_secs;
    if (pv.exited_at) pageMap[pv.path].exits++;
  }
  const pageStats: PageStat[] = Object.entries(pageMap)
    .map(([path, d]) => ({
      path,
      label:     d.label,
      views:     d.views,
      avg_secs:  d.views > 0 ? Math.round(d.total_secs / d.views) : 0,
      exits:     d.exits,
      exit_rate: d.views > 0 ? Math.round((d.exits / d.views) * 100) : 0,
    }))
    .sort((a, b) => b.views - a.views);

  // Hourly heatmap (last 7 days × 24 hours)
  const heatmap: HourBucket[] = [];
  const heatGrid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const s of sessions) {
    const d = new Date(s.started_at);
    heatGrid[d.getDay()][d.getHours()]++;
  }
  const maxHeat = Math.max(1, ...heatGrid.flat());

  // Daily traffic for the mini bar chart
  const dayBuckets: Record<string, number> = {};
  for (const s of sessions) {
    const d = new Date(s.started_at).toLocaleDateString([], { month: "short", day: "numeric" });
    dayBuckets[d] = (dayBuckets[d] || 0) + 1;
  }
  // Get last N days in order
  const chartDays: { label: string; count: number }[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400 * 1000);
    const label = d.toLocaleDateString([], { month: "short", day: "numeric" });
    chartDays.push({ label, count: dayBuckets[label] || 0 });
  }
  const maxBar = Math.max(1, ...chartDays.map(d => d.count));

  // Recent sessions (last 10)
  const recentSessions = [...sessions].slice(0, 12);

  const deviceIcon = (device: string) => {
    if (device === "mobile")  return <Smartphone size={11} />;
    if (device === "tablet")  return <Tablet size={11} />;
    return <Monitor size={11} />;
  };

  return (
    <div style={{ padding: "28px 32px", minHeight: "100vh", background: "#06060e", color: "#fff" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>Traffic Analytics</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            {loading ? "Loading…" : `${totalSessions} sessions · refreshed ${sinceNow(new Date(lastRefresh).toISOString())}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Range selector */}
          {([7, 30] as const).map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
              background: range === r ? a.glow(0.15) : "rgba(255,255,255,0.04)",
              border: range === r ? `1px solid ${a.glow(0.35)}` : "1px solid rgba(255,255,255,0.08)",
              color: range === r ? "#4ade80" : "rgba(255,255,255,0.5)",
            }}>
              {r}d
            </button>
          ))}
          <button onClick={load} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)",
          }}>
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 28 }}>
        <StatCard label="Sessions"       value={totalSessions.toLocaleString()} sub={`last ${range} days`} icon={Users} />
        <StatCard label="Active Now"     value={activeNow.toString()}           sub="last 5 min"           icon={TrendingUp} trend={activeNow} />
        <StatCard label="Logged-in Users" value={uniqueUsers.toString()}        sub="with ghost_id"        icon={Users} />
        <StatCard label="Avg Duration"   value={fmtDuration(avgDuration)}       sub="per session"          icon={Clock} />
        <StatCard label="Pages / Session" value={avgPagesPerSess}               sub={`${totalPageviews.toLocaleString()} total`} icon={Eye} />
        <StatCard label="Bounce Rate"    value={`${bounceRate}%`}               sub="1-page sessions"      icon={ArrowUpRight} trend={-bounceRate} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 24 }}>

        {/* ── Daily traffic bar chart ── */}
        <Section title={`Daily Sessions — Last ${range} Days`}>
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "18px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100 }}>
              {chartDays.map((d, i) => {
                const h = Math.max(3, Math.round((d.count / maxBar) * 90));
                const isToday = i === chartDays.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }} title={`${d.label}: ${d.count} sessions`}>
                    <div style={{
                      width: "100%", height: h,
                      background: isToday ? "#4ade80" : a.glow(0.35),
                      borderRadius: "3px 3px 0 0",
                      transition: "height 0.3s ease",
                    }} />
                  </div>
                );
              })}
            </div>
            {/* X axis labels — show every ~4th */}
            <div style={{ display: "flex", marginTop: 6, gap: 4 }}>
              {chartDays.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                  {(i === 0 || i % Math.max(1, Math.floor(range / 7)) === 0 || i === chartDays.length - 1) ? d.label : ""}
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Device breakdown ── */}
        <Section title="Device Type">
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "18px 20px", height: "100%", boxSizing: "border-box",
          }}>
            {["mobile", "desktop", "tablet"].map(d => {
              const count = deviceMap[d] || 0;
              const pct   = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
              const icon  = d === "mobile" ? Smartphone : d === "tablet" ? Tablet : Monitor;
              const IconC = icon;
              return (
                <div key={d} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <IconC size={13} style={{ color: "rgba(255,255,255,0.5)" }} />
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textTransform: "capitalize" }}>{d}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: a.accent, borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

        {/* ── Country breakdown ── */}
        <Section title="Top Countries">
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, overflow: "hidden",
          }}>
            {countryStats.length === 0 && (
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", padding: 24, margin: 0, fontSize: 13 }}>No data</p>
            )}
            {countryStats.map((c, i) => (
              <div key={c.country} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 16px",
                borderBottom: i < countryStats.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <span style={{ fontSize: 18 }}>{c.country_flag}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{c.country}</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{c.sessions} · {c.pct}%</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${c.pct}%`, background: a.glow(0.55), borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Page analytics ── */}
        <Section title="Page Analytics">
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, overflow: "hidden",
          }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 60px 60px 60px",
              padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              {["Page", "Views", "Avg Time", "Exit %"].map(h => (
                <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: h === "Page" ? "left" : "right" }}>{h}</span>
              ))}
            </div>
            {pageStats.length === 0 && (
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", padding: 24, margin: 0, fontSize: 13 }}>No data</p>
            )}
            {pageStats.map((p, i) => (
              <div key={p.path} style={{
                display: "grid", gridTemplateColumns: "1fr 60px 60px 60px",
                padding: "10px 14px", alignItems: "center",
                borderBottom: i < pageStats.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", margin: "0 0 1px" }}>{p.label}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, fontFamily: "monospace" }}>{p.path}</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", textAlign: "right" }}>{p.views.toLocaleString()}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", textAlign: "right" }}>{fmtDuration(p.avg_secs)}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700, textAlign: "right",
                  color: p.exit_rate > 60 ? "#ef4444" : p.exit_rate > 35 ? "#f59e0b" : a.accent,
                }}>{p.exit_rate}%</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Hourly heatmap ── */}
      <Section title="Activity Heatmap — Hour × Day (last 7 days)">
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, padding: "18px 20px", overflowX: "auto",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "40px repeat(24, 1fr)", gap: 3, minWidth: 640 }}>
            {/* Hour labels row */}
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", textAlign: "center", paddingBottom: 4 }}>
                {h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`}
              </div>
            ))}
            {/* Day rows */}
            {DAY_NAMES.map((day, dayIdx) => (
              <>
                <div key={`label-${day}`} style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", paddingRight: 8 }}>{day}</div>
                {Array.from({ length: 24 }, (_, h) => {
                  const val = heatGrid[dayIdx][h];
                  const intensity = val / maxHeat;
                  return (
                    <div
                      key={`${dayIdx}-${h}`}
                      title={`${day} ${h}:00 — ${val} sessions`}
                      style={{
                        height: 18, borderRadius: 3,
                        background: val === 0
                          ? "rgba(255,255,255,0.04)"
                          : `rgba(74,222,128,${0.15 + intensity * 0.75})`,
                      }}
                    />
                  );
                })}
              </>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Less</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
              <div key={v} style={{ width: 14, height: 14, borderRadius: 3, background: `rgba(74,222,128,${v})` }} />
            ))}
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>More</span>
          </div>
        </div>
      </Section>

      {/* ── Recent Sessions ── */}
      <Section title="Recent Sessions">
        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 14, overflow: "hidden",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "140px 180px 80px 70px 70px 80px 90px",
            padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            {["Started", "Location", "IP", "Device", "Browser", "Duration", "Pages"].map(h => (
              <span key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>

          {recentSessions.length === 0 && (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", padding: 24, margin: 0, fontSize: 13 }}>No sessions yet</p>
          )}

          {recentSessions.map((s, i) => (
            <div key={s.id} style={{
              display: "grid", gridTemplateColumns: "140px 180px 80px 70px 70px 80px 90px",
              padding: "10px 16px", alignItems: "center",
              borderBottom: i < recentSessions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              background: s.ghost_id ? "transparent" : "rgba(239,68,68,0.02)",
            }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", margin: "0 0 1px" }}>{fmtTime(s.started_at)}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{fmtDate(s.started_at)}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>{s.country_flag}</span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", margin: "0 0 1px" }}>{s.city}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{s.country}</p>
                </div>
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{s.ip.split(".").slice(0, 3).join(".")}.•••</span>
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                {deviceIcon(s.device)}
                <span style={{ textTransform: "capitalize" }}>{s.device}</span>
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{s.browser}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: s.duration_secs && s.duration_secs > 60 ? "#4ade80" : "rgba(255,255,255,0.55)" }}>
                {s.duration_secs ? fmtDuration(s.duration_secs) : "—"}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{s.page_count}</span>
                {s.ghost_id && (
                  <span style={{ fontSize: 9, background: a.glow(0.15), color: a.accent, borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>User</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
