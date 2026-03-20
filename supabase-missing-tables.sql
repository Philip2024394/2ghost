-- ── ghost_service_requests ────────────────────────────────────────────────────
-- Written by the app when a user opens WhatsApp to contact a Butler provider.
-- Read by admin Daily Tasks page.

create table if not exists ghost_service_requests (
  id               uuid primary key default gen_random_uuid(),
  ghost_id         text not null,
  provider_id      text,
  provider_name    text,
  provider_whatsapp text,
  category         text,
  emoji            text,
  city             text,
  notes            text,
  status           text not null default 'pending',  -- 'pending' | 'done'
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists ghost_service_requests_ghost_id_idx  on ghost_service_requests (ghost_id);
create index if not exists ghost_service_requests_status_idx    on ghost_service_requests (status);
create index if not exists ghost_service_requests_created_at_idx on ghost_service_requests (created_at desc);

-- RLS: anyone authenticated can insert their own request; admin reads all
alter table ghost_service_requests enable row level security;

create policy "Users can insert own service requests"
  on ghost_service_requests for insert
  with check (true);

create policy "Service requests are readable by all authenticated"
  on ghost_service_requests for select
  using (true);

create policy "Service requests updatable by authenticated"
  on ghost_service_requests for update
  using (true);


-- ── ghost_reports ─────────────────────────────────────────────────────────────
-- Written by the app when a user flags / reports a profile.
-- Read by admin Daily Tasks page.

create table if not exists ghost_reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     text not null,   -- ghost_id of the user who reported
  reported_id     text not null,   -- ghost_id of the profile being reported
  reason          text,
  description     text,
  status          text not null default 'open',  -- 'open' | 'resolved' | 'dismissed'
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists ghost_reports_reported_id_idx  on ghost_reports (reported_id);
create index if not exists ghost_reports_status_idx       on ghost_reports (status);
create index if not exists ghost_reports_created_at_idx   on ghost_reports (created_at desc);

alter table ghost_reports enable row level security;

create policy "Users can insert reports"
  on ghost_reports for insert
  with check (true);

create policy "Reports readable by authenticated"
  on ghost_reports for select
  using (true);

create policy "Reports updatable by authenticated"
  on ghost_reports for update
  using (true);


-- ── ghost_payments: add failure_reason column if missing ─────────────────────

alter table ghost_payments
  add column if not exists failure_reason text;


-- ── ghost_health_checks (optional — used by App Health page) ─────────────────

create table if not exists ghost_health_checks (
  id         text primary key,
  checked_at timestamptz not null default now()
);

alter table ghost_health_checks enable row level security;

create policy "Health checks readable and writable"
  on ghost_health_checks for all
  using (true) with check (true);
