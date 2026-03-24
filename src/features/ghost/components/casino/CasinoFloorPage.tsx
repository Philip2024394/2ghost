// ── Kings Floor — full social casino experience ──────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCoins } from "../../hooks/useCoins";
import CoinBalanceChip from "../CoinBalanceChip";
import BlackjackGame from "./BlackjackGame";
import SlotsGame     from "./SlotsGame";
import HighLowGame   from "./HighLowGame";
import {
  CASINO_PROFILES, TABLES, LIVE_WIN_FEED,
  STAKE_META, GAME_META, DRINK_RESPONSES, NOTE_RESPONSES,
  type CasinoProfile, type CasinoTable,
} from "./casinoData";

// ── Avatar colours ────────────────────────────────────────────────────────────
const AV_COLS = [
  "#e879f9","#a78bfa","#60a5fa","#34d399","#fbbf24",
  "#f87171","#fb923c","#4ade80","#38bdf8","#c084fc","#f472b6","#a3e635",
];
const avCol = (seed: number) => AV_COLS[seed % AV_COLS.length];

// ── Ghost Avatar ──────────────────────────────────────────────────────────────
function GhostAvatar({
  profile, size = 44, onClick,
}: { profile: CasinoProfile; size?: number; onClick?: () => void }) {
  const c = avCol(profile.seed);
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.93 } : undefined}
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: `radial-gradient(circle at 35% 35%, ${c}55, ${c}1a)`,
        border: `2px solid ${c}80`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.45, cursor: onClick ? "pointer" : "default",
        position: "relative",
      }}
    >
      👻
      {profile.online && (
        <div style={{
          position: "absolute", bottom: 1, right: 1,
          width: Math.max(8, size * 0.18), height: Math.max(8, size * 0.18),
          borderRadius: "50%", background: "#22c55e",
          border: `${Math.max(1.5, size * 0.03)}px solid #06060a`,
        }} />
      )}
    </motion.div>
  );
}

