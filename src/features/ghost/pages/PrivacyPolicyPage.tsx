import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";
const EFFECTIVE  = "27 March 2026";
const CONTACT    = "privacy@2ghost.app";
const APP_NAME   = "2Ghost Hotel";
const APP_URL    = "https://2ghost.app";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 32 }}>
    <h2 style={{ fontSize: 15, fontWeight: 900, color: "#d4af37", margin: "0 0 10px", letterSpacing: "0.04em" }}>
      {title}
    </h2>
    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.62)", lineHeight: 1.85 }}>
      {children}
    </div>
  </div>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <li style={{ marginBottom: 6 }}>{children}</li>
);

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100dvh", background: "#050508", color: "#fff",
      fontFamily: "system-ui, sans-serif",
    }}>
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
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>Privacy Policy</p>
          <p style={{ margin: 0, fontSize: 10, color: "rgba(212,175,55,0.6)" }}>2Ghost Hotel · Effective {EFFECTIVE}</p>
        </div>
      </div>

      {/* Gold top bar */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ height: 2, background: "linear-gradient(90deg,#92660a,#d4af37,#f0d060,#d4af37,#92660a)" }}
      />

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* Intro */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, margin: 0 }}>
            {APP_NAME} ("{APP_NAME}", "we", "us", or "our") operates the {APP_URL} website and mobile application (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <p style={{ margin: "0 0 10px" }}>We collect the following categories of information:</p>
          <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>a) Information you provide directly</p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 20 }}>
            <Li>Phone number or WhatsApp handle (used as your anonymous Ghost ID)</Li>
            <Li>Display name, age, gender, city, country</Li>
            <Li>Profile photo, bio, interests, and religion (all optional)</Li>
            <Li>Alternative contact handles (Instagram, Telegram, etc.) — only if you choose to share</Li>
            <Li>Messages sent in floor chat and private vault chat</Li>
            <Li>Payment information (processed by Stripe — we never store card details)</Li>
          </ul>
          <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>b) Information collected automatically</p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 20 }}>
            <Li>Approximate location (city/country level, derived from IP address)</Li>
            <Li>Device type, browser, and operating system</Li>
            <Li>Pages visited, features used, and time spent on the Service</Li>
            <Li>Push notification subscription tokens (if you grant permission)</Li>
            <Li>Last active timestamp (used for online status display)</Li>
          </ul>
          <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>c) Information from third parties</p>
          <ul style={{ margin: "0 0 0", paddingLeft: 20 }}>
            <Li>Payment confirmation data from Stripe (transaction ID, product purchased, amount)</Li>
            <Li>Affiliate referral codes (if you arrive via an affiliate link)</Li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <p style={{ margin: "0 0 10px" }}>We use the information we collect to:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <Li>Create and manage your anonymous Ghost profile</Li>
            <Li>Display your profile to other users in the hotel feed</Li>
            <Li>Facilitate matches, likes, and connections between users</Li>
            <Li>Process payments for room upgrades, coin purchases, and subscriptions</Li>
            <Li>Deliver coins and tier upgrades after confirmed payment</Li>
            <Li>Send push notifications (match alerts, butler messages) if you have granted permission</Li>
            <Li>Enforce our House Rules and remove users who violate them</Li>
            <Li>Monitor app performance, fix bugs, and improve the Service</Li>
            <Li>Comply with legal obligations</Li>
            <Li>Detect and prevent fraud or abuse</Li>
          </ul>
        </Section>

        <Section title="3. How We Share Your Information">
          <p style={{ margin: "0 0 10px" }}>We do not sell your personal information. We share your information only in the following circumstances:</p>
          <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>a) With other users</p>
          <p style={{ margin: "0 0 14px" }}>
            Your profile (display name, age, city, country, gender, photo, bio, and interests) is visible to other registered users of the Service. Your phone number and contact handles are only shared with users you have matched with and chosen to connect with.
          </p>
          <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>b) With service providers</p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 20 }}>
            <Li><strong style={{ color: "#fff" }}>Stripe</strong> — payment processing. Stripe's privacy policy is available at stripe.com/privacy</Li>
            <Li><strong style={{ color: "#fff" }}>Supabase</strong> — database and authentication infrastructure. Data is stored in ap-southeast-1 (Singapore)</Li>
            <Li><strong style={{ color: "#fff" }}>ImageKit</strong> — image hosting and CDN for profile photos</Li>
          </ul>
          <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>c) For legal reasons</p>
          <p style={{ margin: 0 }}>
            We may disclose your information if required by law, court order, or governmental authority, or if we believe disclosure is necessary to protect the rights, property, or safety of {APP_NAME}, our users, or the public.
          </p>
        </Section>

        <Section title="4. Method of Disclosure">
          <p style={{ margin: "0 0 10px" }}>
            Information is transmitted to third-party service providers via encrypted HTTPS connections using industry-standard TLS 1.2 or higher. Payment data is transmitted directly to Stripe's servers and never passes through our systems. Database communications use encrypted connections to Supabase's managed infrastructure.
          </p>
          <p style={{ margin: 0 }}>
            We do not disclose personal information to advertisers, data brokers, or any third party for marketing purposes.
          </p>
        </Section>

        <Section title="5. Security Practices">
          <p style={{ margin: "0 0 10px" }}>We implement the following security measures to protect your information:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <Li>All data in transit is encrypted using TLS 1.2+</Li>
            <Li>All data at rest is encrypted in Supabase's managed PostgreSQL database</Li>
            <Li>Row-Level Security (RLS) policies restrict database access so users can only access their own data</Li>
            <Li>Payment card data is handled exclusively by Stripe (PCI DSS Level 1 certified) — we store only transaction confirmation details</Li>
            <Li>Push notification tokens are stored securely and used only to deliver notifications to the intended device</Li>
            <Li>API keys and secrets are stored as environment variables, never in source code</Li>
            <Li>We conduct regular reviews of our security practices and update them as needed</Li>
          </ul>
          <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
            No method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p style={{ margin: "0 0 10px" }}>
            We retain your profile and activity data for as long as your account is active. If you request deletion of your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or compliance purposes (e.g. payment records, which are retained for 7 years in accordance with financial regulations).
          </p>
          <p style={{ margin: 0 }}>
            Chat messages in floor chat rooms are retained for 60 days. Private vault messages are retained until either party deletes them.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p style={{ margin: "0 0 10px" }}>Depending on your location, you may have the following rights regarding your personal data:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <Li><strong style={{ color: "#fff" }}>Access</strong> — request a copy of the data we hold about you</Li>
            <Li><strong style={{ color: "#fff" }}>Correction</strong> — request correction of inaccurate data</Li>
            <Li><strong style={{ color: "#fff" }}>Deletion</strong> — request deletion of your account and associated data</Li>
            <Li><strong style={{ color: "#fff" }}>Portability</strong> — request your data in a machine-readable format</Li>
            <Li><strong style={{ color: "#fff" }}>Objection</strong> — object to certain types of processing</Li>
            <Li><strong style={{ color: "#fff" }}>Withdraw consent</strong> — withdraw consent for push notifications at any time via your device settings</Li>
          </ul>
          <p style={{ margin: "12px 0 0" }}>
            To exercise any of these rights, contact us at <a href={`mailto:${CONTACT}`} style={{ color: "#d4af37" }}>{CONTACT}</a>.
          </p>
        </Section>

        <Section title="8. Cookies & Local Storage">
          <p style={{ margin: 0 }}>
            We use browser localStorage (not cookies) to store your Ghost profile, session data, coin balance, and app preferences locally on your device. This data does not leave your device unless explicitly synced to our servers. We do not use advertising cookies or third-party tracking pixels.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p style={{ margin: 0 }}>
            The Service is intended for users aged 18 and over. We do not knowingly collect personal information from anyone under 18. If we become aware that a person under 18 has provided us with personal information, we will delete it immediately. If you believe a minor has used the Service, contact us at <a href={`mailto:${CONTACT}`} style={{ color: "#d4af37" }}>{CONTACT}</a>.
          </p>
        </Section>

        <Section title="10. International Data Transfers">
          <p style={{ margin: 0 }}>
            Our database infrastructure is hosted in Singapore (ap-southeast-1). If you are accessing the Service from outside Singapore, your data may be transferred to and processed in Singapore. By using the Service, you consent to this transfer. We ensure appropriate safeguards are in place for all international data transfers.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p style={{ margin: 0 }}>
            We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Effective" date at the top of this page and, where appropriate, by displaying a notice within the app. Your continued use of the Service after any changes constitutes your acceptance of the updated policy.
          </p>
        </Section>

        <Section title="12. Contact Us">
          <p style={{ margin: 0 }}>
            If you have any questions about this Privacy Policy, your data, or our practices, please contact us:
          </p>
          <div style={{
            marginTop: 14, background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.2)", borderRadius: 14, padding: "16px 18px",
          }}>
            <p style={{ margin: "0 0 4px", fontWeight: 800, color: "#fff" }}>2Ghost Hotel</p>
            <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.55)" }}>
              Email: <a href={`mailto:${CONTACT}`} style={{ color: "#d4af37" }}>{CONTACT}</a>
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.55)" }}>
              Website: <a href={APP_URL} style={{ color: "#d4af37" }}>{APP_URL}</a>
            </p>
          </div>
        </Section>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(212,175,55,0.1)", textAlign: "center" }}>
          <img src={GHOST_LOGO} alt="2Ghost" style={{ width: 32, height: 32, objectFit: "contain", opacity: 0.4, marginBottom: 8 }} />
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>
            © {new Date().getFullYear()} 2Ghost Hotel · All rights reserved
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", margin: "4px 0 0" }}>
            Effective date: {EFFECTIVE}
          </p>
        </div>

      </div>
    </div>
  );
}
