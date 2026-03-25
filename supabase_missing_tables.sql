-- ═══════════════════════════════════════════════════════════════════════════════
-- 2Ghost — Missing Supabase Tables Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Breakfast Invites ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_breakfast_invites (
  id                 TEXT PRIMARY KEY,
  from_ghost_id      TEXT NOT NULL,
  from_user_name     TEXT NOT NULL,
  from_floor         TEXT NOT NULL,
  to_ghost_id        TEXT NOT NULL,
  to_user_name       TEXT NOT NULL,
  to_avatar          TEXT,
  sent_at            BIGINT NOT NULL,
  expires_at         BIGINT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending',
  selected_gifts     JSONB,
  decline_reason     TEXT,
  from_avatar        TEXT,
  from_photo         TEXT,
  from_age           INTEGER,
  from_city          TEXT,
  from_country_flag  TEXT,
  proposed_time      BIGINT,
  sender_timezone    TEXT,
  missed_at          BIGINT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bfast_invites_from ON ghost_breakfast_invites(from_ghost_id);
CREATE INDEX IF NOT EXISTS idx_bfast_invites_to   ON ghost_breakfast_invites(to_ghost_id, status);

-- ── Breakfast Ratings ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_breakfast_ratings (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  invite_id           TEXT NOT NULL,
  rater_ghost_id      TEXT NOT NULL,
  rater_role          TEXT NOT NULL,  -- 'host' | 'guest'
  rating              INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  rated_at            BIGINT NOT NULL,
  selected_activity   JSONB,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(invite_id, rater_ghost_id)
);
CREATE INDEX IF NOT EXISTS idx_bfast_ratings_invite ON ghost_breakfast_ratings(invite_id);

-- ── Social Activities (admin-managed list) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_social_activities (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  image_url   TEXT,
  icon        TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default activities (insert only if table is empty)
INSERT INTO ghost_social_activities (id, name, description, icon, sort_order)
SELECT * FROM (VALUES
  ('act-1', 'Sunset Rooftop Drinks',  'Watch the city glow from above with curated cocktails',     '🌅', 1),
  ('act-2', 'Gallery & Coffee Walk',  'Explore local art then settle into a quiet café together',   '🖼️', 2),
  ('act-3', 'Private Dinner',         'An intimate table for two at a restaurant of your choice',   '🍽️', 3),
  ('act-4', 'Park Picnic',            'A blanket, great food, and even better company',             '🧺', 4),
  ('act-5', 'Day Trip',               'Pick a direction and just drive — no plan needed',           '🚗', 5),
  ('act-6', 'Cook Together',          'Pick a recipe, shop together, cook something memorable',     '👨‍🍳', 6),
  ('act-7', 'Wine & Film Evening',    'Good wine, a great film, no interruptions',                  '🍷', 7),
  ('act-8', 'Morning Hike',           'Fresh air, early start, and real conversation on the trail', '🥾', 8)
) AS t(id, name, description, icon, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM ghost_social_activities LIMIT 1);

-- ── Social Invites ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_social_invites (
  id              TEXT PRIMARY KEY,
  invite_id       TEXT NOT NULL,
  from_ghost_id   TEXT NOT NULL,
  from_user_name  TEXT NOT NULL,
  to_ghost_id     TEXT NOT NULL,
  to_user_name    TEXT NOT NULL,
  floor           TEXT NOT NULL,
  activity        JSONB NOT NULL,
  host_rating     INTEGER,
  guest_rating    INTEGER,
  sent_at         BIGINT NOT NULL,
  deliver_at      BIGINT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  decline_reason  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_social_invites_from ON ghost_social_invites(from_ghost_id);
CREATE INDEX IF NOT EXISTS idx_social_invites_to   ON ghost_social_invites(to_ghost_id, status);

-- ── Breakfast Gifts (per-floor, admin-managed) ────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_breakfast_gifts (
  id          TEXT PRIMARY KEY,
  floor       TEXT NOT NULL,
  emoji       TEXT NOT NULL,
  name        TEXT NOT NULL,
  image_url   TEXT,
  description TEXT,
  coin_value  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bfast_gifts_floor ON ghost_breakfast_gifts(floor);

-- Seed default gifts
INSERT INTO ghost_breakfast_gifts (id, floor, emoji, name, description, coin_value)
SELECT * FROM (VALUES
  ('std-1','standard','🌹','Morning Rose',     'A single fresh rose to welcome you',              3),
  ('std-2','standard','☕','Coffee',           'Hot coffee ready at your seat',                   2),
  ('std-3','standard','🥐','Croissant',        'Warm buttered croissant',                         2),
  ('std-4','standard','🧁','Muffin',           'Fresh baked blueberry muffin',                    2),
  ('ste-1','suite',   '🌹','Bronze Rose',      'A hand-tied bronze rose arrangement',             5),
  ('ste-2','suite',   '☕','Specialty Coffee','Single origin pour-over coffee',                   4),
  ('ste-3','suite',   '🧣','Silk Scarf',       'Complimentary silk scarf from the suite',         8),
  ('ste-4','suite',   '🍊','Fresh Juice',      'Freshly squeezed orange juice',                   3),
  ('kng-1','kings',   '🥂','Champagne',        'Glass of chilled champagne',                     10),
  ('kng-2','kings',   '👑','Crown Chocolates', 'Gold-wrapped artisan chocolates',                  8),
  ('kng-3','kings',   '📨','Gold Envelope',    'Handwritten welcome note in gold envelope',        5),
  ('kng-4','kings',   '🌸','Orchid',           'White orchid from the Kings garden',               7),
  ('pnt-1','penthouse','🫙','Caviar',          'Premium caviar with blinis',                      15),
  ('pnt-2','penthouse','💎','Crystal Glass',   'Hand-etched crystal champagne flute',             12),
  ('pnt-3','penthouse','🏙️','City View Card', 'Exclusive rooftop view card & key',               10),
  ('pnt-4','penthouse','🌺','Tropical Bouquet','Rare tropical flowers arrangement',               12),
  ('lft-1','loft',    '🖼️','Art Print',       'Limited edition print from the loft gallery',      8),
  ('lft-2','loft',    '🍵','Herbal Tea',       'Hand-blended herbal morning tea',                  3),
  ('lft-3','loft',    '🎵','Vinyl Record',     'Vintage vinyl from the loft collection',          10),
  ('lft-4','loft',    '🕯️','Scented Candle',  'Hand-poured soy wax candle',                       6),
  ('cel-1','cellar',  '🍷','Red Wine',         'Aged red wine from the cellar reserve',           10),
  ('cel-2','cellar',  '🧀','Cheese Board',     'Artisan cheese selection',                         8),
  ('cel-3','cellar',  '🕯️','Cellar Candle',   'Black wax candle — cellar signature',              5),
  ('cel-4','cellar',  '🍫','Dark Chocolate',   'Single origin 85% dark chocolate',                 4)
) AS t(id, floor, emoji, name, description, coin_value)
WHERE NOT EXISTS (SELECT 1 FROM ghost_breakfast_gifts LIMIT 1);

-- ── Coin Transactions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_coin_transactions (
  id          TEXT PRIMARY KEY,
  ghost_id    TEXT NOT NULL,
  type        TEXT NOT NULL,  -- 'purchase' | 'win' | 'spend' | 'bonus' | 'refund'
  amount      INTEGER NOT NULL,
  description TEXT,
  ts          BIGINT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coin_tx_ghost ON ghost_coin_transactions(ghost_id, ts DESC);

-- ── Reputation (show-up / no-show tracking) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_reputation (
  ghost_id   TEXT PRIMARY KEY,
  show_ups   INTEGER NOT NULL DEFAULT 0,
  no_shows   INTEGER NOT NULL DEFAULT 0,
  coin_debt  INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Hotel Checkout State ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_checkout_state (
  ghost_id        TEXT PRIMARY KEY,
  joined_at       BIGINT,
  floors_visited  TEXT[],
  checkout_state  TEXT,
  calling_card    JSONB,
  hibernate_until BIGINT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Mr. Butlas Staff Nudges ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_staff_nudges (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  from_ghost_id TEXT,
  to_ghost_id   TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'nudge',  -- 'nudge' | 'portrait_request'
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  read_at       TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_staff_nudges_to ON ghost_staff_nudges(to_ghost_id, sent_at DESC);

-- ── Enable Realtime for nudges (so target user sees it live) ──────────────────
ALTER TABLE ghost_staff_nudges REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE ghost_staff_nudges;

ALTER TABLE ghost_breakfast_invites REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE ghost_breakfast_invites;

ALTER TABLE ghost_social_invites REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE ghost_social_invites;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Done. All tables created with indexes and seeded default data.
-- ═══════════════════════════════════════════════════════════════════════════════