// ── High Roller Board ─────────────────────────────────────────────────────────
function HighRollerBoard({ profiles }: { profiles: CasinoProfile[] }) {
  const top3 = [...profiles].sort((a, b) => b.chips - a.chips).slice(0, 3);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div style={{
      margin: "0 0 14px",
      background: "rgba(212,175,55,0.05)",
      border: "1px solid rgba(212,175,55,0.15)",
      borderRadius: 16, padding: "12px 14px",
    }}>
      <p style={{
        margin: "0 0 10px", fontSize: 9, fontWeight: 800,
        color: "rgba(212,175,55,0.8)", letterSpacing: "0.14em", textTransform: "uppercase",
      }}>
        🏆 High Rollers Tonight
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {top3.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>{medals[i]}</span>
            <GhostAvatar profile={p} size={34} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff" }}>{p.ghostId}</p>
              <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
                {p.city} · {p.floor}
              </p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#d4af37" }}>
                🪙{p.chips.toLocaleString()}
              </p>
              {p.streak > 0 && (
                <p style={{ margin: 0, fontSize: 9, color: "#f87171" }}>
                  {"🔥".repeat(Math.min(p.streak, 3))} ×{p.streak}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Table Card ────────────────────────────────────────────────────────────────
function TableCard({
  table, profiles, onPress,
}: { table: CasinoTable; profiles: CasinoProfile[]; onPress: () => void }) {
  const seated = profiles.filter(p => table.playerIds.includes(p.id));
  const stake  = STAKE_META[table.stakes];
  const game   = GAME_META[table.game];
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
      style={{
        borderRadius: 18, overflow: "hidden", cursor: "pointer",
        background: `${table.color}08`, border: `1px solid ${table.color}25`,
        boxShadow: table.hot ? `0 0 24px ${table.color}20` : "none",
        marginBottom: 10,
      }}
    >
      <div style={{ height: 3, background: table.gradient }} />
      <div style={{ padding: "13px 15px" }}>
        {/* Name row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
          <span style={{ fontSize: 20 }}>{game.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: table.color }}>{table.name}</p>
              {table.hot && (
                <span style={{
                  fontSize: 8, fontWeight: 900, padding: "2px 6px", borderRadius: 8,
                  background: table.gradient, color: "#0a0700", letterSpacing: "0.06em",
                }}>HOT 🔥</span>
              )}
              {table.vipOnly && (
                <span style={{
                  fontSize: 8, fontWeight: 900, padding: "2px 6px", borderRadius: 8,
                  background: "rgba(232,228,208,0.12)", color: "#e8e4d0",
                }}>VIP ✦</span>
              )}
            </div>
            <p style={{ margin: "1px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
              {table.description}
            </p>
          </div>
          <span style={{ fontSize: 18, color: "rgba(255,255,255,0.18)", flexShrink: 0 }}>›</span>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 8,
            background: stake.bg, color: stake.color, letterSpacing: "0.06em",
          }}>{stake.label}</span>
          <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
            🪙{table.minBet}–{table.maxBet}
          </p>
          <div style={{ flex: 1 }} />
          {/* Avatar stack */}
          <div style={{ display: "flex", alignItems: "center" }}>
            {seated.slice(0, 4).map((p, i) => (
              <div key={p.id} style={{
                width: 22, height: 22, borderRadius: "50%",
                marginLeft: i > 0 ? -7 : 0, zIndex: seated.length - i,
                background: `radial-gradient(circle, ${avCol(p.seed)}44, ${avCol(p.seed)}11)`,
                border: `1.5px solid ${avCol(p.seed)}60`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
              }}>👻</div>
            ))}
            {seated.length > 4 && (
              <div style={{
                width: 22, height: 22, borderRadius: "50%", marginLeft: -7,
                background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.14)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, color: "rgba(255,255,255,0.45)", fontWeight: 800,
              }}>+{seated.length - 4}</div>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
            {seated.length}/{table.seats}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Seated Players Row ────────────────────────────────────────────────────────
function SeatedRow({
  profiles, onTap,
}: { profiles: CasinoProfile[]; onTap: (p: CasinoProfile) => void }) {
  if (!profiles.length) return null;
  return (
    <div style={{
      marginBottom: 14,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: "12px 14px",
    }}>
      <p style={{
        margin: "0 0 10px", fontSize: 9, fontWeight: 800,
        color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase",
      }}>
        At this table — tap to interact
      </p>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 2 }}>
        {profiles.map(p => (
          <div key={p.id} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0,
          }}>
            <GhostAvatar profile={p} size={46} onClick={() => onTap(p)} />
            <p style={{
              margin: 0, fontSize: 9, color: "rgba(255,255,255,0.4)",
              maxWidth: 50, textAlign: "center", overflow: "hidden",
              textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {p.ghostId.replace("Ghost-", "#")}
            </p>
            <p style={{ margin: 0, fontSize: 8, color: "#d4af37", fontWeight: 700 }}>
              🪙{p.chips >= 1000 ? `${(p.chips / 1000).toFixed(1)}k` : p.chips}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
type View = "floor" | "at-table";

interface SentItem {
  response: string;
  type: "drink" | "note";
}

const ENTRY_FEE = 25;
const ENTRY_KEY = "casino_entry_date";

function hasPaidEntryToday(): boolean {
  try { return localStorage.getItem(ENTRY_KEY) === new Date().toDateString(); } catch { return false; }
}
function markEntryPaid(): void {
  try { localStorage.setItem(ENTRY_KEY, new Date().toDateString()); } catch {}
}

export default function CasinoFloorPage() {
  const navigate = useNavigate();
  const { deductCoins, canAfford } = useCoins();

  const [entryPaid, setEntryPaid] = useState(hasPaidEntryToday);
  const [view, setView]                         = useState<View>("floor");
  const [activeTable, setActiveTable]           = useState<CasinoTable | null>(null);
  const [previewTable, setPreviewTable]         = useState<CasinoTable | null>(null);
  const [showTableSheet, setShowTableSheet]     = useState(false);
  const [selectedProfile, setSelectedProfile]   = useState<CasinoProfile | null>(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [feedIdx, setFeedIdx]                   = useState(0);
  const [profiles, setProfiles]                 = useState<CasinoProfile[]>(() =>
    CASINO_PROFILES.map(p => ({ ...p }))
  );
  const [sentItem, setSentItem]                 = useState<SentItem | null>(null);
  const [likes, setLikes]                       = useState<Set<string>>(new Set());
  const [matchBanner, setMatchBanner]           = useState<CasinoProfile | null>(null);

  // Live win ticker
  useEffect(() => {
    const t = setInterval(() => setFeedIdx(i => (i + 1) % LIVE_WIN_FEED.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Simulate live chip activity
  useEffect(() => {
    const t = setInterval(() => {
      setProfiles(prev => prev.map(p => {
        if (!p.online || Math.random() > 0.28) return p;
        const delta = Math.round((Math.random() - 0.44) * 350);
        return { ...p, chips: Math.max(50, p.chips + delta) };
      }));
    }, 4200);
    return () => clearInterval(t);
  }, []);

  const handleTablePress = useCallback((table: CasinoTable) => {
    setPreviewTable(table);
    setShowTableSheet(true);
  }, []);

  const handleJoinTable = useCallback(() => {
    if (!previewTable) return;
    setActiveTable(previewTable);
    setShowTableSheet(false);
    setView("at-table");
  }, [previewTable]);

  const handleBackToFloor = useCallback(() => {
    setView("floor");
    setActiveTable(null);
    setShowProfilePanel(false);
    setSelectedProfile(null);
  }, []);

  const handleProfileTap = useCallback((p: CasinoProfile) => {
    setSelectedProfile(p);
    setShowProfilePanel(true);
  }, []);

  const fireToast = (item: SentItem) => {
    setSentItem(item);
    setTimeout(() => setSentItem(null), 3500);
  };

  const triggerMatch = (p: CasinoProfile) => {
    setMatchBanner(p);
    setTimeout(() => setMatchBanner(null), 4200);
  };

  const handleSendDrink = useCallback(() => {
    if (!selectedProfile || !canAfford(10)) return;
    deductCoins(10, `Sent drink to ${selectedProfile.ghostId}`);
    const r = DRINK_RESPONSES[Math.floor(Math.random() * DRINK_RESPONSES.length)];
    fireToast({ response: `${selectedProfile.ghostId} ${r}`, type: "drink" });
    setShowProfilePanel(false);
    if (likes.has(selectedProfile.id) && Math.random() < 0.35) {
      setTimeout(() => triggerMatch(selectedProfile), 2200);
    }
  }, [selectedProfile, canAfford, deductCoins, likes]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendNote = useCallback(() => {
    if (!selectedProfile || !canAfford(15)) return;
    deductCoins(15, `Sent note to ${selectedProfile.ghostId}`);
    const r = NOTE_RESPONSES[Math.floor(Math.random() * NOTE_RESPONSES.length)];
    fireToast({ response: `${selectedProfile.ghostId} ${r}`, type: "note" });
    setShowProfilePanel(false);
  }, [selectedProfile, canAfford, deductCoins]);

  const handleLike = useCallback(() => {
    if (!selectedProfile) return;
    setLikes(prev => new Set([...prev, selectedProfile.id]));
    if (Math.random() < 0.28) {
      setTimeout(() => triggerMatch(selectedProfile), 900);
    }
    setShowProfilePanel(false);
  }, [selectedProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const seatedNow = activeTable
    ? profiles.filter(p => activeTable.playerIds.includes(p.id))
    : [];

  return (
    <div style={{
      minHeight: "100dvh", background: "#06060a", color: "#fff",
      fontFamily: "system-ui, sans-serif", position: "relative", overflowX: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 60%)",
      }} />

      {/* ── ENTRY FEE GATE ── */}
      <AnimatePresence>
        {!entryPaid && (
          <motion.div
            key="entry-gate"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 500,
              background: "rgba(6,6,10,0.97)", backdropFilter: "blur(12px)",
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", padding: "0 24px",
            }}
          >
            <motion.div
              initial={{ y: 24, scale: 0.94 }} animate={{ y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              style={{ width: "100%", maxWidth: 340, textAlign: "center" }}
            >
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎰</div>
              <p style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 900, color: "#d4af37" }}>
                Kings Floor
              </p>
              <p style={{ margin: "0 0 24px", fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                The dealer charges an entry fee to play.<br />
                Games also carry a 10% dealer rake on all winnings.
              </p>

              {/* Entry fee card */}
              <div style={{
                background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.25)",
                borderRadius: 20, padding: "20px 24px", marginBottom: 20,
              }}>
                <p style={{ margin: "0 0 4px", fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Daily Entry Fee
                </p>
                <p style={{ margin: "0 0 14px", fontSize: 38, fontWeight: 900, color: "#d4af37" }}>
                  🪙{ENTRY_FEE}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {[
                    "Access all 7 tables on the floor",
                    "Blackjack · Slots · High/Low",
                    "Send drinks & notes to other ghosts",
                    "10% dealer rake on all wins",
                  ].map(line => (
                    <div key={line} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#d4af37" }}>✦</span>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)", textAlign: "left" }}>{line}</p>
                    </div>
                  ))}
                </div>
              </div>

              {canAfford(ENTRY_FEE) ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    deductCoins(ENTRY_FEE, "Kings Floor entry fee");
                    markEntryPaid();
                    setEntryPaid(true);
                  }}
                  style={{
                    width: "100%", padding: "16px",
                    background: "linear-gradient(135deg, #92660a, #d4af37, #f0d060)",
                    border: "none", borderRadius: 16, cursor: "pointer",
                    fontSize: 15, fontWeight: 900, color: "#0a0700", marginBottom: 12,
                  }}
                >
                  Pay 🪙{ENTRY_FEE} · Enter the Floor →
                </motion.button>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                    borderRadius: 14, padding: "12px 16px", marginBottom: 12,
                  }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#f87171", fontWeight: 700 }}>
                      Not enough coins — you need 🪙{ENTRY_FEE}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(-1)}
                    style={{
                      width: "100%", padding: "14px",
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 16, cursor: "pointer", fontSize: 13, fontWeight: 800,
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    Buy Coins First
                  </motion.button>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(-1)}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, cursor: "pointer", padding: "8px 0" }}
              >
                Leave the floor
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── HEADER ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "calc(env(safe-area-inset-top,16px) + 16px) 16px 14px",
          borderBottom: "1px solid rgba(212,175,55,0.1)",
          background: "rgba(6,6,10,0.92)", backdropFilter: "blur(8px)",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={view === "at-table" ? handleBackToFloor : () => navigate(-1)}
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)", fontSize: 17, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >←</motion.button>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#d4af37" }}>
                {view === "at-table" && activeTable
                  ? `${GAME_META[activeTable.game].icon} ${activeTable.name}`
                  : "🎰 Kings Floor"}
              </p>
              <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>
                {view === "at-table"
                  ? "Tap a ghost to send a drink or note"
                  : "Live casino · Win coins · Meet ghosts"}
              </p>
            </div>
          </div>
          <CoinBalanceChip size="md" />
        </div>

        {/* ── LIVE WIN TICKER ── */}
        <div style={{
          background: "rgba(212,175,55,0.05)",
          borderBottom: "1px solid rgba(212,175,55,0.1)",
          padding: "7px 16px", overflow: "hidden",
        }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={feedIdx}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              style={{
                margin: 0, fontSize: 11, color: "#d4af37", fontWeight: 700,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}
            >
              🔴 LIVE — {LIVE_WIN_FEED[feedIdx]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* ── VIEWS ── */}
        <AnimatePresence mode="wait">

          {/* FLOOR VIEW */}
          {view === "floor" && (
            <motion.div
              key="floor"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ padding: "14px 14px calc(env(safe-area-inset-bottom,0px) + 28px)" }}
            >
              <HighRollerBoard profiles={profiles} />

              <p style={{
                margin: "0 0 10px", fontSize: 9, fontWeight: 800,
                color: "rgba(255,255,255,0.28)", letterSpacing: "0.14em", textTransform: "uppercase",
              }}>
                The Floor · {TABLES.length} tables open
              </p>

              {TABLES.map(table => (
                <TableCard
                  key={table.id}
                  table={table}
                  profiles={profiles}
                  onPress={() => handleTablePress(table)}
                />
              ))}

              <p style={{
                marginTop: 22, textAlign: "center", fontSize: 9,
                color: "rgba(255,255,255,0.14)", lineHeight: 1.6,
              }}>
                Games use coins only — not real money.<br />
                Win coins to spend on hotel features. Play responsibly.
              </p>
            </motion.div>
          )}

          {/* AT-TABLE VIEW */}
          {view === "at-table" && (
            <motion.div
              key="at-table"
              initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }}
              style={{ padding: "12px 10px calc(env(safe-area-inset-bottom,0px) + 28px)" }}
            >
              <SeatedRow profiles={seatedNow} onTap={handleProfileTap} />

              {activeTable?.game === "blackjack" && <BlackjackGame />}
              {activeTable?.game === "slots"     && <SlotsGame />}
              {activeTable?.game === "highlow"   && <HighLowGame />}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── TABLE PREVIEW SHEET ── */}
      <AnimatePresence>
        {showTableSheet && previewTable && (
          <>
            <motion.div
              key="table-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTableSheet(false)}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.62)",
                zIndex: 100, backdropFilter: "blur(4px)",
              }}
            />
            <motion.div
              key="table-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
                background: "#0f0f14",
                borderTop: `1px solid ${previewTable.color}28`,
                borderRadius: "22px 22px 0 0",
                paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 24px)",
                maxHeight: "84vh", overflowY: "auto",
              }}
            >
              <div style={{
                width: 40, height: 4, borderRadius: 2,
                background: "rgba(255,255,255,0.12)", margin: "12px auto 0",
              }} />

              <div style={{ height: 5, background: previewTable.gradient, marginTop: 14 }} />

              <div style={{ padding: "16px 18px" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: 15, flexShrink: 0,
                    background: `${previewTable.color}18`, border: `1px solid ${previewTable.color}35`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                  }}>
                    {GAME_META[previewTable.game].icon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 19, fontWeight: 900, color: previewTable.color }}>
                      {previewTable.name}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
                      {previewTable.description}
                    </p>
                  </div>
                </div>

                {/* Stats chips */}
                <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                  {[
                    { label: "Game",     value: GAME_META[previewTable.game].label },
                    { label: "Min Bet",  value: `🪙${previewTable.minBet}` },
                    { label: "Max Bet",  value: `🪙${previewTable.maxBet}` },
                    {
                      label: "Free Seats",
                      value: `${previewTable.seats - previewTable.playerIds.length} left`,
                    },
                  ].map(s => (
                    <div key={s.label} style={{
                      flex: 1, background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 10, padding: "8px 6px", textAlign: "center",
                    }}>
                      <p style={{ margin: 0, fontSize: 8, color: "rgba(255,255,255,0.28)" }}>{s.label}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 800, color: "#fff" }}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Seated profiles preview */}
                <p style={{
                  margin: "0 0 10px", fontSize: 9, fontWeight: 800,
                  color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", textTransform: "uppercase",
                }}>
                  At the Table Tonight
                </p>
                <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 6 }}>
                  {profiles.filter(p => previewTable.playerIds.includes(p.id)).map(p => (
                    <div key={p.id} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0,
                    }}>
                      <GhostAvatar profile={p} size={50} />
                      <p style={{
                        margin: 0, fontSize: 10, color: "rgba(255,255,255,0.45)",
                        maxWidth: 54, textAlign: "center",
                      }}>
                        {p.ghostId.replace("Ghost-", "#")}
                      </p>
                      <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>{p.city}</p>
                    </div>
                  ))}
                  {profiles.filter(p => previewTable.playerIds.includes(p.id)).length === 0 && (
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                      No one here yet — be first to join
                    </p>
                  )}
                </div>

                {/* CTA */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleJoinTable}
                  style={{
                    width: "100%", marginTop: 20, padding: "16px",
                    background: previewTable.gradient,
                    border: "none", borderRadius: 16, cursor: "pointer",
                    fontSize: 15, fontWeight: 900, color: "#0a0700", letterSpacing: "0.03em",
                  }}
                >
                  {previewTable.vipOnly ? "✦ Enter VIP Table" : "Join the Table →"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── PROFILE INTERACTION PANEL ── */}
      <AnimatePresence>
        {showProfilePanel && selectedProfile && (
          <>
            <motion.div
              key="profile-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowProfilePanel(false)}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.68)",
                zIndex: 200, backdropFilter: "blur(6px)",
              }}
            />
            <motion.div
              key="profile-panel"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              style={{
                position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
                background: "#0f0f14",
                borderTop: `1px solid ${avCol(selectedProfile.seed)}28`,
                borderRadius: "22px 22px 0 0",
                paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 32px)",
              }}
            >
              <div style={{
                width: 40, height: 4, borderRadius: 2,
                background: "rgba(255,255,255,0.12)", margin: "12px auto 0",
              }} />

              <div style={{ padding: "20px 20px 8px" }}>
                {/* Profile info */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                  <GhostAvatar profile={selectedProfile} size={66} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 19, fontWeight: 900, color: "#fff" }}>
                      {selectedProfile.ghostId}
                    </p>
                    <p style={{ margin: "3px 0 2px", fontSize: 12, color: "rgba(255,255,255,0.42)" }}>
                      {selectedProfile.city} · {selectedProfile.floor} Room
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                      "{selectedProfile.status}"
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <div style={{
                    flex: 1, background: "rgba(212,175,55,0.08)",
                    border: "1px solid rgba(212,175,55,0.2)",
                    borderRadius: 12, padding: "10px 12px", textAlign: "center",
                  }}>
                    <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.32)" }}>Chips</p>
                    <p style={{ margin: "3px 0 0", fontSize: 15, fontWeight: 900, color: "#d4af37" }}>
                      🪙{selectedProfile.chips.toLocaleString()}
                    </p>
                  </div>
                  <div style={{
                    flex: 1, background: selectedProfile.streak > 0
                      ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${selectedProfile.streak > 0 ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 12, padding: "10px 12px", textAlign: "center",
                  }}>
                    <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.32)" }}>Streak</p>
                    <p style={{ margin: "3px 0 0", fontSize: 15, fontWeight: 900, color: selectedProfile.streak > 0 ? "#f87171" : "rgba(255,255,255,0.25)" }}>
                      {selectedProfile.streak > 0 ? `🔥×${selectedProfile.streak}` : "—"}
                    </p>
                  </div>
                  <div style={{
                    flex: 1,
                    background: `${selectedProfile.floorColor}10`,
                    border: `1px solid ${selectedProfile.floorColor}28`,
                    borderRadius: 12, padding: "10px 12px", textAlign: "center",
                  }}>
                    <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.32)" }}>Floor</p>
                    <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 900, color: selectedProfile.floorColor }}>
                      {selectedProfile.floor}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendDrink}
                    disabled={!canAfford(10)}
                    style={{
                      flex: 1, padding: "14px 8px",
                      background: canAfford(10)
                        ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${canAfford(10) ? "rgba(212,175,55,0.28)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 14, cursor: canAfford(10) ? "pointer" : "not-allowed",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>🍸</span>
                    <p style={{
                      margin: 0, fontSize: 11, fontWeight: 800,
                      color: canAfford(10) ? "#d4af37" : "rgba(255,255,255,0.2)",
                    }}>
                      Send Drink
                    </p>
                    <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>🪙10</p>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendNote}
                    disabled={!canAfford(15)}
                    style={{
                      flex: 1, padding: "14px 8px",
                      background: canAfford(15)
                        ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${canAfford(15) ? "rgba(139,92,246,0.28)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 14, cursor: canAfford(15) ? "pointer" : "not-allowed",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>📝</span>
                    <p style={{
                      margin: 0, fontSize: 11, fontWeight: 800,
                      color: canAfford(15) ? "#a78bfa" : "rgba(255,255,255,0.2)",
                    }}>
                      Send Note
                    </p>
                    <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>🪙15</p>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLike}
                    style={{
                      flex: 1, padding: "14px 8px",
                      background: likes.has(selectedProfile.id)
                        ? "rgba(244,63,94,0.14)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${likes.has(selectedProfile.id)
                        ? "rgba(244,63,94,0.35)" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: 14, cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>
                      {likes.has(selectedProfile.id) ? "❤️" : "🤍"}
                    </span>
                    <p style={{
                      margin: 0, fontSize: 11, fontWeight: 800,
                      color: likes.has(selectedProfile.id) ? "#f43f5e" : "rgba(255,255,255,0.35)",
                    }}>
                      {likes.has(selectedProfile.id) ? "Liked" : "Like"}
                    </p>
                    <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.28)" }}>Free</p>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── SENT ITEM TOAST ── */}
      <AnimatePresence>
        {sentItem && (
          <motion.div
            key="sent-toast"
            initial={{ opacity: 0, y: 32, scale: 0.9 }}
            animate={{ opacity: 1, y: 0,  scale: 1   }}
            exit={  { opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: "fixed",
              bottom: "calc(env(safe-area-inset-bottom,0px) + 96px)",
              left: 16, right: 16, zIndex: 300,
              background: "rgba(14,14,20,0.96)", backdropFilter: "blur(12px)",
              border: `1px solid ${sentItem.type === "drink"
                ? "rgba(212,175,55,0.28)" : "rgba(139,92,246,0.28)"}`,
              borderRadius: 20, padding: "13px 18px",
              display: "flex", alignItems: "center", gap: 12,
            }}
          >
            <span style={{ fontSize: 24, flexShrink: 0 }}>
              {sentItem.type === "drink" ? "🍸" : "📝"}
            </span>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>
              {sentItem.response}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MATCH BANNER ── */}
      <AnimatePresence>
        {matchBanner && (
          <motion.div
            key="match-banner"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMatchBanner(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 400,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(0,0,0,0.72)", backdropFilter: "blur(10px)",
              padding: "0 20px",
            }}
          >
            <motion.div
              initial={{ y: 30, scale: 0.88 }} animate={{ y: 0, scale: 1 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: "linear-gradient(145deg, #130a2a, #2d1b69, #130a2a)",
                border: "1px solid rgba(167,139,250,0.35)",
                borderRadius: 28, padding: "32px 26px", textAlign: "center", width: "100%", maxWidth: 320,
              }}
            >
              <div style={{ fontSize: 52, marginBottom: 10 }}>✨</div>
              <p style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 900, color: "#a78bfa" }}>
                It's a Match!
              </p>
              <p style={{ margin: "0 0 22px", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                You and {matchBanner.ghostId} connected at the casino
              </p>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 24,
              }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 58, height: 58, borderRadius: "50%",
                    background: "rgba(167,139,250,0.18)", border: "2px solid rgba(167,139,250,0.35)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                  }}>👤</div>
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>You</p>
                </div>
                <span style={{ fontSize: 32 }}>💜</span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <GhostAvatar profile={matchBanner} size={58} />
                  <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                    {matchBanner.ghostId.replace("Ghost-", "#")}
                  </p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => setMatchBanner(null)}
                style={{
                  width: "100%", padding: "15px",
                  background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
                  border: "none", borderRadius: 15, cursor: "pointer",
                  fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 10,
                }}
              >
                Open Vault Chat →
              </motion.button>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                Tap outside to dismiss
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
