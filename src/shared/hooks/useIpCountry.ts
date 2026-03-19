// Detect user's country from IP address using ipapi.co (free, no API key needed)
// Result cached in localStorage for 24h so we don't hit the API on every page load

export type IpCountryResult = {
  countryCode: string;   // "PH", "TH", "ID", etc.
  countryName: string;   // "Philippines", "Thailand", etc.
  city: string;
  callingCode: string;   // "+63", "+66", etc.
};

// Country → preferred connect platform (used to suggest in Setup)
export const COUNTRY_PLATFORM_DEFAULTS: Record<string, string> = {
  ID: "whatsapp",   // Indonesia — WhatsApp dominant
  PH: "viber",      // Philippines — Viber + Messenger
  TH: "line",       // Thailand — Line dominant
  SG: "whatsapp",   // Singapore — WhatsApp / Telegram
  MY: "whatsapp",   // Malaysia — WhatsApp
  VN: "zalo",       // Vietnam — Zalo dominant
  CN: "wechat",     // China — WeChat
  KR: "kakao",      // Korea — KakaoTalk
  JP: "line",       // Japan — Line
  AU: "imessage",   // Australia — iMessage / WhatsApp
  GB: "whatsapp",   // UK — WhatsApp
  US: "imessage",   // US — iMessage / SMS
  IN: "whatsapp",   // India — WhatsApp
  NG: "whatsapp",   // Nigeria — WhatsApp
};

// Country → phone prefix
export const COUNTRY_PHONE_PREFIX: Record<string, string> = {
  ID: "+62", PH: "+63", TH: "+66", SG: "+65", MY: "+60", VN: "+84",
  AU: "+61", GB: "+44", US: "+1",  IN: "+91", NG: "+234", JP: "+81",
  KR: "+82", CN: "+86",
};

// SEA proximity order — used to sort profiles. Lower = show first.
const SEA_PROXIMITY: Record<string, Record<string, number>> = {
  ID: { ID: 0, MY: 1, SG: 1, PH: 2, TH: 2, VN: 3 },
  PH: { PH: 0, SG: 1, MY: 2, ID: 2, VN: 2, TH: 3 },
  TH: { TH: 0, MY: 1, SG: 1, VN: 2, ID: 2, PH: 3 },
  SG: { SG: 0, MY: 0, ID: 1, TH: 1, PH: 1, VN: 2 },
  MY: { MY: 0, SG: 0, ID: 1, TH: 1, VN: 2, PH: 2 },
  VN: { VN: 0, TH: 1, PH: 1, SG: 2, MY: 2, ID: 3 },
};

const CACHE_KEY = "ghost_ip_country";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function getCountryProximity(userCountryCode: string, profileCountryCode: string): number {
  const map = SEA_PROXIMITY[userCountryCode];
  if (!map) return 10;
  return map[profileCountryCode] ?? 5;
}

export async function detectIpCountry(): Promise<IpCountryResult | null> {
  // Check cache first
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, savedAt } = JSON.parse(cached);
      if (Date.now() - savedAt < CACHE_TTL) return data;
    }
  } catch {}

  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const json = await res.json();
    const result: IpCountryResult = {
      countryCode: json.country_code ?? "",
      countryName: json.country_name ?? "",
      city: json.city ?? "",
      callingCode: json.country_calling_code ?? "",
    };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, savedAt: Date.now() }));
    } catch {}
    return result;
  } catch {
    return null;
  }
}

export function getCachedIpCountry(): IpCountryResult | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, savedAt } = JSON.parse(cached);
    if (Date.now() - savedAt < CACHE_TTL) return data;
    return null;
  } catch { return null; }
}
