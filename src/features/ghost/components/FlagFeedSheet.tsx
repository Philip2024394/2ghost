/**
 * FlagFeedSheet
 * Full-screen flag/report flow launched from the feed flag button.
 * Step 1 — Centred snap carousel: pick which post to flag.
 * Step 2 — Report form: name, contact, reason, comments.
 * Step 3 — Done confirmation.
 * Saves to localStorage ghost_place_reports + Supabase ghost_place_reports.
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

export interface PostSummary {
  id: string;
  title: string;
  mainImage: string;
  location: string;
  authorName: string;
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

function saveReport(report: object) {
  try {
    const all = JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
    localStorage.setItem(REPORTS_KEY, JSON.stringify([report, ...all]));
  } catch {}
  Promise.resolve(
    ghostSupabase.from("ghost_place_reports").insert(report)
  ).catch(() => {});
}

type Props = {
  show: boolean;
  posts: PostSummary[];
  onClose: () => void;
};

export default function FlagFeedSheet({ show, posts, onClose }: Props) {
  const reporter = getReporterInfo();

  const [step,     setStep]     = useState<1 | 2>(1);
  const [picked,   setPicked]   = useState<PostSummary | null>(null);
  const [reason,   setReason]   = useState("");
  const [comments, setComments] = useState("");
  const [name,     setName]     = useState(reporter.name);
  const [phone,    setPhone]    = useState(reporter.phone);
  const [email,    setEmail]    = useState(reporter.email);
  const [done,     setDone]     = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  const handleClose = () => {
    setStep(1); setPicked(null); setReason(""); setComments("");
    setName(reporter.name); setPhone(reporter.phone); setEmail(reporter.email);
    setDone(false); setErrors({});
    onClose();
  };

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!reason)          e.reason   = "Please select a reason";
    if (!comments.trim()) e.comments = "Please describe the issue";
    if (Object.keys(e).length) { setErrors(e); return; }

    saveReport({
      id:             crypto.randomUUID(),
      post_id:        picked!.id,
      post_title:     picked!.title,
      reporter_id:    reporter.id,
      reporter_name:  name.trim() || reporter.name,
      reporter_phone: phone,
      reporter_email: email,
      reason,
      comments:       comments.trim(),
      status:         "pending",
      created_at:     new Date().toISOString(),
    });
    setDone(true);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="flag-feed-sheet"
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9994,
            background: "rgba(6,2,2,1)",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch" as never,
          }}
        >
          {/* Red top bar */}
          <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #e01010, transparent)" }} />

          {/* Butler bg */}
          <div style={{ position: "fixed", bottom: 0, right: 0, width: 220, pointerEvents: "none", zIndex: 0, opacity: 0.06 }}>
            <img src={BUTLER_BG} alt="" style={{ width: "100%", objectFit: "contain" }} />
          </div>

          <div style={{ position: "relative", zIndex: 1, padding: "max(52px, env(safe-area-inset-top, 52px)) 0 max(48px, env(safe-area-inset-bottom, 48px))" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 20px", marginBottom: 24 }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "rgba(220,20,20,0.75)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  Hotel Information Centre
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: "#fff" }}>
                  {done ? "Report Filed" : step === 1 ? "Flag a Post" : "Report Details"}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                  {done ? "Thank you for keeping the feed accurate." : step === 1 ? "Select the post you want to flag." : "Tell us what's wrong — we'll review it."}
                </p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={handleClose}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 14, flexShrink: 0, marginLeft: 12, marginRight: 20, marginTop: 4 }}>
                ✕
              </motion.button>
            </div>

            {/* Step indicator */}
            {!done && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 20px", marginBottom: 24 }}>
                {[1, 2].map(s => (
                  <div key={s} style={{
                    flex: 1, height: 3, borderRadius: 99,
                    background: s <= step ? "linear-gradient(90deg, #b80000, #e01010)" : "rgba(255,255,255,0.1)",
                    transition: "background 0.3s",
                  }} />
                ))}
              </div>
            )}

            {/* ── DONE ── */}
            {done && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: "center", padding: "40px 20px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎩</div>
                <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 10px" }}>Thank you</p>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 32px" }}>
                  Your report has been received by Mr. Butlas and the hotel team. We'll review the listing and take action if needed.
                </p>
                <div style={{ background: "rgba(220,20,20,0.08)", border: "1px solid rgba(220,20,20,0.25)", borderRadius: 14, padding: "14px 16px", marginBottom: 32, textAlign: "left" }}>
                  <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 800, color: "rgba(220,20,20,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Report filed</p>
                  <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 800, color: "#fff" }}>{picked?.title}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                    {REPORT_REASONS.find(r => r.key === reason)?.label} · {name || reporter.name}
                  </p>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose}
                  style={{ width: "100%", height: 48, borderRadius: 50, border: "none", background: "linear-gradient(135deg, #b80000, #e01010)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                  Back to Feed
                </motion.button>
              </motion.div>
            )}

            {/* ── STEP 1: Post carousel ── */}
            {!done && step === 1 && (
              <div>
                {/* Snap carousel */}
                <div style={{
                  display: "flex", gap: 14,
                  overflowX: "auto", scrollSnapType: "x mandatory",
                  paddingInline: "10vw", paddingBottom: 8,
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch" as never,
                }}>
                  {posts.map(post => {
                    const sel = picked?.id === post.id;
                    return (
                      <motion.div
                        key={post.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setPicked(sel ? null : post)}
                        style={{
                          minWidth: "80vw", scrollSnapAlign: "center",
                          borderRadius: 18, overflow: "hidden", cursor: "pointer", flexShrink: 0,
                          border: sel ? "2px solid #e01010" : "2px solid rgba(255,255,255,0.07)",
                          boxShadow: sel ? "0 0 20px rgba(220,20,20,0.4)" : "none",
                          transition: "border 0.2s, box-shadow 0.2s",
                          position: "relative",
                        }}
                      >
                        {/* Image */}
                        <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
                          <img src={post.mainImage} alt={post.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 40%, transparent)" }} />
                        </div>
                        {/* Info */}
                        <div style={{ background: sel ? "rgba(220,20,20,0.1)" : "rgba(255,255,255,0.04)", padding: "14px 16px 16px" }}>
                          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>{post.title}</p>
                          <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>📍 {post.location}</p>
                          <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>by {post.authorName}</p>
                        </div>
                        {/* Selected check */}
                        {sel && (
                          <div style={{ position: "absolute", top: 12, right: 12, width: 28, height: 28, borderRadius: "50%", background: "#e01010", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>
                            ✓
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Count indicator dots */}
                <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 14, marginBottom: 24 }}>
                  {posts.map(post => (
                    <div key={post.id} style={{
                      width: picked?.id === post.id ? 18 : 5, height: 5, borderRadius: 99,
                      background: picked?.id === post.id ? "#e01010" : "rgba(255,255,255,0.2)",
                      transition: "all 0.2s",
                    }} />
                  ))}
                </div>

                <div style={{ padding: "0 20px" }}>
                  {picked ? (
                    <>
                      {/* Selected post chip */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(220,20,20,0.08)", border: "1px solid rgba(220,20,20,0.3)", borderRadius: 14, padding: "10px 14px", marginBottom: 16 }}>
                        <span style={{ fontSize: 20 }}>🚩</span>
                        <div>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "rgba(220,20,20,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Selected</p>
                          <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: "#fff" }}>{picked.title}</p>
                        </div>
                      </div>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(2)}
                        style={{ width: "100%", height: 52, borderRadius: 50, border: "none", background: "linear-gradient(135deg, #b80000, #e01010)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 20px rgba(220,20,20,0.35)", marginBottom: 10 }}>
                        Continue →
                      </motion.button>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.25)" }}>Swipe to browse · tap a post to select it</p>
                    </div>
                  )}
                  <button onClick={handleClose}
                    style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Report form ── */}
            {!done && step === 2 && (
              <div style={{ padding: "0 20px" }}>

                {/* Post being reported */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(220,20,20,0.07)", border: "1px solid rgba(220,20,20,0.25)", borderRadius: 14, padding: "12px 14px", marginBottom: 24 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>🚩</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "rgba(220,20,20,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Flagging post</p>
                    <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{picked?.title}</p>
                  </div>
                  <button onClick={() => setStep(1)}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
                    change
                  </button>
                </div>

                {/* Reason */}
                <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Reason *</p>
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
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Describe the issue *</p>
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

                <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(220,20,20,0.2), transparent)", marginBottom: 20 }} />

                {/* Reporter info */}
                <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Your details</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  <div>
                    <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Name</p>
                    <input value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      style={{ width: "100%", height: 42, borderRadius: 11, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, padding: "0 13px", outline: "none", boxSizing: "border-box" as const }} />
                  </div>
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

                <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit}
                  style={{
                    width: "100%", height: 52, borderRadius: 50, border: "none",
                    background: "linear-gradient(135deg, #b80000, #e01010)",
                    color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(220,20,20,0.35)", marginBottom: 12,
                  }}>
                  Submit Report 🚩
                </motion.button>
                <button onClick={() => setStep(1)}
                  style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}>
                  ← Back
                </button>
              </div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
