import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { FREE_SYSTEM_LIMIT, FILTER_OPTIONS, systemName, defaultExpectedLifeYears } from "./constants.js";
import { TODAY, daysUntil, computeForecast, advanceDueDate } from "./forecast.js";
import { isManualsLibUrl, MANUALSLIB_NAME } from "./manual-links.js";
import { syncTaskNotifications, clearTaskNotifications } from "./notifications.js";
import {
  db,
  loadAllData,
  loadProfile,
  saveProfile as saveProfileRow,
  resolvePendingPropertyValue as resolvePendingPropertyValueRow,
  createCheckoutSession,
  createPortalSession,
  loadEnergyChecks,
  updateEnergyCheckStatus,
} from "./db.js";
import { useSession } from "./auth-context.js";

const AppDataContext = createContext(null);

// Serializes syncFilterReminder calls across the whole app (module-level,
// not per-provider-instance) so two near-simultaneous calls for the same
// system can't both read "no reminder yet" before either has written one.
let filterReminderQueue = Promise.resolve();

export function useAppData() {
  const value = useContext(AppDataContext);
  if (!value) throw new Error("useAppData must be used inside <AppDataProvider>");
  return value;
}

export function AppDataProvider({ children }) {
  const { session } = useSession();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [systems, setSystems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [furniture, setFurniture] = useState([]);
  const [energyChecks, setEnergyChecks] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!session) {
      setDataLoaded(false);
      setSystems([]);
      setTasks([]);
      setExpenses([]);
      setDocuments([]);
      setWarranties([]);
      setFurniture([]);
      setEnergyChecks([]);
      setProfile(null);
      clearTaskNotifications().catch(() => {});
      return;
    }

    let cancelled = false;
    (async () => {
      const fallbackName = session.user.email?.split("@")[0] || "New user";
      const [all, profileRow, checksResult] = await Promise.all([
        loadAllData(),
        loadProfile(session.user.id, fallbackName),
        loadEnergyChecks().catch((err) => {
          console.error("Failed to load energy checks:", err);
          return [];
        }),
      ]);
      if (cancelled) return;
      setSystems(all.systems);
      setTasks(all.tasks);
      setExpenses(all.expenses);
      setDocuments(all.documents);
      setWarranties(all.warranties);
      setFurniture(all.furniture);
      setEnergyChecks(checksResult);
      setProfile({ ...profileRow, email: session.user.email });
      setDataLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Keeps on-device reminders in sync with the open-tasks list, once data
  // has actually loaded (otherwise the initial empty array would wipe out
  // any reminders already scheduled from a previous session).
  useEffect(() => {
    if (!dataLoaded) return;
    syncTaskNotifications(tasks).catch((err) => console.error("Failed to sync task notifications:", err));
  }, [dataLoaded, tasks]);

  const systemById = (id) => systems.find((s) => s.id === id);

  const upcomingTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed)
        .slice()
        .sort((a, b) => {
          if (a.reopenedAt || b.reopenedAt) return (b.reopenedAt || 0) - (a.reopenedAt || 0);
          return daysUntil(a.dueDate) - daysUntil(b.dueDate);
        }),
    [tasks]
  );

  const spentThisYear = expenses
    .filter((e) => new Date(e.date).getFullYear() === TODAY.getFullYear())
    .reduce((s, e) => s + e.amount, 0);

  const forecast = useMemo(() => computeForecast(systems, expenses), [systems, expenses]);

  const next12mo = forecast[0].amount * 0.4 + (forecast[1] ? forecast[1].amount * 0.6 : 0);
  const monthlyReserve = Math.round(forecast.reduce((s, f) => s + f.amount, 0) / (forecast.length * 12));

  async function updateEnergyCheck(id, status) {
    const updated = await updateEnergyCheckStatus(id, status);
    setEnergyChecks((cs) => cs.map((c) => (c.id === id ? updated : c)));
  }

  async function createQuickTask(title) {
    const dueDate = new Date(TODAY.getTime() + 14 * 86400000).toISOString().slice(0, 10);
    const created = await db.tasks.add({ title, dueDate, systemId: null, completed: false });
    setTasks((ts) => [...ts, created]);
  }

  function addSystemAtLimit() {
    const activeCount = systems.filter((s) => !s.archived).length;
    return profile.plan === "free" && activeCount >= FREE_SYSTEM_LIMIT;
  }

  async function toggleTask(id, completedDate) {
    const t = tasks.find((t) => t.id === id);
    const completed = !t.completed;
    const updated = await db.tasks.setCompleted(id, completed, completed ? null : Date.now(), completedDate);
    setTasks((ts) => ts.map((t) => (t.id === id ? updated : t)));
    // Completing a recurring task schedules its next occurrence as a new
    // row, rather than just pushing this one's due date forward, so it
    // still shows up under Completed as something that was actually done.
    if (completed && t.recurrence) {
      const nextDueDate = advanceDueDate(t.dueDate, t.recurrence);
      if (nextDueDate) {
        const created = await db.tasks.add({
          title: t.title,
          dueDate: nextDueDate,
          systemId: t.systemId,
          completed: false,
          recurrence: t.recurrence,
        });
        setTasks((ts) => [...ts, created]);
      }
    }
  }

  // Completing a task from the "did this cost anything?" prompt: optionally
  // logs a linked expense first (so it's in the expense log with its own
  // parts/labor/time-or-vendor breakdown), then completes the task as
  // usual. `vendor` means different things depending on `diy` (where the
  // parts were bought vs. who was hired), but it's the same column either
  // way since `diy` already disambiguates it.
  async function completeTaskWithCost(id, cost, completedDate) {
    const t = tasks.find((x) => x.id === id);
    const date = completedDate || TODAY.toISOString().slice(0, 10);
    if (cost) {
      const partsCost = cost.partsCost ? Number(cost.partsCost) : null;
      const laborCost = cost.laborCost ? Number(cost.laborCost) : null;
      const created = await db.expenses.add({
        systemId: t?.systemId || null,
        taskId: id,
        amount: (partsCost || 0) + (laborCost || 0),
        date,
        category: "Maintenance",
        note: t?.title || "Task",
        partsCost,
        laborCost,
        diy: cost.diy,
        timeSpentHours: cost.diy && cost.timeSpentHours ? Number(cost.timeSpentHours) : null,
        vendor: cost.vendor ? cost.vendor.trim() : null,
      });
      setExpenses((es) => [...es, created]);
      // A photo of the work/labor receipt, if one was taken — filed under
      // its own "Maintenance Invoices" document category rather than
      // "Receipt", since it's evidence of a job done, not a purchase.
      if (cost.receiptPhotoUrl) {
        await addDocument(t?.title ? `${t.title} Invoice` : "Maintenance Invoice", "Maintenance Invoice", t?.systemId || null, cost.receiptPhotoUrl);
      }
    }
    await toggleTask(id, date);
  }

  async function addTask(title, dueDate, systemId, recurrence) {
    const created = await db.tasks.add({ title, dueDate, systemId, completed: false, recurrence: recurrence || null });
    setTasks((ts) => [...ts, created]);
    return created;
  }

  async function updateTask(id, patch) {
    const current = tasks.find((t) => t.id === id);
    const updated = await db.tasks.update(id, { ...current, ...patch });
    setTasks((ts) => ts.map((t) => (t.id === id ? updated : t)));
    return updated;
  }

  async function deleteTask(id) {
    await db.tasks.remove(id);
    setTasks((ts) => ts.filter((t) => t.id !== id));
  }

  async function addExpense(amount, category, note, systemId) {
    const created = await db.expenses.add({ amount, category, note, systemId, date: TODAY.toISOString().slice(0, 10) });
    setExpenses((es) => [...es, created]);
    return created;
  }

  async function updateExpense(id, patch) {
    const current = expenses.find((e) => e.id === id);
    const updated = await db.expenses.update(id, { ...current, ...patch });
    setExpenses((es) => es.map((e) => (e.id === id ? updated : e)));
    return updated;
  }

  async function deleteExpense(id) {
    await db.expenses.remove(id);
    setExpenses((es) => es.filter((e) => e.id !== id));
  }

  async function addDocument(label, type, systemId, photoUrl) {
    const created = await db.documents.add({ label, type, systemId, photoUrl: photoUrl || null });
    setDocuments((ds) => [...ds, created]);
    return created;
  }

  async function updateDocument(id, patch) {
    const current = documents.find((d) => d.id === id);
    const updated = await db.documents.update(id, { ...current, ...patch });
    setDocuments((ds) => ds.map((d) => (d.id === id ? updated : d)));
    return updated;
  }

  async function deleteDocument(id) {
    await db.documents.remove(id);
    setDocuments((ds) => ds.filter((d) => d.id !== id));
  }

  async function addWarranty(systemId, type, expirationDate, estimated) {
    const created = await db.warranties.add({ systemId, type, expirationDate, estimated });
    setWarranties((ws) => [...ws, created]);
    return created;
  }

  async function updateWarranty(id, patch) {
    const current = warranties.find((w) => w.id === id);
    const updated = await db.warranties.update(id, { ...current, ...patch });
    setWarranties((ws) => ws.map((w) => (w.id === id ? updated : w)));
    return updated;
  }

  async function deleteWarranty(id) {
    await db.warranties.remove(id);
    setWarranties((ws) => ws.filter((w) => w.id !== id));
  }

  async function addFurniture(item) {
    const created = await db.furniture.add(item);
    setFurniture((fs) => [...fs, created]);
    return created;
  }

  async function updateFurniture(id, patch) {
    const current = furniture.find((f) => f.id === id);
    const updated = await db.furniture.update(id, { ...current, ...patch });
    setFurniture((fs) => fs.map((f) => (f.id === id ? updated : f)));
    return updated;
  }

  async function deleteFurniture(id) {
    await db.furniture.remove(id);
    setFurniture((fs) => fs.filter((f) => f.id !== id));
  }

  async function syncFilterReminder(sys) {
    if (sys.category !== "hvac_indoor" || !sys.filterSize) return;
    const days = FILTER_OPTIONS.find((f) => f.key === sys.filterSize)?.days;
    if (!days) return;
    const dueDate = new Date(TODAY.getTime() + days * 86400000).toISOString().slice(0, 10);

    async function run() {
      const existing = await db.tasks.findIncompleteByTitle(sys.id, "Replace HVAC air filter");
      if (existing) {
        if (existing.dueDate === dueDate) return;
        const updated = await db.tasks.update(existing.id, { ...existing, dueDate });
        setTasks((ts) => (ts.some((t) => t.id === updated.id) ? ts.map((t) => (t.id === updated.id ? updated : t)) : [...ts, updated]));
      } else {
        const created = await db.tasks.add({ title: "Replace HVAC air filter", dueDate, systemId: sys.id, completed: false });
        setTasks((ts) => [...ts, created]);
      }
    }

    // Checked straight against the database (not the local `tasks` cache,
    // which could be stale) and serialized via a shared queue, so two
    // near-simultaneous calls for the same system (e.g. a fast double-tap on
    // Save) can't both read "no reminder yet" and both insert one. The
    // queue is neutralized on each link so one failed sync doesn't
    // permanently break it for unrelated later calls.
    const turn = filterReminderQueue.catch(() => {}).then(run);
    filterReminderQueue = turn.catch(() => {});
    await turn;
  }

  async function addSystem(sys) {
    const payload = {
      ...sys,
      expectedLifeYears: sys.expectedLifeYears ?? defaultExpectedLifeYears(sys.category, sys.brand),
    };
    const created = await db.systems.add(payload);
    setSystems((ss) => [...ss, created]);
    await syncFilterReminder(created);
    return created;
  }

  async function updateSystem(id, patch) {
    const current = systems.find((s) => s.id === id);
    const updated = await db.systems.update(id, { ...current, ...patch });
    setSystems((ss) => ss.map((s) => (s.id === id ? updated : s)));
    await syncFilterReminder(updated);
    return updated;
  }

  // Marks a system archived instead of deleting it when it's upgraded — its
  // documents, past tasks, and expenses stay intact for history, it just
  // drops out of active lists and pickers.
  async function archiveSystem(id) {
    return updateSystem(id, { archived: true });
  }

  async function attachManualDocument(systemId, brand, model, manualUrl) {
    const category = systems.find((s) => s.id === systemId)?.category;
    // A ManualsLib link is labeled with its source so it's clear it opens off-app.
    const suffix = isManualsLibUrl(manualUrl) ? ` (${MANUALSLIB_NAME})` : "";
    const created = await db.documents.add({ label: `${systemName({ brand, model, category })} Manual${suffix}`, type: "Manual", systemId, photoUrl: manualUrl });
    setDocuments((ds) => [...ds, created]);
  }

  async function deleteSystem(id) {
    await db.systems.remove(id);
    setSystems((ss) => ss.filter((s) => s.id !== id));
    // The database nulls system_id on linked rows (on delete set null); mirror that locally.
    const unlink = (row) => (row.systemId === id ? { ...row, systemId: null } : row);
    setTasks((ts) => ts.map(unlink));
    setExpenses((es) => es.map(unlink));
    setDocuments((ds) => ds.map(unlink));
    // Warranties require a system (no "general" warranty), so the database
    // cascade-deletes them — mirror that locally instead of unlinking.
    setWarranties((ws) => ws.filter((w) => w.systemId !== id));
  }

  async function saveProfile(next) {
    const updated = await saveProfileRow(session.user.id, { ...profile, ...next });
    setProfile((p) => ({ ...p, ...updated }));
  }

  async function resolvePropertyValuePrompt(accept) {
    const updated = await resolvePendingPropertyValueRow(session.user.id, accept, profile.propertyValuePending);
    setProfile((p) => ({ ...p, ...updated }));
  }

  async function selectPlan(planId) {
    if (planId === "free") return createPortalSession();
    return createCheckoutSession(planId);
  }

  async function manageBilling() {
    return createPortalSession();
  }

  const value = {
    dataLoaded,
    systems,
    tasks,
    expenses,
    documents,
    warranties,
    furniture,
    energyChecks,
    profile,
    systemById,
    upcomingTasks,
    spentThisYear,
    forecast,
    next12mo,
    monthlyReserve,
    addSystemAtLimit,
    updateEnergyCheck,
    createQuickTask,
    toggleTask,
    completeTaskWithCost,
    addTask,
    updateTask,
    deleteTask,
    addExpense,
    updateExpense,
    deleteExpense,
    addDocument,
    updateDocument,
    deleteDocument,
    addWarranty,
    updateWarranty,
    deleteWarranty,
    addFurniture,
    updateFurniture,
    deleteFurniture,
    addSystem,
    updateSystem,
    archiveSystem,
    attachManualDocument,
    deleteSystem,
    saveProfile,
    resolvePropertyValuePrompt,
    selectPlan,
    manageBilling,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
