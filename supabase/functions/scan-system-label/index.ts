// Reads a photo of a home system's nameplate/label and extracts brand, model,
// serial number, manufacture date and category using Claude's vision API,
// then makes a best-effort attempt to find the official PDF manual for that
// brand/model via Claude's web search tool and store a copy of it in this
// user's Storage folder. If no PDF can be downloaded, it falls back to a link
// to the manual's page on ManualsLib (link only — nothing is copied from that
// site; see findManualsLibLink). Deploy via the
// Supabase dashboard (Edge Functions -> Deploy a new function) or
// `supabase functions deploy scan-system-label`.
// Requires the ANTHROPIC_API_KEY secret to be set on the project.
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

const CATEGORIES = ["hvac_indoor", "hvac_outdoor", "water_heater", "roof", "plumbing", "electrical", "appliance"];

// The label's printed manufacture date, kept exactly as precise as the label
// states it: "YYYY-MM-DD", "YYYY-MM" or "YYYY". Anything else — an unparseable
// string, an impossible month/day, a year before 1950, or a date in the
// future (a misread) — becomes null so the app never pre-fills a bad date.
function normalizeManufactureDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const m = trimmed.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = m[2] ? Number(m[2]) : null;
  const day = m[3] ? Number(m[3]) : null;
  if (year < 1950) return null;
  if (month !== null && (month < 1 || month > 12)) return null;
  if (day !== null && (day < 1 || day > 31)) return null;
  const asDate = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  if (month !== null && day !== null && asDate.getUTCDate() !== day) return null; // e.g. Feb 30
  if (asDate.getTime() > Date.now()) return null;
  return trimmed;
}

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

// Best-effort: finds the official PDF manual for a brand/model via Claude's
// web search tool, downloads it, and stores a copy in this user's Storage
// folder. Returns null (never throws) if anything along the way fails, since
// this is a nice-to-have on top of the core label scan.
async function findAndStoreManual(
  anthropicKey: string,
  supabaseAuthed: ReturnType<typeof createClient>,
  userId: string,
  brand: string,
  model: string,
  category: string | null
) {
  try {
    const searchPrompt = `Find a direct URL to the official PDF owner's/user's manual for this exact product:
Brand: ${brand}
Model: ${model}
Category: ${category || "unknown"}

Search the web for it. Reply with ONLY the direct URL to a PDF file of the manual if you find one you are confident matches this exact brand and model. If you cannot find a direct PDF URL you are confident about, reply with exactly: NONE`;

    const searchData = await callClaude(anthropicKey, {
      model: "claude-sonnet-5",
      max_tokens: 1024,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
      messages: [{ role: "user", content: searchPrompt }],
    });

    const answer = extractText(searchData);
    const urlMatch = answer.match(/https?:\/\/\S+\.pdf/i);
    if (!urlMatch) return null;
    const sourceUrl = urlMatch[0].replace(/[)\].,]+$/, "");

    const pdfResp = await fetch(sourceUrl);
    if (!pdfResp.ok) return null;
    const contentType = pdfResp.headers.get("content-type") || "";
    if (!contentType.includes("pdf") && !sourceUrl.toLowerCase().endsWith(".pdf")) return null;

    const buffer = await pdfResp.arrayBuffer();
    const path = `${userId}/manuals/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabaseAuthed.storage
      .from("photos")
      .upload(path, buffer, { contentType: "application/pdf", cacheControl: "3600" });
    if (uploadError) return null;

    return supabaseAuthed.storage.from("photos").getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

// Pulls the one ManualsLib manual-page URL out of a search answer, or null.
// Only an individual manual page (/manual/<id>/<name>.html) counts — never a
// brand or product listing page — and any "?page=N" is dropped so the link
// opens the manual from its first page.
function extractManualsLibPage(text: string): string | null {
  const m = text.match(/https?:\/\/(?:www\.)?manualslib\.com\/manual\/(\d+)\/([A-Za-z0-9._%~-]+)\.html/i);
  return m ? `https://www.manualslib.com/manual/${m[1]}/${m[2]}.html` : null;
}

