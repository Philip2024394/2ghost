-- ═══════════════════════════════════════════════════════════════════
-- ROOM VAULT — Full Supabase Schema
-- Run in Supabase SQL Editor → paste entire file and click Run
-- Project: czlfqasujfdfumelzjbp
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Vault Room Codes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_codes (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id     text NOT NULL UNIQUE,
  code         text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- ── Image Folders ────────────────────────────────────────────────────
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

-- ── Video Folders ────────────────────────────────────────────────────
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

-- ── File Folders ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_file_folders (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id   text NOT NULL,
  name       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vault_files (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id     text NOT NULL,
  folder_id    uuid REFERENCES vault_file_folders(id) ON DELETE CASCADE,
  file_name    text NOT NULL,
  file_type    text NOT NULL,
  size_bytes   bigint NOT NULL,
  storage_path text NOT NULL,
  public_url   text NOT NULL,
  uploaded_at  timestamptz DEFAULT now()
);

-- ── Vault Chat Messages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_chat_messages (
  id                   uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_ghost_id      text NOT NULL,
  recipient_ghost_id   text NOT NULL,
  content              text NOT NULL,
  message_type         text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','voice')),
  expires_at           timestamptz,
  view_once            boolean DEFAULT false,
  viewed               boolean DEFAULT false,
  sent_at              timestamptz DEFAULT now()
);

-- ── Voice Notes ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_voice_notes (
  id               uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id         text NOT NULL,
  storage_path     text NOT NULL,
  public_url       text NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  label            text,
  created_at       timestamptz DEFAULT now()
);

-- ── Inbox ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_inbox (
  id                   uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipient_ghost_id   text NOT NULL,
  sender_ghost_id      text NOT NULL,
  item_type            text NOT NULL CHECK (item_type IN ('image','video','note')),
  content              text NOT NULL,
  note                 text,
  status               text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  expires_at           timestamptz,
  view_once            boolean DEFAULT false,
  viewed               boolean DEFAULT false,
  accepted_at          timestamptz,
  sent_at              timestamptz DEFAULT now()
);

-- ── Activity Log ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_activity_log (
  id       uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id text NOT NULL,
  action   text NOT NULL CHECK (action IN ('login','code_shared','image_sent','voice_sent','chat_opened')),
  at       timestamptz DEFAULT now()
);

-- ── Shared Vault ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_shared_items (
  id                     uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  uploaded_by_ghost_id   text NOT NULL,
  shared_with_ghost_id   text NOT NULL,
  item_type              text NOT NULL CHECK (item_type IN ('image','video')),
  url                    text NOT NULL,
  caption                text,
  uploaded_at            timestamptz DEFAULT now()
);

-- ── Private Bio ────────────────────────────────────────────────────────
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

-- ── Memories ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_memories (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id     text NOT NULL,
  title        text NOT NULL,
  content      text DEFAULT '',
  memory_date  date,
  mood         text DEFAULT '❤️',
  created_at   timestamptz DEFAULT now()
);

-- ── Access Grants (share codes) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vault_access_grants (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_ghost_id  text NOT NULL,
  share_code      text NOT NULL UNIQUE,
  access_type     text NOT NULL CHECK (access_type IN ('image','video','both')),
  created_at      timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_vif_ghost   ON vault_image_folders(ghost_id);
CREATE INDEX IF NOT EXISTS idx_vi_folder   ON vault_images(folder_id);
CREATE INDEX IF NOT EXISTS idx_vi_ghost    ON vault_images(ghost_id);
CREATE INDEX IF NOT EXISTS idx_vvf_ghost   ON vault_video_folders(ghost_id);
CREATE INDEX IF NOT EXISTS idx_vv_folder   ON vault_videos(folder_id);
CREATE INDEX IF NOT EXISTS idx_vff_ghost   ON vault_file_folders(ghost_id);
CREATE INDEX IF NOT EXISTS idx_vf_folder   ON vault_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_vcm_sender  ON vault_chat_messages(sender_ghost_id);
CREATE INDEX IF NOT EXISTS idx_vcm_recip   ON vault_chat_messages(recipient_ghost_id);
CREATE INDEX IF NOT EXISTS idx_vinbox      ON vault_inbox(recipient_ghost_id);
CREATE INDEX IF NOT EXISTS idx_val_ghost   ON vault_activity_log(ghost_id);
CREATE INDEX IF NOT EXISTS idx_vm_ghost    ON vault_memories(ghost_id);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — open via anon key (vault handles its own auth)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE vault_codes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_image_folders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_images          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_video_folders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_videos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_file_folders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_files           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_chat_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_voice_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_inbox           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_activity_log    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_shared_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_private_bio     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_memories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_access_grants   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON vault_codes           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_image_folders   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_images          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_video_folders   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_videos          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_file_folders    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_files           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_chat_messages   FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_voice_notes     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_inbox           FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_activity_log    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_shared_items    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_private_bio     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_memories        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON vault_access_grants   FOR ALL TO anon USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS  (ghost-images and ghost-videos already exist)
-- Run this if ghost-files and ghost-voice don't exist yet
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('ghost-files', 'ghost-files', true, 26214400, ARRAY[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv','text/plain',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]),
  ('ghost-voice', 'ghost-voice', true, 10485760, ARRAY[
    'audio/webm','audio/mp4','audio/ogg','audio/wav','audio/mpeg'
  ])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "anon_all" ON storage.objects
  FOR ALL TO anon
  USING  (bucket_id IN ('ghost-files','ghost-voice','ghost-images','ghost-videos'))
  WITH CHECK (bucket_id IN ('ghost-files','ghost-voice','ghost-images','ghost-videos'));
