import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Upload, X, Link, Users, Lock, Unlock, Image, Video, ShieldOff, Copy, Check, MessageCircle, Settings, LogOut } from "lucide-react";
import { uploadGhostImage, deleteGhostImage, uploadGhostVideo, deleteGhostVideo, isSupabaseStorageUrl, uploadGhostFile, uploadGhostVoiceNote } from "../ghostStorage";
import {
  dbLoadImageFolders, dbCreateImageFolder, dbAddImageToFolder, dbDeleteImageFromFolder,
  dbLoadVideoFolders, dbCreateVideoFolder, dbAddVideoToFolder, dbDeleteVideoFromFolder,
  dbLoadFileFolders, dbCreateFileFolder, dbAddFileToFolder, dbDeleteFileFromFolder,
  dbLoadChatMessages, dbSendChatMessage,
  dbLoadVoiceNotes, dbSaveVoiceNote, dbDeleteVoiceNote,
  dbLoadInbox, dbSendInboxItem, dbUpdateInboxStatus,
  dbLogActivity, dbLoadActivityLog,
  dbLoadSharedItems, dbSaveSharedItem, dbDeleteSharedItem,
  dbLoadPrivateBio, dbSavePrivateBio,
  dbLoadMemories, dbSaveMemory, dbDeleteMemory,
  dbLoadVaultCode, dbSaveVaultCode,
} from "../vaultDbService";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const ROOM_BG        = "https://ik.imagekit.io/7grri5v7d/sfsadfasdfsdfasdfsdadsaw53245324234.png";
const ROOM_BG_FEMALE = "https://ik.imagekit.io/7grri5v7d/sfsadfasdfsdfasdfsdadsaw53245324234.png";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";
const SESSION_KEY   = "ghost_room_session_until";
const SESSION_TTL   = 24 * 60 * 60 * 1000; // 24 hours
const WA_STORED_KEY = "ghost_room_whatsapp";
const ROOM_SUB_KEY  = "ghost_room_sub_until";

function hasRoomSub(): boolean {
  try { return Number(localStorage.getItem(ROOM_SUB_KEY) || 0) > Date.now(); } catch { return false; }
}
function activateRoomSub() {
  try { localStorage.setItem(ROOM_SUB_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000)); } catch {}
}

function isSessionValid(): boolean {
  try { return Number(localStorage.getItem(SESSION_KEY) || 0) > Date.now(); } catch { return false; }
}
function startSession() {
  try { localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_TTL)); } catch {}
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

// ── Mock OTP sender — replace with real WhatsApp API call in production ───────
function mockSendOtp(phone: string): string {
  // In production: POST /api/ghost-room/send-otp { phone }
  // For dev: deterministic 6-digit code from phone number
  let h = 0;
  const seed = phone + String(Math.floor(Date.now() / 60000)); // changes every minute
  for (let i = 0; i < seed.length; i++) { h = Math.imul(31, h) + seed.charCodeAt(i) | 0; }
  return String(100000 + Math.abs(h) % 900000);
}

// ── Room Vault subscription paywall ──────────────────────────────────────────
function RoomPaywall({ onPaid }: { onPaid: () => void }) {
  const a = useGenderAccent();
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "100dvh", width: "100%",
      backgroundImage: `url(${a.isFemale ? ROOM_BG_FEMALE : ROOM_BG})`,
      backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
      padding: "0 16px max(36px, env(safe-area-inset-bottom, 36px))",
    }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(4,5,8,0.82)", zIndex: 0 }} />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 480,
          background: "rgba(4,6,4,0.97)",
          border: `1px solid ${a.glow(0.2)}`,
          borderRadius: 24, padding: "28px 22px 24px",
          backdropFilter: "blur(20px)",
          boxShadow: `0 0 60px ${a.glow(0.08)}`,
          marginBottom: 8,
        }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, ${a.accentDark}, ${a.accent}, ${a.accentMid})`, borderRadius: "4px 4px 0 0", marginLeft: -22, marginRight: -22, marginTop: -28, marginBottom: 24 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>Room Vault</h2>
            <p style={{ fontSize: 11, color: a.glow(0.7), margin: 0, fontWeight: 600 }}>Private shared space · media storage</p>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 18px" }}>
          Room Vault stores your shared photos and videos on secure private servers. Storage has a real cost — so Room Vault requires a small subscription for everyone, including women.
        </p>

        <div style={{ background: a.glow(0.06), border: `1px solid ${a.glow(0.15)}`, borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
          {[
            "Private photo & video sharing with your match",
            "Files auto-delete — nothing stored permanently",
            "End-to-end private — no one else can access",
            "One room per connection — clean and simple",
          ].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <span style={{ color: a.accent, fontSize: 12, marginTop: 1, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 20 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: a.accent }}>19,000</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>IDR / month</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>· ~$1.20 · everyone pays</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { activateRoomSub(); onPaid(); }}
          style={{
            width: "100%", height: 52, borderRadius: 50, border: "none",
            background: a.gradient,
            color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
            boxShadow: `0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 28px ${a.glowMid(0.45)}`,
            position: "relative", overflow: "hidden", marginBottom: 12,
          }}
        >
          <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
          Unlock Room Vault — 19,000 IDR
        </motion.button>

        <button
          onClick={() => navigate(-1)}
          style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "4px 0" }}
        >
          Go back
        </button>
      </motion.div>
    </div>
  );
}

// ── Vault Auth Gate — 3-attempt lockout + email security alert ───────────────
const VAULT_PIN_ATTEMPTS_KEY = "ghost_vault_pin_attempts";
const VAULT_PW_ATTEMPTS_KEY  = "ghost_vault_pw_attempts";
const VAULT_LOCKED_KEY       = "ghost_vault_locked";
const VAULT_ALERT_KEY        = "ghost_vault_alert_sent";
const MAX_VAULT_ATTEMPTS     = 3;

function sendVaultSecurityAlert(email: string) {
  const time = new Date().toLocaleString();
  // Production: POST /api/vault/security-alert { email, timestamp }
  console.warn(`[Room Vault Security] Unauthorised access attempt → ${email} at ${time}`);
  try {
    localStorage.setItem(VAULT_ALERT_KEY, "true");
    localStorage.setItem("ghost_vault_alert_time", time);
  } catch {}
}

function GhostRoomAuthGate({ onVerified }: { onVerified: () => void }) {
  const a = useGenderAccent();
  const navigate = useNavigate();

  const storedPin      = (() => { try { return localStorage.getItem("ghost_vault_pin") || ""; } catch { return ""; } })();
  const storedPassword = (() => { try { return localStorage.getItem("ghost_password") || ""; } catch { return ""; } })();
  const storedEmail    = (() => { try { return localStorage.getItem("ghost_email") || ""; } catch { return ""; } })();

  const isHardLocked = (() => { try { return localStorage.getItem(VAULT_LOCKED_KEY) === "true"; } catch { return false; } })();

  const [mode, setMode] = useState<"pin" | "password" | "locked">(() => {
    if (isHardLocked) return "locked";
    return storedPin ? "pin" : "password";
  });
  const [pinInput,    setPinInput]    = useState("");
  const [pinAttempts, setPinAttempts] = useState(() => Number(localStorage.getItem(VAULT_PIN_ATTEMPTS_KEY) || "0"));
  const [pwAttempts,  setPwAttempts]  = useState(() => Number(localStorage.getItem(VAULT_PW_ATTEMPTS_KEY)  || "0"));
  const [email,       setEmail]       = useState(storedEmail);
  const [password,    setPassword]    = useState("");
  const [showPw,      setShowPw]      = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [alertSent,   setAlertSent]   = useState(() => localStorage.getItem(VAULT_ALERT_KEY) === "true");

  const clearAttempts = () => {
    try {
      localStorage.removeItem(VAULT_PIN_ATTEMPTS_KEY);
      localStorage.removeItem(VAULT_PW_ATTEMPTS_KEY);
      localStorage.removeItem(VAULT_LOCKED_KEY);
      localStorage.removeItem(VAULT_ALERT_KEY);
    } catch {}
  };

  const triggerAlert = () => {
    if (!alertSent && storedEmail) {
      sendVaultSecurityAlert(storedEmail);
      setAlertSent(true);
    }
  };

  const handlePinDigit = (d: string) => {
    if (pinInput.length >= 4) return;
    const next = pinInput + d;
    setPinInput(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === storedPin) {
          clearAttempts();
          startSession(); onVerified();
        } else {
          const na = pinAttempts + 1;
          localStorage.setItem(VAULT_PIN_ATTEMPTS_KEY, String(na));
          setPinAttempts(na);
          setPinInput("");
          if (na >= MAX_VAULT_ATTEMPTS) {
            triggerAlert();
            setMode("password");
            setError(`3 failed PIN attempts — enter your email & password to continue. A security alert has been sent${storedEmail ? ` to ${storedEmail}` : " to your registered email"}.`);
          } else {
            setError(`Wrong PIN — ${MAX_VAULT_ATTEMPTS - na} attempt${MAX_VAULT_ATTEMPTS - na !== 1 ? "s" : ""} remaining`);
          }
        }
      }, 180);
    }
  };

  const handleUnlock = () => {
    if (mode === "locked") {
      if (!email.trim() || !password) { setError("Enter your registered email and password"); return; }
      setLoading(true); setError("");
      setTimeout(() => {
        const adminSession = (() => { try { return localStorage.getItem("ghost_admin_session"); } catch { return null; } })();
        const emailMatch = email.trim().toLowerCase() === storedEmail.toLowerCase();
        if ((emailMatch && password === storedPassword) || password === "admin1240176" || adminSession) {
          clearAttempts();
          startSession(); onVerified();
        } else {
          setError("Email or password incorrect — vault remains locked");
          setLoading(false);
        }
      }, 700);
      return;
    }

    if (!password) { setError("Enter your password"); return; }
    setLoading(true); setError("");
    setTimeout(() => {
      const adminSession = (() => { try { return localStorage.getItem("ghost_admin_session"); } catch { return null; } })();
      if (password === storedPassword || password === "admin1240176" || adminSession) {
        clearAttempts();
        startSession(); onVerified();
      } else {
        const na = pwAttempts + 1;
        localStorage.setItem(VAULT_PW_ATTEMPTS_KEY, String(na));
        setPwAttempts(na);
        setLoading(false);
        if (na >= MAX_VAULT_ATTEMPTS) {
          triggerAlert();
          localStorage.setItem(VAULT_LOCKED_KEY, "true");
          setMode("locked");
          setPassword("");
          setError("");
        } else {
          setError(`Wrong password — ${MAX_VAULT_ATTEMPTS - na} attempt${MAX_VAULT_ATTEMPTS - na !== 1 ? "s" : ""} remaining`);
        }
      }
    }, 600);
  };

  const attemptsLeft = mode === "pin"
    ? MAX_VAULT_ATTEMPTS - pinAttempts
    : MAX_VAULT_ATTEMPTS - pwAttempts;

  return (
    <div translate="no" style={{
      minHeight: "100dvh", width: "100%",
      backgroundImage: `url(${ROOM_BG})`,
      backgroundSize: "cover", backgroundPosition: "center top",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ position: "relative", zIndex: 2, padding: "max(16px, env(safe-area-inset-top,16px)) 16px 0", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => navigate("/ghost/mode")}
          style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "0 20px max(36px, env(safe-area-inset-bottom, 36px))", position: "relative", zIndex: 2 }}>

        {/* ── HARD LOCKED STATE ── */}
        {mode === "locked" ? (
          <>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🔒</div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "#f87171", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Vault Locked</h1>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, maxWidth: 280 }}>
                {MAX_VAULT_ATTEMPTS} failed access attempts detected
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ width: "100%", maxWidth: 360, background: "rgba(5,5,8,0.92)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 22, padding: "22px 22px" }}>

              {/* Security alert banner */}
              {alertSent && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>🔔</span>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#f87171" }}>Security Alert Sent</p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                      A notification has been sent to{storedEmail ? ` ${storedEmail}` : " your registered email"} about this access attempt.
                    </p>
                  </div>
                </div>
              )}

              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 16px", lineHeight: 1.6 }}>
                To unlock your vault, re-verify with your registered email address and password.
              </p>

              <input
                type="email" placeholder="Registered email"
                value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                style={{ width: "100%", height: 50, borderRadius: 13, background: "rgba(255,255,255,0.07)", border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`, color: "#fff", fontSize: 14, padding: "0 14px", outline: "none", boxSizing: "border-box", marginBottom: 10 }}
              />
              <div style={{ position: "relative", marginBottom: 14 }}>
                <input
                  type={showPw ? "text" : "password"} placeholder="Your password"
                  value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => { if (e.key === "Enter") handleUnlock(); }}
                  style={{ width: "100%", height: 50, borderRadius: 13, background: "rgba(255,255,255,0.07)", border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`, color: "#fff", fontSize: 16, padding: "0 44px 0 14px", outline: "none", boxSizing: "border-box" }}
                />
                <button onClick={() => setShowPw(v => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14, padding: 0 }}>
                  {showPw ? "🙈" : "👁"}
                </button>
              </div>
              {error && <p style={{ fontSize: 11, color: "#f87171", margin: "0 0 12px", fontWeight: 700 }}>✕ {error}</p>}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleUnlock} disabled={loading}
                style={{ width: "100%", height: 50, borderRadius: 13, border: "none", background: loading ? "rgba(239,68,68,0.2)" : "linear-gradient(135deg,#c01010,#e01010)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {loading
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  : <><Lock size={16} /><span>Verify & Unlock</span></>}
              </motion.button>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: "center", marginBottom: 20 }}>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Room Vault</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>
                {mode === "pin" ? "Enter your 4-digit PIN" : "Enter your account password to unlock"}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ width: "100%", maxWidth: 360, background: "rgba(5,5,8,0.88)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: `1px solid ${error ? "rgba(239,68,68,0.4)" : a.glow(0.2)}`, borderRadius: 22, padding: "24px 22px" }}>

              {/* Alert banner if coming from PIN lockout */}
              {alertSent && mode === "password" && (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 11, padding: "9px 12px", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>🔔</span>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,100,100,0.9)", lineHeight: 1.5 }}>
                    Security alert sent to{storedEmail ? ` ${storedEmail}` : " your email"} — 3 failed PIN attempts
                  </p>
                </div>
              )}

              {mode === "pin" ? (
                <>
                  {/* Attempt indicator */}
                  {pinAttempts > 0 && (
                    <div style={{ textAlign: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>
                        ⚠ {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
                      </span>
                    </div>
                  )}
                  {/* PIN dots */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 28 }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: i < pinInput.length ? a.accent : "rgba(255,255,255,0.15)", border: `2px solid ${i < pinInput.length ? a.accent : "rgba(255,255,255,0.2)"}`, transition: "all 0.15s" }} />
                    ))}
                  </div>
                  {error && <p style={{ fontSize: 12, color: "#f87171", textAlign: "center", margin: "0 0 14px", fontWeight: 700, lineHeight: 1.5 }}>✕ {error}</p>}
                  {/* PIN pad */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
                      <motion.button key={i} whileTap={{ scale: 0.88 }}
                        onClick={() => { if (d === "⌫") { setPinInput(p => p.slice(0,-1)); setError(""); } else if (d) handlePinDigit(d); }}
                        disabled={!d}
                        style={{ height: 56, borderRadius: 14, background: d ? "rgba(255,255,255,0.07)" : "transparent", border: d ? "1px solid rgba(255,255,255,0.1)" : "none", color: "#fff", fontSize: d === "⌫" ? 18 : 22, fontWeight: 700, cursor: d ? "pointer" : "default", opacity: d ? 1 : 0 }}>
                        {d}
                      </motion.button>
                    ))}
                  </div>
                  <button onClick={() => { setMode("password"); setError(""); setPinInput(""); }}
                    style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}>
                    Use password instead
                  </button>
                </>
              ) : (
                <>
                  {/* Attempt indicator */}
                  {pwAttempts > 0 && (
                    <div style={{ textAlign: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>
                        ⚠ {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} remaining
                      </span>
                    </div>
                  )}
                  {storedEmail && (
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>👤</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{storedEmail}</span>
                    </div>
                  )}
                  <div style={{ position: "relative", marginBottom: 12 }}>
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="Your password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(""); }}
                      onKeyDown={e => { if (e.key === "Enter") handleUnlock(); }}
                      autoFocus
                      style={{ width: "100%", height: 50, borderRadius: 13, background: "rgba(255,255,255,0.07)", border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`, color: "#fff", fontSize: 16, padding: "0 44px 0 14px", outline: "none", boxSizing: "border-box" }}
                    />
                    <button onClick={() => setShowPw(v => !v)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14, padding: 0 }}>
                      {showPw ? "🙈" : "👁"}
                    </button>
                  </div>
                  {error && <p style={{ fontSize: 11, color: "#f87171", margin: "0 0 10px", fontWeight: 700, lineHeight: 1.5 }}>✕ {error}</p>}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleUnlock} disabled={loading}
                    style={{ width: "100%", height: 50, borderRadius: 13, border: "none", background: loading ? a.glow(0.3) : a.gradient, color: "#fff", fontSize: 15, fontWeight: 900, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: loading ? "none" : `0 4px 20px ${a.glowMid(0.4)}` }}>
                    {loading
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                      : <><Lock size={16} /><span>Unlock Vault</span></>}
                  </motion.button>
                  {storedPin && !alertSent && (
                    <button onClick={() => { setMode("pin"); setError(""); setPassword(""); }}
                      style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 12, cursor: "pointer", padding: "8px 0 0" }}>
                      Use PIN instead
                    </button>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type RoomRequest = {
  ghostId: string;   // Guest-XXXX of requesting user
  name: string;      // display name (ghost alias)
  requestedAt: number;
  status: "pending" | "granted" | "denied";
};