// Fallback for when no official PDF could be downloaded: asks Claude's web
// search tool (limited to manualslib.com) for the manual's page there and
// returns just that page's URL.
//
// Deliberately LINK-ONLY: this never fetches ManualsLib itself or stores a
// copy of anything from it. ManualsLib's robots.txt disallows automated
// access to its /download/ paths and its Terms of Use prohibit bots copying
// its content, so the user opens the page and downloads it themselves.
// Returns null (never throws) if anything fails — it's a nice-to-have.
async function findManualsLibLink(
  anthropicKey: string,
  brand: string,
  model: string,
  category: string | null
) {
  try {
    const searchPrompt = `Find the ManualsLib page for the owner's/user's manual (or, failing that, the installation manual) of this product:
Brand: ${brand}
Model: ${model}
Category: ${category || "unknown"}

Search manualslib.com. Reply with ONLY the URL of one specific manual page, which looks like https://www.manualslib.com/manual/<number>/<Name>.html. Pick the page for this exact model. If ManualsLib has no page for this exact model but has one for the same model that differs only by a trailing color, finish or revision code (for example MMV1174FZ vs MMV1174DS), pick that one. Do not return brand, product-line or category listing pages. If nothing matches this brand and model family, reply with exactly: NONE`;

    const searchData = await callClaude(anthropicKey, {
      model: "claude-sonnet-5",
      max_tokens: 1024,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 2, allowed_domains: ["manualslib.com"] }],
      messages: [{ role: "user", content: searchPrompt }],
    });

    return extractManualsLibPage(extractText(searchData));
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

    const { photoUrl } = await req.json();
    if (!photoUrl) {
      return new Response(JSON.stringify({ error: "photoUrl is required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    const imageResp = await fetch(photoUrl);
    if (!imageResp.ok) throw new Error("Could not fetch the photo");
    const mediaType = imageResp.headers.get("content-type") || "image/jpeg";
    console.log("photoUrl:", photoUrl, "| fetched content-type:", JSON.stringify(imageResp.headers.get("content-type")), "| using mediaType:", JSON.stringify(mediaType));
    const base64 = arrayBufferToBase64(await imageResp.arrayBuffer());

    const prompt = `You are reading a photo of a home system's nameplate/label (e.g. water heater, HVAC unit, appliance). Extract only what is actually visible on the label. Respond with ONLY a JSON object, no other text, in this exact shape:
{"brand": string or null, "model": string or null, "serialNumber": string or null, "manufactureDate": string or null, "category": one of ${JSON.stringify(CATEGORIES)} or null}

Rules:
- "brand" is the manufacturer name (e.g. "Rheem", "Carrier", "Whirlpool").
- "model" is the model number/name (often labeled "Model", "MOD", or "M/N").
- "serialNumber" is the serial number (often labeled "Serial", "S/N", or "SER") — distinct from the model number.
- "manufactureDate" is the date the unit was manufactured, ONLY if the label itself prints one (often labeled "Date of Manufacture", "Mfg. Date", "MFG", "MFD", "DOM", or "Manufactured"). Return it exactly as precise as the label states it: "YYYY-MM-DD" if a full date is printed, "YYYY-MM" if only a month and year are printed, or "YYYY" if only a year is printed. Expand two-digit years (e.g. "03/19" on a label means "2019-03"). Do NOT try to decode a date hidden inside the serial number, and do not use a certification/UL date, a warranty date, or an installation date. If you are not sure which date it is, or a numeric date could be read two ways (day/month vs. month/day), use null.
- "category" is your best guess at which listed category this system belongs to. For HVAC equipment, pick "hvac_outdoor" if it's the outdoor condenser/compressor unit (sits outside, has a large fan), or "hvac_indoor" if it's the indoor evaporator coil / air handler / furnace (sits in a closet, attic, or basement). Use null if you cannot tell.
- If a field isn't visible or legible, use null for it. Do not guess or invent values.`;

    const aiData = await callClaude(anthropicKey, {
      model: "claude-sonnet-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    });

    const textBlock = (aiData.content || []).find((c: { type: string }) => c.type === "text");
    if (!textBlock) throw new Error("No response from AI");

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      const match = textBlock.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Could not parse AI response");
      parsed = JSON.parse(match[0]);
    }

    const result = {
      brand: typeof parsed.brand === "string" ? parsed.brand : null,
      model: typeof parsed.model === "string" ? parsed.model : null,
      serialNumber: typeof parsed.serialNumber === "string" ? parsed.serialNumber : null,
      manufactureDate: normalizeManufactureDate(parsed.manufactureDate),
      category: CATEGORIES.includes(parsed.category) ? parsed.category : null,
    };

    let manualUrl = null;
    if (result.brand && result.model) {
      manualUrl = await findAndStoreManual(anthropicKey, supabaseAuthed, user.id, result.brand, result.model, result.category);
      // No official PDF we could download: fall back to a link to the
      // manual's page on ManualsLib (the user opens it themselves).
      if (!manualUrl) {
        manualUrl = await findManualsLibLink(anthropicKey, result.brand, result.model, result.category);
      }
    }

    return new Response(JSON.stringify({ ...result, manualUrl }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scan-system-label failed:", err instanceof Error ? err.stack || err.message : err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
