/**
 * DateInvitePopup
 * Mr. Butlas bottom-sheet popup shown when a guest receives a date invite.
 * Shows inviter profile + place card (expandable inline preview).
 * Accept → queues contact reveal for inviter.
 * Decline → dismisses.
 *
 * Also handles the SENDER side: "Accepted" notification + coin unlock flow.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DateInvite } from "../hooks/useDateInvites";
import { acceptDateInvite, declineDateInvite, unlockDateContact } from "../hooks/useDateInvites";
import { useCoins } from "../hooks/useCoins";

const BUTLAS_IMG  = "https://ik.imagekit.io/7grri5v7d/ewrwerwerwer-removebg-preview.png?updatedAt=1774288645920";
const UNLOCK_COST = 50; // coins

const CONTACT_LABELS: Record<string, string> = {
  chat:    "💬 In-app Chat",
  video:   "📹 Video Call",
  outside: "📱 WhatsApp / Phone",
};

// ── Shared backdrop + sheet wrapper ───────────────────────────────────────────
function Sheet({ children, onDismiss }: { children: React.ReactNode; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onDismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 9500,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "linear-gradient(180deg, #0c0608 0%, #060304 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderTop: "2px solid rgba(220,20,20,0.4)",
          borderRadius: "24px 24px 0 0",
          padding: "8px 22px max(44px, env(safe-area-inset-bottom, 44px))",
          maxHeight: "92dvh", overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(220,20,20,0.6)", margin: "12px auto 20px" }} />
        {children}
      </motion.div>
    </motion.div>
  );
}

// ── Avatar helper ──────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 64 }: { src?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return (
      <img src={src} alt={name} onError={() => setErr(true)}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(220,20,20,0.4)" }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #b80000, #3a0000)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 900, color: "#fff",
      border: "2px solid rgba(220,20,20,0.4)",
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ── RECIPIENT popup: incoming invite ──────────────────────────────────────────
interface RecipientProps {
  invite: DateInvite;
  onDismiss: () => void;
}

export function DateInviteReceivedPopup({ invite, onDismiss }: RecipientProps) {
  const [placeOpen,  setPlaceOpen]  = useState(false);
  const [responded,  setResponded]  = useState<"accepted" | "declined" | null>(null);
  const [loading,    setLoading]    = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    await acceptDateInvite(invite.id).catch(() => {});
    setLoading(false);
    setResponded("accepted");
  };

  const handleDecline = async () => {
    await declineDateInvite(invite.id).catch(() => {});
    setResponded("declined");
    setTimeout(onDismiss, 1200);
  };

  return (
    <Sheet onDismiss={() => {}}>
      {/* Mr. Butlas header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <img src={BUTLAS_IMG} alt="Mr. Butlas" style={{ width: 58, height: 58, objectFit: "contain", flexShrink: 0 }} />
        <div>
          <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.85)", letterSpacing: "0.14em" }}>MR. BUTLAS</p>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)" }}>Date Invitation</p>
        </div>
        <motion.button whileTap={{ scale: 0.88 }} onClick={onDismiss}
          style={{ marginLeft: "auto", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          ✕
        </motion.button>
      </div>

      {/* Response state */}
      {responded === "accepted" && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: "center", padding: "12px 0 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🥂</div>
          <p style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>Invitation Accepted!</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "0 0 24px" }}>
            Mr. Butlas has informed <strong style={{ color: "#fff" }}>{invite.from_name}</strong> that you accepted. They will unlock your contact shortly.
          </p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onDismiss}
            style={{ width: "100%", height: 48, borderRadius: 50, border: "none", background: "linear-gradient(135deg, #b80000, #e01010)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
            Back to Feed
          </motion.button>
        </motion.div>
      )}

      {responded === "declined" && (
        <div style={{ textAlign: "center", padding: "12px 0 20px" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: 0 }}>Invitation declined.</p>
        </div>
      )}

      {!responded && (
        <>
          {/* Inviter profile card */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 16, padding: "14px 16px", marginBottom: 14,
          }}>
            <Avatar src={invite.from_image} name={invite.from_name} size={60} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 2px", fontSize: 17, fontWeight: 900, color: "#fff" }}>
                {invite.from_name}
                {invite.from_age ? <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginLeft: 6 }}>{invite.from_age}</span> : null}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                {invite.from_flag} {invite.from_city}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 10, color: "rgba(220,20,20,0.6)", fontWeight: 700, letterSpacing: "0.06em" }}>
                Guest ID: {invite.from_guest_id}
              </p>
            </div>
          </div>

          {/* Invite message */}
          <div style={{ background: "rgba(220,20,20,0.07)", border: "1px solid rgba(220,20,20,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>
              <span style={{ color: "#f87171", fontWeight: 800 }}>{invite.from_name}</span> is inviting you to visit a place together:
            </p>
          </div>

          {/* Place card — expandable */}
          <motion.div
            onClick={() => setPlaceOpen(o => !o)}
            whileTap={{ scale: 0.98 }}
            style={{
              borderRadius: 16, overflow: "hidden", marginBottom: 20, cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ position: "relative", height: placeOpen ? 200 : 110, transition: "height 0.3s" }}>
              <img src={invite.post_image} alt={invite.post_title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 40%, transparent)" }} />
              <div style={{ position: "absolute", bottom: 12, left: 14, right: 14 }}>
                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 900, color: "#fff" }}>{invite.post_title}</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>📍 {invite.post_location}</p>
              </div>
              <div style={{ position: "absolute", top: 10, right: 12, background: "rgba(0,0,0,0.55)", borderRadius: 8, padding: "3px 8px", fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
                {placeOpen ? "▲ less" : "▼ view place"}
              </div>
            </div>
          </motion.div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleDecline}
              style={{
                flex: 1, height: 52, borderRadius: 50, border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)",
                fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>
              Decline
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleAccept} disabled={loading}
              style={{
                flex: 2, height: 52, borderRadius: 50, border: "none",
                background: loading ? "rgba(220,20,20,0.4)" : "linear-gradient(135deg, #b80000, #e01010)",
                color: "#fff", fontSize: 15, fontWeight: 900, cursor: loading ? "default" : "pointer",
                boxShadow: "0 4px 20px rgba(220,20,20,0.35)",
              }}>
              {loading ? "Accepting…" : "Accept Invitation 🥂"}
            </motion.button>
          </div>
        </>
      )}
    </Sheet>
  );
}

