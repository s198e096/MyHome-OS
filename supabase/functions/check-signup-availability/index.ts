// Checked by the sign-up form before calling supabase.auth.signUp(), so a
// duplicate email or phone number gets a clear message instead of either a
// silent "check your email" (Supabase's signUp() deliberately doesn't reveal
// whether an email is already registered, to avoid account enumeration —
// but this app's product choice is to tell the user directly) or firing off
// a confirmation email for an email that already has an account.
// Deploy: `supabase functions deploy check-signup-availability --no-verify-jwt`.
//
// Queries auth.users directly over a raw Postgres connection (SUPABASE_DB_URL)
// rather than through supabase-js/PostgREST: the auth schema isn't exposed
// via PostgREST at all, even to the service role, so a `.schema("auth")`
// call silently returns no rows instead of erroring — this avoids that trap.
//
// "Enforce JWT Verification" must be turned OFF for this function: it's
// called before the user has any session (mid sign-up), so there's no user
// JWT to verify, and Supabase's gateway checks the JWT on the CORS preflight
// (OPTIONS) request too, which never carries one.

import { Pool } from "jsr:@db/postgres@^0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const pool = new Pool(Deno.env.get("SUPABASE_DB_URL")!, 1);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const { email, phone } = await req.json();
    if (!email && !phone) {
      return new Response(JSON.stringify({ error: "email or phone is required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const connection = await pool.connect();
    try {
      let emailTaken = false;
      if (email) {
        const result = await connection.queryObject`
          select 1 from auth.users where lower(email) = lower(${String(email).trim()}) limit 1
        `;
        emailTaken = result.rows.length > 0;
      }

      let phoneTaken = false;
      if (phone) {
        // Phone numbers aren't stored in any consistent format (nothing
        // enforces one at sign-up), so "555-123-4567" and "(555) 123-4567"
        // are the same number but wouldn't match as plain strings — compare
        // digits-only on both sides instead.
        //
        // Checks auth.users' raw_user_meta_data (set directly by signUp()'s
        // options.data, so it's always present) rather than profiles.phone:
        // a separate bug currently leaves profiles.phone null for every
        // signup, so that column alone would never catch a real duplicate.
        //
        // Uses the bracket class '[^0-9]' rather than the '\D' shorthand —
        // verified live that this driver's tagged-template query builder
        // mangles a literal backslash in the SQL text, so '\D' silently
        // matched nothing and regexp_replace left the phone unchanged
        // (confirmed: normalizing "+19132379900" with '\D' returned
        // "+19132379900" untouched, while '[^0-9]' correctly returned
        // "19132379900"). The bracket form has no backslash, so it isn't
        // affected.
        const digitsOnly = String(phone).replace(/\D/g, "");
        const usersResult = await connection.queryObject`
          select 1 from auth.users
          where regexp_replace(raw_user_meta_data->>'phone', '[^0-9]', '', 'g') = ${digitsOnly}
          limit 1
        `;
        const profilesResult = await connection.queryObject`
          select 1 from public.profiles
          where phone is not null and regexp_replace(phone, '[^0-9]', '', 'g') = ${digitsOnly}
          limit 1
        `;
        phoneTaken = usersResult.rows.length > 0 || profilesResult.rows.length > 0;
      }

      return new Response(JSON.stringify({ emailTaken, phoneTaken }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    } finally {
      connection.release();
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
