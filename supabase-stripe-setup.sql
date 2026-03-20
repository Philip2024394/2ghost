-- ── Add subscription tier to ghost_profiles ──────────────────────────────────
-- Run this in Supabase SQL Editor.

alter table ghost_profiles add column if not exists tier text default 'free';
alter table ghost_profiles add column if not exists tier_expires_at timestamptz;

-- Index for querying active subscribers
create index if not exists ghost_profiles_tier_idx on ghost_profiles (tier);
