import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Flag, CreditCard, Gift,
  MessageCircle, RefreshCw, ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react";
import {
  fetchServiceRequests, fetchFlagReports, fetchFailedPayments,
} from "../adminSupabaseService";

// ── Types ─────────────────────────────────────────────────────────────────────

type TaskType = "service" | "report" | "payment";
type TaskStatus = "pending" | "done";

interface AdminTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  createdAt: string;
  // service fields
  serviceCategory?: string;
  serviceEmoji?: string;
  providerName?: string;
  providerWhatsapp?: string;
  // user / profile fields
  userName?: string;
  userId?: string;
  userWhatsapp?: string;
  userCountry?: string;
  // extra context
  note?: string;
  amount?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function waLink(number: string) {
  const clean = number.replace(/\D/g, "");
  return `https://wa.me/${clean}`;
}

const TASK_STORAGE_KEY = "admin_tasks_status";

function loadDoneSet(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(TASK_STORAGE_KEY) || "[]")); }
  catch { return new Set(); }
}

function saveDoneSet(s: Set<string>) {
  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify([...s]));
}

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<TaskType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  service: { label: "Service Request", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", icon: Gift         },
  report:  { label: "Flag / Report",   color: "#f87171", bg: "rgba(248,113,113,0.1)", icon: Flag         },
  payment: { label: "Failed Payment",  color: "#fb923c", bg: "rgba(251,146,60,0.1)",  icon: CreditCard   },
};

