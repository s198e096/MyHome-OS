// Receives Stripe events and keeps profiles.plan in sync with what the
// customer actually paid for. It also records one-time PDF report purchases
// (checkout sessions carrying `report_type` metadata) in report_purchases.
// Deploy: `supabase functions deploy stripe-webhook`.
// Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET secrets.
//
// After deploying, create a webhook endpoint in the Stripe dashboard
// pointing at this function's URL, listening for:
//   checkout.session.completed, customer.subscription.deleted
// and paste the resulting signing secret into STRIPE_WEBHOOK_SECRET.
//
// "Enforce JWT Verification" must be turned OFF - Stripe calls this
// endpoint directly and signs the request with STRIPE_WEBHOOK_SECRET
// instead of sending a Supabase auth header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const adminClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// How long a report purchase keeps working. Keep in step with
// REPORT_ACCESS_DAYS in the app (mobile/src/lib/reports/catalog.js), which
// words the screen.
const REPORT_ACCESS_DAYS = 30;

Deno.serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err instanceof Error ? err.message : err}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id || session.client_reference_id;
      const plan = session.metadata?.plan;
      const reportType = session.metadata?.report_type;
      if (reportType) {
        // A one-time PDF report, not a plan change. Only record it once the
        // payment has actually gone through. The unique stripe_session_id makes
        // a retried webhook harmless; a real failure throws so Stripe retries.
        if (userId && session.payment_status === "paid") {
          const purchasedAt = new Date();
          const expiresAt = new Date(purchasedAt.getTime() + REPORT_ACCESS_DAYS * 24 * 60 * 60 * 1000);
          const { error } = await adminClient.from("report_purchases").upsert(
            {
              user_id: userId,
              report_type: reportType,
              stripe_session_id: session.id,
              amount_cents: session.amount_total,
              purchased_at: purchasedAt.toISOString(),
              expires_at: expiresAt.toISOString(),
            },
            { onConflict: "stripe_session_id", ignoreDuplicates: true }
          );
          if (error) throw error;
        }
      } else if (userId && plan) {
        await adminClient
          .from("profiles")
          .update({
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : null,
          })
          .eq("user_id", userId);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.supabase_user_id;
      if (userId) {
        await adminClient
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("user_id", userId);
      } else {
        await adminClient
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("stripe_subscription_id", subscription.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
