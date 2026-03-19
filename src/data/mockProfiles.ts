// ── 100 Indonesian mock profiles ──────────────────────────────────────────────
// 80 Female · 20 Male · Each online ~16 h/day in blocks ≥ 30 min

export interface MockProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  countryFlag: string;
  gender: "Female" | "Male";
  image: string;
  distanceKm: number;
  isVip: boolean;
  /** [startMin, endMin] offline windows within a 1440-min day. May wrap midnight. */
  offlineWindows: Array<[number, number]>;
}

// Seeded RNG — deterministic, no repeats across profiles
function sr(s: number, lo: number, hi: number): number {
  const t = Math.sin(s * 9301 + 49297) * 233280;
  return lo + Math.floor((t - Math.floor(t)) * (hi - lo + 1));
}
function wm(m: number): number { return ((m % 1440) + 1440) % 1440; }

function buildOffline(s: number): Array<[number, number]> {
  // Main sleep block  21:00–02:00 start, 6–8 h duration
  const ss = wm(sr(s, 1260, 1560));
  const se = wm(ss + sr(s + 1, 360, 480));
  const wins: Array<[number, number]> = [[ss, se]];
  // 60% of profiles also take a midday break (30–90 min, 11:00–14:00)
  if (sr(s + 2, 0, 9) < 6) {
    const bs = sr(s + 3, 660, 840);
    wins.push([bs, bs + sr(s + 4, 30, 90)]);
  }
  return wins;
}

/** Returns true if the profile is currently online based on their daily schedule. */
export function isOnlineNow(p: MockProfile): boolean {
  const now = new Date();
  const m = now.getHours() * 60 + now.getMinutes();
  return !p.offlineWindows.some(([a, b]) =>
    b > a ? m >= a && m < b : m >= a || m < b
  );
}

// ── Names ──────────────────────────────────────────────────────────────────────
const FN: string[] = [
  "Sari","Dewi","Rina","Ayu","Fitri","Nadia","Putri","Maya","Dina","Cinta",
  "Reni","Lina","Hana","Wulan","Tari","Indah","Sinta","Mega","Yuni","Lia",
  "Novi","Risa","Tika","Yeni","Desi","Rini","Nina","Eka","Sri","Dian",
  "Ratna","Susi","Tuti","Mira","Evi","Lisa","Ira","Nita","Ani","Siti",
  "Endah","Retno","Puji","Rahayu","Sekar","Cantika","Jasmine","Nadira","Zahra","Amira",
  "Salwa","Rara","Bunga","Keisha","Tiara","Dinda","Farah","Gita","Hesti","Imelda",
  "Juliana","Kartika","Layla","Meilani","Niken","Okta","Prita","Qonita","Rossa","Shinta",
  "Triana","Ulan","Vika","Winda","Yessy","Zilvia","Alma","Belle","Chika","Dara",
];
const MN: string[] = [
  "Bagas","Rizky","Andi","Danu","Fajar",
  "Hendra","Iwan","Joko","Kevin","Lukman",
  "Mario","Novan","Raka","Surya","Tegar",
  "Vino","Wahyu","Yogi","Zaki","Budi",
];

const CITIES: string[] = [
  "Jakarta","Surabaya","Bandung","Bali","Yogyakarta","Medan","Semarang",
  "Makassar","Malang","Solo","Bogor","Depok","Bekasi","Tangerang","Batam",
  "Palembang","Pekanbaru","Manado","Balikpapan","Samarinda","Lombok",
  "Kupang","Jayapura","Ambon","Padang","Pontianak","Banjarmasin","Mataram",
];

