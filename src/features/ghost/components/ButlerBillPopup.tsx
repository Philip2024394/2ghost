// ── Butler Bill Popup ─────────────────────────────────────────────────────────
// Shown to the no-show guest. The butler bills them the full two-cover cost.
// If insufficient coins → red debt recorded.

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BREAKFAST_BILL, billCurrentUser, getDebt } from "../utils/reputationService";
import { FLOOR_META } from "../utils/breakfastGiftService";

const BUTLER_IMG = "https://ik.imagekit.io/7grri5v7d/ewrwerwerwer-removebg-preview.png";
const BACK_IMG   = "https://ik.imagekit.io/7grri5v7d/sdfasdfdddsaasdf.png?updatedAt=1774270395199";

type Props = {
  floor:       string;
  hostName:    string;
  onDismiss:   () => void;
};

export default function ButlerBillPopup({ floor, hostName, onDismiss }: Props) {
  const meta   = FLOOR_META[floor] ?? FLOOR_META.standard;
  const amount = BREAKFAST_BILL[floor] ?? 20;
  const [debt, setDebt] = useState(0);
  const [billed, setBilled] = useState(false);

  useEffect(() => {
    if (billed) return;
    billCurrentUser(floor);
    setDebt(getDebt());
    setBilled(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const r = parseInt(meta.color.slice(1,3),16);
  const g = parseInt(meta.color.slice(3,5),16);
  const b = parseInt(meta.color.slice(5,7),16);
  const glow = (o: number) => `rgba(${r},${g},${b},${o})`;

  const now = new Date();
  const invoiceDate = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const invoiceTime = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9900, background: "rgba(0,0,0,0.93)",
        backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        style={{ width: "100%", maxWidth: 480,
          borderRadius: "26px 26px 0 0",
          border: "1px solid rgba(239,68,68,0.35)", borderBottom: "none",
          paddingBottom: "max(32px,env(safe-area-inset-bottom,32px))",
          position: "relative", overflow: "hidden" }}
      >
        {/* Background */}
        <img src={BACK_IMG} alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.1, zIndex: 0 }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(8,4,4,0.95)", zIndex: 0 }} />

        {/* Red top stripe */}
        <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #ef4444, #b91c1c, #ef4444, transparent)", position: "relative", zIndex: 1 }} />

        <div style={{ padding: "20px 20px 0", position: "relative", zIndex: 1 }}>

          {/* Butler header — stern */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <motion.img src={BUTLER_IMG} alt="Butler"
              animate={{ rotate: [-3, 3, -2, 0] }} transition={{ duration: 0.5, delay: 0.3 }}
              style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover",
                border: "2px solid rgba(239,68,68,0.5)" }} />
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#f87171",
                textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Butler · Invoice Notice
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 16, fontWeight: 900, color: "#fff" }}>
                You have been billed
              </p>
            </div>
          </div>

          {/* Hotel invoice */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 18, marginBottom: 16, overflow: "hidden" }}>

            {/* Invoice header */}
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "rgba(212,175,55,0.7)",
                    letterSpacing: "0.15em", textTransform: "uppercase" }}>2Ghost Hotel</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                    {meta.icon} {meta.label}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                    {invoiceDate} · {invoiceTime}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 9, fontWeight: 700,
                    color: "rgba(239,68,68,0.7)", letterSpacing: "0.06em" }}>NO-SHOW PENALTY</p>
                </div>
              </div>
            </div>

            {/* Line items */}
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                  Reserved table for two · {meta.label}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
                  {amount / 2}🪙
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                  Cover charge · {hostName}'s seat
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
                  {amount / 2}🪙
                </span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "10px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>Total Charged</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#f87171" }}>
                  {amount}🪙
                </span>
              </div>
            </div>
          </div>

          {/* Red debt notice */}
          {debt > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.35)",
                borderRadius: 14, marginBottom: 14 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🔴</span>
              <div>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 900, color: "#f87171" }}>
                  Red Balance: −{debt}🪙
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(248,113,113,0.7)", lineHeight: 1.6 }}>
                  Your coin balance was insufficient to cover this bill. You are now in debt.
                  Your invitation privileges are suspended until this is cleared.
                </p>
              </div>
            </motion.div>
          )}

          {/* Butler's stern message */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            style={{ padding: "14px 16px", background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, marginBottom: 20 }}>
            <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "rgba(239,68,68,0.7)",
              textTransform: "uppercase", letterSpacing: "0.07em" }}>🎩 Your Butler</p>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)",
              lineHeight: 1.85, fontStyle: "italic" }}>
              "You accepted an invitation, made a commitment to another guest, and failed to appear.
              The table was reserved, the covers were set, and {hostName} waited.
              I have charged your account the full cost of both covers as is hotel policy.
              <br /><br />
              Let this be a warning — and we shall not be discussing this again."
            </p>
            <p style={{ margin: "12px 0 0", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
              — Your butler
            </p>
          </motion.div>

          {/* Dismiss */}
          <button onClick={onDismiss}
            style={{ width: "100%", height: 50, borderRadius: 16, cursor: "pointer",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 700 }}>
            I understand
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
