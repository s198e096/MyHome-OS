import { useState, useMemo, useEffect } from "react";
import { TAB_ORDER, FREE_SYSTEM_LIMIT, FILTER_OPTIONS } from "../lib/constants.js";
import { TODAY, daysUntil, computeForecast } from "../lib/forecast.js";
import { supabase } from "../lib/supabase.js";
import { findFilterUnit, buildFilterReminderIcs, downloadIcs } from "../lib/filterReminder.js";
import { db, loadAllData, loadProfile, saveProfile as saveProfileRow, createCheckoutSession, createPortalSession, loadEnergyChecks, updateEnergyCheckStatus } from "../lib/db.js";
import AuthScreen from "../screens/AuthScreen.jsx";
import ResetPasswordScreen from "../screens/ResetPasswordScreen.jsx";
import TabBar from "../components/TabBar.jsx";
import HomeScreen from "../screens/HomeScreen.jsx";
import SystemsScreen from "../screens/SystemsScreen.jsx";
import SystemDetail from "../screens/SystemDetail.jsx";
import TasksScreen from "../screens/TasksScreen.jsx";
import CostsScreen from "../screens/CostsScreen.jsx";
import DocsScreen from "../screens/DocsScreen.jsx";
import AccountScreen from "../screens/AccountScreen.jsx";
import FurnitureScreen from "../screens/FurnitureScreen.jsx";
import ItemFormScreen from "../screens/ItemFormScreen.jsx";
import EditProfileScreen from "../screens/EditProfileScreen.jsx";
import PlanScreen from "../screens/PlanScreen.jsx";
import EnergyAuditScreen from "../screens/EnergyAuditScreen.jsx";

// Drops the animation class (and its will-change hint) once the slide-in
// finishes, since leaving it applied causes touch targets underneath to miss
// their first tap on iOS Safari until something else triggers a repaint.
function AnimatedScreen({ direction, children }) {
  const [animating, setAnimating] = useState(true);
  return (
    <div
      className={animating ? (direction === "right" ? "tab-slide-right" : "tab-slide-left") : ""}
      onAnimationEnd={() => setAnimating(false)}
    >
      {children}
    </div>
  );
}

