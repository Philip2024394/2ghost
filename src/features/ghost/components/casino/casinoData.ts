// ── Casino floor data — profiles, tables, live feed ──────────────────────────

export interface CasinoProfile {
  id: string;
  seed: number;
  ghostId: string;
  city: string;
  floor: string;
  floorColor: string;
  chips: number;
  streak: number;
  online: boolean;
  status: string;
  gender: "m" | "f";
}

export const CASINO_PROFILES: CasinoProfile[] = [
  { id:"cp1",  seed:2,  ghostId:"Ghost-4821", city:"Dubai",     floor:"Penthouse", floorColor:"#e8e4d0", chips:3200, streak:3, online:true,  status:"On a roll 🔥",         gender:"f" },
  { id:"cp2",  seed:6,  ghostId:"Ghost-7734", city:"Milan",     floor:"Casino",    floorColor:"#d4af37", chips:1850, streak:1, online:true,  status:"Playing…",             gender:"m" },
  { id:"cp3",  seed:11, ghostId:"Ghost-2093", city:"Tokyo",     floor:"Ensuite",   floorColor:"#cd7f32", chips:620,  streak:0, online:true,  status:"Watching",             gender:"f" },
  { id:"cp4",  seed:17, ghostId:"Ghost-9901", city:"Barcelona", floor:"Casino",    floorColor:"#d4af37", chips:4100, streak:5, online:true,  status:"High roller 👑",       gender:"f" },
  { id:"cp5",  seed:24, ghostId:"Ghost-5588", city:"London",    floor:"Standard",  floorColor:"#c0c0c0", chips:340,  streak:0, online:true,  status:"Just joined",          gender:"m" },
  { id:"cp6",  seed:34, ghostId:"Ghost-3312", city:"Paris",     floor:"Penthouse", floorColor:"#e8e4d0", chips:2750, streak:2, online:true,  status:"Playing…",             gender:"f" },
  { id:"cp7",  seed:47, ghostId:"Ghost-8847", city:"Riyadh",    floor:"Casino",    floorColor:"#d4af37", chips:5200, streak:4, online:true,  status:"King of the floor 🎰", gender:"m" },
  { id:"cp8",  seed:53, ghostId:"Ghost-1199", city:"Athens",    floor:"Ensuite",   floorColor:"#cd7f32", chips:980,  streak:1, online:false, status:"Away",                 gender:"f" },
  { id:"cp9",  seed:63, ghostId:"Ghost-6622", city:"New York",  floor:"Casino",    floorColor:"#d4af37", chips:7800, streak:6, online:true,  status:"Unstoppable 🔥🔥",    gender:"m" },
  { id:"cp10", seed:71, ghostId:"Ghost-4490", city:"Beirut",    floor:"Loft",      floorColor:"#a78bfa", chips:1200, streak:0, online:true,  status:"Playing…",             gender:"f" },
  { id:"cp11", seed:82, ghostId:"Ghost-0011", city:"Bogotá",    floor:"Standard",  floorColor:"#c0c0c0", chips:150,  streak:0, online:true,  status:"Learning the game",    gender:"m" },
  { id:"cp12", seed:91, ghostId:"Ghost-7712", city:"Cairo",     floor:"Ensuite",   floorColor:"#cd7f32", chips:1640, streak:2, online:true,  status:"On a streak!",         gender:"f" },
];

export type GameType   = "blackjack" | "slots" | "highlow";
export type StakeLevel = "low" | "medium" | "high" | "vip";

export interface CasinoTable {
  id: string;
  name: string;
  game: GameType;
  stakes: StakeLevel;
  minBet: number;
  maxBet: number;
  seats: number;
  playerIds: string[];
  hot: boolean;
  vipOnly: boolean;
  description: string;
  color: string;
  gradient: string;
}

