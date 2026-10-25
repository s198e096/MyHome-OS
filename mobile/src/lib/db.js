import * as Linking from "expo-linking";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { supabase } from "./supabase.js";
import { storedManualPath } from "./manual-links.js";

const rowToSystem = (r) => ({
  id: r.id,
  brand: r.brand,
  model: r.model,
  serialNumber: r.serial_number || "",
  category: r.category,
  location: r.location,
  purchaseDate: r.purchase_date || "",
  purchasePrice: r.purchase_price,
  expectedLifeYears: r.expected_life_years,
  replacementCost: r.replacement_cost,
  warrantyExpiration: r.warranty_expiration || "",
  photoUrl: r.photo_url,
  filterSize: r.filter_size || "",
  warrantyRegistered: r.warranty_registered ?? false,
  archived: r.archived ?? false,
});

const systemToRow = (s) => ({
  brand: s.brand,
  model: s.model,
  serial_number: s.serialNumber || null,
  category: s.category,
  location: s.location,
  purchase_date: s.purchaseDate || null,
  purchase_price: s.purchasePrice,
  expected_life_years: s.expectedLifeYears,
  replacement_cost: s.replacementCost,
  warranty_expiration: s.warrantyExpiration || null,
  photo_url: s.photoUrl || null,
  filter_size: s.filterSize || null,
  warranty_registered: !!s.warrantyRegistered,
  archived: !!s.archived,
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
  recurrence: r.recurrence || "",
  completedDate: r.completed_date || "",
});

const taskToRow = (t) => ({
  system_id: t.systemId || null,
  title: t.title,
  due_date: t.dueDate || null,
  completed: t.completed,
  duration: t.duration,
  difficulty: t.difficulty,
  reopened_at: t.reopenedAt ? new Date(t.reopenedAt).toISOString() : null,
  recurrence: t.recurrence || null,
});

const rowToExpense = (r) => ({
  id: r.id,
  systemId: r.system_id,
  taskId: r.task_id,
  amount: r.amount,
  date: r.date,
  category: r.category,
  note: r.note,
  partsCost: r.parts_cost,
  laborCost: r.labor_cost,
  diy: r.diy,
  timeSpentHours: r.time_spent_hours,
  vendor: r.vendor,
});

