-- ============================================================
-- 2Ghost — Supabase setup
-- Run this in the Supabase SQL Editor for project czlfqasujfdfumelzjbp
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Tables ───────────────────────────────────────────────────

create table if not exists ghost_profiles (
  ghost_id    text primary key,               -- e.g. "Ghost-4821"
  whatsapp    text,
  display_name text,
  gender      text,
  interest    text,                           -- "Women" | "Men" | "Both"
  verified    boolean default false,
  photo_url   text,
  created_at  timestamptz default now()
);

create table if not exists ghost_room_config (
  ghost_id    text primary key references ghost_profiles(ghost_id) on delete cascade,
  room_code   text unique not null,
  tier        text default 'free',            -- "free" | "basic" | "pro" | "elite"
  expiry      text default 'never',           -- "24h" | "7d" | "never"
  updated_at  timestamptz default now()
);

-- All images and videos stored in Supabase Storage — this table tracks them
create table if not exists ghost_room_media (
  id           uuid primary key default gen_random_uuid(),
  ghost_id     text not null references ghost_profiles(ghost_id) on delete cascade,
  type         text not null check (type in ('image', 'video')),
  storage_path text not null,                 -- path inside the bucket
  public_url   text not null,                 -- full CDN URL
  size_bytes   bigint,
  created_at   timestamptz default now()
);

create table if not exists ghost_room_requests (
  id              uuid primary key default gen_random_uuid(),
  from_ghost_id   text not null,
  to_ghost_id     text not null,
  status          text default 'pending' check (status in ('pending', 'granted', 'denied')),
  created_at      timestamptz default now(),
  unique (from_ghost_id, to_ghost_id)
);

create table if not exists ghost_room_grants (
  id              uuid primary key default gen_random_uuid(),
  owner_ghost_id  text not null references ghost_profiles(ghost_id) on delete cascade,
  grantee_ghost_id text not null,
  room_code       text not null,
  granted_at      timestamptz default now(),
  unique (owner_ghost_id, grantee_ghost_id)
);

create table if not exists ghost_room_inbox (
  id                  uuid primary key default gen_random_uuid(),
  sender_ghost_id     text not null,
  recipient_ghost_id  text not null,
  type                text not null check (type in ('image', 'video')),
  content_url         text not null,
  status              text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at          timestamptz default now()
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists ghost_room_media_ghost_id    on ghost_room_media(ghost_id);
create index if not exists ghost_room_requests_to       on ghost_room_requests(to_ghost_id);
create index if not exists ghost_room_inbox_recipient   on ghost_room_inbox(recipient_ghost_id, status);

-- ── Row Level Security ────────────────────────────────────────
-- Currently disabled — enable and tighten when WhatsApp auth is live.
-- All data is already code-gated at the app layer.
alter table ghost_profiles        disable row level security;
alter table ghost_room_config     disable row level security;
alter table ghost_room_media      disable row level security;
alter table ghost_room_requests   disable row level security;
alter table ghost_room_grants     disable row level security;
alter table ghost_room_inbox      disable row level security;

-- ── Storage buckets ───────────────────────────────────────────
-- Run these in the Supabase Dashboard → Storage → New bucket,
-- OR uncomment and run via SQL if you have storage extension access.

-- Images bucket (max 10 MB per file, public CDN)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ghost-images',
  'ghost-images',
  true,
  10485760,   -- 10 MB
  array['image/jpeg','image/png','image/webp','image/gif','image/heic']
)
on conflict (id) do nothing;

-- Videos bucket (max 500 MB per file, public CDN)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ghost-videos',
  'ghost-videos',
  true,
  524288000,  -- 500 MB
  array['video/mp4','video/webm','video/quicktime','video/x-msvideo','video/mpeg']
)
on conflict (id) do nothing;

-- Allow anon uploads/reads (tighten to auth.uid() when WhatsApp auth is live)
create policy "ghost images public read"
  on storage.objects for select
  using (bucket_id = 'ghost-images');

create policy "ghost images anon upload"
  on storage.objects for insert
  with check (bucket_id = 'ghost-images');

create policy "ghost images anon delete"
  on storage.objects for delete
  using (bucket_id = 'ghost-images');

create policy "ghost videos public read"
  on storage.objects for select
  using (bucket_id = 'ghost-videos');

create policy "ghost videos anon upload"
  on storage.objects for insert
  with check (bucket_id = 'ghost-videos');

create policy "ghost videos anon delete"
  on storage.objects for delete
  using (bucket_id = 'ghost-videos');