export const TABLES: CasinoTable[] = [
  {
    id: "bj-royal",  name: "The Royal Table",
    game: "blackjack", stakes: "medium", minBet: 50,  maxBet: 500,
    seats: 5, playerIds: ["cp1","cp4","cp6"],
    hot: true,  vipOnly: false,
    description: "The busiest blackjack table on the floor",
    color: "#4ade80", gradient: "linear-gradient(135deg,#14532d,#22c55e,#4ade80)",
  },
  {
    id: "bj-shadow", name: "The Shadow Table",
    game: "blackjack", stakes: "low",    minBet: 10,  maxBet: 100,
    seats: 5, playerIds: ["cp5","cp11"],
    hot: false, vipOnly: false,
    description: "Low stakes, high welcome. Perfect starting table.",
    color: "#94a3b8", gradient: "linear-gradient(135deg,#334155,#64748b,#94a3b8)",
  },
  {
    id: "bj-vip",    name: "Penthouse Table",
    game: "blackjack", stakes: "vip",    minBet: 500, maxBet: 5000,
    seats: 4, playerIds: ["cp7","cp9"],
    hot: false, vipOnly: true,
    description: "Casino members & Penthouse guests only",
    color: "#e8e4d0", gradient: "linear-gradient(135deg,#8a8070,#c8c0a8,#e8e4d0)",
  },
  {
    id: "slots-ghost", name: "Ghost Slots",
    game: "slots", stakes: "low",   minBet: 10,  maxBet: 100,
    seats: 6, playerIds: ["cp2","cp3","cp10","cp12"],
    hot: true,  vipOnly: false,
    description: "Chase the 👻 jackpot. Progressive prize pool.",
    color: "#d4af37", gradient: "linear-gradient(135deg,#92660a,#d4af37,#f0d060)",
  },
  {
    id: "slots-gold",  name: "Gold Reels",
    game: "slots", stakes: "medium", minBet: 25,  maxBet: 250,
    seats: 6, playerIds: ["cp8"],
    hot: false, vipOnly: false,
    description: "Higher stakes slots. Bigger wins.",
    color: "#f59e0b", gradient: "linear-gradient(135deg,#78350f,#d97706,#fbbf24)",
  },
  {
    id: "hl-quick",    name: "Quick Draw",
    game: "highlow", stakes: "low",  minBet: 10,  maxBet: 100,
    seats: 4, playerIds: ["cp3","cp11"],
    hot: false, vipOnly: false,
    description: "Fast rounds, live odds, streak bonuses.",
    color: "#f87171", gradient: "linear-gradient(135deg,#991b1b,#dc2626,#f87171)",
  },
  {
    id: "hl-high",     name: "High Stakes Deck",
    game: "highlow", stakes: "high", minBet: 100, maxBet: 1000,
    seats: 4, playerIds: ["cp4","cp7","cp9"],
    hot: true,  vipOnly: false,
    description: "High/Low for serious players. Dynamic multipliers.",
    color: "#fb923c", gradient: "linear-gradient(135deg,#7c2d12,#ea580c,#fb923c)",
  },
];

export const LIVE_WIN_FEED = [
  "Ghost-9901 won 🪙7,800 at The Royal Table — Blackjack!",
  "Ghost-4821 hit the 👻 JACKPOT — 🪙32,000 on Ghost Slots!",
  "Ghost-7734 on a ×6 streak at High Stakes Deck 🔥",
  "Ghost-5588 doubled down and won 🪙1,000 — Shadow Table",
  "Ghost-0011 just won their first hand 🎉",
  "Ghost-6622 hit 💎 Diamond on Gold Reels — 🪙3,200",
  "Ghost-3312 sends a drink to Ghost-4821 🍸",
  "Ghost-8847 and Ghost-7712 matched at The Royal Table 💬",
  "Ghost-4490 won 🪙2,400 at Quick Draw — ×8 payout",
];

export const STAKE_META: Record<StakeLevel, { label: string; color: string; bg: string }> = {
  low:    { label: "Low",    color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  medium: { label: "Medium", color: "#4ade80", bg: "rgba(74,222,128,0.15)"  },
  high:   { label: "High",   color: "#f59e0b", bg: "rgba(245,158,11,0.15)"  },
  vip:    { label: "VIP",    color: "#e8e4d0", bg: "rgba(232,228,208,0.15)" },
};

export const GAME_META: Record<GameType, { label: string; icon: string; shortDesc: string }> = {
  blackjack: { label: "Blackjack", icon: "🃏", shortDesc: "Beat the dealer" },
  slots:     { label: "Slots",     icon: "🎰", shortDesc: "Spin the reels"  },
  highlow:   { label: "High/Low",  icon: "🎲", shortDesc: "Higher or lower" },
};

export const DRINK_RESPONSES = [
  "accepted your drink and smiled 😊",
  "raised their glass 🥂",
  "sent a smile back 😏",
  "said thanks and kept playing 🃏",
  "winked back 👀",
];

export const NOTE_RESPONSES = [
  "read your note and smiled",
  "is thinking of a reply…",
  "loved your opener ✨",
];