const expenseToRow = (e) => ({
  system_id: e.systemId || null,
  task_id: e.taskId || null,
  amount: e.amount,
  date: e.date,
  category: e.category,
  note: e.note,
  parts_cost: e.partsCost ?? null,
  labor_cost: e.laborCost ?? null,
  diy: e.diy ?? null,
  time_spent_hours: e.timeSpentHours ?? null,
  vendor: e.vendor || null,
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

const rowToWarranty = (r) => ({
  id: r.id,
  systemId: r.system_id,
  type: r.warranty_type,
  expirationDate: r.expiration_date || "",
  estimated: r.estimated,
});

const warrantyToRow = (w) => ({
  system_id: w.systemId,
  warranty_type: w.type,
  expiration_date: w.expirationDate || null,
  estimated: !!w.estimated,
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
  propertyName: r.property_name || "",
  propertyValue: r.property_value,
  propertyValueSource: r.property_value_source,
  propertyValueUpdatedAt: r.property_value_updated_at,
  propertyValuePending: r.property_value_pending,
  propertyValuePendingFetchedAt: r.property_value_pending_fetched_at,
  bedrooms: r.bedrooms,
  yearBuilt: r.year_built,
  purchasePrice: r.purchase_price,
  bathrooms: r.bathrooms,
  squareFootage: r.square_footage,
  lotSize: r.lot_size,
  propertyType: r.property_type,
  roomCount: r.room_count,
  floorCount: r.floor_count,
  roofType: r.roof_type,
  heatingType: r.heating_type,
  coolingType: r.cooling_type,
  foundationType: r.foundation_type,
  exteriorType: r.exterior_type,
  architectureType: r.architecture_type,
  hasGarage: r.has_garage,
  garageType: r.garage_type,
  garageSpaces: r.garage_spaces,
  hasPool: r.has_pool,
  poolType: r.pool_type,
  hasFireplace: r.has_fireplace,
  fireplaceType: r.fireplace_type,
  hoaFee: r.hoa_fee,
  plan: r.plan,
  onboardingCompleted: r.onboarding_completed,
});

const profileToRow = (p) => ({
  name: p.name,
  address: p.address,
  property_name: p.propertyName || null,
  property_value: p.propertyValue ?? null,
  property_value_source: p.propertyValueSource || null,
  bedrooms: p.bedrooms ?? null,
  year_built: p.yearBuilt ?? null,
  purchase_price: p.purchasePrice ?? null,
  bathrooms: p.bathrooms ?? null,
  square_footage: p.squareFootage ?? null,
  lot_size: p.lotSize ?? null,
  property_type: p.propertyType ?? null,
  room_count: p.roomCount ?? null,
  floor_count: p.floorCount ?? null,
  roof_type: p.roofType ?? null,
  heating_type: p.heatingType ?? null,
  cooling_type: p.coolingType ?? null,
  foundation_type: p.foundationType ?? null,
  exterior_type: p.exteriorType ?? null,
  architecture_type: p.architectureType ?? null,
  has_garage: p.hasGarage ?? null,
  garage_type: p.garageType ?? null,
  garage_spaces: p.garageSpaces ?? null,
  has_pool: p.hasPool ?? null,
  pool_type: p.poolType ?? null,
  has_fireplace: p.hasFireplace ?? null,
  fireplace_type: p.fireplaceType ?? null,
  hoa_fee: p.hoaFee ?? null,
  plan: p.plan,
  onboarding_completed: p.onboardingCompleted,
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

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Accepts an ImagePicker asset ({ uri, mimeType, fileName }) rather than a
// browser File, since that's what expo-image-picker / the camera return.
export async function uploadPhoto(asset) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Normalize to JPEG regardless of source format — iPhone cameras capture
  // HEIC by default, which Claude's vision API (used by the AI label-scan
  // feature) rejects outright. Also downscale to a max width and compress —
  // full-resolution camera photos can exceed Claude's 10MB image limit.
  const context = ImageManipulator.manipulate(asset.uri);
  context.resize({ width: 1600 });
  const rendered = await context.renderAsync();
  const { uri: jpegUri } = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });

  const path = `${user.id}/${generateId()}.jpg`;

  // Upload the raw bytes as an ArrayBuffer rather than a Blob — React
  // Native's fetch().blob() polyfill doesn't carry the content-type through
  // to Supabase Storage's upload, which then serves the file back as
  // text/plain regardless of the `contentType` option passed here.
  const response = await fetch(jpegUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from("photos").upload(path, arrayBuffer, {
    cacheControl: "3600",
    contentType: "image/jpeg",
  });
  if (error) throw error;

  return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
}

// Removes the manual PDF a label scan saved to the user's own storage folder
// when its document is deleted, so the file doesn't pile up unreferenced.
// Any other URL (a ManualsLib link, an uploaded photo) has no such file and
// is left alone. Best-effort and never throws: the document is already gone
// either way, and a leftover file is harmless.
export async function removeStoredManual(url) {
  const path = storedManualPath(url);
  if (!path) return;
  try {
    await supabase.storage.from("photos").remove([path]);
  } catch {
    // ignore
  }
}

export async function scanSystemLabel(photoUrl) {
  const { data, error } = await supabase.functions.invoke("scan-system-label", {
    body: { photoUrl },
  });
  if (error) throw error;
  return data;
}

// Extracts purchase date and every distinct warranty coverage (e.g. Parts
// vs. Labor) from a receipt and/or warranty certificate — each can be
// multiple page photos, passed as arrays. Returns
// { purchaseDate, warranties: [{ type, expirationDate, estimated }] } — an
// empty `warranties` array means nothing was found (and no web-search
// fallback was possible). `brand`/`model`/`category`/`purchaseDate` are
// optional context that lets the function (a) fall back to a web-searched
// warranty estimate when no document states one, and (b) compute an
// expiration date from a stated duration even when the purchase date comes
// from somewhere other than this receipt (e.g. already typed in by the
// user).
export async function scanWarrantyDocs({ receiptPhotoUrls, warrantyPhotoUrls, brand, model, category, purchaseDate }) {
  const { data, error } = await supabase.functions.invoke("scan-warranty-docs", {
    body: { receiptPhotoUrls, warrantyPhotoUrls, brand, model, category, purchaseDate },
  });
  if (error) throw error;
  return data;
}

export async function fetchPropertyDetails(address) {
  const { data, error } = await supabase.functions.invoke("property-lookup", {
    body: { address },
  });
  if (error) throw error;
  return data;
}

export async function askAssistant(messages) {
  const { data, error } = await supabase.functions.invoke("ask-assistant", {
    body: { messages },
  });
  if (error) throw error;
  return data.reply;
}

export async function createCheckoutSession(planId) {
  const origin = Linking.createURL("/");
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: { planId, origin },
  });
  if (error) throw error;
  return data.url;
}

