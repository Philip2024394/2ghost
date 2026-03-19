// ─────────────────────────────────────────────────────────────────
// Connect platform system
//
// ONE phone number unlocks 6 apps (WhatsApp, iMessage, Signal,
// Viber, Zalo, SMS). Users share their number once — their match
// picks which app to use from what they have installed.
//
// Username-based apps (WeChat, Telegram, Instagram, Line,
// Messenger, KakaoTalk) can be added as an optional second option.
// ─────────────────────────────────────────────────────────────────

export type PhoneApp = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  getLink: (phone: string) => string;
};

export type UsernamePlatform = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  reach: string;
  placeholder: string;
  getLink: ((handle: string) => string) | null;
};

// Apps that work from a phone number — shown as buttons on the match screen
export const PHONE_APPS: PhoneApp[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    emoji: "💬",
    color: "#25D366",
    getLink: (p) => `https://wa.me/${p.replace(/\D/g, "")}`,
  },
  {
    key: "imessage",
    label: "iMessage",
    emoji: "💙",
    color: "#147EFB",
    getLink: (p) => `sms:${p}`,
  },
  {
    key: "signal",
    label: "Signal",
    emoji: "🔵",
    color: "#3A76F0",
    getLink: (p) => `https://signal.me/#p/${p.replace(/\D/g, "")}`,
  },
  {
    key: "viber",
    label: "Viber",
    emoji: "💜",
    color: "#7360F2",
    getLink: (p) => `viber://chat?number=${p.replace(/\D/g, "")}`,
  },
  {
    key: "zalo",
    label: "Zalo",
    emoji: "🔵",
    color: "#0068FF",
    getLink: (p) => `https://zalo.me/${p.replace(/\D/g, "")}`,
  },
  {
    key: "sms",
    label: "SMS",
    emoji: "📱",
    color: "#34c759",
    getLink: (p) => `sms:${p}`,
  },
];

// Apps that need a separate username/ID — optional second contact
export const USERNAME_PLATFORMS: UsernamePlatform[] = [
  {
    key: "telegram",
    label: "Telegram",
    emoji: "✈️",
    color: "#2AABEE",
    reach: "900M users",
    placeholder: "@username",
    getLink: (h) => `https://t.me/${h.replace("@", "")}`,
  },
  {
    key: "wechat",
    label: "WeChat",
    emoji: "🟢",
    color: "#07C160",
    reach: "1.3B users",
    placeholder: "WeChat ID",
    getLink: null, // copy only — no universal deep link
  },
  {
    key: "instagram",
    label: "Instagram DM",
    emoji: "📸",
    color: "#E1306C",
    reach: "2B users",
    placeholder: "@username",
    getLink: (h) => `https://ig.me/m/${h.replace("@", "")}`,
  },
  {
    key: "line",
    label: "Line",
    emoji: "💚",
    color: "#00C300",
    reach: "200M users",
    placeholder: "Line ID",
    getLink: (h) => `line://ti/p/${h}`,
  },
  {
    key: "messenger",
    label: "Messenger",
    emoji: "🫧",
    color: "#0084FF",
    reach: "1B users",
    placeholder: "username",
    getLink: (h) => `https://m.me/${h}`,
  },
  {
    key: "kakao",
    label: "KakaoTalk",
    emoji: "💛",
    color: "#FEE500",
    reach: "55M Korea",
    placeholder: "KakaoTalk ID",
    getLink: null,
  },
];

export function getPhoneApp(key: string): PhoneApp {
  return PHONE_APPS.find((a) => a.key === key) ?? PHONE_APPS[0];
}

export function getUsernamePlatform(key: string): UsernamePlatform | undefined {
  return USERNAME_PLATFORMS.find((p) => p.key === key);
}

// Legacy compatibility — used by older parts of the code
export function getPlatform(key: string) {
  const phone = PHONE_APPS.find((a) => a.key === key);
  if (phone) return { ...phone, reach: "", inputType: "phone" as const, placeholder: "+xx xxx xxx xxxx" };
  const uname = USERNAME_PLATFORMS.find((p) => p.key === key);
  if (uname) return { ...uname, inputType: "username" as const };
  return { key: "whatsapp", label: "WhatsApp", emoji: "💬", color: "#25D366", reach: "2.7B users", inputType: "phone" as const, placeholder: "+62 8xx xxxx xxxx", getLink: (h: string) => `https://wa.me/${h.replace(/\D/g, "")}` };
}

export function getConnectLink(platformKey: string, handle: string): string | null {
  const p = getPlatform(platformKey);
  if (!p.getLink || !handle.trim()) return null;
  return p.getLink(handle.trim());
}
