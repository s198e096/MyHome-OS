// Permanently deletes the signed-in user's account and everything tied to it.
// Apps that let people create an account must let them delete it too (App
// Store rule), and a phone can't do it itself: removing a sign-in account
// needs the service role key, which must never ship inside the app.
// Deploy via the Supabase dashboard (Edge Functions -> Deploy a new function)
// or `supabase functions deploy delete-account`.
// Uses the STRIPE_SECRET_KEY secret (same one create-checkout-session uses).
//
// "Enforce JWT Verification" must be turned OFF for this function, for the
// same CORS-preflight reason documented in scan-system-label/index.ts. The
// caller is verified manually below instead.
//
// What happens, in this order (the irreversible step is last, so if anything
// before it fails nothing has been deleted and the user can simply retry):
//   1. Stripe: delete the user's Stripe customer, which also cancels any
//      subscription so they are never billed again. A customer Stripe doesn't
//      know (e.g. created under a different key) is skipped, not an error.
//   2. Storage: remove every file in the user's folder of the "photos" bucket
//      (photos, receipts, warranty documents, scanned manuals).
//   3. Auth: delete the user. Every table references auth.users with
//      `on delete cascade`, so this removes their profile, systems, tasks,
//      expenses, documents, warranties, furniture, problems, report purchases
//      and AI usage in one go.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "photos";
const PAGE = 100;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// Every file path under `prefix`, including files in subfolders. Storage
// returns folders as entries without an id.
// deno-lint-ignore no-explicit-any
async function listAllFiles(admin: any, prefix: string): Promise<string[]> {
  const files: string[] = [];
  const folders = [prefix];
  while (folders.length > 0) {
    const folder = folders.pop()!;
    let offset = 0;
    for (;;) {
      const { data, error } = await admin.storage.from(BUCKET).list(folder, { limit: PAGE, offset });
      if (error) throw new Error(`Couldn't list your files: ${error.message}`);
      if (!data || data.length === 0) break;
      for (const item of data) {
        if (item.id) files.push(`${folder}/${item.name}`);
        else folders.push(`${folder}/${item.name}`);
      }
      if (data.length < PAGE) break;
      offset += data.length;
    }
  }
  return files;
}

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
      return json({ error: "Unauthorized" }, 401);
    }

    // The app makes the user type "delete"; check it here too, so a stray or
    // scripted call to this endpoint can't wipe an account by accident.
    const { confirm } = await req.json().catch(() => ({}));
    if (typeof confirm !== "string" || confirm.trim().toLowerCase() !== "delete") {
      return json({ error: 'Type "delete" to confirm.' }, 400);
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Stripe
    const { data: profile } = await admin.from("profiles").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    const customerId = profile?.stripe_customer_id;
    if (customerId) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) {
        throw new Error("Billing isn't set up on the server, so your subscription can't be cancelled. Your account was not deleted.");
      }
      try {
        // Deleting a customer immediately cancels all of its subscriptions.
        await new Stripe(stripeKey).customers.del(customerId);
      } catch (err) {
        // Stripe has no such customer (already deleted, or from another
        // account/mode): there is nothing to cancel.
        if ((err as { code?: string })?.code !== "resource_missing") {
          throw new Error(
            `Couldn't cancel your subscription (${err instanceof Error ? err.message : "Stripe error"}). Your account was not deleted.`
          );
        }
      }
    }

    // 2. Uploaded files
    const paths = await listAllFiles(admin, user.id);
    for (let i = 0; i < paths.length; i += PAGE) {
      const { error } = await admin.storage.from(BUCKET).remove(paths.slice(i, i + PAGE));
      if (error) throw new Error(`Couldn't delete your files: ${error.message}. Your account was not deleted.`);
    }

    // 3. The account itself (and, by cascade, all of its data)
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw new Error(`Couldn't delete your account: ${deleteError.message}`);

    return json({ ok: true });
  } catch (err) {
    console.error("delete-account failed:", err instanceof Error ? err.stack || err.message : err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