// One-time purchase of a paid PDF report ("home_sale" or "insurance_inventory").
// Returns the Stripe Checkout URL; the purchase is recorded by the Stripe
// webhook once payment completes, not by the app.
export async function createReportCheckoutSession(reportType) {
  const origin = Linking.createURL("/");
  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: { reportType, origin },
  });
  if (error) throw error;
  return data.url;
}

const rowToReportPurchase = (r) => ({
  id: r.id,
  reportType: r.report_type,
  purchasedAt: r.purchased_at,
  expiresAt: r.expires_at,
});

// The signed-in user's report purchases, newest first (read-only: only the
// Stripe webhook can write to this table).
export async function loadReportPurchases() {
  const { data, error } = await supabase.from("report_purchases").select("*").order("purchased_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToReportPurchase);
}

export async function createPortalSession() {
  const origin = Linking.createURL("/");
  const { data, error } = await supabase.functions.invoke("create-portal-session", {
    body: { origin },
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
  const [systems, tasks, expenses, documents, furniture, warranties] = await Promise.all([
    loadTable("systems", rowToSystem),
    loadTable("tasks", rowToTask),
    loadTable("expenses", rowToExpense),
    loadTable("documents", rowToDocument),
    loadTable("furniture", rowToFurniture),
    loadTable("warranties", rowToWarranty).catch(() => []),
  ]);
  return { systems, tasks, expenses, documents, furniture, warranties };
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
    setCompleted: (id, completed, reopenedAt, completedDate) =>
      updateRow(
        "tasks",
        id,
        {
          completed,
          reopened_at: reopenedAt ? new Date(reopenedAt).toISOString() : null,
          completed_date: completed ? completedDate || null : null,
        },
        rowToTask
      ),
    remove: (id) => deleteRow("tasks", id),
    // Reads straight from the database rather than the client cache, since
    // this backs a duplicate-prevention check that two near-simultaneous
    // saves could otherwise both pass against a stale local task list.
    findIncompleteByTitle: async (systemId, title) => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("system_id", systemId)
        .eq("title", title)
        .eq("completed", false)
        .order("created_at", { ascending: true })
        .limit(1);
      if (error) throw error;
      return data && data.length > 0 ? rowToTask(data[0]) : null;
    },
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
  warranties: {
    add: (w) => insertRow("warranties", warrantyToRow(w), rowToWarranty),
    update: (id, patch) => updateRow("warranties", id, warrantyToRow(patch), rowToWarranty),
    remove: (id) => deleteRow("warranties", id),
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

// Answers the "RentCast refreshed your home value" prompt: accept switches
// to the new estimate, decline just clears the pending suggestion and keeps
// the user's manually-entered value.
export async function resolvePendingPropertyValue(userId, accept, pendingValue) {
  const patch = accept
    ? {
        property_value: pendingValue,
        property_value_source: "RentCast",
        property_value_updated_at: new Date().toISOString(),
        property_value_pending: null,
        property_value_pending_fetched_at: null,
      }
    : { property_value_pending: null, property_value_pending_fetched_at: null };
  const { data, error } = await supabase.from("profiles").update(patch).eq("user_id", userId).select().single();
  if (error) throw error;
  return rowToProfile(data);
}
