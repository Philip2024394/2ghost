// ── 2Ghost — Create Stripe Embedded Checkout Session ─────────────────────────
// Deploy: supabase functions deploy create-checkout
// Called by frontend to get a clientSecret for embedded checkout

import Stripe from "npm:stripe@14";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { priceId, ghostId, returnUrl } = await req.json() as {
      priceId:   string;
      ghostId:   string;
      returnUrl: string;
    };

    if (!priceId || !ghostId || !returnUrl) {
      return new Response(
        JSON.stringify({ error: "priceId, ghostId, returnUrl required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    // Determine mode by looking up the price (recurring = subscription)
    const price = await stripe.prices.retrieve(priceId);
    const mode  = price.recurring ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
      ui_mode:             "embedded",
      mode,
      line_items:          [{ price: priceId, quantity: 1 }],
      client_reference_id: ghostId,
      return_url:          returnUrl,
      payment_method_types: ["card"],
      custom_text: {
        submit: { message: "Your purchase is secured by Stripe" },
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: session.client_secret }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
