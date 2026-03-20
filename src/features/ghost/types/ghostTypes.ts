// ── Ghost types, constants, and data arrays ──────────────────────────────────

export type GhostProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  countryFlag: string;
  image: string;
  last_seen_at?: string | null;
  gender: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  lastActiveHoursAgo?: number; // 24h active window
  isVerified?: boolean;
  bio?: string | null;
  interests?: string[] | null;
  firstDateIdea?: string | null;
  religion?: string | null;
  connectPhone?: string | null;
  connectAlt?: string | null;
  connectAltHandle?: string | null;
};

export type GhostMatch = {
  id: string;
  profile: GhostProfile;
  matchedAt: number;
};

// Inbound like notification (simulated cross-country interest)
export type InboundLike = {
  id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  countryFlag: string;
  image: string;
};

export type GenderFilter = "all" | "Female" | "Male";
export type KmFilter = 5 | 10 | 25 | 50 | 9999;

export const MATCH_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

// ── International Ghost ───────────────────────────────────────────────────────
export const INTL_GHOST_KEY = "ghost_intl_sub_until";
export const INTL_GHOST_COUNTRIES_KEY = "ghost_intl_countries";

export const SEA_COUNTRY_LIST = [
  { code: "ID", name: "Indonesia",      flag: "🇮🇩" },
  { code: "PH", name: "Philippines",   flag: "🇵🇭" },
  { code: "TH", name: "Thailand",      flag: "🇹🇭" },
  { code: "SG", name: "Singapore",     flag: "🇸🇬" },
  { code: "MY", name: "Malaysia",      flag: "🇲🇾" },
  { code: "VN", name: "Vietnam",       flag: "🇻🇳" },
  { code: "GB", name: "United Kingdom",flag: "🇬🇧" },
  { code: "AU", name: "Australia",     flag: "🇦🇺" },
  { code: "US", name: "USA",           flag: "🇺🇸" },
  { code: "IE", name: "Ireland",       flag: "🇮🇪" },
  { code: "FR", name: "France",        flag: "🇫🇷" },
  { code: "BE", name: "Belgium",       flag: "🇧🇪" },
];

// flag emoji → country code lookup
export const FLAG_TO_CODE: Record<string, string> = {
  "🇮🇩": "ID", "🇵🇭": "PH", "🇹🇭": "TH",
  "🇸🇬": "SG", "🇲🇾": "MY", "🇻🇳": "VN",
  "🇬🇧": "GB", "🇦🇺": "AU", "🇺🇸": "US",
  "🇮🇪": "IE", "🇫🇷": "FR", "🇧🇪": "BE",
};

