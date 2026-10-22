// Reads photo(s) of a receipt and/or warranty certificate — each can be
// multiple pages — and extracts the purchase date and every distinct
// warranty coverage stated (e.g. "Parts" vs. "Labor" vs. "Compressor" on an
// HVAC warranty card) using Claude's vision API. If no warranty info is
// found on either document at all, falls back to a best-effort web search
// for the manufacturer's typical warranty period — returned as a single
// warranty entry flagged `estimated: true`, since it's a guess from the
// internet rather than something the user's own documents actually say.
// Deploy via the Supabase dashboard (Edge Functions -> Deploy a new
// function) or `supabase functions deploy scan-warranty-docs`.
// Requires the ANTHROPIC_API_KEY secret to be set on the project (same one
// scan-system-label uses).
//
// "Enforce JWT Verification" must be turned OFF for this function, for the
// same CORS-preflight reason documented in scan-system-label/index.ts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function callClaude(anthropicKey: string, body: Record<string, unknown>) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Anthropic API error: ${await resp.text()}`);
  return resp.json();
}

function extractText(data: { content?: { type: string; text?: string }[] }) {
  return (data.content || [])
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text)
    .join(" ")
    .trim();
}

function parseJsonObject(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse AI response");
    return JSON.parse(match[0]);
  }
}

async function fetchAsImageBlock(url: string) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Could not fetch a document photo");
  const mediaType = resp.headers.get("content-type") || "image/jpeg";
  const base64 = arrayBufferToBase64(await resp.arrayBuffer());
  return { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };
}

