-- ============================================================
-- 2Ghost — MASTER SUPABASE SETUP
-- Paste this entire file into Supabase SQL Editor and click Run.
-- Safe to re-run — every statement is idempotent.
-- ============================================================


-- ── 0. Extensions ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";


-- ══════════════════════════════════════════════════════════════════════════════
-- PART 1 — CORE APP TABLES
-- ══════════════════════════════════════════════════════════════════════════════

-- ── ghost_profiles ────────────────────────────────────────────────────────────

create table if not exists ghost_profiles (
  ghost_id        text primary key,
  whatsapp        text,
  display_name    text,
  gender          text,
  interest        text,
  verified        boolean default false,
  photo_url       text,
  age             int,
  city            text,
  country         text,
  country_flag    text,
  country_code    text,
  bio             text,
  first_date_idea text,
  religion        text,
  looking_for     text,
  connect_phone   text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Idempotent migrations for existing installs
alter table ghost_profiles add column if not exists age             int;
alter table ghost_profiles add column if not exists city            text;
alter table ghost_profiles add column if not exists country         text;
alter table ghost_profiles add column if not exists country_flag    text;
alter table ghost_profiles add column if not exists country_code    text;
alter table ghost_profiles add column if not exists bio             text;
alter table ghost_profiles add column if not exists first_date_idea text;
alter table ghost_profiles add column if not exists religion        text;
alter table ghost_profiles add column if not exists looking_for     text;
alter table ghost_profiles add column if not exists connect_phone   text;
alter table ghost_profiles add column if not exists updated_at      timestamptz default now();

alter table ghost_profiles disable row level security;


-- ── ghost_room_config ─────────────────────────────────────────────────────────

create table if not exists ghost_room_config (
  ghost_id   text primary key references ghost_profiles(ghost_id) on delete cascade,
  room_code  text unique not null,
  tier       text default 'free',
  expiry     text default 'never',
  updated_at timestamptz default now()
);

alter table ghost_room_config disable row level security;


-- ── ghost_room_media ──────────────────────────────────────────────────────────

create table if not exists ghost_room_media (
  id           uuid primary key default gen_random_uuid(),
  ghost_id     text not null references ghost_profiles(ghost_id) on delete cascade,
  type         text not null check (type in ('image', 'video')),
  storage_path text not null,
  public_url   text not null,
  size_bytes   bigint,
  created_at   timestamptz default now()
);

create index if not exists ghost_room_media_ghost_id on ghost_room_media(ghost_id);

alter table ghost_room_media disable row level security;


-- ── ghost_room_requests ───────────────────────────────────────────────────────

create table if not exists ghost_room_requests (
  id            uuid primary key default gen_random_uuid(),
  from_ghost_id text not null,
  to_ghost_id   text not null,
  status        text default 'pending' check (status in ('pending', 'granted', 'denied')),
  created_at    timestamptz default now(),
  unique (from_ghost_id, to_ghost_id)
);

create index if not exists ghost_room_requests_to on ghost_room_requests(to_ghost_id);

alter table ghost_room_requests disable row level security;


-- ── ghost_room_grants ─────────────────────────────────────────────────────────

create table if not exists ghost_room_grants (
  id               uuid primary key default gen_random_uuid(),
  owner_ghost_id   text not null references ghost_profiles(ghost_id) on delete cascade,
  grantee_ghost_id text not null,
  room_code        text not null,
  granted_at       timestamptz default now(),
  unique (owner_ghost_id, grantee_ghost_id)
);

alter table ghost_room_grants disable row level security;


-- ── ghost_room_inbox ──────────────────────────────────────────────────────────

create table if not exists ghost_room_inbox (
  id                 uuid primary key default gen_random_uuid(),
  sender_ghost_id    text not null,
  recipient_ghost_id text not null,
  type               text not null check (type in ('image', 'video')),
  content_url        text not null,
  status             text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at         timestamptz default now()
);

create index if not exists ghost_room_inbox_recipient on ghost_room_inbox(recipient_ghost_id, status);

alter table ghost_room_inbox disable row level security;


-- ── Storage buckets ───────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ghost-images', 'ghost-images', true, 10485760,
  array['image/jpeg','image/png','image/webp','image/gif','image/heic']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ghost-videos', 'ghost-videos', true, 524288000,
  array['video/mp4','video/webm','video/quicktime','video/x-msvideo','video/mpeg']
)
on conflict (id) do nothing;

