import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  getAffiliate, getAffiliateStats, loadBanners,
  loadConversions, Conversion,
} from "../affiliateStorage";

const BG   = "https://ik.imagekit.io/7grri5v7d/ghost%20roomssadasdasdfasdfasdf.png";
const LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

const S = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "16px 16px",
    marginBottom: 12,
  } as React.CSSProperties,
  input: {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "10px 13px", color: "#fff",
    fontSize: 13, outline: "none", boxSizing: "border-box" as const,
  },
  label: {
    fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)",
    letterSpacing: 1, margin: "0 0 5px", display: "block",
  } as React.CSSProperties,
};

function fmt(n: number) {
  return n.toLocaleString("id-ID");
}

export default function AffiliateDashboard() {
  const [params]        = useSearchParams();
  const [code, setCode] = useState(params.get("code")?.toUpperCase() || "");
  const [input, setInput] = useState(code);
  const [tab, setTab]   = useState<"stats" | "share" | "banners" | "history">("stats");
  const [copied, setCopied] = useState(false);
  const [error, setError]   = useState("");

  const affiliate = code ? getAffiliate(code) : null;
  const stats     = code ? getAffiliateStats(code) : null;
  const banners   = loadBanners();
  const history: Conversion[] = code
    ? loadConversions().filter((c) => c.affiliateId === code).slice().reverse()
    : [];

  const shareLink = code ? `${window.location.origin}/ghost?ref=${code}` : "";

  useEffect(() => {
    if (params.get("code")) setCode(params.get("code")!.toUpperCase());
  }, [params]);

  const login = () => {
    const c = input.trim().toUpperCase();
    if (!c) { setError("Enter your affiliate code"); return; }
    const a = getAffiliate(c);
    if (!a) { setError("Code not found — check your code or apply to join"); return; }
    setCode(c);
    setError("");
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const statusColor = (s: string) =>
    s === "active" ? "#4ade80" : s === "pending" ? "#fbbf24" : "#f87171";

  if (!affiliate) {
    return (
      <div style={{
        minHeight: "100dvh", width: "100%",
        backgroundImage: `url(${BG})`, backgroundSize: "cover", backgroundPosition: "center",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "24px 16px", fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,5,8,0.88)", zIndex: 0 }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "relative", zIndex: 1, width: "100%", maxWidth: 380,
            background: "rgba(4,6,4,0.97)", border: "1px solid rgba(74,222,128,0.2)",
            borderRadius: 24, padding: "28px 22px",
            backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ height: 3, background: "linear-gradient(90deg,#16a34a,#4ade80,#22c55e)", borderRadius: "4px 4px 0 0", marginLeft: -22, marginRight: -22, marginTop: -28, marginBottom: 22 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <img src={LOGO} alt="2Ghost" style={{ width: 40, height: 40, objectFit: "contain" }} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>Affiliate Dashboard</p>
              <p style={{ fontSize: 10, color: "rgba(74,222,128,0.7)", margin: 0 }}>Enter your code to continue</p>
            </div>
          </div>
          <input
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(""); }}
            placeholder="Your affiliate code (e.g. BUDI123)"
            style={S.input}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          {error && <p style={{ fontSize: 11, color: "#f87171", margin: "6px 0 0" }}>{error}</p>}
          <button
            onClick={login}
            style={{
              width: "100%", marginTop: 12,
              background: "linear-gradient(135deg,#16a34a,#4ade80)",
              border: "none", borderRadius: 12, padding: "12px 0",
              fontSize: 13, fontWeight: 900, color: "#000", cursor: "pointer",
            }}
          >
            View Dashboard →
          </button>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center", margin: "12px 0 0" }}>
            Not an affiliate yet?{" "}
            <a href="/affiliate/join" style={{ color: "#4ade80", textDecoration: "none" }}>Apply here →</a>
          </p>
        </motion.div>
      </div>
    );
  }

  const TABS = [
    { key: "stats",   label: "📊 Stats" },
    { key: "share",   label: "🔗 Share" },
    { key: "banners", label: "🖼️ Banners" },
    { key: "history", label: "💰 History" },
  ] as const;

  return (
    <div style={{
      minHeight: "100dvh", width: "100%",
      backgroundImage: `url(${BG})`, backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "0 0 max(32px, env(safe-area-inset-bottom, 32px))",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(4,5,8,0.88)", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 480 }}>
        {/* Header */}
        <div style={{
          background: "rgba(4,6,4,0.97)", borderBottom: "1px solid rgba(74,222,128,0.15)",
          padding: "max(16px, env(safe-area-inset-top, 16px)) 18px 14px",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ height: 3, background: "linear-gradient(90deg,#16a34a,#4ade80)", borderRadius: 2, marginLeft: -18, marginRight: -18, marginTop: -14, marginBottom: 14 }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={LOGO} alt="2Ghost" style={{ width: 34, height: 34, objectFit: "contain" }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: 0 }}>{affiliate.name}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  Code: <span style={{ color: "#4ade80", fontWeight: 700 }}>{code}</span>
                </p>
              </div>
            </div>
            <div style={{
              background: `${statusColor(affiliate.status)}22`,
              border: `1px solid ${statusColor(affiliate.status)}55`,
              borderRadius: 8, padding: "3px 10px",
              fontSize: 10, fontWeight: 800, color: statusColor(affiliate.status),
              textTransform: "uppercase",
            }}>
              {affiliate.status}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 6, marginTop: 12, overflowX: "auto" }}>
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key as typeof tab)}
                style={{
                  flexShrink: 0, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                  padding: "0 12px", fontSize: 11, fontWeight: 700,
                  background: tab === key ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
                  color: tab === key ? "#4ade80" : "rgba(255,255,255,0.45)",
                  outline: tab === key ? "1px solid rgba(74,222,128,0.3)" : "none",
                }}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "16px 16px 0" }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

              {/* ── STATS ── */}
              {tab === "stats" && stats && (
                <div>
                  {/* Earnings highlight */}
                  <div style={{
                    background: "linear-gradient(135deg, rgba(74,222,128,0.1), rgba(22,163,74,0.06))",
                    border: "1px solid rgba(74,222,128,0.2)",
                    borderRadius: 16, padding: "20px 18px", marginBottom: 12,
                  }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 4px", fontWeight: 700, letterSpacing: 1 }}>TOTAL EARNED</p>
                    <p style={{ fontSize: 32, fontWeight: 900, color: "#4ade80", margin: "0 0 4px" }}>
                      {fmt(stats.earned)} <span style={{ fontSize: 14, color: "rgba(74,222,128,0.6)" }}>IDR</span>
                    </p>
                    <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                      <div>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 2px" }}>Paid Out</p>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>{fmt(stats.paid)} IDR</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 2px" }}>Pending Payout</p>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24", margin: 0 }}>{fmt(stats.owed)} IDR</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "Link Clicks",  value: stats.clicks,      icon: "👆" },
                      { label: "Signups",       value: stats.signups,     icon: "👤" },
                      { label: "Paid Converts", value: stats.conversions, icon: "💳" },
                      { label: "Commission %",  value: `${affiliate.commissionRate}%`, icon: "📈" },
                    ].map(({ label, value, icon }) => (
                      <div key={label} style={{ ...S.card, marginBottom: 0 }}>
                        <span style={{ fontSize: 22 }}>{icon}</span>
                        <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "6px 0 2px" }}>{value}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {affiliate.status === "pending" && (
                    <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "12px 14px" }}>
                      <p style={{ fontSize: 12, color: "#fbbf24", margin: 0, fontWeight: 600 }}>
                        ⏳ Your application is pending review. You'll be notified on WhatsApp within 24 hours.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── SHARE ── */}
              {tab === "share" && (
                <div>
                  <div style={S.card}>
                    <p style={S.label}>YOUR REFERRAL LINK</p>
                    <p style={{ fontSize: 12, color: "rgba(74,222,128,0.8)", wordBreak: "break-all", margin: "0 0 10px", lineHeight: 1.5 }}>{shareLink}</p>
                    <button
                      onClick={() => copy(shareLink)}
                      style={{
                        width: "100%", background: copied ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${copied ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: 10, padding: "10px 0",
                        fontSize: 13, fontWeight: 800, color: copied ? "#4ade80" : "#fff", cursor: "pointer",
                      }}
                    >{copied ? "✓ Copied to clipboard!" : "📋 Copy Link"}</button>
                  </div>

                  <div style={S.card}>
                    <p style={S.label}>QR CODE</p>
                    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareLink)}&bgcolor=040604&color=4ade80&margin=10`}
                        alt="QR Code"
                        style={{ width: 180, height: 180, borderRadius: 12 }}
                      />
                    </div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textAlign: "center", margin: "8px 0 0" }}>
                      Screenshot and share — scan takes them straight to 2Ghost
                    </p>
                  </div>

                  <div style={S.card}>
                    <p style={S.label}>READY-MADE CAPTION</p>
                    <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.7 }}>
                        🏨 Guys, check out 2Ghost Hotel — the wildest dating app I've found in Jogja.<br />
                        Ghost anonymity, hotel rooms for your moments, and real connections.<br />
                        Try it free 👇<br />
                        <span style={{ color: "#4ade80" }}>{shareLink}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => copy(`🏨 Guys, check out 2Ghost Hotel — the wildest dating app I've found in Jogja.\nGhost anonymity, hotel rooms for your moments, and real connections.\nTry it free 👇\n${shareLink}`)}
                      style={{
                        width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10, padding: "9px 0",
                        fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", cursor: "pointer",
                      }}
                    >Copy Caption</button>
                  </div>
                </div>
              )}

              {/* ── BANNERS ── */}
              {tab === "banners" && (
                <div>
                  {banners.length === 0 ? (
                    <div style={{ ...S.card, textAlign: "center", padding: "32px 16px" }}>
                      <p style={{ fontSize: 32, margin: "0 0 8px" }}>🖼️</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: 0 }}>No banners uploaded yet</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "6px 0 0" }}>Banners appear here when the admin uploads them</p>
                    </div>
                  ) : (
                    banners.map((b) => (
                      <div key={b.id} style={S.card}>
                        <img src={b.imageUrl} alt={b.name} style={{ width: "100%", borderRadius: 10, marginBottom: 10, objectFit: "cover", maxHeight: 220 }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{b.name}</p>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>{b.size}</p>
                          </div>
                          <a
                            href={b.imageUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)",
                              borderRadius: 8, padding: "6px 14px",
                              fontSize: 11, fontWeight: 700, color: "#4ade80", textDecoration: "none",
                            }}
                          >Download</a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ── HISTORY ── */}
              {tab === "history" && (
                <div>
                  {history.length === 0 ? (
                    <div style={{ ...S.card, textAlign: "center", padding: "32px 16px" }}>
                      <p style={{ fontSize: 32, margin: "0 0 8px" }}>💸</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: 0 }}>No conversions yet</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "6px 0 0" }}>
                        Share your link — every paid signup earns you commission
                      </p>
                    </div>
                  ) : (
                    history.map((c) => (
                      <div key={c.id} style={{ ...S.card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px", textTransform: "capitalize" }}>
                            {c.type === "suite" ? "Ghost Suite" : c.type === "gold" ? "Gold Penthouse" : "Signup"}
                          </p>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                            {new Date(c.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: 14, fontWeight: 900, color: c.amountIdr > 0 ? "#4ade80" : "rgba(255,255,255,0.3)", margin: "0 0 2px" }}>
                            +{fmt(c.amountIdr)} IDR
                          </p>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
                            background: c.paidOut ? "rgba(74,222,128,0.12)" : "rgba(251,191,36,0.12)",
                            color: c.paidOut ? "#4ade80" : "#fbbf24",
                          }}>
                            {c.paidOut ? "PAID" : "PENDING"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
