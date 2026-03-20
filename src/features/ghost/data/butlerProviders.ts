// ── Ghost Butler — verified service provider directory ────────────────────────
// Each provider has been vetted by Ghost admin.
// Users purchase a category pack ($9.99) to unlock 5 WhatsApp numbers.
// Delivery coordination goes through Ghost admin — address is never exposed to the sender.

export type ButlerCategory = "flowers" | "jewellery" | "spa" | "beautician";

export type ButlerProvider = {
  id: string;
  name: string;
  photo: string;         // profile photo shown on card
  description: string;
  specialty: string;     // short tag line shown on card
  city: string;
  countryCode: string;
  whatsapp: string;      // only revealed after purchase
  rating: number;        // out of 5
  deliveryNote: string;  // e.g. "Same-day Jakarta delivery"
  verified: boolean;
};

export type ButlerCategoryMeta = {
  key: ButlerCategory;
  label: string;
  emoji: string;
  tagline: string;
  color: string;
};

export const BUTLER_CATEGORIES: ButlerCategoryMeta[] = [
  {
    key: "flowers",
    label: "Fresh Flowers",
    emoji: "💐",
    tagline: "Hand-arranged bouquets delivered same day",
    color: "#f472b6",
  },
  {
    key: "jewellery",
    label: "Jewellery",
    emoji: "💍",
    tagline: "Rings, necklaces, bracelets — local artisans",
    color: "#fbbf24",
  },
  {
    key: "spa",
    label: "Spa & Wellness",
    emoji: "🌸",
    tagline: "Spa vouchers & at-home wellness treatments",
    color: "#a78bfa",
  },
  {
    key: "beautician",
    label: "Beautician",
    emoji: "✨",
    tagline: "Make-up, hair & beauty at-home visits",
    color: "#34d399",
  },
];

// ── Supported cities ──────────────────────────────────────────────────────────
export const BUTLER_CITIES = [
  "Jakarta", "Bali", "Surabaya", "Bandung", "Medan",
  "Yogyakarta", "Makassar", "Semarang",
];

export function isCitySupported(city: string): boolean {
  return BUTLER_CITIES.some((c) => city.toLowerCase().includes(c.toLowerCase()));
}

// ── Mock providers (replace with Supabase fetch in production) ────────────────

type P = ButlerProvider & { category: ButlerCategory };

