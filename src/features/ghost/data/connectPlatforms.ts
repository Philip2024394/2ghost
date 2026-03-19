export type ConnectPlatform = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  reach: string;
  inputType: "phone" | "username" | "id";
  placeholder: string;
  getLink: ((handle: string) => string) | null;
};

export const CONNECT_PLATFORMS: ConnectPlatform[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    emoji: "💬",
    color: "#25D366",
    reach: "2.7B users",
    inputType: "phone",
    placeholder: "+62 8xx xxxx xxxx",
    getLink: (h) => `https://wa.me/${h.replace(/\D/g, "")}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    emoji: "✈️",
    color: "#2AABEE",
    reach: "900M users",
    inputType: "username",
    placeholder: "@username",
    getLink: (h) => `https://t.me/${h.replace("@", "")}`,
  },
  {
    key: "wechat",
    label: "WeChat",
    emoji: "🟢",
    color: "#07C160",
    reach: "1.3B users",
    inputType: "id",
    placeholder: "WeChat ID",
    getLink: null, // copy ID only
  },
  {
    key: "imessage",
    label: "iMessage",
    emoji: "💙",
    color: "#147EFB",
    reach: "900M iPhones",
    inputType: "phone",
    placeholder: "+1 xxx xxx xxxx",
    getLink: (h) => `sms:${h}`,
  },
  {
    key: "instagram",
    label: "Instagram DM",
    emoji: "📸",
    color: "#E1306C",
    reach: "2B users",
    inputType: "username",
    placeholder: "@username",
    getLink: (h) => `https://ig.me/m/${h.replace("@", "")}`,
  },
  {
    key: "line",
    label: "Line",
    emoji: "💚",
    color: "#00C300",
    reach: "200M users",
    inputType: "id",
    placeholder: "Line ID",
    getLink: (h) => `line://ti/p/${h}`,
  },
  {
    key: "signal",
    label: "Signal",
    emoji: "🔵",
    color: "#3A76F0",
    reach: "100M users",
    inputType: "phone",
    placeholder: "+xx xxx xxx xxxx",
    getLink: (h) => `https://signal.me/#p/${h.replace(/\D/g, "")}`,
  },
  {
    key: "viber",
    label: "Viber",
    emoji: "💜",
    color: "#7360F2",
    reach: "250M users",
    inputType: "phone",
    placeholder: "+xx xxx xxx xxxx",
    getLink: (h) => `viber://chat?number=${h.replace(/\D/g, "")}`,
  },
  {
    key: "messenger",
    label: "Messenger",
    emoji: "🫧",
    color: "#0084FF",
    reach: "1B users",
    inputType: "username",
    placeholder: "username",
    getLink: (h) => `https://m.me/${h}`,
  },
  {
    key: "kakao",
    label: "KakaoTalk",
    emoji: "💛",
    color: "#FEE500",
    reach: "55M Korea",
    inputType: "id",
    placeholder: "KakaoTalk ID",
    getLink: null,
  },
  {
    key: "zalo",
    label: "Zalo",
    emoji: "🔵",
    color: "#0068FF",
    reach: "75M Vietnam",
    inputType: "phone",
    placeholder: "+84 xxx xxx xxxx",
    getLink: (h) => `https://zalo.me/${h.replace(/\D/g, "")}`,
  },
  {
    key: "phone",
    label: "Phone / SMS",
    emoji: "📞",
    color: "#34c759",
    reach: "Universal",
    inputType: "phone",
    placeholder: "+xx xxx xxx xxxx",
    getLink: (h) => `sms:${h}`,
  },
];

export function getPlatform(key: string): ConnectPlatform {
  return CONNECT_PLATFORMS.find((p) => p.key === key) ?? CONNECT_PLATFORMS[0];
}

export function getConnectLink(platformKey: string, handle: string): string | null {
  const p = getPlatform(platformKey);
  if (!p.getLink || !handle.trim()) return null;
  return p.getLink(handle.trim());
}
