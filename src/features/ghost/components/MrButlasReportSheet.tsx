// MrButlasReportSheet — coin-gated guest dossier compiled by Mr. Butlas
// Cost: 20 coins (≈ $2 USD). Once purchased the report is stored locally so
// the user never pays twice for the same profile.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCoins } from "../hooks/useCoins";
import GhostCoinShop from "./GhostCoinShop";
import type { GhostProfile } from "../types/ghostTypes";

const REPORT_COST = 20;
const PAID_KEY    = "ghost_butlas_reports_paid"; // localStorage: string[] of profile IDs

function getPaidIds(): string[] {
  try { return JSON.parse(localStorage.getItem(PAID_KEY) || "[]"); } catch { return []; }
}
function markPaid(id: string) {
  const ids = getPaidIds();
  if (!ids.includes(id)) {
    try { localStorage.setItem(PAID_KEY, JSON.stringify([...ids, id])); } catch {}
  }
}

// ── Deterministic seeded stats ────────────────────────────────────────────────
function seed(id: string, salt: string): number {
  let h = 0;
  const s = id + salt;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function stat(id: string, salt: string, min: number, max: number): number {
  return min + (seed(id, salt) % (max - min + 1));
}

function buildReport(profile: GhostProfile) {
  const daysAsMember   = stat(profile.id, "join",    14, 520);
  const joinDate       = new Date(Date.now() - daysAsMember * 86400000);
  const joinedStr      = joinDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const weeklyOnlinePct = stat(profile.id, "online",  12, 94);
  const loungeVisits   = stat(profile.id, "lounge",   2,  110);
  const roomsEntered   = stat(profile.id, "rooms",    0,  48);
  const tonightCount   = stat(profile.id, "tonight",  0,  22);
  const invitesSent    = stat(profile.id, "inv_sent", 2,  35);
  const invitesAccepted = stat(profile.id, "inv_acc", 0,  invitesSent);
  const acceptPct      = Math.round((invitesAccepted / invitesSent) * 100);
  const refusals       = stat(profile.id, "refuse",   0,  18);
  const flagCount      = seed(profile.id, "flags") % 10 < 2 ? 1 : 0;   // 20% chance
  const escortedOut    = seed(profile.id, "escort") % 12 < 1 ? 1 : 0;  // ~8% chance
  const leftBefore     = seed(profile.id, "left") % 8 < 1 ? "Yes" : "No";

  const riskScore = flagCount + escortedOut + (refusals > 12 ? 1 : 0);
  const verdicts = [
    { text: "A regular and well-regarded guest. No concerns on file.", color: "#4ade80",  icon: "✦" },
    { text: "A reliable member with a clean record and good standing.", color: "#4ade80",  icon: "✦" },
    { text: "An active guest. Conduct has been satisfactory overall.",  color: "#d4af37",  icon: "◈" },
    { text: "This guest has drawn minor attention from hotel staff.",   color: "#f97316",  icon: "⚠" },
  ];
  const verdict = verdicts[Math.min(riskScore, verdicts.length - 1)];

  return {
    joinedStr, weeklyOnlinePct, loungeVisits, roomsEntered, tonightCount,
    invitesSent, invitesAccepted, acceptPct, refusals,
    flagCount, escortedOut, leftBefore, verdict,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  show: boolean;
  profile: GhostProfile | null;
  onClose: () => void;
};

export default function MrButlasReportSheet({ show, profile, onClose }: Props) {
  const { balance, addCoins, deductCoins } = useCoins();
  const [paying,       setPaying]       = useState(false);
  const [paid,         setPaid]         = useState<string | null>(null);
  const [showCoinShop, setShowCoinShop] = useState(false);

  if (!profile) return null;

  const alreadyPaid  = getPaidIds().includes(profile.id) || paid === profile.id;
  const canAfford    = balance >= REPORT_COST;
  const report       = alreadyPaid ? buildReport(profile) : null;

  function handlePay() {
    if (paying || alreadyPaid || !canAfford) return;
    setPaying(true);
    setTimeout(() => {
      const ok = deductCoins(REPORT_COST, `Mr. Butlas Report — ${profile!.name}`);
      if (ok) { markPaid(profile!.id); setPaid(profile!.id); }
      setPaying(false);
    }, 800);
  }

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            key="butlas-report-sheet"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            style={{
              position: "fixed", inset: 0, zIndex: 9993,
              background: "rgba(10,2,2,1)",
              overflowY: "scroll",
              WebkitOverflowScrolling: "touch" as never,
              height: "100dvh",
            }}
          >
            {/* Top accent bar */}
            <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #e01010, transparent)" }} />

            <div style={{ padding: "22px 20px 52px" }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "rgba(220,20,20,0.75)", letterSpacing: "0.14em", textTransform: "uppercase" }}>Mr. Butlas</p>
                  <p style={{ margin: "3px 0 0", fontSize: 20, fontWeight: 900, color: "#fff" }}>Hotel Guest Report</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {!alreadyPaid && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 20, padding: "5px 11px" }}>
                      <span style={{ fontSize: 13 }}>🪙</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: "#d4af37" }}>{balance}</span>
                    </div>
                  )}
                  <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 700 }}>
                    ✕
                  </motion.button>
                </div>
              </div>

              {/* Subject card */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(220,20,20,0.07)", border: "1px solid rgba(220,20,20,0.3)", borderRadius: 14, padding: "12px 14px", marginBottom: 22 }}>
                <img src={profile.image} alt={profile.name}
                  style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(220,20,20,0.5)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff" }}>{profile.name}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.38)" }}>{profile.age} · {profile.city} {profile.countryFlag}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "rgba(220,20,20,0.55)", letterSpacing: "0.1em" }}>GUEST FILE</p>
                </div>
              </div>

              {/* ── PAYWALL ── */}
              {!alreadyPaid && (
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

                  {/* Top row — text left, image right */}
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 22 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 10px" }}>
                        Hotel Guest Background
                      </p>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.7, margin: 0 }}>
                        Mr. Butlas will compile a full dossier on this guest — activity record, acceptance history, flag submissions, time in the hotel, and a personal assessment.
                      </p>
                    </div>
                    <img
                      src="https://ik.imagekit.io/7grri5v7d/Skeletal%20butler%20at%20workdesk.png"
                      alt="Mr. Butlas"
                      style={{ width: 100, flexShrink: 0, objectFit: "contain", opacity: 0.92 }}
                    />
                  </div>

                  {/* Cost — full width */}
                  <div style={{ background: "rgba(220,20,20,0.1)", border: "1px solid rgba(220,20,20,0.35)", borderRadius: 14, padding: "16px", marginBottom: 20, textAlign: "center" }}>
                    <p style={{ margin: "0 0 5px", fontSize: 26, fontWeight: 900, color: "#d4af37" }}>🪙 {REPORT_COST} coins</p>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>≈ $2.00 USD · one-time · never charged again for this guest</p>
                  </div>

                  {/* CTA — full width */}
                  {canAfford ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handlePay}
                      disabled={paying}
                      style={{
                        width: "100%", height: 54, borderRadius: 16, border: "none",
                        background: paying ? "rgba(220,20,20,0.3)" : "linear-gradient(135deg, #b80000, #e01010)",
                        color: "#fff", fontSize: 14, fontWeight: 900,
                        cursor: paying ? "not-allowed" : "pointer",
                        letterSpacing: "0.03em",
                        boxShadow: paying ? "none" : "0 4px 20px rgba(220,20,20,0.4)",
                      }}
                    >
                      {paying ? "Consulting Mr. Butlas…" : `Request Report — 🪙 ${REPORT_COST}`}
                    </motion.button>
                  ) : (
                    <>
                      <div style={{ background: "rgba(220,20,20,0.1)", border: "1px solid rgba(220,20,20,0.35)", borderRadius: 12, padding: "12px 14px", marginBottom: 14, textAlign: "center" }}>
                        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: "#f87171" }}>
                          🪙 {REPORT_COST - balance} more coins needed
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                          You currently have {balance} coins
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowCoinShop(true)}
                        style={{
                          width: "100%", height: 54, borderRadius: 16, border: "none",
                          background: "linear-gradient(135deg, #b80000, #e01010)",
                          color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer",
                          letterSpacing: "0.03em",
                          boxShadow: "0 4px 20px rgba(220,20,20,0.4)",
                        }}
                      >
                        🪙 Buy Coins
                      </motion.button>
                    </>
                  )}
                </div>
              )}

              {/* ── DOSSIER ── */}
              {alreadyPaid && report && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

                  {/* Hotel Activity */}
                  <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.22)", margin: "0 0 10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Hotel Activity
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
                    {[
                      { icon: "📅", label: "Member Since",    value: report.joinedStr },
                      { icon: "📡", label: "Weekly Online",   value: `${report.weeklyOnlinePct}%` },
                      { icon: "☕", label: "Lounge Visits",   value: report.loungeVisits },
                      { icon: "🚪", label: "Rooms Entered",   value: report.roomsEntered },
                      { icon: "🌙", label: "Tonight Active",  value: `${report.tonightCount}×` },
                      { icon: "✉️", label: "Invites Sent",    value: report.invitesSent },
                    ].map(s => (
                      <div key={s.label} style={{ background: "rgba(220,20,20,0.06)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 12, padding: "11px 13px" }}>
                        <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 12, textTransform: "none", letterSpacing: 0 }}>{s.icon}</span>
                          <span style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
                        </p>
                        <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#fff" }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Conduct */}
                  <p style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.22)", margin: "0 0 10px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    Conduct Record
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                    {[
                      {
                        icon: "✓", label: "Acceptance Rate",
                        value: `${report.acceptPct}%`,
                        color: report.acceptPct >= 60 ? "#4ade80" : report.acceptPct >= 35 ? "#d4af37" : "#f87171",
                      },
                      {
                        icon: "✕", label: "Refusals Given",
                        value: report.refusals,
                        color: report.refusals <= 5 ? "#4ade80" : report.refusals <= 12 ? "#d4af37" : "#f87171",
                      },
                      {
                        icon: "🚩", label: "Flags on File",
                        value: report.flagCount === 0 ? "None" : report.flagCount,
                        color: report.flagCount === 0 ? "#4ade80" : "#f87171",
                      },
                      {
                        icon: "🚗", label: "Left Hotel Before",
                        value: report.leftBefore,
                        color: report.leftBefore === "No" ? "#4ade80" : "#f97316",
                      },
                    ].map(s => (
                      <div key={s.label} style={{ background: "rgba(220,20,20,0.06)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 12, padding: "11px 13px" }}>
                        <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 12, textTransform: "none", letterSpacing: 0 }}>{s.icon}</span>
                          <span style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
                        </p>
                        <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mr. Butlas verdict */}
                  <div style={{ background: "rgba(220,20,20,0.08)", border: "1px solid rgba(220,20,20,0.3)", borderRadius: 16, padding: "16px 18px" }}>
                    <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: "rgba(220,20,20,0.7)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      Mr. Butlas's Assessment
                    </p>
                    <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.7 }}>
                      <span style={{ color: report.verdict.color, marginRight: 8, fontSize: 15 }}>{report.verdict.icon}</span>
                      {report.verdict.text}
                    </p>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.75)", letterSpacing: "0.14em", textAlign: "right" }}>
                      — MR. BUTLAS
                    </p>
                  </div>

                </motion.div>
              )}

            </div>
          </motion.div>

          {/* Coin shop — slides over the report page, returns here on close */}
          <AnimatePresence>
            {showCoinShop && (
              <GhostCoinShop
                coinBalance={balance}
                onClose={() => setShowCoinShop(false)}
                onAddCoins={(amount) => { addCoins(amount, "Coin purchase", "purchase"); setShowCoinShop(false); }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
