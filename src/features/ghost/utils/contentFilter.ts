// ── Ghost Content Filter ──────────────────────────────────────────────────────
// Protects the icebreaker question from phone numbers, links, social handles,
// and any attempt to bypass the pay-per-connect model before a match is unlocked.

export type FilterResult = {
  blocked: boolean;
  reason?: string;
};

// Every pattern that could be used to share contact info outside the platform
const BLOCKED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [

  // ── Phone numbers ──────────────────────────────────────────────────────────
  // 4+ consecutive digits (covers local numbers like 08123456789)
  { pattern: /\b\d{4,}\b/,                          reason: "phone number" },
  // International prefix + digits (+62, +1, etc.)
  { pattern: /\+\d{1,4}[\s\-]?\d{2,}/,             reason: "phone number" },
  // Digit-separator-digit-separator patterns (08-123-456 / 08 123 456)
  { pattern: /\d[\s\-\.]\d[\s\-\.]\d[\s\-\.]\d/,  reason: "phone number" },
  // Spelled-out number sequences (zero eight one two …)
  { pattern: /\b(zero|one|two|three|four|five|six|seven|eight|nine)[\s\-]+(zero|one|two|three|four|five|six|seven|eight|nine)[\s\-]+(zero|one|two|three|four|five|six|seven|eight|nine)/i, reason: "phone number" },

  // ── URLs and websites ──────────────────────────────────────────────────────
  { pattern: /https?:\/\//i,                        reason: "website link" },
  { pattern: /www\./i,                              reason: "website link" },
  // Common domain extensions
  { pattern: /\.(com|net|org|co|id|ph|sg|my|vn|io|app|me|ly|gg|info|biz|link|site|web|online)\b/i, reason: "website link" },

  // ── Social media handles ───────────────────────────────────────────────────
  { pattern: /@[a-zA-Z0-9_\.]{2,}/,                reason: "social media handle" },

  // ── Email addresses ────────────────────────────────────────────────────────
  { pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/, reason: "email address" },

  // ── Messaging & social app names ───────────────────────────────────────────
  { pattern: /\b(whatsapp|whats\s*app|wa\.me|wapp)\b/i,            reason: "external app reference" },
  { pattern: /\b(telegram|tele\s*gram|t\.me)\b/i,                  reason: "external app reference" },
  { pattern: /\b(wechat|we\s*chat|weixin)\b/i,                     reason: "external app reference" },
  { pattern: /\b(instagram|insta\s*gram|insta)\b/i,                reason: "external app reference" },
  { pattern: /\b(snapchat|snap\s*chat|snap)\b/i,                   reason: "external app reference" },
  { pattern: /\b(signal|viber|line\s*app|kakaotalk|kakao)\b/i,    reason: "external app reference" },
  { pattern: /\b(facebook|fb\.com|tiktok|twitter|x\.com)\b/i,     reason: "external app reference" },

  // ── Contact solicitation phrases ───────────────────────────────────────────
  { pattern: /\b(dm\s+me|text\s+me|call\s+me|message\s+me|contact\s+me|reach\s+me|find\s+me|add\s+me|hit\s+me\s+up|msg\s+me)\b/i, reason: "contact solicitation" },

  // ── Obfuscation tricks ─────────────────────────────────────────────────────
  // Leetspeak digit substitution mixed in strings like "my num is 0813-xxx"
  { pattern: /\b(num|numb|number|nomor|no\.?)\b/i, reason: "contact solicitation" },
  // Encouraging to move off platform
  { pattern: /\b(off\s*platform|outside\s*app|another\s*app|other\s*app)\b/i, reason: "contact solicitation" },
];

export function filterContent(text: string): FilterResult {
  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { blocked: true, reason };
    }
  }
  return { blocked: false };
}

// ── Strike system ─────────────────────────────────────────────────────────────

const STRIKE_KEY        = "ghost_policy_strikes";
const DEACTIVATED_KEY   = "ghost_account_deactivated";
const MAX_STRIKES       = 2;

export function getStrikes(): number {
  try { return Number(localStorage.getItem(STRIKE_KEY) || "0"); } catch { return 0; }
}

/** Adds a strike. Returns the new total. */
export function addStrike(): number {
  const next = Math.min(getStrikes() + 1, MAX_STRIKES);
  try { localStorage.setItem(STRIKE_KEY, String(next)); } catch {}
  if (next >= MAX_STRIKES) deactivateAccount();
  return next;
}

export function isAccountDeactivated(): boolean {
  try { return localStorage.getItem(DEACTIVATED_KEY) === "1"; } catch { return false; }
}

export function deactivateAccount(): void {
  try { localStorage.setItem(DEACTIVATED_KEY, "1"); } catch {}
}

/** Called when user pays the reinstatement fee — resets everything. */
export function reinstateAccount(): void {
  try {
    localStorage.removeItem(DEACTIVATED_KEY);
    localStorage.removeItem(STRIKE_KEY);
  } catch {}
}
