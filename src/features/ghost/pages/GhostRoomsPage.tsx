import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
const GHOST_LOGO = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwq.png?updatedAt=1774116887135";
import { useNavigate } from "react-router-dom";
import { useGenderAccent } from "@/shared/hooks/useGenderAccent";
import { hasSeenHowItWorks } from "./GhostHowItWorksPage";
import WelcomeGiftPopup, { shouldShowWelcomeGift } from "../components/WelcomeGiftPopup";

const ROOM_BG      = "https://ik.imagekit.io/7grri5v7d/ghost%20rooms.png";
const KINGS_BG     = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrt.png";
const PENTHOUSE_BG = "https://ik.imagekit.io/7grri5v7d/sdsdffsdfsdfasdasdasdas.png";
const LOFT_BG      = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsdstertefsdfsd.png";
const SUITE_BG     = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdwqdssdsdewtrewrtdsds.png";
const STANDARD_BG  = "https://ik.imagekit.io/7grri5v7d/sdsdffsdfsdfasdasd.png";
const CELLAR_BG    = "https://ik.imagekit.io/7grri5v7d/sdsdffsdfsdf.png";

type RoomTier = "standard" | "suite" | "kings" | "penthouse" | "cellar" | "garden" | "loft";

const GARDEN_BG = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdfvcxcvzxcvasfdfasd.png";

const ROOM_BG_IMAGES: Record<RoomTier, string> = {
  standard:  STANDARD_BG,
  suite:     SUITE_BG,
  kings:     KINGS_BG,
  penthouse: PENTHOUSE_BG,
  cellar:    CELLAR_BG,
  garden:    GARDEN_BG,
  loft:      LOFT_BG,
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
    return `Guest-${1000 + Math.abs(h) % 9000}`;
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
                Only verified guests who have stayed in a room can leave a review.
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
  cellar: [
    { id: "GH-3355", city: "Amsterdam", stars: 5, ago: "4 days ago",  text: "Different energy entirely. The anonymity goes deeper here. Real conversations." },
    { id: "GH-7744", city: "Berlin",    stars: 5, ago: "1 week ago",  text: "Came for the curiosity. Stayed for the actual connections. Not for everyone — that's the point." },
  ],
  loft: [
    { id: "GH-6622", city: "Amsterdam", stars: 5, ago: "2 days ago",  text: "The Loft is the first floor on any app that felt genuinely inclusive. Safe, warm, real." },
    { id: "GH-4490", city: "London",    stars: 5, ago: "5 days ago",  text: "As a bi woman I've never felt so seen. Both sections work. The Mix is brilliant." },
  ],
  garden: [
    { id: "GH-5201", city: "Cape Town", stars: 5, ago: "3 days ago",  text: "Finally — an app that respects where I am in life. The pace here is different. Real conversations." },
    { id: "GH-8847", city: "Edinburgh", stars: 5, ago: "1 week ago",  text: "At 52 I've done the noise. Garden Lodge is the only floor I'd recommend to someone who actually knows what they want." },
  ],
};