// ── SENDER popup: "they accepted — unlock contact" ────────────────────────────
interface SenderProps {
  invite: DateInvite;
  onDismiss: () => void;
}

export function DateInviteAcceptedPopup({ invite, onDismiss }: SenderProps) {
  const { balance, deductCoins } = useCoins();
  const [unlocked,  setUnlocked]  = useState(false);
  const [paying,    setPaying]    = useState(false);
  const [noCoins,   setNoCoins]   = useState(false);

  const handleUnlock = async () => {
    if (balance < UNLOCK_COST) { setNoCoins(true); return; }
    setPaying(true);
    const ok = deductCoins(UNLOCK_COST, `Unlock contact — ${invite.post_title}`);
    if (ok) {
      await unlockDateContact(invite.id).catch(() => {});
      setUnlocked(true);
    }
    setPaying(false);
  };

  const contactLabel = CONTACT_LABELS[invite.accepted_contact_pref || ""] || "Contact";

  return (
    <Sheet onDismiss={onDismiss}>
      {/* Mr. Butlas header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <img src={BUTLAS_IMG} alt="Mr. Butlas" style={{ width: 58, height: 58, objectFit: "contain", flexShrink: 0 }} />
        <div>
          <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.85)", letterSpacing: "0.14em" }}>MR. BUTLAS</p>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)" }}>Date Accepted</p>
        </div>
        <motion.button whileTap={{ scale: 0.88 }} onClick={onDismiss}
          style={{ marginLeft: "auto", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
          ✕
        </motion.button>
      </div>

      {/* Who accepted */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
        <p style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: "0 0 6px" }}>
          Invitation Accepted!
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: 0 }}>
          A guest has accepted your invite to <strong style={{ color: "#fff" }}>{invite.post_title}</strong>
        </p>
      </div>

      {/* Place card */}
      <div style={{ display: "flex", gap: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "12px 14px", marginBottom: 20, alignItems: "center" }}>
        <img src={invite.post_image} alt={invite.post_title}
          style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
        <div>
          <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 800, color: "#fff" }}>{invite.post_title}</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>📍 {invite.post_location}</p>
        </div>
      </div>

      {/* Contact unlock */}
      {unlocked ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: "rgba(220,20,20,0.1)", border: "1px solid rgba(220,20,20,0.35)", borderRadius: 16, padding: "16px 18px", marginBottom: 20 }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: "rgba(220,20,20,0.7)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Contact Unlocked 🔓
          </p>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{contactLabel}</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "0.04em" }}>
            {invite.accepted_contact_value || "—"}
          </p>
        </motion.div>
      ) : (
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "16px 18px", marginBottom: 20 }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Contact Method
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#fff" }}>{contactLabel}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "8px 12px" }}>
            <span style={{ fontSize: 22, letterSpacing: 6, color: "rgba(255,255,255,0.15)" }}>••••••••</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>🔒 locked</span>
          </div>
          {noCoins && (
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "#ef4444" }}>Not enough coins. Top up to unlock.</p>
          )}
        </div>
      )}

      {!unlocked && (
        <>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleUnlock} disabled={paying}
            style={{
              width: "100%", height: 52, borderRadius: 50, border: "none",
              background: paying ? "rgba(220,20,20,0.4)" : "linear-gradient(135deg, #b80000, #e01010)",
              color: "#fff", fontSize: 15, fontWeight: 900, cursor: paying ? "default" : "pointer",
              boxShadow: "0 4px 20px rgba(220,20,20,0.3)", marginBottom: 10,
            }}>
            {paying ? "Processing…" : `Unlock Contact — ${UNLOCK_COST} 🪙`}
          </motion.button>
          <p style={{ textAlign: "center", margin: 0, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
            Balance: {balance} coins
          </p>
        </>
      )}
      {unlocked && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={onDismiss}
          style={{ width: "100%", height: 48, borderRadius: 50, border: "none", background: "linear-gradient(135deg, #b80000, #e01010)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
          Done
        </motion.button>
      )}
    </Sheet>
  );
}
