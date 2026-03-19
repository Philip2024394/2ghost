import { useState, useCallback } from "react";

const GHOST_KEY = "ghost_mode_until";
const GHOST_PLAN_KEY = "ghost_mode_plan"; // "ghost" | "bundle"

export type GhostPlan = "ghost" | "bundle" | null;

function isAdminSession(): boolean {
  try {
    const s = localStorage.getItem("supabase.auth.token");
    if (!s) return false;
    return JSON.parse(s)?.user?.id === "admin-12345";
  } catch {
    return false;
  }
}

function readExpiry(): number {
  try {
    return parseInt(localStorage.getItem(GHOST_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

export function useGhostMode() {
  const [until, setUntil] = useState<number>(() => readExpiry());

  const isGhost = isAdminSession() || until > Date.now();

  const plan: GhostPlan = (() => {
    try {
      return (localStorage.getItem(GHOST_PLAN_KEY) as GhostPlan) || null;
    } catch {
      return null;
    }
  })();

  const activate = useCallback((planType: "ghost" | "bundle" = "ghost") => {
    // 30 days from now
    const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(GHOST_KEY, String(expiry));
      localStorage.setItem(GHOST_PLAN_KEY, planType);
    } catch {}
    setUntil(expiry);
  }, []);

  const deactivate = useCallback(() => {
    try {
      localStorage.removeItem(GHOST_KEY);
      localStorage.removeItem(GHOST_PLAN_KEY);
    } catch {}
    setUntil(0);
  }, []);

  return { isGhost, plan, activate, deactivate };
}
