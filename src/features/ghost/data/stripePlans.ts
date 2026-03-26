/**
 * Stripe Payment Links — set these in your .env file.
 * Create them in Stripe Dashboard → Payment Links.
 * Pass ?client_reference_id=GHOST_ID to each link so you can match payment to user.
 */

export const STRIPE_LINKS = {
  suite:     import.meta.env.VITE_STRIPE_SUITE_LINK     as string | undefined,
  gold:      import.meta.env.VITE_STRIPE_GOLD_LINK      as string | undefined,
  kings:     import.meta.env.VITE_STRIPE_KINGS_LINK     as string | undefined,
  penthouse: import.meta.env.VITE_STRIPE_PENTHOUSE_LINK as string | undefined,
  cellar:    import.meta.env.VITE_STRIPE_CELLAR_LINK    as string | undefined,
  garden:    import.meta.env.VITE_STRIPE_GARDEN_LINK    as string | undefined,
};

export const STRIPE_COIN_LINKS = {
  50:   import.meta.env.VITE_STRIPE_COINS_50_LINK   as string | undefined,
  150:  import.meta.env.VITE_STRIPE_COINS_150_LINK  as string | undefined,
  400:  import.meta.env.VITE_STRIPE_COINS_400_LINK  as string | undefined,
  1000: import.meta.env.VITE_STRIPE_COINS_1000_LINK as string | undefined,
} as const;

/** Build the Stripe coin pack link with ghost_id + first-purchase flag pre-attached */
export function buildCoinLink(
  amount: 50 | 150 | 400 | 1000,
  ghostId: string,
  isFirstPurchase: boolean
): string | null {
  const base = STRIPE_COIN_LINKS[amount];
  if (!base) return null;
  const params = new URLSearchParams({
    client_reference_id: ghostId,
    ...(isFirstPurchase ? { prefilled_promo_code: "" } : {}),
  });
  return `${base}?${params.toString()}`;
}

// ── Local currency pricing display ────────────────────────────────────────────
// Stripe charges in your account's base currency (USD).
// These are approximate local display prices — Stripe auto-converts on checkout.

export interface LocalPrice {
  suite: string;
  gold:  string;
  note:  string; // e.g. "Billed in USD · approx."
}

