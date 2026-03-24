// ── Breakfast Lounge ─────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCoins } from "../hooks/useCoins";
import CoinBalanceChip from "../components/CoinBalanceChip";

const LOUNGE_IMG   = "https://ik.imagekit.io/7grri5v7d/mmmmmdfgdsfgdfg.png";
const INVITE_COST  = 15;
const ROTATE_MIN   = 5 * 60 * 1000;  // 5 min
const ROTATE_MAX   = 10 * 60 * 1000; // 10 min
const TABLE_KEY    = "ghost_breakfast_table";

// ── Avatar colours ────────────────────────────────────────────────────────────
const AV_COLS = [
  "#e879f9","#a78bfa","#60a5fa","#34d399","#fbbf24",
  "#f87171","#fb923c","#4ade80","#38bdf8","#c084fc","#f472b6","#a3e635",
];
const avCol = (seed: number) => AV_COLS[seed % AV_COLS.length];

// ── Profile pool ──────────────────────────────────────────────────────────────
interface LoungeProfile {
  id: string; seed: number; ghostId: string;
  city: string; floor: string; floorColor: string;
  mood: string; gender: "m" | "f";
}

const POOL: LoungeProfile[] = [
  { id:"bl1",  seed:3,  ghostId:"Ghost-4821", city:"Dubai",      floor:"Penthouse", floorColor:"#e8e4d0", mood:"Early riser ☀️",         gender:"f" },
  { id:"bl2",  seed:7,  ghostId:"Ghost-7734", city:"Milan",      floor:"Casino",    floorColor:"#d4af37", mood:"Coffee first, talk later", gender:"m" },
  { id:"bl3",  seed:12, ghostId:"Ghost-2093", city:"Tokyo",      floor:"Ensuite",   floorColor:"#cd7f32", mood:"Love a good croissant 🥐", gender:"f" },
  { id:"bl4",  seed:18, ghostId:"Ghost-9901", city:"Barcelona",  floor:"Casino",    floorColor:"#d4af37", mood:"Morning person 🌅",         gender:"f" },
  { id:"bl5",  seed:25, ghostId:"Ghost-5588", city:"London",     floor:"Standard",  floorColor:"#c0c0c0", mood:"Just arrived ✈️",           gender:"m" },
  { id:"bl6",  seed:35, ghostId:"Ghost-3312", city:"Paris",      floor:"Penthouse", floorColor:"#e8e4d0", mood:"Reading the paper 📰",      gender:"f" },
  { id:"bl7",  seed:48, ghostId:"Ghost-8847", city:"Riyadh",     floor:"Casino",    floorColor:"#d4af37", mood:"Espresso, no sugar",        gender:"m" },
  { id:"bl8",  seed:54, ghostId:"Ghost-1199", city:"Athens",     floor:"Ensuite",   floorColor:"#cd7f32", mood:"Watching the sunrise 🌄",   gender:"f" },
  { id:"bl9",  seed:64, ghostId:"Ghost-6622", city:"New York",   floor:"Casino",    floorColor:"#d4af37", mood:"Catching up on emails",     gender:"m" },
  { id:"bl10", seed:72, ghostId:"Ghost-4490", city:"Beirut",     floor:"Loft",      floorColor:"#a78bfa", mood:"Pancakes or bust 🥞",       gender:"f" },
  { id:"bl11", seed:83, ghostId:"Ghost-0011", city:"Bogotá",     floor:"Standard",  floorColor:"#c0c0c0", mood:"First morning here 🏨",     gender:"m" },
  { id:"bl12", seed:92, ghostId:"Ghost-7712", city:"Cairo",      floor:"Ensuite",   floorColor:"#cd7f32", mood:"Loves the quiet hours",     gender:"f" },
  { id:"bl13", seed:15, ghostId:"Ghost-3390", city:"Dublin",     floor:"Loft",      floorColor:"#a78bfa", mood:"Full Irish please 🍳",       gender:"m" },
  { id:"bl14", seed:29, ghostId:"Ghost-5501", city:"Singapore",  floor:"Penthouse", floorColor:"#e8e4d0", mood:"Green tea & silence 🍵",    gender:"f" },
  { id:"bl15", seed:41, ghostId:"Ghost-2287", city:"Berlin",     floor:"Casino",    floorColor:"#d4af37", mood:"People watching 👀",         gender:"m" },
];

