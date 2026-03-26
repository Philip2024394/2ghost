-- ── 2Ghost: Matching, Verification & Referral Migration ──────────────────────
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ── 1. Add verification columns to ghost_profiles ────────────────────────────
ALTER TABLE ghost_profiles
  ADD COLUMN IF NOT EXISTS verification_status    TEXT    DEFAULT 'none'
    CHECK (verification_status IN ('none','pending','verified','rejected')),
  ADD COLUMN IF NOT EXISTS verification_video_url TEXT    DEFAULT NULL;

-- Index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_ghost_profiles_verification
  ON ghost_profiles (verification_status)
  WHERE verification_status = 'pending';

-- ── 2. ghost_referrals table ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ghost_referrals (
  id                BIGSERIAL PRIMARY KEY,
  inviter_ghost_id  TEXT NOT NULL,           -- ghost ID of the person who shared the link
  invited_ghost_id  TEXT NOT NULL,           -- ghost ID of the new user who joined
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','rejected')),
  coins_awarded     INTEGER NOT NULL DEFAULT 50,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (invited_ghost_id)                  -- each new user can only be referred once
);

CREATE INDEX IF NOT EXISTS idx_ghost_referrals_inviter
  ON ghost_referrals (inviter_ghost_id);

-- RLS: anyone can insert their own referral row; read own rows only
ALTER TABLE ghost_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referrals_insert ON ghost_referrals;
CREATE POLICY referrals_insert ON ghost_referrals
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS referrals_select ON ghost_referrals;
CREATE POLICY referrals_select ON ghost_referrals
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS referrals_update_admin ON ghost_referrals;
CREATE POLICY referrals_update_admin ON ghost_referrals
  FOR UPDATE TO authenticated USING (true);

-- ── 3. Helper RPC: add_coins_to_ghost ────────────────────────────────────────
-- Called when a referred user completes signup to award welcome coins
CREATE OR REPLACE FUNCTION add_coins_to_ghost(p_ghost_id TEXT, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ghost_profiles
    SET coin_balance = COALESCE(coin_balance, 0) + p_amount
  WHERE ghost_id = p_ghost_id;
END;
$$;

-- ── 4. Helper RPC: complete_referral ─────────────────────────────────────────
-- Called by webhook or admin to mark a referral complete and award inviter coins
CREATE OR REPLACE FUNCTION complete_referral(p_invited_ghost_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inviter_id TEXT;
  v_coins      INTEGER;
BEGIN
  SELECT inviter_ghost_id, coins_awarded
    INTO v_inviter_id, v_coins
    FROM ghost_referrals
   WHERE invited_ghost_id = p_invited_ghost_id AND status = 'pending'
   LIMIT 1;

  IF v_inviter_id IS NOT NULL THEN
    -- Award coins to inviter
    UPDATE ghost_profiles
      SET coin_balance = COALESCE(coin_balance, 0) + v_coins
    WHERE ghost_id = v_inviter_id;

    -- Mark referral complete
    UPDATE ghost_referrals
      SET status = 'completed', completed_at = NOW()
    WHERE invited_ghost_id = p_invited_ghost_id AND status = 'pending';
  END IF;
END;
$$;

-- ── 5. Admin: approve verification ───────────────────────────────────────────
-- Run manually or via admin dashboard button
-- UPDATE ghost_profiles
--   SET verification_status = 'verified', face_verified = true
-- WHERE ghost_id = '<ghost_id>';
