# Stripe Setup — 2Ghost

## Step 1 — Create Products in Stripe Dashboard

Go to https://dashboard.stripe.com/products → Add product

### Ghost Suite
- Name: Ghost Suite
- Price: $4.99 / month (recurring)
- Copy the Payment Link URL

### Gold Room
- Name: Gold Room
- Price: $9.99 / month (recurring)
- Copy the Payment Link URL

For each Payment Link, set the **Success URL** to:
```
https://yourdomain.com/ghost/payment-success?plan=suite
https://yourdomain.com/ghost/payment-success?plan=gold
```

Enable **"Collect customer's phone number"** — optional but useful.

---

## Step 2 — Add to your .env file

Create or edit `.env.local` in the project root:

```
VITE_STRIPE_SUITE_LINK=https://buy.stripe.com/your_suite_link_here
VITE_STRIPE_GOLD_LINK=https://buy.stripe.com/your_gold_link_here
```

---

## Step 3 — Run the SQL

Run `supabase-stripe-setup.sql` in your Supabase SQL Editor.

---

## Step 4 — Stripe Webhook (optional but recommended)

To automatically update user tier in the database when payment succeeds:

1. Go to Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://YOUR_SUPABASE_URL/functions/v1/stripe-webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Create a Supabase Edge Function (see below)

### Supabase Edge Function — stripe-webhook

```typescript
// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const body = await req.text()
  const sig  = req.headers.get("stripe-signature") || ""

  // Verify webhook signature here with Stripe SDK if needed

  const event = JSON.parse(body)

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  if (event.type === "checkout.session.completed") {
    const session  = event.data.object
    const ghostId  = session.client_reference_id
    const plan     = session.metadata?.plan || "suite"

    if (ghostId) {
      await supabase
        .from("ghost_profiles")
        .update({ tier: plan, updated_at: new Date().toISOString() })
        .eq("ghost_id", ghostId)
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub     = event.data.object
    const ghostId = sub.metadata?.ghost_id
    if (ghostId) {
      await supabase
        .from("ghost_profiles")
        .update({ tier: "free" })
        .eq("ghost_id", ghostId)
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})
```

---

## How it works end-to-end

1. User taps "Join Ghost Suite" on pricing page
2. App redirects to Stripe Payment Link with `?client_reference_id=GHOST_ID`
3. User pays on Stripe (handles all cards, Apple Pay, Google Pay — 190+ countries)
4. Stripe redirects to `/ghost/payment-success?plan=suite`
5. Success page activates the plan in localStorage + Supabase
6. Webhook (if set up) also confirms from server side

---

## Currencies

The pricing page automatically shows local currency estimates based on the user's IP.
Stripe processes payment in your account's base currency (USD) and handles conversion.
No extra setup needed — works for all 190+ countries automatically.
