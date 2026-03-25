// ── Breakfast Lounge — shared data, types, and pure helpers ──────────────────
// Extracted from BreakfastLoungePage.tsx to keep the main component lean.

// ── Cost constants ─────────────────────────────────────────────────────────────
export const INVITE_COST       = 0;
export const NOTE_COST         = 5;
export const CHAT_COST         = 2;
export const TIP_COST          = 5;
export const TABLE_INVITE_COST = 10;
export const TABLE_NOTE_COST   = 5;
export const COFFEE_COST       = 3;
export const INTL_COST         = 20;
export const EXTRA_REC_COST    = 10;

// ── Lounge schedule ────────────────────────────────────────────────────────────
export const ROTATE_MIN    = 3 * 60 * 1000;
export const ROTATE_MAX    = 6 * 60 * 1000;
export const LOUNGE_OPEN_H = 7;
export const LOUNGE_CLOSE_H = 11;
export const DEV_OVERRIDE  = true;
export const SWAP_PER_TICK = 3;

// ── Types ──────────────────────────────────────────────────────────────────────
export interface LoungeProfile {
  id: string; seed: number; ghostId: string;
  city: string; country: string; flag: string;
  floor: string; floorColor: string;
  mood: string; gender: "m" | "f"; age: number; about: string;
  photo: string;
  international?: boolean;
}

export type Phase = "browsing" | "invite-pending" | "refused" | "at-table";
export interface ChatMsg { id: number; from: "me" | "them" | "them2" | "butler"; text: string; showTip?: boolean; }
export interface VisibleEntry { profile: LoungeProfile; status: "available" | "at-table"; tableWith?: string; }

// ── Timezone data ──────────────────────────────────────────────────────────────
export const UTC_OFFSETS: Record<string, number> = {
  "UAE": 4, "Italy": 1, "Japan": 9, "Spain": 1, "UK": 0, "France": 1,
  "Saudi Arabia": 3, "Greece": 2, "USA": -5, "Lebanon": 2, "Colombia": -5,
  "Egypt": 2, "Ireland": 0, "Singapore": 8, "Germany": 1, "Indonesia": 7,
  "Nigeria": 1, "India": 5.5, "Argentina": -3, "Turkey": 3, "Kenya": 3, "Korea": 9,
};

export const REGIONS = [
  { name: "Asia Pacific",  flag: "🌏", countries: ["Japan", "Singapore", "Korea", "Indonesia"] },
  { name: "Middle East",   flag: "🌍", countries: ["UAE", "Saudi Arabia", "Lebanon", "Turkey"] },
  { name: "Europe",        flag: "🇪🇺", countries: ["UK", "France", "Italy", "Spain", "Germany", "Greece", "Ireland"] },
  { name: "Africa",        flag: "🌍", countries: ["Egypt", "Nigeria", "Kenya"] },
  { name: "Americas",      flag: "🌎", countries: ["USA", "Colombia", "Argentina"] },
  { name: "South Asia",    flag: "🌏", countries: ["India"] },
];

// ── Avatar colours ─────────────────────────────────────────────────────────────
export const AV_COLS = [
  "#e879f9", "#a78bfa", "#60a5fa", "#34d399", "#fbbf24",
  "#f87171", "#fb923c", "#4ade80", "#38bdf8", "#c084fc", "#f472b6", "#a3e635",
];
export const avCol = (seed: number) => AV_COLS[seed % AV_COLS.length];

// ── Profile pool ───────────────────────────────────────────────────────────────
const PH = (n: number) => `https://i.pravatar.cc/300?img=${n}`;

