// Cancels the signed-in user's paid plan, switching them to Free. A
// recurring subscription is scheduled to cancel at the end of the current
// billing period (they keep what they already paid for; the `plan` column
// itself is flipped to "free" later by stripe-webhook's
// customer.subscription.deleted handler, once the period actually ends and
// Stripe deletes the subscription). A one-time Lifetime purchase has no
// subscription to cancel, so it's switched to Free immediately here.
// Deploy: `supabase functions deploy cancel-subscription`.
// Requires the STRIPE_SECRET_KEY secret to be set on the project.
//
// "Enforce JWT Verification" must be turned OFF for this function, same as
// create-checkout-session — see that function for why.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: profile } = await adminClient
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // A one-time Lifetime purchase (or an account already on Free) has no
    // subscription to cancel — just switch straight to Free.
    if (!profile?.stripe_subscription_id) {
      await adminClient.from("profiles").update({ plan: "free" }).eq("user_id", user.id);
      return new Response(JSON.stringify({ immediate: true }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
    const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return new Response(JSON.stringify({ immediate: false, cancelAt: subscription.current_period_end }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
