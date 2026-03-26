-- ============================================================
-- 2Ghost — Supabase Migration  (run in SQL Editor)
-- Only creates/alters what is actually missing.
-- All existing tables & columns are left untouched.
-- NOTE: PostgreSQL does not support IF NOT EXISTS on policies,
--       so we use DO $$ blocks to skip if they already exist.
-- ============================================================


-- ── 1. ghost_admin_messages  (Mr. Butlas DMs + broadcasts) ───────────────────
create table if not exists ghost_admin_messages (
  id          uuid primary key default gen_random_uuid(),
  to_user_id  text,                        -- null = broadcast to ALL users
  message     text not null,
  type        text default 'dm',           -- 'dm' | 'broadcast'
  active      boolean default true,
  created_at  timestamptz default now(),
  expires_at  timestamptz default (now() + interval '48 hours')
);

alter table ghost_admin_messages enable row level security;

do $$ begin
  create policy "Anyone can read active messages"
    on ghost_admin_messages for select
    using (active = true and expires_at > now());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Anyone can insert messages"
    on ghost_admin_messages for insert
    with check (true);
exception when duplicate_object then null; end $$;

-- Enable real-time (instant delivery to all users)
alter publication supabase_realtime add table ghost_admin_messages;


-- ── 2. ghost_coin_transactions  (coin history — already in useCoins hook) ─────
create table if not exists ghost_coin_transactions (
  id          uuid primary key default gen_random_uuid(),
  ghost_id    text not null,
  type        text not null,               -- 'purchase'|'spend'|'win'|'bonus'|'refund'
  amount      integer not null,
  description text,
  ts          bigint,                      -- JS timestamp (ms) from the hook
  created_at  timestamptz default now()
);

alter table ghost_coin_transactions enable row level security;

do $$ begin
  create policy "Anyone can read coin transactions"
    on ghost_coin_transactions for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Anyone can insert coin transactions"
    on ghost_coin_transactions for insert with check (true);
exception when duplicate_object then null; end $$;

create index if not exists idx_coin_txn_ghost_id
  on ghost_coin_transactions (ghost_id, created_at desc);


-- ── 3. ghost_vault_chats  (private 1-on-1 chat rooms) ────────────────────────
create table if not exists ghost_vault_chats (
  id          uuid primary key default gen_random_uuid(),
  user_a_id   text not null,
  user_b_id   text not null,
  created_at  timestamptz default now(),
  last_msg_at timestamptz default now(),
  unique (user_a_id, user_b_id)
);

alter table ghost_vault_chats enable row level security;

do $$ begin
  create policy "Anyone can read vault chats"
    on ghost_vault_chats for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Anyone can create vault chat"
    on ghost_vault_chats for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Anyone can update vault chat"
    on ghost_vault_chats for update using (true);
exception when duplicate_object then null; end $$;


-- ── 4. ghost_vault_messages  (individual vault chat messages) ────────────────
create table if not exists ghost_vault_messages (
  id          uuid primary key default gen_random_uuid(),
  chat_id     uuid references ghost_vault_chats(id) on delete cascade,
  sender_id   text not null,
  text        text,
  media_url   text,
  media_type  text,                        -- 'image' | 'video'
  is_gift     boolean default false,
  gift_emoji  text,
  coin_cost   integer default 0,
  is_system   boolean default false,
  created_at  timestamptz default now()
);

alter table ghost_vault_messages enable row level security;

do $$ begin
  create policy "Anyone can read vault messages"
    on ghost_vault_messages for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Anyone can insert vault messages"
    on ghost_vault_messages for insert with check (true);
exception when duplicate_object then null; end $$;

alter publication supabase_realtime add table ghost_vault_messages;

create index if not exists idx_vault_msg_chat_id
  on ghost_vault_messages (chat_id, created_at asc);


-- ── 5. Add missing columns to ghost_profiles  (safe — skips if already exist) ─
alter table ghost_profiles
  add column if not exists joined_at           timestamptz default now(),
  add column if not exists profile_setup_done  boolean default false,
  add column if not exists languages           text[] default '{}',
  add column if not exists looking_for         text,
  add column if not exists contact_pref        text default 'connect',
  add column if not exists invited_by          text;


-- ── 6. ghost_admin_overview  (live stats for admin dashboard) ────────────────
-- ghost_profiles uses ghost_id (not id), display_name (not name)
create or replace view ghost_admin_overview as
select
  count(*)                                                               as total_users,
  count(*) filter (where house_tier in ('suite','kings','penthouse'))    as premium_users,
  count(*) filter (where house_tier = 'kings')                          as gold_users,
  count(*) filter (where house_tier = 'suite')                          as suite_users,
  count(*) filter (where created_at >= date_trunc('month', now()))      as new_this_month,
  count(*) filter (where last_seen_at >= now() - interval '24 hours')   as active_today,
  count(distinct country)                                                as active_countries
from ghost_profiles
where is_blocked = false or is_blocked is null;


-- ── 7. Enable real-time on ghost_floor_msgs  (floor chat) ────────────────────
alter publication supabase_realtime add table ghost_floor_msgs;


-- ── 8. ghost_date_invites  (date idea invitations between guests) ─────────────
create table if not exists ghost_date_invites (
  id                    uuid primary key default gen_random_uuid(),
  from_guest_id         text not null,
  from_name             text,
  from_age              integer,
  from_city             text,
  from_flag             text,
  from_image            text,
  to_guest_id           text not null,
  post_id               text,
  post_title            text,
  post_image            text,
  post_location         text,
  status                text default 'pending',   -- pending | accepted | declined | revealed
  accepted_contact_pref text,                     -- chat | video | outside
  accepted_contact_value text,                    -- the actual contact value
  contact_unlocked      boolean default false,
  created_at            timestamptz default now()
);

alter table ghost_date_invites enable row level security;

do $$ begin
  create policy "Anyone can read date invites"
    on ghost_date_invites for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Anyone can insert date invites"
    on ghost_date_invites for insert with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Anyone can update date invites"
    on ghost_date_invites for update using (true);
exception when duplicate_object then null; end $$;

alter publication supabase_realtime add table ghost_date_invites;

create index if not exists idx_date_invites_to
  on ghost_date_invites (to_guest_id, status, created_at desc);
create index if not exists idx_date_invites_from
  on ghost_date_invites (from_guest_id, status, created_at desc);


-- ── Done ─────────────────────────────────────────────────────────────────────
-- After running, confirm in:
--   Supabase → Database → Replication → supabase_realtime
-- Tables that should be listed: ghost_admin_messages, ghost_vault_messages, ghost_floor_msgs
