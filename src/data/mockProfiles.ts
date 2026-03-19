// ── 1200 mock profiles — 12 countries × 100 (75F + 25M) ──────────────────────

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
  // Main sleep block 21:00–02:00 start, 6–8 h duration
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

// ── Profile image slots — 200 slots cycling pravatar 1–70 ────────────────────
export const PROFILE_IMAGES: string[] = Array.from({ length: 200 }, (_, i) => {
  const imgIdx = (i % 70) + 1;
  return `https://i.pravatar.cc/400?img=${imgIdx}`;
});

// ── Country data ──────────────────────────────────────────────────────────────

interface CountryData {
  key: string;
  name: string;
  flag: string;
  distLo: number;
  distHi: number;
  cities: string[];
  fn: string[];
  mn: string[];
}

const COUNTRIES_DATA: CountryData[] = [
  {
    key: "id", name: "Indonesia", flag: "🇮🇩", distLo: 1, distHi: 200,
    cities: ["Jakarta","Surabaya","Bandung","Bali","Yogyakarta","Medan","Semarang","Makassar","Malang","Batam"],
    fn: ["Sari","Dewi","Rina","Ayu","Fitri","Nadia","Putri","Maya","Dina","Cinta","Reni","Lina","Hana","Wulan","Tari","Indah","Sinta","Mega","Yuni","Lia","Ratna","Devi","Novi","Endah","Rahma"],
    mn: ["Bagas","Rizky","Andi","Danu","Fajar","Hendra","Iwan","Joko","Kevin","Lukman","Mario","Novan","Raka","Surya","Tegar","Budi","Dimas","Eko","Gilang","Hafiz","Irwan","Jamal","Kiki","Lukito","Manda"],
  },
  {
    key: "ph", name: "Philippines", flag: "🇵🇭", distLo: 1, distHi: 300,
    cities: ["Manila","Cebu","Davao","Makati","BGC","Quezon City","Pasig","Iloilo"],
    fn: ["Ana","Maria","Rose","Joy","Angelica","Bea","Chloe","Jasmine","Kath","Lyn","Mia","Rica","Divine","Grace","Lovely","Angel","Trish","Nica","Lhea","Shiela","Danica","Ella","Fatima","Gina","Hazel"],
    mn: ["Carlo","Miguel","Josh","Mark","Enzo","Ian","JC","Luis","Ken","Paolo","Ramon","Sergio","Tony","Ulysses","Vincent","Wil","Xavier","Yvan","Zack","Arvin","Bobbie","Chito","Dennis","Edgar","Francis"],
  },
  {
    key: "th", name: "Thailand", flag: "🇹🇭", distLo: 1, distHi: 300,
    cities: ["Bangkok","Chiang Mai","Phuket","Pattaya","Hua Hin","Koh Samui","Ayutthaya"],
    fn: ["Ploy","Nook","Fon","Pim","Mint","Nam","Ning","Aon","Koi","Joy","Bow","Gift","Bell","May","Pam","Gam","Ice","Pink","Toon","Wan","Dao","Earn","Fang","Goy","Hana"],
    mn: ["Arm","Bank","Big","Dome","Film","Golf","New","Oak","Top","Win","Aek","Boon","Chart","Din","Ekk","Fah","Gun","Hed","Ink","Jak","Kan","Lek","Mon","Nit","Om"],
  },
  {
    key: "sg", name: "Singapore", flag: "🇸🇬", distLo: 1, distHi: 50,
    cities: ["Singapore","Orchard","Marina Bay","Jurong","Tampines"],
    fn: ["Jess","Adeline","Xinyi","Yiting","Cheryl","Melissa","Rachel","Sarah","Nicole","Winnie","Fiona","Jasmine","Karen","Lynn","Priya","Amanda","Becky","Celeste","Diana","Eunice","Gloria","Helena","Irene","Janet","Kayla"],
    mn: ["Ethan","Bryan","Darren","Jason","Kevin","Marcus","Ryan","Sean","Aaron","Benjamin","Caleb","David","Elroy","Fabian","Gavin","Harris","Ivan","Jerome","Keith","Leonard","Martin","Nathan","Owen","Peter","Quentin"],
  },
  {
    key: "my", name: "Malaysia", flag: "🇲🇾", distLo: 1, distHi: 200,
    cities: ["Kuala Lumpur","Penang","Johor Bahru","Kota Kinabalu","Petaling Jaya","Ipoh","Shah Alam"],
    fn: ["Nurul","Aisyah","Siti","Amira","Hafizah","Yee Ling","Mei","Lily","Amanda","Priya","Zara","Nadia","Elissa","Farhana","Qistina","Rania","Sasha","Tina","Uma","Vivian","Wai Ling","Xin Yi","Yanti","Zahra","Aida"],
    mn: ["Haziq","Ariff","Syafiq","Daniel","Darren","Reza","Sam","Wei","Azlan","Boon","Chong","Dafi","Emir","Farid","Ghazi","Hafiz","Irfan","Jared","Kamil","Luqman","Musa","Nabil","Omar","Pang","Qayyum"],
  },
  {
    key: "vn", name: "Vietnam", flag: "🇻🇳", distLo: 1, distHi: 300,
    cities: ["Ho Chi Minh City","Hanoi","Da Nang","Nha Trang","Hoi An","Can Tho","Hue"],
    fn: ["Linh","Huong","Lan","Hoa","Thu","Phuong","Yen","Chi","Ngoc","Ly","Thao","Van","Bich","Dung","Hien","Khanh","Mai","Ngan","Oanh","Quynh","Suong","Tuyen","Uyen","Xuan","Yen"],
    mn: ["Minh","Tuan","Long","Duc","Hung","Nam","Phong","Quang","An","Binh","Cuong","Dang","Hieu","Kien","Loc","Manh","Nghia","Phuc","Quan","Son","Thai","Tien","Trung","Viet","Xuan"],
  },
  {
    key: "gb", name: "United Kingdom", flag: "🇬🇧", distLo: 500, distHi: 9999,
    cities: ["London","Manchester","Birmingham","Edinburgh","Liverpool","Bristol","Leeds","Glasgow"],
    fn: ["Sophie","Emma","Charlotte","Olivia","Amelia","Isla","Poppy","Ava","Lily","Grace","Chloe","Hannah","Lucy","Mia","Ella","Freya","Imogen","Daisy","Phoebe","Zoe","Alice","Rosie","Florence","Evelyn","Harriet"],
    mn: ["Jack","Oliver","Harry","George","Charlie","James","Alfie","Freddie","Oscar","Henry","Liam","Noah","Thomas","William","Edward","Samuel","Daniel","Joseph","Benjamin","Alexander","Luke","Ethan","Mason","Logan","Ryan"],
  },
  {
    key: "au", name: "Australia", flag: "🇦🇺", distLo: 500, distHi: 9999,
    cities: ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast","Canberra","Darwin"],
    fn: ["Olivia","Charlotte","Amelia","Ava","Isla","Mia","Grace","Ruby","Zoe","Lily","Chloe","Sophie","Madison","Harper","Aria","Sienna","Willow","Luna","Aurora","Stella","Ivy","Hazel","Violet","Ellie","Jade"],
    mn: ["Oliver","Noah","William","Jack","Lucas","James","Henry","Leo","Liam","Hugo","Charlie","Thomas","Ethan","Mason","Hunter","Bailey","Riley","Archie","Finn","Max","Cooper","Jasper","Eli","Caleb","Dylan"],
  },
  {
    key: "us", name: "USA", flag: "🇺🇸", distLo: 500, distHi: 9999,
    cities: ["New York","Los Angeles","Chicago","Houston","Miami","San Francisco","Seattle","Boston","Atlanta","Dallas"],
    fn: ["Emma","Olivia","Ava","Isabella","Sophia","Mia","Charlotte","Amelia","Harper","Evelyn","Luna","Camila","Aria","Scarlett","Penelope","Layla","Chloe","Victoria","Madison","Eleanor","Ella","Nora","Hazel","Abigail","Emily"],
    mn: ["Liam","Noah","Oliver","Elijah","James","Aiden","Lucas","Mason","Ethan","Logan","Jackson","Sebastian","Mateo","Jack","Owen","Ryan","Nathan","Isaiah","Hunter","Grayson","Jayden","Carter","Dylan","Connor","Zachary"],
  },
  {
    key: "ie", name: "Ireland", flag: "🇮🇪", distLo: 500, distHi: 9999,
    cities: ["Dublin","Cork","Galway","Limerick","Waterford","Killarney"],
    fn: ["Aoife","Saoirse","Siobhan","Niamh","Caoimhe","Clodagh","Roisin","Orla","Ciara","Aisling","Mairead","Fionnuala","Dearbhla","Grainne","Eimear","Claire","Rachel","Sarah","Katie","Emily","Laura","Amy","Nicole","Jessica","Sinead"],
    mn: ["Liam","Conor","Cian","Sean","Patrick","Oisin","Fionn","Darragh","Rory","Cormac","Eoin","Cathal","Declan","Ronan","Fergus","James","Shane","Kevin","Paul","David","Brendan","Michael","Daniel","Thomas","Colm"],
  },
  {
    key: "fr", name: "France", flag: "🇫🇷", distLo: 500, distHi: 9999,
    cities: ["Paris","Lyon","Marseille","Nice","Toulouse","Bordeaux","Strasbourg","Nantes"],
    fn: ["Emma","Léa","Chloé","Camille","Manon","Julie","Marie","Laura","Sarah","Lucie","Inès","Alice","Jade","Clara","Margot","Louise","Elisa","Charlotte","Pauline","Océane","Lola","Zoé","Mathilde","Anaïs","Céline"],
    mn: ["Lucas","Hugo","Nathan","Thomas","Théo","Maxime","Baptiste","Antoine","Clément","Julien","Alexandre","Nicolas","Pierre","Louis","Romain","Axel","Tristan","Guillaume","Adrien","Sébastien","Raphaël","Florian","Victor","Valentin","Mathis"],
  },
  {
    key: "be", name: "Belgium", flag: "🇧🇪", distLo: 500, distHi: 9999,
    cities: ["Brussels","Antwerp","Ghent","Liège","Bruges","Namur"],
    fn: ["Emma","Julie","Sarah","Laura","Manon","Amelie","Charlotte","Elisa","Marie","Lisa","Axelle","Céline","Nathalie","Isabelle","Katrien","An","Lies","Sofie","Ines","Lien","Fien","Tine","Noor","Amber","Janne"],
    mn: ["Nicolas","Thomas","Mathieu","Louis","Victor","Kevin","David","Michael","Simon","Robin","Pieter","Joris","Luca","Arthur","Milan","Tim","Tom","Sander","Axel","Ruben","Lars","Nils","Baptiste","Florian","Quentin"],
  },
];

