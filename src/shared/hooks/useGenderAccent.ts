import { useMemo } from "react";

export type GenderAccent = {
  /** Main accent  — #4ade80 (M) | #f472b6 (F) */
  accent:    string;
  /** Mid shade   — #22c55e (M) | #ec4899 (F) */
  accentMid: string;
  /** Dark shade  — #16a34a (M) | #db2777 (F) */
  accentDark: string;
  /** Deepest     — #15803d (M) | #be185d (F) */
  accentDeep: string;
  /** rgba(74,222,128,o) or rgba(244,114,182,o) */
  glow: (opacity: number) => string;
  /** rgba(34,197,94,o)  or rgba(236,72,153,o) */
  glowMid: (opacity: number) => string;
  /** Full pill-button gradient */
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
  return {
    accent:         f ? "#f472b6" : "#4ade80",
    accentMid:      f ? "#ec4899" : "#22c55e",
    accentDark:     f ? "#db2777" : "#16a34a",
    accentDeep:     f ? "#be185d" : "#15803d",
    glow:    (o)  => f ? `rgba(244,114,182,${o})` : `rgba(74,222,128,${o})`,
    glowMid: (o)  => f ? `rgba(236,72,153,${o})`  : `rgba(34,197,94,${o})`,
    gradient:       f
      ? "linear-gradient(to bottom, #f472b6 0%, #ec4899 40%, #db2777 100%)"
      : "linear-gradient(to bottom, #4ade80 0%, #22c55e 40%, #16a34a 100%)",
    gradientSubtle: f
      ? "linear-gradient(135deg, rgba(244,114,182,0.15), rgba(236,72,153,0.06))"
      : "linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.06))",
    isFemale: f,
  };
}

export function useGenderAccent(): GenderAccent {
  const gender = getStoredGender();
  return useMemo(() => buildAccent(gender), [gender]);
}
