// ── Hotel Rules Page ──────────────────────────────────────────────────────────
// Full-height standalone page. Linked from HouseRulesModal.
// X button navigates back (or to /ghost/mode if no history).

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

const SECTIONS = [
  {
    title: "1. Age Requirement — 18+ Only",
    icon: "🔞",
    rules: [
      "You must be 18 years of age or older to use 2Ghost Hotel. Access by anyone under 18 is strictly prohibited.",
      "By agreeing to these rules, you confirm that you are at least 18 years old.",
      "Any account found to belong to a minor will be permanently banned immediately, without warning or appeal.",
    ],
  },
  {
    title: "2. Respectful Conduct",
    icon: "🤝",
    rules: [
      "All guests are expected to treat every other member with dignity and respect at all times.",
      "Harassment, bullying, threats, intimidation, or any form of verbal abuse — whether in chat, on your profile, or in any message — is grounds for immediate account removal.",
      "Hate speech targeting race, ethnicity, religion, gender, sexual orientation, disability, or nationality will result in a permanent ban without notice.",
    ],
  },
  {
    title: "3. No Indecent Language or Content",
    icon: "🚫",
    rules: [
      "Posting, sharing, or sending sexually explicit, graphic, or indecent content of any kind is strictly forbidden.",
      "Unsolicited explicit messages or images will result in immediate suspension.",
      "Profile photos must be appropriate. No nudity, partial nudity, or sexually suggestive imagery is permitted on profile pictures.",
      "Content that glorifies violence, self-harm, or illegal activity is prohibited.",
    ],
  },
  {
    title: "4. Date Commitments — No-Shows",
    icon: "📅",
    rules: [
      "When you accept a date or meeting arranged through 2Ghost Hotel, you are expected to honour that commitment.",
      "Repeated no-shows — accepting plans and failing to appear without prior cancellation — are a serious violation of the hotel's code of conduct.",
      "Three documented no-shows may result in your account being suspended or permanently removed.",
      "If you are unable to attend, you must cancel with reasonable notice. Ghosting someone you have committed to meeting is not acceptable behaviour within these walls.",
    ],
  },
  {
    title: "5. No Spam or Unsolicited Messaging",
    icon: "📵",
    rules: [
      "Sending the same message to multiple users, copy-pasting generic openers in bulk, or any form of mass messaging is considered spam and is prohibited.",
      "Advertising, promoting third-party services, apps, websites, or businesses through the platform is strictly forbidden.",
      "Soliciting money, gifts, or financial information from other members is a bannable offence.",
      "Bot activity, automated messages, or use of scripts to interact with profiles will result in immediate and permanent account termination.",
    ],
  },
  {
    title: "6. Authentic Identity",
    icon: "👤",
    rules: [
      "You may not impersonate another person, celebrity, or public figure.",
      "Creating fake or misleading profiles is a violation of hotel policy and may result in legal consequences.",
      "You must use a genuine photo of yourself. Stock images, celebrity photos, or AI-generated faces are not permitted.",
      "Catfishing — pretending to be someone you are not in order to deceive another member — will result in a permanent ban.",
    ],
  },
  {
    title: "7. Privacy & Confidentiality",
    icon: "🔒",
    rules: [
      "You may not share, screenshot, or distribute another member's photos, identity, conversations, or personal information outside of 2Ghost Hotel.",
      "All interactions within the hotel are private. Leaking or publicly exposing any member's details is a serious breach of hotel policy.",
      "Doxxing — revealing a member's real-world identity or location without consent — is a permanent ban offence and may be reported to local authorities.",
    ],
  },
  {
    title: "8. No Illegal Activity",
    icon: "⚖️",
    rules: [
      "2Ghost Hotel must not be used for any illegal purpose, including but not limited to: solicitation, trafficking, drug distribution, fraud, or money laundering.",
      "Any account suspected of facilitating illegal activity will be immediately suspended, and relevant information may be disclosed to law enforcement.",
      "Attempting to hack, scrape, reverse-engineer, or exploit the platform in any way will result in a permanent ban and potential legal action.",
    ],
  },
  {
    title: "9. Termination Without Notice",
    icon: "🚪",
    rules: [
      "2Ghost Hotel reserves the right to suspend or permanently ban any account at any time, with or without prior notice, for any violation of these rules.",
      "Bans may be issued at the sole discretion of hotel management. There is no guaranteed right of appeal.",
      "Users who are banned forfeit any unused credits, subscriptions, or paid features — no refunds will be issued in the case of a rule violation.",
      "Repeated creation of new accounts after a ban is a further violation and may result in device-level blocking.",
    ],
  },
  {
    title: "10. Changes to These Rules",
    icon: "📋",
    rules: [
      "2Ghost Hotel may update or amend these rules at any time. Continued use of the platform following any changes constitutes acceptance of the revised rules.",
      "It is your responsibility to review these rules periodically.",
    ],
  },
];

export default function HotelRulesPage() {
  const navigate  = useNavigate();
  const a = useGenderAccent();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#05050a",
      display: "flex", flexDirection: "column",
      maxWidth: 480, margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: "env(safe-area-inset-top, 16px) 20px 0",
        background: "rgba(5,5,10,0.98)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0 14px" }}>
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>🏨 Hotel Rules</p>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>2Ghost Hotel — Terms of Conduct</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => navigate(-1)}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)",
              fontSize: 18, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >✕</motion.button>
        </div>
        {/* Accent bar */}
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${a.accent}, ${a.accentMid}, ${a.accent}, transparent)`, marginBottom: 0 }} />
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "24px 20px max(40px, env(safe-area-inset-bottom, 40px))" }}>

        {/* Intro */}
        <div style={{ marginBottom: 28, padding: "16px 18px", background: a.glow(0.05), border: `1px solid ${a.glow(0.12)}`, borderRadius: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.75 }}>
            These rules govern the conduct of every guest within 2Ghost Hotel. By using this platform you agree to abide by them in full.{" "}
            <span style={{ color: a.accent, fontWeight: 700 }}>Violations may result in immediate account termination without notice or refund.</span>
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {SECTIONS.map((section, si) => (
            <motion.div
              key={si}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.04 }}
            >
              {/* Section header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>{section.icon}</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>{section.title}</p>
              </div>

              {/* Rules list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 10, borderLeft: `2px solid ${a.glow(0.2)}` }}>
                {section.rules.map((rule, ri) => (
                  <p key={ri} style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                    {rule}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Butler Final Say */}
        <div style={{ marginTop: 36, padding: "20px 18px", background: "rgba(185,28,28,0.1)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <img src="https://ik.imagekit.io/7grri5v7d/werwerwer-removebg-preview.png" alt="Butler" style={{ width: 38, height: 38, objectFit: "contain", flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#f87171", letterSpacing: "-0.01em" }}>The Butler Has Final Say</p>
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>
            The 2Ghost Hotel Butler is the highest authority within this establishment. All decisions regarding guest conduct, rule enforcement, account suspension, and dispute resolution rest solely with the Butler.
          </p>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.75 }}>
            The Butler's ruling is final, binding, and non-negotiable. There is no escalation path above the Butler. No guest, regardless of their standing, subscription level, or tenure within the hotel, is exempt from this authority.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(248,113,113,0.85)", fontWeight: 700, lineHeight: 1.75, fontStyle: "italic" }}>
            "Within these walls, the Butler speaks for the hotel. What the Butler decides… stands."
          </p>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 16, padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, textAlign: "center" }}>
            Last updated March 2025 · 2Ghost Hotel Management reserves the right to enforce these rules at its sole discretion at any time without prior notice.
          </p>
        </div>
      </div>
    </div>
  );
}
