// PenthouseApplyPage — Monthly subscription checkout for the Penthouse tier
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { isPenthouseSubscribed } from "../utils/penthouseHelpers";
import { buildStripeLink } from "../data/stripePlans";

const PENTHOUSE_IMG = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsd.png";

const PERKS = [
  { icon: "👑", label: "Penthouse Floor Access", sub: "Exclusive upper tier · verified crowd" },
  { icon: "🎁", label: "Daily Gift Allowance", sub: "Send gifts · earn coins when received" },
  { icon: "💬", label: "Penthouse Private Vault", sub: "Private chat with floor members" },
  { icon: "🌍", label: "Multi-City Visibility", sub: "Add up to 3 extra cities to your profile" },
  { icon: "⚡", label: "Priority Stack Position", sub: "Appear first in every browse feed" },
  { icon: "🃏", label: "Joker Cashback Doubled", sub: "16% cashback instead of 8% on activity" },
];

function simulatePenthouseSubscription() {
  // Simulate 30-day subscription (replace with Stripe in production)
  const until = Date.now() + 30 * 24 * 60 * 60 * 1000;
  try { localStorage.setItem("penthouse_sub_until", String(until)); } catch {}
}

export default function PenthouseApplyPage() {
  const navigate  = useNavigate();
  const subscribed = isPenthouseSubscribed();
  const [confirmed, setConfirmed] = useState(false);

  const ghostId = (() => {
    try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}").ghost_id || ""; } catch { return ""; }
  })();

  function handleSubscribe() {
    const link = buildStripeLink("penthouse" as any, ghostId);
    if (link) {
      window.location.href = link;
    } else {
      // Stripe not configured — simulate for now
      simulatePenthouseSubscription();
      setConfirmed(true);
      setTimeout(() => navigate("/penthouse"), 2000);
    }
  }

  if (subscribed || confirmed) {
    return (
      <div style={{
        minHeight: "100dvh", background: "#060402", color: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "0 28px", textAlign: "center",
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
        >
          <div style={{ fontSize: 56, marginBottom: 20 }}>👑</div>
          <p style={{
            fontSize: 24, fontWeight: 900, margin: "0 0 10px",
            background: "linear-gradient(135deg, #c9a227, #f0d060)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Welcome to the Penthouse</p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 32px", lineHeight: 1.65, maxWidth: 300 }}>
            The top floor is now yours. Your badge is active and the floor is open.
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/penthouse")}
            style={{
              width: "100%", maxWidth: 280, height: 52, borderRadius: 16, border: "none",
              background: "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
              color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer",
              boxShadow: "0 4px 28px rgba(212,175,55,0.4)",
            }}
          >
            Enter the Penthouse →
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100dvh", background: "#060402", color: "#fff",
      fontFamily: "inherit",
      paddingBottom: "max(32px, env(safe-area-inset-bottom, 32px))",
    }}>
      {/* Hero image */}
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        <img src={PENTHOUSE_IMG} alt="Penthouse" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(6,4,2,0.3) 0%, rgba(6,4,2,0.98) 100%)" }} />
        <button
          onClick={() => navigate(-1)}
          style={{ position: "absolute", top: "calc(env(safe-area-inset-top,16px) + 10px)", left: 16, width: 34, height: 34, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.7)", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
        >←</button>
        <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.8)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            👑 Top Floor
          </p>
          <p style={{
            margin: 0, fontSize: 28, fontWeight: 900,
            background: "linear-gradient(135deg, #c9a227, #f0d060)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>The Penthouse</p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>

        {/* Price card */}
        <div style={{
          background: "rgba(212,175,55,0.07)",
          border: "1px solid rgba(212,175,55,0.3)",
          borderRadius: 20, padding: "20px 20px 16px",
          marginTop: 20, marginBottom: 20, textAlign: "center",
        }}>
          <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 800, color: "rgba(212,175,55,0.6)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Monthly membership</p>
          <p style={{ margin: "0 0 4px", fontSize: 42, fontWeight: 900, color: "#f0d060", lineHeight: 1 }}>$19.99</p>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>per month · cancel anytime</p>
          <div style={{ width: 40, height: 1, background: "rgba(212,175,55,0.2)", margin: "0 auto 12px" }} />
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            The most exclusive floor in the hotel. Limited members. Gold badge on every profile.
          </p>
        </div>

        {/* Perks */}
        <div style={{ marginBottom: 24 }}>
          {PERKS.map((p) => (
            <div key={p.label} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "12px 0",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
              }}>{p.icon}</div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{p.label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{p.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <AnimatePresence>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubscribe}
            style={{
              width: "100%", height: 58, borderRadius: 18, border: "none",
              background: "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
              color: "#000", fontSize: 16, fontWeight: 900, cursor: "pointer",
              boxShadow: "0 6px 32px rgba(212,175,55,0.4)",
              letterSpacing: "0.03em", marginBottom: 14,
            }}
          >
            Join the Penthouse — $19.99/mo
          </motion.button>
        </AnimatePresence>

        <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.2)", lineHeight: 1.6, marginBottom: 8 }}>
          Billed monthly. Cancel any time from your account settings. Access continues until the end of your billing period.
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{ display: "block", margin: "0 auto", background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
