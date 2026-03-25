// ── Mr. Butlas Staff Nudge Service ────────────────────────────────────────────
// Handles nudge + portrait-request notifications via Supabase realtime.
// localStorage is used as cache; Supabase is the source of truth for multi-device.

import { ghostSupabase } from "../ghostSupabase";

export type NudgeType = "nudge" | "portrait_request";

export type StaffNudge = {
  id: string;
  from_ghost_id: string | null;
  to_ghost_id: string;
  type: NudgeType;
  sent_at: string;
  read_at: string | null;
};

const LS_NUDGES_KEY = "staff_nudges_received";

function getMyGhostId(): string {
  try { return JSON.parse(localStorage.getItem("ghost_profile") || "{}").ghost_id ?? ""; } catch { return ""; }
}

// ── Send a nudge / portrait request ──────────────────────────────────────────

export async function sendStaffNudge(toGhostId: string, type: NudgeType = "nudge"): Promise<void> {
  const fromId = getMyGhostId();
  // Optimistic local store so sender sees it immediately
  try {
    const existing = JSON.parse(localStorage.getItem(LS_NUDGES_KEY) || "[]");
    existing.unshift({ id: `local-${Date.now()}`, from_ghost_id: fromId, to_ghost_id: toGhostId, type, sent_at: new Date().toISOString(), read_at: null });
    localStorage.setItem(LS_NUDGES_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch {}

  // Persist to Supabase so target user receives it on any device
  try {
    await ghostSupabase.from("ghost_staff_nudges").insert({
      from_ghost_id: fromId || null,
      to_ghost_id:   toGhostId,
      type,
    });
  } catch {}
}

// ── Load unread nudges for the current user ───────────────────────────────────

export async function getMyUnreadNudges(): Promise<StaffNudge[]> {
  const myId = getMyGhostId();
  if (!myId) return [];
  try {
    const { data } = await ghostSupabase
      .from("ghost_staff_nudges")
      .select("*")
      .eq("to_ghost_id", myId)
      .is("read_at", null)
      .order("sent_at", { ascending: false })
      .limit(20);
    if (data) {
      // Cache locally
      try { localStorage.setItem(LS_NUDGES_KEY, JSON.stringify(data)); } catch {}
      return data as StaffNudge[];
    }
  } catch {}
  // Fallback to localStorage cache
  try { return JSON.parse(localStorage.getItem(LS_NUDGES_KEY) || "[]"); } catch { return []; }
}

// ── Mark all nudges as read ───────────────────────────────────────────────────

export async function markNudgesRead(): Promise<void> {
  const myId = getMyGhostId();
  if (!myId) return;
  try { localStorage.removeItem(LS_NUDGES_KEY); } catch {}
  try {
    await ghostSupabase
      .from("ghost_staff_nudges")
      .update({ read_at: new Date().toISOString() })
      .eq("to_ghost_id", myId)
      .is("read_at", null);
  } catch {}
}

// ── Subscribe to incoming nudges in realtime ──────────────────────────────────

export function subscribeToNudges(myGhostId: string, onNudge: (nudge: StaffNudge) => void) {
  const channel = ghostSupabase
    .channel(`staff_nudges_${myGhostId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "ghost_staff_nudges", filter: `to_ghost_id=eq.${myGhostId}` },
      (payload) => onNudge(payload.new as StaffNudge)
    )
    .subscribe();
  return () => { ghostSupabase.removeChannel(channel); };
}
