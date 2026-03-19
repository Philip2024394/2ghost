export type IndonesianProfile = {
  id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  countryFlag: string;
  gender: "Female" | "Male";
  latitude: number;
  longitude: number;
  image: string;
  last_seen_at: string | null;
};

// ── Country data ──────────────────────────────────────────────────────────────

const SEA_COUNTRIES = [
  {
    key: "id", name: "Indonesia", flag: "🇮🇩",
    femaleNames: [
      "Sari","Dewi","Rina","Ayu","Fitri","Nadia","Putri","Maya","Dina","Cinta",
      "Reni","Lina","Hana","Wulan","Tari","Indah","Sinta","Mega","Yuni","Lia",
      "Ratna","Devi","Novi","Endah","Rahma","Siti","Aulia","Farah","Intan","Laras",
    ],
    maleNames: [
      "Bagas","Rizky","Andi","Danu","Fajar","Hendra","Iwan","Joko","Kevin","Lukman",
      "Mario","Novan","Raka","Surya","Tegar","Budi","Dimas","Eko","Gilang","Hafiz",
    ],
    cities: [
      { name: "Jakarta",    lat: -6.2088,  lon: 106.8456 },
      { name: "Surabaya",   lat: -7.2575,  lon: 112.7521 },
      { name: "Bandung",    lat: -6.9175,  lon: 107.6191 },
      { name: "Bali",       lat: -8.4095,  lon: 115.1889 },
      { name: "Yogyakarta", lat: -7.7956,  lon: 110.3695 },
      { name: "Medan",      lat:  3.5952,  lon: 98.6722  },
      { name: "Semarang",   lat: -6.9932,  lon: 110.4203 },
      { name: "Makassar",   lat: -5.1477,  lon: 119.4327 },
      { name: "Malang",     lat: -7.9666,  lon: 112.6326 },
      { name: "Batam",      lat:  1.0457,  lon: 104.0305 },
    ],
    femaleCount: 30,
    maleCount: 12,
    imgOffset: 1,
  },
  {
    key: "ph", name: "Philippines", flag: "🇵🇭",
    femaleNames: [
      "Ana","Maria","Rose","Joy","Angelica","Bea","Chloe","Jasmine","Kath","Lyn",
      "Mia","Rica","Divine","Grace","Lovely","Angel","Trish","Ate","Nica","Lhea",
    ],
    maleNames: [
      "Carlo","Miguel","Josh","Mark","Enzo","Ian","JC","Luis","Ken","Paolo",
    ],
    cities: [
      { name: "Manila",      lat: 14.5995, lon: 120.9842 },
      { name: "Cebu",        lat: 10.3157, lon: 123.8854 },
      { name: "Davao",       lat:  7.1907, lon: 125.4553 },
      { name: "Makati",      lat: 14.5547, lon: 121.0244 },
      { name: "BGC",         lat: 14.5500, lon: 121.0494 },
      { name: "Quezon City", lat: 14.6760, lon: 121.0437 },
    ],
    femaleCount: 20,
    maleCount: 8,
    imgOffset: 31,
  },
  {
    key: "th", name: "Thailand", flag: "🇹🇭",
    femaleNames: [
      "Ploy","Nook","Fon","Pim","Mint","Nam","Ning","Aon","Koi","Joy",
      "Bow","Gift","Bell","May","Pam","Gam","Ice","Pink","Nam","Toon",
    ],
    maleNames: [
      "Arm","Bank","Big","Dome","Film","Golf","New","Oak","Top","Win",
    ],
    cities: [
      { name: "Bangkok",    lat: 13.7563, lon: 100.5018 },
      { name: "Chiang Mai", lat: 18.7883, lon:  98.9853 },
      { name: "Phuket",     lat:  7.8804, lon:  98.3923 },
      { name: "Pattaya",    lat: 12.9236, lon: 100.8825 },
      { name: "Hua Hin",    lat: 12.5685, lon:  99.9578 },
    ],
    femaleCount: 20,
    maleCount: 8,
    imgOffset: 1,
  },
  {
    key: "sg", name: "Singapore", flag: "🇸🇬",
    femaleNames: [
      "Jess","Adeline","Xinyi","Yiting","Cheryl","Melissa","Rachel","Sarah","Nicole","Winnie",
      "Fiona","Jasmine","Karen","Lynn","Priya",
    ],
    maleNames: [
      "Ethan","Bryan","Darren","Jason","Kevin","Marcus","Ryan","Sean",
    ],
    cities: [
      { name: "Singapore", lat: 1.3521, lon: 103.8198 },
      { name: "Orchard",   lat: 1.3036, lon: 103.8318 },
      { name: "Marina Bay",lat: 1.2816, lon: 103.8636 },
    ],
    femaleCount: 15,
    maleCount: 6,
    imgOffset: 21,
  },
  {
    key: "my", name: "Malaysia", flag: "🇲🇾",
    femaleNames: [
      "Nurul","Aisyah","Siti","Amira","Hafizah","Yee Ling","Mei","Lily","Amanda","Priya",
      "Zara","Nadia","Elissa","Farhana","Qistina",
    ],
    maleNames: [
      "Haziq","Ariff","Syafiq","Daniel","Darren","Reza","Sam","Wei",
    ],
    cities: [
      { name: "Kuala Lumpur", lat:  3.1390, lon: 101.6869 },
      { name: "Penang",       lat:  5.4141, lon: 100.3288 },
      { name: "Johor Bahru",  lat:  1.4927, lon: 103.7414 },
      { name: "Kota Kinabalu",lat:  5.9804, lon: 116.0735 },
      { name: "Petaling Jaya",lat:  3.1073, lon: 101.6067 },
    ],
    femaleCount: 15,
    maleCount: 6,
    imgOffset: 31,
  },
  {
    key: "vn", name: "Vietnam", flag: "🇻🇳",
    femaleNames: [
      "Linh","Huong","Lan","Hoa","Thu","Phuong","Yen","Chi","Ngoc","Ly",
      "Thao","Van","Bich","Dung","Hien",
    ],
    maleNames: [
      "Minh","Tuan","Long","Duc","Hung","Nam","Phong","Quang",
    ],
    cities: [
      { name: "Ho Chi Minh City", lat: 10.8231, lon: 106.6297 },
      { name: "Hanoi",            lat: 21.0285, lon: 105.8542 },
      { name: "Da Nang",          lat: 16.0544, lon: 108.2022 },
      { name: "Nha Trang",        lat: 12.2388, lon: 109.1967 },
      { name: "Hoi An",           lat: 15.8801, lon: 108.3380 },
    ],
    femaleCount: 15,
    maleCount: 6,
    imgOffset: 41,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function pickFrom<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)];
}

