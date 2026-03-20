import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Upload, X, Link, Users, Lock, Unlock, Image, Video, ShieldOff, Copy, Check, MessageCircle, ChevronRight, Settings } from "lucide-react";
import { uploadGhostImage, deleteGhostImage, uploadGhostVideo, deleteGhostVideo, isSupabaseStorageUrl } from "../ghostStorage";

const ROOM_BG = "https://ik.imagekit.io/7grri5v7d/ghost%20roomssadasdasdfasdfasdf.png";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/ChatGPT%20Image%20Mar%2020,%202026,%2002_03_38%20AM.png";
const SESSION_KEY   = "ghost_room_session_until";
const SESSION_TTL   = 24 * 60 * 60 * 1000; // 24 hours
const WA_STORED_KEY = "ghost_room_whatsapp";
const ROOM_SUB_KEY  = "ghost_room_sub_until";

function hasRoomSub(): boolean {
  try { return Number(localStorage.getItem(ROOM_SUB_KEY) || 0) > Date.now(); } catch { return false; }
}
function activateRoomSub() {
  try { localStorage.setItem(ROOM_SUB_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000)); } catch {}
}

function isSessionValid(): boolean {
  try { return Number(localStorage.getItem(SESSION_KEY) || 0) > Date.now(); } catch { return false; }
}
function startSession() {
  try { localStorage.setItem(SESSION_KEY, String(Date.now() + SESSION_TTL)); } catch {}
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}

// ── Mock OTP sender — replace with real WhatsApp API call in production ───────
function mockSendOtp(phone: string): string {
  // In production: POST /api/ghost-room/send-otp { phone }
  // For dev: deterministic 6-digit code from phone number
  let h = 0;
  const seed = phone + String(Math.floor(Date.now() / 60000)); // changes every minute
  for (let i = 0; i < seed.length; i++) { h = Math.imul(31, h) + seed.charCodeAt(i) | 0; }
  return String(100000 + Math.abs(h) % 900000);
}

// ── Ghost Vault subscription paywall ──────────────────────────────────────────
function RoomPaywall({ onPaid }: { onPaid: () => void }) {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: "100dvh", width: "100%",
      backgroundImage: `url(${ROOM_BG})`,
      backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
      padding: "0 16px max(36px, env(safe-area-inset-bottom, 36px))",
    }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(4,5,8,0.82)", zIndex: 0 }} />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 480,
          background: "rgba(4,6,4,0.97)",
          border: "1px solid rgba(74,222,128,0.2)",
          borderRadius: 24, padding: "28px 22px 24px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 60px rgba(74,222,128,0.08)",
          marginBottom: 8,
        }}
      >
        <div style={{ height: 3, background: "linear-gradient(90deg, #16a34a, #4ade80, #22c55e)", borderRadius: "4px 4px 0 0", marginLeft: -22, marginRight: -22, marginTop: -28, marginBottom: 24 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <img src={GHOST_LOGO} alt="ghost" style={{ width: 52, height: 52, objectFit: "contain" }} />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: 0 }}>Ghost Vault</h2>
            <p style={{ fontSize: 11, color: "rgba(74,222,128,0.7)", margin: 0, fontWeight: 600 }}>Private shared space · media storage</p>
          </div>
        </div>

        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: "0 0 18px" }}>
          Ghost Vault stores your shared photos and videos on secure private servers. Storage has a real cost — so Ghost Vault requires a small subscription for everyone, including women.
        </p>

        <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
          {[
            "Private photo & video sharing with your match",
            "Files auto-delete — nothing stored permanently",
            "End-to-end private — no one else can access",
            "One room per connection — clean and simple",
          ].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
              <span style={{ color: "#4ade80", fontSize: 12, marginTop: 1, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 20 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#4ade80" }}>19,000</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>IDR / month</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>· ~$1.20 · everyone pays</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { activateRoomSub(); onPaid(); }}
          style={{
            width: "100%", height: 52, borderRadius: 50, border: "none",
            background: "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
            color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
            boxShadow: "0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 28px rgba(34,197,94,0.45)",
            position: "relative", overflow: "hidden", marginBottom: 12,
          }}
        >
          <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
          Unlock Ghost Vault — 19,000 IDR
        </motion.button>

        <button
          onClick={() => navigate(-1)}
          style={{ width: "100%", background: "none", border: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, cursor: "pointer", padding: "4px 0" }}
        >
          Go back
        </button>
      </motion.div>
    </div>
  );
}

// ── WhatsApp Auth Gate ────────────────────────────────────────────────────────
function GhostRoomAuthGate({ onVerified }: { onVerified: () => void }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState(() => {
    try { return localStorage.getItem(WA_STORED_KEY) || ""; } catch { return ""; }
  });
  const [generatedCode, setGeneratedCode] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const [digits, setDigits] = useState(["","","","","",""]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSend = useCallback(() => {
    const cleaned = phone.replace(/\s/g, "");
    if (cleaned.length < 8) { setError("Enter a valid WhatsApp number"); return; }
    setSending(true);
    setError("");
    // Simulate network delay
    setTimeout(() => {
      const code = mockSendOtp(cleaned);
      setGeneratedCode(code);
      try { localStorage.setItem(WA_STORED_KEY, cleaned); } catch {}
      setSending(false);
      setStep("code");
      setResendCooldown(60);
    }, 1200);
  }, [phone]);

  const handleDigit = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError("");
    if (val && idx < 5) codeRefs[idx + 1].current?.focus();
    if (next.every((d) => d !== "")) {
      const entered = next.join("");
      if (entered === generatedCode) {
        startSession();
        onVerified();
      } else {
        setError("Wrong code — check your WhatsApp and try again");
        setDigits(["","","","","",""]);
        codeRefs[0].current?.focus();
      }
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      codeRefs[idx - 1].current?.focus();
    }
  };

  return (
    <div translate="no" style={{
      minHeight: "100dvh", width: "100%",
      backgroundImage: `url(${ROOM_BG})`,
      backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", flexDirection: "column",
    }}>
      {/* Dark overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(2px)" }} />

      {/* Back button */}
      <div style={{ position: "relative", zIndex: 2, padding: "max(16px, env(safe-area-inset-top,16px)) 16px 0" }}>
        <button
          onClick={() => navigate("/ghost/mode")}
          style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)" }}
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      {/* Centre card */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", position: "relative", zIndex: 2 }}>

        {/* Ghost icon + title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 32 }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ marginBottom: 12, filter: "drop-shadow(0 0 20px rgba(74,222,128,0.4))" }}
          >
            <img src={GHOST_LOGO} alt="ghost" style={{ width: 168, height: 168, objectFit: "contain" }} />
          </motion.div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Ghost Vault
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", margin: 0 }}>
            {step === "phone"
              ? "Enter your WhatsApp to receive your access code"
              : `Code sent to ${phone} via WhatsApp`}
          </p>
        </motion.div>

        {/* Auth card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{
            width: "100%", maxWidth: 360,
            background: "rgba(5,5,8,0.88)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(74,222,128,0.2)", borderRadius: 22,
            padding: "24px 22px",
          }}
        >
          <AnimatePresence mode="wait">

            {/* Step 1 — phone number */}
            {step === "phone" && (
              <motion.div key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MessageCircle size={16} color="rgba(74,222,128,0.9)" />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", margin: 0 }}>WhatsApp Verification</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: 0 }}>Required every 24 hours</p>
                  </div>
                </div>

                <div style={{ position: "relative", marginBottom: 12 }}>
                  <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>📱</span>
                  <input
                    type="tel"
                    placeholder="+62 812 3456 7890"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                    style={{
                      width: "100%", height: 50, borderRadius: 13,
                      background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                      color: "#fff", fontSize: 16, padding: "0 14px 0 42px",
                      outline: "none", boxSizing: "border-box", letterSpacing: "0.02em",
                    }}
                  />
                </div>

                {error && (
                  <p style={{ fontSize: 11, color: "#f87171", margin: "0 0 10px", fontWeight: 700 }}>✕ {error}</p>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSend}
                  disabled={sending}
                  style={{
                    width: "100%", height: 50, borderRadius: 13, border: "none",
                    background: sending ? "rgba(74,222,128,0.3)" : "linear-gradient(135deg, #16a34a, #22c55e)",
                    color: "#fff", fontSize: 15, fontWeight: 900, cursor: sending ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    boxShadow: sending ? "none" : "0 4px 20px rgba(34,197,94,0.4)",
                  }}
                >
                  {sending ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                    />
                  ) : (
                    <>
                      <MessageCircle size={16} />
                      <span>Send Code via WhatsApp</span>
                    </>
                  )}
                </motion.button>

                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "12px 0 0", textAlign: "center" }}>
                  Your number is never shown to other users
                </p>
              </motion.div>
            )}

            {/* Step 2 — enter OTP */}
            {step === "code" && (
              <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", margin: "0 0 4px" }}>
                    Enter the 6-digit code
                  </p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                    Sent to <span style={{ color: "rgba(74,222,128,0.8)", fontWeight: 700 }}>{phone}</span>
                  </p>
                </div>

                {/* DEV ONLY: show code for testing */}
                {generatedCode && (
                  <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, padding: "7px 12px", marginBottom: 14, textAlign: "center" }}>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "0 0 2px" }}>DEV — your code</p>
                    <p style={{ fontSize: 22, fontWeight: 900, color: "rgba(74,222,128,0.9)", margin: 0, letterSpacing: "0.25em" }}>{generatedCode}</p>
                  </div>
                )}

                {/* 6-digit input */}
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={codeRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigit(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      style={{
                        width: 44, height: 52, borderRadius: 12, textAlign: "center",
                        background: d ? "rgba(74,222,128,0.12)" : "rgba(255,255,255,0.07)",
                        border: `1px solid ${d ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.12)"}`,
                        color: "#fff", fontSize: 22, fontWeight: 900, outline: "none",
                        transition: "all 0.15s",
                      }}
                    />
                  ))}
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ fontSize: 11, color: "#f87171", margin: "0 0 10px", fontWeight: 700, textAlign: "center" }}>
                    ✕ {error}
                  </motion.p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    onClick={() => { setStep("phone"); setDigits(["","","","","",""]); setError(""); }}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", padding: 0 }}
                  >
                    <span>← Change number</span>
                  </button>
                  {resendCooldown > 0 ? (
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      onClick={handleSend}
                      style={{ background: "none", border: "none", color: "rgba(74,222,128,0.8)", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <span>Resend code</span> <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(74,222,128,0.7)" }} />
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>
            Code expires in 60 seconds · Session lasts 24 hours
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
type RoomRequest = {
  ghostId: string;   // Ghost-XXXX of requesting user
  name: string;      // display name (ghost alias)
  requestedAt: number;
  status: "pending" | "granted" | "denied";
};

type ShareAccessType = "image" | "video" | "both";

type AccessedRoom = {
  ghostId: string;        // Ghost-XXXX of room owner
  roomCode: string;       // code used to access
  accessType: ShareAccessType;
  grantedAt: number;
  images: string[];
  videoUrls: string[];
};

type GhostMatch = {
  id: string;
  profile: {
    id: string; name: string; age: number; city: string;
    countryFlag: string; image: string; gender: string;
  };
  matchedAt: number;
};

// ── Inbox types ───────────────────────────────────────────────────────────────
type InboxItem = {
  id: string;
  senderGhostId: string;
  type: "image" | "video";
  content: string;     // base64 for image, URL for video
  sentAt: number;
  status: "pending" | "accepted" | "declined";
};

function inboxKey(ghostId: string) { return `ghost_room_inbox_${ghostId}`; }
function loadInbox(ghostId: string): InboxItem[] { return loadJson(inboxKey(ghostId), []); }
function saveInbox(ghostId: string, items: InboxItem[]) { saveJson(inboxKey(ghostId), items); }

// ── Storage tiers (tied to Ghost Rooms subscription) ──────────────────────────
type RoomTier = "free" | "suite" | "gold";

const ROOM_TIERS: Record<RoomTier, {
  label: string; price: string;
  images: number; videos: number;
  imageMaxMB: number; videoMaxMB: number; videoMaxSec: number;
  imageFormats: string; videoFormats: string;
  badge: string; color: string;
}> = {
  free: {
    label: "Seller Room", price: "Free",
    images: 3,  videos: 1,
    imageMaxMB: 5,   videoMaxMB: 30,  videoMaxSec: 30,
    imageFormats: "JPG · PNG · WEBP (max 5 MB each)",
    videoFormats: "MP4 · MOV · WEBM (max 30 MB · 30 sec)",
    badge: "👻", color: "rgba(255,255,255,0.4)",
  },
  suite: {
    label: "Ghost Suite", price: "$4.99/mo",
    images: 10, videos: 3,
    imageMaxMB: 10,  videoMaxMB: 100, videoMaxSec: 120,
    imageFormats: "JPG · PNG · WEBP (max 10 MB each)",
    videoFormats: "MP4 · MOV · WEBM (max 100 MB · 2 min)",
    badge: "🏨", color: "rgba(74,222,128,0.9)",
  },
  gold: {
    label: "Gold Room",   price: "$9.99/mo",
    images: 50, videos: 10,
    imageMaxMB: 20,  videoMaxMB: 300, videoMaxSec: 300,
    imageFormats: "JPG · PNG · WEBP (max 20 MB each)",
    videoFormats: "MP4 · MOV · WEBM (max 300 MB · 5 min)",
    badge: "🔑", color: "#d4af37",
  },
};

// ── File validation ────────────────────────────────────────────────────────────
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration); };
    v.onerror = () => resolve(0);
    v.src = URL.createObjectURL(file);
  });
}

