import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { generateCode, upsertAffiliate } from "../affiliateStorage";

const BG   = "https://ik.imagekit.io/7grri5v7d/ghost%20roomssadasdasdfasdfasdf.png";
const LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

const TERMS = `AFFILIATE PROGRAMME — TERMS & CONDITIONS
Last updated: March 2026

By joining the 2Ghost Affiliate Programme, you ("Affiliate") agree to the following terms in full. Please read carefully before proceeding.

1. PROMOTIONAL CONTENT
All images, videos, creative assets, and written content used to promote 2Ghost.com must either originate from the official Affiliate Resource Library provided in your dashboard or receive prior written approval from 2Ghost.com. Publishing or distributing promotional material that misrepresents 2Ghost.com, infringes third-party intellectual property rights, or has not been approved will result in immediate and permanent termination of your affiliate account, forfeiture of any accrued commissions, and may result in legal action.

2. IDENTITY VERIFICATION & COMMISSION PAYMENTS
Commission payments are processed within thirty (30) calendar days following the end of each payment period. Before your first commission payment is released, you are required to submit: (a) a valid government-issued identity document — Indonesian KTP or international passport — and (b) verified bank account details including account holder name, bank name, and account number. Failure to provide complete and accurate documentation within sixty (60) days of your first confirmed conversion will result in forfeiture of any accrued commissions for that period.

3. TAX & GOVERNMENT OBLIGATIONS
You are solely responsible for declaring, calculating, and paying all applicable taxes, levies, withholding taxes, and any other government-mandated duties arising from commissions earned through the 2Ghost Affiliate Programme. 2Ghost.com does not withhold tax on affiliate payments and will not be held liable for any tax obligations on your behalf.

4. INDEPENDENT CONTRACTOR STATUS
Participation in the 2Ghost Affiliate Programme does not constitute, and shall not be construed as, a contract of employment, agency relationship, partnership, franchise, or joint venture between you and 2Ghost.com or any of its affiliated entities. You have no authority to enter into agreements or incur obligations on behalf of 2Ghost.com.

5. PROGRAMME TERMINATION
2Ghost.com reserves the right to modify, suspend, or permanently terminate your affiliate account or the programme itself at any time, with or without prior notice, at its sole discretion. Grounds for termination include but are not limited to: breach of these terms, fraudulent activity, misrepresentation, or conduct deemed harmful to the reputation of 2Ghost.com.

6. GOVERNING LAW
These terms shall be governed by and construed in accordance with applicable law. Any disputes arising from this agreement shall be resolved through good-faith negotiation before any formal proceedings.`;