// Simple UTC month-add — the dates involved are calendar dates (no time
// component), so UTC avoids any local-timezone day-shift surprises.
function addMonths(dateStr: string, months: number): string | null {
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (isNaN(d.getTime())) return null;
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

// Best-effort: web-searches for the manufacturer's typical warranty length
// for this brand/model. Returns null (never throws) on any failure, since
// this is a fallback on top of the core document scan, not a hard
// requirement.
async function estimateWarrantyMonths(anthropicKey: string, brand: string, model: string, category: string | null) {
  try {
    const prompt = `Search the web for the manufacturer's standard/typical warranty period for this exact product:
Brand: ${brand}
Model: ${model}
Category: ${category || "unknown"}

Reply with ONLY a JSON object, no other text: {"warrantyDurationMonths": number or null}
If multiple warranty tiers exist (e.g. parts vs. labor), use the longest one commonly advertised. Use null if you cannot find a specific, confident answer for this exact brand and model — do not guess.`;

    const searchData = await callClaude(anthropicKey, {
      model: "claude-sonnet-5",
      max_tokens: 300,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
      messages: [{ role: "user", content: prompt }],
    });

    const parsed = parseJsonObject(extractText(searchData));
    const months = Number(parsed.warrantyDurationMonths);
    return Number.isFinite(months) && months > 0 ? Math.round(months) : null;
  } catch {
    return null;
  }
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const { receiptPhotoUrls, warrantyPhotoUrls, brand, model, category, purchaseDate: givenPurchaseDate } = await req.json();
    const receiptUrls: string[] = Array.isArray(receiptPhotoUrls) ? receiptPhotoUrls : [];
    const warrantyUrls: string[] = Array.isArray(warrantyPhotoUrls) ? warrantyPhotoUrls : [];
    if (receiptUrls.length === 0 && warrantyUrls.length === 0) {
      return new Response(JSON.stringify({ error: "receiptPhotoUrls or warrantyPhotoUrls is required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    const images = [];
    for (const url of receiptUrls) images.push(await fetchAsImageBlock(url));
    for (const url of warrantyUrls) images.push(await fetchAsImageBlock(url));

    const pageWord = (n: number) => (n === 1 ? "page" : "pages");
    const docsDescription =
      receiptUrls.length && warrantyUrls.length
        ? `a purchase receipt (first ${receiptUrls.length} ${pageWord(receiptUrls.length)}) and a warranty certificate (remaining ${warrantyUrls.length} ${pageWord(warrantyUrls.length)})`
        : receiptUrls.length
          ? `a purchase receipt (${receiptUrls.length} ${pageWord(receiptUrls.length)})`
          : `a warranty certificate (${warrantyUrls.length} ${pageWord(warrantyUrls.length)})`;

    const prompt = `You are reading photo(s) of ${docsDescription} for a home system or appliance. Extract only what is actually legible. Respond with ONLY a JSON object, no other text, in this exact shape:
{"purchaseDate": string or null, "purchasePrice": number or null, "warranties": [{"type": string, "expirationDate": string or null, "durationMonths": number or null, "startDate": string or null}]}

Rules:
- "purchaseDate": the date of purchase/sale shown on the receipt, as YYYY-MM-DD. Null if not visible.
- "purchasePrice": the final total amount paid shown on the receipt (including tax, if itemized separately from the subtotal) — a plain number, no currency symbol or commas (e.g. 429.99). Use the overall receipt total, not an individual line item, unless the receipt is only for this single item. Null if not visible.
- "warranties": one array entry per DISTINCT warranty coverage mentioned anywhere in the document(s) — e.g. a card listing "5 Year Parts / 1 Year Labor" is TWO entries, not one. If only one undifferentiated warranty is stated, that's a single entry. If no warranty is mentioned at all, use an empty array.
- Each entry's "type" is a short label for that specific coverage (e.g. "Parts", "Labor", "Compressor", "Manufacturer", "Extended", or "Standard" if the document doesn't name it).
- Each entry's "expirationDate": an absolute date that coverage expires, as YYYY-MM-DD, ONLY if explicitly printed. Null otherwise.
- Each entry's "durationMonths": if a LENGTH is stated for that coverage (e.g. "5 years", "90 days", "12 months") but no absolute expiration date is printed for it, convert it to a whole number of months. Null otherwise.
- Each entry's "startDate": the date that coverage begins, as YYYY-MM-DD, only if stated and different from the purchase date. Null otherwise.
- Do not guess or invent values — omit a field (use null) rather than estimate anything not clearly legible.`;

    const aiData = await callClaude(anthropicKey, {
      model: "claude-sonnet-5",
      max_tokens: 600,
      messages: [{ role: "user", content: [...images, { type: "text", text: prompt }] }],
    });

    const textBlock = (aiData.content || []).find((c: { type: string }) => c.type === "text");
    if (!textBlock) throw new Error("No response from AI");
    const parsed = parseJsonObject(textBlock.text);

    const purchaseDate = typeof parsed.purchaseDate === "string" ? parsed.purchaseDate : null;
    const purchasePriceNum = Number(parsed.purchasePrice);
    const purchasePrice = Number.isFinite(purchasePriceNum) && purchasePriceNum > 0 ? purchasePriceNum : null;
    const rawWarranties = Array.isArray(parsed.warranties) ? parsed.warranties : [];

    type WarrantyEntry = { type: string; expirationDate: string; estimated: boolean; durationMonths?: number };
    const warranties: WarrantyEntry[] = [];
    for (const w of rawWarranties as Record<string, unknown>[]) {
      const type = typeof w.type === "string" && w.type.trim() ? w.type.trim() : "Standard";
      const durationMonths = Number.isFinite(Number(w.durationMonths)) ? Math.round(Number(w.durationMonths)) : null;
      const startDate = typeof w.startDate === "string" ? w.startDate : null;
      let expirationDate = typeof w.expirationDate === "string" ? w.expirationDate : null;
      if (!expirationDate && durationMonths) {
        const base = startDate || purchaseDate || givenPurchaseDate || null;
        if (base) expirationDate = addMonths(base, durationMonths);
      }
      if (expirationDate) warranties.push({ type, expirationDate, estimated: false });
    }

    // No warranty info found on either document at all — fall back to a
    // web-search estimate of this product's typical warranty length, if we
    // know what it is. Always flagged `estimated: true` so callers never
    // mistake a guess for something the documents actually said.
    if (warranties.length === 0 && brand && model) {
      const months = await estimateWarrantyMonths(anthropicKey, brand, model, category || null);
      const base = purchaseDate || givenPurchaseDate || null;
      const estimatedExpiration = months && base ? addMonths(base, months) : null;
      if (estimatedExpiration) {
        warranties.push({ type: "Estimated", expirationDate: estimatedExpiration, durationMonths: months, estimated: true });
      }
    }

    return new Response(JSON.stringify({ purchaseDate, purchasePrice, warranties }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scan-warranty-docs failed:", err instanceof Error ? err.stack || err.message : err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