// ── Storage helpers ───────────────────────────────────────────────────────────
const KEYS = {
  code:       "ghost_room_code",
  images:     "ghost_room_images",
  videoUrls:  "ghost_room_video_urls",
  requests:   "ghost_room_requests",
  granted:    "ghost_room_granted",
  accessed:   "ghost_room_accessed",
  expiry:     "ghost_room_expiry",
  tier:       "ghost_room_tier",
  imgShare:   "ghost_room_share_img_code",
  vidShare:   "ghost_room_share_vid_code",
  bothShare:  "ghost_room_share_both_code",
};

// Helper to publish a share grant so another user can look it up by code
function publishShareGrant(code: string, ownerGhostId: string, accessType: ShareAccessType, images: string[], videoUrls: string[]) {
  try {
    localStorage.setItem(`ghost_room_share_${code}`, JSON.stringify({
      ownerGhostId, accessType,
      images: accessType !== "video" ? images : [],
      videoUrls: accessType !== "image" ? videoUrls : [],
      createdAt: Date.now(),
    }));
  } catch {}
}

function genCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getMyGhostId(): string {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    if (p.name) {
      let h = 0;
      const id = p.name + p.age + p.city;
      for (let i = 0; i < id.length; i++) { h = Math.imul(31, h) + id.charCodeAt(i) | 0; }
      return `Ghost-${1000 + Math.abs(h) % 9000}`;
    }
  } catch {}
  return "Ghost-????";
}

function loadJson<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

