import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shield, Plus, Trash2, ArrowRight, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const COUNTRY_CODES = [
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+63", flag: "🇵🇭", name: "Philippines" },
  { code: "+66", flag: "🇹🇭", name: "Thailand" },
  { code: "+84", flag: "🇻🇳", name: "Vietnam" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+353", flag: "🇮🇪", name: "Ireland" },
  { code: "+1",  flag: "🇺🇸", name: "USA" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+91", flag: "🇮🇳", name: "India" },
];

const PACKAGES = [
  {
    key: 1,
    name: "Shield 1",
    emoji: "🛡️",
    desc: "Block 1 number",
    idr: "29,000",
    usd: "~$2",
    period: "per month",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.4)",
    border: "rgba(96,165,250,0.35)",
    bg: "rgba(96,165,250,0.07)",
    gradient: "linear-gradient(to bottom, #93c5fd, #60a5fa, #3b82f6)",
  },
  {
    key: 3,
    name: "Shield 3",
    emoji: "🛡️🛡️",
    desc: "Block up to 3 numbers",
    idr: "59,000",
    usd: "~$4",
    period: "per month",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.4)",
    border: "rgba(168,85,247,0.35)",
    bg: "rgba(168,85,247,0.07)",
    gradient: "linear-gradient(to bottom, #c084fc, #a855f7, #9333ea)",
    badge: "POPULAR",
  },
  {
    key: 6,
    name: "Shield 6",
    emoji: "🛡️🛡️🛡️",
    desc: "Block up to 6 numbers",
    idr: "89,000",
    usd: "~$6",
    period: "per month",
    color: "#f97316",
    glow: "rgba(249,115,22,0.4)",
    border: "rgba(251,146,60,0.35)",
    bg: "rgba(249,115,22,0.07)",
    gradient: "linear-gradient(to bottom, #fb923c, #f97316, #ea580c)",
  },
];

function getBlockedNumbers(): string[] {
  try { return JSON.parse(localStorage.getItem("ghost_blocked_numbers") || "[]"); } catch { return []; }
}
function saveBlockedNumbers(arr: string[]) {
  try { localStorage.setItem("ghost_blocked_numbers", JSON.stringify(arr)); } catch {}
}
function getBlockPackage(): number {
  try { return parseInt(localStorage.getItem("ghost_block_package") || "0", 10); } catch { return 0; }
}

