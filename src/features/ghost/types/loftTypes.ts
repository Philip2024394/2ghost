export type LoftSection = "men" | "women" | "mix";

export interface LoftProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  cityCode: string;
  countryFlag: string;
  photo: string;
  section: LoftSection;
  bio: string;
  tags: string[];
  isNewArrival?: boolean;
  status: "active" | "inactive";
  last_seen_at?: string;
}

export interface LoftGiftRecord {
  id: string;
  fromGhostId: string;
  toProfileId: string;
  giftKey: string;
  giftName: string;
  giftEmoji: string;
  openerNote: string;
  coinsPaid: number;
  coinsEarned: number;
  sentAt: number;
  status: "pending" | "seen" | "replied";
}

export const LOFT_SUB_PRICE         = "$11.99";
export const LOFT_EXTRA_CITY_PRICE  = "$4.99";
export const LOFT_DAILY_FREE_GIFTS  = 2;
export const LOFT_NOTE_COST         = 5;
export const LOFT_OPENER_MAX_CHARS  = 180;

export const LOFT_GIFTS = [
  { key: "cocktail", name: "Cocktail", emoji: "🍸", coins: 10  },
  { key: "rose",     name: "Rose",     emoji: "🌹", coins: 20  },
  { key: "gift",     name: "Gift Box", emoji: "🎁", coins: 35  },
  { key: "diamond",  name: "Diamond",  emoji: "💎", coins: 60  },
  { key: "crown",    name: "Crown",    emoji: "👑", coins: 100 },
] as const;

export const LOFT_CITIES = [
  { code: "NYC", name: "New York",    flag: "🇺🇸" },
  { code: "LON", name: "London",      flag: "🇬🇧" },
  { code: "PAR", name: "Paris",       flag: "🇫🇷" },
  { code: "BER", name: "Berlin",      flag: "🇩🇪" },
  { code: "SYD", name: "Sydney",      flag: "🇦🇺" },
  { code: "JKT", name: "Jakarta",     flag: "🇮🇩" },
  { code: "DXB", name: "Dubai",       flag: "🇦🇪" },
  { code: "TYO", name: "Tokyo",       flag: "🇯🇵" },
];

const T = (minus: number) => new Date(Date.now() - minus * 60000).toISOString();

