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
  isNewGuest?: boolean;
  badge?: string;
};

// ── Country data ──────────────────────────────────────────────────────────────

const SEA_COUNTRIES = [
  {
    key: "id", name: "Indonesia", flag: "🇮🇩",
    femaleNames: [
      "Sari","Dewi","Rina","Ayu","Fitri","Nadia","Putri","Maya","Dina","Cinta",
      "Reni","Lina","Hana","Wulan","Tari","Indah","Sinta","Mega","Yuni","Lia",
      "Ratna","Devi","Novi","Endah","Rahma",
    ],
    maleNames: [
      "Bagas","Rizky","Andi","Danu","Fajar","Hendra","Iwan","Joko","Kevin","Lukman",
      "Mario","Novan","Raka","Surya","Tegar","Budi","Dimas","Eko","Gilang","Hafiz",
      "Irwan","Jamal","Kiki","Lukito","Manda",
    ],
    cities: [
      { name: "Jakarta",    lat: -6.2088,  lon: 106.8456 },
      { name: "Surabaya",   lat: -7.2575,  lon: 112.7521 },
      { name: "Bandung",    lat: -6.9175,  lon: 107.6191 },
      { name: "Bali",       lat: -8.4095,  lon: 115.1889 },
      { name: "Yogyakarta", lat: -7.7956,  lon: 110.3695 },
      { name: "Medan",      lat:  3.5952,  lon:  98.6722 },
      { name: "Semarang",   lat: -6.9932,  lon: 110.4203 },
      { name: "Makassar",   lat: -5.1477,  lon: 119.4327 },
      { name: "Malang",     lat: -7.9666,  lon: 112.6326 },
      { name: "Batam",      lat:  1.0457,  lon: 104.0305 },
    ],
    femaleCount: 75,
    maleCount: 25,
    imgOffset: 0,
  },
  {
    key: "ph", name: "Philippines", flag: "🇵🇭",
    femaleNames: [
      "Ana","Maria","Rose","Joy","Angelica","Bea","Chloe","Jasmine","Kath","Lyn",
      "Mia","Rica","Divine","Grace","Lovely","Angel","Trish","Nica","Lhea","Shiela",
      "Danica","Ella","Fatima","Gina","Hazel",
    ],
    maleNames: [
      "Carlo","Miguel","Josh","Mark","Enzo","Ian","JC","Luis","Ken","Paolo",
      "Ramon","Sergio","Tony","Ulysses","Vincent","Wil","Xavier","Yvan","Zack","Arvin",
      "Bobbie","Chito","Dennis","Edgar","Francis",
    ],
    cities: [
      { name: "Manila",      lat: 14.5995, lon: 120.9842 },
      { name: "Cebu",        lat: 10.3157, lon: 123.8854 },
      { name: "Davao",       lat:  7.1907, lon: 125.4553 },
      { name: "Makati",      lat: 14.5547, lon: 121.0244 },
      { name: "BGC",         lat: 14.5500, lon: 121.0494 },
      { name: "Quezon City", lat: 14.6760, lon: 121.0437 },
      { name: "Pasig",       lat: 14.5764, lon: 121.0851 },
      { name: "Iloilo",      lat: 10.7202, lon: 122.5621 },
    ],
    femaleCount: 75,
    maleCount: 25,
    imgOffset: 5,
  },
  {
    key: "th", name: "Thailand", flag: "🇹🇭",
    femaleNames: [
      "Ploy","Nook","Fon","Pim","Mint","Nam","Ning","Aon","Koi","Joy",
      "Bow","Gift","Bell","May","Pam","Gam","Ice","Pink","Toon","Wan",
      "Dao","Earn","Fang","Goy","Hana",
    ],
    maleNames: [
      "Arm","Bank","Big","Dome","Film","Golf","New","Oak","Top","Win",
      "Aek","Boon","Chart","Din","Ekk","Fah","Gun","Hed","Ink","Jak",
      "Kan","Lek","Mon","Nit","Om",
    ],
    cities: [
      { name: "Bangkok",    lat: 13.7563, lon: 100.5018 },
      { name: "Chiang Mai", lat: 18.7883, lon:  98.9853 },
      { name: "Phuket",     lat:  7.8804, lon:  98.3923 },
      { name: "Pattaya",    lat: 12.9236, lon: 100.8825 },
      { name: "Hua Hin",    lat: 12.5685, lon:  99.9578 },
      { name: "Koh Samui",  lat:  9.5120, lon: 100.0136 },
      { name: "Ayutthaya",  lat: 14.3692, lon: 100.5877 },
    ],
    femaleCount: 75,
    maleCount: 25,
    imgOffset: 10,
  },
  {
    key: "sg", name: "Singapore", flag: "🇸🇬",
    femaleNames: [
      "Jess","Adeline","Xinyi","Yiting","Cheryl","Melissa","Rachel","Sarah","Nicole","Winnie",
      "Fiona","Jasmine","Karen","Lynn","Priya","Amanda","Becky","Celeste","Diana","Eunice",
      "Gloria","Helena","Irene","Janet","Kayla",
    ],
    maleNames: [
      "Ethan","Bryan","Darren","Jason","Kevin","Marcus","Ryan","Sean","Aaron","Benjamin",
      "Caleb","David","Elroy","Fabian","Gavin","Harris","Ivan","Jerome","Keith","Leonard",
      "Martin","Nathan","Owen","Peter","Quentin",
    ],
    cities: [
      { name: "Singapore",  lat: 1.3521, lon: 103.8198 },
      { name: "Orchard",    lat: 1.3036, lon: 103.8318 },
      { name: "Marina Bay", lat: 1.2816, lon: 103.8636 },
      { name: "Jurong",     lat: 1.3329, lon: 103.7436 },
      { name: "Tampines",   lat: 1.3540, lon: 103.9453 },
    ],
    femaleCount: 75,
    maleCount: 25,
    imgOffset: 15,
  },
  {
    key: "my", name: "Malaysia", flag: "🇲🇾",
    femaleNames: [
      "Nurul","Aisyah","Siti","Amira","Hafizah","Yee Ling","Mei","Lily","Amanda","Priya",
      "Zara","Nadia","Elissa","Farhana","Qistina","Rania","Sasha","Tina","Uma","Vivian",
      "Wai Ling","Xin Yi","Yanti","Zahra","Aida",
    ],
    maleNames: [
      "Haziq","Ariff","Syafiq","Daniel","Darren","Reza","Sam","Wei","Azlan","Boon",
      "Chong","Dafi","Emir","Farid","Ghazi","Hafiz","Irfan","Jared","Kamil","Luqman",
      "Musa","Nabil","Omar","Pang","Qayyum",
    ],
    cities: [
      { name: "Kuala Lumpur",  lat:  3.1390, lon: 101.6869 },
      { name: "Penang",        lat:  5.4141, lon: 100.3288 },
      { name: "Johor Bahru",   lat:  1.4927, lon: 103.7414 },
      { name: "Kota Kinabalu", lat:  5.9804, lon: 116.0735 },
      { name: "Petaling Jaya", lat:  3.1073, lon: 101.6067 },
      { name: "Ipoh",          lat:  4.5975, lon: 101.0901 },
      { name: "Shah Alam",     lat:  3.0851, lon: 101.5328 },
    ],
    femaleCount: 75,
    maleCount: 25,
    imgOffset: 20,
  },
  {
    key: "vn", name: "Vietnam", flag: "🇻🇳",
    femaleNames: [
      "Linh","Huong","Lan","Hoa","Thu","Phuong","Yen","Chi","Ngoc","Ly",
      "Thao","Van","Bich","Dung","Hien","Khanh","Mai","Ngan","Oanh","Quynh",
      "Suong","Tuyen","Uyen","Xuan","Yen",
    ],
    maleNames: [
      "Minh","Tuan","Long","Duc","Hung","Nam","Phong","Quang","An","Binh",
      "Cuong","Dang","Hieu","Kien","Loc","Manh","Nghia","Phuc","Quan","Son",
      "Thai","Tien","Trung","Viet","Xuan",
    ],
    cities: [
      { name: "Ho Chi Minh City", lat: 10.8231, lon: 106.6297 },
      { name: "Hanoi",            lat: 21.0285, lon: 105.8542 },
      { name: "Da Nang",          lat: 16.0544, lon: 108.2022 },
      { name: "Nha Trang",        lat: 12.2388, lon: 109.1967 },
      { name: "Hoi An",           lat: 15.8801, lon: 108.3380 },
      { name: "Can Tho",          lat: 10.0452, lon: 105.7469 },
      { name: "Hue",              lat: 16.4637, lon: 107.5909 },
    ],
    femaleCount: 75,
    maleCount: 25,
    imgOffset: 25,
  },
  {
    key: "gb", name: "United Kingdom", flag: "🇬🇧",
    femaleNames: [
      "Sophie","Emma","Charlotte","Olivia","Amelia","Isla","Poppy","Ava","Lily","Grace",
      "Chloe","Hannah","Lucy","Mia","Ella","Freya","Imogen","Daisy","Phoebe","Zoe",
      "Alice","Rosie","Florence","Evelyn","Harriet",
    ],
    maleNames: [
      "Jack","Oliver","Harry","George","Charlie","James","Alfie","Freddie","Oscar","Henry",
      "Liam","Noah","Thomas","William","Edward","Samuel","Daniel","Joseph","Benjamin","Alexander",
      "Luke","Ethan","Mason","Logan","Ryan",
    ],
    cities: [
      { name: "London",     lat: 51.5074, lon: -0.1278 },
      { name: "Manchester", lat: 53.4808, lon: -2.2426 },
      { name: "Birmingham", lat: 52.4862, lon: -1.8904 },
      { name: "Edinburgh",  lat: 55.9533, lon: -3.1883 },
      { name: "Liverpool",  lat: 53.4084, lon: -2.9916 },
      { name: "Bristol",    lat: 51.4545, lon: -2.5879 },
      { name: "Leeds",      lat: 53.8008, lon: -1.5491 },
      { name: "Glasgow",    lat: 55.8642, lon: -4.2518 },
    ],
    femaleCount: 75,
    maleCount: 25,
    imgOffset: 30,
  },
  {
    key: "au", name: "Australia", flag: "🇦🇺",
    femaleNames: [
      "Olivia","Charlotte","Amelia","Ava","Isla","Mia","Grace","Ruby","Zoe","Lily",
      "Chloe","Sophie","Madison","Harper","Aria","Sienna","Willow","Luna","Aurora","Stella",
      "Ivy","Hazel","Violet","Ellie","Jade",
    ],
    maleNames: [
      "Oliver","Noah","William","Jack","Lucas","James","Henry","Leo","Liam","Hugo",
      "Charlie","Thomas","Ethan","Mason","Hunter","Bailey","Riley","Archie","Finn","Max",
      "Cooper","Jasper","Eli","Caleb","Dylan",
    ],
    cities: [
      { name: "Sydney",     lat: -33.8688, lon: 151.2093 },
      { name: "Melbourne",  lat: -37.8136, lon: 144.9631 },
      { name: "Brisbane",   lat: -27.4698, lon: 153.0251 },
      { name: "Perth",      lat: -31.9505, lon: 115.8605 },
      { name: "Adelaide",   lat: -34.9285, lon: 138.6007 },
      { name: "Gold Coast", lat: -28.0167, lon: 153.4000 },
      { name: "Canberra",   lat: -35.2809, lon: 149.1300 },
      { name: "Darwin",     lat: -12.4634, lon: 130.8456 },
    ],
    femaleCount: 75,
    maleCount: 25,
    imgOffset: 35,
  },
  {
    key: "us", name: "USA", flag: "🇺🇸",
    femaleNames: [
      "Emma","Olivia","Ava","Isabella","Sophia","Mia","Charlotte","Amelia","Harper","Evelyn",
      "Luna","Camila","Aria","Scarlett","Penelope","Layla","Chloe","Victoria","Madison","Eleanor",
      "Ella","Nora","Hazel","Abigail","Emily",
    ],
    maleNames: [
      "Liam","Noah","Oliver","Elijah","James","Aiden","Lucas","Mason","Ethan","Logan",
      "Jackson","Sebastian","Mateo","Jack","Owen","Ryan","Nathan","Isaiah","Hunter","Grayson",
      "Jayden","Carter","Dylan","Connor","Zachary",
    ],
    cities: [
      { name: "New York",       lat: 40.7128, lon:  -74.0060 },
      { name: "Los Angeles",    lat: 34.0522, lon: -118.2437 },
      { name: "Chicago",        lat: 41.8781, lon:  -87.6298 },
      { name: "Houston",        lat: 29.7604, lon:  -95.3698 },
      { name: "Miami",          lat: 25.7617, lon:  -80.1918 },
      { name: "San Francisco",  lat: 37.7749, lon: -122.4194 },
      { name: "Seattle",        lat: 47.6062, lon: -122.3321 },
      { name: "Boston",         lat: 42.3601, lon:  -71.0589 },
      { name: "Atlanta",        lat: 33.7490, lon:  -84.3880 },
      { name: "Dallas",         lat: 32.7767, lon:  -96.7970 },
    ],
    femaleCount: 75,
    maleCount: 25,
    imgOffset: 40,
  },
  {
    key: "ie", name: "Ireland", flag: "🇮🇪",
    femaleNames: [
      "Aoife","Saoirse","Siobhan","Niamh","Caoimhe","Clodagh","Roisin","Orla","Ciara","Aisling",
      "Mairead","Fionnuala","Dearbhla","Grainne","Eimear","Claire","Rachel","Sarah","Katie","Emily",
      "Laura","Amy","Nicole","Jessica","Sinead",
    ],
    maleNames: [
      "Liam","Conor","Cian","Sean","Patrick","Oisin","Fionn","Darragh","Rory","Cormac",
      "Eoin","Cathal","Declan","Ronan","Fergus","James","Shane","Kevin","Paul","David",
      "Brendan","Michael","Daniel","Thomas","Colm",
    ],
    cities: [
      { name: "Dublin",    lat: 53.3498, lon: -6.2603 },
      { name: "Cork",      lat: 51.8985, lon: -8.4756 },
      { name: "Galway",    lat: 53.2707, lon: -9.0568 },
      { name: "Limerick",  lat: 52.6638, lon: -8.6267 },
      { name: "Waterford", lat: 52.2593, lon: -7.1101 },
      { name: "Killarney", lat: 52.0599, lon: -9.5044 },
    ],
    femaleCount: 75,
    maleCount: 25,
    imgOffset: 45,
  },
  {
    key: "fr", name: "France", flag: "🇫🇷",
    femaleNames: [
      "Emma","Léa","Chloé","Camille","Manon","Julie","Marie","Laura","Sarah","Lucie",
      "Inès","Alice","Jade","Clara","Margot","Louise","Elisa","Charlotte","Pauline","Océane",
      "Lola","Zoé","Mathilde","Anaïs","Céline",
    ],
    maleNames: [
      "Lucas","Hugo","Nathan","Thomas","Théo","Maxime","Baptiste","Antoine","Clément","Julien",
      "Alexandre","Nicolas","Pierre","Louis","Romain","Axel","Tristan","Guillaume","Adrien","Sébastien",
      "Raphaël","Florian","Victor","Valentin","Mathis",
    ],
    cities: [
      { name: "Paris",      lat: 48.8566, lon:  2.3522 },
      { name: "Lyon",       lat: 45.7640, lon:  4.8357 },
      { name: "Marseille",  lat: 43.2965, lon:  5.3698 },
      { name: "Nice",       lat: 43.7102, lon:  7.2620 },
      { name: "Toulouse",   lat: 43.6047, lon:  1.4442 },
      { name: "Bordeaux",   lat: 44.8378, lon: -0.5792 },
      { name: "Strasbourg", lat: 48.5734, lon:  7.7521 },
      { name: "Nantes",     lat: 47.2184, lon: -1.5536 },
    ],
    femaleCount: 75,
    maleCount: 25,
    imgOffset: 50,
  },
  {
    key: "be", name: "Belgium", flag: "🇧🇪",
    femaleNames: [
      "Emma","Julie","Sarah","Laura","Manon","Amelie","Charlotte","Elisa","Marie","Lisa",
      "Axelle","Céline","Nathalie","Isabelle","Katrien","An","Lies","Sofie","Ines","Lien",
      "Fien","Tine","Noor","Amber","Janne",
    ],
    maleNames: [
      "Nicolas","Thomas","Mathieu","Louis","Victor","Kevin","David","Michael","Simon","Robin",
      "Pieter","Joris","Luca","Arthur","Milan","Tim","Tom","Sander","Axel","Ruben",
      "Lars","Nils","Baptiste","Florian","Quentin",
    ],
    cities: [
      { name: "Brussels", lat: 50.8503, lon:  4.3517 },
      { name: "Antwerp",  lat: 51.2194, lon:  4.4025 },
      { name: "Ghent",    lat: 51.0543, lon:  3.7174 },
      { name: "Liège",    lat: 50.6326, lon:  5.5797 },
      { name: "Bruges",   lat: 51.2093, lon:  3.2247 },
      { name: "Namur",    lat: 50.4669, lon:  4.8675 },
    ],
    femaleCount: 75,
    maleCount: 25,
    imgOffset: 55,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

export function pickFrom<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)];
}