export default function AffiliateJoinPage() {
  const navigate = useNavigate();
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [wa, setWa]         = useState("");
  const [city, setCity]     = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError]   = useState("");
  const [done, setDone]     = useState(false);
  const [code, setCode]     = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = () => {
    if (!name.trim())  { setError("Enter your full name"); return; }
    if (!city.trim())  { setError("Enter your city"); return; }
    if (!wa.trim())    { setError("Enter your WhatsApp number"); return; }
    if (!email.trim()) { setError("Enter your email address"); return; }
    if (!agreed)       { setError("You must agree to the Terms & Conditions to continue"); return; }

    const newCode = generateCode(name);
    upsertAffiliate({
      id:             newCode,
      name:           name.trim(),
      email:          email.trim(),
      whatsapp:       wa.trim(),
      city:           city.trim(),
      status:         "active",
      createdAt:      Date.now(),
      commissionRate: 25,
      agreedToTerms:  true,
      termsAgreedAt:  Date.now(),
    });
    setCode(newCode);
    setDone(true);
  };

  const shareLink = `${window.location.origin}/affiliate/ref/${code}`;

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
      justifyContent: "flex-start",
      padding: "32px 16px max(40px, env(safe-area-inset-bottom, 40px))",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(4,5,8,0.88)", zIndex: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 440,
          background: "rgba(4,6,4,0.97)",
          border: "1px solid rgba(74,222,128,0.2)",
          borderRadius: 24, padding: "28px 22px 24px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 60px rgba(74,222,128,0.08)",
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg,#16a34a,#4ade80,#22c55e)", borderRadius: "4px 4px 0 0", margin: "-28px -22px 24px" }} />

        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <img src={LOGO} alt="2Ghost" style={{ width: 46, height: 46, objectFit: "contain" }} />
                <div>
                  <h1 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>Become an Affiliate</h1>
                  <p style={{ fontSize: 11, color: "rgba(74,222,128,0.7)", margin: 0, fontWeight: 600 }}>Active instantly · Earn 25% per sale</p>
                </div>
              </div>

              {/* What you get */}
              <div style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
                {[
                  ["🔗", "Your own share link — live the moment you sign up"],
                  ["🖼️", "Ready-made banners + promo videos to post"],
                  ["📊", "Live dashboard — clicks, signups, income"],
                  ["💸", "25% commission — paid within 30 days via bank/GoPay/OVO"],
                ].map(([icon, text]) => (
                  <div key={String(text)} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{text}</span>
                  </div>
                ))}
              </div>

              {/* Form fields */}
              {[
                { label: "Full Name",        value: name,  set: setName,  placeholder: "Your full legal name",    type: "text" },
                { label: "City",             value: city,  set: setCity,  placeholder: "e.g. Yogyakarta, Jakarta", type: "text" },
                { label: "WhatsApp Number",  value: wa,    set: setWa,    placeholder: "+62 812 xxxx xxxx",        type: "tel"  },
                { label: "Email Address",    value: email, set: setEmail, placeholder: "your@email.com",           type: "email"},
              ].map(({ label, value, set, placeholder, type }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>{label}</p>
                  <input
                    type={type} value={value}
                    onChange={(e) => { set(e.target.value); setError(""); }}
                    placeholder={placeholder}
                    style={{
                      width: "100%", background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, padding: "10px 13px", color: "#fff",
                      fontSize: 13, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}

              {/* Terms & Conditions */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", margin: "0 0 6px" }}>Terms & Conditions</p>
                <div style={{
                  background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: "10px 12px",
                  maxHeight: 180, overflowY: "auto",
                  fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}>
                  {TERMS}
                </div>
              </div>

              {/* Agree checkbox */}
              <label style={{
                display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
                marginBottom: 14, userSelect: "none",
              }}>
                <div
                  onClick={() => { setAgreed((a) => !a); setError(""); }}
                  style={{
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0, marginTop: 1,
                    border: `2px solid ${agreed ? "#4ade80" : "rgba(255,255,255,0.2)"}`,
                    background: agreed ? "rgba(74,222,128,0.15)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  {agreed && <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                  I have read and agree to the 2Ghost Affiliate Terms & Conditions, including identity verification requirements and my responsibility for personal tax obligations.
                </span>
              </label>

              {error && (
                <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 10px", lineHeight: 1.4 }}>{error}</p>
              )}

              <button
                onClick={handleSubmit}
                style={{
                  width: "100%",
                  background: agreed
                    ? "linear-gradient(135deg,#16a34a,#4ade80)"
                    : "rgba(255,255,255,0.05)",
                  border: agreed ? "none" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: "13px 0",
                  fontSize: 14, fontWeight: 900,
                  color: agreed ? "#000" : "rgba(255,255,255,0.25)",
                  cursor: agreed ? "pointer" : "not-allowed",
                  transition: "all 0.2s",
                }}
              >
                {agreed ? "Join Now — Get My Link →" : "Agree to Terms to Continue"}
              </button>

              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "12px 0 0", textAlign: "center" }}>
                Not sure yet?{" "}
                <a href="/affiliate/how-it-works" style={{ color: "#4ade80", textDecoration: "none", fontWeight: 700 }}>See how it works →</a>
              </p>
            </motion.div>
          ) : (
            /* ── Success state ── */
            <motion.div key="success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
              {/* Flashing green dot + live badge */}
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 20, padding: "8px 18px" }}>
                  <motion.div
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    style={{ width: 9, height: 9, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#4ade80" }}>LIVE — Account Active</span>
                </div>
              </div>

              <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>You're In!</h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 20px", lineHeight: 1.6 }}>
                Your affiliate account is active. Share your link and start earning immediately.
              </p>

              {/* Code + link */}
              <div style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.22)", borderRadius: 14, padding: "16px 14px", marginBottom: 14, textAlign: "left" }}>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 5px", fontWeight: 700, letterSpacing: 1 }}>YOUR AFFILIATE CODE</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: "#4ade80", margin: "0 0 10px", letterSpacing: 4 }}>{code}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 10px", wordBreak: "break-all", lineHeight: 1.5 }}>{shareLink}</p>
                <button onClick={copy} style={{
                  width: "100%",
                  background: copied ? "rgba(74,222,128,0.14)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 9, padding: "9px 0",
                  color: copied ? "#4ade80" : "#fff",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>{copied ? "✓ Copied!" : "📋 Copy My Link"}</button>
              </div>

              {/* Payout reminder */}
              <div style={{ background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 14, textAlign: "left" }}>
                <p style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700, margin: "0 0 4px" }}>⚠️ Before your first payment</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
                  Go to your dashboard → Payout Details and submit your KTP or passport + bank account. Required before any commission is released.
                </p>
              </div>

              <button
                onClick={() => navigate(`/affiliate/dashboard?code=${code}`)}
                style={{
                  width: "100%", background: "linear-gradient(135deg,#16a34a,#4ade80)",
                  border: "none", borderRadius: 12, padding: "13px 0",
                  fontSize: 14, fontWeight: 900, color: "#000", cursor: "pointer",
                }}
              >
                Open My Dashboard →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