const TIME_SLOTS = ["8:00 am","8:30 am","9:00 am","9:30 am","10:00 am","10:30 am","11:00 am"];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getActiveTable(): { guestId: string; guestName: string; slot: string } | null {
  try {
    const raw = localStorage.getItem(TABLE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function setActiveTable(guestId: string, guestName: string, slot: string) {
  try { localStorage.setItem(TABLE_KEY, JSON.stringify({ guestId, guestName, slot })); } catch {}
}

function buildVisible(): { profile: LoungeProfile; status: "available" | "at-table"; tableWith?: string }[] {
  const shuffled = [...POOL].sort(() => Math.random() - 0.5).slice(0, 9);
  return shuffled.map((p, i) => {
    if (i < 6) return { profile: p, status: "available" };
    const partner = POOL.find(q => q.id !== p.id && Math.random() > 0.5);
    return { profile: p, status: "at-table", tableWith: partner?.ghostId ?? "Ghost-XXXX" };
  });
}

function getMorningTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ p, size = 48 }: { p: LoungeProfile; size?: number }) {
  const c = avCol(p.seed);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `radial-gradient(circle at 35% 35%, ${c}55, ${c}1a)`,
      border: `2px solid ${c}80`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.42,
    }}>👻</div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BreakfastLoungePage() {
  const navigate = useNavigate();
  const { deductCoins, canAfford } = useCoins();

  const [clock, setClock]         = useState(getMorningTime);
  const [visible, setVisible]     = useState(buildVisible);
  const [countdown, setCountdown] = useState(() => ROTATE_MIN + Math.random() * (ROTATE_MAX - ROTATE_MIN));
  const [myTable, setMyTable]     = useState(getActiveTable);

  const [inviteTarget, setInviteTarget] = useState<LoungeProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[2]);
  const [note, setNote]                 = useState("");
  const [sent, setSent]                 = useState(false);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setClock(getMorningTime()), 30000);
    return () => clearInterval(t);
  }, []);

  // Countdown + rotation
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1000) {
          setVisible(buildVisible());
          return ROTATE_MIN + Math.random() * (ROTATE_MAX - ROTATE_MIN);
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const handleInvite = useCallback(() => {
    if (!inviteTarget || !canAfford(INVITE_COST)) return;
    deductCoins(INVITE_COST, `Breakfast invite to ${inviteTarget.ghostId}`);
    setActiveTable(inviteTarget.id, inviteTarget.ghostId, selectedSlot);
    setMyTable({ guestId: inviteTarget.id, guestName: inviteTarget.ghostId, slot: selectedSlot });
    setSent(true);
    setTimeout(() => {
      setInviteTarget(null);
      setSent(false);
      setNote("");
    }, 2200);
  }, [inviteTarget, canAfford, deductCoins, selectedSlot]);

  const fmtCountdown = () => {
    const mins = Math.floor(countdown / 60000);
    const secs = Math.floor((countdown % 60000) / 1000);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const available = visible.filter(v => v.status === "available");
  const atTable   = visible.filter(v => v.status === "at-table");

  return (
    <div style={{
      minHeight: "100dvh", background: "#08080e", color: "#fff",
      fontFamily: "system-ui, sans-serif", overflowX: "hidden",
    }}>

      {/* ── HERO BANNER ── */}
      <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
        <img
          src={LOUNGE_IMG} alt="Breakfast Lounge"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 30%" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(8,8,14,0.25) 0%, rgba(8,8,14,0.85) 100%)",
        }} />
        {/* Header over image */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top,16px) + 12px) 16px 0",
        }}>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => navigate(-1)}
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ←
          </motion.button>
          <CoinBalanceChip size="md" />
        </div>
        {/* Title over image */}
        <div style={{ position: "absolute", bottom: 16, left: 18 }}>
          <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Ghost Hotel
          </p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
            🍳 Breakfast Lounge
          </p>
        </div>
        {/* Time badge */}
        <div style={{
          position: "absolute", bottom: 20, right: 16,
          background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20, padding: "5px 12px",
        }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{clock}</p>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "16px 14px calc(env(safe-area-inset-bottom,0px) + 28px)" }}>

        {/* Your table */}
        {myTable ? (
          <div style={{
            background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.25)",
            borderRadius: 16, padding: "13px 16px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>🍽️</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: "#4ade80" }}>
                Your table is set
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                {myTable.guestName} is joining you at {myTable.slot}
              </p>
            </div>
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={() => { localStorage.removeItem(TABLE_KEY); setMyTable(null); }}
              style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer" }}>
              Cancel
            </motion.button>
          </div>
        ) : (
          <div style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "12px 16px", marginBottom: 16,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>🪑</span>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              Your table is empty — invite a guest for breakfast
            </p>
          </div>
        )}

        {/* Refresh countdown */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Available Now
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "3px 10px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
              Floor refreshes in {fmtCountdown()}
            </p>
          </div>
        </div>

        {/* Available profiles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {available.map(({ profile: p }) => (
            <motion.div
              key={p.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => { if (!myTable) { setInviteTarget(p); setSelectedSlot(TIME_SLOTS[2]); setNote(""); } }}
              style={{
                display: "flex", alignItems: "center", gap: 13,
                padding: "12px 14px", borderRadius: 16, cursor: myTable ? "default" : "pointer",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                opacity: myTable && myTable.guestId !== p.id ? 0.5 : 1,
              }}
            >
              <Avatar p={p} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{p.ghostId}</p>
                <p style={{ margin: "2px 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  {p.city} · {p.floor}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
                  "{p.mood}"
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 20, padding: "2px 8px" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80" }} />
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "#4ade80" }}>Available</p>
                </div>
                {!myTable && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Tap to invite</span>}
              </div>
            </motion.div>
          ))}
        </div>

        {/* At a Table */}
        {atTable.length > 0 && (
          <>
            <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
              At a Table
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {atTable.map(({ profile: p, tableWith }) => (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 13,
                  padding: "10px 14px", borderRadius: 14,
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                  opacity: 0.5,
                }}>
                  <Avatar p={p} size={38} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>
                      {p.ghostId}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                      Sitting with {tableWith}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)", borderRadius: 20, padding: "2px 8px" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f87171" }} />
                    <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: "#f87171" }}>At a table</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── INVITE SHEET ── */}
      <AnimatePresence>
        {inviteTarget && (
          <>
            <motion.div
              key="invite-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setInviteTarget(null); setSent(false); }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 100, backdropFilter: "blur(6px)" }}
            />
            <motion.div
              key="invite-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
                background: "#0f0f16", borderRadius: "22px 22px 0 0",
                border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none",
                paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 28px)",
              }}
            >
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)", margin: "12px auto 0" }} />

              <div style={{ padding: "16px 18px" }}>
                {/* Profile header */}
                <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 18 }}>
                  <Avatar p={inviteTarget} size={54} />
                  <div>
                    <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#fff" }}>{inviteTarget.ghostId}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
                      {inviteTarget.city} · {inviteTarget.floor} Floor
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                      "{inviteTarget.mood}"
                    </p>
                  </div>
                </div>

                {/* Time slot picker */}
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Choose a time
                </p>
                <div style={{ display: "flex", gap: 7, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
                  {TIME_SLOTS.map(slot => (
                    <motion.button
                      key={slot} whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        flexShrink: 0, padding: "8px 14px", borderRadius: 20, cursor: "pointer",
                        background: selectedSlot === slot ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${selectedSlot === slot ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: selectedSlot === slot ? "#d4af37" : "rgba(255,255,255,0.45)",
                        fontSize: 12, fontWeight: 700,
                      }}
                    >{slot}</motion.button>
                  ))}
                </div>

                {/* Optional note */}
                <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Add a note <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "rgba(255,255,255,0.2)" }}>— optional</span>
                </p>
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="e.g. I'll be by the window…"
                  maxLength={80}
                  style={{
                    width: "100%", height: 44, borderRadius: 12, boxSizing: "border-box",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff", fontSize: 13, padding: "0 14px", outline: "none", marginBottom: 18,
                  }}
                />

                {/* CTA */}
                <AnimatePresence mode="wait">
                  {sent ? (
                    <motion.div
                      key="sent"
                      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "16px", background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 16 }}
                    >
                      <span style={{ fontSize: 20 }}>🍳</span>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#4ade80" }}>
                        Invite sent for {selectedSlot}!
                      </p>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="send" whileTap={{ scale: 0.97 }}
                      onClick={handleInvite}
                      disabled={!canAfford(INVITE_COST)}
                      style={{
                        width: "100%", padding: "16px",
                        background: canAfford(INVITE_COST)
                          ? "linear-gradient(135deg, #78350f, #d97706, #fbbf24)"
                          : "rgba(255,255,255,0.05)",
                        border: canAfford(INVITE_COST) ? "none" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 16, cursor: canAfford(INVITE_COST) ? "pointer" : "not-allowed",
                        fontSize: 15, fontWeight: 900,
                        color: canAfford(INVITE_COST) ? "#0a0500" : "rgba(255,255,255,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      }}
                    >
                      <span>🍳</span>
                      <span>Invite to Breakfast · {selectedSlot}</span>
                      <span style={{ fontSize: 11, opacity: 0.7 }}>· 🪙{INVITE_COST}</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
