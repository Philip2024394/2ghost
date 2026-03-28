import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  getAffiliate, getAffiliateStats, loadBanners, loadVideos,
  loadConversions, Conversion, upsertAffiliate, PayoutDetails,
} from "../affiliateStorage";

import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
const BG           = "https://ik.imagekit.io/7grri5v7d/ghost%20roomssadasdasdfasdfasdf.png";
const SKELETON_IMG = "https://ik.imagekit.io/7grri5v7d/Skeleton%20in%20tuxedo%20flips%20Connect%204%20disc.png?updatedAt=1774279388822";

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
  const a = useGenderAccent();
  const [params]          = useSearchParams();
  const [code, setCode]   = useState(params.get("code")?.toUpperCase() || "");
  const [input, setInput] = useState(code);
  const [tab, setTab]     = useState<"stats" | "share" | "banners" | "videos" | "history" | "payout">("stats");
  const [copied, setCopied]       = useState<string | null>(null);
  const [error, setError]         = useState("");

  // Payout details form
  const [pLegal, setPLegal]   = useState("");
  const [pIdType, setPIdType] = useState<"KTP" | "Passport">("KTP");
  const [pIdNum, setPIdNum]   = useState("");
  const [pBank, setPBank]     = useState("");
  const [pAccNum, setPAccNum] = useState("");
  const [pAccName, setPAccName] = useState("");
  const [pSaved, setPSaved]   = useState(false);
  const [pErr, setPErr]       = useState("");

  useEffect(() => {
    if (params.get("code")) setCode(params.get("code")!.toUpperCase());
  }, [params]);

  useEffect(() => {
    document.body.classList.add("affiliate-mode");
    return () => { document.body.classList.remove("affiliate-mode"); };
  }, []);

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
            position: "relative", zIndex: 1, width: "100%",
            background: "rgba(8,2,2,0.97)", border: `1px solid ${a.glow(0.2)}`,
            borderRadius: 24, padding: "28px 22px", backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ height: 3, background: `linear-gradient(90deg,#b91c1c,${a.accent})`, borderRadius: "3px 3px 0 0", margin: "-28px -22px 22px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <img src={SKELETON_IMG} alt="Mr Butlas" style={{ width: 50, height: 50, objectFit: "contain" }} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>Affiliate Dashboard</p>
              <p style={{ fontSize: 10, color: a.glow(0.7), margin: 0 }}>Enter your code to continue</p>
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
            background: `linear-gradient(135deg,#dc2626,${a.accent})`,
            border: "none", borderRadius: 12, padding: "12px 0",
            fontSize: 13, fontWeight: 900, color: "#fff", cursor: "pointer",
          }}>View My Dashboard →</button>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center", margin: "12px 0 0" }}>
            Not signed up yet?{" "}
            <a href="/affiliate/join" style={{ color: a.accent, textDecoration: "none" }}>Join here →</a>
          </p>
        </motion.div>
      </div>
    );
  }

  const TABS = [
    { key: "stats",   label: "📊 Stats"    },
    { key: "share",   label: "🔗 Share"    },
    { key: "banners", label: "🖼️ Banners"  },
    { key: "videos",  label: "🎬 Videos"   },
    { key: "history", label: "💰 Earnings" },
    { key: "payout",  label: "🏦 Payout"   },
  ] as const;

  const hasPayout = !!affiliate.payoutDetails;

  const savePayout = () => {
    if (!pLegal.trim())   { setPErr("Enter your legal name"); return; }
    if (!pIdNum.trim())   { setPErr("Enter your ID number"); return; }
    if (!pBank.trim())    { setPErr("Enter your bank name"); return; }
    if (!pAccNum.trim())  { setPErr("Enter your account number"); return; }
    if (!pAccName.trim()) { setPErr("Enter the account holder name"); return; }
    const updated = { ...affiliate, payoutDetails: {
      legalName: pLegal.trim(), idType: pIdType, idNumber: pIdNum.trim(),
      bankName: pBank.trim(), accountNumber: pAccNum.trim(),
      accountHolder: pAccName.trim(), submittedAt: Date.now(),
    } as PayoutDetails };
    upsertAffiliate(updated);
    setPSaved(true);
    setPErr("");
    setTimeout(() => setPSaved(false), 3000);
  };

  return (
    <div style={{
      minHeight: "100dvh", width: "100%",
      backgroundImage: `url(${BG})`, backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "0 0 max(32px, env(safe-area-inset-bottom, 32px))",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(4,5,8,0.88)", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%" }}>

        {/* Header */}
        <div style={{
          background: "rgba(4,6,4,0.97)", borderBottom: `1px solid ${a.glow(0.15)}`,
          padding: "max(16px, env(safe-area-inset-top, 16px)) 18px 0",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ height: 3, background: `linear-gradient(90deg,#b91c1c,${a.accent})`, margin: "-16px -18px 14px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={LOGO} alt="Mr Butlas" style={{ width: 32, height: 32, objectFit: "contain" }} />
              <div>
                <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: 0 }}>{affiliate.name}</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                  {affiliate.city} · Code: <span style={{ color: a.accent, fontWeight: 700 }}>{code}</span>
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6,
              background: affiliate.status === "active" ? "${a.glow(0.08)}" : "rgba(239,68,68,0.08)",
              border: `1px solid ${affiliate.status === "active" ? "${a.glow(0.2)}" : "rgba(239,68,68,0.2)"}`,
              borderRadius: 20, padding: "5px 12px",
            }}>
              {affiliate.status === "active" ? (
                <motion.div
                  animate={{ opacity: [1, 0.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  style={{ width: 8, height: 8, borderRadius: "50%", background: a.accent, boxShadow: `0 0 7px ${a.accent}`, flexShrink: 0 }}
                />
              ) : (
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f87171", flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 9, fontWeight: 800, color: affiliate.status === "active" ? "#4ade80" : "#f87171", textTransform: "uppercase" }}>
                {affiliate.status === "active" ? "Live" : "Paused"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12 }}>
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key as typeof tab)}
                style={{
                  flexShrink: 0, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                  padding: "0 12px", fontSize: 11, fontWeight: 700,
                  background: tab === key ? "${a.glow(0.15)}" : "rgba(255,255,255,0.04)",
                  color: tab === key ? "#4ade80" : "rgba(255,255,255,0.45)",
                  outline: tab === key ? "1px solid ${a.glow(0.3)}" : "none",
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
                    background: `linear-gradient(135deg,${a.glow(0.1)},rgba(22,163,74,0.06))`,
                    border: `1px solid ${a.glow(0.2)}`,
                    borderRadius: 16, padding: "20px 18px", marginBottom: 12,
                  }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 4px", fontWeight: 700, letterSpacing: 1 }}>TOTAL EARNED</p>
                    <p style={{ fontSize: 32, fontWeight: 900, color: a.accent, margin: "0 0 12px" }}>
                      {fmt(stats.earned)} <span style={{ fontSize: 14, color: a.glow(0.6) }}>IDR</span>
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
                    <p style={{ fontSize: 12, color: a.glow(0.8), wordBreak: "break-all", margin: "0 0 10px", lineHeight: 1.5 }}>{shareLink}</p>
                    <button
                      onClick={() => copy(shareLink, "link")}
                      style={{
                        width: "100%",
                        background: copied === "link" ? "${a.glow(0.15)}" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${copied === "link" ? "${a.glow(0.3)}" : "rgba(255,255,255,0.1)"}`,
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
                        Mr Butlas Hotel — anonymous, private rooms, real vibes.<br />
                        Try it free 👇<br />
                        <span style={{ color: a.accent }}>{shareLink}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => copy(`🏨 Guys, this app changed how I meet people in ${affiliate.city}.\nMr Butlas Hotel — anonymous, private rooms, real vibes.\nTry it free 👇\n${shareLink}`, "caption")}
                      style={{
                        width: "100%", background: copied === "caption" ? "${a.glow(0.1)}" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${copied === "caption" ? "${a.glow(0.25)}" : "rgba(255,255,255,0.1)"}`,
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
                              background: copied === `banner-${b.id}` ? "${a.glow(0.12)}" : "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7,
                              padding: "6px 12px", fontSize: 11, fontWeight: 700,
                              color: copied === `banner-${b.id}` ? "#4ade80" : "#fff", cursor: "pointer",
                            }}
                          >{copied === `banner-${b.id}` ? "✓ Copied" : "Copy URL"}</button>
                          <a href={b.imageUrl} download target="_blank" rel="noreferrer"
                            style={{
                              background: a.glow(0.1), border: `1px solid ${a.glow(0.2)}`,
                              borderRadius: 7, padding: "6px 12px",
                              fontSize: 11, fontWeight: 700, color: a.accent, textDecoration: "none",
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
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: a.glow(0.1), border: `1px solid ${a.glow(0.2)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎬</div>
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
                            background: copied === `video-${v.id}` ? "${a.glow(0.12)}" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${copied === `video-${v.id}` ? "${a.glow(0.25)}" : "rgba(255,255,255,0.1)"}`,
                            borderRadius: 9, padding: "9px 0",
                            fontSize: 12, fontWeight: 700,
                            color: copied === `video-${v.id}` ? "#4ade80" : "#fff", cursor: "pointer",
                          }}
                        >{copied === `video-${v.id}` ? "✓ Copied!" : "📋 Copy Video Link"}</button>
                        <a href={v.videoUrl} target="_blank" rel="noreferrer"
                          style={{
                            background: a.glow(0.1), border: `1px solid ${a.glow(0.2)}`,
                            borderRadius: 9, padding: "9px 14px",
                            fontSize: 12, fontWeight: 700, color: a.accent, textDecoration: "none",
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
                          background: c.paidOut ? "${a.glow(0.12)}" : "rgba(251,191,36,0.12)",
                          color: c.paidOut ? "#4ade80" : "#fbbf24",
                        }}>{c.paidOut ? "PAID" : "PENDING"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── PAYOUT DETAILS ── */}
              {tab === "payout" && (
                <div>
                  {/* Status card */}
                  <div style={{
                    ...S.card,
                    borderColor: hasPayout ? "${a.glow(0.25)}" : "rgba(251,191,36,0.2)",
                    background: hasPayout ? "${a.glow(0.05)}" : "rgba(251,191,36,0.04)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{hasPayout ? "✅" : "⚠️"}</span>
                      <p style={{ fontSize: 13, fontWeight: 800, color: hasPayout ? "#4ade80" : "#fbbf24", margin: 0 }}>
                        {hasPayout ? "Payout details on file" : "Payout details required"}
                      </p>
                    </div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
                      {hasPayout
                        ? "Your KTP/Passport and bank account are saved. Commission payments will be processed within 30 days."
                        : "Submit your identity document and bank account below before your first commission payment can be released."}
                    </p>
                  </div>

                  {/* Existing details (read-only if already saved) */}
                  {hasPayout && affiliate.payoutDetails && (
                    <div style={S.card}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.5)", margin: "0 0 10px" }}>Saved Details</p>
                      {[
                        ["Legal Name",       affiliate.payoutDetails.legalName],
                        ["ID Type",          affiliate.payoutDetails.idType],
                        ["ID Number",        affiliate.payoutDetails.idNumber],
                        ["Bank",             affiliate.payoutDetails.bankName],
                        ["Account Number",   affiliate.payoutDetails.accountNumber],
                        ["Account Holder",   affiliate.payoutDetails.accountHolder],
                      ].map(([label, val]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{val}</span>
                        </div>
                      ))}
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "8px 0 0" }}>
                        Submitted {new Date(affiliate.payoutDetails.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  )}

                  {/* Payout form */}
                  <div style={S.card}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>
                      {hasPayout ? "Update Details" : "Submit Your Details"}
                    </p>

                    {[
                      { label: "Full Legal Name (as on ID)", value: pLegal,   set: setPLegal,   placeholder: "Your name exactly as on KTP/Passport" },
                      { label: "ID Number",                  value: pIdNum,   set: setPIdNum,   placeholder: "e.g. 3471234567890001" },
                      { label: "Bank Name",                  value: pBank,    set: setPBank,    placeholder: "e.g. BCA, BNI, Mandiri, BSI" },
                      { label: "Account Number",             value: pAccNum,  set: setPAccNum,  placeholder: "Your bank account number" },
                      { label: "Account Holder Name",        value: pAccName, set: setPAccName, placeholder: "Name on the account" },
                    ].map(({ label, value, set, placeholder }) => (
                      <div key={label} style={{ marginBottom: 10 }}>
                        <p style={S.label}>{label.toUpperCase()}</p>
                        <input
                          value={value}
                          onChange={(e) => { set(e.target.value); setPErr(""); }}
                          placeholder={placeholder}
                          style={S.input}
                        />
                      </div>
                    ))}

                    {/* ID type selector */}
                    <div style={{ marginBottom: 12 }}>
                      <p style={S.label}>ID TYPE</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(["KTP", "Passport"] as const).map((t) => (
                          <button key={t} onClick={() => setPIdType(t)}
                            style={{
                              flex: 1, height: 38, borderRadius: 9, border: "none", cursor: "pointer",
                              fontWeight: 800, fontSize: 12,
                              background: pIdType === t ? "${a.glow(0.15)}" : "rgba(255,255,255,0.04)",
                              color: pIdType === t ? "#4ade80" : "rgba(255,255,255,0.4)",
                              outline: pIdType === t ? "1px solid ${a.glow(0.3)}" : "none",
                            }}
                          >{t}</button>
                        ))}
                      </div>
                    </div>

                    {pErr && <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 10px" }}>{pErr}</p>}

                    <button onClick={savePayout} style={{
                      width: "100%",
                      background: pSaved ? "${a.glow(0.12)}" : `linear-gradient(135deg,#16a34a,${a.accent})`,
                      border: pSaved ? "1px solid ${a.glow(0.3)}" : "none",
                      borderRadius: 12, padding: "12px 0",
                      fontSize: 13, fontWeight: 900,
                      color: pSaved ? "#4ade80" : "#000", cursor: "pointer",
                    }}>
                      {pSaved ? "✓ Details Saved!" : hasPayout ? "Update Details" : "Save Payout Details"}
                    </button>

                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "10px 0 0", lineHeight: 1.6, textAlign: "center" }}>
                      Your details are stored securely and used only for commission payments. Per our Terms & Conditions, you are responsible for your own tax obligations.
                    </p>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