// ── Build profiles — 75F + 25M per country = 1200 total ──────────────────────

function buildCountryProfiles(c: CountryData, baseImgOffset: number, baseSeed: number): MockProfile[] {
  const profiles: MockProfile[] = [];

  // 75 female profiles
  for (let i = 0; i < 75; i++) {
    const s = baseSeed + i * 13 + 7;
    const imgIdx = ((baseImgOffset + i) % 70) + 1;
    profiles.push({
      id: `${c.key}-f${i}`,
      name: c.fn[i % c.fn.length],
      age: sr(s, 19, 34),
      city: c.cities[sr(s + 1, 0, c.cities.length - 1)],
      country: c.name,
      countryFlag: c.flag,
      gender: "Female" as const,
      image: `https://i.pravatar.cc/400?img=${imgIdx}`,
      distanceKm: sr(s + 2, c.distLo, c.distHi),
      isVip: sr(s + 3, 0, 4) === 0,
      offlineWindows: buildOffline(s),
    });
  }

  // 25 male profiles
  for (let i = 0; i < 25; i++) {
    const s = baseSeed + (i + 75) * 13 + 7;
    const imgIdx = ((baseImgOffset + 40 + i) % 70) + 1;
    profiles.push({
      id: `${c.key}-m${i}`,
      name: c.mn[i % c.mn.length],
      age: sr(s, 21, 38),
      city: c.cities[sr(s + 1, 0, c.cities.length - 1)],
      country: c.name,
      countryFlag: c.flag,
      gender: "Male" as const,
      image: `https://i.pravatar.cc/400?img=${imgIdx}`,
      distanceKm: sr(s + 2, c.distLo, c.distHi),
      isVip: sr(s + 3, 0, 4) === 0,
      offlineWindows: buildOffline(s),
    });
  }

  return profiles;
}

export const MOCK_PROFILES: MockProfile[] = COUNTRIES_DATA.flatMap((c, idx) =>
  buildCountryProfiles(c, (idx * 5) % 70, idx * 10000)
);

export default MOCK_PROFILES;
