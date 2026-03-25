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
  // ── Unified app red palette ────────────────────────────────────────────────
  // #e01010 — signature red           (main accent, text, borders)
  // #c00000 — mid red                 (active / hover states)
  // #900000 — deep red                (pressed states, dark borders)
  // #600000 — shadow red              (deepest tones)
  // #ff3b3b — bright red highlight    (gradient tops, shimmer)
  return {
    accent:         "#e01010",
    accentMid:      "#c00000",
    accentDark:     "#900000",
    accentDeep:     "#600000",
    glow:    (o)  => `rgba(220,20,20,${o})`,
    glowMid: (o)  => `rgba(180,0,0,${o})`,
    gradient:       "linear-gradient(to bottom, #ff3b3b 0%, #e01010 40%, #b80000 100%)",
    gradientSubtle: "linear-gradient(135deg, rgba(220,20,20,0.14), rgba(180,0,0,0.05))",
    isFemale: f,
  };
}

export function useGenderAccent(): GenderAccent {
  const gender = getStoredGender();
  return useMemo(() => buildAccent(gender), [gender]);
}