const CARD_STYLE = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 14,
  padding: "16px 18px",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminTasksPage() {
  const [tasks, setTasks]         = useState<AdminTask[]>([]);
  const [doneSet, setDoneSet]     = useState<Set<string>>(loadDoneSet);
  const [filter, setFilter]       = useState<"all" | TaskType>("all");
  const [showDone, setShowDone]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [services, reports, payments] = await Promise.all([
        fetchServiceRequests(),
        fetchFlagReports(),
        fetchFailedPayments(),
      ]);
      const merged: AdminTask[] = [...services, ...reports, ...payments]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTasks(merged);
    } catch {
      setTasks([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markDone = (id: string) => {
    setDoneSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveDoneSet(next);
      return next;
    });
  };

  const getStatus = (t: AdminTask): TaskStatus =>
    doneSet.has(t.id) ? "done" : t.status === "done" ? "done" : "pending";

  const visible = tasks
    .filter((t) => filter === "all" || t.type === filter)
    .filter((t) => showDone || getStatus(t) !== "done");

  const pendingCount = tasks.filter((t) => !doneSet.has(t.id) && t.status !== "done").length;

  const countsByType: Record<string, number> = { service: 0, report: 0, payment: 0 };
  tasks.forEach((t) => { if (getStatus(t) === "pending") countsByType[t.type]++; });

  return (
    <div style={{ padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Daily Tasks</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
            {pendingCount} pending action{pendingCount !== 1 ? "s" : ""} · Updated {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <button
          onClick={load}
          style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >
          <RefreshCw size={12} style={loading ? { animation: "spin 1s linear infinite" } : undefined} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {(["service", "report", "payment"] as TaskType[]).map((type) => {
          const cfg = TYPE_CONFIG[type];
          const Icon = cfg.icon;
          return (
            <button
              key={type}
              onClick={() => setFilter(filter === type ? "all" : type)}
              style={{
                ...CARD_STYLE,
                cursor: "pointer",
                textAlign: "left",
                background: filter === type ? cfg.bg : "rgba(255,255,255,0.03)",
                border: filter === type ? `1px solid ${cfg.color}40` : "1px solid rgba(255,255,255,0.07)",
                boxShadow: filter === type ? `0 0 20px ${cfg.color}14` : "none",
              } as any}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Icon size={16} style={{ color: cfg.color }} />
                {countsByType[type] > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: cfg.color, background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`, borderRadius: 6, padding: "2px 7px" }}>
                    {countsByType[type]} pending
                  </span>
                )}
              </div>
              <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>{countsByType[type]}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, fontWeight: 600 }}>{cfg.label}s</p>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        {([["all", "All Tasks"], ["service", "Service Requests"], ["report", "Reports"], ["payment", "Failed Payments"]] as [string, string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val as any)}
            style={{
              height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: filter === val ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
              border: filter === val ? "1px solid rgba(74,222,128,0.3)" : "1px solid rgba(255,255,255,0.07)",
              color: filter === val ? "#4ade80" : "rgba(255,255,255,0.4)",
            } as any}
          >{label}</button>
        ))}

        <button
          onClick={() => setShowDone(!showDone)}
          style={{
            marginLeft: "auto", height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            background: showDone ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)",
          } as any}
        >
          {showDone ? "Hide Completed" : "Show Completed"}
        </button>
      </div>

      {/* Task list */}
      {loading ? (
        <div style={{ padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: 0 }}>Loading tasks…</p>
        </div>
      ) : visible.length === 0 ? (
        <div style={{ padding: "48px", textAlign: "center", background: "rgba(74,222,128,0.04)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 16 }}>
          <CheckCircle2 size={32} style={{ color: "#4ade80", marginBottom: 10 }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "0 0 4px" }}>All clear!</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>No pending tasks in this category.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <AnimatePresence initial={false}>
            {visible.map((task) => {
              const cfg = TYPE_CONFIG[task.type];
              const Icon = cfg.icon;
              const done = getStatus(task) === "done";
              const open = expanded === task.id;

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  style={{
                    background: done ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                    border: done ? "1px solid rgba(255,255,255,0.05)" : `1px solid ${cfg.color}25`,
                    borderRadius: 14,
                    overflow: "hidden",
                    opacity: done ? 0.55 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {/* Row header */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
                    onClick={() => setExpanded(open ? null : task.id)}
                  >
                    {/* Done toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); markDone(task.id); }}
                      style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", padding: 0, color: done ? "#4ade80" : "rgba(255,255,255,0.25)", display: "flex" }}
                    >
                      {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>

                    {/* Type badge */}
                    <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9, background: cfg.bg, border: `1px solid ${cfg.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {task.type === "service" && task.serviceEmoji
                        ? <span style={{ fontSize: 16 }}>{task.serviceEmoji}</span>
                        : <Icon size={15} style={{ color: cfg.color }} />
                      }
                    </div>

                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{cfg.label}</span>
                        {task.serviceCategory && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>· {task.serviceCategory}</span>}
                        {task.amount && <span style={{ fontSize: 12, fontWeight: 700, color: "#fb923c" }}>{task.amount}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{task.userCountry}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: done ? "rgba(255,255,255,0.4)" : "#fff" }}>{task.userName}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>{task.userId}</span>
                      </div>
                    </div>

                    {/* Time + expand */}
                    <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{timeAgo(task.createdAt)}</span>
                      {open ? <ChevronUp size={14} style={{ color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.3)" }} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="detail"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ padding: "0 16px 16px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>

                          {/* Note */}
                          {task.note && (
                            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                              <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Notes</p>
                              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.6 }}>{task.note}</p>
                            </div>
                          )}

                          {/* Contact buttons */}
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>

                            {/* User WhatsApp */}
                            {task.userWhatsapp && (
                              <a
                                href={waLink(task.userWhatsapp)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 6,
                                  height: 36, padding: "0 14px", borderRadius: 9,
                                  background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)",
                                  color: "#25d366", fontSize: 12, fontWeight: 700, textDecoration: "none",
                                }}
                              >
                                <MessageCircle size={13} />
                                WhatsApp {task.userName}
                                <ExternalLink size={11} style={{ opacity: 0.6 }} />
                              </a>
                            )}

                            {/* Provider WhatsApp (service requests) */}
                            {task.providerWhatsapp && (
                              <a
                                href={waLink(task.providerWhatsapp)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: 6,
                                  height: 36, padding: "0 14px", borderRadius: 9,
                                  background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)",
                                  color: "#a78bfa", fontSize: 12, fontWeight: 700, textDecoration: "none",
                                }}
                              >
                                <MessageCircle size={13} />
                                WhatsApp Provider · {task.providerName}
                                <ExternalLink size={11} style={{ opacity: 0.6 }} />
                              </a>
                            )}

                            {/* Mark done */}
                            <button
                              onClick={() => markDone(task.id)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                height: 36, padding: "0 14px", borderRadius: 9,
                                background: done ? "rgba(74,222,128,0.08)" : "rgba(74,222,128,0.12)",
                                border: done ? "1px solid rgba(74,222,128,0.2)" : "1px solid rgba(74,222,128,0.35)",
                                color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer",
                              }}
                            >
                              <CheckCircle2 size={13} />
                              {done ? "Mark Pending" : "Mark Done"}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Done count footer */}
      {!showDone && tasks.filter((t) => getStatus(t) === "done").length > 0 && (
        <p
          onClick={() => setShowDone(true)}
          style={{ fontSize: 12, color: "rgba(74,222,128,0.5)", textAlign: "center", marginTop: 16, cursor: "pointer", fontWeight: 600 }}
        >
          + {tasks.filter((t) => getStatus(t) === "done").length} completed task{tasks.filter((t) => getStatus(t) === "done").length !== 1 ? "s" : ""} hidden — click to show
        </p>
      )}
    </div>
  );
}
