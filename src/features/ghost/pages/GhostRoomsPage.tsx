import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";

const ROOM_BG      = "https://ik.imagekit.io/7grri5v7d/ghost%20rooms.png";
const GOLD_KEY     = "https://ik.imagekit.io/7grri5v7d/Haunted%20hotel%20key%20and%20tag.png";
const KINGS_BG     = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrt.png";
const PENTHOUSE_BG = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsd.png";
const LOFT_BG      = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsdstertefsdfsd.png";
const SUITE_BG     = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsds.png";
const STANDARD_BG  = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsdsterte.png";

type RoomTier = "standard" | "suite" | "kings" | "penthouse";

const ROOM_BG_IMAGES: Record<RoomTier, string> = {
  standard:  STANDARD_BG,
  suite:     SUITE_BG,
  kings:     KINGS_BG,
  penthouse: PENTHOUSE_BG,
};

// ── Stored review helpers ────────────────────────────────────────────────────
type UserReview = {
  id: string; tier: RoomTier; ghostId: string;
  city: string; stars: number; text: string; submittedAt: number;
};
function getStoredReviews(): UserReview[] {
  try { return JSON.parse(localStorage.getItem("ghost_room_reviews") || "[]"); } catch { return []; }
}
function saveReview(r: UserReview): void {
  try {
    const all = getStoredReviews().filter(x => x.tier !== r.tier); // one per tier
    localStorage.setItem("ghost_room_reviews", JSON.stringify([r, ...all]));
  } catch {}
}
function getMyGhostId(): string {
  try {
    const phone = localStorage.getItem("ghost_phone") ?? "";
    if (!phone) return "";
    // deterministic hash — same phone always yields same Ghost ID
    let h = 0;
    for (let i = 0; i < phone.length; i++) { h = Math.imul(31, h) + phone.charCodeAt(i) | 0; }
    return `Ghost-${1000 + Math.abs(h) % 9000}`;
  } catch { return ""; }
}
function isLoggedIn(): boolean {
  try { return !!localStorage.getItem("ghost_phone"); } catch { return false; }
}
function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 60)   return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  const d = Math.floor(m / 1440);
  return d === 1 ? "1 day ago" : d < 7 ? `${d} days ago` : d < 30 ? `${Math.floor(d / 7)} weeks ago` : `${Math.floor(d / 30)} months ago`;
}

