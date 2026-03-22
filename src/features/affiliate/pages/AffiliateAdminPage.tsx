import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  isAdminAuthed, adminLogin, adminLogout,
  loadAffiliates, saveAffiliates,
  loadBanners, saveBanners, Banner,
  loadVideos, saveVideos, PromoVideo,
  loadConversions, saveConversions,
  getAffiliateStats, Affiliate,
} from "../affiliateStorage";

const LOGO = "https://ik.imagekit.io/7grri5v7d/sdfasdfasdfsdfasdfasdfsdfdfasdfasasdasdasd.png?updatedAt=1773948067293";

const S = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: "14px",
    marginBottom: 10,
  } as React.CSSProperties,
  input: {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, padding: "9px 12px", color: "#fff",
    fontSize: 13, outline: "none", boxSizing: "border-box" as const, marginBottom: 8,
  },
  label: {
    fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)",
    letterSpacing: 1, margin: "0 0 4px", display: "block",
  } as React.CSSProperties,
  btn: (color = "#4ade80") => ({
    background: `${color}18`, border: `1px solid ${color}44`,
    borderRadius: 8, padding: "6px 14px",
    fontSize: 11, fontWeight: 700, color, cursor: "pointer",
  } as React.CSSProperties),
};

function fmt(n: number) { return n.toLocaleString("id-ID"); }
type Tab = "overview" | "affiliates" | "banners" | "videos" | "payouts";

// ── Login ─────────────────────────────────────────────────────────────────────
function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw]   = useState("");
  const [err, setErr] = useState("");
  return (
    <div style={{
      minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#040604", fontFamily: "'Inter', system-ui, sans-serif", padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 360,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(74,222,128,0.2)",
        borderRadius: 20, padding: "28px 22px",
      }}>
        <div style={{ height: 3, background: "linear-gradient(90deg,#16a34a,#4ade80)", borderRadius: "3px 3px 0 0", margin: "-28px -22px 22px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          <img src={LOGO} alt="2Ghost" style={{ width: 38, height: 38, objectFit: "contain" }} />
          <div>
            <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>Affiliate Admin</p>
            <p style={{ fontSize: 10, color: "rgba(74,222,128,0.7)", margin: 0 }}>2Ghost internal panel</p>
          </div>
        </div>
        <input type="password" value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(""); }}
          placeholder="Admin password" style={S.input}
          onKeyDown={(e) => { if (e.key === "Enter") { if (adminLogin(pw)) onSuccess(); else setErr("Wrong password"); } }}
        />
        {err && <p style={{ fontSize: 11, color: "#f87171", margin: "-4px 0 8px" }}>{err}</p>}
        <button
          onClick={() => { if (adminLogin(pw)) onSuccess(); else setErr("Wrong password"); }}
          style={{
            width: "100%", background: "linear-gradient(135deg,#16a34a,#4ade80)",
            border: "none", borderRadius: 12, padding: "12px 0",
            fontSize: 13, fontWeight: 900, color: "#000", cursor: "pointer",
          }}
        >Sign In →</button>
      </div>
    </div>
  );
}