const CURRENCY_MAP: Record<string, LocalPrice> = {
  // North America
  US: { suite: "$4.99",       gold: "$9.99",       note: "Billed in USD" },
  CA: { suite: "CA$6.99",     gold: "CA$13.99",    note: "Billed in USD · approx." },
  MX: { suite: "$4.99",       gold: "$9.99",        note: "Billed in USD" },

  // Europe
  GB: { suite: "£3.99",       gold: "£7.99",       note: "Billed in GBP · approx." },
  DE: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  FR: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  NL: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  BE: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  ES: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  IT: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  PT: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  SE: { suite: "SEK 49",      gold: "SEK 99",      note: "Billed in USD · approx." },
  NO: { suite: "NOK 54",      gold: "NOK 109",     note: "Billed in USD · approx." },
  DK: { suite: "DKK 34",      gold: "DKK 69",      note: "Billed in USD · approx." },
  FI: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  PL: { suite: "PLN 19",      gold: "PLN 39",      note: "Billed in USD · approx." },
  CZ: { suite: "CZK 114",     gold: "CZK 229",     note: "Billed in USD · approx." },
  AT: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  CH: { suite: "CHF 4.49",    gold: "CHF 8.99",    note: "Billed in CHF · approx." },
  IE: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  GR: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  RO: { suite: "RON 22",      gold: "RON 45",      note: "Billed in USD · approx." },
  HU: { suite: "HUF 1,790",   gold: "HUF 3,590",  note: "Billed in USD · approx." },
  BG: { suite: "BGN 8.79",    gold: "BGN 17.59",   note: "Billed in USD · approx." },
  HR: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  SK: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  SI: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  EE: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  LV: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },
  LT: { suite: "€4.49",       gold: "€8.99",       note: "Billed in EUR · approx." },

  // Eastern Europe / CIS
  RU: { suite: "$4.99",       gold: "$9.99",       note: "Billed in USD" },
  UA: { suite: "$4.99",       gold: "$9.99",       note: "Billed in USD" },
  BY: { suite: "$4.99",       gold: "$9.99",       note: "Billed in USD" },
  KZ: { suite: "$4.99",       gold: "$9.99",       note: "Billed in USD" },

  // Middle East
  AE: { suite: "AED 18",      gold: "AED 36",      note: "Billed in USD · approx." },
  SA: { suite: "SAR 18",      gold: "SAR 37",      note: "Billed in USD · approx." },
  QA: { suite: "QAR 18",      gold: "QAR 36",      note: "Billed in USD · approx." },
  KW: { suite: "KWD 1.5",     gold: "KWD 3.0",     note: "Billed in USD · approx." },
  BH: { suite: "BHD 1.9",     gold: "BHD 3.8",     note: "Billed in USD · approx." },
  OM: { suite: "OMR 1.9",     gold: "OMR 3.8",     note: "Billed in USD · approx." },

  // Oceania
  AU: { suite: "A$7.99",      gold: "A$14.99",     note: "Billed in USD · approx." },
  NZ: { suite: "NZ$8.49",     gold: "NZ$16.99",    note: "Billed in USD · approx." },

  // South / Southeast Asia
  ID: { suite: "Rp 79.000",   gold: "Rp 149.000",  note: "Billed in USD · approx." },
  PH: { suite: "₱279",        gold: "₱549",        note: "Billed in USD · approx." },
  MY: { suite: "RM 22",       gold: "RM 44",       note: "Billed in USD · approx." },
  SG: { suite: "S$6.99",      gold: "S$13.99",     note: "Billed in SGD · approx." },
  TH: { suite: "฿179",        gold: "฿359",        note: "Billed in USD · approx." },
  VN: { suite: "₫119.000",    gold: "₫239.000",    note: "Billed in USD · approx." },
  IN: { suite: "₹399",        gold: "₹799",        note: "Billed in USD · approx." },
  PK: { suite: "$4.99",       gold: "$9.99",       note: "Billed in USD" },
  BD: { suite: "$4.99",       gold: "$9.99",       note: "Billed in USD" },
  LK: { suite: "$4.99",       gold: "$9.99",       note: "Billed in USD" },

  // East Asia
  JP: { suite: "¥749",        gold: "¥1,499",      note: "Billed in USD · approx." },
  KR: { suite: "₩6,500",      gold: "₩12,900",     note: "Billed in USD · approx." },
  TW: { suite: "NT$149",      gold: "NT$299",      note: "Billed in USD · approx." },
  HK: { suite: "HK$39",       gold: "HK$79",       note: "Billed in USD · approx." },

  // Africa
  ZA: { suite: "R89",         gold: "R179",        note: "Billed in USD · approx." },
  NG: { suite: "$4.99",       gold: "$9.99",       note: "Billed in USD" },
  KE: { suite: "KES 649",     gold: "KES 1,299",   note: "Billed in USD · approx." },
  GH: { suite: "$4.99",       gold: "$9.99",       note: "Billed in USD" },

  // Latin America
  BR: { suite: "R$24,90",     gold: "R$49,90",     note: "Billed in USD · approx." },
  AR: { suite: "$4.99",       gold: "$9.99",       note: "Billed in USD" },
  CO: { suite: "COP 19.900",  gold: "COP 39.900",  note: "Billed in USD · approx." },
  CL: { suite: "CLP 4.790",   gold: "CLP 9.590",   note: "Billed in USD · approx." },
  PE: { suite: "S/ 18",       gold: "S/ 36",       note: "Billed in USD · approx." },
};

const DEFAULT_PRICE: LocalPrice = {
  suite: "$4.99",
  gold:  "$9.99",
  note:  "Billed in USD",
};

export function getLocalPrice(countryCode: string): LocalPrice {
  return CURRENCY_MAP[countryCode?.toUpperCase()] ?? DEFAULT_PRICE;
}

/** Build the Stripe payment link URL with ghost_id pre-attached */
export function buildStripeLink(plan: keyof typeof STRIPE_LINKS, ghostId: string): string | null {
  const base = STRIPE_LINKS[plan];
  if (!base) return null;
  return `${base}?client_reference_id=${encodeURIComponent(ghostId)}`;
}
