-- ═══════════════════════════════════════════════════════════════════
-- 2Ghost Hotel — Complete Database Schema
-- Run in: Supabase Dashboard → SQL Editor → paste all → Run
-- Project: zpjwedxwhdzdcigfhqbu
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Ghost Profiles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_profiles (
  id                  uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id            text NOT NULL UNIQUE,
  display_name        text,
  age                 int,
  gender              text,
  city                text,
  country             text,
  country_flag        text,
  bio                 text,
  photo_url           text,
  interests           text[],
  religion            text,
  connect_phone       text,
  connect_alt         text,
  connect_alt_handle  text,
  is_verified         boolean DEFAULT false,
  face_verified       boolean DEFAULT false,
  is_blocked          boolean DEFAULT false,
  latitude            float,
  longitude           float,
  last_seen_at        timestamptz DEFAULT now(),
  tier                text DEFAULT 'standard',
  contact_pref        text DEFAULT 'connect',
  updated_at          timestamptz DEFAULT now(),
  created_at          timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ghost_profiles_ghost_id ON ghost_profiles(ghost_id);
CREATE INDEX IF NOT EXISTS idx_ghost_profiles_last_seen ON ghost_profiles(last_seen_at DESC);

-- ── Ghost Coins ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_coins (
  id                  uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id            text NOT NULL UNIQUE,
  balance             int NOT NULL DEFAULT 0,
  first_purchase_done boolean DEFAULT false,
  updated_at          timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ghost_coins_ghost_id ON ghost_coins(ghost_id);

-- ── Ghost Tiers ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_tiers (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id   text NOT NULL UNIQUE,
  tier       text NOT NULL DEFAULT 'standard',
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ghost_tiers_ghost_id ON ghost_tiers(ghost_id);

-- ── Ghost Likes ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_likes (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_id    text NOT NULL,
  to_id      text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(from_id, to_id)
);
CREATE INDEX IF NOT EXISTS idx_ghost_likes_from ON ghost_likes(from_id);
CREATE INDEX IF NOT EXISTS idx_ghost_likes_to   ON ghost_likes(to_id);

-- ── Ghost Matches ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_matches (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_a     text NOT NULL,
  user_b     text NOT NULL,
  matched_at timestamptz DEFAULT now(),
  UNIQUE(user_a, user_b)
);
CREATE INDEX IF NOT EXISTS idx_ghost_matches_a ON ghost_matches(user_a);
CREATE INDEX IF NOT EXISTS idx_ghost_matches_b ON ghost_matches(user_b);

-- ── Floor Chat Messages ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_floor_msgs (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  floor       text NOT NULL,
  sender_id   text NOT NULL,
  sender_name text NOT NULL,
  text        text NOT NULL DEFAULT '',
  media_url   text,
  media_type  text CHECK (media_type IN ('image','video','audio')),
  is_gift     boolean DEFAULT false,
  gift_emoji  text,
  gift_name   text,
  gift_coins  int,
  is_directed boolean DEFAULT false,
  directed_to text,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_floor_msgs_floor ON ghost_floor_msgs(floor, created_at DESC);

-- ── Vault Private Chat ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_vault_msgs (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id    text NOT NULL,
  sender_id  text NOT NULL,
  text       text NOT NULL,
  coins_used int DEFAULT 2,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vault_msgs_room ON ghost_vault_msgs(room_id, created_at DESC);

-- ── Whispers ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_whispers (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_ghost_id   text NOT NULL,
  to_ghost_id     text NOT NULL,
  message         text NOT NULL,
  will_convert    boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(from_ghost_id, to_ghost_id)
);

-- ── Video Intros ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_video_intros (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id   text NOT NULL UNIQUE,
  video_url  text NOT NULL,
  is_private boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- ── Video Requests ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_video_requests (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_ghost_id   text NOT NULL,
  to_ghost_id     text NOT NULL,
  coins_spent     int DEFAULT 0,
  status          text DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  requested_at    timestamptz DEFAULT now(),
  UNIQUE(from_ghost_id, to_ghost_id)
);

-- ── Ghost Scores ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_scores (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_ghost_id   text NOT NULL,
  to_ghost_id     text NOT NULL,
  stars           int NOT NULL CHECK (stars BETWEEN 1 AND 5),
  tags            text[] DEFAULT '{}',
  created_at      timestamptz DEFAULT now(),
  UNIQUE(from_ghost_id, to_ghost_id)
);
CREATE INDEX IF NOT EXISTS idx_ghost_scores_to ON ghost_scores(to_ghost_id);

-- ── Floor Gifts (Floor Wars) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_floor_gifts (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id   text NOT NULL,
  floor      text NOT NULL,
  iso_week   text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_floor_gifts_week ON ghost_floor_gifts(iso_week, floor);

-- ── Message Likes ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_msg_likes (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  msg_id     text NOT NULL,
  ghost_id   text NOT NULL,
  floor      text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(msg_id, ghost_id)
);

-- ── Window Mode (Ghost Clock) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_window_mode (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id   text NOT NULL UNIQUE,
  until_ts   bigint NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ── Purchases Log ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_purchases (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id        text NOT NULL,
  session_id      text NOT NULL UNIQUE,
  price_id        text NOT NULL,
  product_type    text NOT NULL CHECK (product_type IN ('tier','coins')),
  product_detail  text NOT NULL,
  fulfilled_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ghost_purchases_ghost ON ghost_purchases(ghost_id);

-- ── Push Subscriptions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id   text NOT NULL UNIQUE,
  endpoint   text NOT NULL,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  user_agent text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_ghost ON push_subscriptions(ghost_id);

-- ── Push Log ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_log (
  id       uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id text NOT NULL,
  title    text NOT NULL,
  body     text NOT NULL,
  type     text NOT NULL DEFAULT 'general',
  sent_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_log_ghost ON push_log(ghost_id);

-- ── Vault Tables ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_codes (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id   text NOT NULL UNIQUE,
  code       text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_image_folders (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id   text NOT NULL,
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_images (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id    text NOT NULL,
  folder_id   uuid REFERENCES vault_image_folders(id) ON DELETE CASCADE,
  url         text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_video_folders (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id   text NOT NULL,
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_videos (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id    text NOT NULL,
  folder_id   uuid REFERENCES vault_video_folders(id) ON DELETE CASCADE,
  url         text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_private_bio (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id   text NOT NULL UNIQUE,
  real_name  text DEFAULT '',
  phone      text DEFAULT '',
  instagram  text DEFAULT '',
  telegram   text DEFAULT '',
  bio        text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_memories (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id    text NOT NULL,
  title       text NOT NULL,
  content     text DEFAULT '',
  memory_date date,
  mood        text DEFAULT '❤️',
  created_at  timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — open via anon key (app handles its own auth)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE ghost_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_coins         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_tiers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_likes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_floor_msgs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_vault_msgs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_whispers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_video_intros  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_video_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_scores        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_floor_gifts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_msg_likes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_window_mode   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ghost_purchases     ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_codes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_image_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_video_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_videos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_private_bio   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_memories      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON ghost_profiles       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_coins          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_tiers          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_likes          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_matches        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_floor_msgs     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_vault_msgs     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_whispers       FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_video_intros   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_video_requests FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_scores         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_floor_gifts    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_msg_likes      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_window_mode    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON ghost_purchases      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON push_subscriptions   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON push_log             FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_codes          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_image_folders  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_images         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_video_folders  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_videos         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_private_bio    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_memories       FOR ALL TO anon USING (true) WITH CHECK (true);

-- ── Enable realtime on chat tables ────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE ghost_floor_msgs;
ALTER PUBLICATION supabase_realtime ADD TABLE ghost_vault_msgs;
ALTER PUBLICATION supabase_realtime ADD TABLE ghost_matches;

-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('ghost-images', 'ghost-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('ghost-videos', 'ghost-videos', true, 104857600, ARRAY['video/mp4','video/webm','video/quicktime']),
  ('ghost-voice',  'ghost-voice',  true, 10485760,  ARRAY['audio/webm','audio/mp4','audio/ogg','audio/wav','audio/mpeg'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anon_storage_all" ON storage.objects
  FOR ALL TO anon
  USING  (bucket_id IN ('ghost-images','ghost-videos','ghost-voice'))
  WITH CHECK (bucket_id IN ('ghost-images','ghost-videos','ghost-voice'));
