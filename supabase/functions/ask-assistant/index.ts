// Powers the "Ask Anything" button on Home: a conversational assistant that
// answers questions grounded in the user's actual home data (their systems,
// property details, and upcoming tasks), using the same Claude API already
// used for the system-label photo scan. Deploy via the Supabase dashboard
// (Edge Functions -> Deploy a new function) or
// `supabase functions deploy ask-assistant`.
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

const MAX_MESSAGES = 20;

// `problems` and `completedTasks` are this one system's rows only (grouped
// by buildHomeContext below) — past problem reports and finished maintenance
// work, so the assistant has history the next time the user brings this
// system up, instead of starting from zero every conversation.
function describeSystem(s: Record<string, unknown>, problems: Record<string, unknown>[], completedTasks: Record<string, unknown>[]) {
  const parts = [`${s.brand || "Unknown brand"} ${s.model || ""}`.trim(), `category: ${s.category}`];
  if (s.location) parts.push(`location: ${s.location}`);
  if (s.purchase_date) parts.push(`installed: ${s.purchase_date}`);
  if (s.expected_life_years) parts.push(`expected life: ${s.expected_life_years} years`);
  if (s.replacement_cost) parts.push(`est. replacement cost: $${s.replacement_cost}`);
  if (s.warranty_expiration) parts.push(`warranty until: ${s.warranty_expiration}`);
  if (s.filter_size) parts.push(`filter size: ${s.filter_size}`);
  let line = `- ${parts.join(", ")}`;
  if (problems.length) {
    line += `\n  Reported problems (${problems.length}): ${problems
      .map((p) => `"${p.description}"${p.created_at ? ` (${String(p.created_at).slice(0, 10)})` : ""}`)
      .join("; ")}`;
  }
  if (completedTasks.length) {
    line += `\n  Completed maintenance: ${completedTasks
      .map((t) => `${t.title}${t.completed_date ? ` (${t.completed_date})` : ""}`)
      .join("; ")}`;
  }
  return line;
}

function buildHomeContext(
  profile: Record<string, unknown> | null,
  systems: Record<string, unknown>[],
  tasks: Record<string, unknown>[],
  systemProblems: Record<string, unknown>[]
) {
  const lines: string[] = [];
  // Overdue/upcoming is computed here, not left for the model to work out —
  // an LLM has no reliable notion of "today" (it isn't told, and would
  // otherwise guess from training data), so without this every open task
  // just got lumped under "Upcoming tasks" regardless of its due date,
  // making overdue ones invisible to questions like "what's overdue?".
  const today = new Date().toISOString().slice(0, 10);
  lines.push(`Today's date: ${today}`);

  if (profile) {
    lines.push(`Property: ${profile.property_name || "Unnamed"} at ${profile.address || "address not set"}`);
    const specs = [
      profile.bedrooms && `${profile.bedrooms} bed`,
      profile.bathrooms && `${profile.bathrooms} bath`,
      profile.square_footage && `${profile.square_footage} sqft`,
      profile.lot_size && `${profile.lot_size} sqft lot`,
      profile.year_built && `built ${profile.year_built}`,
      profile.property_type,
    ].filter(Boolean);
    if (specs.length) lines.push(`Specs: ${specs.join(", ")}`);
    const features = [
      profile.roof_type && `${profile.roof_type} roof`,
      profile.heating_type && `${profile.heating_type} heating`,
      profile.cooling_type && `${profile.cooling_type} cooling`,
      profile.foundation_type && `${profile.foundation_type} foundation`,
      profile.has_garage && "garage",
      profile.has_pool && "pool",
      profile.has_fireplace && "fireplace",
    ].filter(Boolean);
    if (features.length) lines.push(`Features: ${features.join(", ")}`);
    if (profile.property_value) lines.push(`Estimated value: $${profile.property_value}`);
  }

  const problemsBySystem = new Map<string, Record<string, unknown>[]>();
  for (const p of systemProblems) {
    const key = String(p.system_id);
    (problemsBySystem.get(key) || problemsBySystem.set(key, []).get(key)!).push(p);
  }
  const completedBySystem = new Map<string, Record<string, unknown>[]>();
  for (const t of tasks) {
    if (!t.completed || !t.system_id) continue;
    const key = String(t.system_id);
    (completedBySystem.get(key) || completedBySystem.set(key, []).get(key)!).push(t);
  }

  lines.push(
    systems.length
      ? `\nSystems (${systems.length}):\n${systems
          .map((s) => describeSystem(s, problemsBySystem.get(String(s.id)) || [], completedBySystem.get(String(s.id)) || []))
          .join("\n")}`
      : "\nNo systems logged yet."
  );

  const openTasks = tasks.filter((t) => !t.completed);
  // String comparison works here since due_date is a plain "YYYY-MM-DD".
  const overdueTasks = openTasks.filter((t) => typeof t.due_date === "string" && t.due_date < today);
  const upcomingTasks = openTasks.filter((t) => !(typeof t.due_date === "string" && t.due_date < today));

  lines.push(
    overdueTasks.length
      ? `\nOverdue tasks (${overdueTasks.length}):\n${overdueTasks.map((t) => `- ${t.title} (was due ${t.due_date})`).join("\n")}`
      : "\nNo overdue tasks."
  );
  lines.push(
    upcomingTasks.length
      ? `\nUpcoming tasks:\n${upcomingTasks.map((t) => `- ${t.title}${t.due_date ? ` (due ${t.due_date})` : ""}`).join("\n")}`
      : "\nNo other upcoming tasks."
  );

  return lines.join("\n");
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

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages is required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY is not configured");

    const [{ data: profile }, { data: systems }, { data: tasks }, { data: systemProblems }] = await Promise.all([
      supabaseAuthed.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabaseAuthed.from("systems").select("*").order("created_at", { ascending: true }),
      supabaseAuthed.from("tasks").select("*").order("due_date", { ascending: true }),
      supabaseAuthed.from("system_problems").select("*").order("created_at", { ascending: true }),
    ]);

    const homeContext = buildHomeContext(profile, systems || [], tasks || [], systemProblems || []);
    const systemPrompt = `You are the in-app assistant for MyHome OS, a home-maintenance tracking app. Answer the user's question helpfully and concisely (2-4 sentences unless they ask for more detail), grounded in their actual home data below when relevant. If something isn't in their data, say so rather than guessing specifics about their property, and suggest they log it in the app if that would help. You can also answer general home-maintenance questions not tied to their specific data.

Their home:
${homeContext}`;

    const trimmedMessages = messages.slice(-MAX_MESSAGES).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        system: systemPrompt,
        messages: trimmedMessages,
      }),
    });
    if (!resp.ok) throw new Error(`Anthropic API error: ${await resp.text()}`);
    const data = await resp.json();

    const textBlock = (data.content || []).find((c: { type: string }) => c.type === "text");
    const reply = textBlock?.text || "I couldn't come up with a response to that — try rephrasing?";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
