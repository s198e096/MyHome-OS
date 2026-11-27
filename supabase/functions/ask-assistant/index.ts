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
// Caps how many times this function will round-trip to Claude within one
// request to execute tool calls, so a model stuck repeatedly calling tools
// can't loop forever (and run up the bill) — it just falls back to
// whatever text it has after this many rounds.
const MAX_TOOL_ROUNDS = 5;

// Mirrors CATEGORY_META's keys in mobile/src/lib/constants.js (minus the
// bare "hvac" parent, which — same as the app's own "add a system" picker —
// is never a real system itself, only hvac_indoor/hvac_outdoor are) and
// RECURRENCE_OPTIONS's keys. Duplicated rather than imported since this
// Deno function can't import from the Expo app's bundle — same reason
// create-checkout-session duplicates the plan ids instead of importing
// them.
const VALID_SYSTEM_CATEGORIES = [
  "hvac_indoor", "hvac_outdoor", "water_heater", "roof", "plumbing", "toilet", "faucet", "sink",
  "electrical", "generator", "solar", "ev_charger", "appliance", "windows", "exterior",
  "garage_door", "gutters", "balcony", "deck", "garden",
];
const VALID_RECURRENCES = ["daily", "weekly", "monthly", "quarterly", "semiannually", "annually"];

// Tool definitions sent to Claude (Anthropic's tool-use format). Each one
// is a thin wrapper around a plain insert into the user's own systems/tasks
// — see executeTool below for what actually runs when Claude calls one.
const TOOLS = [
  {
    name: "add_system",
    description:
      "Adds a new system, appliance, or structure item to the user's home inventory. Call this only when the user explicitly asks to add/log/register one (e.g. \"add my HVAC\", \"I just got a new water heater\", \"add my fridge, it's a Whirlpool model ABC123\"). Ask a short clarifying question first instead of guessing if the category is unclear. Check the systems already listed in the home context first — if one that matches seems to already exist, confirm with the user rather than creating a duplicate.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: VALID_SYSTEM_CATEGORIES,
          description:
            "The kind of system. Use hvac_indoor/hvac_outdoor for HVAC components (never plain \"hvac\"), and \"appliance\" for any kitchen/laundry appliance (fridge, dishwasher, washer, dryer, microwave, etc.).",
        },
        brand: {
          type: "string",
          description:
            "For category \"appliance\", this is the appliance's own name/type (e.g. \"Refrigerator\", \"Dishwasher\") — not its manufacturer. For every other category, this is the manufacturer/brand name (e.g. \"Carrier\", \"Rheem\"). Omit if not given.",
        },
        model: { type: "string", description: "Model number, if given." },
        serial_number: { type: "string", description: "Serial number, if given." },
        location: { type: "string", description: "Where in or around the home it is (e.g. \"Basement\", \"Backyard\"), if given." },
      },
      required: ["category"],
    },
  },
  {
    name: "add_task",
    description:
      "Adds a maintenance or preventative-maintenance task/reminder, optionally tied to one of the user's existing systems. Call this only when the user explicitly asks to add, schedule, or remind them about one (e.g. \"remind me to change the HVAC filter every 3 months\", \"add a task to inspect the roof next spring\"). Resolve any relative date (\"next week\", \"in 3 months\") into an absolute date yourself using today's date from the home context above — never pass the relative phrase through. If nothing about timing is given at all, default to 14 days from today rather than asking. If the task is tied to one of the systems listed in the home context, pass that system's id exactly as given there.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short task title, e.g. \"Replace HVAC filter\"." },
        due_date: { type: "string", description: "The next (or only) due date, as YYYY-MM-DD." },
        system_id: {
          type: "string",
          description: "The id of the system this task belongs to, exactly as listed in the home context. Omit for a general household task not tied to one system.",
        },
        recurrence: { type: "string", enum: VALID_RECURRENCES, description: "How often it repeats. Omit for a one-time task." },
      },
      required: ["title", "due_date"],
    },
  },
];

