-- ═══════════════════════════════════════════════════════════════════
-- PUSH NOTIFICATIONS — Hearts Way Hotel
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Push Subscriptions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id    text NOT NULL UNIQUE,
  endpoint    text NOT NULL,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  user_agent  text DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_ghost ON push_subscriptions(ghost_id);

-- ── Push Log (optional — track sent notifications) ────────────────────────────
CREATE TABLE IF NOT EXISTS push_log (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  ghost_id   text NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL,
  type       text NOT NULL DEFAULT 'general'
               CHECK (type IN ('match','message','vault_message','gift','butler','general')),
  sent_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_log_ghost ON push_log(ghost_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_log           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON push_subscriptions FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON push_log           FOR ALL TO anon USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════
-- VAPID KEYS (store these — never lose the private key)
-- ═══════════════════════════════════════════════════════════════════
-- Public Key  (use in frontend):
--   BIhkXm8QWrL4jMePUmczOF3DmMUCKwIh1VMGHnqpKuQp5iejsh1Di4UT7CEGU1EaTeo2025aO8vL07_3mH7DG5Y
--
-- Private Key (use in Supabase Edge Function — KEEP SECRET):
--   fLtMNvMPa9X5iBpuz1gLWO_oxsrWu3bJwahHZLisnxM
-- ═══════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════
-- SUPABASE EDGE FUNCTION — send-push
-- Deploy with: supabase functions deploy send-push
-- Call via: supabase.functions.invoke('send-push', { body: { ghostId, title, body, url } })
-- ═══════════════════════════════════════════════════════════════════
--
-- Create file: supabase/functions/send-push/index.ts
-- Content:
--
-- import webpush from "npm:web-push";
-- import { createClient } from "npm:@supabase/supabase-js";
--
-- const VAPID_PUBLIC  = "BIhkXm8QWrL4jMePUmczOF3DmMUCKwIh1VMGHnqpKuQp5iejsh1Di4UT7CEGU1EaTeo2025aO8vL07_3mH7DG5Y";
-- const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
-- const VAPID_EMAIL   = "mailto:admin@heartswayhotel.com";
--
-- webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
--
-- Deno.serve(async (req) => {
--   const { ghostId, title, body, url } = await req.json();
--   const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
--   const { data } = await supabase.from("push_subscriptions").select("*").eq("ghost_id", ghostId).single();
--   if (!data) return new Response("no subscription", { status: 404 });
--   await webpush.sendNotification(
--     { endpoint: data.endpoint, keys: { p256dh: data.p256dh, auth: data.auth } },
--     JSON.stringify({ title, body, url, icon: "/icons/icon-192.png", badge: "/icons/icon-72.png" })
--   );
--   return new Response("ok");
-- });