-- Storage policies (create only if they don't exist)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'ghost images public read') then
    create policy "ghost images public read"  on storage.objects for select using (bucket_id = 'ghost-images');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'ghost images anon upload') then
    create policy "ghost images anon upload" on storage.objects for insert with check (bucket_id = 'ghost-images');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'ghost images anon delete') then
    create policy "ghost images anon delete" on storage.objects for delete using (bucket_id = 'ghost-images');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'ghost videos public read') then
    create policy "ghost videos public read"  on storage.objects for select using (bucket_id = 'ghost-videos');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'ghost videos anon upload') then
    create policy "ghost videos anon upload" on storage.objects for insert with check (bucket_id = 'ghost-videos');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'ghost videos anon delete') then
    create policy "ghost videos anon delete" on storage.objects for delete using (bucket_id = 'ghost-videos');
  end if;
end $$;


-- ══════════════════════════════════════════════════════════════════════════════
-- PART 2 — ADMIN / OPERATIONAL TABLES
-- ══════════════════════════════════════════════════════════════════════════════

-- ── ghost_payments ────────────────────────────────────────────────────────────
-- Core table (created if missing), plus idempotent column additions.

create table if not exists ghost_payments (
  id             uuid primary key default gen_random_uuid(),
  ghost_id       text not null,
  amount         numeric,
  currency       text default 'IDR',
  status         text not null default 'pending',  -- 'pending' | 'success' | 'failed'
  package        text,
  provider       text,
  failure_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table ghost_payments add column if not exists failure_reason text;

create index if not exists ghost_payments_ghost_id_idx  on ghost_payments (ghost_id);
create index if not exists ghost_payments_status_idx    on ghost_payments (status);
create index if not exists ghost_payments_created_at_idx on ghost_payments (created_at desc);

alter table ghost_payments enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'ghost_payments' and policyname = 'Payments insert') then
    create policy "Payments insert" on ghost_payments for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_payments' and policyname = 'Payments select') then
    create policy "Payments select" on ghost_payments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_payments' and policyname = 'Payments update') then
    create policy "Payments update" on ghost_payments for update using (true);
  end if;
end $$;


-- ── ghost_service_requests ────────────────────────────────────────────────────
-- Written when a user taps WhatsApp on a Butler provider.

create table if not exists ghost_service_requests (
  id                uuid primary key default gen_random_uuid(),
  ghost_id          text not null,
  provider_id       text,
  provider_name     text,
  provider_whatsapp text,
  category          text,
  emoji             text,
  city              text,
  notes             text,
  status            text not null default 'pending',  -- 'pending' | 'done'
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists ghost_service_requests_ghost_id_idx   on ghost_service_requests (ghost_id);
create index if not exists ghost_service_requests_status_idx     on ghost_service_requests (status);
create index if not exists ghost_service_requests_created_at_idx on ghost_service_requests (created_at desc);

alter table ghost_service_requests enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'ghost_service_requests' and policyname = 'Service requests insert') then
    create policy "Service requests insert" on ghost_service_requests for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_service_requests' and policyname = 'Service requests select') then
    create policy "Service requests select" on ghost_service_requests for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_service_requests' and policyname = 'Service requests update') then
    create policy "Service requests update" on ghost_service_requests for update using (true);
  end if;
end $$;


-- ── ghost_reports ─────────────────────────────────────────────────────────────
-- Written when a user flags / reports a profile.

create table if not exists ghost_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id text not null,
  reported_id text not null,
  reason      text,
  description text,
  status      text not null default 'open',  -- 'open' | 'resolved' | 'dismissed'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ghost_reports_reported_id_idx on ghost_reports (reported_id);
create index if not exists ghost_reports_status_idx      on ghost_reports (status);
create index if not exists ghost_reports_created_at_idx  on ghost_reports (created_at desc);

alter table ghost_reports enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'ghost_reports' and policyname = 'Reports insert') then
    create policy "Reports insert" on ghost_reports for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_reports' and policyname = 'Reports select') then
    create policy "Reports select" on ghost_reports for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_reports' and policyname = 'Reports update') then
    create policy "Reports update" on ghost_reports for update using (true);
  end if;
end $$;


-- ── ghost_health_checks ───────────────────────────────────────────────────────
-- Used by the App Health page to test DB write latency.

create table if not exists ghost_health_checks (
  id         text primary key,
  checked_at timestamptz not null default now()
);

alter table ghost_health_checks enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'ghost_health_checks' and policyname = 'Health checks all') then
    create policy "Health checks all" on ghost_health_checks for all using (true) with check (true);
  end if;
end $$;


-- ── ghost_butler_providers ────────────────────────────────────────────────────
-- Butler service provider directory managed from admin.

