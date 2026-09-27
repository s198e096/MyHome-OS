// Looks up public-record property details (bedrooms, year built, last sale
// price) and a current value estimate for an address via RentCast. Keeps the
// RentCast API key server-side, since (unlike the Mapbox/Supabase keys used
// elsewhere in the app) it's a private account key, not a public/publishable
// one. Deploy via the Supabase dashboard (Edge Functions -> Deploy a new
// function) or `supabase functions deploy property-lookup`.
// Requires the RENTCAST_API_KEY secret to be set on the project.
//
// "Enforce JWT Verification" must be turned OFF for this function, since
// Supabase's gateway checks the JWT on the CORS preflight (OPTIONS) request
// too, and browsers never send auth headers on preflight - that check would
// reject the preflight before this code ever runs. Instead, the caller's
// identity is verified manually below using the SUPABASE_URL /
// SUPABASE_ANON_KEY that Supabase automatically injects into every function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseAuthed = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user }, error: authError } = await supabaseAuthed.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { address } = await req.json();
    if (!address) {
      return new Response(JSON.stringify({ error: "address is required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }
    const cacheKey = address.trim().toLowerCase();

    // Service-role client (not the per-user authed one above) for the shared
    // lookup cache, since it isn't per-user data and has no RLS policy for
    // ordinary clients to use.
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: cached } = await supabaseAdmin
      .from("property_lookup_cache")
      .select("response")
      .eq("address", cacheKey)
      .maybeSingle();
    if (cached) {
      return new Response(JSON.stringify(cached.response), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const rentcastKey = Deno.env.get("RENTCAST_API_KEY");
    if (!rentcastKey) throw new Error("RENTCAST_API_KEY is not configured");

    const headers = { Accept: "application/json", "X-Api-Key": rentcastKey };
    const query = encodeURIComponent(address);

    const [recordResp, valueResp] = await Promise.allSettled([
      fetch(`https://api.rentcast.io/v1/properties?address=${query}`, { headers }).then((r) => (r.ok ? r.json() : [])),
      fetch(`https://api.rentcast.io/v1/avm/value?address=${query}`, { headers }).then((r) => (r.ok ? r.json() : null)),
    ]);

    const record = recordResp.status === "fulfilled" ? recordResp.value?.[0] : null;
    const value = valueResp.status === "fulfilled" ? valueResp.value : null;

    const features = record?.features ?? {};

    const result = {
      bedrooms: record?.bedrooms ?? null,
      yearBuilt: record?.yearBuilt ?? null,
      purchasePrice: record?.lastSalePrice ?? null,
      marketValue: value?.price ?? null,
      bathrooms: record?.bathrooms ?? null,
      squareFootage: record?.squareFootage ?? null,
      lotSize: record?.lotSize ?? null,
      propertyType: record?.propertyType ?? null,
      roomCount: features.roomCount ?? null,
      floorCount: features.floorCount ?? null,
      roofType: features.roofType ?? null,
      heatingType: features.heatingType ?? null,
      coolingType: features.coolingType ?? null,
      foundationType: features.foundationType ?? null,
      exteriorType: features.exteriorType ?? null,
      architectureType: features.architectureType ?? null,
      hasGarage: features.garage ?? null,
      garageType: features.garageType ?? null,
      garageSpaces: features.garageSpaces ?? null,
      hasPool: features.pool ?? null,
      poolType: features.poolType ?? null,
      hasFireplace: features.fireplace ?? null,
      fireplaceType: features.fireplaceType ?? null,
      hoaFee: record?.hoa?.fee ?? null,
    };

    await supabaseAdmin.from("property_lookup_cache").upsert({ address: cacheKey, response: result });

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
