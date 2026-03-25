import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { translations, Locale, TranslationKey } from "./translations";
import { detectIpCountry, getCachedIpCountry } from "@/shared/hooks/useIpCountry";

interface LanguageContextType {
  locale: Locale;
  t: (key: TranslationKey, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "ghost_locale";

// Country code → app locale (silent, no picker)
const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  ID: "id",
  TH: "th",
  VN: "vi",
  MY: "ms",
  FR: "fr",
  BE: "fr",
  CN: "zh",
  TW: "zh",
  HK: "zh",
  MO: "zh",
  JP: "ja",
  KR: "ko",
  SA: "ar",
  AE: "ar",
  EG: "ar",
  IQ: "ar",
  IN: "hi",
  ES: "es",
  MX: "es",
  CO: "es",
  AR: "es",
  CL: "es",
  DE: "de",
  AT: "de",
  BR: "pt",
  PT: "pt",
  RU: "ru",
  PH: "tl",
  // Everything else (SG, GB, AU, US, IE, NZ, etc.) → "en"
};

function resolveLocale(countryCode: string): Locale {
  return COUNTRY_TO_LOCALE[countryCode.toUpperCase()] ?? "en";
}

function getSavedLocale(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    const valid: string[] = ["en","id","th","vi","ms","fr","zh","ja","ko","ar","hi","es","de","pt","ru","tl"];
    if (valid.includes(v ?? "")) return v as Locale;
  } catch {}
  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => getSavedLocale() ?? "en");

  useEffect(() => {
    // If already saved, honour it
    if (getSavedLocale()) return;

    // Try cached IP detection first (no network hit)
    const cached = getCachedIpCountry();
    if (cached?.countryCode) {
      const resolved = resolveLocale(cached.countryCode);
      setLocale(resolved);
      try { localStorage.setItem(STORAGE_KEY, resolved); } catch {}
      return;
    }

    // Fall back to fresh IP detection
    detectIpCountry().then((result) => {
      if (result?.countryCode) {
        const resolved = resolveLocale(result.countryCode);
        setLocale(resolved);
        try { localStorage.setItem(STORAGE_KEY, resolved); } catch {}
      }
    });
  }, []);

  const t = useCallback((key: TranslationKey, replacements?: Record<string, string>): string => {
    const entry = translations[key] as Record<string, string> | undefined;
    if (!entry) return key as string;
    let text = entry[locale] ?? entry["en"] ?? key as string;
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(`{${k}}`, v);
      }
    }
    return text;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
