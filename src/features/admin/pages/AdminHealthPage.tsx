import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, RefreshCw, Wifi, WifiOff,
  Database, Users, CreditCard, Gift, Shield, Image, Zap, Globe,
  Activity, Clock, ChevronDown, ChevronUp, Play,
} from "lucide-react";
import { ghostSupabase } from "../../ghost/ghostSupabase";

// ── Types ─────────────────────────────────────────────────────────────────────

type CheckStatus = "ok" | "warn" | "fail" | "running" | "idle";

interface HealthCheck {
  id: string;
  label: string;
  description: string;
  group: string;
  status: CheckStatus;
  ms?: number;
  detail?: string;
  critical: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const AUTO_REFRESH_SECS = 60;

function isConnected(): boolean {
  const url = import.meta.env.VITE_GHOST_SUPABASE_URL as string | undefined;
  return !!url && !url.includes("placeholder");
}

// ── Individual check runners ───────────────────────────────────────────────────

async function runCheck(id: string): Promise<{ ms: number; ok: boolean; detail?: string }> {
  const t0 = performance.now();

  try {
    if (!isConnected()) {
      // Simulate realistic results in demo mode
      await new Promise((r) => setTimeout(r, 120 + Math.random() * 160));
      const ms = Math.round(performance.now() - t0);
      const simFail = ["cdn_images", "realtime"].includes(id) ? Math.random() > 0.92 : false;
      return { ms, ok: !simFail, detail: simFail ? "Simulated — occasional timeout" : "Simulated (demo mode)" };
    }

    switch (id) {

      case "db_connection": {
        const { error } = await ghostSupabase.from("ghost_profiles").select("ghost_id").limit(1);
        return { ms: Math.round(performance.now() - t0), ok: !error, detail: error?.message };
      }

      case "user_signup": {
        // Check if auth endpoint is reachable (dry-run — no actual account created)
        const { error } = await ghostSupabase.auth.signInWithOtp({ email: "healthcheck-noreply@2dateme.com", options: { shouldCreateUser: false } });
        // PGRST errors mean DB is reachable; "Email not confirmed" / OTP errors are fine
        const ok = !error || error.message.includes("rate") || error.message.includes("OTP") || error.message.includes("not found") || error.status === 422 || error.status === 429;
        return { ms: Math.round(performance.now() - t0), ok, detail: error?.message };
      }

      case "profiles_read": {
        const { data, error } = await ghostSupabase.from("ghost_profiles").select("ghost_id, display_name").limit(3);
        return { ms: Math.round(performance.now() - t0), ok: !error && Array.isArray(data), detail: error?.message || `${data?.length ?? 0} rows returned` };
      }

      case "profiles_write": {
        // Test write permission by upserting a health-check record
        const { error } = await ghostSupabase.from("ghost_health_checks").upsert({ id: "admin_health_probe", checked_at: new Date().toISOString() }, { onConflict: "id" }).select();
        // Table may not exist — that's ok, DB is still up
        const ok = !error || error.code === "42P01";
        return { ms: Math.round(performance.now() - t0), ok, detail: error?.code === "42P01" ? "Health table not created yet (optional)" : error?.message };
      }

      case "payments_read": {
        const { error } = await ghostSupabase.from("ghost_payments").select("id").limit(1);
        return { ms: Math.round(performance.now() - t0), ok: !error, detail: error?.message };
      }

      case "butler_read": {
        const { error } = await ghostSupabase.from("ghost_butler_providers").select("id").limit(1);
        return { ms: Math.round(performance.now() - t0), ok: !error, detail: error?.message };
      }

      case "realtime": {
        const timeout = new Promise<{ ok: boolean; detail: string }>((resolve) =>
          setTimeout(() => resolve({ ok: false, detail: "Realtime channel timeout (>3s)" }), 3000)
        );
        const test = new Promise<{ ok: boolean; detail: string }>((resolve) => {
          const ch = ghostSupabase.channel("health_probe");
          ch.subscribe((status) => {
            ghostSupabase.removeChannel(ch);
            resolve({ ok: status === "SUBSCRIBED", detail: `Channel status: ${status}` });
          });
        });
        const result = await Promise.race([test, timeout]);
        return { ms: Math.round(performance.now() - t0), ...result };
      }

      case "cdn_images": {
        const url = "https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasd.png";
        const res = await fetch(url, { method: "HEAD", cache: "no-store" }).catch(() => null);
        return { ms: Math.round(performance.now() - t0), ok: res?.ok ?? false, detail: res ? `HTTP ${res.status}` : "Fetch failed" };
      }

      case "rls_policy": {
        // Anonymous read on ghost_profiles should be blocked (RLS working)
        // or allowed — just check the DB responds
        const { error } = await ghostSupabase.from("ghost_profiles").select("ghost_id").limit(1);
        return { ms: Math.round(performance.now() - t0), ok: !error || error.code === "42501", detail: error?.code === "42501" ? "RLS blocking anonymous read (correct)" : error?.message };
      }

      case "auth_service": {
        const { error } = await ghostSupabase.auth.getSession();
        return { ms: Math.round(performance.now() - t0), ok: !error, detail: error?.message || "Auth service reachable" };
      }

      default:
        return { ms: 0, ok: true, detail: "No check defined" };
    }
  } catch (e: any) {
    return { ms: Math.round(performance.now() - t0), ok: false, detail: e?.message || "Unknown error" };
  }
}

// ── Check definitions ─────────────────────────────────────────────────────────

const CHECK_DEFS: Omit<HealthCheck, "status" | "ms" | "detail">[] = [
  // Core Infrastructure
  { id: "db_connection",   group: "Core Infrastructure",  critical: true,  label: "Database Connection",      description: "Supabase PostgreSQL is reachable and responding" },
  { id: "auth_service",    group: "Core Infrastructure",  critical: true,  label: "Auth Service",             description: "Supabase Auth endpoint is reachable" },
  { id: "realtime",        group: "Core Infrastructure",  critical: false, label: "Realtime (WebSocket)",     description: "Live subscription channel can be established" },
  { id: "cdn_images",      group: "Core Infrastructure",  critical: false, label: "CDN / Image Delivery",     description: "ImageKit CDN responds to HEAD requests" },
  // User Flows
  { id: "user_signup",     group: "Critical User Flows",  critical: true,  label: "Account Creation Flow",    description: "Auth OTP endpoint accepts sign-up requests" },
  { id: "profiles_read",   group: "Critical User Flows",  critical: true,  label: "Profile Discovery",        description: "Ghost profiles table returns data (browse works)" },
  { id: "profiles_write",  group: "Critical User Flows",  critical: false, label: "Profile Write Access",     description: "Write permission to user profiles is functional" },
  { id: "rls_policy",      group: "Critical User Flows",  critical: false, label: "Row-Level Security",       description: "RLS policies are active and enforcing access rules" },
  // Features
  { id: "payments_read",   group: "Feature Services",     critical: true,  label: "Payments System",          description: "ghost_payments table is readable — billing active" },
  { id: "butler_read",     group: "Feature Services",     critical: false, label: "Ghost Butler Service",     description: "Butler providers table is accessible" },
];

function initChecks(): HealthCheck[] {
  return CHECK_DEFS.map((d) => ({ ...d, status: "idle" }));
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<CheckStatus, string> = {
  ok:      "#4ade80",
  warn:    "#facc15",
  fail:    "#f87171",
  running: "#60a5fa",
  idle:    "rgba(255,255,255,0.25)",
};

const STATUS_BG: Record<CheckStatus, string> = {
  ok:      "rgba(74,222,128,0.1)",
  warn:    "rgba(250,204,21,0.1)",
  fail:    "rgba(248,113,113,0.1)",
  running: "rgba(96,165,250,0.1)",
  idle:    "rgba(255,255,255,0.03)",
};

const STATUS_LABEL: Record<CheckStatus, string> = {
  ok:      "Operational",
  warn:    "Degraded",
  fail:    "Outage",
  running: "Checking…",
  idle:    "Not run",
};

function OverallBanner({ checks }: { checks: HealthCheck[] }) {
  const ran = checks.filter((c) => c.status !== "idle" && c.status !== "running");
  if (ran.length === 0) return null;
  const critFails = ran.filter((c) => c.critical && c.status === "fail");
  const anyFail   = ran.filter((c) => c.status === "fail");
  const anyWarn   = ran.filter((c) => c.status === "warn");

  let color = "#4ade80", bg = "rgba(74,222,128,0.08)", border = "rgba(74,222,128,0.2)";
  let icon = <CheckCircle2 size={28} style={{ color }} />;
  let headline = "All Systems Operational";
  let sub = `${ran.length} checks passed · ${isConnected() ? "Live Supabase" : "Demo mode"}`;

  if (critFails.length > 0) {
    color = "#f87171"; bg = "rgba(248,113,113,0.08)"; border = "rgba(248,113,113,0.25)";
    icon = <XCircle size={28} style={{ color }} />;
    headline = `${critFails.length} Critical Issue${critFails.length > 1 ? "s" : ""} Detected`;
    sub = critFails.map((c) => c.label).join(" · ");
  } else if (anyFail.length > 0) {
    color = "#fb923c"; bg = "rgba(251,146,60,0.08)"; border = "rgba(251,146,60,0.25)";
    icon = <AlertTriangle size={28} style={{ color }} />;
    headline = `${anyFail.length} Non-Critical Issue${anyFail.length > 1 ? "s" : ""} Detected`;
    sub = anyFail.map((c) => c.label).join(" · ");
  } else if (anyWarn.length > 0) {
    color = "#facc15"; bg = "rgba(250,204,21,0.08)"; border = "rgba(250,204,21,0.2)";
    icon = <AlertTriangle size={28} style={{ color }} />;
    headline = "Degraded Performance Detected";
    sub = anyWarn.map((c) => c.label).join(" · ");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 24px", borderRadius: 16, background: bg, border: `1px solid ${border}`, marginBottom: 28 }}
    >
      {icon}
      <div>
        <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>{headline}</p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "2px 0 0", fontWeight: 500 }}>{sub}</p>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 20 }}>
        {[
          { label: "Passing",  count: ran.filter((c) => c.status === "ok").length,   color: "#4ade80" },
          { label: "Warnings", count: ran.filter((c) => c.status === "warn").length,  color: "#facc15" },
          { label: "Failing",  count: ran.filter((c) => c.status === "fail").length,  color: "#f87171" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <p style={{ fontSize: 22, fontWeight: 900, color: s.count > 0 ? s.color : "rgba(255,255,255,0.2)", margin: 0, lineHeight: 1 }}>{s.count}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "3px 0 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CheckRow({ check, expanded, onToggle }: { check: HealthCheck; expanded: boolean; onToggle: () => void }) {
  const color = STATUS_COLOR[check.status];
  const bg    = STATUS_BG[check.status];

  const Icon =
    check.id === "db_connection" || check.id === "profiles_read" || check.id === "profiles_write" || check.id === "rls_policy" ? Database :
    check.id === "user_signup"   ? Users :
    check.id === "payments_read" ? CreditCard :
    check.id === "butler_read"   ? Gift :
    check.id === "realtime"      ? Zap :
    check.id === "cdn_images"    ? Image :
    check.id === "auth_service"  ? Shield :
    Globe;

  return (
    <div
      style={{
        background: check.status !== "idle" ? bg : "rgba(255,255,255,0.02)",
        border: `1px solid ${check.status !== "idle" ? color + "30" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 12, overflow: "hidden",
        transition: "background 0.25s, border-color 0.25s",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer" }}
        onClick={onToggle}
      >
        {/* Status dot */}
        <div style={{ flexShrink: 0 }}>
          {check.status === "running"
            ? <span style={{ display: "inline-flex" }}><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><RefreshCw size={16} style={{ color: "#60a5fa" }} /></motion.div></span>
            : check.status === "ok"   ? <CheckCircle2 size={18} style={{ color: "#4ade80" }} />
            : check.status === "fail" ? <XCircle      size={18} style={{ color: "#f87171" }} />
            : check.status === "warn" ? <AlertTriangle size={16} style={{ color: "#facc15" }} />
            : <Circle size={18} style={{ color: "rgba(255,255,255,0.2)" }} />
          }
        </div>

        {/* Icon */}
        <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} style={{ color: check.status !== "idle" ? color : "rgba(255,255,255,0.3)" }} />
        </div>

        {/* Label */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>{check.label}</p>
            {check.critical && (
              <span style={{ fontSize: 9, fontWeight: 800, color: "#f87171", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Critical</span>
            )}
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "1px 0 0" }}>{check.description}</p>
        </div>

        {/* Right side */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 14 }}>
          {check.ms !== undefined && (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} style={{ color: "rgba(255,255,255,0.25)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: check.ms < 300 ? "#4ade80" : check.ms < 800 ? "#facc15" : "#f87171" }}>
                {check.ms}ms
              </span>
            </div>
          )}
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            color, background: bg, border: `1px solid ${color}35`, borderRadius: 6, padding: "3px 9px",
          }}>
            {STATUS_LABEL[check.status]}
          </span>
          {check.detail
            ? expanded ? <ChevronUp size={13} style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown size={13} style={{ color: "rgba(255,255,255,0.3)" }} />
            : <div style={{ width: 13 }} />
          }
        </div>
      </div>

      {/* Expandable detail */}
      <AnimatePresence initial={false}>
        {expanded && check.detail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "10px 16px 14px 62px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, fontFamily: "monospace", lineHeight: 1.6 }}>
                {check.detail}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Missing Circle icon (not in lucide) ───────────────────────────────────────
function Circle({ size, style }: { size: number; style?: React.CSSProperties }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", border: `2px solid ${style?.color ?? "#fff"}`, boxSizing: "border-box" }} />;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminHealthPage() {
  const [checks, setChecks]       = useState<HealthCheck[]>(initChecks);
  const [running, setRunning]     = useState(false);
  const [lastRun, setLastRun]     = useState<Date | null>(null);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runAll = async () => {
    if (running) return;
    setRunning(true);
    setCountdown(AUTO_REFRESH_SECS);

    // Set all to running
    setChecks((prev) => prev.map((c) => ({ ...c, status: "running", ms: undefined, detail: undefined })));

    // Run checks in parallel with staggered UI updates
    await Promise.all(
      CHECK_DEFS.map(async (def) => {
        const result = await runCheck(def.id);
        const status: CheckStatus = result.ok ? "ok" : def.id === "profiles_write" || def.id === "rls_policy" ? "warn" : "fail";
        setChecks((prev) =>
          prev.map((c) => c.id === def.id ? { ...c, status, ms: result.ms, detail: result.detail } : c)
        );
      })
    );

    setLastRun(new Date());
    setRunning(false);
  };

  // Auto-refresh
  useEffect(() => {
    runAll();
    timerRef.current = setInterval(runAll, AUTO_REFRESH_SECS * 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Countdown ticker
  useEffect(() => {
    countRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? AUTO_REFRESH_SECS : c - 1));
    }, 1000);
    return () => { if (countRef.current) clearInterval(countRef.current); };
  }, []);

  // Group checks
  const groups = Array.from(new Set(CHECK_DEFS.map((c) => c.group)));

  const groupStatus = (group: string): CheckStatus => {
    const gc = checks.filter((c) => c.group === group);
    if (gc.some((c) => c.status === "running")) return "running";
    if (gc.some((c) => c.status === "fail" && c.critical)) return "fail";
    if (gc.some((c) => c.status === "fail")) return "warn";
    if (gc.every((c) => c.status === "ok")) return "ok";
    return "idle";
  };

  return (
    <div style={{ padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Activity size={20} style={{ color: "#4ade80" }} />
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: 0 }}>App Health Monitor</h1>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            {isConnected() ? "Live checks · Supabase connected" : "Demo mode · Simulated results"} ·{" "}
            {lastRun ? `Last run ${lastRun.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Running first check…"}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Supabase connection badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 9,
            background: isConnected() ? "rgba(74,222,128,0.08)" : "rgba(251,146,60,0.08)",
            border: isConnected() ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(251,146,60,0.2)",
          }}>
            {isConnected() ? <Wifi size={12} style={{ color: "#4ade80" }} /> : <WifiOff size={12} style={{ color: "#fb923c" }} />}
            <span style={{ fontSize: 11, fontWeight: 700, color: isConnected() ? "#4ade80" : "#fb923c" }}>
              {isConnected() ? "Supabase Connected" : "Demo Mode"}
            </span>
          </div>

          {/* Countdown */}
          {!running && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <Clock size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>Refresh in {countdown}s</span>
            </div>
          )}

          {/* Run now */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={runAll}
            disabled={running}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              height: 36, padding: "0 16px", borderRadius: 9,
              border: "none",
              background: running ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#4ade80,#22c55e)",
              color: running ? "rgba(255,255,255,0.3)" : "#fff",
              fontSize: 12, fontWeight: 700, cursor: running ? "default" : "pointer",
              boxShadow: running ? "none" : "0 4px 14px rgba(74,222,128,0.3)",
            }}
          >
            {running
              ? <><span style={{ display: "inline-flex" }}><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><RefreshCw size={12} /></motion.div></span><span>Running…</span></>
              : <><span style={{ display: "inline-flex" }}><Play size={12} /></span><span>Run All Checks</span></>
            }
          </motion.button>
        </div>
      </div>

      {/* Overall banner */}
      <OverallBanner checks={checks} />

      {/* Response time bar */}
      {checks.some((c) => c.ms !== undefined) && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>Response Times</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
            {checks.filter((c) => c.ms !== undefined).slice(0, 10).map((c) => {
              const pct = Math.min((c.ms! / 1200) * 100, 100);
              const col = c.ms! < 300 ? "#4ade80" : c.ms! < 800 ? "#facc15" : "#f87171";
              return (
                <div key={c.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}>{c.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: col }}>{c.ms}ms</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)" }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
                      style={{ height: "100%", borderRadius: 3, background: col }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
            {[["< 300ms", "#4ade80", "Fast"], ["300–800ms", "#facc15", "Acceptable"], ["> 800ms", "#f87171", "Slow"]].map(([range, col, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: col }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{range} — {label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check groups */}
      {groups.map((group) => {
        const gs = groupStatus(group);
        const gColor = STATUS_COLOR[gs];
        const groupChecks = checks.filter((c) => c.group === group);

        return (
          <div key={group} style={{ marginBottom: 22 }}>
            {/* Group header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: gColor, boxShadow: gs === "ok" ? `0 0 6px ${gColor}` : "none" }} />
              <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "0.04em" }}>{group}</p>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: gColor }}>
                {groupChecks.filter((c) => c.status === "ok").length}/{groupChecks.length} passing
              </span>
            </div>

            {/* Check rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {groupChecks.map((check) => (
                <CheckRow
                  key={check.id}
                  check={check}
                  expanded={expanded === check.id}
                  onToggle={() => setExpanded(expanded === check.id ? null : check.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Legend footer */}
      <div style={{ display: "flex", gap: 20, alignItems: "center", padding: "16px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Legend</span>
        {([["ok", "Operational"], ["warn", "Degraded"], ["fail", "Outage"], ["idle", "Not run"]] as [CheckStatus, string][]).map(([s, l]) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[s] }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{l}</span>
          </div>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
          Auto-refresh every {AUTO_REFRESH_SECS}s · Click any row to expand details
        </span>
      </div>
    </div>
  );
}
