// ── Hotel Check Out Page ──────────────────────────────────────────────────────
// Full-screen checkout experience with two paths:
//   Path A — leaving with a match (receipt + farewell)
//   Path B — leaving without a match (calling card + hibernation)

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import {
  getStayStats, performCheckout, saveCallingCard, getCallingCard,
  formatStayDuration, FLOOR_DISPLAY_NAMES,
  type HotelStayStats,
} from "../utils/checkoutService";

const BUTLER_IMG = "https://ik.imagekit.io/7grri5v7d/sdfasdfasdfasdfasdfsds-removebg-preview.png";

type Path = "choose" | "with_match" | "without_match";
type WithMatchStep = "receipt" | "farewell" | "done";
type WithoutMatchStep = "butler" | "card" | "hibernate" | "done";

// ── Utility ───────────────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{value}</span>
    </div>
  );
}

// ── Path A — with match ───────────────────────────────────────────────────────

function PathWithMatch({ stats, accent, onDone }: { stats: HotelStayStats; accent: ReturnType<typeof useGenderAccent>; onDone: () => void }) {
  const [step, setStep] = useState<WithMatchStep>("receipt");

  const floorNames = stats.floorsVisited
    .map(f => FLOOR_DISPLAY_NAMES[f] ?? f)
    .join(", ") || "Lobby";

  return (
    <AnimatePresence mode="wait">
      {step === "receipt" && (
        <motion.div key="receipt"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          style={{ display: "flex", flexDirection: "column", gap: 0 }}
        >
          {/* Hotel receipt header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 10, color: accent.glow(0.7), fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>2Ghost Hotel</p>
            <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: "#fff" }}>Your Stay Receipt</p>
            <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Receipt card */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "16px 18px", marginBottom: 20 }}>
            <p style={{ margin: "0 0 12px", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Stay Details</p>
            <StatRow label="Checked in" value={new Date(stats.joinedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
            <StatRow label="Duration" value={formatStayDuration(stats.joinedAt)} />
            <StatRow label="Floors visited" value={stats.floorsVisited.length || 1} />
            <StatRow label="Floors" value={floorNames} />
            <StatRow label="Matches made" value={stats.matchCount} />
            <StatRow label="Breakfast invites" value={stats.breakfastInvitesSent} />
            <StatRow label="Breakfasts enjoyed" value={stats.breakfastInvitesAccepted} />
            <StatRow label="Connections rated" value={stats.ratingsGiven} />
            <StatRow label="Social plans arranged" value={stats.socialInvitesSent} />
          </div>

          {/* Vault note */}
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: accent.glow(0.07), border: `1px solid ${accent.glow(0.2)}`, borderRadius: 14, padding: "13px 15px", marginBottom: 24 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🔐</span>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>Your vault is preserved</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                All your matches, messages and memories are kept for <strong style={{ color: accent.accentMid }}>90 days</strong>. Return anytime to revisit.
              </p>
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("farewell")}
            style={{ height: 52, borderRadius: 16, background: accent.gradient, border: "none", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer" }}>
            Continue to farewell →
          </motion.button>
        </motion.div>
      )}

      {step === "farewell" && (
        <motion.div key="farewell"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ marginBottom: 20 }}
          >
            <img src={BUTLER_IMG} alt="Butler" style={{ width: 88, height: 88, borderRadius: 22, objectFit: "cover", border: `2px solid ${accent.glow(0.4)}` }} />
          </motion.div>

          <p style={{ margin: "0 0 6px", fontSize: 11, color: accent.accentMid, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>A farewell from your butler</p>
          <p style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>Found their person 💛</p>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "20px", marginBottom: 24, maxWidth: 360 }}>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.8, fontStyle: "italic" }}>
              "It has been a true honour to serve you during your stay. The 2Ghost Hotel was built for moments like this one — when two souls find each other in the dark. We wish you every joy. Your profile will show <span style={{ color: accent.accentMid, fontWeight: 800, fontStyle: "normal" }}>Found their person 💛</span> for 48 hours — a quiet tribute to what was found here."
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <button onClick={() => setStep("receipt")}
              style={{ flex: 1, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>
              ← Back
            </button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { performCheckout("with_match"); setStep("done"); }}
              style={{ flex: 2, height: 48, borderRadius: 14, background: accent.gradient, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
              Complete check-out ✓
            </motion.button>
          </div>
        </motion.div>
      )}

      {step === "done" && (
        <motion.div key="done"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 20 }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ fontSize: 64, marginBottom: 16 }}
          >
            💛
          </motion.div>
          <p style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 900, color: "#fff" }}>Safe travels</p>
          <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, maxWidth: 300 }}>
            The 2Ghost Hotel doors are always open. Come back anytime — your memories stay with us for 90 days.
          </p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onDone}
            style={{ height: 50, width: "100%", borderRadius: 16, background: accent.gradient, border: "none", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer" }}>
            Back to 2Ghost
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Path B — without match ────────────────────────────────────────────────────

function PathWithoutMatch({ stats, accent, onDone }: { stats: HotelStayStats; accent: ReturnType<typeof useGenderAccent>; onDone: () => void }) {
  const [step, setStep] = useState<WithoutMatchStep>("butler");
  const [cardType, setCardType] = useState<"text" | "voice">("text");
  const [cardText, setCardText] = useState("");
  const [hibernate, setHibernate] = useState(true);
  const charLimit = 180;

  return (
    <AnimatePresence mode="wait">
      {step === "butler" && (
        <motion.div key="butler"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <img src={BUTLER_IMG} alt="Butler" style={{ width: 60, height: 60, borderRadius: 15, objectFit: "cover", border: `2px solid ${accent.glow(0.4)}`, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontSize: 11, color: accent.accentMid, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Butler Advice</p>
              <p style={{ margin: "3px 0 0", fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>Not every stay ends with a match.</p>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 18px", marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, fontStyle: "italic" }}>
              "Not every stay ends with a match — and that is not a failure. The house sees your patience, your presence, and your openness. Sometimes the right person arrives the morning after you leave. That is why we offer you two gifts before you go: a <span style={{ color: accent.accentMid, fontWeight: 800, fontStyle: "normal" }}>Calling Card</span> that stays in the hotel for 30 days, and the option to let your profile sleep quietly — waking only when a genuine match arrives."
            </p>
          </div>

          {/* Stay summary — compact */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 16px", marginBottom: 24 }}>
            <p style={{ margin: "0 0 8px", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Your time here</p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { label: "Duration", val: formatStayDuration(stats.joinedAt) },
                { label: "Floors", val: stats.floorsVisited.length || 1 },
                { label: "Matches", val: stats.matchCount },
                { label: "Breakfasts", val: stats.breakfastInvitesAccepted },
              ].map(({ label, val }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>{val}</p>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep("card")}
            style={{ height: 52, borderRadius: 16, background: accent.gradient, border: "none", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", marginBottom: 10 }}>
            Leave a calling card →
          </motion.button>
          <button onClick={() => { performCheckout("without_match"); setStep("done"); }}
            style={{ height: 44, borderRadius: 14, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.35)", fontSize: 13, cursor: "pointer" }}>
            Skip — check out quietly
          </button>
        </motion.div>
      )}

      {step === "card" && (
        <motion.div key="card"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, color: "#fff" }}>Leave your calling card</p>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
            A short message or note attached to your profile for 30 days. Anyone who discovers your profile can read it.
          </p>

          {/* Type toggle */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(["text", "voice"] as const).map(t => (
              <button key={t} onClick={() => setCardType(t)}
                style={{ flex: 1, height: 42, borderRadius: 12,
                  background: cardType === t ? accent.glow(0.12) : "rgba(255,255,255,0.04)",
                  border: `1px solid ${cardType === t ? accent.glow(0.35) : "rgba(255,255,255,0.08)"}`,
                  color: cardType === t ? "#fff" : "rgba(255,255,255,0.4)",
                  fontSize: 13, fontWeight: cardType === t ? 700 : 500, cursor: "pointer" }}>
                {t === "text" ? "✍️ Written note" : "🎙 Voice note"}
              </button>
            ))}
          </div>

          {/* Example prompts */}
          {cardType === "text" && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Quick examples — tap to use</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  "Stepping back for a little while — WiFi restrictions mean my online status won't always reflect when I'm around, but I'm still here in the background. Leave me a message and I'll get back to you.",
                  "Taking a quiet break from the floors for now. My profile stays active so feel free to reach out — I check in when I can and I'll always reply. Some connections are worth the wait.",
                ].map((example, i) => (
                  <motion.button key={i} whileTap={{ scale: 0.98 }}
                    onClick={() => setCardText(example)}
                    style={{ textAlign: "left", padding: "12px 14px", borderRadius: 12,
                      background: cardText === example ? accent.glow(0.1) : "rgba(255,255,255,0.03)",
                      border: `1px solid ${cardText === example ? accent.glow(0.35) : "rgba(255,255,255,0.08)"}`,
                      color: cardText === example ? "#fff" : "rgba(255,255,255,0.55)",
                      fontSize: 12, lineHeight: 1.6, cursor: "pointer", fontFamily: "inherit" }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: accent.accentMid, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                      Example {i + 1}
                    </span>
                    {example}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {cardType === "text" ? (
            <div style={{ position: "relative", marginBottom: 6 }}>
              <textarea
                value={cardText}
                onChange={e => setCardText(e.target.value.slice(0, charLimit))}
                placeholder="Write something genuine — what you're looking for, a line that captures who you are, or simply a warm goodbye…"
                rows={5}
                style={{
                  width: "100%", boxSizing: "border-box",
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${accent.glow(0.2)}`,
                  borderRadius: 14, padding: "14px 16px",
                  color: "#fff", fontSize: 13, lineHeight: 1.7, resize: "none",
                  outline: "none", fontFamily: "inherit",
                }}
              />
              <span style={{ position: "absolute", bottom: 10, right: 14, fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                {cardText.length}/{charLimit}
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 120, background: "rgba(255,255,255,0.03)", border: `1px dashed ${accent.glow(0.25)}`, borderRadius: 14, marginBottom: 6 }}>
              <span style={{ fontSize: 28, marginBottom: 8 }}>🎙</span>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Voice notes coming soon</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Use a written note for now</p>
            </div>
          )}

          <p style={{ margin: "6px 0 20px", fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
            Active for 30 days · Visible to anyone who finds your profile · You can delete it anytime
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep("butler")}
              style={{ flex: 1, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>
              ← Back
            </button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (cardType === "text" && cardText.trim().length > 0) {
                  saveCallingCard("text", cardText.trim());
                }
                setStep("hibernate");
              }}
              style={{ flex: 2, height: 48, borderRadius: 14, background: (cardType === "text" && cardText.trim().length > 2) ? accent.gradient : "rgba(255,255,255,0.06)", border: "none", color: (cardType === "text" && cardText.trim().length > 2) ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {cardText.trim().length > 2 ? "Save & continue →" : "Skip card →"}
            </motion.button>
          </div>
        </motion.div>
      )}

      {step === "hibernate" && (
        <motion.div key="hibernate"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 900, color: "#fff" }}>Hibernate your profile</p>
          <p style={{ margin: "0 0 20px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
            Go dark — your profile sleeps quietly in the hotel. You won't appear in feeds, but match notifications still reach you.
          </p>

          {/* Toggle card */}
          <motion.div whileTap={{ scale: 0.99 }} onClick={() => setHibernate(v => !v)}
            style={{ display: "flex", gap: 14, alignItems: "center", background: hibernate ? accent.glow(0.08) : "rgba(255,255,255,0.03)", border: `1px solid ${hibernate ? accent.glow(0.3) : "rgba(255,255,255,0.08)"}`, borderRadius: 16, padding: "16px 18px", marginBottom: 16, cursor: "pointer" }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>🌙</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: hibernate ? "#fff" : "rgba(255,255,255,0.5)" }}>Hibernate mode</p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>Profile sleeps · Match alerts active · Room held for 30 days</p>
            </div>
            <div style={{ width: 44, height: 26, borderRadius: 13, background: hibernate ? accent.accentMid : "rgba(255,255,255,0.1)", transition: "background 0.2s", flexShrink: 0, position: "relative" }}>
              <motion.div animate={{ x: hibernate ? 18 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff" }} />
            </div>
          </motion.div>

          <div style={{ display: "flex", gap: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "12px 14px", marginBottom: 24 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>📬</span>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
              We'll send you a gentle reminder after <strong style={{ color: "#fff" }}>30 days</strong> with your room held and any new admirers who discovered your calling card.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep("card")}
              style={{ flex: 1, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>
              ← Back
            </button>
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={() => { performCheckout("without_match"); setStep("done"); }}
              style={{ flex: 2, height: 48, borderRadius: 14, background: accent.gradient, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
              Complete check-out
            </motion.button>
          </div>
        </motion.div>
      )}

      {step === "done" && (
        <motion.div key="done"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", paddingTop: 20 }}
        >
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ fontSize: 60, marginBottom: 16 }}
          >
            🌙
          </motion.div>
          <p style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 900, color: "#fff" }}>Goodnight, Ghost.</p>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 300 }}>
            Your profile is sleeping. Your calling card is on the concierge desk. Your room is held.
          </p>
          <p style={{ margin: "0 0 28px", fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.6, maxWidth: 280 }}>
            We'll wake you when someone worth waking up for arrives.
          </p>
          {getCallingCard() && (
            <div style={{ background: accent.glow(0.07), border: `1px solid ${accent.glow(0.2)}`, borderRadius: 14, padding: "12px 16px", marginBottom: 20, width: "100%", textAlign: "left" }}>
              <p style={{ margin: "0 0 6px", fontSize: 10, color: accent.accentMid, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Your calling card</p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, fontStyle: "italic" }}>"{getCallingCard()!.content}"</p>
            </div>
          )}
          <motion.button whileTap={{ scale: 0.97 }} onClick={onDone}
            style={{ height: 50, width: "100%", borderRadius: 16, background: accent.gradient, border: "none", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer" }}>
            Back to 2Ghost
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function HotelCheckoutPage() {
  const navigate = useNavigate();
  const a = useGenderAccent();
  const [path, setPath] = useState<Path>("choose");
  const [stats, setStats] = useState<HotelStayStats | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStats(getStayStats());
  }, []);

  // Scroll to top when path changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [path]);

  if (!stats) return null;

  return (
    <div style={{ minHeight: "100dvh", background: "#06060e", backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/sdfasdfdddsaasdf.png)", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", color: "#fff", display: "flex", flexDirection: "column" }}>

      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>2Ghost Hotel</p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff" }}>Check Out</p>
        </div>
        <button onClick={() => navigate("/ghost")}
          style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          ✕
        </button>
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px" }}>
        <AnimatePresence mode="wait">

          {/* Path chooser */}
          {path === "choose" && (
            <motion.div key="choose"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              style={{ display: "flex", flexDirection: "column" }}
            >
              {/* Butler intro */}
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
                <img src={BUTLER_IMG} alt="Butler" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", border: `2px solid ${a.glow(0.35)}`, flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: a.accentMid, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Your butler</p>
                  <p style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>Checking out of the 2Ghost Hotel?</p>
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                    "Before you go, I'd like to know — are you leaving because you found someone, or are you stepping away for now?"
                  </p>
                </div>
              </div>

              {/* Two path cards */}
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => setPath("with_match")}
                style={{ width: "100%", textAlign: "left", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 18px", marginBottom: 12, cursor: "pointer" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                    💛
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff" }}>I found someone</p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Get your stay receipt, farewell card, and vault preserved for 90 days</p>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 18 }}>›</span>
                </div>
              </motion.button>

              <motion.button whileTap={{ scale: 0.98 }} onClick={() => setPath("without_match")}
                style={{ width: "100%", textAlign: "left", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "18px 18px", marginBottom: 28, cursor: "pointer" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                    🌙
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff" }}>Stepping away for now</p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Leave a calling card, hibernate your profile, room held for 30 days</p>
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 18 }}>›</span>
                </div>
              </motion.button>

              {/* Free deletion note */}
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 14px" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>🗑️</span>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
                  Complete data deletion is always <strong style={{ color: "rgba(255,255,255,0.55)" }}>free</strong>. Go to Dashboard → Account → Delete everything.
                </p>
              </div>
            </motion.div>
          )}

          {/* Path A */}
          {path === "with_match" && (
            <motion.div key="with_match"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            >
              <PathWithMatch stats={stats} accent={a} onDone={() => navigate("/ghost/mode")} />
            </motion.div>
          )}

          {/* Path B */}
          {path === "without_match" && (
            <motion.div key="without_match"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            >
              <PathWithoutMatch stats={stats} accent={a} onDone={() => navigate("/ghost/mode")} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
