// ── Penthouse types & constants ───────────────────────────────────────────────

export type PenthouseReligion =
  | "Muslim" | "Christian" | "Catholic" | "Hindu" | "Buddhist" | "Other" | "Prefer not to say";
export type PenthouseStayType = "Hotel guest" | "Local resident" | "Just visiting";
export type PenthouseChildren = "None" | "Has children";
export type PenthouseStatus   = "pending" | "active" | "suspended";

export interface PenthouseProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  cityCode: string;
  country: string;
  countryFlag: string;
  photo: string;
  photos: string[];
  bio: string;
  religion: PenthouseReligion;
  stayType: PenthouseStayType;
  children: PenthouseChildren;
  status: PenthouseStatus;
  adminPromoted: boolean;
  isNewArrival: boolean;   // added within last 24h
  joinedAt: number;
  lastSeenAt: number;
  coinBalance: number;
  totalGiftsReceived: number;
  totalReplied: number;
}

export interface PenthouseGift {
  id: string;
  fromGhostId: string;
  fromDisplayName: string;
  toProfileId: string;
  giftKey: string;
  giftName: string;
  giftEmoji: string;
  openerNote: string;       // required opener, up to 120 chars
  coinsPaid: number;
  coinsEarned: number;      // woman earns 60%
  sentAt: number;
  status: "pending" | "replied" | "declined";
  reply?: string;
  repliedAt?: number;
}

export interface PenthouseNote {
  id: string;
  giftId: string;
  fromId: string;
  isFromMan: boolean;
  text: string;             // up to 500 chars
  coinsPaid: number;
  coinsEarned: number;
  sentAt: number;
}

export interface PenthouseMatch {
  id: string;
  manGhostId: string;
  womanProfileId: string;
  womanName: string;
  womanPhoto: string;
  matchedAt: number;
  lastActivityAt: number;
  isArchived: boolean;      // 30 days no activity
}

export interface PenthouseVaultMessage {
  id: string;
  matchId: string;
  fromId: string;
  isFromMan: boolean;
  text: string;
  coinsPaid: number;
  sentAt: number;
  isClosure?: boolean;
}

// ── Gift catalogue — user will replace image URLs with real butler images ────
export const PENTHOUSE_GIFTS = [
  { key: "champagne",  name: "Champagne Bottle",  emoji: "🥂", image: "https://ik.imagekit.io/7grri5v7d/penthouse_champagne.png",  coins: 25 },
  { key: "roses",      name: "Rose Bouquet",       emoji: "🌹", image: "https://ik.imagekit.io/7grri5v7d/penthouse_roses.png",      coins: 35 },
  { key: "chocolates", name: "Chocolate Box",      emoji: "🍫", image: "https://ik.imagekit.io/7grri5v7d/penthouse_chocolates.png", coins: 20 },
  { key: "fruits",     name: "Fruit Basket",       emoji: "🍇", image: "https://ik.imagekit.io/7grri5v7d/penthouse_fruits.png",     coins: 20 },
  { key: "breakfast",  name: "Suite Breakfast",    emoji: "🍳", image: "https://ik.imagekit.io/7grri5v7d/penthouse_breakfast.png",  coins: 40 },
  { key: "perfume",    name: "Perfume",            emoji: "💐", image: "https://ik.imagekit.io/7grri5v7d/penthouse_perfume.png",    coins: 50 },
  { key: "jewelry",    name: "Jewelry Box",        emoji: "💎", image: "https://ik.imagekit.io/7grri5v7d/penthouse_jewelry.png",    coins: 75 },
  { key: "spa",        name: "Spa Voucher",        emoji: "🧖", image: "https://ik.imagekit.io/7grri5v7d/penthouse_spa.png",        coins: 60 },
] as const;

export type PenthouseGiftKey = typeof PENTHOUSE_GIFTS[number]["key"];

// ── Economy ──────────────────────────────────────────────────────────────────
export const PENTHOUSE_GIFT_COIN_SHARE  = 0.6;  // woman earns 60% of gift coins
export const PENTHOUSE_NOTE_COST        = 5;
export const PENTHOUSE_NOTE_EARN        = 3;
export const PENTHOUSE_VAULT_MSG_COST   = 2;
export const PENTHOUSE_VAULT_MSG_EARN   = 1;
export const PENTHOUSE_DAILY_FREE_GIFTS = 2;
export const PENTHOUSE_NOTE_MAX_CHARS   = 500;
export const PENTHOUSE_OPENER_MAX_CHARS = 120;
export const PENTHOUSE_VAULT_ARCHIVE_DAYS = 30;
export const PENTHOUSE_MAX_PER_CITY     = 30;
export const PENTHOUSE_SUB_PRICE        = "$29.99";
export const PENTHOUSE_EXTRA_CITY_PRICE = "$19.99";

