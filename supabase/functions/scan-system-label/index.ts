// Reads a photo of a home system's nameplate/label and extracts brand, model,
// and category using Claude's vision API. Deploy via the Supabase dashboard
// (Edge Functions -> Deploy a new function) or `supabase functions deploy scan-system-label`.
// Requires the ANTHROPIC_API_KEY secret to be set on the project.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = ["hvac", "water_heater", "roof", "plumbing", "electrical", "appliance"];

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
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
    const base64 = arrayBufferToBase64(await imageResp.arrayBuffer());

    const prompt = `You are reading a photo of a home system's nameplate/label (e.g. water heater, HVAC unit, appliance). Extract only what is actually visible on the label. Respond with ONLY a JSON object, no other text, in this exact shape:
{"brand": string or null, "model": string or null, "category": one of ${JSON.stringify(CATEGORIES)} or null}

Rules:
- "brand" is the manufacturer name (e.g. "Rheem", "Carrier", "Whirlpool").
- "model" is the model number/name, not the serial number.
- "category" is your best guess at which listed category this system belongs to, based on the label and the type of appliance shown. Use null if you cannot tell.
- If a field isn't visible or legible, use null for it. Do not guess or invent values.`;

    const aiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
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
      }),
    });

    if (!aiResp.ok) {
      throw new Error(`Anthropic API error: ${await aiResp.text()}`);
    }

    const aiData = await aiResp.json();
    const textBlock = aiData.content?.find((c: { type: string }) => c.type === "text");
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
      category: CATEGORIES.includes(parsed.category) ? parsed.category : null,
    };

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
