import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { FREE_SYSTEM_LIMIT, FILTER_OPTIONS } from "./constants.js";
import { TODAY, daysUntil, computeForecast } from "./forecast.js";
import {
  db,
  loadAllData,
  loadProfile,
  saveProfile as saveProfileRow,
  createCheckoutSession,
  createPortalSession,
  loadEnergyChecks,
  updateEnergyCheckStatus,
} from "./db.js";
import { useSession } from "./auth-context.js";

const AppDataContext = createContext(null);

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
      setFurniture([]);
      setEnergyChecks([]);
      setProfile(null);
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
      setFurniture(all.furniture);
      setEnergyChecks(checksResult);
      setProfile({ ...profileRow, email: session.user.email });
      setDataLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

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

  const forecast = useMemo(() => computeForecast(systems, spentThisYear), [systems, spentThisYear]);

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
    return profile.plan === "free" && systems.length >= FREE_SYSTEM_LIMIT;
  }

  async function toggleTask(id) {
    const t = tasks.find((t) => t.id === id);
    const patch = t.completed ? { completed: false, reopenedAt: Date.now() } : { completed: true, reopenedAt: null };
    const updated = await db.tasks.update(id, { ...t, ...patch });
    setTasks((ts) => ts.map((t) => (t.id === id ? updated : t)));
  }

  async function addTask(title, dueDate, systemId) {
    const created = await db.tasks.add({ title, dueDate, systemId, completed: false });
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
    const existing = tasks.find((t) => t.systemId === sys.id && t.title === "Replace HVAC air filter" && !t.completed);
    if (existing) {
      const updated = await db.tasks.update(existing.id, { ...existing, dueDate });
      setTasks((ts) => ts.map((t) => (t.id === existing.id ? updated : t)));
    } else {
      const created = await db.tasks.add({ title: "Replace HVAC air filter", dueDate, systemId: sys.id, completed: false });
      setTasks((ts) => [...ts, created]);
    }
  }

  async function addSystem(sys) {
    const created = await db.systems.add(sys);
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

  async function attachManualDocument(systemId, brand, model, manualUrl) {
    const created = await db.documents.add({ label: `${brand} ${model} Manual`, type: "Manual", systemId, photoUrl: manualUrl });
    setDocuments((ds) => [...ds, created]);
  }

  async function deleteSystem(id) {
    await db.systems.remove(id);
    setSystems((ss) => ss.filter((s) => s.id !== id));
  }

  async function saveProfile(next) {
    const updated = await saveProfileRow(session.user.id, { ...profile, ...next });
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
    addTask,
    updateTask,
    deleteTask,
    addExpense,
    updateExpense,
    deleteExpense,
    addDocument,
    updateDocument,
    deleteDocument,
    addFurniture,
    updateFurniture,
    deleteFurniture,
    addSystem,
    updateSystem,
    attachManualDocument,
    deleteSystem,
    saveProfile,
    selectPlan,
    manageBilling,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
