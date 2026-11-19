// Called from the "Set a new password" screen (the password-recovery flow)
// before calling supabase.auth.updateUser(), so re-submitting the account's
// current password gets a clear "can't reuse your old password" message
// instead of silently succeeding — updateUser() has no built-in check for
// this.
// Deploy: `supabase functions deploy check-password-reuse`.
//
// "Enforce JWT Verification" must be turned OFF for this function, for the
// same reason documented in ask-assistant/index.ts: Supabase's gateway
// checks the JWT on the CORS preflight (OPTIONS) request too, and browsers
// never send auth headers on preflight — that would reject the preflight
// before this code ever runs. The caller's identity is verified manually
// below instead, using the SUPABASE_URL / SUPABASE_ANON_KEY Supabase
// automatically injects into every function.
//
// Compares the proposed password against auth.users.encrypted_password (a
// bcrypt hash, confirmed live: "$2a$10$...") via Postgres's own pgcrypto
// crypt() function — the same mechanism GoTrue itself uses to hash
// passwords — so the plaintext never needs to be decrypted or stored
// anywhere to check it. Uses a direct Postgres connection (SUPABASE_DB_URL)
// rather than supabase-js/PostgREST: the auth schema isn't exposed via
// PostgREST at all, even to the service role.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const supabaseAuthed = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuthed.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { password } = await req.json();
    if (!password) {
      return new Response(JSON.stringify({ error: "password is required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const connection = await pool.connect();
    try {
      const result = await connection.queryObject<{ matches: boolean | null }>`
        select (encrypted_password = crypt(${String(password)}, encrypted_password)) as matches
        from auth.users
        where id = ${user.id}
      `;
      const sameAsOld = result.rows[0]?.matches === true;
      return new Response(JSON.stringify({ sameAsOld }), {
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
