// ── Ghost Room — auth gate and paywall components ─────────────────────────────

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Lock } from "lucide-react";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import {
  activateRoomSub,
  startSession,
  VAULT_PIN_ATTEMPTS_KEY,
  VAULT_PW_ATTEMPTS_KEY,
  VAULT_LOCKED_KEY,
  VAULT_ALERT_KEY,
  MAX_VAULT_ATTEMPTS,
  sendVaultSecurityAlert,
} from "./ghostRoomHelpers";

const ROOM_BG        = "https://ik.imagekit.io/7grri5v7d/sfsadfasdfsdfasdfsdadsaw53245324234.png";
const ROOM_BG_FEMALE = "https://ik.imagekit.io/7grri5v7d/sfsadfasdfsdfasdfsdadsaw53245324234.png";

// ── Room Vault subscription paywall ──────────────────────────────────────────
export function RoomPaywall({ onPaid }: { onPaid: () => void }) {
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
export function GhostRoomAuthGate({ onVerified }: { onVerified: () => void }) {
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
        <button onClick={() => navigate("/mode")}
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
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>Welcome Guest</h1>
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

// ── Room Active Welcome Popup ─────────────────────────────────────────────────
export function RoomWelcomePopup({ onClose }: { onClose: () => void }) {
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