export function getLastSeen(seed: number): string | null {
  const r = seededRandom(seed * 7 + 3);
  if (r < 0.35) {
    const msAgo = Math.floor(seededRandom(seed * 13) * 4 * 60 * 1000);
    return new Date(Date.now() - msAgo).toISOString();
  }
  const hoursAgo = 1 + Math.floor(seededRandom(seed * 17) * 23);
  return new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
}

// ── Generator ─────────────────────────────────────────────────────────────────

const ID_FEMALE_IMAGES = [
  "https://ik.imagekit.io/7grri5v7d/1as.png",
  "https://ik.imagekit.io/7grri5v7d/1q.png",
  "https://ik.imagekit.io/7grri5v7d/2a.png",
  "https://ik.imagekit.io/7grri5v7d/2i.png",
  "https://ik.imagekit.io/7grri5v7d/4i.png",
  "https://ik.imagekit.io/7grri5v7d/1a.png",
  "https://ik.imagekit.io/7grri5v7d/3a.png",
  "https://ik.imagekit.io/7grri5v7d/15a.png",
  "https://ik.imagekit.io/7grri5v7d/5a.png",
  "https://ik.imagekit.io/7grri5v7d/5q.png",
  "https://ik.imagekit.io/7grri5v7d/4a.png",
  "https://ik.imagekit.io/7grri5v7d/5i.png",
  "https://ik.imagekit.io/7grri5v7d/4q.png",
];