export const POOL: LoungeProfile[] = [
  { id: "bl1",  seed: 3,   ghostId: "Guest-4821", city: "Dubai",        country: "UAE",         flag: "🇦🇪", floor: "Penthouse", floorColor: "#e8e4d0", mood: "Early riser ☀️",               gender: "f", age: 28, photo: PH(5),  about: "Loves mornings, strong coffee and the quiet before the city wakes." },
  { id: "bl2",  seed: 7,   ghostId: "Guest-7734", city: "Milan",        country: "Italy",        flag: "🇮🇹", floor: "Casino",    floorColor: "#d4af37", mood: "Coffee first, talk later",      gender: "m", age: 33, photo: PH(33), about: "Fashion week regular. Prefers his espresso black and his mornings slow." },
  { id: "bl3",  seed: 12,  ghostId: "Guest-2093", city: "Tokyo",        country: "Japan",        flag: "🇯🇵", floor: "Ensuite",   floorColor: "#cd7f32", mood: "Croissant hunter 🥐",           gender: "f", age: 26, photo: PH(9),  about: "Pastry enthusiast. Will absolutely judge your breakfast order." },
  { id: "bl4",  seed: 18,  ghostId: "Guest-9901", city: "Barcelona",    country: "Spain",        flag: "🇪🇸", floor: "Casino",    floorColor: "#d4af37", mood: "Morning person 🌅",             gender: "f", age: 30, photo: PH(3),  about: "Up with the sun. Runs before breakfast. Annoyingly cheerful about it." },
  { id: "bl5",  seed: 25,  ghostId: "Guest-5588", city: "London",       country: "UK",           flag: "🇬🇧", floor: "Standard",  floorColor: "#c0c0c0", mood: "Just arrived ✈️",               gender: "m", age: 29, photo: PH(26), about: "Landed at 6am. In desperate need of a full English and a good chat." },
  { id: "bl6",  seed: 35,  ghostId: "Guest-3312", city: "Paris",        country: "France",       flag: "🇫🇷", floor: "Penthouse", floorColor: "#e8e4d0", mood: "Reading the paper 📰",          gender: "f", age: 35, photo: PH(7),  about: "Morning ritual: croissant, Le Monde, eavesdrop on strangers." },
  { id: "bl7",  seed: 48,  ghostId: "Guest-8847", city: "Riyadh",       country: "Saudi Arabia", flag: "🇸🇦", floor: "Casino",    floorColor: "#d4af37", mood: "Espresso, no sugar",            gender: "m", age: 31, photo: PH(39), about: "Early riser. Good conversation over coffee is all I need." },
  { id: "bl8",  seed: 54,  ghostId: "Guest-1199", city: "Athens",       country: "Greece",       flag: "🇬🇷", floor: "Ensuite",   floorColor: "#cd7f32", mood: "Watching the sunrise 🌄",       gender: "f", age: 27, photo: PH(11), about: "Philosophy student. Mornings feel like a fresh page." },
  { id: "bl9",  seed: 64,  ghostId: "Guest-6622", city: "New York",     country: "USA",          flag: "🇺🇸", floor: "Casino",    floorColor: "#d4af37", mood: "Catching up on emails",         gender: "m", age: 38, photo: PH(29), about: "Never fully off. But buys the best coffee for the table." },
  { id: "bl10", seed: 72,  ghostId: "Guest-4490", city: "Beirut",       country: "Lebanon",      flag: "🇱🇧", floor: "Loft",      floorColor: "#a78bfa", mood: "Pancakes or bust 🥞",           gender: "f", age: 24, photo: PH(4),  about: "Came for the food. Stayed for the conversation." },
  { id: "bl11", seed: 83,  ghostId: "Guest-0011", city: "Bogotá",       country: "Colombia",     flag: "🇨🇴", floor: "Standard",  floorColor: "#c0c0c0", mood: "First morning here 🏨",         gender: "m", age: 22, photo: PH(43), about: "Solo trip. Open to meeting anyone interesting." },
  { id: "bl12", seed: 92,  ghostId: "Guest-7712", city: "Cairo",        country: "Egypt",        flag: "🇪🇬", floor: "Ensuite",   floorColor: "#cd7f32", mood: "Loves the quiet hours",         gender: "f", age: 32, photo: PH(1),  about: "Dawn swimmer. Breakfast is the reward." },
  { id: "bl13", seed: 15,  ghostId: "Guest-3390", city: "Dublin",       country: "Ireland",      flag: "🇮🇪", floor: "Loft",      floorColor: "#a78bfa", mood: "Full Irish please 🍳",           gender: "m", age: 34, photo: PH(31), about: "Can't be reasoned with before the first cup. After it — great craic." },
  { id: "bl14", seed: 29,  ghostId: "Guest-5501", city: "Singapore",    country: "Singapore",    flag: "🇸🇬", floor: "Penthouse", floorColor: "#e8e4d0", mood: "Green tea & silence 🍵",        gender: "f", age: 29, photo: PH(6),  about: "Minimalist. The silence is intentional and she loves your company anyway." },
  { id: "bl15", seed: 41,  ghostId: "Guest-2287", city: "Berlin",       country: "Germany",      flag: "🇩🇪", floor: "Casino",    floorColor: "#d4af37", mood: "People watching 👀",            gender: "m", age: 36, photo: PH(35), about: "Prefers observing. Will surprise you with exactly the right thing to say." },
  // 🇮🇩 Indonesian guests — always visible
  { id: "id1",  seed: 97,  ghostId: "Guest-2241", city: "Jakarta",    country: "Indonesia", flag: "🇮🇩", floor: "Penthouse", floorColor: "#e8e4d0", mood: "Meeting-free morning ☀️",        gender: "m", age: 32, photo: PH(27), about: "Startup founder from South Jakarta. Up early before the city traffic hits. Loves a strong kopi and a conversation that actually goes somewhere." },
  { id: "id2",  seed: 103, ghostId: "Guest-7753", city: "Bali",       country: "Indonesia", flag: "🇮🇩", floor: "Ensuite",   floorColor: "#cd7f32", mood: "Sunrise swim done ✓",             gender: "f", age: 27, photo: PH(18), about: "Creative based in Canggu. Splits time between the studio and the ocean. Mornings are the only quiet part of the day." },
  { id: "id3",  seed: 108, ghostId: "Guest-3318", city: "Surabaya",   country: "Indonesia", flag: "🇮🇩", floor: "Casino",    floorColor: "#d4af37", mood: "Here for the nasi goreng 🍳",     gender: "m", age: 35, photo: PH(41), about: "Logistics director, always travelling. Judges every hotel by the quality of its breakfast. This one passes." },
  { id: "id4",  seed: 115, ghostId: "Guest-9982", city: "Yogyakarta", country: "Indonesia", flag: "🇮🇩", floor: "Loft",      floorColor: "#a78bfa", mood: "Batik and black coffee ☕",        gender: "f", age: 29, photo: PH(14), about: "Textile artist and occasional tour guide. Soft-spoken but has stories that'll hold the table for an hour." },
  { id: "id5",  seed: 122, ghostId: "Guest-5534", city: "Bandung",    country: "Indonesia", flag: "🇮🇩", floor: "Standard",  floorColor: "#c0c0c0", mood: "Indie playlist, window seat 🎧",  gender: "m", age: 24, photo: PH(36), about: "Music producer visiting for a collab session. Carries headphones everywhere but always has one ear out for good conversation." },
  { id: "id6",  seed: 128, ghostId: "Guest-1167", city: "Medan",      country: "Indonesia", flag: "🇮🇩", floor: "Ensuite",   floorColor: "#cd7f32", mood: "Will talk about food for hours",  gender: "f", age: 31, photo: PH(21), about: "Food journalist on assignment. Has eaten at 300 warungs and counting. Breakfast is research, not just a meal." },
  { id: "id7",  seed: 134, ghostId: "Guest-6645", city: "Jakarta",    country: "Indonesia", flag: "🇮🇩", floor: "Casino",    floorColor: "#d4af37", mood: "First coffee, then decisions",     gender: "f", age: 26, photo: PH(16), about: "Corporate lawyer, works too hard. Travelling alone for the first time in three years and quietly enjoying every minute of it." },
  { id: "id8",  seed: 141, ghostId: "Guest-4423", city: "Lombok",     country: "Indonesia", flag: "🇮🇩", floor: "Loft",      floorColor: "#a78bfa", mood: "Surfer schedule, boardroom mind",  gender: "m", age: 30, photo: PH(44), about: "Marine conservation researcher. Spends half the year on the water. Has strong opinions on reef policy and even stronger ones about coffee." },
  // International-only guests (unlocked via butler)
  { id: "bl16", seed: 55,  ghostId: "Guest-8812", city: "Kyoto",        country: "Japan",     flag: "🇯🇵", floor: "Penthouse", floorColor: "#e8e4d0", mood: "Temple walks & matcha 🍵",  gender: "f", age: 31, photo: PH(8),  international: true, about: "Travels for silence and aesthetics. Mornings are sacred." },
  { id: "bl17", seed: 61,  ghostId: "Guest-3341", city: "Lagos",        country: "Nigeria",   flag: "🇳🇬", floor: "Ensuite",   floorColor: "#cd7f32", mood: "Energy before 8am ⚡",       gender: "m", age: 27, photo: PH(37), international: true, about: "Music producer. Best ideas come at breakfast, apparently." },
  { id: "bl18", seed: 73,  ghostId: "Guest-9934", city: "Mumbai",       country: "India",     flag: "🇮🇳", floor: "Casino",    floorColor: "#d4af37", mood: "Chai, not coffee ☕",          gender: "f", age: 29, photo: PH(20), international: true, about: "Filmmaker on location. Loves a good story over eggs." },
  { id: "bl19", seed: 85,  ghostId: "Guest-1102", city: "Buenos Aires", country: "Argentina", flag: "🇦🇷", floor: "Loft",      floorColor: "#a78bfa", mood: "Tango last night 💃",          gender: "f", age: 26, photo: PH(13), international: true, about: "Late nights, early mornings. Doesn't question it anymore." },
  { id: "bl20", seed: 94,  ghostId: "Guest-6677", city: "Istanbul",     country: "Turkey",    flag: "🇹🇷", floor: "Casino",    floorColor: "#d4af37", mood: "Between two continents 🌉",  gender: "m", age: 34, photo: PH(32), international: true, about: "Architect. Sees every hotel as a brief. Always studying the light." },
  { id: "bl21", seed: 17,  ghostId: "Guest-4456", city: "Nairobi",      country: "Kenya",     flag: "🇰🇪", floor: "Standard",  floorColor: "#c0c0c0", mood: "Safari sunrise person 🌅",   gender: "f", age: 25, photo: PH(22), international: true, about: "Wildlife photographer. Up before everyone, always." },
  { id: "bl22", seed: 33,  ghostId: "Guest-2298", city: "Seoul",        country: "Korea",     flag: "🇰🇷", floor: "Ensuite",   floorColor: "#cd7f32", mood: "K-drama night, soju morning", gender: "m", age: 30, photo: PH(28), international: true, about: "Tech founder. Running on determination and very strong coffee." },
];

