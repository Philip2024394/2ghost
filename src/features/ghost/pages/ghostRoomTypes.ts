// ── Ghost Room — shared types and static constants ───────────────────────────

export type RoomRequest = {
  ghostId: string;   // Guest-XXXX of requesting user
  name: string;      // display name (ghost alias)
  requestedAt: number;
  status: "pending" | "granted" | "denied";
};

export type ShareAccessType = "image" | "video" | "both";

export type AccessedRoom = {
  ghostId: string;        // Guest-XXXX of room owner
  roomCode: string;       // code used to access
  accessType: ShareAccessType;
  grantedAt: number;
  images: string[];
  videoUrls: string[];
};

export type GhostMatch = {
  id: string;
  profile: {
    id: string; name: string; age: number; city: string;
    countryFlag: string; image: string; gender: string;
  };
  matchedAt: number;
};

// ── Inbox types ───────────────────────────────────────────────────────────────
export type InboxItem = {
  id: string;
  senderGhostId: string;
  type: "image" | "video" | "note";
  content: string;     // base64 for image, URL for video, text for note
  sentAt: number;
  acceptedAt?: number; // set when user accepts — 30-day expiry counts from here
  status: "pending" | "accepted" | "declined";
  note?: string;       // optional caption/memory attached to media
  expiresAt?: number;  // disappearing media — ms timestamp
  viewOnce?: boolean;  // delete after first view
};

export const VAULT_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── New vault feature types ────────────────────────────────────────────────
export type ChatMessage = {
  id: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "voice";
  sentAt: number;
  expiresAt?: number;   // disappearing
  viewOnce?: boolean;
  viewed?: boolean;
};

export type VoiceNote = {
  id: string;
  audioData: string;   // base64 data URL
  duration: number;    // seconds
  createdAt: number;
  label?: string;
};

export type ActivityEntry = {
  id: string;
  ghostId: string;
  action: "login" | "code_shared" | "image_sent" | "voice_sent" | "chat_opened";
  at: number;
};

export type PrivateBio = {
  realName: string;
  phone: string;
  instagram: string;
  telegram: string;
  bio: string;
};

export type Memory = {
  id: string;
  title: string;
  content: string;
  date: string;   // e.g. "2025-03-25"
  mood: string;   // emoji
  createdAt: number;
};

export type SharedVaultItem = {
  id: string;
  uploadedBy: string;
  type: "image" | "video";
  url: string;
  uploadedAt: number;
  caption?: string;
};

// ── Storage tiers (tied to Ghost Rooms subscription) ──────────────────────────
export type RoomTier = "free" | "suite" | "gold";

export type RoomAmenity = { icon: string; label: string; detail: string; available: boolean };