function saveJson(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function loadMatches(): GhostMatch[] {
  try {
    const raw = localStorage.getItem("ghost_matches");
    if (!raw) return [];
    const all: GhostMatch[] = JSON.parse(raw);
    const EXPIRY = 48 * 60 * 60 * 1000;
    return all.filter((m) => Date.now() - m.matchedAt < EXPIRY);
  } catch { return []; }
}

function fmtAgo(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 1000);
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

// ── Send media to another Ghost Vault ─────────────────────────────────────────
function SendMediaPanel({
  myGhostId, myImages, myVideoUrls, cardStyle, inputStyle,
}: {
  myGhostId: string;
  myImages: string[];
  myVideoUrls: string[];
  cardStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState("");
  const [sendType, setSendType] = useState<"image" | "video">("image");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
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
    if (!target.startsWith("Ghost-")) { setError("Enter a valid Ghost ID (e.g. Ghost-4821)"); return; }
    if (target === myGhostId) { setError("You can't send to yourself"); return; }
    const content = sendType === "image" ? selectedImage : videoUrl;
    if (!content) { setError(sendType === "image" ? "Select an image first" : "Paste a video URL first"); return; }

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
      };
      const existing = loadInbox(target);
      saveInbox(target, [...existing, item]);
      setSending(false);
      setSent(true);
      setTargetId("");
      setSelectedImage(null);
      setVideoUrl("");
      setTimeout(() => { setSent(false); setOpen(false); }, 2000);
    }, 800);
  };

  return (
    <div style={cardStyle}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: 0 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>📤</span>
          <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Send Media to a Ghost Vault</p>
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
                Enter the recipient's Ghost ID — they'll receive a notification in their Inbox tab to accept or decline.
              </p>

              {/* Target Ghost ID */}
              <input
                style={{ ...inputStyle, marginBottom: 10 }}
                placeholder="Ghost-XXXX (recipient's ID)"
                value={targetId}
                onChange={(e) => { setTargetId(e.target.value.toUpperCase()); setError(""); }}
              />

              {/* Type toggle */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {(["image", "video"] as const).map((t) => (
                  <button key={t} onClick={() => setSendType(t)}
                    style={{ flex: 1, height: 36, borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 12,
                      background: sendType === t ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
                      color: sendType === t ? "rgba(74,222,128,0.95)" : "rgba(255,255,255,0.4)",
                      outline: sendType === t ? "1px solid rgba(74,222,128,0.3)" : "none",
                    }}>
                    {t === "image" ? "🖼️ Image" : "🎬 Video"}
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
                      style={{ width: "100%", height: 64, borderRadius: 12, border: "1.5px dashed rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.04)", color: "rgba(74,222,128,0.6)", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
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
                            style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", cursor: "pointer", flexShrink: 0, border: selectedImage === src ? "2px solid rgba(74,222,128,0.8)" : "2px solid transparent" }} />
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
                          style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: `1px solid ${videoUrl === url ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.08)"}`, background: videoUrl === url ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.6)", fontSize: 11, textAlign: "left", cursor: "pointer", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          🎬 {url}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {error && <p style={{ fontSize: 11, color: "#f87171", margin: "6px 0", fontWeight: 700 }}>✕ {error}</p>}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSend}
                disabled={sending || sent}
                style={{ width: "100%", height: 44, borderRadius: 12, border: "none", marginTop: 10, cursor: sending || sent ? "default" : "pointer",
                  background: sent ? "rgba(74,222,128,0.2)" : sending ? "rgba(74,222,128,0.3)" : "linear-gradient(135deg,#16a34a,#22c55e)",
                  color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {sent ? (
                  <><Check size={14} /> Sent — they'll see it in their Inbox</>
                ) : sending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                ) : (
                  <>📤 Send to {targetId || "Ghost-XXXX"}</>
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
function VideoUrlInput({ onAdd, inputStyle }: { onAdd: (url: string) => void; inputStyle: React.CSSProperties }) {
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
        style={{ height: 46, borderRadius: 12, padding: "0 14px", border: "none", background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
      >
        Add
      </motion.button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
// ── Room Active Welcome Popup ─────────────────────────────────────────────────
function RoomWelcomePopup({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/dsafasdfasdfasdfasdf.png?updatedAt=1773915218854)",
          backgroundSize: "cover", backgroundPosition: "center top",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(74,222,128,0.2)", borderBottom: "none",
          maxHeight: "88dvh", overflowY: "auto", scrollbarWidth: "none" as const,
          position: "relative",
        }}
      >
        {/* Dark overlay so text is readable over image */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.78) 100%)", borderRadius: "24px 24px 0 0", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, padding: "28px 22px max(32px,env(safe-area-inset-bottom,32px))" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ height: 3, background: "linear-gradient(90deg, transparent, #4ade80, #22c55e, #4ade80, transparent)", marginBottom: 20, borderRadius: 2 }} />
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", margin: "0 0 10px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Ghost Vault
            </h2>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span style={{
                width: 9, height: 9, borderRadius: "50%", background: "#4ade80",
                display: "inline-block",
                boxShadow: "0 0 8px #4ade80",
                animation: "pulse-dot 1.4s ease-in-out infinite",
              }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(74,222,128,0.9)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Active</span>
            </div>
          </div>

          {/* Free tier highlight */}
          <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 16, padding: "14px 16px", marginBottom: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "#4ade80", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.07em" }}>🆓 Your Free Room</p>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 8px" }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0 }}>3</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", margin: 0 }}>Photos</p>
              </div>
              <div style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 8px" }}>
                <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: 0 }}>1</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", margin: 0 }}>Video</p>
              </div>
              <div style={{ flex: 1, textAlign: "center", background: "rgba(74,222,128,0.1)", borderRadius: 10, padding: "10px 8px", border: "1px solid rgba(74,222,128,0.2)" }}>
                <p style={{ fontSize: 14, fontWeight: 900, color: "#4ade80", margin: 0 }}>Free</p>
                <p style={{ fontSize: 10, color: "rgba(74,222,128,0.6)", margin: 0 }}>Forever</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "🔐", title: "Your private vault", body: "Store photos and videos securely — only you and chosen Ghosts can access your room." },
              { icon: "📤", title: "Share with any Ghost instantly", body: "Send media to another 2Ghost user in seconds — just enter their Ghost ID and hit Send." },
              { icon: "🔒", title: "One touch. Total lockdown.", body: "Need to go? One tap locks your room and clears all files from view — nothing visible, nothing exposed." },
            ].map(item => (
              <div key={item.icon} style={{ display: "flex", gap: 13, alignItems: "flex-start", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 14, padding: "12px 14px" }}>
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>{item.title}</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.55 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Upgrade nudge */}
          <div style={{ marginTop: 14, background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 12, padding: "10px 14px" }}>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6 }}>
              Want more? Upgrade to <span style={{ color: "#a78bfa", fontWeight: 700 }}>Pro</span> for 30 photos + 3 videos, or <span style={{ color: "#d4af37", fontWeight: 700 }}>Elite Vault</span> for 100 photos + 10 videos — available in-room settings.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            style={{
              width: "100%", marginTop: 22, height: 52, borderRadius: 50, border: "none",
              background: "linear-gradient(to bottom, #4ade80, #22c55e, #16a34a)",
              color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer",
              letterSpacing: "0.03em", boxShadow: "0 6px 24px rgba(34,197,94,0.45)",
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "45%", background: "linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)", borderRadius: "50px 50px 60% 60%", pointerEvents: "none" }} />
            <span>Enter My Room <img src={GHOST_LOGO} alt="ghost" style={{ width: 48, height: 48, objectFit: "contain", verticalAlign: "middle" }} /></span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GhostRoomPage() {
  const navigate = useNavigate();
  const [hasSub, setHasSub] = useState(hasRoomSub);
  const [verified, setVerified] = useState(isSessionValid);
  const [showRoomWelcome, setShowRoomWelcome] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgShareCode, setImgShareCode] = useState<string>(() => {
    try { return localStorage.getItem(KEYS.imgShare) || genCode(); } catch { return genCode(); }
  });
  const [vidShareCode, setVidShareCode] = useState<string>(() => {
    try { return localStorage.getItem(KEYS.vidShare) || genCode(); } catch { return genCode(); }
  });
  const [bothShareCode, setBothShareCode] = useState<string>(() => {
    try { return localStorage.getItem(KEYS.bothShare) || genCode(); } catch { return genCode(); }
  });
  const [copiedShare, setCopiedShare] = useState<"img" | "vid" | "both" | null>(null);
  const [settingsView, setSettingsView] = useState<null | "video" | "image" | "ghosts" | "share">(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<string | null>(null);
  const [tab, setTab] = useState<"my" | "enter" | "matches" | "inbox">("my");

  // All hooks must be declared before any conditional return
  const myGhostId = getMyGhostId();

  // My room state
  const [roomCode, setRoomCode] = useState<string>(() => {
    const v = localStorage.getItem(KEYS.code);
    return v || genCode();
  });
  const [myImages, setMyImages] = useState<string[]>(() => loadJson(KEYS.images, []));
  const [myVideoUrls, setMyVideoUrls] = useState<string[]>(() => loadJson(KEYS.videoUrls, []));
  const [roomTier] = useState<RoomTier>(() => {
    try {
      const ht = localStorage.getItem("ghost_house_tier");
      if (ht === "gold" || ht === "suite") return ht;
      return "free";
    } catch { return "free"; }
  });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [requests, setRequests] = useState<RoomRequest[]>(() => loadJson(KEYS.requests, []));
  const [granted, setGranted] = useState<string[]>(() => loadJson(KEYS.granted, []));
  const [expiry, setExpiry] = useState<"24h" | "7d" | "never">(() =>
    (localStorage.getItem(KEYS.expiry) as "24h" | "7d" | "never") || "never"
  );
  const [codeCopied, setCodeCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Enter room / request
  const [enterInput, setEnterInput] = useState("");
  const [accessedRooms, setAccessedRooms] = useState<AccessedRoom[]>(() => loadJson(KEYS.accessed, []));
  const [enterError, setEnterError] = useState("");
  const [enterSuccess, setEnterSuccess] = useState("");
  const [requestSent, setRequestSent] = useState<string[]>([]);

  // Inbox — items sent TO me by other Ghost Vault holders
  const [inbox, setInbox] = useState<InboxItem[]>(() => loadInbox(myGhostId));

  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [vidUploading, setVidUploading] = useState(false);
  const [vidProgress, setVidProgress] = useState(0);

  // Persist room code on first load
  useEffect(() => {
    if (!localStorage.getItem(KEYS.code)) {
      localStorage.setItem(KEYS.code, roomCode);
    }
  }, [roomCode]);

  // Poll inbox every 10s for new incoming items
  useEffect(() => {
    const t = setInterval(() => {
      setInbox(loadInbox(myGhostId));
    }, 10000);
    return () => clearInterval(t);
  }, [myGhostId]);

  // Pull in requests written for my Ghost ID
  useEffect(() => {
    try {
      const reqKey = `ghost_room_requests_for_${myGhostId}`;
      const incoming: RoomRequest[] = loadJson(reqKey, []);
      if (incoming.length > 0) {
        setRequests((prev) => {
          const merged = [...prev];
          for (const r of incoming) {
            if (!merged.find((m) => m.ghostId === r.ghostId)) merged.push(r);
          }
          return merged;
        });
      }
    } catch {}
  }, [myGhostId]);

  // Keep share grants published whenever files or codes change
  useEffect(() => {
    if (!verified) return;
    publishShareGrant(imgShareCode, myGhostId, "image", myImages, myVideoUrls);
    publishShareGrant(vidShareCode, myGhostId, "video", myImages, myVideoUrls);
    publishShareGrant(bothShareCode, myGhostId, "both", myImages, myVideoUrls);
    try {
      localStorage.setItem(KEYS.imgShare, imgShareCode);
      localStorage.setItem(KEYS.vidShare, vidShareCode);
      localStorage.setItem(KEYS.bothShare, bothShareCode);
    } catch {}
  }, [verified, imgShareCode, vidShareCode, bothShareCode, myImages, myVideoUrls, myGhostId]);

  // Show auth gate if session expired — must be after ALL hooks
  if (!verified) {
    return <GhostRoomAuthGate onVerified={() => { setVerified(true); setShowRoomWelcome(true); }} />;
  }

  // Derived values (only used when verified)
  const tierInfo = ROOM_TIERS[roomTier];
  const imageLimit = tierInfo.images;
  const videoLimit = tierInfo.videos;
  const atImageLimit = myImages.length >= imageLimit;
  const atVideoLimit = myVideoUrls.length >= videoLimit;
  const pendingInbox = inbox.filter((i) => i.status === "pending");
  const matches = loadMatches();

  // ── Inbox actions ─────────────────────────────────────────────────────────
  const acceptItem = (id: string) => {
    const item = inbox.find((i) => i.id === id);
    if (!item) return;
    if (item.type === "image") {
      const next = [...myImages, item.content];
      setMyImages(next);
      saveJson(KEYS.images, next);
    } else {
      const next = [...myVideoUrls, item.content];
      setMyVideoUrls(next);
      saveJson(KEYS.videoUrls, next);
    }
    const updated = inbox.map((i) => i.id === id ? { ...i, status: "accepted" as const } : i);
    setInbox(updated);
    saveInbox(myGhostId, updated);
  };

  const declineItem = (id: string) => {
    const updated = inbox.map((i) => i.id === id ? { ...i, status: "declined" as const } : i);
    setInbox(updated);
    saveInbox(myGhostId, updated);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const resetCode = () => {
    const newCode = genCode();
    setRoomCode(newCode);
    localStorage.setItem(KEYS.code, newCode);
    // Revoke all granted access — new code invalidates everything
    setGranted([]);
    saveJson(KEYS.granted, []);
    setShowResetConfirm(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (atImageLimit) { setShowUpgrade(true); e.target.value = ""; return; }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert("Only JPG, PNG, and WEBP images are supported.");
      e.target.value = ""; return;
    }
    const maxMB = tierInfo.imageMaxMB;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`Image too large. Your plan allows max ${maxMB} MB per image.`);
      e.target.value = ""; return;
    }
    e.target.value = "";
    setImgUploading(true);
    try {
      const url = await uploadGhostImage(file, myGhostId);
      const next = [...myImages, url];
      setMyImages(next);
      saveJson(KEYS.images, next);
    } catch (err) {
      console.error(err);
    } finally {
      setImgUploading(false);
    }
  };

  const removeImage = async (idx: number) => {
    const url = myImages[idx];
    const next = myImages.filter((_, i) => i !== idx);
    setMyImages(next);
    saveJson(KEYS.images, next);
    if (isSupabaseStorageUrl(url)) {
      await deleteGhostImage(url).catch(() => {});
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (atVideoLimit) { setShowUpgrade(true); e.target.value = ""; return; }
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      alert("Only MP4, MOV, and WEBM videos are supported.");
      e.target.value = ""; return;
    }
    const maxMB = tierInfo.videoMaxMB;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`Video too large. Your plan allows max ${maxMB} MB per video.`);
      e.target.value = ""; return;
    }
    const duration = await getVideoDuration(file);
    const maxSec = tierInfo.videoMaxSec;
    if (duration > maxSec) {
      const label = maxSec >= 60 ? `${Math.floor(maxSec / 60)} min` : `${maxSec} sec`;
      alert(`Video too long. Your plan allows max ${label} per video.`);
      e.target.value = ""; return;
    }
    e.target.value = "";
    setVidUploading(true);
    setVidProgress(0);
    try {
      const url = await uploadGhostVideo(file, myGhostId, setVidProgress);
      const next = [...myVideoUrls, url];
      setMyVideoUrls(next);
      saveJson(KEYS.videoUrls, next);
    } catch (err) {
      console.error(err);
    } finally {
      setVidUploading(false);
      setVidProgress(0);
    }
  };

  const removeVideoUrl = async (idx: number) => {
    const url = myVideoUrls[idx];
    const next = myVideoUrls.filter((_, i) => i !== idx);
    setMyVideoUrls(next);
    saveJson(KEYS.videoUrls, next);
    if (isSupabaseStorageUrl(url)) {
      await deleteGhostVideo(url).catch(() => {});
    }
  };

  const upgradeTier = (_tier: RoomTier) => {
    setShowUpgrade(false);
  };

  const grantRequest = (ghostId: string) => {
    const next = requests.map((r) => r.ghostId === ghostId ? { ...r, status: "granted" as const } : r);
    setRequests(next);
    saveJson(KEYS.requests, next);
    const nextGranted = [...new Set([...granted, ghostId])];
    setGranted(nextGranted);
    saveJson(KEYS.granted, nextGranted);
    // In production: push room code to their accessed_rooms via server
    // For local demo: store in a shared key they can read
    try {
      const sharedKey = `ghost_room_grant_${ghostId}`;
      localStorage.setItem(sharedKey, JSON.stringify({
        ghostId: myGhostId, roomCode, grantedAt: Date.now(),
        images: myImages, videoUrls: myVideoUrls,
      }));
    } catch {}
  };

  const denyRequest = (ghostId: string) => {
    const next = requests.map((r) => r.ghostId === ghostId ? { ...r, status: "denied" as const } : r);
    setRequests(next);
    saveJson(KEYS.requests, next);
  };

  const revokeAccess = (ghostId: string) => {
    const next = granted.filter((g) => g !== ghostId);
    setGranted(next);
    saveJson(KEYS.granted, next);
    const nextReqs = requests.map((r) => r.ghostId === ghostId ? { ...r, status: "denied" as const } : r);
    setRequests(nextReqs);
    saveJson(KEYS.requests, nextReqs);
    try { localStorage.removeItem(`ghost_room_grant_${ghostId}`); } catch {}
  };

  const handleEnterRoom = () => {
    const val = enterInput.trim().toUpperCase();
    setEnterError("");
    setEnterSuccess("");

    if (!val) { setEnterError("Enter a room code or Ghost ID"); return; }

    // If it's a Ghost-XXXX ID → send access request
    if (val.startsWith("GHOST-")) {
      const normalized = val.replace("GHOST-", "Ghost-");
      if (normalized === myGhostId) { setEnterError("That's your own Ghost ID"); return; }
      if (requestSent.includes(normalized)) { setEnterError("Request already sent"); return; }

      // Write request into that user's request list (shared localStorage key)
      try {
        const reqKey = `ghost_room_requests_for_${normalized}`;
        const existing: RoomRequest[] = loadJson(reqKey, []);
        if (!existing.find((r) => r.ghostId === myGhostId)) {
          existing.push({ ghostId: myGhostId, name: myGhostId, requestedAt: Date.now(), status: "pending" });
          saveJson(reqKey, existing);
        }
      } catch {}

      setRequestSent((p) => [...p, normalized]);
      setEnterSuccess(`Access request sent to ${normalized}`);
      setEnterInput("");
      return;
    }

    // Check new typed share code system
    try {
      const shareData = loadJson<{ ownerGhostId: string; accessType: ShareAccessType; images: string[]; videoUrls: string[]; createdAt: number } | null>(`ghost_room_share_${val}`, null);
      if (shareData && shareData.ownerGhostId && shareData.ownerGhostId !== myGhostId) {
        const already = accessedRooms.find(r => r.ghostId === shareData.ownerGhostId && r.accessType === shareData.accessType);
        if (!already) {
          const newRoom: AccessedRoom = {
            ghostId: shareData.ownerGhostId,
            roomCode: val,
            accessType: shareData.accessType,
            grantedAt: Date.now(),
            images: shareData.images || [],
            videoUrls: shareData.videoUrls || [],
          };
          const next = [...accessedRooms, newRoom];
          setAccessedRooms(next);
          saveJson(KEYS.accessed, next);
        }
        const label = shareData.accessType === "image" ? "Image Room" : shareData.accessType === "video" ? "Video Room" : "Full Room";
        setEnterSuccess(`✓ ${label} access granted from ${shareData.ownerGhostId}`);
        setEnterInput("");
        return;
      }
    } catch {}

    // Legacy grant fallback
    try {
      const grantKey = `ghost_room_grant_${myGhostId}`;
      const grant = loadJson<{ ghostId: string; roomCode: string; grantedAt: number; images: string[]; videoUrl?: string; videoUrls?: string[] } | null>(grantKey, null);
      if (grant && grant.roomCode === val) {
        const already = accessedRooms.find((r) => r.ghostId === grant.ghostId);
        if (!already) {
          const newRoom: AccessedRoom = {
            ghostId: grant.ghostId,
            roomCode: val,
            accessType: "both",
            grantedAt: grant.grantedAt || Date.now(),
            images: grant.images || [],
            videoUrls: grant.videoUrls || (grant.videoUrl ? [grant.videoUrl] : []),
          };
          const next = [...accessedRooms, newRoom];
          setAccessedRooms(next);
          saveJson(KEYS.accessed, next);
        }
        setEnterSuccess(`✓ Full Room access granted from ${grant.ghostId}`);
        setEnterInput("");
        return;
      }
    } catch {}

    setEnterError("Code not found — check the code and try again");
  };

  const saveExpiry = (v: "24h" | "7d" | "never") => {
    setExpiry(v);
    try { localStorage.setItem(KEYS.expiry, v); } catch {}
  };

  const deactivateAccount = () => {
    // Wipe everything
    Object.values(KEYS).forEach((k) => { try { localStorage.removeItem(k); } catch {} });
    ["ghost_profile","ghost_gender","ghost_mode_until","ghost_matches","ghost_passed_ids",
      "ghost_tonight_until","ghost_boost_until","ghost_flash_until","ghost_flash_contacts_used",
      "ghost_house_tier","ghost_interest","ghost_room_code"].forEach((k) => {
      try { localStorage.removeItem(k); } catch {};
    });
    // Remove any grants we issued
    granted.forEach((gId) => {
      try { localStorage.removeItem(`ghost_room_grant_${gId}`); } catch {}
    });
    navigate("/ghost/auth", { replace: true });
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const S = {
    page: { minHeight: "100dvh", background: "#050508", color: "#fff", display: "flex", flexDirection: "column" as const },
    header: {
      position: "sticky" as const, top: 0, zIndex: 50,
      background: "rgba(5,5,8,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 16px",
      paddingTop: `max(12px, env(safe-area-inset-top, 12px))`,
      display: "flex", alignItems: "center", gap: 12,
    },
    card: {
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: "14px 16px", marginBottom: 12,
    },
    label: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 6, display: "block" },
    greenCard: {
      background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)",
      borderRadius: 16, padding: "14px 16px", marginBottom: 12,
    },
    input: {
      width: "100%", height: 46, borderRadius: 12,
      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
      color: "#fff", fontSize: 15, padding: "0 14px", outline: "none", boxSizing: "border-box" as const,
    },
  };

  const pending = requests.filter((r) => r.status === "pending");
  const grantedReqs = requests.filter((r) => r.status === "granted");

  // Free tier — all users get in without a subscription gate

  return (
    <div translate="no" style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.7)}}.ghost-no-save img{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;pointer-events:none}.ghost-no-save{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}`}</style>
      {showRoomWelcome && <RoomWelcomePopup onClose={() => setShowRoomWelcome(false)} />}

      {/* ── Settings slide-up sheet ── */}
      {showSettings && (
        <>
          {/* ── Full-screen image viewer ── */}
          <AnimatePresence>
            {viewingImage && (
              <motion.div
                key="img-viewer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: "fixed", inset: 0, zIndex: 600, background: "#000", display: "flex", flexDirection: "column" }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "max(16px,env(safe-area-inset-top,16px)) 16px 12px", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(to bottom,rgba(0,0,0,0.85),transparent)", zIndex: 2 }}>
                  <button onClick={() => setViewingImage(null)} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                    <ArrowLeft size={16} />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Image</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginLeft: "auto" }}>🔒 Private</span>
                </div>
                <img src={viewingImage} alt="" draggable="false" className="ghost-no-save" style={{ width: "100%", height: "100%", objectFit: "contain" }} onContextMenu={e => e.preventDefault()} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Full-screen video viewer ── */}
          <AnimatePresence>
            {viewingVideo && (
              <motion.div
                key="vid-viewer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ position: "fixed", inset: 0, zIndex: 600, background: "#000", display: "flex", flexDirection: "column" }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "max(16px,env(safe-area-inset-top,16px)) 16px 12px", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(to bottom,rgba(0,0,0,0.85),transparent)", zIndex: 2 }}>
                  <button onClick={() => setViewingVideo(null)} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                    <ArrowLeft size={16} />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Video</span>
                  <span style={{ fontSize: 10, color: "rgba(168,85,247,0.8)", marginLeft: "auto", fontWeight: 700 }}>🔒 Not saved to device</span>
                </div>
                <video
                  src={viewingVideo}
                  controls
                  autoPlay
                  controlsList="nodownload nofullscreen"
                  disablePictureInPicture
                  style={{ flex: 1, width: "100%", objectFit: "contain" }}
                  onContextMenu={e => e.preventDefault()}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Backdrop */}
          <div
            onClick={() => { setShowSettings(false); setSettingsView(null); setViewingImage(null); setViewingVideo(null); }}
            style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          />

          {/* Sheet */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 401,
            backgroundImage: settingsView === "image"
              ? "url(https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdfasdASDkjlkjl545345dsdfsdfs.png)"
              : settingsView === "video"
              ? "url(https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdfasdASDkjlkjl545345.png)"
              : settingsView === "ghosts"
              ? "url(https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdfasdASDkjlkjl545345dsdfsdfssfsadf.png)"
              : settingsView === "share"
              ? "url(https://ik.imagekit.io/7grri5v7d/dsafasdfasdfasdfasdfewtewrt.png)"
              : "none",
            backgroundSize: "cover", backgroundPosition: "center top",
            backgroundColor: "rgb(6,8,5)",
            borderRadius: "22px 22px 0 0",
            border: "1px solid rgba(74,222,128,0.12)", borderBottom: "none",
            maxHeight: "88dvh", display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Dark overlay — only for image/video pages */}
            {(settingsView === "image" || settingsView === "video" || settingsView === "ghosts" || settingsView === "share") && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(4,5,4,0.78)", zIndex: 0 }} />
            )}
            {/* Handle */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center", padding: "10px 0 0" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
            </div>

            {/* Sheet header */}
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", padding: "10px 18px 0", gap: 10 }}>
              {settingsView !== null ? (
                <>
                  <button
                    onClick={() => setSettingsView(null)}
                    style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", flex: 1 }}>
                    {settingsView === "image" ? "🖼 Images" : settingsView === "video" ? "🎬 Videos" : settingsView === "ghosts" ? <><img src={GHOST_LOGO} alt="" style={{ width: 42, height: 42, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} /> Ghosts</> : "📤 Share Room"}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                    {settingsView === "image"
                      ? `${myImages.length + inbox.filter(x => x.type === "image" && x.status === "accepted").length} files`
                      : settingsView === "video"
                      ? `${myVideoUrls.length + inbox.filter(x => x.type === "video" && x.status === "accepted").length} files`
                      : settingsView === "ghosts"
                      ? `${matches.length + accessedRooms.length} contacts`
                      : ""}
                  </span>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", display: "block" }}>Room Storage</span>
                    <span style={{ fontSize: 10, color: "rgba(74,222,128,0.7)", fontWeight: 600, lineHeight: 1.4, display: "block", marginTop: 2 }}>Your files are stored on top-security servers</span>
                  </div>
                  <button onClick={() => setShowSettings(false)} style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                    <X size={13} />
                  </button>
                </>
              )}
            </div>

            {/* Content */}
            <div style={{ position: "relative", zIndex: 1, flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>

              {/* ── HOME: 4 big square buttons ── */}
              {settingsView === null && (
                <div style={{ padding: "18px 18px max(32px,env(safe-area-inset-bottom,32px))" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {([
                      { view: "video" as const,  label: "Videos",     sub: `${myVideoUrls.length} saved`,   bg: "https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdfasdASDkjlkjl545345.png" },
                      { view: "image" as const,  label: "Images",     sub: `${myImages.length} saved`,      bg: "https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdfasdASDkjlkjl545345dsdfsdfs.png" },
                      { view: "ghosts" as const, label: "Ghosts",     sub: `${matches.length} connections`, bg: "https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdfasdASDkjlkjl545345dsdfsdfssfsadf.png" },
                      { view: "share" as const,  label: "Share Room", sub: "Send your code",               bg: "https://ik.imagekit.io/7grri5v7d/UntitledasfsadfasdfasdASDkjlkjl545345dsdfsdfssfsadffsdfsdf.png" },
                    ]).map(({ view, label, sub, bg }) => (
                      <motion.button
                        key={view}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSettingsView(view)}
                        style={{
                          height: 118, borderRadius: 18, border: "none",
                          backgroundImage: `url(${bg})`,
                          backgroundSize: "cover", backgroundPosition: "center",
                          cursor: "pointer", padding: 0,
                          position: "relative", overflow: "hidden",
                          display: "flex", flexDirection: "column",
                          alignItems: "flex-start", justifyContent: "flex-end",
                        }}
                      >
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)" }} />
                        <div style={{ position: "relative", zIndex: 1, padding: "0 12px 12px" }}>
                          <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: "0 0 2px" }}>{label}</p>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", margin: 0 }}>{sub}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                  {/* Storage bar */}
                  <div style={{ marginTop: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Storage Used</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "rgba(74,222,128,0.9)" }}>
                        {myImages.length + myVideoUrls.length} / {ROOM_TIERS[roomTier].images + ROOM_TIERS[roomTier].videos} files
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3,
                        width: `${Math.min(100, ((myImages.length + myVideoUrls.length) / Math.max(1, ROOM_TIERS[roomTier].images + ROOM_TIERS[roomTier].videos)) * 100)}%`,
                        background: "linear-gradient(90deg,#4ade80,#22c55e)",
                      }} />
                    </div>
                  </div>

                  {/* ── Danger zone ── */}
                  <div style={{ marginTop: 16, borderTop: "1px solid rgba(239,68,68,0.1)", paddingTop: 16 }}>
                    {!confirmDelete ? (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setConfirmDelete(true)}
                        style={{
                          width: "100%", height: 44, borderRadius: 12,
                          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
                          color: "#f87171", fontSize: 13, fontWeight: 800, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                      >
                        <ShieldOff size={14} /> Delete Everything & Exit Ghost Vault
                      </motion.button>
                    ) : (
                      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 14, padding: "14px 16px" }}>
                        <p style={{ fontSize: 13, fontWeight: 900, color: "#f87171", margin: "0 0 4px", textAlign: "center" }}>⚠️ This cannot be undone</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 14px", textAlign: "center", lineHeight: 1.5 }}>
                          All photos, videos, and vault data will be permanently deleted.
                        </p>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => setConfirmDelete(false)}
                            style={{ flex: 1, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                          >
                            Cancel
                          </button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              // Wipe all vault data
                              Object.values(KEYS).forEach((k) => { try { localStorage.removeItem(k); } catch {} });
                              setMyImages([]);
                              setMyVideoUrls([]);
                              navigate("/ghost/mode");
                            }}
                            style={{ flex: 1, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #dc2626, #ef4444)", border: "none", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer" }}
                          >
                            Delete & Exit
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── IMAGE PAGE ── */}
              {settingsView === "image" && (() => {
                const allImages = [
                  ...myImages.map((url, i) => ({ url, src: "me" as const, at: Date.now() - (myImages.length - i) * 86400000 * 2, myIdx: i })),
                  ...inbox.filter(x => x.type === "image" && x.status === "accepted").map(x => ({ url: x.content, src: x.senderGhostId, at: x.sentAt, myIdx: -1 })),
                ];
                return (
                  <div style={{ padding: "14px 18px max(32px,env(safe-area-inset-bottom,32px))" }}>
                    {/* Privacy notice */}
                    <div style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: 12, padding: "9px 14px", marginBottom: 14 }}>
                      <p style={{ fontSize: 11, color: "rgba(74,222,128,0.85)", margin: 0, fontWeight: 700 }}>
                        Images are private — never saved to your device
                      </p>
                    </div>
                    {allImages.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <span style={{ fontSize: 52 }}>🖼️</span>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", marginTop: 14 }}>No images yet</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>Upload images in My Room tab</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {allImages.map((img, i) => (
                          <motion.div
                            key={i}
                            initial={{ x: -44, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.055, duration: 0.22 }}
                            onClick={() => setViewingImage(img.url)}
                            style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(74,222,128,0.1)", borderRadius: 16, padding: "12px 14px", cursor: "pointer" }}
                          >
                            {/* Thumbnail */}
                            <div style={{ width: 66, height: 66, borderRadius: 12, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(74,222,128,0.2)" }}>
                              <img src={img.url} alt="" draggable="false" className="ghost-no-save" style={{ width: "100%", height: "100%", objectFit: "cover" }} onContextMenu={e => e.preventDefault()} />
                            </div>
                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>
                                {img.src === "me" ? `Image ${i + 1}` : `From ${img.src}`}
                              </p>
                              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 6px" }}>
                                {new Date(img.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                              <span style={{
                                fontSize: 9, borderRadius: 6, padding: "2px 8px", fontWeight: 700,
                                background: img.src === "me" ? "rgba(74,222,128,0.12)" : "rgba(96,165,250,0.1)",
                                border: `1px solid ${img.src === "me" ? "rgba(74,222,128,0.25)" : "rgba(96,165,250,0.2)"}`,
                                color: img.src === "me" ? "rgba(74,222,128,0.9)" : "rgba(96,165,250,0.8)",
                              }}>
                                {img.src === "me" ? "Uploaded by you" : `Ghost · ${img.src}`}
                              </span>
                            </div>
                            {/* Actions */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(74,222,128,0.1)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Image size={13} color="rgba(74,222,128,0.8)" />
                              </div>
                              {img.src === "me" && (
                                <button
                                  onClick={e => { e.stopPropagation(); removeImage(img.myIdx); }}
                                  style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(239,68,68,0.7)" }}
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── VIDEO PAGE ── */}
              {settingsView === "video" && (() => {
                const allVideos = [
                  ...myVideoUrls.map((url, i) => ({ url, src: "me" as const, at: Date.now() - (myVideoUrls.length - i) * 86400000 * 3, myIdx: i })),
                  ...inbox.filter(x => x.type === "video" && x.status === "accepted").map(x => ({ url: x.content, src: x.senderGhostId, at: x.sentAt, myIdx: -1 })),
                ];
                return (
                  <div style={{ padding: "14px 18px max(32px,env(safe-area-inset-bottom,32px))" }}>
                    {/* Privacy notice */}
                    <div style={{ background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.18)", borderRadius: 12, padding: "9px 14px", marginBottom: 14 }}>
                      <p style={{ fontSize: 11, color: "rgba(74,222,128,0.85)", margin: 0, fontWeight: 700 }}>
                        Videos are private — never saved to your device
                      </p>
                    </div>

                    {allVideos.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <span style={{ fontSize: 52 }}>🎬</span>
                        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", marginTop: 14 }}>No videos yet</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>Upload videos in My Room tab</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {allVideos.map((vid, i) => (
                          <div key={i} style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 16, overflow: "hidden" }}>
                            <div
                              onClick={() => setViewingVideo(vid.url)}
                              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", cursor: "pointer" }}
                            >
                              {/* Video thumbnail with play button */}
                              <div style={{ width: 76, height: 56, borderRadius: 10, flexShrink: 0, background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                                <video
                                  src={vid.url}
                                  muted
                                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.45 }}
                                />
                                <div style={{ position: "relative", width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span style={{ fontSize: 9, marginLeft: 2 }}>▶</span>
                                </div>
                              </div>
                              {/* Info */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 3px" }}>
                                  {vid.src === "me" ? `Video ${i + 1}` : `From ${vid.src}`}
                                </p>
                                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 6px" }}>
                                  Added {new Date(vid.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                                <span style={{
                                  fontSize: 9, borderRadius: 6, padding: "2px 8px", fontWeight: 700,
                                  background: vid.src === "me" ? "rgba(168,85,247,0.12)" : "rgba(96,165,250,0.1)",
                                  border: `1px solid ${vid.src === "me" ? "rgba(168,85,247,0.25)" : "rgba(96,165,250,0.2)"}`,
                                  color: vid.src === "me" ? "rgba(168,85,247,0.9)" : "rgba(96,165,250,0.8)",
                                }}>
                                  {vid.src === "me" ? "Uploaded by you" : `Ghost · ${vid.src}`}
                                </span>
                              </div>
                              {vid.src === "me" && (
                                <button
                                  onClick={e => { e.stopPropagation(); removeVideoUrl(vid.myIdx); }}
                                  style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(239,68,68,0.7)", flexShrink: 0 }}
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── GHOSTS PAGE ── */}
              {settingsView === "ghosts" && (
                <div style={{ padding: "14px 18px max(32px,env(safe-area-inset-bottom,32px))" }}>
                  {matches.length === 0 && accessedRooms.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0" }}>
                      <img src={GHOST_LOGO} alt="ghost" style={{ width: 156, height: 156, objectFit: "contain" }} />
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", marginTop: 14 }}>No ghost connections yet</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>Match with ghosts to see them here</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[
                        ...matches.map(m => ({ ghostId: m.profile.id, name: m.profile.name, city: m.profile.city, country: m.profile.countryFlag, age: m.profile.age, image: m.profile.image, at: m.matchedAt })),
                        ...accessedRooms.map(r => ({ ghostId: r.ghostId, name: r.ghostId, city: "", country: "", age: 0, image: "", at: r.grantedAt })),
                      ].map((c, i) => {
                        const isActive = i % 3 !== 2;
                        return (
                          <motion.div
                            key={i}
                            initial={{ x: -36, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.055 }}
                            style={{ display: "flex", alignItems: "center", gap: 12, background: isActive ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.03)", border: `1px solid ${isActive ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: "12px 14px" }}
                          >
                            {/* Avatar */}
                            <div style={{ position: "relative", flexShrink: 0 }}>
                              <div style={{ width: 52, height: 52, borderRadius: "50%", overflow: "hidden", border: `2px solid ${isActive ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.12)"}` }}>
                                {c.image
                                  ? <img src={c.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  : <div style={{ width: "100%", height: "100%", background: "rgba(74,222,128,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><img src={GHOST_LOGO} alt="ghost" style={{ width: 66, height: 66, objectFit: "contain" }} /></div>
                                }
                              </div>
                              {isActive && (
                                <span style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: "#4ade80", border: "2px solid #050508", animation: "pulse-dot 1.4s ease-in-out infinite" }} />
                              )}
                            </div>
                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 900, color: "#fff", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {c.name || c.ghostId}
                              </p>
                              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "0 0 4px" }}>
                                {c.ghostId}{c.city ? ` · ${c.city}` : ""}{c.age ? `, ${c.age}` : ""}{c.country ? ` ${c.country}` : ""}
                              </p>
                              <span style={{
                                fontSize: 9, borderRadius: 6, padding: "2px 7px", fontWeight: 700,
                                background: isActive ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)",
                                border: `1px solid ${isActive ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.08)"}`,
                                color: isActive ? "rgba(74,222,128,0.85)" : "rgba(255,255,255,0.3)",
                              }}>
                                {isActive ? "● Active now" : "Offline"}
                              </span>
                            </div>
                            {/* Message button */}
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                              <MessageCircle size={15} color="rgba(74,222,128,0.7)" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── SHARE PAGE ── */}
              {settingsView === "share" && (() => {
                const shareOptions: Array<{
                  key: "img" | "vid" | "both";
                  label: string;
                  desc: string;
                  code: string;
                  setCode: (c: string) => void;
                  storageKey: string;
                  accent: string;
                  border: string;
                  bg: string;
                  count: string;
                }> = [
                  {
                    key: "img", label: "🖼 Image Room", desc: "Recipient sees your images only — videos stay locked",
                    code: imgShareCode, setCode: setImgShareCode, storageKey: KEYS.imgShare,
                    accent: "#4ade80", border: "rgba(74,222,128,0.25)", bg: "rgba(74,222,128,0.06)",
                    count: `${myImages.length} image${myImages.length !== 1 ? "s" : ""}`,
                  },
                  {
                    key: "vid", label: "🎬 Video Room", desc: "Recipient sees your videos only — images stay locked",
                    code: vidShareCode, setCode: setVidShareCode, storageKey: KEYS.vidShare,
                    accent: "#a78bfa", border: "rgba(168,85,247,0.25)", bg: "rgba(168,85,247,0.06)",
                    count: `${myVideoUrls.length} video${myVideoUrls.length !== 1 ? "s" : ""}`,
                  },
                  {
                    key: "both", label: "🔗 Full Room", desc: "Recipient sees both images and videos",
                    code: bothShareCode, setCode: setBothShareCode, storageKey: KEYS.bothShare,
                    accent: "#60a5fa", border: "rgba(96,165,250,0.25)", bg: "rgba(96,165,250,0.06)",
                    count: `${myImages.length} images · ${myVideoUrls.length} videos`,
                  },
                ];

                const resetShareCode = (opt: typeof shareOptions[0]) => {
                  const newCode = genCode();
                  opt.setCode(newCode);
                  try { localStorage.setItem(opt.storageKey, newCode); } catch {}
                  publishShareGrant(newCode, myGhostId, opt.key === "img" ? "image" : opt.key === "vid" ? "video" : "both", myImages, myVideoUrls);
                };

                const copyShareCode = (opt: typeof shareOptions[0]) => {
                  navigator.clipboard.writeText(opt.code).catch(() => {});
                  setCopiedShare(opt.key);
                  setTimeout(() => setCopiedShare(null), 2000);
                };

                return (
                  <div style={{ padding: "14px 18px max(32px,env(safe-area-inset-bottom,32px))" }}>
                    {/* Security notice */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
                      <Lock size={13} color="rgba(74,222,128,0.8)" style={{ marginTop: 1, flexShrink: 0 }} />
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>
                        Each code grants access <span style={{ color: "rgba(74,222,128,0.9)", fontWeight: 800 }}>only</span> to the selected room type. Share only with ghosts you trust — codes can be reset at any time.
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {shareOptions.map(opt => (
                        <div key={opt.key} style={{ background: opt.bg, border: `1px solid ${opt.border}`, borderRadius: 18, overflow: "hidden" }}>
                          {/* Card header */}
                          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${opt.border}` }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{opt.label}</span>
                              <span style={{ fontSize: 10, color: opt.accent, fontWeight: 700, background: `rgba(${opt.key === "img" ? "74,222,128" : opt.key === "vid" ? "168,85,247" : "96,165,250"},0.12)`, borderRadius: 6, padding: "2px 8px" }}>{opt.count}</span>
                            </div>
                            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", margin: 0 }}>{opt.desc}</p>
                          </div>
                          {/* Code + actions */}
                          <div style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ flex: 1, height: 44, borderRadius: 10, background: "rgba(0,0,0,0.3)", border: `1px solid ${opt.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: 18, fontWeight: 900, color: opt.accent, letterSpacing: "0.22em" }}>{opt.code}</span>
                              </div>
                              <motion.button
                                whileTap={{ scale: 0.93 }}
                                onClick={() => copyShareCode(opt)}
                                style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${opt.border}`, background: copiedShare === opt.key ? opt.bg : "rgba(0,0,0,0.3)", color: opt.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                              >
                                {copiedShare === opt.key ? <Check size={15} /> : <Copy size={15} />}
                              </motion.button>
                              <motion.button
                                whileTap={{ scale: 0.93 }}
                                onClick={() => resetShareCode(opt)}
                                title="Reset code — old code stops working"
                                style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "rgba(239,68,68,0.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                              >
                                <RefreshCw size={14} />
                              </motion.button>
                            </div>
                            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", margin: "7px 0 0", textAlign: "center" }}>Reset code to revoke all current access for this room</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        </>
      )}
      {/* Header */}
      <div style={S.header}>
        <button
          onClick={() => navigate("/ghost/mode")}
          style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", flexShrink: 0 }}
        >
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 15 }}>🚪</span>
            <h1 style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>Ghost Vault</h1>
            <span style={{ fontSize: 10, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 6, padding: "1px 6px", color: "rgba(74,222,128,0.9)", fontWeight: 800 }}>PRIVATE</span>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>{myGhostId} · code-gated vault</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {pending.length > 0 && (
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>
              {pending.length}
            </div>
          )}
          <button
            onClick={() => setShowSettings(true)}
            title="Vault Settings"
            style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
          >
            <Settings size={15} />
          </button>
          <button
            onClick={() => navigate("/ghost/mode")}
            title="Exit Vault"
            style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#f87171" }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,8,0.9)" }}>
        {([
          { key: "my",      label: "My Room",  icon: Lock },
          { key: "enter",   label: "Enter",    icon: Unlock },
          { key: "inbox",   label: "Inbox",    icon: MessageCircle },
          { key: "matches", label: "Matches",  icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1, height: 44, border: "none", cursor: "pointer",
              background: "none",
              borderBottom: tab === key ? "2px solid rgba(74,222,128,0.9)" : "2px solid transparent",
              color: tab === key ? "rgba(74,222,128,0.95)" : "rgba(255,255,255,0.35)",
              fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              position: "relative",
            }}
          >
            <Icon size={12} />
            {label}
            {key === "my" && pending.length > 0 && (
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#ef4444", fontSize: 8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: 6, right: "18%" }}>
                {pending.length}
              </span>
            )}
            {key === "inbox" && pendingInbox.length > 0 && (
              <span style={{ width: 14, height: 14, borderRadius: "50%", background: "#ef4444", fontSize: 8, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: 6, right: "18%" }}>
                {pendingInbox.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 80px" }}>

        {/* ── MY ROOM TAB ── */}
        {tab === "my" && (
          <div>
            {/* Room code block */}
            <div style={{ ...S.greenCard, backgroundImage: "url(https://ik.imagekit.io/7grri5v7d/ghostert.png)", backgroundSize: "cover", backgroundPosition: "center", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(4,8,4,0.72)" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
              <p style={S.label}>Your Ghost Vault Code</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  flex: 1, height: 52, borderRadius: 12,
                  background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: "rgba(74,222,128,0.95)", letterSpacing: "0.2em", fontVariantNumeric: "tabular-nums" }}>
                    {roomCode}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={copyCode}
                  style={{ width: 44, height: 52, borderRadius: 12, border: "1px solid rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.1)", color: "rgba(74,222,128,0.9)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {codeCopied ? <Check size={16} /> : <Copy size={16} />}
                </motion.button>
              </div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 10px" }}>
                Share this code only with people you trust. Anyone with this code can view your room.
              </p>
              {/* Reset code */}
              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "7px 12px", color: "rgba(239,68,68,0.8)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  <RefreshCw size={12} />
                  Reset Code — revokes all access
                </button>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={resetCode} style={{ flex: 1, height: 36, borderRadius: 10, border: "none", background: "rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                    Yes, reset &amp; revoke all
                  </button>
                  <button onClick={() => setShowResetConfirm(false)} style={{ flex: 1, height: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              )}
              </div>
            </div>

            {/* Room expiry */}
            <div style={S.card}>
              <p style={S.label}>Auto-Lock Room</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "-4px 0 10px", fontWeight: 600 }}>Blocks All Access To Your Rooms</p>
              <div style={{ display: "flex", gap: 8 }}>
                {([
                  { v: "24h", label: "24 Hours" },
                  { v: "7d",  label: "7 Days" },
                  { v: "never", label: "Never" },
                ] as const).map(({ v, label }) => {
                  const isSelected = expiry === v;
                  const isLocked = isSelected && v !== "never";
                  return (
                    <button
                      key={v}
                      onClick={() => saveExpiry(v)}
                      style={{
                        flex: 1, height: 40, borderRadius: 10, border: "none", cursor: "pointer",
                        background: isSelected ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)",
                        color: isSelected ? "rgba(74,222,128,0.95)" : "rgba(255,255,255,0.4)",
                        fontSize: 11, fontWeight: 700,
                        outline: isSelected ? "1px solid rgba(74,222,128,0.35)" : "none",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                      }}
                    >
                      <span>{label}</span>
                      {isSelected && (
                        <span style={{ fontSize: 14, lineHeight: 1 }}>
                          {isLocked ? "🔒" : "🔓"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tier selector */}
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>Ghost Vault Rental</p>
                  <p style={{ fontSize: 10, color: "rgba(74,222,128,0.7)", fontWeight: 600, margin: 0 }}>100% secure private rooms</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: tierInfo.color }}>{tierInfo.badge} {tierInfo.label}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(Object.entries(ROOM_TIERS) as [RoomTier, typeof ROOM_TIERS[RoomTier]][]).map(([key, t]) => (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => upgradeTier(key)}
                    style={{
                      borderRadius: 12, padding: "10px 12px", cursor: "pointer", textAlign: "left",
                      background: roomTier === key ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${roomTier === key ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.07)"}`,
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 2 }}>{t.badge || "🚪"}</div>
                    <p style={{ fontSize: 12, fontWeight: 800, color: roomTier === key ? "rgba(74,222,128,0.95)" : "#fff", margin: "0 0 1px" }}>{t.label}</p>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 4px" }}>{t.price}</p>
                    <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", margin: 0 }}>{t.images} photos · {t.videos} video{t.videos !== 1 ? "s" : ""}</p>
                  </motion.button>
                ))}
              </div>
              {roomTier === "free" && (
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "8px 0 0", textAlign: "center" }}>
                  Upgrade to Basic for 25.000 IDR/mo — unlock 10 photos + video
                </p>
              )}
            </div>

            {/* Image room */}
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Image size={13} color="rgba(74,222,128,0.8)" />
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Image Room</p>
                </div>
                <span style={{ fontSize: 10, color: atImageLimit ? "#f87171" : "rgba(255,255,255,0.3)" }}>
                  {myImages.length}/{imageLimit}
                  {atImageLimit && " · upgrade for more"}
                </span>
              </div>
              <input ref={imgRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic" style={{ display: "none" }} onChange={handleImageUpload} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {myImages.map((src, i) => (
                  <div key={i} style={{ position: "relative", width: 80, height: 80, borderRadius: 10, overflow: "hidden" }}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      onClick={() => removeImage(i)}
                      style={{ position: "absolute", top: 3, right: 3, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.7)", border: "none", color: "#fff", fontSize: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {imgUploading && (
                  <div style={{ width: 80, height: 80, borderRadius: 10, background: "rgba(74,222,128,0.06)", border: "1.5px dashed rgba(74,222,128,0.3)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid rgba(74,222,128,0.2)", borderTop: "2px solid rgba(74,222,128,0.9)", animation: "spin 0.8s linear infinite" }} />
                    <span style={{ fontSize: 8, color: "rgba(74,222,128,0.6)", fontWeight: 700 }}>Uploading</span>
                  </div>
                )}
                {!atImageLimit && !imgUploading ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => imgRef.current?.click()}
                    style={{
                      width: 80, height: 80, borderRadius: 10,
                      background: "rgba(74,222,128,0.06)", border: "1.5px dashed rgba(74,222,128,0.3)",
                      color: "rgba(74,222,128,0.6)", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                    }}
                  >
                    <Upload size={16} />
                    <span style={{ fontSize: 9, fontWeight: 700 }}>Add Photo</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowUpgrade(true)}
                    style={{
                      width: 80, height: 80, borderRadius: 10,
                      background: "rgba(239,68,68,0.06)", border: "1.5px dashed rgba(239,68,68,0.3)",
                      color: "rgba(239,68,68,0.7)", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>🔒</span>
                    <span style={{ fontSize: 9, fontWeight: 700 }}>Upgrade</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Video room */}
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Video size={13} color="rgba(74,222,128,0.8)" />
                  <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Video Room</p>
                </div>
                <span style={{ fontSize: 10, color: atVideoLimit ? "#f87171" : "rgba(255,255,255,0.3)" }}>
                  {myVideoUrls.length}/{videoLimit}
                </span>
              </div>
              <input ref={vidRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo" style={{ display: "none" }} onChange={handleVideoUpload} />
              {atVideoLimit ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowUpgrade(true)}
                  style={{ width: "100%", height: 40, borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  🔒 Video limit reached — upgrade for more
                </motion.button>
              ) : (
                <>
                  {myVideoUrls.map((url, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                        <span style={{ flex: 1, fontSize: 11, color: "rgba(255,255,255,0.5)", padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {url.split('/').pop() || url}
                        </span>
                        <button onClick={() => removeVideoUrl(i)} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <X size={12} />
                        </button>
                      </div>
                      <div style={{ borderRadius: 8, overflow: "hidden", background: "rgba(0,0,0,0.4)" }}>
                        <video src={url} controls style={{ width: "100%", maxHeight: 180, display: "block" }} />
                      </div>
                    </div>
                  ))}

                  {/* Upload progress bar */}
                  {vidUploading && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "rgba(74,222,128,0.7)", fontWeight: 700 }}>Uploading video…</span>
                        <span style={{ fontSize: 11, color: "rgba(74,222,128,0.5)" }}>{vidProgress}%</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                        <div style={{ height: "100%", borderRadius: 4, background: "rgba(74,222,128,0.7)", width: `${vidProgress || 10}%`, transition: "width 0.3s ease" }} />
                      </div>
                    </div>
                  )}

                  {!atVideoLimit && !vidUploading && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => vidRef.current?.click()}
                      style={{ width: "100%", height: 44, borderRadius: 10, border: "1.5px dashed rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.04)", color: "rgba(74,222,128,0.7)", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      <Upload size={14} />
                      Upload Video — {tierInfo.videoFormats}
                    </motion.button>
                  )}
                  {atVideoLimit && (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowUpgrade(true)}
                      style={{ width: "100%", height: 36, borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      🔒 Upgrade for more videos
                    </motion.button>
                  )}
                </>
              )}
            </div>

            {/* Upgrade modal */}
            <AnimatePresence>
              {showUpgrade && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowUpgrade(false)}
                  style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: "100%", maxWidth: 480, background: "rgba(8,8,14,0.99)", borderRadius: "20px 20px 0 0", border: "1px solid rgba(74,222,128,0.2)", borderBottom: "none", padding: "20px 16px max(32px,env(safe-area-inset-bottom,32px))" }}>
                    <div style={{ height: 3, background: "linear-gradient(90deg,#16a34a,#4ade80,#d4af37)", borderRadius: 3, marginBottom: 18 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: 0 }}>🔑 Upgrade Your Room</p>
                      <button onClick={() => setShowUpgrade(false)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={14} />
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                      {(Object.entries(ROOM_TIERS) as [RoomTier, typeof ROOM_TIERS[RoomTier]][]).map(([key, t]) => (
                        <div key={key} style={{ borderRadius: 14, padding: "13px 16px", border: `1px solid ${roomTier === key ? t.color : "rgba(255,255,255,0.08)"}`, background: roomTier === key ? `rgba(74,222,128,0.06)` : "rgba(255,255,255,0.02)", opacity: roomTier === key ? 1 : 0.75 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                            <p style={{ fontSize: 14, fontWeight: 900, color: t.color, margin: 0 }}>{t.badge} {t.label} {roomTier === key && <span style={{ fontSize: 9, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 5, padding: "1px 6px", color: "#4ade80", marginLeft: 4 }}>YOUR PLAN</span>}</p>
                            <p style={{ fontSize: 14, fontWeight: 900, color: "#fff", margin: 0 }}>{t.price}</p>
                          </div>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: "0 0 2px" }}>📷 {t.images} photos · {t.imageFormats}</p>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", margin: 0 }}>🎬 {t.videos} video{t.videos !== 1 ? "s" : ""} · {t.videoFormats}</p>
                        </div>
                      ))}
                    </div>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setShowUpgrade(false); navigate("/ghost/mode"); }}
                      style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#4ade80,#16a34a)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
                      Upgrade in Ghost Rooms →
                    </motion.button>
                    <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", margin: "10px 0 0", textAlign: "center" }}>
                      Vault storage is included with your Ghost Rooms subscription
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Access requests */}
            <div style={S.card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: 0 }}>Access Requests</p>
                {pending.length > 0 && (
                  <span style={{ background: "#ef4444", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 800, color: "#fff" }}>
                    {pending.length} pending
                  </span>
                )}
              </div>

              {requests.length === 0 && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", margin: 0, textAlign: "center", padding: "10px 0" }}>
                  No requests yet — share your Ghost ID so others can request access
                </p>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {requests.map((req) => (
                  <div
                    key={req.ghostId}
                    style={{
                      background: req.status === "pending" ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${req.status === "pending" ? "rgba(74,222,128,0.2)" : req.status === "granted" ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 12, padding: "10px 12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 2px" }}>{req.ghostId}</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                          Requested {fmtAgo(req.requestedAt)} ·{" "}
                          <span style={{ color: req.status === "granted" ? "rgba(74,222,128,0.8)" : req.status === "denied" ? "#f87171" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                            {req.status}
                          </span>
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {req.status === "pending" && (
                          <>
                            <button
                              onClick={() => grantRequest(req.ghostId)}
                              style={{ height: 30, borderRadius: 8, padding: "0 10px", border: "none", background: "rgba(74,222,128,0.2)", color: "rgba(74,222,128,0.95)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                            >
                              Grant
                            </button>
                            <button
                              onClick={() => denyRequest(req.ghostId)}
                              style={{ height: 30, borderRadius: 8, padding: "0 10px", border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.35)", fontSize: 11, cursor: "pointer" }}
                            >
                              Deny
                            </button>
                          </>
                        )}
                        {req.status === "granted" && (
                          <button
                            onClick={() => revokeAccess(req.ghostId)}
                            style={{ height: 30, borderRadius: 8, padding: "0 10px", border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                          >
                            <ShieldOff size={10} />
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Who I've granted */}
              {grantedReqs.length > 0 && (
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", margin: "10px 0 0" }}>
                  {grantedReqs.length} {grantedReqs.length === 1 ? "person has" : "people have"} access to your room
                </p>
              )}
            </div>

            {/* Send media to another Ghost Vault */}
            <SendMediaPanel myGhostId={myGhostId} myImages={myImages} myVideoUrls={myVideoUrls} cardStyle={S.card} inputStyle={S.input} />

            {/* Deactivate */}
            <div style={{ ...S.card, borderColor: "rgba(239,68,68,0.15)" }}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#f87171", margin: "0 0 4px" }}>Deactivate Account</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 10px" }}>
                Wipes your Ghost profile, all matches, your room, and removes your content from everyone who had access.
              </p>
              <button
                onClick={deactivateAccount}
                style={{ width: "100%", height: 40, borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
              >
                Delete Everything &amp; Exit Ghost
              </button>
            </div>
          </div>
        )}

        {/* ── ENTER ROOM TAB ── */}
        {tab === "enter" && (
          <div>
            <div style={S.greenCard}>
              <p style={{ fontSize: 13, fontWeight: 800, color: "#fff", margin: "0 0 4px" }}>Enter a Ghost Vault</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 14px" }}>
                Paste a 6-character room code to view their private room — or enter someone's Ghost ID (Ghost-XXXX) to request access.
              </p>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  style={S.input}
                  placeholder="ROOM CODE or Ghost-XXXX"
                  value={enterInput}
                  onChange={(e) => { setEnterInput(e.target.value.toUpperCase()); setEnterError(""); setEnterSuccess(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEnterRoom(); }}
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnterRoom}
                  style={{ height: 46, borderRadius: 12, padding: "0 18px", border: "none", background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", flexShrink: 0 }}
                >
                  Enter
                </motion.button>
              </div>
              {enterError && (
                <p style={{ fontSize: 11, color: "#f87171", margin: 0, fontWeight: 700 }}>✕ {enterError}</p>
              )}
              {enterSuccess && (
                <p style={{ fontSize: 11, color: "rgba(74,222,128,0.9)", margin: 0, fontWeight: 700 }}>✓ {enterSuccess}</p>
              )}
            </div>

            {/* My Ghost ID (to share so others can request) */}
            <div style={S.card}>
              <p style={S.label}>Your Ghost ID — share this so others can request your room</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 44, borderRadius: 10, background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", paddingLeft: 14 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "rgba(74,222,128,0.9)" }}>{myGhostId}</span>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(myGhostId).catch(() => {}); }}
                  style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid rgba(74,222,128,0.2)", background: "rgba(74,222,128,0.08)", color: "rgba(74,222,128,0.8)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* Rooms I've been granted access to */}
            {accessedRooms.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "16px 0 8px" }}>
                  Rooms You Have Access To
                </p>
                {accessedRooms.map((room) => (
                  <div key={room.ghostId} style={S.card}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: "rgba(74,222,128,0.9)", margin: 0 }}>{room.ghostId}'s Room</p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>Granted {fmtAgo(room.grantedAt)}</p>
                      </div>
                    </div>

                    {/* Their images */}
                    {room.images.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        {room.images.map((src, i) => (
                          <img key={i} src={src} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(74,222,128,0.2)" }} />
                        ))}
                      </div>
                    )}

                    {/* Their videos */}
                    {room.videoUrls && room.videoUrls.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {room.videoUrls.map((url, vi) => (
                          <div key={vi} style={{ borderRadius: 10, overflow: "hidden", background: "rgba(0,0,0,0.4)" }}>
                            <video src={url} controls style={{ width: "100%", maxHeight: 180, display: "block" }} />
                          </div>
                        ))}
                      </div>
                    )}

                    {room.images.length === 0 && (!room.videoUrls || room.videoUrls.length === 0) && (
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: 0 }}>This room has no content yet</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pending requests I sent */}
            {requestSent.length > 0 && (
              <div style={S.card}>
                <p style={S.label}>Requests Sent</p>
                {requestSent.map((id) => (
                  <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{id}</span>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Waiting...</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INBOX TAB ── */}
        {tab === "inbox" && (
          <div>
            <div style={{ ...S.card, marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0, lineHeight: 1.6 }}>
                When another Ghost Vault holder sends you an image or video, it appears here. Accept to save it to your room — decline to remove it permanently.
              </p>
            </div>

            {inbox.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <span style={{ fontSize: 40 }}>📭</span>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>No media received yet</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>When someone sends you content, it will appear here</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {inbox.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: item.status === "pending" ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${item.status === "pending" ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 16, overflow: "hidden",
                  }}
                >
                  {/* Header */}
                  <div style={{ padding: "12px 14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{item.type === "image" ? "🖼️" : "🎬"}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800, color: item.status === "pending" ? "rgba(74,222,128,0.9)" : "rgba(255,255,255,0.5)", margin: 0 }}>
                          From {item.senderGhostId}
                        </p>
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: 0 }}>
                          {fmtAgo(item.sentAt)} ·{" "}
                          <span style={{
                            fontWeight: 700,
                            color: item.status === "pending" ? "rgba(255,165,0,0.9)" : item.status === "accepted" ? "rgba(74,222,128,0.8)" : "#f87171",
                          }}>
                            {item.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    {item.status === "accepted" && (
                      <span style={{ fontSize: 9, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 5, padding: "2px 7px", color: "rgba(74,222,128,0.9)", fontWeight: 800 }}>
                        ✅ Saved
                      </span>
                    )}
                  </div>

                  {/* Preview */}
                  <div style={{ margin: "0 14px 12px", borderRadius: 10, overflow: "hidden", background: "rgba(0,0,0,0.4)" }}>
                    {item.type === "image" ? (
                      <img
                        src={item.content} alt=""
                        style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <video src={item.content} controls style={{ width: "100%", maxHeight: 200, display: "block" }} />
                    )}
                  </div>

                  {/* Actions */}
                  {item.status === "pending" && (
                    <div style={{ display: "flex", gap: 8, padding: "0 14px 14px" }}>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => acceptItem(item.id)}
                        style={{ flex: 1, height: 40, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <Check size={14} /> Accept & Save to Room
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => declineItem(item.id)}
                        style={{ width: 72, height: 40, borderRadius: 10, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                      >
                        Decline
                      </motion.button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MATCHES TAB ── */}
        {tab === "matches" && (
          <div>
            <div style={{ ...S.card, marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                All your active matches — connections expire after 48h if WhatsApp isn't opened. Tap to open WhatsApp or grant Ghost Vault access.
              </p>
            </div>

            {matches.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <img src={GHOST_LOGO} alt="ghost" style={{ width: 120, height: 120, objectFit: "contain" }} />
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", marginTop: 12 }}>No active matches yet</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Go back to the feed and start liking</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {matches.map((m) => {
                const { profile } = m;
                const ghostId = (() => {
                  let h = 0;
                  for (let i = 0; i < profile.id.length; i++) { h = Math.imul(31, h) + profile.id.charCodeAt(i) | 0; }
                  return `Ghost-${1000 + Math.abs(h) % 9000}`;
                })();
                const isGranted = granted.includes(ghostId);
                const timeLeft = Math.max(0, m.matchedAt + 48 * 60 * 60 * 1000 - Date.now());
                const hoursLeft = Math.floor(timeLeft / 3600000);
                const minsLeft = Math.floor((timeLeft % 3600000) / 60000);

                return (
                  <div key={m.id} style={S.card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img
                          src={profile.image} alt=""
                          style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(74,222,128,0.3)" }}
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                        <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 12 }}>{profile.countryFlag}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(74,222,128,0.9)", margin: 0 }}>{ghostId}</p>
                          {isGranted && (
                            <span style={{ fontSize: 9, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 4, padding: "1px 5px", color: "rgba(74,222,128,0.8)", fontWeight: 700 }}>Room Access</span>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "1px 0" }}>
                          {profile.age} · {profile.city}
                        </p>
                        <p style={{ fontSize: 10, color: hoursLeft < 6 ? "#f87171" : "rgba(255,255,255,0.25)", margin: 0 }}>
                          Expires in {hoursLeft}h {minsLeft}m
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => window.open(`https://wa.me/?text=Hey%20from%202Ghost!`, "_blank")}
                        style={{ flex: 1, height: 36, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #16a34a, #22c55e)", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                      >
                        <span>💬</span> WhatsApp
                      </motion.button>
                      {!isGranted ? (
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => grantRequest(ghostId)}
                          style={{ flex: 1, height: 36, borderRadius: 10, border: "1px solid rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.08)", color: "rgba(74,222,128,0.9)", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                        >
                          <span>🚪</span> Give Room Access
                        </motion.button>
                      ) : (
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => revokeAccess(ghostId)}
                          style={{ flex: 1, height: 36, borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.06)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                        >
                          <ShieldOff size={11} /> Revoke
                        </motion.button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
