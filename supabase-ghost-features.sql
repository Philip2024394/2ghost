-- ============================================================
-- 2Ghost — Feature Tables Migration
-- Run in Supabase SQL Editor. Safe to re-run (idempotent).
-- ============================================================

create extension if not exists "pgcrypto";

-- ── ghost_likes ───────────────────────────────────────────────
create table if not exists ghost_likes (
  id             uuid primary key default gen_random_uuid(),
  from_ghost_id  text not null,
  to_ghost_id    text not null,
  created_at     timestamptz default now(),
  unique(from_ghost_id, to_ghost_id)
);
create index if not exists ghost_likes_from_idx on ghost_likes(from_ghost_id);
create index if not exists ghost_likes_to_idx   on ghost_likes(to_ghost_id);
alter table ghost_likes disable row level security;

-- ── ghost_matches ─────────────────────────────────────────────
create table if not exists ghost_matches (
  id           uuid primary key default gen_random_uuid(),
  ghost_id_1   text not null,
  ghost_id_2   text not null,
  matched_at   timestamptz default now(),
  unique(ghost_id_1, ghost_id_2)
);
create index if not exists ghost_matches_id1_idx on ghost_matches(ghost_id_1);
create index if not exists ghost_matches_id2_idx on ghost_matches(ghost_id_2);
alter table ghost_matches disable row level security;

-- ── ghost_floor_msgs ──────────────────────────────────────────
create table if not exists ghost_floor_msgs (
  id             uuid primary key default gen_random_uuid(),
  floor          text not null,
  sender_id      text not null,
  sender_name    text not null,
  text           text not null default '',
  media_url      text,
  media_type     text check (media_type in ('image','video','audio')),
  is_gift        boolean default false,
  gift_emoji     text,
  gift_name      text,
  gift_coins     int,
  is_directed    boolean default false,
  directed_to    text,
  created_at     timestamptz default now()
);
create index if not exists ghost_floor_msgs_floor_idx      on ghost_floor_msgs(floor, created_at desc);
create index if not exists ghost_floor_msgs_sender_idx     on ghost_floor_msgs(sender_id);
alter table ghost_floor_msgs disable row level security;

-- Enable Realtime for floor messages
alter publication supabase_realtime add table ghost_floor_msgs;

-- ── ghost_vault_msgs ──────────────────────────────────────────
create table if not exists ghost_vault_msgs (
  id           uuid primary key default gen_random_uuid(),
  room_id      text not null,
  sender_id    text not null,
  text         text not null,
  coins_used   int default 2,
  created_at   timestamptz default now()
);
create index if not exists ghost_vault_msgs_room_idx on ghost_vault_msgs(room_id, created_at desc);
alter table ghost_vault_msgs disable row level security;

alter publication supabase_realtime add table ghost_vault_msgs;

-- ── ghost_coins ───────────────────────────────────────────────
create table if not exists ghost_coins (
  ghost_id   text primary key,
  balance    int not null default 100,
  updated_at timestamptz default now()
);
alter table ghost_coins disable row level security;

-- ── ghost_tiers ───────────────────────────────────────────────
create table if not exists ghost_tiers (
  ghost_id     text primary key,
  tier         text not null default 'standard',
  purchased_at timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table ghost_tiers disable row level security;

-- ── ghost_whispers ────────────────────────────────────────────
create table if not exists ghost_whispers (
  id             uuid primary key default gen_random_uuid(),
  from_ghost_id  text not null,
  to_ghost_id    text not null,
  message        text not null,
  will_convert   boolean default false,
  sent_at        timestamptz default now(),
  unique(from_ghost_id, to_ghost_id)
);
alter table ghost_whispers disable row level security;

-- ── ghost_video_intros ────────────────────────────────────────
create table if not exists ghost_video_intros (
  ghost_id    text primary key,
  video_url   text,
  is_private  boolean default true,
  updated_at  timestamptz default now()
);
alter table ghost_video_intros disable row level security;

-- ── ghost_video_requests ──────────────────────────────────────
create table if not exists ghost_video_requests (
  id             uuid primary key default gen_random_uuid(),
  from_ghost_id  text not null,
  to_ghost_id    text not null,
  coins_spent    int default 5,
  status         text default 'pending' check (status in ('pending','approved','denied')),
  requested_at   timestamptz default now(),
  unique(from_ghost_id, to_ghost_id)
);
create index if not exists ghost_video_requests_to_idx on ghost_video_requests(to_ghost_id);
alter table ghost_video_requests disable row level security;

-- ── ghost_scores ──────────────────────────────────────────────
create table if not exists ghost_scores (
  id             uuid primary key default gen_random_uuid(),
  from_ghost_id  text not null,
  to_ghost_id    text not null,
  stars          int not null check (stars between 1 and 5),
  tags           text[] default '{}',
  created_at     timestamptz default now(),
  unique(from_ghost_id, to_ghost_id)
);
create index if not exists ghost_scores_to_idx on ghost_scores(to_ghost_id);
alter table ghost_scores disable row level security;

-- ── ghost_floor_gifts ─────────────────────────────────────────
create table if not exists ghost_floor_gifts (
  id         uuid primary key default gen_random_uuid(),
  ghost_id   text not null,
  floor      text not null,
  iso_week   text not null,
  created_at timestamptz default now()
);
create index if not exists ghost_floor_gifts_week_floor_idx on ghost_floor_gifts(iso_week, floor);
alter table ghost_floor_gifts disable row level security;

-- ── ghost_msg_likes ───────────────────────────────────────────
create table if not exists ghost_msg_likes (
  id         uuid primary key default gen_random_uuid(),
  msg_id     text not null,
  ghost_id   text not null,
  floor      text not null,
  created_at timestamptz default now(),
  unique(msg_id, ghost_id)
);
alter table ghost_msg_likes disable row level security;

-- ── ghost_window_mode ─────────────────────────────────────────
create table if not exists ghost_window_mode (
  ghost_id  text primary key,
  until_ts  bigint not null default 0,
  updated_at timestamptz default now()
);
alter table ghost_window_mode disable row level security;

-- ── DONE ──────────────────────────────────────────────────────
