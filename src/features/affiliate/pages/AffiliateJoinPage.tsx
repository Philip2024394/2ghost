import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { generateCode, upsertAffiliate } from "../affiliateStorage";

const BG = "https://ik.imagekit.io/7grri5v7d/ghost%20roomssadasdasdfasdfasdf.png";
const LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

export default function AffiliateJoinPage() {
  const navigate = useNavigate();
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [wa, setWa]           = useState("");
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);
  const [code, setCode]       = useState("");
  const [copied, setCopied]   = useState(false);

  const handleSubmit = () => {
    if (!name.trim())  { setError("Enter your name"); return; }
    if (!email.trim()) { setError("Enter your email"); return; }
    if (!wa.trim())    { setError("Enter your WhatsApp number"); return; }

    const newCode = generateCode(name);
    upsertAffiliate({
      id:             newCode,
      name:           name.trim(),
      email:          email.trim(),
      whatsapp:       wa.trim(),
      status:         "pending",   // admin approves
      createdAt:      Date.now(),
      commissionRate: 25,
    });
    setCode(newCode);
    setDone(true);
  };

  const shareLink = `${window.location.origin}/ghost?ref=${code}`;

  const copy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      minHeight: "100dvh", width: "100%",
      backgroundImage: `url(${BG})`,
      backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(4,5,8,0.88)", zIndex: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 420,
          background: "rgba(4,6,4,0.97)",
          border: "1px solid rgba(74,222,128,0.2)",
          borderRadius: 24, padding: "28px 22px 24px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 60px rgba(74,222,128,0.08)",
        }}
      >
        {/* Green top bar */}
        <div style={{ height: 3, background: "linear-gradient(90deg,#16a34a,#4ade80,#22c55e)", borderRadius: "4px 4px 0 0", marginLeft: -22, marginRight: -22, marginTop: -28, marginBottom: 24 }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <img src={LOGO} alt="2Ghost" style={{ width: 46, height: 46, objectFit: "contain" }} />
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>2Ghost Affiliate</h1>
            <p style={{ fontSize: 11, color: "rgba(74,222,128,0.7)", margin: 0, fontWeight: 600 }}>Earn 25% on every paid conversion</p>
          </div>
        </div>

        {!done ? (
          <>
            {/* Perks */}
            <div style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
              {[
                ["💰", "25% commission on every Suite or Gold conversion"],
                ["🔗", "Your own referral link + QR code to share"],
                ["🖼️", "Ready-made banners to post on social media"],
                ["📊", "Live dashboard — clicks, signups, earnings"],
                ["💸", "Monthly payout via transfer/GoPay/OVO"],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Commission example */}
            <div style={{ background: "rgba(250,204,21,0.05)", border: "1px solid rgba(250,204,21,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: "rgba(250,204,21,0.8)", margin: "0 0 4px", fontWeight: 700 }}>Example earnings</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
                5 Gold conversions/month = <strong style={{ color: "#fbbf24" }}>202,500 IDR</strong> (~$12.50 USD)<br />
                20 Gold conversions/month = <strong style={{ color: "#fbbf24" }}>810,000 IDR</strong> (~$50 USD)
              </p>
            </div>

            {/* Form */}
            {[
              { label: "Full Name", value: name, set: setName, placeholder: "Your name", type: "text" },
              { label: "Email", value: email, set: setEmail, placeholder: "your@email.com", type: "email" },
              { label: "WhatsApp Number", value: wa, set: setWa, placeholder: "+62 812 xxxx xxxx", type: "tel" },
            ].map(({ label, value, set, placeholder, type }) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", margin: "0 0 5px" }}>{label}</p>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => { set(e.target.value); setError(""); }}
                  placeholder={placeholder}
                  style={{
                    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "10px 13px", color: "#fff", fontSize: 13,
                    outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            ))}

            {error && <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 10px" }}>{error}</p>}

            <button
              onClick={handleSubmit}
              style={{
                width: "100%", background: "linear-gradient(135deg,#16a34a,#4ade80)",
                border: "none", borderRadius: 12, padding: "13px 0",
                fontSize: 14, fontWeight: 900, color: "#000", cursor: "pointer", marginTop: 4,
              }}
            >
              Join as Affiliate →
            </button>

            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "10px 0 0", textAlign: "center" }}>
              Applications reviewed within 24 hours. You'll be notified via WhatsApp.
            </p>
          </>
        ) : (
          /* Success state */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "#4ade80", margin: "0 0 8px" }}>Application Received!</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 20px", lineHeight: 1.6 }}>
              Your affiliate code is below. Once approved, share your link and start earning.
            </p>

            {/* Code display */}
            <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 14, padding: "16px 14px", marginBottom: 16 }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", fontWeight: 700, letterSpacing: 1 }}>YOUR AFFILIATE CODE</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: "#4ade80", margin: "0 0 12px", letterSpacing: 4 }}>{code}</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 8px", wordBreak: "break-all" }}>{shareLink}</p>
              <button
                onClick={copy}
                style={{
                  background: copied ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.07)",
                  border: `1px solid ${copied ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 8, padding: "7px 18px", color: copied ? "#4ade80" : "#fff",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}
              >
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>

            <button
              onClick={() => navigate(`/affiliate/dashboard?code=${code}`)}
              style={{
                width: "100%", background: "linear-gradient(135deg,#16a34a,#4ade80)",
                border: "none", borderRadius: 12, padding: "12px 0",
                fontSize: 13, fontWeight: 900, color: "#000", cursor: "pointer",
              }}
            >
              Go to My Dashboard →
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