const MOCK_BADGES = [
  "free_tonight","free_weekend","available_now","marriage_minded","soulmate",
  "here_for_love","date_me_first","friends_first","serious_only","lets_hang",
  "good_vibes","fun_first","no_strings","just_vibes","flirt_mode","wild_heart",
  "spontaneous","discreet","older_man","foreign_partner","local_only",
  "long_distance","travel_together","new_here","night_owl","second_chance",
];

export function generateIndonesianProfiles(): IndonesianProfile[] {
  const profiles: IndonesianProfile[] = [];
  let globalSeed = 0;

  SEA_COUNTRIES.forEach((country, countryIdx) => {
    // Female profiles
    for (let i = 0; i < country.femaleCount; i++) {
      globalSeed++;
      const city = pickFrom(country.cities, globalSeed * 3 + 1);
      const imgIdx = ((country.imgOffset + (i % 70)) % 70) + 1;
      const femaleImage = country.key === "id"
        ? ID_FEMALE_IMAGES[i % ID_FEMALE_IMAGES.length]
        : `https://i.pravatar.cc/400?img=${imgIdx}`;
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
        image: femaleImage,
        last_seen_at: getLastSeen(globalSeed),
        isNewGuest: globalSeed % 5 === 0,
        badge: globalSeed % 3 === 0 ? MOCK_BADGES[globalSeed % MOCK_BADGES.length] : undefined,
      });
    }

    // Male profiles
    for (let i = 0; i < country.maleCount; i++) {
      globalSeed++;
      const city = pickFrom(country.cities, globalSeed * 7 + 4);
      const imgIdx = ((country.imgOffset + countryIdx * 5 + 40 + (i % 30)) % 70) + 1;
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
        isNewGuest: globalSeed % 5 === 0,
        badge: globalSeed % 3 === 0 ? MOCK_BADGES[globalSeed % MOCK_BADGES.length] : undefined,
      });
    }
  });

  return profiles;
}
