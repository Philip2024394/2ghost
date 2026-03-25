// useMrButlasCountdown — tracks the "submit portrait" deadline for unverified users
import { useState, useEffect } from "react";

export type StaffStage =
  | "guest"    // has a real photo — no action needed
  | "staff"    // no photo, no deadline set yet
  | "warned"   // deadline set, > 12h remaining
  | "urgent"   // < 12h remaining
  | "final"    // < 1h remaining
  | "expired"; // deadline passed — Mr. Butlas sees them off

const DEADLINE_KEY      = "photo_deadline";
const REQUEST_COUNT_KEY = "photo_request_count";

function getOwnPhoto(): string | null {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    return p.photo ?? null;
  } catch { return null; }
}

export function setPortraitDeadline(hours = 24) {
  const deadline = Date.now() + hours * 60 * 60 * 1000;
  try { localStorage.setItem(DEADLINE_KEY, String(deadline)); } catch {}
}

export function incrementRequestCount() {
  try {
    const n = Number(localStorage.getItem(REQUEST_COUNT_KEY) || 0) + 1;
    localStorage.setItem(REQUEST_COUNT_KEY, String(n));
    // First request starts the 24h clock
    if (n === 1 && !localStorage.getItem(DEADLINE_KEY)) setPortraitDeadline(24);
    // Second request shortens to 12h
    if (n === 2) setPortraitDeadline(12);
  } catch {}
}

export function clearStaffDeadline() {
  try {
    localStorage.removeItem(DEADLINE_KEY);
    localStorage.removeItem(REQUEST_COUNT_KEY);
  } catch {}
}

export function useMrButlasCountdown() {
  const [stage,       setStage]       = useState<StaffStage>("guest");
  const [msRemaining, setMsRemaining] = useState<number | null>(null);

  useEffect(() => {
    const photo = getOwnPhoto();
    if (photo) { setStage("guest"); return; }

    const deadline = Number(localStorage.getItem(DEADLINE_KEY) || 0);

    const tick = () => {
      if (!deadline) { setStage("staff"); return; }
      const rem = deadline - Date.now();
      setMsRemaining(rem);
      if      (rem <= 0)                     setStage("expired");
      else if (rem <= 60 * 60 * 1000)        setStage("final");
      else if (rem <= 12 * 60 * 60 * 1000)   setStage("urgent");
      else                                   setStage("warned");
    };

    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);

  return { stage, msRemaining };
}