export const ROOM_TIERS: Record<RoomTier, {
  label: string; hotelName: string; hotelDesc: string; hotelType: string;
  price: string; priceNote: string;
  images: number; videos: number;
  imageMaxMB: number; videoMaxMB: number; videoMaxSec: number;
  imageFormats: string; videoFormats: string;
  badge: string; color: string; bgRgba: string; borderRgba: string;
  roomGradient: string; occupancy: number;
  amenities: RoomAmenity[];
}> = {
  free: {
    label: "Standard Room", hotelName: "Standard Room", hotelType: "Single · Ground Floor",
    hotelDesc: "Clean, private, and all yours to start",
    price: "Free", priceNote: "included with your account",
    images: 3,  videos: 1,
    imageMaxMB: 5,   videoMaxMB: 30,  videoMaxSec: 30,
    imageFormats: "JPG · PNG · WEBP (max 5 MB each)",
    videoFormats: "MP4 · MOV · WEBM (max 30 MB · 30 sec)",
    badge: "👻", color: "rgba(255,255,255,0.55)",
    bgRgba: "rgba(255,255,255,0.03)", borderRgba: "rgba(255,255,255,0.1)",
    roomGradient: "linear-gradient(160deg, #0d1117 0%, #161b22 50%, #1c2128 100%)",
    occupancy: 1247,
    amenities: [
      { icon: "🛏️", label: "Single Bed",       detail: "3 photo slots",          available: true  },
      { icon: "📺", label: "Basic TV",          detail: "1 video slot",           available: true  },
      { icon: "🔒", label: "Room Safe",         detail: "Private vault code",     available: true  },
      { icon: "📅", label: "30-day Stay",       detail: "Files expire after 30d", available: true  },
      { icon: "📤", label: "Room Service",      detail: "Send vault media",       available: false },
      { icon: "💬", label: "Pillow Notes",      detail: "Memory messages",        available: false },
      { icon: "🍾", label: "Minibar",           detail: "Butler gifting",         available: false },
      { icon: "🔑", label: "Late Checkout",     detail: "Files never expire",     available: false },
    ],
  },
  suite: {
    label: "Ghost Ensuite", hotelName: "Ghost Ensuite", hotelType: "Double · City View",
    hotelDesc: "The full experience — send, share, connect",
    price: "$4.99/mo", priceNote: "billed monthly · cancel anytime",
    images: 10, videos: 3,
    imageMaxMB: 10,  videoMaxMB: 100, videoMaxSec: 120,
    imageFormats: "JPG · PNG · WEBP (max 10 MB each)",
    videoFormats: "MP4 · MOV · WEBM (max 100 MB · 2 min)",
    badge: "🏨", color: "rgba(74,222,128,0.9)",
    bgRgba: "rgba(74,222,128,0.06)", borderRgba: "rgba(74,222,128,0.2)",
    roomGradient: "linear-gradient(160deg, #052010 0%, #0a3320 50%, #0d4a2d 100%)",
    occupancy: 384,
    amenities: [
      { icon: "🛏️", label: "Double Bed",       detail: "10 photo slots",         available: true  },
      { icon: "🎬", label: "Entertainment",     detail: "3 video slots",          available: true  },
      { icon: "🔒", label: "Room Safe",         detail: "Private vault code",     available: true  },
      { icon: "📤", label: "Room Service",      detail: "Send vault media",       available: true  },
      { icon: "💬", label: "Pillow Notes",      detail: "Memory messages",        available: true  },
      { icon: "💜", label: "Soul Pack",         detail: "Shared vault link",      available: true  },
      { icon: "🍾", label: "Minibar",           detail: "Butler gifting",         available: false },
      { icon: "🔑", label: "Late Checkout",     detail: "Files never expire",     available: false },
    ],
  },
  gold: {
    label: "Gold Penthouse", hotelName: "Gold Penthouse", hotelType: "King · Penthouse Floor",
    hotelDesc: "The pinnacle — everything, permanent, yours forever",
    price: "$9.99/mo", priceNote: "billed monthly · cancel anytime",
    images: 50, videos: 10,
    imageMaxMB: 20,  videoMaxMB: 300, videoMaxSec: 300,
    imageFormats: "JPG · PNG · WEBP (max 20 MB each)",
    videoFormats: "MP4 · MOV · WEBM (max 300 MB · 5 min)",
    badge: "🔑", color: "#d4af37",
    bgRgba: "rgba(212,175,55,0.07)", borderRgba: "rgba(212,175,55,0.35)",
    roomGradient: "linear-gradient(160deg, #1a1000 0%, #2d1f00 50%, #3d2b00 100%)",
    occupancy: 89,
    amenities: [
      { icon: "👑", label: "King Bed",          detail: "50 photo slots",         available: true  },
      { icon: "🎬", label: "Cinema Room",       detail: "10 video slots",         available: true  },
      { icon: "🔒", label: "Room Safe",         detail: "Private vault code",     available: true  },
      { icon: "📤", label: "Room Service",      detail: "Send vault media",       available: true  },
      { icon: "💬", label: "Pillow Notes",      detail: "Memory messages",        available: true  },
      { icon: "🛁", label: "Private Hot Tub",   detail: "300MB video uploads",    available: true  },
      { icon: "🍾", label: "Minibar",           detail: "Butler gifting",         available: true  },
      { icon: "🔑", label: "Late Checkout",     detail: "Files never expire",     available: true  },
      { icon: "💜", label: "Soul Pack",         detail: "Permanent shared vault", available: true  },
    ],
  },
};

// ── File validation ────────────────────────────────────────────────────────────
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];