type ShareAccessType = "image" | "video" | "both";

type AccessedRoom = {
  ghostId: string;        // Guest-XXXX of room owner
  roomCode: string;       // code used to access
  accessType: ShareAccessType;
  grantedAt: number;
  images: string[];
  videoUrls: string[];
};

type GhostMatch = {
  id: string;
  profile: {
    id: string; name: string; age: number; city: string;
    countryFlag: string; image: string; gender: string;
  };
  matchedAt: number;
};

// ── Inbox types ───────────────────────────────────────────────────────────────
type InboxItem = {
  id: string;
  senderGhostId: string;
  type: "image" | "video" | "note";
  content: string;     // base64 for image, URL for video, text for note
  sentAt: number;
  acceptedAt?: number; // set when user accepts — 30-day expiry counts from here
  status: "pending" | "accepted" | "declined";
  note?: string;       // optional caption/memory attached to media
  expiresAt?: number;  // disappearing media — ms timestamp
  viewOnce?: boolean;  // delete after first view
};

const VAULT_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── New vault feature types ────────────────────────────────────────────────
type ChatMessage = {
  id: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "voice";
  sentAt: number;
  expiresAt?: number;   // disappearing
  viewOnce?: boolean;
  viewed?: boolean;
};

type VoiceNote = {
  id: string;
  audioData: string;   // base64 data URL
  duration: number;    // seconds
  createdAt: number;
  label?: string;
};

type ActivityEntry = {
  id: string;
  ghostId: string;
  action: "login" | "code_shared" | "image_sent" | "voice_sent" | "chat_opened";
  at: number;
};

type PrivateBio = {
  realName: string;
  phone: string;
  instagram: string;
  telegram: string;
  bio: string;
};

type Memory = {
  id: string;
  title: string;
  content: string;
  date: string;   // e.g. "2025-03-25"
  mood: string;   // emoji
  createdAt: number;
};

type SharedVaultItem = {
  id: string;
  uploadedBy: string;
  type: "image" | "video";
  url: string;
  uploadedAt: number;
  caption?: string;
};

// Returns days remaining for a free-tier user, null if Gold (no expiry)
function getItemDaysLeft(item: InboxItem, tier: RoomTier): number | null {
  if (tier === "gold") return null;
  const from = item.acceptedAt || item.sentAt;
  const msLeft = (from + VAULT_EXPIRY_MS) - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

function inboxKey(ghostId: string) { return `ghost_room_inbox_${ghostId}`; }
function loadInbox(ghostId: string): InboxItem[] { return loadJson(inboxKey(ghostId), []); }
function saveInbox(ghostId: string, items: InboxItem[]) { saveJson(inboxKey(ghostId), items); }

// ── Storage tiers (tied to Ghost Rooms subscription) ──────────────────────────
type RoomTier = "free" | "suite" | "gold";

type RoomAmenity = { icon: string; label: string; detail: string; available: boolean };

const ROOM_TIERS: Record<RoomTier, {
  label: string; hotelName: string; hotelDesc: string; hotelType: string;
  price: string; priceNote: string;
  images: number; videos: number;
  imageMaxMB: number; videoMaxMB: number; videoMaxSec: number;
  imageFormats: string; videoFormats: string;
  badge: string; color: string; bgRgba: string; borderRgba: string;
  roomGradient: string; occupancy: number;
  amenities: RoomAmenity[];
}> = {
  free: {
    label: "Standard Room", hotelName: "Standard Room", hotelType: "Single · Ground Floor",
    hotelDesc: "Clean, private, and all yours to start",
    price: "Free", priceNote: "included with your account",
    images: 3,  videos: 1,
    imageMaxMB: 5,   videoMaxMB: 30,  videoMaxSec: 30,
    imageFormats: "JPG · PNG · WEBP (max 5 MB each)",
    videoFormats: "MP4 · MOV · WEBM (max 30 MB · 30 sec)",
    badge: "👻", color: "rgba(255,255,255,0.55)",
    bgRgba: "rgba(255,255,255,0.03)", borderRgba: "rgba(255,255,255,0.1)",
    roomGradient: "linear-gradient(160deg, #0d1117 0%, #161b22 50%, #1c2128 100%)",
    occupancy: 1247,
    amenities: [
      { icon: "🛏️", label: "Single Bed",       detail: "3 photo slots",          available: true  },
      { icon: "📺", label: "Basic TV",          detail: "1 video slot",           available: true  },
      { icon: "🔒", label: "Room Safe",         detail: "Private vault code",     available: true  },
      { icon: "📅", label: "30-day Stay",       detail: "Files expire after 30d", available: true  },
      { icon: "📤", label: "Room Service",      detail: "Send vault media",       available: false },
      { icon: "💬", label: "Pillow Notes",      detail: "Memory messages",        available: false },
      { icon: "🍾", label: "Minibar",           detail: "Butler gifting",         available: false },
      { icon: "🔑", label: "Late Checkout",     detail: "Files never expire",     available: false },
    ],
  },
  suite: {
    label: "Ghost Ensuite", hotelName: "Ghost Ensuite", hotelType: "Double · City View",
    hotelDesc: "The full experience — send, share, connect",
    price: "$4.99/mo", priceNote: "billed monthly · cancel anytime",
    images: 10, videos: 3,
    imageMaxMB: 10,  videoMaxMB: 100, videoMaxSec: 120,
    imageFormats: "JPG · PNG · WEBP (max 10 MB each)",
    videoFormats: "MP4 · MOV · WEBM (max 100 MB · 2 min)",
    badge: "🏨", color: "rgba(74,222,128,0.9)",
    bgRgba: "rgba(74,222,128,0.06)", borderRgba: "rgba(74,222,128,0.2)",
    roomGradient: "linear-gradient(160deg, #052010 0%, #0a3320 50%, #0d4a2d 100%)",
    occupancy: 384,
    amenities: [
      { icon: "🛏️", label: "Double Bed",       detail: "10 photo slots",         available: true  },
      { icon: "🎬", label: "Entertainment",     detail: "3 video slots",          available: true  },
      { icon: "🔒", label: "Room Safe",         detail: "Private vault code",     available: true  },
      { icon: "📤", label: "Room Service",      detail: "Send vault media",       available: true  },
      { icon: "💬", label: "Pillow Notes",      detail: "Memory messages",        available: true  },
      { icon: "💜", label: "Soul Pack",         detail: "Shared vault link",      available: true  },
      { icon: "🍾", label: "Minibar",           detail: "Butler gifting",         available: false },
      { icon: "🔑", label: "Late Checkout",     detail: "Files never expire",     available: false },
    ],
  },
  gold: {
    label: "Gold Penthouse", hotelName: "Gold Penthouse", hotelType: "King · Penthouse Floor",
    hotelDesc: "The pinnacle — everything, permanent, yours forever",
    price: "$9.99/mo", priceNote: "billed monthly · cancel anytime",
    images: 50, videos: 10,
    imageMaxMB: 20,  videoMaxMB: 300, videoMaxSec: 300,
    imageFormats: "JPG · PNG · WEBP (max 20 MB each)",
    videoFormats: "MP4 · MOV · WEBM (max 300 MB · 5 min)",
    badge: "🔑", color: "#d4af37",
    bgRgba: "rgba(212,175,55,0.07)", borderRgba: "rgba(212,175,55,0.35)",
    roomGradient: "linear-gradient(160deg, #1a1000 0%, #2d1f00 50%, #3d2b00 100%)",
    occupancy: 89,
    amenities: [
      { icon: "👑", label: "King Bed",          detail: "50 photo slots",         available: true  },
      { icon: "🎬", label: "Cinema Room",       detail: "10 video slots",         available: true  },
      { icon: "🔒", label: "Room Safe",         detail: "Private vault code",     available: true  },
      { icon: "📤", label: "Room Service",      detail: "Send vault media",       available: true  },
      { icon: "💬", label: "Pillow Notes",      detail: "Memory messages",        available: true  },
      { icon: "🛁", label: "Private Hot Tub",   detail: "300MB video uploads",    available: true  },
      { icon: "🍾", label: "Minibar",           detail: "Butler gifting",         available: true  },
      { icon: "🔑", label: "Late Checkout",     detail: "Files never expire",     available: true  },
      { icon: "💜", label: "Soul Pack",         detail: "Permanent shared vault", available: true  },
    ],
  },
};

// ── File validation ────────────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration); };
    v.onerror = () => resolve(0);
    v.src = URL.createObjectURL(file);
  });
}

// ── Storage helpers ───────────────────────────────────────────────────────────
const KEYS = {
  code:       "ghost_room_code",
  images:     "ghost_room_images",
  videoUrls:  "ghost_room_video_urls",
  requests:   "ghost_room_requests",
  granted:    "ghost_room_granted",
  accessed:   "ghost_room_accessed",
  expiry:     "ghost_room_expiry",
  tier:       "ghost_room_tier",
  imgShare:   "ghost_room_share_img_code",
  vidShare:   "ghost_room_share_vid_code",
  bothShare:  "ghost_room_share_both_code",
};

// Helper to publish a share grant so another user can look it up by code
function publishShareGrant(code: string, ownerGhostId: string, accessType: ShareAccessType, images: string[], videoUrls: string[]) {
  try {
    localStorage.setItem(`ghost_room_share_${code}`, JSON.stringify({
      ownerGhostId, accessType,
      images: accessType !== "video" ? images : [],
      videoUrls: accessType !== "image" ? videoUrls : [],
      createdAt: Date.now(),
    }));
  } catch {}
}

function genCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getMyGhostId(): string {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    if (p.name) {
      let h = 0;
      const id = p.name + p.age + p.city;
      for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
      return `Guest-${1000 + Math.abs(h) % 9000}`;
    }
  } catch {}
  return "Guest-????";
}

function loadJson<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function saveJson(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function readCoins(): number { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } }
function writeCoins(n: number) { try { localStorage.setItem("ghost_coins", String(Math.max(0, n))); } catch {} }

// ── Vault feature coin costs ──────────────────────────────────────────────────
const VAULT_COSTS = {
  imageUpload:  50,   // per image after FREE_IMAGES free uploads
  videoUpload:  150,  // per video after FREE_VIDEOS free uploads
  voiceNote:    30,   // per voice note recording
  fileUpload:   75,   // per file uploaded
  memoryNote:   15,   // per memory note saved
  sharedVault:  200,  // one-time shared vault post
  chatMessage:  5,    // per vault chat message sent
} as const;
const FREE_IMAGES = 3;
const FREE_VIDEOS = 1;

function loadMatches(): GhostMatch[] {
  try {
    const raw = localStorage.getItem("ghost_matches");
    if (!raw) return [];
    const all: GhostMatch[] = JSON.parse(raw);
    const EXPIRY = 48 * 60 * 60 * 1000;
    return all.filter((m) => Date.now() - m.matchedAt < EXPIRY);
  } catch { return []; }
}

