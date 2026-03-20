-- ── ghost_analytics_sessions ──────────────────────────────────────────────────
-- One row per browser tab / session. Created on first page view.

create table if not exists ghost_analytics_sessions (
  id            text primary key,               -- crypto.randomUUID() from client
  ghost_id      text,                           -- null = anonymous visitor
  country       text,
  country_code  text,
  country_flag  text,
  city          text,
  ip            text,
  timezone      text,
  device        text,                           -- 'mobile' | 'tablet' | 'desktop'
  browser       text,
  referrer      text,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz,
  page_count    int not null default 0,
  duration_secs int
);

create index if not exists ghost_analytics_sessions_started_at_idx on ghost_analytics_sessions (started_at desc);
create index if not exists ghost_analytics_sessions_country_code_idx on ghost_analytics_sessions (country_code);
create index if not exists ghost_analytics_sessions_ghost_id_idx on ghost_analytics_sessions (ghost_id);

alter table ghost_analytics_sessions enable row level security;

create policy "Analytics sessions insert"
  on ghost_analytics_sessions for insert
  with check (true);

create policy "Analytics sessions select"
  on ghost_analytics_sessions for select
  using (true);

create policy "Analytics sessions update"
  on ghost_analytics_sessions for update
  using (true);


-- ── ghost_analytics_pageviews ──────────────────────────────────────────────────
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

create policy "Analytics pageviews insert"
  on ghost_analytics_pageviews for insert
  with check (true);

create policy "Analytics pageviews select"
  on ghost_analytics_pageviews for select
  using (true);

create policy "Analytics pageviews update"
  on ghost_analytics_pageviews for update
  using (true);


-- ── increment_session_pages RPC ────────────────────────────────────────────────
-- Called after each new page view row is inserted.

create or replace function increment_session_pages(sid text)
returns void language sql security definer as $$
  update ghost_analytics_sessions
  set page_count = page_count + 1
  where id = sid;
$$;
