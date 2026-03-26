import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";
const EFFECTIVE  = "27 March 2026";
const CONTACT    = "support@2ghost.app";
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

export default function TermsOfServicePage() {
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
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>Terms of Service</p>
          <p style={{ margin: 0, fontSize: 10, color: "rgba(212,175,55,0.6)" }}>2Ghost Hotel · Effective {EFFECTIVE}</p>
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
            Terms of Service
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, margin: 0 }}>
            By accessing or using {APP_NAME} at {APP_URL} (the "Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. We reserve the right to update these terms at any time.
          </p>
        </div>

        <Section title="1. Eligibility">
          <p style={{ margin: 0 }}>
            You must be at least 18 years of age to use this Service. By using the Service, you represent and warrant that you are 18 or older and have the legal capacity to enter into these Terms. If we discover you are under 18, your account will be immediately terminated.
          </p>
        </Section>

        <Section title="2. Account & Identity">
          <p style={{ margin: "0 0 10px" }}>
            {APP_NAME} uses anonymous "Ghost" profiles. You are responsible for all activity that occurs under your Ghost ID. You agree to:
          </p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <Li>Provide truthful information when setting up your profile</Li>
            <Li>Not impersonate any person or entity</Li>
            <Li>Not create multiple accounts to evade a ban or suspension</Li>
            <Li>Keep your contact information current and accurate</Li>
          </ul>
        </Section>

        <Section title="3. Acceptable Use">
          <p style={{ margin: "0 0 10px" }}>You agree NOT to use the Service to:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <Li>Harass, threaten, stalk, or intimidate other users</Li>
            <Li>Share sexually explicit, violent, or illegal content</Li>
            <Li>Solicit money, promote escort services, or engage in sex work</Li>
            <Li>Spam, scam, or defraud other users</Li>
            <Li>Share another person's private information without consent</Li>
            <Li>Use bots, scrapers, or automated tools to interact with the Service</Li>
            <Li>Attempt to reverse-engineer, hack, or disrupt the Service</Li>
            <Li>Violate any applicable local, national, or international law</Li>
          </ul>
          <p style={{ margin: "12px 0 0" }}>
            Violation of these rules may result in immediate account suspension or permanent ban without refund.
          </p>
        </Section>

        <Section title="4. Coins & Virtual Currency">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <Li>Ghost Coins are a virtual currency with no real-world monetary value and cannot be exchanged for cash</Li>
            <Li>Coins are non-transferable between accounts</Li>
            <Li>Purchased coins are non-refundable except as required by applicable consumer law</Li>
            <Li>We reserve the right to modify the cost of features or the value of coins at any time</Li>
            <Li>Coins in your account will expire if your account is terminated due to a violation of these Terms</Li>
          </ul>
        </Section>

        <Section title="5. Room Upgrades & Subscriptions">
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <Li>Room upgrade purchases (Suite, Gold, Kings, Penthouse, Cellar, Garden) are one-time payments that unlock access to that floor for the duration of the subscription period</Li>
            <Li>Ghost Black Monthly is a recurring subscription billed monthly until cancelled</Li>
            <Li>You may cancel a subscription at any time; cancellation takes effect at the end of the current billing period</Li>
            <Li>All payments are processed by Stripe and are subject to Stripe's terms of service</Li>
            <Li>We do not store your payment card details</Li>
          </ul>
        </Section>

        <Section title="6. Refund Policy">
          <p style={{ margin: "0 0 10px" }}>
            Due to the digital nature of our products, all purchases are generally non-refundable. Exceptions may apply where required by law (e.g. EU consumer rights directive). To request a refund, contact us within 14 days of purchase at <a href={`mailto:${CONTACT}`} style={{ color: "#d4af37" }}>{CONTACT}</a> with your Ghost ID and transaction details. We review all requests individually.
          </p>
          <p style={{ margin: 0 }}>
            Accounts banned for violating these Terms forfeit any unused coins or active subscriptions without refund.
          </p>
        </Section>

        <Section title="7. User Content">
          <p style={{ margin: "0 0 10px" }}>
            By submitting content (profile photos, bio, chat messages, etc.) to the Service, you grant {APP_NAME} a worldwide, non-exclusive, royalty-free licence to use, store, and display that content solely for the purpose of operating the Service.
          </p>
          <p style={{ margin: 0 }}>
            You retain ownership of your content. You are solely responsible for the content you post and must ensure it does not violate any third-party rights or applicable laws.
          </p>
        </Section>

        <Section title="8. Privacy">
          <p style={{ margin: 0 }}>
            Your use of the Service is also governed by our <a href="/privacy-policy" style={{ color: "#d4af37" }}>Privacy Policy</a>, which is incorporated into these Terms by reference. By using the Service, you consent to the data practices described in our Privacy Policy.
          </p>
        </Section>

        <Section title="9. Disclaimers">
          <p style={{ margin: "0 0 10px" }}>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
          </p>
          <p style={{ margin: 0 }}>
            {APP_NAME} is a social platform and does not conduct background checks on users. We are not responsible for the conduct of any user, whether online or offline. Meeting other users in person is entirely at your own risk.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p style={{ margin: 0 }}>
            TO THE FULLEST EXTENT PERMITTED BY LAW, {APP_NAME.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p style={{ margin: 0 }}>
            These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these Terms or your use of the Service shall be resolved through good-faith negotiation first, and if unresolved, through binding arbitration or the courts of competent jurisdiction.
          </p>
        </Section>

        <Section title="12. Changes to These Terms">
          <p style={{ margin: 0 }}>
            We reserve the right to modify these Terms at any time. Material changes will be communicated via an in-app notice or email. Your continued use of the Service after changes take effect constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="13. Contact">
          <p style={{ margin: "0 0 14px" }}>For questions about these Terms, contact us:</p>
          <div style={{
            background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: 14, padding: "16px 18px",
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