export const MOCK_LOFT_PROFILES: LoftProfile[] = [
  // ── Men's Lounge ─────────────────────────────────────────────────────────
  { id: "lm-001", section: "men",   name: "Nico",   age: 28, city: "Berlin",    cityCode: "BER", countryFlag: "🇩🇪", photo: "/placeholder.svg", bio: "Architect by day, vinyl collector by night. Looking for something real.", tags: ["Creative", "Music", "Travel"],       isNewArrival: true,  status: "active", last_seen_at: T(3)  },
  { id: "lm-002", section: "men",   name: "Mateus", age: 31, city: "London",    cityCode: "LON", countryFlag: "🇬🇧", photo: "/placeholder.svg", bio: "Chef. I'll probably cook for you before anything else happens.",         tags: ["Food", "Arts", "Active"],            status: "active", last_seen_at: T(12) },
  { id: "lm-003", section: "men",   name: "Jordan", age: 26, city: "New York",  cityCode: "NYC", countryFlag: "🇺🇸", photo: "/placeholder.svg", bio: "Photographer. City life. Not looking for casual — done with that.",       tags: ["Photography", "Fitness", "Coffee"], status: "active", last_seen_at: T(25) },
  { id: "lm-004", section: "men",   name: "Yuki",   age: 29, city: "Tokyo",     cityCode: "TYO", countryFlag: "🇯🇵", photo: "/placeholder.svg", bio: "Software engineer who reads too many books and makes excellent ramen.",   tags: ["Tech", "Reading", "Cooking"],        status: "active", last_seen_at: T(60) },
  { id: "lm-005", section: "men",   name: "Karim",  age: 33, city: "Dubai",     cityCode: "DXB", countryFlag: "🇦🇪", photo: "/placeholder.svg", bio: "Business consultant. Gym 5am, meetings 7am, searching for meaning.",     tags: ["Business", "Fitness", "Philosophy"],status: "active", last_seen_at: T(2)  },
  { id: "lm-006", section: "men",   name: "Théo",   age: 27, city: "Paris",     cityCode: "PAR", countryFlag: "🇫🇷", photo: "/placeholder.svg", bio: "Screenwriter. I notice things others miss. Probably a good sign.",       tags: ["Film", "Writing", "Wine"],           status: "active", last_seen_at: T(90) },

  // ── Women's Suite ─────────────────────────────────────────────────────────
  { id: "lw-001", section: "women", name: "Sofia",  age: 27, city: "London",    cityCode: "LON", countryFlag: "🇬🇧", photo: "/placeholder.svg", bio: "Barrister. Sharp in court, softer everywhere else. Takes time to trust.", tags: ["Law", "Jazz", "Running"],            isNewArrival: true, status: "active", last_seen_at: T(5)  },
  { id: "lw-002", section: "women", name: "Priya",  age: 30, city: "Sydney",    cityCode: "SYD", countryFlag: "🇦🇺", photo: "/placeholder.svg", bio: "Marine biologist. Spent last summer on a research vessel. Loves the sea.",tags: ["Science", "Ocean", "Adventure"],     status: "active", last_seen_at: T(20) },
  { id: "lw-003", section: "women", name: "Aisha",  age: 25, city: "Dubai",     cityCode: "DXB", countryFlag: "🇦🇪", photo: "/placeholder.svg", bio: "Visual artist. My apartment is full of half-finished paintings.",         tags: ["Art", "Design", "Coffee"],           status: "active", last_seen_at: T(45) },
  { id: "lw-004", section: "women", name: "Hana",   age: 28, city: "Tokyo",     cityCode: "TYO", countryFlag: "🇯🇵", photo: "/placeholder.svg", bio: "Fashion editor. Strong opinions about almost everything.",               tags: ["Fashion", "Travel", "Food"],         status: "active", last_seen_at: T(8)  },
  { id: "lw-005", section: "women", name: "Léa",    age: 29, city: "Paris",     cityCode: "PAR", countryFlag: "🇫🇷", photo: "/placeholder.svg", bio: "Sommelier. I can taste the difference a year makes. In wine and people.", tags: ["Wine", "Culture", "Slow Living"],    status: "active", last_seen_at: T(30) },
  { id: "lw-006", section: "women", name: "Zara",   age: 26, city: "Berlin",    cityCode: "BER", countryFlag: "🇩🇪", photo: "/placeholder.svg", bio: "Music producer. Night owl. Best conversations happen after midnight.",   tags: ["Music", "Nightlife", "Tech"],        status: "active", last_seen_at: T(15) },

  // ── The Mix ───────────────────────────────────────────────────────────────
  { id: "lx-001", section: "mix",   name: "Alex",   age: 28, city: "New York",  cityCode: "NYC", countryFlag: "🇺🇸", photo: "/placeholder.svg", bio: "Journalist. I ask a lot of questions — it's genuinely curiosity.",        tags: ["Writing", "Politics", "Hiking"],     isNewArrival: true, status: "active", last_seen_at: T(7)  },
  { id: "lx-002", section: "mix",   name: "River",  age: 25, city: "Sydney",    cityCode: "SYD", countryFlag: "🇦🇺", photo: "/placeholder.svg", bio: "Yoga instructor and terrible morning person. Yes, I know the irony.",     tags: ["Wellness", "Nature", "Art"],         status: "active", last_seen_at: T(40) },
  { id: "lx-003", section: "mix",   name: "Sam",    age: 31, city: "London",    cityCode: "LON", countryFlag: "🇬🇧", photo: "/placeholder.svg", bio: "Startup founder. Probably thinking about two things at once right now.",  tags: ["Tech", "Business", "Cycling"],       status: "active", last_seen_at: T(18) },
  { id: "lx-004", section: "mix",   name: "Ren",    age: 27, city: "Tokyo",     cityCode: "TYO", countryFlag: "🇯🇵", photo: "/placeholder.svg", bio: "Ceramicist and weekend hiker. I make things with my hands. Slow by design.",tags: ["Crafts", "Nature", "Minimalism"],  status: "active", last_seen_at: T(55) },
  { id: "lx-005", section: "mix",   name: "Cas",    age: 30, city: "Paris",     cityCode: "PAR", countryFlag: "🇫🇷", photo: "/placeholder.svg", bio: "Architect of spaces and overthought sentences. Loves a good bookshop.",   tags: ["Design", "Books", "Coffee"],         status: "active", last_seen_at: T(10) },
];
