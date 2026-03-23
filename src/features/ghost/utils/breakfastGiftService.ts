// ── Breakfast Gift Service ─────────────────────────────────────────────────────
// Manages the per-floor gift library for breakfast invites.
// Admin uploads gifts via AdminGiftsPage; guests receive auto-selected gifts
// when invited to the lounge from a different floor.

export type BreakfastGift = {
  id:          string;
  floor:       string;     // standard | suite | kings | penthouse | loft | cellar
  emoji:       string;
  name:        string;
  imageUrl:    string;     // ImageKit or any CDN URL
  description: string;
  coinValue:   number;     // display only — auto-gifted, not purchased
};

const STORAGE_KEY = "ghost_breakfast_gifts";

// ── Default gift library per floor ────────────────────────────────────────────
const DEFAULT_GIFTS: BreakfastGift[] = [
  // Standard
  { id:"std-1", floor:"standard", emoji:"🌹", name:"Morning Rose",      imageUrl:"", description:"A single fresh rose to welcome you",          coinValue:3  },
  { id:"std-2", floor:"standard", emoji:"☕", name:"Coffee",            imageUrl:"", description:"Hot coffee ready at your seat",               coinValue:2  },
  { id:"std-3", floor:"standard", emoji:"🥐", name:"Croissant",         imageUrl:"", description:"Warm buttered croissant",                     coinValue:2  },
  { id:"std-4", floor:"standard", emoji:"🧁", name:"Muffin",            imageUrl:"", description:"Fresh baked blueberry muffin",                coinValue:2  },
  // Suite
  { id:"ste-1", floor:"suite",    emoji:"🌹", name:"Bronze Rose",       imageUrl:"", description:"A hand-tied bronze rose arrangement",         coinValue:5  },
  { id:"ste-2", floor:"suite",    emoji:"☕", name:"Specialty Coffee",  imageUrl:"", description:"Single origin pour-over coffee",              coinValue:4  },
  { id:"ste-3", floor:"suite",    emoji:"🧣", name:"Silk Scarf",        imageUrl:"", description:"Complimentary silk scarf from the suite",     coinValue:8  },
  { id:"ste-4", floor:"suite",    emoji:"🍊", name:"Fresh Juice",       imageUrl:"", description:"Freshly squeezed orange juice",               coinValue:3  },
  // Kings Room
  { id:"kng-1", floor:"kings",    emoji:"🥂", name:"Champagne",         imageUrl:"", description:"Glass of chilled champagne",                  coinValue:10 },
  { id:"kng-2", floor:"kings",    emoji:"👑", name:"Crown Chocolates",  imageUrl:"", description:"Gold-wrapped artisan chocolates",             coinValue:8  },
  { id:"kng-3", floor:"kings",    emoji:"📨", name:"Gold Envelope",     imageUrl:"", description:"Handwritten welcome note in gold envelope",   coinValue:5  },
  { id:"kng-4", floor:"kings",    emoji:"🌸", name:"Orchid",            imageUrl:"", description:"White orchid from the Kings garden",          coinValue:7  },
  // Penthouse
  { id:"pnt-1", floor:"penthouse",emoji:"🫙", name:"Caviar",            imageUrl:"", description:"Premium caviar with blinis",                  coinValue:15 },
  { id:"pnt-2", floor:"penthouse",emoji:"💎", name:"Crystal Glass",     imageUrl:"", description:"Hand-etched crystal champagne flute",         coinValue:12 },
  { id:"pnt-3", floor:"penthouse",emoji:"🏙️", name:"City View Card",   imageUrl:"", description:"Exclusive rooftop view card & key",           coinValue:10 },
  { id:"pnt-4", floor:"penthouse",emoji:"🌺", name:"Tropical Bouquet",  imageUrl:"", description:"Rare tropical flowers arrangement",           coinValue:12 },
  // Loft
  { id:"lft-1", floor:"loft",     emoji:"🖼️", name:"Art Print",        imageUrl:"", description:"Limited edition print from the loft gallery", coinValue:8  },
  { id:"lft-2", floor:"loft",     emoji:"🍵", name:"Herbal Tea",        imageUrl:"", description:"Hand-blended herbal morning tea",             coinValue:3  },
  { id:"lft-3", floor:"loft",     emoji:"🎵", name:"Vinyl Record",      imageUrl:"", description:"Vintage vinyl from the loft collection",      coinValue:10 },
  { id:"lft-4", floor:"loft",     emoji:"🕯️", name:"Scented Candle",   imageUrl:"", description:"Hand-poured soy wax candle",                  coinValue:6  },
  // Cellar
  { id:"cel-1", floor:"cellar",   emoji:"🍷", name:"Red Wine",          imageUrl:"", description:"Aged red wine from the cellar reserve",       coinValue:10 },
  { id:"cel-2", floor:"cellar",   emoji:"🧀", name:"Cheese Board",      imageUrl:"", description:"Artisan cheese selection",                    coinValue:8  },
  { id:"cel-3", floor:"cellar",   emoji:"🕯️", name:"Cellar Candle",    imageUrl:"", description:"Black wax candle — cellar signature",         coinValue:5  },
  { id:"cel-4", floor:"cellar",   emoji:"🍫", name:"Dark Chocolate",    imageUrl:"", description:"Single origin 85% dark chocolate",            coinValue:4  },
];

// ── Load / Save ────────────────────────────────────────────────────────────────
export function loadGifts(): BreakfastGift[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as BreakfastGift[];
  } catch {}
  return DEFAULT_GIFTS;
}

export function saveGifts(gifts: BreakfastGift[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(gifts)); } catch {}
}

export function getGiftsForFloor(floor: string): BreakfastGift[] {
  return loadGifts().filter(g => g.floor === floor);
}

// ── Random auto-selection (2–3 gifts) for arriving guest ──────────────────────
export function selectArrivalGifts(floor: string, count = 3): BreakfastGift[] {
  const pool = getGiftsForFloor(floor);
  if (pool.length === 0) return [];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ── CRUD helpers for admin ─────────────────────────────────────────────────────
export function addGift(gift: Omit<BreakfastGift, "id">): BreakfastGift {
  const gifts = loadGifts();
  const newGift = { ...gift, id: `gift-${Date.now()}-${Math.random().toString(36).slice(2,7)}` };
  saveGifts([...gifts, newGift]);
  return newGift;
}

export function updateGift(updated: BreakfastGift): void {
  const gifts = loadGifts().map(g => g.id === updated.id ? updated : g);
  saveGifts(gifts);
}

export function deleteGift(id: string): void {
  saveGifts(loadGifts().filter(g => g.id !== id));
}

export function resetToDefaults(): void {
  saveGifts(DEFAULT_GIFTS);
}

// ── Floor meta ────────────────────────────────────────────────────────────────
export const FLOOR_META: Record<string, { label: string; color: string; icon: string }> = {
  standard:  { label: "Standard Room", color: "#a8a8b0", icon: "🛏️"  },
  suite:     { label: "The Suite",     color: "#cd7f32", icon: "🛎️"  },
  kings:     { label: "Kings Room",    color: "#d4af37", icon: "👑"   },
  penthouse: { label: "The Penthouse", color: "#c0c8d8", icon: "🏙️"  },
  loft:      { label: "The Loft",      color: "#8b5cf6", icon: "🎨"  },
  cellar:    { label: "The Cellar",    color: "#c0392b", icon: "🍷"  },
};
