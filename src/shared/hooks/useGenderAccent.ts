import { useMemo } from "react";

export type GenderAccent = {
  /** Main accent  — #d4af37 hotel gold */
  accent:    string;
  /** Mid shade   — #c9a227 active gold */
  accentMid: string;
  /** Dark shade  — #a8892f deep bronze */
  accentDark: string;
  /** Deepest     — #8a6f1e shadow gold */
  accentDeep: string;
  /** rgba(212,175,55,o) gold glow */
  glow: (opacity: number) => string;
  /** rgba(180,148,35,o) mid gold glow */
  glowMid: (opacity: number) => string;
  /** Full pill-button gradient — champagne → gold → bronze */
  gradient: string;
  /** 135deg subtle card bg */
  gradientSubtle: string;
  isFemale: boolean;
};

export function getStoredGender(): "Female" | "Male" {
  try {
    return (localStorage.getItem("ghost_gender") as "Female" | "Male") || "Male";
  } catch {
    return "Male";
  }
}

export function buildAccent(gender: "Female" | "Male"): GenderAccent {
  const f = gender === "Female";
  // ── Unified hotel gold palette ─────────────────────────────────────────────
  // #d4af37 — hotel gold              (main accent, text, borders)
  // #c9a227 — active gold             (active / hover states)
  // #a8892f — deep bronze             (pressed states, dark borders)
  // #8a6f1e — shadow gold             (deepest tones)
  // #f0d060 — bright champagne        (gradient tops, shimmer)
  return {
    accent:         "#d4af37",
    accentMid:      "#c9a227",
    accentDark:     "#a8892f",
    accentDeep:     "#8a6f1e",
    glow:    (o)  => `rgba(212,175,55,${o})`,
    glowMid: (o)  => `rgba(180,148,35,${o})`,
    gradient:       "linear-gradient(135deg, #92400e, #d4af37, #f0d060)",
    gradientSubtle: "linear-gradient(135deg, rgba(212,175,55,0.14), rgba(180,148,35,0.05))",
    isFemale: f,
  };
}

export function useGenderAccent(): GenderAccent {
  const gender = getStoredGender();
  return useMemo(() => buildAccent(gender), [gender]);
}
