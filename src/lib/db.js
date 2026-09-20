import { supabase } from "./supabase.js";

const rowToSystem = (r) => ({
  id: r.id,
  brand: r.brand,
  model: r.model,
  category: r.category,
  location: r.location,
  purchaseDate: r.purchase_date || "",
  purchasePrice: r.purchase_price,
  expectedLifeYears: r.expected_life_years,
  replacementCost: r.replacement_cost,
  warrantyExpiration: r.warranty_expiration || "",
  photoUrl: r.photo_url,
  filterSize: r.filter_size || "",
});

const systemToRow = (s) => ({
  brand: s.brand,
  model: s.model,
  category: s.category,
  location: s.location,
  purchase_date: s.purchaseDate || null,
  purchase_price: s.purchasePrice,
  expected_life_years: s.expectedLifeYears,
  replacement_cost: s.replacementCost,
  warranty_expiration: s.warrantyExpiration || null,
  photo_url: s.photoUrl || null,
  filter_size: s.filterSize || null,
});

const rowToTask = (r) => ({
  id: r.id,
  systemId: r.system_id,
  title: r.title,
  dueDate: r.due_date || "",
  completed: r.completed,
  duration: r.duration,
  difficulty: r.difficulty,
  reopenedAt: r.reopened_at ? new Date(r.reopened_at).getTime() : null,
});

const taskToRow = (t) => ({
  system_id: t.systemId || null,
  title: t.title,
  due_date: t.dueDate || null,
  completed: t.completed,
  duration: t.duration,
  difficulty: t.difficulty,
  reopened_at: t.reopenedAt ? new Date(t.reopenedAt).toISOString() : null,
});

const rowToExpense = (r) => ({
  id: r.id,
  systemId: r.system_id,
  amount: r.amount,
  date: r.date,
  category: r.category,
  note: r.note,
});

const expenseToRow = (e) => ({
  system_id: e.systemId || null,
  amount: e.amount,
  date: e.date,
  category: e.category,
  note: e.note,
});

const rowToDocument = (r) => ({
  id: r.id,
  systemId: r.system_id,
  type: r.type,
  label: r.label,
  photoUrl: r.photo_url,
});

const documentToRow = (d) => ({
  system_id: d.systemId || null,
  type: d.type,
  label: d.label,
  photo_url: d.photoUrl || null,
});

const rowToFurniture = (r) => ({
  id: r.id,
  name: r.name,
  room: r.room,
  value: r.value,
  note: r.note,
  photoUrl: r.photo_url,
});

const furnitureToRow = (f) => ({
  name: f.name,
  room: f.room,
  value: f.value,
  note: f.note,
  photo_url: f.photoUrl || null,
});

const rowToEnergyCheck = (r) => ({
  id: r.id,
  key: r.key,
  label: r.label,
  status: r.status,
  lastUpdated: r.last_updated,
});

const ENERGY_CHECK_SEEDS = [
  { key: "thermostat", label: "Programmable or smart thermostat in use" },
  { key: "door_window_gaps", label: "No visible gaps around doors or windows" },
  { key: "attic_insulation", label: "Attic insulation adequate for climate" },
  { key: "water_heater_temp", label: "Water heater set at or below 120°F" },
  { key: "led_bulbs", label: "Mostly LED bulbs" },
  { key: "duct_leaks", label: "Ducts sealed, no visible leaks" },
];

const rowToProfile = (r) => ({
  name: r.name,
  email: undefined, // comes from the auth session, not this table
  address: r.address,
  propertyValue: r.property_value,
  propertyValueSource: r.property_value_source,
  plan: r.plan,
});

const profileToRow = (p) => ({
  name: p.name,
  address: p.address,
  property_value: p.propertyValue ?? null,
  property_value_source: p.propertyValueSource || null,
  plan: p.plan,
});

async function loadTable(table, mapper) {
  const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(mapper);
}

async function insertRow(table, row, mapper) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return mapper(data);
}

