// useMrButlasCountdown — 36h portrait deadline starts automatically for users without a photo
import { useState, useEffect } from "react";

export type StaffStage =
  | "guest"    // has a real photo — no action needed
  | "warned"   // deadline set, > 12h remaining
  | "urgent"   // < 12h remaining
  | "final"    // < 1h remaining
  | "expired"; // deadline passed — Mr. Butlas sees them off

const DEADLINE_KEY = "photo_deadline";

function getOwnPhoto(): string | null {
  try {
    const p = JSON.parse(localStorage.getItem("ghost_profile") || "{}");
    return p.photo ?? null;
  } catch { return null; }
}

export function setPortraitDeadline(hours = 36) {
  const deadline = Date.now() + hours * 60 * 60 * 1000;
  try { localStorage.setItem(DEADLINE_KEY, String(deadline)); } catch {}
}

export function clearStaffDeadline() {
  try { localStorage.removeItem(DEADLINE_KEY); } catch {}
}

export function fmtCountdown(ms: number): string {
  if (ms <= 0) return "0h 0m";
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function useMrButlasCountdown() {
  const [stage,       setStage]       = useState<StaffStage>("guest");
  const [msRemaining, setMsRemaining] = useState<number | null>(null);

  useEffect(() => {
    const photo = getOwnPhoto();
    if (photo) { setStage("guest"); return; }

    // Auto-start 36h clock on first load if not already set
    if (!localStorage.getItem(DEADLINE_KEY)) setPortraitDeadline(36);

    const deadline = Number(localStorage.getItem(DEADLINE_KEY) || 0);

    const tick = () => {
      const rem = deadline - Date.now();
      setMsRemaining(rem);
      if      (rem <= 0)                     setStage("expired");
      else if (rem <= 60 * 60 * 1000)        setStage("final");
      else if (rem <= 12 * 60 * 60 * 1000)   setStage("urgent");
      else                                   setStage("warned");
    };

    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);

  return { stage, msRemaining };
}