// ── Message data ───────────────────────────────────────────────────────────────
export const SEATING_TIMES = ["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM"];

export const INVITE_MESSAGES = [
  "{id}, {age}, from {country} has a seat ready at their table and invites you to join them for breakfast.",
  "{id} ({age}, {country}) has saved you a seat at their breakfast table. Join them and get acquainted.",
  "A seat is waiting at {id}'s table ({age}, {country}). Join them for breakfast and connect.",
  "{id}, age {age}, {country} has kept a place for you at their table. Breakfast awaits.",
  "{id} ({age}, {country}) is seated and has a spot open just for you. Join them for breakfast.",
  "At their table, a seat remains open — {id} ({age}, {country}) invites you to breakfast.",
  "{id}, {age}, from {country} has room at their table. Join them for a breakfast introduction.",
  "A seat beside {id} ({age}, {country}) is waiting. Step in and share breakfast.",
  "{id}, age {age}, {country} has a place open at their table. Join them and get acquainted.",
  "{id} ({age}, {country}) has left a seat free for you at breakfast. Take it and connect.",
  "{id} ({age}, {country}) is seated and has reserved a place at their table for you. Breakfast is served.",
  "A place has been kept at {id}'s table ({age}, {country}). You are invited to join them for breakfast.",
  "{id}, {age}, {country} has arranged a seat at their table. Join them for a refined introduction.",
  "At {id}'s table ({age}, {country}), a seat awaits your arrival. Breakfast is underway.",
  "{id} ({age}, {country}) has ensured there is space at their table for you this morning.",
  "Through the quiet… {id} ({age}, {country}) has left a seat open at their table for you.",
  "A place remains at the table — {id}, {age}, {country} is waiting for you to join them.",
  "In the distance, a seat is held… {id} ({age}, {country}) invites you to breakfast.",
  "{id}, age {age}, {country} sits waiting — a seat beside them is yours if you choose it.",
  "A single seat stays open at {id}'s table ({age}, {country}). Will you take it?",
];

