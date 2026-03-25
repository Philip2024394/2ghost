import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Upload, X, Link, Check } from "lucide-react";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { InboxItem, RoomTier } from "./ghostRoomTypes";
import { loadInbox, saveInbox } from "./ghostRoomHelpers";

// ── Send media to another Room Vault ─────────────────────────────────────────
export function SendMediaPanel({
  myGhostId, myImages, myVideoUrls, cardStyle, inputStyle, roomTier,
}: {
  myGhostId: string;
  myImages: string[];
  myVideoUrls: string[];
  cardStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  roomTier: RoomTier;
}) {
  const a = useGenderAccent();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [sendType, setSendType] = useState<"image" | "video" | "note">("image");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [noteText, setNoteText] = useState("");
  const [caption, setCaption] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const imgRef = useRef<HTMLInputElement>(null);

  const handlePickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Also allow picking from own room images
  const pickFromRoom = (src: string) => {
    setSelectedImage(src);
    setSendType("image");
  };
  const pickVideoFromRoom = (url: string) => {
    setVideoUrl(url);
    setSendType("video");
  };

  const handleSend = () => {
    const target = targetId.trim();
    if (!target.startsWith("Guest-")) { setError("Enter a valid Guest ID (e.g. Guest-4821)"); return; }
    if (target === myGhostId) { setError("You can't send to yourself"); return; }

    let content = "";
    if (sendType === "note") {
      if (!noteText.trim()) { setError("Write a memory note first"); return; }
      content = noteText.trim();
    } else {
      content = sendType === "image" ? (selectedImage || "") : videoUrl;
      if (!content) { setError(sendType === "image" ? "Select an image first" : "Paste a video URL first"); return; }
    }

    setSending(true);
    setError("");
    setTimeout(() => {
      const item: InboxItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderGhostId: myGhostId,
        type: sendType,
        content,
        sentAt: Date.now(),
        status: "pending",
        note: sendType !== "note" && caption.trim() ? caption.trim() : undefined,
      };
      const existing = loadInbox(target);
      saveInbox(target, [...existing, item]);
      setSending(false);
      setSent(true);
      setTargetId("");
      setSelectedImage(null);
      setVideoUrl("");
      setNoteText("");
      setCaption("");
      setTimeout(() => { setSent(false); setOpen(false); }, 2000);
    }, 800);
  };

  // Free users cannot send — show locked state with upgrade CTA
  if (roomTier === "free") {
    return (
      <div style={{ ...cardStyle, borderColor: a.glow(0.12), position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: 0 }}>Send to Room Vault</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Ghost Ensuite & Gold Penthouse</p>
          </div>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 14px", lineHeight: 1.6 }}>
          Send photos, videos and memory notes directly into someone's private vault. Upgrade to unlock.
        </p>
        <button
          onClick={() => navigate("/ghost/pricing")}
          style={{
            width: "100%", background: `linear-gradient(135deg, ${a.accentDark}, ${a.accent})`,
            border: "none", borderRadius: 12, padding: "11px 0",
            fontSize: 13, fontWeight: 900, color: "#000", cursor: "pointer",
          }}
        >
          Upgrade to Send →
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: 0 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📤</span>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Send Media to a Room Vault</p>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>▾</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}
          >
            <div style={{ paddingTop: 14 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 12px" }}>
                Enter the recipient's Guest ID — they'll receive a notification in their Inbox tab to accept or decline.
              </p>

              {/* Target Guest ID */}
              <input
                style={{ ...inputStyle, marginBottom: 10 }}
                placeholder="Guest-XXXX (recipient's ID)"
                value={targetId}
                onChange={(e) => { setTargetId(e.target.value.toUpperCase()); setError(""); }}
              />

              {/* Type toggle */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {([["image","🖼️ Photo"], ["video","🎬 Video"], ["note","💬 Memory"]] as const).map(([t, label]) => (
                  <button key={t} onClick={() => setSendType(t)}
                    style={{ flex: 1, height: 36, borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 11,
                      background: sendType === t ? a.glow(0.15) : "rgba(255,255,255,0.04)",
                      color: sendType === t ? a.glow(0.95) : "rgba(255,255,255,0.4)",
                      outline: sendType === t ? `1px solid ${a.glow(0.3)}` : "none",
                    }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Image picker */}
              {sendType === "image" && (
                <div>
                  <input ref={imgRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePickImage} />
                  {selectedImage ? (
                    <div style={{ position: "relative", marginBottom: 10 }}>
                      <img src={selectedImage} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 10, display: "block" }} />
                      <button onClick={() => setSelectedImage(null)}
                        style={{ position: "absolute", top: 6, right: 6, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => imgRef.current?.click()}
                      style={{ width: "100%", height: 64, borderRadius: 12, border: `1.5px dashed ${a.glow(0.3)}`, background: a.glow(0.04), color: a.glow(0.6), cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
                      <Upload size={14} /> Upload Image
                    </motion.button>
                  )}
                  {/* Or pick from own room */}
                  {myImages.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 6px" }}>Or pick from your room:</p>
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                        {myImages.map((src, i) => (
                          <img key={i} src={src} alt="" onClick={() => pickFromRoom(src)}
                            style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", cursor: "pointer", flexShrink: 0, border: selectedImage === src ? `2px solid ${a.glow(0.8)}` : "2px solid transparent" }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Video URL */}
              {sendType === "video" && (
                <div>
                  <div style={{ position: "relative", marginBottom: videoUrl ? 8 : 0 }}>
                    <Link size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                    <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="Paste video URL..."
                      value={videoUrl} onChange={(e) => { setVideoUrl(e.target.value); setError(""); }} />
                  </div>
                  {/* Or pick from own room */}
                  {myVideoUrls.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 6px" }}>Or pick from your room:</p>
                      {myVideoUrls.map((url, i) => (
                        <button key={i} onClick={() => pickVideoFromRoom(url)}
                          style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: `1px solid ${videoUrl === url ? a.glow(0.4) : "rgba(255,255,255,0.08)"}`, background: videoUrl === url ? a.glow(0.08) : "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.6)", fontSize: 11, textAlign: "left", cursor: "pointer", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          🎬 {url}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Caption for video */}
                  <input
                    style={{ ...inputStyle, marginTop: 8 }}
                    placeholder="Add a caption or memory note (optional)"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                  />
                </div>
              )}

              {/* Caption for image */}
              {sendType === "image" && (selectedImage || myImages.length > 0) && (
                <input
                  style={{ ...inputStyle, marginBottom: 0, marginTop: 8 }}
                  placeholder="Add a caption or memory note (optional)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              )}

              {/* Memory note — text only send */}
              {sendType === "note" && (
                <div>
                  <textarea
                    placeholder="Write a memory, message, or thought to save in their vault..."
                    value={noteText}
                    onChange={(e) => { setNoteText(e.target.value); setError(""); }}
                    rows={4}
                    style={{
                      width: "100%", borderRadius: 12,
                      background: "rgba(255,255,255,0.06)", border: `1px solid ${a.glow(0.25)}`,
                      color: "#fff", fontSize: 14, padding: "12px 14px",
                      outline: "none", resize: "none", boxSizing: "border-box",
                      lineHeight: 1.6, fontFamily: "inherit",
                    }}
                  />
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "4px 0 0", textAlign: "right" }}>
                    {noteText.length} chars · text only, stored privately in their vault
                  </p>
                </div>
              )}

              {error && <p style={{ fontSize: 11, color: "#f87171", margin: "6px 0", fontWeight: 700 }}>✕ {error}</p>}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={sending || sent}
                style={{ width: "100%", height: 44, borderRadius: 12, border: "none", marginTop: 10, cursor: sending || sent ? "default" : "pointer",
                  background: sent ? a.glow(0.2) : sending ? a.glow(0.3) : `linear-gradient(135deg,${a.accentDark},${a.accentMid})`,
                  color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {sent ? (
                  <><Check size={14} /> Sent — they'll see it in their Inbox</>
                ) : sending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                ) : (
                  <>📤 Send to {targetId || "Guest-XXXX"}</>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Small helper: paste a video URL and confirm ───────────────────────────────
export function VideoUrlInput({ onAdd, inputStyle }: { onAdd: (url: string) => void; inputStyle: React.CSSProperties }) {
  const a = useGenderAccent();
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ flex: 1, position: "relative" }}>
        <Link size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
        <input
          style={{ ...inputStyle, paddingLeft: 34 }}
          placeholder="Paste video URL..."
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) { onAdd(val); setVal(""); } }}
        />
      </div>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => { if (val.trim()) { onAdd(val); setVal(""); } }}
        style={{ height: 46, borderRadius: 12, padding: "0 14px", border: "none", background: `linear-gradient(135deg,${a.accentDark},${a.accentMid})`, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
      >
        Add
      </motion.button>
    </div>
  );
}
