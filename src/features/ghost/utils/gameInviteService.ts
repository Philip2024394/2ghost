// ── Game Invite Service ────────────────────────────────────────────────────────
// Handles sending, receiving, and responding to Connect 4 game invites.
// Backed by Supabase realtime on the ghost_game_invites table.
//
// SQL to run in Supabase dashboard:
// ─────────────────────────────────
// create table ghost_game_invites (
//   id            uuid primary key default gen_random_uuid(),
//   from_ghost_id text not null,
//   from_name     text not null,
//   from_image    text not null default '',
//   to_ghost_id   text not null,
//   game_type     text not null default 'connect4',
//   status        text not null default 'pending',  -- pending | accepted | declined
//   decline_reason text,
//   created_at    timestamptz not null default now()
// );
// alter table ghost_game_invites enable row level security;
// create policy "allow all" on ghost_game_invites for all using (true) with check (true);
// ─────────────────────────────────

import { ghostSupabase } from "../ghostSupabase";

export type GameInvite = {
  id: string;
  from_ghost_id: string;
  from_name: string;
  from_image: string;
  to_ghost_id: string;
  game_type: "connect4";
  status: "pending" | "accepted" | "declined";
  decline_reason?: string | null;
  created_at: string;
};

export const DECLINE_REASONS = [
  "I'm busy right now",
  "Not in the mood to play",
  "I don't play Connect 4",
  "Maybe another time",
  "I'm already in a game",
];

export async function sendGameInvite(
  fromGhostId: string,
  fromName: string,
  fromImage: string,
  toGhostId: string,
): Promise<string | null> {
  const { data, error } = await ghostSupabase
    .from("ghost_game_invites")
    .insert({
      from_ghost_id: fromGhostId,
      from_name: fromName,
      from_image: fromImage,
      to_ghost_id: toGhostId,
      game_type: "connect4",
      status: "pending",
    })
    .select("id")
    .single();

  if (error) { console.error("[gameInvite] send failed:", error.message); return null; }
  return data?.id ?? null;
}

export async function respondToInvite(
  inviteId: string,
  status: "accepted" | "declined",
  reason?: string,
): Promise<void> {
  const { error } = await ghostSupabase
    .from("ghost_game_invites")
    .update({ status, decline_reason: reason ?? null })
    .eq("id", inviteId);

  if (error) console.error("[gameInvite] respond failed:", error.message);
}

/** Subscribe to incoming pending invites for myGhostId. Returns unsubscribe fn. */
export function subscribeToGameInvites(
  myGhostId: string,
  onInvite: (invite: GameInvite) => void,
): () => void {
  const channel = ghostSupabase
    .channel(`game_invites_${myGhostId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ghost_game_invites",
        filter: `to_ghost_id=eq.${myGhostId}`,
      },
      (payload) => {
        const row = payload.new as GameInvite;
        if (row.status === "pending") onInvite(row);
      },
    )
    .subscribe();

  return () => { ghostSupabase.removeChannel(channel); };
}

/** Record game play count for a profile in localStorage (used for profile section). */
export function recordGamePlayed(profileId: string): void {
  try {
    const key = "ghost_games_played";
    const stored: Record<string, number> = JSON.parse(localStorage.getItem(key) ?? "{}");
    stored[profileId] = (stored[profileId] ?? 0) + 1;
    localStorage.setItem(key, JSON.stringify(stored));
  } catch {}
}

export function getGamesPlayed(profileId: string): number {
  try {
    const stored: Record<string, number> = JSON.parse(localStorage.getItem("ghost_games_played") ?? "{}");
    return stored[profileId] ?? 0;
  } catch { return 0; }
}