export const SOFT_DECLINES = [
  "has quietly slipped away from the lounge.",
  "stepped out — something came up in the lobby.",
  "left for a floor gathering.",
  "has moved on — another commitment called.",
  "stepped out to take a call and hasn't returned.",
  "has already joined another table.",
  "has checked out of the lounge this morning.",
];

export const PARTNER_REPLIES = [
  "Good morning! ☀️ I'll be right down.",
  "Already grabbed the window seat — croissants are fresh 🥐",
  "Perfect. Just ordered the eggs benedict, highly recommend it.",
  "On my way. Can you grab me a coffee? ☕",
  "So glad you reached out, I was sitting alone.",
  "Coming down from the penthouse now 😊",
  "The orange juice here is freshly squeezed, just so you know.",
  "I've been people-watching for 20 minutes. You saved me 😄",
  "I hear the French toast is incredible today.",
];

export const BUTLER_SURPRISE_MSGS = [
  "Mr. Butla has arranged fresh orange juice for your table. 🍊",
  "A warm basket of pastries has been sent to your table. 🥐",
  "Mr. Butla has reserved your table for another 30 minutes. 🕐",
  "A fresh pot of coffee is on its way. ☕ Mr. Butla's compliments.",
  "Mr. Butla has upgraded your table to the window view. 🌅",
];

