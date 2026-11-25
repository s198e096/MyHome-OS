// A tiny HTML landing page that Stripe Checkout/Billing Portal sessions
// redirect the user's browser to after they finish (or cancel). Stripe
// requires success_url/cancel_url/return_url to be real http(s) URLs — it
// rejects the app's own custom scheme (myhomeos://) outright — so this page
// exists purely to hand the browser something Stripe will accept, then
// bounce straight back into the app via that custom scheme itself.
// Deploy: `supabase functions deploy checkout-redirect`.
// "Enforce JWT Verification" must be turned OFF for this function, same as
// create-checkout-session — the user's browser hits this with no auth
// header at all.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status") === "cancel" ? "cancel" : "success";
  // Where the browser bounces back to — the app's own deep link
  // (Linking.createURL("/") on the client), passed through untouched.
  const appUrl = url.searchParams.get("appUrl") || "";

  const title = status === "success" ? "All set" : "Canceled";
  const message =
    status === "success"
      ? "You're all set — you can return to the app now."
      : "No changes were made — you can return to the app now.";

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; background: #F5F8F0; color: #16240F; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
      h1 { font-size: 20px; margin: 0 0 8px; }
      p { font-size: 14px; color: #5F5B50; margin: 0 0 20px; }
      a { color: white; background: #16240F; font-weight: 600; text-decoration: none; border-radius: 999px; padding: 12px 24px; display: inline-block; font-size: 14px; }
    </style>
    ${appUrl ? `<script>setTimeout(function () { window.location.href = ${JSON.stringify(appUrl)}; }, 600);</script>` : ""}
  </head>
  <body>
    <div>
      <h1>${title}</h1>
      <p>${message}</p>
      ${appUrl ? `<a href="${escapeHtml(appUrl)}">Return to the app</a>` : ""}
    </div>
  </body>
</html>`;

  return new Response(html, { headers: { ...CORS_HEADERS, "Content-Type": "text/html; charset=utf-8" } });
});