// Runs one tool call Claude asked for, against the signed-in user's own
// data (via supabaseAuthed, so normal row-level security applies — same as
// every insert the app itself ever does). Never throws: a failure (bad
// input, the free-plan system-limit trigger, anything) comes back as
// `ok: false` with a plain-English message, which gets handed to Claude as
// the tool's result so it can explain the failure to the user in its own
// reply, instead of the whole request blowing up.
async function executeTool(
  name: string,
  input: Record<string, unknown>,
  // deno-lint-ignore no-explicit-any
  supabaseAuthed: any
): Promise<{ ok: boolean; message: string }> {
  try {
    if (name === "add_system") {
      const category = String(input.category || "");
      if (!VALID_SYSTEM_CATEGORIES.includes(category)) {
        return { ok: false, message: `"${category}" isn't a valid system category.` };
      }
      const { data, error } = await supabaseAuthed
        .from("systems")
        .insert({
          category,
          brand: input.brand ? String(input.brand) : null,
          model: input.model ? String(input.model) : null,
          serial_number: input.serial_number ? String(input.serial_number) : null,
          location: input.location ? String(input.location) : null,
        })
        .select()
        .single();
      if (error) return { ok: false, message: error.message };
      return { ok: true, message: `Added. New system id: ${data.id}, category: ${data.category}.` };
    }

    if (name === "add_task") {
      const title = String(input.title || "").trim();
      const dueDate = String(input.due_date || "").trim();
      if (!title || !dueDate) return { ok: false, message: "title and due_date are both required." };
      const recurrence = input.recurrence ? String(input.recurrence) : null;
      if (recurrence && !VALID_RECURRENCES.includes(recurrence)) {
        return { ok: false, message: `"${recurrence}" isn't a valid recurrence.` };
      }
      const { data, error } = await supabaseAuthed
        .from("tasks")
        .insert({
          title,
          due_date: dueDate,
          system_id: input.system_id ? String(input.system_id) : null,
          recurrence,
        })
        .select()
        .single();
      if (error) return { ok: false, message: error.message };
      return { ok: true, message: `Added. New task id: ${data.id}, due ${data.due_date}.` };
    }

    return { ok: false, message: `Unknown tool "${name}".` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Unknown error" };
  }
}

// `problems` and `completedTasks` are this one system's rows only (grouped
// by buildHomeContext below) — past problem reports and finished maintenance
// work, so the assistant has history the next time the user brings this
// system up, instead of starting from zero every conversation.
function describeSystem(s: Record<string, unknown>, problems: Record<string, unknown>[], completedTasks: Record<string, unknown>[]) {
  // The id is included so the add_task tool can be told exactly which
  // system a new task belongs to — see its description above.
  const parts = [`${s.brand || "Unknown brand"} ${s.model || ""}`.trim(), `id: ${s.id}`, `category: ${s.category}`];
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

  // The Free plan allows 10 questions per rolling 24 hours. The count lives in
  // the database (claim_ai_use, migration 0031) so it can't be bypassed from
  // the app; paid plans come back as unlimited. A use is claimed up front and
  // handed back below if the question then fails, so errors don't cost the
  // user one of their questions.
  // deno-lint-ignore no-explicit-any
  let admin: any = null;
  let claimId: string | null = null;

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

    admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: claim, error: claimError } = await admin.rpc("claim_ai_use", { p_user_id: user.id, p_kind: "chat" });
    if (claimError) throw new Error(`Could not check your plan: ${claimError.message}`);
    if (!claim.allowed) {
      return new Response(
        JSON.stringify({
          error: `You've used your ${claim.limit} free questions for today.`,
          code: "limit_reached",
          kind: "chat",
          limit: claim.limit,
          resetsAt: claim.resetsAt,
        }),
        { status: 429, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }
    claimId = claim.claimId ?? null;

    const [{ data: profile }, { data: systems }, { data: tasks }, { data: systemProblems }] = await Promise.all([
      supabaseAuthed.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabaseAuthed.from("systems").select("*").order("created_at", { ascending: true }),
      supabaseAuthed.from("tasks").select("*").order("due_date", { ascending: true }),
      supabaseAuthed.from("system_problems").select("*").order("created_at", { ascending: true }),
    ]);

    const homeContext = buildHomeContext(profile, systems || [], tasks || [], systemProblems || []);
    const systemPrompt = `You are the in-app assistant for MyHouse OS, a home-maintenance tracking app. Answer the user's question helpfully and concisely (2-4 sentences unless they ask for more detail), grounded in their actual home data below when relevant. If something isn't in their data, say so rather than guessing specifics about their property, and suggest they log it in the app if that would help. You can also answer general home-maintenance questions not tied to their specific data.

You can also act on their behalf with the add_system and add_task tools, when they explicitly ask you to add a system or a task/reminder — see each tool's own description for exactly when to use it and what it needs. Only call a tool once you actually have what it needs; ask one short clarifying question first if something required is missing or ambiguous, rather than guessing. After a tool call succeeds, briefly confirm what you added; if it fails, explain why in plain terms instead of retrying blindly.

Their home:
${homeContext}`;

    // deno-lint-ignore no-explicit-any
    let conversationMessages: any[] = messages.slice(-MAX_MESSAGES).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));
    const actionsPerformed: string[] = [];
    let reply = "";

    // Up to MAX_TOOL_ROUNDS round-trips that execute a requested tool and
    // feed its result back, plus one final call forced to stop there and
    // return whatever text it has — so `reply` is never left empty just
    // because the model still wanted one more tool call right at the cap.
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
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
          messages: conversationMessages,
          tools: TOOLS,
        }),
      });
      if (!resp.ok) throw new Error(`Anthropic API error: ${await resp.text()}`);
      const data = await resp.json();

      // deno-lint-ignore no-explicit-any
      const toolUseBlocks = (data.content || []).filter((c: any) => c.type === "tool_use");
      if (data.stop_reason !== "tool_use" || toolUseBlocks.length === 0 || round === MAX_TOOL_ROUNDS) {
        // deno-lint-ignore no-explicit-any
        const textBlock = (data.content || []).find((c: any) => c.type === "text");
        reply = textBlock?.text || "I couldn't come up with a response to that — try rephrasing?";
        break;
      }

      // Echo back Claude's own full turn (text + tool_use blocks together,
      // exactly as received) before appending the results it's waiting on.
      conversationMessages = [...conversationMessages, { role: "assistant", content: data.content }];
      const toolResults = [];
      for (const block of toolUseBlocks) {
        const result = await executeTool(block.name, block.input, supabaseAuthed);
        if (result.ok) actionsPerformed.push(block.name);
        toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result.message, is_error: !result.ok });
      }
      conversationMessages = [...conversationMessages, { role: "user", content: toolResults }];
    }

    return new Response(JSON.stringify({ reply, actionsPerformed }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    if (admin && claimId) await admin.from("ai_usage").delete().eq("id", claimId);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