function getLastSeen(seed: number): string | null {
  const r = seededRandom(seed * 7 + 3);
  if (r < 0.35) {
    const msAgo = Math.floor(seededRandom(seed * 13) * 4 * 60 * 1000);
    return new Date(Date.now() - msAgo).toISOString();
  }
  const hoursAgo = 1 + Math.floor(seededRandom(seed * 17) * 23);
  return new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
}

// ── Generator ─────────────────────────────────────────────────────────────────

export function generateIndonesianProfiles(): IndonesianProfile[] {
  const profiles: IndonesianProfile[] = [];
  let globalSeed = 0;

  SEA_COUNTRIES.forEach((country) => {
    // Female profiles
    for (let i = 0; i < country.femaleCount; i++) {
      globalSeed++;
      const city = pickFrom(country.cities, globalSeed * 3 + 1);
      const imgIdx = (country.imgOffset + (i % 20)) % 70 + 1;
      profiles.push({
        id: `${country.key}-f-${i + 1}`,
        name: country.femaleNames[i % country.femaleNames.length],
        age: 20 + Math.floor(seededRandom(globalSeed * 5 + 2) * 12), // 20–31
        city: city.name,
        country: country.name,
        countryFlag: country.flag,
        gender: "Female",
        latitude:  city.lat + (seededRandom(globalSeed * 11) - 0.5) * 0.25,
        longitude: city.lon + (seededRandom(globalSeed * 13) - 0.5) * 0.25,
        image: `https://i.pravatar.cc/400?img=${imgIdx}`,
        last_seen_at: getLastSeen(globalSeed),
      });
    }

    // Male profiles
    for (let i = 0; i < country.maleCount; i++) {
      globalSeed++;
      const city = pickFrom(country.cities, globalSeed * 7 + 4);
      const imgIdx = 41 + (globalSeed % 20);
      profiles.push({
        id: `${country.key}-m-${i + 1}`,
        name: country.maleNames[i % country.maleNames.length],
        age: 22 + Math.floor(seededRandom(globalSeed * 9 + 6) * 12), // 22–33
        city: city.name,
        country: country.name,
        countryFlag: country.flag,
        gender: "Male",
        latitude:  city.lat + (seededRandom(globalSeed * 17) - 0.5) * 0.25,
        longitude: city.lon + (seededRandom(globalSeed * 19) - 0.5) * 0.25,
        image: `https://i.pravatar.cc/400?img=${imgIdx}`,
        last_seen_at: getLastSeen(globalSeed + 300),
      });
    }
  });

  return profiles;
}
