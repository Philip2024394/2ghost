import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, LogIn, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "./adminAuth";

const LOGO = "https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasd.png";

const MIN_WIDTH = 1024;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= MIN_WIDTH);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= MIN_WIDTH);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isDesktop) {
    return (
      <div style={{ minHeight: "100dvh", background: "#06060e", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🖥️</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 10px" }}>Desktop Required</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", margin: "0 0 6px", lineHeight: 1.6, maxWidth: 280 }}>
          The Admin Console is designed for desktop use only.
        </p>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", margin: 0 }}>
          Please open on a screen wider than {MIN_WIDTH}px.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600)); // brief auth delay
    if (adminLogin(email, password)) {
      navigate("/admin/overview", { replace: true });
    } else {
      setError("Invalid credentials. Access denied.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "#06060e",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", position: "relative", overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 65%)", borderRadius: "50%" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: "100%", maxWidth: 420, position: "relative" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <img src={LOGO} alt="" style={{ width: 48, height: 48, objectFit: "contain" }} />
            <div style={{ textAlign: "left" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#4ade80", letterSpacing: "0.16em", textTransform: "uppercase", margin: 0 }}>2Ghost</p>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1 }}>Admin Console</h1>
            </div>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 20, padding: "4px 12px" }}>
            <Shield size={11} style={{ color: "#4ade80" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(74,222,128,0.8)", letterSpacing: "0.1em" }}>SECURE ACCESS ONLY</span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: "32px 28px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        }}>
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@domain.com"
                required
                autoComplete="username"
                style={{
                  width: "100%", height: 50, borderRadius: 12,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 15, padding: "0 14px",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: "100%", height: 50, borderRadius: 12,
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: 15, padding: "0 44px 0 14px",
                    outline: "none", boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4 }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}
              >
                <p style={{ fontSize: 12, color: "rgba(239,68,68,0.9)", margin: 0, fontWeight: 600 }}>{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              style={{
                width: "100%", height: 52, borderRadius: 12, border: "none",
                background: loading ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#4ade80,#22c55e)",
                color: loading ? "rgba(255,255,255,0.3)" : "#fff",
                fontSize: 15, fontWeight: 900, cursor: loading ? "default" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: loading ? "none" : "0 8px 24px rgba(74,222,128,0.35)",
                transition: "all 0.2s",
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {loading
                  ? <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: [1,0.4,1] }} exit={{ opacity: 0 }} transition={{ duration: 1, repeat: Infinity }}><span>Authenticating…</span></motion.span>
                  : <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: 8 }}><LogIn size={16} /><span>Access Dashboard</span></motion.span>
                }
              </AnimatePresence>
            </motion.button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.18)", marginTop: 20 }}>
          Authorized personnel only · Activity is logged
        </p>
      </motion.div>
    </div>
  );
}
