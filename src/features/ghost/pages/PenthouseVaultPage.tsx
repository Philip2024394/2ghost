import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  loadVaultMessages, saveVaultMessage, loadPenthouseMatches,
  savePenthouseMatches, isVaultArchived,
} from "../utils/penthouseHelpers";
import type { PenthouseVaultMessage, PenthouseMatch } from "../types/penthouseTypes";
import { PENTHOUSE_VAULT_MSG_COST, PENTHOUSE_NOTE_MAX_CHARS } from "../types/penthouseTypes";

function readCoins(): number  { try { return Number(localStorage.getItem("ghost_coins") || "0"); } catch { return 0; } }
function writeCoins(n: number): void { try { localStorage.setItem("ghost_coins", String(n)); } catch {} }

const CLOSURE_MESSAGE =
  "She has gracefully closed this connection. She thanks you sincerely for your interest and the moments shared — sometimes a spark simply finds its own path. Wishing you well. 🥂";

export default function PenthouseVaultPage() {
  const navigate    = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch]       = useState<PenthouseMatch | null>(null);
  const [messages, setMessages] = useState<PenthouseVaultMessage[]>([]);
  const [text, setText]         = useState("");
  const [coinBalance, setCoinBalance] = useState(readCoins);
  const [sending, setSending]   = useState(false);
  const [showClose, setShowClose] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId) return;
    const matches = loadPenthouseMatches();
    const found   = matches.find((m) => m.id === matchId) ?? null;
    setMatch(found);
    setMessages(loadVaultMessages(matchId));
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canSend = text.trim().length >= 2 && coinBalance >= PENTHOUSE_VAULT_MSG_COST && !sending && match && !isVaultArchived(match);

  const handleSend = () => {
    if (!canSend || !matchId || !match) return;
    setSending(true);
    const msg: PenthouseVaultMessage = {
      id: `vm-${Date.now()}`,
      matchId,
      fromId: "me",
      isFromMan: true,
      text: text.trim(),
      coinsPaid: PENTHOUSE_VAULT_MSG_COST,
      sentAt: Date.now(),
    };
    saveVaultMessage(matchId, msg);
    const next = Math.max(0, coinBalance - PENTHOUSE_VAULT_MSG_COST);
    writeCoins(next);
    setCoinBalance(next);
    // Update lastActivityAt
    const matches = loadPenthouseMatches();
    const idx     = matches.findIndex((m) => m.id === matchId);
    if (idx >= 0) { matches[idx].lastActivityAt = Date.now(); savePenthouseMatches(matches); }
    setMessages((prev) => [...prev, msg]);
    setText("");
    setSending(false);
  };

  const handleCloseConnection = () => {
    if (!matchId || !match) return;
    const closureMsg: PenthouseVaultMessage = {
      id: `vm-closure-${Date.now()}`,
      matchId,
      fromId: match.womanProfileId,
      isFromMan: false,
      text: CLOSURE_MESSAGE,
      coinsPaid: 0,
      sentAt: Date.now(),
      isClosure: true,
    };
    saveVaultMessage(matchId, closureMsg);
    const matches = loadPenthouseMatches();
    const idx     = matches.findIndex((m) => m.id === matchId);
    if (idx >= 0) { matches[idx].isArchived = true; savePenthouseMatches(matches); }
    setMessages((prev) => [...prev, closureMsg]);
    setMatch((prev) => prev ? { ...prev, isArchived: true } : null);
    setShowClose(false);
  };

  const archived  = match ? isVaultArchived(match) : false;
  const isClosed  = match?.isArchived ?? false;

  return (
    <div style={{
      height: "100dvh", background: "#08060200",
      backgroundImage: "radial-gradient(ellipse at top, rgba(212,175,55,0.04) 0%, transparent 60%), #08060299",
      backgroundColor: "#080602",
      color: "#fff", fontFamily: "inherit",
      display: "flex", flexDirection: "column",
    }}>
      {/* Top bar */}
      <div style={{
        background: "rgba(8,6,2,0.97)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(212,175,55,0.12)",
        padding: "12px 16px 10px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: 480, margin: "0 auto" }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 18, cursor: "pointer", padding: 0 }}>←</button>
          {match && (
            <>
              <img src={match.womanPhoto} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(212,175,55,0.4)" }} onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: 0 }}>{match.womanName}</p>
                <p style={{ fontSize: 9, color: isClosed ? "rgba(239,68,68,0.6)" : archived ? "rgba(255,255,255,0.2)" : "rgba(212,175,55,0.5)", margin: 0, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {isClosed ? "Connection closed" : archived ? "Archived — 30 days inactive" : "Penthouse Vault"}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 8, padding: "3px 8px" }}>
                <span style={{ fontSize: 11 }}>🪙</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: "#d4af37", fontVariantNumeric: "tabular-nums" }}>{coinBalance}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", scrollbarWidth: "none" } as React.CSSProperties}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Welcome note */}
          <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
            <span style={{ fontSize: 20 }}>🔓</span>
            <p style={{ fontSize: 11, color: "rgba(212,175,55,0.5)", margin: "6px 0 0", fontStyle: "italic" }}>
              You're connected. Every message costs 🪙{PENTHOUSE_VAULT_MSG_COST}. Make them count.
            </p>
          </div>

          {messages.length === 0 && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", margin: "20px 0", fontStyle: "italic" }}>
              No messages yet. Send the first one.
            </p>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                justifyContent: msg.isClosure ? "center" : msg.isFromMan ? "flex-end" : "flex-start",
              }}
            >
              {msg.isClosure ? (
                <div style={{
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 14, padding: "12px 16px", maxWidth: "88%", textAlign: "center",
                }}>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.65, fontStyle: "italic" }}>{msg.text}</p>
                </div>
              ) : (
                <div style={{
                  maxWidth: "75%", borderRadius: msg.isFromMan ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "10px 14px",
                  background: msg.isFromMan
                    ? "linear-gradient(135deg, rgba(180,140,30,0.25), rgba(212,175,55,0.15))"
                    : "rgba(255,255,255,0.07)",
                  border: msg.isFromMan
                    ? "1px solid rgba(212,175,55,0.3)"
                    : "1px solid rgba(255,255,255,0.08)",
                }}>
                  <p style={{ fontSize: 13, color: "#fff", margin: "0 0 4px", lineHeight: 1.55 }}>{msg.text}</p>
                  <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", margin: 0, textAlign: "right" }}>
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {msg.isFromMan && <span style={{ marginLeft: 6, color: "rgba(212,175,55,0.4)" }}>🪙{msg.coinsPaid}</span>}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      {!isClosed && !archived && (
        <div style={{
          background: "rgba(8,6,2,0.97)", backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(212,175,55,0.1)",
          padding: "12px 16px max(16px,env(safe-area-inset-bottom,16px))",
          flexShrink: 0,
        }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, PENTHOUSE_NOTE_MAX_CHARS))}
                placeholder="Write a message… (500 chars)"
                rows={2}
                style={{
                  flex: 1, borderRadius: 14, border: "1px solid rgba(212,175,55,0.2)",
                  background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13,
                  padding: "10px 12px", resize: "none", outline: "none", fontFamily: "inherit",
                  lineHeight: 1.5,
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={handleSend}
                  disabled={!canSend}
                  style={{
                    width: 44, height: 44, borderRadius: 12, border: "none",
                    background: canSend
                      ? "linear-gradient(135deg, #92660a, #d4af37)"
                      : "rgba(255,255,255,0.06)",
                    color: canSend ? "#000" : "rgba(255,255,255,0.2)",
                    fontSize: 16, cursor: canSend ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >→</motion.button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontVariantNumeric: "tabular-nums" }}>
                {text.length}/{PENTHOUSE_NOTE_MAX_CHARS} · 🪙{PENTHOUSE_VAULT_MSG_COST} per message
              </span>
              <button
                onClick={() => setShowClose(true)}
                style={{ background: "none", border: "none", fontSize: 9, color: "rgba(255,100,100,0.35)", cursor: "pointer", fontWeight: 700 }}
              >
                Close connection
              </button>
            </div>
          </div>
        </div>
      )}

      {(isClosed || archived) && (
        <div style={{
          background: "rgba(8,6,2,0.97)", borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "16px", textAlign: "center", flexShrink: 0,
        }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", margin: "0 0 8px" }}>
            {isClosed ? "This connection has been closed" : "Archived after 30 days of inactivity"}
          </p>
          <button onClick={() => navigate("/ghost/penthouse")} style={{ background: "none", border: "none", color: "rgba(212,175,55,0.5)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Return to the floor →
          </button>
        </div>
      )}

      {/* Close connection confirmation */}
      <AnimatePresence>
        {showClose && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowClose(false)}
            style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(16px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          >
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 480, background: "rgba(10,8,4,0.99)",
                borderRadius: "22px 22px 0 0", border: "1px solid rgba(212,175,55,0.15)", borderBottom: "none",
                padding: "24px 22px max(28px,env(safe-area-inset-bottom,28px))",
              }}
            >
              <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>Close this connection?</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 22px", lineHeight: 1.6 }}>
                A farewell message will be sent and the vault will be locked. This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowClose(false)} style={{ flex: 1, height: 46, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCloseConnection}
                  style={{ flex: 1, height: 46, borderRadius: 12, border: "none", background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
                >
                  Yes, close connection
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
