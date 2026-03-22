// ── Themed gift sets per room tier ───────────────────────────────────────────
// Each gift has a name (for image creation) and an image field (fill when ready).
// Images should be square PNG/WebP, transparent bg, ~256×256px.

export type RoomGift = {
  key: string;
  name: string;
  label: string;       // short display label
  emoji: string;       // fallback while image is being created
  image: string;       // URL — fill in once user creates the image
  coins: number;
  description: string; // helps user understand what image to create
};

// ── Standard Room — "Everyday Warmth" ────────────────────────────────────────
// Theme: casual, approachable, everyday romance. Silver tones.
export const STANDARD_GIFTS: RoomGift[] = [
  {
    key: "coffee",
    name: "Ghost Coffee",
    label: "Coffee",
    emoji: "☕",
    image: "",
    coins: 5,
    description: "A steaming coffee cup with ghost steam wisps. Silver cup, cozy feel.",
  },
  {
    key: "wildflower",
    name: "Ghost Wildflower",
    label: "Wildflower",
    emoji: "🌸",
    image: "",
    coins: 15,
    description: "A small bouquet of wildflowers tied with a silver ribbon.",
  },
  {
    key: "mixtape",
    name: "Ghost Mixtape",
    label: "Mixtape",
    emoji: "🎵",
    image: "",
    coins: 30,
    description: "A cassette tape with a ghost face label. Old-school romantic.",
  },
  {
    key: "teddy",
    name: "Ghost Teddy",
    label: "Teddy Bear",
    emoji: "🧸",
    image: "",
    coins: 55,
    description: "A small ghost-white teddy bear holding a tiny heart.",
  },
  {
    key: "shooting_star",
    name: "Ghost Star",
    label: "Shooting Star",
    emoji: "⭐",
    image: "",
    coins: 90,
    description: "A glowing silver shooting star with ghost trail.",
  },
];

// ── Suite Room — "Refined Taste" ──────────────────────────────────────────────
// Theme: thoughtful, romantic, a step above. Bronze/warm tones.
export const SUITE_GIFTS: RoomGift[] = [
  {
    key: "prosecco",
    name: "Ghost Prosecco",
    label: "Prosecco",
    emoji: "🥂",
    image: "",
    coins: 5,
    description: "Two clinking prosecco flutes with bronze fizz bubbles.",
  },
  {
    key: "garden_rose",
    name: "Ghost Garden Rose",
    label: "Garden Rose",
    emoji: "🌹",
    image: "",
    coins: 20,
    description: "A single perfect bronze-tipped red rose with a ghost dewdrop.",
  },
  {
    key: "bonbons",
    name: "Ghost Bonbons",
    label: "Bonbons",
    emoji: "🍫",
    image: "",
    coins: 40,
    description: "An open bronze box of premium chocolates with ghost monogram lid.",
  },
  {
    key: "perfume",
    name: "Ghost Perfume",
    label: "Perfume",
    emoji: "💐",
    image: "",
    coins: 65,
    description: "An elegant perfume bottle with a ghost silhouette etched in glass.",
  },
  {
    key: "suite_key",
    name: "Ghost Suite Key",
    label: "Suite Key",
    emoji: "🗝️",
    image: "",
    coins: 110,
    description: "An ornate bronze hotel key with 'Suite' engraved. Premium feel.",
  },
];

// ── Kings Room — "Gold Standard" ─────────────────────────────────────────────
// Theme: luxury, power, confidence. Deep gold tones.
export const KINGS_GIFTS: RoomGift[] = [
  {
    key: "single_malt",
    name: "Ghost Single Malt",
    label: "Single Malt",
    emoji: "🥃",
    image: "",
    coins: 5,
    description: "A crystal whiskey glass with amber liquid and ghost reflection.",
  },
  {
    key: "gold_rose",
    name: "Ghost Gold Rose",
    label: "Gold Rose",
    emoji: "🌹",
    image: "",
    coins: 25,
    description: "A rose with gold-dipped petals, stem wrapped in black ribbon.",
  },
  {
    key: "cigar_box",
    name: "Ghost Cigar Box",
    label: "Cigar Box",
    emoji: "🎁",
    image: "",
    coins: 55,
    description: "A dark mahogany cigar box with gold ghost crest on the lid.",
  },
  {
    key: "gold_watch",
    name: "Ghost Gold Watch",
    label: "Gold Watch",
    emoji: "⌚",
    image: "",
    coins: 95,
    description: "A luxury gold watch face with ghost silhouette at 12 o'clock.",
  },
  {
    key: "kings_crown",
    name: "Ghost Kings Crown",
    label: "Kings Crown",
    emoji: "👑",
    image: "",
    coins: 150,
    description: "A gold crown dripping with jewels and ghost etchings on the band.",
  },
];

