// A remote MCP (Model Context Protocol) server, so the user can add
// MyHouse OS as a Custom Connector in claude.ai itself and have Claude
// list their systems and add systems/tasks straight from a normal chat,
// outside the app entirely. Deploy via
// `supabase functions deploy mcp-server --no-verify-jwt`.
//
// "Enforce JWT Verification" must be OFF for this function (same reason as
// ask-assistant/checkout-redirect/cancel-subscription) — the bearer token
// checked below is this function's own fixed-credential scheme, not a
// Supabase Auth JWT, so the gateway's JWT check would reject every request
// before this code ever ran.
//
// Auth model: this is a *personal* connector for exactly one MyHouse OS
// account, not a multi-tenant integration — so a single long-lived bearer
// token (MCP_ACCESS_TOKEN secret) mapped to one fixed user id
// (MCP_USER_ID secret) is used instead of implementing a full OAuth 2.1
// authorization server. claude.ai's own "Add custom connector" flow
// supports this directly via its "Request Headers" option (fixed
// Authorization header), so no OAuth dance is required on either side.
// Every insert runs through the service-role client with that fixed
// user_id attached explicitly, since there's no end-user session here.
//
// Transport: Streamable HTTP, stateless variant (MCP spec 2025-06-18) —
// one POST per JSON-RPC message, plain JSON responses (no SSE, no
// Mcp-Session-Id) since none of these tools need server-initiated
// messages or state across calls.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-protocol-version",
};

const PROTOCOL_VERSION = "2025-06-18";

// Same lists as ask-assistant/index.ts — duplicated for the same reason
// (this Deno function can't import from the Expo app's bundle).
const VALID_SYSTEM_CATEGORIES = [
  "hvac_indoor", "hvac_outdoor", "water_heater", "roof", "plumbing", "toilet", "faucet", "sink",
  "electrical", "generator", "solar", "ev_charger", "appliance", "windows", "exterior",
  "garage_door", "gutters", "balcony", "deck", "garden",
];
const VALID_RECURRENCES = ["daily", "weekly", "monthly", "quarterly", "semiannually", "annually"];

// MCP's Tool shape uses "inputSchema" (camelCase) — distinct from the
// Anthropic Messages API's "input_schema" used in ask-assistant, even
// though these three tools are conceptually the same add_system/add_task
// pair plus one new read-only tool: without a way to list existing
// systems, Claude would have no way to learn a real system's id to link a
// new task to it in this context (unlike the in-app assistant, which
// already has the full systems list in its system prompt).
const TOOLS = [
  {
    name: "list_systems",
    description: "Lists the user's home systems, appliances, and structure items, including each one's id, category, brand/model, and location. Call this before add_task when the user refers to an existing system by name (e.g. \"remind me to service my HVAC\") so you can pass the correct system_id.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "add_system",
    description:
      "Adds a new system, appliance, or structure item to the user's home inventory. Call this only when the user explicitly asks to add/log/register one. Ask a short clarifying question first instead of guessing if the category is unclear. Call list_systems first if you're unsure whether a matching one already exists, to avoid creating a duplicate.",
    inputSchema: {
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
      "Adds a maintenance or preventative-maintenance task/reminder, optionally tied to one of the user's existing systems. Call this only when the user explicitly asks to add, schedule, or remind them about one. Resolve any relative date (\"next week\", \"in 3 months\") into an absolute date yourself using today's actual date — never pass the relative phrase through. If nothing about timing is given at all, default to 14 days from today rather than asking. If the task is tied to an existing system, call list_systems first and pass that system's exact id as system_id.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short task title, e.g. \"Replace HVAC filter\"." },
        due_date: { type: "string", description: "The next (or only) due date, as YYYY-MM-DD." },
        system_id: {
          type: "string",
          description: "The id of the system this task belongs to, from list_systems. Omit for a general household task not tied to one system.",
        },
        recurrence: { type: "string", enum: VALID_RECURRENCES, description: "How often it repeats. Omit for a one-time task." },
      },
      required: ["title", "due_date"],
    },
  },
];

// Runs one tool call against this one fixed account (via admin, the
// service-role client, with userId attached explicitly since there's no
// end-user session in this context). Never throws: a failure comes back
// as `ok: false` with a plain-English message, wrapped into MCP's
// isError below rather than blowing up the whole request.
async function executeTool(
  name: string,
  input: Record<string, unknown>,
  // deno-lint-ignore no-explicit-any
  admin: any,
  userId: string
): Promise<{ ok: boolean; message: string }> {
  try {
    if (name === "list_systems") {
      const { data, error } = await admin.from("systems").select("*").eq("user_id", userId).order("created_at", { ascending: true });
      if (error) return { ok: false, message: error.message };
      if (!data || data.length === 0) return { ok: true, message: "No systems logged yet." };
      const lines = data.map((s: Record<string, unknown>) => {
        const parts = [`id: ${s.id}`, `category: ${s.category}`];
        if (s.brand) parts.push(`brand: ${s.brand}`);
        if (s.model) parts.push(`model: ${s.model}`);
        if (s.location) parts.push(`location: ${s.location}`);
        return `- ${parts.join(", ")}`;
      });
      return { ok: true, message: lines.join("\n") };
    }

    if (name === "add_system") {
      const category = String(input.category || "");
      if (!VALID_SYSTEM_CATEGORIES.includes(category)) {
        return { ok: false, message: `"${category}" isn't a valid system category.` };
      }
      const { data, error } = await admin
        .from("systems")
        .insert({
          user_id: userId,
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
      const { data, error } = await admin
        .from("tasks")
        .insert({
          user_id: userId,
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

function jsonRpcResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function jsonRpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: CORS_HEADERS });

  const accessToken = Deno.env.get("MCP_ACCESS_TOKEN");
  const userId = Deno.env.get("MCP_USER_ID");
  if (!accessToken || !userId) {
    return json({ error: "MCP_ACCESS_TOKEN / MCP_USER_ID is not configured on this function" }, 500);
  }
  const authHeader = req.headers.get("Authorization") || "";
  if (authHeader !== `Bearer ${accessToken}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  // deno-lint-ignore no-explicit-any
  let message: any;
  try {
    message = await req.json();
  } catch {
    return json(jsonRpcError(null, -32700, "Parse error"), 400);
  }

  // A notification (no "id") or a response to a request we never sent just
  // gets a bare 202 — no JSON-RPC reply of our own is expected for those.
  if (!message || typeof message.method !== "string") {
    return new Response(null, { status: 202, headers: CORS_HEADERS });
  }

  const { id, method, params } = message;

  if (method.startsWith("notifications/")) {
    return new Response(null, { status: 202, headers: CORS_HEADERS });
  }

  if (method === "initialize") {
    return json(jsonRpcResult(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: "myhouse-os", version: "1.0.0" },
    }));
  }

  if (method === "tools/list") {
    return json(jsonRpcResult(id, { tools: TOOLS }));
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const args = params?.arguments || {};
    if (!TOOLS.some((t) => t.name === toolName)) {
      return json(jsonRpcError(id, -32602, `Unknown tool: ${toolName}`));
    }
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const result = await executeTool(toolName, args, admin, userId);
    return json(jsonRpcResult(id, { content: [{ type: "text", text: result.message }], isError: !result.ok }));
  }

  return json(jsonRpcError(id, -32601, `Method not found: ${method}`));
});
