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

export async function uploadPhoto(file) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("photos").upload(path, file, { cacheControl: "3600" });
  if (error) throw error;

  return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
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