// ── Profile image slots ────────────────────────────────────────────────────────
// Replace each URL with your ImageKit upload URL.
// Female slots: PROFILE_IMAGES[0..79]  → upload as f_00.jpg … f_79.jpg
// Male   slots: PROFILE_IMAGES[80..99] → upload as m_00.jpg … m_19.jpg
export const PROFILE_IMAGES: string[] = [
  // ── Female 0–79 ── (replace with ImageKit URLs)
  "https://i.pravatar.cc/400?img=1",
  "https://i.pravatar.cc/400?img=2",
  "https://i.pravatar.cc/400?img=3",
  "https://i.pravatar.cc/400?img=4",
  "https://i.pravatar.cc/400?img=5",
  "https://i.pravatar.cc/400?img=6",
  "https://i.pravatar.cc/400?img=7",
  "https://i.pravatar.cc/400?img=8",
  "https://i.pravatar.cc/400?img=9",
  "https://i.pravatar.cc/400?img=10",
  "https://i.pravatar.cc/400?img=11",
  "https://i.pravatar.cc/400?img=12",
  "https://i.pravatar.cc/400?img=13",
  "https://i.pravatar.cc/400?img=14",
  "https://i.pravatar.cc/400?img=15",
  "https://i.pravatar.cc/400?img=16",
  "https://i.pravatar.cc/400?img=17",
  "https://i.pravatar.cc/400?img=18",
  "https://i.pravatar.cc/400?img=19",
  "https://i.pravatar.cc/400?img=20",
  "https://i.pravatar.cc/400?img=21",
  "https://i.pravatar.cc/400?img=22",
  "https://i.pravatar.cc/400?img=23",
  "https://i.pravatar.cc/400?img=24",
  "https://i.pravatar.cc/400?img=25",
  "https://i.pravatar.cc/400?img=26",
  "https://i.pravatar.cc/400?img=27",
  "https://i.pravatar.cc/400?img=28",
  "https://i.pravatar.cc/400?img=29",
  "https://i.pravatar.cc/400?img=30",
  "https://i.pravatar.cc/400?img=31",
  "https://i.pravatar.cc/400?img=32",
  "https://i.pravatar.cc/400?img=33",
  "https://i.pravatar.cc/400?img=34",
  "https://i.pravatar.cc/400?img=35",
  "https://i.pravatar.cc/400?img=1",
  "https://i.pravatar.cc/400?img=2",
  "https://i.pravatar.cc/400?img=3",
  "https://i.pravatar.cc/400?img=4",
  "https://i.pravatar.cc/400?img=5",
  "https://i.pravatar.cc/400?img=6",
  "https://i.pravatar.cc/400?img=7",
  "https://i.pravatar.cc/400?img=8",
  "https://i.pravatar.cc/400?img=9",
  "https://i.pravatar.cc/400?img=10",
  "https://i.pravatar.cc/400?img=11",
  "https://i.pravatar.cc/400?img=12",
  "https://i.pravatar.cc/400?img=13",
  "https://i.pravatar.cc/400?img=14",
  "https://i.pravatar.cc/400?img=15",
  "https://i.pravatar.cc/400?img=16",
  "https://i.pravatar.cc/400?img=17",
  "https://i.pravatar.cc/400?img=18",
  "https://i.pravatar.cc/400?img=19",
  "https://i.pravatar.cc/400?img=20",
  "https://i.pravatar.cc/400?img=21",
  "https://i.pravatar.cc/400?img=22",
  "https://i.pravatar.cc/400?img=23",
  "https://i.pravatar.cc/400?img=24",
  "https://i.pravatar.cc/400?img=25",
  "https://i.pravatar.cc/400?img=26",
  "https://i.pravatar.cc/400?img=27",
  "https://i.pravatar.cc/400?img=28",
  "https://i.pravatar.cc/400?img=29",
  "https://i.pravatar.cc/400?img=30",
  "https://i.pravatar.cc/400?img=31",
  "https://i.pravatar.cc/400?img=32",
  "https://i.pravatar.cc/400?img=33",
  "https://i.pravatar.cc/400?img=34",
  "https://i.pravatar.cc/400?img=35",
  "https://i.pravatar.cc/400?img=1",
  "https://i.pravatar.cc/400?img=2",
  "https://i.pravatar.cc/400?img=3",
  "https://i.pravatar.cc/400?img=4",
  "https://i.pravatar.cc/400?img=5",
  "https://i.pravatar.cc/400?img=6",
  "https://i.pravatar.cc/400?img=7",
  "https://i.pravatar.cc/400?img=8",
  "https://i.pravatar.cc/400?img=9",
  "https://i.pravatar.cc/400?img=10",
  // ── Male 80–99 ── (replace with ImageKit URLs)
  "https://i.pravatar.cc/400?img=52",
  "https://i.pravatar.cc/400?img=53",
  "https://i.pravatar.cc/400?img=54",
  "https://i.pravatar.cc/400?img=55",
  "https://i.pravatar.cc/400?img=56",
  "https://i.pravatar.cc/400?img=57",
  "https://i.pravatar.cc/400?img=58",
  "https://i.pravatar.cc/400?img=59",
  "https://i.pravatar.cc/400?img=60",
  "https://i.pravatar.cc/400?img=61",
  "https://i.pravatar.cc/400?img=62",
  "https://i.pravatar.cc/400?img=63",
  "https://i.pravatar.cc/400?img=64",
  "https://i.pravatar.cc/400?img=65",
  "https://i.pravatar.cc/400?img=66",
  "https://i.pravatar.cc/400?img=67",
  "https://i.pravatar.cc/400?img=68",
  "https://i.pravatar.cc/400?img=69",
  "https://i.pravatar.cc/400?img=70",
  "https://i.pravatar.cc/400?img=52",
];

// ── Build profiles ─────────────────────────────────────────────────────────────
export const MOCK_PROFILES: MockProfile[] = [
  ...Array.from({ length: 80 }, (_, i) => {
    const s = i * 13 + 7;
    return {
      id: `f${i}`,
      name: FN[i],
      age: sr(s, 19, 34),
      city: CITIES[sr(s + 1, 0, CITIES.length - 1)],
      country: "Indonesia",
      countryFlag: "🇮🇩",
      gender: "Female" as const,
      image: PROFILE_IMAGES[i],
      distanceKm: sr(s + 2, 1, 48),
      isVip: sr(s + 3, 0, 4) === 0,          // ~20% have VIP
      offlineWindows: buildOffline(s),
    };
  }),
  ...Array.from({ length: 20 }, (_, i) => {
    const s = (i + 80) * 13 + 7;
    return {
      id: `m${i}`,
      name: MN[i],
      age: sr(s, 21, 38),
      city: CITIES[sr(s + 1, 0, CITIES.length - 1)],
      country: "Indonesia",
      countryFlag: "🇮🇩",
      gender: "Male" as const,
      image: PROFILE_IMAGES[80 + i],
      distanceKm: sr(s + 2, 1, 48),
      isVip: sr(s + 3, 0, 4) === 0,
      offlineWindows: buildOffline(s),
    };
  }),
];

export default MOCK_PROFILES;