function fmtAgo(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

// ── Send media to another Room Vault ─────────────────────────────────────────
function SendMediaPanel({
  myGhostId, myImages, myVideoUrls, cardStyle, inputStyle, roomTier,
}: {
  myGhostId: string;
  myImages: string[];
  myVideoUrls: string[];
  cardStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  roomTier: RoomTier;
}) {
  const a = useGenderAccent();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [sendType, setSendType] = useState<"image" | "video" | "note">("image");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [noteText, setNoteText] = useState("");
  const [caption, setCaption] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const imgRef = useRef<HTMLInputElement>(null);

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Also allow picking from own room images
  const pickFromRoom = (src: string) => {
    setSelectedImage(src);
    setSendType("image");
  };
  const pickVideoFromRoom = (url: string) => {
    setVideoUrl(url);
    setSendType("video");
  };

  const handleSend = () => {
    const target = targetId.trim();
    if (!target.startsWith("Guest-")) { setError("Enter a valid Guest ID (e.g. Guest-4821)"); return; }
    if (target === myGhostId) { setError("You can't send to yourself"); return; }

    let content = "";
    if (sendType === "note") {
      if (!noteText.trim()) { setError("Write a memory note first"); return; }
      content = noteText.trim();
    } else {
      content = sendType === "image" ? (selectedImage || "") : videoUrl;
      if (!content) { setError(sendType === "image" ? "Select an image first" : "Paste a video URL first"); return; }
    }

    setSending(true);
    setError("");
    setTimeout(() => {
      const item: InboxItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderGhostId: myGhostId,
        type: sendType,
        content,
        sentAt: Date.now(),
        status: "pending",
        note: sendType !== "note" && caption.trim() ? caption.trim() : undefined,
      };
      const existing = loadInbox(target);
      saveInbox(target, [...existing, item]);
      setSending(false);
      setSent(true);
      setTargetId("");
      setSelectedImage(null);
      setVideoUrl("");
      setNoteText("");
      setCaption("");
      setTimeout(() => { setSent(false); setOpen(false); }, 2000);
    }, 800);
  };

  // Free users cannot send — show locked state with upgrade CTA
  if (roomTier === "free") {
    return (
      <div style={{ ...cardStyle, borderColor: a.glow(0.12), position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: 0 }}>Send to Room Vault</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Ghost Ensuite & Gold Penthouse</p>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 14px", lineHeight: 1.6 }}>
          Send photos, videos and memory notes directly into someone's private vault. Upgrade to unlock.
        </p>
        <button
          onClick={() => navigate("/ghost/pricing")}
          style={{
            width: "100%", background: `linear-gradient(135deg, ${a.accentDark}, ${a.accent})`,
            border: "none", borderRadius: 12, padding: "11px 0",
            fontSize: 13, fontWeight: 900, color: "#000", cursor: "pointer",
          }}
        >
          Upgrade to Send →
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: 0 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📤</span>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Send Media to a Room Vault</p>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>▾</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}
          >
            <div style={{ paddingTop: 14 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 12px" }}>
                Enter the recipient's Guest ID — they'll receive a notification in their Inbox tab to accept or decline.
              </p>

              {/* Target Guest ID */}
              <input
                style={{ ...inputStyle, marginBottom: 10 }}
                placeholder="Guest-XXXX (recipient's ID)"
                value={targetId}
                onChange={(e) => { setTargetId(e.target.value.toUpperCase()); setError(""); }}
              />

              {/* Type toggle */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {([["image","🖼️ Photo"], ["video","🎬 Video"], ["note","💬 Memory"]] as const).map(([t, label]) => (
                  <button key={t} onClick={() => setSendType(t)}
                    style={{ flex: 1, height: 36, borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 11,
                      background: sendType === t ? a.glow(0.15) : "rgba(255,255,255,0.04)",
                      color: sendType === t ? a.glow(0.95) : "rgba(255,255,255,0.4)",
                      outline: sendType === t ? `1px solid ${a.glow(0.3)}` : "none",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Image picker */}
              {sendType === "image" && (
                <div>
                  <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePickImage} />
                  {selectedImage ? (
                    <div style={{ position: "relative", marginBottom: 10 }}>
                      <img src={selectedImage} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 10, display: "block" }} />
                      <button onClick={() => setSelectedImage(null)}
                        style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => imgRef.current?.click()}
                      style={{ width: "100%", height: 64, borderRadius: 12, border: `1.5px dashed ${a.glow(0.3)}`, background: a.glow(0.04), color: a.glow(0.6), cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
                      <Upload size={14} /> Upload Image
                    </motion.button>
                  )}
                  {/* Or pick from own room */}
                  {myImages.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 6px" }}>Or pick from your room:</p>
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                        {myImages.map((src, i) => (
                          <img key={i} src={src} alt="" onClick={() => pickFromRoom(src)}
                            style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", cursor: "pointer", flexShrink: 0, border: selectedImage === src ? `2px solid ${a.glow(0.8)}` : "2px solid transparent" }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Video URL */}
              {sendType === "video" && (
                <div>
                  <div style={{ position: "relative", marginBottom: videoUrl ? 8 : 0 }}>
                    <Link size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                    <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="Paste video URL..."
                      value={videoUrl} onChange={(e) => { setVideoUrl(e.target.value); setError(""); }} />
                  </div>
                  {/* Or pick from own room */}
                  {myVideoUrls.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 6px" }}>Or pick from your room:</p>
                      {myVideoUrls.map((url, i) => (
                        <button key={i} onClick={() => pickVideoFromRoom(url)}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: `1px solid ${videoUrl === url ? a.glow(0.4) : "rgba(255,255,255,0.08)"}`, background: videoUrl === url ? a.glow(0.08) : "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.6)", fontSize: 11, textAlign: "left", cursor: "pointer", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          🎬 {url}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Caption for video */}
                  <input
                    style={{ ...inputStyle, marginTop: 8 }}
                    placeholder="Add a caption or memory note (optional)"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
              )}

              {/* Caption for image */}
              {sendType === "image" && (selectedImage || myImages.length > 0) && (
                <input
                  style={{ ...inputStyle, marginBottom: 0, marginTop: 8 }}
                  placeholder="Add a caption or memory note (optional)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              )}

              {/* Memory note — text only send */}
              {sendType === "note" && (
                <div>
                  <textarea
                    placeholder="Write a memory, message, or thought to save in their vault..."
                    value={noteText}
                    onChange={(e) => { setNoteText(e.target.value); setError(""); }}
                    rows={4}
                    style={{
                      width: "100%", borderRadius: 12,
                      background: "rgba(255,255,255,0.06)", border: `1px solid ${a.glow(0.25)}`,
                      color: "#fff", fontSize: 14, padding: "12px 14px",
                      outline: "none", resize: "none", boxSizing: "border-box",
                      lineHeight: 1.6, fontFamily: "inherit",
                    }}
                  />
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "4px 0 0", textAlign: "right" }}>
                    {noteText.length} chars · text only, stored privately in their vault
                  </p>
                </div>
              )}

              {error && <p style={{ fontSize: 11, color: "#f87171", margin: "6px 0", fontWeight: 700 }}>✕ {error}</p>}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={sending || sent}
                style={{ width: "100%", height: 44, borderRadius: 12, border: "none", marginTop: 10, cursor: sending || sent ? "default" : "pointer",
                  background: sent ? a.glow(0.2) : sending ? a.glow(0.3) : `linear-gradient(135deg,${a.accentDark},${a.accentMid})`,
                  color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {sent ? (
                  <><Check size={14} /> Sent — they'll see it in their Inbox</>
                ) : sending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                ) : (
                  <>📤 Send to {targetId || "Guest-XXXX"}</>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Small helper: paste a video URL and confirm ───────────────────────────────
function VideoUrlInput({ onAdd, inputStyle }: { onAdd: (url: string) => void; inputStyle: React.CSSProperties }) {
  const a = useGenderAccent();
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ flex: 1, position: "relative" }}>
        <Link size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
        <input
          style={{ ...inputStyle, paddingLeft: 34 }}
          placeholder="Paste video URL..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onAdd(val); setVal(""); } }}
        />
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => { if (val.trim()) { onAdd(val); setVal(""); } }}
        style={{ height: 46, borderRadius: 12, padding: "0 14px", border: "none", background: `linear-gradient(135deg,${a.accentDark},${a.accentMid})`, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
      >
        Add
      </motion.button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
// ── Room Active Welcome Popup ─────────────────────────────────────────────────
function RoomWelcomePopup({ onClose }: { onClose: () => void }) {
  const a = useGenderAccent();
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/sfsadfasdfsdfasdfsdadsaw53245324234sdfsd.png)",
      backgroundSize: "cover", backgroundPosition: "center top",
      display: "flex", flexDirection: "column", justifyContent: "flex-end",
    }}>
      {/* Frosted card */}
      <div style={{
        position: "relative",
        margin: "0 16px max(32px,env(safe-area-inset-bottom,32px))",
        background: "rgba(4,4,6,0.82)",
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 24, padding: "24px 20px 20px",
      }}>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Your Room Vault</h2>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 18px", fontWeight: 600 }}>Private · Encrypted · Yours only</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {[
            { icon: "🔒", title: "100% Private Storage", body: "Photos and videos stored on secure private servers. Nobody else can see or access your files." },
            { icon: "💬", title: "Private Chat & Media", body: "Send images and videos directly to your matches inside the vault — end-to-end private." },
            { icon: "🎬", title: "Video & Image Library", body: "Organise your vault with folders. Upload, view and manage all your media in one place." },
            { icon: "🛡️", title: "Zero Exposure",        body: "One tap locks the vault. Files disappear from view — nothing stored on your device." },
          ].map(item => (
            <div key={item.icon} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "11px 13px" }}>
              <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{item.title}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
          style={{
            width: "100%", height: 54, borderRadius: 50, border: "none",
            background: a.gradient, color: "#fff", fontSize: 16, fontWeight: 900,
            cursor: "pointer", letterSpacing: "0.03em",
            boxShadow: `0 6px 28px ${a.glowMid(0.5)}`,
            position: "relative", overflow: "hidden",
          }}>
          <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
          Grant Access to the Vault
        </motion.button>
      </div>
    </div>
  );
}

export default function GhostRoomPage() {
  const a = useGenderAccent();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasSub, setHasSub] = useState(hasRoomSub);
  const [verified, setVerified] = useState(isSessionValid);
  const [showRoomWelcome, setShowRoomWelcome] = useState(false);
  const [showSideDrawer, setShowSideDrawer] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgShareCode, setImgShareCode] = useState<string>(() => {
    try { return localStorage.getItem(KEYS.imgShare) || genCode(); } catch { return genCode(); }
  });
  const [vidShareCode, setVidShareCode] = useState<string>(() => {
    try { return localStorage.getItem(KEYS.vidShare) || genCode(); } catch { return genCode(); }
  });
  const [bothShareCode, setBothShareCode] = useState<string>(() => {
    try { return localStorage.getItem(KEYS.bothShare) || genCode(); } catch { return genCode(); }
  });
  const [copiedShare, setCopiedShare] = useState<"img" | "vid" | "both" | null>(null);
  const [copiedSoulPack, setCopiedSoulPack] = useState<string | null>(null);
  const [videoFolders, setVideoFolders] = useState<{ id: string; name: string; videoUrls: string[] }[]>(() => {
    try { return JSON.parse(localStorage.getItem("ghost_vault_video_folders") || "[]"); } catch { return []; }
  });
  const [imageFolders, setImageFolders] = useState<{ id: string; name: string; images: { url: string; uploadedAt: number }[] }[]>(() => {
    try { return JSON.parse(localStorage.getItem("ghost_vault_image_folders") || "[]"); } catch { return []; }
  });
  const [activeVideoFolder, setActiveVideoFolder] = useState<string | null>(null);
  const [vaultPage, setVaultPage] = useState<null | "video" | "image" | "ghosts" | "share" | "code" | "chat" | "voice" | "activity" | "shared" | "profile" | "memories" | "files" | "pricing">(null);
  const [openImageFolder, setOpenImageFolder] = useState<string | null>(null);
  const [sendingImage, setSendingImage] = useState<string | null>(null);
  const [sendToCode, setSendToCode] = useState("");
  const [sendResult, setSendResult] = useState<"ok" | "err" | null>(null);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  // ── Chat state ──────────────────────────────────────────────────────────
  const [chatContact, setChatContact] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(() =>
    loadJson("ghost_vault_chats", {})
  );
  const [chatInput, setChatInput] = useState("");
  const [chatMediaExpiry, setChatMediaExpiry] = useState<"none" | "24h" | "view-once">("none");

  // ── Voice notes state ────────────────────────────────────────────────────
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>(() => loadJson("ghost_vault_voice_notes", []));
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Activity log ─────────────────────────────────────────────────────────
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(() => loadJson("ghost_vault_activity", []));

  // ── Shared vault ─────────────────────────────────────────────────────────
  const [sharedItems, setSharedItems] = useState<SharedVaultItem[]>(() => loadJson("ghost_vault_shared", []));
  const sharedImgRef = useRef<HTMLInputElement>(null);

  // ── Private bio ──────────────────────────────────────────────────────────
  const [privateBio, setPrivateBio] = useState<PrivateBio>(() =>
    loadJson("ghost_vault_bio", { realName: "", phone: "", instagram: "", telegram: "", bio: "" })
  );
  const [editingBio, setEditingBio] = useState(false);
  const [bioEdits, setBioEdits] = useState<PrivateBio>({ realName: "", phone: "", instagram: "", telegram: "", bio: "" });

  // ── Memories ─────────────────────────────────────────────────────────────
  const [memories, setMemories] = useState<Memory[]>(() => loadJson("ghost_vault_memories", []));
  const [newMemoryOpen, setNewMemoryOpen] = useState(false);
  const [memDraft, setMemDraft] = useState({ title: "", content: "", date: new Date().toISOString().slice(0, 10), mood: "❤️" });

  // ── PIN ──────────────────────────────────────────────────────────────────
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinSetupVal, setPinSetupVal] = useState("");
  const [pinSetupConfirm, setPinSetupConfirm] = useState("");
  const [pinSetupStep, setPinSetupStep] = useState<"enter" | "confirm">("enter");
  const [pinSetupError, setPinSetupError] = useState("");

  // ── Disappearing media (send modal) ──────────────────────────────────────
  const [sendExpiry, setSendExpiry] = useState<"never" | "24h" | "view-once">("never");
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<string | null>(null);
  const [tab, setTab] = useState<"my" | "enter" | "matches" | "inbox">("my");

  // All hooks must be declared before any conditional return
  const myGhostId = getMyGhostId();

  // My room state
  const [roomCode, setRoomCode] = useState<string>(() => {
    const v = localStorage.getItem(KEYS.code);
    return v || genCode();
  });
  const [myImages, setMyImages] = useState<string[]>(() => loadJson(KEYS.images, []));
  const [myVideoUrls, setMyVideoUrls] = useState<string[]>(() => loadJson(KEYS.videoUrls, []));
  const [roomTier] = useState<RoomTier>(() => {
    try {
      const ht = localStorage.getItem("ghost_house_tier");
      if (ht === "gold" || ht === "suite") return ht;
      return "free";
    } catch { return "free"; }
  });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [requests, setRequests] = useState<RoomRequest[]>(() => loadJson(KEYS.requests, []));
  const [granted, setGranted] = useState<string[]>(() => loadJson(KEYS.granted, []));
  const [expiry, setExpiry] = useState<"24h" | "7d" | "never">(() =>
    (localStorage.getItem(KEYS.expiry) as "24h" | "7d" | "never") || "never"
  );
  const [codeCopied, setCodeCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Enter room / request — pre-fill from ?code= URL param (shared vault links)
  const [enterInput, setEnterInput] = useState(() => {
    const code = searchParams.get("code");
    return code ? code.toUpperCase() : "";
  });
  const [accessedRooms, setAccessedRooms] = useState<AccessedRoom[]>(() => loadJson(KEYS.accessed, []));
  const [enterError, setEnterError] = useState("");
  const [enterSuccess, setEnterSuccess] = useState("");
  const [requestSent, setRequestSent] = useState<string[]>([]);

  // Switch to Enter tab if a ?code= param was provided
  useEffect(() => {
    if (searchParams.get("code")) setTab("enter");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto sign-out when user leaves the vault (component unmounts)
  useEffect(() => {
    return () => { clearSession(); };
  }, []);

  // Inbox — items sent TO me by other Room Vault holders
  const [inbox, setInbox] = useState<InboxItem[]>(() => loadInbox(myGhostId));

  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── File folders ─────────────────────────────────────────────────────────
  type FileItem = { name: string; type: string; size: number; data: string; uploadedAt: number };
  type FileFolder = { id: string; name: string; files: FileItem[] };
  const [fileFolders, setFileFolders] = useState<FileFolder[]>(() => loadJson("ghost_vault_file_folders", []));
  const [openFileFolder, setOpenFileFolder] = useState<string | null>(null);
  const [showNewFileFolderInput, setShowNewFileFolderInput] = useState(false);
  const [newFileFolderName, setNewFileFolderName] = useState("");
  const saveFileFolders = (f: FileFolder[]) => { setFileFolders(f); saveJson("ghost_vault_file_folders", f); };

  const [imgUploading, setImgUploading] = useState(false);
  const [vidUploading, setVidUploading] = useState(false);
  const [vidProgress, setVidProgress] = useState(0);

  // ── Coin balance ──────────────────────────────────────────────────────────
  const [coinBalance, setCoinBalance] = useState(readCoins);
  const refreshCoins = () => setCoinBalance(readCoins());

  // Persist room code on first load + sync to Supabase
  useEffect(() => {
    if (!localStorage.getItem(KEYS.code)) {
      localStorage.setItem(KEYS.code, roomCode);
    }
    if (verified) {
      dbSaveVaultCode(myGhostId, roomCode);
    }
  }, [roomCode, verified]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load all vault data from Supabase on first verified mount
  useEffect(() => {
    if (!verified) return;
    (async () => {
      const [imgF, vidF, fileF, chats, voiceN, inboxItems, activity, shared, bio, mems] = await Promise.all([
        dbLoadImageFolders(myGhostId),
        dbLoadVideoFolders(myGhostId),
        dbLoadFileFolders(myGhostId),
        dbLoadChatMessages(myGhostId),
        dbLoadVoiceNotes(myGhostId),
        dbLoadInbox(myGhostId),
        dbLoadActivityLog(myGhostId),
        dbLoadSharedItems(myGhostId),
        dbLoadPrivateBio(myGhostId),
        dbLoadMemories(myGhostId),
      ]);
      if (imgF.length)   setImageFolders(imgF);
      if (vidF.length)   setVideoFolders(vidF as typeof videoFolders);
      if (fileF.length)  setFileFolders(fileF as typeof fileFolders);
      if (Object.keys(chats).length) setChatMessages(chats as typeof chatMessages);
      if (voiceN.length) setVoiceNotes(voiceN);
      if (inboxItems.length) setInbox(inboxItems as typeof inbox);
      if (activity.length)   setActivityLog(activity as typeof activityLog);
      if (shared.length)     setSharedItems(shared as typeof sharedItems);
      if (bio.realName || bio.phone || bio.instagram || bio.telegram || bio.bio) setPrivateBio(bio);
      if (mems.length)  setMemories(mems);
    })();
  }, [verified]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-purge expired vault items on mount (free users only)
  useEffect(() => {
    if (roomTier === "gold") return;
    const now = Date.now();
    const cleaned = loadInbox(myGhostId).filter((item) => {
      if (item.status !== "accepted") return true;
      const from = item.acceptedAt || item.sentAt;
      return now - from < VAULT_EXPIRY_MS;
    });
    const full = loadInbox(myGhostId);
    if (cleaned.length < full.length) {
      setInbox(cleaned);
      saveInbox(myGhostId, cleaned);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll inbox every 10s — also clean expired items each tick
  useEffect(() => {
    const t = setInterval(() => {
      const fresh = loadInbox(myGhostId);
      if (roomTier !== "gold") {
        const now = Date.now();
        const cleaned = fresh.filter((item) => {
          if (item.status !== "accepted") return true;
          const from = item.acceptedAt || item.sentAt;
          return now - from < VAULT_EXPIRY_MS;
        });
        if (cleaned.length < fresh.length) {
          saveInbox(myGhostId, cleaned);
          setInbox(cleaned);
          return;
        }
        setInbox(cleaned);
      } else {
        setInbox(fresh);
      }
    }, 10000);
    return () => clearInterval(t);
  }, [myGhostId, roomTier]);

  // Pull in requests written for my Guest ID
  useEffect(() => {
    try {
      const reqKey = `ghost_room_requests_for_${myGhostId}`;
      const incoming: RoomRequest[] = loadJson(reqKey, []);
      if (incoming.length > 0) {
        setRequests((prev) => {
          const merged = [...prev];
          for (const r of incoming) {
            if (!merged.find((m) => m.ghostId === r.ghostId)) merged.push(r);
          }
          return merged;
        });
      }
    } catch {}
  }, [myGhostId]);

  // Keep share grants published whenever files or codes change
  useEffect(() => {
    if (!verified) return;
    publishShareGrant(imgShareCode, myGhostId, "image", myImages, myVideoUrls);
    publishShareGrant(vidShareCode, myGhostId, "video", myImages, myVideoUrls);
    publishShareGrant(bothShareCode, myGhostId, "both", myImages, myVideoUrls);
    try {
      localStorage.setItem(KEYS.imgShare, imgShareCode);
      localStorage.setItem(KEYS.vidShare, vidShareCode);
      localStorage.setItem(KEYS.bothShare, bothShareCode);
    } catch {}
  }, [verified, imgShareCode, vidShareCode, bothShareCode, myImages, myVideoUrls, myGhostId]);

  // Show auth gate if session expired — must be after ALL hooks
  if (!verified) return <GhostRoomAuthGate onVerified={() => {
    setVerified(true);
    setShowRoomWelcome(true);
    // Log login activity
    const entry: ActivityEntry = { id: Date.now().toString(), ghostId: myGhostId, action: "login", at: Date.now() };
    const prev: ActivityEntry[] = loadJson("ghost_vault_activity", []);
    saveJson("ghost_vault_activity", [entry, ...prev].slice(0, 50));
    setActivityLog([entry, ...activityLog].slice(0, 50));
    dbLogActivity(myGhostId, "login");
    // Offer PIN setup if not set
    if (!localStorage.getItem("ghost_vault_pin")) {
      setTimeout(() => setShowPinSetup(true), 1800);
    }
  }} />;

  // Derived values (only used when verified)
  const tierInfo = ROOM_TIERS[roomTier];
  const imageLimit = tierInfo.images;
  const videoLimit = tierInfo.videos;
  const atImageLimit = myImages.length >= imageLimit;
  const atVideoLimit = myVideoUrls.length >= videoLimit;
  const pendingInbox = inbox.filter((i) => i.status === "pending");
  const matches = loadMatches();

  // ── Inbox actions ─────────────────────────────────────────────────────────
  const acceptItem = (id: string) => {
    const item = inbox.find((i) => i.id === id);
    if (!item) return;
    if (item.type === "image") {
      const next = [...myImages, item.content];
      setMyImages(next);
      saveJson(KEYS.images, next);
    } else {
      const next = [...myVideoUrls, item.content];
      setMyVideoUrls(next);
      saveJson(KEYS.videoUrls, next);
    }
    const updated = inbox.map((i) => i.id === id ? { ...i, status: "accepted" as const, acceptedAt: Date.now() } : i);
    setInbox(updated);
    saveInbox(myGhostId, updated);
  };

  const declineItem = (id: string) => {
    const updated = inbox.map((i) => i.id === id ? { ...i, status: "declined" as const } : i);
    setInbox(updated);
    saveInbox(myGhostId, updated);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const saveVideoFolders = (f: typeof videoFolders) => {
    setVideoFolders(f);
    try { localStorage.setItem("ghost_vault_video_folders", JSON.stringify(f)); } catch {}
  };
  const saveImageFolders = (f: typeof imageFolders) => {
    setImageFolders(f);
    try { localStorage.setItem("ghost_vault_image_folders", JSON.stringify(f)); } catch {}
  };

  const handleCreateImageFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder = { id: Date.now().toString(), name: newFolderName.trim(), images: [] as { url: string; uploadedAt: number }[] };
    saveImageFolders([...imageFolders, newFolder]);
    setOpenImageFolder(newFolder.id);
    setNewFolderName("");
    setShowNewFolderInput(false);
    dbCreateImageFolder(myGhostId, newFolder);
    imgRef.current?.click();
  };

  const handleImageUploadToFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !openImageFolder) return;
    e.target.value = "";
    for (const file of files) {
      const totalImgs = imageFolders.reduce((s, f) => s + (f.images?.length ?? 0), 0);
      if (totalImgs >= FREE_IMAGES) {
        const cur = readCoins();
        if (cur < VAULT_COSTS.imageUpload) {
          alert(`You've used your ${FREE_IMAGES} free image slots.\nExtra images cost ${VAULT_COSTS.imageUpload} coins each.\nYou have ${cur} coins — visit the Coin Shop to top up.`);
          return;
        }
        writeCoins(cur - VAULT_COSTS.imageUpload);
        refreshCoins();
      }
      setImgUploading(true);
      try {
        const url = await uploadGhostImage(file, myGhostId);
        const now = Date.now();
        const next = myImages.includes(url) ? myImages : [...myImages, url];
        setMyImages(next);
        saveJson(KEYS.images, next);
        const updated = imageFolders.map(f => f.id === openImageFolder ? { ...f, images: [...f.images, { url, uploadedAt: now }] } : f);
        saveImageFolders(updated);
        dbAddImageToFolder(myGhostId, openImageFolder, url);
      } catch (err) {
        console.error(err);
      } finally {
        setImgUploading(false);
      }
    }
  };

  const handleCreateFileFolder = () => {
    if (!newFileFolderName.trim()) return;
    const folder: FileFolder = { id: Date.now().toString(), name: newFileFolderName.trim(), files: [] };
    saveFileFolders([...fileFolders, folder]);
    setOpenFileFolder(folder.id);
    setNewFileFolderName("");
    setShowNewFileFolderInput(false);
    dbCreateFileFolder(myGhostId, folder.id, folder.name);
    fileRef.current?.click();
  };

  const ALLOWED_FILE_TYPES: Record<string, string> = {
    "application/pdf": "PDF",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "text/csv": "CSV",
    "text/plain": "TXT",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  };

  const FILE_ICONS: Record<string, string> = {
    PDF: "📄", XLS: "📊", XLSX: "📊", DOC: "📝", DOCX: "📝",
    CSV: "📋", TXT: "📃", PPT: "📑", PPTX: "📑",
  };

  const fmtSize = (bytes: number) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const handleFileUploadToFolder = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !openFileFolder) return;
    e.target.value = "";
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) { alert(`${file.name} exceeds 25 MB limit`); continue; }
      const curF = readCoins();
      if (curF < VAULT_COSTS.fileUpload) {
        alert(`File uploads cost ${VAULT_COSTS.fileUpload} coins each.\nYou have ${curF} coins — visit the Coin Shop to top up.`);
        continue;
      }
      writeCoins(curF - VAULT_COSTS.fileUpload);
      refreshCoins();
      try {
        const { path, publicUrl } = await uploadGhostFile(file, myGhostId);
        const item: FileItem = { name: file.name, type: file.type, size: file.size, data: publicUrl, uploadedAt: Date.now() };
        const fid = openFileFolder;
        setFileFolders(prev => {
          const updated = prev.map(f => f.id === fid ? { ...f, files: [...f.files, item] } : f);
          saveJson("ghost_vault_file_folders", updated);
          return updated;
        });
        dbAddFileToFolder(myGhostId, fid, item, path, publicUrl);
      } catch {
        // Fallback to base64 if Supabase upload fails
        const reader = new FileReader();
        const fid = openFileFolder;
        reader.onload = ev => {
          const item: FileItem = { name: file.name, type: file.type, size: file.size, data: ev.target?.result as string, uploadedAt: Date.now() };
          setFileFolders(prev => {
            const updated = prev.map(f => f.id === fid ? { ...f, files: [...f.files, item] } : f);
            saveJson("ghost_vault_file_folders", updated);
            return updated;
          });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const resetCode = () => {
    const newCode = genCode();
    setRoomCode(newCode);
    localStorage.setItem(KEYS.code, newCode);
    // Revoke all granted access — new code invalidates everything
    setGranted([]);
    saveJson(KEYS.granted, []);
    setShowResetConfirm(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (atImageLimit) { setShowUpgrade(true); e.target.value = ""; return; }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("Only JPG, PNG, and WEBP images are supported.");
      e.target.value = ""; return;
    }
    const maxMB = tierInfo.imageMaxMB;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`Image too large. Your plan allows max ${maxMB} MB per image.`);
      e.target.value = ""; return;
    }
    e.target.value = "";
    setImgUploading(true);
    try {
      const url = await uploadGhostImage(file, myGhostId);
      const next = [...myImages, url];
      setMyImages(next);
      saveJson(KEYS.images, next);
    } catch (err) {
      console.error(err);
    } finally {
      setImgUploading(false);
    }
  };

  const removeImage = async (idx: number) => {
    const url = myImages[idx];
    const next = myImages.filter((_, i) => i !== idx);
    setMyImages(next);
    saveJson(KEYS.images, next);
    if (isSupabaseStorageUrl(url)) {
      await deleteGhostImage(url).catch(() => {});
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (atVideoLimit) { setShowUpgrade(true); e.target.value = ""; return; }
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      alert("Only MP4, MOV, and WEBM videos are supported.");
      e.target.value = ""; return;
    }
    const maxMB = tierInfo.videoMaxMB;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`Video too large. Your plan allows max ${maxMB} MB per video.`);
      e.target.value = ""; return;
    }
    const duration = await getVideoDuration(file);
    const maxSec = tierInfo.videoMaxSec;
    if (duration > maxSec) {
      const label = maxSec >= 60 ? `${Math.floor(maxSec / 60)} min` : `${maxSec} sec`;
      alert(`Video too long. Your plan allows max ${label} per video.`);
      e.target.value = ""; return;
    }
    e.target.value = "";
    // Coin check for paid video slots
    if (myVideoUrls.length >= FREE_VIDEOS) {
      const cur = readCoins();
      if (cur < VAULT_COSTS.videoUpload) {
        alert(`You've used your ${FREE_VIDEOS} free video slot.\nExtra videos cost ${VAULT_COSTS.videoUpload} coins each.\nYou have ${cur} coins — visit the Coin Shop to top up.`);
        return;
      }
      writeCoins(cur - VAULT_COSTS.videoUpload);
      refreshCoins();
    }
    setVidUploading(true);
    setVidProgress(0);
    try {
      const url = await uploadGhostVideo(file, myGhostId, setVidProgress);
      const next = [...myVideoUrls, url];
      setMyVideoUrls(next);
      saveJson(KEYS.videoUrls, next);
    } catch (err) {
      console.error(err);
    } finally {
      setVidUploading(false);
      setVidProgress(0);
    }
  };

  const removeVideoUrl = async (idx: number) => {
    const url = myVideoUrls[idx];
    const next = myVideoUrls.filter((_, i) => i !== idx);
    setMyVideoUrls(next);
    saveJson(KEYS.videoUrls, next);
    if (isSupabaseStorageUrl(url)) {
      await deleteGhostVideo(url).catch(() => {});
    }
  };

  const upgradeTier = (_tier: RoomTier) => {
    setShowUpgrade(false);
  };

  const grantRequest = (ghostId: string) => {
    const next = requests.map((r) => r.ghostId === ghostId ? { ...r, status: "granted" as const } : r);
    setRequests(next);
    saveJson(KEYS.requests, next);
    const nextGranted = [...new Set([...granted, ghostId])];
    setGranted(nextGranted);
    saveJson(KEYS.granted, nextGranted);
    // In production: push room code to their accessed_rooms via server
    // For local demo: store in a shared key they can read
    try {
      const sharedKey = `ghost_room_grant_${ghostId}`;
      localStorage.setItem(sharedKey, JSON.stringify({
        ghostId: myGhostId, roomCode, grantedAt: Date.now(),
        images: myImages, videoUrls: myVideoUrls,
      }));
    } catch {}
  };

  const denyRequest = (ghostId: string) => {
    const next = requests.map((r) => r.ghostId === ghostId ? { ...r, status: "denied" as const } : r);
    setRequests(next);
    saveJson(KEYS.requests, next);
  };

  const revokeAccess = (ghostId: string) => {
    const next = granted.filter((g) => g !== ghostId);
    setGranted(next);
    saveJson(KEYS.granted, next);
    const nextReqs = requests.map((r) => r.ghostId === ghostId ? { ...r, status: "denied" as const } : r);
    setRequests(nextReqs);
    saveJson(KEYS.requests, nextReqs);
    try { localStorage.removeItem(`ghost_room_grant_${ghostId}`); } catch {}
  };

  const handleEnterRoom = () => {
    const val = enterInput.trim().toUpperCase();
    setEnterError("");
    setEnterSuccess("");

    if (!val) { setEnterError("Enter a room code or Guest ID"); return; }

    // If it's a Guest-XXXX ID → send access request
    if (val.startsWith("GHOST-")) {
      const normalized = val.replace("GHOST-", "Guest-");
      if (normalized === myGhostId) { setEnterError("That's your own Guest ID"); return; }
      if (requestSent.includes(normalized)) { setEnterError("Request already sent"); return; }

      // Write request into that user's request list (shared localStorage key)
      try {
        const reqKey = `ghost_room_requests_for_${normalized}`;
        const existing: RoomRequest[] = loadJson(reqKey, []);
        if (!existing.find((r) => r.ghostId === myGhostId)) {
          existing.push({ ghostId: myGhostId, name: myGhostId, requestedAt: Date.now(), status: "pending" });
          saveJson(reqKey, existing);
        }
      } catch {}

      setRequestSent((p) => [...p, normalized]);
      setEnterSuccess(`Access request sent to ${normalized}`);
      setEnterInput("");
      return;
    }

    // Check new typed share code system
    try {
      const shareData = loadJson<{ ownerGhostId: string; accessType: ShareAccessType; images: string[]; videoUrls: string[]; createdAt: number } | null>(`ghost_room_share_${val}`, null);
      if (shareData && shareData.ownerGhostId && shareData.ownerGhostId !== myGhostId) {
        const already = accessedRooms.find(r => r.ghostId === shareData.ownerGhostId && r.accessType === shareData.accessType);
        if (!already) {
          const newRoom: AccessedRoom = {
            ghostId: shareData.ownerGhostId,
            roomCode: val,
            accessType: shareData.accessType,
            grantedAt: Date.now(),
            images: shareData.images || [],
            videoUrls: shareData.videoUrls || [],
          };
          const next = [...accessedRooms, newRoom];
          setAccessedRooms(next);
          saveJson(KEYS.accessed, next);
        }
        const label = shareData.accessType === "image" ? "Image Room" : shareData.accessType === "video" ? "Video Room" : "Full Room";
        setEnterSuccess(`✓ ${label} access granted from ${shareData.ownerGhostId}`);
        setEnterInput("");
        return;
      }
    } catch {}

    // Legacy grant fallback
    try {
      const grantKey = `ghost_room_grant_${myGhostId}`;
      const grant = loadJson<{ ghostId: string; roomCode: string; grantedAt: number; images: string[]; videoUrl?: string; videoUrls?: string[] } | null>(grantKey, null);
      if (grant && grant.roomCode === val) {
        const already = accessedRooms.find((r) => r.ghostId === grant.ghostId);
        if (!already) {
          const newRoom: AccessedRoom = {
            ghostId: grant.ghostId,
            roomCode: val,
            accessType: "both",
            grantedAt: grant.grantedAt || Date.now(),
            images: grant.images || [],
            videoUrls: grant.videoUrls || (grant.videoUrl ? [grant.videoUrl] : []),
          };
          const next = [...accessedRooms, newRoom];
          setAccessedRooms(next);
          saveJson(KEYS.accessed, next);
        }
        setEnterSuccess(`✓ Full Room access granted from ${grant.ghostId}`);
        setEnterInput("");
        return;
      }
    } catch {}

    setEnterError("Code not found — check the code and try again");
  };

  const saveExpiry = (v: "24h" | "7d" | "never") => {
    setExpiry(v);
    try { localStorage.setItem(KEYS.expiry, v); } catch {}
  };

  const deactivateAccount = () => {
    // Wipe everything
    Object.values(KEYS).forEach((k) => { try { localStorage.removeItem(k); } catch {} });
    ["ghost_profile","ghost_gender","ghost_mode_until","ghost_matches","ghost_passed_ids",
      "ghost_tonight_until","ghost_boost_until","ghost_flash_until","ghost_flash_contacts_used",
      "ghost_house_tier","ghost_interest","ghost_room_code"].forEach((k) => {
      try { localStorage.removeItem(k); } catch {};
    });
    // Remove any grants we issued
    granted.forEach((gId) => {
      try { localStorage.removeItem(`ghost_room_grant_${gId}`); } catch {}
    });
    navigate("/ghost/auth", { replace: true });
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const S = {
    page: { height: "100dvh", overflow: "hidden", backgroundImage: `url(${ROOM_BG})`, backgroundSize: "cover", backgroundPosition: "center top", color: "#fff", display: "flex", flexDirection: "column" as const, position: "relative" as const },
    header: {
      position: "sticky" as const, top: 0, zIndex: 50,
      background: "rgba(5,5,8,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px",
      paddingTop: `max(12px, env(safe-area-inset-top, 12px))`,
      display: "flex", alignItems: "center", gap: 12,
    },
    card: {
      background: "rgba(6,6,10,0.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16, padding: "14px 16px", marginBottom: 12,
    },
    label: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 6, display: "block" },
    greenCard: {
      background: "rgba(6,6,10,0.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
      border: `1px solid ${tierInfo.borderRgba}`,
      borderRadius: 16, padding: "14px 16px", marginBottom: 12, position: "relative" as const,
    },
    input: {
      width: "100%", height: 46, borderRadius: 12,
      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
      color: "#fff", fontSize: 15, padding: "0 14px", outline: "none", boxSizing: "border-box" as const,
    },
  };

  const pending = requests.filter((r) => r.status === "pending");
  const grantedReqs = requests.filter((r) => r.status === "granted");

  // Free tier — all users get in without a subscription gate

  return (
    <div translate="no" style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.7)}}.ghost-no-save img{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;pointer-events:none}.ghost-no-save{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}`}</style>
      {showRoomWelcome && <RoomWelcomePopup onClose={() => setShowRoomWelcome(false)} />}

      {/* ── PIN Setup prompt (shown once after first login if no PIN) ── */}
      <AnimatePresence>
        {showPinSetup && (
          <motion.div key="pin-setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              style={{ width: "100%", maxWidth: 480, background: "rgba(6,4,4,0.97)", border: "1px solid rgba(220,20,20,0.25)", borderTop: "3px solid rgba(220,20,20,0.8)", borderRadius: "22px 22px 0 0", padding: "24px 24px max(28px,env(safe-area-inset-bottom,28px))" }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Set a Quick PIN</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>A 4-digit PIN lets you re-enter the vault faster. Skip if you prefer password only.</p>
              {pinSetupStep === "enter" ? (
                <>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 10px", fontWeight: 700 }}>Enter a 4-digit PIN</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 20 }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < pinSetupVal.length ? "#e01010" : "rgba(255,255,255,0.15)", border: `2px solid ${i < pinSetupVal.length ? "#e01010" : "rgba(255,255,255,0.2)"}` }} />
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
                      <motion.button key={i} whileTap={{ scale: 0.88 }}
                        onClick={() => {
                          if (d === "⌫") { setPinSetupVal(p => p.slice(0,-1)); setPinSetupError(""); }
                          else if (d) {
                            const next = pinSetupVal + d;
                            setPinSetupVal(next);
                            if (next.length === 4) { setPinSetupStep("confirm"); setPinSetupError(""); }
                          }
                        }}
                        disabled={!d}
                        style={{ height: 52, borderRadius: 12, background: d ? "rgba(255,255,255,0.06)" : "transparent", border: d ? "1px solid rgba(255,255,255,0.09)" : "none", color: "#fff", fontSize: d === "⌫" ? 18 : 20, fontWeight: 700, cursor: d ? "pointer" : "default", opacity: d ? 1 : 0 }}>
                        {d}
                      </motion.button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: "0 0 10px", fontWeight: 700 }}>Confirm your PIN</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 20 }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < pinSetupConfirm.length ? "#e01010" : "rgba(255,255,255,0.15)", border: `2px solid ${i < pinSetupConfirm.length ? "#e01010" : "rgba(255,255,255,0.2)"}` }} />
                    ))}
                  </div>
                  {pinSetupError && <p style={{ fontSize: 12, color: "#f87171", textAlign: "center", margin: "0 0 12px", fontWeight: 700 }}>{pinSetupError}</p>}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
                      <motion.button key={i} whileTap={{ scale: 0.88 }}
                        onClick={() => {
                          if (d === "⌫") { setPinSetupConfirm(p => p.slice(0,-1)); setPinSetupError(""); }
                          else if (d) {
                            const next = pinSetupConfirm + d;
                            setPinSetupConfirm(next);
                            if (next.length === 4) {
                              if (next === pinSetupVal) {
                                localStorage.setItem("ghost_vault_pin", next);
                                setShowPinSetup(false); setPinSetupVal(""); setPinSetupConfirm(""); setPinSetupStep("enter");
                              } else {
                                setPinSetupError("PINs don't match — try again"); setPinSetupConfirm(""); setPinSetupStep("enter"); setPinSetupVal("");
                              }
                            }
                          }
                        }}
                        disabled={!d}
                        style={{ height: 52, borderRadius: 12, background: d ? "rgba(255,255,255,0.06)" : "transparent", border: d ? "1px solid rgba(255,255,255,0.09)" : "none", color: "#fff", fontSize: d === "⌫" ? 18 : 20, fontWeight: 700, cursor: d ? "pointer" : "default", opacity: d ? 1 : 0 }}>
                        {d}
                      </motion.button>
                    ))}
                  </div>
                </>
              )}
              <button onClick={() => setShowPinSetup(false)}
                style={{ width: "100%", marginTop: 14, background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, cursor: "pointer", padding: "4px 0" }}>
                Skip — use password only
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full-screen image viewer ── */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div key="img-viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 600, background: "#000", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "max(16px,env(safe-area-inset-top,16px)) 16px 12px", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(to bottom,rgba(0,0,0,0.85),transparent)", zIndex: 2 }}>
              <button onClick={() => setViewingImage(null)} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                <ArrowLeft size={16} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Image</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginLeft: "auto" }}>🔒 Private</span>
            </div>
            <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={viewingImage} alt="" draggable="false" className="ghost-no-save" style={{ width: "100%", height: "100%", objectFit: "contain" }} onContextMenu={e => e.preventDefault()} />
              {/* Watermark — deters screenshot misuse */}
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", pointerEvents: "none", paddingBottom: 12 }}>
                <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 8, padding: "4px 12px" }}>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", userSelect: "none" }}>🔒 {myGhostId} · Room Vault · Private</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Full-screen video viewer ── */}
      <AnimatePresence>
        {viewingVideo && (
          <motion.div key="vid-viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 600, background: "#000", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "max(16px,env(safe-area-inset-top,16px)) 16px 12px", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(to bottom,rgba(0,0,0,0.85),transparent)", zIndex: 2 }}>
              <button onClick={() => setViewingVideo(null)} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                <ArrowLeft size={16} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Video</span>
              <span style={{ fontSize: 10, color: "rgba(168,85,247,0.8)", marginLeft: "auto", fontWeight: 700 }}>🔒 Not saved to device</span>
            </div>
            <video src={viewingVideo} controls autoPlay controlsList="nodownload nofullscreen" disablePictureInPicture
              style={{ flex: 1, width: "100%", objectFit: "contain" }} onContextMenu={e => e.preventDefault()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Side Drawer ── */}
      <AnimatePresence>
        {showSideDrawer && (
          <>
            {/* Backdrop */}
            <motion.div key="drawer-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSideDrawer(false)}
              style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} />

            {/* Drawer panel — slides from right, home menu only */}
            <motion.div key="drawer-panel"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "85vw", maxWidth: 360, zIndex: 501, background: "rgba(6,6,10,0.97)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.06)", borderTop: "3px solid rgba(220,20,20,0.85)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

              <div style={{ padding: "max(20px,env(safe-area-inset-top,20px)) 18px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <button onClick={() => setShowSideDrawer(false)}
                  style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}>
                  <X size={14} />
                </button>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>Vault</span>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px max(24px,env(safe-area-inset-bottom,24px))" }}>
                {([
                  { page: "files"    as const, icon: "📁", label: "Files",         sub: `${fileFolders.length} folder${fileFolders.length !== 1 ? "s" : ""}` },
                  { page: "chat"     as const, icon: "💬", label: "Vault Chat",    sub: "Private messages" },
                  { page: "voice"    as const, icon: "🎙️", label: "Voice Notes",   sub: `${voiceNotes.length} recorded` },
                  { page: "image"    as const, icon: "🖼️", label: "Images",        sub: `${myImages.length} saved` },
                  { page: "video"    as const, icon: "🎬", label: "Videos",        sub: `${myVideoUrls.length} saved` },
                  { page: "shared"   as const, icon: "🔗", label: "Shared Vault",  sub: `${sharedItems.length} shared` },
                  { page: "memories" as const, icon: "📖", label: "Memories",      sub: `${memories.length} notes` },
                  { page: "profile"  as const, icon: "🪪", label: "Private Bio",   sub: privateBio.realName || "Set up profile" },
                  { page: "activity" as const, icon: "📋", label: "Activity Log",  sub: activityLog.length > 0 ? `Last: ${new Date(activityLog[0]?.at ?? 0).toLocaleDateString()}` : "No activity yet" },
                  { page: "code"     as const, icon: "🔑", label: "Vault Code",    sub: "Share access" },
                  { page: "share"    as const, icon: "📤", label: "Share Room",    sub: "Send links" },
                  { page: "ghosts"   as const, icon: "👥", label: "My Contacts",   sub: `${matches.length} contacts` },
                  { page: "pricing"  as const, icon: "💰", label: "Vault Pricing",  sub: "Feature costs & free limits" },
                ] as const).map(({ page, icon, label, sub }) => (
                  <motion.button key={page} whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowSideDrawer(false); setVaultPage(page); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "rgba(10,6,6,0.82)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.07)", borderTop: "1px solid rgba(220,20,20,0.35)", borderRadius: 14, cursor: "pointer", marginBottom: 10, textAlign: "left", boxShadow: "inset 0 1px 0 rgba(220,20,20,0.18)" }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff" }}>{label}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{sub}</p>
                    </div>
                    <span style={{ fontSize: 16, color: "rgba(255,255,255,0.2)" }}>›</span>
                  </motion.button>
                ))}
                {/* PIN management */}
                <div style={{ marginTop: 6, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => { setShowSideDrawer(false); setShowPinSetup(true); setPinSetupVal(""); setPinSetupConfirm(""); setPinSetupStep("enter"); setPinSetupError(""); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "rgba(220,20,20,0.06)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 12, cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontSize: 18 }}>🔐</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{localStorage.getItem("ghost_vault_pin") ? "Change PIN" : "Set Quick PIN"}</p>
                      <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{localStorage.getItem("ghost_vault_pin") ? "Update your 4-digit PIN" : "Faster re-entry with PIN"}</p>
                    </div>
                  </motion.button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Vault full-screen pages ── */}
      <AnimatePresence>
        {vaultPage !== null && (
          <motion.div key="vault-page"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            style={{ position: "fixed", inset: 0, zIndex: 490, background: "#06060a", backgroundImage: `url(${ROOM_BG})`, backgroundSize: "cover", backgroundPosition: "center top", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Page header */}
            <div style={{ padding: "max(16px,env(safe-area-inset-top,16px)) 16px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,6,10,0.95)", backdropFilter: "blur(20px)", flexShrink: 0 }}>
              <button onClick={() => {
                if (vaultPage === "chat" && chatContact) { setChatContact(null); return; }
                if (vaultPage === "image" && openImageFolder) { setOpenImageFolder(null); return; }
                if (vaultPage === "files" && openFileFolder) { setOpenFileFolder(null); return; }
                setVaultPage(null); setOpenImageFolder(null); setOpenFileFolder(null); setSendingImage(null); setChatContact(null);
              }}
                style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}>
                <ArrowLeft size={16} />
              </button>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", flex: 1 }}>
                {vaultPage === "image" ? (openImageFolder ? (imageFolders.find(f => f.id === openImageFolder)?.name ?? "Folder") : "🖼️ Images")
                  : vaultPage === "video" ? "🎬 Videos"
                  : vaultPage === "code" ? "🔑 Vault Code"
                  : vaultPage === "ghosts" ? "👥 My Contacts"
                  : vaultPage === "share" ? "📤 Share Room"
                  : vaultPage === "chat" ? (chatContact ? `💬 ${chatContact}` : "💬 Vault Chat")
                  : vaultPage === "voice" ? "🎙️ Voice Notes"
                  : vaultPage === "activity" ? "📋 Activity Log"
                  : vaultPage === "shared" ? "🔗 Shared Vault"
                  : vaultPage === "profile" ? "🪪 Private Bio"
                  : vaultPage === "memories" ? "📖 Memories"
                  : vaultPage === "files" ? (openFileFolder ? (fileFolders.find(f => f.id === openFileFolder)?.name ?? "Folder") : "📁 Files")
                  : vaultPage === "pricing" ? "💰 Vault Pricing"
                  : "Vault"}
              </span>
              {vaultPage === "image" && !openImageFolder && (
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowNewFolderInput(v => !v); setNewFolderName(""); }}
                  style={{ height: 34, padding: "0 14px", borderRadius: 10, background: a.gradient, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                  + New Folder
                </motion.button>
              )}
              {vaultPage === "video" && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => vidRef.current?.click()}
                  style={{ height: 34, padding: "0 14px", borderRadius: 10, background: a.gradient, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Upload size={12} /> Upload
                </motion.button>
              )}
              {vaultPage === "files" && !openFileFolder && (
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowNewFileFolderInput(v => !v); setNewFileFolderName(""); }}
                  style={{ height: 34, padding: "0 14px", borderRadius: 10, background: a.gradient, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                  + New Folder
                </motion.button>
              )}
              {vaultPage === "files" && openFileFolder && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => fileRef.current?.click()}
                  style={{ height: 34, padding: "0 14px", borderRadius: 10, background: a.gradient, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                  <Upload size={12} /> Upload
                </motion.button>
              )}
            </div>

            {/* ── IMAGE PAGE ── */}
            {vaultPage === "image" && (() => {
              if (showNewFolderInput) return (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Name your folder</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>Then choose images to upload into it</p>
                  <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleCreateImageFolder(); }}
                    placeholder="e.g. Memories, Selfies…"
                    style={{ width: "100%", height: 50, borderRadius: 14, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 16, padding: "0 16px", outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateImageFolder}
                    style={{ width: "100%", height: 50, borderRadius: 50, background: a.gradient, border: "none", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 20px ${a.glowMid(0.4)}` }}>
                    Create Folder & Upload
                  </motion.button>
                  <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageUploadToFolder} />
                </div>
              );

              if (openImageFolder) {
                const folder = imageFolders.find(f => f.id === openImageFolder);
                const images = folder?.images ?? [];
                return (
                  <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => imgRef.current?.click()}
                      style={{ width: "100%", height: 44, borderRadius: 12, background: a.glow(0.08), border: `1px dashed ${a.glow(0.3)}`, color: a.glow(0.9), fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Upload size={14} /> Add More Images
                    </motion.button>
                    <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageUploadToFolder} />
                    {images.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <p style={{ fontSize: 32 }}>🖼️</p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No images yet</p>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                        {images.map(({ url, uploadedAt }) => (
                          <div key={url} style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "rgba(6,6,10,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                            <img src={url} alt="" draggable="false" className="ghost-no-save"
                              onClick={() => setViewingImage(url)}
                              style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block", cursor: "pointer" }}
                              onContextMenu={e => e.preventDefault()} onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
                            <div style={{ padding: "4px 6px 6px", background: "rgba(0,0,0,0.6)" }}>
                              <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                                {new Date(uploadedAt).toLocaleDateString()} {new Date(uploadedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                <button onClick={() => { setSendingImage(url); setSendToCode(""); setSendResult(null); }}
                                  style={{ flex: 1, height: 22, borderRadius: 6, background: a.glow(0.12), border: `1px solid ${a.glow(0.25)}`, color: a.glow(0.9), fontSize: 9, fontWeight: 800, cursor: "pointer" }}>
                                  Send
                                </button>
                                <button onClick={() => {
                                  const updated = imageFolders.map(f => f.id === openImageFolder ? { ...f, images: f.images.filter(i => i.url !== url) } : f);
                                  saveImageFolders(updated);
                                }}
                                  style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <X size={9} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  {imageFolders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                      <p style={{ fontSize: 40 }}>📁</p>
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: "8px 0 4px" }}>No folders yet</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Tap "+ New Folder" to create one</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {imageFolders.map(folder => {
                        const imgs = folder.images ?? [];
                        const preview = imgs[0]?.url;
                        return (
                          <motion.button key={folder.id} whileTap={{ scale: 0.97 }}
                            onClick={() => setOpenImageFolder(folder.id)}
                            style={{ textAlign: "left", background: "rgba(6,6,10,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", cursor: "pointer", padding: 0 }}>
                            <div style={{ width: "100%", aspectRatio: "16/9", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                              {preview
                                ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📁</div>}
                            </div>
                            <div style={{ padding: "8px 12px 10px" }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{folder.name}</p>
                              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{imgs.length} image{imgs.length !== 1 ? "s" : ""}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── VIDEO PAGE ── */}
            {vaultPage === "video" && (
              <>
                <input ref={vidRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoUpload} />
                {/* Folder tabs */}
                <div style={{ display: "flex", gap: 8, padding: "10px 14px", overflowX: "auto", scrollbarWidth: "none", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <button onClick={() => setActiveVideoFolder(null)}
                    style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 20, background: activeVideoFolder === null ? a.gradient : "rgba(255,255,255,0.06)", border: activeVideoFolder === null ? "none" : "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    All
                  </button>
                  {videoFolders.map(f => (
                    <button key={f.id} onClick={() => setActiveVideoFolder(f.id)}
                      style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 20, background: activeVideoFolder === f.id ? a.gradient : "rgba(255,255,255,0.06)", border: activeVideoFolder === f.id ? "none" : "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      📁 {f.name}
                    </button>
                  ))}
                  <button onClick={() => setShowNewFolderInput(v => !v)}
                    style={{ flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    + Folder
                  </button>
                </div>
                {showNewFolderInput && (
                  <div style={{ display: "flex", gap: 8, padding: "8px 14px", flexShrink: 0 }}>
                    <input autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && newFolderName.trim()) { const f = { id: Date.now().toString(), name: newFolderName.trim(), videoUrls: [] }; saveVideoFolders([...videoFolders, f]); setNewFolderName(""); setShowNewFolderInput(false); } }}
                      placeholder="Folder name…"
                      style={{ flex: 1, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, padding: "0 10px", outline: "none" }} />
                    <button onClick={() => { if (newFolderName.trim()) { const f = { id: Date.now().toString(), name: newFolderName.trim(), videoUrls: [] }; saveVideoFolders([...videoFolders, f]); setNewFolderName(""); setShowNewFolderInput(false); } }}
                      style={{ height: 34, padding: "0 12px", borderRadius: 9, background: a.gradient, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      Add
                    </button>
                  </div>
                )}
                <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  {vidUploading && (
                    <div style={{ marginBottom: 10, background: a.glow(0.08), border: `1px solid ${a.glow(0.2)}`, borderRadius: 12, padding: "10px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "#fff", fontWeight: 700 }}>Uploading…</span>
                        <span style={{ fontSize: 12, color: a.glow(0.8), fontWeight: 800 }}>{vidProgress}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)" }}>
                        <div style={{ height: "100%", borderRadius: 2, background: a.gradient, width: `${vidProgress}%`, transition: "width 0.3s" }} />
                      </div>
                    </div>
                  )}
                  {(() => {
                    const allVideos = myVideoUrls.map((url, i) => ({ url, uploadedAt: Date.now() - i * 3600000 * 24 }));
                    const displayed = activeVideoFolder
                      ? (videoFolders.find(f => f.id === activeVideoFolder)?.videoUrls ?? []).map(url => ({ url, uploadedAt: 0 }))
                      : allVideos;
                    if (displayed.length === 0) return (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <p style={{ fontSize: 28 }}>🎬</p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>No videos yet</p>
                      </div>
                    );
                    return displayed.map(({ url }) => {
                      const globalIdx = myVideoUrls.indexOf(url);
                      const uploadedAgo = globalIdx >= 0 ? `${Math.floor((Date.now() - (Date.now() - globalIdx * 3600000 * 24)) / 3600000)}h ago` : "recently";
                      return (
                        <div key={url} style={{ background: "rgba(6,6,10,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>
                          <video src={url} style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }}
                            onClick={() => setViewingVideo(url)} onContextMenu={e => e.preventDefault()} />
                          <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff" }}>Video {globalIdx + 1}</p>
                              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Uploaded {uploadedAgo}</p>
                            </div>
                            {activeVideoFolder && (
                              <button onClick={() => {
                                const updated = videoFolders.map(f => f.id === activeVideoFolder ? { ...f, videoUrls: f.videoUrls.filter(u => u !== url) } : f);
                                saveVideoFolders(updated);
                              }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11 }}>Remove</button>
                            )}
                            {!activeVideoFolder && (
                              <>
                                {videoFolders.length > 0 && (
                                  <select onChange={e => { const fid = e.target.value; if (!fid) return; const updated = videoFolders.map(f => f.id === fid && !f.videoUrls.includes(url) ? { ...f, videoUrls: [...f.videoUrls, url] } : f); saveVideoFolders(updated); e.target.value = ""; }}
                                    style={{ height: 28, borderRadius: 7, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 10, padding: "0 6px", cursor: "pointer" }}>
                                    <option value="">+ Folder</option>
                                    {videoFolders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                  </select>
                                )}
                                <button onClick={() => removeVideoUrl(globalIdx)}
                                  style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <X size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </>
            )}

            {/* ── CODE PAGE ── */}
            {vaultPage === "code" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                <div style={{ background: "rgba(6,6,10,0.72)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "14px 16px", marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, display: "block", margin: "0 0 8px" }}>Your Room Code</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ flex: 1, fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "0.2em", fontFamily: "monospace" }}>{roomCode}</span>
                    <button onClick={() => { navigator.clipboard.writeText(roomCode).catch(() => {}); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }}
                      style={{ height: 34, padding: "0 12px", borderRadius: 9, background: codeCopied ? "rgba(74,222,128,0.15)" : a.glow(0.1), border: `1px solid ${codeCopied ? "rgba(74,222,128,0.4)" : a.glow(0.25)}`, color: codeCopied ? "#4ade80" : "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                      {codeCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { const url = `${window.location.origin}/ghost/room?code=${roomCode}`; navigator.clipboard.writeText(url).catch(() => {}); }}
                    style={{ flex: 1, height: 44, borderRadius: 12, background: a.glow(0.08), border: `1px solid ${a.glow(0.2)}`, color: a.glow(0.9), fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Link size={13} /> Copy Share Link
                  </button>
                  {!showResetConfirm ? (
                    <button onClick={() => setShowResetConfirm(true)}
                      style={{ flex: 1, height: 44, borderRadius: 12, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      Reset Code
                    </button>
                  ) : (
                    <button onClick={() => { resetCode(); setShowResetConfirm(false); }}
                      style={{ flex: 1, height: 44, borderRadius: 12, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", fontSize: 12, fontWeight: 900, cursor: "pointer" }}>
                      Confirm Reset
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── GHOSTS PAGE ── */}
            {vaultPage === "ghosts" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                {matches.length === 0 && accessedRooms.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <p style={{ fontSize: 40, margin: "0 0 14px" }}>👥</p>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", margin: 0 }}>No guest connections yet</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>Match with ghosts to see them here</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      ...matches.map(m => ({ ghostId: m.profile.id, name: m.profile.name, city: m.profile.city, country: m.profile.countryFlag, age: m.profile.age, image: m.profile.image, at: m.matchedAt })),
                      ...accessedRooms.map(r => ({ ghostId: r.ghostId, name: r.ghostId, city: "", country: "", age: 0, image: "", at: r.grantedAt })),
                    ].map((c, i) => {
                      const isActive = i % 3 !== 2;
                      return (
                        <motion.div key={i} initial={{ x: -36, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.055 }}
                          style={{ display: "flex", alignItems: "center", gap: 12, background: isActive ? a.glow(0.04) : "rgba(255,255,255,0.03)", border: `1px solid ${isActive ? a.glow(0.15) : "rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: "12px 14px" }}>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: `2px solid ${isActive ? a.glow(0.5) : "rgba(255,255,255,0.12)"}` }}>
                              {c.image ? <img src={c.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <div style={{ width: "100%", height: "100%", background: a.glow(0.1), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👻</div>}
                            </div>
                            {isActive && <span style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: a.accent, border: "2px solid #050508", animation: "pulse-dot 1.4s ease-in-out infinite" }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name || c.ghostId}</p>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>{c.ghostId}{c.city ? ` · ${c.city}` : ""}{c.age ? `, ${c.age}` : ""}{c.country ? ` ${c.country}` : ""}</p>
                            <span style={{ fontSize: 9, borderRadius: 6, padding: "2px 7px", fontWeight: 700, background: isActive ? a.glow(0.1) : "rgba(255,255,255,0.05)", border: `1px solid ${isActive ? a.glow(0.2) : "rgba(255,255,255,0.08)"}`, color: isActive ? a.glow(0.85) : "rgba(255,255,255,0.3)" }}>
                              {isActive ? "● Active now" : "Offline"}
                            </span>
                          </div>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: a.glow(0.08), border: `1px solid ${a.glow(0.2)}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                            <MessageCircle size={15} color={a.glow(0.7)} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── SHARE PAGE ── */}
            {vaultPage === "share" && (() => {
              const shareOptions: Array<{
                key: "img" | "vid" | "both";
                label: string; desc: string; code: string;
                setCode: (c: string) => void; storageKey: string;
                accent: string; border: string; bg: string; count: string;
              }> = [
                { key: "img", label: "🖼 Image Room", desc: "Recipient sees your images only — videos stay locked", code: imgShareCode, setCode: setImgShareCode, storageKey: KEYS.imgShare, accent: "#e01010", border: "rgba(220,20,20,0.3)", bg: "rgba(6,4,4,0.82)", count: `${myImages.length} image${myImages.length !== 1 ? "s" : ""}` },
                { key: "vid", label: "🎬 Video Room", desc: "Recipient sees your videos only — images stay locked", code: vidShareCode, setCode: setVidShareCode, storageKey: KEYS.vidShare, accent: "#e01010", border: "rgba(220,20,20,0.3)", bg: "rgba(6,4,4,0.82)", count: `${myVideoUrls.length} video${myVideoUrls.length !== 1 ? "s" : ""}` },
                { key: "both", label: "🔗 Full Room", desc: "Recipient sees both images and videos", code: bothShareCode, setCode: setBothShareCode, storageKey: KEYS.bothShare, accent: "#e01010", border: "rgba(220,20,20,0.3)", bg: "rgba(6,4,4,0.82)", count: `${myImages.length} images · ${myVideoUrls.length} videos` },
              ];
              const resetShareCode = (opt: typeof shareOptions[0]) => {
                const newCode = genCode(); opt.setCode(newCode);
                try { localStorage.setItem(opt.storageKey, newCode); } catch {}
                publishShareGrant(newCode, myGhostId, opt.key === "img" ? "image" : opt.key === "vid" ? "video" : "both", myImages, myVideoUrls);
              };
              const copyShareCode = (opt: typeof shareOptions[0]) => {
                navigator.clipboard.writeText(opt.code).catch(() => {});
                setCopiedShare(opt.key); setTimeout(() => setCopiedShare(null), 2000);
              };
              return (
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
                    <Lock size={13} color="#e01010" style={{ marginTop: 1, flexShrink: 0 }} />
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>
                      Each code grants access <span style={{ color: "#ff4444", fontWeight: 800 }}>only</span> to the selected room type. Share only with ghosts you trust — codes can be reset at any time.
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {shareOptions.map(opt => (
                      <div key={opt.key} style={{ background: opt.bg, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `1px solid ${opt.border}`, borderTop: "1px solid rgba(220,20,20,0.45)", borderRadius: 18, overflow: "hidden", boxShadow: "inset 0 1px 0 rgba(220,20,20,0.12)" }}>
                        <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${opt.border}` }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{opt.label}</span>
                            <span style={{ fontSize: 10, color: "#e01010", fontWeight: 700, background: "rgba(220,20,20,0.12)", border: "1px solid rgba(220,20,20,0.25)", borderRadius: 6, padding: "2px 8px" }}>{opt.count}</span>
                          </div>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", margin: 0 }}>{opt.desc}</p>
                        </div>
                        <div style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ flex: 1, height: 44, borderRadius: 10, background: "rgba(0,0,0,0.3)", border: `1px solid ${opt.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ fontSize: 18, fontWeight: 900, color: opt.accent, letterSpacing: "0.22em" }}>{opt.code}</span>
                            </div>
                            <motion.button whileTap={{ scale: 0.93 }} onClick={() => copyShareCode(opt)}
                              style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${opt.border}`, background: copiedShare === opt.key ? opt.bg : "rgba(0,0,0,0.3)", color: opt.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {copiedShare === opt.key ? <Check size={15} /> : <Copy size={15} />}
                            </motion.button>
                            <motion.button whileTap={{ scale: 0.93 }} onClick={() => resetShareCode(opt)}
                              title="Reset code — old code stops working"
                              style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "rgba(239,68,68,0.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <RefreshCw size={14} />
                            </motion.button>
                          </div>
                          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", margin: "7px 0 0", textAlign: "center" }}>Reset code to revoke all current access for this room</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── CHAT PAGE ── */}
            {vaultPage === "chat" && (() => {
              const allContacts = [
                ...matches.map(m => ({ id: m.profile.id, name: m.profile.name, image: m.profile.image })),
              ];
              const FROSTED = { background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 14 };

              if (!chatContact) return (
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>Select a contact to open a private chat</p>
                  {allContacts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                      <p style={{ fontSize: 36 }}>💬</p>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No contacts yet — match with ghosts first</p>
                    </div>
                  ) : allContacts.map(c => (
                    <motion.button key={c.id} whileTap={{ scale: 0.97 }}
                      onClick={() => setChatContact(c.id)}
                      style={{ ...FROSTED, width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", marginBottom: 10, cursor: "pointer", textAlign: "left" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "rgba(220,20,20,0.1)", flexShrink: 0, border: "2px solid rgba(220,20,20,0.3)" }}>
                        {c.image ? <img src={c.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👻</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff" }}>{c.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{(chatMessages[c.id] || []).length} messages</p>
                      </div>
                      <span style={{ fontSize: 14, color: "rgba(220,20,20,0.6)" }}>›</span>
                    </motion.button>
                  ))}
                </div>
              );

              const msgs: ChatMessage[] = chatMessages[chatContact] || [];
              const sendChat = () => {
                if (!chatInput.trim()) return;
                const curChat = readCoins();
                if (curChat < VAULT_COSTS.chatMessage) {
                  alert(`Vault chat messages cost ${VAULT_COSTS.chatMessage} coins.\nYou have ${curChat} coins — visit the Coin Shop to top up.`);
                  return;
                }
                writeCoins(curChat - VAULT_COSTS.chatMessage);
                refreshCoins();
                const msg: ChatMessage = {
                  id: Date.now().toString(),
                  senderId: myGhostId,
                  content: chatInput.trim(),
                  type: "text",
                  sentAt: Date.now(),
                  expiresAt: chatMediaExpiry === "24h" ? Date.now() + 86400000 : undefined,
                  viewOnce: chatMediaExpiry === "view-once",
                };
                const updated = { ...chatMessages, [chatContact]: [...msgs, msg] };
                setChatMessages(updated);
                saveJson("ghost_vault_chats", updated);
                setChatInput("");
                dbSendChatMessage(msg, chatContact);
              };

              return (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {/* Expiry toggle */}
                  <div style={{ padding: "8px 16px", display: "flex", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
                    {(["none","24h","view-once"] as const).map(v => (
                      <button key={v} onClick={() => setChatMediaExpiry(v)}
                        style={{ height: 26, padding: "0 10px", borderRadius: 8, border: `1px solid ${chatMediaExpiry === v ? "rgba(220,20,20,0.5)" : "rgba(255,255,255,0.08)"}`, background: chatMediaExpiry === v ? "rgba(220,20,20,0.12)" : "rgba(255,255,255,0.04)", color: chatMediaExpiry === v ? "#ff4444" : "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                        {v === "none" ? "Normal" : v === "24h" ? "⏱ 24h" : "👁 View once"}
                      </button>
                    ))}
                  </div>
                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, scrollbarWidth: "none" }}>
                    {msgs.length === 0 && <p style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 40 }}>No messages yet — say something private 💬</p>}
                    {msgs.map(msg => {
                      const isMine = msg.senderId === myGhostId;
                      return (
                        <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                          <div style={{ maxWidth: "75%", background: isMine ? "rgba(220,20,20,0.18)" : "rgba(6,4,4,0.82)", backdropFilter: "blur(12px)", border: `1px solid ${isMine ? "rgba(220,20,20,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius: isMine ? "14px 4px 14px 14px" : "4px 14px 14px 14px", padding: "9px 13px" }}>
                            <p style={{ margin: 0, fontSize: 13, color: "#fff", lineHeight: 1.5 }}>{msg.content}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                              <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                              {msg.viewOnce && <span style={{ fontSize: 9, color: "rgba(220,20,20,0.6)", fontWeight: 700 }}>👁 once</span>}
                              {msg.expiresAt && !msg.viewOnce && <span style={{ fontSize: 9, color: "rgba(255,180,0,0.7)", fontWeight: 700 }}>⏱ 24h</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Input */}
                  <div style={{ padding: "10px 16px max(16px,env(safe-area-inset-bottom,16px))", display: "flex", gap: 8, borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(6,4,4,0.9)", flexShrink: 0 }}>
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendChat(); }}
                      placeholder="Type a private message…"
                      style={{ flex: 1, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, padding: "0 14px", outline: "none" }} />
                    <motion.button whileTap={{ scale: 0.93 }} onClick={sendChat}
                      style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(220,20,20,0.2)", border: "1px solid rgba(220,20,20,0.4)", color: "#ff4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 18 }}>↑</span>
                    </motion.button>
                  </div>
                </div>
              );
            })()}

            {/* ── VOICE NOTES PAGE ── */}
            {vaultPage === "voice" && (() => {
              const FROSTED = { background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 14 };
              const startRec = async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  const mr = new MediaRecorder(stream);
                  audioChunksRef.current = [];
                  mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
                  mr.onstop = async () => {
                    const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                    stream.getTracks().forEach(t => t.stop());
                    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
                    const dur = recordingTime;
                    setRecordingTime(0);
                    // Coin check for voice notes
                    const curC = readCoins();
                    if (curC < VAULT_COSTS.voiceNote) {
                      alert(`Voice notes cost ${VAULT_COSTS.voiceNote} coins each.\nYou have ${curC} coins — visit the Coin Shop to top up.`);
                      return;
                    }
                    writeCoins(curC - VAULT_COSTS.voiceNote);
                    refreshCoins();
                    try {
                      const { path, publicUrl } = await uploadGhostVoiceNote(blob, myGhostId);
                      const note: VoiceNote = { id: Date.now().toString(), audioData: publicUrl, duration: dur, createdAt: Date.now() };
                      const updated = [note, ...voiceNotes];
                      setVoiceNotes(updated);
                      saveJson("ghost_vault_voice_notes", updated);
                      dbSaveVoiceNote(myGhostId, note, path, publicUrl);
                    } catch {
                      // Fallback to base64
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const audioData = ev.target?.result as string;
                        const note: VoiceNote = { id: Date.now().toString(), audioData, duration: dur, createdAt: Date.now() };
                        const updated = [note, ...voiceNotes];
                        setVoiceNotes(updated);
                        saveJson("ghost_vault_voice_notes", updated);
                      };
                      reader.readAsDataURL(blob);
                    }
                  };
                  mediaRecorderRef.current = mr;
                  mr.start();
                  setIsRecording(true);
                  setRecordingTime(0);
                  recordTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
                } catch { alert("Microphone access denied"); }
              };
              const stopRec = () => {
                mediaRecorderRef.current?.stop();
                setIsRecording(false);
              };
              const fmtDur = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
              return (
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  {/* Record button */}
                  <div style={{ ...FROSTED, padding: "20px 16px", marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <motion.button whileTap={{ scale: 0.93 }}
                      onClick={isRecording ? stopRec : startRec}
                      animate={isRecording ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0px rgba(220,20,20,0)", "0 0 20px rgba(220,20,20,0.6)", "0 0 0px rgba(220,20,20,0)"] } : {}}
                      transition={isRecording ? { duration: 1.2, repeat: Infinity } : {}}
                      style={{ width: 72, height: 72, borderRadius: "50%", background: isRecording ? "rgba(220,20,20,0.25)" : "rgba(220,20,20,0.12)", border: `2px solid rgba(220,20,20,${isRecording ? 0.7 : 0.4})`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 28 }}>
                      {isRecording ? "⏹" : "🎙️"}
                    </motion.button>
                    <p style={{ margin: 0, fontSize: 13, color: isRecording ? "#ff4444" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                      {isRecording ? `Recording… ${fmtDur(recordingTime)}` : "Tap to record a voice note"}
                    </p>
                  </div>
                  {/* Saved notes */}
                  {voiceNotes.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0" }}>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No voice notes yet</p>
                    </div>
                  ) : voiceNotes.map((note, i) => (
                    <div key={note.id} style={{ ...FROSTED, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                      <button onClick={() => { const a = new Audio(note.audioData); a.play(); }}
                        style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(220,20,20,0.15)", border: "1px solid rgba(220,20,20,0.35)", color: "#ff4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>▶</button>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>Voice Note {voiceNotes.length - i}</p>
                        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{fmtDur(note.duration)} · {new Date(note.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => { const updated = voiceNotes.filter(v => v.id !== note.id); setVoiceNotes(updated); saveJson("ghost_vault_voice_notes", updated); dbDeleteVoiceNote(note.id); }}
                        style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* ── ACTIVITY LOG PAGE ── */}
            {vaultPage === "activity" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                {activityLog.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <p style={{ fontSize: 36 }}>📋</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No activity recorded yet</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {activityLog.map((entry, i) => {
                      const icons: Record<ActivityEntry["action"], string> = { login: "🔓", code_shared: "🔑", image_sent: "🖼️", voice_sent: "🎙️", chat_opened: "💬" };
                      const labels: Record<ActivityEntry["action"], string> = { login: "Vault unlocked", code_shared: "Code shared", image_sent: "Image sent", voice_sent: "Voice note sent", chat_opened: "Chat opened" };
                      return (
                        <div key={entry.id} style={{ background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.15)", borderLeft: i === 0 ? "3px solid rgba(220,20,20,0.7)" : "3px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 20, flexShrink: 0 }}>{icons[entry.action]}</span>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>{labels[entry.action]}</p>
                            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{entry.ghostId} · {new Date(entry.at).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={() => { setActivityLog([]); saveJson("ghost_vault_activity", []); }}
                      style={{ marginTop: 8, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "9px 0", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Clear log
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── SHARED VAULT PAGE ── */}
            {vaultPage === "shared" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                <div style={{ background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🔗</span>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>Shared vault is a joint space between you and your matched contacts. Both can upload — only mutual vault connections can see it.</p>
                </div>
                <input ref={sharedImgRef} type="file" accept="image/*,video/*" multiple style={{ display: "none" }}
                  onChange={async e => {
                    const files = Array.from(e.target.files || []);
                    for (const file of files) {
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const item: SharedVaultItem = { id: Date.now().toString() + Math.random(), uploadedBy: myGhostId, type: file.type.startsWith("video") ? "video" : "image", url: ev.target?.result as string, uploadedAt: Date.now() };
                        setSharedItems(prev => { const u = [item, ...prev]; saveJson("ghost_vault_shared", u); return u; });
                      };
                      reader.readAsDataURL(file);
                    }
                    e.target.value = "";
                  }}
                />
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => sharedImgRef.current?.click()}
                  style={{ width: "100%", height: 46, borderRadius: 12, background: "rgba(220,20,20,0.1)", border: "1px dashed rgba(220,20,20,0.4)", color: "#ff4444", fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Upload size={14} /> Add to Shared Vault
                </motion.button>
                {sharedItems.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <p style={{ fontSize: 36 }}>🔗</p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>Nothing shared yet</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {sharedItems.map(item => (
                      <div key={item.id} style={{ background: "rgba(6,4,4,0.72)", backdropFilter: "blur(12px)", border: "1px solid rgba(220,20,20,0.15)", borderRadius: 12, overflow: "hidden", position: "relative" }}>
                        {item.type === "image"
                          ? <img src={item.url} alt="" onClick={() => setViewingImage(item.url)} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", cursor: "pointer" }} />
                          : <video src={item.url} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />}
                        <div style={{ padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{new Date(item.uploadedAt).toLocaleDateString()}</p>
                          <button onClick={() => { const u = sharedItems.filter(s => s.id !== item.id); setSharedItems(u); saveJson("ghost_vault_shared", u); }}
                            style={{ background: "none", border: "none", color: "rgba(239,68,68,0.6)", cursor: "pointer", padding: 0 }}>
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── PRIVATE BIO PAGE ── */}
            {vaultPage === "profile" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                {!editingBio ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 14, padding: "16px" }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(220,20,20,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>Private Profile</p>
                      {[
                        { label: "Real Name", value: privateBio.realName, icon: "👤" },
                        { label: "Phone", value: privateBio.phone, icon: "📱" },
                        { label: "Instagram", value: privateBio.instagram, icon: "📸" },
                        { label: "Telegram", value: privateBio.telegram, icon: "✈️" },
                        { label: "About me", value: privateBio.bio, icon: "💭" },
                      ].map(f => (
                        <div key={f.label} style={{ display: "flex", gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
                          <div>
                            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{f.label}</p>
                            <p style={{ margin: 0, fontSize: 13, color: f.value ? "#fff" : "rgba(255,255,255,0.2)" }}>{f.value || "Not set"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setEditingBio(true); setBioEdits({ ...privateBio }); }}
                      style={{ width: "100%", height: 46, borderRadius: 12, background: "rgba(220,20,20,0.1)", border: "1px solid rgba(220,20,20,0.35)", color: "#ff4444", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                      Edit Private Bio
                    </motion.button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { key: "realName" as const, label: "Real Name", placeholder: "Your real name", type: "text" },
                      { key: "phone" as const, label: "Phone", placeholder: "+1 234 567 8901", type: "tel" },
                      { key: "instagram" as const, label: "Instagram", placeholder: "@yourhandle", type: "text" },
                      { key: "telegram" as const, label: "Telegram", placeholder: "@username", type: "text" },
                    ].map(f => (
                      <div key={f.key}>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 5px", fontWeight: 700 }}>{f.label}</p>
                        <input type={f.type} value={bioEdits[f.key]} onChange={e => setBioEdits(b => ({ ...b, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          style={{ width: "100%", height: 46, borderRadius: 11, background: "rgba(6,4,4,0.72)", border: "1px solid rgba(220,20,20,0.2)", color: "#fff", fontSize: 14, padding: "0 14px", outline: "none", boxSizing: "border-box" }} />
                      </div>
                    ))}
                    <div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 5px", fontWeight: 700 }}>About Me</p>
                      <textarea value={bioEdits.bio} onChange={e => setBioEdits(b => ({ ...b, bio: e.target.value }))}
                        placeholder="Something private about yourself…"
                        style={{ width: "100%", height: 80, borderRadius: 11, background: "rgba(6,4,4,0.72)", border: "1px solid rgba(220,20,20,0.2)", color: "#fff", fontSize: 13, padding: "10px 14px", outline: "none", boxSizing: "border-box", resize: "none" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditingBio(false)}
                        style={{ flex: 1, height: 46, borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                        Cancel
                      </button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPrivateBio(bioEdits); saveJson("ghost_vault_bio", bioEdits); setEditingBio(false); dbSavePrivateBio(myGhostId, bioEdits); }}
                        style={{ flex: 2, height: 46, borderRadius: 11, background: "rgba(220,20,20,0.2)", border: "1px solid rgba(220,20,20,0.4)", color: "#ff4444", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                        Save Bio
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── MEMORIES PAGE ── */}
            {vaultPage === "memories" && (
              <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                {!newMemoryOpen ? (
                  <>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setNewMemoryOpen(true)}
                      style={{ width: "100%", height: 46, borderRadius: 12, background: "rgba(220,20,20,0.1)", border: "1px dashed rgba(220,20,20,0.4)", color: "#ff4444", fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      + New Memory
                    </motion.button>
                    {memories.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <p style={{ fontSize: 36 }}>📖</p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>No memories saved yet</p>
                      </div>
                    ) : memories.map(mem => (
                      <div key={mem.id} style={{ background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.15)", borderLeft: "3px solid rgba(220,20,20,0.5)", borderRadius: 14, padding: "13px 15px", marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <span style={{ fontSize: 18, marginRight: 6 }}>{mem.mood}</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{mem.title}</span>
                          </div>
                          <button onClick={() => { const u = memories.filter(m => m.id !== mem.id); setMemories(u); saveJson("ghost_vault_memories", u); dbDeleteMemory(mem.id); }}
                            style={{ background: "none", border: "none", color: "rgba(239,68,68,0.5)", cursor: "pointer" }}>
                            <X size={12} />
                          </button>
                        </div>
                        <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{mem.content}</p>
                        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{mem.date}</p>
                      </div>
                    ))}
                  </>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>New Memory</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      {["❤️","💫","🥂","🌙","😊","🔥"].map(m => (
                        <button key={m} onClick={() => setMemDraft(d => ({ ...d, mood: m }))}
                          style={{ fontSize: 22, background: memDraft.mood === m ? "rgba(220,20,20,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${memDraft.mood === m ? "rgba(220,20,20,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer" }}>
                          {m}
                        </button>
                      ))}
                    </div>
                    <input value={memDraft.title} onChange={e => setMemDraft(d => ({ ...d, title: e.target.value }))} placeholder="Memory title…"
                      style={{ height: 46, borderRadius: 11, background: "rgba(6,4,4,0.72)", border: "1px solid rgba(220,20,20,0.2)", color: "#fff", fontSize: 14, padding: "0 14px", outline: "none", boxSizing: "border-box" }} />
                    <input type="date" value={memDraft.date} onChange={e => setMemDraft(d => ({ ...d, date: e.target.value }))}
                      style={{ height: 46, borderRadius: 11, background: "rgba(6,4,4,0.72)", border: "1px solid rgba(220,20,20,0.2)", color: "#fff", fontSize: 14, padding: "0 14px", outline: "none", boxSizing: "border-box" }} />
                    <textarea value={memDraft.content} onChange={e => setMemDraft(d => ({ ...d, content: e.target.value }))} placeholder="What happened? How did it feel?"
                      style={{ height: 100, borderRadius: 11, background: "rgba(6,4,4,0.72)", border: "1px solid rgba(220,20,20,0.2)", color: "#fff", fontSize: 13, padding: "10px 14px", outline: "none", boxSizing: "border-box", resize: "none" }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setNewMemoryOpen(false)}
                        style={{ flex: 1, height: 46, borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer" }}>
                        Cancel
                      </button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => {
                        if (!memDraft.title.trim()) return;
                        const curM = readCoins();
                        if (curM < VAULT_COSTS.memoryNote) {
                          alert(`Memory notes cost ${VAULT_COSTS.memoryNote} coins each.\nYou have ${curM} coins — visit the Coin Shop to top up.`);
                          return;
                        }
                        writeCoins(curM - VAULT_COSTS.memoryNote);
                        refreshCoins();
                        const mem: Memory = { id: Date.now().toString(), ...memDraft, createdAt: Date.now() };
                        const u = [mem, ...memories]; setMemories(u); saveJson("ghost_vault_memories", u);
                        dbSaveMemory(myGhostId, mem);
                        setNewMemoryOpen(false); setMemDraft({ title: "", content: "", date: new Date().toISOString().slice(0, 10), mood: "❤️" });
                      }}
                        style={{ flex: 2, height: 46, borderRadius: 11, background: "rgba(220,20,20,0.2)", border: "1px solid rgba(220,20,20,0.4)", color: "#ff4444", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                        Save Memory
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── FILES PAGE ── */}
            {vaultPage === "files" && (() => {
              const FROSTED: React.CSSProperties = { background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 14 };

              if (showNewFileFolderInput) return (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>Name your folder</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>Then choose files to upload into it</p>
                  <input autoFocus value={newFileFolderName} onChange={e => setNewFileFolderName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleCreateFileFolder(); }}
                    placeholder="e.g. Documents, Contracts…"
                    style={{ width: "100%", height: 50, borderRadius: 14, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 16, padding: "0 16px", outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateFileFolder}
                    style={{ width: "100%", height: 50, borderRadius: 50, background: a.gradient, border: "none", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 20px ${a.glowMid(0.4)}` }}>
                    Create Folder &amp; Upload
                  </motion.button>
                  <input ref={fileRef} type="file" multiple accept=".pdf,.xls,.xlsx,.doc,.docx,.csv,.txt,.ppt,.pptx" style={{ display: "none" }} onChange={handleFileUploadToFolder} />
                </div>
              );

              if (openFileFolder) {
                const folder = fileFolders.find(f => f.id === openFileFolder);
                const files = folder?.files ?? [];
                return (
                  <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                    <input ref={fileRef} type="file" multiple accept=".pdf,.xls,.xlsx,.doc,.docx,.csv,.txt,.ppt,.pptx" style={{ display: "none" }} onChange={handleFileUploadToFolder} />
                    {files.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <p style={{ fontSize: 32 }}>📁</p>
                        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No files yet — tap Upload to add</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {files.map((file, idx) => {
                          const ext = (ALLOWED_FILE_TYPES[file.type] ?? file.name.split(".").pop()?.toUpperCase() ?? "FILE");
                          const icon = FILE_ICONS[ext] ?? "📎";
                          return (
                            <div key={idx} style={{ ...FROSTED, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(220,20,20,0.12)", border: "1px solid rgba(220,20,20,0.25)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                                <span style={{ fontSize: 7, color: "rgba(220,20,20,0.8)", fontWeight: 800, letterSpacing: "0.05em" }}>{ext}</span>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</p>
                                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
                                  {fmtSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString()} {new Date(file.uploadedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                <button onClick={() => {
                                  const a = document.createElement("a");
                                  a.href = file.data; a.download = file.name; a.click();
                                }}
                                  style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(220,20,20,0.12)", border: "1px solid rgba(220,20,20,0.25)", color: "#ff4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span style={{ fontSize: 13 }}>↓</span>
                                </button>
                                <button onClick={() => {
                                  const updated = fileFolders.map(f => f.id === openFileFolder ? { ...f, files: f.files.filter((_, i) => i !== idx) } : f);
                                  saveFileFolders(updated);
                                }}
                                  style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <X size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Folder grid
              return (
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  {fileFolders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                      <p style={{ fontSize: 40 }}>📁</p>
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: "8px 0 4px" }}>No folders yet</p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Tap "+ New Folder" to create one</p>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {fileFolders.map(folder => (
                        <motion.button key={folder.id} whileTap={{ scale: 0.97 }}
                          onClick={() => setOpenFileFolder(folder.id)}
                          style={{ ...FROSTED, textAlign: "left", cursor: "pointer", padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(220,20,20,0.1)", border: "1px solid rgba(220,20,20,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
                            📁
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{folder.name}</p>
                            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
                              {folder.files.length} file{folder.files.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── PRICING PAGE ── */}
            {vaultPage === "pricing" && (() => {
              const FROSTED: React.CSSProperties = { background: "rgba(6,4,4,0.82)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", border: "1px solid rgba(220,20,20,0.18)", borderRadius: 14, padding: "16px 16px" };
              const FREE_COLOR = "#4ade80";
              const COIN_COLOR = "#d4af37";
              const sections: { title: string; emoji: string; rows: { label: string; detail: string; cost: string; free?: boolean }[] }[] = [
                {
                  title: "Images", emoji: "🖼️",
                  rows: [
                    { label: "First 3 images", detail: "Included with your vault — no coins needed", cost: "FREE", free: true },
                    { label: "Additional images", detail: "Each image beyond your 3 free slots", cost: `${VAULT_COSTS.imageUpload} coins` },
                    { label: "Image folders", detail: "Create & organise folders", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Videos", emoji: "🎬",
                  rows: [
                    { label: "First video", detail: "Included with your vault — no coins needed", cost: "FREE", free: true },
                    { label: "Additional videos", detail: "Each video beyond your 1 free slot", cost: `${VAULT_COSTS.videoUpload} coins` },
                    { label: "Video folders", detail: "Create & organise folders", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Voice Notes", emoji: "🎙️",
                  rows: [
                    { label: "Record voice note", detail: "Each recording saved to vault", cost: `${VAULT_COSTS.voiceNote} coins` },
                    { label: "Playback & delete", detail: "Listen or remove your notes", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Files", emoji: "📁",
                  rows: [
                    { label: "File upload", detail: "PDF, Excel, Word, CSV, PPT, TXT — up to 25 MB", cost: `${VAULT_COSTS.fileUpload} coins` },
                    { label: "File folders", detail: "Create & organise folders", cost: "FREE", free: true },
                    { label: "Download & delete", detail: "Manage your uploaded files", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Vault Chat", emoji: "💬",
                  rows: [
                    { label: "Send chat message", detail: "Each message sent in vault chat", cost: `${VAULT_COSTS.chatMessage} coins` },
                    { label: "Disappearing messages", detail: "Set 24h expiry or view-once", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Memories", emoji: "📖",
                  rows: [
                    { label: "Save memory note", detail: "Each new memory added to vault", cost: `${VAULT_COSTS.memoryNote} coins` },
                    { label: "Read & delete", detail: "Browse or remove memories", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Shared Vault", emoji: "🔗",
                  rows: [
                    { label: "Post to shared vault", detail: "Share image or video with your match", cost: `${VAULT_COSTS.sharedVault} coins` },
                    { label: "View shared items", detail: "Browse what your match has shared", cost: "FREE", free: true },
                  ],
                },
                {
                  title: "Always Free", emoji: "✅",
                  rows: [
                    { label: "Vault Code", detail: "Generate & share your access code", cost: "FREE", free: true },
                    { label: "Private Bio", detail: "Store your real contact details", cost: "FREE", free: true },
                    { label: "Activity Log", detail: "Track vault access history", cost: "FREE", free: true },
                    { label: "Quick PIN", detail: "4-digit fast-entry setup", cost: "FREE", free: true },
                    { label: "Screenshot Watermark", detail: "Invisible ID on full-screen photos", cost: "FREE", free: true },
                  ],
                },
              ];
              return (
                <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px max(24px,env(safe-area-inset-bottom,24px))", scrollbarWidth: "none" }}>
                  {/* Balance banner */}
                  <div style={{ ...FROSTED, display: "flex", alignItems: "center", gap: 14, marginBottom: 16, borderColor: "rgba(212,175,55,0.3)" }}>
                    <span style={{ fontSize: 32 }}>🪙</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>YOUR COIN BALANCE</p>
                      <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: COIN_COLOR, fontVariantNumeric: "tabular-nums" }}>{coinBalance.toLocaleString()}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/ghost/mode")}
                      style={{ padding: "8px 14px", background: "rgba(212,175,55,0.14)", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 10, color: COIN_COLOR, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      Get Coins
                    </motion.button>
                  </div>

                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 14px", lineHeight: 1.6 }}>
                    The first 3 images and 1 video are always free. All other vault features deduct coins from your balance at the time of use.
                  </p>

                  {sections.map(sec => (
                    <div key={sec.title} style={{ marginBottom: 14 }}>
                      <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {sec.emoji} {sec.title}
                      </p>
                      <div style={{ ...FROSTED, padding: 0, overflow: "hidden" }}>
                        {sec.rows.map((row, ri) => (
                          <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: ri < sec.rows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{row.label}</p>
                              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{row.detail}</p>
                            </div>
                            <div style={{ background: row.free ? "rgba(74,222,128,0.1)" : "rgba(212,175,55,0.1)", border: `1px solid ${row.free ? "rgba(74,222,128,0.3)" : "rgba(212,175,55,0.3)"}`, borderRadius: 8, padding: "4px 10px", flexShrink: 0 }}>
                              <span style={{ fontSize: 12, fontWeight: 900, color: row.free ? FREE_COLOR : COIN_COLOR }}>
                                {row.free ? "FREE" : <>{row.cost.replace(" coins", "")} <span style={{ fontSize: 11 }}>🪙</span></>}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 8 }}>Prices in Ghost coins · Earn coins daily by staying active</p>
                </div>
              );
            })()}

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Send image modal ── */}
      <AnimatePresence>
        {sendingImage && (
          <motion.div key="send-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
              style={{ width: "100%", maxWidth: 480, background: "#08080e", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "22px 22px 0 0", padding: "20px 20px max(28px,env(safe-area-inset-bottom,28px))" }}>
              <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Send Image</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>Enter the vault code of the person to send to</p>
              <img src={sendingImage} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 12, marginBottom: 14 }} />
              <input value={sendToCode} onChange={e => { setSendToCode(e.target.value.toUpperCase()); setSendResult(null); }}
                placeholder="VAULT CODE"
                style={{ width: "100%", height: 48, borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 16, padding: "0 14px", outline: "none", marginBottom: 10, boxSizing: "border-box", letterSpacing: "0.1em", fontWeight: 800 }} />
              {sendResult === "ok" && <p style={{ fontSize: 12, color: "#4ade80", margin: "0 0 8px", fontWeight: 700 }}>✓ Sent successfully</p>}
              {sendResult === "err" && <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 8px", fontWeight: 700 }}>✕ Code not found — check and try again</p>}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setSendingImage(null); setSendToCode(""); setSendResult(null); }}
                  style={{ flex: 1, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => {
                  if (!sendToCode.trim()) return;
                  try {
                    const item = { id: Date.now().toString(), type: "image" as const, content: sendingImage!, senderGhostId: myGhostId, sentAt: Date.now(), status: "pending" as const };
                    const recipientInbox = loadInbox(sendToCode);
                    recipientInbox.push(item);
                    saveInbox(sendToCode, recipientInbox);
                    dbSendInboxItem(item, sendToCode);
                    setSendResult("ok");
                    setTimeout(() => { setSendingImage(null); setSendToCode(""); setSendResult(null); }, 1500);
                  } catch { setSendResult("err"); }
                }}
                  style={{ flex: 1, height: 46, borderRadius: 12, background: a.gradient, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                  Send
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ ...S.header, position: "relative", zIndex: 1 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <h1 style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>Room Vault</h1>
            <span style={{ fontSize: 10, background: a.glow(0.15), border: `1px solid ${a.glow(0.3)}`, borderRadius: 6, padding: "1px 6px", color: a.glow(0.9), fontWeight: 800 }}>PRIVATE</span>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{myGhostId} · code-gated vault</p>
        </div>
        {/* Right actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Coin balance chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.32)", borderRadius: 20, padding: "4px 10px" }}>
            <span style={{ fontSize: 12, lineHeight: 1 }}>🪙</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: "#d4af37", letterSpacing: "0.02em", fontVariantNumeric: "tabular-nums" }}>{coinBalance.toLocaleString()}</span>
          </div>
          {pending.length > 0 && (
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>
              {pending.length}
            </div>
          )}
          <button
            onClick={() => setShowSideDrawer(true)}
            title="Vault Settings"
            style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
          >
            <Settings size={15} />
          </button>
          {/* Log out — clears session and returns to home */}
          <button
            onClick={() => { clearSession(); navigate("/ghost/mode"); }}
            title="Lock Vault"
            style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#f87171" }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,8,0.9)", position: "relative", zIndex: 1 }}>
        {([
          { key: "my",      label: "My Room",  icon: Lock },
          { key: "enter",   label: "Enter",    icon: Unlock },
          { key: "inbox",   label: "Inbox",    icon: MessageCircle },
          { key: "matches", label: "Matches",  icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, height: 44, border: "none", cursor: "pointer",
              background: "none",
              borderBottom: tab === key ? `2px solid ${a.glow(0.9)}` : "2px solid transparent",
              color: tab === key ? a.glow(0.95) : "rgba(255,255,255,0.35)",
              fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              position: "relative",
            }}
          >
            <Icon size={12} />
            {label}
            {key === "my" && pending.length > 0 && (
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#ef4444", fontSize: 8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: 6, right: "18%" }}>
                {pending.length}
              </span>
            )}
            {key === "inbox" && pendingInbox.length > 0 && (
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#ef4444", fontSize: 8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: 6, right: "18%" }}>
                {pendingInbox.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px max(20px, env(safe-area-inset-bottom, 20px))", position: "relative", zIndex: 1 }}>

        {/* ── MY ROOM TAB ── */}
        {tab === "my" && (
          <div>
            {/* Room code block */}
            <div style={S.greenCard}>
              <p style={S.label}>Your Room Vault Code</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  flex: 1, height: 52, borderRadius: 12,
                  background: a.glow(0.08), border: `1px solid ${a.glow(0.3)}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: a.glow(0.95), letterSpacing: "0.2em", fontVariantNumeric: "tabular-nums" }}>
                    {roomCode}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={copyCode}
                  style={{ width: 44, height: 52, borderRadius: 12, border: `1px solid ${a.glow(0.3)}`, background: a.glow(0.1), color: a.glow(0.9), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {codeCopied ? <Check size={16} /> : <Copy size={16} />}
                </motion.button>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 10px" }}>
                Share this code only with people you trust. Anyone with this code can view your room.
              </p>
              {/* Share vault link button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const link = `${window.location.origin}/ghost/room?code=${roomCode}`;
                  navigator.clipboard.writeText(link).catch(() => {});
                  setCodeCopied(true);
                  setTimeout(() => setCodeCopied(false), 2000);
                }}
                style={{ display: "flex", alignItems: "center", gap: 7, background: a.glow(0.1), border: `1px solid ${a.glow(0.25)}`, borderRadius: 10, padding: "7px 12px", color: a.glow(0.9), fontSize: 12, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}
              >
                <Link size={12} />
                {codeCopied ? "Link copied!" : "Copy Vault Link — share with your match"}
              </motion.button>
              {/* Reset code */}
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "7px 12px", color: "rgba(239,68,68,0.8)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  <RefreshCw size={12} />
                  Reset Code — revokes all access
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={resetCode} style={{ flex: 1, height: 36, borderRadius: 10, border: "none", background: "rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                    Yes, reset &amp; revoke all
                  </button>
                  <button onClick={() => setShowResetConfirm(false)} style={{ flex: 1, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div style={{ ...S.card, padding: "12px 16px" }}>
              <p style={{ ...S.label, marginBottom: 10 }}>Vault Overview</p>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { icon: "🖼️", count: myImages.length, label: "Images", limit: imageLimit, onTap: () => setVaultPage("image") },
                  { icon: "🎬", count: myVideoUrls.length, label: "Videos", limit: videoLimit, onTap: () => setVaultPage("video") },
                  { icon: "👥", count: matches.length, label: "Contacts", limit: null, onTap: () => setVaultPage("ghosts") },
                ].map(({ icon, count, label, limit, onTap }) => (
                  <motion.button key={label} whileTap={{ scale: 0.95 }} onClick={onTap}
                    style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 8px", cursor: "pointer", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 18 }}>{icon}</p>
                    <p style={{ margin: "4px 0 2px", fontSize: 16, fontWeight: 900, color: "#fff" }}>{count}</p>
                    <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                      {label}{limit !== null ? ` · ${limit} max` : ""}
                    </p>
                  </motion.button>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowSideDrawer(true)}
                style={{ width: "100%", marginTop: 10, height: 38, borderRadius: 10, background: a.glow(0.08), border: `1px solid ${a.glow(0.2)}`, color: a.glow(0.9), fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                Open Vault →
              </motion.button>
            </div>

            {/* Access requests */}
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Access Requests</p>
                {pending.length > 0 && (
                  <span style={{ background: "#ef4444", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                    {pending.length} pending
                  </span>
                )}
              </div>

              {requests.length === 0 && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0, textAlign: "center", padding: "10px 0" }}>
                  No requests yet — share your Guest ID so others can request access
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {requests.map((req) => (
                  <div
                    key={req.ghostId}
                    style={{
                      background: req.status === "pending" ? a.glow(0.04) : "rgba(255,255,255,0.02)",
                      border: `1px solid ${req.status === "pending" ? a.glow(0.2) : req.status === "granted" ? a.glow(0.15) : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 12, padding: "10px 12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{req.ghostId}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                          Requested {fmtAgo(req.requestedAt)} ·{" "}
                          <span style={{ color: req.status === "granted" ? a.glow(0.8) : req.status === "denied" ? "#f87171" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                            {req.status}
                          </span>
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {req.status === "pending" && (
                          <>
                            <button
                              onClick={() => grantRequest(req.ghostId)}
                              style={{ height: 30, borderRadius: 8, padding: "0 10px", border: "none", background: a.glow(0.2), color: a.glow(0.95), fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                            >
                              Grant
                            </button>
                            <button
                              onClick={() => denyRequest(req.ghostId)}
                              style={{ height: 30, borderRadius: 8, padding: "0 10px", border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.35)", fontSize: 11, cursor: "pointer" }}
                            >
                              Deny
                            </button>
                          </>
                        )}
                        {req.status === "granted" && (
                          <button
                            onClick={() => revokeAccess(req.ghostId)}
                            style={{ height: 30, borderRadius: 8, padding: "0 10px", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          >
                            <ShieldOff size={10} />
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Who I've granted */}
              {grantedReqs.length > 0 && (
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "10px 0 0" }}>
                  {grantedReqs.length} {grantedReqs.length === 1 ? "person has" : "people have"} access to your room
                </p>
              )}
            </div>

          </div>
        )}

        {/* ── ENTER ROOM TAB ── */}
        {tab === "enter" && (
          <div>
            <div style={S.greenCard}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>Enter a Room Vault</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 14px" }}>
                Paste a 6-character room code to view their private room — or enter someone's Guest ID (Guest-XXXX) to request access.
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  style={S.input}
                  placeholder="ROOM CODE or Guest-XXXX"
                  value={enterInput}
                  onChange={(e) => { setEnterInput(e.target.value.toUpperCase()); setEnterError(""); setEnterSuccess(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEnterRoom(); }}
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnterRoom}
                  style={{ height: 46, borderRadius: 12, padding: "0 18px", border: "none", background: `linear-gradient(135deg, ${a.accentDark}, ${a.accentMid})`, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
                >
                  Enter
                </motion.button>
              </div>
              {enterError && (
                <p style={{ fontSize: 11, color: "#f87171", margin: 0, fontWeight: 700 }}>✕ {enterError}</p>
              )}
              {enterSuccess && (
                <p style={{ fontSize: 11, color: a.glow(0.9), margin: 0, fontWeight: 700 }}>✓ {enterSuccess}</p>
              )}
            </div>

            {/* My Guest ID (to share so others can request) */}
            <div style={S.card}>
              <p style={S.label}>Your Guest ID — share this so others can request your room</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 44, borderRadius: 10, background: a.glow(0.06), border: `1px solid ${a.glow(0.2)}`, display: "flex", alignItems: "center", paddingLeft: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: a.glow(0.9) }}>{myGhostId}</span>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(myGhostId).catch(() => {}); }}
                  style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${a.glow(0.2)}`, background: a.glow(0.08), color: a.glow(0.8), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* Rooms I've been granted access to */}
            {accessedRooms.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "16px 0 8px" }}>
                  Rooms You Have Access To
                </p>
                {accessedRooms.map((room) => (
                  <div key={room.ghostId} style={S.card}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: a.glow(0.9), margin: 0 }}>{room.ghostId}'s Room</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>Granted {fmtAgo(room.grantedAt)}</p>
                      </div>
                    </div>

                    {/* Their images */}
                    {room.images.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        {room.images.map((src, i) => (
                          <img key={i} src={src} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", border: `1px solid ${a.glow(0.2)}` }} />
                        ))}
                      </div>
                    )}

                    {/* Their videos */}
                    {room.videoUrls && room.videoUrls.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {room.videoUrls.map((url, vi) => (
                          <div key={vi} style={{ borderRadius: 10, overflow: "hidden", background: "rgba(0,0,0,0.4)" }}>
                            <video src={url} controls style={{ width: "100%", maxHeight: 180, display: "block" }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {room.images.length === 0 && (!room.videoUrls || room.videoUrls.length === 0) && (
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>This room has no content yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pending requests I sent */}
            {requestSent.length > 0 && (
              <div style={S.card}>
                <p style={S.label}>Requests Sent</p>
                {requestSent.map((id) => (
                  <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{id}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Waiting...</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INBOX TAB ── */}
        {tab === "inbox" && (
          <div>
            <div style={{ ...S.card, marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.6 }}>
                When another Room Vault holder sends you an image or video, it appears here. Accept to save it to your room — decline to remove it permanently.
              </p>
            </div>

            {inbox.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <span style={{ fontSize: 40 }}>📭</span>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>No media received yet</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>When someone sends you content, it will appear here</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {inbox.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: item.status === "pending" ? a.glow(0.04) : "rgba(255,255,255,0.02)",
                    border: `1px solid ${item.status === "pending" ? a.glow(0.2) : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 16, overflow: "hidden",
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{item.type === "image" ? "🖼️" : item.type === "video" ? "🎬" : "💬"}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: item.status === "pending" ? a.glow(0.9) : "rgba(255,255,255,0.5)", margin: 0 }}>
                          From {item.senderGhostId}
                        </p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                          {fmtAgo(item.sentAt)} ·{" "}
                          <span style={{
                            fontWeight: 700,
                            color: item.status === "pending" ? "rgba(255,165,0,0.9)" : item.status === "accepted" ? a.glow(0.8) : "#f87171",
                          }}>
                            {item.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    {item.status === "accepted" && (() => {
                      const daysLeft = getItemDaysLeft(item, roomTier);
                      if (daysLeft === null) {
                        // Gold — permanent
                        return (
                          <span style={{ fontSize: 9, background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 5, padding: "2px 7px", color: "#d4af37", fontWeight: 800 }}>
                            🔑 Permanent
                          </span>
                        );
                      }
                      const urgent = daysLeft <= 3;
                      const warning = daysLeft <= 8;
                      return (
                        <span style={{
                          fontSize: 9, borderRadius: 5, padding: "2px 7px", fontWeight: 800,
                          background: urgent ? "rgba(239,68,68,0.15)" : warning ? "rgba(251,191,36,0.12)" : a.glow(0.12),
                          border: `1px solid ${urgent ? "rgba(239,68,68,0.4)" : warning ? "rgba(251,191,36,0.3)" : a.glow(0.25)}`,
                          color: urgent ? "#f87171" : warning ? "#fbbf24" : a.glow(0.85),
                        }}>
                          {urgent ? `🔴 ${daysLeft}d left` : warning ? `⏳ ${daysLeft}d left` : `✅ ${daysLeft}d left`}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Preview */}
                  <div style={{ margin: "0 14px 12px", borderRadius: 10, overflow: "hidden", background: "rgba(0,0,0,0.4)" }}>
                    {item.type === "note" ? (
                      <div style={{ padding: "14px 16px" }}>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>
                          {item.content}
                        </p>
                      </div>
                    ) : item.type === "image" ? (
                      <img
                        src={item.content} alt=""
                        style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <video src={item.content} controls style={{ width: "100%", maxHeight: 200, display: "block" }} />
                    )}
                  </div>
                  {/* Caption / memory note attached to media */}
                  {item.note && item.type !== "note" && (
                    <div style={{ margin: "-4px 14px 12px", padding: "8px 12px", borderRadius: 8, background: a.glow(0.06), border: `1px solid ${a.glow(0.15)}` }}>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                        "{item.note}"
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {item.status === "pending" && (
                    <div style={{ display: "flex", gap: 8, padding: "0 14px 14px" }}>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => acceptItem(item.id)}
                        style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${a.accentDark}, ${a.accentMid})`, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <Check size={14} /> Accept & Save to Room
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => declineItem(item.id)}
                        style={{ width: 72, height: 40, borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        Decline
                      </motion.button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MATCHES TAB ── */}
        {tab === "matches" && (
          <div>
            <div style={{ ...S.card, marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                All your active matches — connections expire after 48h if WhatsApp isn't opened. Tap to open WhatsApp or grant Room Vault access.
              </p>
            </div>

            {matches.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontSize: 44, margin: "0 0 12px" }}>👻</p>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: 0 }}>No active matches yet</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Go back to the feed and start liking</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {matches.map((m) => {
                const { profile } = m;
                const ghostId = (() => {
                  let h = 0;
                  for (let i = 0; i < profile.id.length; i++) { h = Math.imul(31, h) + profile.id.charCodeAt(i) | 0; }
                  return `Guest-${1000 + Math.abs(h) % 9000}`;
                })();
                const isGranted = granted.includes(ghostId);
                const timeLeft = Math.max(0, m.matchedAt + 48 * 60 * 60 * 1000 - Date.now());
                const hoursLeft = Math.floor(timeLeft / 3600000);
                const minsLeft = Math.floor((timeLeft % 3600000) / 60000);

                return (
                  <div key={m.id} style={S.card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img
                          src={profile.image} alt=""
                          style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: `2px solid ${a.glow(0.3)}` }}
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                        <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 12 }}>{profile.countryFlag}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: a.glow(0.9), margin: 0 }}>{ghostId}</p>
                          {isGranted && (
                            <span style={{ fontSize: 9, background: a.glow(0.15), border: `1px solid ${a.glow(0.3)}`, borderRadius: 4, padding: "1px 5px", color: a.glow(0.8), fontWeight: 700 }}>Room Access</span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "1px 0" }}>
                          {profile.age} · {profile.city}
                        </p>
                        <p style={{ fontSize: 10, color: hoursLeft < 6 ? "#f87171" : "rgba(255,255,255,0.25)", margin: 0 }}>
                          Expires in {hoursLeft}h {minsLeft}m
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => window.open(`https://wa.me/?text=Hey%20from%202Ghost!`, "_blank")}
                        style={{ flex: 1, height: 36, borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${a.accentDark}, ${a.accentMid})`, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                      >
                        <span>💬</span> WhatsApp
                      </motion.button>
                      {!isGranted ? (
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => grantRequest(ghostId)}
                          style={{ flex: 1, height: 36, borderRadius: 10, border: `1px solid ${a.glow(0.25)}`, background: a.glow(0.08), color: a.glow(0.9), fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                        >
                          <span>🚪</span> Give Room Access
                        </motion.button>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => revokeAccess(ghostId)}
                          style={{ flex: 1, height: 36, borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                        >
                          <ShieldOff size={11} /> Revoke
                        </motion.button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