// ── Penthouse (main matching) — "The Elite" ───────────────────────────────────
// Theme: ultra-luxury, rare, exclusive. Platinum/dark tones.
export const PENTHOUSE_MAIN_GIFTS: RoomGift[] = [
  {
    key: "dom",
    name: "Ghost Dom Pérignon",
    label: "Dom Pérignon",
    emoji: "🍾",
    image: "",
    coins: 10,
    description: "A dark bottle of Dom Pérignon with ghost label and platinum foil.",
  },
  {
    key: "black_orchid",
    name: "Ghost Black Orchid",
    label: "Black Orchid",
    emoji: "🌺",
    image: "",
    coins: 35,
    description: "A rare black orchid with platinum shimmer on the petals.",
  },
  {
    key: "masquerade",
    name: "Ghost Masquerade",
    label: "Masquerade",
    emoji: "🎭",
    image: "",
    coins: 65,
    description: "A elegant masquerade mask — half ghost white, half platinum black.",
  },
  {
    key: "black_diamond",
    name: "Ghost Black Diamond",
    label: "Black Diamond",
    emoji: "💎",
    image: "",
    coins: 110,
    description: "A faceted black diamond with platinum ghost reflection inside.",
  },
  {
    key: "penthouse_key",
    name: "Ghost Penthouse Key",
    label: "Penthouse Key",
    emoji: "🗝️",
    image: "",
    coins: 180,
    description: "A platinum hotel key card engraved 'Penthouse' with ghost crest.",
  },
];

// ── The Loft — "Warm & Bold" ──────────────────────────────────────────────────
// Theme: LGBTQ+, celebratory, inclusive, golden warmth.
export const LOFT_THEMED_GIFTS: RoomGift[] = [
  {
    key: "cocktail",
    name: "Ghost Cocktail",
    label: "Cocktail",
    emoji: "🍸",
    image: "",
    coins: 0,
    description: "A golden cocktail glass with rainbow liquid and a ghost straw.",
  },
  {
    key: "rainbow_rose",
    name: "Ghost Rainbow Rose",
    label: "Rainbow Rose",
    emoji: "🌹",
    image: "",
    coins: 20,
    description: "A rose with petals blending through rainbow colours on gold stem.",
  },
  {
    key: "violet_heart",
    name: "Ghost Violet",
    label: "Violet Heart",
    emoji: "💜",
    image: "",
    coins: 40,
    description: "A glowing violet heart with a small ghost face inside.",
  },
  {
    key: "loft_glitter",
    name: "Ghost Loft Glitter",
    label: "Loft Glitter",
    emoji: "✨",
    image: "",
    coins: 65,
    description: "An explosion of gold and rainbow glitter forming a ghost shape.",
  },
  {
    key: "pride_crown",
    name: "Ghost Pride Crown",
    label: "Pride Crown",
    emoji: "👑",
    image: "",
    coins: 110,
    description: "A crown with rainbow gems and a gold ghost at the center front.",
  },
];

// ── The Cellar — "Dark & Daring" ──────────────────────────────────────────────
// Theme: adult, bold, seductive. Deep red/crimson.
export const CELLAR_THEMED_GIFTS: RoomGift[] = [
  {
    key: "red_wine",
    name: "Ghost Red Wine",
    label: "Red Wine",
    emoji: "🍷",
    image: "",
    coins: 0,
    description: "A deep red wine glass with a ghost reflected in the dark liquid.",
  },
  {
    key: "red_rose",
    name: "Ghost Red Rose",
    label: "Red Rose",
    emoji: "🌹",
    image: "",
    coins: 20,
    description: "A single blood-red rose with black thorns and crimson ghost mist.",
  },
  {
    key: "flame",
    name: "Ghost Flame",
    label: "Flame",
    emoji: "🔥",
    image: "",
    coins: 40,
    description: "A deep crimson flame with a ghost silhouette dancing inside.",
  },
  {
    key: "red_kiss",
    name: "Ghost Red Kiss",
    label: "Red Kiss",
    emoji: "💋",
    image: "",
    coins: 70,
    description: "A bold red lipstick kiss mark on black paper with ghost watermark.",
  },
  {
    key: "cellar_crown",
    name: "Ghost Cellar Crown",
    label: "Cellar Crown",
    emoji: "👑",
    image: "",
    coins: 120,
    description: "A blood-red crown with dark jewels and ghost skull at the peak.",
  },
];

// ── Helper: get gifts by room tier ───────────────────────────────────────────
export function getGiftsByTier(tier: "standard" | "suite" | "kings" | "penthouse" | null): RoomGift[] {
  switch (tier) {
    case "suite":     return SUITE_GIFTS;
    case "kings":     return KINGS_GIFTS;
    case "penthouse": return PENTHOUSE_MAIN_GIFTS;
    default:          return STANDARD_GIFTS;
  }
}
