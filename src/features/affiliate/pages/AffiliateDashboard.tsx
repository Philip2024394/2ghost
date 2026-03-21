import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  getAffiliate, getAffiliateStats, loadBanners, loadVideos,
  loadConversions, Conversion,
} from "../affiliateStorage";

const BG   = "https://ik.imagekit.io/7grri5v7d/ghost%20roomssadasdasdfasdfasdf.png";
const LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

const S = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "16px",
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

function fmt(n: number) { return n.toLocaleString("id-ID"); }

export default function AffiliateDashboard() {
  const [params]          = useSearchParams();
  const [code, setCode]   = useState(params.get("code")?.toUpperCase() || "");
  const [input, setInput] = useState(code);
  const [tab, setTab]     = useState<"stats" | "share" | "banners" | "videos" | "history">("stats");
  const [copied, setCopied]       = useState<string | null>(null);
  const [error, setError]         = useState("");

  useEffect(() => {
    if (params.get("code")) setCode(params.get("code")!.toUpperCase());
  }, [params]);

  const affiliate = code ? getAffiliate(code) : null;
  const stats     = code ? getAffiliateStats(code) : null;
  const banners   = loadBanners();
  const videos    = loadVideos();
  const history: Conversion[] = code
    ? loadConversions().filter((c) => c.affiliateId === code).slice().reverse()
    : [];

  const shareLink = code ? `${window.location.origin}/affiliate/ref/${code}` : "";

  const login = () => {
    const c = input.trim().toUpperCase();
    if (!c) { setError("Enter your affiliate code"); return; }
    if (!getAffiliate(c)) { setError("Code not found — check your code or sign up to join"); return; }
    setCode(c);
    setError("");
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!affiliate) {
    return (
      <div style={{
        minHeight: "100dvh", width: "100%",
        backgroundImage: `url(${BG})`, backgroundSize: "cover", backgroundPosition: "center",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px", fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{ position: "fixed", inset: 0, background: "rgba(4,5,8,0.88)", zIndex: 0 }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{
            position: "relative", zIndex: 1, width: "100%", maxWidth: 380,
            background: "rgba(4,6,4,0.97)", border: "1px solid rgba(74,222,128,0.2)",
            borderRadius: 24, padding: "28px 22px", backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ height: 3, background: "linear-gradient(90deg,#16a34a,#4ade80)", borderRadius: "3px 3px 0 0", margin: "-28px -22px 22px" }} />
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
          <button onClick={login} style={{
            width: "100%", marginTop: 12,
            background: "linear-gradient(135deg,#16a34a,#4ade80)",
            border: "none", borderRadius: 12, padding: "12px 0",
            fontSize: 13, fontWeight: 900, color: "#000", cursor: "pointer",
          }}>View My Dashboard →</button>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center", margin: "12px 0 0" }}>
            Not signed up yet?{" "}
            <a href="/affiliate/join" style={{ color: "#4ade80", textDecoration: "none" }}>Join here →</a>
          </p>
        </motion.div>
      </div>
    );
  }

  const TABS = [
    { key: "stats",   label: "📊 Stats" },
    { key: "share",   label: "🔗 Share" },
    { key: "banners", label: "🖼️ Banners" },
    { key: "videos",  label: "🎬 Videos" },
    { key: "history", label: "💰 Earnings" },
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
          padding: "max(16px, env(safe-area-inset-top, 16px)) 18px 0",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ height: 3, background: "linear-gradient(90deg,#16a34a,#4ade80)", margin: "-16px -18px 14px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={LOGO} alt="2Ghost" style={{ width: 32, height: 32, objectFit: "contain" }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: 0 }}>{affiliate.name}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  {affiliate.city} · Code: <span style={{ color: "#4ade80", fontWeight: 700 }}>{code}</span>
                </p>
              </div>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 800, padding: "3px 10px", borderRadius: 6,
              background: affiliate.status === "active" ? "rgba(74,222,128,0.12)" : "rgba(239,68,68,0.12)",
              color: affiliate.status === "active" ? "#4ade80" : "#f87171",
              textTransform: "uppercase",
            }}>{affiliate.status}</span>
          </div>

          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12 }}>
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
                  <div style={{
                    background: "linear-gradient(135deg,rgba(74,222,128,0.1),rgba(22,163,74,0.06))",
                    border: "1px solid rgba(74,222,128,0.2)",
                    borderRadius: 16, padding: "20px 18px", marginBottom: 12,
                  }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 4px", fontWeight: 700, letterSpacing: 1 }}>TOTAL EARNED</p>
                    <p style={{ fontSize: 32, fontWeight: 900, color: "#4ade80", margin: "0 0 12px" }}>
                      {fmt(stats.earned)} <span style={{ fontSize: 14, color: "rgba(74,222,128,0.6)" }}>IDR</span>
                    </p>
                    <div style={{ display: "flex", gap: 20 }}>
                      <div>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 2px" }}>Paid Out</p>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>{fmt(stats.paid)} IDR</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 2px" }}>Pending</p>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24", margin: 0 }}>{fmt(stats.owed)} IDR</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "Link Clicks",    value: stats.clicks,      icon: "👆" },
                      { label: "Signups",         value: stats.signups,     icon: "👤" },
                      { label: "Paid Sales",      value: stats.conversions, icon: "💳" },
                      { label: "My Commission",   value: `${affiliate.commissionRate}%`, icon: "📈" },
                    ].map(({ label, value, icon }) => (
                      <div key={label} style={{ ...S.card, marginBottom: 0 }}>
                        <span style={{ fontSize: 22 }}>{icon}</span>
                        <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "6px 0 2px" }}>{value}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SHARE ── */}
              {tab === "share" && (
                <div>
                  <div style={S.card}>
                    <p style={S.label}>YOUR REFERRAL LINK</p>
                    <p style={{ fontSize: 12, color: "rgba(74,222,128,0.8)", wordBreak: "break-all", margin: "0 0 10px", lineHeight: 1.5 }}>{shareLink}</p>
                    <button
                      onClick={() => copy(shareLink, "link")}
                      style={{
                        width: "100%",
                        background: copied === "link" ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${copied === "link" ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: 10, padding: "10px 0",
                        fontSize: 13, fontWeight: 800,
                        color: copied === "link" ? "#4ade80" : "#fff", cursor: "pointer",
                      }}
                    >{copied === "link" ? "✓ Copied!" : "📋 Copy My Link"}</button>
                  </div>

                  <div style={S.card}>
                    <p style={S.label}>QR CODE — SCREENSHOT & SHARE</p>
                    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareLink)}&bgcolor=040604&color=4ade80&margin=10`}
                        alt="QR Code"
                        style={{ width: 180, height: 180, borderRadius: 12 }}
                      />
                    </div>
                  </div>

                  <div style={S.card}>
                    <p style={S.label}>READY CAPTION — PASTE INTO INSTAGRAM/TIKTOK</p>
                    <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.7 }}>
                        🏨 Guys, this app changed how I meet people in {affiliate.city}.<br />
                        2Ghost Hotel — anonymous, private rooms, real vibes.<br />
                        Try it free 👇<br />
                        <span style={{ color: "#4ade80" }}>{shareLink}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => copy(`🏨 Guys, this app changed how I meet people in ${affiliate.city}.\n2Ghost Hotel — anonymous, private rooms, real vibes.\nTry it free 👇\n${shareLink}`, "caption")}
                      style={{
                        width: "100%", background: copied === "caption" ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${copied === "caption" ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.1)"}`,
                        borderRadius: 10, padding: "9px 0",
                        fontSize: 12, fontWeight: 700,
                        color: copied === "caption" ? "#4ade80" : "rgba(255,255,255,0.7)", cursor: "pointer",
                      }}
                    >{copied === "caption" ? "✓ Copied!" : "Copy Caption"}</button>
                  </div>
                </div>
              )}

              {/* ── BANNERS ── */}
              {tab === "banners" && (
                <div>
                  {banners.length === 0 ? (
                    <div style={{ ...S.card, textAlign: "center", padding: "32px 16px" }}>
                      <p style={{ fontSize: 32, margin: "0 0 8px" }}>🖼️</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.35)", margin: 0 }}>No banners yet</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: "6px 0 0" }}>The team will upload banners here for you to use</p>
                    </div>
                  ) : banners.map((b) => (
                    <div key={b.id} style={S.card}>
                      <img src={b.imageUrl} alt={b.name} style={{ width: "100%", borderRadius: 10, marginBottom: 10, objectFit: "cover", maxHeight: 220 }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{b.name}</p>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>{b.size}</p>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => copy(b.imageUrl, `banner-${b.id}`)}
                            style={{
                              background: copied === `banner-${b.id}` ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7,
                              padding: "6px 12px", fontSize: 11, fontWeight: 700,
                              color: copied === `banner-${b.id}` ? "#4ade80" : "#fff", cursor: "pointer",
                            }}
                          >{copied === `banner-${b.id}` ? "✓ Copied" : "Copy URL"}</button>
                          <a href={b.imageUrl} download target="_blank" rel="noreferrer"
                            style={{
                              background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
                              borderRadius: 7, padding: "6px 12px",
                              fontSize: 11, fontWeight: 700, color: "#4ade80", textDecoration: "none",
                            }}
                          >Download</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── VIDEOS ── */}
              {tab === "videos" && (
                <div>
                  {videos.length === 0 ? (
                    <div style={{ ...S.card, textAlign: "center", padding: "32px 16px" }}>
                      <p style={{ fontSize: 32, margin: "0 0 8px" }}>🎬</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.35)", margin: 0 }}>No promo videos yet</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: "6px 0 0" }}>The team will upload promo videos here — copy the link and share on TikTok, Instagram, WhatsApp</p>
                    </div>
                  ) : videos.map((v) => (
                    <div key={v.id} style={S.card}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎬</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 2px" }}>{v.name}</p>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{v.platform}</p>
                        </div>
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", wordBreak: "break-all", margin: "0 0 10px", lineHeight: 1.4 }}>{v.videoUrl}</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => copy(v.videoUrl, `video-${v.id}`)}
                          style={{
                            flex: 1,
                            background: copied === `video-${v.id}` ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${copied === `video-${v.id}` ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.1)"}`,
                            borderRadius: 9, padding: "9px 0",
                            fontSize: 12, fontWeight: 700,
                            color: copied === `video-${v.id}` ? "#4ade80" : "#fff", cursor: "pointer",
                          }}
                        >{copied === `video-${v.id}` ? "✓ Copied!" : "📋 Copy Video Link"}</button>
                        <a href={v.videoUrl} target="_blank" rel="noreferrer"
                          style={{
                            background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)",
                            borderRadius: 9, padding: "9px 14px",
                            fontSize: 12, fontWeight: 700, color: "#4ade80", textDecoration: "none",
                          }}
                        >▶ View</a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── EARNINGS HISTORY ── */}
              {tab === "history" && (
                <div>
                  {history.length === 0 ? (
                    <div style={{ ...S.card, textAlign: "center", padding: "32px 16px" }}>
                      <p style={{ fontSize: 32, margin: "0 0 8px" }}>💸</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.35)", margin: 0 }}>No sales yet</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: "6px 0 0" }}>Share your link — every paid signup earns you 25% commission</p>
                    </div>
                  ) : history.map((c) => (
                    <div key={c.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>
                          {c.type === "suite" ? "Ghost Suite" : c.type === "gold" ? "Gold Penthouse" : "Signup"}
                        </p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                          {new Date(c.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 14, fontWeight: 900, color: c.amountIdr > 0 ? "#4ade80" : "rgba(255,255,255,0.3)", margin: "0 0 3px" }}>
                          +{fmt(c.amountIdr)} IDR
                        </p>
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5,
                          background: c.paidOut ? "rgba(74,222,128,0.12)" : "rgba(251,191,36,0.12)",
                          color: c.paidOut ? "#4ade80" : "#fbbf24",
                        }}>{c.paidOut ? "PAID" : "PENDING"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