export const REC_INTROS = [
  "I believe you and {name} would have a wonderful morning together.",
  "{name} arrived this morning from {city} — a most interesting guest.",
  "If I may, {name} has been sitting alone and seems like your kind of person.",
  "I took the liberty — {name} from {city} caught my attention this morning.",
];

export const CATEGORIES = [
  { label: "Travel", icon: "✈️" },
  { label: "Food",   icon: "🍳" },
  { label: "Work",   icon: "💼" },
  { label: "Life",   icon: "🌿" },
];

// ── Pure helpers ───────────────────────────────────────────────────────────────
export function getLocalHour(country: string): number {
  const offset = UTC_OFFSETS[country] ?? 0;
  const utcH = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
  return ((utcH + offset) % 24 + 24) % 24;
}

export function isOnlineHours(country: string): boolean {
  if (DEV_OVERRIDE) return true;
  const h = getLocalHour(country);
  return h >= 7 && h < 23;
}

export function isBreakfastHours(country: string): boolean {
  if (DEV_OVERRIDE) return false;
  const h = getLocalHour(country);
  return h >= 7 && h < 11;
}

export function breakfastPriority(p: LoungeProfile): number {
  if (DEV_OVERRIDE) return (p.seed % 10) / 10;
  const h = getLocalHour(p.country);
  if (h >= 7 && h < 9)   return 1.0;
  if (h >= 9 && h < 11)  return 0.8;
  if (h >= 11 && h < 13) return 0.4;
  return 0.1;
}