export default function MyHouseOS() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = signed out
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [tab, setTab] = useState("home");
  const [slideDirection, setSlideDirection] = useState("right");
  const [systems, setSystems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [furniture, setFurniture] = useState([]);
  const [energyChecks, setEnergyChecks] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [formItem, setFormItem] = useState(null); // { kind: 'task' | 'expense' | 'system' | 'doc' | 'furniture', item: object | null }
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

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
          console.error("Failed to load energy checks (has the 0006_energy_checks migration been run?):", err);
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
          if (a.reopenedAt || b.reopenedAt) {
            return (b.reopenedAt || 0) - (a.reopenedAt || 0);
          }
          return daysUntil(a.dueDate) - daysUntil(b.dueDate);
        }),
    [tasks]
  );

  const spentThisYear = expenses
    .filter((e) => new Date(e.date).getFullYear() === TODAY.getFullYear())
    .reduce((s, e) => s + e.amount, 0);

  const forecast = useMemo(() => computeForecast(systems, spentThisYear), [systems, spentThisYear]);

  const next12mo = forecast[0].amount * 0.4 + (forecast[1] ? forecast[1].amount * 0.6 : 0);
  const monthlyReserve = Math.round(
    forecast.reduce((s, f) => s + f.amount, 0) / (forecast.length * 12)
  );

  function goToTab(next) {
    setSlideDirection(TAB_ORDER.indexOf(next) >= TAB_ORDER.indexOf(tab) ? "right" : "left");
    setTab(next);
  }

  function openSystem(s) {
    setSlideDirection("right");
    setSelectedSystem(s);
  }

  function closeSystem() {
    setSlideDirection("left");
    setSelectedSystem(null);
  }

  function openAdd(kind) {
    setSlideDirection("right");
    setFormItem({ kind, item: null });
  }

  function openEdit(kind, item) {
    setSlideDirection("right");
    setFormItem({ kind, item });
  }

  function openPlan() {
    setSlideDirection("right");
    setFormItem({ kind: "plan", item: null });
  }

  function openEnergyAudit() {
    setSlideDirection("right");
    setFormItem({ kind: "energyAudit", item: null });
  }

  function handleFilterReminder() {
    const unit = findFilterUnit(systems);
    if (!unit) return handleAddSystem();
    if (!unit.filterSize) return openEdit("system", unit);
    const option = FILTER_OPTIONS.find((f) => f.key === unit.filterSize);
    downloadIcs(
      "hvac-filter-reminder.ics",
      buildFilterReminderIcs({ systemId: unit.id, brand: unit.brand, model: unit.model, filterLabel: option.label, days: option.days })
    );
  }

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

  function handleAddSystem() {
    if (addSystemAtLimit()) {
      openPlan();
      return;
    }
    openAdd("system");
  }

  function closeForm() {
    setSlideDirection("left");
    setFormItem(null);
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
    closeForm();
  }

  async function updateTask(id, patch) {
    const current = tasks.find((t) => t.id === id);
    const updated = await db.tasks.update(id, { ...current, ...patch });
    setTasks((ts) => ts.map((t) => (t.id === id ? updated : t)));
    closeForm();
  }

  async function deleteTask(id) {
    await db.tasks.remove(id);
    setTasks((ts) => ts.filter((t) => t.id !== id));
    closeForm();
  }

  async function addExpense(amount, category, note, systemId) {
    const created = await db.expenses.add({ amount, category, note, systemId, date: TODAY.toISOString().slice(0, 10) });
    setExpenses((es) => [...es, created]);
    closeForm();
  }

  async function updateExpense(id, patch) {
    const current = expenses.find((e) => e.id === id);
    const updated = await db.expenses.update(id, { ...current, ...patch });
    setExpenses((es) => es.map((e) => (e.id === id ? updated : e)));
    closeForm();
  }

  async function deleteExpense(id) {
    await db.expenses.remove(id);
    setExpenses((es) => es.filter((e) => e.id !== id));
    closeForm();
  }

  async function addDocument(label, type, systemId, photoUrl) {
    const created = await db.documents.add({ label, type, systemId, photoUrl: photoUrl || null });
    setDocuments((ds) => [...ds, created]);
    closeForm();
  }

  async function updateDocument(id, patch) {
    const current = documents.find((d) => d.id === id);
    const updated = await db.documents.update(id, { ...current, ...patch });
    setDocuments((ds) => ds.map((d) => (d.id === id ? updated : d)));
    closeForm();
  }

  async function deleteDocument(id) {
    await db.documents.remove(id);
    setDocuments((ds) => ds.filter((d) => d.id !== id));
    closeForm();
  }

  async function addFurniture(item) {
    const created = await db.furniture.add(item);
    setFurniture((fs) => [...fs, created]);
    closeForm();
  }

  async function updateFurniture(id, patch) {
    const current = furniture.find((f) => f.id === id);
    const updated = await db.furniture.update(id, { ...current, ...patch });
    setFurniture((fs) => fs.map((f) => (f.id === id ? updated : f)));
    closeForm();
  }

  async function deleteFurniture(id) {
    await db.furniture.remove(id);
    setFurniture((fs) => fs.filter((f) => f.id !== id));
    closeForm();
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
    closeForm();
    return created;
  }

  async function updateSystem(id, patch) {
    const current = systems.find((s) => s.id === id);
    const updated = await db.systems.update(id, { ...current, ...patch });
    setSystems((ss) => ss.map((s) => (s.id === id ? updated : s)));
    setSelectedSystem((cur) => (cur && cur.id === id ? updated : cur));
    await syncFilterReminder(updated);
    closeForm();
    return updated;
  }

  async function attachManualDocument(systemId, brand, model, manualUrl) {
    const created = await db.documents.add({ label: `${brand} ${model} Manual`, type: "Manual", systemId, photoUrl: manualUrl });
    setDocuments((ds) => [...ds, created]);
  }

  async function deleteSystem(id) {
    await db.systems.remove(id);
    setSystems((ss) => ss.filter((s) => s.id !== id));
    setSlideDirection("left");
    setSelectedSystem(null);
    setFormItem(null);
  }

  async function saveProfile(next) {
    const updated = await saveProfileRow(session.user.id, { ...profile, ...next });
    setProfile((p) => ({ ...p, ...updated }));
    closeForm();
  }

  async function selectPlan(planId) {
    if (planId === "free") {
      const url = await createPortalSession();
      window.location.href = url;
      return;
    }
    const url = await createCheckoutSession(planId);
    window.location.href = url;
  }

  async function manageBilling() {
    const url = await createPortalSession();
    window.location.href = url;
  }

  function signOut() {
    supabase.auth.signOut();
  }

  if (session === undefined) return null;

  if (passwordRecovery) {
    return (
      <div className="app-shell">
        <div
          className="px-4 pb-4"
          style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto", paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}
        >
          <ResetPasswordScreen onDone={() => setPasswordRecovery(false)} />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-shell">
        <div
          className="px-4 pb-4"
          style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", overflowY: "auto", paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}
        >
          <AuthScreen />
        </div>
      </div>
    );
  }

  if (!dataLoaded) return null;

  return (
    <div className="app-shell">
      <div
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden", position: "relative", paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}
        className="px-4 pb-4"
      >
        <AnimatedScreen
          key={formItem ? `${tab}:form:${formItem.kind}:${formItem.item?.id ?? "new"}` : selectedSystem ? `${tab}:system:${selectedSystem.id}` : tab}
          direction={slideDirection}
        >
          {formItem?.kind === "profile" ? (
            <EditProfileScreen profile={profile} onBack={closeForm} onSave={saveProfile} />
          ) : formItem?.kind === "plan" ? (
            <PlanScreen currentPlan={profile.plan} onBack={closeForm} onSelectPlan={selectPlan} onManageBilling={manageBilling} />
          ) : formItem?.kind === "energyAudit" ? (
            <EnergyAuditScreen
              systems={systems}
              energyChecks={energyChecks}
              tasks={tasks}
              onBack={closeForm}
              onUpdateCheck={updateEnergyCheck}
              onCreateTask={createQuickTask}
            />
          ) : formItem ? (
            <ItemFormScreen
              kind={formItem.kind}
              item={formItem.item}
              systems={systems}
              onBack={closeForm}
              onAddTask={addTask}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              onAddExpense={addExpense}
              onUpdateExpense={updateExpense}
              onDeleteExpense={deleteExpense}
              onAddDocument={addDocument}
              onUpdateDocument={updateDocument}
              onDeleteDocument={deleteDocument}
              onAddSystem={addSystem}
              onAttachManual={attachManualDocument}
              onUpdateSystem={updateSystem}
              onDeleteSystem={deleteSystem}
              onAddFurniture={addFurniture}
              onUpdateFurniture={updateFurniture}
              onDeleteFurniture={deleteFurniture}
            />
          ) : (
            <>
              {tab === "home" && (
                <HomeScreen
                  upcomingTasks={upcomingTasks}
                  systemById={systemById}
                  systems={systems}
                  tasks={tasks}
                  spentThisYear={spentThisYear}
                  next12mo={next12mo}
                  monthlyReserve={monthlyReserve}
                  profile={profile}
                  energyChecks={energyChecks}
                  onOpenSystem={(s) => {
                    setSelectedSystem(s);
                    goToTab("systems");
                  }}
                  onOpenAccount={() => goToTab("account")}
                  onOpenEnergyAudit={openEnergyAudit}
                  onFilterReminder={handleFilterReminder}
                  onNavigate={goToTab}
                />
              )}
              {tab === "furniture" && (
                <FurnitureScreen
                  furniture={furniture}
                  onEdit={(f) => openEdit("furniture", f)}
                  onAdd={() => openAdd("furniture")}
                />
              )}
              {tab === "systems" && !selectedSystem && (
                <SystemsScreen
                  systems={systems}
                  tasks={tasks}
                  onSelect={openSystem}
                  onAdd={handleAddSystem}
                  atLimit={addSystemAtLimit()}
                />
              )}
              {tab === "systems" && selectedSystem && (
                <SystemDetail
                  sys={selectedSystem}
                  tasks={tasks.filter((t) => t.systemId === selectedSystem.id)}
                  documents={documents.filter((d) => d.systemId === selectedSystem.id)}
                  onBack={closeSystem}
                  onEdit={() => openEdit("system", selectedSystem)}
                />
              )}
              {tab === "tasks" && (
                <TasksScreen
                  tasks={upcomingTasks}
                  completed={tasks.filter((t) => t.completed)}
                  systemById={systemById}
                  onToggle={toggleTask}
                  onEdit={(t) => openEdit("task", t)}
                  onAdd={() => openAdd("task")}
                />
              )}
              {tab === "costs" && (
                <CostsScreen
                  expenses={expenses}
                  forecast={forecast}
                  systemById={systemById}
                  onEdit={(e) => openEdit("expense", e)}
                  onAdd={() => openAdd("expense")}
                />
              )}
              {tab === "docs" && (
                <DocsScreen
                  documents={documents}
                  systemById={systemById}
                  onEdit={(d) => openEdit("doc", d)}
                  onAdd={() => openAdd("doc")}
                />
              )}
              {tab === "account" && (
                <AccountScreen
                  profile={profile}
                  onEdit={() => openEdit("profile", null)}
                  onManagePlan={openPlan}
                  onSignOut={signOut}
                />
              )}
            </>
          )}
        </AnimatedScreen>
      </div>

      <TabBar
        active={tab}
        onChange={(t) => {
          goToTab(t);
          setSelectedSystem(null);
          setFormItem(null);
        }}
      />
    </div>
  );
}
