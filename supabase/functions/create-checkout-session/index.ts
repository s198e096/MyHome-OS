// Creates a Stripe Checkout Session for the signed-in user to subscribe to
// (or one-time purchase) a plan — or to buy a one-time PDF report ("home_sale"
// or "insurance_inventory", sent as `reportType`) — and returns the URL to
// redirect them to.
// Deploy: `supabase functions deploy create-checkout-session`.
// Requires the STRIPE_SECRET_KEY secret to be set on the project, plus one
// secret per report holding its one-time Stripe price id:
//   STRIPE_PRICE_HOME_SALE            ($14.99)
//   STRIPE_PRICE_INSURANCE_INVENTORY  ($29.99)
// A report purchase is recorded by stripe-webhook, not here.
//
// "Enforce JWT Verification" must be turned OFF for this function, since
// Supabase's gateway checks the JWT on the CORS preflight (OPTIONS) request
// too, and browsers never send auth headers on preflight - that check would
// reject the preflight before this code ever runs. Instead, the caller's
// identity is verified manually below using the SUPABASE_URL /
// SUPABASE_ANON_KEY that Supabase automatically injects into every function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_PRICES: Record<string, { price: string; mode: "subscription" | "payment" }> = {
  plus: { price: "price_1UHoneDXX8DMw6xrlYZcmdzB", mode: "subscription" },
  premium: { price: "price_1UHooZDXX8DMw6xr2TnTFqLO", mode: "subscription" },
  lifetime: { price: "price_1UHoopDXX8DMw6xrjZ920s15", mode: "payment" },
};

// Report type -> name of the secret holding its Stripe price id.
const REPORT_PRICE_SECRETS: Record<string, string> = {
  home_sale: "STRIPE_PRICE_HOME_SALE",
  insurance_inventory: "STRIPE_PRICE_INSURANCE_INVENTORY",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { planId, reportType, origin } = await req.json();

    // A request is either for a plan or for a one-time PDF report; either way
    // it resolves to a Stripe price and a checkout mode.
    let plan: { price: string; mode: "subscription" | "payment" } | undefined;
    if (reportType) {
      const secretName = REPORT_PRICE_SECRETS[reportType];
      const price = secretName ? Deno.env.get(secretName) : undefined;
      if (!price) {
        return new Response(
          JSON.stringify({ error: secretName ? "This report isn't available for purchase yet" : "Unknown reportType" }),
          { status: secretName ? 503 : 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }
      plan = { price, mode: "payment" };
    } else {
      plan = PLAN_PRICES[planId];
      if (!plan) {
        return new Response(JSON.stringify({ error: "Unknown planId" }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
    }
    if (!origin) {
      return new Response(JSON.stringify({ error: "origin is required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

    // Service-role client to read/write the profile row (RLS would otherwise
    // block writes to another user's row, but here we're only ever touching
    // the authenticated caller's own row).
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profile } = await adminClient
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await adminClient.from("profiles").update({ stripe_customer_id: customerId }).eq("user_id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: plan.mode,
      line_items: [{ price: plan.price, quantity: 1 }],
      success_url: `${origin}/?${reportType ? "report" : "billing"}=success`,
      cancel_url: `${origin}/?${reportType ? "report" : "billing"}=cancel`,
      client_reference_id: user.id,
      // A report purchase carries `report_type` and deliberately NO `plan`, so
      // the webhook can never mistake it for a plan change.
      metadata: reportType
        ? { supabase_user_id: user.id, report_type: reportType }
        : { supabase_user_id: user.id, plan: planId },
      subscription_data: plan.mode === "subscription" ? { metadata: { supabase_user_id: user.id, plan: planId } } : undefined,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
