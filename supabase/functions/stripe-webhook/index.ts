// ── 2Ghost — Stripe Webhook Edge Function ─────────────────────────────────────
// Deploy: supabase functions deploy stripe-webhook
// Register in Stripe Dashboard → Webhooks → checkout.session.completed
//
// Required env vars (set in Supabase Dashboard → Edge Functions → Secrets):
//   STRIPE_SECRET_KEY         — sk_live_... or sk_test_...
//   STRIPE_WEBHOOK_SECRET     — whsec_...
//   STRIPE_PRICE_SUITE        — price_... for Ghost Ensuite plan
//   STRIPE_PRICE_GOLD         — price_... for Gold Room plan
//   STRIPE_PRICE_PENTHOUSE    — price_... for Penthouse plan (optional)
//   STRIPE_PRICE_KINGS        — price_... for Kings/Casino plan (optional)
//   STRIPE_PRICE_COINS_50     — price_... for 50-coin pack
//   STRIPE_PRICE_COINS_150    — price_... for 150-coin pack
//   STRIPE_PRICE_COINS_400    — price_... for 400-coin pack
//   STRIPE_PRICE_COINS_1000   — price_... for 1000-coin pack
//   SUPABASE_URL              — auto-set by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-set by Supabase

import Stripe from "npm:stripe@14";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

// ── Map Stripe price IDs → product type ───────────────────────────────────────

function resolvePurchase(
  priceId: string
): { type: "tier"; tier: string } | { type: "coins"; amount: number } | null {
  const e = Deno.env.get.bind(Deno.env);

  const tierMap: Record<string, string> = {};
  if (e("STRIPE_PRICE_SUITE"))     tierMap[e("STRIPE_PRICE_SUITE")!]     = "suite";
  if (e("STRIPE_PRICE_GOLD"))      tierMap[e("STRIPE_PRICE_GOLD")!]      = "gold";
  if (e("STRIPE_PRICE_PENTHOUSE")) tierMap[e("STRIPE_PRICE_PENTHOUSE")!] = "penthouse";
  if (e("STRIPE_PRICE_KINGS"))     tierMap[e("STRIPE_PRICE_KINGS")!]     = "kings";

  const coinMap: Record<string, number> = {};
  if (e("STRIPE_PRICE_COINS_50"))   coinMap[e("STRIPE_PRICE_COINS_50")!]   = 50;
  if (e("STRIPE_PRICE_COINS_150"))  coinMap[e("STRIPE_PRICE_COINS_150")!]  = 150;
  if (e("STRIPE_PRICE_COINS_400"))  coinMap[e("STRIPE_PRICE_COINS_400")!]  = 400;
  if (e("STRIPE_PRICE_COINS_1000")) coinMap[e("STRIPE_PRICE_COINS_1000")!] = 1000;

  if (tierMap[priceId]) return { type: "tier", tier: tierMap[priceId] };
  if (coinMap[priceId] !== undefined) return { type: "coins", amount: coinMap[priceId] };
  return null;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "stripe-signature, content-type",
      },
    });
  }

  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") ?? "";

  // Verify signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  // Only handle completed checkouts
  if (event.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ skipped: event.type }), { status: 200 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const ghostId = session.client_reference_id ?? "";

  if (!ghostId) {
    console.warn("[stripe-webhook] No client_reference_id on session:", session.id);
    return new Response(JSON.stringify({ error: "No ghostId" }), { status: 400 });
  }

  // Retrieve line items to get the price ID
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
  const priceId   = lineItems.data[0]?.price?.id ?? "";

  if (!priceId) {
    console.error("[stripe-webhook] No price ID found for session:", session.id);
    return new Response(JSON.stringify({ error: "No price ID" }), { status: 400 });
  }

  const product = resolvePurchase(priceId);
  if (!product) {
    console.warn("[stripe-webhook] Unknown price ID:", priceId);
    return new Response(JSON.stringify({ skipped: "unknown price" }), { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (product.type === "tier") {
    // ── Fulfill tier upgrade ─────────────────────────────────────────────────
    const { error: tierErr } = await supabase.from("ghost_tiers").upsert(
      { ghost_id: ghostId, tier: product.tier, updated_at: new Date().toISOString() },
      { onConflict: "ghost_id" }
    );
    if (tierErr) {
      console.error("[stripe-webhook] ghost_tiers upsert failed:", tierErr.message);
      return new Response(JSON.stringify({ error: tierErr.message }), { status: 500 });
    }

    // Also sync to ghost_profiles.tier
    await supabase
      .from("ghost_profiles")
      .update({ tier: product.tier, updated_at: new Date().toISOString() })
      .eq("ghost_id", ghostId);

    console.log(`[stripe-webhook] Tier fulfilled: ${ghostId} → ${product.tier}`);

  } else {
    // ── Fulfill coin purchase ────────────────────────────────────────────────
    const qty = lineItems.data[0]?.quantity ?? 1;
    const totalCoins = product.amount * qty;

    // Load current balance
    const { data: existing } = await supabase
      .from("ghost_coins")
      .select("balance, first_purchase_done")
      .eq("ghost_id", ghostId)
      .maybeSingle();

    const currentBalance     = existing?.balance ?? 0;
    const firstPurchaseDone  = existing?.first_purchase_done ?? false;

    // Double coins on first purchase
    const bonus    = firstPurchaseDone ? 0 : totalCoins;
    const newBalance = currentBalance + totalCoins + bonus;

    const { error: coinErr } = await supabase.from("ghost_coins").upsert(
      {
        ghost_id:            ghostId,
        balance:             newBalance,
        first_purchase_done: true,
        updated_at:          new Date().toISOString(),
      },
      { onConflict: "ghost_id" }
    );

    if (coinErr) {
      console.error("[stripe-webhook] ghost_coins upsert failed:", coinErr.message);
      return new Response(JSON.stringify({ error: coinErr.message }), { status: 500 });
    }

    console.log(
      `[stripe-webhook] Coins fulfilled: ${ghostId} +${totalCoins}${bonus ? ` (+${bonus} bonus)` : ""} → ${newBalance}`
    );
  }

  // Log the fulfillment
  await supabase.from("ghost_purchases").insert({
    ghost_id:   ghostId,
    session_id: session.id,
    price_id:   priceId,
    product_type: product.type,
    product_detail: product.type === "tier" ? product.tier : String(product.amount),
    fulfilled_at: new Date().toISOString(),
  }).then(null, () => null); // non-critical

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