// ── International mock Ghost profiles ───────────────────────────────────────
export const INTL_PROFILES: GhostProfile[] = [
  { id: "intl-1",  name: "Aoife",    age: 26, city: "Dublin",      country: "Ireland",        countryFlag: "🇮🇪", image: "https://i.pravatar.cc/400?img=47", gender: "Female", last_seen_at: null },
  { id: "intl-2",  name: "Callum",   age: 29, city: "London",      country: "United Kingdom", countryFlag: "🇬🇧", image: "https://i.pravatar.cc/400?img=12", gender: "Male",   last_seen_at: null },
  { id: "intl-3",  name: "Emma",     age: 24, city: "Amsterdam",   country: "Netherlands",    countryFlag: "🇳🇱", image: "https://i.pravatar.cc/400?img=48", gender: "Female", last_seen_at: null },
  { id: "intl-4",  name: "Liam",     age: 31, city: "Melbourne",   country: "Australia",      countryFlag: "🇦🇺", image: "https://i.pravatar.cc/400?img=15", gender: "Male",   last_seen_at: null },
  { id: "intl-5",  name: "Priya",    age: 27, city: "Singapore",   country: "Singapore",      countryFlag: "🇸🇬", image: "https://i.pravatar.cc/400?img=44", gender: "Female", last_seen_at: null },
  { id: "intl-6",  name: "Marcus",   age: 28, city: "Toronto",     country: "Canada",         countryFlag: "🇨🇦", image: "https://i.pravatar.cc/400?img=18", gender: "Male",   last_seen_at: null },
  { id: "intl-7",  name: "Yuki",     age: 25, city: "Tokyo",       country: "Japan",          countryFlag: "🇯🇵", image: "https://i.pravatar.cc/400?img=49", gender: "Female", last_seen_at: null },
  { id: "intl-8",  name: "Sofia",    age: 23, city: "Madrid",      country: "Spain",          countryFlag: "🇪🇸", image: "https://i.pravatar.cc/400?img=43", gender: "Female", last_seen_at: null },
  { id: "intl-9",  name: "Ahmed",    age: 30, city: "Dubai",       country: "United Arab Emirates", countryFlag: "🇦🇪", image: "https://i.pravatar.cc/400?img=13", gender: "Male", last_seen_at: null },
  { id: "intl-10", name: "Chloe",    age: 26, city: "Paris",       country: "France",         countryFlag: "🇫🇷", image: "https://i.pravatar.cc/400?img=46", gender: "Female", last_seen_at: null },
  { id: "intl-11", name: "Noah",     age: 27, city: "New York",    country: "United States",  countryFlag: "🇺🇸", image: "https://i.pravatar.cc/400?img=16", gender: "Male",   last_seen_at: null },
  { id: "intl-12", name: "Fatima",   age: 24, city: "Kuala Lumpur",country: "Malaysia",       countryFlag: "🇲🇾", image: "https://i.pravatar.cc/400?img=45", gender: "Female", last_seen_at: null },
  { id: "intl-13", name: "Lars",     age: 32, city: "Stockholm",   country: "Sweden",         countryFlag: "🇸🇪", image: "https://i.pravatar.cc/400?img=17", gender: "Male",   last_seen_at: null },
  { id: "intl-14", name: "Aisha",    age: 25, city: "Lagos",       country: "Nigeria",        countryFlag: "🇳🇬", image: "https://i.pravatar.cc/400?img=42", gender: "Female", last_seen_at: null },
  { id: "intl-15", name: "Daniel",   age: 29, city: "Berlin",      country: "Germany",        countryFlag: "🇩🇪", image: "https://i.pravatar.cc/400?img=14", gender: "Male",   last_seen_at: null },
  { id: "intl-16", name: "Mei",      age: 23, city: "Manila",      country: "Philippines",    countryFlag: "🇵🇭", image: "https://i.pravatar.cc/400?img=50", gender: "Female", last_seen_at: null },
  { id: "intl-17", name: "James",    age: 33, city: "Cape Town",   country: "South Africa",   countryFlag: "🇿🇦", image: "https://i.pravatar.cc/400?img=11", gender: "Male",   last_seen_at: null },
  { id: "intl-18", name: "Amara",    age: 26, city: "Accra",       country: "Ghana",          countryFlag: "🇬🇭", image: "https://i.pravatar.cc/400?img=41", gender: "Female", last_seen_at: null },
];

// Pool of demo inbound likes from random countries
export const DEMO_INBOUND: InboundLike[] = [
  { id: "ib-1", name: "Connor",  age: 28, city: "Cork",       country: "Ireland",       countryFlag: "🇮🇪", image: "https://i.pravatar.cc/400?img=22" },
  { id: "ib-2", name: "Sophie",  age: 25, city: "London",     country: "United Kingdom",countryFlag: "🇬🇧", image: "https://i.pravatar.cc/400?img=39" },
  { id: "ib-3", name: "Jake",    age: 30, city: "Sydney",     country: "Australia",     countryFlag: "🇦🇺", image: "https://i.pravatar.cc/400?img=21" },
  { id: "ib-4", name: "Hana",    age: 24, city: "Osaka",      country: "Japan",         countryFlag: "🇯🇵", image: "https://i.pravatar.cc/400?img=38" },
  { id: "ib-5", name: "Carlos",  age: 27, city: "São Paulo",  country: "Brazil",        countryFlag: "🇧🇷", image: "https://i.pravatar.cc/400?img=20" },
];
