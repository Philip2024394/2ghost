import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle } from "lucide-react";
import type { GhostProfile } from "../types/ghostTypes";
import { toGhostId } from "../utils/ghostHelpers";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { isOnline } from "@/shared/hooks/useOnlineStatus";
import { getGiftsByTier } from "../types/ghostGiftSets";

export type MatchActionContext = "match" | "ilike" | "liked" | "lobby";

function readTier() {
  try { return localStorage.getItem("ghost_house_tier") as "standard"|"suite"|"kings"|"penthouse"|null; } catch { return null; }
}

export default function MatchActionPopup({
  profile, context, coinBalance,
  onClose, onConnect, onLikeBack, onGift, onPass, onNeedCoins,
}: {
  profile: GhostProfile;
  context: MatchActionContext;
  coinBalance: number;
  onClose: () => void;
  onConnect: () => void;
  onLikeBack: () => void;
  onGift: (emoji: string, coins: number) => void;
  onPass: () => void;
  onNeedCoins: () => void;
}) {
  const a = useGenderAccent();
  const online = isOnline(profile.last_seen_at);
  const ghostId = toGhostId(profile.id);
  const [sentGift, setSentGift] = useState<string | null>(null);
  const [showNeedCoins, setShowNeedCoins] = useState(false);

  const GIFTS = getGiftsByTier(readTier());
  const isLobby = context === "lobby";

  const accentColor = context === "liked" ? "#f472b6" : a.accent;
  const accentGrad  = context === "liked"
    ? "linear-gradient(to bottom, #f472b6 0%, #ec4899 40%, #db2777 100%)"
    : a.gradient;
  const accentShadow = context === "liked" ? "rgba(244,114,182,0.45)" : a.glow(0.45);

  const headline = isLobby ? "🏨 Hotel Lobby"
    : context === "match" ? "🎉 It's a Match!"
    : context === "liked" ? "💗 Liked you!"
    : "👍 You liked";

  const handleGift = (emoji: string, coins: number, key?: string) => {
    if (coinBalance < coins) {
      setShowNeedCoins(true);
      setTimeout(() => setShowNeedCoins(false), 2200);
      onNeedCoins();
      return;
    }
    setSentGift(key ?? emoji);
    onGift(emoji, coins);
    setTimeout(() => setSentGift(null), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.88)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          borderRadius: "24px 24px 0 0",
          background: isLobby ? "rgba(6,5,2,0.99)" : "rgba(8,8,12,0.98)",
          border: `1px solid ${accentColor}2a`,
          borderBottom: "none",
          overflow: "hidden",
          maxHeight: "92dvh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Top accent line */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, flexShrink: 0 }} />

        {/* Profile photo */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <img
            src={profile.image} alt={ghostId}
            style={{ width: "100%", height: 260, objectFit: "cover", display: "block" }}
            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,12,1) 0%, rgba(8,8,12,0.3) 45%, transparent 70%)" }} />

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14,
              width: 34, height: 34, borderRadius: "50%",
              background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.15)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={16} color="rgba(255,255,255,0.85)" />
          </button>

          {/* Online badge */}
          {online && (
            <div style={{
              position: "absolute", top: 14, left: 14,
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(0,0,0,0.6)", borderRadius: 20, padding: "4px 10px",
              border: "1px solid rgba(74,222,128,0.3)",
            }}>
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "block" }}
              />
              <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 700 }}>Online now</span>
            </div>
          )}

          {/* Profile info */}
          <div style={{ position: "absolute", bottom: 16, left: 18, right: 18 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: accentColor, margin: "0 0 5px", letterSpacing: "0.08em" }}>{headline}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>{profile.age}</span>
              {(profile.isVerified || profile.faceVerified) && (
                <span style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: "rgba(74,222,128,0.2)", border: "2px solid #4ade80",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 900, color: "#4ade80",
                }}>✓</span>
              )}
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{profile.city}</span>
              <span style={{ fontSize: 13 }}>{profile.countryFlag}</span>
            </div>
            <p style={{ fontSize: 10, color: `${accentColor}88`, margin: 0, fontWeight: 700, letterSpacing: "0.06em" }}>
              #{ghostId}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "16px 18px 28px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>

          {/* ── Lobby context — special layout ── */}
          {isLobby ? (
            <>
              {/* Tagline */}
              <div style={{ textAlign: "center", padding: "4px 0 2px" }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", margin: "0 0 6px", lineHeight: 1.55, fontWeight: 500 }}>
                  Right now, real people are searching the Lobby — your next connection could be a single match away.
                </p>
                <p style={{ fontSize: 11, color: "rgba(212,175,55,0.55)", margin: 0 }}>
                  Stay anonymous · No pressure · Leave any time
                </p>
              </div>

              {/* Join CTA */}
              <button
                onClick={onConnect}
                style={{
                  width: "100%", height: 56, borderRadius: 16, border: "none",
                  background: accentGrad,
                  color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  boxShadow: `0 4px 24px ${accentShadow}`,
                  letterSpacing: "0.04em",
                }}
              >
                🏨 Join the Lobby &amp; Start Your Date
              </button>

              {/* Send gift row */}
              <div>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", margin: "0 0 8px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Or send a gift first</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {GIFTS.map(g => (
                    <button
                      key={g.key}
                      onClick={() => handleGift(g.emoji, g.coins, g.key)}
                      style={{
                        flex: 1, height: 60, borderRadius: 12,
                        background: sentGift === g.key ? `${accentColor}22` : "rgba(255,255,255,0.05)",
                        border: `1.5px solid ${sentGift === g.key ? accentColor : "rgba(255,255,255,0.08)"}`,
                        cursor: "pointer", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 3,
                        transition: "all 0.15s",
                      }}
                    >
                      {g.image
                        ? <img src={g.image} alt={g.label} style={{ width: 26, height: 26, objectFit: "contain" }} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}} />
                        : <span style={{ fontSize: 18 }}>{g.emoji}</span>
                      }
                      <span style={{ fontSize: 7, fontWeight: 700, color: sentGift === g.key ? accentColor : "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.2 }}>
                        {sentGift === g.key ? "✓ Sent!" : g.label}
                      </span>
                      <span style={{ fontSize: 7, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>
                        {g.coins === 0 ? "FREE" : `${g.coins}🪙`}
                      </span>
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {showNeedCoins && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 10, color: "#f472b6", margin: "8px 0 0", textAlign: "center", fontWeight: 700 }}
                    >
                      Not enough coins — topping up…
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              {/* Gift row — for non-lobby contexts */}
              <div>
                <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: "0 0 9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  Send a gift
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  {GIFTS.map(g => (
                    <button
                      key={g.emoji}
                      onClick={() => handleGift(g.emoji, g.coins, g.key)}
                      style={{
                        flex: 1, height: 56, borderRadius: 13,
                        background: sentGift === g.emoji ? `${accentColor}22` : "rgba(255,255,255,0.05)",
                        border: `1.5px solid ${sentGift === g.emoji ? accentColor : "rgba(255,255,255,0.09)"}`,
                        cursor: "pointer", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 3,
                        transition: "all 0.15s",
                        boxShadow: sentGift === g.emoji ? `0 0 12px ${accentColor}44` : "none",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{g.emoji}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: sentGift === g.emoji ? accentColor : "rgba(255,255,255,0.4)" }}>
                        {sentGift === g.emoji ? "✓ Sent!" : `${g.coins} 🪙`}
                      </span>
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {showNeedCoins && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 10, color: "#f472b6", margin: "8px 0 0", textAlign: "center", fontWeight: 700 }}
                    >
                      Not enough coins — topping up…
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Primary CTA */}
              {context === "match" && (
                <button
                  onClick={onConnect}
                  style={{
                    width: "100%", height: 54, borderRadius: 16, border: "none",
                    background: accentGrad,
                    color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                    boxShadow: `0 4px 22px ${accentShadow}`,
                  }}
                >
                  <MessageCircle size={18} />
                  Connect &amp; Chat
                </button>
              )}

              {context === "liked" && (
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={onPass}
                    style={{
                      flex: 1, height: 54, borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.45)",
                      fontSize: 13, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <X size={15} /> Pass
                  </button>
                  <button
                    onClick={onLikeBack}
                    style={{
                      flex: 2, height: 54, borderRadius: 16, border: "none",
                      background: "linear-gradient(to bottom, #f472b6 0%, #ec4899 40%, #db2777 100%)",
                      color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      boxShadow: "0 4px 22px rgba(244,114,182,0.45)",
                    }}
                  >
                    <Heart size={17} fill="currentColor" /> Like Back
                  </button>
                </div>
              )}

              {context === "ilike" && (
                <button
                  onClick={onPass}
                  style={{
                    width: "100%", height: 46, borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.35)",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <X size={13} /> Withdraw like
                </button>
              )}
            </>
          )}

          {/* Coin balance */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(212,175,55,0.07)", border: "1px solid rgba(212,175,55,0.18)",
              borderRadius: 20, padding: "5px 16px",
            }}>
              <span style={{ fontSize: 13 }}>🪙</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(212,175,55,0.85)" }}>
                {coinBalance.toLocaleString()} coins
              </span>
            </div>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
