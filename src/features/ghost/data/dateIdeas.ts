/**
 * Shared date ideas data — used across GhostCard, GhostSetupPage, GhostDashboardPage, GhostMatchPopup
 */
export type DateIdea = {
  key: string;
  emoji: string;
  label: string;
  desc: string;
  image?: string; // optional ImageKit URL
};

export const DATE_IDEAS: DateIdea[] = [
  { key: "home_movie",       emoji: "🍕", label: "Home Movie With Pizza",      desc: "Cosy night in, good film, great pizza",     image: "https://ik.imagekit.io/7grri5v7d/pizza%20night.png" },
  { key: "night_market",     emoji: "🏮", label: "Night Market Explore",        desc: "Street food, good energy, local vibes",     image: "https://ik.imagekit.io/7grri5v7d/strehdjd.png" },
  { key: "rice_field",       emoji: "🌾", label: "Rice Field Evening Meal",     desc: "Open air, scenic setting, calm atmosphere", image: "https://ik.imagekit.io/7grri5v7d/strehdjdew.png" },
  { key: "bike_tour",        emoji: "🚴", label: "Bike Tour Of The Landscape",  desc: "Fresh air, explore together, good vibes",   image: "https://ik.imagekit.io/7grri5v7d/strehdjdewwee.png" },
  { key: "rooftop",          emoji: "🌆", label: "Rooftop Drinks And Meal",     desc: "City views, cocktails, golden hour",        image: "https://ik.imagekit.io/7grri5v7d/strehdjdewweeds.png" },
  { key: "dance_club",       emoji: "💃", label: "Dance Club Late Night",       desc: "Music, energy, unforgettable night",        image: "https://ik.imagekit.io/7grri5v7d/strehdjdewweedsds.png" },
  { key: "sushi",            emoji: "🍣", label: "Sushi Meal Evening",          desc: "Good food, clean vibes, easy conversation", image: "https://ik.imagekit.io/7grri5v7d/strehdjdewweedsdsEE.png" },
  { key: "mountain_sunset",  emoji: "🌄", label: "Sunset Rise Mountain View",   desc: "Golden light, fresh air, stunning views",   image: "https://ik.imagekit.io/7grri5v7d/strehdjdewweedsdsEESSSS.png" },
  { key: "beach_kite",       emoji: "🪁", label: "Beach Kite Flying",           desc: "Sun, wind, barefoot fun on the shore",      image: "https://ik.imagekit.io/7grri5v7d/strehdjdewweedsdsEESSSSSSUY.png" },
  { key: "french_restaurant",emoji: "🍷", label: "French Restaurant",           desc: "Candlelit dinner, good wine, pure class" },
  { key: "beach_walk",       emoji: "🏖️", label: "Beach Shore Walk",            desc: "Sunset stroll, barefoot vibes" },
  { key: "cinema_night",     emoji: "🎬", label: "Cinema Night",                desc: "Pick a film, share popcorn" },
  { key: "coffee_date",      emoji: "☕", label: "Coffee & Cake",               desc: "Slow morning, easy conversation" },
  { key: "picnic",           emoji: "🌿", label: "Picnic in the Park",          desc: "Blanket, snacks, fresh air" },
  { key: "live_music",       emoji: "🎶", label: "Live Music Night",            desc: "Jazz bar, concert, or rooftop" },
  { key: "city_explore",     emoji: "🚶", label: "City Explore",                desc: "Walk, discover, see where it leads" },
  { key: "bowling",          emoji: "🎳", label: "Bowling Night",               desc: "Playful, competitive, fun" },
  { key: "boat_trip",        emoji: "⛵", label: "Boat Trip",                   desc: "Open water, coastal adventure",     image: "https://ik.imagekit.io/7grri5v7d/ewrqwerqwer.png" },
];

/** Deterministic fallback using seeded hash of profile ID */
export function getDateIdea(profileId: string, key?: string | null): DateIdea {
  if (key) {
    const found = DATE_IDEAS.find((d) => d.key === key);
    if (found) return found;
  }
  let h = 0;
  for (let i = 0; i < profileId.length; i++) h = Math.imul(31, h) + profileId.charCodeAt(i) | 0;
  return DATE_IDEAS[Math.abs(h) % DATE_IDEAS.length];
}