export function getBusiestBreakfastRegion(): { name: string; flag: string; count: number; example: string } | null {
  const scored = REGIONS.map(r => {
    const profiles = POOL.filter(p => r.countries.includes(p.country));
    const count = DEV_OVERRIDE
      ? profiles.length
      : profiles.filter(p => isBreakfastHours(p.country)).length;
    const example = profiles[0]?.city ?? "";
    return { ...r, count, example };
  }).sort((a, b) => b.count - a.count);
  return scored[0]?.count > 0 ? scored[0] : null;
}

export function loungePresence(seed: number) {
  const baseH = 7 + (seed % 4);
  const suffix = baseH < 12 ? "am" : "pm";
  const nextH = baseH + 1;
  const nextSuffix = nextH < 12 ? "am" : "pm";
  const tables = 1 + (seed % 5);
  return { time: `${baseH}${suffix} – ${nextH}${nextSuffix}`, tables };
}

export function approxDistance(countryA: string, countryB: string, offsets: Record<string, number>): string {
  if (countryA === countryB) return "Same country";
  const diff = Math.abs((offsets[countryA] ?? 0) - (offsets[countryB] ?? 0));
  if (diff === 0) return "~Same region";
  if (diff <= 2)  return `~${diff * 900}–${diff * 1200}km`;
  if (diff <= 5)  return `~${diff * 1000}–${diff * 1400}km`;
  return `${diff * 1000}+ km away`;
}

export function pickInviteMsg(p: { ghostId: string; age: number; country: string }): string {
  const tpl = INVITE_MESSAGES[Math.floor(Math.random() * INVITE_MESSAGES.length)];
  return tpl.replace(/{id}/g, p.ghostId).replace(/{age}/g, String(p.age)).replace(/{country}/g, p.country);
}

export function isLoungeOpen(): boolean {
  if (DEV_OVERRIDE) return true;
  const h = new Date().getHours();
  return h >= LOUNGE_OPEN_H && h < LOUNGE_CLOSE_H;
}

export function getOpenCountdown(): string {
  const now = new Date();
  const h = now.getHours();
  const openAt = new Date(now);
  if (h >= LOUNGE_CLOSE_H) openAt.setDate(openAt.getDate() + 1);
  openAt.setHours(LOUNGE_OPEN_H, 0, 0, 0);
  const diff = openAt.getTime() - now.getTime();
  const hrs  = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  return `${hrs}h ${mins}m`;
}

export function buildVisible(
  intl: boolean,
  dismissed: Set<string> = new Set(),
  shown: Set<string> = new Set(),
  countryFilter?: string | null,
  wantedGender?: "f" | "m" | null,
) {
  const pool = POOL.filter(p =>
    !dismissed.has(p.id) &&
    (intl || !p.international) &&
    isOnlineHours(p.country) &&
    (!wantedGender || p.gender === wantedGender),
  );
  const sorted = [...pool].sort((a, b) => {
    const countryA = countryFilter && a.country === countryFilter ? 2 : 0;
    const countryB = countryFilter && b.country === countryFilter ? 2 : 0;
    const unseenA = shown.has(a.id) ? 0 : 1;
    const unseenB = shown.has(b.id) ? 0 : 1;
    return (countryB + unseenB + breakfastPriority(b)) - (countryA + unseenA + breakfastPriority(a));
  });
  const take  = intl ? 12 : 9;
  const avCut = intl ? 8  : 6;
  const top   = sorted.slice(0, take + 4).sort(() => Math.random() - 0.5 * 0.4);
  const picked = top.slice(0, take);
  return picked.map((p, i) => ({
    profile: p,
    status: (i < avCut ? "available" : "at-table") as "available" | "at-table",
    tableWith: i >= avCut ? (pool.find(q => q.id !== p.id) ?? pool[0]).ghostId : undefined,
  }));
}

export function pickRec(exclude: string[]): LoungeProfile {
  const pool = POOL.filter(p => !p.international && !exclude.includes(p.id));
  return pool[Math.floor(Math.random() * pool.length)] ?? POOL[0];
}

export const rnd = (min: number, max: number) => min + Math.random() * (max - min);