// ── Mock profiles (Jakarta floor) ────────────────────────────────────────────
export const MOCK_PENTHOUSE_PROFILES: PenthouseProfile[] = [
  {
    id: "ph-001", name: "Ayu", age: 24, city: "Jakarta", cityCode: "JKT",
    country: "Indonesia", countryFlag: "🇮🇩",
    photo: "https://i.pravatar.cc/600?img=47", photos: ["https://i.pravatar.cc/600?img=47", "https://i.pravatar.cc/600?img=48"],
    bio: "Art curator by day, jazz lover by night. I believe in slow mornings and good conversations over cold brew.",
    religion: "Muslim", stayType: "Hotel guest", children: "None",
    status: "active", adminPromoted: false, isNewArrival: false,
    joinedAt: Date.now() - 7 * 86400000, lastSeenAt: Date.now() - 7200000,
    coinBalance: 145, totalGiftsReceived: 12, totalReplied: 9,
  },
  {
    id: "ph-002", name: "Sari", age: 27, city: "Jakarta", cityCode: "JKT",
    country: "Indonesia", countryFlag: "🇮🇩",
    photo: "https://i.pravatar.cc/600?img=49", photos: ["https://i.pravatar.cc/600?img=49"],
    bio: "Fashion consultant. Fluent in three languages. Looking for someone who reads books and holds doors open.",
    religion: "Christian", stayType: "Local resident", children: "None",
    status: "active", adminPromoted: false, isNewArrival: false,
    joinedAt: Date.now() - 14 * 86400000, lastSeenAt: Date.now() - 1800000,
    coinBalance: 230, totalGiftsReceived: 18, totalReplied: 16,
  },
  {
    id: "ph-003", name: "Dewi", age: 23, city: "Jakarta", cityCode: "JKT",
    country: "Indonesia", countryFlag: "🇮🇩",
    photo: "https://i.pravatar.cc/600?img=44", photos: ["https://i.pravatar.cc/600?img=44"],
    bio: "Medical student with a weakness for sushi and rooftop sunsets. Don't take life too seriously.",
    religion: "Muslim", stayType: "Just visiting", children: "None",
    status: "active", adminPromoted: false, isNewArrival: true,
    joinedAt: Date.now() - 43200000, lastSeenAt: Date.now() - 600000,
    coinBalance: 30, totalGiftsReceived: 3, totalReplied: 3,
  },
  {
    id: "ph-004", name: "Cinta", age: 26, city: "Jakarta", cityCode: "JKT",
    country: "Indonesia", countryFlag: "🇮🇩",
    photo: "https://i.pravatar.cc/600?img=43", photos: ["https://i.pravatar.cc/600?img=43"],
    bio: "Interior designer. I find beauty in the small things — morning light, old books, and genuine laughter.",
    religion: "Catholic", stayType: "Hotel guest", children: "None",
    status: "active", adminPromoted: true, isNewArrival: false,
    joinedAt: Date.now() - 5 * 86400000, lastSeenAt: Date.now() - 14400000,
    coinBalance: 80, totalGiftsReceived: 7, totalReplied: 5,
  },
  {
    id: "ph-005", name: "Maya", age: 25, city: "Jakarta", cityCode: "JKT",
    country: "Indonesia", countryFlag: "🇮🇩",
    photo: "https://i.pravatar.cc/600?img=46", photos: ["https://i.pravatar.cc/600?img=46"],
    bio: "Chef at a boutique hotel. Food is love, and I give a lot of it. Let me cook you something one day.",
    religion: "Buddhist", stayType: "Local resident", children: "None",
    status: "active", adminPromoted: false, isNewArrival: false,
    joinedAt: Date.now() - 21 * 86400000, lastSeenAt: Date.now() - 3600000,
    coinBalance: 310, totalGiftsReceived: 22, totalReplied: 19,
  },
  {
    id: "ph-006", name: "Nadia", age: 28, city: "Jakarta", cityCode: "JKT",
    country: "Indonesia", countryFlag: "🇮🇩",
    photo: "https://i.pravatar.cc/600?img=41", photos: ["https://i.pravatar.cc/600?img=41"],
    bio: "Architect and weekend painter. I believe a great city tells its story through its buildings — and its people.",
    religion: "Muslim", stayType: "Local resident", children: "None",
    status: "active", adminPromoted: false, isNewArrival: false,
    joinedAt: Date.now() - 10 * 86400000, lastSeenAt: Date.now() - 21600000,
    coinBalance: 175, totalGiftsReceived: 15, totalReplied: 11,
  },
  {
    id: "ph-007", name: "Ratna", age: 29, city: "Jakarta", cityCode: "JKT",
    country: "Indonesia", countryFlag: "🇮🇩",
    photo: "https://i.pravatar.cc/600?img=39", photos: ["https://i.pravatar.cc/600?img=39"],
    bio: "Yoga instructor and travel writer. Been to 14 countries. Next stop — wherever the conversation takes me.",
    religion: "Hindu", stayType: "Just visiting", children: "None",
    status: "active", adminPromoted: false, isNewArrival: false,
    joinedAt: Date.now() - 3 * 86400000, lastSeenAt: Date.now() - 5400000,
    coinBalance: 55, totalGiftsReceived: 5, totalReplied: 4,
  },
];

// ── Available city floors ─────────────────────────────────────────────────────
export const PENTHOUSE_CITIES = [
  { code: "JKT", name: "Jakarta",     flag: "🇮🇩", country: "Indonesia" },
  { code: "BKK", name: "Bangkok",     flag: "🇹🇭", country: "Thailand"  },
  { code: "SGP", name: "Singapore",   flag: "🇸🇬", country: "Singapore" },
  { code: "KUL", name: "Kuala Lumpur",flag: "🇲🇾", country: "Malaysia"  },
  { code: "MNL", name: "Manila",      flag: "🇵🇭", country: "Philippines" },
] as const;