const PROVIDERS: P[] = [

  // ── Jakarta — Flowers ──────────────────────────────────────────────────────
  { id:"jkt-fl-1", name:"Rosa Blooms",         photo:"https://i.pravatar.cc/120?img=47", description:"Premium hand-tied bouquets, same-day delivery across Jakarta Selatan & Pusat",            specialty:"Hand-tied bouquets",    city:"Jakarta", countryCode:"ID", whatsapp:"+62 812-0001-1001", rating:4.9, deliveryNote:"Same-day Jakarta",        verified:true, category:"flowers" },
  { id:"jkt-fl-2", name:"Fleur Jakarta",        photo:"https://i.pravatar.cc/120?img=45", description:"European-style arrangements, weddings & surprises, fast delivery anywhere in Jakarta",   specialty:"European arrangements", city:"Jakarta", countryCode:"ID", whatsapp:"+62 813-0001-1002", rating:4.8, deliveryNote:"Same-day Jakarta",        verified:true, category:"flowers" },
  { id:"jkt-fl-3", name:"Mekar Indah",          photo:"https://i.pravatar.cc/120?img=43", description:"Local blooms, affordable prices, beautifully wrapped with personal message card",        specialty:"Affordable elegance",   city:"Jakarta", countryCode:"ID", whatsapp:"+62 857-0001-1003", rating:4.7, deliveryNote:"Same-day Jakarta",        verified:true, category:"flowers" },
  { id:"jkt-fl-4", name:"Bunga Kita",           photo:"https://i.pravatar.cc/120?img=41", description:"Fresh daily imports, specialty roses and orchids, discreet packaging available",         specialty:"Fresh imports daily",   city:"Jakarta", countryCode:"ID", whatsapp:"+62 878-0001-1004", rating:4.6, deliveryNote:"Same-day Jakarta",        verified:true, category:"flowers" },
  { id:"jkt-fl-5", name:"Taman Hati",           photo:"https://i.pravatar.cc/120?img=39", description:"Romantic packages with candles and chocolates, perfect for first impressions",          specialty:"Romantic packages",     city:"Jakarta", countryCode:"ID", whatsapp:"+62 821-0001-1005", rating:4.8, deliveryNote:"Same-day Jakarta",        verified:true, category:"flowers" },

  // ── Jakarta — Jewellery ────────────────────────────────────────────────────
  { id:"jkt-jw-1", name:"Emas Permata",         photo:"https://i.pravatar.cc/120?img=49", description:"Gold and silver pieces, custom engraving available, authentic Indonesian craftsmanship", specialty:"Custom engraving",      city:"Jakarta", countryCode:"ID", whatsapp:"+62 812-0002-2001", rating:4.9, deliveryNote:"Next-day Jakarta",       verified:true, category:"jewellery" },
  { id:"jkt-jw-2", name:"Perhiasan Mulia",       photo:"https://i.pravatar.cc/120?img=48", description:"Sterling silver jewellery, affordable luxury, gift-boxed and ribbon-wrapped",           specialty:"Sterling silver",       city:"Jakarta", countryCode:"ID", whatsapp:"+62 813-0002-2002", rating:4.7, deliveryNote:"Same-day Jakarta Pusat", verified:true, category:"jewellery" },
  { id:"jkt-jw-3", name:"Kilau Nusantara",       photo:"https://i.pravatar.cc/120?img=46", description:"Handmade traditional Javanese jewellery — unique pieces she won't find anywhere else",  specialty:"Javanese handmade",     city:"Jakarta", countryCode:"ID", whatsapp:"+62 857-0002-2003", rating:4.8, deliveryNote:"Same-day Jakarta",        verified:true, category:"jewellery" },
  { id:"jkt-jw-4", name:"Bintang Silver",        photo:"https://i.pravatar.cc/120?img=44", description:"925 silver bracelets and necklaces, custom name/initials, discreet packaging",          specialty:"Custom name pieces",    city:"Jakarta", countryCode:"ID", whatsapp:"+62 878-0002-2004", rating:4.6, deliveryNote:"Same-day Jakarta",        verified:true, category:"jewellery" },
  { id:"jkt-jw-5", name:"Mahkota Gems",          photo:"https://i.pravatar.cc/120?img=42", description:"Semi-precious stones, minimalist modern designs, loved by Indonesian women 20–35",       specialty:"Semi-precious stones",  city:"Jakarta", countryCode:"ID", whatsapp:"+62 821-0002-2005", rating:4.7, deliveryNote:"Same-day Jakarta",        verified:true, category:"jewellery" },

  // ── Jakarta — Spa & Wellness ───────────────────────────────────────────────
  { id:"jkt-sp-1", name:"Serene Spa Jakarta",    photo:"https://i.pravatar.cc/120?img=50", description:"Full-body traditional Indonesian spa vouchers — at our salon or home visit",             specialty:"Traditional pijat & spa",  city:"Jakarta", countryCode:"ID", whatsapp:"+62 812-0003-3001", rating:4.9, deliveryNote:"Voucher or home visit",       verified:true, category:"spa" },
  { id:"jkt-sp-2", name:"Candi Wellness",        photo:"https://i.pravatar.cc/120?img=38", description:"Javanese lulur body scrub + aromatherapy session, premium Jakarta spa, digital vouchers", specialty:"Lulur & aromatherapy",     city:"Jakarta", countryCode:"ID", whatsapp:"+62 813-0003-3002", rating:4.8, deliveryNote:"Digital voucher + home visit", verified:true, category:"spa" },
  { id:"jkt-sp-3", name:"Tirta Home Spa",        photo:"https://i.pravatar.cc/120?img=37", description:"Qualified therapist comes to her door — full relaxation experience, no travel needed",   specialty:"Home visit spa",           city:"Jakarta", countryCode:"ID", whatsapp:"+62 857-0003-3003", rating:4.8, deliveryNote:"Home visits Jakarta",          verified:true, category:"spa" },
  { id:"jkt-sp-4", name:"Zen Garden Spa",        photo:"https://i.pravatar.cc/120?img=36", description:"Couples packages and single packages, traditional Balinese techniques, central Jakarta",  specialty:"Balinese techniques",      city:"Jakarta", countryCode:"ID", whatsapp:"+62 878-0003-3004", rating:4.7, deliveryNote:"Jakarta Selatan & Pusat",      verified:true, category:"spa" },
  { id:"jkt-sp-5", name:"Bunga Rampai Wellness", photo:"https://i.pravatar.cc/120?img=35", description:"Herbal wellness vouchers, reflexology and deep-tissue packages, highly reviewed",          specialty:"Herbal & reflexology",     city:"Jakarta", countryCode:"ID", whatsapp:"+62 821-0003-3005", rating:4.6, deliveryNote:"Voucher delivered",             verified:true, category:"spa" },

  // ── Jakarta — Beautician ───────────────────────────────────────────────────
  { id:"jkt-be-1", name:"Glam by Sari",          photo:"https://i.pravatar.cc/120?img=34", description:"Professional make-up artist, bridal to casual, home visits across Jakarta, fully equipped kit", specialty:"Make-up artistry",       city:"Jakarta", countryCode:"ID", whatsapp:"+62 812-0004-4001", rating:4.9, deliveryNote:"Home visits Jakarta", verified:true, category:"beautician" },
  { id:"jkt-be-2", name:"Cantik Studio",          photo:"https://i.pravatar.cc/120?img=33", description:"Hair styling + blow-dry at home, special occasion packages, trusted by hundreds of women",       specialty:"Hair styling & blow-dry", city:"Jakarta", countryCode:"ID", whatsapp:"+62 813-0004-4002", rating:4.8, deliveryNote:"Home visits Jakarta", verified:true, category:"beautician" },
  { id:"jkt-be-3", name:"Lulur Beauty",           photo:"https://i.pravatar.cc/120?img=32", description:"Eyebrow threading, facial, nail art — complete beauty session at your doorstep",                 specialty:"Facial & nail art",       city:"Jakarta", countryCode:"ID", whatsapp:"+62 857-0004-4003", rating:4.7, deliveryNote:"Home visits Jakarta", verified:true, category:"beautician" },
  { id:"jkt-be-4", name:"Kecantikan Prima",       photo:"https://i.pravatar.cc/120?img=31", description:"Skin-care facials, whitening treatments, luxury at-home visit with premium products",            specialty:"Skin & facials",          city:"Jakarta", countryCode:"ID", whatsapp:"+62 878-0004-4004", rating:4.8, deliveryNote:"Home visits Jakarta", verified:true, category:"beautician" },
  { id:"jkt-be-5", name:"Ayu Beautique",          photo:"https://i.pravatar.cc/120?img=30", description:"All-in-one beauty: lashes, nails, hair and make-up — surprise full glam package for her",        specialty:"Full glam packages",      city:"Jakarta", countryCode:"ID", whatsapp:"+62 821-0004-4005", rating:4.9, deliveryNote:"Home visits Jakarta", verified:true, category:"beautician" },

  // ── Bali — Flowers ────────────────────────────────────────────────────────
  { id:"bali-fl-1", name:"Ubud Blooms",          photo:"https://i.pravatar.cc/120?img=29", description:"Tropical flower arrangements, frangipani & orchid specialties, Bali-wide delivery",   specialty:"Tropical arrangements",   city:"Bali", countryCode:"ID", whatsapp:"+62 812-0011-1101", rating:4.9, deliveryNote:"Same-day Bali",        verified:true, category:"flowers" },
  { id:"bali-fl-2", name:"Bunga Bali",           photo:"https://i.pravatar.cc/120?img=28", description:"Handcrafted offerings-style bouquets, uniquely Balinese, spiritual and beautiful",    specialty:"Balinese-style bouquets", city:"Bali", countryCode:"ID", whatsapp:"+62 813-0011-1102", rating:4.8, deliveryNote:"Seminyak, Kuta, Ubud", verified:true, category:"flowers" },
  { id:"bali-fl-3", name:"Lotus Flower Studio",  photo:"https://i.pravatar.cc/120?img=27", description:"Luxury petal arrangements, Instagrammable designs, fast delivery South Bali",         specialty:"Luxury petal art",        city:"Bali", countryCode:"ID", whatsapp:"+62 857-0011-1103", rating:4.7, deliveryNote:"South Bali",           verified:true, category:"flowers" },
  { id:"bali-fl-4", name:"Mekar Bali",           photo:"https://i.pravatar.cc/120?img=26", description:"Fresh daily blooms, affordable and elegant, with personal card included",             specialty:"Daily fresh blooms",      city:"Bali", countryCode:"ID", whatsapp:"+62 878-0011-1104", rating:4.7, deliveryNote:"Bali-wide",             verified:true, category:"flowers" },
  { id:"bali-fl-5", name:"Dewi Flora",           photo:"https://i.pravatar.cc/120?img=25", description:"Custom arrangements for any occasion, Balinese floral design tradition",              specialty:"Custom Balinese design",  city:"Bali", countryCode:"ID", whatsapp:"+62 821-0011-1105", rating:4.6, deliveryNote:"Bali-wide",             verified:true, category:"flowers" },

  // ── Bali — Spa ────────────────────────────────────────────────────────────
  { id:"bali-sp-1", name:"Taksu Spa Bali",       photo:"https://i.pravatar.cc/120?img=24", description:"World-class Balinese spa, gift vouchers and home visits across South Bali",           specialty:"Balinese spa & massage",  city:"Bali", countryCode:"ID", whatsapp:"+62 812-0012-1201", rating:5.0, deliveryNote:"Voucher or home visit",  verified:true, category:"spa" },
  { id:"bali-sp-2", name:"Jepun Wellness",       photo:"https://i.pravatar.cc/120?img=23", description:"Organic lulur, coconut oil massage, healing spa experience in Bali tradition",        specialty:"Organic lulur",           city:"Bali", countryCode:"ID", whatsapp:"+62 813-0012-1202", rating:4.9, deliveryNote:"South Bali",            verified:true, category:"spa" },
  { id:"bali-sp-3", name:"Pura Wellness",        photo:"https://i.pravatar.cc/120?img=22", description:"Mobile spa team comes to your villa or her home, full Balinese experience anywhere",  specialty:"Mobile villa spa",        city:"Bali", countryCode:"ID", whatsapp:"+62 857-0012-1203", rating:4.8, deliveryNote:"Home/villa visits",      verified:true, category:"spa" },
  { id:"bali-sp-4", name:"Sari Organik Spa",     photo:"https://i.pravatar.cc/120?img=21", description:"100% organic ingredients, therapeutic and relaxing, full-body packages",              specialty:"100% organic",            city:"Bali", countryCode:"ID", whatsapp:"+62 878-0012-1204", rating:4.7, deliveryNote:"Ubud & Canggu",         verified:true, category:"spa" },
  { id:"bali-sp-5", name:"Bali Bliss",           photo:"https://i.pravatar.cc/120?img=20", description:"Flower bath, aromatherapy, full relaxation gift package — most popular in Seminyak",  specialty:"Flower bath packages",    city:"Bali", countryCode:"ID", whatsapp:"+62 821-0012-1205", rating:4.8, deliveryNote:"Seminyak & Kuta",       verified:true, category:"spa" },
];

export function getProviders(city: string, category: ButlerCategory): ButlerProvider[] {
  const cityKey = BUTLER_CITIES.find((c) => city.toLowerCase().includes(c.toLowerCase())) ?? "Jakarta";
  const results = PROVIDERS.filter((p) => p.city === cityKey && p.category === category);
  if (results.length === 0) {
    return PROVIDERS.filter((p) => p.city === "Jakarta" && p.category === category).slice(0, 5);
  }
  return results.slice(0, 5);
}

/** localStorage key for purchased packs — tracks which category+city combos are unlocked */
export function getPackKey(city: string, category: ButlerCategory): string {
  const cityKey = BUTLER_CITIES.find((c) => city.toLowerCase().includes(c.toLowerCase())) ?? "Jakarta";
  return `ghost_butler_${cityKey.toLowerCase()}_${category}`;
}

export function isPackPurchased(city: string, category: ButlerCategory): boolean {
  try { return localStorage.getItem(getPackKey(city, category)) === "1"; } catch { return false; }
}

export function markPackPurchased(city: string, category: ButlerCategory): void {
  try { localStorage.setItem(getPackKey(city, category), "1"); } catch {}
}