// ── Main admin panel ──────────────────────────────────────────────────────────
export default function AffiliateAdminPage() {
  const [authed, setAuthed]           = useState(isAdminAuthed());
  const [tab, setTab]                 = useState<Tab>("overview");
  const [affiliates, setAffiliates]   = useState<Affiliate[]>([]);
  const [banners, setBanners]         = useState<Banner[]>([]);
  const [videos, setVideos]           = useState<PromoVideo[]>([]);
  const [selected, setSelected]       = useState<string | null>(null);
  const [refresh, setRefresh]         = useState(0);

  // Banner form
  const [bName, setBName]   = useState("");
  const [bUrl, setBUrl]     = useState("");
  const [bSize, setBSize]   = useState("1080×1080");
  const [bFlash, setBFlash] = useState(false);

  // Video form
  const [vName, setVName]       = useState("");
  const [vUrl, setVUrl]         = useState("");
  const [vPlatform, setVPlatform] = useState("TikTok");
  const [vFlash, setVFlash]     = useState(false);

  // Affiliate search
  const [search, setSearch] = useState("");

  useEffect(() => {
    setAffiliates(loadAffiliates());
    setBanners(loadBanners());
    setVideos(loadVideos());
  }, [refresh]);

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;

  const allConvs   = loadConversions();
  const totalEarned = allConvs.reduce((s, c) => s + c.amountIdr, 0);
  const totalOwed   = allConvs.filter((c) => !c.paidOut).reduce((s, c) => s + c.amountIdr, 0);
  const active      = affiliates.filter((a) => a.status === "active").length;

  const filtered = affiliates.filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase())
  );

  // Sort by earnings desc
  const sorted = [...filtered].sort((a, b) => {
    return getAffiliateStats(b.id).earned - getAffiliateStats(a.id).earned;
  });

  const pauseToggle = (id: string) => {
    const list = loadAffiliates().map((a) =>
      a.id === id ? { ...a, status: (a.status === "active" ? "paused" : "active") as Affiliate["status"] } : a
    );
    saveAffiliates(list);
    setRefresh((r) => r + 1);
  };

  const deleteAffiliate = (id: string) => {
    saveAffiliates(loadAffiliates().filter((a) => a.id !== id));
    setSelected(null);
    setRefresh((r) => r + 1);
  };

  const addBanner = () => {
    if (!bName.trim() || !bUrl.trim()) return;
    saveBanners([...loadBanners(), { id: `${Date.now()}`, name: bName.trim(), imageUrl: bUrl.trim(), size: bSize.trim(), addedAt: Date.now() }]);
    setBName(""); setBUrl(""); setBFlash(true);
    setTimeout(() => setBFlash(false), 2000);
    setRefresh((r) => r + 1);
  };

  const deleteBanner = (id: string) => {
    saveBanners(loadBanners().filter((b) => b.id !== id));
    setRefresh((r) => r + 1);
  };

  const addVideo = () => {
    if (!vName.trim() || !vUrl.trim()) return;
    saveVideos([...loadVideos(), { id: `${Date.now()}`, name: vName.trim(), videoUrl: vUrl.trim(), platform: vPlatform.trim(), addedAt: Date.now() }]);
    setVName(""); setVUrl(""); setVFlash(true);
    setTimeout(() => setVFlash(false), 2000);
    setRefresh((r) => r + 1);
  };

  const deleteVideo = (id: string) => {
    saveVideos(loadVideos().filter((v) => v.id !== id));
    setRefresh((r) => r + 1);
  };

  const markAllPaid = (affiliateId: string) => {
    saveConversions(loadConversions().map((c) => c.affiliateId === affiliateId ? { ...c, paidOut: true } : c));
    setRefresh((r) => r + 1);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview",   label: "📊 Overview"   },
    { key: "affiliates", label: "👥 Affiliates"  },
    { key: "banners",    label: "🖼️ Banners"     },
    { key: "videos",     label: "🎬 Videos"      },
    { key: "payouts",    label: "💸 Payouts"     },
  ];

  const selAffiliate = selected ? affiliates.find((a) => a.id === selected) : null;
  const selStats     = selected ? getAffiliateStats(selected) : null;
  const selConvs     = selected ? allConvs.filter((c) => c.affiliateId === selected) : [];

  return (
    <div style={{
      minHeight: "100dvh", background: "#040604",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 580 }}>

        {/* Header */}
        <div style={{
          background: "rgba(4,6,4,0.98)", borderBottom: "1px solid rgba(74,222,128,0.15)",
          padding: "max(16px, env(safe-area-inset-top, 16px)) 18px 0",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ height: 3, background: "linear-gradient(90deg,#16a34a,#4ade80)", margin: "-16px -18px 14px" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={LOGO} alt="2Ghost" style={{ width: 32, height: 32, objectFit: "contain" }} />
              <div>
                <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>Affiliate Admin</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>{active} active · {affiliates.length} total</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <a href="/affiliate/join" target="_blank" rel="noreferrer"
                style={{ ...S.btn(), fontSize: 10, textDecoration: "none" }}>+ Add Affiliate</a>
              <button onClick={() => { adminLogout(); setAuthed(false); }}
                style={{ ...S.btn("#f87171"), fontSize: 10 }}>Log Out</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 12 }}>
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => { setTab(key); setSelected(null); }}
                style={{
                  flexShrink: 0, height: 30, borderRadius: 7, border: "none", cursor: "pointer",
                  padding: "0 11px", fontSize: 11, fontWeight: 700,
                  background: tab === key ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
                  color: tab === key ? "#4ade80" : "rgba(255,255,255,0.45)",
                  outline: tab === key ? "1px solid rgba(74,222,128,0.3)" : "none",
                }}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "16px 16px 40px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={`${tab}-${selected}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

              {/* ── OVERVIEW ── */}
              {tab === "overview" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                    {[
                      { label: "Active Affiliates", value: active,           icon: "✅", color: "#4ade80" },
                      { label: "Total Affiliates",  value: affiliates.length, icon: "👥", color: "#fff"    },
                      { label: "Total Earned IDR",  value: fmt(totalEarned), icon: "💰", color: "#4ade80" },
                      { label: "Owed (Unpaid) IDR", value: fmt(totalOwed),   icon: "💸", color: "#fbbf24" },
                    ].map(({ label, value, icon, color }) => (
                      <div key={label} style={S.card}>
                        <span style={{ fontSize: 22 }}>{icon}</span>
                        <p style={{ fontSize: 18, fontWeight: 900, color, margin: "5px 0 2px" }}>{value}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Top performers */}
                  <div style={S.card}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.6)", margin: "0 0 12px" }}>Top Performers</p>
                    {affiliates.length === 0 && (
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>No affiliates yet</p>
                    )}
                    {[...affiliates].sort((a, b) => getAffiliateStats(b.id).earned - getAffiliateStats(a.id).earned).slice(0, 5).map((a, i) => {
                      const st = getAffiliateStats(a.id);
                      return (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: 14, width: 20, textAlign: "center", flexShrink: 0 }}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                          </span>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: "0 0 1px" }}>{a.name} <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>· {a.city}</span></p>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>👆 {st.clicks} clicks · 💳 {st.conversions} sales</p>
                          </div>
                          <p style={{ fontSize: 12, fontWeight: 800, color: "#4ade80", margin: 0, flexShrink: 0 }}>{fmt(st.earned)} IDR</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent conversions */}
                  <div style={S.card}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.6)", margin: "0 0 10px" }}>Recent Sales</p>
                    {allConvs.length === 0 ? (
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>No conversions yet</p>
                    ) : (
                      allConvs.slice().reverse().slice(0, 6).map((c) => (
                        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: "0 0 1px" }}>
                              {c.affiliateId} — <span style={{ textTransform: "capitalize" }}>{c.type}</span>
                            </p>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{new Date(c.createdAt).toLocaleDateString("id-ID")}</p>
                          </div>
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5,
                            background: c.paidOut ? "rgba(74,222,128,0.1)" : "rgba(251,191,36,0.1)",
                            color: c.paidOut ? "#4ade80" : "#fbbf24",
                          }}>{c.paidOut ? "PAID" : "OWED"}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── AFFILIATES LIST ── */}
              {tab === "affiliates" && !selected && (
                <div>
                  <input
                    value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, city or code…"
                    style={{ ...S.input, marginBottom: 12 }}
                  />
                  {sorted.length === 0 && (
                    <div style={{ ...S.card, textAlign: "center", padding: "28px" }}>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>No affiliates yet</p>
                    </div>
                  )}
                  {sorted.map((a) => {
                    const st = getAffiliateStats(a.id);
                    return (
                      <div key={a.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => setSelected(a.id)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                              <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>{a.name}</p>
                              <span style={{
                                fontSize: 8, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                                background: a.status === "active" ? "rgba(74,222,128,0.12)" : "rgba(239,68,68,0.12)",
                                color: a.status === "active" ? "#4ade80" : "#f87171", textTransform: "uppercase",
                              }}>{a.status}</span>
                            </div>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>
                              📍 {a.city} · 📱 {a.whatsapp} · Code: <span style={{ color: "#4ade80" }}>{a.id}</span>
                            </p>
                            <div style={{ display: "flex", gap: 14 }}>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>👆 {st.clicks} clicks</span>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>💳 {st.conversions} sales</span>
                              <span style={{ fontSize: 11, color: st.owed > 0 ? "#fbbf24" : "rgba(255,255,255,0.3)" }}>
                                {fmt(st.owed)} IDR owed
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                            <p style={{ fontSize: 14, fontWeight: 900, color: "#4ade80", margin: "0 0 4px" }}>{fmt(st.earned)}</p>
                            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0 }}>IDR earned</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── AFFILIATE DETAIL ── */}
              {tab === "affiliates" && selected && selAffiliate && selStats && (
                <div>
                  <button onClick={() => setSelected(null)} style={{ ...S.btn(), marginBottom: 12, fontSize: 11 }}>← Back to list</button>

                  <div style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 3px" }}>{selAffiliate.name}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>📍 {selAffiliate.city}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>📱 {selAffiliate.whatsapp}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>✉️ {selAffiliate.email}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                          Code: <strong style={{ color: "#4ade80" }}>{selAffiliate.id}</strong> · {selAffiliate.commissionRate}% commission
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
                        <button onClick={() => pauseToggle(selected)} style={selAffiliate.status === "active" ? S.btn("#fbbf24") : S.btn("#4ade80")}>
                          {selAffiliate.status === "active" ? "⏸ Pause" : "▶ Activate"}
                        </button>
                        <button onClick={() => deleteAffiliate(selected)} style={S.btn("#f87171")}>🗑 Delete</button>
                      </div>
                    </div>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: 0 }}>
                      Joined {new Date(selAffiliate.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      {selAffiliate.termsAgreedAt ? ` · Terms agreed ${new Date(selAffiliate.termsAgreedAt).toLocaleDateString("id-ID")}` : ""}
                    </p>
                  </div>

                  {/* Payout details */}
                  <div style={{
                    ...S.card,
                    borderColor: selAffiliate.payoutDetails ? "rgba(74,222,128,0.2)" : "rgba(251,191,36,0.2)",
                    background: selAffiliate.payoutDetails ? "rgba(74,222,128,0.04)" : "rgba(251,191,36,0.04)",
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 800, color: selAffiliate.payoutDetails ? "#4ade80" : "#fbbf24", margin: "0 0 8px" }}>
                      {selAffiliate.payoutDetails ? "✅ Payout Details on File" : "⚠️ Payout Details Not Submitted"}
                    </p>
                    {selAffiliate.payoutDetails ? (
                      [
                        ["Legal Name",     selAffiliate.payoutDetails.legalName],
                        ["ID Type",        selAffiliate.payoutDetails.idType],
                        ["ID Number",      selAffiliate.payoutDetails.idNumber],
                        ["Bank",           selAffiliate.payoutDetails.bankName],
                        ["Account No.",    selAffiliate.payoutDetails.accountNumber],
                        ["Account Holder", selAffiliate.payoutDetails.accountHolder],
                      ].map(([label, val]) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{val}</span>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                        Affiliate has not submitted KTP/Passport and bank account yet. Payment cannot be released.
                      </p>
                    )}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      { l: "Clicks",        v: selStats.clicks },
                      { l: "Signups",       v: selStats.signups },
                      { l: "Paid Sales",    v: selStats.conversions },
                      { l: "Total Earned",  v: `${fmt(selStats.earned)} IDR` },
                    ].map(({ l, v }) => (
                      <div key={l} style={{ ...S.card, marginBottom: 0 }}>
                        <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 3px" }}>{v}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{l}</p>
                      </div>
                    ))}
                  </div>

                  <div style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>Payout</p>
                        <p style={{ fontSize: 11, color: "#fbbf24", margin: 0 }}>Owed: {fmt(selStats.owed)} IDR</p>
                      </div>
                      {selStats.owed > 0 && (
                        <button onClick={() => { markAllPaid(selected); }} style={S.btn("#4ade80")}>✓ Mark All Paid</button>
                      )}
                    </div>
                    {selConvs.length === 0 ? (
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>No conversions yet</p>
                    ) : (
                      selConvs.slice().reverse().map((c) => (
                        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0, textTransform: "capitalize" }}>
                            {c.type} · {new Date(c.createdAt).toLocaleDateString("id-ID")}
                          </p>
                          <span style={{ fontSize: 11, fontWeight: 700, color: c.paidOut ? "#4ade80" : "#fbbf24" }}>
                            {c.paidOut ? "✓ " : ""}{fmt(c.amountIdr)} IDR
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ── BANNERS ── */}
              {tab === "banners" && (
                <div>
                  <div style={S.card}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>Upload Banner</p>
                    <label style={S.label}>Banner Name</label>
                    <input value={bName} onChange={(e) => setBName(e.target.value)} placeholder="e.g. Square — Hotel Dark" style={S.input} />
                    <label style={S.label}>Image URL (paste direct link to image)</label>
                    <input value={bUrl} onChange={(e) => setBUrl(e.target.value)} placeholder="https://..." style={S.input} />
                    <label style={S.label}>Size</label>
                    <input value={bSize} onChange={(e) => setBSize(e.target.value)} placeholder="1080×1080" style={{ ...S.input, marginBottom: 10 }} />
                    {bUrl && (
                      <img src={bUrl} alt="preview" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, marginBottom: 10 }}
                        onError={(e) => (e.currentTarget.style.display = "none")} />
                    )}
                    <button onClick={addBanner} style={{
                      width: "100%",
                      background: bFlash ? "rgba(74,222,128,0.12)" : "linear-gradient(135deg,#16a34a,#4ade80)",
                      border: bFlash ? "1px solid rgba(74,222,128,0.3)" : "none",
                      borderRadius: 10, padding: "10px 0",
                      fontSize: 13, fontWeight: 900, color: bFlash ? "#4ade80" : "#000", cursor: "pointer",
                    }}>{bFlash ? "✓ Banner Added!" : "Add Banner"}</button>
                  </div>

                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 10px", fontWeight: 700 }}>{banners.length} banner{banners.length !== 1 ? "s" : ""} uploaded</p>
                  {banners.map((b) => (
                    <div key={b.id} style={S.card}>
                      <img src={b.imageUrl} alt={b.name} style={{ width: "100%", borderRadius: 8, marginBottom: 8, objectFit: "cover", maxHeight: 180 }} />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{b.name}</p>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>{b.size}</p>
                        </div>
                        <button onClick={() => deleteBanner(b.id)} style={S.btn("#f87171")}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── VIDEOS ── */}
              {tab === "videos" && (
                <div>
                  <div style={S.card}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 12px" }}>Upload Promo Video</p>
                    <label style={S.label}>Video Title</label>
                    <input value={vName} onChange={(e) => setVName(e.target.value)} placeholder="e.g. Hotel Lobby promo 30s" style={S.input} />
                    <label style={S.label}>Video URL (TikTok, YouTube, Google Drive, etc.)</label>
                    <input value={vUrl} onChange={(e) => setVUrl(e.target.value)} placeholder="https://..." style={S.input} />
                    <label style={S.label}>Platform</label>
                    <select value={vPlatform} onChange={(e) => setVPlatform(e.target.value)}
                      style={{ ...S.input, appearance: "none" as const }}>
                      {["TikTok", "Instagram", "YouTube", "Google Drive", "WhatsApp", "Other"].map((p) => (
                        <option key={p} value={p} style={{ background: "#040604" }}>{p}</option>
                      ))}
                    </select>
                    <button onClick={addVideo} style={{
                      width: "100%", marginTop: 2,
                      background: vFlash ? "rgba(74,222,128,0.12)" : "linear-gradient(135deg,#16a34a,#4ade80)",
                      border: vFlash ? "1px solid rgba(74,222,128,0.3)" : "none",
                      borderRadius: 10, padding: "10px 0",
                      fontSize: 13, fontWeight: 900, color: vFlash ? "#4ade80" : "#000", cursor: "pointer",
                    }}>{vFlash ? "✓ Video Added!" : "Add Promo Video"}</button>
                  </div>

                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 10px", fontWeight: 700 }}>{videos.length} video{videos.length !== 1 ? "s" : ""} uploaded</p>
                  {videos.map((v) => (
                    <div key={v.id} style={S.card}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎬</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 2px" }}>{v.name}</p>
                          <p style={{ fontSize: 10, color: "rgba(74,222,128,0.7)", margin: "0 0 4px" }}>{v.platform}</p>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0, wordBreak: "break-all", lineHeight: 1.4 }}>{v.videoUrl}</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                          <a href={v.videoUrl} target="_blank" rel="noreferrer"
                            style={{ ...S.btn(), fontSize: 10, textDecoration: "none" }}>▶ View</a>
                          <button onClick={() => deleteVideo(v.id)} style={{ ...S.btn("#f87171"), fontSize: 10 }}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── PAYOUTS ── */}
              {tab === "payouts" && (
                <div>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 12px" }}>
                    Total owed to all affiliates: <strong style={{ color: "#fbbf24" }}>{fmt(totalOwed)} IDR</strong>
                  </p>
                  {affiliates.filter((a) => getAffiliateStats(a.id).owed > 0).length === 0 ? (
                    <div style={{ ...S.card, textAlign: "center", padding: "28px 16px" }}>
                      <p style={{ fontSize: 24, margin: "0 0 8px" }}>✅</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: 0 }}>All payouts settled</p>
                    </div>
                  ) : (
                    affiliates
                      .filter((a) => getAffiliateStats(a.id).owed > 0)
                      .sort((a, b) => getAffiliateStats(b.id).owed - getAffiliateStats(a.id).owed)
                      .map((a) => {
                        const st = getAffiliateStats(a.id);
                        return (
                          <div key={a.id} style={S.card}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <div>
                                <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{a.name}</p>
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>📍 {a.city} · 📱 {a.whatsapp}</p>
                                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>{st.conversions} paid sales</p>
                                <p style={{ fontSize: 16, fontWeight: 900, color: "#fbbf24", margin: 0 }}>{fmt(st.owed)} IDR owed</p>
                              </div>
                              <button onClick={() => { markAllPaid(a.id); }} style={S.btn("#4ade80")}>✓ Mark Paid</button>
                            </div>
                          </div>
                        );
                      })
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
