import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";
const SUPPORT_EMAIL = "support@2ghost.app";
const APP_NAME      = "2Ghost Hotel";
const APP_URL       = "https://2ghost.app";

const Topic = ({ icon, title, body }: { icon: string; title: string; body: string }) => (
  <div style={{
    background: "rgba(212,175,55,0.04)",
    border: "1px solid rgba(212,175,55,0.14)",
    borderRadius: 16, padding: "18px 20px", marginBottom: 12,
  }}>
    <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: "#fff" }}>
      {icon} {title}
    </p>
    <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
      {body}
    </p>
  </div>
);

export default function SupportPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100dvh", background: "#050508", color: "#fff", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,8,0.96)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(212,175,55,0.12)",
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 22, cursor: "pointer", padding: "0 4px" }}
        >
          ←
        </button>
        <img src={GHOST_LOGO} alt="2Ghost" style={{ width: 28, height: 28, objectFit: "contain" }} />
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>Customer Support</p>
          <p style={{ margin: 0, fontSize: 10, color: "rgba(212,175,55,0.6)" }}>2Ghost Hotel · We're here to help</p>
        </div>
      </div>

      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ height: 2, background: "linear-gradient(90deg,#92660a,#d4af37,#f0d060,#d4af37,#92660a)" }}
      />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px 64px" }}>

        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>
            How can we help?
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, margin: 0 }}>
            Our support team typically responds within 24 hours. For urgent billing or account issues, include your Ghost ID in your message.
          </p>
        </div>

        {/* Common topics */}
        <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(212,175,55,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
          Common Topics
        </p>

        <Topic
          icon="🪙"
          title="Coins not credited"
          body="If your coins didn't appear after purchase, email us with your Ghost ID and Stripe receipt. We'll credit your account within a few hours."
        />
        <Topic
          icon="🏨"
          title="Room upgrade not unlocked"
          body="Room upgrades are applied automatically after payment confirmation. If your floor isn't unlocked, contact us with your Ghost ID and order details."
        />
        <Topic
          icon="💳"
          title="Billing & refunds"
          body="All purchases are processed by Stripe. To request a refund, contact us within 14 days of purchase. See our Terms of Service for full refund policy."
        />
        <Topic
          icon="🚫"
          title="Account suspended or banned"
          body="If you believe your account was suspended in error, email us with your Ghost ID and a brief explanation. We review all appeals individually."
        />
        <Topic
          icon="🔒"
          title="Privacy & data requests"
          body="To request a copy of your data, correction, or deletion of your account, email our privacy team at privacy@2ghost.app with your Ghost ID."
        />

        {/* Contact card */}
        <div style={{
          marginTop: 36,
          background: "rgba(212,175,55,0.06)",
          border: "1px solid rgba(212,175,55,0.22)",
          borderRadius: 20, padding: "24px 22px",
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 900, color: "#fff" }}>
            Contact Support
          </p>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
            Email us and include your Ghost ID for the fastest resolution.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Support%20Request%20-%202Ghost%20Hotel`}
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg,#92660a,#d4af37)",
              color: "#000", fontWeight: 900, fontSize: 14,
              padding: "14px 28px", borderRadius: 14,
              textDecoration: "none", letterSpacing: "0.02em",
            }}
          >
            Email Support
          </a>
          <p style={{ margin: "14px 0 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            {SUPPORT_EMAIL} · Response within 24 hours
          </p>
        </div>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(212,175,55,0.1)", textAlign: "center" }}>
          <img src={GHOST_LOGO} alt="2Ghost" style={{ width: 32, height: 32, objectFit: "contain", opacity: 0.4, marginBottom: 8 }} />
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>
            © {new Date().getFullYear()} {APP_NAME} · All rights reserved
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", margin: "4px 0 0" }}>
            <a href={APP_URL} style={{ color: "rgba(255,255,255,0.15)", textDecoration: "none" }}>{APP_URL}</a>
          </p>
        </div>

      </div>
    </div>
  );
}
