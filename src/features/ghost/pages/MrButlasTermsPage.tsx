import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const LOGO     = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";
const EFFECTIVE = "27 March 2026";
const CONTACT   = "mrbutlas@gmail.com";
const APP_NAME  = "Mr. Butlas";
const APP_URL   = "www.mrbutlas.com";
const FULL_URL  = "https://www.mrbutlas.com";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 15, fontWeight: 900, color: "#d4af37", margin: "0 0 12px", letterSpacing: "0.04em", lineHeight: 1.4 }}>
      {title}
    </h2>
    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.62)", lineHeight: 1.9 }}>
      {children}
    </div>
  </div>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <li style={{ marginBottom: 8, paddingLeft: 4 }}>{children}</li>
);

const Warning = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)",
    borderRadius: 12, padding: "14px 16px", margin: "14px 0", fontSize: 13,
    color: "rgba(255,255,255,0.7)", lineHeight: 1.8,
  }}>
    {children}
  </div>
);

export default function MrButlasTermsPage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100dvh", background: "#050508", color: "#fff", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,8,0.97)",
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
        <img src={LOGO} alt="Mr. Butlas" style={{ width: 28, height: 28, objectFit: "contain" }} />
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>Terms &amp; Conditions</p>
          <p style={{ margin: 0, fontSize: 10, color: "rgba(212,175,55,0.6)" }}>Mr. Butlas · Effective {EFFECTIVE}</p>
        </div>
      </div>

      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ height: 2, background: "linear-gradient(90deg,#92660a,#d4af37,#f0d060,#d4af37,#92660a)" }}
      />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 24px 80px" }}>

        {/* Title block */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 14px", lineHeight: 1.2 }}>
            Terms &amp; Conditions
          </h1>
          <Warning>
            PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY BEFORE USING THE {APP_NAME.toUpperCase()} PLATFORM. BY CREATING AN ACCOUNT, ACCESSING, OR USING THIS SERVICE IN ANY WAY, YOU AGREE TO BE LEGALLY BOUND BY THESE TERMS. IF YOU DO NOT AGREE, YOU MUST IMMEDIATELY CEASE USE OF THE SERVICE. THESE TERMS CONTAIN A BINDING ARBITRATION CLAUSE, A CLASS ACTION WAIVER, AND LIMITATIONS ON OUR LIABILITY.
          </Warning>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, margin: 0 }}>
            These Terms and Conditions ("Terms") govern your access to and use of the {APP_NAME} dating platform, including its website at {APP_URL}, mobile application, and all related services (collectively, the "Service"). The Service is operated by {APP_NAME} ("we", "us", "our", or the "Company"). By using the Service, you enter into a legally binding agreement with us.
          </p>
        </div>

        {/* ── 1. PLATFORM DESCRIPTION ── */}
        <Section title="1. About Mr. Butlas — Platform Description">
          <p style={{ margin: "0 0 12px" }}>
            {APP_NAME} is an online social dating platform that provides technology infrastructure enabling adult users to create profiles, discover other members, communicate, and potentially form connections. {APP_NAME} operates solely as a <strong style={{ color: "#fff" }}>technology platform and intermediary</strong>. We do not introduce, match, arrange meetings, or act as a dating agency.
          </p>
          <p style={{ margin: "0 0 12px" }}>
            We make no guarantee that use of the Service will result in any match, connection, date, relationship, or any other outcome. Any connections formed are between users independently and are entirely at their own discretion and risk.
          </p>
          <p style={{ margin: 0 }}>
            The Service is provided for lawful personal, non-commercial use only. Nothing in these Terms creates an employment, partnership, joint venture, agency, franchise, or sales representative relationship between you and {APP_NAME}.
          </p>
        </Section>

        {/* ── 2. ELIGIBILITY ── */}
        <Section title="2. Eligibility">
          <p style={{ margin: "0 0 10px" }}>You must meet ALL of the following requirements to use the Service:</p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li>You must be at least <strong style={{ color: "#fff" }}>18 years of age</strong>. The Service is strictly for adults. We do not knowingly permit minors to use the Service.</Li>
            <Li>You must have the legal capacity to enter into a binding contract in your jurisdiction.</Li>
            <Li>You must not be prohibited from using the Service under the laws of your country, state, or territory.</Li>
            <Li>You must not have been previously banned or suspended from the Service or any related platform.</Li>
            <Li>You must not be a convicted sex offender or be registered on any sex offender registry in any jurisdiction.</Li>
            <Li>You must not have been convicted of, or pleaded no contest to, any felony, violent crime, or crime involving sexual misconduct, exploitation, or abuse.</Li>
          </ul>
          <p style={{ margin: 0 }}>
            By using the Service, you represent and warrant that you meet all eligibility criteria. If we discover, at any time, that you do not meet these requirements, we reserve the right to immediately terminate your account without notice, refund, or liability.
          </p>
        </Section>

        {/* ── 3. ACCOUNT REGISTRATION ── */}
        <Section title="3. Account Registration &amp; Responsibility">
          <p style={{ margin: "0 0 10px" }}>
            To access certain features of the Service, you must create an account. By registering, you agree to:
          </p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li>Provide accurate, complete, and current information at all times</Li>
            <Li>Maintain and promptly update your account information as necessary</Li>
            <Li>Maintain the security and confidentiality of your login credentials</Li>
            <Li>Immediately notify us of any unauthorised use of your account</Li>
            <Li>Accept full responsibility for all activity that occurs under your account</Li>
            <Li>Not share your account with or transfer it to any other person</Li>
            <Li>Not create more than one account, or create a new account after being banned</Li>
          </ul>
          <p style={{ margin: 0 }}>
            We are not liable for any loss or damage arising from your failure to comply with these requirements. You acknowledge that {APP_NAME} cannot and does not verify the identity of all users and makes no representations about the identity, character, or intentions of any member.
          </p>
        </Section>

        {/* ── 4. PLATFORM ROLE & NON-RESPONSIBILITY FOR USERS ── */}
        <Section title="4. Platform Role — We Are Not Responsible for Other Users">
          <Warning>
            IMPORTANT: {APP_NAME.toUpperCase()} IS A TECHNOLOGY PLATFORM ONLY. WE ARE NOT A DATING AGENCY, MATCHMAKING SERVICE, OR BACKGROUND-CHECKING AUTHORITY. WE DO NOT ENDORSE, VOUCH FOR, OR MAKE ANY REPRESENTATIONS ABOUT THE CHARACTER, INTENTIONS, IDENTITY, HONESTY, TRUSTWORTHINESS, COMPATIBILITY, OR SUITABILITY OF ANY USER.
          </Warning>
          <p style={{ margin: "0 0 12px" }}>
            You acknowledge and agree that:
          </p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li>{APP_NAME} does not conduct comprehensive criminal background checks on users and cannot guarantee the accuracy of information provided by users</Li>
            <Li>We are not responsible for the conduct, behaviour, actions, or omissions of any user, whether online or offline, before, during, or after any interaction facilitated by the Service</Li>
            <Li>Any meeting or interaction you choose to have with another user is entirely at your own risk and discretion</Li>
            <Li>We cannot guarantee that users are who they claim to be, are acting in good faith, or have disclosed all relevant information about themselves</Li>
            <Li>{APP_NAME} is not a party to any communications, agreements, arrangements, or disputes between users</Li>
            <Li>We are not liable for any physical, emotional, financial, or any other harm arising from your interactions with other users</Li>
          </ul>
          <p style={{ margin: "0 0 12px" }}>
            While we employ good-faith efforts to maintain a safe environment — including spam filters, content moderation, reporting tools, and profile verification measures — these tools are not perfect and do not guarantee the safety, authenticity, or suitability of any user or content. We make no warranty that our moderation systems will detect or remove all harmful, fraudulent, or illegal content or users.
          </p>
          <p style={{ margin: 0 }}>
            YOU ARE SOLELY RESPONSIBLE FOR ALL OF YOUR COMMUNICATIONS AND INTERACTIONS WITH OTHER USERS OF THE SERVICE AND WITH OTHER PERSONS WITH WHOM YOU COMMUNICATE OR INTERACT AS A RESULT OF YOUR USE OF THE SERVICE.
          </p>
        </Section>

        {/* ── 5. VERIFICATION & MODERATION EFFORTS ── */}
        <Section title="5. Verification &amp; Moderation — Our Good-Faith Efforts">
          <p style={{ margin: "0 0 12px" }}>
            {APP_NAME} takes user safety seriously and operates the following good-faith measures to help maintain platform standards:
          </p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li><strong style={{ color: "#fff" }}>Spam Detection:</strong> We deploy automated spam-detection filters to identify and remove bot accounts, fake profiles, and mass unsolicited messaging patterns</Li>
            <Li><strong style={{ color: "#fff" }}>Profile Moderation:</strong> Profile photos and content are subject to automated and manual review against our Community Guidelines</Li>
            <Li><strong style={{ color: "#fff" }}>Report & Block System:</strong> Users can report and block other users at any time. All reports are reviewed by our moderation team</Li>
            <Li><strong style={{ color: "#fff" }}>Age Verification:</strong> We require users to confirm they are 18 or older during registration and may request identity verification where reasonably practicable</Li>
            <Li><strong style={{ color: "#fff" }}>Content Standards:</strong> We actively remove content that violates applicable laws, including illegal, explicit, violent, or hateful material</Li>
          </ul>
          <p style={{ margin: 0 }}>
            These measures represent our best-effort commitment to maintaining platform safety. However, you acknowledge that no automated or manual system is infallible and that {APP_NAME} cannot be held liable for harmful content or behaviour that evades these measures despite our reasonable efforts. We reserve the right to improve, modify, or discontinue any safety measure at our sole discretion.
          </p>
        </Section>

        {/* ── 6. ACCEPTABLE USE ── */}
        <Section title="6. Acceptable Use — Prohibited Conduct">
          <p style={{ margin: "0 0 10px" }}>You agree that you will NOT use the Service to:</p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li>Harass, stalk, intimidate, threaten, bully, or abuse any person</Li>
            <Li>Engage in any form of sexual harassment, unwanted sexual contact, or sexual coercion</Li>
            <Li>Impersonate any person or entity, or misrepresent your identity, age, gender, or any other attribute</Li>
            <Li>Post or share false, misleading, or deceptive information about yourself or others</Li>
            <Li>Share, solicit, or engage in any form of sex work, escort services, prostitution, or human trafficking</Li>
            <Li>Solicit money, financial assistance, gifts, or investments from other users</Li>
            <Li>Engage in romance scams, catfishing, fraud, or any deceptive scheme</Li>
            <Li>Share, upload, or distribute sexually explicit, pornographic, or obscene content of any kind</Li>
            <Li>Share content depicting or promoting violence, self-harm, eating disorders, or dangerous behaviour</Li>
            <Li>Post content that is discriminatory, hateful, or derogatory on the basis of race, ethnicity, nationality, religion, gender, gender identity, sexual orientation, disability, age, body type, or any other protected characteristic</Li>
            <Li>Spam, send unsolicited bulk messages, or engage in any form of commercial solicitation</Li>
            <Li>Scrape, harvest, or collect personal data from other users without their explicit consent</Li>
            <Li>Use bots, scripts, automated tools, or artificial intelligence to interact with the Service or other users</Li>
            <Li>Reverse-engineer, decompile, disassemble, or attempt to derive the source code of the Service</Li>
            <Li>Attempt to breach, bypass, or otherwise undermine the security or integrity of the Service</Li>
            <Li>Upload malware, viruses, or any malicious code</Li>
            <Li>Create accounts for or on behalf of third parties</Li>
            <Li>Violate any applicable local, national, or international law or regulation</Li>
          </ul>
          <p style={{ margin: 0 }}>
            Any violation of these rules may result in immediate account suspension or permanent ban, without prior notice, warning, refund, or liability on our part. We reserve the right to report illegal activity to the relevant authorities and to cooperate fully with law enforcement investigations.
          </p>
        </Section>

        {/* ── 7. USER CONTENT ── */}
        <Section title="7. User Content — Your Responsibility">
          <p style={{ margin: "0 0 12px" }}>
            "User Content" means any content you submit, upload, post, transmit, or otherwise make available on or through the Service, including profile photos, bio text, messages, images, videos, and audio.
          </p>
          <p style={{ margin: "0 0 12px" }}>
            By submitting User Content, you represent and warrant that:
          </p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li>You own the content or have all necessary rights, licences, and permissions to post it</Li>
            <Li>The content does not infringe any third-party intellectual property, privacy, or other rights</Li>
            <Li>The content is not false, misleading, defamatory, obscene, or otherwise unlawful</Li>
            <Li>All individuals depicted in photos or videos have provided their explicit consent to appear</Li>
            <Li>The content complies with all applicable laws and these Terms</Li>
          </ul>
          <p style={{ margin: "0 0 12px" }}>
            By submitting User Content, you grant {APP_NAME} a worldwide, non-exclusive, royalty-free, sub-licensable, and transferable licence to use, store, display, reproduce, and distribute that content solely for the purpose of operating and improving the Service.
          </p>
          <p style={{ margin: 0 }}>
            You are solely responsible for all User Content you submit. {APP_NAME} is not responsible for, does not endorse, and does not verify the accuracy or legality of any User Content. We reserve the right to remove any User Content at our sole discretion, without notice or explanation.
          </p>
        </Section>

        {/* ── 8. SAFETY ADVISORY ── */}
        <Section title="8. Personal Safety — Your Responsibility When Meeting Others">
          <Warning>
            MEETING STRANGERS FROM THE INTERNET CARRIES INHERENT RISK. {APP_NAME.toUpperCase()} STRONGLY ADVISES ALL USERS TO EXERCISE CAUTION AND GOOD JUDGMENT BEFORE MEETING ANYONE IN PERSON. WE ARE NOT RESPONSIBLE FOR ANY HARM, INJURY, LOSS, OR DAMAGE THAT OCCURS DURING OR AS A RESULT OF IN-PERSON MEETINGS BETWEEN USERS.
          </Warning>
          <p style={{ margin: "0 0 10px" }}>We strongly recommend that users:</p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li>Meet for the first time in a well-lit, public place</Li>
            <Li>Inform a trusted friend or family member of your plans, location, and expected return time</Li>
            <Li>Arrange your own transportation and do not rely on a date for a ride home</Li>
            <Li>Do not share your home address, financial details, or other sensitive personal information early in a connection</Li>
            <Li>Trust your instincts — if something feels wrong, leave immediately</Li>
            <Li>Report any suspicious, threatening, or abusive behaviour to us and, where appropriate, to the police</Li>
          </ul>
          <p style={{ margin: 0 }}>
            These are recommendations only. Adherence to these safety tips does not guarantee your safety. {APP_NAME} accepts no liability whatsoever for harm arising from user interactions, whether online or offline.
          </p>
        </Section>

        {/* ── 9. SUBSCRIPTIONS, COINS & PURCHASES ── */}
        <Section title="9. Subscriptions, Coins &amp; In-App Purchases">
          <p style={{ margin: "0 0 12px" }}>
            {APP_NAME} offers both free and paid features. Paid features may include subscription plans, virtual currency ("Coins"), and one-time purchases ("In-App Purchases").
          </p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li><strong style={{ color: "#fff" }}>Subscriptions</strong> automatically renew at the end of each billing period unless cancelled at least 24 hours before the renewal date. Cancellation takes effect at the end of the current billing period.</Li>
            <Li><strong style={{ color: "#fff" }}>Coins</strong> are a virtual currency with no real-world monetary value. Coins cannot be transferred, exchanged for cash, or redeemed for any real-world goods or services.</Li>
            <Li><strong style={{ color: "#fff" }}>All purchases are final and non-refundable</strong>, except where required by applicable consumer protection law (e.g. the EU 14-day cooling-off period).</Li>
            <Li>Coins and subscription benefits will be permanently forfeited if your account is terminated for violations of these Terms, without any right to a refund.</Li>
            <Li>We reserve the right to modify pricing, coin values, and feature costs at any time. Continued use of the Service after a price change constitutes acceptance of the new pricing.</Li>
            <Li>All payments are processed by our third-party payment processor (Stripe). We do not store your payment card details. Stripe's own terms and privacy policy apply to payment processing.</Li>
            <Li>For purchases made via Apple App Store or Google Play, the relevant platform's refund policy applies.</Li>
          </ul>
          <p style={{ margin: 0 }}>
            If you believe you have been charged in error, contact us at <a href={`mailto:${CONTACT}`} style={{ color: "#d4af37" }}>{CONTACT}</a> within 14 days of the charge with your account details and transaction reference.
          </p>
        </Section>

        {/* ── 10. REFUND POLICY ── */}
        <Section title="10. Refund Policy">
          <p style={{ margin: "0 0 12px" }}>
            Due to the digital and immediately consumable nature of our products, <strong style={{ color: "#fff" }}>all purchases are generally non-refundable</strong>. Once a subscription period has begun or coins have been issued to your account, those purchases are considered used.
          </p>
          <p style={{ margin: "0 0 12px" }}>
            Exceptions may apply where required by law. Users in the European Union, European Economic Area, United Kingdom, or Switzerland may be entitled to a 14-day cooling-off period from the date of purchase, provided they have not begun using the digital content. To exercise this right, contact us within 14 days at <a href={`mailto:${CONTACT}`} style={{ color: "#d4af37" }}>{CONTACT}</a>.
          </p>
          <p style={{ margin: 0 }}>
            We review all refund requests individually and at our sole discretion. Accounts banned for Terms violations forfeit all unused coins and active subscriptions without refund.
          </p>
        </Section>

        {/* ── 11. ACCOUNT SUSPENSION & TERMINATION ── */}
        <Section title="11. Account Suspension &amp; Termination">
          <p style={{ margin: "0 0 12px" }}>
            {APP_NAME} reserves the right, at its sole and absolute discretion, to suspend, restrict, or permanently terminate your account at any time and without prior notice for any reason, including but not limited to:
          </p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li>Violation of any provision of these Terms</Li>
            <Li>Violation of our Community Guidelines</Li>
            <Li>Conduct that we determine, in our sole discretion, to be harmful to other users, third parties, or the platform</Li>
            <Li>Provision of false or misleading information during registration or at any time</Li>
            <Li>Suspected fraudulent, abusive, or illegal activity, even if not yet conclusively proven</Li>
            <Li>Receipt of complaints from other users or third parties about your conduct</Li>
            <Li>Extended inactivity on your account</Li>
            <Li>Any other reason we deem appropriate in our sole discretion</Li>
          </ul>
          <p style={{ margin: "0 0 12px" }}>
            Upon termination, your right to use the Service immediately ceases. We have no obligation to retain your account data after termination, though we may retain certain data as required by law or for legitimate business purposes.
          </p>
          <p style={{ margin: 0 }}>
            Termination of your account does not entitle you to any refund of unused coins, subscription fees, or any other amount paid. You may terminate your own account at any time through the account settings. Self-termination does not entitle you to a refund.
          </p>
        </Section>

        {/* ── 12. DISCLAIMER OF WARRANTIES ── */}
        <Section title="12. Disclaimer of Warranties">
          <Warning>
            THE SERVICE IS PROVIDED STRICTLY ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, {APP_NAME.toUpperCase()} EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
          </Warning>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li>Any implied warranty of merchantability, fitness for a particular purpose, or non-infringement</Li>
            <Li>Any warranty that the Service will be uninterrupted, secure, error-free, or free from viruses or harmful components</Li>
            <Li>Any warranty regarding the accuracy, completeness, reliability, or quality of any content on the Service, including User Content</Li>
            <Li>Any warranty that the Service will meet your expectations or requirements</Li>
            <Li>Any warranty regarding the character, identity, intentions, or actions of any user</Li>
          </ul>
          <p style={{ margin: 0 }}>
            We do not warrant that defects in the Service will be corrected, that the Service or its servers are free from viruses or harmful code, or that use of the Service will produce any particular result. You use the Service entirely at your own risk.
          </p>
        </Section>

        {/* ── 13. LIMITATION OF LIABILITY ── */}
        <Section title="13. Limitation of Liability">
          <Warning>
            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, {APP_NAME.toUpperCase()}, ITS DIRECTORS, EMPLOYEES, AGENTS, PARTNERS, SUPPLIERS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO:
          </Warning>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li>Loss of profits, revenue, data, goodwill, or other intangible losses</Li>
            <Li>Personal injury or property damage arising from your use of the Service</Li>
            <Li>Any harm resulting from the conduct or content of any user, including fraudulent, abusive, or illegal conduct</Li>
            <Li>Any harm resulting from interactions — online or offline — with other users</Li>
            <Li>Unauthorised access to or use of our servers or any personal information stored therein</Li>
            <Li>Interruption, suspension, or discontinuation of the Service</Li>
            <Li>Any bugs, viruses, trojan horses, or similar harmful code transmitted through the Service</Li>
            <Li>Errors or omissions in any content on the Service</Li>
          </ul>
          <p style={{ margin: "0 0 12px" }}>
            These limitations apply whether the alleged liability is based on contract, tort, negligence, strict liability, or any other legal basis, and even if {APP_NAME} has been advised of the possibility of such damages.
          </p>
          <p style={{ margin: 0 }}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THE SERVICE OR THESE TERMS SHALL NOT EXCEED THE GREATER OF (A) THE TOTAL AMOUNT YOU HAVE PAID TO {APP_NAME.toUpperCase()} IN THE 12 MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) £100 / €100 / $100 (WHICHEVER CURRENCY APPLIES TO YOUR JURISDICTION).
          </p>
        </Section>

        {/* ── 14. INDEMNIFICATION ── */}
        <Section title="14. Indemnification">
          <p style={{ margin: "0 0 12px" }}>
            You agree to indemnify, defend, and hold harmless {APP_NAME}, its officers, directors, employees, agents, licensors, and service providers from and against any and all claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable legal fees) arising out of or relating to:
          </p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li>Your use of, or inability to use, the Service</Li>
            <Li>Your violation of these Terms or any applicable law or regulation</Li>
            <Li>Your User Content or any content you submit, post, or transmit through the Service</Li>
            <Li>Your violation of any rights of another person or entity</Li>
            <Li>Your interactions with other users, whether online or offline</Li>
            <Li>Any claim that your User Content infringes the intellectual property or other rights of any third party</Li>
            <Li>Your fraudulent, abusive, or illegal conduct</Li>
          </ul>
          <p style={{ margin: 0 }}>
            We reserve the right to assume exclusive control of the defence of any matter subject to indemnification by you, at your expense. You agree to cooperate fully with us in the defence of any such claim. This indemnification obligation survives termination of your account and these Terms.
          </p>
        </Section>

        {/* ── 15. INTELLECTUAL PROPERTY ── */}
        <Section title="15. Intellectual Property">
          <p style={{ margin: "0 0 12px" }}>
            The Service and all of its content, features, and functionality — including but not limited to the design, text, graphics, logos, icons, images, software, code, and the selection and arrangement thereof — are owned by {APP_NAME} or its licensors and are protected by copyright, trademark, and other applicable intellectual property laws.
          </p>
          <p style={{ margin: "0 0 12px" }}>
            You are granted a limited, non-exclusive, non-transferable, revocable licence to access and use the Service solely for your personal, non-commercial purposes as expressly permitted by these Terms. This licence does not include the right to:
          </p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
            <Li>Reproduce, copy, or distribute any part of the Service</Li>
            <Li>Modify, adapt, or create derivative works based on the Service</Li>
            <Li>Use the Service for any commercial purpose or for any public display</Li>
            <Li>Use any data mining, robots, or similar data gathering tools</Li>
          </ul>
          <p style={{ margin: 0 }}>
            Any use of the Service not expressly authorised by these Terms is prohibited and may violate copyright, trademark, and other laws.
          </p>
        </Section>

        {/* ── 16. PRIVACY ── */}
        <Section title="16. Privacy &amp; Data Protection">
          <p style={{ margin: 0 }}>
            Your use of the Service is governed by our <a href="/privacy-policy" style={{ color: "#d4af37" }}>Privacy Policy</a>, which is incorporated into these Terms by reference. By using the Service, you consent to the collection, use, and sharing of your personal information as described in our Privacy Policy. We encourage you to read the Privacy Policy carefully before using the Service.
          </p>
        </Section>

        {/* ── 17. THIRD-PARTY LINKS & SERVICES ── */}
        <Section title="17. Third-Party Links &amp; Services">
          <p style={{ margin: "0 0 12px" }}>
            The Service may contain links to third-party websites, services, or resources. These links are provided for your convenience only. We do not control, endorse, or assume any responsibility for the content, products, services, or practices of any third-party website or service. You acknowledge and agree that {APP_NAME} shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with your use of any third-party site or service.
          </p>
          <p style={{ margin: 0 }}>
            We also use third-party service providers (including Stripe for payments and Supabase for infrastructure). Your use of these services is also subject to those providers' own terms and policies.
          </p>
        </Section>

        {/* ── 18. DISPUTE RESOLUTION & ARBITRATION ── */}
        <Section title="18. Dispute Resolution &amp; Binding Arbitration">
          <p style={{ margin: "0 0 12px" }}>
            <strong style={{ color: "#fff" }}>Informal Resolution First:</strong> Before initiating any formal proceedings, you agree to attempt to resolve any dispute informally by contacting us at <a href={`mailto:${CONTACT}`} style={{ color: "#d4af37" }}>{CONTACT}</a> with a description of your claim. We will attempt to resolve the dispute within 30 days of receiving your notice.
          </p>
          <p style={{ margin: "0 0 12px" }}>
            <strong style={{ color: "#fff" }}>Binding Arbitration:</strong> If a dispute cannot be resolved informally, you agree that any dispute, claim, or controversy arising from or relating to these Terms or your use of the Service shall be resolved by binding individual arbitration rather than in court. You agree to waive your right to a jury trial and to participate in class actions.
          </p>
          <Warning>
            CLASS ACTION WAIVER: YOU AND {APP_NAME.toUpperCase()} AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS OR REPRESENTATIVE ACTION. YOU ARE WAIVING YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.
          </Warning>
          <p style={{ margin: "0 0 12px" }}>
            <strong style={{ color: "#fff" }}>Exceptions:</strong> Nothing in this section prevents either party from seeking emergency injunctive or other equitable relief in a court of competent jurisdiction to prevent actual or threatened infringement, misappropriation, or violation of intellectual property rights or confidential information.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#fff" }}>Small Claims:</strong> Either party may bring an individual claim in a small claims court of competent jurisdiction as an alternative to arbitration, provided the claim qualifies under that court's jurisdictional limits.
          </p>
        </Section>

        {/* ── 19. GOVERNING LAW ── */}
        <Section title="19. Governing Law &amp; Jurisdiction">
          <p style={{ margin: "0 0 12px" }}>
            These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law provisions, unless mandatory consumer protection laws in your jurisdiction require otherwise.
          </p>
          <p style={{ margin: "0 0 12px" }}>
            Subject to the arbitration clause above, any legal proceedings not resolved through arbitration shall be brought exclusively in the courts of England and Wales, and you irrevocably submit to the personal jurisdiction of those courts.
          </p>
          <p style={{ margin: 0 }}>
            If you are a consumer in the EU, EEA, or UK, nothing in these Terms affects your mandatory consumer protection rights under the laws of your country of residence.
          </p>
        </Section>

        {/* ── 20. MODIFICATIONS ── */}
        <Section title="20. Modifications to These Terms">
          <p style={{ margin: 0 }}>
            We reserve the right to modify these Terms at any time. When we make material changes, we will notify you by posting the updated Terms on this page with a revised "Effective" date and, where appropriate, by displaying an in-app notice or sending you an email. Your continued use of the Service after any changes take effect constitutes your acceptance of the revised Terms. If you do not agree with the modified Terms, you must stop using the Service and delete your account.
          </p>
        </Section>

        {/* ── 21. SEVERABILITY ── */}
        <Section title="21. Severability &amp; Waiver">
          <p style={{ margin: "0 0 12px" }}>
            If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, that provision shall be modified to the minimum extent necessary to make it enforceable, or severed if modification is not possible, and the remaining provisions shall continue in full force and effect.
          </p>
          <p style={{ margin: 0 }}>
            Our failure to enforce any right or provision of these Terms shall not be deemed a waiver of that right or provision. A waiver of any breach shall not be construed as a waiver of any subsequent breach.
          </p>
        </Section>

        {/* ── 22. ENTIRE AGREEMENT ── */}
        <Section title="22. Entire Agreement">
          <p style={{ margin: 0 }}>
            These Terms, together with our Privacy Policy and Community Guidelines (each incorporated herein by reference), constitute the entire agreement between you and {APP_NAME} with respect to the Service and supersede all prior or contemporaneous understandings, agreements, representations, and warranties, whether written or oral, relating to the subject matter hereof.
          </p>
        </Section>

        {/* ── 23. CONTACT ── */}
        <Section title="23. Contact Us">
          <p style={{ margin: "0 0 16px" }}>
            For questions, complaints, or legal notices relating to these Terms, please contact us:
          </p>
          <div style={{
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: 16, padding: "20px 22px",
          }}>
            <p style={{ margin: "0 0 6px", fontWeight: 900, fontSize: 15, color: "#fff" }}>{APP_NAME}</p>
            <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
              Email: <a href={`mailto:${CONTACT}`} style={{ color: "#d4af37" }}>{CONTACT}</a>
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
              Website: <a href={FULL_URL} style={{ color: "#d4af37" }}>{APP_URL}</a>
            </p>
          </div>
        </Section>

        {/* Footer */}
        <div style={{ marginTop: 56, paddingTop: 28, borderTop: "1px solid rgba(212,175,55,0.1)", textAlign: "center" }}>
          <img src={LOGO} alt="Mr. Butlas" style={{ width: 32, height: 32, objectFit: "contain", opacity: 0.4, marginBottom: 10 }} />
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: 0 }}>
            © {new Date().getFullYear()} {APP_NAME} · All rights reserved
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", margin: "4px 0 0" }}>
            Effective date: {EFFECTIVE} · <a href={FULL_URL} style={{ color: "rgba(255,255,255,0.15)", textDecoration: "none" }}>{APP_URL}</a>
          </p>
        </div>

      </div>
    </div>
  );
}
