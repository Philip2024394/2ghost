import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  isAdminAuthed, adminLogin, adminLogout,
  loadAffiliates, saveAffiliates,
  loadBanners, saveBanners, Banner,
  loadConversions, saveConversions,
  getAffiliateStats, Affiliate,
} from "../affiliateStorage";

const LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";

const S = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: "14px 14px", marginBottom: 10,
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

type Tab = "overview" | "affiliates" | "banners" | "payouts";

// ── Login screen ───────────────────────────────────────────────────────────────
function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pw, setPw]     = useState("");
  const [err, setErr]   = useState("");

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
        <input
          type="password" value={pw}
          onChange={(e) => { setPw(e.target.value); setErr(""); }}
          placeholder="Admin password"
          style={S.input}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (adminLogin(pw)) onSuccess();
              else setErr("Wrong password");
            }
          }}
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
  const [authed, setAuthed] = useState(isAdminAuthed());
  const [tab, setTab]       = useState<Tab>("overview");
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [banners, setBanners]       = useState<Banner[]>([]);
  const [refresh, setRefresh]       = useState(0);

  // Banner form
  const [bName, setBName]   = useState("");
  const [bUrl, setBUrl]     = useState("");
  const [bSize, setBSize]   = useState("1080×1080");
  const [bSaved, setBSaved] = useState(false);

  // Selected affiliate for detail view
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setAffiliates(loadAffiliates());
    setBanners(loadBanners());
  }, [refresh]);

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;

  const allConvs    = loadConversions();
  const totalEarned = allConvs.reduce((s, c) => s + c.amountIdr, 0);
  const totalOwed   = allConvs.filter((c) => !c.paidOut).reduce((s, c) => s + c.amountIdr, 0);
  const active      = affiliates.filter((a) => a.status === "active").length;
  const pending     = affiliates.filter((a) => a.status === "pending").length;

  const setStatus = (id: string, status: Affiliate["status"]) => {
    const list = loadAffiliates().map((a) => a.id === id ? { ...a, status } : a);
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
    const list = loadBanners();
    list.push({ id: `${Date.now()}`, name: bName.trim(), imageUrl: bUrl.trim(), size: bSize.trim(), addedAt: Date.now() });
    saveBanners(list);
    setBName(""); setBUrl(""); setBSaved(true);
    setTimeout(() => setBSaved(false), 2000);
    setRefresh((r) => r + 1);
  };

  const deleteBanner = (id: string) => {
    saveBanners(loadBanners().filter((b) => b.id !== id));
    setRefresh((r) => r + 1);
  };

  const markAllPaid = (affiliateId: string) => {
    const updated = loadConversions().map((c) =>
      c.affiliateId === affiliateId ? { ...c, paidOut: true } : c
    );
    saveConversions(updated);
    setRefresh((r) => r + 1);
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview",   label: "📊 Overview" },
    { key: "affiliates", label: "👥 Affiliates" },
    { key: "banners",    label: "🖼️ Banners" },
    { key: "payouts",    label: "💸 Payouts" },
  ];

  const selAffiliate   = selected ? affiliates.find((a) => a.id === selected) : null;
  const selStats       = selected ? getAffiliateStats(selected) : null;
  const selConvs       = selected ? allConvs.filter((c) => c.affiliateId === selected) : [];

  return (
    <div style={{
      minHeight: "100dvh", background: "#040604",
      fontFamily: "'Inter', system-ui, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

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
              <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>Affiliate Admin</p>
            </div>
            <button onClick={() => { adminLogout(); setAuthed(false); }}
              style={{ ...S.btn("#f87171"), fontSize: 10 }}>Log Out</button>
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
        <div style={{ padding: "16px 16px 32px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={`${tab}-${selected}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>

              {/* ── OVERVIEW ── */}
              {tab === "overview" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      { label: "Active Affiliates", value: active,              icon: "✅", color: "#4ade80" },
                      { label: "Pending Review",    value: pending,             icon: "⏳", color: "#fbbf24" },
                      { label: "Total Earned (IDR)",value: fmt(totalEarned),    icon: "💰", color: "#4ade80" },
                      { label: "Pending Payout",    value: fmt(totalOwed),      icon: "💸", color: "#f87171" },
                    ].map(({ label, value, icon, color }) => (
                      <div key={label} style={S.card}>
                        <span style={{ fontSize: 22 }}>{icon}</span>
                        <p style={{ fontSize: 20, fontWeight: 900, color, margin: "6px 0 2px" }}>{value}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>{label}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ ...S.card, marginBottom: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)", margin: "0 0 10px" }}>Recent Conversions</p>
                    {allConvs.length === 0 ? (
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0 }}>No conversions yet</p>
                    ) : (
                      allConvs.slice().reverse().slice(0, 8).map((c) => (
                        <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", margin: "0 0 1px", textTransform: "capitalize" }}>{c.affiliateId} — {c.type}</p>
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

              {/* ── AFFILIATES ── */}
              {tab === "affiliates" && !selected && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: 0 }}>{affiliates.length} affiliates</p>
                    <a href="/affiliate/join" target="_blank" rel="noreferrer"
                      style={{ ...S.btn(), fontSize: 10, textDecoration: "none" }}>+ Add New</a>
                  </div>
                  {affiliates.length === 0 && (
                    <div style={{ ...S.card, textAlign: "center", padding: "28px 16px" }}>
                      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>No affiliates yet — share the join link</p>
                    </div>
                  )}
                  {affiliates.map((a) => {
                    const st = getAffiliateStats(a.id);
                    const scol = a.status === "active" ? "#4ade80" : a.status === "pending" ? "#fbbf24" : "#f87171";
                    return (
                      <div key={a.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => setSelected(a.id)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{a.name}</p>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>
                              Code: <span style={{ color: "#4ade80" }}>{a.id}</span> · {a.whatsapp}
                            </p>
                            <div style={{ display: "flex", gap: 12 }}>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>👆 {st.clicks}</span>
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>💳 {st.conversions}</span>
                              <span style={{ fontSize: 11, color: "#4ade80" }}>{fmt(st.owed)} IDR owed</span>
                            </div>
                          </div>
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 5,
                            background: `${scol}18`, color: scol, textTransform: "uppercase",
                            flexShrink: 0, marginLeft: 8,
                          }}>{a.status}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── AFFILIATE DETAIL ── */}
              {tab === "affiliates" && selected && selAffiliate && selStats && (
                <div>
                  <button onClick={() => setSelected(null)} style={{ ...S.btn(), marginBottom: 12, fontSize: 11 }}>← Back</button>
                  <div style={S.card}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>{selAffiliate.name}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>Code: <strong style={{ color: "#4ade80" }}>{selAffiliate.id}</strong></p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>Email: {selAffiliate.email}</p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 10px" }}>WhatsApp: {selAffiliate.whatsapp}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {selAffiliate.status !== "active"  && <button onClick={() => setStatus(selected, "active")}  style={S.btn("#4ade80")}>✅ Approve</button>}
                      {selAffiliate.status !== "paused"  && <button onClick={() => setStatus(selected, "paused")}  style={S.btn("#fbbf24")}>⏸ Pause</button>}
                      {selAffiliate.status !== "pending" && <button onClick={() => setStatus(selected, "pending")} style={S.btn("#94a3b8")}>⏳ Pending</button>}
                      <button onClick={() => deleteAffiliate(selected)} style={S.btn("#f87171")}>🗑 Delete</button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                    {[
                      { l: "Clicks",      v: selStats.clicks },
                      { l: "Signups",     v: selStats.signups },
                      { l: "Conversions", v: selStats.conversions },
                      { l: "Commission",  v: `${selAffiliate.commissionRate}%` },
                    ].map(({ l, v }) => (
                      <div key={l} style={S.card}>
                        <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>{v}</p>
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
                        <button onClick={() => { markAllPaid(selected); setRefresh(r => r + 1); }} style={S.btn("#4ade80")}>
                          Mark All Paid ✓
                        </button>
                      )}
                    </div>
                    {selConvs.length === 0 ? (
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>No conversions yet</p>
                    ) : selConvs.slice().reverse().map((c) => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0, textTransform: "capitalize" }}>{c.type} · {new Date(c.createdAt).toLocaleDateString("id-ID")}</p>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: c.paidOut ? "#4ade80" : "#fbbf24",
                        }}>{c.paidOut ? "✓" : ""} {fmt(c.amountIdr)} IDR</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── BANNERS ── */}
              {tab === "banners" && (
                <div>
                  {/* Add banner form */}
                  <div style={S.card}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 10px" }}>Upload Banner</p>
                    <label style={S.label}>Banner Name</label>
                    <input value={bName} onChange={(e) => setBName(e.target.value)} placeholder="e.g. Square Dark — Hotel" style={S.input} />
                    <label style={S.label}>Image URL</label>
                    <input value={bUrl} onChange={(e) => setBUrl(e.target.value)} placeholder="https://..." style={S.input} />
                    <label style={S.label}>Size</label>
                    <input value={bSize} onChange={(e) => setBSize(e.target.value)} placeholder="1080×1080" style={{ ...S.input, marginBottom: 10 }} />
                    {bUrl && <img src={bUrl} alt="preview" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} onError={(e) => (e.currentTarget.style.display = "none")} />}
                    <button onClick={addBanner} style={{
                      width: "100%", background: bSaved ? "rgba(74,222,128,0.15)" : "linear-gradient(135deg,#16a34a,#4ade80)",
                      border: bSaved ? "1px solid rgba(74,222,128,0.3)" : "none",
                      borderRadius: 10, padding: "10px 0",
                      fontSize: 13, fontWeight: 900, color: bSaved ? "#4ade80" : "#000", cursor: "pointer",
                    }}>{bSaved ? "✓ Banner Added!" : "Add Banner"}</button>
                  </div>

                  {/* Banner list */}
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
                  {banners.length === 0 && (
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "20px 0" }}>
                      No banners yet — add your first one above
                    </p>
                  )}
                </div>
              )}

              {/* ── PAYOUTS ── */}
              {tab === "payouts" && (
                <div>
                  {affiliates.filter((a) => getAffiliateStats(a.id).owed > 0).length === 0 ? (
                    <div style={{ ...S.card, textAlign: "center", padding: "28px 16px" }}>
                      <p style={{ fontSize: 32, margin: "0 0 8px" }}>✅</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#4ade80", margin: 0 }}>All payouts settled</p>
                    </div>
                  ) : (
                    affiliates.map((a) => {
                      const st = getAffiliateStats(a.id);
                      if (st.owed <= 0) return null;
                      return (
                        <div key={a.id} style={S.card}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{a.name}</p>
                              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>{a.whatsapp}</p>
                              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 6px" }}>{st.conversions} conversions</p>
                              <p style={{ fontSize: 15, fontWeight: 900, color: "#fbbf24", margin: 0 }}>
                                {fmt(st.owed)} IDR owed
                              </p>
                            </div>
                            <button
                              onClick={() => { markAllPaid(a.id); setRefresh(r => r + 1); }}
                              style={S.btn("#4ade80")}
                            >Mark Paid ✓</button>
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
