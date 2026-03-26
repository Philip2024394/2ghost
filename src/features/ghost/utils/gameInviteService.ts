// ── Game Invite Service ────────────────────────────────────────────────────────
// Handles sending, receiving, and responding to game challenges between guests.
// Format: Best of 3 — first to win 2 rounds wins the match and earns the coins.
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
//   game_type     text not null default 'connect4',  -- connect4 | memory
//   coin_stake    int  not null default 20,
//   status        text not null default 'pending',   -- pending | accepted | declined
//   decline_reason text,
//   created_at    timestamptz not null default now()
// );
// alter table ghost_game_invites enable row level security;
// create policy "allow all" on ghost_game_invites for all using (true) with check (true);
// alter publication supabase_realtime add table ghost_game_invites;
// ─────────────────────────────────

import { ghostSupabase } from "../ghostSupabase";

export type GameType = "connect4" | "memory" | "wordduel";

export type GameInvite = {
  id: string;
  from_ghost_id: string;
  from_name: string;
  from_image: string;
  to_ghost_id: string;
  game_type: GameType;
  coin_stake: number;
  status: "pending" | "accepted" | "declined";
  decline_reason?: string | null;
  created_at: string;
};

export const GAME_LABELS: Record<GameType, string> = {
  connect4:  "Connect 4",
  memory:    "Memory Match",
  wordduel:  "Word Duel",
};

export const GAME_EMOJIS: Record<GameType, string> = {
  connect4:  "🔴",
  memory:    "🃏",
  wordduel:  "🔤",
};

export const STAKE_OPTIONS = [10, 25, 50, 100] as const;

export const DECLINE_REASONS = [
  "I'm busy right now",
  "Not in the mood to play",
  "I don't have enough coins",
  "Maybe another time",
  "I'm already in a game",
];

export async function sendGameInvite(
  fromGhostId: string,
  fromName: string,
  fromImage: string,
  toGhostId: string,
  gameType: GameType = "connect4",
  coinStake: number = 20,
): Promise<string | null> {
  const { data, error } = await ghostSupabase
    .from("ghost_game_invites")
    .insert({
      from_ghost_id: fromGhostId,
      from_name:     fromName,
      from_image:    fromImage,
      to_ghost_id:   toGhostId,
      game_type:     gameType,
      coin_stake:    coinStake,
      status:        "pending",
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

/** Record game play count for a profile in localStorage. */
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
