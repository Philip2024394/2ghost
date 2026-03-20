export type ProfileBadge = {
  key: string;
  label: string;
  emoji: string;
  category: "availability" | "intention" | "vibe" | "preference";
};

export const PROFILE_BADGES: ProfileBadge[] = [
  // Availability
  { key: "free_tonight",    label: "Free Tonight",       emoji: "🌙", category: "availability" },
  { key: "free_weekend",    label: "Free This Weekend",  emoji: "📅", category: "availability" },
  { key: "available_now",   label: "Available Now",      emoji: "🟢", category: "availability" },
  { key: "night_owl",       label: "Night Owl",          emoji: "🦉", category: "availability" },

  // Intention — serious
  { key: "marriage_minded", label: "Marriage Minded",    emoji: "💍", category: "intention" },
  { key: "soulmate",        label: "My Soulmate",        emoji: "🌹", category: "intention" },
  { key: "here_for_love",   label: "Here For Love",      emoji: "❤️", category: "intention" },
  { key: "date_me_first",   label: "Date Me First",      emoji: "🍃", category: "intention" },
  { key: "friends_first",   label: "Friends First",      emoji: "🤝", category: "intention" },
  { key: "serious_only",    label: "Serious Only",       emoji: "🎯", category: "intention" },
  { key: "second_chance",   label: "Second Chance",      emoji: "🌱", category: "intention" },

  // Vibe — casual & fun
  { key: "lets_hang",       label: "Let's Hang",         emoji: "😎", category: "vibe" },
  { key: "good_vibes",      label: "Good Vibes Only",    emoji: "✨", category: "vibe" },
  { key: "fun_first",       label: "Fun First",          emoji: "🎉", category: "vibe" },
  { key: "no_strings",      label: "No Strings",         emoji: "🕊️", category: "vibe" },
  { key: "just_vibes",      label: "Just Vibes",         emoji: "🌊", category: "vibe" },
  { key: "flirt_mode",      label: "Flirt Mode",         emoji: "💋", category: "vibe" },
  { key: "wild_heart",      label: "Wild Heart",         emoji: "🔥", category: "vibe" },
  { key: "spontaneous",     label: "Spontaneous",        emoji: "⚡", category: "vibe" },
  { key: "discreet",        label: "Discreet Please",    emoji: "🤫", category: "vibe" },

  // Preference
  { key: "older_man",       label: "Older Man Only",     emoji: "🎩", category: "preference" },
  { key: "foreign_partner", label: "Foreign Partner",    emoji: "🌍", category: "preference" },
  { key: "local_only",      label: "Local Match Only",   emoji: "📍", category: "preference" },
  { key: "long_distance",   label: "Long Distance OK",   emoji: "✈️", category: "preference" },
  { key: "expat_life",      label: "Expat Life",         emoji: "🗺️", category: "preference" },
  { key: "travel_together", label: "Travel Together",    emoji: "🧳", category: "preference" },
  { key: "new_here",        label: "New Here",           emoji: "👋", category: "preference" },
];

export const BADGE_CATEGORIES = [
  { key: "availability", label: "Availability" },
  { key: "intention",    label: "Intentions" },
  { key: "vibe",         label: "Vibe & Fun" },
  { key: "preference",   label: "My Preference" },
] as const;

export function getBadge(key: string | null | undefined): ProfileBadge | null {
  if (!key) return null;
  return PROFILE_BADGES.find((b) => b.key === key) ?? null;
}
