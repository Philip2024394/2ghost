export type IndonesianProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  gender: "Female" | "Male";
  latitude: number;
  longitude: number;
  image: string;
  last_seen_at: string | null;
};

const FEMALE_NAMES = [
  "Sari","Dewi","Rina","Ayu","Fitri","Nadia","Putri","Maya","Dina","Cinta",
  "Reni","Lina","Hana","Wulan","Tari","Indah","Sinta","Mega","Yuni","Lia",
  "Ratna","Devi","Novi","Endah","Rahma","Siti","Aulia","Farah","Intan","Laras",
  "Mirna","Nurul","Okta","Prita","Riska","Suci","Tika","Ulfa","Vira","Wati",
];

const MALE_NAMES = [
  "Bagas","Rizky","Andi","Danu","Fajar","Hendra","Iwan","Joko","Kevin","Lukman",
  "Mario","Novan","Ogi","Pandu","Raka","Surya","Tegar","Umar","Vino","Wahyu",
  "Budi","Cahyo","Dimas","Eko","Feri","Gilang","Hafiz","Ilham","Jefri","Kukuh",
  "Luki","Miko","Nanda","Opi","Prasetyo","Qori","Rendi","Sandi","Topan","Yudi",
];

// Indonesian cities with approximate lat/lon
const CITIES: { name: string; lat: number; lon: number }[] = [
  { name: "Jakarta",    lat: -6.2088,  lon: 106.8456 },
  { name: "Surabaya",   lat: -7.2575,  lon: 112.7521 },
  { name: "Bandung",    lat: -6.9175,  lon: 107.6191 },
  { name: "Bali",       lat: -8.4095,  lon: 115.1889 },
  { name: "Yogyakarta", lat: -7.7956,  lon: 110.3695 },
  { name: "Medan",      lat:  3.5952,  lon: 98.6722  },
  { name: "Semarang",   lat: -6.9932,  lon: 110.4203 },
  { name: "Makassar",   lat: -5.1477,  lon: 119.4327 },
  { name: "Malang",     lat: -7.9666,  lon: 112.6326 },
  { name: "Solo",       lat: -7.5755,  lon: 110.8243 },
  { name: "Bogor",      lat: -6.5971,  lon: 106.8060 },
  { name: "Depok",      lat: -6.4025,  lon: 106.7942 },
  { name: "Bekasi",     lat: -6.2383,  lon: 106.9756 },
  { name: "Tangerang",  lat: -6.1781,  lon: 106.6297 },
  { name: "Batam",      lat:  1.0457,  lon: 104.0305 },
];

// Generate a pseudo-random number from a seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function pickFrom<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)];
}

// last_seen_at: ~35% of profiles appear online (within last 5 min), rest are older
function getLastSeen(seed: number): string | null {
  const r = seededRandom(seed * 7 + 3);
  if (r < 0.35) {
    // Online now — within last 4 minutes
    const msAgo = Math.floor(seededRandom(seed * 13) * 4 * 60 * 1000);
    return new Date(Date.now() - msAgo).toISOString();
  }
  // Offline — between 1h and 24h ago
  const hoursAgo = 1 + Math.floor(seededRandom(seed * 17) * 23);
  return new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
}

export function generateIndonesianProfiles(): IndonesianProfile[] {
  const profiles: IndonesianProfile[] = [];

  // 40 female profiles (img indices 1-40 on pravatar)
  for (let i = 0; i < 40; i++) {
    const city = pickFrom(CITIES, i * 3 + 1);
    profiles.push({
      id: `id-f-${i + 1}`,
      name: FEMALE_NAMES[i % FEMALE_NAMES.length],
      age: 20 + Math.floor(seededRandom(i * 5 + 2) * 15), // 20–34
      city: city.name,
      gender: "Female",
      latitude: city.lat + (seededRandom(i * 11) - 0.5) * 0.3,
      longitude: city.lon + (seededRandom(i * 13) - 0.5) * 0.3,
      image: `https://i.pravatar.cc/400?img=${(i % 40) + 1}`,
      last_seen_at: getLastSeen(i),
    });
  }

  // 20 male profiles
  for (let i = 0; i < 20; i++) {
    const city = pickFrom(CITIES, i * 7 + 4);
    profiles.push({
      id: `id-m-${i + 1}`,
      name: MALE_NAMES[i % MALE_NAMES.length],
      age: 22 + Math.floor(seededRandom(i * 9 + 6) * 13), // 22–34
      city: city.name,
      gender: "Male",
      latitude: city.lat + (seededRandom(i * 17) - 0.5) * 0.3,
      longitude: city.lon + (seededRandom(i * 19) - 0.5) * 0.3,
      image: `https://i.pravatar.cc/400?img=${(i % 20) + 41}`,
      last_seen_at: getLastSeen(i + 100),
    });
  }

  return profiles;
}
