import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { translations, Locale, TranslationKey } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, replacements?: Record<string, string>) => string;
  toggleLocale: () => void;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "2dateme-locale";

async function detectCountryByIP(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return data.country_code || null;
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "id" || saved === "en") return saved;
    return "id"; // default: Indonesian (second: English)
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setInitialized(true);
      return;
    }
    // Auto-detect by IP; if not Indonesia, still default to Indonesian (id)
    detectCountryByIP().then((countryCode) => {
      if (countryCode === "ID") {
        setLocaleState("id");
        localStorage.setItem(STORAGE_KEY, "id");
      } else {
        // Default to Indonesian; user can switch to EN via header
        setLocaleState("id");
        localStorage.setItem(STORAGE_KEY, "id");
      }
      setInitialized(true);
    });
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "id" : "en");
  }, [locale, setLocale]);

  const t = useCallback((key: TranslationKey, replacements?: Record<string, string>): string => {
    const entry = translations[key];
    if (!entry) return key as string;
    let text: string = entry[locale] || entry.id || entry.en;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, toggleLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