function readTier(): RoomTier | null {
  try { return (localStorage.getItem("ghost_house_tier") as RoomTier | null) ?? null; } catch { return null; }
}
function writeTier(t: RoomTier) {
  try {
    localStorage.setItem("ghost_house_tier", t);
    localStorage.setItem("ghost_house_tier_until", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
  } catch {}
}

// ── Active member data per room ───────────────────────────────────────────────
const ROOM_ACTIVITY: Record<RoomTier, { members: number; tonight: number; avatarSeeds: number[] }> = {
  standard:  { members: 1247, tonight: 89,  avatarSeeds: [3,7,12,15,22]  },
  suite:     { members: 428,  tonight: 34,  avatarSeeds: [28,31,45,49,52] },
  kings:     { members: 156,  tonight: 21,  avatarSeeds: [8,19,33,44,61]  },
  penthouse: { members: 47,   tonight: 12,  avatarSeeds: [2,6,11,17,24]   },
  cellar:    { members: 83,   tonight: 18,  avatarSeeds: [35,38,42,56,63] },
  garden:    { members: 214,  tonight: 38,  avatarSeeds: [4,9,16,23,31]  },
  loft:      { members: 312,  tonight: 27,  avatarSeeds: [5,14,20,26,39]  },
};

const ROOMS = [
  {
    key: "cellar" as RoomTier,
    floorLevel: "B1",
    rank: -1,
    icon: "🍷",
    iconImg: "https://ik.imagekit.io/7grri5v7d/UntitledSDFSDFASDF.png?updatedAt=1774209861112" as string | undefined,
    name: "The Cellar",
    tagline: "Bold connections · Adults only",
    price: "Free (women) · 150 coins (men)",
    color: "#c0392b",
    border: "rgba(192,57,43,0.4)",
    bg: "rgba(192,57,43,0.06)",
    glow: "rgba(192,57,43,0.35)",
    gradient: "linear-gradient(135deg, #7b241c, #c0392b, #e74c3c)",
    giftCoins: 25,
    features: [
      "Free entry for verified women",
      "150 coins entry for men (24hr access)",
      "Bold, anonymous deep conversations",
      "Cellar badge — discreet but recognised",
      "Private group room — The Vault Below",
      "Bold starter prompts — no small talk",
    ],
  },
  {
    key: "standard" as RoomTier,
    floorLevel: "G",
    rank: 0,
    icon: "🛏️",
    iconImg: "https://ik.imagekit.io/7grri5v7d/sdfsdfsdf-removebg-preview.png" as string | undefined,
    name: "Standard Room",
    tagline: "Free entry — your key to the Ghost House",
    price: "Free",
    color: "#c0c0c0",
    border: "rgba(192,192,192,0.4)",
    bg: "rgba(192,192,192,0.06)",
    glow: "rgba(192,192,192,0.35)",
    gradient: "linear-gradient(135deg, #707070, #c0c0c0, #e8e8e8)",
    giftCoins: 15,
    features: [
      "Free to join — no card needed",
      "Send gifts to connect · costs coins",
      "Unlock matches with coins",
      "Ghost Vault: 5 photos",
      "Floor group chat access",
      "Coins available to buy anytime",
    ],
  },
  {
    key: "garden" as RoomTier,
    floorLevel: "G+",
    rank: 0,
    icon: "🌿",
    iconImg: "https://ik.imagekit.io/7grri5v7d/DSFASDFASDWE-removebg-preview.png" as string | undefined,
    name: "Garden Lodge",
    tagline: "Free entry · 40+ guests · for those who know exactly what they want",
    price: "Free",
    color: "#7a9e7e",
    border: "rgba(122,158,126,0.45)",
    bg: "rgba(122,158,126,0.07)",
    glow: "rgba(122,158,126,0.45)",
    gradient: "linear-gradient(135deg, #3a5c3e, #7a9e7e, #a0c8a4)",
    giftCoins: 40,
    features: [
      "Unlimited connections — no monthly cap",
      "Ghost Vault: 30 photos · 5 videos",
      "Private Terrace chat — intimate floor lounge",
      "Garden Lodge 🌿 badge on your profile",
      "Ghost Butler — all services included",
      "Morning coffee prompt — daily conversation starter",
      "Profiles presented one at a time — no swipe grid",
      "Privacy upgrade available — remove from main browse",
    ],
  },
  {
    key: "suite" as RoomTier,
    floorLevel: "1F",
    rank: 1,
    icon: "🛎️",
    iconImg: "https://ik.imagekit.io/7grri5v7d/Untitledsdfasdfasdf-removebg-preview.png" as string | undefined,
    name: "Ensuite",
    tagline: "Earned by completing your profile",
    price: "$9.99/mo",
    color: "#cd7f32",
    border: "rgba(205,127,50,0.4)",
    bg: "rgba(205,127,50,0.07)",
    glow: "rgba(205,127,50,0.4)",
    gradient: "linear-gradient(135deg, #7a3b10, #cd7f32, #e8a050)",
    giftCoins: 30,
    features: [
      "5 match unlocks / month",
      "Ghost Vault: 10 photos · 3 videos",
      "Ghost Flash: 4 sessions / month",
      "1 weekly profile boost (1 hr top of stack)",
      "Suite badge on your profile card",
      "Floor group chat + Vault private chat",
      "Ghost Butler access — service numbers visible",
      "Priority in browse stack over free users",
    ],
  },
  {
    key: "kings" as RoomTier,
    floorLevel: "2F",
    rank: 2,
    icon: "🎰",
    iconImg: "https://ik.imagekit.io/7grri5v7d/SADFASDFASDFASDFS-removebg-preview.png" as string | undefined,
    name: "The Casino",
    tagline: "The room where serious matches happen",
    price: "$14.99/mo",
    color: "#d4af37",
    border: "rgba(212,175,55,0.45)",
    bg: "rgba(212,175,55,0.07)",
    glow: "rgba(212,175,55,0.5)",
    gradient: "linear-gradient(135deg, #92400e, #d4af37)",
    giftCoins: 50,
    features: [
      "Unlimited match unlocks",
      "Ghost Vault: 50 photos · 10 videos",
      "Ghost Flash: unlimited sessions",
      "3 profile boosts per week",
      "The Casino badge — top of every stack",
      "Ghost Butler — all 7 service numbers visible",
      "Tonight Mode always on",
      "See who liked you",
      "Profile featured in Ghost Pulse row",
    ],
  },
  {
    key: "loft" as RoomTier,
    floorLevel: "3F",
    rank: 1,
    icon: "🎨",
    iconImg: "https://ik.imagekit.io/7grri5v7d/UntitledSSSSSSSSS-removebg-preview.png?updatedAt=1774210228924" as string | undefined,
    name: "The Loft",
    tagline: "LGBTQ+ · Free entry · Your space, your rules",
    price: "Free",
    color: "#a78bfa",
    border: "rgba(167,139,250,0.4)",
    bg: "rgba(167,139,250,0.06)",
    glow: "rgba(167,139,250,0.35)",
    gradient: "linear-gradient(135deg, #4c1d95, #7c3aed, #a78bfa)",
    giftCoins: 20,
    features: [
      "Free entry for LGBTQ+ members",
      "Three spaces — Men's Section, Women's Suite, The Mix",
      "Loft badge on your profile card",
      "Full Vault access — photos & videos",
      "Private Loft group chat",
      "Matching based on your orientation preferences",
      "Safe, inclusive space — zero tolerance policy",
    ],
  },
  {
    key: "penthouse" as RoomTier,
    floorLevel: "PH",
    rank: 3,
    icon: "🏙️",
    iconImg: "https://ik.imagekit.io/7grri5v7d/UntitledaSFASDFASDF-removebg-preview.png" as string | undefined,
    name: "Penthouse",
    tagline: "The highest floor. Reserved for the elite.",
    price: "$24.99/mo",
    color: "#e8e4d0",
    border: "rgba(232,228,208,0.45)",
    bg: "rgba(232,228,208,0.07)",
    glow: "rgba(232,228,208,0.5)",
    gradient: "linear-gradient(135deg, #8a8070, #c8c0a8, #e8e4d0)",
    giftCoins: 80,
    features: [
      "Everything in The Casino",
      "Penthouse profile badge — globally visible",
      "Unlimited Ghost Butler real-world deliveries",
      "Featured on Ghost Pulse — all countries",
      "Dedicated concierge priority queue",
      "Early access to all new features",
      "Penthouse Floor — exclusive member lounge",
      "Custom Guest ID display name",
    ],
  },
];

// ── Penthouse Check Out popup ──────────────────────────────────────────────────
type COProfile = { id: string; seed: number; name: string; age: number; city: string; bio: string; willMatch: boolean };
const CO_PROFILES: COProfile[] = [
  { id: "ph1", seed: 2,  name: "Sophia",    age: 29, city: "London",     bio: "Architecture and rooftop dinners. Here for something real.",        willMatch: true  },
  { id: "ph2", seed: 6,  name: "Isabella",  age: 31, city: "Milan",      bio: "Art director. Speaks three languages. Reads people faster.",       willMatch: false },
  { id: "ph3", seed: 11, name: "Camille",   age: 27, city: "Paris",      bio: "Always the last to leave. Very much on purpose.",                  willMatch: true  },
  { id: "ph4", seed: 17, name: "Elena",     age: 33, city: "Barcelona",  bio: "Chef by weekend. Loves late nights and honest conversations.",      willMatch: false },
  { id: "ph5", seed: 24, name: "Natasha",   age: 28, city: "Zürich",     bio: "Finance by day. Completely different by night.",                   willMatch: true  },
  { id: "ph6", seed: 34, name: "Ava",       age: 30, city: "New York",   bio: "I'll tell you everything — once I trust you.",                     willMatch: false },
  { id: "ph7", seed: 47, name: "Layla",     age: 26, city: "Dubai",      bio: "Looking for someone who still opens doors.",                       willMatch: true  },
  { id: "ph8", seed: 53, name: "Clara",     age: 32, city: "Vienna",     bio: "Classical pianist. Very much open to jazz.",                       willMatch: false },
];
const GOLD = "#d4af37";
const GOLD_GRAD = "linear-gradient(135deg, #92400e, #d4af37, #f0d060)";


const FLOOR_CHECKOUT_META: Record<string, { label: string; icon: string; color: string }> = {
  suite:     { label: "The Ensuite",     icon: "🛎️", color: "#b8a4e8" },
  kings:     { label: "The Casino",  icon: "🎰", color: "#d4af6a" },
  penthouse: { label: "The Penthouse",   icon: "🏙️", color: "#c8a84b" },
  loft:      { label: "The Loft",        icon: "🎨", color: "#a8c5a0" },
  cellar:    { label: "The Cellar",      icon: "🍷", color: "#c0392b" },
};

const BUTLER_IMG_URL = "https://ik.imagekit.io/7grri5v7d/asdfasdfasdfccc-removebg-preview.png";

function FloorCheckoutPopup({ roomKey, onClose, onConfirm }: { roomKey: RoomTier; onClose: () => void; onConfirm: () => void }) {
  const meta = FLOOR_CHECKOUT_META[roomKey];
  if (!meta) return null;
  const [confirmed, setConfirmed] = useState(false);

  function handleConfirm() {
    setConfirmed(true);
    setTimeout(() => { onConfirm(); }, 1800);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,0.88)",
        backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ width: "100%", maxWidth: 480, background: "rgba(6,6,15,0.99)",
          borderRadius: "24px 24px 0 0", border: `1px solid ${meta.color}44`,
          borderBottom: "none", overflow: "hidden",
          paddingBottom: "max(28px,env(safe-area-inset-bottom,28px))" }}
      >
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }} />

        <AnimatePresence mode="wait">
          {confirmed ? (
            <motion.div key="done"
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              style={{ padding: "36px 24px 24px", textAlign: "center" }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🧳</div>
              <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 900, color: "#fff" }}>Bags on their way down</p>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
                Your butler is arranging your transfer to the Standard Room. See you downstairs.
              </p>
            </motion.div>
          ) : (
            <motion.div key="confirm" style={{ padding: "24px 24px 20px" }}>
              {/* Butler + floor */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
                <div style={{ position: "relative" }}>
                  <img src={BUTLER_IMG_URL} alt="Butler"
                    style={{ width: 60, height: 60, borderRadius: 14, objectFit: "cover",
                      border: `2px solid ${meta.color}66`, boxShadow: `0 0 18px ${meta.color}33` }} />
                  <div style={{ position: "absolute", bottom: -4, right: -4, width: 20, height: 20,
                    borderRadius: "50%", background: "#050508", border: `1.5px solid ${meta.color}`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
                    {meta.icon}
                  </div>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, color: meta.color, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Your Butler</p>
                  <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 900, color: "#fff" }}>Checking out of {meta.label}</p>
                </div>
              </div>

              {/* Info cards */}
              {[
                { icon: "🧳", text: `Your bags will be moved down to the Standard Room — you remain a hotel guest.` },
                { icon: "🛏️", text: "Your Standard Room will be prepared and ready when you arrive downstairs." },
                { icon: "🔑", text: `Your ${meta.label} access ends on checkout and cannot be accessed again without a new room booking.` },
              ].map((line, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.08 }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10,
                    padding: "11px 14px", background: `${meta.color}0d`, border: `1px solid ${meta.color}22`, borderRadius: 12 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{line.icon}</span>
                  <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{line.text}</p>
                </motion.div>
              ))}

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <motion.button whileTap={{ scale: 0.97 }} onClick={onClose}
                  style={{ flex: 1, height: 48, borderRadius: 14, background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)",
                    fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Stay
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleConfirm}
                  style={{ flex: 2, height: 48, borderRadius: 14,
                    background: "linear-gradient(135deg, #c8a84b, #e0ddd8, #c8a84b)",
                    border: "none", color: "#0a0700",
                    fontSize: 14, fontWeight: 900, cursor: "pointer" }}>
                  🧳 Check Out of {meta.label}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default function GhostRoomsPage() {
  const navigate  = useNavigate();
  const a = useGenderAccent();
  const accentColor  = a.accent;          // pink (#f472b6) for female, green (#4ade80) for male
  const accentBorder = a.glow(0.35);
  const accentBg     = a.glow(0.1);
  const [currentTier,   setCurrentTier]   = useState<RoomTier | null>(readTier);
  const [buying,        setBuying]         = useState<RoomTier | null>(null);
  const [justBought,    setJustBought]     = useState<RoomTier | null>(null);
  const [previewImg,    setPreviewImg]     = useState<string | null>(null);
  const [reviewTarget,  setReviewTarget]   = useState<RoomTier | null>(null);
  const [storedReviews, setStoredReviews]  = useState<UserReview[]>(getStoredReviews);
  const [welcomeGiftTier, setWelcomeGiftTier] = useState<RoomTier | null>(null);
  const [checkoutRoom,    setCheckoutRoom]    = useState<RoomTier | null>(null);
  const [gardenPrivate,   setGardenPrivate]   = useState(() => {
    try { return localStorage.getItem("ghost_garden_private") === "1"; } catch { return false; }
  });

  const handlePurchase = (tier: RoomTier) => {
    if (buying) return;
    setBuying(tier);
    setTimeout(() => {
      writeTier(tier);
      setCurrentTier(tier);
      setBuying(null);
      setJustBought(tier);
      // Show welcome gift if not already received for this tier
      if (shouldShowWelcomeGift(tier)) setWelcomeGiftTier(tier);
      setTimeout(() => setJustBought(null), 3000);
    }, 1400);
  };

  const tierRank: Record<RoomTier, number> = { cellar: -1, standard: 0, garden: 0, suite: 1, kings: 2, loft: 1, penthouse: 3 };
  const ownedRank = currentTier ? tierRank[currentTier] : -2;

  // Auto-redirect first-time visitors to the how-it-works explainer
  useEffect(() => {
    if (!hasSeenHowItWorks() && !currentTier) {
      navigate("/ghost/how-it-works", { replace: true });
    }
  }, []);

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
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", flex: 1 }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "env(safe-area-inset-top, 16px) 16px 0",
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
          flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.1 }}>Hotel Rooms</h1>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>Choose your floor</p>
          </div>
          {/* Close — right */}
          <button
            onClick={() => navigate("/ghost/mode")}
            title="Close"
            style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: accentBg, border: `1px solid ${accentBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: accentColor,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tagline */}
        <div style={{ padding: "16px 18px 8px", flexShrink: 0 }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.6, textAlign: "center" }}>
            A Room badge signals everything without saying a word.<br />
            Members notice. The right people filter for it.
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
            <button
              onClick={() => navigate("/ghost/how-it-works")}
              style={{
                background: accentBg, border: `1px solid ${accentBorder}`,
                borderRadius: 20, padding: "6px 18px", cursor: "pointer",
                fontSize: 11, fontWeight: 800, color: accentColor, letterSpacing: "0.04em",
              }}
            >
              How it works
            </button>
          </div>
        </div>

        {/* Room cards */}
        <div style={{ flex: 1, padding: "8px 14px calc(env(safe-area-inset-bottom, 0px) + 24px)", display: "flex", flexDirection: "column", gap: 12 }}>
          {ROOMS.map((room, idx) => {
            const isSpecialFloor = room.key === "garden" || room.key === "cellar" || room.key === "loft";
            const owned   = isSpecialFloor ? currentTier === room.key : ownedRank >= room.rank;
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
                {/* The Casino background image */}
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

                {/* Garden Lodge background overlay */}
                {room.key === "garden" && <>
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url(${GARDEN_BG})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    opacity: 0.45,
                    pointerEvents: "none",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to right, rgba(4,12,5,0.82), rgba(4,12,5,0.55))",
                    pointerEvents: "none",
                  }} />
                </>}

                {/* Cellar background overlay */}
                {room.key === "cellar" && <>
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url(${CELLAR_BG})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    opacity: 0.4,
                    pointerEvents: "none",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to right, rgba(8,2,8,0.82), rgba(8,2,8,0.55))",
                    pointerEvents: "none",
                  }} />
                </>}

                {/* Loft background overlay */}
                {room.key === "loft" && <>
                  <div style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `url(${LOFT_BG})`,
                    backgroundSize: "cover", backgroundPosition: "center",
                    opacity: 0.4,
                    pointerEvents: "none",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to right, rgba(4,2,12,0.82), rgba(4,2,12,0.55))",
                    pointerEvents: "none",
                  }} />
                </>}

                {/* Top stripe */}
                <div style={{ height: 3, background: owned ? room.gradient : "rgba(255,255,255,0.06)", position: "relative", zIndex: 1 }} />

                <div style={{ padding: "14px 16px 16px", position: "relative", zIndex: 1 }}>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                    {(room as any).iconImg
                      ? <img src={(room as any).iconImg} alt={room.name} style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
                      : <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{room.icon}</span>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 8, fontWeight: 900, padding: "2px 6px", borderRadius: 5,
                          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
                          color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", flexShrink: 0,
                        }}>{room.floorLevel}</span>
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

                  {/* Active members bar */}
                  {(() => {
                    const activity = ROOM_ACTIVITY[room.key];
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 10px", background: `${room.color}08`, border: `1px solid ${room.color}18`, borderRadius: 10 }}>
                        {/* Avatar stack */}
                        <div style={{ display: "flex", flexShrink: 0 }}>
                          {activity.avatarSeeds.map((seed, i) => (
                            <img key={seed} src={`https://i.pravatar.cc/36?img=${seed}`} alt=""
                              style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${room.color}55`, marginLeft: i === 0 ? 0 : -7, zIndex: activity.avatarSeeds.length - i, position: "relative" }}
                            />
                          ))}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>
                            {activity.members.toLocaleString()} members
                          </p>
                          <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{activity.tonight} active tonight</p>
                        </div>
                        <motion.div
                          animate={{ opacity: [1, 0.3, 1] }}
                          transition={{ duration: 1.4, repeat: Infinity }}
                          style={{ display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80" }} />
                          <span style={{ fontSize: 9, fontWeight: 800, color: "#4ade80" }}>LIVE</span>
                        </motion.div>
                      </div>
                    );
                  })()}

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
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                        {/* Garden Lodge: 2-button row — Private Terrace + Privacy Mode */}
                        {room.key === "garden" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => navigate("/ghost/floor/garden")}
                              style={{
                                width: "100%", height: 48, borderRadius: 12, border: "none", cursor: "pointer",
                                background: room.gradient, color: "#0a0700",
                                fontSize: 13, fontWeight: 900,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                boxShadow: `0 3px 16px ${room.glow}`,
                              }}
                            >
                              <span style={{ fontSize: 16 }}>🌿</span>
                              Enter Private Terrace
                              <span style={{ fontSize: 12, opacity: 0.7 }}>›</span>
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                const next = !gardenPrivate;
                                setGardenPrivate(next);
                                try { localStorage.setItem("ghost_garden_private", next ? "1" : "0"); } catch {}
                              }}
                              style={{
                                width: "100%", height: 40, borderRadius: 10, cursor: "pointer",
                                background: gardenPrivate ? "rgba(122,158,126,0.15)" : "rgba(255,255,255,0.04)",
                                border: `1px solid ${gardenPrivate ? "rgba(122,158,126,0.5)" : "rgba(255,255,255,0.1)"}`,
                                color: gardenPrivate ? "#7a9e7e" : "rgba(255,255,255,0.45)",
                                fontSize: 11, fontWeight: 800,
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                                transition: "all 0.2s",
                              }}
                            >
                              <span style={{ fontSize: 14 }}>{gardenPrivate ? "🔒" : "🔓"}</span>
                              {gardenPrivate ? "Privacy Mode: On — hidden from main browse" : "Enable Privacy Mode — remove from main browse"}
                            </motion.button>
                          </div>
                        ) : (
                          /* All rooms: Check Out + View Floor */
                          <div style={{ display: "flex", gap: 8 }}>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => room.key === "standard" ? navigate("/ghost/checkout") : setCheckoutRoom(room.key)}
                              style={{
                                flex: 1, height: 48, borderRadius: 12, border: "none", cursor: "pointer",
                                background: "linear-gradient(135deg, #c8a84b, #e0ddd8, #c8a84b)",
                                color: "#0a0700", fontSize: 12, fontWeight: 900,
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                                boxShadow: `0 3px 16px ${room.glow}`,
                              }}
                            >
                              <span style={{ fontSize: 16 }}>🌹</span>
                              <span>Check Out</span>
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                const routes: Record<string, string> = {
                                  standard:  "/",
                                  suite:     "/ghost/floor/suite",
                                  kings:     "/ghost/floor/kings",
                                  penthouse: "/ghost/floor/penthouse-floor",
                                  loft:      "/ghost/floor/loft-floor",
                                  cellar:    "/ghost/floor/cellar-floor",
                                };
                                navigate(routes[room.key] ?? "/");
                              }}
                              style={{
                                flex: 1, height: 48, borderRadius: 12, cursor: "pointer",
                                background: `${room.color}14`, border: `1px solid ${room.color}45`,
                                color: room.color, fontSize: 12, fontWeight: 900,
                                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                              }}
                            >
                              {(room as any).iconImg
                                ? <img src={(room as any).iconImg} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} />
                                : <span style={{ fontSize: 16 }}>{room.icon}</span>
                              }
                              <span>View Floor</span>
                            </motion.button>
                          </div>
                        )}

                        {/* Rate button for own tier */}
                        {room.key === currentTier && isLoggedIn() && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setReviewTarget(room.key)}
                            style={{
                              width: "100%", height: 38, borderRadius: 10, border: `1px solid ${room.color}44`,
                              background: `${room.color}10`, color: room.color,
                              fontSize: 11, fontWeight: 800, cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                            }}
                          >
                            🌟 Rate your stay
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
                            {room.key === "standard" ? "Checking in…" : "Unlocking…"}
                          </motion.span>
                        ) : room.key === "standard" ? (
                          "Check In Free →"
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

      {/* ── Welcome gift popup ── */}
      <AnimatePresence>
        {welcomeGiftTier && (
          <WelcomeGiftPopup
            tier={welcomeGiftTier}
            onCollect={() => setWelcomeGiftTier(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Penthouse Check Out popup ── */}
      <AnimatePresence>
        {checkoutRoom && checkoutRoom !== "standard" && (
          <FloorCheckoutPopup
            roomKey={checkoutRoom}
            onClose={() => setCheckoutRoom(null)}
            onConfirm={() => { writeTier("standard"); setCurrentTier("standard"); setCheckoutRoom(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
