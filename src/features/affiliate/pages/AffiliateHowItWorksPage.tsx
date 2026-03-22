import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const BG   = "https://ik.imagekit.io/7grri5v7d/ghost%20roomssadasdasdfasdfasdf.png";
const LOGO = "https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasd.png?updatedAt=1773948067293";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay },
});

export default function AffiliateHowItWorksPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100dvh", width: "100%",
      backgroundImage: `url(${BG})`,
      backgroundSize: "cover", backgroundPosition: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "0 0 60px",
    }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(4,5,8,0.92)", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 460 }}>

        {/* ── Top bar ── */}
        <div style={{
          padding: "max(20px, env(safe-area-inset-top, 20px)) 18px 18px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={LOGO} alt="2Ghost" style={{ width: 34, height: 34, objectFit: "contain" }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: 0 }}>2Ghost Affiliate</p>
              <p style={{ fontSize: 10, color: "rgba(74,222,128,0.7)", margin: 0 }}>How It Works</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/affiliate/join")}
            style={{
              background: "linear-gradient(135deg,#16a34a,#4ade80)",
              border: "none", borderRadius: 10, padding: "8px 16px",
              fontSize: 12, fontWeight: 900, color: "#000", cursor: "pointer",
            }}
          >Join Now →</button>
        </div>

        <div style={{ padding: "24px 18px 0" }}>

          {/* ── Hero ── */}
          <motion.div {...fade(0)} style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>💸</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 10px", lineHeight: 1.2 }}>
              Earn Money Promoting<br />
              <span style={{ color: "#4ade80" }}>2Ghost Hotel</span>
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.7 }}>
              Share your unique link. Every time someone pays for a membership through your link, you earn 25% commission — paid directly to your bank account.
            </p>
          </motion.div>

          {/* ── Commission box ── */}
          <motion.div {...fade(0.05)} style={{
            background: "linear-gradient(135deg, rgba(74,222,128,0.1), rgba(22,163,74,0.06))",
            border: "1px solid rgba(74,222,128,0.25)",
            borderRadius: 18, padding: "20px 18px", marginBottom: 28, textAlign: "center",
          }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", fontWeight: 700, letterSpacing: 1 }}>YOUR COMMISSION</p>
            <p style={{ fontSize: 44, fontWeight: 900, color: "#4ade80", margin: "0 0 4px" }}>25%</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 16px" }}>on every paid conversion you refer</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { plan: "Ghost Suite",    price: "162.000 IDR/mo", you: "40.500 IDR" },
                { plan: "Gold Penthouse", price: "162.000 IDR/mo", you: "40.500 IDR" },
              ].map(({ plan, price, you }) => (
                <div key={plan} style={{
                  background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "12px 10px",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>{plan}</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 6px" }}>{price}</p>
                  <p style={{ fontSize: 13, fontWeight: 900, color: "#4ade80", margin: 0 }}>You earn {you}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── How it works steps ── */}
          <motion.div {...fade(0.1)}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, margin: "0 0 16px", textTransform: "uppercase" }}>
              Step by Step
            </p>
          </motion.div>

          {[
            {
              step: "01",
              icon: "📝",
              title: "Sign Up Free",
              body: "Fill in your name, city, WhatsApp, and email. Read and agree to the Terms & Conditions. Your account goes live instantly — no waiting, no approval.",
              color: "#4ade80",
              delay: 0.12,
            },
            {
              step: "02",
              icon: "🔗",
              title: "Get Your Unique Link",
              body: "You receive a personal referral link and QR code. Every person who signs up through your link is tracked to your account automatically.",
              color: "#4ade80",
              delay: 0.16,
            },
            {
              step: "03",
              icon: "📣",
              title: "Share Everywhere",
              body: "Post your link on TikTok, Instagram, WhatsApp groups, stories, or anywhere your audience is. Use the ready-made banners and promo videos from your dashboard.",
              color: "#4ade80",
              delay: 0.2,
            },
            {
              step: "04",
              icon: "💳",
              title: "They Pay — You Earn",
              body: "When someone from your link upgrades to Ghost Suite or Gold Penthouse, 40.500 IDR is added to your balance immediately. You can track every sale live in your dashboard.",
              color: "#4ade80",
              delay: 0.24,
            },
            {
              step: "05",
              icon: "🏦",
              title: "Get Paid to Your Bank",
              body: "Commissions are paid out within 30 days of the end of each calendar month. Payments go directly to your Indonesian bank account (BCA, BNI, Mandiri, BSI, and more).",
              color: "#fbbf24",
              delay: 0.28,
            },
          ].map(({ step, icon, title, body, color, delay }) => (
            <motion.div key={step} {...fade(delay)} style={{
              display: "flex", gap: 14, marginBottom: 18,
            }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `${color}12`, border: `1px solid ${color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>
                  {icon}
                </div>
                <div style={{ width: 1, flex: 1, background: "rgba(255,255,255,0.06)", marginTop: 8, marginBottom: 0 }} />
              </div>
              <div style={{ paddingBottom: 18, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color, letterSpacing: 1 }}>STEP {step}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: "0 0 5px" }}>{title}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.7 }}>{body}</p>
              </div>
            </motion.div>
          ))}

          {/* ── Payment timeline ── */}
          <motion.div {...fade(0.32)} style={{
            background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.2)",
            borderRadius: 18, padding: "20px 18px", marginBottom: 24,
          }}>
            <p style={{ fontSize: 13, fontWeight: 900, color: "#fbbf24", margin: "0 0 14px" }}>🏦 Payment Schedule</p>
            {[
              { label: "When do I earn?",         value: "The moment someone pays through your link" },
              { label: "When is it paid out?",    value: "Within 30 days after the month ends" },
              { label: "How is it sent?",         value: "Direct bank transfer to your account" },
              { label: "What banks are accepted?",value: "All major Indonesian banks — BCA, BNI, BRI, Mandiri, BSI, CIMB Niaga, and more" },
              { label: "Minimum payout?",         value: "No minimum — all balances are paid each month" },
              { label: "What do I need?",         value: "KTP or Passport + verified bank account — submit in your dashboard before first payment" },
            ].map(({ label, value }) => (
              <div key={label} style={{
                padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 10,
              }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>{label}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", margin: 0, lineHeight: 1.5 }}>{value}</p>
              </div>
            ))}
          </motion.div>

          {/* ── Earnings examples ── */}
          <motion.div {...fade(0.36)} style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 18, padding: "20px 18px", marginBottom: 28,
          }}>
            <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: "0 0 14px" }}>📊 Example Monthly Earnings</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["Conversions/month", "You Earn (IDR)", "You Earn (USD ≈)"].map((h) => (
                      <th key={h} style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: 0.8, padding: "0 0 10px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    [5,  "202.500",  "~$12"],
                    [10, "405.000",  "~$25"],
                    [20, "810.000",  "~$50"],
                    [50, "2.025.000","~$125"],
                  ].map(([qty, idr, usd]) => (
                    <tr key={String(qty)}>
                      <td style={{ padding: "7px 0", color: "rgba(255,255,255,0.6)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{qty} sales</td>
                      <td style={{ padding: "7px 0", fontWeight: 800, color: "#4ade80", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{idr} IDR</td>
                      <td style={{ padding: "7px 0", color: "rgba(255,255,255,0.4)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{usd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "10px 0 0" }}>
              Based on 40,500 IDR per paid conversion at 25% commission. Exchange rate approximate.
            </p>
          </motion.div>

          {/* ── FAQ ── */}
          <motion.div {...fade(0.4)}>
            <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, margin: "0 0 14px", textTransform: "uppercase" }}>
              Common Questions
            </p>
            {[
              {
                q: "Is it free to join?",
                a: "Yes. There is no cost to become a 2Ghost affiliate. You earn commission, you never pay anything.",
              },
              {
                q: "Do I need followers or a website?",
                a: "No. You can share your link in WhatsApp groups, personal chats, Instagram stories, TikTok captions — anywhere. Many successful affiliates simply share within their social circle.",
              },
              {
                q: "What happens if someone clicks but doesn't pay immediately?",
                a: "The click is tracked. If they return and pay later the same session, you still earn. If they return days later via a fresh link, it depends on whether the referral cookie is still active.",
              },
              {
                q: "Can I be paused or removed?",
                a: "Yes. Sharing unauthorized content, misleading promotions, or violating the Terms & Conditions will result in account suspension or permanent removal. Always use official materials from your dashboard.",
              },
              {
                q: "Do I pay tax on my earnings?",
                a: "You are responsible for declaring your own income and paying applicable taxes in your jurisdiction. 2Ghost does not deduct tax from payments. Please consult a local tax advisor if unsure.",
              },
              {
                q: "What if I don't submit my payout details?",
                a: "Commission will accrue in your account but cannot be released until you submit a valid ID (KTP or Passport) and confirmed bank account details via your dashboard. Unsubmitted details within 60 days of first conversion will result in forfeiture of that period's commission.",
              },
            ].map(({ q, a }) => (
              <div key={q} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "14px 14px", marginBottom: 10,
              }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#fff", margin: "0 0 6px" }}>{q}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.7 }}>{a}</p>
              </div>
            ))}
          </motion.div>

          {/* ── CTA ── */}
          <motion.div {...fade(0.45)} style={{ marginTop: 28, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 14px", lineHeight: 1.6 }}>
              Ready to start earning? It takes 60 seconds to join and your link is live immediately.
            </p>
            <button
              onClick={() => navigate("/affiliate/join")}
              style={{
                width: "100%", background: "linear-gradient(135deg,#16a34a,#4ade80)",
                border: "none", borderRadius: 14, padding: "15px 0",
                fontSize: 15, fontWeight: 900, color: "#000", cursor: "pointer",
                boxShadow: "0 0 30px rgba(74,222,128,0.2)",
              }}
            >
              Join the 2Ghost Affiliate Programme →
            </button>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 14 }}>
              <button onClick={() => navigate("/affiliate/dashboard")}
                style={{ background: "none", border: "none", color: "rgba(74,222,128,0.7)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Already an affiliate? Log in →
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