create table if not exists ghost_butler_providers (
  id          text primary key,
  name        text not null,
  category    text not null,
  whatsapp    text not null,
  city        text not null,
  description text,
  emoji       text,
  is_verified boolean default false,
  is_active   boolean default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ghost_butler_providers_city_idx      on ghost_butler_providers (city);
create index if not exists ghost_butler_providers_category_idx  on ghost_butler_providers (category);
create index if not exists ghost_butler_providers_is_active_idx on ghost_butler_providers (is_active);

alter table ghost_butler_providers enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'ghost_butler_providers' and policyname = 'Butler providers select') then
    create policy "Butler providers select" on ghost_butler_providers for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_butler_providers' and policyname = 'Butler providers insert') then
    create policy "Butler providers insert" on ghost_butler_providers for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_butler_providers' and policyname = 'Butler providers update') then
    create policy "Butler providers update" on ghost_butler_providers for update using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_butler_providers' and policyname = 'Butler providers delete') then
    create policy "Butler providers delete" on ghost_butler_providers for delete using (true);
  end if;
end $$;


-- ── ghost_mock_overrides ──────────────────────────────────────────────────────
-- Admin overrides for mock profile fields shown in the Browse feed.

create table if not exists ghost_mock_overrides (
  ghost_id   text primary key,
  overrides  jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table ghost_mock_overrides enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'ghost_mock_overrides' and policyname = 'Mock overrides all') then
    create policy "Mock overrides all" on ghost_mock_overrides for all using (true) with check (true);
  end if;
end $$;


-- ══════════════════════════════════════════════════════════════════════════════
-- PART 3 — TRAFFIC ANALYTICS TABLES
-- ══════════════════════════════════════════════════════════════════════════════

-- ── ghost_analytics_sessions ──────────────────────────────────────────────────
-- One row per browser session. Created on first page view.

create table if not exists ghost_analytics_sessions (
  id            text primary key,
  ghost_id      text,
  country       text,
  country_code  text,
  country_flag  text,
  city          text,
  ip            text,
  timezone      text,
  device        text,
  browser       text,
  referrer      text,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  page_count    int not null default 0,
  duration_secs int
);

create index if not exists ghost_analytics_sessions_started_at_idx   on ghost_analytics_sessions (started_at desc);
create index if not exists ghost_analytics_sessions_country_code_idx on ghost_analytics_sessions (country_code);
create index if not exists ghost_analytics_sessions_ghost_id_idx     on ghost_analytics_sessions (ghost_id);

alter table ghost_analytics_sessions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'ghost_analytics_sessions' and policyname = 'Analytics sessions insert') then
    create policy "Analytics sessions insert" on ghost_analytics_sessions for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_analytics_sessions' and policyname = 'Analytics sessions select') then
    create policy "Analytics sessions select" on ghost_analytics_sessions for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_analytics_sessions' and policyname = 'Analytics sessions update') then
    create policy "Analytics sessions update" on ghost_analytics_sessions for update using (true);
  end if;
end $$;


-- ── ghost_analytics_pageviews ─────────────────────────────────────────────────
-- One row per page load. exited_at + duration_secs filled on navigate-away.

create table if not exists ghost_analytics_pageviews (
  id            uuid primary key default gen_random_uuid(),
  session_id    text not null references ghost_analytics_sessions(id) on delete cascade,
  path          text not null,
  page_label    text,
  entered_at    timestamptz not null default now(),
  exited_at     timestamptz,
  duration_secs int
);

create index if not exists ghost_analytics_pageviews_session_id_idx on ghost_analytics_pageviews (session_id);
create index if not exists ghost_analytics_pageviews_path_idx       on ghost_analytics_pageviews (path);
create index if not exists ghost_analytics_pageviews_entered_at_idx on ghost_analytics_pageviews (entered_at desc);

alter table ghost_analytics_pageviews enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'ghost_analytics_pageviews' and policyname = 'Analytics pageviews insert') then
    create policy "Analytics pageviews insert" on ghost_analytics_pageviews for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_analytics_pageviews' and policyname = 'Analytics pageviews select') then
    create policy "Analytics pageviews select" on ghost_analytics_pageviews for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'ghost_analytics_pageviews' and policyname = 'Analytics pageviews update') then
    create policy "Analytics pageviews update" on ghost_analytics_pageviews for update using (true);
  end if;
end $$;


-- ── increment_session_pages RPC ───────────────────────────────────────────────
-- Called after each new page view row is inserted to bump the session counter.

create or replace function increment_session_pages(sid text)
returns void language sql security definer as $$
  update ghost_analytics_sessions
  set page_count = page_count + 1
  where id = sid;
$$;


-- ══════════════════════════════════════════════════════════════════════════════
-- DONE ✓
-- All tables, indexes, RLS policies, and functions are now in place.
-- ══════════════════════════════════════════════════════════════════════════════
