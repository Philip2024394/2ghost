/**
 * DateIdeaPlaceReportSheet
 * Full-screen report page for flagging a date idea / place post.
 * Styled to match MrButlasReportSheet — dark hotel, red accents, butler image.
 * Collects: reason (dropdown), comments, reporter profile data.
 * Saves to localStorage + Supabase ghost_place_reports table.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ghostSupabase } from "../ghostSupabase";

const BUTLER_BG = "https://ik.imagekit.io/7grri5v7d/Skeletal%20butler%20at%20workdesk.png";
const REPORTS_KEY = "ghost_place_reports";

const REPORT_REASONS = [
  { key: "incorrect_info",  label: "Incorrect information",              icon: "📋" },
  { key: "wrong_images",    label: "Wrong or misleading images",         icon: "🖼️" },
  { key: "outdated_menu",   label: "Outdated menu / pricing",            icon: "🍽️" },
  { key: "bad_service",     label: "Terrible service experience",        icon: "😡" },
  { key: "closed",          label: "Place is closed / doesn't exist",    icon: "🚫" },
  { key: "inappropriate",   label: "Inappropriate or offensive content", icon: "⚠️" },
  { key: "spam",            label: "Spam / self-promotion",              icon: "📢" },
];

export interface PlaceReport {
  id: string;
  postId: string;
  postTitle: string;
  reporterId: string;
  reporterName: string;
  reporterPhone: string;
  reporterEmail: string;
  reason: string;
  comments: string;
  createdAt: number;
  status: "pending" | "reviewed" | "resolved";
}

function getReporterInfo() {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    return {
      id:    p.ghost_id || p.phone || "guest",
      name:  p.name || p.display_name || "Ghost",
      phone: p.phone || p.connect_phone || "",
      email: p.email || "",
    };
  } catch { return { id: "guest", name: "Ghost", phone: "", email: "" }; }
}

function saveReport(report: PlaceReport) {
  try {
    const all: PlaceReport[] = JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
    localStorage.setItem(REPORTS_KEY, JSON.stringify([report, ...all]));
  } catch {}
  // Sync to Supabase non-blocking
  Promise.resolve(
    ghostSupabase.from("ghost_place_reports").insert({
      id:              report.id,
      post_id:         report.postId,
      post_title:      report.postTitle,
      reporter_id:     report.reporterId,
      reporter_name:   report.reporterName,
      reporter_phone:  report.reporterPhone,
      reporter_email:  report.reporterEmail,
      reason:          report.reason,
      comments:        report.comments,
      status:          report.status,
    })
  ).catch(() => {});
}

type Props = {
  show: boolean;
  postId: string;
  postTitle: string;
  onClose: () => void;
};

export default function DateIdeaPlaceReportSheet({ show, postId, postTitle, onClose }: Props) {
  const reporter = getReporterInfo();
  const [reason,   setReason]   = useState("");
  const [comments, setComments] = useState("");
  const [phone,    setPhone]    = useState(reporter.phone);
  const [email,    setEmail]    = useState(reporter.email);
  const [done,     setDone]     = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!reason)          e.reason   = "Please select a reason";
    if (!comments.trim()) e.comments = "Please describe the issue";
    if (Object.keys(e).length) { setErrors(e); return; }

    const report: PlaceReport = {
      id:            crypto.randomUUID(),
      postId,
      postTitle,
      reporterId:    reporter.id,
      reporterName:  reporter.name,
      reporterPhone: phone,
      reporterEmail: email,
      reason,
      comments:      comments.trim(),
      createdAt:     Date.now(),
      status:        "pending",
    };
    saveReport(report);
    setDone(true);
  };

  const handleClose = () => {
    setReason(""); setComments(""); setDone(false); setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="place-report-sheet"
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9993,
            background: "rgba(6,2,2,1)",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch" as never,
          }}
        >
          {/* Red top bar */}
          <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #e01010, transparent)" }} />

          {/* Butler background image — faded */}
          <div style={{
            position: "fixed", bottom: 0, right: 0,
            width: 220, pointerEvents: "none", zIndex: 0, opacity: 0.07,
          }}>
            <img src={BUTLER_BG} alt="" style={{ width: "100%", objectFit: "contain" }} />
          </div>

          <div style={{ position: "relative", zIndex: 1, padding: "max(52px, env(safe-area-inset-top, 52px)) 20px max(48px, env(safe-area-inset-bottom, 48px))" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "rgba(220,20,20,0.75)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  Hotel Information Centre
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: "#fff" }}>Report a Place</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                  Help us keep the guide accurate &amp; trustworthy.
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleClose}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 14, flexShrink: 0, marginLeft: 12 }}>
                ✕
              </motion.button>
            </div>

            {/* Post being reported */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(220,20,20,0.07)", border: "1px solid rgba(220,20,20,0.25)", borderRadius: 14, padding: "12px 14px", marginBottom: 24 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>📍</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "rgba(220,20,20,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Reporting</p>
                <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{postTitle}</p>
              </div>
            </div>

            {!done ? (
              <>
                {/* Reason selector */}
                <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Reason for report *
                </p>
                {errors.reason && <p style={{ margin: "-6px 0 8px", fontSize: 11, color: "#ef4444" }}>{errors.reason}</p>}
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 20 }}>
                  {REPORT_REASONS.map(r => (
                    <button key={r.key} onClick={() => setReason(r.key)} style={{
                      width: "100%", height: 46, borderRadius: 12, padding: "0 14px",
                      background: reason === r.key ? "rgba(220,20,20,0.12)" : "rgba(255,255,255,0.04)",
                      border: reason === r.key ? "1px solid rgba(220,20,20,0.5)" : "1px solid rgba(255,255,255,0.08)",
                      color: reason === r.key ? "#f87171" : "rgba(255,255,255,0.65)",
                      fontSize: 13, fontWeight: 600, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 10, textAlign: "left" as const,
                    }}>
                      <span style={{ fontSize: 16 }}>{r.icon}</span>
                      <span>{r.label}</span>
                      {reason === r.key && <span style={{ marginLeft: "auto", color: "#e01010", fontSize: 14 }}>✓</span>}
                    </button>
                  ))}
                </div>

                {/* Comments */}
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Describe the issue *
                </p>
                {errors.comments && <p style={{ margin: "-4px 0 8px", fontSize: 11, color: "#ef4444" }}>{errors.comments}</p>}
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value.slice(0, 500))}
                  placeholder="Tell us exactly what's wrong — the more detail, the faster we can fix it..."
                  style={{
                    width: "100%", height: 100, borderRadius: 14, resize: "none",
                    border: errors.comments ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)", color: "#fff",
                    fontSize: 13, padding: "12px 14px", outline: "none",
                    boxSizing: "border-box", marginBottom: 4,
                  }}
                />
                <p style={{ margin: "0 0 20px", fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "right" }}>{comments.length}/500</p>

                {/* Divider */}
                <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(220,20,20,0.2), transparent)", marginBottom: 20 }} />

                {/* Reporter info */}
                <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Your contact details (optional)
                </p>
                <p style={{ margin: "0 0 12px", fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                  Helps us follow up if we need more information. Not shared publicly.
                </p>

                {/* Auto-filled reporter card */}
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
                  <p style={{ margin: "0 0 2px", fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>Submitting as</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{reporter.name} <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>· Guest ID: {reporter.id}</span></p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  <div>
                    <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Phone / WhatsApp</p>
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+1 555 000 0000"
                      style={{ width: "100%", height: 42, borderRadius: 11, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, padding: "0 13px", outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Email address</p>
                    <input value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@email.com" type="email"
                      style={{ width: "100%", height: 42, borderRadius: 11, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, padding: "0 13px", outline: "none", boxSizing: "border-box" as const }} />
                  </div>
                </div>

                {/* Submit */}
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
                  style={{
                    width: "100%", height: 52, borderRadius: 50, border: "none",
                    background: "linear-gradient(135deg, #b80000, #e01010)",
                    color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(220,20,20,0.35)", marginBottom: 12,
                  }}>
                  Submit Report 🚩
                </motion.button>
                <button onClick={handleClose}
                  style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}>
                  Cancel
                </button>
              </>
            ) : (
              /* Done state */
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", paddingTop: 40 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎩</div>
                <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 10px" }}>Thank you</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 32px" }}>
                  Your report has been received by Mr. Butlas and the hotel team. We'll review the listing and take action if needed.
                </p>
                <div style={{ background: "rgba(220,20,20,0.08)", border: "1px solid rgba(220,20,20,0.25)", borderRadius: 14, padding: "14px 16px", marginBottom: 32, textAlign: "left" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 800, color: "rgba(220,20,20,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Report filed</p>
                  <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 800, color: "#fff" }}>{postTitle}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    {REPORT_REASONS.find(r => r.key === reason)?.label} · {reporter.name}
                  </p>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose}
                  style={{ width: "100%", height: 48, borderRadius: 50, border: "none", background: "linear-gradient(135deg, #b80000, #e01010)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                  Back to Feed
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