// ── Review sheet component ───────────────────────────────────────────────────
function ReviewSheet({ tier, color, gradient, onClose, onSubmit }: {
  tier: RoomTier; color: string; gradient: string;
  onClose: () => void; onSubmit: (r: UserReview) => void;
}) {
  const [stars, setStars] = useState(0);
  const [city,  setCity]  = useState("");
  const [text,  setText]  = useState("");
  const [done,  setDone]  = useState(false);

  const loggedIn    = isLoggedIn();
  const activeTier  = readTier();
  const ghostId     = getMyGhostId();
  const canReview   = loggedIn && activeTier === tier;
  const roomName    = tier.charAt(0).toUpperCase() + tier.slice(1);
  const canSubmit   = canReview && stars > 0 && city.trim().length >= 2 && text.trim().length >= 20 && !done;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // re-verify at submit time — prevents manipulation
    if (!isLoggedIn() || readTier() !== tier) return;
    const review: UserReview = {
      id: `usr-${Date.now()}`, tier,
      ghostId, city: city.trim(),
      stars, text: text.trim(), submittedAt: Date.now(),
    };
    saveReview(review);
    onSubmit(review);
    setDone(true);
    setTimeout(onClose, 2200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 800,
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
          background: "rgba(8,8,12,0.99)", borderRadius: "24px 24px 0 0",
          border: `1px solid ${color}25`, borderBottom: "none", overflow: "hidden",
        }}
      >
        <div style={{ height: 3, background: gradient }} />
        <div style={{ padding: "20px 20px max(32px,env(safe-area-inset-bottom,32px))" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.08)", margin: "0 auto 18px" }} />

          {done ? (
            <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🌟</div>
              <p style={{ fontSize: 16, fontWeight: 900, color, margin: "0 0 6px" }}>Review submitted!</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>Thanks for helping the Ghost community</p>
            </div>
          ) : !loggedIn ? (
            <div style={{ textAlign: "center", padding: "24px 0 12px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
              <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>Sign in to leave a review</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", lineHeight: 1.6 }}>
                Only verified Ghost members who have stayed in a room can leave a review.
              </p>
              <button onClick={onClose} style={{ height: 44, borderRadius: 12, border: `1px solid ${color}33`, background: `${color}15`, color, fontSize: 13, fontWeight: 800, cursor: "pointer", padding: "0 24px" }}>
                Got it
              </button>
            </div>
          ) : !canReview ? (
            <div style={{ textAlign: "center", padding: "24px 0 12px" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏨</div>
              <p style={{ fontSize: 15, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>You're not in this room</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 6px", lineHeight: 1.6 }}>
                You can only review your active room.
              </p>
              <p style={{ fontSize: 11, color: `${color}99`, margin: "0 0 20px" }}>
                {activeTier ? `Your current room: ${activeTier.charAt(0).toUpperCase() + activeTier.slice(1)}` : "Unlock a room to leave a review."}
              </p>
              <button onClick={onClose} style={{ height: 44, borderRadius: 12, border: `1px solid ${color}33`, background: `${color}15`, color, fontSize: 13, fontWeight: 800, cursor: "pointer", padding: "0 24px" }}>
                Got it
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 16, fontWeight: 900, color: "#fff", margin: "0 0 4px" }}>Rate your {roomName} stay</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 6px" }}>Your review helps other members choose the right room</p>
              <p style={{ fontSize: 10, color: `${color}77`, margin: "0 0 18px", fontWeight: 700 }}>Reviewing as {ghostId}</p>

              {/* Star picker */}
              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>Your rating</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 20, justifyContent: "center" }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <motion.button
                    key={n} whileTap={{ scale: 0.85 }}
                    onClick={() => setStars(n)}
                    style={{
                      width: 48, height: 48, borderRadius: 12, border: "none",
                      background: n <= stars ? `${color}22` : "rgba(255,255,255,0.04)",
                      outline: n <= stars ? `1.5px solid ${color}66` : "1px solid rgba(255,255,255,0.08)",
                      cursor: "pointer", fontSize: 22,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ filter: n <= stars ? "none" : "grayscale(1)", opacity: n <= stars ? 1 : 0.35 }}>★</span>
                  </motion.button>
                ))}
              </div>

              {/* City */}
              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>Your city</p>
              <input
                value={city} onChange={e => setCity(e.target.value.slice(0, 30))}
                placeholder="e.g. Dubai, London, Tokyo..."
                style={{
                  width: "100%", borderRadius: 12, border: `1px solid ${color}25`,
                  background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13,
                  padding: "11px 14px", outline: "none", fontFamily: "inherit",
                  marginBottom: 14, boxSizing: "border-box",
                }}
              />

              {/* Review text */}
              <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>Your review</p>
              <textarea
                value={text} onChange={e => setText(e.target.value.slice(0, 220))}
                placeholder="What was your experience? Did you get matches, use the boost, try the Ghost Butler?..."
                rows={3}
                style={{
                  width: "100%", borderRadius: 12, border: `1px solid ${color}25`,
                  background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 12,
                  padding: "10px 12px", resize: "none", outline: "none",
                  fontFamily: "inherit", lineHeight: 1.55, boxSizing: "border-box",
                  marginBottom: 6,
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>Min. 20 characters</span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{text.length}/220</span>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={!canSubmit}
                style={{
                  width: "100%", height: 50, borderRadius: 14, border: "none",
                  background: canSubmit ? gradient : "rgba(255,255,255,0.06)",
                  color: canSubmit ? "#0a0700" : "rgba(255,255,255,0.2)",
                  fontSize: 14, fontWeight: 900, cursor: canSubmit ? "pointer" : "default",
                  boxShadow: canSubmit ? `0 4px 20px ${color}44` : "none",
                }}
              >
                Submit Review ✦
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

type RoomReview = { id: string; city: string; text: string; stars: number; ago: string; verified?: boolean };
const ROOM_REVIEWS: Record<RoomTier, RoomReview[]> = {
  standard: [
    { id: "GH-4821", city: "Dubai",    stars: 4, ago: "3 weeks ago",  text: "Honest — got my first match in week one. Worth it just to test the waters." },
    { id: "GH-2093", city: "London",   stars: 4, ago: "1 month ago",  text: "I knew after 2 weeks I'd be upgrading. Standard does what it says though." },
  ],
  suite: [
    { id: "GH-7734", city: "Jakarta",  stars: 5, ago: "2 weeks ago",  text: "The weekly boost is real. I was top of the stack for a full hour. Matches came in." },
    { id: "GH-3312", city: "Singapore",stars: 5, ago: "3 weeks ago",  text: "Big jump from Standard. Ghost Butler numbers alone make it worth it." },
  ],
  kings: [
    { id: "GH-9901", city: "Riyadh",   stars: 5, ago: "1 week ago",   text: "4 open conversations right now. Unlimited unlocks is not a gimmick." },
    { id: "GH-5588", city: "Paris",    stars: 5, ago: "2 weeks ago",  text: "Seeing who liked me changed how I use the app completely. Serious room." },
  ],
  penthouse: [
    { id: "GH-0011", city: "Monaco",   stars: 5, ago: "5 days ago",   text: "You stop thinking about tiers when you're here. It's just a different level." },
    { id: "GH-1199", city: "Tokyo",    stars: 5, ago: "1 week ago",   text: "4 meaningful conversations in one week on the floor. No noise, all signal." },
  ],
};

function readTier(): RoomTier | null {
  try { return (localStorage.getItem("ghost_house_tier") as RoomTier | null) ?? null; } catch { return null; }
}
function writeTier(t: RoomTier) {
  try { localStorage.setItem("ghost_house_tier", t); } catch {}
}

const ROOMS = [
  {
    key: "standard" as RoomTier,
    icon: "🛏️",
    name: "Standard Room",
    tagline: "Your first key to the Ghost House",
    price: "$4.99 one-time",
    color: "#c0c0c0",
    border: "rgba(192,192,192,0.4)",
    bg: "rgba(192,192,192,0.06)",
    glow: "rgba(192,192,192,0.35)",
    gradient: "linear-gradient(135deg, #707070, #c0c0c0, #e8e8e8)",
    features: [
      "2 match unlocks included",
      "Ghost Vault: 5 photos",
      "Ghost Flash: 1 session / month",
      "Standard Room badge on profile",
      "Access to Ghost Butler (view only)",
    ],
  },
  {
    key: "suite" as RoomTier,
    icon: "🏨",
    name: "Suite Room",
    tagline: "More space, more power, more matches",
    price: "$9.99 one-time",
    color: "#cd7f32",
    border: "rgba(205,127,50,0.4)",
    bg: "rgba(205,127,50,0.07)",
    glow: "rgba(205,127,50,0.4)",
    gradient: "linear-gradient(135deg, #7a3b10, #cd7f32, #e8a050)",
    features: [
      "5 match unlocks included",
      "Ghost Vault: 10 photos · 3 videos",
      "Ghost Flash: 4 sessions / month",
      "1 weekly profile boost (1 hr top of stack)",
      "Suite badge on your profile card",
      "Ghost Butler access — service numbers visible",
      "Priority in browse stack over free users",
    ],
  },
  {
    key: "kings" as RoomTier,
    icon: "👑",
    name: "Kings Room",
    tagline: "The room where serious matches happen",
    price: "$14.99 one-time",
    color: "#d4af37",
    border: "rgba(212,175,55,0.45)",
    bg: "rgba(212,175,55,0.07)",
    glow: "rgba(212,175,55,0.5)",
    gradient: "linear-gradient(135deg, #92400e, #d4af37)",
    features: [
      "Unlimited match unlocks",
      "Ghost Vault: 50 photos · 10 videos",
      "Ghost Flash: unlimited sessions",
      "3 profile boosts per week",
      "Kings Room badge — top of every stack",
      "Ghost Butler — all 7 service numbers visible",
      "Tonight Mode always on",
      "See who liked you",
      "Profile featured in Ghost Pulse row",
    ],
  },
  {
    key: "penthouse" as RoomTier,
    icon: "🏙️",
    name: "Penthouse",
    tagline: "The highest floor. Reserved for the elite.",
    price: "$19.99 one-time",
    color: "#e8e4d0",
    border: "rgba(232,228,208,0.45)",
    bg: "rgba(232,228,208,0.07)",
    glow: "rgba(232,228,208,0.5)",
    gradient: "linear-gradient(135deg, #8a8070, #c8c0a8, #e8e4d0)",
    features: [
      "Everything in Kings Room",
      "Penthouse profile badge — globally visible",
      "Unlimited Ghost Butler real-world deliveries",
      "Featured on Ghost Pulse — all countries",
      "Dedicated concierge priority queue",
      "Early access to all new features",
      "Penthouse Floor — exclusive member lounge",
      "Custom Ghost ID display name",
    ],
  },
] as const;

export default function GhostRoomsPage() {
  const navigate  = useNavigate();
  useGenderAccent();
  const [currentTier,   setCurrentTier]   = useState<RoomTier | null>(readTier);
  const [buying,        setBuying]         = useState<RoomTier | null>(null);
  const [justBought,    setJustBought]     = useState<RoomTier | null>(null);
  const [previewImg,    setPreviewImg]     = useState<string | null>(null);
  const [reviewTarget,  setReviewTarget]   = useState<RoomTier | null>(null);
  const [storedReviews, setStoredReviews]  = useState<UserReview[]>(getStoredReviews);

  const handlePurchase = (tier: RoomTier) => {
    if (buying) return;
    setBuying(tier);
    setTimeout(() => {
      writeTier(tier);
      setCurrentTier(tier);
      setBuying(null);
      setJustBought(tier);
      setTimeout(() => setJustBought(null), 3000);
    }, 1400);
  };

  const tierRank: Record<RoomTier, number> = { standard: 0, suite: 1, kings: 2, penthouse: 3 };
  const ownedRank = currentTier ? tierRank[currentTier] : -1;

  return (
    <div style={{
      minHeight: "100dvh", width: "100%",
      background: "#050508",
      display: "flex", flexDirection: "column",
      overflowY: "auto", overflowX: "hidden",
    }}>
      {/* Hero background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `url(${ROOM_BG})`,
        backgroundSize: "cover", backgroundPosition: "center top",
        opacity: 0.18,
        pointerEvents: "none",
      }} />
      {/* Dark overlay */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1, background: "rgba(3,4,8,0.82)", pointerEvents: "none" }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", minHeight: "100dvh" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "env(safe-area-inset-top, 16px) 16px 0",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
          flexShrink: 0,
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <ArrowLeft size={18} color="rgba(255,255,255,0.8)" />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.1 }}>Ghost Rooms</h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>Choose your floor</p>
          </div>
          <img src={GOLD_KEY} alt="" style={{ width: 40, height: 40, objectFit: "contain", opacity: 0.9 }} />
        </div>

        {/* Tagline */}
        <div style={{ padding: "16px 18px 8px", flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6, textAlign: "center" }}>
            A Room badge signals everything without saying a word.<br />
            Members notice. The right people filter for it.
          </p>
        </div>

        {/* Room cards */}
        <div style={{ padding: "8px 14px calc(env(safe-area-inset-bottom, 0px) + 24px)", display: "flex", flexDirection: "column", gap: 12 }}>
          {ROOMS.map((room, idx) => {
            const owned   = ownedRank >= idx;
            const active  = buying === room.key;
            const bought  = justBought === room.key;

            return (
              <motion.div
                key={room.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, type: "spring", stiffness: 280, damping: 24 }}
                style={{
                  borderRadius: 18,
                  background: room.bg,
                  border: `1px solid ${owned ? room.border : "rgba(255,255,255,0.08)"}`,
                  overflow: "hidden",
                  boxShadow: owned ? `0 0 24px ${room.glow}` : "none",
                  position: "relative",
                }}
              >
                {/* Kings Room background image */}
                {room.key === "kings" && <>
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url(${KINGS_BG})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    opacity: 0.5,
                    pointerEvents: "none",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to right, rgba(10,7,0,0.78), rgba(10,7,0,0.5))",
                    pointerEvents: "none",
                  }} />
                </>}

                {/* Standard background image */}
                {room.key === "standard" && <>
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url(${STANDARD_BG})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    opacity: 0.5,
                    pointerEvents: "none",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to right, rgba(6,6,6,0.78), rgba(6,6,6,0.5))",
                    pointerEvents: "none",
                  }} />
                </>}

                {/* Suite background image */}
                {room.key === "suite" && <>
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url(${SUITE_BG})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    opacity: 0.5,
                    pointerEvents: "none",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to right, rgba(10,5,2,0.78), rgba(10,5,2,0.5))",
                    pointerEvents: "none",
                  }} />
                </>}

                {/* Penthouse background image */}
                {room.key === "penthouse" && <>
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url(${PENTHOUSE_BG})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    opacity: 0.5,
                    pointerEvents: "none",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to right, rgba(6,4,2,0.78), rgba(6,4,2,0.5))",
                    pointerEvents: "none",
                  }} />
                </>}

                {/* Top stripe */}
                <div style={{ height: 3, background: owned ? room.gradient : "rgba(255,255,255,0.06)", position: "relative", zIndex: 1 }} />

                <div style={{ padding: "14px 16px 16px", position: "relative", zIndex: 1 }}>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{room.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: owned ? room.color : "#fff" }}>{room.name}</span>
                        {owned && (
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20,
                            background: `${room.color}22`, border: `1px solid ${room.color}55`,
                            color: room.color, letterSpacing: "0.08em",
                          }}>✓ ACTIVE</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>{room.tagline}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.55)", flexShrink: 0 }}>{room.price}</span>
                  </div>

                  {/* Room image thumbnail */}
                  <div
                    onClick={() => setPreviewImg(ROOM_BG_IMAGES[room.key])}
                    style={{
                      width: "100%", height: 80, borderRadius: 10, overflow: "hidden",
                      marginBottom: 12, cursor: "pointer", position: "relative",
                      border: `1px solid ${room.color}22`,
                    }}
                  >
                    <img
                      src={ROOM_BG_IMAGES[room.key]} alt={room.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)",
                    }} />
                    <span style={{
                      position: "absolute", bottom: 6, right: 8,
                      fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.6)",
                      letterSpacing: "0.08em",
                    }}>TAP TO VIEW ↗</span>
                  </div>

                  {/* Features */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                    {room.features.map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <Check size={11} color={owned ? room.color : "rgba(255,255,255,0.25)"} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 11, color: owned ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)", lineHeight: 1.45 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Member reviews */}
                  {(() => {
                    const myReview = storedReviews.find(r => r.tier === room.key);
                    const allReviews: RoomReview[] = [
                      ...(myReview ? [{ id: myReview.ghostId, city: myReview.city, stars: myReview.stars, text: myReview.text, ago: timeAgo(myReview.submittedAt), verified: true }] : []),
                      ...ROOM_REVIEWS[room.key],
                    ];
                    return (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <p style={{ fontSize: 8, fontWeight: 800, color: `${room.color}66`, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
                            What members say
                          </p>
                          {myReview && (
                            <span style={{ fontSize: 8, color: `${room.color}88`, fontWeight: 700 }}>Your review ✓</span>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                          {allReviews.map((r, i) => (
                            <div key={`${r.id}-${i}`} style={{
                              background: r.verified ? `${room.color}0a` : "rgba(255,255,255,0.04)",
                              borderRadius: 10,
                              border: `1px solid ${r.verified ? room.color + "33" : room.color + "18"}`,
                              padding: "8px 10px",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 9, fontWeight: 800, color: room.color }}>#{r.id}</span>
                                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{r.city}</span>
                                  {r.verified && (
                                    <span style={{ fontSize: 7, fontWeight: 800, color: room.color, background: `${room.color}18`, borderRadius: 4, padding: "1px 5px" }}>✓ VERIFIED STAY</span>
                                  )}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  {"★".repeat(r.stars).split("").map((s, si) => (
                                    <span key={si} style={{ fontSize: 9, color: room.color }}>{s}</span>
                                  ))}
                                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>{r.ago}</span>
                                </div>
                              </div>
                              <p style={{ fontSize: 10, color: r.verified ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                                "{r.text}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* CTA */}
                  <AnimatePresence mode="wait">
                    {bought ? (
                      <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        style={{ height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${room.color}18`, border: `1px solid ${room.color}40` }}
                      >
                        <Check size={15} color={room.color} />
                        <span style={{ fontSize: 13, fontWeight: 800, color: room.color }}>Room Unlocked!</span>
                      </motion.div>
                    ) : owned ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `${room.color}10`, border: `1px solid ${room.color}30` }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: `${room.color}99` }}>
                            {room.key === currentTier ? "Your current room" : "Previously stayed"}
                          </span>
                        </div>
                        {/* Rate button only for exact active tier + logged-in members */}
                        {room.key === currentTier && isLoggedIn() && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setReviewTarget(room.key)}
                            style={{
                              width: 90, height: 44, borderRadius: 12, border: `1px solid ${room.color}44`,
                              background: `${room.color}14`, color: room.color,
                              fontSize: 11, fontWeight: 800, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                              flexShrink: 0,
                            }}
                          >
                            🌟 Rate
                          </motion.button>
                        )}
                      </div>
                    ) : (
                      <motion.button
                        key="buy"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handlePurchase(room.key)}
                        disabled={active}
                        style={{
                          width: "100%", height: 44, borderRadius: 12, border: "none",
                          background: active ? "rgba(255,255,255,0.07)" : room.gradient,
                          color: active ? "rgba(255,255,255,0.4)" : "#0a0700",
                          fontSize: 13, fontWeight: 800, cursor: active ? "default" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                          boxShadow: active ? "none" : `0 3px 16px ${room.glow}`,
                          transition: "all 0.2s",
                        }}
                      >
                        {active ? (
                          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                            Unlocking…
                          </motion.span>
                        ) : (
                          `Enter ${room.name} — ${room.price}`
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}

          {/* ── The Loft floor card ── */}
          {(() => {
            const VIOLET  = "#d4af37";
            const VBORDER = "rgba(212,175,55,0.4)";
            const VBG     = "rgba(212,175,55,0.06)";
            const VGLOW   = "rgba(212,175,55,0.45)";
            const VGRAD   = "linear-gradient(135deg, #92660a, #d4af37, #f5e88a, #e8e0c8)";
            const loftReviews = [
              { id: "GH-3341", city: "Berlin",  stars: 5, ago: "1 week ago",  text: "Finally a space that actually feels safe. Met someone real in week one." },
              { id: "GH-7712", city: "London",  stars: 5, ago: "2 weeks ago", text: "The Men's Lounge is exactly what was missing. Quality people, no noise." },
            ];
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, type: "spring", stiffness: 280, damping: 24 }}
                style={{
                  borderRadius: 18, background: VBG,
                  border: `1px solid ${VBORDER}`,
                  overflow: "hidden", position: "relative",
                  boxShadow: `0 0 24px ${VGLOW}`,
                }}
              >
                {/* Background image */}
                {LOFT_BG && <>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${LOFT_BG})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5, pointerEvents: "none" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(8,4,18,0.78), rgba(8,4,18,0.5))", pointerEvents: "none" }} />
                </>}
                {!LOFT_BG && (
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(92,66,10,0.3), rgba(212,175,55,0.1))", pointerEvents: "none" }} />
                )}

                {/* Top stripe */}
                <div style={{ height: 3, background: VGRAD, position: "relative", zIndex: 1 }} />

                <div style={{ padding: "14px 16px 16px", position: "relative", zIndex: 1 }}>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>🪟</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: VIOLET }}>The Loft</span>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: `${VIOLET}22`, border: `1px solid ${VIOLET}55`, color: VIOLET, letterSpacing: "0.08em" }}>
                          EXCLUSIVE FLOOR
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>Gay · Lesbian · The Mix — curated & safe</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.55)", flexShrink: 0 }}>$11.99 one-time</span>
                  </div>

                  {/* Room image thumbnail */}
                  {LOFT_BG && (
                    <div
                      onClick={() => setPreviewImg(LOFT_BG)}
                      style={{ width: "100%", height: 80, borderRadius: 10, overflow: "hidden", marginBottom: 12, cursor: "pointer", position: "relative", border: `1px solid rgba(212,175,55,0.22)` }}
                    >
                      <img src={LOFT_BG} alt="The Loft" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
                      <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>TAP TO VIEW ↗</span>
                    </div>
                  )}

                  {/* Features */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                    {[
                      "Three curated sections — Men's Lounge · Women's Suite · The Mix",
                      "Admin-verified guests only — max 30 per city floor",
                      "Send gifts with a personal opener note",
                      "2 free gifts daily — coins for more",
                      "Mutual like → private Vault chat opens",
                      "Browse other city Lofts for +$14.99/city",
                      "Safe, respectful, anonymous — always",
                    ].map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <Check size={11} color={VIOLET} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Reviews */}
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 8, fontWeight: 800, color: `${VIOLET}66`, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>What members say</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {loftReviews.map(r => (
                        <div key={r.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, border: `1px solid ${VIOLET}18`, padding: "8px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 9, fontWeight: 800, color: VIOLET }}>#{r.id}</span>
                              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{r.city}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                              {"★".repeat(r.stars).split("").map((_, i) => <span key={i} style={{ fontSize: 9, color: VIOLET }}>★</span>)}
                              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>{r.ago}</span>
                            </div>
                          </div>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{r.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/ghost/loft")}
                    style={{
                      width: "100%", height: 44, borderRadius: 12, border: "none",
                      background: VGRAD, color: "#fff",
                      fontSize: 13, fontWeight: 800, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      boxShadow: `0 3px 16px ${VGLOW}`,
                    }}
                  >
                    🪟 Enter The Loft — $11.99 →
                  </motion.button>
                </div>
              </motion.div>
            );
          })()}

          {/* ── Penthouse floor card ── */}
          {(() => {
            const GOLD   = "#d4af37";
            const GGRAD  = "linear-gradient(135deg, #92660a, #d4af37, #f0d060)";
            const GGLOW  = "rgba(212,175,55,0.45)";
            const penthouseReviews = [
              { id: "GH-0011", city: "Monaco", stars: 5, ago: "5 days ago",  text: "You stop thinking about tiers when you're here. It's just a different level." },
              { id: "GH-1199", city: "Tokyo",  stars: 5, ago: "1 week ago",  text: "4 meaningful conversations in one week on the floor. No noise, all signal." },
            ];
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, type: "spring", stiffness: 280, damping: 24 }}
                style={{
                  borderRadius: 18, background: "rgba(212,175,55,0.07)",
                  border: `1px solid rgba(212,175,55,0.4)`,
                  overflow: "hidden", position: "relative",
                  boxShadow: `0 0 24px ${GGLOW}`,
                }}
              >
                {/* Background image */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${PENTHOUSE_BG})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5, pointerEvents: "none" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(6,4,2,0.78), rgba(6,4,2,0.5))", pointerEvents: "none" }} />

                {/* Top stripe */}
                <div style={{ height: 3, background: GGRAD, position: "relative", zIndex: 1 }} />

                <div style={{ padding: "14px 16px 16px", position: "relative", zIndex: 1 }}>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>🏙️</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: GOLD }}>Penthouse Floor</span>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: `${GOLD}22`, border: `1px solid ${GOLD}55`, color: GOLD, letterSpacing: "0.08em" }}>
                          ELITE FLOOR
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>The highest floor. Reserved for the elite.</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.55)", flexShrink: 0 }}>$19.99 one-time</span>
                  </div>

                  {/* Room image thumbnail */}
                  <div
                    onClick={() => setPreviewImg(PENTHOUSE_BG)}
                    style={{ width: "100%", height: 80, borderRadius: 10, overflow: "hidden", marginBottom: 12, cursor: "pointer", position: "relative", border: `1px solid ${GOLD}22` }}
                  >
                    <img src={PENTHOUSE_BG} alt="Penthouse" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
                    <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>TAP TO VIEW ↗</span>
                  </div>

                  {/* Features */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                    {[
                      "Admin-curated women only — max 30 per city floor",
                      "Landscape cards with bio, religion & stay type",
                      "Send gifts with a personal opener note",
                      "2 free gifts daily — coins for more",
                      "Mutual like → private Vault chat opens",
                      "Browse other city floors for +$19.99/city",
                      "Vault chat never expires for members",
                    ].map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <Check size={11} color={GOLD} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Reviews */}
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 8, fontWeight: 800, color: `${GOLD}66`, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>What members say</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {penthouseReviews.map(r => (
                        <div key={r.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, border: `1px solid ${GOLD}18`, padding: "8px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 9, fontWeight: 800, color: GOLD }}>#{r.id}</span>
                              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{r.city}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                              {"★".repeat(r.stars).split("").map((_, i) => <span key={i} style={{ fontSize: 9, color: GOLD }}>★</span>)}
                              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>{r.ago}</span>
                            </div>
                          </div>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{r.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/ghost/penthouse")}
                    style={{
                      width: "100%", height: 44, borderRadius: 12, border: "none",
                      background: GGRAD, color: "#0a0700",
                      fontSize: 13, fontWeight: 800, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      boxShadow: `0 3px 16px ${GGLOW}`,
                    }}
                  >
                    🏙️ Enter the Penthouse Floor →
                  </motion.button>
                </div>
              </motion.div>
            );
          })()}

          {/* ── The Cellar floor card ── */}
          {(() => {
            const CELLAR_BG_CARD = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsdstertefsdfsddsd.png";
            const CRIM   = "#c0392b";
            const CGRAD  = "linear-gradient(135deg, #6b0f0f, #c0392b, #e8553f)";
            const CGLOW  = "rgba(192,57,43,0.45)";
            const CBORDER = "rgba(192,57,43,0.4)";
            const CBG     = "rgba(192,57,43,0.06)";
            const cellarReviews = [
              { id: "GH-5521", city: "Berlin", stars: 5, ago: "3 days ago",  text: "Finally a place for people who are upfront. No games, just real energy. Met someone on night one." },
              { id: "GH-8803", city: "Miami",  stars: 5, ago: "1 week ago",  text: "The Wild section is exactly what it sounds like. Bold people, no judgement. Love it." },
            ];
            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, type: "spring", stiffness: 280, damping: 24 }}
                style={{
                  borderRadius: 18, background: CBG,
                  border: `1px solid ${CBORDER}`,
                  overflow: "hidden", position: "relative",
                  boxShadow: `0 0 24px ${CGLOW}`,
                }}
              >
                {/* Background image */}
                {CELLAR_BG_CARD && <>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${CELLAR_BG_CARD})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.5, pointerEvents: "none" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(14,3,3,0.78), rgba(14,3,3,0.5))", pointerEvents: "none" }} />
                </>}
                {!CELLAR_BG_CARD && (
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(107,15,15,0.3), rgba(192,57,43,0.1))", pointerEvents: "none" }} />
                )}

                {/* Top stripe */}
                <div style={{ height: 3, background: CGRAD, position: "relative", zIndex: 1 }} />

                <div style={{ padding: "14px 16px 16px", position: "relative", zIndex: 1 }}>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>🔥</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 16, fontWeight: 900, color: CRIM }}>The Cellar</span>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: `${CRIM}22`, border: `1px solid ${CRIM}55`, color: CRIM, letterSpacing: "0.08em" }}>
                          18+ ADULTS ONLY
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>Flirty · Naughty · Wild — bold & no judgement</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.55)", flexShrink: 0 }}>$11.99 one-time</span>
                  </div>

                  {/* Room image thumbnail */}
                  <div
                    onClick={() => setPreviewImg(CELLAR_BG_CARD)}
                    style={{ width: "100%", height: 80, borderRadius: 10, overflow: "hidden", marginBottom: 12, cursor: "pointer", position: "relative", border: `1px solid rgba(192,57,43,0.22)` }}
                  >
                    <img src={CELLAR_BG_CARD} alt="The Cellar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)" }} />
                    <span style={{ position: "absolute", bottom: 6, right: 8, fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>TAP TO VIEW ↗</span>
                  </div>

                  {/* Features */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12 }}>
                    {[
                      "Three sections — Flirty · Naughty · Wild",
                      "Age-verified adults only — max 30 per city floor",
                      "Send gifts with a personal opener note",
                      "2 free daily gifts — coins for more",
                      "Mutual like → private Vault chat opens",
                      "Browse other city Cellars for +$12.99/city",
                      "Anonymous · safe · no explicit content",
                    ].map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <Check size={11} color={CRIM} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Reviews */}
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 8, fontWeight: 800, color: `${CRIM}66`, letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 8px" }}>What members say</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {cellarReviews.map(r => (
                        <div key={r.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, border: `1px solid ${CRIM}18`, padding: "8px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 9, fontWeight: 800, color: CRIM }}>#{r.id}</span>
                              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{r.city}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                              {"★".repeat(r.stars).split("").map((_, i) => <span key={i} style={{ fontSize: 9, color: CRIM }}>★</span>)}
                              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", marginLeft: 4 }}>{r.ago}</span>
                            </div>
                          </div>
                          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{r.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/ghost/cellar")}
                    style={{
                      width: "100%", height: 44, borderRadius: 12, border: "none",
                      background: CGRAD, color: "#fff",
                      fontSize: 13, fontWeight: 800, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      boxShadow: `0 3px 16px ${CGLOW}`,
                    }}
                  >
                    🔥 Enter The Cellar — $11.99 →
                  </motion.button>
                </div>
              </motion.div>
            );
          })()}
        </div>
      </div>

      {/* Review sheet */}
      <AnimatePresence>
        {reviewTarget && (() => {
          const room = ROOMS.find(r => r.key === reviewTarget)!;
          return (
            <ReviewSheet
              key="review"
              tier={reviewTarget}
              color={room.color}
              gradient={room.gradient}
              onClose={() => setReviewTarget(null)}
              onSubmit={r => setStoredReviews(prev => [r, ...prev.filter(x => x.tier !== r.tier)])}
            />
          );
        })()}
      </AnimatePresence>

      {/* Fullscreen image lightbox */}
      <AnimatePresence>
        {previewImg && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPreviewImg(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 999,
              background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "24px",
            }}
          >
            <motion.img
              src={previewImg}
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              style={{
                width: "100%", maxWidth: 480, maxHeight: "80dvh",
                borderRadius: 20, objectFit: "cover",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 0 80px rgba(0,0,0,0.8)",
              }}
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={() => setPreviewImg(null)}
              style={{
                position: "absolute", top: 20, right: 20,
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >×</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
