// Monthly job: re-pulls each account's home value estimate from RentCast and
// updates their profile, so the value stays current instead of being frozen
// at whatever it was when the user signed up. Triggered by the pg_cron
// schedule in migrations/0014_property_value_refresh.sql — not meant to be
// called by the app directly, so "Enforce JWT Verification" should stay ON
// and the cron job authenticates with the service role key.
// Requires the RENTCAST_API_KEY secret (already set for property-lookup).
//
// If the user has manually overridden the value (property_value_source =
// 'Manual'), the new estimate is parked in property_value_pending instead of
// applied directly — the app prompts the user to keep their number or accept
// the refresh (see migrations/0015_property_value_pending.sql).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (_req) => {
  try {
    const rentcastKey = Deno.env.get("RENTCAST_API_KEY");
    if (!rentcastKey) throw new Error("RENTCAST_API_KEY is not configured");

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, address, property_value, property_value_source")
      .neq("address", "");
    if (error) throw error;

    const headers = { Accept: "application/json", "X-Api-Key": rentcastKey };
    let updated = 0;
    let pending = 0;
    let failed = 0;
    let skipped = 0;

    for (const profile of profiles ?? []) {
      const address = profile.address?.trim();
      if (!address) {
        skipped++;
        continue;
      }

      try {
        const resp = await fetch(`https://api.rentcast.io/v1/avm/value?address=${encodeURIComponent(address)}`, { headers });
        const price = resp.ok ? (await resp.json())?.price ?? null : null;
        if (price == null) {
          skipped++;
          continue;
        }

        if (profile.property_value_source === "Manual") {
          if (price !== profile.property_value) {
            await supabaseAdmin
              .from("profiles")
              .update({ property_value_pending: price, property_value_pending_fetched_at: new Date().toISOString() })
              .eq("user_id", profile.user_id);
            pending++;
          } else {
            skipped++;
          }
        } else {
          await supabaseAdmin
            .from("profiles")
            .update({
              property_value: price,
              property_value_source: "RentCast",
              property_value_updated_at: new Date().toISOString(),
            })
            .eq("user_id", profile.user_id);
          updated++;
        }

        // Keep the shared address lookup cache (used by onboarding) in sync
        // too, since it never expires on its own.
        const cacheKey = address.toLowerCase();
        const { data: cached } = await supabaseAdmin
          .from("property_lookup_cache")
          .select("response")
          .eq("address", cacheKey)
          .maybeSingle();
        if (cached) {
          await supabaseAdmin
            .from("property_lookup_cache")
            .upsert({ address: cacheKey, response: { ...cached.response, marketValue: price } });
        }
      } catch {
        failed++;
      }
    }

    return new Response(JSON.stringify({ updated, pending, failed, skipped }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
