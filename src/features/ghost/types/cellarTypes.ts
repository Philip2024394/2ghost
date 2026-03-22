export type CellarSection = "flirty" | "naughty" | "wild";

export interface CellarProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  cityCode: string;
  countryFlag: string;
  photo: string;
  section: CellarSection;
  bio: string;
  tags: string[];
  isNewArrival?: boolean;
  status: "active" | "inactive";
  last_seen_at?: string;
}

export interface CellarGiftRecord {
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

export const CELLAR_SUB_PRICE        = "$11.99";
export const CELLAR_EXTRA_CITY_PRICE = "$4.99";
export const CELLAR_DAILY_FREE_GIFTS = 2;
export const CELLAR_NOTE_COST        = 5;
export const CELLAR_OPENER_MAX_CHARS = 180;

export const CELLAR_GIFTS = [
  { key: "red_wine",    name: "Ghost Red Wine",    label: "Red Wine",    emoji: "🍷", image: "", coins: 0,   description: "A deep red wine glass with a ghost reflected in the dark liquid." },
  { key: "red_rose",    name: "Ghost Red Rose",    label: "Red Rose",    emoji: "🌹", image: "", coins: 20,  description: "A single blood-red rose with black thorns and crimson ghost mist." },
  { key: "flame",       name: "Ghost Flame",       label: "Flame",       emoji: "🔥", image: "", coins: 40,  description: "A deep crimson flame with a ghost silhouette dancing inside." },
  { key: "red_kiss",    name: "Ghost Red Kiss",    label: "Red Kiss",    emoji: "💋", image: "", coins: 70,  description: "A bold red lipstick kiss mark on black paper with ghost watermark." },
  { key: "cellar_crown",name: "Ghost Cellar Crown",label: "Cellar Crown",emoji: "👑", image: "", coins: 120, description: "A blood-red crown with dark jewels and ghost skull at the peak." },
] as const;

export const CELLAR_CITIES = [
  { code: "NYC", name: "New York",  flag: "🇺🇸" },
  { code: "LON", name: "London",    flag: "🇬🇧" },
  { code: "PAR", name: "Paris",     flag: "🇫🇷" },
  { code: "BER", name: "Berlin",    flag: "🇩🇪" },
  { code: "SYD", name: "Sydney",    flag: "🇦🇺" },
  { code: "DXB", name: "Dubai",     flag: "🇦🇪" },
  { code: "BCN", name: "Barcelona", flag: "🇪🇸" },
  { code: "MIA", name: "Miami",     flag: "🇺🇸" },
];

const T = (minus: number) => new Date(Date.now() - minus * 60000).toISOString();

export const MOCK_CELLAR_PROFILES: CellarProfile[] = [
  // ── Flirty ───────────────────────────────────────────────────────────────
  { id: "cf-001", section: "flirty", name: "Mia",     age: 26, city: "London",    cityCode: "LON", countryFlag: "🇬🇧", photo: "/placeholder.svg", bio: "Professional flirt. I know what I want and I'm not shy about it. Come say hi.", tags: ["Witty", "Confident", "Spontaneous"], isNewArrival: true, status: "active", last_seen_at: T(4)  },
  { id: "cf-002", section: "flirty", name: "Dante",   age: 29, city: "Miami",     cityCode: "MIA", countryFlag: "🇺🇸", photo: "/placeholder.svg", bio: "Salsa dancer, gym obsessed, terrible at small talk — great at everything else.", tags: ["Dancing", "Fitness", "Bold"],                             status: "active", last_seen_at: T(11) },
  { id: "cf-003", section: "flirty", name: "Isla",    age: 25, city: "Barcelona", cityCode: "BCN", countryFlag: "🇪🇸", photo: "/placeholder.svg", bio: "Wine bar regular. I laugh loudly and leave good impressions.", tags: ["Wine", "Nightlife", "Easy-going"],                            status: "active", last_seen_at: T(22) },
  { id: "cf-004", section: "flirty", name: "Marco",   age: 31, city: "Paris",     cityCode: "PAR", countryFlag: "🇫🇷", photo: "/placeholder.svg", bio: "Charming when I need to be. Honest always. Looking for sparks.", tags: ["Honest", "Social", "Music"],                                  status: "active", last_seen_at: T(35) },
  { id: "cf-005", section: "flirty", name: "Cleo",    age: 27, city: "Sydney",    cityCode: "SYD", countryFlag: "🇦🇺", photo: "/placeholder.svg", bio: "Beach, cocktails, good company. Simple pleasures, strong chemistry.", tags: ["Beach", "Travel", "Social"],         isNewArrival: true, status: "active", last_seen_at: T(2)  },

  // ── Naughty ──────────────────────────────────────────────────────────────
  { id: "cn-001", section: "naughty", name: "Raven",  age: 28, city: "Berlin",    cityCode: "BER", countryFlag: "🇩🇪", photo: "/placeholder.svg", bio: "Night creature. I don't do boring. If you like surprises, we'll get along just fine.", tags: ["Bold", "Nights", "Unpredictable"], isNewArrival: true, status: "active", last_seen_at: T(6)  },
  { id: "cn-002", section: "naughty", name: "Enzo",   age: 32, city: "Dubai",     cityCode: "DXB", countryFlag: "🇦🇪", photo: "/placeholder.svg", bio: "Fast cars, slow evenings. I know how to make a night memorable.", tags: ["Luxury", "Nightlife", "Intense"],                              status: "active", last_seen_at: T(18) },
  { id: "cn-003", section: "naughty", name: "Vera",   age: 26, city: "New York",  cityCode: "NYC", countryFlag: "🇺🇸", photo: "/placeholder.svg", bio: "Zero patience for dull people. Life's too short for bad conversation or bad company.", tags: ["Direct", "Ambitious", "Seductive"],                        status: "active", last_seen_at: T(40) },
  { id: "cn-004", section: "naughty", name: "Luca",   age: 30, city: "Barcelona", cityCode: "BCN", countryFlag: "🇪🇸", photo: "/placeholder.svg", bio: "Chef who loves to feed people, wine included. I believe in late nights and early mornings.", tags: ["Food", "Wine", "Late Nights"],                              status: "active", last_seen_at: T(8)  },
  { id: "cn-005", section: "naughty", name: "Zoe",    age: 29, city: "Miami",     cityCode: "MIA", countryFlag: "🇺🇸", photo: "/placeholder.svg", bio: "Personal trainer. I push people harder than they push themselves. In the gym and out.", tags: ["Fitness", "Discipline", "Wild"],                             status: "active", last_seen_at: T(14) },

  // ── Wild ─────────────────────────────────────────────────────────────────
  { id: "cw-001", section: "wild",   name: "Axel",   age: 30, city: "Berlin",    cityCode: "BER", countryFlag: "🇩🇪", photo: "/placeholder.svg", bio: "I live without a plan and somehow it always works out. Let's write something we'll both remember.", tags: ["Adventurous", "Free Spirit", "Bold"], isNewArrival: true, status: "active", last_seen_at: T(3)  },
  { id: "cw-002", section: "wild",   name: "Nyx",    age: 27, city: "London",    cityCode: "LON", countryFlag: "🇬🇧", photo: "/placeholder.svg", bio: "Tattooed, curious, absolutely no filter. You've been warned — in the best way.", tags: ["Edgy", "Creative", "Honest"],                                  status: "active", last_seen_at: T(25) },
  { id: "cw-003", section: "wild",   name: "Selene", age: 28, city: "Paris",     cityCode: "PAR", countryFlag: "🇫🇷", photo: "/placeholder.svg", bio: "Actress. I play many roles. This one is real. Come find out the difference.", tags: ["Mysterious", "Arts", "Drama"],                                 status: "active", last_seen_at: T(50) },
  { id: "cw-004", section: "wild",   name: "Rio",    age: 26, city: "Sydney",    cityCode: "SYD", countryFlag: "🇦🇺", photo: "/placeholder.svg", bio: "Skydiver, freediver, bad decision enthusiast. Best decisions I've made started with a stranger.", tags: ["Extreme", "Ocean", "Thrill"],                                status: "active", last_seen_at: T(9)  },
  { id: "cw-005", section: "wild",   name: "Kai",    age: 31, city: "Miami",     cityCode: "MIA", countryFlag: "🇺🇸", photo: "/placeholder.svg", bio: "DJ. I read rooms better than anyone. Knows exactly when to turn things up.", tags: ["Music", "Nightlife", "Magnetic"],                              status: "active", last_seen_at: T(16) },
];
