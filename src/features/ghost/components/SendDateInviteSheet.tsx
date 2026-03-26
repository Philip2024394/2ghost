/**
 * SendDateInviteSheet
 * Bottom sheet for sending a date invite from a feed post card.
 * Option A: invite the post's author directly.
 * Option B: invite any guest by their Guest ID.
 * Sends via ghost_date_invites Supabase table.
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sendDateInvite } from "../hooks/useDateInvites";

const BUTLAS_IMG = "https://ik.imagekit.io/7grri5v7d/ewrwerwerwer-removebg-preview.png?updatedAt=1774288645920";

function getMyProfile() {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    return {
      ghost_id: p.ghost_id || p.phone || "guest",
      name:     p.name || p.display_name || "Ghost",
      age:      p.age || 0,
      city:     p.city || "",
      flag:     p.country_flag || p.countryFlag || "",
      image:    p.image || p.profile_image || "",
    };
  } catch {
    return { ghost_id: "guest", name: "Ghost", age: 0, city: "", flag: "", image: "" };
  }
}

export interface PostRef {
  id: string;
  title: string;
  image: string;
  location: string;
  authorId: string;
  authorName: string;
}

interface Props {
  show: boolean;
  post: PostRef;
  onClose: () => void;
}

export default function SendDateInviteSheet({ show, post, onClose }: Props) {
  const me = getMyProfile();
  const [mode,     setMode]     = useState<"choose" | "poster" | "guest">("choose");
  const [guestId,  setGuestId]  = useState("");
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState("");

  const handleClose = () => {
    setMode("choose"); setGuestId(""); setSending(false); setSent(false); setError("");
    onClose();
  };

  const send = async (toId: string, toName: string) => {
    if (!toId.trim()) { setError("Please enter a Guest ID"); return; }
    if (toId === me.ghost_id) { setError("You can't invite yourself"); return; }
    setSending(true); setError("");
    const { error: err } = await sendDateInvite({
      from_guest_id: me.ghost_id,
      from_name:     me.name,
      from_age:      me.age,
      from_city:     me.city,
      from_flag:     me.flag,
      from_image:    me.image,
      to_guest_id:   toId.trim(),
      post_id:       post.id,
      post_title:    post.title,
      post_image:    post.image,
      post_location: post.location,
    });
    setSending(false);
    if (err) { setError("Couldn't send invite. Try again."); return; }
    setSent(true);
  };

  const invitePoster = () => send(post.authorId, post.authorName);
  const inviteGuest  = () => send(guestId, `Guest ${guestId}`);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: "fixed", inset: 0, zIndex: 9400,
            background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
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
              padding: "8px 22px max(40px, env(safe-area-inset-bottom, 40px))",
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(220,20,20,0.6)", margin: "12px auto 20px" }} />

            {/* Mr. Butlas header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <img src={BUTLAS_IMG} alt="Mr. Butlas" style={{ width: 52, height: 52, objectFit: "contain", flexShrink: 0 }} />
              <div>
                <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 900, color: "rgba(212,175,55,0.85)", letterSpacing: "0.14em" }}>MR. BUTLAS</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Send a Date Invitation</p>
              </div>
            </div>

            {/* Place card */}
            <div style={{ display: "flex", gap: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14, padding: "12px 14px", marginBottom: 22, alignItems: "center" }}>
              <img src={post.image} alt={post.title}
                style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>📍 {post.location}</p>
              </div>
            </div>

            {/* Sent state */}
            {sent ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: "center", padding: "8px 0 12px" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>💌</div>
                <p style={{ fontSize: 17, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>Invitation Sent!</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, margin: "0 0 24px" }}>
                  Mr. Butlas will deliver your invitation. You'll be notified when they accept.
                </p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleClose}
                  style={{ width: "100%", height: 48, borderRadius: 50, border: "none", background: "linear-gradient(135deg, #b80000, #e01010)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                  Done
                </motion.button>
              </motion.div>
            ) : mode === "choose" ? (
              <>
                <p style={{ margin: "0 0 14px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Who would you like to invite?</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Invite poster */}
                  {post.authorId !== me.ghost_id && (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setMode("poster")}
                      style={{
                        width: "100%", height: 58, borderRadius: 16, border: "1px solid rgba(220,20,20,0.3)",
                        background: "rgba(220,20,20,0.08)", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 14, padding: "0 18px",
                        textAlign: "left" as const,
                      }}>
                      <span style={{ fontSize: 22 }}>👤</span>
                      <div>
                        <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 800, color: "#fff" }}>Invite {post.authorName}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>The person who posted this idea</p>
                      </div>
                    </motion.button>
                  )}
                  {/* Invite by Guest ID */}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setMode("guest")}
                    style={{
                      width: "100%", height: 58, borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 14, padding: "0 18px",
                      textAlign: "left" as const,
                    }}>
                    <span style={{ fontSize: 22 }}>🔢</span>
                    <div>
                      <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 800, color: "#fff" }}>Invite by Guest ID</p>
                      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Enter any guest's ID to invite them</p>
                    </div>
                  </motion.button>
                </div>
                <button onClick={handleClose}
                  style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "16px 0 0" }}>
                  Cancel
                </button>
              </>
            ) : mode === "poster" ? (
              <>
                <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                  Send a date invite to <strong style={{ color: "#fff" }}>{post.authorName}</strong>. They'll receive a notification from Mr. Butlas and can accept or decline.
                </p>
                {error && <p style={{ margin: "-6px 0 10px", fontSize: 11, color: "#ef4444" }}>{error}</p>}
                <motion.button whileTap={{ scale: 0.97 }} onClick={invitePoster} disabled={sending}
                  style={{
                    width: "100%", height: 52, borderRadius: 50, border: "none",
                    background: sending ? "rgba(220,20,20,0.4)" : "linear-gradient(135deg, #b80000, #e01010)",
                    color: "#fff", fontSize: 15, fontWeight: 900, cursor: sending ? "default" : "pointer",
                    boxShadow: "0 4px 20px rgba(220,20,20,0.3)", marginBottom: 10,
                  }}>
                  {sending ? "Sending…" : `Invite ${post.authorName} 💌`}
                </motion.button>
                <button onClick={() => setMode("choose")}
                  style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}>
                  ← Back
                </button>
              </>
            ) : (
              <>
                <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Enter Guest ID</p>
                <input
                  value={guestId}
                  onChange={e => setGuestId(e.target.value)}
                  placeholder="e.g. GH-291047"
                  autoFocus
                  style={{
                    width: "100%", height: 48, borderRadius: 12, border: error ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)", color: "#fff",
                    fontSize: 14, padding: "0 14px", outline: "none", boxSizing: "border-box", marginBottom: 8,
                  }}
                />
                {error && <p style={{ margin: "0 0 10px", fontSize: 11, color: "#ef4444" }}>{error}</p>}
                <p style={{ margin: "0 0 16px", fontSize: 11, color: "rgba(255,255,255,0.25)", lineHeight: 1.5 }}>
                  They'll receive a Mr. Butlas notification and can choose to accept.
                </p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={inviteGuest} disabled={sending}
                  style={{
                    width: "100%", height: 52, borderRadius: 50, border: "none",
                    background: sending ? "rgba(220,20,20,0.4)" : "linear-gradient(135deg, #b80000, #e01010)",
                    color: "#fff", fontSize: 15, fontWeight: 900, cursor: sending ? "default" : "pointer",
                    boxShadow: "0 4px 20px rgba(220,20,20,0.3)", marginBottom: 10,
                  }}>
                  {sending ? "Sending…" : "Send Invitation 💌"}
                </motion.button>
                <button onClick={() => setMode("choose")}
                  style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "6px 0" }}>
                  ← Back
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