async function updateRow(table, id, row, mapper) {
  const { data, error } = await supabase.from(table).update(row).eq("id", id).select().single();
  if (error) throw error;
  return mapper(data);
}

async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

// crypto.randomUUID() only exists in secure contexts (HTTPS or localhost),
// so it's unavailable when testing over a plain-HTTP LAN address like a phone
// hitting the dev server's network IP.
function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function uploadPhoto(file) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${user.id}/${generateId()}.${ext}`;

  const { error } = await supabase.storage.from("photos").upload(path, file, { cacheControl: "3600" });
  if (error) throw error;

  return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
}

export async function scanSystemLabel(photoUrl) {
  const { data, error } = await supabase.functions.invoke("scan-system-label", {
    body: { photoUrl },
  });
  if (error) throw error;
  return data;
}

export async function createCheckoutSession(planId) {
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: { planId, origin: window.location.origin },
  });
  if (error) throw error;
  return data.url;
}

export async function createPortalSession() {
  const { data, error } = await supabase.functions.invoke("create-portal-session", {
    body: { origin: window.location.origin },
  });
  if (error) throw error;
  return data.url;
}

export async function loadEnergyChecks() {
  const { data, error } = await supabase.from("energy_checks").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  if (data.length > 0) return data.map(rowToEnergyCheck);

  const { data: created, error: insertError } = await supabase
    .from("energy_checks")
    .insert(ENERGY_CHECK_SEEDS.map((c) => ({ ...c, status: "unknown" })))
    .select();
  if (insertError) throw insertError;
  return created.map(rowToEnergyCheck);
}

export async function updateEnergyCheckStatus(id, status) {
  const { data, error } = await supabase
    .from("energy_checks")
    .update({ status, last_updated: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToEnergyCheck(data);
}

export async function loadAllData() {
  const [systems, tasks, expenses, documents, furniture] = await Promise.all([
    loadTable("systems", rowToSystem),
    loadTable("tasks", rowToTask),
    loadTable("expenses", rowToExpense),
    loadTable("documents", rowToDocument),
    loadTable("furniture", rowToFurniture),
  ]);
  return { systems, tasks, expenses, documents, furniture };
}

export const db = {
  systems: {
    add: (s) => insertRow("systems", systemToRow(s), rowToSystem),
    update: (id, patch) => updateRow("systems", id, systemToRow(patch), rowToSystem),
    remove: (id) => deleteRow("systems", id),
  },
  tasks: {
    add: (t) => insertRow("tasks", taskToRow(t), rowToTask),
    update: (id, patch) => updateRow("tasks", id, taskToRow(patch), rowToTask),
    remove: (id) => deleteRow("tasks", id),
  },
  expenses: {
    add: (e) => insertRow("expenses", expenseToRow(e), rowToExpense),
    update: (id, patch) => updateRow("expenses", id, expenseToRow(patch), rowToExpense),
    remove: (id) => deleteRow("expenses", id),
  },
  documents: {
    add: (d) => insertRow("documents", documentToRow(d), rowToDocument),
    update: (id, patch) => updateRow("documents", id, documentToRow(patch), rowToDocument),
    remove: (id) => deleteRow("documents", id),
  },
  furniture: {
    add: (f) => insertRow("furniture", furnitureToRow(f), rowToFurniture),
    update: (id, patch) => updateRow("furniture", id, furnitureToRow(patch), rowToFurniture),
    remove: (id) => deleteRow("furniture", id),
  },
};

export async function loadProfile(userId, fallbackName) {
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (data) return rowToProfile(data);

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ user_id: userId, name: fallbackName, address: "", plan: "free" })
    .select()
    .single();
  if (insertError) throw insertError;
  return rowToProfile(created);
}

export async function saveProfile(userId, profile) {
  const { data, error } = await supabase
    .from("profiles")
    .update(profileToRow(profile))
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return rowToProfile(data);
}