export default function GhostBlockPage() {
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<number>(getBlockPackage);
  const [blocked, setBlocked] = useState<string[]>(getBlockedNumbers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const cleanNew = newPhone.replace(/\D/g, "");
  const fullNew = countryCode.code + cleanNew;
  const canAdd = cleanNew.length >= 8 && blocked.length < pkg && !blocked.includes(fullNew);

  const handleBuy = (slots: number) => {
    try {
      localStorage.setItem("ghost_block_package", String(slots));
      localStorage.setItem("ghost_block_until", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
    } catch {}
    setPkg(slots);
    setShowPurchase(false);
  };

  const handleAdd = () => {
    if (!canAdd) return;
    const next = [...blocked, fullNew];
    setBlocked(next);
    saveBlockedNumbers(next);
    setNewPhone("");
    setShowAddModal(false);
  };

  const handleDelete = (num: string) => {
    const next = blocked.filter((n) => n !== num);
    setBlocked(next);
    saveBlockedNumbers(next);
    setConfirmDelete(null);
  };

  const slotsUsed = blocked.length;
  const slotsTotal = pkg;

  return (
    <div style={{ minHeight: "100dvh", background: "#050508", color: "#fff" }}>

      {/* ── Header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "max(14px, env(safe-area-inset-top, 14px)) 16px 14px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 34, height: 34, borderRadius: 10,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "rgba(255,255,255,0.6)",
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 16, fontWeight: 900, margin: 0 }}>Ghost Shield</h1>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>Block numbers from signing in</p>
        </div>
        <Shield size={20} style={{ color: "#60a5fa" }} />
      </div>

      <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── No package bought yet ── */}
        {pkg === 0 ? (
          <>
            {/* Explainer */}
            <div style={{
              background: "rgba(96,165,250,0.06)",
              border: "1px solid rgba(96,165,250,0.2)",
              borderRadius: 16, padding: "18px 18px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🛡️</div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 8px" }}>Stay Invisible to Who Matters</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: "0 0 4px", lineHeight: 1.6 }}>
                <span>Add a WhatsApp number to your private block list.</span>
              </p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
                <span>If they try to sign in, they see a server error — not that you blocked them.</span>
              </p>
            </div>

            {/* Packages */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0, textAlign: "center" }}>
              Choose a Shield plan
            </p>
            {PACKAGES.map((p) => (
              <motion.button
                key={p.key}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleBuy(p.key)}
                style={{
                  width: "100%", borderRadius: 16, padding: "16px 18px",
                  background: p.bg, border: `1px solid ${p.border}`,
                  cursor: "pointer", textAlign: "left", position: "relative",
                  boxShadow: `0 0 30px ${p.glow}22`,
                }}
              >
                {p.badge && (
                  <div style={{
                    position: "absolute", top: 12, right: 12,
                    background: p.color, borderRadius: 6,
                    padding: "2px 8px", fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: "0.06em",
                  }}>
                    {p.badge}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 3px" }}>
                      <span>{p.emoji} {p.name}</span>
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 8px" }}>
                      <span>{p.desc}</span>
                    </p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                      <span style={{ fontSize: 22, fontWeight: 900, color: p.color }}>{p.idr}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>IDR</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>· {p.usd} · {p.period}</span>
                    </div>
                  </div>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: p.gradient,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 4px 12px ${p.glow}`, flexShrink: 0,
                  }}>
                    <ArrowRight size={16} color="#fff" strokeWidth={2.5} />
                  </div>
                </div>
              </motion.button>
            ))}
          </>
        ) : (
          <>
            {/* ── Active shield status ── */}
            {(() => {
              const activePkg = PACKAGES.find((p) => p.key === pkg)!;
              return (
                <div style={{
                  background: activePkg.bg,
                  border: `1px solid ${activePkg.border}`,
                  borderRadius: 16, padding: "14px 16px",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: activePkg.color, margin: "0 0 2px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      <span>Active · {activePkg.name}</span>
                    </p>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: 0 }}>
                      <span>{slotsUsed} of {slotsTotal} numbers blocked</span>
                    </p>
                  </div>
                  {/* Slot dots */}
                  <div style={{ display: "flex", gap: 5 }}>
                    {Array.from({ length: slotsTotal }).map((_, i) => (
                      <div key={i} style={{
                        width: 10, height: 10, borderRadius: "50%",
                        background: i < slotsUsed ? activePkg.color : "rgba(255,255,255,0.1)",
                        boxShadow: i < slotsUsed ? `0 0 6px ${activePkg.glow}` : "none",
                      }} />
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* ── Blocked numbers list ── */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 10px" }}>
                Blocked numbers
              </p>

              {blocked.length === 0 && (
                <div style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 14, padding: "20px 16px", textAlign: "center",
                }}>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                    <span>No numbers blocked yet</span>
                  </p>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {blocked.map((num) => {
                  const cc = COUNTRY_CODES.find((c) => num.startsWith(c.code)) || COUNTRY_CODES[0];
                  const local = num.slice(cc.code.length);
                  return (
                    <div key={num} style={{
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12, padding: "12px 14px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "rgba(255,255,255,0.06)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 18,
                        }}>
                          {cc.flag}
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: "0 0 1px" }}>
                            <span>{cc.code} {local}</span>
                          </p>
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                            <span>{cc.name} · Blocked</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(num)}
                        style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: "#ef4444",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Add number button ── */}
            {slotsUsed < slotsTotal && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAddModal(true)}
                style={{
                  width: "100%", height: 48, borderRadius: 14,
                  background: "rgba(96,165,250,0.08)",
                  border: "1px solid rgba(96,165,250,0.25)",
                  color: "#60a5fa", fontSize: 14, fontWeight: 800,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Plus size={16} />
                <span>Add Number to Block</span>
              </motion.button>
            )}

            {/* Upgrade if all slots used */}
            {slotsUsed >= slotsTotal && pkg < 6 && (
              <button
                onClick={() => setShowPurchase(true)}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 14,
                  background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.25)",
                  color: "rgba(192,132,252,0.8)", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", textAlign: "center",
                }}
              >
                <span>All slots used — upgrade to block more ↑</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Add number modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(6,6,10,0.98)",
                borderRadius: "20px 20px 0 0",
                border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
                padding: "20px 18px max(28px, env(safe-area-inset-bottom, 28px))",
              }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg, #60a5fa, #a855f7)", borderRadius: 4, marginBottom: 18, marginLeft: -18, marginRight: -18, marginTop: -20 }} />

              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 4px" }}>Block a Number</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "0 0 18px" }}>
                <span>They will see a server error if they try to sign in.</span>
              </p>

              {/* Country code + phone row */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <button
                  onClick={() => setShowCountryPicker(true)}
                  style={{
                    height: 46, borderRadius: 12, padding: "0 12px",
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex", alignItems: "center", gap: 6,
                    cursor: "pointer", flexShrink: 0, color: "#fff",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{countryCode.flag}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{countryCode.code}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>▾</span>
                </button>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    type="tel" inputMode="numeric"
                    placeholder="8xx xxxx xxxx"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    autoFocus
                    style={{
                      width: "100%", height: 46, borderRadius: 12,
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                      color: "#fff", fontSize: 15, paddingLeft: 16, paddingRight: 44,
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <Phone size={15} style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    color: "rgba(255,255,255,0.3)", pointerEvents: "none",
                  }} />
                </div>
              </div>

              {blocked.includes(fullNew) && (
                <p style={{ fontSize: 12, color: "#f87171", margin: "0 0 10px" }}>
                  <span>This number is already blocked.</span>
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                disabled={!canAdd}
                style={{
                  width: "100%", height: 46, borderRadius: 50, border: "none",
                  background: canAdd
                    ? "linear-gradient(to bottom, #93c5fd, #60a5fa, #3b82f6)"
                    : "rgba(255,255,255,0.07)",
                  color: canAdd ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: 14, fontWeight: 900, cursor: canAdd ? "pointer" : "default",
                  boxShadow: canAdd ? "0 4px 16px rgba(96,165,250,0.4)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <span>Block This Number</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Country picker ── */}
      <AnimatePresence>
        {showCountryPicker && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowCountryPicker(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 300,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(8,8,12,0.98)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "18px 18px 0 0",
                padding: "10px 0 max(20px, env(safe-area-inset-bottom, 20px))",
                maxHeight: "60dvh", overflowY: "auto",
              }}
            >
              <p style={{ margin: "8px 0 12px", fontSize: 14, fontWeight: 800, color: "#fff", textAlign: "center" }}>
                <span>Select Country</span>
              </p>
              {COUNTRY_CODES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => { setCountryCode(c); setShowCountryPicker(false); }}
                  style={{
                    width: "100%", padding: "13px 20px",
                    background: countryCode.code === c.code ? "rgba(96,165,250,0.08)" : "transparent",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{c.flag}</span>
                  <span style={{ flex: 1, fontSize: 14, color: "#fff", fontWeight: 600 }}>{c.name}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{c.code}</span>
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirm delete ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 400,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 320,
                background: "rgba(8,8,12,0.98)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 18, padding: "22px 20px", textAlign: "center",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>🗑️</div>
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 8px" }}>Remove Block?</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" }}>
                <span>This number will be able to sign in again.</span>
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setConfirmDelete(null)}
                  style={{
                    flex: 1, height: 42, borderRadius: 50,
                    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <span>Cancel</span>
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  style={{
                    flex: 1, height: 42, borderRadius: 50, border: "none",
                    background: "linear-gradient(to bottom, #f87171, #ef4444)",
                    color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(239,68,68,0.4)",
                  }}
                >
                  <span>Remove</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upgrade modal ── */}
      <AnimatePresence>
        {showPurchase && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowPurchase(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.78)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480,
                background: "rgba(6,6,10,0.98)",
                borderRadius: "20px 20px 0 0",
                border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
                padding: "20px 18px max(28px, env(safe-area-inset-bottom, 28px))",
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: "0 0 14px" }}>Upgrade Shield</h3>
              {PACKAGES.filter((p) => p.key > pkg).map((p) => (
                <motion.button
                  key={p.key}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBuy(p.key)}
                  style={{
                    width: "100%", borderRadius: 14, padding: "13px 16px", marginBottom: 9,
                    background: p.bg, border: `1px solid ${p.border}`,
                    cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>
                      <span>{p.emoji} {p.name} — {p.desc}</span>
                    </p>
                    <p style={{ fontSize: 12, color: p.color, margin: 0, fontWeight: 700 }}>
                      <span>{p.idr} IDR {p.usd} · {p.period}</span>
                    </p>
                  </div>
                  <ArrowRight size={16} color={p.color} strokeWidth={2.5} />
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
