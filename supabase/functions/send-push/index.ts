// ── Hearts Way Hotel — Send Push Notification Edge Function ──────────────────
// Deploy: supabase functions deploy send-push
// Call:   supabase.functions.invoke('send-push', { body: { ghostId, title, body, url, type } })

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const VAPID_PUBLIC  = "BIhkXm8QWrL4jMePUmczOF3DmMUCKwIh1VMGHnqpKuQp5iejsh1Di4UT7CEGU1EaTeo2025aO8vL07_3mH7DG5Y";
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_EMAIL   = "mailto:admin@heartswayhotel.com";

webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const { ghostId, title, body, url, type } = await req.json() as {
      ghostId: string;
      title:   string;
      body:    string;
      url?:    string;
      type?:   string;
    };

    if (!ghostId || !title || !body) {
      return new Response(JSON.stringify({ error: "ghostId, title, body required" }), { status: 400 });
    }

    // Look up the subscription
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: sub, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("ghost_id", ghostId)
      .single();

    if (error || !sub) {
      return new Response(JSON.stringify({ error: "No subscription found" }), { status: 404 });
    }

    // Send the push
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({
        title,
        body,
        url:   url ?? "/ghost/mode",
        icon:  "/icons/icon-192.png",
        badge: "/icons/icon-72.png",
        tag:   type ?? "general",
      })
    );

    // Log it
    await supabase.from("push_log").insert({
      ghost_id: ghostId,
      title,
      body,
      type: type ?? "general",
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
